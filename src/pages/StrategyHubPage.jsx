import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, Zap, BookOpen, Calendar, Target, Activity,
  Briefcase, BarChart2, FileText, ArrowRight, Sparkles,
  ChevronRight, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import UpgradeModal from '../components/UpgradeModal.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { PLANS, PLAN_LABELS } from '../lib/planGate.js'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.13)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.32)'
const BORDER = 'rgba(255,255,255,0.07)'

const STRATEGY_GROUPS = [
  {
    group: 'Plan & Position',
    desc: 'Set your direction — annual plans, brand positioning, and GTM strategy.',
    items: [
      {
        label: 'Marketing Strategy',
        badge: 'ANNUAL PLAN',
        desc: 'Build your full Annual, Quarterly & Monthly marketing plan with channel budgets, KPIs, and campaign roadmap.',
        icon: TrendingUp,
        color: '#c8973e',
        route: '/strategy',
        plan: 'free',
        cta: 'Build Strategy',
      },
      {
        label: 'Growth Strategy',
        badge: 'GTM PLAN',
        desc: 'Full go-to-market plan — revenue forecast, market sizing, ideal customer profile, and milestone roadmap.',
        icon: Zap,
        color: '#f97316',
        route: '/campaign/growth_strategy',
        plan: 'free',
        cta: 'Build GTM Plan',
      },
      {
        label: 'Brand Strategy',
        badge: 'BRAND',
        desc: 'Define your brand positioning, unique value proposition, tone of voice, and brand pillars.',
        icon: BookOpen,
        color: '#a855f7',
        route: '/campaign/brand_strategy',
        plan: 'free',
        cta: 'Define Brand',
      },
    ],
  },
  {
    group: 'Content & Campaigns',
    desc: 'Plan and structure your content output and campaign sequences.',
    items: [
      {
        label: 'Content Calendar',
        badge: 'CONTENT',
        desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags for every channel.',
        icon: Calendar,
        color: '#3b82f6',
        route: '/campaign/content_calendar',
        plan: 'free',
        cta: 'Build Calendar',
      },
      {
        label: 'Email Drip Campaign',
        badge: 'EMAIL',
        desc: '5-email nurture sequence with subject lines, preheaders, body copy, and CTAs — ready to send.',
        icon: FileText,
        color: '#8b5cf6',
        route: '/campaign/email_drip',
        plan: 'free',
        cta: 'Build Sequence',
      },
      {
        label: 'Sales Enablement',
        badge: 'SALES',
        desc: 'Sales deck, elevator pitch, objection-handling scripts, and cold-call templates for your team.',
        icon: Briefcase,
        color: '#84cc16',
        route: '/campaign/sales_enablement',
        plan: 'free',
        cta: 'Build Sales Kit',
      },
    ],
  },
  {
    group: 'Analyse & Optimise',
    desc: 'Audit performance, find gaps, and improve conversion at every stage.',
    items: [
      {
        label: 'Competitive Intelligence',
        badge: 'COMPETITOR',
        desc: 'SWOT analysis, competitor profiles, pricing comparison, and positioning gaps — know exactly where you stand.',
        icon: Target,
        color: '#ef4444',
        route: '/campaign/competitive_intel',
        plan: 'free',
        cta: 'Analyse Competitors',
      },
      {
        label: 'Funnel & CRO Audit',
        badge: 'CRO',
        desc: 'Top-to-bottom funnel audit, A/B test ideas, quick-win CTA fixes, and conversion rate improvements.',
        icon: Activity,
        color: '#14b8a6',
        route: '/campaign/funnel_cro',
        plan: 'free',
        cta: 'Audit Funnel',
      },
      {
        label: 'Analytics Report',
        badge: 'ANALYTICS',
        desc: 'Executive KPI summary, channel breakdown, ROI analysis, and data-driven recommendations.',
        icon: BarChart2,
        color: '#f59e0b',
        route: '/campaign/analytics_report',
        plan: 'free',
        cta: 'Generate Report',
      },
    ],
  },
  {
    group: 'Executive & Reporting',
    desc: 'Board-ready reports and high-level performance summaries.',
    items: [
      {
        label: 'Executive Report',
        badge: 'BOARD-READY',
        desc: 'Full board-level marketing performance report — ROI, ROAS, channel performance, risks, and strategic recommendations.',
        icon: FileText,
        color: '#c8973e',
        route: '/executive-report',
        plan: 'package-b',
        cta: 'Generate Report',
      },
    ],
  },
]

function planAllows(userPlan, requiredPlan) {
  if (!requiredPlan || requiredPlan === 'free') return true
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

export default function StrategyHubPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { plan: userPlan } = useUserPlan()
  const [upgradeFor, setUpgradeFor] = useState(null)

  const handleClick = (item) => {
    if (!planAllows(userPlan, item.plan)) {
      setUpgradeFor({ requiredPlan: item.plan, featureTitle: item.label })
    } else {
      navigate(item.route)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '96px 28px 80px' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', marginBottom: 14 }}>
            <Sparkles size={11} /> STRATEGY AGENT
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: '-0.03em', margin: '0 0 10px', fontFamily: "'Syne','Inter',sans-serif" }}>
            Strategy Hub
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
            Choose a strategy type to get started. Each agent generates a full plan tailored to your brand — from annual marketing strategy to competitor analysis and funnel audits.
          </p>
        </motion.div>

        {/* ── Strategy groups ── */}
        {STRATEGY_GROUPS.map((group, gi) => (
          <motion.div key={group.group}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.07 }}
            style={{ marginBottom: 40 }}>

            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: '-0.01em' }}>{group.group}</div>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>
            <div style={{ fontSize: 12, color: TEXT3, marginBottom: 16 }}>{group.desc}</div>

            {/* Strategy cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {group.items.map((item, ii) => {
                const locked = !planAllows(userPlan, item.plan)
                const Icon = item.icon
                return (
                  <StrategyCard
                    key={item.label}
                    item={item}
                    Icon={Icon}
                    locked={locked}
                    i={ii + gi * 3}
                    onClick={() => handleClick(item)}
                  />
                )
              })}
            </div>
          </motion.div>
        ))}

        {/* ── After strategy → launch campaign prompt ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 8, padding: '20px 24px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Ready to execute your strategy?</div>
            <div style={{ fontSize: 12, color: TEXT2 }}>Once your strategy is built, launch a campaign from the AI Agents Hub — content, email, SEO, ads and more.</div>
          </div>
          <button onClick={() => navigate('/agents-hub')}
            style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            Go to AI Agents <ArrowRight size={13} />
          </button>
        </motion.div>

      </div>

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

function StrategyCard({ item, Icon, locked, i, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: locked ? 'rgba(255,255,255,0.02)' : CARD,
        border: `1px solid ${hovered ? (locked ? '#666' : item.color + '55') : BORDER}`,
        borderRadius: 16,
        padding: '22px 22px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered && !locked ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered && !locked ? `0 12px 32px ${item.color}12` : 'none',
        opacity: locked ? 0.65 : 1,
        position: 'relative',
      }}
    >
      {/* Plan badge */}
      {item.plan !== 'free' && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: locked ? 'rgba(255,255,255,0.05)' : `${item.color}15`, border: `1px solid ${locked ? 'rgba(255,255,255,0.1)' : item.color + '35'}`, borderRadius: 100 }}>
          {locked && <Lock size={9} color="#666" />}
          <span style={{ fontSize: 9, fontWeight: 800, color: locked ? '#666' : item.color, letterSpacing: '0.06em' }}>{PLAN_LABELS[item.plan]}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: locked ? 'rgba(255,255,255,0.04)' : `${item.color}18`, border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : item.color + '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: locked ? TEXT3 : item.color, flexShrink: 0 }}>
          {locked ? <Lock size={20} color={TEXT3} /> : <Icon size={20} />}
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: locked ? TEXT3 : item.color, letterSpacing: '0.1em', marginBottom: 4 }}>{item.badge}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: locked ? TEXT3 : TEXT, lineHeight: 1.3 }}>{item.label}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: locked ? 'rgba(240,235,224,0.25)' : TEXT2, lineHeight: 1.65, marginBottom: 18 }}>{item.desc}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: locked ? '#555' : (hovered ? item.color : TEXT3), transition: 'color 0.15s' }}>
        {locked
          ? <><Lock size={11} /> Upgrade to {PLAN_LABELS[item.plan]}</>
          : <>{item.cta} <ChevronRight size={13} /></>}
      </div>
    </motion.div>
  )
}
