/**
 * planGate.js
 * Defines which features are available per plan.
 * Plans are cumulative — Package B includes everything in A, etc.
 */

export const PLANS = ['free', 'package-a', 'package-b', 'package-c']

export const PLAN_LABELS = {
  'free':      'Free',
  'package-a': 'Package A',
  'package-b': 'Package B',
  'package-c': 'Package C',
}

export const PLAN_COLORS = {
  'free':      '#10b981',
  'package-a': '#3b82f6',
  'package-b': '#c8973e',
  'package-c': '#a855f7',
}

export const PLAN_TAGS = {
  'free':      'FREE',
  'package-a': 'STARTER',
  'package-b': 'POPULAR',
  'package-c': 'PREMIUM',
}

/*
  Feature keys and which plan first unlocks them.
  A higher plan automatically includes all lower-plan features.
*/
export const FEATURE_PLAN = {
  // ── Free features (always available) ──
  strategy_campaigns:  'free',   // Growth, Brand, Content, Email, SEO, Event, Sales, CRO, Competitive
  brand_kb:            'free',
  health_score:        'free',
  connect_accounts:    'free',
  campaign_hub:        'free',
  analytics_basic:     'free',
  reel_scripts:        'free',
  caption_suite:       'free',

  // ── Package A ──
  image_angles:        'package-a',   // Multi-angle product shots
  lifestyle_images:    'package-a',   // Lifestyle / scene images
  banner_creation:     'package-a',   // Ad-ready static banners
  social_posting:      'package-a',   // Managed social scheduling
  image_seo:           'package-a',

  // ── Package B ──
  lifestyle_video:     'package-b',   // Short-form lifestyle video
  video_360:           'package-b',   // 360° product video
  content_30day:       'package-b',   // 30-day full content package

  // ── Package C ──
  image_3d:            'package-c',   // 3D product renders
  ads_creation:        'package-c',   // Ad creatives
  meta_ads:            'package-c',   // Meta Ads Boost
  google_ads:          'package-c',   // Google Ads
  audience_selection:  'package-c',   // Precision targeting
  deploy_ads:          'package-c',   // Full campaign launch & management
}

/** Returns true if the user's plan can access the given feature */
export function canAccess(userPlan, featureKey) {
  const requiredPlan = FEATURE_PLAN[featureKey]
  if (!requiredPlan) return true // unknown features default to open
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

/** Returns the plan required for a feature, or null if free */
export function requiredPlanFor(featureKey) {
  return FEATURE_PLAN[featureKey] || 'free'
}

/** Returns upgrade label: e.g. "Upgrade to Package A" */
export function upgradeLabel(featureKey) {
  const plan = requiredPlanFor(featureKey)
  return plan === 'free' ? null : `Upgrade to ${PLAN_LABELS[plan]}`
}

export const PLAN_HIGHLIGHTS = {
  'package-a': [
    'Multi-angle product photography',
    'Lifestyle & scene images',
    'Ad-ready static banners',
    'Managed social media posting',
  ],
  'package-b': [
    'Everything in Package A',
    'Lifestyle short-form video',
    '360° product video',
    'Full 30-day content calendar',
  ],
  'package-c': [
    'Everything in Package B',
    '3D product renders',
    'Ad creatives (static + video)',
    'Facebook & Google Ads manager',
    'Precision audience targeting',
    'Full campaign deploy & management',
  ],
}
