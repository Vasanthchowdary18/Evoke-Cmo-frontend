# 06 — Data Model

[← Back to index](README.md)

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
> The duplication is historical — see [08](08-known-gaps-and-risks.md).

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
> [08-known-gaps-and-risks.md](08-known-gaps-and-risks.md).

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

[← Back to index](README.md) · [Next: Environment & Deployment →](07-environment-and-deployment.md)
