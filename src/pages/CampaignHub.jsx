import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Package, Zap, TrendingUp, Mail, Users, BarChart2, Briefcase, ShoppingCart, Sparkles, Activity, Search, ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useAuth } from '../hooks/useAuth'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const BG    = '#0e0c09'
const CARD  = '#141210'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.32)'
const BORDER = 'rgba(255,255,255,0.07)'
const FONT  = "'Inter','Syne',sans-serif"

const CAMPAIGN_TYPES = [
  { type: 'event',          label: 'Event Campaign',      desc: 'Promote events with full multi-channel campaign — social posts, email invites, and post-event follow-up.',                  icon: <Calendar size={22} />,     color: '#c8973e', badge: 'EVENTS'      },
  { type: 'product',        label: 'Product Campaign',    desc: 'Launch or promote a product with compelling copy, social content, and a complete go-to-market plan.',                      icon: <Package size={22} />,      color: '#10b981', badge: 'PRODUCTS'    },
  { type: 'brand',          label: 'Brand Campaign',      desc: 'Build brand awareness with identity-led campaigns, tone of voice, and audience messaging.',                                icon: <Sparkles size={22} />,     color: '#a855f7', badge: 'BRAND'       },
  { type: 'growth_strategy',label: 'Growth Strategy',     desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap for your business.',                                 icon: <TrendingUp size={22} />,   color: '#f97316', badge: 'GROWTH'      },
  { type: 'content_calendar',label: 'Content Calendar',   desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags.',                                        icon: <Calendar size={22} />,     color: '#3b82f6', badge: 'CONTENT'     },
  { type: 'email_drip',     label: 'Email Drip Campaign', desc: '5-email nurture sequence with subject lines, preheaders, and CTAs optimised for conversion.',                             icon: <Mail size={22} />,         color: '#8b5cf6', badge: 'EMAIL'       },
  { type: 'influencer',     label: 'Influencer & PR',     desc: 'Influencer campaign brief, press release, and media pitch templates ready to send.',                                      icon: <Users size={22} />,        color: '#ec4899', badge: 'INFLUENCE'   },
  { type: 'seo_blog',       label: 'SEO & Blog Post',     desc: 'Full 1,500-word SEO-optimised blog with meta tags, keywords, and internal link recommendations.',                         icon: <Search size={22} />,       color: '#06b6d4', badge: 'SEO'         },
  { type: 'analytics_report',label: 'Analytics Report',   desc: 'Executive KPI summary, channel breakdown, and data-driven recommendations for your business.',                            icon: <BarChart2 size={22} />,    color: '#f59e0b', badge: 'ANALYTICS'   },
  { type: 'sales_enablement',label: 'Sales Enablement',   desc: 'Sales deck, elevator pitch, objection handling scripts, and cold-call templates.',                                        icon: <Briefcase size={22} />,    color: '#84cc16', badge: 'SALES'       },
  { type: 'marketplace',    label: 'Marketplace Growth',  desc: 'Vendor strategy, buyer acquisition plan, and promotional campaign roadmap for marketplaces.',                             icon: <ShoppingCart size={22} />, color: '#14b8a6', badge: 'MARKETPLACE' },
  { type: 'funnel_cro',     label: 'Funnel & CRO Audit',  desc: 'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.',                                           icon: <Activity size={22} />,     color: '#ef4444', badge: 'CRO'         },
]

function getRecommendedType(kb) {
  if (!kb) return 'product'
  const ind = (kb.industry || '').toLowerCase()
  const aud = (kb.audienceType || '').toLowerCase()
  if (['ecommerce','retail','fashion','beauty','d2c','jewellery','watches','food_beverage'].some(t => ind.includes(t))) return 'product'
  if (aud === 'b2b' || ['tech_saas','agency','b2b_services','finance_fintech'].some(t => ind.includes(t))) return 'email_drip'
  if (['hospitality','ngo_nonprofit'].some(t => ind.includes(t))) return 'event'
  if (['education'].some(t => ind.includes(t))) return 'content_calendar'
  return 'product'
}

export default function CampaignHub() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const fromStrategy = location.state?.payload?.fromStep === 2 ? location.state.payload : null

  const [hovered, setHovered]   = useState(null)
  const [kb, setKb]             = useState(null)
  const [recType, setRecType]   = useState(fromStrategy?.recommendedType || 'product')

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      if (!data) return
      setKb(data)
      // A hand-off from Strategy is more specific than the general brand-profile
      // recommendation, so it wins if present.
      if (!fromStrategy?.recommendedType) setRecType(getRecommendedType(data))
    }).catch(() => {})
  }, [user?.uid]) // eslint-disable-line

  const recommended = CAMPAIGN_TYPES.find(c => c.type === recType) || CAMPAIGN_TYPES[1]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/agents-hub')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 36, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = TEXT2}
          onMouseLeave={e => e.currentTarget.style.color = TEXT3}
        >
          <ChevronLeft size={16} /> Back to Agents
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
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

        {/* Recommended for you — compact inline strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onClick={() => navigate(`/campaign/${recommended.type}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
            background: `${recommended.color}0d`, border: `1px solid ${recommended.color}40`,
            borderRadius: 14, padding: '14px 18px', cursor: 'pointer', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = recommended.color + '88'}
          onMouseLeave={e => e.currentTarget.style.borderColor = recommended.color + '40'}
        >
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${recommended.color}20`, border: `1px solid ${recommended.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: recommended.color, flexShrink: 0 }}>
            {recommended.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.07em' }}>RECOMMENDED FOR YOU</span>
              {fromStrategy?.recommendedReason
                ? <span style={{ fontSize: 11, color: TEXT3 }}>{fromStrategy.recommendedReason}</span>
                : kb?.companyName && <span style={{ fontSize: 11, color: TEXT3 }}>based on {kb.companyName}'s brand profile</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{recommended.label}</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/campaign/${recommended.type}`) }}
            style={{ padding: '8px 18px', background: recommended.color, border: 'none', borderRadius: 9, color: '#0e0c09', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FONT, flexShrink: 0 }}
          >
            Start Here →
          </button>
        </motion.div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {CAMPAIGN_TYPES.map((ct, i) => {
            const isRec = ct.type === recType
            return (
              <motion.div
                key={ct.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate(`/campaign/${ct.type}`)}
                onMouseEnter={() => setHovered(ct.type)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: CARD,
                  border: `1px solid ${hovered === ct.type || isRec ? ct.color + '55' : BORDER}`,
                  borderRadius: 16,
                  padding: '22px 22px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  transform: hovered === ct.type ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hovered === ct.type ? `0 16px 40px ${ct.color}14` : 'none',
                  position: 'relative',
                }}
              >
                {isRec && (
                  <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.06em' }}>
                    RECOMMENDED
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${ct.color}18`, border: `1px solid ${ct.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct.color, flexShrink: 0 }}>
                    {ct.icon}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: ct.color, letterSpacing: '0.08em', background: `${ct.color}15`, border: `1px solid ${ct.color}30`, padding: '3px 9px', borderRadius: 100 }}>
                    {ct.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  {ct.label}
                </h3>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, marginBottom: 16 }}>
                  {ct.desc}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: hovered === ct.type ? 8 : 5, color: ct.color, fontSize: 12, fontWeight: 600, transition: 'gap 0.2s' }}>
                  <span>Generate campaign</span>
                  <ArrowRight size={13} />
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
      </div>
    </div>
  )
}
