# 08 — Known Gaps & Risks

[← Back to index](README.md)

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

[← Back to index](README.md) · [Next: File Index →](09-file-index.md)
