import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, Target, Megaphone, BarChart2, Rocket, Play, Mail,
  Globe, TrendingUp, Zap, BookOpen, Edit3, ChevronRight, Loader2,
  Users, DollarSign, Calendar, Share2, Image, Film, Lightbulb,
  CheckCircle, ArrowRight, Star, Activity, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { canAccess, PLAN_LABELS, PLAN_COLORS } from '../lib/planGate.js'
import UpgradeModal from '../components/UpgradeModal.jsx'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const CARD2  = '#161410'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.10)'
const GBORDER= 'rgba(200,151,62,0.22)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.07)'

const goldGrad = {
  background: 'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}

/* ─── helpers ─── */
function Chip({ label, color = GOLD }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: 100,
      background: color + '14', border: `1px solid ${color}30`,
      fontSize: 12, fontWeight: 600, color,
    }}>{label}</span>
  )
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 12, color: TEXT3, fontWeight: 600, minWidth: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: TEXT, fontWeight: 500, lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

/* ─── Recommendation builder ─── */
function buildRecommendations(kb) {
  const recs = []
  const objectives = Array.isArray(kb.primaryObjective)
    ? kb.primaryObjective
    : (kb.primaryObjective ? [kb.primaryObjective] : [])
  const channels  = Array.isArray(kb.primaryChannels) ? kb.primaryChannels : []
  const budget    = kb.marketingBudget || ''
  const timeline  = kb.timeline || ''

  // Objective-based
  if (objectives.includes('increase_revenue') || objectives.includes('generate_leads')) {
    recs.push({
      icon: <TrendingUp size={20}/>, color: '#10b981',
      tag: 'GROWTH', requiredPlan: 'free',
      title: 'Launch a Growth Strategy Campaign',
      why: `Your goal to ${objectives.includes('increase_revenue') ? 'Increase Revenue' : 'Generate Leads'} maps directly to a GTM growth plan.`,
      action: 'EVOX will build a full Go-To-Market strategy with revenue forecasts, target segments, and a milestone roadmap.',
      cta: 'Start Growth Campaign', path: '/campaign/growth_strategy',
    })
  }
  if (objectives.includes('build_awareness')) {
    recs.push({
      icon: <Megaphone size={20}/>, color: '#f59e0b',
      tag: 'AWARENESS', requiredPlan: 'free',
      title: 'Run a Brand Awareness Campaign',
      why: 'Brand Awareness is your selected objective — the right campaign amplifies your reach across all channels.',
      action: 'EVOX builds a brand strategy, messaging framework, and multi-platform content plan tailored to your audience.',
      cta: 'Start Brand Campaign', path: '/campaign/brand_strategy',
    })
  }
  if (objectives.includes('launch_product')) {
    recs.push({
      icon: <Rocket size={20}/>, color: '#a855f7',
      tag: 'PRODUCT LAUNCH', requiredPlan: 'free',
      title: 'Build a Product Launch Campaign',
      why: 'You\'re planning to launch a product — EVOX will plan the full launch sequence.',
      action: 'Pre-launch buzz, launch day posts, email sequence, and a paid ad brief — all generated in one go.',
      cta: 'Launch Product Campaign', path: '/campaign/event_full',
    })
  }
  if (objectives.includes('retain_customers')) {
    recs.push({
      icon: <Users size={20}/>, color: '#06b6d4',
      tag: 'RETENTION', requiredPlan: 'free',
      title: 'Create a Customer Retention Email Drip',
      why: 'Retaining customers is your goal — email drip campaigns have the highest ROI for retention.',
      action: 'EVOX writes a 5-email nurture sequence with re-engagement hooks, loyalty offers, and personalised CTAs.',
      cta: 'Build Email Drip', path: '/campaign/email_drip',
    })
  }
  if (objectives.includes('grow_social')) {
    recs.push({
      icon: <Share2 size={20}/>, color: '#ec4899',
      tag: 'SOCIAL GROWTH', requiredPlan: 'free',
      title: 'Generate a 30-Day Content Calendar',
      why: 'Growing your social following requires consistent, high-quality content every day.',
      action: 'EVOX creates a full 30-day content calendar with daily post ideas, captions, hashtags and visuals.',
      cta: 'Generate Content Calendar', path: '/campaign/content_calendar',
    })
  }

  // Channel-based
  if (channels.includes('social_media') || channels.includes('content_video')) {
    recs.push({
      icon: <Film size={20}/>, color: '#f97316',
      tag: 'VIDEO CONTENT', requiredPlan: 'package-b',
      title: 'Generate Reels & Short-Form Videos',
      why: `You selected ${channels.includes('content_video') ? 'Content / Video' : 'Social Media'} as a primary channel — video is the #1 driver of reach.`,
      action: 'EVOX writes Reel scripts, hooks, and captions optimised for Instagram, TikTok, and YouTube Shorts.',
      cta: 'Generate Reel Scripts', path: '/reel-scripts',
    })
  }
  if (channels.includes('email_marketing')) {
    recs.push({
      icon: <Mail size={20}/>, color: '#3b82f6',
      tag: 'EMAIL', requiredPlan: 'free',
      title: 'Build an Email Drip Campaign',
      why: 'Email Marketing is your channel — a well-crafted drip sequence converts leads at 3–5× the rate of social.',
      action: 'EVOX builds a personalised 5-email nurture series with subject lines, CTAs, and timing strategy.',
      cta: 'Build Email Campaign', path: '/campaign/email_drip',
    })
  }
  if (channels.includes('seo_blog')) {
    recs.push({
      icon: <Globe size={20}/>, color: '#14b8a6',
      tag: 'SEO', requiredPlan: 'free',
      title: 'Write SEO Blog Posts to Drive Organic Traffic',
      why: 'You selected SEO / Blog as a channel — organic search drives the highest-quality, lowest-cost traffic.',
      action: 'EVOX writes a full 1,500-word SEO-optimised blog with meta tags, internal links, and keyword strategy.',
      cta: 'Generate SEO Blog', path: '/campaign/seo_blog',
    })
  }
  if (channels.includes('paid_ads')) {
    recs.push({
      icon: <BarChart2 size={20}/>, color: '#6366f1',
      tag: 'PAID ADS', requiredPlan: 'package-c',
      title: 'Launch Google & Meta Ad Campaigns',
      why: 'Paid Ads is your selected channel — running targeted ads will immediately boost website traffic and leads.',
      action: 'EVOX builds your ad creatives, audience targeting, and campaign structure for Google & Meta — ready to deploy.',
      cta: 'Boost with Paid Ads', path: '/meta-ads-boost',
    })
  }
  if (channels.includes('whatsapp')) {
    recs.push({
      icon: <Megaphone size={20}/>, color: '#10b981',
      tag: 'WHATSAPP', requiredPlan: 'free',
      title: 'Create a WhatsApp Marketing Sequence',
      why: 'WhatsApp has a 98% open rate — the highest of any marketing channel you can use.',
      action: 'EVOX writes a WhatsApp broadcast sequence with message templates, follow-ups and conversion hooks.',
      cta: 'Build WhatsApp Campaign', path: '/campaign/email_drip',
    })
  }
  if (channels.includes('linkedin')) {
    recs.push({
      icon: <Users size={20}/>, color: '#0ea5e9',
      tag: 'LINKEDIN', requiredPlan: 'free',
      title: 'Publish LinkedIn Thought-Leadership Posts',
      why: 'LinkedIn is your selected channel — thought-leadership content builds authority and generates B2B leads.',
      action: 'EVOX writes a series of LinkedIn posts, hooks, and a long-form article optimised for your industry.',
      cta: 'Generate LinkedIn Content', path: '/campaign/content_calendar',
    })
  }

  // Budget-based
  if (budget === 'under_1k') {
    recs.push({
      icon: <Lightbulb size={20}/>, color: '#eab308',
      tag: 'BUDGET TIP', requiredPlan: 'free',
      title: 'Maximise ROI with Organic-First Strategy',
      why: 'With a lean budget, organic content + email outperform paid ads for your spend tier.',
      action: 'EVOX will prioritise SEO, content calendars, and email sequences to generate leads without ad spend.',
      cta: 'View Free Strategies', path: '/campaign/content_calendar',
    })
  }
  if (['5k_20k', '20k_plus'].includes(budget)) {
    recs.push({
      icon: <DollarSign size={20}/>, color: '#10b981',
      tag: 'SCALE', requiredPlan: 'package-c',
      title: 'Scale with a Full Multi-Channel Campaign',
      why: `Your ${budget === '20k_plus' ? '$20K+' : '$5K–$20K'}/mo budget unlocks paid + organic scaling at the same time.`,
      action: 'EVOX builds a coordinated strategy across paid ads, content, email and social — all running in parallel.',
      cta: 'Build Full Campaign', path: '/campaign-hub',
    })
  }

  // Visuals — Package A
  recs.push({
    icon: <Image size={20}/>, color: '#c8973e',
    tag: 'VISUALS', requiredPlan: 'package-a',
    title: 'Generate On-Brand Product & Lifestyle Images',
    why: `Your ${kb.industry || 'brand'} needs professional visuals to stand out — AI can generate them in seconds.`,
    action: 'EVOX generates studio-quality product shots, lifestyle images, and ad-ready banners using your brand colours.',
    cta: 'Generate Brand Images', path: '/products',
  })

  return recs.slice(0, 6)
}

/* ─── Map KB industry to CampaignForm dropdown value ─── */
function mapIndustry(kbIndustry) {
  if (!kbIndustry) return ''
  const v = kbIndustry.toLowerCase()
  if (v.includes('saas') || v.includes('software') || v.includes('tech'))      return 'Technology / SaaS'
  if (v.includes('ecomm') || v.includes('retail') || v.includes('shop'))       return 'E-commerce / Retail'
  if (v.includes('health') || v.includes('wellness') || v.includes('medical')) return 'Healthcare / Wellness'
  if (v.includes('financ') || v.includes('fintech') || v.includes('bank'))     return 'Finance / Fintech'
  if (v.includes('educ') || v.includes('edtech') || v.includes('learn'))       return 'Education / EdTech'
  if (v.includes('real estate') || v.includes('property'))                     return 'Real Estate'
  if (v.includes('food') || v.includes('beverage') || v.includes('restaurant'))return 'Food & Beverage'
  if (v.includes('fashion') || v.includes('apparel') || v.includes('cloth'))   return 'Fashion & Apparel'
  if (v.includes('travel') || v.includes('hospitality') || v.includes('hotel'))return 'Travel & Hospitality'
  if (v.includes('market') || v.includes('advertis') || v.includes('agency'))  return 'Marketing & Advertising'
  if (v.includes('media') || v.includes('entertainment'))                       return 'Media & Entertainment'
  if (v.includes('manufactur') || v.includes('product'))                        return 'Manufacturing'
  if (v.includes('consult') || v.includes('professional') || v.includes('service')) return 'Professional Services'
  if (v.includes('non.profit') || v.includes('ngo') || v.includes('charity'))  return 'Non-profit / NGO'
  return 'Other'
}

/* ─── Map KB budget to CampaignForm dropdown value ─── */
function mapBudget(kbBudget) {
  const map = {
    under_1k: 'Under $500',
    '1k_5k':  '$500–$2,000',
    '5k_20k': '$5,000–$15,000',
    '20k_plus':'Above $50,000',
    no_budget: 'Under $500',
  }
  return map[kbBudget] || ''
}

/* ─── Map KB geographicFocus to CampaignForm location dropdown ─── */
function mapLocation(geo) {
  if (!geo) return ''
  const v = geo.toLowerCase()
  if (v.includes('india'))       return 'India'
  if (v.includes('usa') || v.includes('united states') || v.includes('us')) return 'United States'
  if (v.includes('uk') || v.includes('united kingdom')) return 'United Kingdom'
  if (v.includes('europe'))      return 'Europe'
  if (v.includes('middle east') || v.includes('uae') || v.includes('gulf')) return 'Middle East'
  if (v.includes('southeast asia') || v.includes('sea')) return 'Southeast Asia'
  if (v.includes('australia'))   return 'Australia / New Zealand'
  if (v.includes('canada'))      return 'Canada'
  if (v.includes('latin') || v.includes('south america')) return 'Latin America'
  if (v.includes('africa'))      return 'Africa'
  if (v.includes('global') || v.includes('worldwide')) return 'Global'
  return ''
}

/* ─── Build CampaignForm prefill from KB ─── */
function buildPrefill(kb) {
  if (!kb) return {}
  const objectives = Array.isArray(kb.primaryObjective)
    ? kb.primaryObjective : (kb.primaryObjective ? [kb.primaryObjective] : [])
  const objLabels = objectives.map(v => OBJECTIVE_LABELS[v] || v).join(', ')

  const descParts = [
    kb.companyName && `${kb.companyName} is a ${kb.industry || 'business'}.`,
    kb.brandTagline && `"${kb.brandTagline}".`,
    kb.toneOfVoice && `Brand tone: ${kb.toneOfVoice}.`,
    kb.audienceType && `Target audience: ${kb.audienceType}`,
    kb.ageRange && `(${kb.ageRange})`,
    kb.geographicFocus && `in ${kb.geographicFocus}.`,
    kb.brandPersonality && `Brand personality: ${kb.brandPersonality}.`,
    objLabels && `Goals: ${objLabels}.`,
    kb.additionalNotes && `Notes: ${kb.additionalNotes}`,
  ].filter(Boolean).join(' ')

  return {
    name:        kb.companyName  || '',   // "Company / Brand" field for growth_strategy
    brandName:   kb.companyName  || '',   // Brand Name for other types
    industry:    mapIndustry(kb.industry),
    description: descParts,
    goalType:    objectives[0]   || '',
    website:     kb.website      || '',
    budget:      mapBudget(kb.marketingBudget),
    location:    mapLocation(kb.geographicFocus),
  }
}

/* ─── Constants for label lookup ─── */
const OBJECTIVE_LABELS = {
  increase_revenue: 'Increase Revenue',
  generate_leads:   'Generate Leads',
  build_awareness:  'Build Brand Awareness',
  launch_product:   'Launch a Product',
  grow_social:      'Grow Social Following',
  retain_customers: 'Retain Customers',
}
const CHANNEL_LABELS = {
  social_media:    'Social Media',
  email_marketing: 'Email Marketing',
  seo_blog:        'SEO / Blog',
  paid_ads:        'Paid Ads',
  whatsapp:        'WhatsApp',
  linkedin:        'LinkedIn',
  content_video:   'Content / Video',
  influencer:      'Influencer',
}
const BUDGET_LABELS = {
  under_1k: 'Under $1K / mo',
  '1k_5k':  '$1K – $5K / mo',
  '5k_20k': '$5K – $20K / mo',
  '20k_plus':'$20K+ / mo',
  no_budget: 'No Paid Budget',
}
const TIMELINE_LABELS = {
  '1_month':  '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '12_months':'12 Months',
}

export default function BrandProfilePage() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [kb, setKb]    = useState(null)
  const [loading, setLoading] = useState(true)
  const { plan }       = useUserPlan()
  const [upgradeFor, setUpgradeFor] = useState(null) // { requiredPlan, featureTitle }

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      setKb(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!kb || Object.keys(kb).length < 2) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '140px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>No Brand Profile Yet</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginBottom: 28 }}>Complete your Brand Knowledge Base first so EVOX can build your personalised strategy.</p>
          <button onClick={() => navigate('/brand-kb')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 100, color: '#0e0c09', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Set Up Brand KB →
          </button>
        </div>
      </div>
    )
  }

  const objectives = Array.isArray(kb.primaryObjective)
    ? kb.primaryObjective
    : (kb.primaryObjective ? [kb.primaryObjective] : [])
  const channels   = Array.isArray(kb.primaryChannels) ? kb.primaryChannels : []
  const recs       = buildRecommendations(kb)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 28px 80px' }}>

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                <Activity size={11}/> EVOX CMO · Brand Profile
              </div>
              <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px', fontFamily: "'Syne','Inter',sans-serif" }}>
                {kb.companyName ? <>{kb.companyName}'s <span style={goldGrad}>CMO Strategy</span></> : <span style={goldGrad}>Your CMO Strategy</span>}
              </h1>
              <p style={{ fontSize: 14, color: TEXT2, margin: 0, lineHeight: 1.6 }}>
                Built from your brand profile · EVOX personalises every campaign to your goals
              </p>
            </div>
            <button
              onClick={() => navigate('/brand-kb', { state: { edit: true } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 100, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GBORDER; e.currentTarget.style.color = GOLD }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 }}
            >
              <Edit3 size={14}/> Edit Profile
            </button>
          </div>
        </motion.div>

        {/* ═══ PROFILE GRID ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Brand Identity */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionCard title="Brand Identity" icon={<Building2 size={16}/>}>
              <Row label="Company Name"    value={kb.companyName} />
              <Row label="Industry"        value={kb.industry} />
              <Row label="Company Size"    value={kb.companySize} />
              <Row label="Founded"         value={kb.foundedYear} />
              <Row label="Website"         value={kb.website} />
              <Row label="Tagline"         value={kb.brandTagline} />
              <Row label="Brand Personality" value={kb.brandPersonality} />
            </SectionCard>
          </motion.div>

          {/* Target Audience */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionCard title="Target Audience" icon={<Users size={16}/>}>
              <Row label="Audience Type"     value={kb.audienceType} />
              <Row label="Age Range"         value={kb.ageRange} />
              <Row label="Geographic Focus"  value={kb.geographicFocus} />
              <Row label="Pricing Range"     value={kb.pricingRange} />
              {kb.competitors?.filter(Boolean).length > 0 && (
                <div style={{ padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 12, color: TEXT3, fontWeight: 600, marginBottom: 8 }}>Competitors</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {kb.competitors.filter(Boolean).map((c, i) => <Chip key={i} label={c} color={TEXT2}/>)}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>

          {/* Brand Voice */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard title="Brand Voice & Style" icon={<Star size={16}/>}>
              <Row label="Tone of Voice"  value={kb.toneOfVoice} />
              <Row label="Visual Style"   value={kb.visualStyle} />
              {kb.brandColors?.primary && (
                <div style={{ padding: '9px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: TEXT3, fontWeight: 600, minWidth: 150 }}>Brand Colours</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[kb.brandColors.primary, kb.brandColors.secondary, kb.brandColors.accent].filter(Boolean).map((c, i) => (
                      <div key={i} title={c} style={{ width: 22, height: 22, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,0.15)' }}/>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(kb.brandValues) && kb.brandValues.length > 0 && (
                <div style={{ padding: '9px 0' }}>
                  <div style={{ fontSize: 12, color: TEXT3, fontWeight: 600, marginBottom: 8 }}>Brand Values</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {kb.brandValues.map(v => <Chip key={v} label={v} color={GOLD}/>)}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Business Goals */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SectionCard title="Business Goals" icon={<Target size={16}/>}>
              {objectives.length > 0 && (
                <div style={{ padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 12, color: TEXT3, fontWeight: 600, marginBottom: 8 }}>Objectives</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {objectives.map(v => <Chip key={v} label={OBJECTIVE_LABELS[v] || v} color={GOLD}/>)}
                  </div>
                </div>
              )}
              <Row label="Target Metric"   value={kb.objectiveTarget} />
              <Row label="Revenue Target"  value={kb.revenueTarget} />
              <Row label="Timeline"        value={TIMELINE_LABELS[kb.timeline] || kb.timeline} />
              <Row label="Marketing Budget" value={BUDGET_LABELS[kb.marketingBudget] || kb.marketingBudget} />
              {channels.length > 0 && (
                <div style={{ padding: '9px 0' }}>
                  <div style={{ fontSize: 12, color: TEXT3, fontWeight: 600, marginBottom: 8 }}>Primary Channels</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {channels.map(v => <Chip key={v} label={CHANNEL_LABELS[v] || v} color='#10b981'/>)}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* ═══ AI CMO RECOMMENDATIONS ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              <Zap size={11}/> AI CMO Recommendations
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', fontFamily: "'Syne','Inter',sans-serif" }}>
              What EVOX Recommends <span style={goldGrad}>For You</span>
            </h2>
            <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>
              Based on your brand profile, objectives, and channels — personalised to {kb.companyName || 'your brand'}.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {recs.map((rec, i) => {
              const locked = !canAccess(plan, rec.requiredPlan === 'free' ? 'strategy_campaigns' : rec.requiredPlan === 'package-a' ? 'image_angles' : rec.requiredPlan === 'package-b' ? 'lifestyle_video' : 'meta_ads')
              const needsPlan = rec.requiredPlan !== 'free' && locked
              const planColor = needsPlan ? (PLAN_COLORS[rec.requiredPlan] || '#888') : rec.color
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  style={{
                    background: CARD2, border: `1px solid ${needsPlan ? 'rgba(255,255,255,0.05)' : BORDER}`,
                    borderRadius: 16, padding: '20px 20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                    opacity: needsPlan ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!needsPlan) { e.currentTarget.style.borderColor = rec.color + '40'; e.currentTarget.style.background = rec.color + '06' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = needsPlan ? 'rgba(255,255,255,0.05)' : BORDER; e.currentTarget.style.background = CARD2 }}
                >
                  {/* Lock badge top-right */}
                  {needsPlan && (
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: planColor + '18', border: `1px solid ${planColor}30`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: planColor }}>
                      <Lock size={9}/> {PLAN_LABELS[rec.requiredPlan]}
                    </div>
                  )}

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: rec.color + '14', border: `1px solid ${rec.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: needsPlan ? TEXT3 : rec.color }}>
                      {needsPlan ? <Lock size={18}/> : rec.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: needsPlan ? 80 : 0 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: rec.color + '14', borderRadius: 100, fontSize: 9, fontWeight: 800, color: needsPlan ? TEXT3 : rec.color, letterSpacing: '0.08em', marginBottom: 5 }}>
                        {rec.tag}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: needsPlan ? TEXT2 : TEXT, lineHeight: 1.3 }}>{rec.title}</div>
                    </div>
                  </div>

                  {/* Why */}
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', marginBottom: 4 }}>WHY THIS</div>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55 }}>{rec.why}</div>
                  </div>

                  {/* What EVOX does */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <CheckCircle size={14} color={needsPlan ? TEXT3 : rec.color} style={{ flexShrink: 0, marginTop: 1 }}/>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55 }}>{rec.action}</div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => needsPlan
                      ? setUpgradeFor({ requiredPlan: rec.requiredPlan, featureTitle: rec.title })
                      : navigate(rec.path, { state: { prefill: buildPrefill(kb), from: '/brand-profile' } })
                    }
                    style={{
                      marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 16px',
                      background: needsPlan ? 'rgba(255,255,255,0.04)' : rec.color + '16',
                      border: `1px solid ${needsPlan ? 'rgba(255,255,255,0.08)' : rec.color + '35'}`,
                      borderRadius: 10, color: needsPlan ? TEXT3 : rec.color,
                      fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = needsPlan ? planColor + '15' : rec.color + '28'; if (needsPlan) e.currentTarget.style.color = planColor }}
                    onMouseLeave={e => { e.currentTarget.style.background = needsPlan ? 'rgba(255,255,255,0.04)' : rec.color + '16'; if (needsPlan) e.currentTarget.style.color = TEXT3 }}
                  >
                    {needsPlan ? <><Lock size={11}/> Upgrade to {PLAN_LABELS[rec.requiredPlan]}</> : <>{rec.cta} <ChevronRight size={13}/></>}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ═══ FOOTER CTA ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ marginTop: 48, padding: '28px 32px', background: 'linear-gradient(135deg,rgba(200,151,62,0.08),rgba(200,151,62,0.03))', border: `1px solid ${GBORDER}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 5 }}>Ready to launch your first campaign?</div>
            <div style={{ fontSize: 13, color: TEXT2 }}>EVOX will use your brand profile to personalise everything — automatically.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => { sessionStorage.setItem('kbSetupFlow', '1'); navigate('/connect-accounts', { state: { from: '/brand-profile' } }) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 100, color: '#0e0c09', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,151,62,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              Next: Connect Platforms <ArrowRight size={15}/>
            </button>
            <button
              onClick={() => navigate('/campaign-hub')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'transparent', border: `1px solid rgba(200,151,62,0.3)`, borderRadius: 100, color: GOLD, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,151,62,0.6)'; e.currentTarget.style.background = 'rgba(200,151,62,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,151,62,0.3)'; e.currentTarget.style.background = 'transparent' }}
            >
              Skip to Campaign Hub
            </button>
            <button
              onClick={() => navigate('/agents-hub')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 100, color: TEXT2, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = TEXT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 }}
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Upgrade modal */}
      {upgradeFor && (
        <UpgradeModal
          requiredPlan={upgradeFor.requiredPlan}
          featureTitle={upgradeFor.featureTitle}
          onClose={() => setUpgradeFor(null)}
        />
      )}
    </div>
  )
}
