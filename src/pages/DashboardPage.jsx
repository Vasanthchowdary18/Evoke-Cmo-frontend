import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, ArrowRight, CheckCircle2, Circle, TrendingUp, Bot,
  Share2, PenTool, Target, Sparkles, Mail, Search,
  FileText, Crown, ChevronRight, Activity,
  BarChart2, Megaphone, Video, Rocket, BookOpen,
  Users, Eye, MousePointer, PenLine,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import UpgradeModal from '../components/UpgradeModal.jsx'
import BrandSetupModal from '../components/BrandSetupModal.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getOrCreateUser } from '../services/userService'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const BG     = '#0a0907'
const CARD   = '#131109'
const CARD2  = '#181510'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = 'rgba(255,255,255,0.06)'
const GREEN  = '#10b981'
const BLUE   = '#3b82f6'
const PURPLE = '#a855f7'

const ORANGE = '#f97316'

const PLAN_COLOR = { free: '#6b7280', 'package-a': GOLD, 'package-b': '#94a3b8', 'package-c': '#f59e0b' }
const PLAN_LABEL = { free: 'Free Plan', 'package-a': 'Package A', 'package-b': 'Package B', 'package-c': 'Package C' }
const PLANS = ['free', 'package-a', 'package-b', 'package-c']

const INDUSTRY_LABELS = { ecommerce: 'E-commerce & Retail', tech: 'Tech / SaaS', services: 'Professional Services', food: 'Food & Beverage', fashion: 'Fashion & Lifestyle', health: 'Health & Fitness', education: 'Education / EdTech', realestate: 'Real Estate', finance: 'Finance / Fintech', media: 'Media & Entertainment', beauty: 'Beauty & Personal Care', other: 'Other' }
const GOAL_LABELS     = { leads: 'Generate Leads', sales: 'Drive Sales', awareness: 'Build Brand Awareness', brand_awareness: 'Build Brand Awareness', social_growth: 'Grow Social Following', social: 'Grow Social Following', launch: 'Launch a Product', engage: 'Retain & Engage' }
const TONE_LABELS     = { professional: 'Professional', casual: 'Casual & Friendly', bold: 'Bold & Direct', luxury: 'Luxury & Premium', playful: 'Playful & Fun', educational: 'Educational' }
const AUDIENCE_LABELS = { b2c_young: 'Consumers 18–35', b2c_mature: 'Consumers 35–55', b2b_small: 'Small Business', b2b_enterprise: 'Enterprise', mixed: 'Mixed B2B & B2C' }
const GOAL_ICONS      = { leads: '🎯', sales: '💰', awareness: '✨', brand_awareness: '✨', social_growth: '📈', social: '📈', launch: '🚀', engage: '💬' }
const TONE_ICONS      = { professional: '🎩', casual: '😊', bold: '⚡', luxury: '💎', playful: '🎉', educational: '📖' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* All agents available on the platform */
const ALL_AGENTS = [
  // Free
  { label: 'Marketing Strategy',    desc: 'Annual plan, KPIs & budget',           icon: '📊', color: GOLD,   plan: 'free',      route: '/strategy' },
  { label: 'Health Score',           desc: 'Audit your marketing performance',      icon: '💯', color: GREEN,  plan: 'free',      route: '/health-score' },
  // Package A
  { label: 'KPI Recommendations',    desc: 'Set & track your key metrics',         icon: '🎯', color: GOLD,   plan: 'package-a', route: '/kpi-recommendations' },
  { label: 'Brand Knowledge Base',   desc: 'Your brand profile & goals',           icon: '🏢', color: GOLD,   plan: 'package-a', route: '/brand-kb' },
  { label: 'Caption Suite',          desc: 'Social captions & hashtags',           icon: '✍️', color: GREEN,  plan: 'package-a', route: '/caption-suite' },
  { label: 'Copywriting Agent',      desc: 'Ads, landing pages & web copy',        icon: '📝', color: '#ec4899', plan: 'package-a', route: '/copywriting' },
  { label: 'Reel Scripts',           desc: 'TikTok & Reels video scripts',         icon: '🎬', color: '#f59e0b', plan: 'package-a', route: '/reel-scripts' },
  { label: 'Product Descriptions',   desc: 'SEO-optimised product copy',           icon: '🛍️', color: '#84cc16', plan: 'package-a', route: '/product-desc' },
  { label: 'Product Images',         desc: 'Multi-angle product photography',      icon: '📸', color: ORANGE,  plan: 'package-a', route: '/image-angles' },
  { label: 'Video Generation',       desc: 'AI-powered video ads & content',       icon: '🎥', color: '#f97316', plan: 'package-a', route: '/video-gen' },
  { label: 'Content Generation',     desc: '30-day content plan & blog posts',     icon: '📅', color: '#6366f1', plan: 'package-a', route: '/content-gen' },
  // Package B
  { label: 'Email Marketing',        desc: 'Campaigns & nurture sequences',        icon: '📧', color: PURPLE, plan: 'package-b', route: '/email-marketing' },
  { label: 'SEO Agent',              desc: 'Keywords, on-page SEO & rankings',     icon: '🔍', color: BLUE,   plan: 'package-b', route: '/seo-agent' },
  { label: 'A/B Testing',            desc: 'Test headlines, CTAs & creatives',     icon: '🧪', color: '#06b6d4', plan: 'package-b', route: '/ab-testing' },
  { label: 'Marketing Attribution',  desc: 'SMS, Paid Ads, Social & Post attribution', icon: '📡', color: '#a855f7', plan: 'package-b', route: '/marketing-attribution' },
  { label: 'Analytics Dashboard',    desc: 'Campaign performance & data',          icon: '📈', color: PURPLE, plan: 'package-b', route: '/analytics' },
  { label: 'Connect Accounts',       desc: 'Instagram, LinkedIn & more',           icon: '🔗', color: BLUE,   plan: 'package-b', route: '/connect-accounts' },
  { label: 'Approval Queue',         desc: 'Review & sign off AI content',         icon: '✅', color: GREEN,  plan: 'package-b', route: '/queue' },
  { label: 'Campaign Hub',           desc: 'End-to-end campaign manager',          icon: '🚀', color: '#f59e0b', plan: 'package-b', route: '/campaign-hub' },
  { label: 'CRM & Lifecycle',        desc: 'Lead tracking & nurturing',            icon: '👥', color: '#ec4899', plan: 'package-b', route: '/crm' },
  { label: 'Audience Builder',       desc: 'Define & target your ideal customer',  icon: '🎯', color: '#06b6d4', plan: 'package-b', route: '/audience-builder' },
  { label: 'Trend Analysis',         desc: 'Market & competitor insights',         icon: '📡', color: GREEN,  plan: 'package-b', route: '/trends' },
  { label: 'Executive Report',       desc: 'CMO-ready performance report',         icon: '📋', color: GOLD,   plan: 'package-b', route: '/executive-report' },
  // Package C
  { label: 'Meta Ads Boost',         desc: 'Facebook & Instagram ad campaigns',    icon: '📣', color: '#ef4444', plan: 'package-c', route: '/meta-ads-boost' },
  { label: 'Marketing Execution',    desc: 'Full campaign deploy & management',    icon: '⚡', color: GOLD,   plan: 'package-c', route: '/execution' },
  { label: 'Team Management',        desc: 'Roles, tasks & collaboration',         icon: '🤝', color: BLUE,   plan: 'package-c', route: '/team' },
]

/* Smart recommended agents — driven by ALL questionnaire answers */
function getRecommendedAgents(stage, planLevel, kb) {
  const pick = (names) => names.map(n => ALL_AGENTS.find(a => a.label === n)).filter(Boolean)

  if (!kb || stage === 'setup') {
    return pick(['Marketing Strategy', 'Health Score', 'Content Generation', 'Caption Suite'])
  }
  if (planLevel === 0) {
    return pick(['Marketing Strategy', 'Health Score', 'Content Generation', 'Caption Suite'])
  }

  // Normalise multi-select arrays or legacy strings
  const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : [])
  const industries = toArr(kb?.industry || kb?.businessType || kb?.niche).map(s => s.toLowerCase())
  const goals      = toArr(kb?.goal)
  const audiences  = toArr(kb?.audience)

  const hasIndustry = (...ids) => ids.some(i => industries.some(ind => ind.includes(i)))
  const hasGoal     = (...gs)  => gs.some(g => goals.includes(g))
  const hasAudience = (...as)  => as.some(a => audiences.includes(a))

  // Score every available agent based on how well it matches the answers
  const scores = {}
  const boost  = (name, pts) => { scores[name] = (scores[name] || 0) + pts }

  // ── Goal signals ──
  if (hasGoal('social_growth'))   { boost('Caption Suite', 4); boost('Reel Scripts', 3); boost('Content Generation', 2); boost('Video Generation', 2) }
  if (hasGoal('leads'))           { boost('Copywriting Agent', 4); boost('SEO Agent', 3); boost('Email Marketing', 3); boost('Campaign Hub', 2) }
  if (hasGoal('sales'))           { boost('Product Descriptions', 4); boost('Product Images', 3); boost('Caption Suite', 2); boost('Meta Ads Boost', 3) }
  if (hasGoal('brand_awareness')) { boost('Content Generation', 4); boost('Marketing Strategy', 3); boost('Caption Suite', 2); boost('SEO Agent', 2) }

  // ── Industry signals ──
  if (hasIndustry('ecommerce', 'retail', 'fashion', 'clothing')) { boost('Product Descriptions', 3); boost('Product Images', 3); boost('Caption Suite', 2) }
  if (hasIndustry('saas', 'tech', 'software', 'startup'))        { boost('SEO Agent', 3); boost('Copywriting Agent', 2); boost('Email Marketing', 2) }
  if (hasIndustry('restaurant', 'food'))                          { boost('Caption Suite', 3); boost('Reel Scripts', 3); boost('Content Generation', 2) }
  if (hasIndustry('health', 'fitness'))                           { boost('Caption Suite', 3); boost('Content Generation', 3); boost('Reel Scripts', 2) }
  if (hasIndustry('education'))                                   { boost('Content Generation', 3); boost('Email Marketing', 3); boost('SEO Agent', 2) }
  if (hasIndustry('services'))                                    { boost('Email Marketing', 3); boost('Copywriting Agent', 3); boost('Marketing Strategy', 2) }

  // ── Audience signals ──
  if (hasAudience('b2b_small', 'b2b_enterprise'))  { boost('Email Marketing', 2); boost('Marketing Strategy', 2); boost('SEO Agent', 1) }
  if (hasAudience('b2c_young'))                     { boost('Caption Suite', 2); boost('Reel Scripts', 2); boost('Video Generation', 2) }
  if (hasAudience('b2c_mature'))                    { boost('Email Marketing', 2); boost('Content Generation', 2) }
  if (hasAudience('mixed'))                         { boost('Caption Suite', 1); boost('Email Marketing', 1); boost('Content Generation', 1) }

  // Pick top 4 agents the user's plan can actually access
  const accessible = ALL_AGENTS.filter(a => PLANS.indexOf(a.plan) <= planLevel)
  const ranked = accessible
    .map(a => ({ ...a, score: scores[a.label] || 0 }))
    .filter(a => a.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 4)

  if (ranked.length >= 2) return ranked

  // Fallback when no answers yet match accessible agents
  if (planLevel === 1) return pick(['Caption Suite', 'Content Generation', 'Reel Scripts', 'Copywriting Agent'])
  if (planLevel === 2) return pick(['Email Marketing', 'SEO Agent', 'Campaign Hub', 'Audience Builder'])
  return pick(['Meta Ads Boost', 'Marketing Execution', 'Trend Analysis', 'CRM & Lifecycle'])
}

/* 7-step campaign launch journey */
const JOURNEY = [
  { key: 'account',    label: 'Account created',           route: null,                icon: '🔐' },
  { key: 'onboarding', label: 'Brand profile set',          route: '/brand-profile',    icon: '🏢' },
  { key: 'strategy',   label: 'Marketing strategy built',   route: '/strategy-hub',     icon: '📊' },
  { key: 'social',     label: 'Social accounts connected',  route: '/connect-accounts', icon: '🔗' },
  { key: 'content',    label: 'First content generated',    route: '/agents-hub',       icon: '✍️' },
  { key: 'approved',   label: 'Content approved in queue',  route: '/queue',            icon: '✅' },
  { key: 'launched',   label: 'Campaign launched',          route: '/post-content',     icon: '🚀' },
]

const STAGE_LABELS = {
  setup:    { title: 'Set up your brand',         desc: 'Tell EVOX AI about your brand so it can personalise every recommendation.', route: '/brand-profile' },
  strategy: { title: 'Build your strategy',       desc: 'Create your annual marketing plan, set KPIs and define your brand positioning.', route: '/strategy-hub' },
  content:  { title: 'Create your first content', desc: 'Generate captions, blog posts, email copy or campaign scripts with an AI agent.', route: '/agents-hub' },
  publish:  { title: 'Connect & publish',         desc: 'Connect your social accounts and publish your first AI-generated post.', route: '/connect-accounts' },
  analyse:  { title: 'Analyse & optimise',        desc: 'Track performance, run SEO, A/B test and generate your executive report.', route: '/analytics' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()

  const [userData,        setUserData]       = useState(null)
  const [brandKb,         setBrandKb]        = useState(null)
  const [contentCount,    setContentCount]   = useState(0)
  const [recentContent,   setRecentContent]  = useState([])
  const [emailCampaigns,  setEmailCampaigns] = useState([])
  const [upgradeModal,    setUpgradeModal]   = useState(null)
  const [showEditModal,   setShowEditModal]  = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(d => setUserData(d))
      .catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid)
      .then(data => {
        if (data && Object.keys(data).length > 1) setBrandKb(data)
      })
      .catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'content_items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(4)
    )
    getDocs(q).then(snap => {
      setContentCount(snap.size)
      setRecentContent(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const eq = query(
      collection(db, 'content_items'),
      where('userId', '==', user.uid),
      where('type',   '==', 'email'),
      orderBy('createdAt', 'desc'),
      limit(3)
    )
    getDocs(eq).then(snap => {
      const items = snap.docs.map(d => {
        const raw = d.data()
        let metrics = null
        try { metrics = JSON.parse(raw.data)?.predictedMetrics || null } catch {}
        return { id: d.id, campaignName: raw.campaignName || 'Email Campaign', metrics, status: raw.status }
      })
      setEmailCampaigns(items)
    }).catch(() => {})
  }, [user?.uid])

  const connectedAccounts = Object.values(userData?.socialAccounts || {}).filter(a => a?.connected).length
  const firstName  = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const planLevel  = PLANS.indexOf(plan || 'free')
  const brandName  = userData?.brandName || userData?.onboardingData?.businessName || userData?.onboardingData?.brandName || null


  const hasApproved = recentContent.some(c => ['approved','scheduled','published'].includes(c.status))
  const hasLaunched = recentContent.some(c => ['published','scheduled'].includes(c.status))
  const hasBrandKb  = !!brandKb

  const hasStrategy = recentContent.some(c => c.type && ['strategy','marketing_strategy','kpi','kpi-recommendations'].some(t => c.type.includes(t)))
    || !!(userData?.onboardingData?.goal && userData?.onboardingData?.industry)

  const completed = {
    account:    true,
    onboarding: !!(userData?.brandSetupComplete || userData?.onboardingComplete) || hasBrandKb,
    strategy:   hasStrategy,
    social:     connectedAccounts > 0,
    content:    contentCount > 0,
    approved:   hasApproved,
    launched:   hasLaunched,
  }
  const doneCount = Object.values(completed).filter(Boolean).length
  const progress  = Math.round((doneCount / JOURNEY.length) * 100)
  const nextStep  = JOURNEY.find(s => !completed[s.key])

  /* Current stage drives recommended agents */
  const currentStage = !completed.onboarding ? 'setup'
    : !completed.strategy ? 'strategy'
    : !completed.content  ? 'content'
    : !completed.social   ? 'publish'
    : 'analyse'

  const stageInfo   = STAGE_LABELS[currentStage]
  const recommended = getRecommendedAgents(currentStage, planLevel, brandKb)

  const handleAgent = (agent) => {
    const locked = PLANS.indexOf(agent.plan) > planLevel
    if (locked) { setUpgradeModal({ featureName: agent.label }); return }
    navigate(agent.route)
  }

  const handleEditComplete = async () => {
    setShowEditModal(false)
    if (user?.uid) {
      try {
        const data = await getKnowledgeBase(user.uid)
        if (data && Object.keys(data).length > 1) setBrandKb(data)
      } catch {}
    }
  }

  const handleTaskAction = (agent, status) => {
    if (status === 'not_started' || status === 'in_progress') {
      handleAgent(agent)
    } else if (status === 'approval') {
      navigate('/queue')
    } else {
      navigate('/analytics')
    }
  }

  if (!authReady || planLoading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,151,62,0.18); border-radius: 4px; }
      `}</style>

      <AppSidebar />

      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* ── TOP BAR ── */}
        <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{getGreeting()}, {firstName}</div>
              <div style={{ fontSize: 10, color: TEXT3 }}>{new Date().toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {plan !== 'package-c' && (
              <button onClick={() => navigate('/plans')} style={{ padding: '6px 13px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                <Zap size={11}/> Upgrade Plan
              </button>
            )}
            <div onClick={() => navigate('/brand-profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 9px 4px 5px', borderRadius: 100, border: `1px solid ${BORDER}`, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GBORD; e.currentTarget.style.background = 'rgba(200,151,62,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8973e,#8b5e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#0e0c09' }}>{firstName[0]?.toUpperCase()}</div>
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' }}>{user?.displayName || firstName}</span>
                <span style={{ fontSize: 9, color: TEXT3, whiteSpace: 'nowrap' }}>View Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE BODY ── */}
        <div style={{ padding: '24px 28px 80px', maxWidth: 1100, margin: '0 auto' }}>

          {/* ══ 0. BRAND PROFILE CARD ══ */}
          {brandKb && brandKb.businessName && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '18px 22px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              {/* Left — brand identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg,${GOLD},#8b5e1e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, fontWeight: 900, color: '#0a0907' }}>
                  {brandKb.businessName?.[0]?.toUpperCase() || '🏢'}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Your Brand Profile</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1.2, marginBottom: 6 }}>
                    {brandKb.businessName}
                  </div>
                  {/* Chips row — handles both legacy string and new array values */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {brandKb.industry && (() => {
                      const vals = Array.isArray(brandKb.industry) ? brandKb.industry : [brandKb.industry]
                      return vals.slice(0, 2).map(v => (
                        <span key={v} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 10, color: TEXT2, fontWeight: 600 }}>
                          {INDUSTRY_LABELS[v] || v}
                        </span>
                      ))
                    })()}
                    {brandKb.goal && (() => {
                      const vals = Array.isArray(brandKb.goal) ? brandKb.goal : [brandKb.goal]
                      return vals.slice(0, 2).map(v => (
                        <span key={v} style={{ padding: '3px 10px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 100, fontSize: 10, color: GOLD, fontWeight: 700 }}>
                          {GOAL_ICONS[v] || '🎯'} {GOAL_LABELS[v] || v}
                        </span>
                      ))
                    })()}
                    {brandKb.tone && (() => {
                      const vals = Array.isArray(brandKb.tone) ? brandKb.tone : [brandKb.tone]
                      return vals.slice(0, 1).map(v => (
                        <span key={v} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 10, color: TEXT2, fontWeight: 600 }}>
                          {TONE_ICONS[v] || ''} {TONE_LABELS[v] || v}
                        </span>
                      ))
                    })()}
                    {brandKb.audience && (() => {
                      const vals = Array.isArray(brandKb.audience) ? brandKb.audience : [brandKb.audience]
                      return vals.slice(0, 1).map(v => (
                        <span key={v} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 10, color: TEXT2, fontWeight: 600 }}>
                          👥 {AUDIENCE_LABELS[v] || v}
                        </span>
                      ))
                    })()}
                  </div>
                </div>
              </div>
              {/* Right — edit button */}
              <button
                onClick={() => setShowEditModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GBORD; e.currentTarget.style.color = GOLD }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 }}
              >
                <PenLine size={13}/> Edit Profile
              </button>
            </motion.div>
          )}

          {/* ══ 1. NEXT STEP BANNER ══ */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ background: `linear-gradient(135deg,rgba(200,151,62,0.1),rgba(200,151,62,0.03))`, border: `1px solid ${GBORD}`, borderRadius: 18, padding: '22px 26px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,151,62,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: GDIM, border: `1px solid ${GBORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {nextStep?.icon || '🚀'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Next Step</span>
                  <span style={{ padding: '2px 8px', background: `${PLAN_COLOR[plan||'free']}15`, border: `1px solid ${PLAN_COLOR[plan||'free']}35`, borderRadius: 100, fontSize: 9, fontWeight: 800, color: PLAN_COLOR[plan||'free'], letterSpacing: '0.07em' }}>{PLAN_LABEL[plan||'free'].toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 4 }}>{stageInfo.title}</div>
                <div style={{ fontSize: 12, color: TEXT2, maxWidth: 480 }}>{stageInfo.desc}</div>
              </div>
            </div>
            <button onClick={() => navigate(stageInfo.route)}
              style={{ padding: '11px 22px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 11, color: '#0a0907', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Start Now <ArrowRight size={14}/>
            </button>
          </motion.div>

          {/* ══ 2. MAIN LAYOUT ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

            {/* ── LEFT ── */}
            <div>

              {/* ── Recommended Agents ── */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Sparkles size={13} color={GOLD}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: TEXT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recommended for You</span>
                  <div style={{ flex: 1, height: 1, background: BORDER }}/>
                  <span style={{ fontSize: 11, color: TEXT3 }}>{hasBrandKb ? 'Based on your brand profile' : 'Based on your stage'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recommended.map((agent, i) => {
                    const locked = PLANS.indexOf(agent.plan) > planLevel
                    return (
                      <RecommendedAgentRow key={agent.route} agent={agent} locked={locked} i={i}
                        onClick={() => locked ? setUpgradeModal({ featureName: agent.label }) : navigate(agent.route)} />
                    )
                  })}
                </div>
              </motion.div>

              {/* ── Campaign Workflow ── */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Rocket size={13} color={GOLD}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: TEXT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campaign Workflow</span>
                  <div style={{ flex: 1, height: 1, background: BORDER }}/>
                  <span style={{ fontSize: 11, color: TEXT3 }}>Your path to launch</span>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
                  {[
                    { step: 1, icon: '📊', label: 'Build Your Strategy',  desc: 'Set annual goals, KPIs and brand positioning',         route: '/strategy',          doneKey: 'strategy' },
                    { step: 2, icon: '✍️', label: 'Create Content',        desc: 'Generate captions, blogs, videos or email campaigns', route: recommended[0]?.route || '/agents-hub', doneKey: 'content'  },
                    { step: 3, icon: '✅', label: 'Approve in Queue',      desc: 'Review and sign off your AI-generated content',        route: '/queue',             doneKey: 'approved' },
                    { step: 4, icon: '🚀', label: 'Publish & Analyse',    desc: 'Connect accounts, schedule posts and track results',   route: '/connect-accounts',  doneKey: 'launched' },
                  ].map((s, idx, arr) => {
                    const done     = completed[s.doneKey]
                    const isActive = !done && (idx === 0 || completed[arr[idx - 1].doneKey])
                    return (
                      <div key={s.doneKey}
                        onClick={() => navigate(s.route)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', borderBottom: idx < arr.length - 1 ? `1px solid ${BORDER}` : 'none', background: isActive ? `${GOLD}05` : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => { e.currentTarget.style.background = isActive ? `${GOLD}05` : 'transparent' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: done ? `${GREEN}15` : isActive ? GDIM : 'rgba(255,255,255,0.04)', border: `2px solid ${done ? GREEN + '60' : isActive ? GOLD + '80' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {done ? <CheckCircle2 size={15} color={GREEN}/> : <span style={{ fontSize: 12, fontWeight: 900, color: isActive ? GOLD : TEXT3 }}>{s.step}</span>}
                        </div>
                        <div style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: done ? 400 : 700, color: done ? TEXT3 : TEXT, marginBottom: 2, textDecoration: done ? 'line-through' : 'none' }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: TEXT3 }}>{s.desc}</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {done
                            ? <span style={{ fontSize: 9, fontWeight: 800, color: GREEN, background: `${GREEN}12`, border: `1px solid ${GREEN}30`, borderRadius: 5, padding: '3px 7px' }}>DONE ✓</span>
                            : isActive
                              ? <button onClick={e => { e.stopPropagation(); navigate(s.route) }} style={{ padding: '7px 14px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 9, color: '#0a0907', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>Start <ArrowRight size={10}/></button>
                              : <span style={{ fontSize: 9, fontWeight: 700, color: TEXT3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 7px' }}>UPCOMING</span>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Browse all agents */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <button onClick={() => navigate('/agents-hub')}
                  style={{ padding: '9px 20px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GBORD; e.currentTarget.style.color = GOLD }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3 }}>
                  Browse All 25+ Agents <ArrowRight size={11}/>
                </button>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <StatCard icon={<Crown size={15}/>}    color={PLAN_COLOR[plan||'free']} label="Plan"     value={PLAN_LABEL[plan||'free']}  onClick={() => navigate('/plans')} />
                <StatCard icon={<Share2 size={15}/>}   color={BLUE}   label="Socials"  value={`${connectedAccounts}/4`}  onClick={() => navigate('/connect-accounts')} />
                <StatCard icon={<PenTool size={15}/>}  color={GREEN}  label="Content"  value={`${contentCount}`}         onClick={() => navigate('/agents-hub')} />
                <StatCard icon={<Activity size={15}/>} color={GOLD}   label="Progress" value={`${progress}%`}            onClick={null} progress={progress} />
              </div>

              {/* Lead Scoring */}
              <LeadScoringCard contentCount={contentCount} connectedAccounts={connectedAccounts} onNavigate={navigate} />

              {/* Campaign Journey */}
              <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={11} color={GOLD}/> Campaign Journey
                <span style={{ marginLeft: 'auto', color: GOLD, fontSize: 11 }}>{doneCount}/{JOURNEY.length}</span>
              </div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${GOLD},#f59e0b)`, transition: 'width 0.8s' }}/>
                </div>
                {JOURNEY.map((step, i) => {
                  const done   = completed[step.key]
                  const isNext = !done && JOURNEY.slice(0, i).every(s => completed[s.key])
                  return (
                    <div key={step.key}
                      onClick={() => step.route && !done && navigate(step.route)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', cursor: step.route && !done ? 'pointer' : 'default', borderBottom: i < JOURNEY.length - 1 ? `1px solid ${BORDER}` : 'none', background: isNext ? 'rgba(200,151,62,0.04)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (step.route && !done) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isNext ? 'rgba(200,151,62,0.04)' : 'transparent' }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{step.icon}</span>
                      <div style={{ flexShrink: 0 }}>
                        {done
                          ? <CheckCircle2 size={14} color={GREEN}/>
                          : isNext
                            ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD }}/></div>
                            : <Circle size={14} color="rgba(255,255,255,0.1)"/>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: done ? 400 : isNext ? 700 : 500, color: done ? TEXT3 : isNext ? TEXT : TEXT2, textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.label}</div>
                      </div>
                      {isNext && <span style={{ fontSize: 8, fontWeight: 800, color: GOLD, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 5, padding: '2px 5px', flexShrink: 0 }}>NEXT</span>}
                    </div>
                  )
                })}
              </div>

              {/* Recent content */}
              <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Content</div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                {recentContent.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: TEXT3, marginBottom: 10, lineHeight: 1.6 }}>No content yet. Use an agent above to generate your first piece.</div>
                    <button onClick={() => navigate('/caption-suite')} style={{ padding: '7px 14px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Generate Now →
                    </button>
                  </div>
                ) : recentContent.map((item, i) => (
                  <div key={item.id} style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: i < recentContent.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={12} color="#6366f1"/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.campaignName || item.type || 'AI Content'}</div>
                      <div style={{ fontSize: 10, color: TEXT3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text?.slice(0, 50) || 'Generated content'}</div>
                    </div>
                    <StatusBadge status={item.status}/>
                  </div>
                ))}
              </div>

              {/* Email Performance */}
              {emailCampaigns.length > 0 && emailCampaigns[0].metrics && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={11} color={PURPLE}/> Email Performance
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: TEXT3 }}>Predicted</span>
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
                    {/* Campaign name row */}
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PURPLE}15`, border: `1px solid ${PURPLE}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={13} color={PURPLE}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emailCampaigns[0].campaignName}</div>
                        <div style={{ fontSize: 9, color: TEXT3 }}>Most recent campaign</div>
                      </div>
                      <StatusBadge status={emailCampaigns[0].status || 'draft'}/>
                    </div>
                    {/* Metrics grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      {[
                        { label: 'Open Rate',        value: emailCampaigns[0].metrics.openRate,         color: GOLD,   icon: '👁' },
                        { label: 'Click Rate',        value: emailCampaigns[0].metrics.clickRate,        color: GREEN,  icon: '🖱' },
                        { label: 'Conversion Rate',   value: emailCampaigns[0].metrics.conversionRate,   color: BLUE,   icon: '💰' },
                        { label: 'Unsubscribe Rate',  value: emailCampaigns[0].metrics.unsubscribeRate,  color: '#ef4444', icon: '📤' },
                      ].map((m, idx) => (
                        <div key={m.label} style={{
                          padding: '11px 14px',
                          borderRight: idx % 2 === 0 ? `1px solid ${BORDER}` : 'none',
                          borderBottom: idx < 2 ? `1px solid ${BORDER}` : 'none',
                        }}>
                          <div style={{ fontSize: 16, marginBottom: 3 }}>{m.icon}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: m.color, fontFamily: "'Syne','Inter',sans-serif" }}>{m.value}</div>
                          <div style={{ fontSize: 9, color: TEXT3, marginTop: 1 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 14px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: TEXT3 }}>AI-predicted benchmarks</span>
                      <button onClick={() => navigate('/email-marketing')}
                        style={{ background: 'none', border: 'none', color: PURPLE, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                        New Campaign <ArrowRight size={9}/>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade card */}
              {plan !== 'package-c' && (
                <div style={{ marginTop: 12, background: `linear-gradient(135deg,rgba(200,151,62,0.1),rgba(200,151,62,0.04))`, border: `1px solid ${GBORD}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Zap size={14} color={GOLD}/> Unlock More Agents
                  </div>
                  <div style={{ fontSize: 11, color: TEXT2, marginBottom: 12, lineHeight: 1.6 }}>
                    Upgrade to access Video, Email, Ads, SEO, Analytics and 20+ more AI agents.
                  </div>
                  <button onClick={() => navigate('/plans')} style={{ width: '100%', padding: '9px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 9, color: '#0a0907', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    See All Plans <ArrowRight size={12}/>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {upgradeModal && (
        <UpgradeModal featureName={upgradeModal.featureName} onClose={() => setUpgradeModal(null)}/>
      )}

      {showEditModal && (
        <BrandSetupModal
          onComplete={handleEditComplete}
          onDismiss={() => setShowEditModal(false)}
        />
      )}

    </div>
  )
}

/* ── Task helpers ── */

const ROUTE_TO_TYPES = {
  '/caption-suite':       ['caption','social','instagram','linkedin','twitter','facebook','tiktok'],
  '/strategy':            ['strategy','marketing_strategy'],
  '/strategy-hub':        ['strategy','marketing_strategy'],
  '/email-marketing':     ['email'],
  '/seo-agent':           ['seo','keyword'],
  '/content-gen':         ['content','blog','article'],
  '/copywriting':         ['copy','landing','copywriting'],
  '/video-gen':           ['video'],
  '/reel-scripts':        ['reel','script'],
  '/product-desc':        ['product'],
  '/ab-testing':          ['ab_test','ab-test','experiment'],
  '/kpi-recommendations': ['kpi'],
  '/health-score':        ['health'],
  '/brand-kb':            ['brand'],
  '/meta-ads-boost':      ['meta','ads'],
  '/marketing-attribution':['attribution'],
  '/campaign-hub':        ['campaign'],
  '/audience-builder':    ['audience'],
  '/trends':              ['trend'],
}

function getTaskStatus(agentRoute, allContent) {
  const types = ROUTE_TO_TYPES[agentRoute] || []
  const matches = allContent.filter(c => types.some(t => (c.type || '').toLowerCase().includes(t)))
  if (matches.length === 0) return 'not_started'
  const hasExecuted = matches.some(c => ['published','scheduled','executed'].includes(c.status))
  if (hasExecuted) return 'executed'
  const hasApproval = matches.some(c => ['approved','review','pending_approval'].includes(c.status))
  if (hasApproval) return 'approval'
  return 'in_progress'
}

const TASK_STAGES = [
  { key: 'not_started', label: 'Start',          color: GOLD },
  { key: 'in_progress', label: 'In Progress',    color: BLUE },
  { key: 'approval',    label: 'Approval Queue', color: PURPLE },
  { key: 'executed',    label: 'Executed',       color: GREEN },
]

function TaskCard({ agent, status, i, onAction }) {
  const [hov, setHov] = useState(false)
  const stageIdx   = TASK_STAGES.findIndex(s => s.key === status)
  const activeIdx  = stageIdx >= 0 ? stageIdx : 0
  const activeStage = TASK_STAGES[activeIdx]

  const actionLabel = status === 'not_started' ? 'Start Campaign'
    : status === 'in_progress' ? 'Continue'
    : status === 'approval'    ? 'Review'
    : 'View Results'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${activeStage.color}07` : CARD,
        border: `1px solid ${hov ? activeStage.color + '35' : BORDER}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.18s',
      }}>
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${agent.color}14`, border: `1px solid ${agent.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {agent.icon}
      </div>

      {/* Label + stage pills */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 7 }}>{agent.label}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TASK_STAGES.map((s, idx) => {
            const past   = idx < activeIdx
            const active = idx === activeIdx
            return (
              <span key={s.key} style={{
                padding: '2px 8px', borderRadius: 100, fontSize: 9, fontWeight: 700,
                background: active ? `${s.color}20` : past ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: `1px solid ${active ? s.color + '60' : BORDER}`,
                color: active ? s.color : past ? TEXT3 : TEXT3,
                textDecoration: past ? 'line-through' : 'none',
              }}>
                {s.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => onAction(agent, status)}
        style={{
          padding: '7px 13px', flexShrink: 0, whiteSpace: 'nowrap',
          background: status === 'not_started'
            ? `linear-gradient(135deg,${GOLD},#b8803a)`
            : status === 'executed' ? `${GREEN}14` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${status === 'not_started' ? 'transparent' : status === 'executed' ? GREEN + '30' : BORDER}`,
          borderRadius: 9,
          color: status === 'not_started' ? '#0a0907' : status === 'executed' ? GREEN : TEXT2,
          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
        {actionLabel} <ArrowRight size={10}/>
      </button>
    </motion.div>
  )
}

/* ── Sub-components ── */

function RecommendedAgentRow({ agent, locked, i, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: hov ? `${agent.color}08` : CARD,
        border: `1px solid ${hov && !locked ? agent.color + '45' : BORDER}`,
        borderRadius: 13, padding: '14px 18px',
        opacity: locked ? 0.65 : 1,
        transition: 'all 0.18s',
        boxShadow: hov && !locked ? `0 6px 20px ${agent.color}12` : 'none',
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${agent.color}14`, border: `1px solid ${agent.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {agent.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{agent.label}</div>
        <div style={{ fontSize: 11, color: TEXT3 }}>{agent.desc}</div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: agent.color, background: `${agent.color}12`, border: `1px solid ${agent.color}28`, borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
        {agent.plan === 'free' ? 'FREE' : agent.plan === 'package-a' ? 'PKG A' : agent.plan === 'package-b' ? 'PKG B' : 'PKG C'}
      </span>
      {locked
        ? <button onClick={onClick} style={{ padding: '7px 13px', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 9, color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>Upgrade →</button>
        : <button onClick={onClick} style={{ padding: '7px 14px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 9, color: '#0a0907', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>Start Campaign <ArrowRight size={10}/></button>
      }
    </motion.div>
  )
}

function CampaignTypeCard({ camp, locked, i, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !locked ? `${camp.color}0e` : CARD,
        border: `1px solid ${hov && !locked ? camp.color + '55' : locked ? BORDER : camp.color + '28'}`,
        borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
        opacity: locked ? 0.65 : 1,
        transition: 'all 0.2s',
        boxShadow: hov && !locked ? `0 8px 28px ${camp.color}16` : 'none',
        transform: hov && !locked ? 'translateY(-3px)' : 'none',
        position: 'relative',
      }}>
      {/* Plan badge top-right */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        {locked
          ? <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 5, padding: '2px 6px' }}>UPGRADE</span>
          : <span style={{ fontSize: 9, fontWeight: 700, color: camp.color, background: `${camp.color}10`, border: `1px solid ${camp.color}25`, borderRadius: 5, padding: '2px 6px' }}>
              {camp.plan === 'free' ? 'FREE' : camp.plan === 'package-a' ? 'PKG A' : camp.plan === 'package-b' ? 'PKG B' : 'PKG C'}
            </span>
        }
      </div>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{camp.icon}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{camp.label}</div>
      <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.55, marginBottom: 12 }}>{camp.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: camp.color }}>{camp.step}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: hov && !locked ? camp.color : TEXT3, transition: 'color 0.15s' }}>
          {locked ? 'Unlock' : 'Start'} <ArrowRight size={11}/>
        </div>
      </div>
    </motion.div>
  )
}

function AgentCard({ agent, locked, i, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${agent.color}0c` : CARD2,
        border: `1px solid ${hov && !locked ? agent.color + '50' : BORDER}`,
        borderRadius: 13, padding: '15px 16px', cursor: 'pointer',
        opacity: locked ? 0.65 : 1,
        transition: 'all 0.18s',
        boxShadow: hov && !locked ? `0 8px 24px ${agent.color}14` : 'none',
        transform: hov && !locked ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${agent.color}14`, border: `1px solid ${agent.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {agent.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{agent.label}</div>
          <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.5 }}>{agent.desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: agent.color, background: `${agent.color}12`, border: `1px solid ${agent.color}28`, borderRadius: 5, padding: '2px 6px' }}>
          {agent.plan === 'free' ? 'FREE' : agent.plan === 'package-a' ? 'PKG A' : agent.plan === 'package-b' ? 'PKG B' : 'PKG C'}
        </span>
        {locked
          ? <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 5, padding: '2px 6px' }}>UPGRADE</span>
          : <ArrowRight size={12} color={hov ? agent.color : TEXT3} style={{ transition: 'color 0.15s' }}/>
        }
      </div>
    </motion.div>
  )
}

function AgentGroup({ group, planLevel, onAgent }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: 16 }}>{group.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, flex: 1 }}>{group.label}</span>
        <span style={{ fontSize: 10, color: TEXT3 }}>{group.agents.length} agents</span>
        <ChevronRight size={13} color={TEXT3} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}/>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {group.agents.map(agent => {
            const locked = PLANS.indexOf(agent.plan) > planLevel
            return (
              <div key={agent.route} onClick={() => onAgent(agent)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', transition: 'background 0.15s', borderBottom: `1px solid ${BORDER}`, opacity: locked ? 0.65 : 1 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 14 }}>{agent.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{agent.label}</div>
                  <div style={{ fontSize: 10, color: TEXT3 }}>{agent.desc}</div>
                </div>
                {locked
                  ? <span style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 5, padding: '2px 5px', flexShrink: 0 }}>PRO</span>
                  : <ArrowRight size={11} color={TEXT3} style={{ flexShrink: 0 }}/>
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, color, label, value, onClick, progress }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: CARD, border: `1px solid ${hov && onClick ? color+'40' : BORDER}`, borderRadius: 11, padding: '12px 14px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.18s' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: TEXT, marginBottom: 2, fontFamily: "'Syne','Inter',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: TEXT3 }}>{label}</div>
      {progress !== undefined && (
        <div style={{ marginTop: 6, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${GOLD},#f59e0b)`, borderRadius: 2, transition: 'width 0.8s' }}/>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { draft:{label:'Draft',color:'#6b7280'}, approved:{label:'Approved',color:GREEN}, scheduled:{label:'Scheduled',color:BLUE}, published:{label:'Published',color:GOLD}, rejected:{label:'Rejected',color:'#ef4444'} }
  const s = map[status] || map.draft
  return <span style={{ fontSize: 9, fontWeight: 700, color: s.color, background:`${s.color}12`, border:`1px solid ${s.color}28`, borderRadius: 5, padding: '2px 5px', flexShrink: 0 }}>{s.label}</span>
}

function LeadScoringCard({ contentCount, connectedAccounts, onNavigate }) {
  const [hov, setHov] = useState(false)

  const estReach     = contentCount * connectedAccounts * 480 || 0
  const engagePct    = contentCount > 0 ? Math.min(94, 38 + contentCount * 3) : 0
  const leadScore    = Math.min(99, Math.round((connectedAccounts / 4) * 40 + (contentCount > 0 ? 35 : 0) + 10))
  const scoreColor   = leadScore >= 70 ? GREEN : leadScore >= 40 ? GOLD : '#ef4444'

  const platforms = [
    { label: 'Instagram', reach: Math.round(estReach * 0.38), color: '#e1306c',  connected: connectedAccounts > 0 },
    { label: 'LinkedIn',  reach: Math.round(estReach * 0.28), color: '#0a66c2',  connected: connectedAccounts > 1 },
    { label: 'Facebook',  reach: Math.round(estReach * 0.22), color: '#1877f2',  connected: connectedAccounts > 2 },
    { label: 'X / Twitter', reach: Math.round(estReach * 0.12), color: '#1da1f2', connected: connectedAccounts > 3 },
  ]

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={11} color={PURPLE} /> Lead Scoring & Reach
      </div>

      {/* Score button */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => onNavigate('/marketing-attribution')}
        style={{
          background: hov ? `${PURPLE}12` : CARD,
          border: `1px solid ${hov ? PURPLE + '40' : BORDER}`,
          borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
          transition: 'all 0.18s',
          boxShadow: hov ? `0 6px 20px ${PURPLE}14` : 'none',
        }}>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${scoreColor}16`, border: `2px solid ${scoreColor}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: scoreColor }}>{leadScore}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Lead Score</div>
            <div style={{ fontSize: 10, color: TEXT3 }}>
              {leadScore >= 70 ? 'Strong reach — content is performing well' : leadScore >= 40 ? 'Growing — connect more accounts to boost' : 'Start by generating content & connecting socials'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>
              {estReach > 0 ? `~${(estReach / 1000).toFixed(1)}K` : '—'}
            </div>
            <div style={{ fontSize: 9, color: TEXT3 }}>est. reach</div>
          </div>
        </div>

        {/* Platform reach breakdown */}
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {platforms.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.connected ? p.color : BORDER, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: p.connected ? TEXT2 : TEXT3, flex: 1, fontWeight: p.connected ? 500 : 400 }}>{p.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.connected ? TEXT : TEXT3 }}>
                {p.connected ? `~${(p.reach / 1000).toFixed(1)}K` : 'Not connected'}
              </span>
            </div>
          ))}
        </div>

        {/* Engagement + CTA */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: TEXT3, marginBottom: 3 }}>Content engagement rate</div>
            <div style={{ height: 3, width: 120, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${engagePct}%`, background: `linear-gradient(90deg,${PURPLE},${BLUE})`, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 9, color: TEXT3, marginTop: 3 }}>{engagePct > 0 ? `${engagePct}% estimated engagement` : 'Generate content to score'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: hov ? PURPLE : TEXT3, transition: 'color 0.15s' }}>
            Full Report <ArrowRight size={10}/>
          </div>
        </div>
      </div>
    </div>
  )
}

