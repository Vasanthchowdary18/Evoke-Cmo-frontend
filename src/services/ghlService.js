import { getUserData, saveSocialAccount, disconnectSocialAccount } from './userService'

const N8N_BASE = 'https://n8n-zvxi.srv1837606.hstgr.cloud/webhook'

export const GHL_LOCATION_CREATE_WEBHOOK = `${N8N_BASE}/evoke-location-create`
export const GHL_SOCIAL_START_WEBHOOK = `${N8N_BASE}/evoke-social-start`
export const GHL_SOCIAL_ACCOUNTS_WEBHOOK = `${N8N_BASE}/evoke-social-accounts`
export const GHL_SOCIAL_POST_WEBHOOK = `${N8N_BASE}/evoke-social-post`

/** Platforms publishable through GHL's Social Planner. */
export const GHL_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'threads', 'google']

/**
 * Shared workspace used while running on a Private Integration Token. A PIT is
 * issued per workspace, so everyone posts through this one until the agency
 * scope lands and each user can be given their own.
 *
 * The default is deliberate: relying on an env var meant any environment that
 * missed it silently disabled connecting, with no clue why. This is only a
 * workspace identifier — the token that can act on it lives server-side in n8n
 * — and the browser already sends it on every request. Set the env var to point
 * an environment somewhere else, or to '' to force per-user provisioning.
 */
const SHARED_LOCATION_ID =
  import.meta.env.VITE_GHL_LOCATION_ID ?? 'ePB8lCVVTftERqNprfkc'

/** Origins the OAuth popup is allowed to postMessage from. */
const TRUSTED_POPUP_ORIGINS = [
  'https://services.leadconnectorhq.com',
  'https://app.gohighlevel.com',
]

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    throw new Error(data?.error || data?.message || `Request failed: ${url}`)
  }
  return data
}

/**
 * Returns the user's GHL sub-account (location), or null if not provisioned yet.
 */
export async function getGhlAccount(uid) {
  const data = await getUserData(uid)
  const acc = data?.socialAccounts?.ghl
  return acc?.locationId ? acc : null
}

/**
 * Provisions a GHL sub-account for this user if they don't have one yet.
 * Every user gets their own location — that is what keeps one user's connected
 * pages invisible to every other user. Safe to call on every login.
 */
export async function ensureGhlLocation(uid, profile = {}) {
  const existing = await getGhlAccount(uid)
  if (existing) return existing

  // A workspace of the user's own is the correct model, so try that first. The
  // moment the agency app can provision locations this becomes the live path
  // for every new user with no code change.
  try {
    const { locationId } = await postJson(GHL_LOCATION_CREATE_WEBHOOK, {
      uid,
      businessName: profile.businessName || profile.displayName || 'Evoke User',
      email: profile.email || '',
      phone: profile.phone || '',
      country: profile.country || 'US',
      timezone: profile.timezone || 'America/New_York',
    })
    if (locationId) {
      const account = { locationId, dedicated: true }
      await saveSocialAccount(uid, 'ghl', account)
      return { connected: true, ...account }
    }
  } catch (err) {
    // Without a shared workspace to fall back on there is nothing left to try.
    if (!SHARED_LOCATION_ID) throw err
  }

  if (SHARED_LOCATION_ID) {
    const account = { locationId: SHARED_LOCATION_ID, dedicated: false }
    await saveSocialAccount(uid, 'ghl', account)
    return { connected: true, ...account }
  }

  throw new Error(
    'Could not create a workspace for this account. Finish the agency app setup, or set VITE_GHL_LOCATION_ID to share one workspace while testing.',
  )
}

/**
 * Opens the platform's own OAuth popup and resolves once it reports back.
 * The user logs in with THEIR account here — nothing of ours is involved.
 */
function openOAuthPopup(startUrl) {
  return new Promise((resolve, reject) => {
    const popup = window.open(startUrl, 'evoke_social_oauth', 'width=620,height=740')
    if (!popup) {
      reject(new Error('Popup blocked. Allow popups for this site and try again.'))
      return
    }

    let done = false
    const cleanup = () => {
      done = true
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
    }

    const onMessage = (event) => {
      if (!TRUSTED_POPUP_ORIGINS.includes(event.origin)) return
      const d = event.data
      if (!d || typeof d !== 'object') return
      if (!d.accountId && d.actionType !== 'close') return

      cleanup()
      try { popup.close() } catch { /* already closed */ }

      if (d.accountId) resolve(d)
      else reject(new Error(d.reason || 'Connection cancelled'))
    }

    const timer = setInterval(() => {
      if (!done && popup.closed) {
        cleanup()
        reject(new Error('Connection cancelled'))
      }
    }, 500)

    window.addEventListener('message', onMessage)
  })
}

/**
 * Step 1 of connecting a platform: opens the OAuth popup and returns the pages
 * the user can choose from. Nothing is saved yet — call attachSocialPage next.
 */
export async function startSocialConnect(uid, platform) {
  const acc = await ensureGhlLocation(uid)

  const started = await postJson(GHL_SOCIAL_START_WEBHOOK, {
    uid,
    platform,
    locationId: acc.locationId,
  })

  // Tolerate the response being wrapped, and fail loudly rather than opening a
  // blank popup when there is no URL to send the user to.
  const startUrl = started.startUrl || started.data?.startUrl || started[0]?.startUrl
  if (!startUrl) {
    throw new Error(`No sign-in URL returned for ${platform}: ${JSON.stringify(started).slice(0, 200)}`)
  }

  let accountId = ''
  try {
    accountId = (await openOAuthPopup(startUrl)).accountId
  } catch (err) {
    // Cancelling is only a dead end if nothing was linked on a previous run.
    const existing = await listConnectedPages(platform, acc.locationId, accountId)
    if (!existing.length) throw err
  }

  const pages = await listConnectedPages(platform, acc.locationId, accountId)
  return { accountId, pages, locationId: acc.locationId }
}

/**
 * Pages this sign-in authorised, for one platform.
 *
 * The workspace may hold other people's pages, so results are narrowed to the
 * account that just signed in — page ids are `<accountId>_<location>_<page>`.
 * Without this a user would see, and could publish to, someone else's page.
 */
async function listConnectedPages(platform, locationId, accountId = '') {
  const { pages } = await postJson(GHL_SOCIAL_ACCOUNTS_WEBHOOK, {
    action: 'list',
    locationId,
    platform,
  })

  const live = (pages || []).filter((p) => !p.isExpired)
  if (!accountId) return live

  // GHL doesn't document how the popup's accountId relates to the composite
  // page id, and the shape differs between platforms — so match loosely.
  const mine = live.filter((p) => String(p.originId || '').includes(accountId))
  if (mine.length) return mine

  // No match: rather than dead-ending the user, show what the workspace has.
  // On a shared workspace that can include another user's pages, so this is a
  // fallback to keep connecting possible, not the intended path.
  console.warn(
    `[ghlService] Could not match ${platform} pages to accountId "${accountId}" — ` +
    `showing all ${live.length} account(s) on this workspace.`,
    live.map((p) => p.originId),
  )
  return live
}

/**
 * Step 2: attaches the page the user picked and records it on their profile.
 * Writes under socialAccounts.<platform> so the existing Connect Accounts UI
 * lights up as connected without any change to how it reads state.
 */
export async function attachSocialPage(uid, platform, _accountId, page) {
  const acc = await getGhlAccount(uid)
  if (!acc) throw new Error('No GHL sub-account for this user')

  // No attach call needed — the page is already linked to the workspace by the
  // time the sign-in window closes. page.originId is the composite account id
  // that publishing expects, so record that as the id to post with.
  await saveSocialAccount(uid, platform, {
    viaGhl: true,
    ghlAccountId: page.originId,
    locationId: acc.locationId,
    pageName: page.name,
    avatar: page.avatar || '',
  })

  return { connected: true, pageName: page.name }
}

/** Disconnects a platform from the user's profile. */
export async function disconnectSocial(uid, platform) {
  await disconnectSocialAccount(uid, platform)
}

/**
 * Publishes a post to the user's own connected accounts.
 * platforms: array of platform keys; each must already be connected.
 * Omit scheduleDate to publish immediately.
 */
export async function publishSocialPost(uid, { platforms, caption, mediaUrls = [], scheduleDate = null }) {
  const data = await getUserData(uid)
  const accounts = data?.socialAccounts || {}
  const locationId = accounts.ghl?.locationId
  if (!locationId) throw new Error('No GHL sub-account for this user')

  const accountIds = platforms
    .map((p) => accounts[p])
    .filter((a) => a?.connected && a?.ghlAccountId)
    .map((a) => a.ghlAccountId)

  if (!accountIds.length) {
    throw new Error('None of the selected platforms are connected')
  }

  return postJson(GHL_SOCIAL_POST_WEBHOOK, {
    uid,
    locationId,
    accountIds,
    summary: caption,
    mediaUrls,
    scheduleDate,
  })
}
