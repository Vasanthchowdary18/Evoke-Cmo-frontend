# EVOKE AI CMO — Complete Project Documentation

> **Single-document edition.** Consolidates the full documentation set: system
> overview, frontend, backend, n8n automation, integrations, data model,
> deployment, known gaps, and a complete file index.

Complete technical documentation for the **EVOKE AI CMO** platform: frontend, backend,
and all third-party integrations.

**Prepared as a handover document.**
Repository: `evoke-cmo-frontend` · Branch documented: `vasanth-updates`
Code as of: **5 August 2026** (173 commits, 19 May 2026 → 3 Aug 2026)

---

## What this product is

EVOKE AI CMO is an **AI-powered Chief Marketing Officer** delivered as a web app. A user
signs in with their Evoke Marketplace account, describes their brand once, and the platform
then does the work a marketing department would do:

1. Builds a marketing **strategy** (annual / quarterly / monthly plans, SWOT, competitor intel)
2. Generates **campaigns** — social captions, blog posts, emails, ad copy, reel scripts
3. Generates **creative** — banners, product images, lifestyle photos, video
4. Routes everything through an **approval queue**
5. **Publishes** to the user's real Facebook / Instagram / LinkedIn / TikTok / Threads /
   Google Business accounts, plus WhatsApp, SMS and email
6. Reports back with **analytics** and an **executive report**

Roughly **100 routes**, **75 pages**, **20 components**, **14 service modules**,
**7 backend API routes**, and one **230-node n8n workflow** carrying the publishing
and OAuth work.

---

---

## The 30-second architecture

```
                      ┌──────────────────────────────────────┐
                      │  Browser — React 18 SPA (Vite build) │
                      │  cmo.evokemarketplace.com (Vercel)   │
                      └───────┬───────────┬──────────┬───────┘
                              │           │          │
          ┌───────────────────┘           │          └──────────────────┐
          │                               │                            │
          ▼                               ▼                            ▼
┌──────────────────┐        ┌──────────────────────┐      ┌────────────────────────┐
│ Firebase         │        │ Vercel Functions     │      │ n8n Cloud (self-host)  │
│  · Firestore DB  │        │  /api/generate       │      │  25 webhooks           │
│  · Auth (custom  │        │  /api/generate-*     │      │  1 × 15-min scheduler  │
│    token)        │        │  /api/send-email     │      │  230 nodes             │
│  · Storage       │        │  /api/eventbrite     │      └───────────┬────────────┘
└──────────────────┘        │  /api/brand-kb       │                  │
          ▲                 └──────────┬───────────┘                  │
          │                            │                              ▼
          │                            ▼                 ┌────────────────────────┐
          │                 ┌────────────────────┐       │ GoHighLevel  (social)  │
          │                 │ Groq  · Gemini     │       │ Meta Graph   (FB/IG)   │
          │                 │ OpenAI · Resend    │       │ LinkedIn API           │
          │                 │ Pollinations       │       │ Google Ads · Twilio    │
          │                 └────────────────────┘       │ Eventbrite · Gmail     │
          │                                              └───────────┬────────────┘
          └──────────────── scheduler writes back ───────────────────┘
                            (marks content published)

  Identity: Evoke SSO @ accounts.evokemarketplace.com
            → `evoke_user` cookie on .evokemarketplace.com
            → app uid = "sso_<custID>"
```

---

## Quick start for the next developer

```bash
npm install
```

Copy `.env` from the current maintainer (it is **not** in git — see
[Part 7](#part-7--environment--deployment) for the
complete list of required keys), then:

```bash
npm run dev
```

The app runs on **http://localhost:3007**.

> On `localhost` the app auto-signs-in as a hard-coded dev profile and **all plan gates are
> bypassed**, so every page is reachable without a real Evoke SSO session. See
> [Part 1 § Local development bypasses](#local-development-bypasses).

---

## Document conventions

- File paths are relative to the repository root.
- "n8n" always refers to the single hosted workflow `EVOKE Cmo`
  (file: `EVOKE-CMO-v21-GHL.json`).
- **No secret values appear anywhere in this documentation.** Only variable *names* are
  listed. Where secrets are currently hard-coded in source, that fact is flagged in
  [Part 8](#part-8--known-gaps--risks) without reproducing the value.

---

## Table of Contents

### [Part 1 — System Overview](#part-1--system-overview)
- [1. What the system does](#1-what-the-system-does)
- [2. Technology stack](#2-technology-stack)
- [3. Repository layout](#3-repository-layout)
- [4. Authentication — how a user gets in](#4-authentication--how-a-user-gets-in)
- [5. The complete user journey, start to finish](#5-the-complete-user-journey-start-to-finish)
- [6. Navigation / information architecture](#6-navigation--information-architecture)
- [7. Design system](#7-design-system)
- [8. Where each kind of work happens](#8-where-each-kind-of-work-happens)

### [Part 2 — Frontend Reference](#part-2--frontend-reference)
- [1. Entry points](#1-entry-points)
- [2. Global styling — `src/index.css`](#2-global-styling--srcindexcss)
- [3. Routing — `src/App.jsx`](#3-routing--srcappjsx)
- [4. Complete route table](#4-complete-route-table)
- [5. Components (`src/components/`)](#5-components-srccomponents)
- [6. Hooks (`src/hooks/`)](#6-hooks-srchooks)
- [7. Libraries (`src/lib/`)](#7-libraries-srclib)
- [8. Services (`src/services/`)](#8-services-srcservices)
- [9. Pages (`src/pages/`)](#9-pages-srcpages)
- [10. Configuration modules](#10-configuration-modules)

### [Part 3 — Backend Reference](#part-3--backend-reference)
- [Layer 1 — Vercel Functions (`api/`)](#layer-1--vercel-functions-api)
- [Layer 2 — Vite dev middleware (`vite.config.js`)](#layer-2--vite-dev-middleware-viteconfigjs)
- [Layer 3 — n8n](#layer-3--n8n)
- [Deployment configuration — `vercel.json`](#deployment-configuration--verceljson)
- [Request-flow summary](#request-flow-summary)

### [Part 4 — n8n Automation Backend](#part-4--n8n-automation-backend)
- [1. Complete webhook index](#1-complete-webhook-index)
- [2. Social OAuth flows (6 webhooks)](#2-social-oauth-flows-6-webhooks)
- [3. The main campaign engine — `evoke-cmo`](#3-the-main-campaign-engine--evoke-cmo)
- [4. The AI agents endpoint — `evoke-agents`](#4-the-ai-agents-endpoint--evoke-agents)
- [5. GoHighLevel integration (7 webhooks)](#5-gohighlevel-integration-7-webhooks)
- [6. Paid ads (5 webhooks)](#6-paid-ads-5-webhooks)
- [7. Messaging webhooks (3)](#7-messaging-webhooks-3)
- [8. The scheduled publisher — the most important flow](#8-the-scheduled-publisher--the-most-important-flow)
- [9. Credential storage strategy](#9-credential-storage-strategy)
- [10. Operating the workflow](#10-operating-the-workflow)

### [Part 5 — Third-Party Integrations](#part-5--third-party-integrations)
- [Integration status at a glance](#integration-status-at-a-glance)
- [1. Evoke SSO — identity](#1-evoke-sso--identity)
- [2. Firebase — the primary data layer](#2-firebase--the-primary-data-layer)
- [3. GoHighLevel — the social publishing engine](#3-gohighlevel--the-social-publishing-engine)
- [4. Meta — Facebook, Instagram, WhatsApp, Ads](#4-meta--facebook-instagram-whatsapp-ads)
- [5. LinkedIn](#5-linkedin)
- [6. Twilio — WhatsApp & SMS](#6-twilio--whatsapp--sms)
- [7. AI providers](#7-ai-providers)
- [8. Google Ads](#8-google-ads)
- [9. Eventbrite](#9-eventbrite)
- [10. TikTok](#10-tiktok)
- [11. Email](#11-email)
- [12. Payments](#12-payments)
- [13. Supabase — built, then rolled back](#13-supabase--built-then-rolled-back)
- [14. EGT — Evoke Gratitude Token (blockchain)](#14-egt--evoke-gratitude-token-blockchain)
- [15. Analytics & media](#15-analytics--media)
- [16. Not integrated — but presented in the UI](#16-not-integrated--but-presented-in-the-ui)

### [Part 6 — Data Model](#part-6--data-model)
- [Firestore collection map](#firestore-collection-map)
- [`users/{uid}` — the central document](#usersuid--the-central-document)
- [`content_items/{itemId}` — generated content](#content_itemsitemid--generated-content)
- [`users/{uid}/contacts/{contactId}` — CRM](#usersuidcontactscontactid--crm)
- [`users/{uid}/teamMembers/{memberId}` — Team](#usersuidteammembersmemberid--team)
- [`users/{uid}/teamInvites/{inviteId}` — Invitations](#usersuidteaminvitesinviteid--invitations)
- [`users/{uid}/inboxThreads/{threadId}` — Social Inbox replies](#usersuidinboxthreadsthreadid--social-inbox-replies)
- [`governance_audit_log/{entryId}` — Brand Governance audit trail](#governance_audit_logentryid--brand-governance-audit-trail)
- [Firestore security rules](#firestore-security-rules)
- [Supabase Postgres schema (not live)](#supabase-postgres-schema-not-live)

### [Part 7 — Environment & Deployment](#part-7--environment--deployment)
- [1. Prerequisites](#1-prerequisites)
- [2. Local development](#2-local-development)
- [3. Environment variables](#3-environment-variables)
- [4. Deployment — frontend (Vercel)](#4-deployment--frontend-vercel)
- [5. Deployment — n8n](#5-deployment--n8n)
- [6. Firebase setup](#6-firebase-setup)
- [7. Post-deployment verification checklist](#7-post-deployment-verification-checklist)
- [8. Troubleshooting](#8-troubleshooting)

### [Part 8 — Known Gaps & Risks](#part-8--known-gaps--risks)
- [Severity summary](#severity-summary)
- [🔴 High severity](#high-severity)
- [🟠 Medium severity](#medium-severity)
- [🟡 Low severity](#low-severity)
- [Features presented in the UI without a real data source](#features-presented-in-the-ui-without-a-real-data-source)
- [Architectural constraints worth understanding before changing anything](#architectural-constraints-worth-understanding-before-changing-anything)
- [Recommended priority order for the next developer](#recommended-priority-order-for-the-next-developer)
- [What is genuinely working well](#what-is-genuinely-working-well)

### [Part 9 — Complete File Index](#part-9--complete-file-index)
- [Root](#root)
- [`api/` — Backend (Vercel functions)](#api--backend-vercel-functions)
- [`src/` — Entry points & config](#src--entry-points--config)
- [`src/components/` — 20 shared components](#srccomponents--20-shared-components)
- [`src/hooks/` — 4 hooks](#srchooks--4-hooks)
- [`src/lib/` — 12 logic modules](#srclib--12-logic-modules)
- [`src/services/` — 14 data-access modules](#srcservices--14-data-access-modules)
- [`src/pages/` — 75 pages](#srcpages--75-pages)
- [`public/` — Static assets](#public--static-assets)
- [`docs-internal/` — Internal specs (git-ignored)](#docs-internal--internal-specs-git-ignored)
- [`docs/` — This documentation](#docs--this-documentation)
- [External artifacts (not in the repository)](#external-artifacts-not-in-the-repository)
- [Handover checklist](#handover-checklist)


---

# Part 1 — System Overview


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
[Part 4](#part-4--n8n-automation-backend).

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
> together. Flagged in [Part 8](#part-8--known-gaps--risks).

---

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 2 — Frontend Reference


Complete reference for everything under `src/` — **54,561 lines** across 118 files.

---


## 1. Entry points

### `index.html` (repo root)
The HTML shell Vite builds against.

- Sets `<meta name="color-scheme" content="dark">` — the app is dark-mode only.
- Preconnects to Google Fonts and loads **Inter** (weights 300–900).
- Injects the **Google Ads gtag** tracking script (conversion ID `AW-18246572299`).
- Mounts `<div id="root">` and loads `/src/main.jsx` as an ES module.

### `src/main.jsx`
Ten lines. Creates the React 18 root, wraps `<App />` in `<React.StrictMode>`, imports
`./index.css`. Nothing else happens here.

---

## 2. Global styling — `src/index.css`

**347 lines. The only stylesheet in the project.** Everything else is inline styles.

Structure:

| Section | Contents |
|---|---|
| `@import` | Google Fonts — Syne (700/800) + Inter (300–900) |
| Reset | `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }` |
| `:root` custom properties | Colour, radius and transition tokens (see table below) |
| Base elements | `html` (smooth scroll, `overflow-x: clip`), `body` (Inter, dark bg, antialiased) |
| Scrollbar | 5px wide, gold thumb (`rgba(200,151,62,0.3)`), darker track |
| Selection | `::selection { background: rgba(200,151,62,0.2) }` |
| Utility classes | Layout, card, button and animation helpers used across pages |

### CSS custom properties defined in `:root`

```css
/* Core backgrounds */
--bg: #070b17;  --bg-alt: #0b0a07;  --bg-card: #1c1a13;
--bg-surface: #211f17;  --bg-hover: #252318;

/* Gold accent */
--gold: #c8973e;  --gold-light: #d4a853;
--gold-dim: rgba(200,151,62,0.13);  --gold-border: rgba(200,151,62,0.22);

/* Text ramp */
--text: #f0ebe0;
--text-2: rgba(240,235,224,0.55);
--text-3: rgba(240,235,224,0.32);
--text-4: rgba(240,235,224,0.16);

/* Borders */
--border: rgba(255,255,255,0.06);  --border-warm: rgba(200,151,62,0.18);

/* Radii */
--r-sm: 8px;  --r-md: 12px;  --r-lg: 16px;  --r-xl: 20px;  --r-pill: 100px;

/* Transition */
--t: all 0.2s ease;
```

### One runtime-set custom property

`--evox-sidebar-w` is set on `document.documentElement` by `AppSidebar.jsx` whenever the
sidebar expands or collapses (260px ↔ 64px). Pages read it to offset their own content.

> **Note on the two palettes.** `index.css` holds the original warm/gold palette
> (`#0e0c09` / `#c8973e`). The newer Figma-derived screens (sidebar, onboarding wizard,
> hub pages) use a cooler set (`#0A0A0F` / `#111118` / `#BE954A` / `#2A2A3A`) declared
> inline as local constants rather than as CSS variables. Both are live. Unifying them is
> listed in [Part 8](#part-8--known-gaps--risks).

---

## 3. Routing — `src/App.jsx`

237 lines. Responsibilities:

1. **Imports all 75 page components** statically (no lazy loading / code splitting).
2. Defines the `G(plan, name, Comp)` helper — wraps a page in `<PlanGate>` (see below).
3. Defines `IS_LOCAL` — used to hide dev-only routes in production.
4. Contains `EvokeAuthHandler` — the Firebase custom-token sign-in path (see
   [Part 1 § Authentication](#4-authentication--how-a-user-gets-in)).
5. Renders the component tree (see below).

The `G()` plan-gate helper:

```jsx
function G(plan, name, Comp) {
  return <PlanGate requiredPlan={plan} featureName={name}><Comp /></PlanGate>
}
```

The rendered tree:

```
<BrowserRouter future={{ v7_startTransition, v7_relativeSplatPath }}>
  <AuthProvider>
    <Routes> … ~100 routes … </Routes>
    <Chatbot />          ← global, present on every page
  </AuthProvider>
</BrowserRouter>
```

**Catch-all:** `<Route path="*" element={<Navigate to="/" replace />} />`

---

## 4. Complete route table

### Public / unauthenticated

| Route | Component | Notes |
|---|---|---|
| `/` | `Landing.jsx` | Marketing home page |
| `/signin` | `SignIn.jsx` | Legacy — redirects to the Evoke accounts portal |
| `/privacy` | `Privacy.jsx` | Privacy policy |
| `/terms` | `Terms.jsx` | Terms of service |

### Redirects (retired routes kept alive so old links don't 404)

| Route | Redirects to | Why retired |
|---|---|---|
| `/onboarding` | `/brand-profile` | Legacy chat-wizard chain superseded by `OnboardingWizard` |
| `/setup` | `/brand-profile` | Same |
| `/cmo` | `/dashboard` | Legacy CMO command centre |
| `/hub/:agent` | `/agents-hub` | Old function-grouped hub (retired 2026-07-27) |
| `/strategy-hub` | `/strategy-home` | Superseded by the sidebar-linked page (retired 2026-07-27) |
| `/executive-reporting` | `/executive-report` | Was a duplicate page on hardcoded mock data (retired 2026-07-17) |

### Free tier

| Route | Component |
|---|---|
| `/dashboard` | `DashboardPage.jsx` |
| `/strategy-home` | `StrategyHome.jsx` |
| `/strategy` | `MarketingStrategyPage.jsx` |
| `/competitor-intel` | `CompetitorIntelPage.jsx` |
| `/swot-analysis` | `SwotAnalysisPage.jsx` |
| `/content-studio` | `ContentStudioHubPage.jsx` |
| `/hub/creative` | `CreativeStudioHubPage.jsx` |
| `/agents-hub` | `AgentsHub.jsx` |
| `/agent/:type` | `CmoAgentOverviewPage.jsx` |
| `/brand-profile` | `BrandProfilePage.jsx` |
| `/health-score` | `MarketingHealthPage.jsx` |
| `/campaign/:type` | `CampaignForm.jsx` |
| `/results` | `Results.jsx` |
| `/tokens` | `Tokens.jsx` |
| `/purchase` | `Purchase.jsx` |
| `/products` | `ProductsPage.jsx` |
| `/eventbrite-post` | `EventbritePost.jsx` |

### Plans & packages (always accessible, ungated)

`/plans` · `/pricing` · `/free-plan` · `/package-a` · `/package-b` · `/package-c`

### Package A — Creative & Content

| Route | Component | Gate label |
|---|---|---|
| `/caption-suite` | `CaptionSuitePage.jsx` | Caption Suite |
| `/reel-scripts` | `ReelScriptsPage.jsx` | Reel Scripts |
| `/content-gen` | `ContentGenerationPage.jsx` | Content Generation |
| `/copywriting` | `CopywritingAgentPage.jsx` | Copywriting Agent |
| `/product-desc` | `ProductDescription.jsx` | Product Description |
| `/blog-generator` | `BlogGeneratorPage.jsx` | Blog Generator |
| `/email-composer` | `EmailComposerPage.jsx` | Email Composer |
| `/image-generator` | `AIImageGeneratorPage.jsx` | AI Image Generator |
| `/image-angles` | `ImageToolPage.jsx` | Product Image Angles |
| `/image-360` | `ImageToolPage.jsx` | 360° Product Video |
| `/image-seo` | `ImageToolPage.jsx` | SEO Product Images |
| `/image-lifestyle` | `ImageToolPage.jsx` | Lifestyle Photos |
| `/creative-asset` | `CreativeAssetPage.jsx` | Creative Assets |
| `/video-gen` | `VideoGenerationPage.jsx` | Video Generation |
| `/hub/video-studio` | `VideoStudioHubPage.jsx` | Video Studio |
| `/brand-kb` | `BrandKnowledgeBase.jsx` | Brand Knowledge Base |
| `/kpi-recommendations` | `KpiRecommendationsPage.jsx` | KPI Recommendations |

> Note: `ImageToolPage.jsx` serves **five** routes. It switches behaviour off the pathname.

### Package B — AI Agents + Social

| Route | Component |
|---|---|
| `/campaigns` | `CampaignsPage.jsx` |
| `/new-campaign` | `NewCampaignWizardPage.jsx` |
| `/campaign-performance/:campaignId` | `CampaignPerformancePage.jsx` |
| `/email-marketing` | `EmailMarketingPage.jsx` |
| `/seo-agent` | `SeoAgentPage.jsx` |
| `/hub/seo` | `SeoIntelligenceCenterPage.jsx` |
| `/ab-testing` | `ABTestingPage.jsx` |
| `/marketing-attribution` | `MarketingAttributionPage.jsx` |
| `/audience-builder` | `AudienceBuilder.jsx` |
| `/trends` | `TrendAnalysis.jsx` |
| `/crm` | `CrmPage.jsx` |
| `/analytics` | `AnalyticsDashboard.jsx` |
| `/executive-report` | `ExecutiveReportPage.jsx` |
| `/campaign-hub` | `CampaignHub.jsx` |
| `/connect-accounts` | `ConnectAccounts.jsx` |
| `/queue` | `ApprovalQueue.jsx` |
| `/post-content` | `PostContent.jsx` |
| `/inbox` | `SocialInbox.jsx` |
| `/brand-governance` | `BrandGovernancePage.jsx` |
| `/hub/social` | `SocialMediaManagerPage.jsx` |
| `/social-calendar` | `SocialCalendarPage.jsx` |
| `/image-3d` | `ImageToolPage.jsx` |

### Package C — Paid Ads & Full Deploy

| Route | Component |
|---|---|
| `/meta-ads-boost` | `MetaAdsBoost.jsx` |
| `/hub/ads` | `AdsCenterHubPage.jsx` |
| `/execution` | `MarketingExecutionPage.jsx` |
| `/team` | `TeamManagement.jsx` |
| `/partner-sharing` | `PartnerSharing.jsx` |
| `/compliance-agent` | `CompliancePage.jsx` |
| `/ai-cfo` `/ai-cto` `/ai-ceo` `/ai-cro` | `CSuitePage.jsx` (all four) |

### Localhost-only

| Route | Component | Production behaviour |
|---|---|---|
| `/dev-reset` | `DevResetPage.jsx` | Redirects to `/` |
| `/supabase-test` | `SupabaseTestPage.jsx` | Redirects to `/` |

> ⚠️ **Route/gate drift:** `App.jsx` gates `/image-3d` at `package-b`, but `ROUTE_PLAN` in
> `planGate.js` and `FEATURE_PLAN.image_3d` disagree with each other. `App.jsx` is what
> actually runs. See [Part 8](#part-8--known-gaps--risks).

---

## 5. Components (`src/components/`)

20 files.

### Layout & navigation

| File | Lines | Purpose |
|---|---|---|
| **`AppSidebar.jsx`** | 372 | The main app navigation. Three plan-filtered groups (Primary / Growth Stack / Utility), collapsible 260↔64px, portalled account dropdown with plan badge + trial countdown + logout. Broadcasts `--evox-sidebar-w`. Exports internal `NavItem` and `MenuRow` sub-components. |
| **`SidebarLayout.jsx`** | — | Wrapper that renders `AppSidebar` plus a content area offset by the sidebar width. Used by ~23 pages. |
| **`Navbar.jsx`** | 444 | Top navigation for public/marketing pages and the plan-gate screen. |
| **`ToolTopBar.jsx`** | — | Compact page header for tool pages (title, back link, actions). |
| **`StrategyTopBar.jsx`** | — | Variant of the top bar used by the strategy section. |
| **`JourneyFooter.jsx`** | — | Renders the 12-step CMO journey progress strip. Mirrors `JOURNEY_STEPS` in `lib/journeyHandoff.js`. |

### Authentication & access control

| File | Lines | Purpose |
|---|---|---|
| **`AuthProvider.jsx`** | 26 | Creates `AuthContext`. Calls `useEvokeSession()`, maps the profile through `profileToUser()`, memoises `{ profile, status, user }`. Also renders `OAuthCallbackHandler` so callbacks are handled app-wide. |
| **`OAuthCallbackHandler.jsx`** | — | Detects OAuth return parameters in the URL and completes the connection flow. Mounted globally inside `AuthProvider`. |
| **`PlanGate.jsx`** | 213 | Blocks a page when the user's plan is too low. Renders the real page **blurred** behind a lock card showing the required plan, its price, and its feature highlights, with an upgrade CTA (Stripe link if configured, otherwise the package page). Bypassed entirely on localhost (`IS_DEV`) and controllable via the `PLAN_GATES_ENABLED` flag (currently `true`, re-enabled 2026-08-04). Holds `PLAN_PRICES` ($30 / $100 / Custom) and `STRIPE_LINKS`. |
| **`UpgradeModal.jsx`** | — | Inline upgrade prompt for gated actions inside an otherwise-accessible page. |

### Onboarding

| File | Lines | Purpose |
|---|---|---|
| **`OnboardingWizard.jsx`** | 588 | **The live onboarding flow.** Six steps: Cognitive System Tuning → Brand System Definition → Connect System API → Marketing Plan Tuning → Neural Network Ingestion → Cognitive Audit Report. Holds `INDUSTRY_OPTIONS`, `PORTFOLIO_OPTIONS`, `VOICE_OPTIONS`, `VALUE_TAGS`, `INTEGRATIONS` (10 toggles), `GOAL_OPTIONS`, `AGENT_OPTIONS`, and `PLAN_KEY_MAP` (maps PricingPage keys → internal plan keys). Writes to Firestore on finish. |
| **`BrandSetupModal.jsx`** | 525 | Modal variant of brand setup. Also exports **`getRecommendations()`**, which `OnboardingWizard` imports — so this file is a dependency even where the modal itself isn't shown. |
| **`OnboardingModal.jsx`** | 684 | Legacy chat-style onboarding modal. Superseded by `OnboardingWizard`; kept for the retired flow. |
| **`ProductTour.jsx`** | — | First-visit guided tour. Anchors to `data-tour` attributes on sidebar items (`nav-connect-channels`, `nav-agents-hub`, `nav-campaigns`, `nav-campaign-execution`). Persists dismissal via `markTourSeen()`. |

### Feature components

| File | Lines | Purpose |
|---|---|---|
| **`BannerGenerator.jsx`** | 452 | UI for AI banner generation — prompt input, provider selection, preview, download. Backed by `services/bannerService.js`. |
| **`EventBannerGenerator.jsx`** | — | Event-specific banner variant (date/time/venue/QR overlays). |
| **`Chatbot.jsx`** | 480 | Floating assistant rendered on **every page** (mounted in `App.jsx` outside `<Routes>`). Calls the AI generation endpoint for answers. |
| **`ProductLaunchModal.jsx`** | 498 | Guided product-launch campaign builder. |
| **`LoadingSpinner.jsx`** | — | Shared loading indicator. |

### EGT token / wallet (Evoke Gratitude Token)

| File | Lines | Purpose |
|---|---|---|
| **`EgtWalletHeader.jsx`** | 360 | Displays the user's EGT wallet balance in the header. Reads the wallet address from the SSO cookie and the balance from an on-chain RPC endpoint. |
| **`GratitudeToken.jsx`** | — | EGT token display/award component. |

---

## 6. Hooks (`src/hooks/`)

| File | Exports | Purpose |
|---|---|---|
| **`useAuth.js`** | `useAuth()` | Reads `AuthContext`. Returns `{ profile, status, user }`. **The hook every page should use** to get the current user. |
| **`useEvokeSession.js`** | `useEvokeSession()` | The SSO session engine. Subscribes to the `evoke_user` cookie via `useSyncExternalStore`, bootstraps from the backend once, and falls back to the hard-coded `DEV_PROFILE` on localhost. Returns `{ profile, status }` where status is `'loading' \| 'authenticated' \| 'unauthenticated'`. |
| **`useRequireAuth.js`** | `useRequireAuth()` | Redirects to the accounts portal if the user isn't authenticated. |
| **`useUserPlan.js`** | `useUserPlan()` | Fetches the user's plan from Firestore (`userPlan` ?? `selectedPlan` ?? `'free'`) and computes `trialDaysLeft` from `trialStartedAt` against a 14-day `TRIAL_DAYS` constant. Returns `{ plan, loading, trialDaysLeft }`. |

---

## 7. Libraries (`src/lib/`)

Pure logic — no React rendering except where noted.

| File | Exports | Purpose |
|---|---|---|
| **`session.js`** (397 lines) | `EVOKE_SESSION_EVENT`, `subscribeSession`, `decodeJwtPayload`, `getEvokeUser`, `getEvokeUserProfile`, `getEvokeUserProfileSnapshot`, `isLoggedIn`, `buildAccountsLoginUrl`, `setLoggedInData`, `clearLoggedInData`, `establishAuthSessionFromOAuthPayload`, `fetchSessionFromBackend`, `signOut` | **The cross-domain SSO layer.** Reads/writes the `evoke_user` cookie at `.evokemarketplace.com`, decodes the JWT to compute cookie max-age, caches the parsed profile so `useSyncExternalStore` doesn't thrash, tracks a sign-out marker with a 5-minute grace period, and handles best-effort backend sign-out with a 4s timeout. Mirrors the same file in `converters_frontend` and `evoke_auth`. |
| **`authUtils.js`** | `profileToUser`, `redirectToLogin` | Maps an SSO profile to `{ uid, displayName, email, custID, token, firstName, lastName }`. **`uid = 'sso_' + custID`** (falls back to email). |
| **`planGate.js`** (177 lines) | `PLANS`, `PLAN_LABELS`, `PLAN_COLORS`, `PLAN_TAGS`, `FEATURE_PLAN`, `canAccess`, `requiredPlanFor`, `upgradeLabel`, `PLAN_HIGHLIGHTS`, `ROUTE_PLAN` | The plan/feature matrix. `PLANS` is ordered (`free` → `package-a` → `package-b` → `package-c`) and access is an index comparison, which makes plans cumulative. `FEATURE_PLAN` maps ~25 feature keys to plans; `ROUTE_PLAN` maps routes to plans; `PLAN_HIGHLIGHTS` drives the upgrade card copy. |
| **`journeyHandoff.js`** | `JOURNEY_STEPS`, `mapStrategyTypeToCampaignHub`, `strategyToCampaignHub`, `audienceToCaptionSuite`, `captionSuiteToCreativeAsset` | The **canonical 12-step CMO journey** plus mappers that shape one agent's output into the next agent's pre-fill payload. Extend `JOURNEY_STEP_MAPPERS` as more hops are wired. |
| **`recommendations.jsx`** | `getRecommendedActions` | Scores a pool of suggested next actions against the Brand Knowledge Base (industry, audience type, objectives) and returns the top N. Industry-aware — e-commerce gets product/visual suggestions, B2B gets email-drip/LinkedIn. Shared by the Dashboard and the Brand KB completion screen so recommendations are identical in both. Returns JSX icons, hence `.jsx`. |
| **`campaignPrefill.js`** | `buildCampaignPrefill` | Builds pre-filled campaign form values from prior context. |
| **`swot.jsx`** | `parseSwot`, `SwotGrid`, `timeAgo` | Parses SWOT text output into structured quadrants and renders the grid. |
| **`apiAuth.js`** | `authedFetch` | Calls the Supabase-backed Node API routes. Attaches a Firebase ID token as `Authorization: Bearer` when available; on localhost falls back to passing the plain `uid` (mirrors `api/_lib/verifyUser.js`). For `GET`, appends `?uid=`; for others, merges `uid` into the JSON body. |
| **`supabaseClient.js`** | `supabase` | Browser Supabase client built from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. |
| **`gtag.js`** | `gtagEvent`, `trackPurchase`, `trackSignup` | Google Ads conversion tracking wrappers around the global `gtag`. |
| **`evokeUserCookie.js`** | `readEvokeUserWalletAddressFromDocument` | Extracts the EGT wallet address from the SSO cookie. |
| **`egtRewardPoolBalance.js`** | (balance reader) | Reads the EGT reward-pool balance from the configured RPC endpoint. |
| **`formatEgtBalance.js`** | `formatEgtBalanceDisplay` | Formats an EGT balance for display. |

---

## 8. Services (`src/services/`)

The data-access layer. **Pages should not talk to Firestore or n8n directly — they go through here.**

### `userService.js` — user profile, tokens, social accounts

| Function | Purpose |
|---|---|
| `getOrCreateUser(uid, displayName, email)` | Fetches `users/{uid}`; creates it with defaults on first login (zeroed `tokenBalance`, empty `socialAccounts` for facebook/instagram/linkedin/twitter/whatsapp/gmail, `onboardingComplete: false`) |
| `saveChatOnboardingData(uid, data)` | Saves chat-onboarding answers. Does **not** mark onboarding complete |
| `saveOnboardingData(uid, data)` | Saves answers **and** sets `onboardingComplete: true` |
| `saveSelectedPlan(uid, planKey)` | Writes both `selectedPlan` and `userPlan` |
| `markTourSeen(uid)` | Sets `productTourSeen: true` |
| `getUserData(uid)` | Returns the full user document or `null` |
| `getTokenBalance(uid)` | Returns `tokenBalance` (default 0) |
| `addTokens(uid, amount)` | Firestore `increment(amount)` — used after purchase |
| `deductToken(uid)` | Throws `'Insufficient tokens'` if balance < 1, else `increment(-1)` |
| `saveSocialAccount(uid, platform, accountData)` | Writes `socialAccounts.<platform>` with `connected: true` |
| `disconnectSocialAccount(uid, platform)` | Sets `socialAccounts.<platform> = { connected: false }` |
| `getSocialAccounts(uid)` | Returns the whole `socialAccounts` map |
| `TOKEN_PACKAGES` (const) | Three purchasable packs: Starter 10/$9.99, Growth 20/$17.99, Pro 35/$24.99 |

### `contentService.js` — the `content_items` collection

| Function | Purpose |
|---|---|
| `saveContentItems(userId, campaignMeta, items, status)` | Batch-writes generated items in one Firestore commit. Returns `{ [key]: docId }` so callers can update them later |
| `scheduleCampaignDays(userId, campaignId, campaignMeta, dayPayloads)` | Writes one row per campaign day 2..N with `status: 'scheduled'`, `requiresApproval: false`, and a real `scheduledAt`. **This is what the n8n cron queries.** Replaced the old browser-`setTimeout` approach that died when the tab closed |
| `updateContentItem(id, data)` | Patches any fields + stamps `updatedAt` |
| `markItemsPublished(ids, finalTexts)` | Batch-marks published; `finalTexts` persists user edits made between generation and launch |
| `setItemStatus(id, status, extra)` | Status transition; auto-sets `publishedAt` when status is `'published'` |
| `scheduleItem(id, scheduledAt)` | Sets `status: 'scheduled'` **and** `requiresApproval: false` (a human already approved it in `/queue`) |
| `getContentItems(userId, status?)` | Fetches the library, sorted newest-first **client-side** to avoid needing a composite Firestore index |

### `ghlService.js` — GoHighLevel social publishing (**the live social path**)

| Export | Purpose |
|---|---|
| `GHL_PLATFORMS` | `['facebook','instagram','linkedin','tiktok','threads','google']` |
| `getGhlAccount(uid)` | Returns the user's GHL location, or `null` |
| `ensureGhlLocation(uid, profile)` | Tries to provision a **dedicated** sub-account via n8n; on failure falls back to `SHARED_LOCATION_ID`. Safe to call on every login |
| `startSocialConnect(uid, platform)` | Gets an OAuth start URL from n8n, opens a popup, resolves on `postMessage` from a **trusted origin allow-list**, then lists authorised pages |
| `attachSocialPage(uid, platform, accountId, page)` | Records the chosen page under `socialAccounts.<platform>` with `viaGhl: true` and `ghlAccountId: page.originId` |
| `disconnectSocial(uid, platform)` | Clears the connection |
| `publishSocialPost(uid, { platforms, caption, mediaUrls, scheduleDate })` | Resolves each platform's `ghlAccountId`, then POSTs to n8n `/webhook/evoke-social-post`. Omit `scheduleDate` to publish immediately |

Two safety behaviours worth preserving:
- **Trusted popup origins** — `postMessage` is only accepted from
  `services.leadconnectorhq.com` and `app.gohighlevel.com`.
- **`scoped` flag** — `listConnectedPages()` returns `scoped: true` only when the page list
  could be narrowed to the account that just signed in. When `false`, the UI must **not**
  auto-select; on the shared workspace that would silently link another user's page.

### `metaAdsService.js` / `googleAdsService.js` — paid ads

| Service | Functions |
|---|---|
| `metaAdsService.js` | `getMetaAdsAccount`, `connectMetaAdsCallback`, `disconnectMetaAds`, `createMetaAdsBoost` — plus `META_ADS_OAUTH_WEBHOOK`, `META_ADS_BOOST_WEBHOOK` |
| `googleAdsService.js` | `getGoogleAdsAccount`, `createGoogleAdsCampaign`, `getGoogleAdsMetrics`, `extractAdsContent` — plus `GOOGLE_ADS_CREATE_WEBHOOK`, `GOOGLE_ADS_METRICS_WEBHOOK` |

### Remaining services

| File | Exports | Purpose |
|---|---|---|
| **`knowledgeBaseService.js`** | `getKnowledgeBase`, `saveKnowledgeBase`, `appendJourneyOutput` | Brand Knowledge Base persistence. Stores it as a **nested `knowledgeBase` field on `users/{uid}`**, not a subcollection — deliberately, to avoid subcollection permission issues. `appendJourneyOutput(uid, step, summary)` records each journey step's output keyed by step name. **Note the header comment:** a Supabase-backed version was built and then reverted on 2026-08-04 |
| **`bannerService.js`** (353 lines) | `generateEventPosterWithCanvas`, `generateBanner`, `downloadBanner`, `sanitizeBannerFilename` | Banner generation — either composed locally on an HTML `<canvas>` or generated by calling `/api/generate-banner` |
| **`crmService.js`** | `calcScore`, `getContacts`, `addContact`, `updateContact`, `deleteContact` | CRM contacts at `users/{uid}/contacts/{contactId}`. `calcScore` computes a lead score |
| **`teamService.js`** | `getMembers`, `ensureOwnerMember`, `addMember`, `updateMemberRole`, `removeMember`, `getInvites`, `createInvite`, `resendInvite`, `cancelInvite` | Team management at `users/{uid}/teamMembers/{memberId}`. Roles: `owner \| admin \| editor \| viewer` |
| **`governanceService.js`** | `saveAuditEntry`, `getAuditLog` | Firestore-backed audit trail for the Brand Governance Agent, so decisions survive a reload instead of living only in React state |
| **`socialInboxService.js`** | `saveThreadReply`, `getSavedThreads` | Persists **replies only**. There is no live social message source wired in — `SocialInbox.jsx` shows example threads as the base data, and this service layers the user's real replies on top |
| **`eventService.js`** | `buildEventSlug`, `saveEventPage`, `getEventPage`, `generateEventHtml`, `downloadEventHtml` | Event landing-page generation and hosting |
| **`emailService.js`** | `sendEmail` | Thin client for `/api/send-email` (Resend) |
| **`qrCodeService.js`** | `generateQRCode`, `addQRCodeToCanvas` | QR codes via the free QR Server API — no key required. Used to overlay registration links on event banners |

---

## 9. Pages (`src/pages/`)

75 files. Grouped by function; line counts shown for the substantial ones.

### Public & marketing

| File | Lines | Purpose |
|---|---|---|
| `Landing.jsx` | 4,392 | Public marketing home page. Includes a large inline dashboard mockup section built to a Figma spec |
| `PricingPage.jsx` | 1,588 | Four-tier pricing page. Its plan keys map to internal keys via `PLAN_KEY_MAP` in `OnboardingWizard.jsx` |
| `PlansPage.jsx` | 392 | Plan comparison/selection |
| `FreePlanPage.jsx`, `PackageAPage.jsx`, `PackageBPage.jsx` (801), `PackageCPage.jsx` (665) | — | Per-tier detail pages. `PackageBPage` documents its own scope: Content Production + Video Creation + 30-Day Planning |
| `Privacy.jsx`, `Terms.jsx` | — | Legal pages |
| `SignIn.jsx` | — | Legacy route; redirects to the Evoke accounts portal for SSO |

### Onboarding & brand

| File | Lines | Purpose |
|---|---|---|
| `BrandProfilePage.jsx` | — | Hosts `OnboardingWizard`. Also serves `?tab=settings` from the sidebar's Settings link |
| `BrandKnowledgeBase.jsx` | 585 | Brand KB viewer/editor (Package A) |
| `Onboarding.jsx` | 401 | Legacy chat onboarding (route retired) |
| `SetupPage.jsx` | 473 | Legacy setup page with a recommendation engine (route retired) |

### Dashboard & strategy

| File | Lines | Purpose |
|---|---|---|
| `DashboardPage.jsx` | 761 | Main dashboard. Renders scored recommendations from `getRecommendedActions()` |
| `StrategyHome.jsx` | — | Strategy section landing page |
| `MarketingStrategyPage.jsx` | 591 | Annual / quarterly / monthly marketing plans |
| `CompetitorIntelPage.jsx` | — | Competitor intelligence |
| `SwotAnalysisPage.jsx` | — | SWOT analysis, rendered via `lib/swot.jsx` |
| `MarketingHealthPage.jsx` | 466 | Marketing health score |
| `KpiRecommendationsPage.jsx` | 639 | KPI recommendations |

### Campaigns

| File | Lines | Purpose |
|---|---|---|
| **`CampaignForm.jsx`** | **4,488** | **The largest and most important page.** Multi-type campaign builder — collects inputs, posts to the n8n `evoke-cmo` webhook, saves generated items to `content_items`, and schedules days 2..N |
| `Results.jsx` | 2,116 | Displays generated campaign output; allows editing before publish |
| `CampaignsPage.jsx` | — | Campaign list |
| `NewCampaignWizardPage.jsx` | 431 | Guided new-campaign wizard |
| `CampaignHub.jsx` | — | Campaign planning hub (journey step 3) |
| `CampaignPerformancePage.jsx` | — | Per-campaign performance |

### Content generation

| File | Lines |
|---|---|
| `CaptionSuitePage.jsx` | 444 |
| `ReelScriptsPage.jsx` | 604 |
| `ContentGenerationPage.jsx` | 694 |
| `CopywritingAgentPage.jsx` | 619 |
| `ProductDescription.jsx` | 393 |
| `BlogGeneratorPage.jsx` | — |
| `EmailComposerPage.jsx` | — |
| `ContentStudioHubPage.jsx` | — |

### Creative & media

| File | Lines | Purpose |
|---|---|---|
| `CreativeAssetPage.jsx` | 808 | Creative Asset Generator |
| `ImageToolPage.jsx` | 684 | **Serves 5 routes** — angles, 360°, SEO, lifestyle, 3D |
| `AIImageGeneratorPage.jsx` | — | AI image generation |
| `VideoGenerationPage.jsx` | 641 | Video generation |
| `VideoStudioHubPage.jsx` | — | Video studio hub |
| `CreativeStudioHubPage.jsx` | — | Creative studio hub |
| `ProductsPage.jsx` | 540 | Product/asset library |

### Agents

| File | Lines | Purpose |
|---|---|---|
| `AgentsHub.jsx` | 375 | AI agent catalogue |
| `CmoAgentOverviewPage.jsx` | 522 | Per-agent detail — serves `/agent/:type` |
| `SeoAgentPage.jsx` | 634 | SEO Agent |
| `SeoIntelligenceCenterPage.jsx` | — | SEO Intelligence Center. **Its header comment states plainly** that no SEMrush/Ahrefs/Search Console integration exists, so its metrics have no real data source |
| `EmailMarketingPage.jsx` | 542 | Email Marketing Agent |
| `CSuitePage.jsx` | 472 | Serves all four C-suite routes (`/ai-cfo`, `/ai-cto`, `/ai-ceo`, `/ai-cro`) |
| `CompliancePage.jsx` | — | Compliance Agent |
| `BrandGovernancePage.jsx` | 431 | Brand Governance with a persisted audit trail |

### Social & publishing

| File | Lines | Purpose |
|---|---|---|
| `ConnectAccounts.jsx` | 2,273 | Account connection UI for every platform |
| `PostContent.jsx` | 1,307 | Compose and publish immediately |
| `ApprovalQueue.jsx` | 635 | Draft review → approve → schedule |
| `SocialInbox.jsx` | 401 | Unified inbox. **Explicitly labelled in-UI as example conversations** — no live inbox source is connected; replies are saved and "Suggested Reply" is a real AI call |
| `SocialMediaManagerPage.jsx` | — | Social media manager hub |
| `SocialCalendarPage.jsx` | — | Content calendar |
| `EventbritePost.jsx` | 598 | Eventbrite event creation & publishing |

### Ads

| File | Lines |
|---|---|
| `MetaAdsBoost.jsx` | 707 |
| `AdsCenterHubPage.jsx` | — |
| `MarketingExecutionPage.jsx` | 610 |

### Analytics & reporting

| File | Lines |
|---|---|
| `AnalyticsDashboard.jsx` | 728 |
| `ExecutiveReportPage.jsx` | 548 |
| `MarketingAttributionPage.jsx` | 576 |
| `ABTestingPage.jsx` | 513 |
| `TrendAnalysis.jsx` | 434 |
| `AudienceBuilder.jsx` | 601 |

### Business operations

| File | Lines | Purpose |
|---|---|---|
| `CrmPage.jsx` | 693 | CRM & lifecycle |
| `TeamManagement.jsx` | 440 | Team members, roles, invites |
| `PartnerSharing.jsx` | 308 | Partner sharing |
| `Tokens.jsx` | 872 | Token balance & packages |
| `Purchase.jsx` | — | Checkout. Loads the Razorpay script dynamically |

### Dev-only

| File | Purpose |
|---|---|
| `DevResetPage.jsx` | Resets local dev state. Localhost only |
| `SupabaseTestPage.jsx` | Inserts a row and reads it back to verify the Supabase connection. Explicitly **not** part of the real data layer. Localhost only |

---

## 10. Configuration modules

### `src/config.js`
Resolves the three main n8n webhook URLs with a three-level fallback:

```js
export const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK
  || (import.meta.env.DEV ? '/n8n-webhook/evoke-cmo' : `${N8N_BASE}/webhook/evoke-cmo`)
```

In dev the `/n8n-webhook` prefix hits the Vite proxy (avoiding CORS); in production it hits
`VITE_N8N_BASE` directly.

| Export | Default path |
|---|---|
| `WEBHOOK_URL` | `/webhook/evoke-cmo` — main campaign |
| `DAY_WEBHOOK_URL` | `/webhook/evoke-cmo-day` — single-day content |
| `AGENT_WEBHOOK_URL` | `/webhook/evoke-agents` — AI agents |
| `GOOGLE_ADS_OAUTH_WEBHOOK` | `/webhook/google-ads-oauth` |
| `GOOGLE_ADS_CREATE_WEBHOOK` | `/webhook/google-ads-create-campaign` |
| `GOOGLE_ADS_METRICS_WEBHOOK` | `/webhook/google-ads-metrics` |
| `ADMIN_EMAIL` | Approval-email recipient |
| `META_API_BASE` | Meta / Evoke Marketing FastAPI backend base URL |

The file opens with a comment block explaining **how to switch n8n accounts** — create a new
n8n trial, import the workflow JSON, paste the new webhook URLs (or set the `VITE_` vars),
and toggle the workflow active.

### `src/firebase.js`
Initialises Firebase from `VITE_FIREBASE_*` env vars (never hardcoded) and exports:
`auth`, `db` (Firestore), `storage`, plus `googleProvider`, `facebookProvider`,
`twitterProvider` and a re-exported `signInWithPopup`.
Uses the `getApps().length === 0 ? initializeApp(…) : getApp()` guard so hot reload doesn't
double-initialise.

---

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 3 — Backend Reference


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
> [Part 8](#part-8--known-gaps--risks).

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

Covered in full in [Part 4](#part-4--n8n-automation-backend).

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

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 4 — n8n Automation Backend


**This is where the real backend work happens.** OAuth token exchange, social publishing,
paid-ads creation and scheduled posting all live in n8n — not in this repository.

| Property | Value |
|---|---|
| Workflow name | `EVOKE Cmo` |
| Export file | `EVOKE-CMO-v21-GHL.json` (262 KB) |
| Host | `https://n8n-zvxi.srv1837606.hstgr.cloud` |
| Base webhook path | `/webhook/<path>` |
| Total nodes | **230** |
| Webhook triggers | **25** |
| Schedule triggers | **1** (every 15 minutes) |
| Status | **Active** |

### Node composition

| Node type | Count | Role |
|---|---|---|
| `httpRequest` | 75 | Calls to every external API |
| `code` | 65 | Payload shaping, token handling, response normalising |
| `respondToWebhook` | 33 | Returns responses to the frontend |
| `if` | 27 | Platform/branch routing |
| `webhook` | 25 | Entry points |
| `wait` | 2 | LinkedIn video processing delays |
| `set` | 1 | Credential normalisation |
| `scheduleTrigger` | 1 | The 15-minute publisher |
| `merge` | 1 | Combines multi-platform publish results |

---


## 1. Complete webhook index

| # | Path | Method | Purpose | Called from |
|---|---|---|---|---|
| 1 | `facebook-oauth` | POST | Facebook OAuth token exchange | `ConnectAccounts.jsx` |
| 2 | `instagram-oauth` | POST | Instagram OAuth token exchange | `ConnectAccounts.jsx` |
| 3 | `linkedin-oauth` | POST | LinkedIn OAuth token exchange | `ConnectAccounts.jsx` |
| 4 | `gmail-oauth` | POST | Gmail OAuth token exchange | `ConnectAccounts.jsx` |
| 5 | `eventbrite-oauth` | POST | Eventbrite OAuth token exchange | `ConnectAccounts.jsx` |
| 6 | `tiktok-oauth` | POST | TikTok OAuth token exchange | `ConnectAccounts.jsx` |
| 7 | **`evoke-cmo`** | POST | **Main campaign generate + publish** | `CampaignForm.jsx` |
| 8 | `evoke-cmo-day` | POST | Publish a single campaign day | `contentService` / cron |
| 9 | `evoke-agents` | POST | AI specialist agents | Agent pages |
| 10 | `evoke-cmo-product` | POST | Product description generation | `ProductDescription.jsx` |
| 11 | `google-ads-oauth` | POST | Google Ads OAuth | `googleAdsService.js` |
| 12 | `google-ads-create-campaign` | POST | Create a Google Ads campaign | `googleAdsService.js` |
| 13 | `google-ads-metrics` | POST | Google Ads metrics | `googleAdsService.js` |
| 14 | `meta-ads-oauth` | POST | Meta Ads OAuth | `metaAdsService.js` |
| 15 | `meta-ads-boost` | POST | Create a Meta ad campaign | `metaAdsService.js` |
| 16 | `twilio-status-callback` | POST | Twilio delivery status | Twilio (inbound) |
| 17 | `meta-whatsapp-webhook` | GET | WhatsApp webhook verification | Meta (inbound) |
| 18 | `meta-whatsapp-webhook` | POST | WhatsApp inbound events | Meta (inbound) |
| 19 | `evoke-ghl-token` | POST | Get/refresh the GHL agency token | Internal (n8n → n8n) |
| 20 | `evoke-oauth-callback` | GET | GHL Marketplace app install callback | GoHighLevel (inbound) |
| 21 | `evoke-location-create` | POST | Create a GHL sub-account | `ghlService.js` |
| 22 | `evoke-social-start` | POST | Begin social OAuth via GHL | `ghlService.js` |
| 23 | `evoke-social-accounts` | POST | List / attach GHL social pages | `ghlService.js` |
| 24 | **`evoke-social-post`** | POST | **Publish to social accounts** | `ghlService.js` |
| 25 | `evoke-set-pit` | POST | Store the GHL Private Integration Token | Manual (admin) |

---

## 2. Social OAuth flows (6 webhooks)

All six follow the same four-stage shape:

```
Webhook → Extract Params (code) → Exchange Code (HTTP)
        → [Get Long-lived Token] → Get Profile (HTTP)
        → Build Response (code) → Respond to Webhook
```

The browser never sees a client secret — the code-for-token exchange happens entirely inside
n8n.

### Per-platform detail

| Platform | Token exchange endpoint | Profile / entity fetched | Extra steps |
|---|---|---|---|
| **Facebook** | `graph.facebook.com/v21.0/oauth/access_token` | `/me/accounts` (Pages) | Short → **long-lived token** exchange, then `FB Get Instagram` fetches the linked IG business account from the page |
| **Instagram** | `api.instagram.com/oauth/access_token` | `graph.instagram.com/v21.0/me` | Short → long-lived via `graph.instagram.com/access_token` |
| **LinkedIn** | `linkedin.com/oauth/v2/accessToken` | `api.linkedin.com/v2/userinfo` | Has a dedicated `LI Error Response` branch |
| **Gmail** | `oauth2.googleapis.com/token` | `googleapis.com/oauth2/v2/userinfo` | Stores the refresh token for later sends |
| **Eventbrite** | `eventbrite.com/oauth/token` | `/v3/users/me/organizations/` | Has a dedicated error branch |
| **TikTok** | `open.tiktokapis.com/v2/oauth/token/` | `/v2/user/info/?fields=display_name,open_id` | Has a code-node error handler |

The response is written back to Firestore by the frontend via
`saveSocialAccount(uid, platform, accountData)`.

---

## 3. The main campaign engine — `evoke-cmo`

The single largest flow in the workflow — roughly 60 nodes. Called by `CampaignForm.jsx`.

### Flow shape

```
Form Webhook - AI CMO
 └─ Normalize & Extract Credentials1  (set)
     └─ Flatten User Credentials1     (code)
         ├─ Respond to Webhook        ← responds IMMEDIATELY, before generation
         └─ Build Smart Content Prompt1
             └─ Needs Content Gen?    (if)
                 └─ Gemini Generate Content1 → gemini-2.0-flash
                     └─ Extract & Merge Content1
                         └─ [image generation] → [per-platform publishing fan-out]
```

> **Fire-and-forget by design.** `Respond to Webhook` runs immediately after credential
> flattening, so the browser gets an acknowledgement in ~1s while generation and publishing
> continue server-side for a minute or more. The UI must not wait for publish results — it
> reads them from Firestore afterwards.

### Image generation sub-flow

```
Build Gemini Prompt1
 └─ Skip If Has Image1 (if)      ← don't regenerate if the user supplied one
     └─ Call Gemini API1         → gemini-2.0-flash-exp
         └─ Extract Image Data1
             └─ Upload to ImgBB1 → api.imgbb.com/1/upload
                 └─ Set Image URL1
```

ImgBB is used because Meta and LinkedIn need a **publicly reachable URL**, not base64.

### Publishing fan-out

Each platform is a conditional branch off the generated content:

| Platform | Branch | API path |
|---|---|---|
| **LinkedIn (text)** | `Has LinkedIn?1` → `LI Post Text Only1` | `POST /v2/ugcPosts` |
| **LinkedIn (image)** | `Has LI Image?1` → register → download → upload → post | `/v2/assets?action=registerUpload` then `/v2/ugcPosts` |
| **LinkedIn (video)** | `LI Check Is Video` → 7-node sub-flow | `/rest/videos?action=initializeUpload` → upload bytes → `finalizeUpload` → **Wait** → `POST /rest/posts` |
| **Instagram** | `Has Instagram?1` | `/{igBusinessId}/media` then `/media_publish` (two-step, required by Meta) |
| **Facebook (image)** | `Has FB Image?1` | `/{pageId}/photos` |
| **Facebook (video)** | `Has FB Video?1` | `/{pageId}/videos` |
| **Facebook (text)** | fallback | `/{pageId}/feed` |
| **WhatsApp** | `Has WhatsApp?1` → split recipients | Twilio `/Messages.json` |
| **SMS** | `Has SMS?1` → split recipients | Twilio `/Messages.json` |
| **Email** | `Has Email?1` | Refresh Gmail token → build MIME → `gmail.googleapis.com/.../messages/send` |
| **Eventbrite** | `Has Eventbrite?1` | `/v3/organizations/{orgId}/events/` |
| **Luma** | `Has Luma?1` | `api.lu.ma/v1/calendar/create-event` |
| **Meetup** | `Has Meetup?1` | (branch present) |

LinkedIn video is the most complex path in the entire workflow — six HTTP calls plus two
`Wait` nodes for asynchronous processing on LinkedIn's side.

WhatsApp and SMS both pass through a "Split Recipients" code node so one campaign fans out to
a list of numbers.

---

## 4. The AI agents endpoint — `evoke-agents`

```
Agents Webhook
 └─ Build Agent Prompt        (code — selects from 9 templates by agentType)
     └─ Call Gemini Agent     → gemini-2.0-flash
         ├─ Format Agent Response → Respond to Agent Request
         └─ Respond Error2
```

`Build Agent Prompt` holds the same nine agent templates as the dev-only
`/api/run-agent` route (`reddit`, `seo`, `writer`, `twitter`, `linkedin_agent`,
`hackernews`, `geo`, `coding`, `ugc_videos`), defaulting to `seo`. Each demands
`{ title, sections: [{ heading, content }] }`.

> **Note the provider split:** production agents run on **Gemini** via n8n; local dev agents
> run on **Groq `llama-3.3-70b-versatile`** via Vite middleware. Same prompts, different
> models — outputs will differ between environments.

**Also note:** the `Call Gemini Agent` node has its API key embedded directly in the URL
query string rather than in a credential. See
[Part 8](#part-8--known-gaps--risks).

---

## 5. GoHighLevel integration (7 webhooks)

GoHighLevel (GHL) is the execution engine for social publishing. It holds the Meta/LinkedIn/
TikTok app registrations, so users authorise **GHL's** apps rather than an Evoke app —
which is what makes publishing work without Evoke completing platform app review.

### `evoke-oauth-callback` (GET) — agency app install

```
GHL OAuth Callback Webhook
 └─ GHL Extract Auth Code
     └─ GHL Exchange Code → services.leadconnectorhq.com/oauth/token
         └─ GHL Shape Install Tokens
             └─ GHL Store Install Tokens  ← writes to workflow static data
                 └─ GHL Install Respond
```

Run **once** when installing the Marketplace app on the agency. It seeds the refresh token
that every other GHL flow depends on.

### `evoke-ghl-token` (POST) — token broker

```
GHL Token Webhook
 └─ GHL Read Stored Tokens     ← from $getWorkflowStaticData('global')
     └─ GHL Decide Refresh
         └─ GHL Token Expired? (if)
             ├─ true  → GHL Refresh Agency Token → Shape → Persist Rotated Token → Respond
             └─ false → GHL Token Cached → Respond
```

Called **internally by the other GHL flows** (n8n calling its own webhook) so token
refresh logic lives in exactly one place. If no token is stored it returns a readable error:

> *"No agency token stored. Install the Marketplace app on the agency first — that redirects
> through /webhook/evoke-oauth-callback and seeds it."*

### `evoke-location-create` (POST) — provision a sub-account

```
Location Create Webhook
 └─ Loc Get Agency Token  → calls /webhook/evoke-ghl-token
     └─ Loc Create Sub-Account → POST services.leadconnectorhq.com/locations/
         └─ Loc Extract Id → Loc Respond { locationId }
```

Each user should get their own GHL "location" — that isolation is what stops one user's
connected pages being visible to another.

### `evoke-social-start` (POST) — begin platform OAuth

```
Social Start Webhook
 └─ Start Get Token
     └─ Start Build OAuth URL
         └─ Start Respond { success, startUrl, platform, locationId }
```

Builds:
```
https://services.leadconnectorhq.com/social-media-posting/oauth/{platform}/start
  ?locationId={locationId}&userId={uid}
```

Two deliberate safety properties, both worth preserving:
- **The token is never returned.** The code node's comment is explicit: *"The token is
  deliberately NOT returned — this response reaches the browser."*
- **Failures pass through as readable errors** rather than throwing, so the caller sees a
  reason instead of an empty response.

### `evoke-social-accounts` (POST) — list / attach pages

```
Social Accounts Webhook
 └─ Acct Get Token
     └─ Acct Is Attach? (if)
         ├─ true  → Acct Attach Page → Acct Normalize → Acct Respond
         └─ false → Acct List Pages  → (same)
```

`GET /social-media-posting/{locationId}/accounts` returns every page on the workspace.
The frontend filters expired pages and attempts to scope them to the account that just
signed in (see `listConnectedPages` in `ghlService.js`).

### `evoke-social-post` (POST) — publish

```
Social Post Webhook
 └─ Post Get Token
     └─ Post Fetch Staff  → GET /users/?locationId=…
         └─ Post Fetch Users → GET /social-media-posting/{locationId}/…
             └─ Post Build Payload   (code)
                 └─ Post Payload OK? (if)
                     └─ Post Publish → POST /social-media-posting/{locationId}/posts
                         └─ Post Normalize → Post Respond
```

`Post Build Payload` contains the most defensive code in the workflow. GHL **requires** a
non-empty `userId`, and its field naming for that value is undocumented and has changed
before. So the node resolves it in three escalating stages:

1. `body.userId` from the request
2. `ghlUserId` from workflow static data
3. **A recursive hunt** (max depth 6) over the entire GHL response for any key matching
   `userId|createdBy|created_by|authorId` — or a `users[]` array — holding a
   Mongo-style id (`/^[a-f0-9]{20,32}$/i`)

Request body:
```json
{
  "uid": "sso_12345",
  "locationId": "…",
  "accountIds": ["…"],
  "summary": "the caption",
  "mediaUrls": ["https://…"],
  "scheduleDate": null
}
```
Omit `scheduleDate` to publish immediately.

### `evoke-set-pit` (POST) — store the Private Integration Token

Admin-only. Writes the PIT (and optionally `userId`, `clientId`, `clientSecret`,
`locationId`) into workflow static data.

Two good properties:
- The token **never appears in a workflow export** — it lives in n8n's runtime storage, not
  the JSON.
- The response echoes only the **last 6 characters** (`tokenEndsWith`), never the full value.

> ⚠️ **Operational constraint:** n8n static data only persists on *production* runs. The
> workflow must be **ACTIVE** — values set during a manual test execution are lost.

---

## 6. Paid ads (5 webhooks)

### Google Ads

**`google-ads-oauth`**
```
Extract Params → Exchange Code (oauth2.googleapis.com/token)
              → Get Profile   (googleapis.com/oauth2/v2/userinfo)
              → List Accessible Customers (googleads.googleapis.com/v23/customers:listAccessibleCustomers)
              → Build Response → Respond
```

**`google-ads-create-campaign`** — five sequential `:mutate` calls on Google Ads API **v23**,
each depending on the previous one's resource name:

```
1. campaignBudgets:mutate   → budget
2. campaigns:mutate         → campaign
3. adGroups:mutate          → ad group
4. adGroupCriteria:mutate   → keywords
5. adGroupAds:mutate        → the ad
```

**`google-ads-metrics`** — currently a `GAds Metrics Compute` code node feeding straight into
a response. It does **not** call the Google Ads reporting API. See
[Part 8](#part-8--known-gaps--risks).

### Meta Ads

**`meta-ads-oauth`**
```
Extract Params → Exchange Code → Get Long-lived Token
              → Get Ad Accounts (/me/adaccounts) → Build Response → Respond
```

**`meta-ads-boost`** — four sequential creates on `act_{adAccountId}`, in Meta's required order:

```
1. /campaigns    → campaign
2. /adsets       → ad set (targeting + budget)
3. /adcreatives  → creative
4. /ads          → the ad
```

Both create-flows have a dedicated error-respond branch.

---

## 7. Messaging webhooks (3)

| Webhook | Method | Purpose |
|---|---|---|
| `twilio-status-callback` | POST | Receives Twilio delivery status → `Format Twilio Status Event` → respond |
| `meta-whatsapp-webhook` | **GET** | Meta's subscription verification handshake → `Check Meta Verify Token` (if) → success or failure response |
| `meta-whatsapp-webhook` | **POST** | Inbound WhatsApp message events → `Format Meta WhatsApp Event` → respond |

The same path serves both GET and POST — that's Meta's required pattern: GET verifies the
subscription once, POST delivers events thereafter.

---

## 8. The scheduled publisher — the most important flow

**This is what makes scheduled campaigns work without a browser tab open.**

```
Schedule Trigger  ── every 15 minutes ──
 └─ Query Due Content
     │  POST firestore.googleapis.com/v1/projects/evoke-cmo-agent2/
     │       databases/(default)/documents:runQuery
     │  Auth: googleApi predefined credential
     │  structuredQuery:
     │    from:  content_items (allDescendants: true)
     │    where: status           == 'scheduled'
     │       AND requiresApproval == false
     │       AND scheduledAt      <= now()
     │    limit: 25
     │
     └─ Has Due Items? (if)
         └─ Split Due Items
             └─ Map Firestore Doc to Day Payload
                 └─ Day Normalize & Flatten
                     ├─ Day Has LinkedIn?  → Day LinkedIn Post   → /v2/ugcPosts
                     ├─ Day Has Instagram? → Day IG Create Media → Day IG Publish Media
                     ├─ Day Has Facebook?  → Day Facebook Post   → /{pageId}/photos
                     ├─ Day Has WhatsApp?  → Split Recipients → Twilio
                     └─ Day Has SMS?       → Split Recipients → Twilio
                          └─ Merge Publish Results
                               └─ Mark Content Published
                                    PATCH firestore.googleapis.com/v1/{docPath}
```

### The three query conditions — and why each matters

| Condition | Why |
|---|---|
| `status == 'scheduled'` | Drafts and already-published items are excluded |
| `requiresApproval == false` | **Human approval gate.** An item stays invisible to the cron until a person approves it in `/queue` (which sets this to `false`) or it was created by `scheduleCampaignDays` (which sets it `false` at creation, because the user explicitly launched a multi-day campaign) |
| `scheduledAt <= now()` | Only items whose time has arrived |

`limit: 25` caps each run, so a large backlog drains over several cycles rather than
hammering every platform API at once.

### Write-back

`Mark Content Published` PATCHes the Firestore document so the item won't match the query on
the next run. **This is the idempotency mechanism — without it every item would republish
every 15 minutes.**

### Shared publishing nodes

The `Day *` nodes are shared between the scheduler and the `evoke-cmo-day` webhook, so
manual single-day publishing and cron publishing take exactly the same code path.

---

## 9. Credential storage strategy

Four different mechanisms are in use:

| Mechanism | Used for | Notes |
|---|---|---|
| **n8n workflow static data** (`$getWorkflowStaticData('global')`) | GHL refresh token, access token, companyId, PIT, userId, clientId/secret | Never appears in a workflow export. **Only persists on production runs — the workflow must be ACTIVE** |
| **n8n predefined credentials** | Google API (Firestore access) | The proper n8n way |
| **Passed in the request body** | Per-user Facebook/Instagram/LinkedIn/Gmail tokens | Read from Firestore by the frontend, sent to n8n per call |
| **Hard-coded in node parameters** | ⚠️ Gemini API key, Twilio account SID | **Should be moved to credentials.** See [08](#part-8--known-gaps--risks) |

The GHL static-data approach has an explicit rationale in the code:

> *"Tokens live in n8n workflow static data — no Google credential needed, which keeps us
> clear of the org policy blocking service account keys."*

---

## 10. Operating the workflow

### Importing into a fresh n8n instance

1. Create the n8n instance (cloud or self-hosted)
2. **Import** `EVOKE-CMO-v21-GHL.json`
3. Configure the **Google API credential** used by the Firestore nodes
4. Replace the hard-coded API keys in the Gemini and Twilio nodes with proper credentials
5. **Toggle the workflow ACTIVE** — required for both webhooks and static-data persistence
6. Point the frontend at the new host — set `VITE_N8N_BASE` (or the individual
   `VITE_N8N_*_WEBHOOK` vars) and update the hard-coded `N8N_BASE` in
   `src/services/ghlService.js`
7. Re-install the GHL Marketplace app so `evoke-oauth-callback` seeds the agency token
8. POST the PIT to `/webhook/evoke-set-pit`

`src/config.js` carries an abbreviated version of these instructions in its header comment.

### Where the host URL is configured in the frontend

| Location | How |
|---|---|
| `src/config.js` | Via `VITE_N8N_BASE` / `VITE_N8N_*_WEBHOOK` env vars — **configurable** |
| `src/services/ghlService.js` | **Hard-coded**: `const N8N_BASE = 'https://n8n-zvxi.srv1837606.hstgr.cloud/webhook'` |
| `vite.config.js` | **Hard-coded** as the `/n8n-webhook` dev proxy target |

Changing hosts requires editing all three. Flagged in
[Part 8](#part-8--known-gaps--risks).

### Debugging

- n8n's **Executions** tab shows every run with full per-node input/output — the fastest way
  to diagnose a failed publish.
- The `evoke-cmo` flow responds *before* it publishes, so a 200 in the browser tells you
  **nothing** about whether the post went out. Always check Executions.
- The scheduler runs every 15 minutes; a scheduled post can appear to "do nothing" for up to
  15 minutes and still be healthy.

---

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 5 — Third-Party Integrations


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
| **Firestore** | All live application data — see [Part 6](#part-6--data-model) |
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
| Backend | 7 n8n webhooks — see [Part 4](#5-gohighlevel-integration-7-webhooks) |

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
[08](#part-8--known-gaps--risks))*.

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

See [Part 6](#part-6--data-model) for the schema.

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

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 6 — Data Model


The platform runs on **Firebase Firestore**. A Supabase Postgres schema also exists but is
currently **not** in the live path (see [§ Supabase](#supabase-postgres-schema-not-live)).

**Firebase project:** `evoke-cmo-agent2`
**Primary key everywhere:** `uid = 'sso_' + custID` (from `src/lib/authUtils.js`)

---

## Firestore collection map

```
users/{uid}                                  ← the central document
  ├── contacts/{contactId}                   ← CRM
  ├── teamMembers/{memberId}                 ← Team
  ├── teamInvites/{inviteId}                 ← Team invitations
  └── inboxThreads/{threadId}                ← Social Inbox reply history

content_items/{itemId}                       ← top-level: all generated content
governance_audit_log/{entryId}               ← top-level: brand governance decisions
```

Two design decisions worth understanding:

1. **The Brand Knowledge Base is a nested field on `users/{uid}`, not a subcollection.**
   `knowledgeBaseService.js` states this is deliberate — it avoids subcollection permission
   issues.
2. **`content_items` is top-level, not nested under the user.** It has to be — the n8n
   scheduler queries it across all users with `allDescendants: true`, which a per-user
   subcollection would make far more awkward.

---

## `users/{uid}` — the central document

Written by `src/services/userService.js` and `src/services/knowledgeBaseService.js`.

### Identity & profile

| Field | Type | Set by | Notes |
|---|---|---|---|
| `displayName` | string | `getOrCreateUser` | From the SSO profile |
| `email` | string | `getOrCreateUser` | From the SSO profile |
| `createdAt` | timestamp | `getOrCreateUser` | `serverTimestamp()` |

### Plan & billing

| Field | Type | Set by | Notes |
|---|---|---|---|
| `userPlan` | string | `saveSelectedPlan`, `OnboardingWizard` | `free \| package-a \| package-b \| package-c` |
| `selectedPlan` | string | same | **Duplicate of `userPlan`** — both are written together |
| `trialStartedAt` | timestamp | — | Read by `useUserPlan` to compute `trialDaysLeft` against 14 days |
| `tokenBalance` | number | `addTokens`, `deductToken` | Defaults 0. One token per campaign launch |

> `useUserPlan` reads `data?.userPlan || data?.selectedPlan || 'free'`, so either field works.
> The duplication is historical — see [08](#part-8--known-gaps--risks).

### Onboarding state

| Field | Type | Notes |
|---|---|---|
| `onboardingComplete` | boolean | Set `true` by `saveOnboardingData` |
| `onboardingData` | object | `{ background, industry, goal }` |
| `onboardingCompletedAt` | timestamp | |
| `chatOnboardingDone` | boolean | Legacy chat flow |
| `chatOnboardingCompletedAt` | timestamp | Legacy chat flow |
| `brandSetupComplete` | boolean | Written by `OnboardingWizard` |
| `recommendedRoutes` | string[] | Personalised route suggestions |
| `productTourSeen` | boolean | Set by `markTourSeen` so the tour doesn't replay |

### `socialAccounts` (nested map)

Initialised by `getOrCreateUser`, updated by `saveSocialAccount(uid, platform, data)`.

```js
socialAccounts: {
  facebook:  { connected, pageId, pageAccessToken, pageName },
  instagram: { connected, businessAccountId, pageName },
  linkedin:  { connected, personUrn, accessToken, name },
  twitter:   { connected, accessToken, username, userId },
  whatsapp:  { connected, phoneNumberId, accessToken },
  gmail:     { connected, email },
}
```

**Platforms connected via GoHighLevel** carry a different shape under the same key:

```js
socialAccounts: {
  ghl:      { connected, locationId, dedicated },   // the workspace itself
  facebook: { connected, viaGhl: true, ghlAccountId, locationId, pageName, avatar },
  // …same for instagram, linkedin, tiktok, threads, google
}
```

`ghl.dedicated` is `true` when the user has their own provisioned location, `false` when
they're on the shared workspace.

`disconnectSocialAccount` **replaces** the whole platform object with `{ connected: false }`,
clearing the stored tokens.

### `knowledgeBase` (nested map) — the Brand Knowledge Base

Written by `saveKnowledgeBase(uid, data)` and `appendJourneyOutput(uid, step, summary)`.

```js
knowledgeBase: {
  companyName, industry, audienceType, primaryObjective,
  description, tone, challenge, platforms, // …wizard answers
  updatedAt: <timestamp>,

  journeyOutputs: {
    strategy:  { summary, updatedAt },
    audience:  { summary, updatedAt },
    // …one entry per completed journey step
  }
}
```

`journeyOutputs` is the mechanism that lets later agents see what earlier agents produced.
Keys match the step names in `src/lib/journeyHandoff.js`.

---

## `content_items/{itemId}` — generated content

**The most operationally important collection.** Written by `src/services/contentService.js`;
read by `/queue`, `/results` and — critically — the **n8n 15-minute scheduler**.

### Core fields

| Field | Type | Values / notes |
|---|---|---|
| `userId` | string | The owning `sso_<custID>` uid |
| `campaignId` | string | Groups every item generated in one run |
| `campaignName` | string | |
| `campaignType` | string | `event \| product \| growth_strategy \| post-content \| …` |
| `type` | string | `post \| email \| ad \| seo \| strategy` |
| `platform` | string | `linkedin \| instagram \| facebook \| tiktok \| whatsapp \| email \| gmail \| twitter \| ''` |
| `text` | string | The caption / body |
| `subject` | string | Email subject (email items only) |
| `data` | string | JSON payload for structured items (e.g. strategy docs) |
| `imageUrl`, `videoUrl` | string | Media |
| `source` | string | `campaign \| post-content` |
| `createdAt`, `updatedAt` | timestamp | |

### Workflow fields — read these carefully

| Field | Type | Meaning |
|---|---|---|
| **`status`** | string | `draft \| approved \| scheduled \| published \| rejected` |
| **`requiresApproval`** | boolean | `true` = stays in `/queue` for manual review. `false` = **eligible for n8n auto-publish** |
| **`scheduledAt`** | timestamp \| ISO string \| null | The real trigger the n8n Firestore query filters on |
| `publishedAt` | timestamp \| null | Set when status becomes `published` |

### The lifecycle

```
                    saveContentItems(status='draft')
                              │
                       status: 'draft'
                     requiresApproval: true
                              │
                    ┌─────────┴─────────┐
              /queue approve       /queue reject
                    │                   │
             status:'approved'    status:'rejected'
                    │
             scheduleItem(id, when)
                    │
             status: 'scheduled'
             requiresApproval: false   ← a human already approved it
             scheduledAt: <when>
                    │
       ┌────────────┴────────────┐
       │  n8n cron, every 15 min │
       │  matches all three:     │
       │   status=='scheduled'   │
       │   requiresApproval==false│
       │   scheduledAt <= now()  │
       └────────────┬────────────┘
                    │
            publishes to platforms
                    │
      Mark Content Published (Firestore PATCH)
                    │
            status: 'published'
             publishedAt: <now>
```

**The multi-day campaign shortcut:** `scheduleCampaignDays()` writes days 2..N directly at
`status: 'scheduled'` + `requiresApproval: false`, skipping the approval queue — the user
explicitly launched the campaign, so each day doesn't need re-approving.

### Extra fields on scheduled-day rows

`scheduleCampaignDays` writes a richer document, because the n8n scheduler must be able to
publish it **without any browser involvement**:

| Field | Purpose |
|---|---|
| `day` | Which campaign day this is |
| `dailySchedule` | Per-day posting schedule array |
| `linkedinPost`, `instagramCaption`, `facebookPost`, `whatsappMessage` | Per-platform copy |
| `emailSubject`, `emailBody` | Email content |
| `imageUrl` | Media |
| `whatsappRecipients`, `emailRecipients` | Recipient lists |
| **`userCredentials`** | ⚠️ **The platform tokens needed to post** — see below |

> ⚠️ **`userCredentials` stores access tokens inside the content document** so the headless
> cron can publish without a session. This is what makes scheduled posting work, and it is
> also the single most sensitive field in the database. Flagged in
> [Part 8](#part-8--known-gaps--risks).

### Query note

`getContentItems()` sorts **client-side**:
```js
.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
```
This is deliberate — it avoids needing a composite Firestore index on
`(userId, status, createdAt)`. It also means the whole matching set is fetched before
sorting, so it will not scale to very large libraries without pagination.

---

## `users/{uid}/contacts/{contactId}` — CRM

Written by `src/services/crmService.js`.

| Field | Type | Values |
|---|---|---|
| `name` | string | |
| `email` | string | |
| `company` | string | |
| `phone` | string | |
| `stage` | string | `lead \| prospect \| customer \| retained` |
| `score` | number | 0–100, **auto-calculated** by `calcScore()` |
| `notes` | string | |
| `tags` | string[] | |
| `source` | string | `manual \| campaign \| import` |
| `lastContact` | timestamp \| null | |
| `createdAt` | timestamp | |

**Stage lifecycle automation:** moving a contact forward a stage
(`lead → prospect → customer → retained`) automatically sends a templated email, if the
contact has an address on file. The service's own comment states the rule:

> *Failures are logged, never thrown — automation should never block a save.*

---

## `users/{uid}/teamMembers/{memberId}` — Team

Written by `src/services/teamService.js`.

| Field | Type | Values |
|---|---|---|
| `name` | string | |
| `email` | string | |
| `role` | string | `owner \| admin \| editor \| viewer` |
| `status` | string | `active \| inactive` |
| `joinedAt` | timestamp | |

`ensureOwnerMember()` guarantees the account holder always exists as `owner`.

## `users/{uid}/teamInvites/{inviteId}` — Invitations

| Field | Type | Values |
|---|---|---|
| `email` | string | |
| `role` | string | `admin \| editor \| viewer` (never `owner`) |
| `sentAt` | timestamp | |

Invites are sent via `sendEmail()` → `/api/send-email` (Resend).

---

## `users/{uid}/inboxThreads/{threadId}` — Social Inbox replies

Written by `src/services/socialInboxService.js`.

| Field | Type | Notes |
|---|---|---|
| `thread` | array | `{ from: 'me' \| 'them', text, time }[]` |
| `updatedAt` | timestamp | |

> This collection stores **replies only**. There is no live social-platform message source
> (no Meta Conversations API, no GHL inbox integration). `SocialInbox.jsx` shows example
> conversations as the base data; this collection layers the user's real replies on top so
> they survive a reload.

---

## `governance_audit_log/{entryId}` — Brand Governance audit trail

Top-level collection, written by `src/services/governanceService.js`. Every conformance
review decision is appended so the audit log survives a reload rather than living only in
React state.

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Owner |
| `label` | string | From `entry.id` |
| `type` | string | Review type |
| `status` | string | Defaults `'flagged'` |
| `score` | number | Defaults 0 |
| `agent` | string | Defaults `'Brand Governance Agent'` |
| `createdAt` | timestamp | |

---

## Firestore security rules

> ⚠️ **Not in this repository.** Rules are managed in the Firebase console and must be
> reviewed there. Given that `content_items` and `governance_audit_log` are **top-level
> collections keyed by a `userId` field**, the rules must enforce `userId` matching on both —
> the collection structure alone does not isolate users.

---

## Supabase Postgres schema (not live)

Source: `docs-internal/supabase-schema.sql`. Idempotent — safe to re-run in full.

### `user_profiles`

```sql
create table if not exists user_profiles (
  id                    uuid primary key,       -- deterministic UUID from 'sso_<custID>'
  sso_uid               text unique not null,   -- the original 'sso_12345' string
  email                 text,
  display_name          text,
  plan                  text not null default 'free',
  onboarding_complete   boolean not null default false,
  onboarding_data       jsonb,
  brand_kb_complete     boolean not null default false,
  brand_setup_complete  boolean not null default false,
  brand_name            text,
  recommended_routes    text[],
  token_balance         integer not null default 0,
  social_accounts       jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_user_profiles_sso_uid on user_profiles (sso_uid);
```

### `brand_knowledge_base`

```sql
create table if not exists brand_knowledge_base (
  user_id           uuid primary key references user_profiles(id) on delete cascade,
  business_name     text,
  industry          text,
  description       text,
  audience          text,
  goal              text,
  platforms         text[],
  tone              text,
  challenge         text,
  journey_outputs   jsonb not null default '{}'::jsonb,  -- mirrors appendJourneyOutput()
  completed_at      timestamptz,
  updated_at        timestamptz not null default now()
);
```

### Triggers

A shared `set_updated_at()` trigger function fires `before update` on both tables.

### Row Level Security

```sql
alter table user_profiles       enable row level security;
alter table brand_knowledge_base enable row level security;

create policy "own profile"  on user_profiles
  for all using (auth.uid() = id)      with check (auth.uid() = id);

create policy "own brand kb" on brand_knowledge_base
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> `auth.uid()` only resolves when the request carries a **Supabase-signed JWT**. The design
> was for `api/supabase-session.js` to mint that JWT after verifying the real Evoke SSO
> session server-side. **That file does not exist in the repository** — it is referenced by
> the schema comments but was never committed (or was removed during the rollback). Anyone
> reinstating Supabase must write it.

### Firestore → Supabase field mapping

| Firestore (`users/{uid}`) | Supabase (`user_profiles`) |
|---|---|
| document id `sso_<custID>` | `sso_uid` (text) + `id` (derived UUID) |
| `userPlan` / `selectedPlan` | `plan` (single field — the duplication is resolved) |
| `onboardingComplete` | `onboarding_complete` |
| `onboardingData` | `onboarding_data` (jsonb) |
| `brandSetupComplete` | `brand_setup_complete` |
| `recommendedRoutes` | `recommended_routes` (text[]) |
| `tokenBalance` | `token_balance` |
| `socialAccounts` | `social_accounts` (jsonb) |
| `knowledgeBase.*` | → the `brand_knowledge_base` table |
| `knowledgeBase.journeyOutputs` | `journey_outputs` (jsonb) |

**Not covered by the Supabase schema:** `content_items`, `contacts`, `teamMembers`,
`teamInvites`, `inboxThreads`, `governance_audit_log`. A full migration would need tables for
all of these, and the n8n scheduler's Firestore `runQuery` would have to be rewritten against
Postgres.

---

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 7 — Environment & Deployment


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
> run as-is. Noted in [Part 8](#part-8--known-gaps--risks).

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
> carefully — and see [Part 8](#part-8--known-gaps--risks).

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
[Part 4 § 10](#10-operating-the-workflow). Summary:

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

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 8 — Known Gaps & Risks


An honest assessment of the system's current state, written for handover. Everything here was
verified against the code on **5 August 2026** — nothing is speculative.

**No secret values appear in this document.** Where a credential is exposed, the location is
named and the value is not reproduced.

---

## Severity summary

| Severity | Count | Theme |
|---|---|---|
| 🔴 **High** | 6 | Credentials in source, tokens in the database, no rules in repo |
| 🟠 **Medium** | 9 | Single points of failure, duplicated logic, dev/prod drift |
| 🟡 **Low** | 8 | Naming inconsistencies, dead code, tooling gaps |

---

## 🔴 High severity

### H1 — Gemini API key hard-coded in the n8n workflow

**Where:** four `httpRequest` nodes carry the key inline in the URL query string —
`Call Gemini Agent`, `Gemini Generate Content1`, `Call Gemini API1`, `Call Gemini`.

**Impact:** the key is written into `EVOKE-CMO-v21-GHL.json`, so it is exposed to anyone who
receives a workflow export — including this handover file. It is also visible in n8n
execution logs.

**Fix:** create an n8n credential (or use an environment variable) and reference it from all
four nodes. **Rotate the key** — assume it is compromised, because the export has been shared.

### H2 — Twilio Account SID hard-coded in the n8n workflow

**Where:** four nodes embed the Account SID directly in the Twilio Messages endpoint URL
(`Day WhatsApp Send`, `Day SMS Send`, `WhatsApp Send1`, `SMS Send1`).

**Fix:** move to an n8n Twilio credential. The auth token appears to be handled separately —
confirm before rotating.

### H3 — Only 2 of 75 n8n HTTP nodes use a managed credential

**Where:** across the whole workflow, only `Query Due Content` and `Mark Content Published`
declare `authentication: predefinedCredentialType` (`googleApi`). Every other HTTP node
carries its auth inline or receives it in the request body.

**Impact:** no central rotation, no audit trail, secrets leak into exports and logs.

**Fix:** systematically migrate to n8n credentials. Start with H1 and H2.

### H4 — Platform access tokens stored inside Firestore content documents

**Where:** `scheduleCampaignDays()` in `src/services/contentService.js` writes a
`userCredentials` field onto each `content_items` document.

**Why it exists:** the n8n cron publishes headlessly with no user session, so it needs the
tokens at publish time. This is a real constraint, not an oversight.

**Impact:** access tokens for Facebook, Instagram, LinkedIn, Gmail and WhatsApp are duplicated
into content rows. Any read access to `content_items` is effectively token access. Tokens are
also not rotated or cleared after publishing.

**Fix options (in order of preference):**
1. Have n8n read the tokens from `users/{uid}.socialAccounts` at publish time, using the
   `userId` already on the document — the credentials never need to be duplicated
2. If duplication is unavoidable, clear `userCredentials` in the `Mark Content Published`
   write-back
3. At minimum, ensure the Firestore rules make `content_items` readable only by its owner

### H5 — Firestore security rules are not in the repository

**Where:** absent. Managed only in the Firebase console.

**Impact:** `content_items` and `governance_audit_log` are **top-level collections keyed by a
`userId` field**. Collection structure alone provides no isolation — if the rules don't
enforce `userId` matching on both, any authenticated user can read every user's content
(and, per H4, their access tokens).

**Fix:** export the current rules, commit them to the repo, and review them. This should be
the **first thing** the next developer does.

### H6 — Secrets carrying the `VITE_` prefix

Vite inlines every `VITE_`-prefixed variable into the **client bundle**, making it publicly
readable in the browser.

| Variable | Actual sensitivity | Currently read from |
|---|---|---|
| `VITE_TIKTOK_CLIENT_SECRET` | **Secret** | — |
| `VITE_META_APP_SECRET` | **Secret** | — |
| `VITE_GROQ_API_KEY` | **Secret** | Server-side only (`process.env` / `loadEnv`) |
| `VITE_FACEBOOK_PAGE_ACCESS_TOKEN` | **Secret** | — |
| `VITE_INSTAGRAM_ACCESS_TOKEN` | **Secret** | — |
| `VITE_EVOKE_API_KEY` | **Secret** | — |
| `VITE_WAVESPEED_API_KEY` | **Secret** | — |

**`VITE_GROQ_API_KEY` is the least dangerous of these** — despite the prefix it is only ever
read server-side, so it does not currently reach the bundle. It should still be renamed to
`GROQ_API_KEY` so the prefix stops implying otherwise.

**Fix:** audit which of these actually reach client code. Rename every server-side one to drop
the prefix, and **rotate any that are confirmed to be in a shipped bundle**.

**Verify with:**
```bash
npm run build && grep -rE "sk-|AIza|EAA" dist/assets/*.js | head
```

---

## 🟠 Medium severity

### M1 — n8n is a single point of failure

Campaign generation, all social publishing, every OAuth token exchange, paid-ads creation and
scheduled posting **all** depend on one self-hosted n8n instance
(`n8n-zvxi.srv1837606.hstgr.cloud`). If it goes down, the product's core value proposition
stops working. There is no fallback path and no health monitoring.

**Fix:** add uptime monitoring on the webhook endpoints at minimum. Longer term, consider
moving the highest-value flows (publish, scheduler) into Vercel functions where they'd be
covered by Vercel's own reliability.

### M2 — The n8n host is hard-coded in two places

| Location | Configurable? |
|---|---|
| `src/config.js` | ✅ via `VITE_N8N_BASE` |
| `src/services/ghlService.js` — `const N8N_BASE = 'https://n8n-zvxi…'` | ❌ hard-coded |
| `vite.config.js` — `/n8n-webhook` proxy target | ❌ hard-coded |

Changing hosts requires editing source, not just configuration.

**Fix:** route both through `src/config.js`.

### M3 — The campaign prompt is duplicated

The 15-field campaign schema and the four-strategy `extractJson()` parser exist **twice**:
`api/generate-campaign.js` (production) and `vite.config.js` (dev). They are currently
identical and must be edited together — a divergence would make dev and production produce
different output.

**Fix:** extract to a shared module both can import.

### M4 — Dev and production image generation differ

| | Production (`api/generate-banner.js`) | Dev (`vite.config.js`) |
|---|---|---|
| `provider: 'dalle'` model | `gpt-image-1` | `dall-e-3` |
| Size | 1536×1024 | 1024×1024 |
| Quality | `high` | `hd` |
| Return path | base64 directly (`b64_json`) | fetches the returned URL, then converts |

Images generated locally will not match production.

**Fix:** align the two. The production path (`gpt-image-1`, direct base64) is the better one.

### M5 — `/api/run-agent` exists only in dev

The nine specialist agent prompts (`reddit`, `seo`, `writer`, `twitter`, `linkedin_agent`,
`hackernews`, `geo`, `coding`, `ugc_videos`) are implemented in `vite.config.js` with **no
production equivalent** in `api/`. In production the equivalent work runs through the n8n
`evoke-agents` webhook — **on Gemini, not Groq**.

**Impact:** same prompts, different models. Agent output differs between environments, and
the two prompt sets can drift apart silently.

### M6 — Supabase migration is half-finished

Built, then reverted on 2026-08-04. What exists:

| Piece | State |
|---|---|
| `docs-internal/supabase-schema.sql` | ✅ Complete, with RLS and triggers |
| `api/brand-kb.js` + `api/_lib/*` | ✅ Written and correct |
| `src/lib/apiAuth.js`, `src/lib/supabaseClient.js` | ✅ Present |
| `api/supabase-session.js` | ❌ **Referenced by the schema comments but does not exist.** Without it `auth.uid()` never resolves and every RLS policy denies |
| `FIREBASE_ADMIN_*` credentials | ❌ Not set |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Not set |
| Frontend wiring | ❌ Reverted to Firestore |

**Why it failed:** the API routes 404 under plain `vite`, so every save silently failed and
nobody saw an error.

**To reinstate:** add both credential sets, **write `api/supabase-session.js`**, test under
`vercel dev` or a real deployment, then repoint `knowledgeBaseService.js`.

### M7 — `userPlan` and `selectedPlan` are duplicated

`saveSelectedPlan()` writes both. `useUserPlan()` reads
`data?.userPlan || data?.selectedPlan || 'free'`. Two fields must be kept in sync for one
value; a partial write leaves them inconsistent.

**Fix:** pick `userPlan`, backfill, and remove `selectedPlan`. The Supabase schema already
resolves this — it has a single `plan` column.

### M8 — Route/gate definitions disagree

Plan requirements are declared in **three** places that don't fully agree:

| Route | `App.jsx` (what runs) | `ROUTE_PLAN` | `FEATURE_PLAN` |
|---|---|---|---|
| `/image-3d` | `package-b` | `package-b` | `image_3d: package-c` |
| `/brand-governance` | `package-b` | `package-b` | — |
| `/compliance-agent` | `package-c` | `package-c` | — |
| `/hub/*` routes | in `App.jsx` only | absent | absent |
| `/blog-generator`, `/email-composer`, `/image-generator`, `/social-calendar` | in `App.jsx` only | absent | absent |

`App.jsx` is what actually enforces. `ROUTE_PLAN` is now largely decorative, and
`FEATURE_PLAN.image_3d` actively contradicts the live gate.

**Fix:** make `App.jsx` derive its gates from `ROUTE_PLAN`, so there is one source of truth.

### M9 — Google Ads metrics are not real

The `google-ads-metrics` webhook flows `GAds Metrics Compute` (a code node) straight into a
response. **It never calls the Google Ads reporting API.** Any metrics shown are computed,
not measured.

---

## 🟡 Low severity

### L1 — Environment variable naming is inconsistent

| Problem | Examples |
|---|---|
| Misspellings | `twilo_sid`, `twilo_auth_token`, `GHL_PIT_tocken` |
| Casing | `Vite_facebook_secret` vs `VITE_META_APP_SECRET` |
| Non-descriptive | bare `client_id`, `client_secret` |
| Duplicate pairs | `VITE_FACEBOOK_PAGE_ID` / `VITE_FB_PAGE_ID`; `VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID` / `VITE_INSTAGRAM_ID`; `VITE_META_AD_ACCOUNT_ID` / `META_ADS_AD_ACCOUNT_ID` |
| Literally duplicated lines | `VITE_GHL_LOCATION_ID` (×2), `VITE_WAVESPEED_API_KEY` (×2) |
| Invalid line | A stray line starting `For …` parses as a variable named `For` |

### L2 — No ESLint configuration

`package.json` defines `npm run lint` with `--max-warnings 0`, but **no ESLint config file
exists** at the root and there is no `eslintConfig` key in `package.json`. The script cannot
run as written. Source files also contain `eslint-disable` comments that nothing enforces.

### L3 — No tests

No test framework, no test files, no CI configuration anywhere in the repository. For a
54,000-line codebase handling payments, OAuth tokens and publishing to users' real social
accounts, this is the largest quality gap.

**Suggested starting point:** unit-test the pure logic first — `planGate.js` (`canAccess`),
`extractJson()`, `journeyHandoff.js` mappers, `session.js` JWT handling. These are
high-value, dependency-free, and cheap to cover.

### L4 — No code splitting

`App.jsx` statically imports all 75 page components. The 4,488-line `CampaignForm.jsx` and
the 4,392-line `Landing.jsx` load on **every** page visit, including the landing page.

**Fix:** `React.lazy()` + `<Suspense>` on the route definitions. This is a contained,
high-impact change.

### L5 — Two competing colour palettes

| | Legacy (`index.css`) | Current (Figma screens) |
|---|---|---|
| Background | `#0e0c09` / `#070b17` | `#0A0A0F` |
| Card | `#1c1a13` | `#111118` |
| Gold | `#c8973e` | `#BE954A` |
| Border | `rgba(255,255,255,0.06)` | `#2A2A3A` |

Newer screens declare their palette as **inline local constants**, not CSS variables, so the
two can't be reconciled from one place.

**Fix:** promote the current palette into `:root` in `index.css` and replace the inline
constants.

### L6 — Very large single-file components

| File | Lines |
|---|---|
| `CampaignForm.jsx` | 4,488 |
| `Landing.jsx` | 4,392 |
| `ConnectAccounts.jsx` | 2,273 |
| `Results.jsx` | 2,116 |
| `PricingPage.jsx` | 1,588 |
| `PostContent.jsx` | 1,307 |

These are difficult to review, test or hand over. `CampaignForm.jsx` in particular is the
product's core flow and its single largest maintenance risk.

### L7 — Dead and superseded code retained

| Item | Status |
|---|---|
| `src/pages/Onboarding.jsx` (401 lines) | Route retired → redirects to `/brand-profile` |
| `src/pages/SetupPage.jsx` (473 lines) | Route retired → redirects to `/brand-profile` |
| `src/components/OnboardingModal.jsx` (684 lines) | Superseded by `OnboardingWizard.jsx` |
| `src/pages/ExecutiveReportingPage.jsx` | Retired 2026-07-17 (was pure mock data) |
| `/groq-api` Vite proxy | Kept "for backwards compat" |
| `.claude/worktrees/cmo-frontend-bug-798b7c/` | A full stale copy of the app inside the repo |

The retirements are **well-commented** — each retired route in `App.jsx` explains why and
when. That is good practice and should continue. But ~1,500 lines of superseded components
remain importable.

> ⚠️ Note that `BrandSetupModal.jsx` is **not** dead — `OnboardingWizard.jsx` imports
> `getRecommendations()` from it. Don't delete it without moving that function.

### L8 — Duplicate image-generation endpoints

`api/gemini-image.js` is fully covered by `api/generate-banner.js?provider=gemini`. One can be
removed.

---

## Features presented in the UI without a real data source

Both are **honestly labelled in the code**, which is the right call. Preserve the labelling
until real integrations land.

| Feature | File | Current state |
|---|---|---|
| **SEO Intelligence Center** | `SeoIntelligenceCenterPage.jsx` | Its own header comment states no SEMrush / Ahrefs / Search Console integration exists — Domain Authority, Organic Traffic, Keywords Ranked, Backlinks and the keyword table have no data source |
| **Social Inbox** | `SocialInbox.jsx` | Shows an in-UI banner reading *"Example conversations — no live LinkedIn/Instagram/Facebook/WhatsApp inbox is connected yet."* Replies **are** persisted, and Suggested Reply **is** a real AI call |
| **Google Ads metrics** | n8n `google-ads-metrics` | Computed in a code node, not fetched (see M9) |

---

## Architectural constraints worth understanding before changing anything

These are **not defects** — they are deliberate decisions with reasons. Understand them before
"fixing" them.

| Decision | Why |
|---|---|
| The `evoke_user` cookie is non-httpOnly | So any `*.evokemarketplace.com` subdomain can render logged-in UI without an API round-trip. The code is explicit that this is **for UI only** — gated actions must still verify server-side |
| `evoke-cmo` responds before publishing | Generation + publishing takes over a minute. The browser gets an acknowledgement; results are read from Firestore afterwards |
| Brand KB is a nested field, not a subcollection | Avoids subcollection permission issues |
| `content_items` is top-level, not per-user | The n8n cron queries across all users with `allDescendants: true` |
| `getContentItems` sorts client-side | Avoids needing a composite Firestore index on `(userId, status, createdAt)`. Will need pagination at scale |
| GHL holds the platform apps | Lets users authorise **GHL's** Meta/LinkedIn/TikTok apps, so publishing works without Evoke completing app review for each network |
| `VITE_GHL_LOCATION_ID` has a hard-coded default | A missing env var previously disabled connecting **silently**, with no diagnosable cause. It is only a workspace identifier; the acting token lives server-side in n8n |
| GHL tokens live in n8n static data | Keeps the setup clear of an org policy that blocks service-account keys |
| `Post Build Payload` hunts recursively for `userId` | GHL's field naming for this value is undocumented and has changed before |
| Pollinations seed is `random() * 2147483647` | `Date.now()` overflows 32-bit and Pollinations rejects it |
| Groq 401 is remapped to 500 | A bad server key must never surface to the client as a *user* auth error |
| `listConnectedPages` returns a `scoped` flag | On the shared workspace, auto-selecting an unscoped page would silently link **another user's** page |
| Trusted popup origin allow-list | Without it, any page could forge a social-connection event via `postMessage` |
| `scheduleCampaignDays` writes to Firestore | Replaced a browser `setTimeout` that cancelled the campaign when the tab closed |

---

## Recommended priority order for the next developer

**Week 1 — Security**
1. Export, commit and review the **Firestore security rules** (H5) — do this first
2. Rotate the Gemini key and move it to an n8n credential (H1)
3. Move the Twilio SID to a credential (H2)
4. Audit `VITE_`-prefixed secrets; verify the built bundle; rotate anything exposed (H6)
5. Decide on the `userCredentials`-in-Firestore approach (H4)

**Week 2 — Stability**
6. Add uptime monitoring on the n8n webhooks (M1)
7. Make `App.jsx` derive gates from `ROUTE_PLAN` (M8)
8. De-duplicate the campaign prompt (M3)
9. Align dev/prod image generation (M4)

**Week 3 — Maintainability**
10. Add an ESLint config so `npm run lint` runs (L2)
11. Add tests for the pure logic modules (L3)
12. Add route-level code splitting (L4)
13. Consolidate `userPlan` / `selectedPlan` (M7)

**Backlog**
14. Finish or formally abandon the Supabase migration (M6)
15. Break up `CampaignForm.jsx` (L6)
16. Unify the colour palettes (L5)
17. Remove dead code — carefully; check `BrandSetupModal` first (L7)

---

## What is genuinely working well

Worth recording, so the next developer doesn't rewrite things that are already right:

- **Social publishing is live.** Facebook and Instagram post for real through GoHighLevel.
- **Scheduled publishing works headlessly.** The 15-minute cron with its three-condition query
  and Firestore write-back is a sound design.
- **The approval gate is correct.** `requiresApproval` genuinely prevents unreviewed content
  from auto-publishing.
- **Retired routes are well documented.** Every redirect in `App.jsx` explains what replaced it
  and when. This is unusually good discipline.
- **Failure modes are handled honestly.** Groq 401→500 remapping, Resend's 501, the GHL
  "install the app first" message, and the two in-UI "this is example data" labels all favour
  telling the truth over hiding a gap.
- **The `scoped`-flag and trusted-origin protections** in `ghlService.js` show real thought
  about multi-tenant safety on a shared workspace.
- **Security-conscious touches throughout n8n:** the social-start token is deliberately not
  returned to the browser; the PIT endpoint echoes only the last 6 characters.
- **`.gitignore` is correct** — `.env`, `.mcp.json`, `docs-internal/` and `.vercel` are all
  excluded. An earlier risk of internal `.docx` files being publicly served has been resolved;
  they now live in the git-ignored `docs-internal/`.

---

[↑ Back to Table of Contents](#table-of-contents)

---

# Part 9 — Complete File Index


Every file in the repository, with a one-line description. Use this to find where something
lives; use [02](#part-2--frontend-reference)–[06](#part-6--data-model) for the detail.

Excluded: `node_modules/`, `dist/`, `.git/`, and `.claude/worktrees/` (a stale full copy of
the app — see [Part 8 § L7](#l7--dead-and-superseded-code-retained)).

---

## Root

| File | Purpose |
|---|---|
| `index.html` | HTML shell. Loads Inter from Google Fonts, injects the Google Ads gtag (`AW-18246572299`), mounts `#root` |
| `package.json` | Dependencies and scripts. `dev` pins port **3007** |
| `package-lock.json` | Locked dependency tree — use npm |
| `vite.config.js` | Build config **+ the dev-only API middleware layer + CORS proxies** (553 lines) |
| `vercel.json` | Build command, output dir, SPA catch-all rewrite |
| `.env` | All secrets and configuration. **Git-ignored** |
| `.gitignore` | Excludes `node_modules`, `dist`, `.env*`, `.mcp.json`, `.vercel`, `docs-internal/`, `.vscode`, `.claude` |
| `.mcp.json` | Editor tool configuration. Git-ignored (contains tokens) |
| `skills-lock.json` | Editor tooling lockfile |

---

## `api/` — Backend (Vercel functions)

| File | Runtime | Purpose |
|---|---|---|
| `generate.js` | Edge | Groq chat-completions proxy — keeps the key server-side |
| `generate-campaign.js` | Edge | Full 15-field campaign package via Groq `llama-3.1-8b-instant`, with a four-strategy JSON extractor |
| `generate-banner.js` | Edge | Image generation — Gemini (default) / OpenAI `gpt-image-1` / Pollinations. Always returns base64 |
| `gemini-image.js` | Edge | Gemini-only image generation. Overlapped by `generate-banner.js` |
| `eventbrite.js` | Edge | Eventbrite proxy — `create_venue`, `create_event`, `create_ticket`, `publish_event`. Caller supplies the token |
| `send-email.js` | Edge | Transactional email via Resend. Returns **501** until `RESEND_API_KEY` is set |
| `brand-kb.js` | **Node** | Brand KB read/write via Supabase, uid-scoped. **Not in the live path** |
| `_lib/supabaseAdmin.js` | — | Service-role Supabase client (**bypasses RLS**). Never import from `src/` |
| `_lib/verifyUser.js` | — | Returns a trusted uid: verified Firebase ID token in production, plain `uid` in dev |

---

## `src/` — Entry points & config

| File | Purpose |
|---|---|
| `main.jsx` | React 18 root. StrictMode + `App` + `index.css` |
| `App.jsx` | Router, ~100 route definitions, the `G()` plan-gate helper, `EvokeAuthHandler`, global `Chatbot` |
| `config.js` | n8n webhook URL resolution with env → dev-proxy → production fallback. Documents how to switch n8n accounts |
| `firebase.js` | Firebase init from env vars. Exports `auth`, `db`, `storage`, OAuth providers |
| `index.css` | **The only stylesheet** (347 lines). CSS custom properties, reset, base elements, scrollbar |

---

## `src/components/` — 20 shared components

| File | Lines | Purpose |
|---|---|---|
| `AppSidebar.jsx` | 372 | Main navigation. Three plan-filtered groups, collapsible 260↔64px, portalled account menu. Broadcasts `--evox-sidebar-w` |
| `SidebarLayout.jsx` | — | Wrapper: sidebar + width-offset content area |
| `Navbar.jsx` | 444 | Top nav for public pages and the plan gate |
| `ToolTopBar.jsx` | — | Compact header for tool pages |
| `StrategyTopBar.jsx` | — | Top bar variant for the strategy section |
| `JourneyFooter.jsx` | — | 12-step CMO journey progress strip |
| `AuthProvider.jsx` | 26 | Creates `AuthContext`; also mounts `OAuthCallbackHandler` |
| `OAuthCallbackHandler.jsx` | — | Detects OAuth return params and completes the connection |
| `PlanGate.jsx` | 213 | Blurred page behind a lock card with price + highlights + upgrade CTA. Bypassed on localhost |
| `UpgradeModal.jsx` | — | Inline upgrade prompt for gated actions |
| `OnboardingWizard.jsx` | 588 | **The live 6-step onboarding flow** |
| `BrandSetupModal.jsx` | 525 | Modal brand setup. ⚠️ Also exports `getRecommendations()`, imported by `OnboardingWizard` |
| `OnboardingModal.jsx` | 684 | Legacy chat onboarding. Superseded |
| `ProductTour.jsx` | — | First-visit guided tour anchored to sidebar `data-tour` attributes |
| `BannerGenerator.jsx` | 452 | AI banner UI — prompt, provider, preview, download |
| `EventBannerGenerator.jsx` | — | Event-specific banner variant |
| `Chatbot.jsx` | 480 | Floating assistant on **every** page |
| `ProductLaunchModal.jsx` | 498 | Guided product-launch campaign builder |
| `LoadingSpinner.jsx` | — | Shared loading indicator |
| `EgtWalletHeader.jsx` | 360 | EGT wallet balance in the header |
| `GratitudeToken.jsx` | — | EGT token display/award |

---

## `src/hooks/` — 4 hooks

| File | Purpose |
|---|---|
| `useAuth.js` | Reads `AuthContext` → `{ profile, status, user }`. **The hook pages should use** |
| `useEvokeSession.js` | SSO session engine. `useSyncExternalStore` on the cookie + localhost `DEV_PROFILE` fallback |
| `useRequireAuth.js` | Redirects unauthenticated users to the accounts portal |
| `useUserPlan.js` | Plan + 14-day `trialDaysLeft` from Firestore |

---

## `src/lib/` — 12 logic modules

| File | Purpose |
|---|---|
| `session.js` (397) | **Cross-domain SSO layer** — cookie read/write, JWT decode, sign-out marker, backend session recovery |
| `authUtils.js` | `profileToUser` (**uid = `'sso_' + custID`**) and `redirectToLogin` |
| `planGate.js` (177) | `PLANS`, `FEATURE_PLAN`, `ROUTE_PLAN`, `PLAN_HIGHLIGHTS`, `canAccess()` |
| `journeyHandoff.js` | The canonical **12-step CMO journey** + step-to-step payload mappers |
| `recommendations.jsx` | `getRecommendedActions()` — industry-aware scored suggestions. Shared by Dashboard and Brand KB |
| `campaignPrefill.js` | Builds pre-filled campaign form values from prior context |
| `swot.jsx` | `parseSwot`, `SwotGrid`, `timeAgo` |
| `apiAuth.js` | `authedFetch` — Firebase ID token in prod, plain uid in dev |
| `supabaseClient.js` | Browser Supabase client |
| `gtag.js` | `gtagEvent`, `trackPurchase`, `trackSignup` |
| `evokeUserCookie.js` | Reads the EGT wallet address from the SSO cookie |
| `egtRewardPoolBalance.js` | Reads the EGT reward-pool balance via RPC |
| `formatEgtBalance.js` | EGT balance display formatting |

---

## `src/services/` — 14 data-access modules

| File | Purpose |
|---|---|
| `userService.js` | User profile, plan, tokens, `socialAccounts`, onboarding state. Also `TOKEN_PACKAGES` |
| `contentService.js` | The `content_items` collection — save, schedule, approve, publish. **`scheduleCampaignDays` feeds the n8n cron** |
| `ghlService.js` | **GoHighLevel social publishing** — location provisioning, OAuth popup, page attach, publish |
| `knowledgeBaseService.js` | Brand KB as a nested field on `users/{uid}`. Header documents the Supabase rollback |
| `metaAdsService.js` | Meta Ads OAuth + boost creation |
| `googleAdsService.js` | Google Ads OAuth, campaign creation, metrics |
| `bannerService.js` (353) | Banner generation — canvas composition or `/api/generate-banner` |
| `crmService.js` | CRM contacts + stage-lifecycle email automation (never throws) |
| `teamService.js` | Team members, roles, invitations |
| `governanceService.js` | Brand Governance audit trail |
| `socialInboxService.js` | Persists Social Inbox **replies only** — no live message source exists |
| `eventService.js` | Event landing-page generation and hosting |
| `emailService.js` | Thin client for `/api/send-email` |
| `qrCodeService.js` | QR codes via the free QR Server API |

---

## `src/pages/` — 75 pages

### Public & legal
`Landing.jsx` (4,392) · `PricingPage.jsx` (1,588) · `PlansPage.jsx` (392) · `FreePlanPage.jsx` ·
`PackageAPage.jsx` · `PackageBPage.jsx` (801) · `PackageCPage.jsx` (665) · `Privacy.jsx` ·
`Terms.jsx` · `SignIn.jsx` *(redirects to the SSO portal)*

### Onboarding & brand (page list)
`BrandProfilePage.jsx` *(hosts `OnboardingWizard`; also `?tab=settings`)* ·
`BrandKnowledgeBase.jsx` (585) · `Onboarding.jsx` (401) *(retired)* ·
`SetupPage.jsx` (473) *(retired)*

### Dashboard & strategy (page list)
`DashboardPage.jsx` (761) · `StrategyHome.jsx` · `MarketingStrategyPage.jsx` (591) ·
`CompetitorIntelPage.jsx` · `SwotAnalysisPage.jsx` · `MarketingHealthPage.jsx` (466) ·
`KpiRecommendationsPage.jsx` (639)

### Campaigns (page list)
**`CampaignForm.jsx` (4,488 — the core flow)** · `Results.jsx` (2,116) · `CampaignsPage.jsx` ·
`NewCampaignWizardPage.jsx` (431) · `CampaignHub.jsx` · `CampaignPerformancePage.jsx`

### Content generation (page list)
`CaptionSuitePage.jsx` (444) · `ReelScriptsPage.jsx` (604) · `ContentGenerationPage.jsx` (694) ·
`CopywritingAgentPage.jsx` (619) · `ProductDescription.jsx` (393) · `BlogGeneratorPage.jsx` ·
`EmailComposerPage.jsx` · `ContentStudioHubPage.jsx`

### Creative & media (page list)
`CreativeAssetPage.jsx` (808) · **`ImageToolPage.jsx` (684 — serves 5 routes)** ·
`AIImageGeneratorPage.jsx` · `VideoGenerationPage.jsx` (641) · `VideoStudioHubPage.jsx` ·
`CreativeStudioHubPage.jsx` · `ProductsPage.jsx` (540)

### Agents (page list)
`AgentsHub.jsx` (375) · `CmoAgentOverviewPage.jsx` (522) · `SeoAgentPage.jsx` (634) ·
`SeoIntelligenceCenterPage.jsx` *(⚠️ no real SEO data source — says so in its own comment)* ·
`EmailMarketingPage.jsx` (542) · **`CSuitePage.jsx` (472 — serves all 4 C-suite routes)** ·
`CompliancePage.jsx` · `BrandGovernancePage.jsx` (431)

### Social & publishing (page list)
`ConnectAccounts.jsx` (2,273) · `PostContent.jsx` (1,307) · `ApprovalQueue.jsx` (635) ·
`SocialInbox.jsx` (401) *(⚠️ example threads; replies are real)* · `SocialMediaManagerPage.jsx` ·
`SocialCalendarPage.jsx` · `EventbritePost.jsx` (598)

### Ads (page list)
`MetaAdsBoost.jsx` (707) · `AdsCenterHubPage.jsx` · `MarketingExecutionPage.jsx` (610)

### Analytics & reporting (page list)
`AnalyticsDashboard.jsx` (728) · `ExecutiveReportPage.jsx` (548) ·
`MarketingAttributionPage.jsx` (576) · `ABTestingPage.jsx` (513) · `TrendAnalysis.jsx` (434) ·
`AudienceBuilder.jsx` (601)

### Business operations (page list)
`CrmPage.jsx` (693) · `TeamManagement.jsx` (440) · `PartnerSharing.jsx` (308) ·
`Tokens.jsx` (872) · `Purchase.jsx` *(loads Razorpay dynamically)*

### Dev-only *(redirect to `/` in production)*
`DevResetPage.jsx` · `SupabaseTestPage.jsx`

---

## `public/` — Static assets

| File | Purpose |
|---|---|
| `evoke-logo.png`, `evoke-wordmark.svg`, `favicon.svg` | Branding |
| `signin-hero.webp` | Sign-in page hero |
| `gratitude-token.png` | EGT token graphic |
| `analytics-connected.png`, `analytics-platforms.png`, `analytics-tokens.png`, `analytics-top.png`, `analytics-week.png` | Analytics illustrations |
| `creative-hub/ai-image-generator.png`, `lifestyle-narratives.png`, `product-catalog.png`, `rotational-views.png`, `social-reels.png` | Creative hub tiles |
| `icons/gmail.png`, `icons/tiktok.png` | Platform icons |
| `tiktokGYdTycqX1no9l7SYXZqzYwbyML5WqPQf.txt` | **TikTok domain-verification file** — do not delete |

---

## `docs-internal/` — Internal specs (git-ignored)

| File | Purpose |
|---|---|
| `EVOX-CMO-Doc.docx` | Original product specification |
| `EVOX-CMO-Gap-Analysis.docx` | Gap analysis against the spec |
| `supabase-schema.sql` | Complete Supabase schema — tables, indexes, triggers, RLS policies |

---

## `docs/` — This documentation

| File | Contents |
|---|---|
| `README.md` | Index + 30-second architecture + quick start |
| `01-system-overview.md` | Architecture, tech stack, **the complete start-to-finish journey** |
| `02-frontend-reference.md` | Every file in `src/` |
| `03-backend-reference.md` | Every file in `api/` + the Vite dev API layer |
| `04-n8n-automation.md` | All 25 webhooks + the scheduler |
| `05-integrations.md` | Every third-party service |
| `06-data-model.md` | Firestore + Supabase schemas |
| `07-environment-and-deployment.md` | Env vars, local dev, deployment, troubleshooting |
| `08-known-gaps-and-risks.md` | Honest state assessment + priority order |
| `09-file-index.md` | This file |

---

## External artifacts (not in the repository)

| Artifact | Location | Notes |
|---|---|---|
| **n8n workflow** | `EVOKE-CMO-v21-GHL.json` | 230 nodes. Documented in [04](#part-4--n8n-automation-backend). **Must be handed over separately** |
| **Firestore security rules** | Firebase console | ⚠️ Not version-controlled — see [Part 8 § H5](#part-8--known-gaps--risks) |
| **Vercel environment variables** | Vercel dashboard | Must mirror `.env` |
| **GHL Marketplace app** | GoHighLevel agency account | Client id/secret + the PIT |
| **Platform app registrations** | Meta, LinkedIn, TikTok, Google, Eventbrite developer consoles | OAuth redirect URIs are registered against specific hosts |

---

## Handover checklist

Things the next owner needs that are **not** in this repository:

- [ ] `.env` file (or the Vercel environment variable set)
- [ ] `EVOKE-CMO-v21-GHL.json` — the n8n workflow export
- [ ] n8n instance access (`n8n-zvxi.srv1837606.hstgr.cloud`)
- [ ] Firebase console access — project `evoke-cmo-agent2`
- [ ] **The current Firestore security rules** (export and commit them)
- [ ] Vercel project access
- [ ] GoHighLevel agency account access
- [ ] Developer console access: Meta, LinkedIn, TikTok, Google Ads, Eventbrite
- [ ] Groq, Gemini, OpenAI, ImgBB, Resend, Cloudinary, Razorpay accounts
- [ ] Supabase project access (if the migration is to be finished)

---

[↑ Back to Table of Contents](#table-of-contents)
