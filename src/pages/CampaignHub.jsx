import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Package, Zap, TrendingUp, Mail, Users, BarChart2, Briefcase, ShoppingCart, Sparkles, Activity, Search, ChevronLeft, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const BG    = '#0e0c09'
const CARD  = '#141210'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.32)'
const FONT  = "'Inter','Syne',sans-serif"

const CAMPAIGN_TYPES = [
  {
    type: 'event',
    label: 'Event Campaign',
    desc: 'Promote events with full multi-channel campaign — social posts, email invites, and post-event follow-up.',
    icon: <Calendar size={22} />,
    color: '#c8973e',
    badge: 'EVENTS',
  },
  {
    type: 'product',
    label: 'Product Campaign',
    desc: 'Launch or promote a product with compelling copy, social content, and a complete go-to-market plan.',
    icon: <Package size={22} />,
    color: '#10b981',
    badge: 'PRODUCTS',
  },
  {
    type: 'brand',
    label: 'Brand Campaign',
    desc: 'Build brand awareness with identity-led campaigns, tone of voice, and audience messaging.',
    icon: <Sparkles size={22} />,
    color: '#a855f7',
    badge: 'BRAND',
  },
  {
    type: 'growth_strategy',
    label: 'Growth Strategy',
    desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap for your business.',
    icon: <TrendingUp size={22} />,
    color: '#f97316',
    badge: 'GROWTH',
  },
  {
    type: 'content_calendar',
    label: 'Content Calendar',
    desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags.',
    icon: <Calendar size={22} />,
    color: '#3b82f6',
    badge: 'CONTENT',
  },
  {
    type: 'email_drip',
    label: 'Email Drip Campaign',
    desc: '5-email nurture sequence with subject lines, preheaders, and CTAs optimised for conversion.',
    icon: <Mail size={22} />,
    color: '#8b5cf6',
    badge: 'EMAIL',
  },
  {
    type: 'influencer',
    label: 'Influencer & PR',
    desc: 'Influencer campaign brief, press release, and media pitch templates ready to send.',
    icon: <Users size={22} />,
    color: '#ec4899',
    badge: 'INFLUENCE',
  },
  {
    type: 'seo_blog',
    label: 'SEO & Blog Post',
    desc: 'Full 1,500-word SEO-optimised blog with meta tags, keywords, and internal link recommendations.',
    icon: <Search size={22} />,
    color: '#06b6d4',
    badge: 'SEO',
  },
  {
    type: 'analytics_report',
    label: 'Analytics Report',
    desc: 'Executive KPI summary, channel breakdown, and data-driven recommendations for your business.',
    icon: <BarChart2 size={22} />,
    color: '#f59e0b',
    badge: 'ANALYTICS',
  },
  {
    type: 'sales_enablement',
    label: 'Sales Enablement',
    desc: 'Sales deck, elevator pitch, objection handling scripts, and cold-call templates.',
    icon: <Briefcase size={22} />,
    color: '#84cc16',
    badge: 'SALES',
  },
  {
    type: 'marketplace',
    label: 'Marketplace Growth',
    desc: 'Vendor strategy, buyer acquisition plan, and promotional campaign roadmap for marketplaces.',
    icon: <ShoppingCart size={22} />,
    color: '#14b8a6',
    badge: 'MARKETPLACE',
  },
  {
    type: 'funnel_cro',
    label: 'Funnel & CRO Audit',
    desc: 'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.',
    icon: <Activity size={22} />,
    color: '#ef4444',
    badge: 'CRO',
  },
]

export default function CampaignHub() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/#agents-ecosystem')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(240,235,224,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 36, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,235,224,0.85)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.45)'}
        >
          <ChevronLeft size={16} /> Back to Agents
        </button>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.25)', borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', marginBottom: 16 }}>
            CAMPAIGN PLANNING AGENT
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif" }}>
            Choose a Campaign Type
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, maxWidth: 500 }}>
            Select the type of campaign you want to generate. Your AI CMO will build a complete, multi-channel output in under 60 seconds.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {CAMPAIGN_TYPES.map((ct, i) => (
            <motion.div
              key={ct.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(`/campaign/${ct.type}`)}
              onMouseEnter={() => setHovered(ct.type)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: CARD,
                border: `1px solid ${hovered === ct.type ? ct.color + '55' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16,
                padding: '22px 22px 20px',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                transform: hovered === ct.type ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered === ct.type ? `0 16px 40px ${ct.color}14` : 'none',
              }}
            >
              {/* Icon + badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${ct.color}18`, border: `1px solid ${ct.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct.color, flexShrink: 0 }}>
                  {ct.icon}
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: ct.color, letterSpacing: '0.08em', background: `${ct.color}15`, border: `1px solid ${ct.color}30`, padding: '3px 9px', borderRadius: 100 }}>
                  {ct.badge}
                </span>
              </div>

              {/* Title */}
              <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {ct.label}
              </h3>

              {/* Desc */}
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, marginBottom: 16 }}>
                {ct.desc}
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: ct.color, fontSize: 12, fontWeight: 600, transition: 'gap 0.2s', gap: hovered === ct.type ? 8 : 5 }}>
                <span>Generate campaign</span>
                <ArrowRight size={13} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
