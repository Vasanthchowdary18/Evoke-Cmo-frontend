# 02 — Frontend Reference

[← Back to index](README.md)

Complete reference for everything under `src/` — **54,561 lines** across 118 files.

---

## Contents

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
> listed in [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

---

## 3. Routing — `src/App.jsx`

237 lines. Responsibilities:

1. **Imports all 75 page components** statically (no lazy loading / code splitting).
2. Defines the `G(plan, name, Comp)` helper — wraps a page in `<PlanGate>`:
   ```jsx
   function G(plan, name, Comp) {
     return <PlanGate requiredPlan={plan} featureName={name}><Comp /></PlanGate>
   }
   ```
3. Defines `IS_LOCAL` — used to hide dev-only routes in production.
4. Contains `EvokeAuthHandler` — the Firebase custom-token sign-in path (see
   [01 § Authentication](01-system-overview.md#4-authentication--how-a-user-gets-in)).
5. Renders the tree:
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
> actually runs. See [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

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

[← Back to index](README.md) · [Next: Backend Reference →](03-backend-reference.md)
