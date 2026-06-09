import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Zap, TrendingUp, Target, BarChart2, Brain,
  Rocket, Globe, Mail, Users, PieChart, Image, Film,
  Calendar, Package, Search, FileText, Megaphone, Activity,
  CheckCircle2, AlertCircle, Play, Sparkles, ChevronRight,
  Link2, Coins, Bot, LayoutDashboard, Camera,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'
import { redirectToLogin } from '../lib/authUtils'
import { getOrCreateUser } from '../services/userService'

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

/* ─── Agent Org Chart data ─── */
const AGENT_STATUSES = [
  { id: 'cmo_director',   status: 'active',  text: 'Orchestrating strategy...' },
  { id: 'strategy',       status: 'active',  text: 'Building roadmap...' },
  { id: 'content_seo',    status: 'running', text: 'Building 30-day plan...' },
  { id: 'visual',         status: 'active',  text: 'Generating visuals...' },
  { id: 'ads',            status: 'idle',    text: 'Ready to deploy' },
  { id: 'social',         status: 'running', text: 'Scheduling posts...' },
  { id: 'seo_sub',        status: 'idle',    text: 'Ready' },
  { id: 'content_sub',    status: 'running', text: 'Drafting blog post...' },
  { id: 'image_gen',      status: 'active',  text: 'Processing images...' },
  { id: 'video_360',      status: 'idle',    text: 'Ready' },
  { id: 'analytics',      status: 'running', text: 'Analysing performance...' },
]

const STATUS_COLORS = {
  active:  { dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'ACTIVE'  },
  running: { dot: GOLD,      bg: GDIM,                     border: GBORDER,                  label: 'RUNNING' },
  idle:    { dot: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)',  label: 'IDLE'    },
}

function getStatus(id) {
  return AGENT_STATUSES.find(a => a.id === id) || { status: 'idle', text: 'Ready' }
}

/* ─── Recommended Actions based on user state ─── */
function getRecommendedActions(connectedCount, campaigns, tokenBalance) {
  const actions = []

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
      path: '/cmo',
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

  return actions.slice(0, 4)
}

/* ─── Org Chart node component ─── */
function AgentNode({ id, title, role, model, color, onClick, compact = false }) {
  const { status, text } = getStatus(id)
  const sc = STATUS_COLORS[status]

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 24px ${color}20` }}
      onClick={onClick}
      style={{
        background: CARD,
        border: `1px solid ${status === 'idle' ? BORDER : sc.border}`,
        borderRadius: compact ? 10 : 14,
        padding: compact ? '10px 14px' : '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: compact ? 130 : 160,
        position: 'relative',
      }}
    >
      {/* Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0,
          boxShadow: status !== 'idle' ? `0 0 6px ${sc.dot}` : 'none',
          animation: status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: sc.dot, letterSpacing: '0.06em' }}>
          {sc.label}
        </span>
      </div>

      <div style={{ fontSize: compact ? 11 : 12, fontWeight: 800, color: TEXT, marginBottom: 2, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
        {title}
      </div>
      {!compact && (
        <>
          <div style={{ fontSize: 10, color: TEXT3, marginBottom: 4 }}>{role}</div>
          <div style={{
            fontSize: 9, color: sc.dot, fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {text}
          </div>
        </>
      )}
      {compact && (
        <div style={{ fontSize: 9, color: TEXT3, marginTop: 1 }}>{model}</div>
      )}
    </motion.div>
  )
}

/* ─── Vertical connector line ─── */
const VLine = ({ height = 24 }) => (
  <div style={{ width: 1, height, background: `${GOLD}30`, margin: '0 auto' }} />
)

/* ─── Horizontal connector spans ─── */
function HConnector({ count }) {
  if (count <= 1) return <VLine />
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 1, height: 20, background: `${GOLD}30`, margin: '0 auto' }} />
    </div>
  )
}

export default function AgentsHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showOnboarding,  setShowOnboarding]  = useState(false)
  const [pendingHref,     setPendingHref]     = useState(null)
  const [campaigns,       setCampaigns]       = useState([])
  const [connectedCount,  setConnectedCount]  = useState(0)
  const [tokenBalance,    setTokenBalance]    = useState(null)
  const [userName,        setUserName]        = useState('')
  const [objective,       setObjective]       = useState('')
  const [budget,          setBudget]          = useState('')
  const [deadline,        setDeadline]        = useState('')

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
      if (!data.onboardingComplete) setShowOnboarding(true)
    }).catch(() => {})
  }, [user])

  const handleLaunchCMO = async () => {
    if (!user) { redirectToLogin(); return }
    try {
      const data = await getOrCreateUser(user.uid, user.displayName, user.email)
      if (!data.onboardingComplete) {
        setPendingHref('/cmo')
        setShowOnboarding(true)
      } else {
        navigate('/cmo')
      }
    } catch {
      navigate('/cmo')
    }
  }

  const handleLaunchObjective = async () => {
    if (!user) { redirectToLogin(); return }
    try {
      const data = await getOrCreateUser(user.uid, user.displayName, user.email)
      if (!data.onboardingComplete) {
        setPendingHref('/cmo')
        setShowOnboarding(true)
      } else {
        navigate('/cmo')
      }
    } catch {
      navigate('/cmo')
    }
  }

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
    { id: 'strategy',    title: 'Strategy Agent',       role: 'Growth & Market Planning',   model: 'Claude Sonnet', color: '#10b981', path: '/campaign/growth_strategy' },
    { id: 'content_seo', title: 'Content & SEO Agent',  role: 'Blog, Copy & Keywords',      model: 'Claude Sonnet', color: '#3b82f6', path: '/campaign/content_calendar' },
    { id: 'visual',      title: 'Visual Creative Agent', role: 'Images, Videos & Ads',      model: 'DALL-E 3 / Stability AI', color: '#a855f7', path: '/products' },
  ]
  const level2 = {
    strategy:    [
      { id: 'ads',      title: 'Ads & Paid Agent',      role: 'Google & Meta Campaigns',    model: 'GPT-4o/Claude',   color: '#f59e0b', path: '/campaign/brand' },
      { id: 'social',   title: 'Social Media Agent',    role: 'Content Calendar & Posts',   model: 'Claude Haiku',    color: '#ec4899', path: '/campaign/content_calendar' },
    ],
    content_seo: [
      { id: 'seo_sub',      title: 'SEO Sub-Agent',     role: 'Keywords & On-Page',         model: 'Claude + web',    color: '#14b8a6', path: '/campaign/seo_blog' },
      { id: 'content_sub',  title: 'Content Sub-Agent', role: 'Blog & Landing Pages',       model: 'Claude Sonnet',   color: '#6366f1', path: '/campaign/seo_blog' },
    ],
    visual: [
      { id: 'image_gen', title: 'Image Gen Agent',      role: 'Product & Lifestyle Photos', model: 'DALL-E 3 / Replicate', color: '#ec4899', path: '/products' },
      { id: 'video_360', title: 'Video/360 Agent',      role: 'Lifestyle & 360° Videos',    model: 'Runway ML / Luma AI',  color: '#f97316', path: '/products' },
    ],
  }
  const analyticsAgent = { id: 'analytics', title: 'Analytics & Reporting', role: 'KPIs, ROAS & Insights', model: 'Claude + data tools', color: '#8b5cf6', path: '/campaign/analytics_report' }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>

      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={() => {
            setShowOnboarding(false)
            if (pendingHref) navigate(pendingHref)
          }}
        />
      )}

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
            </div>
          </div>
        </motion.div>

        {/* ═══ SECTION 2: KPI Metrics Row ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: 'grid',
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

        {/* ═══ SECTION 3: Launch Marketing Objective ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, #1e1a0f, #1c1810)',
            border: `1px solid ${GBORDER}`,
            borderRadius: 20, padding: '28px 28px',
            marginBottom: 40,
            boxShadow: '0 0 40px rgba(200,151,62,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #d4a853, #b8803a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={22} color="#0e0c09" fill="#0e0c09" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 4 }}>
                Launch Marketing Objective
              </h2>
              <p style={{ fontSize: 13, color: TEXT2, maxWidth: 520, lineHeight: 1.6 }}>
                Tell EVOX CMO what you want to achieve. Your AI department will build the strategy, create assets, and deploy campaigns automatically.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            {/* Goal */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Campaign Goal
              </label>
              <input
                type="text"
                placeholder="e.g. Sell 100 event tickets"
                value={objective}
                onChange={e => setObjective(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px',
                  background: BG, border: `1px solid rgba(200,151,62,0.2)`,
                  borderRadius: 10, color: TEXT, fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = 'rgba(200,151,62,0.2)'}
              />
            </div>

            {/* Budget */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Budget
              </label>
              <input
                type="text"
                placeholder="e.g. $2,500"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px',
                  background: BG, border: `1px solid rgba(200,151,62,0.2)`,
                  borderRadius: 10, color: TEXT, fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = 'rgba(200,151,62,0.2)'}
              />
            </div>

            {/* Deadline */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Deadline
              </label>
              <input
                type="text"
                placeholder="e.g. 30 days"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px',
                  background: BG, border: `1px solid rgba(200,151,62,0.2)`,
                  borderRadius: 10, color: TEXT, fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = 'rgba(200,151,62,0.2)'}
              />
            </div>
          </div>

          <button
            onClick={handleLaunchObjective}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #d4a853, #b8803a)',
              border: 'none', borderRadius: 12,
              color: '#0e0c09', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              transition: 'all 0.2s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,151,62,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            <Zap size={17} fill="#0e0c09" />
            Launch with EVOX CMO
            <ArrowRight size={17} />
          </button>

          <p style={{ marginTop: 12, fontSize: 11, color: TEXT3, lineHeight: 1.6 }}>
            EVOX CMO will build strategy → create assets → deploy campaigns → monitor performance
          </p>
        </motion.div>

        {/* ═══ SECTION 4: Recommended Actions ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{ marginBottom: 48 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`,
              borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em',
            }}>
              <Sparkles size={11} /> RECOMMENDED ACTIONS
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 14,
          }}>
            {recommendedActions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.07 }}
                whileHover={{ y: -3 }}
                onClick={() => user ? navigate(action.path) : redirectToLogin()}
                style={{
                  background: CARD, border: `1px solid ${action.color}22`,
                  borderRadius: 16, padding: '18px 20px', cursor: 'pointer',
                  transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${action.color}60, transparent)`,
                }} />

                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${action.color}12`, border: `1px solid ${action.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: action.color, marginBottom: 14,
                }}>
                  {action.icon}
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, letterSpacing: '-0.01em', marginBottom: 6 }}>
                  {action.title}
                </div>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 14 }}>
                  {action.desc}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 700, color: action.color,
                }}>
                  {action.cta} <ChevronRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ SECTION 5: Agent Workforce Org Chart ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginBottom: 48 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`,
                borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 12,
              }}>
                <Bot size={11} /> AGENT WORKFORCE
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 6 }}>
                Your AI Marketing Department
              </h2>
              <p style={{ fontSize: 13, color: TEXT2, maxWidth: 560 }}>
                9 specialised AI agents working together under the EVOX CMO Director. Click any agent to activate it.
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '10px 16px', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 12, fontSize: 11, fontWeight: 700,
            }}>
              {Object.entries(STATUS_COLORS).map(([key, sc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                  <span style={{ color: TEXT3 }}>{sc.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Org chart container */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 20, padding: '32px 24px',
            overflowX: 'auto',
          }}>
            {/* Level 0: CMO Director */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
              <motion.div
                whileHover={{ boxShadow: `0 12px 36px ${GOLD}25` }}
                onClick={handleLaunchCMO}
                style={{
                  background: 'linear-gradient(135deg, #221d10, #1e190e)',
                  border: `1px solid ${GBORDER}`,
                  borderRadius: 16, padding: '16px 28px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'center', minWidth: 220,
                  boxShadow: `0 0 30px ${GOLD}12`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.06em' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', marginBottom: 3 }}>
                  EVOX CMO Director
                </div>
                <div style={{ fontSize: 11, color: TEXT3, marginBottom: 6 }}>Orchestrates · Holds context · Manages state</div>
                <div style={{ fontSize: 10, color: GOLD, fontStyle: 'italic' }}>
                  {getStatus('cmo_director').text}
                </div>
              </motion.div>
            </div>

            {/* Connector: root → L1 */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 1, height: 24, background: `${GOLD}30` }} />
            </div>

            {/* Horizontal bar across L1 */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
              <div style={{
                position: 'absolute', top: 0, left: '16.66%', right: '16.66%',
                height: 1, background: `${GOLD}30`,
              }} />
              {/* Vertical lines down to L1 nodes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, width: '100%', maxWidth: 820 }}>
                {level1.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 1, height: 20, background: `${GOLD}30` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Level 1 nodes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, maxWidth: 820, margin: '0 auto', marginBottom: 0 }}>
              {level1.map(agent => (
                <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <AgentNode
                    id={agent.id}
                    title={agent.title}
                    role={agent.role}
                    model={agent.model}
                    color={agent.color}
                    onClick={() => user ? navigate(agent.path) : redirectToLogin()}
                  />
                  {/* Connector to L2 */}
                  <div style={{ width: 1, height: 20, background: `${GOLD}30` }} />
                </div>
              ))}
            </div>

            {/* Horizontal bars and Level 2 nodes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, maxWidth: 820, margin: '0 auto' }}>
              {level1.map(l1agent => {
                const children = level2[l1agent.id] || []
                return (
                  <div key={l1agent.id} style={{ position: 'relative' }}>
                    {/* Horizontal connector across children */}
                    {children.length > 1 && (
                      <div style={{
                        position: 'absolute', top: 0, left: '25%', right: '25%',
                        height: 1, background: `${GOLD}30`,
                      }} />
                    )}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: children.length > 1 ? '1fr 1fr' : '1fr',
                      gap: 8,
                    }}>
                      {children.map(child => (
                        <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <AgentNode
                            id={child.id}
                            title={child.title}
                            role={child.role}
                            model={child.model}
                            color={child.color}
                            compact
                            onClick={() => user ? navigate(child.path) : redirectToLogin()}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Analytics agent (bottom, under Strategy) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, maxWidth: 820, margin: '0 auto', marginTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 1, height: 16, background: `${GOLD}30` }} />
                <AgentNode
                  id={analyticsAgent.id}
                  title={analyticsAgent.title}
                  role={analyticsAgent.role}
                  model={analyticsAgent.model}
                  color={analyticsAgent.color}
                  compact
                  onClick={() => user ? navigate(analyticsAgent.path) : redirectToLogin()}
                />
              </div>
              <div />
              <div />
            </div>
          </div>
        </motion.div>

        {/* ═══ SECTION 6: Quick Access to All Campaign Agents ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`,
                borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 10,
              }}>
                <LayoutDashboard size={11} /> CAMPAIGN STUDIO
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: TEXT, marginBottom: 4 }}>
                Full Campaign Dashboard
              </h2>
              <p style={{ fontSize: 13, color: TEXT2 }}>All 17 AI agents, tools and campaign types in one place.</p>
            </div>
            <button
              onClick={handleLaunchCMO}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #d4a853, #b8803a)',
                border: 'none', borderRadius: 12,
                color: '#0e0c09', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,151,62,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              Open Campaign Dashboard <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick launch grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { title: 'Events',          color: GOLD,      icon: <Calendar size={16} />,   path: '/campaign/event' },
              { title: 'Products',        color: '#a855f7', icon: <Package size={16} />,    path: '/campaign/product' },
              { title: 'Brand Strategy',  color: '#6366f1', icon: <Zap size={16} />,        path: '/campaign/brand' },
              { title: 'Growth Strategy', color: '#10b981', icon: <Rocket size={16} />,     path: '/campaign/growth_strategy' },
              { title: 'Content Calendar',color: '#3b82f6', icon: <Calendar size={16} />,   path: '/campaign/content_calendar' },
              { title: 'SEO & Blog',      color: '#14b8a6', icon: <Globe size={16} />,      path: '/campaign/seo_blog' },
              { title: 'Email Drip',      color: '#f59e0b', icon: <Mail size={16} />,       path: '/campaign/email_drip' },
              { title: 'Influencer & PR', color: '#ec4899', icon: <Users size={16} />,      path: '/campaign/influencer' },
              { title: 'Analytics Report',color: '#8b5cf6', icon: <PieChart size={16} />,   path: '/campaign/analytics_report' },
              { title: 'Product Images',  color: '#06b6d4', icon: <Camera size={16} />,     path: '/products' },
              { title: '360° Videos',     color: '#f97316', icon: <Film size={16} />,       path: '/products' },
              { title: 'Lifestyle Photos',color: '#10b981', icon: <Image size={16} />,      path: '/products' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 + i * 0.03 }}
                whileHover={{ y: -2 }}
                onClick={() => user ? navigate(item.path) : redirectToLogin()}
                style={{
                  background: CARD, border: `1px solid ${item.color}20`,
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${item.color}12`, border: `1px solid ${item.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: TEXT3, marginTop: 1 }}>1 token</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
