import { getUserData } from './userService'

const N8N_BASE = 'https://vasanthchowdary373.app.n8n.cloud/webhook'

export const GOOGLE_ADS_CREATE_WEBHOOK = `${N8N_BASE}/google-ads-create-campaign`
export const GOOGLE_ADS_METRICS_WEBHOOK = `${N8N_BASE}/google-ads-metrics`

/**
 * Returns the connected Google Ads account for the user, or null if not connected.
 */
export async function getGoogleAdsAccount(uid) {
  const data = await getUserData(uid)
  const acc = data?.socialAccounts?.['google-ads']
  return acc?.connected ? acc : null
}

/**
 * Creates a Responsive Search Ad campaign in Google Ads via n8n.
 * campaignData: { name, headlines[], descriptions[], keywords[], budget, startDate, finalUrl }
 */
export async function createGoogleAdsCampaign(uid, campaignData) {
  const acc = await getGoogleAdsAccount(uid)
  if (!acc) throw new Error('Google Ads account not connected')

  const res = await fetch(GOOGLE_ADS_CREATE_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      customerId: acc.customerId,
      accessToken: acc.accessToken,
      refreshToken: acc.refreshToken,
      ...campaignData,
    }),
  })

  if (!res.ok) throw new Error('Campaign creation failed: ' + (await res.text()))
  return res.json()
}

/**
 * Fetches Google Ads campaign metrics from n8n for the last 30 days.
 * Returns: { impressions, clicks, ctr, spend, conversions, roas, campaigns[] }
 */
export async function getGoogleAdsMetrics(uid) {
  const acc = await getGoogleAdsAccount(uid)
  if (!acc) return null

  const res = await fetch(GOOGLE_ADS_METRICS_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      customerId: acc.customerId,
      accessToken: acc.accessToken,
      refreshToken: acc.refreshToken,
    }),
  })

  if (!res.ok) return null

  const raw = await res.json()

  // Normalise response — n8n may return nested or flat structure
  const data = Array.isArray(raw) ? raw[0] : raw

  return {
    impressions: Number(data.impressions ?? data.metrics?.impressions ?? 0),
    clicks:      Number(data.clicks      ?? data.metrics?.clicks      ?? 0),
    // CTR: accept both decimal (0.0616) and percentage (6.16) — normalise to percentage
    ctr:         (() => {
      const v = Number(data.ctr ?? data.metrics?.ctr ?? 0)
      return v > 1 ? v : v * 100  // if > 1 it's already a %, else convert
    })(),
    spend:       Number(data.spend ?? data.cost ?? data.metrics?.cost_micros ?? 0) / (data.metrics?.cost_micros ? 1_000_000 : 1),
    conversions: Number(data.conversions ?? data.metrics?.conversions ?? 0),
    roas:        Number(data.roas ?? data.metrics?.all_conversions_value ?? 0),
    campaigns:   data.campaigns ?? [],
    status:      data.status ?? 'active',
  }
}

/**
 * Parses campaign result content into Google Ads headlines and descriptions.
 * Google Ads: max 15 headlines (30 chars each), max 4 descriptions (90 chars each).
 */
export function extractAdsContent(campaignResult, campaignType) {
  const headlines = []
  const descriptions = []

  const addHeadline = (text) => {
    if (!text) return
    const clean = text.replace(/[#*_~`]/g, '').trim().slice(0, 30)
    if (clean && !headlines.includes(clean) && headlines.length < 15) headlines.push(clean)
  }

  const addDesc = (text) => {
    if (!text) return
    const clean = text.replace(/[#*_~`]/g, '').trim().slice(0, 90)
    if (clean && !descriptions.includes(clean) && descriptions.length < 4) descriptions.push(clean)
  }

  if (typeof campaignResult === 'string') {
    const lines = campaignResult.split('\n').map(l => l.trim()).filter(Boolean)
    lines.slice(0, 15).forEach((l, i) => i < 5 ? addHeadline(l) : addDesc(l))
    return { headlines, descriptions }
  }

  if (campaignResult?.emailSubject) addHeadline(campaignResult.emailSubject)
  if (campaignResult?.linkedinPost) addDesc(campaignResult.linkedinPost?.slice(0, 90))
  if (campaignResult?.emailBody) {
    campaignResult.emailBody.split('\n').slice(0, 3).forEach(addDesc)
  }
  if (campaignResult?.whatsappMessage) addDesc(campaignResult.whatsappMessage?.slice(0, 90))

  if (headlines.length < 3) {
    const fallbacks = ['Grow Your Business', 'AI-Powered Marketing', 'Start Today — Free']
    fallbacks.forEach(addHeadline)
  }
  if (descriptions.length < 2) {
    descriptions.push('EVOX AI generates your complete marketing campaign in seconds.')
    descriptions.push('Launch campaigns on every channel — automatically.')
  }

  return { headlines, descriptions }
}
