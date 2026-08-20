# 01 — System Overview

[← Back to index](README.md)

---

## 1. What the system does

EVOKE AI CMO replaces the function of a marketing team with a chain of AI agents. The user
provides brand context once; every downstream feature reads from that context, so campaigns,
creative and strategy all stay on-brand without the user re-typing anything.

The platform is sold in four tiers, and features are gated by tier:

| Plan key | Product name | Price | Broad capability |
|---|---|---|---|
| `free` | Free Trial | $0 (14-day trial) | Brand setup, strategy, health score, connect accounts, publish |
| `package-a` | Starter | $30/mo | + Content generation, captions, reels, copywriting, images, video |
| `package-b` | Professional | $100/mo | + AI agents (SEO, Email, A/B), CRM, analytics, social manager, approval queue |
| `package-c` | Enterprise | Custom | + Paid ads (Meta/Google), multi-channel execution, team, C-suite agents |

Tiers are **cumulative** — Package B includes everything in A.
Source of truth: `src/lib/planGate.js`.

---

## 2. Technology stack

### Frontend
| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | React | 18.2 | Function components + hooks only, no class components |
| Build tool | Vite | 5.1 | Also hosts the dev-time API layer via a custom plugin |
| Routing | react-router-dom | 6.22 | `BrowserRouter`, v7 future flags enabled |
| Icons | lucide-react | 0.323 | Used consistently across every page |
| Animation | framer-motion | 11.0 | Page transitions, modals, plan-gate card |
| HTTP | native `fetch` + axios | 1.6 | `fetch` dominates; axios present as a dependency |
| Styling | **Inline styles + one global CSS file** | — | No Tailwind, no CSS-in-JS library, no CSS modules |

### Backend
| Layer | Choice | Notes |
|---|---|---|
| Hosting | Vercel | Static SPA + serverless/edge functions |
| API functions | Vercel Edge Runtime (6 routes) + Node runtime (1 route) | `api/` directory |
| Automation engine | **n8n** (self-hosted at `n8n-zvxi.srv1837606.hstgr.cloud`) | 230 nodes, 25 webhooks, 1 scheduler |
| Database (primary) | **Firebase Firestore** | All live application data |
| Database (secondary) | **Supabase Postgres** | Schema built, partially wired, currently **not** in the live path |
| Auth | Evoke SSO + Firebase Auth custom tokens | See §4 |
| File storage | Firebase Storage + Cloudinary + ImgBB | Images land in different places depending on the flow |

### AI providers
| Provider | Model | Used for | Called from |
|---|---|---|---|
| **Groq** | `llama-3.1-8b-instant` | Campaign copy packages | `api/generate-campaign.js` |
| **Groq** | `llama-3.3-70b-versatile` | Specialist text agents (SEO, Reddit, X, LinkedIn, GEO…) | Vite dev `/api/run-agent` |
| **Groq** | caller-specified | Generic chat completions proxy | `api/generate.js` |
| **Google Gemini** | `gemini-2.0-flash` | Campaign content + agent responses inside n8n | n8n HTTP nodes |
| **Google Gemini** | `gemini-2.0-flash-exp` | Image generation | `api/generate-banner.js`, `api/gemini-image.js` |
| **OpenAI** | `gpt-image-1` / `dall-e-3` | Optional image generation provider | `api/generate-banner.js` |
| **Pollinations** | `flux` | Free fallback image generation, no API key | `api/generate-banner.js` |

---

## 3. Repository layout

```
evoke-cmo-frontend/
├── api/                     ← Backend: Vercel serverless & edge functions
│   ├── _lib/                ← Shared server-only helpers (Supabase admin, auth verify)
│   ├── brand-kb.js          ← Node runtime (needs firebase-admin)
│   ├── eventbrite.js        ← Edge
│   ├── gemini-image.js      ← Edge
│   ├── generate-banner.js   ← Edge
│   ├── generate-campaign.js ← Edge
│   ├── generate.js          ← Edge
│   └── send-email.js        ← Edge
├── docs/                    ← THIS DOCUMENTATION
├── docs-internal/           ← Legacy .docx specs + supabase-schema.sql
├── public/                  ← Static assets (logo, favicons, screenshots, platform verification files)
├── src/
│   ├── components/          ← 20 shared UI components
│   ├── hooks/               ← 4 React hooks
│   ├── lib/                 ← 12 pure-logic helper modules
│   ├── pages/               ← 75 route-level page components
│   ├── services/            ← 14 data-access / API-client modules
│   ├── App.jsx              ← Router + all ~100 route definitions
│   ├── config.js            ← n8n webhook URL resolution
│   ├── firebase.js          ← Firebase SDK initialisation
│   ├── index.css            ← The ONLY global stylesheet (347 lines)
│   └── main.jsx             ← React entry point
├── index.html               ← HTML shell + Google Ads gtag
├── package.json
├── vercel.json              ← SPA rewrite rule
└── vite.config.js           ← Build config + dev-only API middleware + CORS proxies
```

---

## 4. Authentication — how a user gets in

This is the single most important thing to understand, because **the app does not have its
own login**. It is a satellite of the Evoke Marketplace identity system.

### The production flow

```
1. User hits any page on cmo.evokemarketplace.com
       │
2. useEvokeSession() reads the `evoke_user` cookie
       │  (written by accounts.evokemarketplace.com at the PARENT domain
       │   `.evokemarketplace.com`, so every subdomain can read it)
       │
3. No cookie? → fetchSessionFromBackend() calls
       │  GET {VITE_API_BASE_URL}/auth/session  with credentials:'include'
       │  to recover a session from the httpOnly `auth_token` cookie
       │
4. Still nothing? → status = 'unauthenticated'
       │  redirectToLogin() sends the browser to
       │  accounts.evokemarketplace.com/login/?redirect_url=<current page>
       │
5. Accounts portal authenticates, writes `evoke_user`, redirects back
       │
6. profileToUser() maps the SSO profile to the app's user object:
       │     uid = "sso_" + profile.custID          ← THE APP'S USER ID
       │     displayName, email, token, custID …
       │
7. AuthProvider puts { profile, status, user } on React context
       │  → every page reads it via useAuth()
```

**Key file map:**

| Step | File |
|---|---|
| Cookie read/write/parse, JWT decode, sign-out | `src/lib/session.js` |
| React subscription to the cookie | `src/hooks/useEvokeSession.js` |
| SSO profile → app user mapping | `src/lib/authUtils.js` |
| Context provider | `src/components/AuthProvider.jsx` |
| Consumer hook | `src/hooks/useAuth.js` |

### The secondary Firebase path

`App.jsx` also contains `EvokeAuthHandler`. If the app is loaded with a
`?token=` / `?customToken=` / `?access_token=` / `?auth_token=` query parameter, it:

1. Strips the token from the URL (`history.replaceState`)
2. Calls `signInWithCustomToken(auth, token)` — establishing a **real Firebase Auth session**
3. Calls `getOrCreateUser()` to create the Firestore user document
4. Navigates to `sessionStorage.evoke_post_login_route` (default `/dashboard`)

**Why both exist:** the `evoke_user` cookie identifies the user for the UI, but Firestore
security rules and the Node API route (`api/brand-kb.js`) need a *verifiable* identity.
The Firebase custom token is minted with the same `sso_<custID>` uid, so a verified Firebase
ID token yields exactly the uid the rest of the app already uses — no second identity system.
This reasoning is documented in `api/_lib/verifyUser.js`.

### Local development bypasses

Three separate dev bypasses exist. Know them, because they hide real production behaviour:

| Bypass | File | Effect on `localhost` / `127.0.0.1` |
|---|---|---|
| **Auto sign-in** | `src/hooks/useEvokeSession.js` | Falls back to a hard-coded `DEV_PROFILE` (`custID: 260417001`) with `token: null`. You are always "logged in". |
| **Plan gates off** | `src/components/PlanGate.jsx` | `IS_DEV` short-circuits — every gated page renders regardless of plan. |
| **API auth off** | `api/_lib/verifyUser.js` | When `NODE_ENV !== 'production'`, trusts `req.body.uid` / `req.query.uid` with no token check. |
| **Cookie expiry off** | `src/lib/session.js` | JWT expiry checks skipped; cookie forced to 7 days. |
| **Session recovery off** | `src/lib/session.js` | `fetchSessionFromBackend()` returns early — the auth cookie is domain-locked to `.evokemarketplace.com` and would only produce noisy 401s. |

`/dev-reset` and `/supabase-test` routes are also **localhost-only** — in production they
redirect to `/`.

---

## 5. The complete user journey, start to finish

This is the "how it works from starting to ending" walkthrough.

### Stage 0 — Landing

`src/pages/Landing.jsx` (4,392 lines) is the public marketing page. No auth required.
CTAs push the visitor toward `/pricing` or sign-in.

### Stage 1 — Brand Setup

Route: `/brand-profile` → `src/pages/BrandProfilePage.jsx`, which renders
`src/components/OnboardingWizard.jsx` (588 lines).

Six wizard steps:

| # | Step label | Collects |
|---|---|---|
| 1 | Cognitive System Tuning | Which AI agents to enable (Strategy, Content, Creative, SEO…) |
| 2 | Brand System Definition | Industry, company size, brand voice, value tags |
| 3 | Connect System API | 10 integration toggles (GA, Meta Ads, Instagram, LinkedIn, TikTok, Gmail, HubSpot, Salesforce, Shopify, WordPress) |
| 4 | Marketing Plan Tuning | Primary goal — revenue / awareness / leads |
| 5 | Neural Network Ingestion | Document upload for brand context |
| 6 | Cognitive Audit Report | Summary + plan selection |

On finish it writes to Firestore: `knowledgeBase` (via `saveKnowledgeBase`),
`selectedPlan` / `userPlan`, `brandSetupComplete`, and `recommendedRoutes`.

`/onboarding` and `/setup` are **legacy routes that now redirect here** — the old chat-wizard
chain was retired. This is the only onboarding flow the rest of the app reads from.

### Stage 2 — Dashboard

Route: `/dashboard` → `src/pages/DashboardPage.jsx`.

Reads the Brand Knowledge Base and feeds it to `src/lib/recommendations.jsx`
(`getRecommendedActions`), which scores a pool of suggested next actions against the
user's industry, audience type and objectives, then renders the top ones as cards.
Recommendations are industry-aware: e-commerce brands get product-campaign and visual
suggestions; B2B/SaaS brands get email-drip and LinkedIn suggestions.

`src/components/ProductTour.jsx` runs a first-visit guided tour, anchored to `data-tour`
attributes on the sidebar nav items. Dismissal is persisted with `markTourSeen()`.

### Stage 3 — Connect Channels

Route: `/connect-accounts` → `src/pages/ConnectAccounts.jsx` (2,273 lines).

Two connection mechanisms coexist:

**(a) Via GoHighLevel — the current live path for social publishing**
`src/services/ghlService.js` drives it:
1. `ensureGhlLocation(uid)` — provisions a GHL sub-account ("location"), or falls back to
   a shared workspace ID
2. `startSocialConnect(uid, platform)` — asks n8n for an OAuth start URL, opens a popup,
   waits for a `postMessage` from a **trusted origin allow-list**
   (`services.leadconnectorhq.com`, `app.gohighlevel.com`)
3. `listConnectedPages()` — lists pages the sign-in authorised. Returns `scoped: true` only
   if the list could be narrowed to *this* sign-in. **If it can't, the UI must not
   auto-select a page** — on a shared workspace that would silently link someone else's page.
4. `attachSocialPage(uid, platform, accountId, page)` — records the chosen page under
   `socialAccounts.<platform>` in Firestore

**(b) Direct OAuth via n8n** — for Facebook, Instagram, LinkedIn, Gmail, Eventbrite, TikTok,
Google Ads and Meta Ads. Each has a dedicated n8n webhook that exchanges the auth code for
tokens server-side and returns a normalised profile. See
[04-n8n-automation.md](04-n8n-automation.md).

### Stage 4 — Strategy

Routes: `/strategy-home`, `/strategy`, `/competitor-intel`, `/swot-analysis`.

`MarketingStrategyPage.jsx` calls the n8n agent webhook (or `/api/run-agent` in dev) and
produces annual/quarterly/monthly plans plus campaign recommendations. The output is written
back to the Brand Knowledge Base via `appendJourneyOutput(uid, 'strategy', summary)` so later
steps have it as context.

### Stage 5 — Campaign creation

Routes: `/campaigns`, `/new-campaign`, `/campaign/:type`, `/campaign-hub`.

`src/pages/CampaignForm.jsx` is the largest file in the codebase (**4,488 lines**) and the
heart of the product. It:

1. Collects campaign inputs (type, name, description, goal, audience, dates, platforms)
2. Posts to the n8n **`/webhook/evoke-cmo`** endpoint (`WEBHOOK_URL` in `src/config.js`)
3. n8n responds immediately (acknowledgement), then generates content with Gemini and
   publishes to whichever platforms have credentials attached
4. Saves the generated items to Firestore `content_items` via `saveContentItems()`
5. For multi-day campaigns, writes days 2..N via `scheduleCampaignDays()` with
   `status: 'scheduled'` and `requiresApproval: false`

> **Why `scheduleCampaignDays` matters:** before it existed, days 2..N were posted with a
> browser `setTimeout`, which meant closing the tab cancelled the campaign. Now the rows live
> in Firestore and the n8n 15-minute scheduler picks them up headlessly.

Handoff between journey steps is defined in `src/lib/journeyHandoff.js`, which encodes the
canonical **12-step CMO journey** and per-step mappers that shape one agent's output into the
next agent's pre-fill payload.

### Stage 6 — Content & creative generation

| Route | Page | Produces |
|---|---|---|
| `/caption-suite` | CaptionSuitePage.jsx | Platform-specific social captions |
| `/reel-scripts` | ReelScriptsPage.jsx | Short-form video scripts |
| `/blog-generator` | BlogGeneratorPage.jsx | Long-form blog posts |
| `/email-composer` | EmailComposerPage.jsx | Email campaigns |
| `/content-gen` | ContentGenerationPage.jsx | Newsletters & general content |
| `/copywriting` | CopywritingAgentPage.jsx | Ad and landing-page copy |
| `/product-desc` | ProductDescription.jsx | Product descriptions |
| `/image-generator` | AIImageGeneratorPage.jsx | AI images |
| `/image-angles`, `/image-360`, `/image-seo`, `/image-lifestyle`, `/image-3d` | ImageToolPage.jsx | Product photography variants (one component, five routes) |
| `/creative-asset` | CreativeAssetPage.jsx | Banners & ad creatives |
| `/video-gen` | VideoGenerationPage.jsx | Video generation |

`src/services/bannerService.js` (353 lines) handles banner composition — it can build an
event poster on an HTML `<canvas>` locally, or call `/api/generate-banner` for a
model-generated image.

### Stage 7 — Governance & approval

- `/brand-governance` → `BrandGovernancePage.jsx` — conformance review, audit trail persisted
  by `src/services/governanceService.js`
- `/compliance-agent` → `CompliancePage.jsx`
- `/queue` → `ApprovalQueue.jsx` — reads `content_items` where `status = 'draft'`.
  Approving sets `status: 'approved'`; scheduling calls `scheduleItem()` which sets
  `status: 'scheduled'` **and** `requiresApproval: false` (a human already approved it).

### Stage 8 — Publishing

Two paths:

**Immediate publish** — `/post-content` → `PostContent.jsx` (1,307 lines) →
`publishSocialPost()` in `ghlService.js` → n8n `/webhook/evoke-social-post` →
GoHighLevel Social Planner API → the user's real accounts.

**Scheduled publish** — the n8n **Schedule Trigger fires every 15 minutes**:

```
Schedule Trigger (every 15 min)
   └─ Query Due Content       → Firestore runQuery on content_items
        └─ Has Due Items?     → IF
             └─ Split Due Items
                  └─ Map Firestore Doc to Day Payload
                       └─ Day Normalize & Flatten
                            ├─ Day Has LinkedIn?  → LinkedIn ugcPosts API
                            ├─ Day Has Instagram? → Graph API /media → /media_publish
                            ├─ Day Has Facebook?  → Graph API /photos
                            ├─ Day Has WhatsApp?  → Twilio Messages API
                            └─ Day Has SMS?       → Twilio Messages API
                                 └─ Merge Publish Results
                                      └─ Mark Content Published → Firestore PATCH
```

The final node writes back to Firestore so the item is not published twice.

### Stage 9 — Analytics & reporting

- `/analytics` → `AnalyticsDashboard.jsx`
- `/campaign-performance/:campaignId` → `CampaignPerformancePage.jsx`
- `/executive-report` → `ExecutiveReportPage.jsx`
- `/marketing-attribution` → `MarketingAttributionPage.jsx`
- `/health-score` → `MarketingHealthPage.jsx`

### Stage 10 — Paid ads (Package C)

- `/meta-ads-boost` → `MetaAdsBoost.jsx` → `metaAdsService.js` → n8n `/webhook/meta-ads-boost`
  → Meta Marketing API (creates campaign → ad set → creative → ad, in that order)
- `/hub/ads` → `AdsCenterHubPage.jsx` → `googleAdsService.js` →
  n8n `/webhook/google-ads-create-campaign` → Google Ads API v23
  (budget → campaign → ad group → keywords → ad)

---

## 6. Navigation / information architecture

Defined in `src/components/AppSidebar.jsx`. Three groups, each filtered by the user's plan:

**Primary** (follows the product journey diagram's stage order)
Dashboard → Connect Channels → AI Agents Hub → Campaigns → Campaign Execution →
Strategy → Content Studio → Creative Studio → Video Studio → Analytics → Optimization

**Growth Stack**
SEO Center · Ads Center · Social Media · Social Calendar · CRM · Audience · Automation

**Utility** (pinned to the bottom)
Reports · Asset Library · Team · Billing · Settings

Sidebar behaviour worth knowing:
- Collapsible: 260px expanded / 64px collapsed. The width is broadcast as the CSS custom
  property `--evox-sidebar-w` on `documentElement`, so any page can adapt its layout.
- Sub-items only appear when their parent section is the active page.
- Items above the user's plan are **hidden entirely**, not shown locked.

---

## 7. Design system

There is **no CSS framework**. Styling is:

1. `src/index.css` — 347 lines, defines CSS custom properties and base/reset styles
2. **Inline `style={{}}` objects** on every component — this is the dominant pattern

Two colour systems coexist in the codebase, a legacy one and the current Figma one:

| Token | Legacy (`index.css`) | Current (sidebar / wizard) |
|---|---|---|
| Background | `--bg: #070b17` / `#0e0c09` | `#0A0A0F` |
| Card | `--bg-card: #1c1a13` | `#111118` |
| Border | `rgba(255,255,255,0.06)` | `#2A2A3A` |
| Gold accent | `--gold: #c8973e` | `#BE954A` |
| Text | `--text: #f0ebe0` | `#FFFFFF` |
| Muted text | `rgba(240,235,224,0.55)` | `#9B9BB0` |

Fonts (loaded from Google Fonts in `index.html` and `index.css`):
`Inter` (body), `Syne` (legacy headings), `Outfit` (current headings), `Geist` (labels).

---

## 8. Where each kind of work happens

A quick decision table for the next developer:

| I need to change… | Go to |
|---|---|
| A route or its plan gate | `src/App.jsx` + `src/lib/planGate.js` |
| What appears in the sidebar | `src/components/AppSidebar.jsx` |
| Which plan unlocks a feature | `src/lib/planGate.js` (`FEATURE_PLAN` + `ROUTE_PLAN`) |
| How a user's data is read/written | `src/services/*.js` |
| An AI prompt for a campaign | `api/generate-campaign.js` **and** `vite.config.js` (duplicated) |
| An AI prompt for a specialist agent | `vite.config.js` `/api/run-agent` `PROMPTS` object |
| How content is published to social | The n8n workflow — **not** this repo |
| OAuth token exchange for any platform | The n8n workflow — **not** this repo |
| Environment configuration | `.env` (local) / Vercel dashboard (production) |

> ⚠️ **Prompt duplication:** the campaign prompt exists in two places — `api/generate-campaign.js`
> (production) and `vite.config.js` (dev). They are currently identical and must be edited
> together. Flagged in [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

---

[← Back to index](README.md) · [Next: Frontend Reference →](02-frontend-reference.md)
