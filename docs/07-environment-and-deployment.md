# 07 — Environment & Deployment

[← Back to index](README.md)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 18+** | Required for the Vite 5 toolchain and native `fetch` |
| **npm** | `package-lock.json` is committed — use npm, not yarn/pnpm |
| **A populated `.env`** | Not in git. Obtain from the current maintainer or the Vercel dashboard |
| **Vercel CLI** *(optional)* | Only needed to exercise the real `api/` functions locally |

---

## 2. Local development

```bash
npm install
```

```bash
npm run dev
```

The app runs at **http://localhost:3007**.

> The port comes from `package.json` (`vite --port 3007`), which overrides `server.port: 5173`
> in `vite.config.js`. `.claude/launch.json` also pins 3007 with `--strictPort`.
> If the port is busy you likely have a stale dev server — kill it rather than letting Vite
> pick another port, because several OAuth redirect URIs are registered against 3007.

### What `npm run dev` gives you

✅ The full React app
✅ `/api/generate`, `/api/generate-campaign`, `/api/generate-banner`, `/api/eventbrite`
✅ `/api/run-agent` (dev-only — no production equivalent)
✅ CORS proxies to n8n, Groq, the Evoke API and Pollinations
✅ Auto sign-in as the hard-coded dev profile
✅ All plan gates bypassed

❌ `/api/send-email`, `/api/gemini-image`, `/api/brand-kb` — **these 404 locally**

### Running the real Vercel functions locally

```bash
vercel dev
```

Required if you are working on `api/send-email.js`, `api/gemini-image.js` or
`api/brand-kb.js`. **Plain `vite` will not run them** — that is precisely how the Supabase
Brand-KB migration silently failed and had to be reverted.

### Other scripts

```bash
npm run build
```
Vite production build → `dist/` (with `--emptyOutDir`).

```bash
npm run preview
```
Serves the built `dist/` locally.

```bash
npm run lint
```
ESLint over `js,jsx` with `--max-warnings 0`.

> ⚠️ There is **no ESLint config file** in the repository, so this script will not currently
> run as-is. Noted in [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

---

## 3. Environment variables

`.env` lives at the repo root and is **git-ignored**. No values appear in this document —
only names.

Understanding the prefix rule matters here:

- **`VITE_`-prefixed** vars are inlined into the **client bundle** by Vite and are therefore
  **publicly visible** in the browser. Only put non-secret values here.
- **Un-prefixed** vars are available server-side only (`process.env` in Vercel functions;
  `loadEnv(mode, cwd, '')` in `vite.config.js`, which loads *everything*).

> ⚠️ Several genuine secrets currently carry a `VITE_` prefix. Read the notes column
> carefully — and see [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

### Firebase (client)

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key (public by design) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `evoke-cmo-agent2` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender id |
| `VITE_FIREBASE_APP_ID` | App id |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics id |

### Firebase Admin (server — Vercel only)

| Variable | Purpose |
|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | Service-account project |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service-account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private key — store with escaped `\n`; the code unescapes at runtime |

> ⚠️ **Not currently set.** This is one of the two reasons the Supabase Brand-KB route was
> rolled back.

### Evoke SSO & platform

| Variable | Purpose |
|---|---|
| `VITE_ACCOUNTS_URL` | Accounts portal (default `https://accounts.evokemarketplace.com`) |
| `VITE_API_BASE_URL` | Evoke backend for `/auth/session` and `/auth/signout` |
| `VITE_COOKIE_DOMAIN` | Cookie domain, e.g. `.evokemarketplace.com`. Set `none`/empty for localhost |
| `VITE_MARKETPLACE_URL` | Marketplace link target |
| `VITE_EVOKE_API_KEY` | Evoke API key |

### n8n

| Variable | Purpose |
|---|---|
| `VITE_N8N_BASE` | Base host for all n8n webhooks |
| `VITE_N8N_WEBHOOK` | Full override for the main campaign webhook |
| `VITE_N8N_DAY_WEBHOOK` | Full override for the day webhook |
| `VITE_N8N_AGENT_WEBHOOK` | Full override for the agents webhook |

### AI providers (server-side)

| Variable | Purpose | Notes |
|---|---|---|
| `VITE_GROQ_API_KEY` | Groq API key | ⚠️ `VITE_`-prefixed but only read server-side. **The prefix is misleading — rename to `GROQ_API_KEY`** |
| `GEMINI_API_KEY` | Gemini (images) | Correctly un-prefixed |
| `OPENAI_API_KEY` | OpenAI images | Correctly un-prefixed |
| `VITE_IMGBB_API_KEY` | ImgBB image hosting | |
| `VITE_WAVESPEED_API_KEY` | WaveSpeed | Appears **twice** in `.env`; purpose undocumented |

### GoHighLevel

| Variable | Purpose |
|---|---|
| `GHL_CLIENT_ID` | Marketplace app client id |
| `GHL_CLIENT_SECRET` | Marketplace app secret |
| `GHL_PIT_tocken` | Private Integration Token *(note the typo in the name)* |
| `VITE_GHL_LOCATION_ID` | Shared workspace id. Appears **twice** in `.env`. Set to `''` to force per-user provisioning |

### Meta / Facebook / Instagram

| Variable | Purpose |
|---|---|
| `VITE_META_APP_ID` / `VITE_META_APP_SECRET` | Meta app credentials |
| `Vite_facebook_secret` | Facebook secret *(inconsistent casing)* |
| `VITE_FACEBOOK_PAGE_ID` / `VITE_FB_PAGE_ID` | Page id — **two vars for the same thing** |
| `VITE_FACEBOOK_PAGE_ACCESS_TOKEN` / `VITE_FB_PAGE_ACCESS_TOKEN` | Page token — **two vars for the same thing** |
| `VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID` / `VITE_INSTAGRAM_ID` | IG business account — **two vars** |
| `VITE_INSTAGRAM_ACCESS_TOKEN` | IG token |
| `META_ADS_APP_ID` / `META_ADS_APP_SECRET` | Meta Ads app |
| `META_ADS_ACCESS_TOKEN` / `META_ADS_AD_ACCOUNT_ID` | Meta Ads account |
| `VITE_META_AD_ACCOUNT_ID` | ⚠️ Duplicate of `META_ADS_AD_ACCOUNT_ID` |
| `META_whatsapp_access_token` | WhatsApp Business token |
| `VITE_META_API_BASE` | Meta/Evoke FastAPI backend base URL |

### Other platforms

| Variable | Purpose |
|---|---|
| `VITE_LINKEDIN_CLIENT_ID` | LinkedIn app |
| `VITE_TIKTOK_CLIENT_ID` / `VITE_TIKTOK_CLIENT_SECRET` / `VITE_TIKTOK_REDIRECT_URI` | TikTok app ⚠️ **the secret must not be `VITE_`-prefixed** |
| `VITE_TWITTER_CLIENT_ID` | Twitter/X app |
| `VITE_EVENTBRITE_CLIENT_ID` | Eventbrite app |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads developer token |
| `client_id` / `client_secret` | Generic Google OAuth *(non-descriptive names)* |
| `twilo_sid` / `twilo_auth_token` | Twilio *(both misspelled — "twilo")* |

### Storage & payments

| Variable | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary (server) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary (client) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay checkout |
| `VITE_STRIPE_LINK_A` / `_B` / `_C` | Stripe payment links per plan. **Referenced in `PlanGate.jsx` but not present in `.env`** — the gate falls back to `/{plan}` |

### Supabase

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key (public by design, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **Bypasses RLS. Server-only. Not currently set** — the other reason the Brand-KB route was rolled back |

### EGT (blockchain)

| Variable | Purpose |
|---|---|
| `VITE_EGT_RPC_URL` | RPC endpoint |
| `VITE_EGT_REWARD_POOL_ADDRESS` | Reward pool contract address |

### Email

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend. **Not set** → `/api/send-email` returns 501 |
| `RESEND_FROM_EMAIL` | Default sender |
| `VITE_ADMIN_EMAIL` | Approval-email recipient |

> ⚠️ **`.env` currently contains a stray line beginning `For …`** which is not a valid
> variable assignment. It parses as a var named `For`. Remove it.

---

## 4. Deployment — frontend (Vercel)

### Configuration

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The catch-all rewrite makes client-side routing work. Vercel resolves `/api/*` against the
`api/` directory **before** applying rewrites, so the functions remain reachable.

`.vercel/project.json` holds the linked project id.

### Steps

1. Connect the Git repository to the Vercel project (or `vercel link`)
2. Add **every** environment variable in §3 to the Vercel dashboard — including the
   un-prefixed server-side ones
3. Push to the deployment branch; Vercel builds automatically
4. Verify the custom domain resolves and that `VITE_COOKIE_DOMAIN` matches it — SSO breaks if
   the app is not served from a `*.evokemarketplace.com` subdomain, because the `evoke_user`
   cookie is scoped to that parent domain

### Runtime split

| Route | Runtime | Why |
|---|---|---|
| `api/generate.js`, `generate-campaign.js`, `generate-banner.js`, `gemini-image.js`, `eventbrite.js`, `send-email.js` | **Edge** | Declared `export const config = { runtime: 'edge' }` |
| `api/brand-kb.js` | **Node** | Needs `firebase-admin`, which doesn't run on Edge |

---

## 5. Deployment — n8n

The workflow is **not** deployed from this repository. Full procedure in
[04-n8n-automation.md § 10](04-n8n-automation.md#10-operating-the-workflow). Summary:

1. Import `EVOKE-CMO-v21-GHL.json`
2. Configure the Google API credential (Firestore access)
3. Replace hard-coded API keys in the Gemini and Twilio nodes with proper credentials
4. **Activate the workflow** — required for webhooks *and* for static-data persistence
5. Update the n8n host in **three** frontend places:
   - `VITE_N8N_BASE` env var (`src/config.js` reads it)
   - the hard-coded `N8N_BASE` in `src/services/ghlService.js`
   - the `/n8n-webhook` proxy target in `vite.config.js`
6. Re-install the GHL Marketplace app so `evoke-oauth-callback` seeds the agency token
7. POST the PIT to `/webhook/evoke-set-pit`

---

## 6. Firebase setup

| Item | Where |
|---|---|
| Firestore database | Firebase console — project `evoke-cmo-agent2` |
| **Security rules** | ⚠️ Console-managed, **not in this repo**. Must be reviewed separately |
| Auth | Custom-token sign-in must be enabled |
| Storage | Bucket per `VITE_FIREBASE_STORAGE_BUCKET` |
| Service account | Needed for `FIREBASE_ADMIN_*` and for the n8n `googleApi` credential |

---

## 7. Post-deployment verification checklist

| # | Check | How |
|---|---|---|
| 1 | SSO sign-in works | Visit the app signed out → should redirect to the accounts portal and return authenticated |
| 2 | The cookie is readable | DevTools → Application → Cookies → `evoke_user` present on the app's domain |
| 3 | Plan gates enforce | Sign in on a `free` plan → a `package-b` route should show the lock card, **not** the page |
| 4 | AI generation works | Run a campaign → `POST /api/generate*` returns 200 |
| 5 | n8n receives the campaign | n8n → Executions → a new `evoke-cmo` run appears |
| 6 | Social connect works | `/connect-accounts` → connect a platform → the OAuth popup completes and the page is listed |
| 7 | Immediate publish works | `/post-content` → publish → the post appears on the real account |
| 8 | The scheduler runs | Schedule an item for +20 min → confirm it publishes and `status` flips to `published` in Firestore |
| 9 | Dev routes are hidden | `/dev-reset` and `/supabase-test` redirect to `/` in production |
| 10 | Email sends | Only after `RESEND_API_KEY` is set — otherwise expect a 501 |

Step 8 is the one most worth doing properly. It is the only end-to-end proof that the cron,
the Firestore query, the platform tokens and the write-back are all working together.

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/api/send-email`, `/api/gemini-image` or `/api/brand-kb` 404s locally | Expected — plain `vite` doesn't run `api/`. Use `vercel dev` |
| Campaign returns 200 but nothing publishes | Normal — `evoke-cmo` responds before publishing. Check n8n → Executions |
| Scheduled post never publishes | Check all three query conditions in Firestore: `status == 'scheduled'`, `requiresApproval == false`, `scheduledAt <= now()` |
| Scheduled post publishes repeatedly | The `Mark Content Published` write-back is failing — that node is the idempotency mechanism |
| GHL calls fail with "No agency token stored" | The Marketplace app isn't installed. Re-run the `evoke-oauth-callback` install flow |
| PIT stored but not persisting | The n8n workflow isn't **ACTIVE** — static data only persists on production runs |
| Social connect links the wrong page | `listConnectedPages` returned `scoped: false` on the shared workspace. Check the `console.warn` |
| Everything is unlocked and you're always logged in | You're on `localhost` — all three dev bypasses are active |
| Plan gates don't enforce in production | Check `PLAN_GATES_ENABLED` in `PlanGate.jsx` (currently `true`) |
| Pollinations rejects the request | Seed exceeded 32-bit int — must be `Math.random() * 2147483647` |
| `npm run lint` fails to start | No ESLint config exists in the repo |

---

[← Back to index](README.md) · [Next: Known Gaps & Risks →](08-known-gaps-and-risks.md)
