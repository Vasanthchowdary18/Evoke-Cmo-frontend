// Canonical 12-step CMO journey (mirrors JourneyFooter.jsx) plus per-step
// handoff mappers that shape one agent's output into the next agent's
// pre-fill payload. Extend JOURNEY_STEP_MAPPERS as more hops are wired up.

export const JOURNEY_STEPS = [
  { step: 1,  label: 'Brand Setup',       path: '/brand-profile' },
  { step: 2,  label: 'Marketing Strategy', path: '/strategy' },
  { step: 3,  label: 'Campaign Planning', path: '/campaign-hub' },
  { step: 4,  label: 'Audience Builder',  path: '/audience-builder' },
  { step: 5,  label: 'Content Generation', path: '/caption-suite' },
  { step: 6,  label: 'Creative Assets',   path: '/creative-asset' },
  { step: 7,  label: 'Video Generation',  path: '/video-gen' },
  { step: 8,  label: 'Brand Governance',  path: '/brand-governance' },
  { step: 9,  label: 'Approval Queue',    path: '/queue' },
  { step: 10, label: 'Post Content',      path: '/post-content' },
  { step: 11, label: 'Analytics',         path: '/analytics' },
  { step: 12, label: 'Executive Report',  path: '/executive-report' },
]

const AUDIENCE_PLATFORM_MAP = {
  Facebook: 'facebook', Instagram: 'instagram', LinkedIn: 'linkedin',
  Google: 'youtube', TikTok: 'tiktok', Twitter: 'twitter',
}

// Maps a Strategy campaignRecommendations[].type string onto CampaignHub's type keys.
export function mapStrategyTypeToCampaignHub(typeText = '') {
  const t = typeText.toLowerCase()
  if (t.includes('lead')) return 'email_drip'
  if (t.includes('retention') || t.includes('retarget')) return 'funnel_cro'
  if (t.includes('brand')) return 'brand'
  if (t.includes('event')) return 'event'
  return 'product'
}

/** Strategy → Campaign Hub */
export function strategyToCampaignHub(result, inputs) {
  const top = result?.campaignRecommendations?.[0]
  return {
    fromStep: 2,
    recommendedType: top ? mapStrategyTypeToCampaignHub(top.type) : null,
    recommendedReason: top ? `${top.type} — ${top.platform}, ${top.budget} of budget (from your Strategy)` : null,
    industry: inputs?.industry,
    product: inputs?.product,
  }
}

/** Audience Builder → Content Generation (Caption Suite) */
export function audienceToCaptionSuite(data, inputs) {
  const primary = data?.primaryAudience
  const platforms = (primary?.platforms || [])
    .map(p => AUDIENCE_PLATFORM_MAP[p])
    .filter(Boolean)
  return {
    fromStep: 4,
    context: inputs?.product,
    prodAudience: primary?.description,
    lpAudience: primary?.description,
    platforms: platforms.length ? platforms : undefined,
    tone: data?.messagingBySegment?.primary,
  }
}

/** Content Generation (Caption Suite) → Creative Assets (Creative Asset Agent) */
export function captionSuiteToCreativeAsset(prodName, context) {
  return {
    fromStep: 5,
    productName: prodName,
    context,
  }
}
