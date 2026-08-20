# 04 — n8n Automation Backend

[← Back to index](README.md)

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

## Contents

- [1. Complete webhook index](#1-complete-webhook-index)
- [2. Social OAuth flows](#2-social-oauth-flows-6-webhooks)
- [3. The main campaign engine](#3-the-main-campaign-engine--evoke-cmo)
- [4. The AI agents endpoint](#4-the-ai-agents-endpoint--evoke-agents)
- [5. GoHighLevel integration](#5-gohighlevel-integration-7-webhooks)
- [6. Paid ads](#6-paid-ads-5-webhooks)
- [7. Messaging webhooks](#7-messaging-webhooks-3)
- [8. The scheduled publisher](#8-the-scheduled-publisher--the-most-important-flow)
- [9. Credential storage strategy](#9-credential-storage-strategy)
- [10. Operating the workflow](#10-operating-the-workflow)

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
[08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

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
[08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

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
| **Hard-coded in node parameters** | ⚠️ Gemini API key, Twilio account SID | **Should be moved to credentials.** See [08](08-known-gaps-and-risks.md) |

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
[08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

### Debugging

- n8n's **Executions** tab shows every run with full per-node input/output — the fastest way
  to diagnose a failed publish.
- The `evoke-cmo` flow responds *before* it publishes, so a 200 in the browser tells you
  **nothing** about whether the post went out. Always check Executions.
- The scheduler runs every 15 minutes; a scheduled post can appear to "do nothing" for up to
  15 minutes and still be healthy.

---

[← Back to index](README.md) · [Next: Integrations →](05-integrations.md)
