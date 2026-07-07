import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ArrowLeft, Zap, Sparkles, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser, getUserData } from '../services/userService'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const GOLD    = '#c8973e'
const GBORDER = 'rgba(200,151,62,0.22)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const PLANS = [
  {
    key: 'free',
    label: 'FREE',
    price: '$0',
    tagline: 'Start with AI strategy, zero cost',
    badge: null,
    gold: true,
    features: ['Objective & Strategy', 'Lead Planning', 'Content Framework'],
    cta: 'Start Free',
  },
  {
    key: 'package-a',
    label: 'PACKAGE A',
    price: '$1,000',
    tokens: '500 EGT Tokens',
    tagline: 'Professional visuals + social posting',
    badge: null,
    gold: false,
    color: '#10b981',
    features: ['Everything in Free', 'Multi-angle Images', 'Ad-ready Banners'],
    cta: 'Get Package A',
  },
  {
    key: 'package-b',
    label: 'PACKAGE B',
    price: '$1,800',
    tokens: '1,200 EGT Tokens',
    tagline: 'Video content + 30-day calendar',
    badge: 'MOST POPULAR',
    gold: false,
    color: '#c8973e',
    features: [
      'Everything in A',
      'Lifestyle Video Generator',
      '360° Product Video',
      '30-Day Content Calendar',
      'Reel & Short-form Scripts',
      'Multi-platform Captions & Hashtags',
      'PDF / CSV Content Export',
      'KPI & Engagement Recommendations',
    ],
    cta: 'Get Package B',
  },
  {
    key: 'package-c',
    label: 'PACKAGE C',
    price: '$4,000',
    tokens: '3,000 EGT Tokens',
    tagline: 'Full paid ad deployment at scale',
    badge: null,
    gold: false,
    color: '#a855f7',
    features: [
      'Everything in B',
      '3D Images — Premium product renders',
      'Ads Creation — Conversion-optimised creatives',
      'Ads Manager Connect — FB & Google campaigns',
      'Target Audience Selection — Precision segmentation',
      'Deploy Ads — Full campaign launch & management',
    ],
    cta: 'Get Package C',
  },
]

// ── Recommendation engine ────────────────────────────────────────────────────
const AGENT_LIST = [
  { label: 'Marketing Strategy',  icon: '📊', route: '/strategy',          plan: 'free',      desc: 'Build your annual plan & KPIs' },
  { label: 'Caption Suite',       icon: '✍️', route: '/caption-suite',     plan: 'package-a', desc: 'Social captions & hashtags' },
  { label: 'Video Generation',    icon: '🎥', route: '/video-gen',         plan: 'package-a', desc: 'AI-powered video ads & content' },
  { label: 'Product Descriptions',icon: '🛍️', route: '/product-desc',      plan: 'package-a', desc: 'SEO-optimised product copy' },
  { label: 'Reel Scripts',        icon: '🎬', route: '/reel-scripts',      plan: 'package-a', desc: 'TikTok & Reels video scripts' },
  { label: 'Content Generation',  icon: '📅', route: '/content-gen',       plan: 'package-a', desc: '30-day content plan' },
  { label: 'Copywriting Agent',   icon: '📝', route: '/copywriting',       plan: 'package-a', desc: 'Ads, landing pages & web copy' },
  { label: 'Email Marketing',     icon: '📧', route: '/email-marketing',   plan: 'package-b', desc: 'Campaigns & nurture sequences' },
  { label: 'SEO Agent',           icon: '🔍', route: '/seo-agent',         plan: 'package-b', desc: 'Keywords & on-page SEO' },
  { label: 'Campaign Hub',        icon: '🚀', route: '/campaign-hub',      plan: 'package-b', desc: 'End-to-end campaign manager' },
  { label: 'Analytics Dashboard', icon: '📈', route: '/analytics',         plan: 'package-b', desc: 'Campaign performance & data' },
  { label: 'A/B Testing',         icon: '🧪', route: '/ab-testing',        plan: 'package-b', desc: 'Test headlines, CTAs & creatives' },
  { label: 'Audience Builder',    icon: '🎯', route: '/audience-builder',  plan: 'package-b', desc: 'Define & target your ideal customer' },
  { label: 'CRM & Lifecycle',     icon: '👥', route: '/crm',               plan: 'package-b', desc: 'Lead tracking & nurturing' },
  { label: 'Meta Ads Boost',      icon: '📣', route: '/meta-ads-boost',    plan: 'package-c', desc: 'Facebook & Instagram ad campaigns' },
]

function getRecommendedAgents(onboardingData) {
  if (!onboardingData) return AGENT_LIST.slice(0, 3)
  const { background, industry, goal } = onboardingData
  const pick = (...names) => names.map(n => AGENT_LIST.find(a => a.label === n)).filter(Boolean)

  if (goal === 'leads' || goal === 'sales')
    return pick('Email Marketing', 'Campaign Hub', 'CRM & Lifecycle')
  if (goal === 'launch')
    return pick('Campaign Hub', 'Video Generation', 'Copywriting Agent')
  if (goal === 'social')
    return pick('Caption Suite', 'Reel Scripts', 'Content Generation')
  if (goal === 'awareness')
    return pick('Caption Suite', 'Content Generation', 'SEO Agent')
  if (goal === 'engage')
    return pick('Email Marketing', 'Caption Suite', 'Analytics Dashboard')

  if (background === 'ecommerce')
    return pick('Product Descriptions', 'Video Generation', 'Caption Suite')
  if (background === 'creator')
    return pick('Reel Scripts', 'Caption Suite', 'Content Generation')
  if (background === 'agency')
    return pick('Campaign Hub', 'A/B Testing', 'Analytics Dashboard')

  const ind = (industry || '').toLowerCase()
  if (ind === 'tech') return pick('SEO Agent', 'Content Generation', 'Email Marketing')
  if (ind === 'fashion' || ind === 'food') return pick('Caption Suite', 'Video Generation', 'Product Descriptions')
  if (ind === 'education') return pick('Content Generation', 'Email Marketing', 'Caption Suite')

  return pick('Marketing Strategy', 'Caption Suite', 'Campaign Hub')
}

function getFirstStep(onboardingData, planKey) {
  if (!onboardingData) return { icon: '📊', label: 'Build your Marketing Strategy', route: '/strategy', desc: 'Start by setting your annual plan, KPIs and brand positioning.' }
  const { goal } = onboardingData
  if (planKey === 'free') return { icon: '📊', label: 'Build your Marketing Strategy', route: '/strategy', desc: 'Set your annual plan, KPIs and brand positioning — all for free.' }
  if (goal === 'leads' || goal === 'sales') return { icon: '📧', label: 'Launch your first Email Campaign', route: '/email-marketing', desc: 'Generate a full nurture sequence tailored to your goal.' }
  if (goal === 'launch') return { icon: '🚀', label: 'Create your Campaign', route: '/campaign-hub', desc: 'Build a complete go-to-market campaign for your product or brand.' }
  if (goal === 'social') return { icon: '✍️', label: 'Generate Social Captions', route: '/caption-suite', desc: 'Create platform-ready captions, hashtags and post schedules.' }
  if (goal === 'awareness') return { icon: '✍️', label: 'Generate your Content Plan', route: '/content-gen', desc: 'Build a 30-day multi-platform content calendar for your brand.' }
  return { icon: '📊', label: 'Build your Marketing Strategy', route: '/strategy', desc: 'Set your annual plan, KPIs and brand positioning.' }
}

export default function PlansPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [onboardingData, setOnboardingData] = useState(null)
  const [confirmedPlan, setConfirmedPlan] = useState(null)

  useEffect(() => {
    if (!user) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(d => setBalance(d.tokenBalance || 0))
    getUserData(user.uid)
      .then(d => { if (d?.onboardingData) setOnboardingData(d.onboardingData) })
      .catch(() => {})
  }, [user])

  const handlePlan = (key) => {
    try { localStorage.setItem('evoke_selected_package', key) } catch {}
    setConfirmedPlan(key)
  }

  const recommended = getRecommendedAgents(onboardingData)
  const firstName = user?.displayName?.split(' ')[0] || 'there'

  // ── "First step" confirmation screen ────────────────────────────────────────
  if (confirmedPlan) {
    const planInfo = PLANS.find(p => p.key === confirmedPlan)
    const firstStep = getFirstStep(onboardingData, confirmedPlan)
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          style={{ maxWidth: 520, width: '100%', padding: '0 24px', textAlign: 'center' }}>

          {/* Success icon */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={30} color="#10b981" />
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            {planInfo?.label} selected
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 10, letterSpacing: '-0.02em' }}>
            You're all set, {firstName}! 🎉
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, marginBottom: 32, lineHeight: 1.6 }}>
            Your profile is saved. Here's the best first step based on your goal.
          </p>

          {/* First step card */}
          <div style={{ background: CARD, border: `1px solid ${GBORDER}`, borderRadius: 18, padding: '24px 28px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={11} color={GOLD}/> Your First Step
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{firstStep.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 5 }}>{firstStep.label}</div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.55 }}>{firstStep.desc}</div>
              </div>
            </div>
          </div>

          {/* Recommended agents */}
          {recommended.length > 0 && (
            <div style={{ background: CARD, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 16, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Also recommended for you
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommended.map(a => (
                  <div key={a.route} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: TEXT3 }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', padding: '14px', background: `linear-gradient(135deg,${GOLD},#b8803a)`,
            border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}>
            Go to Dashboard <ArrowRight size={16}/>
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', fontSize: 13, marginBottom: 36, padding: 0 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px',
            background: 'rgba(200,151,62,0.12)', border: `1px solid ${GBORDER}`,
            borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            STEP 2 OF 2 · CHOOSE YOUR PLAN
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: TEXT,
            fontFamily: "'Syne','Inter',sans-serif", marginBottom: 12, letterSpacing: '-0.02em',
          }}>
            Which plan fits you best?
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, maxWidth: 480, margin: '0 auto' }}>
            All plans include AI strategy modules personalised to your answers.
          </p>
        </div>

        {/* Recommended agents banner */}
        {onboardingData && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg,rgba(200,151,62,0.08),rgba(200,151,62,0.02))', border: `1px solid ${GBORDER}`, borderRadius: 16, padding: '18px 22px', marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={11} color={GOLD}/> Recommended for you based on your profile
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {recommended.map(a => (
                <div key={a.route} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: `1px solid rgba(255,255,255,0.06)` }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: TEXT3 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Token balance bar */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 24, padding: '10px 20px',
            background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.2)',
            borderRadius: 12, fontSize: 13, color: GOLD, fontWeight: 700,
          }}>
            <Zap size={14} /> Your EGT Balance: {balance} Tokens
          </div>
        )}

        {/* Plan cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePlan(p.key)}
              style={{
                position: 'relative',
                background: p.gold ? 'linear-gradient(160deg,#221d10,#1c1a13)' : CARD,
                border: `1px solid ${p.gold ? 'rgba(200,151,62,0.5)' : GBORDER}`,
                borderRadius: 16, padding: '24px 20px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s', color: TEXT,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(200,151,62,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)', color: '#0e0c09',
                  fontSize: 9, fontWeight: 800, padding: '4px 14px', borderRadius: 100,
                  whiteSpace: 'nowrap', letterSpacing: '0.08em',
                }}>{p.badge}</div>
              )}

              <div style={{ fontSize: 10, fontWeight: 800, color: p.gold ? GOLD : TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 4, letterSpacing: '-0.02em' }}>
                {p.price}
              </div>
              {p.tokens && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 700, color: GOLD,
                  background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)',
                  borderRadius: 6, padding: '3px 8px', marginBottom: 8,
                }}>
                  ⚡ {p.tokens}
                </div>
              )}
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 16, lineHeight: 1.5 }}>
                {p.tagline}
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, marginBottom: 18 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                    <Check size={11} color={p.gold ? GOLD : TEXT3} />
                    <span style={{ fontSize: 12, color: TEXT2 }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{
                width: '100%', padding: '10px',
                background: p.gold ? 'linear-gradient(135deg,#d4a853,#b8803a)' : 'rgba(255,255,255,0.06)',
                borderRadius: 9, border: p.gold ? 'none' : `1px solid ${BORDER}`,
                color: p.gold ? '#0e0c09' : TEXT2,
                fontSize: 13, fontWeight: 700, textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {p.cta} <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>

        {/* Fine print */}
        <p style={{ textAlign: 'center', fontSize: 12, color: TEXT3 }}>
          Free plan includes all 3 AI agents · No credit card required · Upgrade anytime
        </p>
      </div>
    </div>
  )
}
