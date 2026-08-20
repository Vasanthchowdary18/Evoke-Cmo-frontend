import { getUserData, saveSocialAccount, disconnectSocialAccount } from './userService'

const N8N_BASE = 'https://n8n-zvxi.srv1837606.hstgr.cloud/webhook'

export const META_ADS_OAUTH_WEBHOOK = `${N8N_BASE}/meta-ads-oauth`
export const META_ADS_BOOST_WEBHOOK = `${N8N_BASE}/meta-ads-boost`

/**
 * Returns the connected Meta Ads account for the user, or null if not connected.
 */
export async function getMetaAdsAccount(uid) {
  const data = await getUserData(uid)
  const acc = data?.socialAccounts?.['meta-ads']
  return acc?.connected ? acc : null
}

/**
 * Exchanges an OAuth code for a Meta access token + ad accounts list via n8n,
 * then saves the connection to Firestore under the user's own session (same
 * pattern as Google Ads / LinkedIn / Instagram / Facebook connect flows).
 */
export async function connectMetaAdsCallback(uid, code, redirectUri) {
  const res = await fetch(META_ADS_OAUTH_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri, uid }),
  })
  if (!res.ok) throw new Error('Meta Ads connection failed: ' + (await res.text()))
  const { accessToken, adAccounts, activeAdAccountId } = await res.json()
  await saveSocialAccount(uid, 'meta-ads', { accessToken, adAccounts, activeAdAccountId })
  return { accessToken, adAccounts, activeAdAccountId }
}

/** Disconnects the user's Meta Ads account. */
export async function disconnectMetaAds(uid) {
  await disconnectSocialAccount(uid, 'meta-ads')
}

/**
 * Creates a Meta Ads campaign (boost) via n8n — real Marketing API chain:
 * campaign -> ad set -> ad creative -> ad. Created PAUSED as a safety default.
 * boostData: { ad_account_id, post_id, page_id, image_url, caption, destination_url,
 *   daily_budget_usd, duration_days, goal, countries[], age_min, age_max, gender, interests[], placements[] }
 */
export async function createMetaAdsBoost(uid, boostData) {
  const acc = await getMetaAdsAccount(uid)
  if (!acc) throw new Error('Meta Ads account not connected')

  const res = await fetch(META_ADS_BOOST_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_user_id: uid,
      accessToken: acc.accessToken,
      ad_account_id: boostData.ad_account_id || acc.activeAdAccountId,
      ...boostData,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    throw new Error(data?.error || data?.details?.error?.message || 'Meta Ads campaign creation failed')
  }
  return data
}
