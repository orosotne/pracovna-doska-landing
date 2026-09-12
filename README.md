# pracovna-doska-landing

Lead-gen landing page for **Orostone** — sinterovaný kameň pracovné dosky.
Live: <https://pracovnadoska.orostone.sk>

## Stack
- Static HTML/CSS/JS (no framework), deployed on **Vercel**.
- One serverless function: [`api/lead.mjs`](api/lead.mjs).

## Lead flow
Multi-step quiz → `POST /api/lead` (same-origin proxy) → **Make** webhook → CRM + confirmation e-mails.
The Make webhook URL is never exposed to the browser; it lives in an env var and is only reachable
through the proxy (which tags every forwarded payload with a shared `proxy_token`).

## Bot protection (`api/lead.mjs`)
Server-side protection includes a 32 KiB body limit, a strict field allowlist with per-field limits,
honeypot, timing floor (≥3 s), JS marker, mandatory Cloudflare **Turnstile** siteverify, content
validation and a best-effort in-process rate limit (8 requests per 10 minutes per client). A missing
token, Turnstile outage, or endpoint misconfiguration returns a visible non-2xx response and is never
forwarded as a successful lead.

The in-process limiter covers repeated requests that reach one warm Vercel function instance. It is
not a global/distributed limit; configure a Vercel/edge WAF rate-limit for `/api/lead` as the primary
abuse-control layer.

An optional Make health check is explicitly authenticated: send `{"test_ping":true}` with the
server-only `X-Lead-Test-Token` header. Empty contact fields are no longer treated as test pings.

## Environment variables (Vercel → Settings → Environment Variables, Production)
| Name | Required | Purpose |
|------|----------|---------|
| `MAKE_WEBHOOK_URL` | yes | Real Make hook URL (kept server-side) |
| `PROXY_TOKEN` | yes | Shared secret; Make drops any payload without it |
| `TURNSTILE_SECRET` | yes | Cloudflare Turnstile secret; every real lead is verified server-side |
| `LEAD_TEST_TOKEN` | no | Secret header value for the explicit Make health check; never put it in browser code |

The Turnstile **site key** is public and lives in `index.html`.

## Deploy
Auto-deploys on push to `main` (Vercel ↔ GitHub). Manual: `vercel deploy --prod`.
