import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Search, Mail, Send, Layout, DollarSign, ShoppingCart, Share2,
  Video, Hash, RefreshCw, CalendarDays, ChevronRight, Lock,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { PLANS, PLAN_LABELS } from '../lib/planGate.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

// Real destinations already wired in the app — same tools AgentHub's
// "content" config points to, just presented as this Figma grid.
const GENERATORS = [
  { key: 'blog',       label: 'Blog Generator',    desc: 'Long-form strategic articles aligned to brand parameters.',      icon: BookOpen,     color: '#6366f1', route: '/blog-generator', cta: 'Create Draft',   plan: 'package-a' },
  { key: 'seo',        label: 'SEO Blog Writer',   desc: 'Target key search intent structures with direct schema markup.', icon: Search,       color: '#3b82f6', route: '/seo-agent',    cta: 'Write SEO Post', plan: 'package-b' },
  { key: 'email',      label: 'Email Copywriter',  desc: 'Generate promotional narratives, drapes, and drip systems.',     icon: Mail,         color: '#8b5cf6', route: '/email-composer',  cta: 'Draft Email',    plan: 'package-a' },
  { key: 'newsletter', label: 'Newsletter Creator',desc: 'Draft high-retention industry insight summaries for segments.', icon: Send,         color: '#c8973e', route: '/content-gen',  cta: 'Compile Issue',  plan: 'package-a' },
  { key: 'landing',    label: 'Landing Pages',     desc: 'Autonomously drafts high-converting hero sections.',             icon: Layout,       color: '#10b981', route: '/content-gen',  cta: 'Generate Copy',  plan: 'package-a' },
  { key: 'sales',      label: 'Sales Copywriter',  desc: 'Formulates classic conversion copywriting frameworks.',          icon: DollarSign,   color: '#f59e0b', route: '/copywriting',  cta: 'Generate Script',plan: 'package-a' },
  { key: 'product',    label: 'Product Catalog',   desc: 'Generate description logs and rich benefit lists.',              icon: ShoppingCart, color: '#84cc16', route: '/product-desc', cta: 'Describe Item',  plan: 'package-a' },
  { key: 'social',     label: 'Social Content',    desc: 'Generate threads, LinkedIn authority briefs, and posts.',        icon: Share2,       color: '#06b6d4', route: '/caption-suite',cta: 'Compose Post',   plan: 'package-a' },
  { key: 'reel',       label: 'Reel & TikTok Script', desc: 'Direct directions, scene setups, and visual descriptions.',   icon: Video,        color: '#ef4444', route: '/reel-scripts', cta: 'Draft Video',    plan: 'package-a' },
  { key: 'captions',   label: 'Captions & Tags',   desc: 'Optimized semantic tag sets for absolute discoverability.',      icon: Hash,         color: '#ec4899', route: '/caption-suite',cta: 'Tag Post',       plan: 'package-a' },
  { key: 'repurpose',  label: 'AI Repurposer',     desc: 'Turn raw videos or PDFs into technical blog threads.',           icon: RefreshCw,    color: '#a855f7', route: null,            cta: 'Repurpose Asset',plan: null, comingSoon: true },
  { key: 'planner',    label: 'Content Planner',   desc: 'Plan complete cross-channel calendars autonomously.',            icon: CalendarDays, color: '#f97316', route: '/campaign/content_calendar', cta: 'Open Calendar', plan: 'free' },
]

function planAllows(userPlan, requiredPlan) {
  if (!requiredPlan || requiredPlan === 'free') return true
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

export default function ContentStudioHubPage() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()
  const { plan: userPlan } = useUserPlan()
  const [brandKb, setBrandKb] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => { if (data) setBrandKb(data) }).catch(() => {})
  }, [user?.uid])

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const audienceLine = brandKb
    ? [Array.isArray(brandKb.audience) ? brandKb.audience[0] : brandKb.audience, Array.isArray(brandKb.tone) ? brandKb.tone[0] : brandKb.tone].filter(Boolean).join(' · ')
    : null

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Content Studio"
          subtitle="AI-powered high-end content creation across all business channels."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Banner ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Unleash Autonomous Storytelling</div>
            <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, maxWidth: 720 }}>
              {audienceLine
                ? `Our content engine connects with your Strategy Agent playbook parameters. Every generation retains your brand's ${audienceLine} profile automatically.`
                : "Our content engine connects with your Strategy Agent playbook parameters. Complete your Brand Profile so every generation automatically retains your audience, tone and brand guidelines."}
            </div>
          </div>

          {/* ── Generators grid ── */}
          <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Autonomous Generators</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {GENERATORS.map((g, i) => {
              const locked = !g.comingSoon && !planAllows(userPlan, g.plan)
              return (
                <GeneratorCard
                  key={g.key}
                  gen={g}
                  i={i}
                  locked={locked}
                  onClick={() => g.route && navigate(g.route)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function GeneratorCard({ gen, i, locked, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = gen.icon
  const disabled = gen.comingSoon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, border: `1px solid ${hov && !disabled ? '#BE954A55' : BORDER}`, borderRadius: 14,
        padding: 18, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.18s',
        opacity: disabled ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#BE954A1A', border: '1px solid #BE954A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BE954A' }}>
          <Icon size={17} />
        </div>
        {!disabled && <ChevronRight size={14} color={hov ? '#BE954A' : TEXT3} />}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{gen.label}</div>
        <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>{gen.desc}</div>
      </div>
      <button
        disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 16px', background: disabled ? 'transparent' : '#1A1A24', border: `1px solid ${disabled ? BORDER : '#2A2A3A'}`,
          borderRadius: 6, color: disabled ? TEXT3 : '#BE954A', fontSize: 13, fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer', fontFamily: "'Geist','Inter',sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {locked && <Lock size={11} />}
        {disabled ? 'Coming Soon' : locked ? `Upgrade to ${PLAN_LABELS[gen.plan]}` : gen.cta}
      </button>
    </motion.div>
  )
}
