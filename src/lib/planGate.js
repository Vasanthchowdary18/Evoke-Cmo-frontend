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
    'Caption Suite — all platforms',
    'Reel & short-form scripts',
    'Content generation & copywriting',
    'Multi-angle product photography',
    'Lifestyle & scene images',
    'Image SEO optimisation',
    'Video generation',
  ],
  'package-b': [
    'Everything in Package A',
    'Email Marketing Agent',
    'SEO Agent — full audit & strategy',
    'A/B Testing Framework',
    'Audience Builder & Trend Analysis',
    'CRM & lifecycle management',
    'Connect & post to social accounts',
    'Analytics dashboard & executive reports',
    '3D product images',
  ],
  'package-c': [
    'Everything in Package B',
    'Meta Ads Boost — paid ad creatives',
    'Multi-channel execution (7 channels)',
    'Facebook & Google Ads manager',
    'Precision audience targeting',
    'Team management & partner sharing',
  ],
}

/*
  Route-level plan requirements.
  Used by PlanGate component in App.jsx.
  'free' means open to all authenticated users.
*/
export const ROUTE_PLAN = {
  // ── Free (all authenticated users) ──
  '/agents-hub':            'free',
  '/plans':                 'free',
  '/free-plan':             'free',
  '/package-a':             'free',
  '/package-b':             'free',
  '/package-c':             'free',
  '/brand-profile':         'free',
  '/brand-kb':              'free',
  '/health-score':          'free',
  '/strategy':              'free',
  '/kpi-recommendations':   'free',

  // ── Package A ──
  '/caption-suite':         'package-a',
  '/reel-scripts':          'package-a',
  '/content-gen':           'package-a',
  '/copywriting':           'package-a',
  '/image-angles':          'package-a',
  '/image-360':             'package-a',
  '/image-lifestyle':       'package-a',
  '/image-seo':             'package-a',
  '/product-desc':          'package-a',
  '/video-gen':             'package-a',

  // ── Package B ──
  '/email-marketing':       'package-b',
  '/seo-agent':             'package-b',
  '/ab-testing':            'package-b',
  '/audience-builder':      'package-b',
  '/trends':                'package-b',
  '/crm':                   'package-b',
  '/analytics':             'package-b',
  '/executive-report':      'package-b',
  '/executive-reporting':   'package-b',
  '/campaign-hub':          'package-b',
  '/queue':                 'package-b',
  '/post-content':          'package-b',
  '/connect-accounts':      'package-b',
  '/inbox':                 'package-b',
  '/brand-governance':      'package-b',
  '/image-3d':              'package-b',

  // ── Package C ──
  '/meta-ads-boost':        'package-c',
  '/execution':             'package-c',
  '/team':                  'package-c',
  '/partner-sharing':       'package-c',
}
