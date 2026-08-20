# 03 — Backend Reference

[← Back to index](README.md)

The backend has **three distinct layers**. Knowing which one you're in matters, because they
run in different places and behave differently.

| Layer | Where it runs | When it's active |
|---|---|---|
| **1. Vercel Functions** (`api/`) | Vercel Edge / Node runtime | Production, and under `vercel dev` |
| **2. Vite dev middleware** (`vite.config.js`) | Your local machine | Local development only (`npm run dev`) |
| **3. n8n workflow** | `n8n-zvxi.srv1837606.hstgr.cloud` | Always — same instance for dev and production |

> ⚠️ **The most important gotcha in this codebase:** plain `vite` does **not** run the
> `api/` directory. Those are Vercel functions. Locally, only the routes reimplemented in
> `vite.config.js` exist. Any `api/` route without a Vite equivalent returns **404 locally**
> — which is exactly how the Supabase Brand-KB migration silently failed and was reverted
> on 2026-08-04. To exercise the real functions locally you must run `vercel dev`.

---

## Layer 1 — Vercel Functions (`api/`)

Seven routes. Six run on the **Edge runtime**; one needs Node.

| File | Runtime | Method | Auth | Purpose |
|---|---|---|---|---|
| `generate.js` | Edge | POST | none | Groq chat-completions proxy |
| `generate-campaign.js` | Edge | POST | none | Full campaign copy package |
| `generate-banner.js` | Edge | POST | none | Image generation (3 providers) |
| `gemini-image.js` | Edge | POST | none | Gemini image generation |
| `eventbrite.js` | Edge | POST | caller-supplied token | Eventbrite API proxy |
| `send-email.js` | Edge | POST | none | Transactional email via Resend |
| `brand-kb.js` | **Node** | GET/POST | **Firebase ID token** | Brand KB read/write via Supabase |

All seven handle `OPTIONS` preflight and set `Access-Control-Allow-Origin: *`.

---

### `api/generate.js` — Groq proxy

```
POST /api/generate
Body: <any Groq chat-completions payload, passed through verbatim>
→ 200 <Groq response, passed through verbatim>
```

Exists purely to keep the Groq API key server-side and avoid browser CORS. Reads
`process.env.VITE_GROQ_API_KEY`; returns 500 if unset.

**This is the endpoint most content-generation pages call.** The caller controls the model
and the prompt — the proxy adds no logic of its own.

---

### `api/generate-campaign.js` — full campaign package

The headless/backend-to-backend entry point. Unlike the browser flow (which fires the n8n
webhook and gets an acknowledgement), this returns the **actual generated copy** in the
response. Built for integrations like the marketplace calling the API directly.

```
POST /api/generate-campaign
Body: {
  campaignType?, name*, description*, goal?, targetAudience?,
  brandName?, date?, time?, location?, eventUrl?, campaignDays?
}
→ 200 { success: true, data: { …15 fields… } }
→ 400 { success: false, error } — name and description are required
→ 502 { success: false, error } — network error / unparseable AI output
```

**Model:** Groq `llama-3.1-8b-instant`, temperature 0.7, max_tokens 3500.

**Output schema** — the prompt demands exactly these 15 fields:

```
campaignName · emailSubject · emailBody · linkedinPost · instagramCaption
facebookPost · whatsappMessage · smsMessage · seoTitle · seoDescription
adHeadline · adBody · tiktokCaption · campaignCalendar · positioningStatement
```

Two behaviours worth preserving:

1. **`extractJson()` — a four-strategy parser.** LLMs wrap JSON unpredictably, so it tries,
   in order: ```` ```json ```` fence → any ``` fence → first `{…}` block → from the first
   `{` to end-of-string with a `}` appended. If all four still fail to `JSON.parse`, it
   escapes raw newlines/tabs *inside string literals* and retries. This matches the
   frontend's parser exactly so behaviour is identical on both paths.

2. **Groq 401 is remapped to 500.** A bad server-side API key must never surface to the
   client as "unauthorized" — that would read as a *user* auth problem.
   ```js
   const status = groqRes.status === 401 ? 500 : groqRes.status
   ```

**Event campaigns get special handling:** when `campaignType` is `event`/`event_full` and an
`eventUrl` is present, the prompt instructs the model to embed the registration URL in every
social post, the email body and the WhatsApp message.

---

### `api/generate-banner.js` — image generation, three providers

```
POST /api/generate-banner
Body: { prompt*, provider?: 'gemini'|'dalle'|'pollinations', width?, height? }
→ 200 { base64Image, mimeType, provider, revised_prompt? }
```

| `provider` | Model | Key required | Notes |
|---|---|---|---|
| `gemini` (**default**) | `gemini-2.0-flash-exp` | `GEMINI_API_KEY` | `responseModalities: ['IMAGE','TEXT']`; image comes back in `inlineData` |
| `dalle` | `gpt-image-1` at 1536×1024, quality `high` | `OPENAI_API_KEY` | Returns base64 directly via `b64_json` |
| `pollinations` | `flux` | **none** | Free fallback |

Always returns **base64**, never a URL — so the caller never has to deal with a
short-lived provider CDN link.

> **Naming caveat:** the function is called `generateWithDalle` and the provider string is
> `dalle`, but the model actually requested is `gpt-image-1`. The dev-mode equivalent in
> `vite.config.js` still requests `dall-e-3` at 1024×1024 and then *fetches the returned URL*
> to convert it to base64. **The two paths differ.** See
> [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

**One fixed bug worth not re-introducing:** the seed is
`Math.floor(Math.random() * 2147483647)`. It used to be `Date.now()`, which overflows a
32-bit int and Pollinations rejects.

---

### `api/gemini-image.js` — Gemini image generation

A narrower version of the above: Gemini only, no provider switch, no dimensions.

```
POST /api/gemini-image
Body: { prompt* }
→ 200 { base64Image, mimeType }
```

Requires `GEMINI_API_KEY`. Functionally overlapped by `generate-banner.js?provider=gemini`.

---

### `api/eventbrite.js` — Eventbrite proxy

An action-dispatch proxy. The **caller supplies the access token**; the function holds no
Eventbrite credentials of its own.

```
POST /api/eventbrite
Body: { action*, accessToken*, …action-specific fields }
```

| `action` | Eventbrite endpoint called |
|---|---|
| `create_venue` | `POST /organizations/{organizationId}/venues/` |
| `create_event` | `POST /organizations/{organizationId}/events/` |
| `create_ticket` | `POST /events/{eventId}/ticket_classes/` |
| `publish_event` | `POST /events/{eventId}/publish/` |

Returns Eventbrite's response body and status verbatim. Unknown actions → 400.

---

### `api/send-email.js` — Resend

```
POST /api/send-email
Body: { to*, subject*, html|text*, from? }
→ 200 { id, sent: true }
→ 400 — missing required fields
→ 501 — RESEND_API_KEY not configured
```

`to` accepts a string or an array. Default sender falls back through
`from` → `RESEND_FROM_EMAIL` → `'EVOX AI CMO <onboarding@resend.dev>'`.

Returns **501 Not Implemented** (not 500) when the key is missing, with a message pointing at
resend.com — an honest "not configured yet" rather than a generic failure.

---

### `api/brand-kb.js` — Brand Knowledge Base (Supabase, **Node runtime**)

The only authenticated API route, and the only one that isn't Edge — it needs
`firebase-admin`, which doesn't run on the Edge runtime.

```
GET  /api/brand-kb   → { data: <kb object> | null }
POST /api/brand-kb   Body: { data* } → { ok: true }
→ 401 Unauthorized — no verifiable uid
```

Reads/writes the `brand_knowledge_base` Supabase table scoped to the verified uid, using
`upsert(..., { onConflict: 'user_id' })`.

> **Current status: NOT in the live path.** `src/services/knowledgeBaseService.js` documents
> the reversal (2026-08-04): Vercel API routes don't run under plain `vite`, and the required
> credentials (Firebase admin key, Supabase service-role key) were never added — so every
> save silently 404'd. The frontend went back to writing the KB as a nested field on the
> Firestore `users/{uid}` document. **Reinstate only once both credential sets exist and it
> has been tested under `vercel dev` or a real deployment.**

---

### `api/_lib/` — shared server-only helpers

#### `api/_lib/supabaseAdmin.js`
```js
export function getSupabaseAdmin() {
  return createClient(process.env.VITE_SUPABASE_URL,
                      process.env.SUPABASE_SERVICE_ROLE_KEY)
}
```
Uses the **service-role key, which bypasses Row Level Security**. The file header states the
rule: *never import this from `src/`* — it must only ever run in Node API routes.

#### `api/_lib/verifyUser.js`
```js
export async function verifyRequestUser(req) → uid | null
```

| Environment | Behaviour |
|---|---|
| `NODE_ENV === 'production'` | Requires `Authorization: Bearer <Firebase ID token>`, verifies it with `firebase-admin`, returns `decoded.uid`. Returns `null` on any failure |
| Otherwise | **Trusts `req.body.uid` / `req.query.uid` with no verification** |

The file's header comment explains the design: the app's uid (`'sso_' + custID`, from
`src/lib/authUtils.js`) is the *same* uid Firebase Auth signs the user in as after the SSO
redirect. So a verified Firebase ID token yields a trustworthy version of the exact uid the
rest of the app already uses — no second identity system needed. On localhost the SSO flow
never runs (`DEV_PROFILE` has `token: null`), so the dev branch mirrors the app's existing
`IS_LOCAL` / `IS_DEV` convention rather than inventing a new one.

Requires `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
`FIREBASE_ADMIN_PRIVATE_KEY` (with `\n` unescaped at runtime).

---

## Layer 2 — Vite dev middleware (`vite.config.js`)

553 lines. The `local-api-handlers` plugin reimplements API routes as Connect middleware so
`npm run dev` works without Vercel.

### Routes implemented locally

| Route | Mirrors | Differences from production |
|---|---|---|
| `/api/generate` | `api/generate.js` | None — same passthrough |
| `/api/generate-campaign` | `api/generate-campaign.js` | None — prompt and parser duplicated verbatim |
| `/api/generate-banner` | `api/generate-banner.js` | **`dalle` uses `dall-e-3` @1024×1024 + URL fetch**, production uses `gpt-image-1` @1536×1024 + direct base64 |
| `/api/eventbrite` | `api/eventbrite.js` | None |
| **`/api/run-agent`** | *(no production equivalent)* | **Dev-only** — see below |
| `/auth/facebook/callback` | *(no production equivalent)* | Dev-only OAuth landing page; redirects to `/connected-accounts#facebook_code=…` |

### `/api/run-agent` — the specialist agent prompts (dev only)

This route exists **only** in `vite.config.js`. In production the equivalent work is done by
the n8n `evoke-agents` webhook using Gemini.

**Model:** Groq `llama-3.3-70b-versatile`, temperature 0.7, max_tokens 4096.

Nine agent prompt templates in the `PROMPTS` object, each demanding a
`{ title, sections: [{ heading, content }] }` JSON response:

| `agentType` | Inputs | Produces |
|---|---|---|
| `reddit` | subreddit, topic, brandContext | 3 reply drafts + subreddit targets + engagement strategy |
| `seo` | websiteUrl, targetKeyword, industry | 15 keywords + 800-word blog + meta tags + snippet + linking |
| `writer` | topic, brandName, audience, tone | 1200-word article + 5 social quotes + newsletter + takeaways |
| `twitter` | topic, brandName, tone | 5 tweets + 7-tweet thread + 3 hooks + hashtags |
| `linkedin_agent` | topic, brandName, audience | 3 post drafts (story/insight/engagement) + schedule |
| `hackernews` | topic, brandName, value | Show HN draft + 3 comments + thread targeting |
| `geo` | brandName, keywords, description | AI-citation blocks + entity strategy + 10 FAQs + schema + distribution |
| `coding` | websiteUrl, issue, techStack | Technical SEO diagnosis + 2 code fixes + perf + test checklist |
| `ugc_videos` | product, style, audience, platforms | Brief + 60s script + 30s script + 5 hooks + platform adaptations |

Unknown `agentType` falls back to `seo`. If the response isn't parseable JSON, it's wrapped as
a single-section result rather than failing.

### Dev-server CORS proxies

| Path prefix | Target | Rewrite |
|---|---|---|
| `/n8n-webhook` | `https://n8n-zvxi.srv1837606.hstgr.cloud` | → `/webhook` |
| `/groq-api` | `https://api.groq.com` | → `/` (legacy, kept for back-compat) |
| `/evoke-api` | `https://apieksv1.evokemarketplace.com` | → `/api` |
| `/pollinations` | `https://image.pollinations.ai` | → `/` |

`server.port` is set to `5173` here, but `package.json`'s `dev` script passes `--port 3007`,
which wins. **The app runs on 3007.**

### Env loading

```js
const env = loadEnv(mode, process.cwd(), '')
```
The empty prefix means **all** env vars load, not just `VITE_`-prefixed ones — so the dev
middleware can read `GEMINI_API_KEY` and `OPENAI_API_KEY`.

---

## Layer 3 — n8n

Covered in full in [04-n8n-automation.md](04-n8n-automation.md).

---

## Deployment configuration — `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The catch-all rewrite is what makes client-side routing work — every path serves
`index.html` and React Router takes over.

> Vercel resolves `/api/*` against the `api/` directory **before** applying rewrites, so the
> functions are still reachable despite the wildcard.

---

## Request-flow summary

Where a given call actually lands, dev vs production:

| Frontend call | Local (`npm run dev`) | Production (Vercel) |
|---|---|---|
| `/api/generate` | Vite middleware → Groq | Edge function → Groq |
| `/api/generate-campaign` | Vite middleware → Groq | Edge function → Groq |
| `/api/generate-banner` | Vite middleware → Gemini/OpenAI/Pollinations | Edge function → same |
| `/api/run-agent` | Vite middleware → Groq | **404 — does not exist** |
| `/api/eventbrite` | Vite middleware → Eventbrite | Edge function → Eventbrite |
| `/api/send-email` | **404 — not implemented locally** | Edge function → Resend |
| `/api/gemini-image` | **404 — not implemented locally** | Edge function → Gemini |
| `/api/brand-kb` | **404 — not implemented locally** | Node function → Supabase |
| `/n8n-webhook/*` | Vite proxy → n8n | Direct to `VITE_N8N_BASE` |

---

[← Back to index](README.md) · [Next: n8n Automation →](04-n8n-automation.md)
