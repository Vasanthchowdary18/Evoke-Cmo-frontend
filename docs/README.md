# EVOKE AI CMO — Project Documentation

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

## How to read this documentation

Read in order if you are new to the project. Jump straight to a numbered file if you
already know what you are looking for.

| # | Document | What's inside |
|---|---|---|
| 01 | [System Overview](01-system-overview.md) | Architecture, tech stack, and the complete **start-to-finish** user journey with data flow |
| 02 | [Frontend Reference](02-frontend-reference.md) | Every file in `src/` — routes, pages, components, hooks, libs, services, CSS |
| 03 | [Backend Reference](03-backend-reference.md) | Every file in `api/` — Vercel edge & Node functions, plus the Vite dev-server API layer |
| 04 | [n8n Automation Backend](04-n8n-automation.md) | All 25 webhooks + the scheduler, node by node — this is where publishing actually happens |
| 05 | [Third-Party Integrations](05-integrations.md) | GoHighLevel, Meta, LinkedIn, Google Ads, TikTok, Twilio, Eventbrite, Groq, Gemini, Resend, Cloudinary |
| 06 | [Data Model](06-data-model.md) | Firestore collections + the Supabase schema, field by field |
| 07 | [Environment & Deployment](07-environment-and-deployment.md) | Every env var, local dev setup, Vercel deployment, n8n deployment |
| 08 | [Known Gaps & Risks](08-known-gaps-and-risks.md) | Honest state of the system — what is live, what is mock, what needs attention |
| 09 | [File Index](09-file-index.md) | One-line description of **every file** in the repository |

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
[07-environment-and-deployment.md](07-environment-and-deployment.md) for the
complete list of required keys), then:

```bash
npm run dev
```

The app runs on **http://localhost:3007**.

> On `localhost` the app auto-signs-in as a hard-coded dev profile and **all plan gates are
> bypassed**, so every page is reachable without a real Evoke SSO session. See
> [01-system-overview.md § Local development bypasses](01-system-overview.md#local-development-bypasses).

---

## Document conventions

- File paths are relative to the repository root.
- "n8n" always refers to the single hosted workflow `EVOKE Cmo`
  (file: `EVOKE-CMO-v21-GHL.json`).
- **No secret values appear anywhere in this documentation.** Only variable *names* are
  listed. Where secrets are currently hard-coded in source, that fact is flagged in
  [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md) without reproducing the value.
