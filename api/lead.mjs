// /api/lead — server-side bot-screening proxy for the LP2 lead form.
//
// The browser POSTs the quiz answers here (same origin) instead of straight to the
// public Make webhook. This function screens the submission and only forwards clean
// leads to Make. The Make webhook URL + a shared proxy token live in Vercel env vars,
// so they never reach the browser and a bot can't discover/hit the webhook directly.
//
// Suspicious submissions are never forwarded. Infrastructure failures (for example a
// Turnstile outage) return a non-2xx response so the browser can ask the visitor to retry;
// they must not be presented as a successfully delivered lead.
//
// Env vars (Vercel → Project → Settings → Environment Variables, Production):
//   MAKE_WEBHOOK_URL   (required)  the real Make hook URL, e.g. https://hook.eu2.make.com/xxxx
//   PROXY_TOKEN        (required)  random shared secret; Make drops any payload without it
//   TURNSTILE_SECRET   (required)  Cloudflare Turnstile secret key; every real lead must carry
//                                  a valid, server-verified token
//   LEAD_TEST_TOKEN    (optional)  secret accepted only in X-Lead-Test-Token for an explicit
//                                  {"test_ping":true} Make health check (never expose in browser)
//   CAPI_ACCESS_TOKEN  (optional)  Meta Conversions API token (Events Manager → dataset →
//                                  Settings → Conversions API → Generate access token).
//                                  When set, a server-side Lead event is sent to Meta with the
//                                  SAME event_id the browser pixel uses on /dakujeme → Meta
//                                  dedupes the pair; ad-blocked/iOS browsers still count.
//   CAPI_PIXEL_IDS     (optional)  comma-separated pixel/dataset ids; default = primárny pixel
//                                  (druhý LP pixel 614488614598498 nie je v BM „Orostone",
//                                  token z datasetu Orostone webstranka by preň nemal práva)
//
// Classic Node (req, res) signature with raw res methods so it works regardless of
// whether Vercel's zero-config launcher injects body/response helpers.

import { createHash, timingSafeEqual } from 'node:crypto';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const PROXY_TOKEN = process.env.PROXY_TOKEN || '';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '';
const LEAD_TEST_TOKEN = process.env.LEAD_TEST_TOKEN || '';
const CAPI_ACCESS_TOKEN = process.env.CAPI_ACCESS_TOKEN || '';
const CAPI_PIXEL_IDS = (process.env.CAPI_PIXEL_IDS || '712209907542673')
  .split(',').map((s) => s.trim()).filter(Boolean);
// Nová doména + stará (308-uje na novú); počas prechodu musí Turnstile prijať obe,
// inak by sa reálne leady zahadzovali ako 'turnstile-fail'.
const ALLOWED_HOSTNAMES = ['oro-klient.orostone.sk', 'pracovnadoska.orostone.sk'];
const EXPECTED_ACTION = 'lp2_lead';
const FETCH_TIMEOUT_MS = 6000;
const MAX_BODY_BYTES = 32 * 1024;

// Best-effort protection for repeated requests that land on the same warm function
// instance. Vercel can run several instances/regions, so this is deliberately only a
// second line of defence: configure a project/edge WAF rate-limit for /api/lead too.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 8;
const RATE_BUCKET_CAP = 5000;
const rateBuckets = new Map();

const LEAD_TEXT_FIELDS = Object.freeze({
  aplikacia:            { required: true, min: 2, max: 300 },
  aplikacia_poznamka:   { max: 500 },
  dekor:                { required: true, min: 2, max: 160 },
  termin:               { required: true, min: 2, max: 100 },
  name:                 { required: true, min: 2, max: 100 },
  email:                { required: true, min: 5, max: 254 },
  phone:                { max: 40 },
  jazyk:                { required: true, min: 2, max: 2 },
  event_id:             { required: true, min: 8, max: 100 },
  utm_source:           { max: 200 },
  utm_medium:           { max: 200 },
  utm_campaign:         { max: 300 },
  utm_term:             { max: 300 },
  utm_content:          { max: 300 },
  fbclid:               { max: 512 },
  fbc:                  { max: 255 },
  fbp:                  { max: 255 },
  landing_url:          { max: 2048 },
  referrer:             { max: 2048 },
  user_agent:           { max: 512 },
});

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'nada.email',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'throwawaymail.com', 'mohmal.com',
  'emailondeck.com', 'moakt.com', 'tempr.email', 'mailnesia.com', 'spam4.me', 'grr.la',
]);

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
// Hard drop: not forwarded. Flat {ok:true} so a bot can't tell WHICH layer caught it;
// the reason is logged server-side (Vercel logs) so we can still see mass false-drops.
function drop(res, reason) {
  try { console.warn('[lead] drop:', reason); } catch {}
  return send(res, 200, { ok: true });
}

function header(req, name) {
  const value = req && req.headers ? req.headers[name.toLowerCase()] : '';
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function clientIp(req) {
  // x-vercel-forwarded-for is generated by Vercel. The ordinary header and socket
  // address keep local/non-Vercel execution usable without trusting an unbounded value.
  const raw = header(req, 'x-vercel-forwarded-for')
    || header(req, 'x-forwarded-for')
    || String((req && req.socket && req.socket.remoteAddress) || '');
  return raw.split(',')[0].trim().slice(0, 64);
}

function pruneRateBuckets(now) {
  if (rateBuckets.size < RATE_BUCKET_CAP) return;
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  // Bound memory even during a high-cardinality IP attack. Map iteration is oldest-first.
  while (rateBuckets.size >= Math.floor(RATE_BUCKET_CAP * 0.9)) {
    const oldest = rateBuckets.keys().next().value;
    if (oldest === undefined) break;
    rateBuckets.delete(oldest);
  }
}

function rateLimited(req) {
  const now = Date.now();
  pruneRateBuckets(now);
  const ip = clientIp(req);
  const fallback = header(req, 'user-agent').slice(0, 200) || 'unknown-client';
  // Do not retain raw IP addresses/user agents in process memory.
  const key = sha256(ip || fallback).slice(0, 32);
  const previous = rateBuckets.get(key);
  const bucket = !previous || now - previous.startedAt >= RATE_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : previous;
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count > RATE_MAX_REQUESTS;
}

function safeSecretEqual(received, expected) {
  if (!received || !expected) return false;
  const a = Buffer.from(String(received));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorizedTestPing(req, data) {
  if (!data || data.test_ping !== true || !LEAD_TEST_TOKEN) return false;
  return safeSecretEqual(header(req, 'x-lead-test-token'), LEAD_TEST_TOKEN);
}

// ── Meta Conversions API: server-side Lead event, deduped with the browser pixel ──
// The browser fires fbq('track','Lead',{...},{eventID}) on /dakujeme with the same
// event_id that travels in the lead payload — Meta collapses the pair, so leads from
// ad-blocked/ITP browsers are still measured. Failures only log; a lead is NEVER
// failed because of measurement.
function sha256(v) { return createHash('sha256').update(v).digest('hex'); }
function capiUserData(lead, req) {
  const u = {};
  const email = String(lead.email || '').trim().toLowerCase();
  if (email) u.em = [sha256(email)];
  let ph = String(lead.phone || '').replace(/\D/g, '');
  if (ph.startsWith('00')) ph = ph.slice(2);
  else if (ph.startsWith('0')) ph = '421' + ph.slice(1); // SK national → E.164 digits
  if (ph) u.ph = [sha256(ph)];
  const name = String(lead.name || '').trim().toLowerCase().split(/\s+/);
  if (name[0]) u.fn = [sha256(name[0])];
  if (name.length > 1) u.ln = [sha256(name[name.length - 1])];
  if (lead.fbc) u.fbc = String(lead.fbc);
  if (lead.fbp) u.fbp = String(lead.fbp);
  if (lead.user_agent) u.client_user_agent = String(lead.user_agent);
  const ip = clientIp(req);
  if (ip) u.client_ip_address = ip;
  return u;
}
async function sendCapiLead(lead, req) {
  if (!CAPI_ACCESS_TOKEN || !lead.event_id || !lead.email) return; // test-pingy a neúplné payloady preskoč
  const event = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(lead.event_id),
    event_source_url: String(lead.landing_url || 'https://oro-klient.orostone.sk/'),
    action_source: 'website',
    user_data: capiUserData(lead, req),
    custom_data: { content_name: 'pracovna-doska', currency: 'EUR', value: 0 },
  };
  for (const pixelId of CAPI_PIXEL_IDS) {
    try {
      const r = await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event], access_token: CAPI_ACCESS_TOKEN }),
        signal: AbortSignal.timeout(4000),
      });
      if (!r.ok) {
        let detail = '';
        try { detail = JSON.stringify((await r.json()).error || {}).slice(0, 300); } catch {}
        console.error('[lead] CAPI', pixelId, 'returned', r.status, detail);
      }
    } catch (e) {
      console.error('[lead] CAPI', pixelId, 'failed:', (e && e.message) || e);
    }
  }
}

function parsedBody(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'bad-body' };
    // The launcher may have parsed the request before this function sees it, so enforce
    // the byte limit on its serialized representation too.
    if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_BODY_BYTES) {
      return { error: 'body-too-large' };
    }
    return { value };
  } catch {
    return { error: 'bad-body' };
  }
}

function readBody(req) {
  // Prefer the parsed body if the launcher provided one; otherwise read the raw stream.
  if (req.body !== undefined) return Promise.resolve(parsedBody(req.body));
  return new Promise((resolve) => {
    let raw = '';
    let bytes = 0;
    let tooLarge = false;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    req.on('data', (chunk) => {
      if (tooLarge) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        raw = '';
        return;
      }
      raw += chunk;
    });
    req.on('end', () => finish(tooLarge ? { error: 'body-too-large' } : parsedBody(raw)));
    req.on('error', () => finish({ error: 'bad-body' }));
    req.on('close', () => finish({ error: 'bad-body' }));
  });
}

function cleanTextField(data, key, spec) {
  const raw = data[key];
  if (raw === undefined || raw === null) {
    return spec.required ? { error: `missing-${key}` } : { present: false };
  }
  if (typeof raw !== 'string') return { error: `type-${key}` };
  let value;
  try { value = raw.trim().normalize('NFC'); } catch { return { error: `encoding-${key}` }; }
  if (/\p{Cc}/u.test(value)) return { error: `control-${key}` };
  if ((spec.required && value.length < (spec.min || 1)) || value.length > spec.max) {
    return { error: `length-${key}` };
  }
  return { present: true, value };
}

function validHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
}

function prepareLead(data) {
  const clean = {};
  for (const [key, spec] of Object.entries(LEAD_TEXT_FIELDS)) {
    const field = cleanTextField(data, key, spec);
    if (field.error) return { error: field.error };
    if (field.present) clean[key] = field.value;
  }

  if (clean.jazyk !== 'SK' && clean.jazyk !== 'EN') return { error: 'language' };
  if (!/^[A-Za-z0-9._:-]+$/.test(clean.event_id)) return { error: 'event-id' };
  if (!/\p{L}{2,}/u.test(clean.name)) return { error: 'name-gibberish' };

  clean.email = clean.email.toLowerCase();
  // Deliberately looser than the form's emailRe (index.html): drop() answers {ok:true},
  // so a stricter check here would silently discard a real lead sent from a page opened
  // before a deploy. Typos like "gmail..com" are caught by the form, where the visitor sees them.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) return { error: 'email-syntax' };
  const domain = clean.email.split('@')[1];
  if (DISPOSABLE.has(domain)) return { error: 'disposable-email' };

  // A project enquiry is valid only with the explicit contact consent sent by the form.
  if (data.consent_ads !== true && data.consent_ads !== 'true') return { error: 'contact-consent' };
  clean.consent_ads = 'true';

  if (!validHttpUrl(clean.landing_url)) return { error: 'landing-url' };
  if (!validHttpUrl(clean.referrer)) return { error: 'referrer-url' };

  // Phone stays optional. Preserve the previous fail-open behaviour for a typo: retain
  // the valid email lead but clear a visibly unusable number before it reaches sales.
  if (clean.phone) {
    const digits = clean.phone.replace(/\D/g, '');
    if (!/^[+()0-9\s-]+$/.test(clean.phone)
        || digits.length < 9 || digits.length > 14 || /^(\d)\1+$/.test(digits)) {
      clean.phone = '';
    }
  }

  // `clean` is constructed from a fixed schema. Unknown/client-controlled internal
  // fields (including proxy_token and bot_suspect) can never reach Make.
  return { value: clean };
}

async function verifyTurnstile(token, req) {
  const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
  const ip = clientIp(req);
  if (ip) body.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return { error: 'unavailable' };
    const result = await response.json();
    if (result.success !== true) return { error: 'invalid' };
    if (!ALLOWED_HOSTNAMES.includes(result.hostname)) return { error: 'hostname' };
    if (result.action !== EXPECTED_ACTION) return { error: 'action' };
    return { ok: true };
  } catch {
    return { error: 'unavailable' };
  }
}

async function forwardToMake(clean) {
  const timeouts = [FETCH_TIMEOUT_MS, 4000];
  for (let i = 0; i < timeouts.length; i++) {
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
        signal: AbortSignal.timeout(timeouts[i]),
      });
      if (response.ok) return true;
      console.error('[lead] Make forward returned', response.status, 'attempt', i + 1);
    } catch (error) {
      console.error('[lead] Make forward failed:', (error && error.message) || error, 'attempt', i + 1);
    }
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });

  // Fail LOUD on server misconfig — this is an ops error, not a bot.
  if (!MAKE_WEBHOOK_URL || !PROXY_TOKEN) {
    console.error('[lead] misconfig: MAKE_WEBHOOK_URL or PROXY_TOKEN not set');
    return send(res, 500, { ok: false, error: 'not-configured' });
  }

  if (rateLimited(req)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)));
    return send(res, 429, { ok: false, error: 'rate-limited' });
  }

  const contentType = header(req, 'content-type').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return send(res, 415, { ok: false, error: 'json-required' });
  }
  const declaredLength = Number(header(req, 'content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return send(res, 413, { ok: false, error: 'body-too-large' });
  }

  const parsed = await readBody(req);
  if (parsed.error === 'body-too-large') return send(res, 413, { ok: false, error: parsed.error });
  if (parsed.error) return send(res, 400, { ok: false, error: 'bad-body' });
  const data = parsed.value;

  // The old empty-email "test ping" looked identical to a forged lead. A health check
  // now has an explicit marker plus a server-only header secret and forwards no PII.
  if (data.test_ping === true) {
    if (!isAuthorizedTestPing(req, data)) return drop(res, 'unauthorized-test-ping');
    const testPayload = { test_ping: true, email: '', phone: '', proxy_token: PROXY_TOKEN };
    if (!await forwardToMake(testPayload)) {
      console.error('[lead] FORWARD-FAILED ref=test-ping');
      return send(res, 502, { ok: false, error: 'forward-failed' });
    }
    return send(res, 200, { ok: true });
  }

  // A valid Turnstile token is mandatory for every real lead. A missing production
  // secret is a deployment error; never silently run the public endpoint unprotected.
  if (!TURNSTILE_SECRET) {
    console.error('[lead] misconfig: TURNSTILE_SECRET not set');
    return send(res, 500, { ok: false, error: 'verification-not-configured' });
  }

  // Check presence before the silent bot gates below. A browser where the widget was
  // blocked/expired must see a real non-2xx error, never a false-success thank-you page.
  const token = data['cf-turnstile-response'] || data.turnstile_token || '';
  if (!token || typeof token !== 'string' || token.length > 2048) {
    return send(res, 400, { ok: false, error: 'verification-required' });
  }

  // ── Layer 1: hard gates — a real buyer essentially cannot trigger these ──
  if (data.website !== undefined && typeof data.website !== 'string') return drop(res, 'honeypot-type');
  if (typeof data.website === 'string' && data.website.trim() !== '') return drop(res, 'honeypot');
  const elapsed = Number(data.form_elapsed_ms);
  // Only a lower bound (<3 s = bot). No upper bound: a mobile visitor commonly returns
  // to an open tab after hours — still a legitimate lead.
  if (!Number.isFinite(elapsed) || elapsed < 3000) return drop(res, 'timing');
  if (data.js_ok !== 1 && data.js_ok !== '1') return drop(res, 'no-js');

  // ── Layer 2: mandatory Cloudflare Turnstile server verification ──
  const verification = await verifyTurnstile(token, req);
  if (verification.error === 'unavailable') {
    return send(res, 503, { ok: false, error: 'verification-unavailable' });
  }
  if (!verification.ok) {
    try { console.warn('[lead] Turnstile rejected:', verification.error); } catch {}
    return send(res, 403, { ok: false, error: 'verification-failed' });
  }

  // ── Layer 3: strict schema/content validation ──
  const prepared = prepareLead(data);
  if (prepared.error) return drop(res, prepared.error);
  const clean = prepared.value;
  clean.proxy_token = PROXY_TOKEN;
  // IP pre CRM → Meta QualifiedLead (Make ju mapuje do /api/ingest-lead). Berie sa
  // z hlavičky, ktorú Vercel prepisuje proti spoofingu, nikdy z tela formulára.
  const ip = clientIp(req);
  if (ip) clean.client_ip = ip;

  // Forward to Make with one retry. A failed forward must NOT pretend success:
  // the client shows an error + phone number on non-2xx, so the visitor knows to
  // retry/call instead of walking away from a lost lead.
  if (!await forwardToMake(clean)) {
    // Never put names, e-mails, phone numbers or the payload into runtime logs. A
    // one-way correlation reference is enough to group repeated infrastructure errors.
    const ref = sha256(clean.event_id).slice(0, 12);
    try { console.error('[lead] FORWARD-FAILED ref=' + ref); } catch {}
    return send(res, 502, { ok: false, error: 'forward-failed' });
  }

  // Meranie až PO doručení leadu; musí dobehnúť pred res.end (serverless nepokračuje po odpovedi)
  try { await sendCapiLead(clean, req); } catch {}
  return send(res, 200, { ok: true });
}
