/**
 * campaignPrefill.js
 * Builds the `prefill` object CampaignForm.jsx expects, straight from the
 * user's Brand Knowledge Base — so every campaign form (reached from a
 * "Recommended For You" card, the Dashboard, or the Brand KB completion
 * screen) opens pre-filled instead of blank.
 */

const OBJECTIVE_TO_GOAL = {
  increase_revenue:  'Drive Sales / Conversions',
  generate_leads:    'Generate Leads',
  brand_awareness:   'Increase Brand Awareness',
  launch_product:    'Launch New Product / Event',
  grow_social:       'Grow Community / Following',
  retain_customers:  'Re-engage Existing Customers',
}

const TONE_TO_FORM_TONE = {
  professional:  'Professional & Authoritative',
  friendly:      'Friendly & Conversational',
  bold:          'Bold & Energetic',
  playful:       'Witty & Humorous',
  inspirational: 'Inspirational & Motivational',
  luxurious:     'Luxury & Sophisticated',
  educational:   'Educational & Informative',
  empathetic:    'Casual & Relatable',
}

const AGE_RANGE_TO_TAG = {
  '18_24':   'Gen Z (18-24)',
  '25_34':   'Millennials (25-40)',
  '35_44':   'Millennials (25-40)',
  '45_54':   'Gen X (41-56)',
  '55_plus': 'Baby Boomers (57+)',
}

const INDUSTRY_LABELS = {
  digital_marketing:   'Digital Marketing',
  tech_saas:           'Tech / SaaS',
  ecommerce:            'E-Commerce / Retail',
  fashion:              'Fashion & Lifestyle',
  food_beverage:        'Food & Beverage',
  health_wellness:      'Health & Wellness',
  finance_fintech:      'Finance / Fintech',
  education:            'Education / EdTech',
  real_estate:          'Real Estate',
  media_entertainment:  'Media & Entertainment',
  hospitality:          'Hospitality & Travel',
  beauty:               'Beauty & Personal Care',
  automotive:           'Automotive',
  ngo_nonprofit:        'NGO / Non-Profit',
  agency:               'Agency / Consulting',
}

/** Builds a CampaignForm-compatible prefill object from the Brand Knowledge Base. */
export function buildCampaignPrefill(kb) {
  if (!kb) return null

  const objectives = Array.isArray(kb.primaryObjective) ? kb.primaryObjective : (kb.primaryObjective ? [kb.primaryObjective] : [])
  const goalType = objectives.map(o => OBJECTIVE_TO_GOAL[o]).find(Boolean) || ''

  const targetAudience = []
  if (kb.audienceType === 'b2b') targetAudience.push('Professionals / B2B')
  const ageTag = AGE_RANGE_TO_TAG[kb.ageRange]
  if (ageTag) targetAudience.push(ageTag)

  return {
    brandName:     kb.companyName || '',
    website:       kb.website || '',
    description:   kb.productService || '',
    industry:      INDUSTRY_LABELS[kb.industry] || (kb.industry || '').replace(/_/g, ' '),
    goalType,
    toneOfVoice:   TONE_TO_FORM_TONE[kb.toneOfVoice] || '',
    targetAudience,
  }
}
