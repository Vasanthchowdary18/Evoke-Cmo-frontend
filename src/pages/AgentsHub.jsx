import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Zap, TrendingUp, Target, BarChart2, Brain,
  Rocket, Globe, Mail, Users, PieChart, Film,
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
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'

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

/* Personalised agent suggestions based on brand KB — shared with BrandKnowledgeBase.jsx */

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
  const [activeTab,       setActiveTab]       = useState('overview')
  const [hasBrandKb,      setHasBrandKb]      = useState(false)
  const [kb,              setKb]              = useState(null)
  const [upgradeFor,      setUpgradeFor]      = useState(null)
  const { plan: userPlan } = useUserPlan()


  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
    setCampaigns(stored)
  }, [])

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
    localStorage.setItem('evoke_campaigns', JSON.stringify(updated))
  }

  const displayedHistory = showAllHistory ? campaigns : campaigns.slice(0, 5)

  const handleResetAccount = async () => {
    if (!user) return
    const confirmed = window.confirm('Reset your account to new user state?\n\nThis will clear:\n• Onboarding data\n• Brand Knowledge Base\n• Social account connections\n• Campaign history (local)\n\nThis cannot be undone.')
    if (!confirmed) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingComplete: false,
        onboardingData: deleteField(),
        knowledgeBase: deleteField(),
        socialAccounts: {
          facebook:  { connected: false, pageId: '', pageAccessToken: '', pageName: '' },
          instagram: { connected: false, businessAccountId: '', pageName: '' },
          linkedin:  { connected: false, personUrn: '', accessToken: '', name: '' },
          twitter:   { connected: false, accessToken: '', username: '', userId: '' },
          whatsapp:  { connected: false, phoneNumberId: '', accessToken: '' },
          gmail:     { connected: false, email: '' },
        },
      })
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    } catch (err) {
      alert('Reset failed: ' + err.message)
    }
  }

  /* ── Marketing health score — same formula as MarketingHealthPage ── */
  // Profile(20) + BrandKB(20) + Social(20) + Campaigns(20) + Analytics(20)
  const profileScore  = 20 // if they're logged in, onboarding is done
  const kbScore       = hasBrandKb ? 20 : 0
  const socialScore   = Math.min(Math.round((connectedCount / 6) * 20), 20)
  const campaignScore = campaigns.length > 0 ? 20 : 0
  const healthScore   = Math.min(100, profileScore + kbScore + socialScore + campaignScore)

  const recommendedActions = getRecommendedActions(connectedCount, campaigns, tokenBalance, kb)

  // If a recommendation needs a higher plan than the user has, prompt an upgrade
  // instead of navigating straight into a feature they can't use yet.
  const goToRecommendation = (action) => {
    const required = action.planRequired || 'free'
    if (PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(required)) {
      setUpgradeFor({ requiredPlan: required, featureTitle: action.title })
      return
    }
    // Campaign forms auto-fill from the Brand Knowledge Base instead of opening blank.
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

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            EVOX CMO · Status: Active
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6, fontFamily: "'Syne','Inter',sans-serif" }}>
            {getGreeting()}{userName ? ', ' : ''}{userName ? <span style={goldGrad}>{userName}</span> : ''}
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.65 }}>
            Your AI Marketing Department is active and ready.{' '}
            {campaigns.length > 0 ? `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} generated so far.` : 'Complete the steps below to get started.'}
          </p>
        </motion.div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 4, padding: '5px', background: '#151310', border: `1px solid ${BORDER}`, borderRadius: 14, width: 'fit-content' }}>
            {[
              { key: 'overview',   label: 'Overview',   icon: <LayoutDashboard size={14}/> },
              { key: 'campaigns',  label: 'Campaigns',  icon: <Rocket size={14}/> },
              { key: 'agents',     label: 'Agents',     icon: <Bot size={14}/> },
              { key: 'analytics',  label: 'Analytics',  icon: <BarChart2 size={14}/> },
              { key: 'credits',    label: 'Credits',    icon: <Coins size={14}/> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: activeTab === tab.key ? CARD : 'transparent',
                  border: activeTab === tab.key ? `1px solid ${GBORDER}` : '1px solid transparent',
                  borderRadius: 10,
                  color: activeTab === tab.key ? GOLD : TEXT2,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            {/* Marketing Health Score — pinned at the top so it's the first thing users see */}
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
                { label: 'Brand KB',   score: kbScore,       max: 20, color: '#f59e0b' },
                { label: 'Social',     score: socialScore,   max: 20, color: '#3b82f6' },
                { label: 'Campaigns',  score: campaignScore, max: 20, color: '#10b981' },
              ]

              return (
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/health-score')}
                  style={{
                    marginBottom: 32, padding: '26px 28px', cursor: 'pointer',
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

            {/* Recommended For You — ranked agent/campaign suggestions from brand KB + health score gaps */}
            {recommendedActions.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
                  <Sparkles size={11}/> RECOMMENDED FOR YOU
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
              </div>
            )}

            {upgradeFor && (
              <UpgradeModal
                requiredPlan={upgradeFor.requiredPlan}
                featureTitle={upgradeFor.featureTitle}
                onClose={() => setUpgradeFor(null)}
              />
            )}

            {/* KPI Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
              {[
                { label: 'Campaigns Generated', value: campaigns.length.toString(), sub: campaigns.length > 0 ? 'campaigns launched' : 'Launch your first', color: GOLD, icon: <Rocket size={16}/> },
                { label: 'Platforms Connected', value: `${connectedCount}/11`, sub: connectedCount > 0 ? 'platforms active' : 'None connected yet', color: connectedCount > 5 ? '#10b981' : connectedCount > 0 ? GOLD : '#64748b', icon: <Link2 size={16}/> },
              ].map((metric, i) => (
                <motion.div key={metric.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} onClick={() => metric.path && navigate(metric.path)} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px', cursor: metric.path ? 'pointer' : 'default', transition: 'border-color 0.2s' }} onMouseEnter={e => { if (metric.path) e.currentTarget.style.borderColor = metric.color + '50' }} onMouseLeave={e => { if (metric.path) e.currentTarget.style.borderColor = BORDER }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{metric.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${metric.color}12`, border: `1px solid ${metric.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: metric.color }}>{metric.icon}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: metric.color, marginBottom: 4 }}>{metric.value}</div>
                  <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>{metric.sub}</div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}

        {/* ═══ CAMPAIGNS TAB ═══ */}
        {activeTab === 'campaigns' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 10 }}>
                  <Clock size={11}/> CAMPAIGNS
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 4 }}>Your Campaigns</h2>
                <p style={{ fontSize: 13, color: TEXT2 }}>
                  {campaigns.length === 0 ? 'No campaigns yet — create your first one.' : `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} generated · click View Results to reopen any.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/campaign-hub')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Rocket size={14}/> New Campaign
              </button>
            </div>
            {campaigns.length > 5 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setShowAllHistory(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {showAllHistory ? <><ChevronUp size={14}/> Show less</> : <><ChevronDown size={14}/> Show all ({campaigns.length})</>}
                </button>
              </div>
            )}
            {campaigns.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16 }}>
                <Rocket size={36} style={{ color: TEXT3, marginBottom: 16 }} />
                <p style={{ color: TEXT2, fontSize: 15, marginBottom: 8, fontWeight: 600 }}>No campaigns yet</p>
                <p style={{ color: TEXT3, fontSize: 13, marginBottom: 24 }}>Launch your first campaign to get started.</p>
                <button onClick={() => navigate('/campaign-hub')} style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Launch First Campaign
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence>
                  {displayedHistory.map((c, i) => {
                    const cm = TYPE_META[c.type] || TYPE_META.event
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = `${cm.color}40` }} onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}>
                        <div style={{ width: 46, height: 46, borderRadius: 13, background: `${cm.color}12`, border: `1px solid ${cm.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cm.color, flexShrink: 0 }}>{cm.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{c.name}</span>
                            <span style={{ padding: '2px 9px', background: `${cm.color}12`, border: `1px solid ${cm.color}25`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: cm.color, letterSpacing: '0.05em' }}>{cm.label.toUpperCase()}</span>
                          </div>
                          {c.goal && <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>🎯 {c.goal}</p>}
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT3, flexShrink: 0 }}><Clock size={10}/> {timeAgo(c.date)}</span>
                        <button onClick={() => viewCampaign(c)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 9, color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                          <Eye size={12}/> View Results
                        </button>
                        <button onClick={() => deleteCampaign(c.id)} title="Delete" style={{ padding: '8px 10px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444' }} onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3 }}>
                          <Trash2 size={13}/>
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ AGENTS TAB ═══ */}
        {activeTab === 'agents' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 20 }}>
              <Bot size={11}/> AI AGENTS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 40 }}>
              {[
                { label: 'Marketing Strategy Agent', badge: 'STRATEGY', color: '#c8973e', icon: <TrendingUp size={20}/>, points: ['Annual / Quarterly / Monthly Plans', 'Budget recommendations per channel'], route: '/strategy' },
                { label: 'Campaign Planning Agent', badge: 'CAMPAIGNS', color: '#3b82f6', icon: <Target size={20}/>, points: ['Campaign brief + timeline', 'Growth / Content / Product types'], route: '/campaign-hub' },
                { label: 'Audience Intelligence', badge: 'AUDIENCE', color: '#a855f7', icon: <Users size={20}/>, points: ['Segmentation + lookalike builder', 'Trend analysis + CRM data'], route: '/audience-builder' },
                { label: 'Content Generation Agent', badge: 'CONTENT', color: '#10b981', icon: <FileText size={20}/>, points: ['Captions, blogs, reel scripts', 'Brand voice matching'], route: '/content-gen' },
                { label: 'Creative Asset Agent', badge: 'CREATIVE', color: '#ec4899', icon: <Camera size={20}/>, points: ['Images: Angles · 360 · 3D · SEO', 'AI Banners + Product Renders'], route: '/products' },
                { label: 'Video Generation Agent', badge: 'VIDEO', color: '#ef4444', icon: <Film size={20}/>, points: ['Promo · Product · Reel · Ad · Event', 'Script + Visual + Audio'], route: '/video-gen' },
                { label: 'Brand Governance Agent', badge: 'GOVERNANCE', color: '#06b6d4', icon: <Shield size={20}/>, points: ['Brand standards enforcement', 'Approved / Flagged / Rejected routing'], route: '/brand-governance' },
                { label: 'Marketing Execution Agent', badge: 'EXECUTION', color: '#84cc16', icon: <Share2 size={20}/>, points: ['7-channel: Meta · LinkedIn · TikTok · Google', 'Email · SMS · Marketplace'], route: '/execution' },
              ].map((agent, i) => (
                <motion.div key={agent.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(agent.route)}
                  style={{ background: '#141210', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = agent.color + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${agent.color}14` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ padding: '16px 18px', borderBottom: `1px solid ${agent.color}18`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${agent.color}18`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.color, flexShrink: 0 }}>{agent.icon}</div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: agent.color, letterSpacing: '0.07em', marginBottom: 2 }}>{agent.badge}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{agent.label}</div>
                    </div>
                  </div>
                  <div style={{ padding: '14px 18px 18px' }}>
                    {agent.points.map((pt, pi) => (
                      <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: pi < agent.points.length - 1 ? 8 : 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: agent.color, flexShrink: 0, marginTop: 6 }} />
                        <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{pt}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4, color: agent.color, fontSize: 11, fontWeight: 700 }}>
                      Launch agent <ChevronRight size={12}/>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tools row */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 14 }}>
              <Zap size={11}/> TOOLS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Connect Platforms', icon: <Link2 size={13}/>, color: '#10b981', path: '/connect-accounts' },
                { label: 'Trends', icon: <TrendingUp size={13}/>, color: '#ec4899', path: '/trends' },
                { label: 'Social Inbox', icon: <Inbox size={13}/>, color: '#25d366', path: '/inbox' },
                { label: 'Approval Queue', icon: <CheckCircle2 size={13}/>, color: '#f59e0b', path: '/queue' },
                { label: 'Copywriting', icon: <FileText size={13}/>, color: '#8b5cf6', path: '/copywriting' },
                { label: 'Executive Report', icon: <BarChart2 size={13}/>, color: GOLD, path: '/executive-report' },
                { label: 'Brand KB', icon: <BookOpen size={13}/>, color: '#06b6d4', path: '/brand-kb' },
                { label: 'Team', icon: <Users size={13}/>, color: '#6366f1', path: '/team' },
                { label: 'Partners', icon: <Share2 size={13}/>, color: '#14b8a6', path: '/partner-sharing' },
                { label: 'Video Gen', icon: <Film size={13}/>, color: '#ef4444', path: '/video-gen' },
                { label: 'KPI Report', icon: <Activity size={13}/>, color: '#f97316', path: '/kpi-recommendations' },
                { label: 'Gap Analysis', icon: <Download size={13}/>, color: '#6366f1', path: '/EVOX-CMO-Gap-Analysis.docx', download: true },
              ].map(t => (
                t.download
                  ? <a key={t.label} href={t.path} download style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: `${t.color}10`, border: `1px solid ${t.color}30`, borderRadius: 10, color: t.color, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}>{t.icon} {t.label}</a>
                  : <button key={t.label} onClick={() => navigate(t.path, t.path === '/brand-kb' ? { state: { edit: true } } : undefined)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: `${t.color}10`, border: `1px solid ${t.color}30`, borderRadius: 10, color: t.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Analytics Dashboard', desc: 'Full KPI overview — ROAS, reach, conversions, and channel breakdown.', color: '#06b6d4', icon: <BarChart2 size={22}/>, path: '/analytics' },
                { label: 'Executive Report', desc: 'Board-ready summary with ROI, strategic recommendations and next steps.', color: GOLD, icon: <TrendingUp size={22}/>, path: '/executive-report' },
                { label: 'KPI Recommendations', desc: 'AI-powered KPI targets based on your industry and campaign goals.', color: '#f97316', icon: <Activity size={22}/>, path: '/kpi-recommendations' },
                { label: 'CRM & Lifecycle', desc: 'Customer journey, lifecycle stages, and retention pipeline view.', color: '#10b981', icon: <Users size={22}/>, path: '/crm' },
              ].map((item, i) => (
                <motion.div key={item.label} whileHover={{ y: -3, boxShadow: `0 12px 32px ${item.color}18` }} onClick={() => navigate(item.path)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 22px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + '50' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: `${item.color}14`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: item.color }}>Open <ChevronRight size={13}/></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ CREDITS TAB ═══ */}
        {activeTab === 'credits' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div style={{ maxWidth: 520 }}>
              <div style={{ background: CARD, border: `1px solid ${GBORDER}`, borderRadius: 20, padding: '32px 28px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', marginBottom: 8 }}>CAMPAIGN TOKENS</div>
                    <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: (tokenBalance ?? 0) > 0 ? GOLD : '#ef4444' }}>
                      {tokenBalance !== null ? tokenBalance : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>{(tokenBalance ?? 0) > 0 ? 'tokens available' : 'No tokens remaining'}</div>
                  </div>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: `${GOLD}14`, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={28} color={GOLD}/>
                  </div>
                </div>
                <button onClick={() => navigate('/purchase')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Top Up Tokens
                </button>
              </div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14 }}>How tokens work</div>
                {['Each campaign generation uses 1 token', 'Image generation uses 1–3 tokens per image', 'Video generation uses 5–10 tokens per video', 'Unused tokens roll over each month'].map((line, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT2 }}>{line}</span>
                  </div>
                ))}
              </div>

              {/* ── Dev: Reset to new user ── */}
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(239,68,68,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Dev Testing</div>
                <div style={{ fontSize: 12, color: TEXT3, marginBottom: 14, lineHeight: 1.6 }}>
                  Reset your account to a brand new user state — clears onboarding, brand KB, social connections and campaign history.
                </div>
                <button
                  onClick={handleResetAccount}
                  style={{
                    padding: '10px 20px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.35)', borderRadius: 9,
                    color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'opacity .18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '.75' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Reset to New User
                </button>
              </div>

              {/* ── Dev: Plan switcher ── */}
              <div style={{ background: 'rgba(200,151,62,0.05)', border: '1px solid rgba(200,151,62,0.18)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(200,151,62,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Dev · Switch Plan</div>
                <div style={{ fontSize: 12, color: TEXT3, marginBottom: 14, lineHeight: 1.6 }}>
                  Simulate a different subscription plan to test locked/unlocked features.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { key: 'free',      label: 'Free',      color: '#10b981' },
                    { key: 'package-a', label: 'Pkg A',     color: '#3b82f6' },
                    { key: 'package-b', label: 'Pkg B',     color: '#c8973e' },
                    { key: 'package-c', label: 'Pkg C',     color: '#a855f7' },
                  ].map(p => (
                    <button key={p.key} onClick={async () => {
                      if (!user) return
                      await updateDoc(doc(db, 'users', user.uid), { userPlan: p.key })
                      window.location.reload()
                    }} style={{
                      padding: '8px 16px', background: p.color + '15',
                      border: `1px solid ${p.color}40`, borderRadius: 8,
                      color: p.color, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .18s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '.75' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
