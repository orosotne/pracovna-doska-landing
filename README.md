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
Server-side, in cost order: honeypot → timing floor (≥3 s) → JS marker → Cloudflare **Turnstile**
siteverify → light content validation → forward to Make. Turnstile **fails open**: a missing or
unverifiable token is forwarded tagged `bot_suspect` rather than dropped, so a real lead is never
silently lost. Hard drops are limited to signals a real buyer cannot trigger.

## Environment variables (Vercel → Settings → Environment Variables, Production)
| Name | Required | Purpose |
|------|----------|---------|
| `MAKE_WEBHOOK_URL` | yes | Real Make hook URL (kept server-side) |
| `PROXY_TOKEN` | yes | Shared secret; Make drops any payload without it |
| `TURNSTILE_SECRET` | no | Cloudflare Turnstile secret; enables Turnstile when set |

The Turnstile **site key** is public and lives in `index.html`.

## Deploy
Auto-deploys on push to `main` (Vercel ↔ GitHub). Manual: `vercel deploy --prod`.
