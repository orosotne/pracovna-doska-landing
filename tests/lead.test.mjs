import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.MAKE_WEBHOOK_URL = 'https://make.test/hook';
process.env.PROXY_TOKEN = 'server-proxy-token';
process.env.TURNSTILE_SECRET = 'turnstile-secret';
process.env.LEAD_TEST_TOKEN = 'health-check-secret';
process.env.CAPI_ACCESS_TOKEN = '';

const { default: handler } = await import('../api/lead.mjs');
const originalFetch = globalThis.fetch;
let fetchImpl = async () => { throw new Error('unexpected fetch'); };
globalThis.fetch = (...args) => fetchImpl(...args);
after(() => { globalThis.fetch = originalFetch; });

function req(body, { ip = '203.0.113.10', headers = {}, method = 'POST' } = {}) {
  return {
    method,
    body,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'Orostone endpoint test',
      'x-vercel-forwarded-for': ip,
      ...headers,
    },
  };
}

function res() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = String(value); },
    end(body) { this.body = String(body || ''); },
  };
}

async function invoke(body, options, selectedHandler = handler) {
  const response = res();
  await selectedHandler(req(body, options), response);
  response.json = JSON.parse(response.body);
  return response;
}

function validLead(overrides = {}) {
  return {
    aplikacia: 'Kuchynská pracovná doska, Kuchynský ostrovček',
    aplikacia_poznamka: '',
    dekor: 'Roman Travertine — Teplý travertín',
    termin: 'O 1–3 mesiace',
    name: 'Jana Nováková',
    email: 'JANA@EXAMPLE.COM',
    phone: '0917 123 456',
    consent_ads: 'true',
    jazyk: 'SK',
    event_id: 'lead-1788770000000-abc123def',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    fbclid: '',
    fbc: '',
    fbp: '',
    landing_url: 'https://oro-klient.orostone.sk/?utm_source=google',
    referrer: 'https://www.google.com/',
    user_agent: 'Mozilla/5.0',
    website: '',
    form_render_ts: 1788770000000,
    form_elapsed_ms: 5000,
    js_ok: 1,
    'cf-turnstile-response': 'valid-turnstile-token',
    ...overrides,
  };
}

function turnstileOk() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      hostname: 'oro-klient.orostone.sk',
      action: 'lp2_lead',
    }),
  };
}

function makeOk(status = 200) {
  return { ok: status >= 200 && status < 300, status };
}

test('valid lead is normalized and forwarded through the strict allowlist', async () => {
  const calls = [];
  fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return String(url).includes('siteverify') ? turnstileOk() : makeOk();
  };

  const response = await invoke(validLead({
    proxy_token: 'attacker-value',
    bot_suspect: 'attacker-value',
    unexpected_nested_data: { role: 'admin' },
  }), { ip: '203.0.113.11' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json, { ok: true });
  assert.equal(calls.length, 2);
  const forwarded = JSON.parse(calls[1].options.body);
  assert.equal(forwarded.email, 'jana@example.com');
  assert.equal(forwarded.proxy_token, 'server-proxy-token');
  assert.equal(forwarded.consent_ads, 'true');
  assert.equal('bot_suspect' in forwarded, false);
  assert.equal('unexpected_nested_data' in forwarded, false);
  assert.equal('cf-turnstile-response' in forwarded, false);
  assert.equal('form_elapsed_ms' in forwarded, false);
});

// CRM posiela Mete QualifiedLead a IP návštevníka pozná len z tohto payloadu
// (Make ju mapuje do /api/ingest-lead ako client_ip). Bez nej mala IP len 9 % eventov.
test('forwards the server-observed visitor IP, never a client-supplied one', async () => {
  const calls = [];
  fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return String(url).includes('siteverify') ? turnstileOk() : makeOk();
  };

  const response = await invoke(validLead({ client_ip: '198.51.100.7' }), { ip: '203.0.113.22' });

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 2);
  const forwarded = JSON.parse(calls[1].options.body);
  assert.equal(forwarded.client_ip, '203.0.113.22');
});

test('missing Turnstile token returns a visible non-2xx and never forwards', async () => {
  let calls = 0;
  fetchImpl = async () => { calls += 1; return makeOk(); };
  const lead = validLead();
  delete lead['cf-turnstile-response'];

  const response = await invoke(lead, { ip: '203.0.113.12' });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json, { ok: false, error: 'verification-required' });
  assert.equal(calls, 0);
});

test('Turnstile outage returns 503 and never forwards', async () => {
  let calls = 0;
  fetchImpl = async (url) => {
    calls += 1;
    if (String(url).includes('siteverify')) throw new Error('simulated outage');
    return makeOk();
  };

  const response = await invoke(validLead(), { ip: '203.0.113.13' });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json, { ok: false, error: 'verification-unavailable' });
  assert.equal(calls, 1);
});

test('invalid Turnstile hostname returns 403 and never forwards', async () => {
  let calls = 0;
  fetchImpl = async () => {
    calls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, hostname: 'evil.example', action: 'lp2_lead' }),
    };
  };

  const response = await invoke(validLead(), { ip: '203.0.113.14' });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.json, { ok: false, error: 'verification-failed' });
  assert.equal(calls, 1);
});

test('missing required lead fields are never forwarded', async () => {
  let makeCalls = 0;
  fetchImpl = async (url) => {
    if (String(url).includes('siteverify')) return turnstileOk();
    makeCalls += 1;
    return makeOk();
  };

  const response = await invoke(validLead({ name: '' }), { ip: '203.0.113.15' });

  assert.equal(response.statusCode, 200); // intentionally flat bot/drop response
  assert.equal(makeCalls, 0);
});

test('body larger than 32 KiB is rejected before any external request', async () => {
  let calls = 0;
  fetchImpl = async () => { calls += 1; return makeOk(); };

  const response = await invoke({ padding: 'x'.repeat(33 * 1024) }, { ip: '203.0.113.16' });

  assert.equal(response.statusCode, 413);
  assert.deepEqual(response.json, { ok: false, error: 'body-too-large' });
  assert.equal(calls, 0);
});

test('health ping requires the dedicated header secret and forwards no caller fields', async () => {
  const calls = [];
  fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return makeOk();
  };

  const denied = await invoke(
    { test_ping: true, email: 'should-not-forward@example.com' },
    { ip: '203.0.113.17' },
  );
  assert.equal(denied.statusCode, 200);
  assert.equal(calls.length, 0);

  const accepted = await invoke(
    { test_ping: true, email: 'should-not-forward@example.com' },
    {
      ip: '203.0.113.18',
      headers: { 'x-lead-test-token': 'health-check-secret' },
    },
  );
  assert.equal(accepted.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    test_ping: true,
    email: '',
    phone: '',
    proxy_token: 'server-proxy-token',
  });
});

test('best-effort limiter caps one warm-instance client at eight requests per window', async () => {
  let makeCalls = 0;
  fetchImpl = async () => { makeCalls += 1; return makeOk(); };
  const options = {
    ip: '203.0.113.19',
    headers: { 'x-lead-test-token': 'health-check-secret' },
  };

  let response;
  for (let i = 0; i < 9; i++) response = await invoke({ test_ping: true }, options);

  assert.equal(makeCalls, 8);
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers['retry-after'], '600');
});

test('missing TURNSTILE_SECRET is a visible server error for real leads', async () => {
  const previous = process.env.TURNSTILE_SECRET;
  delete process.env.TURNSTILE_SECRET;
  const { default: unconfiguredHandler } = await import(`../api/lead.mjs?no-turnstile=${Date.now()}`);
  process.env.TURNSTILE_SECRET = previous;
  let calls = 0;
  fetchImpl = async () => { calls += 1; return makeOk(); };

  const response = await invoke(validLead(), { ip: '203.0.113.20' }, unconfiguredHandler);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json, { ok: false, error: 'verification-not-configured' });
  assert.equal(calls, 0);
});

test('Make is retried once and exhausted failures never log the PII payload', async () => {
  let makeCalls = 0;
  fetchImpl = async (url) => {
    if (String(url).includes('siteverify')) return turnstileOk();
    makeCalls += 1;
    return makeOk(502);
  };
  const originalError = console.error;
  const logs = [];
  console.error = (...parts) => { logs.push(parts.join(' ')); };
  let response;
  try {
    response = await invoke(validLead(), { ip: '203.0.113.21' });
  } finally {
    console.error = originalError;
  }

  assert.equal(makeCalls, 2);
  assert.equal(response.statusCode, 502);
  assert.equal(logs.some((line) => line.includes('Jana Nováková')), false);
  assert.equal(logs.some((line) => line.includes('JANA@EXAMPLE.COM')), false);
  assert.equal(logs.some((line) => line.includes('0917 123 456')), false);
  assert.equal(logs.some((line) => line.includes('FORWARD-FAILED ref=')), true);
});

// 27. 9. 2026 prešiel formulárom „…@gmail..com“; Make naň nevie poslať potvrdenie
// a celý scenár LP2 → CRM sa zastavil. Preklep musí zachytiť formulár, kým to
// zákazník ešte vidí.
test('form e-mail check rejects empty address labels like gmail..com', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const literal = html.match(/var emailRe=\/(.+)\/([a-z]*);/);
  assert.ok(literal, 'index.html must define emailRe as a regex literal');
  const emailRe = new RegExp(literal[1], literal[2]);

  for (const typo of ['silvuska.b@gmail..com', 'jana..novak@email.sk', '.jana@email.sk',
    'jana.@email.sk', 'jana@.email.sk', 'jana@email.sk.']) {
    assert.equal(emailRe.test(typo), false, typo);
  }
  for (const valid of ['jana@email.sk', 'jana.novakova@gmail.com', 'j.n+lp2@firma.co.uk',
    'jana@moja-firma.sk', 'JANA@EXAMPLE.COM']) {
    assert.equal(emailRe.test(valid), true, valid);
  }
});
