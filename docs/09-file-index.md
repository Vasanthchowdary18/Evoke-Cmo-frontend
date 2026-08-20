# 09 — Complete File Index

[← Back to index](README.md)

Every file in the repository, with a one-line description. Use this to find where something
lives; use [02](02-frontend-reference.md)–[06](06-data-model.md) for the detail.

Excluded: `node_modules/`, `dist/`, `.git/`, and `.claude/worktrees/` (a stale full copy of
the app — see [08 § L7](08-known-gaps-and-risks.md#l7--dead-and-superseded-code-retained)).

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

### Onboarding & brand
`BrandProfilePage.jsx` *(hosts `OnboardingWizard`; also `?tab=settings`)* ·
`BrandKnowledgeBase.jsx` (585) · `Onboarding.jsx` (401) *(retired)* ·
`SetupPage.jsx` (473) *(retired)*

### Dashboard & strategy
`DashboardPage.jsx` (761) · `StrategyHome.jsx` · `MarketingStrategyPage.jsx` (591) ·
`CompetitorIntelPage.jsx` · `SwotAnalysisPage.jsx` · `MarketingHealthPage.jsx` (466) ·
`KpiRecommendationsPage.jsx` (639)

### Campaigns
**`CampaignForm.jsx` (4,488 — the core flow)** · `Results.jsx` (2,116) · `CampaignsPage.jsx` ·
`NewCampaignWizardPage.jsx` (431) · `CampaignHub.jsx` · `CampaignPerformancePage.jsx`

### Content generation
`CaptionSuitePage.jsx` (444) · `ReelScriptsPage.jsx` (604) · `ContentGenerationPage.jsx` (694) ·
`CopywritingAgentPage.jsx` (619) · `ProductDescription.jsx` (393) · `BlogGeneratorPage.jsx` ·
`EmailComposerPage.jsx` · `ContentStudioHubPage.jsx`

### Creative & media
`CreativeAssetPage.jsx` (808) · **`ImageToolPage.jsx` (684 — serves 5 routes)** ·
`AIImageGeneratorPage.jsx` · `VideoGenerationPage.jsx` (641) · `VideoStudioHubPage.jsx` ·
`CreativeStudioHubPage.jsx` · `ProductsPage.jsx` (540)

### Agents
`AgentsHub.jsx` (375) · `CmoAgentOverviewPage.jsx` (522) · `SeoAgentPage.jsx` (634) ·
`SeoIntelligenceCenterPage.jsx` *(⚠️ no real SEO data source — says so in its own comment)* ·
`EmailMarketingPage.jsx` (542) · **`CSuitePage.jsx` (472 — serves all 4 C-suite routes)** ·
`CompliancePage.jsx` · `BrandGovernancePage.jsx` (431)

### Social & publishing
`ConnectAccounts.jsx` (2,273) · `PostContent.jsx` (1,307) · `ApprovalQueue.jsx` (635) ·
`SocialInbox.jsx` (401) *(⚠️ example threads; replies are real)* · `SocialMediaManagerPage.jsx` ·
`SocialCalendarPage.jsx` · `EventbritePost.jsx` (598)

### Ads
`MetaAdsBoost.jsx` (707) · `AdsCenterHubPage.jsx` · `MarketingExecutionPage.jsx` (610)

### Analytics & reporting
`AnalyticsDashboard.jsx` (728) · `ExecutiveReportPage.jsx` (548) ·
`MarketingAttributionPage.jsx` (576) · `ABTestingPage.jsx` (513) · `TrendAnalysis.jsx` (434) ·
`AudienceBuilder.jsx` (601)

### Business operations
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
| **n8n workflow** | `EVOKE-CMO-v21-GHL.json` | 230 nodes. Documented in [04](04-n8n-automation.md). **Must be handed over separately** |
| **Firestore security rules** | Firebase console | ⚠️ Not version-controlled — see [08 § H5](08-known-gaps-and-risks.md) |
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

[← Back to index](README.md)
