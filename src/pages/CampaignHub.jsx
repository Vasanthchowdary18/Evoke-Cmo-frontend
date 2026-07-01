import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Package, Zap, TrendingUp, Mail, Users, Sparkles, ChevronLeft, ArrowRight, Megaphone, Star, BookOpen, Lock } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { canAccess } from '../lib/planGate.js'
import UpgradeModal from '../components/UpgradeModal.jsx'

const BG     = '#0e0c09'
const CARD   = '#141210'
const CARD2  = '#1c1a13'
const GOLD   = '#c8973e'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.07)'
const FONT   = "'Inter','Syne',sans-serif"

const CAMPAIGN_TYPES = [
  {
    type: 'event',
    label: 'Event Campaign',
    desc: 'Promote events with full multi-channel campaign — social posts, email invites, and post-event follow-up.',
    icon: <Calendar size={22} />,
    color: '#c8973e',
    badge: 'STARTER',
    planRequired: 'free',
    industries: ['hospitality', 'education', 'ngo_nonprofit', 'agency', 'tech_saas'],
    audiences: [],
    objectives: [],
  },
  {
    type: 'event_full',
    label: 'ELEVATE Event',
    desc: 'Premium event campaign — venue details, speaker lineup, sponsorships, ticket strategy, and full post-event follow-up.',
    icon: <Megaphone size={22} />,
    color: '#c8973e',
    badge: 'ELEVATE',
    planRequired: 'package-a',
    industries: ['hospitality', 'education', 'agency', 'tech_saas'],
    audiences: ['b2b'],
    objectives: [],
  },
  {
    type: 'product',
    label: 'Product Campaign',
    desc: 'Launch or promote a product with compelling copy, social content, and a complete go-to-market plan.',
    icon: <Package size={22} />,
    color: '#10b981',
    badge: 'PRODUCTS',
    planRequired: 'free',
    industries: ['ecommerce', 'retail', 'fashion', 'beauty', 'd2c', 'food_beverage', 'jewellery', 'watches'],
    audiences: ['b2c', 'd2c'],
    objectives: ['launch_a_product', 'drive_sales', 'increase_revenue'],
  },
  {
    type: 'brand',
    label: 'Brand Campaign',
    desc: 'Build brand awareness with identity-led campaigns, tone of voice, and audience messaging.',
    icon: <Sparkles size={22} />,
    color: '#a855f7',
    badge: 'BRAND',
    planRequired: 'free',
    industries: [],
    audiences: ['b2c', 'both', 'd2c'],
    objectives: ['build_brand_awareness', 'grow_social_media'],
  },
  {
    type: 'growth_strategy',
    label: 'Growth Strategy',
    desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap for your business.',
    icon: <TrendingUp size={22} />,
    color: '#f97316',
    badge: 'GROWTH',
    planRequired: 'free',
    industries: [],
    audiences: [],
    objectives: ['increase_revenue', 'generate_leads', 'scale_business'],
  },
  {
    type: 'content_calendar',
    label: 'Content Calendar',
    desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags.',
    icon: <Calendar size={22} />,
    color: '#3b82f6',
    badge: 'CONTENT',
    planRequired: 'package-b',
    industries: ['fashion', 'beauty', 'food_beverage', 'ecommerce', 'retail', 'media', 'lifestyle'],
    audiences: ['b2c', 'd2c'],
    objectives: ['grow_social_media', 'build_brand_awareness'],
  },
  {
    type: 'email_drip',
    label: 'Email Drip Campaign',
    desc: '5-email nurture sequence with subject lines, preheaders, and CTAs optimised for conversion.',
    icon: <Mail size={22} />,
    color: '#8b5cf6',
    badge: 'EMAIL',
    planRequired: 'package-a',
    industries: ['tech_saas', 'education', 'finance_fintech', 'agency'],
    audiences: ['b2b'],
    objectives: ['generate_leads', 'increase_revenue'],
  },
  {
    type: 'influencer',
    label: 'Influencer & PR',
    desc: 'Influencer campaign brief, press release, and media pitch templates ready to send.',
    icon: <Users size={22} />,
    color: '#ec4899',
    badge: 'INFLUENCE',
    planRequired: 'package-b',
    industries: ['fashion', 'beauty', 'food_beverage', 'ecommerce', 'retail', 'lifestyle', 'jewellery'],
    audiences: ['b2c', 'd2c'],
    objectives: ['build_brand_awareness', 'drive_sales'],
  },
]

const PLAN_LABELS = { free: 'Free', 'package-a': 'Package A', 'package-b': 'Package B', 'package-c': 'Package C' }
const PLAN_COLORS = { free: '#10b981', 'package-a': '#3b82f6', 'package-b': '#c8973e', 'package-c': '#a855f7' }

function scoreCampaign(ct, kb) {
  if (!kb) return 0
  const industry   = (kb.industry || '').toLowerCase()
  const audience   = (kb.audienceType || '').toLowerCase()
  const objectives = Array.isArray(kb.primaryObjective)
    ? kb.primaryObjective
    : kb.primaryObjective ? [kb.primaryObjective] : []

  let score = 0
  if (ct.industries.some(i => industry.includes(i.toLowerCase()))) score += 4
  if (ct.audiences.includes(audience)) score += 3
  objectives.forEach(obj => { if (ct.objectives.includes(obj)) score += 2 })
  return score
}

function getWhyText(ct, kb, rank) {
  const industry  = (kb?.industry || '').replace(/_/g, ' ')
  const audience  = (kb?.audienceType || '').toUpperCase()
  const objectives = Array.isArray(kb?.primaryObjective)
    ? kb.primaryObjective
    : kb?.primaryObjective ? [kb.primaryObjective] : []
  const objs = objectives.map(o => o.replace(/_/g, ' '))

  if (ct.type === 'product' && ct.industries.some(i => (kb?.industry || '').toLowerCase().includes(i.toLowerCase())))
    return `Top pick for ${industry} brands selling products to ${audience || 'consumers'}.`
  if (ct.type === 'brand' && objs.some(o => o.includes('brand')))
    return `Matches your brand awareness goal directly.`
  if (ct.type === 'content_calendar' && ct.industries.some(i => (kb?.industry || '').toLowerCase().includes(i.toLowerCase())))
    return `Content-driven growth is ideal for ${industry} brands.`
  if (ct.type === 'growth_strategy' && objs.some(o => o.includes('revenue') || o.includes('leads')))
    return `Aligned with your revenue & growth objectives.`
  if (ct.type === 'influencer' && ct.industries.some(i => (kb?.industry || '').toLowerCase().includes(i.toLowerCase())))
    return `Influencer campaigns convert well in ${industry}.`
  if (ct.type === 'email_drip' && objs.some(o => o.includes('leads')))
    return `Best for lead nurturing given your generate leads goal.`
  if (ct.type === 'event')
    return `Event campaigns build community around your brand.`
  if (ct.type === 'event_full')
    return `Premium events drive high-value B2B and B2C engagement.`
  return `Part of your full campaign toolkit.`
}

const RANK_CONFIG = [
  { label: '★ BEST FIT',  bg: 'rgba(200,151,62,0.15)',  border: 'rgba(200,151,62,0.4)',  color: '#c8973e' },
  { label: '#2 PICK',     bg: 'rgba(255,255,255,0.06)', border: BORDER,                  color: TEXT2 },
  { label: '#3 PICK',     bg: 'rgba(255,255,255,0.06)', border: BORDER,                  color: TEXT2 },
  { label: '#4',          bg: 'rgba(255,255,255,0.04)', border: BORDER,                  color: TEXT3 },
  { label: '#5',          bg: 'rgba(255,255,255,0.04)', border: BORDER,                  color: TEXT3 },
  { label: '#6',          bg: 'rgba(255,255,255,0.04)', border: BORDER,                  color: TEXT3 },
  { label: '#7',          bg: 'rgba(255,255,255,0.04)', border: BORDER,                  color: TEXT3 },
  { label: '#8',          bg: 'rgba(255,255,255,0.04)', border: BORDER,                  color: TEXT3 },
]

export default function CampaignHub() {
  const navigate              = useNavigate()
  const location              = useLocation()
  const prefill               = location.state?.prefill || null
  const { user }              = useAuth()
  const { plan }              = useUserPlan()
  const [hovered, setHovered] = useState(null)
  const [kb, setKb]           = useState(null)
  const [kbLoading, setKbLoading] = useState(true)
  const [upgradeFor, setUpgradeFor] = useState(null)

  useEffect(() => {
    if (!user?.uid) { setKbLoading(false); return }
    getKnowledgeBase(user.uid)
      .then(data => { setKb(data); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [user?.uid])

  const hasBrand = !!(kb && Object.keys(kb).length > 1)

  // Score and sort ALL campaigns by profile match
  const sorted = [...CAMPAIGN_TYPES]
    .map(ct => ({ ...ct, score: scoreCampaign(ct, kb) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return 0 // keep original order for ties
    })

  const industryLabel = (kb?.industry || '').replace(/_/g, ' ')
  const audienceLabel = (kb?.audienceType || '').toUpperCase()

  function handleCampaignClick(ct) {
    if (!canAccess(plan, ct.planRequired === 'free' ? 'campaign_hub' : ct.planRequired === 'package-a' ? 'image_angles' : ct.planRequired === 'package-b' ? 'content_30day' : 'meta_ads')) {
      setUpgradeFor({ requiredPlan: ct.planRequired, featureTitle: ct.label })
      return
    }
    navigate(`/campaign/${ct.type}`, { state: { prefill } })
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 36, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = TEXT2}
          onMouseLeave={e => e.currentTarget.style.color = TEXT3}
        >
          <ChevronLeft size={16} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.25)', borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', marginBottom: 16 }}>
            CAMPAIGN PLANNING AGENT
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif" }}>
            {hasBrand ? 'All Campaigns — Ranked for Your Brand' : 'Choose a Campaign Type'}
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, maxWidth: 600 }}>
            {hasBrand
              ? `All 8 campaign types ranked by how well they fit your ${industryLabel ? `${industryLabel} brand` : 'brand profile'}${audienceLabel ? ` targeting ${audienceLabel} customers` : ''}. Locked campaigns require a plan upgrade.`
              : 'Select any campaign type. Set up your Brand Knowledge Base to get personalised rankings.'}
          </p>
        </div>

        {/* Pre-fill banner */}
        {prefill && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.25)', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'rgba(200,151,62,0.9)', fontWeight: 600 }}>
              Audience data ready — <strong style={{ color: GOLD }}>{prefill.name}</strong> will be auto-filled into the form.
            </span>
          </div>
        )}

        {/* No brand KB nudge */}
        {!kbLoading && !hasBrand && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/brand-kb')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'rgba(200,151,62,0.06)', border: '1px dashed rgba(200,151,62,0.3)', borderRadius: 14, marginBottom: 32, cursor: 'pointer' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,151,62,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, flexShrink: 0 }}>
              <BookOpen size={16}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Set up your Brand Knowledge Base to get personalised rankings</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>EVOX will rank all campaigns based on your industry, audience and goals.</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              Set up now <ArrowRight size={13}/>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        {hasBrand && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD }}/>
              <span style={{ fontSize: 11, color: TEXT3 }}>Ranked by profile match</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={11} color={TEXT3}/>
              <span style={{ fontSize: 11, color: TEXT3 }}>Requires plan upgrade</span>
            </div>
          </div>
        )}

        {/* ── ALL CAMPAIGNS — sorted by score ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {sorted.map((ct, rank) => {
            const accessible = canAccess(plan,
              ct.planRequired === 'free' ? 'campaign_hub'
              : ct.planRequired === 'package-a' ? 'image_angles'
              : ct.planRequired === 'package-b' ? 'content_30day'
              : 'meta_ads'
            )
            const rankCfg   = hasBrand ? (RANK_CONFIG[rank] || RANK_CONFIG[7]) : null
            const isTop3    = rank < 3 && hasBrand && ct.score > 0
            const planColor = PLAN_COLORS[ct.planRequired] || GOLD
            const isHovered = hovered === ct.type

            return (
              <motion.div
                key={ct.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => {
                  if (!accessible) {
                    setUpgradeFor({ requiredPlan: ct.planRequired, featureTitle: ct.label })
                    return
                  }
                  navigate(`/campaign/${ct.type}`, { state: { prefill } })
                }}
                onMouseEnter={() => setHovered(ct.type)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: rank === 0 && hasBrand && ct.score > 0
                    ? 'linear-gradient(160deg, rgba(200,151,62,0.09), rgba(200,151,62,0.02))'
                    : CARD,
                  border: `1.5px solid ${
                    isHovered ? ct.color + '55'
                    : rank === 0 && hasBrand && ct.score > 0 ? 'rgba(200,151,62,0.28)'
                    : BORDER
                  }`,
                  borderRadius: 18,
                  padding: '22px 22px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 16px 40px ${ct.color}16` : rank === 0 && hasBrand ? '0 8px 28px rgba(200,151,62,0.07)' : 'none',
                  position: 'relative',
                  opacity: !accessible ? 0.72 : 1,
                }}
              >
                {/* Rank badge (top-right) */}
                {rankCfg && ct.score > 0 && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: rankCfg.bg, border: `1px solid ${rankCfg.border}`,
                    borderRadius: 100, padding: '3px 10px',
                    fontSize: 9, fontWeight: 800, color: rankCfg.color, letterSpacing: '0.06em',
                  }}>
                    {rankCfg.label}
                  </div>
                )}

                {/* Lock badge for paid plans */}
                {!accessible && (
                  <div style={{
                    position: 'absolute', top: 12, right: rankCfg && ct.score > 0 ? 90 : 12,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: planColor + '18', border: `1px solid ${planColor}35`,
                    borderRadius: 100, padding: '3px 8px',
                    fontSize: 9, fontWeight: 800, color: planColor, letterSpacing: '0.06em',
                  }}>
                    <Lock size={8}/> {PLAN_LABELS[ct.planRequired]}
                  </div>
                )}

                {/* Icon + badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingRight: 60 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${ct.color}18`, border: `1px solid ${ct.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct.color, flexShrink: 0 }}>
                    {ct.icon}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: ct.color, letterSpacing: '0.08em', background: `${ct.color}15`, border: `1px solid ${ct.color}30`, padding: '3px 9px', borderRadius: 100 }}>
                    {ct.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 7, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  {ct.label}
                </h3>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, marginBottom: 12 }}>
                  {ct.desc}
                </p>

                {/* Why this — shown for all when brand KB is set */}
                {hasBrand && (
                  <div style={{
                    fontSize: 11, lineHeight: 1.5, marginBottom: 14,
                    color: rank === 0 && ct.score > 0 ? GOLD : TEXT3,
                    background: rank === 0 && ct.score > 0 ? 'rgba(200,151,62,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${rank === 0 && ct.score > 0 ? 'rgba(200,151,62,0.18)' : BORDER}`,
                    borderRadius: 8, padding: '7px 10px',
                  }}>
                    💡 {getWhyText(ct, kb, rank)}
                  </div>
                )}

                {/* CTA */}
                {accessible ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: isHovered ? 8 : 5, color: ct.color, fontSize: 12, fontWeight: 700, transition: 'gap 0.2s' }}>
                    Generate campaign <ArrowRight size={13}/>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: planColor, fontSize: 12, fontWeight: 700 }}>
                    <Lock size={12}/> Upgrade to {PLAN_LABELS[ct.planRequired]}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {upgradeFor && (
          <UpgradeModal
            requiredPlan={upgradeFor.requiredPlan}
            featureTitle={upgradeFor.featureTitle}
            onClose={() => setUpgradeFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
