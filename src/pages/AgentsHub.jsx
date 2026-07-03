import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Zap, TrendingUp, Target, BarChart2, Brain,
  Rocket, Globe, Mail, Users, PieChart, Image, Film,
  Calendar, Package, Search, FileText, Megaphone, Activity,
  CheckCircle2, AlertCircle, Play, Sparkles, ChevronRight,
  Link2, Coins, Bot, LayoutDashboard, Camera,
  Eye, Trash2, Clock, ChevronDown, ChevronUp, ArrowLeft,
  Shield, Code2, TrendingDown, DollarSign, Crown, Download, BookOpen,
  Inbox,
  Share2, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { redirectToLogin } from '../lib/authUtils'
import { getOrCreateUser } from '../services/userService'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { PLANS as PLAN_ORDER } from '../lib/planGate.js'
import { getRecommendedActions } from '../lib/recommendations.jsx'
import { buildCampaignPrefill } from '../lib/campaignPrefill.js'
import UpgradeModal from '../components/UpgradeModal.jsx'

/* ─── colour tokens ─── */
const BG       = '#0e0c09'
const GOLD     = '#c8973e'
const GDIM     = 'rgba(200,151,62,0.13)'
const GBORDER  = 'rgba(200,151,62,0.28)'
const CARD     = '#1c1a13'
const TEXT     = '#f0ebe0'
const TEXT2    = 'rgba(240,235,224,0.55)'
const TEXT3    = 'rgba(240,235,224,0.32)'
const BORDER   = 'rgba(255,255,255,0.07)'

const goldGrad = {
  background: 'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

/* ─── Campaign history type metadata ─── */
const TYPE_META = {
  event:             { color: '#c8973e', icon: <Calendar size={18} />,   label: 'Event' },
  product:           { color: '#c8973e', icon: <Package size={18} />,    label: 'Product' },
  brand:             { color: '#a855f7', icon: <Zap size={18} />,        label: 'Brand' },
  growth_strategy:   { color: '#10b981', icon: <Rocket size={18} />,     label: 'Growth' },
  growth_agent:      { color: '#10b981', icon: <Rocket size={18} />,     label: 'Growth' },
  competitive_intel: { color: '#f59e0b', icon: <Target size={18} />,     label: 'Intel' },
  content_calendar:  { color: '#3b82f6', icon: <FileText size={18} />,   label: 'Content' },
  seo_blog:          { color: '#c8973e', icon: <Globe size={18} />,      label: 'SEO' },
  email_drip:        { color: '#8b5cf6', icon: <Mail size={18} />,       label: 'Email' },
  influencer:        { color: '#ec4899', icon: <Users size={18} />,      label: 'Influencer' },
  analytics_report:  { color: '#f97316', icon: <PieChart size={18} />,   label: 'Analytics' },
  sales_enablement:  { color: '#6366f1', icon: <Activity size={18} />,   label: 'Sales' },
  event_full:        { color: '#c8973e', icon: <Megaphone size={18} />,  label: 'ELEVATE' },
  marketplace:       { color: '#14b8a6', icon: <Package size={18} />,    label: 'Marketplace' },
  brand_strategy:    { color: '#a855f7', icon: <Brain size={18} />,      label: 'Brand' },
  funnel_cro:        { color: '#ef4444', icon: <Activity size={18} />,   label: 'CRO' },
  pr_reputation:     { color: '#06b6d4', icon: <Megaphone size={18} />,  label: 'PR' },
  crm_lifecycle:     { color: '#10b981', icon: <Users size={18} />,      label: 'CRM' },
  paid_advertising:  { color: '#f59e0b', icon: <Target size={18} />,     label: 'Paid Ads' },
  ai_cfo:            { color: '#22c55e', icon: <DollarSign size={18} />, label: 'AI CFO' },
  ai_cto:            { color: '#6366f1', icon: <Code2 size={18} />,      label: 'AI CTO' },
  ai_cro_exec:       { color: '#f97316', icon: <TrendingUp size={18} />, label: 'AI CRO' },
  ai_ceo:            { color: '#c8973e', icon: <Crown size={18} />,      label: 'AI CEO' },
  ai_compliance:     { color: '#64748b', icon: <Shield size={18} />,     label: 'Compliance' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AgentsHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaigns,       setCampaigns]       = useState([])
  const [connectedCount,  setConnectedCount]  = useState(0)
  const [tokenBalance,    setTokenBalance]    = useState(null)
  const [userName,        setUserName]        = useState('')
  const [objective,       setObjective]       = useState('')
  const [budget,          setBudget]          = useState('')
  const [deadline,        setDeadline]        = useState('')
  const [showAllHistory,  setShowAllHistory]  = useState(false)
  const [hasBrandKb,      setHasBrandKb]      = useState(false)
  const [kb,              setKb]              = useState(null)
  const [upgradeFor,      setUpgradeFor]      = useState(null)
  const { plan: userPlan } = useUserPlan()

  useEffect(() => {
    if (!user) return
    const key = `evoke_campaigns_${user.uid}`
    const stored = JSON.parse(localStorage.getItem(key) || '[]')
    setCampaigns(stored)
  }, [user])

  useEffect(() => {
    if (!user) return
    const name = user.displayName?.split(' ')[0] || 'there'
    setUserName(name)
    getOrCreateUser(user.uid, user.displayName, user.email).then((data) => {
      setTokenBalance(data.tokenBalance ?? 0)
      const accounts = data.socialAccounts || {}
      const count = Object.values(accounts).filter(a => a?.connected).length
      setConnectedCount(count)
    }).catch(() => {})
    getKnowledgeBase(user.uid).then(data => {
      setKb(data)
      setHasBrandKb(!!(data && Object.keys(data).length > 1))
    }).catch(() => {})
  }, [user])

  const handleLaunchCMO = () => {
    if (!user) { redirectToLogin(); return }
    const pkg = (() => { try { return localStorage.getItem('evoke_selected_package') || 'free' } catch { return 'free' } })()
    const dest = { 'package-a': '/package-a', 'package-b': '/package-b', 'package-c': '/package-c' }[pkg] || '/package-a'
    navigate(dest)
  }

  const handleLaunchObjective = () => {
    if (!user) { redirectToLogin(); return }
    const pkg = (() => { try { return localStorage.getItem('evoke_selected_package') || 'free' } catch { return 'free' } })()
    const dest = { 'package-a': '/package-a', 'package-b': '/package-b', 'package-c': '/package-c' }[pkg] || '/package-a'
    navigate(dest)
  }

  const viewCampaign = (c) => {
    sessionStorage.setItem('campaignResult', JSON.stringify(c.result))
    sessionStorage.setItem('campaignType', c.type)
    sessionStorage.setItem('campaignMeta', JSON.stringify(c.meta || { name: c.name }))
    navigate('/results')
  }

  const deleteCampaign = (id) => {
    const updated = campaigns.filter(c => c.id !== id)
    setCampaigns(updated)
    if (user) localStorage.setItem(`evoke_campaigns_${user.uid}`, JSON.stringify(updated))
  }

  const displayedHistory = showAllHistory ? campaigns : campaigns.slice(0, 5)

  /* ── Marketing health score — Profile(20) + Brand KB(20) + Social(20) + Campaigns(20) ── */
  const profileScore  = 20 // logged in ⇒ onboarding counted done
  const kbScore        = hasBrandKb ? 20 : 0
  const socialScore   = Math.min(Math.round((connectedCount / 6) * 20), 20)
  const campaignScore = campaigns.length > 0 ? 20 : 0
  const healthScore   = Math.min(100, profileScore + kbScore + socialScore + campaignScore)

  const recommendedActions = getRecommendedActions(connectedCount, campaigns, tokenBalance, kb)

  // If a recommendation needs a higher plan than the user has, prompt an
  // upgrade instead of navigating straight into a feature they can't use.
  const goToRecommendation = (action) => {
    const required = action.planRequired || 'free'
    if (PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(required)) {
      setUpgradeFor({ requiredPlan: required, featureTitle: action.title })
      return
    }
    if (action.path.startsWith('/campaign/')) {
      navigate(action.path, { state: { prefill: buildCampaignPrefill(kb) } })
      return
    }
    navigate(action.path)
  }

  /* ── Org chart data ── */
  const level1 = [
    { id: 'strategy',    title: 'Strategy Agent',       role: 'Growth & Market Planning',   model: 'EVOX AI', color: '#10b981', path: '/campaign/growth_strategy' },
    { id: 'content_seo', title: 'Content & SEO Agent',  role: 'Blog, Copy & Keywords',      model: 'EVOX AI', color: '#3b82f6', path: '/campaign/content_calendar' },
    { id: 'visual',      title: 'Visual Creative Agent', role: 'Images, Videos & Ads',      model: 'GPT Image 2 / Stability AI', color: '#a855f7', path: '/products' },
  ]
  const level2 = {
    strategy:    [
      { id: 'ads',      title: 'Ads & Paid Agent',      role: 'Google & Meta Campaigns',    model: 'EVOX AI',   color: '#f59e0b', path: '/campaign/brand' },
      { id: 'social',   title: 'Social Media Agent',    role: 'Content Calendar & Posts',   model: 'EVOX AI',    color: '#ec4899', path: '/campaign/content_calendar' },
    ],
    content_seo: [
      { id: 'seo_sub',      title: 'SEO Sub-Agent',     role: 'Keywords & On-Page',         model: 'EVOX AI + web',   color: '#14b8a6', path: '/campaign/seo_blog' },
      { id: 'content_sub',  title: 'Content Sub-Agent', role: 'Blog & Landing Pages',       model: 'EVOX AI',         color: '#6366f1', path: '/campaign/seo_blog' },
    ],
    visual: [
      { id: 'image_gen', title: 'Image Gen Agent',      role: 'Product & Lifestyle Photos', model: 'GPT Image 2 / Replicate', color: '#ec4899', path: '/campaign/image_angles' },
      { id: 'video_360', title: 'Video/360 Agent',      role: 'Lifestyle & 360° Videos',    model: 'Runway ML / Luma AI',  color: '#f97316', path: '/campaign/image_360' },
    ],
  }
  const analyticsAgent = { id: 'analytics', title: 'Analytics & Reporting', role: 'KPIs, ROAS & Insights', model: 'EVOX AI + data tools', color: '#8b5cf6', path: '/campaign/analytics_report' }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>

      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 28px 80px' }}>

        {/* ═══ SECTION 1: Command Center Header ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          {/* EVOX status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', background: GDIM, border: `1px solid ${GBORDER}`,
            borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            EVOX CMO · Status: Active
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800,
                letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8,
                fontFamily: "'Syne','Inter',sans-serif",
              }}>
                {getGreeting()}{userName ? `, ` : ''}{userName ? <span style={goldGrad}>{userName}</span> : ''}
              </h1>
              <p style={{ fontSize: 15, color: TEXT2, maxWidth: 480, lineHeight: 1.65 }}>
                Your AI Marketing Department is active and ready.
                {campaigns.length > 0
                  ? ` ${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} generated so far.`
                  : ' Launch your first campaign to get started.'}
              </p>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/connect-accounts')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: connectedCount > 0 ? 'rgba(16,185,129,0.1)' : GDIM,
                  border: `1px solid ${connectedCount > 0 ? 'rgba(16,185,129,0.3)' : GBORDER}`,
                  borderRadius: 10, color: connectedCount > 0 ? '#10b981' : GOLD,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Link2 size={13} />
                {connectedCount > 0 ? `${connectedCount} Connected` : 'Connect Platforms'}
              </button>
              <button
                onClick={() => navigate('/purchase')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: (tokenBalance ?? 0) > 0 ? GDIM : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${(tokenBalance ?? 0) > 0 ? GBORDER : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 10, color: (tokenBalance ?? 0) > 0 ? GOLD : '#ef4444',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Coins size={13} />
                {tokenBalance !== null ? `${tokenBalance} Token${tokenBalance !== 1 ? 's' : ''}` : '— Tokens'}
              </button>
              <button
                onClick={() => navigate('/trends')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(236,72,153,0.08)',
                  border: '1px solid rgba(236,72,153,0.25)',
                  borderRadius: 10, color: '#ec4899',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <TrendingUp size={13} /> Trends
              </button>
              <button
                onClick={() => navigate('/strategy')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(200,151,62,0.08)',
                  border: `1px solid ${GBORDER}`,
                  borderRadius: 10, color: GOLD,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <TrendingUp size={13} /> Strategy
              </button>
              <button
                onClick={() => navigate('/kpi-recommendations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 10, color: '#10b981',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <BarChart2 size={13} /> KPIs
              </button>
              <button
                onClick={() => navigate('/brand-kb')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 10, color: '#8b5cf6',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <BookOpen size={13} /> Brand KB
              </button>
              <button
                onClick={() => navigate('/executive-report')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: GDIM,
                  border: `1px solid ${GBORDER}`,
                  borderRadius: 10, color: GOLD,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <BarChart2 size={13} /> Executive Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ CMO Setup Required — shown to new users before Brand KB is filled ═══ */}
        {!hasBrandKb && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              marginBottom: 32, borderRadius: 20, overflow: 'hidden',
              border: `1px solid rgba(200,151,62,0.4)`,
              background: 'linear-gradient(135deg, rgba(200,151,62,0.10) 0%, rgba(14,12,9,0.95) 60%)',
            }}
          >
            {/* Top bar */}
            <div style={{ background: 'linear-gradient(135deg,#d4a853,#b8803a)', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} color="#0e0c09" fill="#0e0c09" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0e0c09', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CMO Setup Required · Step 1 of 2
              </span>
            </div>

            <div style={{ padding: '28px 32px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Left: message */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, fontFamily: "'Syne','Inter',sans-serif", margin: '0 0 8px', letterSpacing: '-0.02em', color: TEXT }}>
                  Set up your <span style={goldGrad}>Brand Profile</span> first
                </h2>
                <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, margin: '0 0 22px', maxWidth: 420 }}>
                  Your AI CMO needs to know your brand before it can generate personalised campaigns, recommend the right agents, and build your growth strategy.
                </p>
                <button
                  onClick={() => navigate('/brand-kb')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px',
                    background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                    border: 'none', borderRadius: 12, color: '#0e0c09',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 6px 24px rgba(200,151,62,0.4)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(200,151,62,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(200,151,62,0.4)' }}
                >
                  <BookOpen size={16} /> Set Up Brand Profile <ArrowRight size={15} />
                </button>
              </div>

              {/* Right: 4 steps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 260 }}>
                {[
                  { n: 1, label: 'Business Identity',   desc: 'Company, industry, what you sell', color: GOLD },
                  { n: 2, label: 'Market Intelligence', desc: 'Your audience & competitors',       color: '#6366f1' },
                  { n: 3, label: 'Brand Identity',      desc: 'Colors, tone of voice, tagline',   color: '#ec4899' },
                  { n: 4, label: 'Business Goals',      desc: 'Objectives, timeline, revenue',    color: '#10b981' },
                ].map(s => (
                  <div key={s.n} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}25`, borderRadius: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${s.color}18`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.n}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ Marketing Health Score — pinned at the top ═══ */}
        {(() => {
          const healthMeta = healthScore >= 80
            ? { label: 'Excellent',   color: '#10b981' }
            : healthScore >= 50
            ? { label: 'Good',        color: GOLD }
            : healthScore > 0
            ? { label: 'Needs Setup', color: '#f97316' }
            : { label: 'Getting Started', color: '#ef4444' }

          const breakdown = [
            { label: 'Profile',    score: profileScore,  max: 20, color: GOLD },
            { label: 'Brand KB',   score: kbScore,        max: 20, color: '#f59e0b' },
            { label: 'Social',     score: socialScore,    max: 20, color: '#3b82f6' },
            { label: 'Campaigns',  score: campaignScore,  max: 20, color: '#10b981' },
          ]

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate('/health-score')}
              style={{
                marginBottom: 24, padding: '26px 28px', cursor: 'pointer',
                background: `linear-gradient(135deg, ${healthMeta.color}10, ${CARD})`,
                border: `1px solid ${healthMeta.color}35`, borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ width: 84, height: 84, borderRadius: '50%', flexShrink: 0, background: `${healthMeta.color}12`, border: `3px solid ${healthMeta.color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: healthMeta.color, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1 }}>{healthScore}</span>
                <span style={{ fontSize: 9, color: TEXT3, fontWeight: 700 }}>/100</span>
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: `${healthMeta.color}15`, border: `1px solid ${healthMeta.color}40`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: healthMeta.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  <Activity size={11}/> Marketing Health Score
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 10 }}>{healthMeta.label}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {breakdown.map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.score >= b.max ? b.color : 'rgba(255,255,255,0.15)' }}/>
                      <span style={{ fontSize: 11, color: TEXT3, fontWeight: 600 }}>{b.label} {b.score}/{b.max}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: `${healthMeta.color}15`, border: `1px solid ${healthMeta.color}40`, borderRadius: 100, color: healthMeta.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                View Full Report <ChevronRight size={14}/>
              </div>
            </motion.div>
          )
        })()}

        {/* ═══ Personalized CMO Banner — shown after Brand KB setup ═══ */}
        {hasBrandKb && kb && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07 }}
            style={{
              marginBottom: 28, padding: '24px 28px',
              background: 'linear-gradient(135deg, rgba(200,151,62,0.10), rgba(200,151,62,0.04))',
              border: `1px solid ${GBORDER}`, borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#d4a853,#b8803a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(200,151,62,0.3)',
            }}>
              <Brain size={24} color="#0e0c09" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                Your AI CMO · Brand Setup Complete
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4, fontFamily: "'Syne','Inter',sans-serif" }}>
                {kb.companyName
                  ? <>CMO is ready for <span style={goldGrad}>{kb.companyName}</span></>
                  : 'Your brand profile is ready'}
              </div>
              <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>
                {kb.industry
                  ? `Based on your ${(kb.industry || '').replace(/_/g,' ')} brand, your CMO has identified the top growth opportunities below. Launch an agent to start growing.`
                  : 'Your CMO has reviewed your brand and identified the best agents to help you grow. Launch one below to get started.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/brand-kb')}
              style={{
                padding: '9px 18px', background: GDIM, border: `1px solid ${GBORDER}`,
                borderRadius: 10, color: GOLD, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              <BookOpen size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Edit Brand Profile
            </button>
          </motion.div>
        )}

        {/* ═══ Next Step / Recommendations ═══ */}
        {hasBrandKb && campaigns.length === 0 ? (
          /* ── FIRST-TIME USER: single prominent next-step hero ── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
              <Sparkles size={11}/> YOUR NEXT STEP
            </div>

            {/* Hero card */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => navigate('/strategy')}
              style={{ padding: '32px 36px', cursor: 'pointer', background: 'rgba(249,115,22,0.06)', border: '2px solid rgba(249,115,22,0.4)', borderRadius: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, background: 'radial-gradient(circle at 100% 0%, rgba(249,115,22,0.14), transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, flexWrap: 'wrap' }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', flexShrink: 0 }}>
                  <TrendingUp size={28}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Step 2 of 12 — Start Here</div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.2 }}>Build Your Marketing Strategy</h2>
                  <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 20, maxWidth: 520 }}>
                    Your EVOX AI CMO will generate a full Annual, Quarterly & Monthly marketing plan tailored to {kb?.companyName || 'your brand'} — campaigns, budget, KPIs and channels ready in seconds.
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/strategy') }}
                      style={{ padding: '12px 28px', background: '#f97316', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em' }}
                    >
                      Build Your Strategy →
                    </button>
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Brand setup complete — ready to go</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Coming up — compact step chips */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>After that</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[
                { n: 3,  label: 'Campaign Hub',     path: '/campaign-hub' },
                { n: 4,  label: 'Audience Builder', path: '/audience-builder' },
                { n: 5,  label: 'Content',          path: '/caption-suite' },
                { n: 6,  label: 'Creative Assets',  path: '/products' },
                { n: 7,  label: 'Video',            path: '/video-gen' },
                { n: 8,  label: 'Brand Review',     path: '/brand-governance' },
                { n: 9,  label: 'Analytics',        path: '/analytics' },
                { n: 10, label: 'Approval Queue',   path: '/queue' },
                { n: 11, label: 'Post Content',     path: '/post-content' },
                { n: 12, label: 'Exec Report',      path: '/executive-report' },
              ].map((s, i, arr) => (
                <React.Fragment key={s.path}>
                  <button
                    onClick={() => navigate(s.path)}
                    style={{ padding: '5px 13px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: TEXT3, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  >
                    {s.n}. {s.label}
                  </button>
                  {i < arr.length - 1 && <ChevronRight size={10} color={TEXT3} />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        ) : recommendedActions.length > 0 ? (
          /* ── RETURNING USER: full recommendations grid ── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
              <Sparkles size={11}/> {hasBrandKb ? 'YOUR CMO RECOMMENDS' : 'RECOMMENDED FOR YOU'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {recommendedActions.map(a => {
                const locked = PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(a.planRequired || 'free')
                return (
                  <motion.div
                    key={a.path}
                    whileHover={{ y: -3 }}
                    onClick={() => goToRecommendation(a)}
                    style={{
                      padding: '20px 18px', cursor: 'pointer', position: 'relative',
                      background: a.highlight ? `${a.color}0a` : CARD,
                      border: `1px solid ${a.highlight ? a.color + '45' : BORDER}`,
                      borderRadius: 16, transition: 'border-color 0.2s',
                    }}
                  >
                    {locked && (
                      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 9, fontWeight: 800, color: TEXT3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        <Lock size={9}/> {a.planRequired?.replace('package-', 'Pkg ').toUpperCase()}
                      </div>
                    )}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${a.color}15`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 14 }}>
                      {a.icon}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: TEXT3, lineHeight: 1.5, marginBottom: 14 }}>{a.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: locked ? TEXT3 : a.color }}>
                      {locked ? <><Lock size={11}/> Upgrade to unlock</> : <>{a.cta} <ChevronRight size={12}/></>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : null}

        {upgradeFor && (
          <UpgradeModal
            requiredPlan={upgradeFor.requiredPlan}
            featureTitle={upgradeFor.featureTitle}
            onClose={() => setUpgradeFor(null)}
          />
        )}

        {/* ═══ PLAN TIERS SECTION — returning users only ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.09 }}
          style={{ marginBottom: 40, display: campaigns.length > 0 ? 'block' : 'none' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
            <Crown size={11} /> WHAT'S IN EACH PLAN
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              {
                plan: 'free', label: 'Free', tag: 'ALWAYS ON', tagColor: '#10b981',
                border: 'rgba(16,185,129,0.3)', accent: '#10b981',
                features: [
                  'Brand Knowledge Base',
                  'Marketing Health Score',
                  'Growth Strategy Agent',
                  'Campaign Hub (all types)',
                  'Caption Suite',
                  'Audience Builder',
                  'Analytics Dashboard',
                  'Executive Report',
                  'Connect Social Accounts',
                ],
                cta: null,
              },
              {
                plan: 'package-a', label: 'Package A', tag: 'STARTER', tagColor: '#3b82f6',
                border: 'rgba(59,130,246,0.3)', accent: '#3b82f6',
                features: [
                  'Everything in Free',
                  'Multi-angle product photos',
                  'Lifestyle & scene images',
                  'Ad-ready static banners',
                  'Managed social posting',
                  'Image SEO & meta tags',
                ],
                cta: 'Upgrade to Starter',
              },
              {
                plan: 'package-b', label: 'Package B', tag: 'POPULAR', tagColor: GOLD,
                border: GBORDER, accent: GOLD,
                features: [
                  'Everything in Package A',
                  'Lifestyle short-form video',
                  '360° product video',
                  'Full 30-day content calendar',
                  'Influencer & PR briefs',
                ],
                cta: 'Upgrade to Popular',
              },
              {
                plan: 'package-c', label: 'Package C', tag: 'PREMIUM', tagColor: '#a855f7',
                border: 'rgba(168,85,247,0.3)', accent: '#a855f7',
                features: [
                  'Everything in Package B',
                  '3D product renders',
                  'Ad creatives (static + video)',
                  'Meta Ads manager',
                  'Google Ads manager',
                  'Precision audience targeting',
                  'Full campaign deploy',
                ],
                cta: 'Upgrade to Premium',
              },
            ].map(tier => {
              const isCurrentPlan = (userPlan || 'free') === tier.plan
              const isLocked = PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(tier.plan)
              return (
                <div
                  key={tier.plan}
                  style={{
                    background: isCurrentPlan ? `${tier.accent}08` : CARD,
                    border: `1px solid ${isCurrentPlan ? tier.border : BORDER}`,
                    borderRadius: 16, padding: '18px 16px',
                    position: 'relative',
                  }}
                >
                  {isCurrentPlan && (
                    <div style={{ position: 'absolute', top: -10, left: 16, background: tier.accent, color: '#0e0c09', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 100, letterSpacing: '0.08em' }}>
                      YOUR PLAN
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{tier.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: tier.tagColor, background: `${tier.tagColor}15`, border: `1px solid ${tier.tagColor}30`, borderRadius: 100, padding: '3px 9px', letterSpacing: '0.06em' }}>{tier.tag}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {tier.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: isLocked && i > 0 ? TEXT3 : TEXT2, lineHeight: 1.4 }}>
                        <span style={{ color: isLocked && i > 0 ? TEXT3 : tier.accent, flexShrink: 0, marginTop: 1, fontSize: 13 }}>
                          {isLocked && i > 0 ? '○' : '✓'}
                        </span>
                        {f}
                      </div>
                    ))}
                  </div>
                  {isLocked && tier.cta && (
                    <button
                      onClick={() => setUpgradeFor({ requiredPlan: tier.plan, featureTitle: tier.label + ' features' })}
                      style={{ width: '100%', padding: '9px', background: `${tier.accent}12`, border: `1px solid ${tier.accent}30`, borderRadius: 10, color: tier.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {tier.cta} →
                    </button>
                  )}
                  {isCurrentPlan && (
                    <div style={{ fontSize: 11, color: tier.accent, fontWeight: 600, textAlign: 'center', padding: '6px 0' }}>
                      ✓ Active
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ═══ SECTION 2: KPI Metrics Row — returning users only ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: campaigns.length > 0 ? 'grid' : 'none',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14, marginBottom: 40,
          }}
        >
          {[
            {
              label: 'Marketing Health Score',
              value: `${healthScore}/100`,
              sub: healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs setup',
              color: healthScore >= 80 ? '#10b981' : healthScore >= 50 ? GOLD : '#ef4444',
              icon: <Activity size={16} />,
            },
            {
              label: 'Campaigns Generated',
              value: campaigns.length.toString(),
              sub: campaigns.length > 0 ? 'campaigns launched' : 'Launch your first',
              color: GOLD,
              icon: <Rocket size={16} />,
            },
            {
              label: 'Platforms Connected',
              value: `${connectedCount}/11`,
              sub: connectedCount > 0 ? 'platforms active' : 'None connected yet',
              color: connectedCount > 5 ? '#10b981' : connectedCount > 0 ? GOLD : '#64748b',
              icon: <Link2 size={16} />,
            },
            {
              label: 'Campaign Tokens',
              value: tokenBalance !== null ? `${tokenBalance}` : '—',
              sub: (tokenBalance ?? 0) > 0 ? 'available to use' : 'Top up to continue',
              color: (tokenBalance ?? 0) > 0 ? '#10b981' : '#ef4444',
              icon: <Coins size={16} />,
            },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: '20px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {metric.label}
                </span>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `${metric.color}12`, border: `1px solid ${metric.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: metric.color,
                }}>
                  {metric.icon}
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: metric.color, marginBottom: 4 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>{metric.sub}</div>
            </motion.div>
          ))}
        </motion.div>


        {/* ═══ SECTION: Customer Journey Flow ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginBottom: 48 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 10 }}>
                <Zap size={11} /> CUSTOMER JOURNEY FLOW
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 4 }}>
                10-Step Campaign Flow
              </h2>
              <p style={{ fontSize: 13, color: TEXT2 }}>Follow these steps in order — each agent builds on the previous one.</p>
            </div>
            <button
              onClick={() => navigate('/executive-report')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <BarChart2 size={13} /> View Executive Report
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { step: 1, title: 'Business Objective',        desc: 'Define your revenue goal and business target',          path: '/brand-kb',          color: GOLD,      done: hasBrandKb },
              { step: 2, title: 'Marketing Strategy Agent',  desc: 'AI creates annual, quarterly and monthly strategy',     path: '/strategy',          color: '#10b981',  done: campaigns.length > 0 },
              { step: 3, title: 'Campaign Planning Agent',   desc: 'Build campaign brief, timeline, budget and KPIs',       path: '/campaign-hub',      color: '#3b82f6',  done: campaigns.length > 0 },
              { step: 4, title: 'Audience Intelligence Agent', desc: 'Segment your audience and build lookalike profiles',  path: '/audience-builder',  color: '#a855f7',  done: false },
              { step: 5, title: 'Content Generation Agent',  desc: 'Create social posts, blogs, newsletters and emails',    path: '/caption-suite',     color: '#ec4899',  done: false },
              { step: 6, title: 'Creative Asset Agent',      desc: 'Generate banners, images and visual creatives',         path: '/products',          color: '#f59e0b',  done: false },
              { step: 7, title: 'Video Generation Agent',    desc: 'Produce video scripts, scenes and brand review',        path: '/video-gen',         color: '#ef4444',  done: false },
              { step: 8, title: 'Brand Governance Agent',    desc: 'Review all content for brand compliance',               path: '/brand-governance',  color: '#6366f1',  done: false },
              { step: 9, title: 'Analytics Agent',           desc: 'Monitor campaign results and performance metrics',      path: '/analytics',         color: '#14b8a6',  done: false },
              { step: 10, title: 'Executive Report',         desc: 'Full marketing performance summary and AI insights',    path: '/executive-report',  color: GOLD,       done: false },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: item.done ? `${item.color}08` : CARD,
                  border: `1px solid ${item.done ? item.color + '35' : BORDER}`,
                  borderRadius: 14, padding: '14px 18px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}50`; e.currentTarget.style.background = `${item.color}10` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = item.done ? `${item.color}35` : BORDER; e.currentTarget.style.background = item.done ? `${item.color}08` : CARD }}
              >
                {/* Step number */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: item.done ? item.color : `${item.color}15`, border: `2px solid ${item.done ? item.color : item.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.done
                    ? <CheckCircle2 size={16} color="#fff" />
                    : <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.step}</span>
                  }
                </div>

                {/* Connector line */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.done ? TEXT : TEXT, marginBottom: 2 }}>
                    {item.title}
                    {item.done && <span style={{ fontSize: 11, fontWeight: 600, color: item.color, marginLeft: 8, background: `${item.color}15`, padding: '2px 8px', borderRadius: 20 }}>Done</span>}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT3 }}>{item.desc}</div>
                </div>

                <ChevronRight size={16} color={TEXT3} style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ SECTION 5: Campaign History — returning users only ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ marginTop: 56, display: campaigns.length > 0 ? 'block' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`,
                borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 10,
              }}>
                <Clock size={11} /> CAMPAIGN HISTORY
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 4 }}>
                Your Campaigns
              </h2>
              <p style={{ fontSize: 13, color: TEXT2 }}>
                {campaigns.length === 0
                  ? 'No campaigns yet — launch one above to get started.'
                  : `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} generated · click View Results to reopen any.`}
              </p>
            </div>
            {campaigns.length > 5 && (
              <button
                onClick={() => setShowAllHistory(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {showAllHistory ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all ({campaigns.length})</>}
              </button>
            )}
          </div>

          {campaigns.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16 }}>
              <Clock size={34} style={{ color: TEXT3, marginBottom: 12 }} />
              <p style={{ color: TEXT2, fontSize: 14 }}>Your generated campaigns will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence>
                {displayedHistory.map((c, i) => {
                  const cm = TYPE_META[c.type] || TYPE_META.event
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${cm.color}40` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 13, background: `${cm.color}12`, border: `1px solid ${cm.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cm.color, flexShrink: 0 }}>
                        {cm.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{c.name}</span>
                          <span style={{ padding: '2px 9px', background: `${cm.color}12`, border: `1px solid ${cm.color}25`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: cm.color, letterSpacing: '0.05em' }}>
                            {cm.label.toUpperCase()}
                          </span>
                        </div>
                        {c.goal && (
                          <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                            🎯 {c.goal}
                          </p>
                        )}
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT3, flexShrink: 0 }}>
                        <Clock size={10} /> {timeAgo(c.date)}
                      </span>
                      <button
                        onClick={() => viewCampaign(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 9, color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                      >
                        <Eye size={12} /> View Results
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        title="Delete"
                        style={{ padding: '8px 10px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ═══ Back to Agents ═══ */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 26px', background: CARD,
              border: `1px solid ${GBORDER}`, borderRadius: 12,
              color: GOLD, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GDIM; e.currentTarget.style.borderColor = GOLD }}
            onMouseLeave={e => { e.currentTarget.style.background = CARD; e.currentTarget.style.borderColor = GBORDER }}
          >
            <ArrowLeft size={15} /> Back to Agents
          </button>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  )
}
