# Evoke CMO Frontend — Developer Documentation

> Last updated: June 2026  
> Stack: React 18 + Vite + Firebase + n8n  
> Author: Vasanth Chowdary (info@evokemedia.io)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Authentication System](#4-authentication-system)
5. [Route Map](#5-route-map)
6. [Key Pages](#6-key-pages)
7. [Bug Fixes Implemented](#7-bug-fixes-implemented)
8. [Features Implemented](#8-features-implemented)
9. [Social Account Connection Guide](#9-social-account-connection-guide)
10. [Environment Variables](#10-environment-variables)
11. [Services & APIs](#11-services--apis)
12. [n8n Automation Webhooks](#12-n8n-automation-webhooks)

---

## 1. Project Overview

Evoke CMO is an AI-powered marketing platform that gives businesses a full Chief Marketing Officer suite powered by AI agents. Users can:

- Generate campaign content (captions, images, videos, email drips, SEO blogs)
- Connect social media accounts (LinkedIn, Instagram, Facebook, Gmail, TikTok, Twitter)
- Post content directly to connected platforms via n8n automation
- Access CMO-level modules: PR, CRM, Paid Ads, KPI tracking
- Manage content through an Approval Queue

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Inline CSS with CSS variables (no Tailwind) |
| Animation | Framer Motion |
| Auth | Evoke SSO (cookie-based) + Firebase Auth |
| Database | Firebase Firestore |
| AI (Text) | Groq API (llama-3.1-8b-instant) |
| AI (Images) | WaveSpeed AI, Gemini |
| Automation | n8n (vasanth18.app.n8n.cloud) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## 3. Project Structure

```
src/
├── App.jsx                        # Root router — all routes defined here
├── firebase.js                    # Firebase app init (env-based config)
├── config.js                      # App-wide config (n8n URLs, etc.)
│
├── components/
│   ├── AuthProvider.jsx           # React context: provides { user, profile, status }
│   ├── Navbar.jsx                 # Top nav bar with EGT wallet + user menu
│   ├── EgtWalletHeader.jsx        # EGT token balance display
│   ├── Chatbot.jsx                # Floating AI assistant chatbot
│   ├── OAuthCallbackHandler.jsx   # Handles OAuth redirects (LinkedIn, Twitter, etc.)
│   └── ...
│
├── hooks/
│   ├── useAuth.js                 # Main auth hook → returns { user, profile, status }
│   ├── useEvokeSession.js         # Reads Evoke SSO cookie via useSyncExternalStore
│   └── useRequireAuth.js          # Redirect-to-login guard hook
│
├── lib/
│   ├── session.js                 # Evoke SSO cookie read/write/clear helpers
│   ├── authUtils.js               # profileToUser() + redirectToLogin()
│   └── ...
│
├── pages/
│   ├── Landing.jsx                # Home page — campaign type selector
│   ├── AgentsHub.jsx              # CMO dashboard with agent modules
│   ├── CampaignForm.jsx           # Campaign brief form (/campaign/:type)
│   ├── Results.jsx                # AI campaign output results
│   ├── ConnectAccounts.jsx        # Social account OAuth connections
│   ├── PostContent.jsx            # Review & post content to platforms
│   ├── ApprovalQueue.jsx          # Content queue management
│   ├── PackageAPage.jsx           # Package A tool suite
│   ├── PackageBPage.jsx           # Package B tool suite (Content & Video)
│   ├── PackageCPage.jsx           # Package C tool suite
│   ├── CaptionSuitePage.jsx       # AI caption + hashtag generator
│   ├── ReelScriptsPage.jsx        # Reel script generator
│   ├── KpiRecommendationsPage.jsx # KPI recommendations
│   ├── ImageToolPage.jsx          # AI image generation tools
│   └── ...
│
└── services/
    ├── userService.js             # Firestore user CRUD (getOrCreateUser, saveSocialAccount)
    └── contentService.js          # Firestore content_items CRUD
```

---

## 4. Authentication System

### How Auth Works

The app uses a two-layer auth system:

**Layer 1 — Evoke SSO (primary)**
- The accounts portal (`accounts.evokemarketplace.com`) writes an `evoke_user` cookie at `.evokemarketplace.com`
- `lib/session.js` reads this cookie and parses the user profile
- `hooks/useEvokeSession.js` subscribes to session changes via `useSyncExternalStore`
- In **dev mode** (localhost), a hardcoded session is injected automatically:
  - Email: `vasanthchowdary35@gmail.com`
  - custID: `260417001`

**Layer 2 — Firebase Auth (secondary)**
- Used for Firestore reads/writes
- `EvokeAuthHandler` in `App.jsx` exchanges SSO tokens for Firebase custom tokens on login

### Auth Hook Chain

```
useEvokeSession()
  └── reads evoke_user cookie via useSyncExternalStore
  └── returns { profile, status }
        status: "loading" | "authenticated" | "unauthenticated"

useAuth()  ← src/hooks/useAuth.js
  └── calls useEvokeSession()
  └── maps profile → user via profileToUser()
  └── returns { user, profile, status }
        user: { uid, displayName, email, custID, token, firstName, lastName }

AuthProvider  ← src/components/AuthProvider.jsx
  └── provides { user, profile, status } via React context
  └── components access via useContext(AuthContext)
```

### User ID Format

Firestore user documents use the format: `sso_{custID}`  
Example: `sso_260417001`

### Auth Guard Pattern

Pages that require login use:
```js
const { user: evokeUser, status: authStatus } = useAuth()

useEffect(() => {
  if (authStatus === 'loading') return
  if (!evokeUser) { redirectToLogin(); return }
  // proceed...
}, [evokeUser, authStatus])
```

---

## 5. Route Map

| URL | Component | Description |
|---|---|---|
| `/` | `Landing` | Home — campaign type selection |
| `/agents-hub` | `AgentsHub` | CMO dashboard with agents |
| `/campaign/:type` | `CampaignForm` | Campaign brief form |
| `/results` | `Results` | AI campaign output |
| `/connect-accounts` | `ConnectAccounts` | Social OAuth connections |
| `/post-content` | `PostContent` | Post to social platforms |
| `/queue` | `ApprovalQueue` | Content approval queue |
| `/plans` | `PlansPage` | Pricing plans |
| `/package-a` | `PackageAPage` | Package A tools |
| `/package-b` | `PackageBPage` | Package B tools (Content & Video) |
| `/package-c` | `PackageCPage` | Package C tools |
| `/caption-suite` | `CaptionSuitePage` | AI caption & hashtag generator |
| `/reel-scripts` | `ReelScriptsPage` | Reel script generator |
| `/kpi-recommendations` | `KpiRecommendationsPage` | KPI goals & tracking |
| `/image-lifestyle` | `ImageToolPage` | Lifestyle image AI |
| `/image-360` | `ImageToolPage` | 360° product video |
| `/image-angles` | `ImageToolPage` | Product angle shots |
| `/image-seo` | `ImageToolPage` | SEO image tool |
| `/image-3d` | `ImageToolPage` | 3D product renders |
| `/meta-ads-boost` | `MetaAdsBoost` | Meta ads management |
| `/overview/:type` | `CmoAgentOverviewPage` | Agent overview pages |
| `/evox-services` | `EvoxServices` | EVOX service listings |
| `/dashboard` | redirect | → `/agents-hub` |
| `/cmo` | `Dashboard` | Legacy CMO dashboard |

---

## 6. Key Pages

### ConnectAccounts (`/connect-accounts`)

Handles OAuth connections for all social platforms.

**Supported platforms:**
- Instagram (via Facebook OAuth)
- Facebook (Page access token)
- LinkedIn (OpenID + w_member_social)
- Twitter / X (OAuth 2.0)
- Gmail (Google OAuth)
- TikTok
- Eventbrite
- WhatsApp (always-on, no OAuth needed)

**Navigation state:**
```js
// Navigate to ConnectAccounts from PackageB/PostContent
navigate('/connect-accounts', { state: { from: '/post-content' } })
sessionStorage.setItem('connectReturnTo', '/post-content')
```

**Return navigation logic (after connecting):**
- `returnTo === '/post-content'` → goes to PostContent
- `returnTo === '/package-a'` or `/products` → goes to PostContent (Package A flow)
- Otherwise → goes to `/` (Landing)

---

### PostContent (`/post-content`)

Review & publish content to connected social platforms.

**Accepts route state:**
```js
{
  mediaUrl: string,          // URL of video/image to post
  mediaType: 'video'|'image',
  toolTitle: string,         // Name shown at top
  toolColor: string,         // Accent colour
  productName: string,       // Pre-fills a basic caption
  captionPrefill: string,    // Full caption text (from Caption Suite)
  platform: string,          // Pre-selects a platform (from Caption Suite)
  from: string,              // Back button destination
}
```

**Publishing:** Uses n8n webhooks per platform. Caption becomes the post body.

---

### CaptionSuitePage (`/caption-suite`)

AI-powered caption and hashtag generator.

**Inputs:** Platform(s), Content Type, Campaign Context, Brand Tone (optional)  
**AI Model:** Groq `llama-3.1-8b-instant`  
**Output:** Platform-specific caption + CTA + 10–15 hashtags

**Post Now button:** Each generated caption card has a **"Post Now"** button that navigates to `/post-content` with the caption pre-filled and the platform pre-selected.

---

### PackageBPage (`/package-b`)

Content & Video tools suite with sidebar navigation.

**Tools:**
- Lifestyle Video Generator → `/image-lifestyle`
- 360° Product Video → `/image-360`
- 30-Day Content Calendar → `/reel-scripts` (placeholder)
- Reel & Video Scripts → `/reel-scripts`
- Caption & Hashtag Suite → `/caption-suite`
- Content Export → coming soon
- KPI Recommendations → `/kpi-recommendations`
- Post to Social → `/connect-accounts` (smart routing)

**Post to Social smart routing:**
- If ≥1 account connected → goes directly to `/post-content`
- If no accounts connected → goes to `/connect-accounts` with `returnTo: '/post-content'`

---

## 7. Bug Fixes Implemented

### Bug 1 — Infinite Render Loop in ConnectAccounts

**File:** `src/hooks/useAuth.js`  
**Symptom:** Browser console showed `Warning: Maximum update depth exceeded` at `ConnectAccounts.jsx:278` and `:282`. The "Start Creating Campaigns" button was unresponsive. Page was frozen.

**Root Cause:**  
`useAuth()` called `profileToUser(profile)` on every render. `profileToUser()` creates a **new object** every call, so `user` was a different reference on every render. The `useEffect([evokeUser, authStatus])` in ConnectAccounts detected a changed dependency every render and called `setUser(evokeUser)`, which triggered another render — an infinite loop.

**Fix:**
```js
// Before (broken)
export function useAuth() {
  const { profile, status } = useEvokeSession()
  const user = profileToUser(profile)   // ← new object every render
  return { user, profile, status }
}

// After (fixed)
import { useMemo } from 'react'

export function useAuth() {
  const { profile, status } = useEvokeSession()
  const user = useMemo(() => profileToUser(profile), [profile])  // ← stable reference
  return { user, profile, status }
}
```

`profile` from `useSyncExternalStore` is already stable (cached via `getEvokeUserProfileSnapshot`), so memoising `profileToUser(profile)` produces a stable `user` object between renders.

---

### Bug 2 — Wrong Import in ConnectAccounts

**File:** `src/pages/ConnectAccounts.jsx` line 4  
**Symptom:** White page / module error on `/connect-accounts`

**Root Cause:** HEAD version had `import { useAuth } from "../components/AuthProvider.jsx"` but `AuthProvider` does not export `useAuth`.

**Fix:**
```js
// Before
import { useAuth } from "../components/AuthProvider.jsx"

// After
import { useAuth } from "../hooks/useAuth.js"
```

---

### Bug 3 — useAuth.js Deleted (Missing Module)

**File:** `src/hooks/useAuth.js`  
**Symptom:** White page. Console: `Failed to resolve import "../hooks/useAuth.js"`

**Root Cause:** The file was accidentally deleted during a cleanup pass. Multiple pages depend on it: `Navbar`, `AgentsHub`, `Landing`, `ConnectAccounts`, `PlansPage`, `FreePlanPage`, `PackageAPage`, `PackageBPage`, `PackageCPage`, `ProductsPage`, `PostContent`, `ApprovalQueue`, `EgtWalletHeader`.

**Fix:** Recreated the file:
```js
import { useMemo } from "react"
import { useEvokeSession } from "./useEvokeSession"
import { profileToUser } from "../lib/authUtils"

export function useAuth() {
  const { profile, status } = useEvokeSession()
  const user = useMemo(() => profileToUser(profile), [profile])
  return { user, profile, status }
}
```

---

## 8. Features Implemented

### Feature 1 — "Start Creating Campaigns" Navigation Fix

**File:** `src/pages/ConnectAccounts.jsx`  
**Change:** After connecting accounts, the button now navigates to the correct destination based on where the user came from.

**Logic:**
```
returnTo === '/package-a' or '/products' AND connected  → /post-content
returnTo === '/post-content'                            → /post-content
otherwise                                               → / (Landing)
```

**Before:** Always navigated to `/agents-hub` (CMO dashboard) regardless of flow.  
**After:** Returns to the appropriate page in the user's journey.

---

### Feature 2 — Package B "Post to Social" Smart Routing

**File:** `src/pages/PackageBPage.jsx`

When the user clicks **"Launch Post to Social"** from the Package B sidebar:

| Condition | Destination |
|---|---|
| ≥1 social account connected | `/post-content` directly |
| No accounts connected | `/connect-accounts` with `returnTo = '/post-content'` |

**Code:**
```js
if (agent.id === 'social-post') {
  if (connectedCount > 0) {
    navigate('/post-content', { state: { from: '/package-b', toolTitle: 'Post to Social', toolColor: '#6366f1' } })
  } else {
    sessionStorage.setItem('connectReturnTo', '/post-content')
    navigate('/connect-accounts', { state: { from: '/post-content' } })
  }
}
```

After connecting accounts, "Start Creating Campaigns" on ConnectAccounts brings the user to `/post-content`.

---

### Feature 3 — Caption Suite "Post Now" Button

**Files:** `src/pages/CaptionSuitePage.jsx`, `src/pages/PostContent.jsx`

After AI captions are generated, each platform card (Instagram, LinkedIn, TikTok, etc.) shows a **"Post Now"** button alongside "Copy all".

**CaptionSuitePage — button added to each card:**
```js
<button
  onClick={() => navigate('/post-content', {
    state: {
      captionPrefill: fullText,   // caption + CTA + hashtags
      platform: pKey,             // 'instagram' | 'linkedin' | etc.
      toolTitle: 'Caption Suite',
      toolColor: platform.color,
      from: '/caption-suite',
    }
  })}
>
  <Send size={12} /> Post Now
</button>
```

**PostContent — reads pre-filled data:**
```js
const captionPrefill  = navState?.captionPrefill || ''
const platformPrefill = navState?.platform       || ''

const [caption, setCaption] = useState(
  captionPrefill || (productName ? `Check out our latest ${productName}!...` : '')
)
const [selectedPlatforms, setSelected] = useState(
  platformPrefill ? [platformPrefill] : []
)
```

**Result:** Clicking "Post Now" on an Instagram card opens Post to Social with:
- The Instagram caption pre-filled in the caption box
- Instagram pre-selected in the platform selector
- User only needs to click "Post Now to 1 platform" to publish

---

## 9. Social Account Connection Guide

### Requirements before connecting

**Facebook:**
- Must be an **Admin** of the Facebook Page (not just editor)
- During the OAuth popup, make sure to **select your Page** when Facebook asks which pages to allow

**Instagram:**
- Instagram must be a **Business** or **Creator** account (not personal)
- Instagram must be **linked to a Facebook Page**
  - Link via: Instagram Settings → Account → Switch to Professional → connect Facebook Page
  - OR: Facebook Page Settings → Instagram → Connect Account
- Connect via the Facebook OAuth flow (Instagram uses Facebook's API)

**LinkedIn:**
- Must be signed into the LinkedIn account you want to post from
- OAuth grants `openid profile email w_member_social` scopes

**Gmail:**
- Must have a Google account
- OAuth grants permission to send emails on your behalf

**WhatsApp:**
- No connection required — always enabled
- Phone numbers are entered directly in the campaign form

### Common Errors

| Error | Cause | Fix |
|---|---|---|
| "No Facebook Pages found" | Page not selected during OAuth | Try again, check all pages during permission screen |
| Instagram not appearing | Not linked to Facebook Page | Link Instagram to Facebook Page first |
| LinkedIn "access denied" | Wrong account or revoked access | Disconnect and reconnect |
| OAuth callback blank page | Redirect URI mismatch | Contact developer — check app settings in platform console |

---

## 10. Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# AI
VITE_GROQ_API_KEY=

# Social OAuth
VITE_META_APP_ID=
VITE_LINKEDIN_CLIENT_ID=
VITE_TWITTER_CLIENT_ID=

# Media
VITE_CLOUDINARY_CLOUD_NAME=
VITE_WAVESPEED_API_KEY=

# Evoke Platform
VITE_COOKIE_DOMAIN=.evokemarketplace.com
VITE_ACCOUNTS_URL=https://accounts.evokemarketplace.com
VITE_API_BASE_URL=
VITE_MARKETPLACE_URL=
VITE_META_API_BASE=

# EGT Token
VITE_EGT_RPC_URL=
VITE_EGT_REWARD_POOL_ADDRESS=
```

**Dev mode note:** On localhost, `useEvokeSession` injects a hardcoded session automatically. No real SSO cookie is required for local development.

---

## 11. Services & APIs

### userService.js

| Function | Description |
|---|---|
| `getOrCreateUser(uid, displayName, email)` | Gets or creates Firestore user doc at `users/{uid}` |
| `saveSocialAccount(uid, platform, data)` | Saves OAuth tokens/page info to `users/{uid}.socialAccounts.{platform}` |
| `disconnectSocialAccount(uid, platform)` | Sets `connected: false` for a platform |
| `getUserData(uid)` | Fetches full user doc from Firestore |

### contentService.js

| Function | Description |
|---|---|
| `createContentItem(uid, data)` | Creates a new `content_items` document in Firestore |
| `getUserContentItems(uid)` | Fetches all content items for a user |
| `updateContentItem(id, updates)` | Updates a content item |
| `deleteContentItem(id)` | Deletes a content item |

### Groq API (AI Text Generation)

Used in: `CaptionSuitePage`, `CampaignForm`, `AgentPage`, `ReelScriptsPage`

```js
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [...],
    temperature: 0.75,
    max_tokens: 2500,
  })
})
```

---

## 12. n8n Automation Webhooks

All social posting goes through n8n workflows at `vasanth18.app.n8n.cloud`.

| Platform | Webhook |
|---|---|
| LinkedIn | `https://vasanth18.app.n8n.cloud/webhook/linkedin-oauth` |
| Twitter / X | `https://vasanth18.app.n8n.cloud/webhook/twitter-oauth` |
| Multi-platform post | Configured in `PostContent.jsx` → `config.js` |

**Post flow:**
1. User clicks "Post Now" in PostContent
2. App calls n8n webhook with `{ caption, platform, accessToken, pageId, ... }`
3. n8n workflow posts to the platform API
4. Success/failure returned to app

---

## Dev Setup

```bash
# Install dependencies
npm install

# Start dev server (runs on port 3005 or next available)
npm run dev

# Build for production
npm run build
```

Dev server auto-injects a test session — no SSO login required on localhost.
