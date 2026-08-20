import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Bot, FileText, CheckCircle2, Circle, Facebook, Instagram, Linkedin, MessageCircle, Mail, Music2, Megaphone, Ticket, CalendarDays, Users } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import UpgradeModal from '../components/UpgradeModal.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getOrCreateUser, markTourSeen } from '../services/userService'
import ProductTour from '../components/ProductTour.jsx'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { getGoogleAdsMetrics } from '../services/googleAdsService.js'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'
const GREEN  = '#10b981'
const BLUE   = '#3b82f6'
const PURPLE = '#a855f7'

const ORANGE = '#f97316'

const PLAN_LABEL = { free: 'Free Trial', 'package-a': 'Starter', 'package-b': 'Professional', 'package-c': 'Enterprise' }

// Keys must match PLATFORMS in ConnectAccounts.jsx — that page writes the
// socialAccounts map these read from, so a mismatch silently shows a platform
// as unconnected even when it is.
const SOCIAL_PLATFORMS = [
  { key: 'instagram',   label: 'Instagram',  icon: Instagram,     color: '#E4405F' },
  { key: 'facebook',    label: 'Facebook',   icon: Facebook,      color: '#1877F2' },
  { key: 'linkedin',    label: 'LinkedIn',   icon: Linkedin,      color: '#0A66C2' },
  { key: 'tiktok',      label: 'TikTok',     icon: Music2,        color: '#FFFFFF' },
  { key: 'whatsapp',    label: 'WhatsApp',   icon: MessageCircle, color: '#25D366' },
  { key: 'google-ads',  label: 'Google Ads', icon: Megaphone,     color: '#4285F4' },
  { key: 'meta-ads',    label: 'Meta Ads',   icon: Megaphone,     color: '#0668E1' },
  { key: 'gmail',       label: 'Gmail',      icon: Mail,          color: '#EA4335' },
  { key: 'eventbrite',  label: 'Eventbrite', icon: Ticket,        color: '#F05537' },
  { key: 'luma',        label: 'Luma',       icon: CalendarDays,  color: '#8B5CF6' },
  { key: 'meetup',      label: 'Meetup',     icon: Users,         color: '#ED1C40' },
]
const PLANS = ['free', 'package-a', 'package-b', 'package-c']

const INDUSTRY_LABELS = { ecommerce: 'E-commerce & Retail', tech: 'Tech / SaaS', services: 'Professional Services', food: 'Food & Beverage', fashion: 'Fashion & Lifestyle', health: 'Health & Fitness', education: 'Education / EdTech', realestate: 'Real Estate', finance: 'Finance / Fintech', media: 'Media & Entertainment', beauty: 'Beauty & Personal Care', other: 'Other' }
const GOAL_LABELS     = { leads: 'Generate Leads', sales: 'Drive Sales', awareness: 'Build Brand Awareness', brand_awareness: 'Build Brand Awareness', social_growth: 'Grow Social Following', social: 'Grow Social Following', launch: 'Launch a Product', engage: 'Retain & Engage' }
const TONE_LABELS     = { professional: 'Professional', casual: 'Casual & Friendly', bold: 'Bold & Direct', luxury: 'Luxury & Premium', playful: 'Playful & Fun', educational: 'Educational' }
const AUDIENCE_LABELS = { b2c_young: 'Consumers 18–35', b2c_mature: 'Consumers 35–55', b2b_small: 'Small Business', b2b_enterprise: 'Enterprise', mixed: 'Mixed B2B & B2C' }

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
  { label: 'Compliance Agent',       desc: 'Privacy policy, ToS & GDPR checklist', icon: '🛡️', color: GOLD,  plan: 'package-c', route: '/compliance-agent' },
]

/* 7-step campaign launch journey — drives the Marketing Health score */
// Ordered to match the product journey diagram's own sequence:
// Org Setup -> Subscription/Strategy -> Connect Channels -> AI Agents Hub (implicit,
// this page) -> Campaign Builder -> Campaign Execution.
const JOURNEY = [
  { key: 'account',    label: 'Account created',              route: null },
  { key: 'onboarding', label: 'Brand profile set',            route: '/brand-profile' },
  { key: 'strategy',   label: 'Marketing strategy built',     route: '/strategy' },
  { key: 'social',     label: 'Social accounts connected',    route: '/connect-accounts' },
  { key: 'content',    label: 'First content generated',      route: '/new-campaign' },
  { key: 'approved',   label: 'Content approved in queue',    route: '/queue' },
  { key: 'launched',   label: 'Campaign launched',            route: '/campaigns' },
]

function timeAgo(ts) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null
  if (!d || isNaN(d.getTime())) return ''
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function agentLabelForType(type = '') {
  const t = type.toLowerCase()
  if (t.includes('seo'))                          return 'SEO Agent'
  if (t.includes('email'))                        return 'Email Agent'
  if (t.includes('ad') || t.includes('meta'))     return 'Ads Agent'
  if (t.includes('strategy') || t.includes('kpi')) return 'Strategy Agent'
  if (t.includes('video') || t.includes('reel'))  return 'Creative Agent'
  return 'Content Agent'
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
  const [upgradeModal,    setUpgradeModal]   = useState(null)
  const [gadsMetrics,     setGadsMetrics]    = useState(null)
  const [gadsLoading,     setGadsLoading]    = useState(true)
  const [showTour,        setShowTour]       = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(d => {
        setUserData(d)
        if (!d?.productTourSeen) setShowTour(true)
      })
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
    getGoogleAdsMetrics(user.uid)
      .then(m => setGadsMetrics(m))
      .catch(() => setGadsMetrics(null))
      .finally(() => setGadsLoading(false))
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

  // Only count real publishable platforms — socialAccounts also holds internal
  // provisioning records (e.g. `ghl`, the GoHighLevel workspace) that aren't
  // destinations you can post to, and counting those overstated the total.
  const connectedAccounts = SOCIAL_PLATFORMS
    .filter(p => userData?.socialAccounts?.[p.key]?.connected).length
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
  const nextStepKey = JOURNEY.find(j => !completed[j.key])?.key || null

  const reviewCount = recentContent.filter(c => ['draft', 'pending', 'review', 'pending_approval'].includes((c.status || '').toLowerCase())).length

  // Ad-attributed revenue estimate = spend x ROAS (same figures AnalyticsDashboard.jsx shows) — real Google Ads data, not invented.
  const gadsConnected = !!gadsMetrics
  const attributedRevenue = gadsConnected ? gadsMetrics.spend * gadsMetrics.roas : 0

  const handleTourFinish = () => {
    setShowTour(false)
    if (user?.uid) markTourSeen(user.uid).catch(() => {})
  }

  const handleAgent = (agent) => {
    const locked = PLANS.indexOf(agent.plan) > planLevel
    if (locked) { setUpgradeModal({ featureName: agent.label }); return }
    navigate(agent.route)
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
        <div data-tour="dashboard-header" style={{ minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 100 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', fontFamily: "'Outfit','Inter',sans-serif" }}>Command Console</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: '#9B9BB0', fontFamily: "'Geist','Inter',sans-serif" }}>Workspace: {brandName || `${firstName}'s Workspace`} ({PLAN_LABEL[plan || 'free']})</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: '8px 16px', background: '#BE954A1A', border: '1px solid #BE954A40', borderRadius: 6, color: '#BE954A', fontSize: 13, fontWeight: 400, fontFamily: "'Geist','Inter',sans-serif" }}>
              Multi-Agent Link Stable
            </div>
            <div onClick={() => navigate('/brand-profile')} style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8973e,#8b5e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0e0c09' }}>{firstName[0]?.toUpperCase()}</div>
              }
            </div>
          </div>
        </div>

        {/* ── PAGE BODY ── */}
        <div style={{ padding: '40px', maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ══ STAT CARDS ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            <MetricCard
              label="Marketing Health" value={`${progress} / 100`}
              delta={`${doneCount}/${JOURNEY.length} steps done`} deltaColor={GREEN}
              onClick={() => navigate('/health-score')} />
            <MetricCard
              label="Est. Ad Revenue (Google Ads)"
              value={gadsLoading ? '—' : gadsConnected ? `$${attributedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              delta={gadsLoading ? 'Loading...' : gadsConnected ? `${gadsMetrics.roas.toFixed(2)}x ROAS` : 'Connect Analytics to track'}
              deltaColor={gadsConnected ? GREEN : TEXT3}
              onClick={() => navigate('/analytics')} />
            <MetricCard
              label="Active Campaign Chains" value={`${connectedAccounts} Channel${connectedAccounts === 1 ? '' : 's'}`}
              delta={connectedAccounts > 0 ? 'Stable' : 'Not connected'} deltaColor={connectedAccounts > 0 ? GREEN : TEXT3}
              onClick={() => navigate('/connect-accounts')} />
            <MetricCard
              label="AI Recommendations" value={`${reviewCount}`}
              delta={reviewCount > 0 ? 'Require Review' : 'All caught up'} deltaColor={reviewCount > 0 ? GOLD : GREEN}
              onClick={() => navigate('/queue')} />
          </div>

          {/* ══ GETTING STARTED ══ */}
          {progress < 100 && (
            <motion.div data-tour="dashboard-getting-started" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: CARD, borderRadius: 12, padding: '20px 24px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>
                Getting Started
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {JOURNEY.map(step => (
                  <JourneyStep
                    key={step.key}
                    label={step.label}
                    done={!!completed[step.key]}
                    isNext={step.key === nextStepKey}
                    onClick={step.route ? () => navigate(step.route) : undefined}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ CONNECT ACCOUNTS ══ */}
          {/* Campaigns can't publish anywhere until at least one account is
              linked, so this sits above the fold rather than in settings. */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: CARD, borderRadius: 12, padding: '20px 24px',
              border: `1px solid ${connectedAccounts > 0 ? BORDER : GBORD}`,
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
            <div style={{ flex: 1, minWidth: 260, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
                  Connected Accounts
                </div>
                <span style={{
                  padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
                  background: connectedAccounts > 0 ? 'rgba(16,185,129,0.12)' : GDIM,
                  color: connectedAccounts > 0 ? GREEN : GOLD,
                }}>
                  {connectedAccounts > 0 ? `${connectedAccounts} CONNECTED` : 'NONE CONNECTED'}
                </span>
              </div>
              <div style={{ color: TEXT3, fontSize: 13, lineHeight: 1.5 }}>
                {connectedAccounts > 0
                  ? 'Campaigns will publish to these accounts. Add more channels for wider reach.'
                  : 'Link Facebook, Instagram or LinkedIn before launching a campaign — otherwise there is nowhere to publish.'}
              </div>

              {/* Per-platform status boxes — click any to manage that connection */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {SOCIAL_PLATFORMS.map(p => {
                  const isConnected = !!userData?.socialAccounts?.[p.key]?.connected
                  const Icon = p.icon
                  return (
                    <div
                      key={p.key}
                      onClick={() => navigate('/connect-accounts')}
                      title={isConnected ? `${p.label} — connected` : `${p.label} — not connected`}
                      style={{
                        width: 76, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                        background: isConnected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : BORDER}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        opacity: isConnected ? 1 : 0.5, transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = isConnected ? 1 : 0.5; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <Icon size={20} color={isConnected ? p.color : TEXT3} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: isConnected ? '#FFFFFF' : TEXT3, whiteSpace: 'nowrap' }}>
                        {p.label}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.04em', color: isConnected ? GREEN : TEXT3 }}>
                        {isConnected ? 'LINKED' : 'ADD'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => navigate('/connect-accounts')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                  background: connectedAccounts > 0 ? 'transparent' : GOLD,
                  border: connectedAccounts > 0 ? `1px solid ${GBORD}` : 'none',
                  borderRadius: 10, color: connectedAccounts > 0 ? GOLD : '#0A0A0F',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {connectedAccounts > 0 ? 'Manage accounts' : 'Connect accounts'} <ArrowRight size={15} />
              </button>
              {connectedAccounts > 0 && (
                <button
                  onClick={() => navigate('/campaign/event')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                    background: GOLD, border: 'none', borderRadius: 10, color: '#0A0A0F',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  Launch campaign <ArrowRight size={15} />
                </button>
              )}
            </div>
          </motion.div>

          {/* ══ MAIN LAYOUT ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '640px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── LEFT — Recent AI Agent Executions ── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Recent AI Agent Executions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {recentContent.length === 0 ? (
                  <div style={{ padding: '24px 18px', textAlign: 'center', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#9B9BB0', marginBottom: 10, lineHeight: 1.6 }}>No agent runs yet. Use an agent to generate your first piece of content.</div>
                    <button onClick={() => navigate('/agents-hub')} style={{ padding: '7px 14px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Run an Agent →
                    </button>
                  </div>
                ) : recentContent.map((item) => (
                  <div key={item.id} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 4 }}>{agentLabelForType(item.type)}</div>
                      <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 13, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.campaignName || item.text?.slice(0, 60) || 'AI generated content'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 11, color: '#9B9BB0' }}>{timeAgo(item.createdAt)}</div>
                      <StatusBadge status={item.status}/>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── RIGHT — Active Playbook Parameters ── */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Active Playbook Parameters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {brandKb ? (
                  <>
                    <ParamRow
                      title={`${brandName || 'Your Brand'} Audience`}
                      desc={[brandKb.audience && AUDIENCE_LABELS[Array.isArray(brandKb.audience) ? brandKb.audience[0] : brandKb.audience], brandKb.tone && TONE_LABELS[Array.isArray(brandKb.tone) ? brandKb.tone[0] : brandKb.tone]].filter(Boolean).join(' · ') || 'Not set'} />
                    <ParamRow
                      title="Primary Goal"
                      desc={[brandKb.goal && GOAL_LABELS[Array.isArray(brandKb.goal) ? brandKb.goal[0] : brandKb.goal], brandKb.industry && INDUSTRY_LABELS[Array.isArray(brandKb.industry) ? brandKb.industry[0] : brandKb.industry]].filter(Boolean).join(' · ') || 'Not set'} />
                  </>
                ) : (
                  <div style={{ padding: '14px 0' }}>
                    <div style={{ fontSize: 11, color: '#9B9BB0', marginBottom: 10, lineHeight: 1.6 }}>Set up your brand profile to define playbook parameters.</div>
                    <button onClick={() => navigate('/brand-profile')} style={{ padding: '7px 14px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Set Up Brand →
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAgent(ALL_AGENTS.find(a => a.label === 'Meta Ads Boost'))}
                style={{ width: '100%', padding: '14px 28px', background: '#BE954A', border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 15, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif", boxSizing: 'border-box' }}>
                Trigger Autonomous Ad Optimization
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {upgradeModal && (
        <UpgradeModal featureName={upgradeModal.featureName} onClose={() => setUpgradeModal(null)}/>
      )}

      {showTour && <ProductTour onFinish={handleTourFinish} />}

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

function MetricCard({ label, value, delta, deltaColor, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, minWidth: 0, background: CARD, border: `1px solid ${hov ? GBORD : BORDER}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.18s' }}>
      <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 13, color: '#9B9BB0' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
        <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 12, fontWeight: 700, color: deltaColor }}>{delta}</div>
      </div>
    </div>
  )
}

function JourneyStep({ label, done, isNext, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
        cursor: onClick ? 'pointer' : 'default',
        background: isNext ? GDIM : hov && onClick ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: isNext ? `1px solid ${GBORD}` : '1px solid transparent',
      }}>
      {done
        ? <CheckCircle2 size={16} color={GREEN} style={{ flexShrink: 0 }} />
        : <Circle size={16} color={isNext ? GOLD : TEXT3} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1, fontSize: 13, fontWeight: isNext ? 700 : 500, color: done ? TEXT2 : isNext ? TEXT : TEXT3 }}>
        {label}
      </span>
      {isNext && <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.04em' }}>NEXT →</span>}
    </div>
  )
}

function ParamRow({ title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#BE954A1A', border: '1px solid #BE954A40', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 12, color: '#9B9BB0', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
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

function StatusBadge({ status }) {
  const labels = { draft: 'Draft', approved: 'Approved', scheduled: 'Scheduled', published: 'Published', rejected: 'Rejected' }
  const label = labels[status] || 'Draft'
  return <span style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 11, color: '#BE954A', background: '#1A1A24', borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>{label}</span>
}

