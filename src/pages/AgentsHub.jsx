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
  Share2,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils'
import { getOrCreateUser } from '../services/userService'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

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

/* ─── Recommended Actions based on user state ─── */
function getRecommendedActions(connectedCount, campaigns, tokenBalance) {
  const actions = []

  actions.push({
    priority: 0,
    icon: <BookOpen size={18} />,
    title: 'Set Up Brand Knowledge Base',
    desc: 'Your AI CMO needs to know your brand, goals and market before it can personalize any campaign.',
    color: GOLD,
    cta: 'Set Up Now',
    path: '/brand-kb',
    highlight: true,
  })

  if (connectedCount === 0) {
    actions.push({
      priority: 1,
      icon: <Link2 size={18} />,
      title: 'Connect Your Platforms',
      desc: 'Link LinkedIn, Meta & Gmail so your CMO can publish campaigns automatically.',
      color: '#10b981',
      cta: 'Connect Now',
      path: '/connect-accounts',
    })
  }

  if (campaigns.length === 0) {
    actions.push({
      priority: 2,
      icon: <Rocket size={18} />,
      title: 'Launch Your First Campaign',
      desc: 'Let EVOX CMO build a complete multi-channel marketing campaign for your brand.',
      color: GOLD,
      cta: 'Launch Campaign',
      path: '/campaign-hub',
    })
  } else {
    actions.push({
      priority: 2,
      icon: <BarChart2 size={18} />,
      title: 'Review Analytics Report',
      desc: 'Generate a performance report with KPIs, ROAS, and strategic recommendations.',
      color: '#f59e0b',
      cta: 'Generate Report',
      path: '/campaign/analytics_report',
    })
  }

  actions.push({
    priority: 3,
    icon: <Globe size={18} />,
    title: 'Build LinkedIn Presence',
    desc: 'Create a 30-day LinkedIn content calendar and professional post series.',
    color: '#0a66c2',
    cta: 'Start Strategy',
    path: '/campaign/content_calendar',
  })

  actions.push({
    priority: 4,
    icon: <Target size={18} />,
    title: 'Run Competitive Analysis',
    desc: 'Understand your market position with SWOT, competitor ads, and pricing intel.',
    color: '#a855f7',
    cta: 'Analyse Now',
    path: '/campaign/growth_strategy',
  })

  actions.push({
    priority: 5,
    icon: <Image size={18} />,
    title: 'Generate Product Visuals',
    desc: 'Turn one product image into lifestyle photos, 360° videos, and ad creatives.',
    color: '#ec4899',
    cta: 'Open Creative Studio',
    path: '/products',
  })

  actions.push({
    priority: 6,
    icon: <TrendingUp size={18} />,
    title: 'Analyse Current Trends',
    desc: 'Get trending hashtags, content ideas, and competitor intelligence for your industry.',
    color: '#ec4899',
    cta: 'View Trends',
    path: '/trends',
  })

  actions.push({
    priority: 7,
    icon: <Inbox size={18} />,
    title: 'Check Social Inbox',
    desc: 'View and reply to messages from LinkedIn, Instagram, Facebook, and WhatsApp.',
    color: '#25d366',
    cta: 'Open Inbox',
    path: '/inbox',
  })

  actions.push({
    priority: 8,
    icon: <FileText size={18} />,
    title: 'Generate Long-Form Content',
    desc: 'AI-powered blog articles, landing page copy, and newsletters — SEO-ready in seconds.',
    color: '#6366f1',
    cta: 'Open Content Gen',
    path: '/content-gen',
  })

  actions.push({
    priority: 9,
    icon: <Megaphone size={18} />,
    title: 'Copywriting Agent',
    desc: 'Create ad copy, taglines, brand voice, product names, and value propositions with AI.',
    color: '#ec4899',
    cta: 'Open Copywriting',
    path: '/copywriting',
  })

  actions.push({
    priority: 10,
    icon: <BarChart2 size={18} />,
    title: 'Executive Report',
    desc: 'Generate a board-ready executive marketing report with ROI, ROAS, and strategic recommendations.',
    color: GOLD,
    cta: 'Generate Report',
    path: '/executive-report',
    highlight: true,
  })

  return actions.slice(0, 4)
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
  const [activeTab,       setActiveTab]       = useState('overview')
  const [hasBrandKb,      setHasBrandKb]      = useState(false)

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
    getKnowledgeBase(user.uid).then(kb => setHasBrandKb(!!kb?.brandName)).catch(() => {})
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

  /* ── Marketing health score (computed) ── */
  const healthScore = Math.min(100, Math.round(
    (connectedCount / 11) * 40 +
    Math.min(campaigns.length * 5, 30) +
    ((tokenBalance ?? 0) > 0 ? 20 : 0) +
    10
  ))

  const recommendedActions = getRecommendedActions(connectedCount, campaigns, tokenBalance)

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

            {/* Getting Started Steps */}
            {(() => {
              const steps = [
                { n: 1, title: 'Set Up Brand Knowledge Base', desc: 'Tell your AI CMO about your brand, goals, and target audience so every campaign is on-brand.', cta: hasBrandKb ? 'Update' : 'Set Up Now', path: '/brand-kb', color: GOLD, icon: <BookOpen size={18}/>, done: hasBrandKb },
                { n: 2, title: 'Connect Your Platforms', desc: 'Link LinkedIn, Meta, Instagram, Gmail and more so your CMO can publish campaigns automatically.', cta: 'Connect Now', path: '/connect-accounts', color: '#10b981', icon: <Link2 size={18}/>, done: connectedCount > 0 },
                { n: 3, title: 'Launch Your First Campaign', desc: 'Pick a campaign type — Event, Product, Growth Strategy, Content Calendar — and let EVOX build it.', cta: 'Launch Campaign', path: '/campaign-hub', color: '#3b82f6', icon: <Rocket size={18}/>, done: campaigns.length > 0 },
                { n: 4, title: 'Review & Approve Content', desc: 'Check AI-generated content before it goes live. Edit, approve, or schedule from the queue.', cta: 'Open Queue', path: '/queue', color: '#a855f7', icon: <CheckCircle2 size={18}/>, done: false },
                { n: 5, title: 'Track Your Analytics', desc: 'Monitor campaign performance, KPIs, ROAS and audience insights in your analytics dashboard.', cta: 'View Analytics', path: '/analytics', color: '#06b6d4', icon: <BarChart2 size={18}/>, done: false },
              ]
              return (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
                    <Zap size={11}/> GETTING STARTED
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {steps.map((step) => (
                      <motion.div
                        key={step.n}
                        whileHover={{ x: 3 }}
                        onClick={() => navigate(step.path)}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: step.done ? 'rgba(16,185,129,0.04)' : CARD, border: `1px solid ${step.done ? 'rgba(16,185,129,0.2)' : BORDER}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { if (!step.done) { e.currentTarget.style.borderColor = step.color + '50'; e.currentTarget.style.background = step.color + '08' } }}
                        onMouseLeave={e => { if (!step.done) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD } }}
                      >
                        {/* Step number / done check */}
                        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.done ? 'rgba(16,185,129,0.15)' : step.color + '15', border: `2px solid ${step.done ? '#10b981' : step.color + '40'}`, color: step.done ? '#10b981' : step.color, fontSize: 13, fontWeight: 900 }}>
                          {step.done ? <CheckCircle2 size={16}/> : step.n}
                        </div>
                        {/* Icon */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: step.color + '12', border: `1px solid ${step.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.done ? '#10b981' : step.color }}>
                          {step.icon}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: step.done ? TEXT2 : TEXT, marginBottom: 2, textDecoration: step.done ? 'line-through' : 'none' }}>{step.title}</div>
                          <div style={{ fontSize: 12, color: TEXT3, lineHeight: 1.5 }}>{step.desc}</div>
                        </div>
                        {/* CTA */}
                        {!step.done && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: step.color, flexShrink: 0 }}>
                            {step.cta} <ChevronRight size={13}/>
                          </div>
                        )}
                        {step.done && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>Done ✓</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* KPI Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
              {[
                { label: 'Marketing Health Score', value: `${healthScore}/100`, sub: healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs setup', color: healthScore >= 80 ? '#10b981' : healthScore >= 50 ? GOLD : '#ef4444', icon: <Activity size={16}/> },
                { label: 'Campaigns Generated', value: campaigns.length.toString(), sub: campaigns.length > 0 ? 'campaigns launched' : 'Launch your first', color: GOLD, icon: <Rocket size={16}/> },
                { label: 'Platforms Connected', value: `${connectedCount}/11`, sub: connectedCount > 0 ? 'platforms active' : 'None connected yet', color: connectedCount > 5 ? '#10b981' : connectedCount > 0 ? GOLD : '#64748b', icon: <Link2 size={16}/> },
                { label: 'Campaign Tokens', value: tokenBalance !== null ? `${tokenBalance}` : '—', sub: (tokenBalance ?? 0) > 0 ? 'available to use' : 'Top up to continue', color: (tokenBalance ?? 0) > 0 ? '#10b981' : '#ef4444', icon: <Coins size={16}/> },
              ].map((metric, i) => (
                <motion.div key={metric.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{metric.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${metric.color}12`, border: `1px solid ${metric.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: metric.color }}>{metric.icon}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: metric.color, marginBottom: 4 }}>{metric.value}</div>
                  <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>{metric.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Recommended Actions */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 14 }}>
              <Sparkles size={11}/> RECOMMENDED FOR YOU
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {recommendedActions.map((action, i) => (
                <motion.div key={i} whileHover={{ y: -2, boxShadow: `0 8px 24px ${action.color}18` }} onClick={() => navigate(action.path)} style={{ background: CARD, border: `1px solid ${action.highlight ? action.color + '50' : BORDER}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                  {action.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${action.color}, ${action.color}80)` }} />}
                  <div style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 12, background: `${action.color}18`, border: `1px solid ${action.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>{action.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55, marginBottom: 14 }}>{action.desc}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: action.color }}>{action.cta} <ChevronRight size={13}/></div>
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
                  : <button key={t.label} onClick={() => navigate(t.path)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: `${t.color}10`, border: `1px solid ${t.color}30`, borderRadius: 10, color: t.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.label}</button>
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
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14 }}>How tokens work</div>
                {['Each campaign generation uses 1 token', 'Image generation uses 1–3 tokens per image', 'Video generation uses 5–10 tokens per video', 'Unused tokens roll over each month'].map((line, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT2 }}>{line}</span>
                  </div>
                ))}
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
