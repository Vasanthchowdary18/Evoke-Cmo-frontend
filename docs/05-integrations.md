# 05 — Third-Party Integrations

[← Back to index](README.md)

Every external service the platform talks to, what it's used for, where the code lives, and
what condition it's in.

---

## Integration status at a glance

| Service | Category | Status | Where the integration lives |
|---|---|---|---|
| **Evoke SSO** | Identity | 🟢 Live | `src/lib/session.js` |
| **Firebase (Firestore/Auth/Storage)** | Data | 🟢 Live | `src/firebase.js`, `src/services/*` |
| **GoHighLevel** | Social publishing | 🟢 Live (shared workspace) | `src/services/ghlService.js` + n8n |
| **Meta Graph (Facebook)** | Publishing | 🟢 Live | n8n |
| **Meta Graph (Instagram)** | Publishing | 🟢 Live | n8n |
| **LinkedIn** | Publishing | 🟢 Live | n8n |
| **Twilio** | WhatsApp + SMS | 🟢 Live | n8n |
| **Gmail API** | Email sending | 🟢 Live | n8n |
| **Groq** | AI text | 🟢 Live | `api/generate*.js`, `vite.config.js` |
| **Google Gemini** | AI text + images | 🟢 Live | n8n, `api/generate-banner.js`, `api/gemini-image.js` |
| **ImgBB** | Image hosting | 🟢 Live | n8n |
| **Pollinations** | AI images (free) | 🟢 Live | `api/generate-banner.js` |
| **Eventbrite** | Events | 🟢 Live | `api/eventbrite.js` + n8n |
| **Google Ads** | Paid ads | 🟡 Create works, metrics stubbed | n8n |
| **Meta Ads** | Paid ads | 🟡 Create works, reporting unclear | n8n |
| **TikTok** | Social | 🟡 OAuth only | n8n |
| **OpenAI** | AI images | 🟡 Optional, key-gated | `api/generate-banner.js` |
| **Resend** | Transactional email | 🟡 Code ready, key not set (returns 501) | `api/send-email.js` |
| **Supabase** | Data | 🟡 Schema exists, **reverted from live path** | `api/brand-kb.js`, `src/lib/supabaseClient.js` |
| **Razorpay** | Payments | 🟡 Script loads dynamically | `src/pages/Purchase.jsx` |
| **Cloudinary** | Media | 🟡 Keys present, usage limited | `.env` |
| **Luma / Meetup** | Events | 🟡 Branches exist in n8n | n8n |
| **Stripe** | Payments | 🔴 Links optional, likely unset | `src/components/PlanGate.jsx` |
| **SEMrush / Ahrefs / Search Console** | SEO data | 🔴 **Not integrated** | — (page says so in its own comment) |
| **Social inbox source** | Messaging | 🔴 **Not integrated** | — (UI labels threads as examples) |

🟢 live · 🟡 partial / conditional · 🔴 not wired

---

## 1. Evoke SSO — identity

The platform is a satellite of the Evoke Marketplace identity system. It has **no login of
its own**.

| Property | Value |
|---|---|
| Portal | `https://accounts.evokemarketplace.com` (override: `VITE_ACCOUNTS_URL`) |
| Session API | `{VITE_API_BASE_URL}/auth/session`, `/auth/signout` |
| Cookie | `evoke_user`, non-httpOnly, written at the parent domain `.evokemarketplace.com` |
| App user id | `'sso_' + profile.custID` |

**Cookie payload shape:**
```json
{
  "status": "success",
  "message": "…",
  "data": {
    "email": "…", "firstName": "…", "lastName": "…",
    "custID": 260417001, "role": 4,
    "token": "<JWT>", "walletAddress": "0x…"
  }
}
```

The cookie is non-httpOnly **by design** so any `*.evokemarketplace.com` subdomain can render
logged-in UI without an extra API round-trip. The file header is explicit that this is for
**UI rendering only** — gated actions should still verify the JWT server-side.

Cookie lifetime is derived from the JWT's `exp` claim, capped at 7 days
(`computeEvokeUserCookieMaxAgeSeconds`).

`src/lib/session.js` mirrors the same file in `converters_frontend` and `evoke_auth` — keep
the three in sync.

---

## 2. Firebase — the primary data layer

Project: **`evoke-cmo-agent2`** (visible in the n8n Firestore URLs).

| Service | Used for |
|---|---|
| **Firestore** | All live application data — see [06-data-model.md](06-data-model.md) |
| **Auth** | Custom-token sign-in only. Signs the user in as the same `sso_<custID>` uid so a verifiable ID token exists for API routes |
| **Storage** | Generated media |
| **firebase-admin** | Server-side ID-token verification in `api/_lib/verifyUser.js` |

Config comes entirely from `VITE_FIREBASE_*` env vars — nothing is hardcoded in
`src/firebase.js`.

n8n accesses Firestore over the **REST API** (`firestore.googleapis.com/v1/...`) using an
n8n `googleApi` predefined credential, not the client SDK.

> ⚠️ Firestore security rules are **not** in this repository. They are managed in the Firebase
> console and must be reviewed separately.

---

## 3. GoHighLevel — the social publishing engine

The most consequential integration. GHL holds the Meta / LinkedIn / TikTok app registrations,
so users authorise **GHL's** apps. That is what lets the platform publish to real accounts
without Evoke completing platform app review for each network.

| Property | Value |
|---|---|
| API base | `https://services.leadconnectorhq.com` |
| Auth model | Agency OAuth token (refresh-rotated) **or** a Private Integration Token (PIT) |
| Platforms | `facebook`, `instagram`, `linkedin`, `tiktok`, `threads`, `google` |
| Frontend | `src/services/ghlService.js` |
| Backend | 7 n8n webhooks — see [04-n8n-automation.md](04-n8n-automation.md#5-gohighlevel-integration-7-webhooks) |

### Intended vs. current architecture

**Intended:** every user gets their own GHL "location" (sub-account). That isolation is what
keeps one user's connected pages invisible to every other user.

**Current:** running on a **Private Integration Token**, which is issued *per workspace*. So
all users currently share one workspace (`SHARED_LOCATION_ID`, default
`ePB8lCVVTftERqNprfkc`).

`ensureGhlLocation()` already implements the correct model first and only falls back:

```js
try   { /* create a dedicated location via n8n */ }
catch { /* fall back to SHARED_LOCATION_ID */ }
```

> The moment the agency app can provision locations, the dedicated path becomes live for
> every new user **with no code change**.

### Two safety behaviours that must not be removed

1. **Trusted popup origins.** `openOAuthPopup` only accepts `postMessage` from
   `services.leadconnectorhq.com` and `app.gohighlevel.com`. Without this allow-list any page
   could forge a connection event.

2. **The `scoped` flag.** `listConnectedPages()` returns `scoped: true` only when the page
   list could be narrowed to the account that just signed in (matching `originId` against the
   popup's `accountId`). When it returns `false`, the caller sees every page on the
   workspace — **and must not auto-select one**, because on a shared workspace that would
   silently link another user's page. The fallback exists to keep connecting possible, not as
   the intended path, and logs a `console.warn` when taken.

### Environment override

`VITE_GHL_LOCATION_ID` — set it to point an environment at a different workspace, or to `''`
to force per-user provisioning. The default is deliberately hard-coded rather than
env-only, because a missing env var previously disabled connecting silently with no
diagnosable cause. It is only a workspace identifier; the token that can act on it lives
server-side in n8n.

---

## 4. Meta — Facebook, Instagram, WhatsApp, Ads

Graph API **v21.0** throughout.

| Product | Flow |
|---|---|
| **Facebook Pages** | OAuth → short-lived → long-lived token → `/me/accounts`. Publishing: `/photos` (image), `/videos` (video), `/feed` (text) |
| **Instagram Business** | Discovered from the linked FB Page, or direct IG Business Login. Publishing is **two-step and required**: `POST /{igBusinessId}/media` (create container) → `POST /{igBusinessId}/media_publish` |
| **WhatsApp Business** | Webhook verification (GET) + inbound events (POST) at `meta-whatsapp-webhook`. Outbound messages currently go through **Twilio**, not Meta directly |
| **Meta Ads** | OAuth → `/me/adaccounts`. Creation: campaign → ad set → creative → ad on `act_{adAccountId}` |

Env: `VITE_META_APP_ID`, `VITE_META_APP_SECRET`, `META_ADS_APP_ID`, `META_ADS_APP_SECRET`,
`META_ADS_ACCESS_TOKEN`, `META_ADS_AD_ACCOUNT_ID`, `META_whatsapp_access_token`,
`VITE_FACEBOOK_PAGE_ID`, `VITE_FACEBOOK_PAGE_ACCESS_TOKEN`,
`VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID`, `VITE_INSTAGRAM_ACCESS_TOKEN`.

---

## 5. LinkedIn

Two API generations are used side by side:

| Content type | API | Endpoint |
|---|---|---|
| Text post | v2 | `POST /v2/ugcPosts` |
| Image post | v2 | `POST /v2/assets?action=registerUpload` → upload → `POST /v2/ugcPosts` |
| **Video post** | **REST (versioned)** | `/rest/videos?action=initializeUpload` → upload bytes → `?action=finalizeUpload` → **Wait** → `POST /rest/posts` |
| Profile | v2 | `GET /v2/userinfo` |

Video is the longest path in the workflow — six HTTP calls plus two `Wait` nodes, because
LinkedIn processes video asynchronously and rejects a post referencing an unprocessed asset.

Env: `VITE_LINKEDIN_CLIENT_ID` (secret held in n8n).

---

## 6. Twilio — WhatsApp & SMS

| Property | Value |
|---|---|
| Endpoint | `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json` |
| Used for | WhatsApp **and** SMS in both the campaign flow and the scheduler |
| Status callback | `POST /webhook/twilio-status-callback` |

Both channels pass through a "Split Recipients" code node so a campaign fans out to a
recipient list.

Env: `twilo_sid`, `twilo_auth_token` *(note: both are misspelled in `.env` — see
[08](08-known-gaps-and-risks.md))*.

> ⚠️ The Twilio Account SID is currently **hard-coded into the n8n node URLs**.

---

## 7. AI providers

### Groq — primary text generation

| Model | Used for | Where |
|---|---|---|
| `llama-3.1-8b-instant` | Campaign copy packages (15-field JSON) | `api/generate-campaign.js`, `vite.config.js` |
| `llama-3.3-70b-versatile` | Specialist agents (9 types) | `vite.config.js` `/api/run-agent` |
| caller-specified | Generic proxy | `api/generate.js` |

Endpoint: `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible).
Env: `VITE_GROQ_API_KEY` — **server-side only despite the `VITE_` prefix**; it is read via
`process.env` in the Edge functions and `loadEnv` in Vite, never bundled into the client.

### Google Gemini — n8n text + all image generation

| Model | Used for | Where |
|---|---|---|
| `gemini-2.0-flash` | Campaign content, agent responses, product descriptions | n8n |
| `gemini-2.0-flash-exp` | Image generation (`responseModalities: ['IMAGE','TEXT']`) | `api/generate-banner.js`, `api/gemini-image.js`, n8n |

Env: `GEMINI_API_KEY` (Vercel). ⚠️ In n8n the key is embedded directly in node URLs.

### OpenAI — optional images

`api/generate-banner.js` with `provider: 'dalle'` requests **`gpt-image-1`** at 1536×1024,
quality `high`, returning base64 directly. Env: `OPENAI_API_KEY`.

> The dev-mode path in `vite.config.js` still requests **`dall-e-3`** at 1024×1024 and fetches
> the returned URL to convert it. The two environments differ.

### Pollinations — free fallback images

`https://image.pollinations.ai/prompt/{prompt}?width&height&model=flux&nologo=true&seed`
No API key. Seed must be `Math.random() * 2147483647` — `Date.now()` overflows 32-bit and is
rejected.

### ImgBB — image hosting for social

n8n uploads generated images to `https://api.imgbb.com/1/upload` because Meta and LinkedIn
require a publicly reachable URL, not base64. Env: `VITE_IMGBB_API_KEY`.

---

## 8. Google Ads

| Property | Value |
|---|---|
| API version | **v23** |
| OAuth | `oauth2.googleapis.com/token` → `customers:listAccessibleCustomers` |
| Creation | 5 sequential `:mutate` calls — budget → campaign → ad group → keywords → ad |
| Metrics | ⚠️ `GAds Metrics Compute` is a **code node with no API call** |
| Frontend | `src/services/googleAdsService.js` |

Env: `GOOGLE_ADS_DEVELOPER_TOKEN`, plus `client_id` / `client_secret`.

---

## 9. Eventbrite

Two independent paths to the same API — a Vercel proxy **and** an n8n flow.

| Path | File | Actions |
|---|---|---|
| Vercel | `api/eventbrite.js` | `create_venue`, `create_event`, `create_ticket`, `publish_event` |
| n8n | `evoke-cmo` flow, `Eventbrite Create Event` node | Event creation as part of a campaign |
| OAuth | n8n `eventbrite-oauth` | Token exchange + `/v3/users/me/organizations/` |

The Vercel proxy holds no credentials — the **caller supplies the access token**.

Env: `VITE_EVENTBRITE_CLIENT_ID`.

Related event platforms with branches present in the campaign flow:
**Luma** (`api.lu.ma/v1/calendar/create-event`) and **Meetup**.

---

## 10. TikTok

OAuth only — token exchange (`open.tiktokapis.com/v2/oauth/token/`) and profile fetch
(`/v2/user/info/?fields=display_name,open_id`). Publishing to TikTok goes through
**GoHighLevel**, which lists `tiktok` in `GHL_PLATFORMS`.

`public/tiktokGYdTycqX1no9l7SYXZqzYwbyML5WqPQf.txt` is TikTok's domain-verification file.

Env: `VITE_TIKTOK_CLIENT_ID`, `VITE_TIKTOK_CLIENT_SECRET`, `VITE_TIKTOK_REDIRECT_URI`.

---

## 11. Email

Three separate email mechanisms coexist:

| Mechanism | Path | Status |
|---|---|---|
| **Gmail API** | n8n: refresh token → build MIME → `messages/send` | 🟢 Live — sends as the user |
| **Resend** | `api/send-email.js` | 🟡 Code ready; returns **501** until `RESEND_API_KEY` is set |
| **SMTP/other** | — | Not present |

Resend default sender: `RESEND_FROM_EMAIL` → `'EVOX AI CMO <onboarding@resend.dev>'`.

---

## 12. Payments

| Provider | Where | Status |
|---|---|---|
| **Razorpay** | `src/pages/Purchase.jsx` loads the checkout script dynamically | Env: `VITE_RAZORPAY_KEY_ID` |
| **Stripe** | `src/components/PlanGate.jsx` — `STRIPE_LINKS` from `VITE_STRIPE_LINK_A/B/C` | Optional; when unset the gate falls back to navigating to `/{requiredPlan}` |

There is also an internal **token economy** (`TOKEN_PACKAGES` in `userService.js`):
Starter 10/$9.99, Growth 20/$17.99, Pro 35/$24.99. One token is deducted per campaign launch
via `deductToken()`, which throws `'Insufficient tokens'` at zero.

---

## 13. Supabase — built, then rolled back

A complete Postgres schema exists (`docs-internal/supabase-schema.sql`) with `user_profiles`
and `brand_knowledge_base` tables, RLS policies, `updated_at` triggers and indexes.

**It is not in the live path.** The header of `src/services/knowledgeBaseService.js` records
why, dated 2026-08-04:

> Vercel API routes don't run under plain `vite` (only under `vercel dev` or a real Vercel
> deployment), and the required credentials (Firebase admin key, Supabase service-role key)
> were never added — so every save was silently failing with a 404.

**What still exists and works:**
- `docs-internal/supabase-schema.sql` — the full schema
- `api/brand-kb.js` + `api/_lib/*` — the working Node API route
- `src/lib/apiAuth.js` — the authenticated fetch helper
- `src/lib/supabaseClient.js` — the browser client
- `/supabase-test` — a localhost-only connectivity check

**To reinstate:** add both credential sets, test under `vercel dev` or a real deployment
(**not** plain `vite`), then point `knowledgeBaseService.js` back at `authedFetch`.

See [06-data-model.md](06-data-model.md) for the schema.

---

## 14. EGT — Evoke Gratitude Token (blockchain)

An on-chain token balance surfaced in the UI.

| File | Role |
|---|---|
| `src/components/EgtWalletHeader.jsx` | Header wallet display |
| `src/components/GratitudeToken.jsx` | Token display/award |
| `src/lib/evokeUserCookie.js` | Reads the wallet address from the SSO cookie |
| `src/lib/egtRewardPoolBalance.js` | Reads the reward-pool balance via RPC |
| `src/lib/formatEgtBalance.js` | Display formatting |

The wallet address arrives in the SSO cookie and is validated against `/^0x[a-fA-F0-9]{40}$/`
before use. Env: `VITE_EGT_RPC_URL`, `VITE_EGT_REWARD_POOL_ADDRESS`.

---

## 15. Analytics & media

| Service | Where | Notes |
|---|---|---|
| **Google Ads gtag** | `index.html`, `src/lib/gtag.js` | Conversion ID `AW-18246572299`; helpers `gtagEvent`, `trackPurchase`, `trackSignup` |
| **Cloudinary** | `.env` only | Keys present (`CLOUDINARY_*`, `VITE_CLOUDINARY_CLOUD_NAME`); the `cloudinary` npm package is a dependency |
| **QR Server API** | `src/services/qrCodeService.js` | Free, no key. Overlays registration QR codes on event banners |
| **WaveSpeed** | `.env` only | `VITE_WAVESPEED_API_KEY` — appears twice; purpose undocumented |

---

## 16. Not integrated — but presented in the UI

Two areas show data that has no live source. **Both are honestly labelled in the code**, and
that labelling should be preserved until real integrations land.

| Area | File | What the code says |
|---|---|---|
| **SEO Intelligence Center** | `src/pages/SeoIntelligenceCenterPage.jsx` | Its own header comment states that no SEMrush / Ahrefs / Search Console integration exists anywhere in the app, so Domain Authority, Organic Traffic, Keywords Ranked, Backlinks and the keyword table have **zero real data source** |
| **Social Inbox** | `src/pages/SocialInbox.jsx` | Renders an in-UI banner: *"Example conversations — no live LinkedIn/Instagram/Facebook/WhatsApp inbox is connected yet."* Replies **are** saved to the user's account, and "Suggested Reply" **is** a real AI call |

---

[← Back to index](README.md) · [Next: Data Model →](06-data-model.md)
