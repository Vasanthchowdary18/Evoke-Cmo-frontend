import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, BookOpen, Zap, Calendar, Activity, Target,
  PenTool, Sliders, FileText, Camera, Image, Search, Video,
  Mail, Globe, Users, BarChart2, UserCheck, Box, Inbox, Link2,
  DollarSign, Share2, Crown, Lock, ArrowRight, Sparkles, Shield, Cpu,
} from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout.jsx'
import UpgradeModal from '../components/UpgradeModal.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
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

const PLAN_SECTIONS = [
  {
    plan: 'free',
    label: 'Free Plan',
    tag: 'ALWAYS INCLUDED',
    color: '#10b981',
    desc: 'Core strategy & planning tools — available to all users.',
    tools: [
      { label: 'Marketing Strategy',    desc: 'Annual, quarterly & monthly marketing plans with channel budgets and KPIs.',    icon: TrendingUp,  color: '#c8973e', route: '/strategy' },
      { label: 'Growth Strategy',       desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.',        icon: Zap,         color: '#f97316', route: '/campaign/growth_strategy' },
      { label: 'Marketing Health Score',desc: 'Audit your full marketing performance and get an improvement checklist.',       icon: Activity,    color: '#10b981', route: '/health-score' },
    ],
  },
  {
    plan: 'package-a',
    label: 'Package A — Creative & Content',
    tag: 'STARTER',
    color: '#3b82f6',
    desc: 'AI content creation, product visuals, copywriting, and video — everything to build your creative assets.',
    tools: [
      { label: 'Brand Knowledge Base',  desc: 'Store your brand voice, visuals, messaging, audience, and business goals.',      icon: BookOpen, color: '#f59e0b', route: '/brand-kb' },
      { label: 'Content Calendar',       desc: '30-day multi-platform content plan with daily post ideas and captions.',        icon: Calendar, color: '#3b82f6', route: '/campaign/content_calendar' },
      { label: 'KPI Recommendations',    desc: 'Set and track the right KPIs for your business goals and growth stage.',         icon: Target,   color: '#a855f7', route: '/kpi-recommendations' },
      { label: 'Caption Suite',          desc: 'AI-generated captions for Instagram, LinkedIn, TikTok, Twitter, and Facebook.', icon: PenTool,  color: '#10b981', route: '/caption-suite' },
      { label: 'Reel Scripts',           desc: 'Hook + body + CTA scripts for Reels, TikTok, and YouTube Shorts.',             icon: Sliders,  color: '#f59e0b', route: '/reel-scripts' },
      { label: 'Content Generation',     desc: 'Blog posts, landing page copy, and newsletters — full AI-written content.',    icon: FileText, color: '#6366f1', route: '/content-gen' },
      { label: 'Copywriting Agent',      desc: 'Ad copy, taglines, slogans, brand voice, and value propositions.',             icon: PenTool,  color: '#ec4899', route: '/copywriting' },
      { label: 'Product Image Angles',   desc: 'Multi-angle product shots — front, side, top, lifestyle on clean background.', icon: Camera,   color: '#f97316', route: '/image-angles' },
      { label: 'Lifestyle Photos',       desc: 'Product in real-life settings — homes, outdoors, and social contexts.',        icon: Image,    color: '#a855f7', route: '/image-lifestyle' },
      { label: 'SEO Product Images',     desc: 'Keyword-rich product images with alt text optimised for Google Shopping.',     icon: Search,   color: '#06b6d4', route: '/image-seo' },
      { label: 'Video Generation',       desc: 'Promo, product showcase, social reel, and event videos — all AI-driven.',      icon: Video,    color: '#f59e0b', route: '/video-gen' },
    ],
  },
  {
    plan: 'package-b',
    label: 'Package B — AI Agents & Analytics',
    tag: 'POPULAR',
    color: '#c8973e',
    desc: 'Advanced AI agents for email, SEO, A/B testing, analytics, and social media management.',
    tools: [
      { label: 'Email Marketing Agent',  desc: 'Full email campaigns with subject lines, body copy, and predicted performance.', icon: Mail,       color: '#a855f7', route: '/email-marketing' },
      { label: 'SEO Agent',              desc: 'Keyword research, technical audit, competitor gaps, and content brief.',         icon: Search,     color: '#3b82f6', route: '/seo-agent' },
      { label: 'A/B Testing Framework',  desc: 'Design experiments, build variants, and deploy the winning version.',            icon: Sliders,    color: '#f59e0b', route: '/ab-testing' },
      { label: 'Audience Builder',       desc: '4 precision audience segments ready for Meta & Google ad targeting.',            icon: Users,      color: '#a855f7', route: '/audience-builder' },
      { label: 'Trend Analysis',         desc: 'Real-time trend tracking across your market and competitor movements.',          icon: TrendingUp, color: '#06b6d4', route: '/trends' },
      { label: 'CRM & Lifecycle',        desc: 'Manage customer lifecycle, segment contacts, and automate follow-ups.',          icon: UserCheck,  color: '#10b981', route: '/crm' },
      { label: 'Analytics Dashboard',    desc: 'Live KPI tracking — reach, engagement, conversions, and ROI.',                   icon: BarChart2,  color: '#f59e0b', route: '/analytics' },
      { label: 'Executive Report',       desc: 'Board-ready report — ROI, ROAS, channel performance, and strategic recommendations.', icon: FileText, color: '#c8973e', route: '/executive-report' },
      { label: '3D Product Images',      desc: 'Photorealistic 3D renders of your product for premium campaigns.',               icon: Box,        color: '#8b5cf6', route: '/image-3d' },
      { label: 'Social Inbox',           desc: 'Manage all your social messages, comments, and DMs in one place.',               icon: Inbox,      color: '#06b6d4', route: '/inbox' },
      { label: 'Connect Social Accounts',desc: 'Link Instagram, Facebook, LinkedIn, Twitter, and more to post directly.',        icon: Link2,      color: '#10b981', route: '/connect-accounts' },
    ],
  },
  {
    plan: 'package-c',
    label: 'Package C — Paid Ads & Full Execution',
    tag: 'PREMIUM',
    color: '#a855f7',
    desc: 'Meta Ads, Google Ads, 7-channel campaign deployment, team management, and partner tools.',
    tools: [
      { label: 'Meta Ads Boost',         desc: 'Turn your creatives into high-converting Meta ad sets with AI copy.',           icon: DollarSign, color: '#c8973e', route: '/meta-ads-boost' },
      { label: 'Marketing Execution',    desc: '7-channel deployment — Meta, LinkedIn, TikTok, Google, Email, SMS, Marketplace.', icon: Share2,   color: '#84cc16', route: '/execution' },
      { label: 'Team Management',        desc: 'Assign roles, manage access, and collaborate with your marketing team.',         icon: Users,      color: '#a855f7', route: '/team' },
      { label: 'Partner Sharing',        desc: 'Share campaigns and assets with agencies and collaborators.',                    icon: Globe,      color: '#10b981', route: '/partner-sharing' },
      { label: 'Compliance Agent',       desc: 'Draft privacy policy, terms of service and a GDPR checklist.',                   icon: Shield,     color: '#c8973e', route: '/compliance-agent' },
      { label: 'AI CFO',                 desc: 'Budget planning, ROI forecasting and P&L clarity.',                             icon: DollarSign, color: '#10b981', route: '/ai-cfo' },
      { label: 'AI CTO',                 desc: 'Tech stack advisory and sprint planning.',                                      icon: Cpu,        color: '#3b82f6', route: '/ai-cto' },
      { label: 'AI CEO',                 desc: 'Vision, board updates and investor communication.',                            icon: Crown,      color: '#c8973e', route: '/ai-ceo' },
      { label: 'AI CRO',                 desc: 'Revenue optimization, pricing and upsell strategy.',                           icon: TrendingUp, color: '#a855f7', route: '/ai-cro' },
    ],
  },
]

const PLAN_COLORS = { free: '#10b981', 'package-a': '#3b82f6', 'package-b': '#c8973e', 'package-c': '#a855f7' }

function planAllows(userPlan, requiredPlan) {
  if (!requiredPlan || requiredPlan === 'free') return true
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

export default function AgentsHub() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()
  const { plan: userPlan } = useUserPlan()
  const [hasBrandKb,  setHasBrandKb]  = useState(false)
  const [upgradeFor,  setUpgradeFor]  = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      setHasBrandKb(!!(data && Object.keys(data).length > 1))
    }).catch(() => {})
  }, [user?.uid])

  const currentPlanColor = PLAN_COLORS[userPlan || 'free']
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const handleToolClick = (tool, sectionPlan) => {
    if (!planAllows(userPlan, sectionPlan)) {
      setUpgradeFor({ requiredPlan: sectionPlan, featureTitle: tool.label })
    } else {
      navigate(tool.route)
    }
  }

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <SidebarLayout bg={BG}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${currentPlanColor}15`, border: `1px solid ${currentPlanColor}35`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: currentPlanColor, letterSpacing: '0.1em', marginBottom: 12 }}>
                <Sparkles size={11} /> {PLAN_LABELS[userPlan || 'free'].toUpperCase()} — YOUR AGENTS
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: '-0.03em', margin: '0 0 8px', fontFamily: "'Syne','Inter',sans-serif" }}>
                AI Agents Hub
              </h1>
              <p style={{ fontSize: 14, color: TEXT2, margin: 0, lineHeight: 1.65, maxWidth: 520 }}>
                All your AI agents in one place — organised by plan. Your unlocked agents are ready to launch.
              </p>
            </div>
            <button onClick={() => navigate('/plans')}
              style={{ padding: '10px 18px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              <Crown size={13} /> View Plans
            </button>
          </div>
        </motion.div>

        {/* ── Brand KB setup prompt ── */}
        {!hasBrandKb && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 28, padding: '16px 20px', background: 'rgba(200,151,62,0.06)', border: `1px solid ${GBORDER}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 3 }}>Set up your Brand Profile first</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>EVOX AI needs your brand details to personalise every agent output.</div>
            </div>
            <button onClick={() => navigate('/brand-profile')}
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={14} /> Set Up Brand Profile <ArrowRight size={13} />
            </button>
          </motion.div>
        )}

        {/* ── Plan Sections ── */}
        {PLAN_SECTIONS.map((section, si) => {
          const unlocked = planAllows(userPlan, section.plan)
          const isCurrentTier = (userPlan || 'free') === section.plan

          return (
            <motion.div key={section.plan}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
              style={{ marginBottom: 44 }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px',
                  background: unlocked ? `${section.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${unlocked ? section.color + '40' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 100,
                }}>
                  {!unlocked && <Lock size={10} color={TEXT3} />}
                  <span style={{ fontSize: 10, fontWeight: 800, color: unlocked ? section.color : TEXT3, letterSpacing: '0.1em' }}>
                    {section.tag}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: unlocked ? TEXT : TEXT3 }}>{section.label}</div>
                {isCurrentTier && (
                  <div style={{ padding: '3px 10px', background: `${section.color}15`, border: `1px solid ${section.color}40`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: section.color }}>
                    YOUR PLAN
                  </div>
                )}
                <div style={{ flex: 1, height: 1, background: BORDER }} />
                <span style={{ fontSize: 11, color: TEXT3 }}>{section.tools.length} agents</span>
              </div>

              {/* Section desc */}
              <div style={{ fontSize: 12, color: TEXT3, marginBottom: 16, paddingLeft: 2 }}>{section.desc}</div>

              {/* Upgrade banner for locked sections */}
              {!unlocked && (
                <div style={{ padding: '12px 16px', background: `${section.color}08`, border: `1px solid ${section.color}20`, borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, color: TEXT2 }}>
                    <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Requires <strong style={{ color: section.color }}>{PLAN_LABELS[section.plan]}</strong> to unlock all {section.tools.length} agents below.
                  </div>
                  <button onClick={() => setUpgradeFor({ requiredPlan: section.plan, featureTitle: section.label })}
                    style={{ padding: '7px 14px', background: `${section.color}15`, border: `1px solid ${section.color}40`, borderRadius: 8, color: section.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Upgrade to {PLAN_LABELS[section.plan]} →
                  </button>
                </div>
              )}

              {/* Tools grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {section.tools.map((tool, ti) => (
                  <ToolCard
                    key={tool.label}
                    tool={tool}
                    i={ti}
                    locked={!unlocked}
                    sectionColor={section.color}
                    sectionPlan={section.plan}
                    onUpgrade={() => setUpgradeFor({ requiredPlan: section.plan, featureTitle: tool.label })}
                    onClick={() => handleToolClick(tool, section.plan)}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}

      </div>

      {upgradeFor && (
        <UpgradeModal
          requiredPlan={upgradeFor.requiredPlan}
          featureTitle={upgradeFor.featureTitle}
          onClose={() => setUpgradeFor(null)}
        />
      )}
    </SidebarLayout>
  )
}

function ToolCard({ tool, i, locked, sectionColor, onClick }) {
  const [hovered, setHovered] = useState(false)
  const Icon = tool.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: locked ? 'rgba(255,255,255,0.02)' : CARD,
        border: `1px solid ${hovered ? (locked ? sectionColor + '40' : tool.color + '55') : BORDER}`,
        borderRadius: 14,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered && !locked ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered && !locked ? `0 12px 32px ${tool.color}12` : 'none',
        opacity: locked ? 0.65 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {locked && (
        <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', background: `${sectionColor}18`, border: `1px solid ${sectionColor}35`, borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Lock size={9} color={sectionColor} />
        </div>
      )}
      <div style={{ width: 38, height: 38, borderRadius: 10, background: locked ? 'rgba(255,255,255,0.04)' : `${tool.color}18`, border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : tool.color + '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: locked ? TEXT3 : tool.color, marginBottom: 12 }}>
        {locked ? <Lock size={16} color={TEXT3} /> : <Icon size={18} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: locked ? TEXT3 : TEXT, marginBottom: 5, lineHeight: 1.3 }}>{tool.label}</div>
      <div style={{ fontSize: 11, color: locked ? 'rgba(240,235,224,0.25)' : TEXT2, lineHeight: 1.55, marginBottom: 12 }}>{tool.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: locked ? sectionColor : (hovered ? tool.color : TEXT3), fontSize: 11, fontWeight: 600, transition: 'color 0.15s' }}>
        {locked ? <><Lock size={10} /> Upgrade to unlock</> : <>Launch <ArrowRight size={11} /></>}
      </div>
    </motion.div>
  )
}
