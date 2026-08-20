# EVOKE AI CMO

> An AI-powered Chief Marketing Officer, delivered as a web app.

A user signs in with their Evoke Marketplace account, describes their brand **once**, and the
platform then does the work a marketing department would do — strategy, content, creative,
approvals, publishing, and reporting.

**Live:** `cmo.evokemarketplace.com` · **Stack:** React 18 + Vite · Firebase · Vercel Functions · n8n

---

## Table of contents

- [What it does](#what-it-does)
- [Plans & feature gating](#plans--feature-gating)
- [Architecture](#architecture)
- [How a user moves through the product (step by step)](#how-a-user-moves-through-the-product-step-by-step)
- [Feature reference](#feature-reference)
- [Email](#email)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Repository layout](#repository-layout)
- [Full documentation](#full-documentation)

---

## What it does

1. Builds a marketing **strategy** — annual / quarterly / monthly plans, SWOT, competitor intel
2. Generates **campaigns** — social captions, blog posts, emails, ad copy, reel scripts
3. Generates **creative** — banners, product images, lifestyle photos, video
4. Routes everything through an **approval queue**
5. **Publishes** to real Facebook / Instagram / LinkedIn / TikTok / Threads / Google Business
   accounts, plus WhatsApp, SMS and email
6. Reports back with **analytics** and an **executive report**

Roughly **100 routes**, **75 pages**, **20 components**, **14 service modules**,
**7 backend API routes**, and one **230-node n8n workflow** carrying publishing and OAuth.

---

## Plans & feature gating

Tiers are **cumulative** — Professional includes everything in Starter.
Source of truth: [`src/lib/planGate.js`](src/lib/planGate.js).

| Plan key | Product name | Price | Capability |
|---|---|---|---|
| `free` | Free Trial | $0 (14-day) | Brand setup, strategy, health score, connect accounts, publish |
| `package-a` | Starter | $30/mo | ➕ Content generation, captions, reels, copywriting, images, video |
| `package-b` | Professional | $100/mo | ➕ AI agents (SEO, Email, A/B), CRM, analytics, social manager, approval queue |
| `package-c` | Enterprise | Custom | ➕ Paid ads (Meta/Google), multi-channel execution, team, C-suite agents |

> On `localhost` all plan gates are **bypassed** and the app auto-signs-in as a dev profile,
> so every page is reachable without a real Evoke SSO session.

---

## Architecture

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
│ Firebase         │        │ Vercel Functions     │      │ n8n (self-hosted)      │
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
```

### Authentication

**The app has no login of its own.** It is a satellite of the Evoke Marketplace identity system:

1. `useEvokeSession()` reads the `evoke_user` cookie, written by `accounts.evokemarketplace.com`
   at the parent domain `.evokemarketplace.com` so every subdomain can read it
2. No cookie? → `GET {VITE_API_BASE_URL}/auth/session` with `credentials:'include'` recovers a
   session from the httpOnly `auth_token` cookie
3. Still nothing? → redirect to `accounts.evokemarketplace.com/login/?redirect_url=<current page>`
4. The app's uid is **`sso_<custID>`** — SSO-derived, *not* Firebase Auth's uid

### AI providers

| Provider | Model | Used for |
|---|---|---|
| Groq | `llama-3.1-8b-instant` | Campaign copy packages |
| Groq | `llama-3.3-70b-versatile` | Specialist text agents (SEO, Reddit, X, LinkedIn, GEO) |
| Google Gemini | `gemini-2.0-flash` | Campaign content + agent responses inside n8n |
| Google Gemini | `gemini-2.0-flash-exp` | Image generation |
| OpenAI | `gpt-image-1` / `dall-e-3` | Optional image generation provider |
| Pollinations | `flux` | Free fallback image generation, no API key |

---

## How a user moves through the product (step by step)

### Stage 0 — Landing

`src/pages/Landing.jsx` — public marketing page, no auth. CTAs push to `/pricing` or sign-in.

### Stage 1 — Brand Setup

`/brand-profile` → `BrandProfilePage.jsx`, rendering `OnboardingWizard.jsx`. Six steps:

| # | Step | Collects |
|---|---|---|
| 1 | Cognitive System Tuning | Which AI agents to enable |
| 2 | Brand System Definition | Industry, company size, brand voice, value tags |
| 3 | Connect System API | 10 integration toggles (GA, Meta Ads, IG, LinkedIn, TikTok, Gmail, HubSpot, Salesforce, Shopify, WordPress) |
| 4 | Marketing Plan Tuning | Primary goal — revenue / awareness / leads |
| 5 | Neural Network Ingestion | Document upload for brand context |
| 6 | Cognitive Audit Report | Summary + plan selection |

Writes `knowledgeBase`, `selectedPlan` / `userPlan`, `brandSetupComplete` and `recommendedRoutes`
to Firestore. `/onboarding` and `/setup` are legacy routes that now redirect here.

### Stage 2 — Dashboard

`/dashboard`. Reads the Brand Knowledge Base and feeds it to `getRecommendedActions()`
(`src/lib/recommendations.jsx`), which scores suggested next actions against the user's
industry, audience and objectives. E-commerce brands get product-campaign and visual
suggestions; B2B/SaaS brands get email-drip and LinkedIn suggestions.
`ProductTour.jsx` runs a first-visit guided tour.

### Stage 3 — Connect Channels

`/connect-accounts`. Two mechanisms coexist:

**(a) Via GoHighLevel** — the current live path for social publishing (`src/services/ghlService.js`):

1. `ensureGhlLocation(uid)` — provisions a GHL sub-account, or falls back to a shared workspace
2. `startSocialConnect(uid, platform)` — asks n8n for an OAuth start URL, opens a popup, waits
   for a `postMessage` from a **trusted origin allow-list**
3. `listConnectedPages()` — returns `scoped: true` only if the list could be narrowed to *this*
   sign-in. If it cannot, the UI **must not** auto-select a page — on a shared workspace that
   would silently link someone else's page
4. `attachSocialPage(...)` — records the chosen page under `socialAccounts.<platform>`

**(b) Direct OAuth via n8n** — Facebook, Instagram, LinkedIn, Gmail, Eventbrite, TikTok,
Google Ads, Meta Ads. Each has a dedicated webhook that exchanges the auth code server-side.

### Stage 4 — Strategy

`/strategy-home`, `/strategy`, `/competitor-intel`, `/swot-analysis`. Calls the n8n agent
webhook (or `/api/run-agent` in dev) to produce annual / quarterly / monthly plans. Output is
written back via `appendJourneyOutput(uid, 'strategy', summary)` so later steps have context.

### Stage 5 — Generate → Approve → Publish → Report

Content and creative are generated from the stored brand context, routed through the approval
queue, published via n8n to the connected accounts, and reported on in analytics and the
executive report.

---

## Feature reference

| Area | Routes | Notes |
|---|---|---|
| Strategy | `/strategy-home`, `/strategy`, `/swot-analysis`, `/competitor-intel` | Annual / quarterly / monthly plans |
| Content | `/content-generation`, `/caption-suite`, `/blog-generator`, `/reel-scripts`, `/copywriting` | Groq + Gemini backed |
| Creative | `/ai-image-generator`, `/creative-asset`, `/video-generation`, `/image-tool` | Gemini / OpenAI / Pollinations |
| Agents | `/agents-hub`, `/seo-agent`, `/email-composer`, `/ab-testing` | Package B+ |
| Channels | `/connect-accounts`, `/social-media-manager`, `/social-calendar`, `/social-inbox` | GHL + direct OAuth |
| Ads | `/ads-center`, `/meta-ads-boost`, `/marketing-execution` | Package C |
| Approvals | `/approval-queue` | Gate before publishing |
| Analytics | `/analytics`, `/campaign-performance`, `/marketing-attribution`, `/executive-report` | |
| Admin | `/team-management`, `/brand-governance`, `/compliance`, `/plans`, `/pricing` | |

---

## Email

Three separate email mechanisms coexist:

| Mechanism | Where | Status |
|---|---|---|
| **Gmail API** | n8n | 🟢 Live |
| **Resend** | [`api/send-email.js`](api/send-email.js) | 🟡 Code ready — returns **501** until `RESEND_API_KEY` is set |
| **Email campaigns** | `/email-marketing`, `/email-composer` | Generates the copy; sending routes through the above |

Resend default sender: `RESEND_FROM_EMAIL`, falling back to `EVOX AI CMO <onboarding@resend.dev>`.

---

## Getting started

### Prerequisites

- Node.js 18+
- A `.env` file (not in git — see [Environment variables](#environment-variables))

### Install and run

```bash
npm install
```

```bash
npm run dev
```

The app runs on **http://localhost:3007**.

> `npm run dev` uses Vite's dev-time API middleware. The **real** Vercel functions in `api/`
> do **not** run under plain `vite` — use `vercel dev` if you need to exercise them.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 3007 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint, zero warnings enforced |

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values. **Never commit `.env`.**
The full annotated list lives in [docs/07-environment-and-deployment.md](docs/07-environment-and-deployment.md).

Groups: Firebase (client), Firebase Admin (server), Evoke SSO & platform, n8n, AI providers,
GoHighLevel, Meta / Facebook / Instagram, other platforms, storage & payments, Supabase, EGT,
and email.

---

## Deployment

**Frontend — Vercel.** Static SPA plus serverless / edge functions. `vercel.json` holds the SPA
rewrite rule. Six routes run on the Edge runtime; `api/brand-kb.js` runs on Node because it
needs `firebase-admin`.

**Automation — n8n.** One workflow (`EVOKE-CMO-v21-GHL.json`), 230 nodes, 25 webhooks and a
15-minute scheduler, self-hosted.

Step-by-step deployment and a post-deployment verification checklist are in
[docs/07-environment-and-deployment.md](docs/07-environment-and-deployment.md).

---

## Repository layout

```
evoke-cmo-frontend/
├── api/                     ← Vercel serverless & edge functions
│   ├── _lib/                ← Server-only helpers (Supabase admin, auth verify)
│   ├── brand-kb.js          ← Node runtime
│   └── …                    ← eventbrite, gemini-image, generate-banner,
│                              generate-campaign, generate, send-email (Edge)
├── docs/                    ← Full technical documentation
├── public/                  ← Static assets
├── src/
│   ├── components/          ← 20 shared UI components
│   ├── hooks/               ← 4 React hooks
│   ├── lib/                 ← 12 pure-logic helper modules
│   ├── pages/               ← 75 route-level page components
│   ├── services/            ← 14 data-access / API-client modules
│   ├── App.jsx              ← Router + ~100 route definitions
│   ├── config.js            ← n8n webhook URL resolution
│   ├── firebase.js          ← Firebase SDK initialisation
│   └── index.css            ← The ONLY global stylesheet
├── vercel.json
└── vite.config.js           ← Build config + dev-only API middleware + CORS proxies
```

---

## Full documentation

| # | Document | What's inside |
|---|---|---|
| 01 | [System Overview](docs/01-system-overview.md) | Architecture, tech stack, complete user journey |
| 02 | [Frontend Reference](docs/02-frontend-reference.md) | Every file in `src/` |
| 03 | [Backend Reference](docs/03-backend-reference.md) | Every file in `api/` |
| 04 | [n8n Automation](docs/04-n8n-automation.md) | All 25 webhooks + the scheduler, node by node |
| 05 | [Integrations](docs/05-integrations.md) | GHL, Meta, LinkedIn, Google Ads, TikTok, Twilio, Groq, Gemini, Resend, Cloudinary |
| 06 | [Data Model](docs/06-data-model.md) | Firestore collections + Supabase schema |
| 07 | [Environment & Deployment](docs/07-environment-and-deployment.md) | Every env var, local dev, Vercel, n8n |
| 08 | [Known Gaps & Risks](docs/08-known-gaps-and-risks.md) | What is live, what is mock, what needs attention |
| 09 | [File Index](docs/09-file-index.md) | One-line description of every file |

> **No secret values appear anywhere in this documentation** — only variable names.
