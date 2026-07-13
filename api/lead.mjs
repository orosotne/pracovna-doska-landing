// /api/lead — server-side bot-screening proxy for the LP2 lead form.
//
// The browser POSTs the quiz answers here (same origin) instead of straight to the
// public Make webhook. This function screens the submission and only forwards clean
// leads to Make. The Make webhook URL + a shared proxy token live in Vercel env vars,
// so they never reach the browser and a bot can't discover/hit the webhook directly.
//
// Design rule (business): losing a REAL lead is worse than letting an occasional bot
// through — human triage catches bots. So the hard drops are limited to signals a real
// buyer essentially cannot trigger (honeypot, <3s timing, no-JS, a PRESENT-but-invalid
// Turnstile token). Ambiguous/infra signals (missing or unverifiable Turnstile token)
// FAIL OPEN: the lead is forwarded to Make tagged `bot_suspect` so it is never lost.
//
// Env vars (Vercel → Project → Settings → Environment Variables, Production):
//   MAKE_WEBHOOK_URL   (required)  the real Make hook URL, e.g. https://hook.eu2.make.com/xxxx
//   PROXY_TOKEN        (required)  random shared secret; Make drops any payload without it
//   TURNSTILE_SECRET   (optional)  Cloudflare Turnstile secret key; enables Turnstile when set
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

import { createHash } from 'node:crypto';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const PROXY_TOKEN = process.env.PROXY_TOKEN || '';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '';
const CAPI_ACCESS_TOKEN = process.env.CAPI_ACCESS_TOKEN || '';
const CAPI_PIXEL_IDS = (process.env.CAPI_PIXEL_IDS || '712209907542673')
  .split(',').map((s) => s.trim()).filter(Boolean);
const EXPECTED_HOSTNAME = 'pracovnadoska.orostone.sk';
const EXPECTED_ACTION = 'lp2_lead';
const FETCH_TIMEOUT_MS = 6000;

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'nada.email',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'throwawaymail.com', 'mohmal.com',
  'emailondeck.com', 'moakt.com', 'tempr.email', 'mailnesia.com', 'spam4.me', 'grr.la',
]);

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
// Hard drop: not forwarded. Flat {ok:true} so a bot can't tell WHICH layer caught it;
// the reason is logged server-side (Vercel logs) so we can still see mass false-drops.
function drop(res, reason) {
  try { console.warn('[lead] drop:', reason); } catch {}
  return send(res, 200, { ok: true });
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
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (ip) u.client_ip_address = ip;
  return u;
}
async function sendCapiLead(lead, req) {
  if (!CAPI_ACCESS_TOKEN || !lead.event_id || !lead.email) return; // test-pingy a neúplné payloady preskoč
  const event = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(lead.event_id),
    event_source_url: String(lead.landing_url || 'https://pracovnadoska.orostone.sk/'),
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

function readBody(req) {
  // Prefer the parsed body if the launcher provided one; otherwise read the raw stream.
  if (req.body !== undefined) {
    if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch { return Promise.resolve(null); } }
    return Promise.resolve(null); // primitive (number/bool/null) — treat as no usable body
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e6) { resolve(null); try { req.destroy(); } catch {} } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : null); } catch { resolve(null); } });
    req.on('error', () => resolve(null));
    req.on('close', () => resolve(null)); // guarantees the promise settles even if the stream aborts
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });

  // Fail LOUD on server misconfig — this is an ops error, not a bot; surface it (500)
  // instead of silently dropping every real lead.
  if (!MAKE_WEBHOOK_URL || !PROXY_TOKEN) {
    console.error('[lead] misconfig: MAKE_WEBHOOK_URL or PROXY_TOKEN not set');
    return send(res, 500, { ok: false, error: 'not-configured' });
  }

  const data = await readBody(req);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return drop(res, 'bad-body');

  // ── Layer 1: hard gates — a real buyer essentially cannot trigger these ──
  if (typeof data.website === 'string' && data.website.trim() !== '') return drop(res, 'honeypot');
  const elapsed = Number(data.form_elapsed_ms);
  // Only a lower bound (<3 s = bot). No upper bound: a mobile visitor commonly returns
  // to an open tab after hours — still a legitimate lead.
  if (!Number.isFinite(elapsed) || elapsed < 3000) return drop(res, 'timing');
  if (data.js_ok !== 1 && data.js_ok !== '1') return drop(res, 'no-js');

  // ── Layer 2: Cloudflare Turnstile — enforced only when the secret is configured ──
  // FAIL OPEN: a missing token (privacy blocker / slow script) or an unreachable
  // siteverify (Cloudflare outage) must NOT lose the lead — forward tagged instead.
  // Hard-drop ONLY a token that is present and verifiably invalid.
  let botSuspect = '';
  if (TURNSTILE_SECRET) {
    const token = data['cf-turnstile-response'] || data.turnstile_token || '';
    if (!token || typeof token !== 'string' || token.length > 2048) {
      botSuspect = 'turnstile-missing';
    } else {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      let verify = null;
      try {
        const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
        if (ip) body.set('remoteip', ip);
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        verify = await r.json();
      } catch { botSuspect = 'turnstile-error'; } // outage/timeout → fail open
      if (verify) {
        const okHost = !verify.hostname || verify.hostname === EXPECTED_HOSTNAME;
        const okAction = !verify.action || verify.action === EXPECTED_ACTION;
        if (!verify.success || !okHost || !okAction) return drop(res, 'turnstile-fail');
      }
    }
  }

  // ── Layer 3: light content validation (only when an email is present) ──
  // An empty email+phone is Make's intentional "test-ping" and must pass through untouched.
  const email = String(data.email || '').trim().toLowerCase();
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return drop(res, 'email-syntax');
    const domain = email.split('@')[1];
    if (DISPOSABLE.has(domain)) return drop(res, 'disposable-email');
    const name = String(data.name || '').trim();
    if (name && !/\p{L}{2,}/u.test(name)) return drop(res, 'name-gibberish'); // \p{L} = any-script letters
  }

  // Telefón (nepovinný): ak je vyplnený a je zjavný junk (zlý počet číslic alebo samé rovnaké
  // číslice), lead NEZAHODÍME — len telefón vyprázdnime, nech obchod nevolá fake číslo.
  // Fail-open: reálny lead s platným e-mailom nesmie spadnúť kvôli preklepu v telefóne.
  // (Klient tú istú kontrolu robí pred odoslaním; toto je poistka proti priamemu POSTu.)
  if (data.phone) {
    const pd = String(data.phone).replace(/\D/g, '');
    if (pd.length < 9 || pd.length > 14 || /^(\d)\1+$/.test(pd)) data.phone = '';
  }

  // Strip control-only + client-forgeable fields, tag, forward to Make.
  const {
    website, form_render_ts, form_elapsed_ms, js_ok,
    'cf-turnstile-response': _t1, turnstile_token: _t2,
    proxy_token: _pt, bot_suspect: _bs,
    ...clean
  } = data;
  clean.proxy_token = PROXY_TOKEN;
  if (botSuspect) { clean.bot_suspect = botSuspect; console.warn('[lead] softpass:', botSuspect); }

  // Forward to Make with one retry. A failed forward must NOT pretend success:
  // the client (index.html submit handler) shows an error + phone number on non-2xx,
  // so the visitor knows to retry/call instead of walking away from a lost lead.
  // (Bot drops above still return flat 200 — only infra failures surface as 502.)
  const FORWARD_TIMEOUTS = [FETCH_TIMEOUT_MS, 4000];
  let delivered = false;
  for (let i = 0; i < FORWARD_TIMEOUTS.length && !delivered; i++) {
    try {
      const r = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
        signal: AbortSignal.timeout(FORWARD_TIMEOUTS[i]),
      });
      if (r.ok) delivered = true;
      else console.error('[lead] Make forward returned', r.status, 'attempt', i + 1);
    } catch (e) {
      console.error('[lead] Make forward failed:', (e && e.message) || e, 'attempt', i + 1);
    }
  }
  if (!delivered) {
    // Dead-letter into runtime logs (short retention on Hobby, but better than nothing) —
    // the real safety net is the 502: the visitor is told the submit did not go through.
    try { console.error('[lead] FORWARD-FAILED payload:', JSON.stringify(clean)); } catch {}
    return send(res, 502, { ok: false, error: 'forward-failed' });
  }
  // Meranie až PO doručení leadu; musí dobehnúť pred res.end (serverless nepokračuje po odpovedi)
  try { await sendCapiLead(clean, req); } catch {}
  return send(res, 200, { ok: true });
}
