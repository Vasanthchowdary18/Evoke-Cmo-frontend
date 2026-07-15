import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, Target, Calendar, Search, Mail, Users, BarChart2, Briefcase,
  ShoppingCart, Sparkles, Activity, Image, Film, Monitor, Share2, Layers,
  Zap, ChevronLeft, ArrowRight, BookOpen, Inbox, LineChart, Globe, Megaphone,
  PenTool, Video, Camera, Box, Layout, Crosshair, UserCheck, Sliders, FileText,
  Shield, Play, DollarSign, Bell, Send, RefreshCw, MapPin, FileCode, Lock,
} from 'lucide-react'
import UpgradeModal from '../components/UpgradeModal.jsx'
import SidebarLayout from '../components/SidebarLayout.jsx'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { PLANS, PLAN_LABELS } from '../lib/planGate.js'

const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Compare plan tiers directly (not feature keys)
function planAllows(userPlan, requiredPlan) {
  if (IS_DEV) return true
  if (!requiredPlan || requiredPlan === 'free') return true
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

const BG   = '#0e0c09'
const CARD = '#141210'
const GOLD = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.32)'
const FONT  = "'Inter','Syne',sans-serif"

// requiredPlan: which plan first unlocks this tool
const HUB_CONFIG = {
  strategy: {
    badge: 'MARKETING STRATEGY AGENT',
    title: 'Marketing Strategy',
    subtitle: 'Generate annual, quarterly, and monthly marketing plans with AI — channel budgets, KPIs, and full roadmaps.',
    accentColor: '#c8973e',
    tools: [
      { label: 'Marketing Strategy Planner', badge: 'STRATEGY',  desc: 'Annual, quarterly & monthly plans with channel budgets, KPIs, and milestone roadmaps.',           icon: <TrendingUp size={20}/>, color: '#c8973e', route: '/strategy',                  requiredPlan: 'free' },
      { label: 'Growth Strategy',            badge: 'GROWTH',    desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.',                          icon: <Zap size={20}/>,       color: '#f97316', route: '/campaign/growth_strategy',   requiredPlan: 'free' },
      { label: 'Competitive Intel',          badge: 'INTEL',     desc: 'SWOT analysis, competitor profiles, pricing analysis, and positioning.',                          icon: <Target size={20}/>,    color: '#ef4444', route: '/campaign/competitive_intel', requiredPlan: 'free' },
      { label: 'Funnel & CRO Audit',         badge: 'CRO',       desc: 'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.',                   icon: <Activity size={20}/>,  color: '#14b8a6', route: '/campaign/funnel_cro',        requiredPlan: 'free' },
      { label: 'Executive Report',           badge: 'NEW',       desc: 'Board-ready marketing report — ROI, ROAS, channel performance, risks, and strategic recommendations.', icon: <BarChart2 size={20}/>, color: '#c8973e', route: '/executive-report', isNew: true, requiredPlan: 'package-b' },
      { label: 'Analytics Report',           badge: 'ANALYTICS', desc: 'Executive KPI summary, channel breakdown, and data-driven recommendations.',                      icon: <BarChart2 size={20}/>, color: '#f59e0b', route: '/campaign/analytics_report',  requiredPlan: 'free' },
      { label: 'Sales Enablement',           badge: 'SALES',     desc: 'Sales deck, elevator pitch, objection handling, and cold-call scripts.',                          icon: <Briefcase size={20}/>, color: '#84cc16', route: '/campaign/sales_enablement',  requiredPlan: 'free' },
    ],
  },

  audience: {
    badge: 'AUDIENCE INTELLIGENCE',
    title: 'Audience Intelligence',
    subtitle: 'Build precision audience segments, track trends, and manage your CRM — all powered by AI.',
    accentColor: '#a855f7',
    tools: [
      { label: 'Audience Builder', badge: 'SEGMENTS',      desc: 'Build 4 precision audience segments with demographics, interests, and ad-ready configurations for Meta & Google.', icon: <Users size={20}/>,     color: '#a855f7', route: '/audience-builder', requiredPlan: 'package-b' },
      { label: 'Trend Analysis',   badge: 'TRENDS',        desc: 'Real-time trend tracking across your market, keywords, and competitor movements.',                                  icon: <TrendingUp size={20}/>, color: '#06b6d4', route: '/trends',           requiredPlan: 'package-b' },
      { label: 'CRM & Lifecycle',  badge: 'CRM',           desc: 'Manage your customer lifecycle, segment contacts, and automate follow-ups.',                                        icon: <UserCheck size={20}/>, color: '#10b981', route: '/crm',               requiredPlan: 'package-b' },
      { label: 'Lead Scoring',     badge: 'LEAD SCORE',    desc: 'AI-powered lead scoring from CRM and segment data — rank, prioritise, and route high-intent leads to sales.',      icon: <Crosshair size={20}/>, color: '#f97316', route: '/crm', requiredPlan: 'package-b' },
    ],
  },

  content: {
    badge: 'CONTENT GENERATION AGENT',
    title: 'Content Generation',
    subtitle: 'Generate captions, scripts, blogs, emails, and full content plans — matched to your brand voice.',
    accentColor: '#10b981',
    tools: [
      { label: 'Blog Article Generator',    badge: 'NEW',      desc: 'Full SEO-optimised blog post — H1, H2 sections, meta title, meta description, intro and CTA.',         icon: <FileText size={20}/>, color: '#6366f1', route: '/content-gen',             isNew: true, requiredPlan: 'package-a' },
      { label: 'Landing Page Copy',         badge: 'NEW',      desc: 'Complete landing page — hero headline, benefits, testimonials, FAQ, and final CTA.',                    icon: <Globe size={20}/>,    color: '#10b981', route: '/content-gen',             isNew: true, requiredPlan: 'package-a' },
      { label: 'Newsletter Generator',      badge: 'NEW',      desc: 'Ready-to-send email — subject line, preview text, full body sections, and sign-off.',                   icon: <Mail size={20}/>,     color: '#f59e0b', route: '/content-gen',             isNew: true, requiredPlan: 'package-a' },
      { label: 'Copywriting Agent',         badge: 'COPY',     desc: 'Ad copy, taglines, slogans, brand voice, product names, and value propositions — 5 modes.',             icon: <PenTool size={20}/>,  color: '#ec4899', route: '/copywriting',                        requiredPlan: 'package-a' },
      { label: 'Caption Suite',             badge: 'CAPTIONS', desc: 'AI-generated captions for every platform — Instagram, LinkedIn, TikTok, Twitter, and more.',            icon: <PenTool size={20}/>,  color: '#10b981', route: '/caption-suite',                        requiredPlan: 'package-a' },
      { label: 'Reel Scripts',              badge: 'SCRIPTS',  desc: 'Hook, body, and CTA scripts for short-form videos — Reels, TikTok, and YouTube Shorts.',                icon: <Sliders size={20}/>,  color: '#f59e0b', route: '/reel-scripts',                         requiredPlan: 'package-a' },
      { label: 'Content Calendar',          badge: 'CALENDAR', desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags.',                     icon: <Calendar size={20}/>, color: '#3b82f6', route: '/campaign/content_calendar',             requiredPlan: 'package-a' },
      { label: 'Email Drip Campaign',       badge: 'EMAIL',    desc: '5-email nurture sequence with subject lines, preheaders, and CTAs.',                                    icon: <Mail size={20}/>,     color: '#8b5cf6', route: '/campaign/email_drip',                   requiredPlan: 'free' },
      { label: 'Email Marketing Agent',     badge: 'EMAIL AI', desc: 'Full AI email campaigns — broadcast, welcome sequences, nurture flows, and re-engagement series.',      icon: <Send size={20}/>,     color: '#a855f7', route: '/email-marketing',                       requiredPlan: 'package-b' },
      { label: 'SEO Content Generator',     badge: 'SEO',      desc: 'Keyword research, content briefs, on-page optimisation and SEO blog outlines to rank on Google.',       icon: <Search size={20}/>,   color: '#3b82f6', route: '/seo-agent',                             requiredPlan: 'package-b' },
    ],
  },

  creative: {
    badge: 'CREATIVE ASSET AGENT',
    title: 'Creative Assets',
    subtitle: 'AI-generated images, banners, lifestyle photos, and product visuals — ready for ads and social.',
    accentColor: '#ec4899',
    tools: [
      { label: 'Product Image Angles', badge: 'IMAGES',    desc: 'Generate multiple product angles — front, side, top, and lifestyle on clean backgrounds.',    icon: <Camera size={20}/>,     color: '#f97316', route: '/image-angles',    requiredPlan: 'package-a' },
      { label: '360° Product Video',   badge: '360°',      desc: 'Smooth rotating product showcase video for e-commerce and ads.',                               icon: <Video size={20}/>,      color: '#f97316', route: '/image-360',       requiredPlan: 'package-a' },
      { label: 'Lifestyle Photos',     badge: 'LIFESTYLE', desc: 'Product in real-life settings — homes, outdoors, events, and social contexts.',               icon: <Image size={20}/>,      color: '#10b981', route: '/image-lifestyle', requiredPlan: 'package-a' },
      { label: '3D Product Images',    badge: '3D',        desc: 'Photorealistic 3D renders of your product for premium campaigns.',                             icon: <Box size={20}/>,        color: '#8b5cf6', route: '/image-3d',        requiredPlan: 'package-b' },
      { label: 'SEO Product Images',   badge: 'SEO',       desc: 'Optimised product images with keyword-rich alt text for Google Shopping.',                    icon: <Search size={20}/>,     color: '#06b6d4', route: '/image-seo',       requiredPlan: 'package-a' },
      { label: 'Meta Ads Boost',       badge: 'ADS',       desc: 'Turn your best creative into high-converting Meta ad sets with AI copy.',                     icon: <DollarSign size={20}/>, color: '#c8973e', route: '/meta-ads-boost',  requiredPlan: 'package-c' },
    ],
  },

  video: {
    badge: 'VIDEO GENERATION AGENT',
    title: 'Video Generation',
    subtitle: 'Generate promo videos, product reels, ad creatives, and event videos — script to visual in seconds.',
    accentColor: '#ef4444',
    tools: [
      { label: 'Promo Video',        badge: 'PROMO',       desc: 'High-energy promotional video with motion, text overlays, and brand colours.',                   icon: <Play size={20}/>,       color: '#ef4444', route: '/video-gen', requiredPlan: 'package-a' },
      { label: 'Product Showcase',   badge: 'PRODUCT',     desc: 'Clean product-focused video with close-ups, features, and CTA.',                                 icon: <Film size={20}/>,       color: '#f97316', route: '/video-gen', requiredPlan: 'package-a' },
      { label: 'Social Reel',        badge: 'REEL',        desc: 'Short-form vertical video for Instagram Reels, TikTok, and YouTube Shorts.',                     icon: <Sparkles size={20}/>,   color: '#ec4899', route: '/video-gen', requiredPlan: 'package-a' },
      { label: 'Ad Creative Video',  badge: 'AD',          desc: 'Conversion-optimised video ad with hook, offer, and CTA for paid campaigns.',                    icon: <DollarSign size={20}/>, color: '#c8973e', route: '/video-gen', requiredPlan: 'package-a' },
      { label: 'Event Video',        badge: 'EVENT',       desc: 'Event highlight reel or promotional video for upcoming or past events.',                         icon: <Calendar size={20}/>,   color: '#10b981', route: '/video-gen', requiredPlan: 'package-a' },
      { label: 'Educational Video',  badge: 'EDUCATIONAL', desc: 'Step-by-step tutorial or explainer video — script, visuals, voiceover, and brand review included.', icon: <BookOpen size={20}/>,  color: '#3b82f6', route: '/video-gen', requiredPlan: 'package-a' },
    ],
  },

  governance: {
    badge: 'BRAND GOVERNANCE AGENT',
    title: 'Brand Governance',
    subtitle: 'Maintain brand consistency with a standards database, approval routing, and live conformance auditing.',
    accentColor: '#06b6d4',
    tools: [
      { label: 'Brand Knowledge Base', badge: 'BRAND KB',   desc: '5-pillar brand standards database — voice, visuals, messaging, audience, and values.',        icon: <BookOpen size={20}/>, color: '#c8973e', route: '/brand-kb',        requiredPlan: 'package-a' },
      { label: 'Brand Governance',     badge: 'GOVERNANCE', desc: 'Approved / Flagged / Rejected routing with conformance review and live audit log.',           icon: <Shield size={20}/>,   color: '#06b6d4', route: '/brand-governance', requiredPlan: 'package-b' },
      { label: 'Approval Queue',       badge: 'APPROVALS',  desc: 'Review and approve content before it goes live — with brand rules enforced.',                 icon: <Bell size={20}/>,     color: '#8b5cf6', route: '/queue',            requiredPlan: 'package-b' },
    ],
  },

  seo: {
    badge: 'SEO AGENT',
    title: 'SEO Agent',
    subtitle: 'Keyword research, tech audit, competitor analysis, content brief, on-page optimisation and ranking projections — all in one AI run.',
    accentColor: '#3b82f6',
    tools: [
      { label: 'SEO Strategy Generator', badge: 'NEW',      desc: 'Full SEO package — keyword research, tech audit, competitor gaps, content brief and ranking projections.', icon: <Search size={20}/>,    color: '#3b82f6', route: '/seo-agent', isNew: true, requiredPlan: 'package-b' },
      { label: 'Keyword Research',        badge: 'KEYWORDS', desc: 'Primary, secondary, long-tail and LSI keywords with volume, difficulty and intent.',                     icon: <Target size={20}/>,    color: '#c8973e', route: '/seo-agent',              requiredPlan: 'package-b' },
      { label: 'Technical SEO Audit',     badge: 'AUDIT',    desc: 'Site-level issues with priority scoring and exact fix instructions.',                                     icon: <FileCode size={20}/>,  color: '#f59e0b', route: '/seo-agent',              requiredPlan: 'package-b' },
      { label: 'Competitor Analysis',     badge: 'COMPETE',  desc: 'Top competitors, content gaps, opportunities and backlink requirements.',                                 icon: <BarChart2 size={20}/>, color: '#ef4444', route: '/seo-agent',              requiredPlan: 'package-b' },
      { label: 'Local SEO',               badge: 'LOCAL',    desc: 'Google Business tips, local keywords and citation site recommendations.',                                 icon: <MapPin size={20}/>,    color: '#10b981', route: '/seo-agent',              requiredPlan: 'package-b' },
      { label: 'On-Page Optimisation',    badge: 'ON-PAGE',  desc: 'Title tags, meta descriptions, URL slugs, alt text and schema markup.',                                  icon: <Globe size={20}/>,     color: '#a855f7', route: '/seo-agent',              requiredPlan: 'package-b' },
    ],
  },

  email: {
    badge: 'EMAIL MARKETING AGENT',
    title: 'Email Marketing',
    subtitle: 'Generate full email campaigns — subject lines, body copy, CTAs, send time optimisation, and performance predictions.',
    accentColor: '#a855f7',
    tools: [
      { label: 'Email Campaign Generator', badge: 'NEW',      desc: 'Generate complete email campaigns with subject lines, body copy, CTA and predicted open/click rates.', icon: <Mail size={20}/>,      color: '#a855f7', route: '/email-marketing', isNew: true, requiredPlan: 'package-b' },
      { label: 'Broadcast Email',          badge: 'BROADCAST', desc: 'One-time send to your full subscriber list with AI-optimised subject lines.',                         icon: <Send size={20}/>,      color: '#c8973e', route: '/email-marketing',              requiredPlan: 'package-b' },
      { label: 'Welcome Sequence',         badge: 'WELCOME',   desc: 'Automated onboarding sequence for new subscribers — 3 to 5 email flow.',                             icon: <Sparkles size={20}/>,  color: '#10b981', route: '/email-marketing',              requiredPlan: 'package-b' },
      { label: 'Nurture Campaign',         badge: 'NURTURE',   desc: 'Move leads down the funnel with value-driven email sequences.',                                       icon: <TrendingUp size={20}/>, color: '#3b82f6', route: '/email-marketing',             requiredPlan: 'package-b' },
      { label: 'Re-Engage Campaign',       badge: 'RE-ENGAGE', desc: 'Win back dormant subscribers with personalised win-back sequences.',                                  icon: <RefreshCw size={20}/>, color: '#f59e0b', route: '/email-marketing',              requiredPlan: 'package-b' },
      { label: 'Abandon Cart Email',       badge: 'ABANDON',   desc: 'Recover abandoned carts with urgency-driven follow-up emails.',                                       icon: <ShoppingCart size={20}/>, color: '#ef4444', route: '/email-marketing',           requiredPlan: 'package-b' },
    ],
  },

  abtesting: {
    badge: 'A/B TESTING AGENT',
    title: 'A/B Testing Framework',
    subtitle: 'Design experiments, build control vs test variants, run statistical significance analysis, and deploy the winning version.',
    accentColor: '#f59e0b',
    tools: [
      { label: 'A/B Test Generator',    badge: 'NEW',      desc: 'Full experiment plan — hypothesis, Variant A vs B, traffic split, duration, and statistical significance engine.', icon: <Sliders size={20}/>,  color: '#f59e0b', route: '/ab-testing', isNew: true, requiredPlan: 'package-b' },
      { label: 'Copy / Headline Test',  badge: 'COPY',     desc: 'Test subject lines, CTAs, and headlines to find the best-performing version.',                                    icon: <FileText size={20}/>, color: '#a855f7', route: '/ab-testing',              requiredPlan: 'package-b' },
      { label: 'Creative Test',         badge: 'CREATIVE', desc: 'Compare images, layouts, and visual formats for higher engagement.',                                             icon: <Image size={20}/>,    color: '#3b82f6', route: '/ab-testing',              requiredPlan: 'package-b' },
      { label: 'Audience Segment Test', badge: 'AUDIENCE', desc: 'Test different audience groups and identify which converts best.',                                               icon: <Users size={20}/>,    color: '#10b981', route: '/ab-testing',              requiredPlan: 'package-b' },
      { label: 'Channel Format Test',   badge: 'CHANNEL',  desc: 'Email vs SMS vs social — find the highest-converting channel for your campaign.',                               icon: <BarChart2 size={20}/>, color: '#ef4444', route: '/ab-testing',             requiredPlan: 'package-b' },
      { label: 'Winner Deployment',     badge: 'DEPLOY',   desc: 'Auto-deploy the winning variant to 100% of traffic with a single action.',                                      icon: <Play size={20}/>,     color: '#c8973e', route: '/ab-testing',              requiredPlan: 'package-b' },
    ],
  },

  execution: {
    badge: 'MARKETING EXECUTION AGENT',
    title: 'Marketing Execution',
    subtitle: 'Deploy campaigns across 7 channels — Meta, LinkedIn, TikTok, Google, Email, SMS, and Marketplace.',
    accentColor: '#84cc16',
    tools: [
      { label: 'Marketing Execution',       badge: 'EXECUTE',     desc: '7-channel deployment — Meta, LinkedIn, TikTok, Google, Email, SMS, Marketplace with scheduler and budget.', icon: <Share2 size={20}/>,    color: '#84cc16', route: '/execution',       requiredPlan: 'package-c' },
      { label: 'Marketing Attribution',     badge: 'ATTRIBUTION', desc: 'Track budget, KPIs, and audience performance across SMS, Paid Ads, Social, and Posts — full multi-channel attribution model.', icon: <Monitor size={20}/>,   color: '#f97316', route: '/execution',       requiredPlan: 'package-c' },
      { label: 'Social Inbox',              badge: 'INBOX',       desc: 'Manage all your social messages, comments, and DMs in one unified inbox.',                                   icon: <Inbox size={20}/>,     color: '#06b6d4', route: '/inbox',            requiredPlan: 'package-b' },
      { label: 'Post Content',              badge: 'PUBLISH',     desc: 'Schedule and publish content directly to your connected social platforms.',                                  icon: <Layers size={20}/>,    color: '#3b82f6', route: '/post-content',     requiredPlan: 'package-b' },
      { label: 'Analytics Dashboard',       badge: 'ANALYTICS',   desc: 'Live KPI tracking across all channels — reach, engagement, conversions, and ROI.',                          icon: <LineChart size={20}/>,  color: '#f59e0b', route: '/analytics',        requiredPlan: 'package-b' },
      { label: 'Team Management',           badge: 'TEAM',        desc: 'Assign roles, manage access, and collaborate with your marketing team.',                                    icon: <Users size={20}/>,     color: '#a855f7', route: '/team',             requiredPlan: 'package-c' },
      { label: 'Partner Sharing',           badge: 'PARTNERS',    desc: 'Share campaigns and assets with partners, agencies, and collaborators.',                                    icon: <Globe size={20}/>,     color: '#10b981', route: '/partner-sharing',  requiredPlan: 'package-c' },
    ],
  },
}

const PLAN_BADGE_COLORS = {
  'package-a': '#10b981',
  'package-b': '#c8973e',
  'package-c': '#a855f7',
}

export default function AgentHub() {
  const { agent } = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [hovered,    setHovered]    = useState(null)
  const [upgradeFor, setUpgradeFor] = useState(null) // { requiredPlan, featureTitle }

  const { plan: userPlan } = useUserPlan()

  const handleBack = () => {
    const { backTo, backScroll } = location.state || {}
    if (backTo) {
      navigate(backTo)
      if (backScroll) setTimeout(() => document.getElementById(backScroll)?.scrollIntoView({ behavior: 'smooth' }), 150)
    } else {
      navigate(-1)
    }
  }

  const config = HUB_CONFIG[agent]
  if (!config) { navigate(-1); return null }

  const handleToolClick = (tool) => {
    if (!planAllows(userPlan, tool.requiredPlan)) {
      setUpgradeFor({ requiredPlan: tool.requiredPlan, featureTitle: tool.label })
    } else {
      navigate(tool.route)
    }
  }

  return (
    <SidebarLayout bg={BG}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Back */}
        <button
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(240,235,224,0.75)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 36, padding: '8px 14px', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f0ebe0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(240,235,224,0.75)' }}
        >
          <ChevronLeft size={16} /> Back to Agents
        </button>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: `${config.accentColor}18`, border: `1px solid ${config.accentColor}35`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: config.accentColor, letterSpacing: '0.1em', marginBottom: 16 }}>
            {config.badge}
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif" }}>
            {config.title}
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, maxWidth: 520 }}>
            {config.subtitle}
          </p>
        </div>

        {/* Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {config.tools.map((tool, i) => {
            const locked = !planAllows(userPlan, tool.requiredPlan)
            const planColor = PLAN_BADGE_COLORS[tool.requiredPlan] || GOLD

            return (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => handleToolClick(tool)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: CARD,
                  border: `1px solid ${hovered === i ? (locked ? planColor + '55' : tool.color + '55') : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16,
                  padding: '22px 22px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  transform: hovered === i ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hovered === i ? `0 16px 40px ${locked ? planColor : tool.color}14` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: locked ? 0.75 : 1,
                }}
              >
                {/* Lock overlay tint */}
                {locked && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,9,0.35)', borderRadius: 16, pointerEvents: 'none', zIndex: 1 }} />
                )}

                {/* Plan badge for locked tools */}
                {locked && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px',
                    background: `${planColor}18`, border: `1px solid ${planColor}40`,
                    borderRadius: 100,
                  }}>
                    <Lock size={9} color={planColor} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: planColor, letterSpacing: '0.06em' }}>
                      {PLAN_LABELS[tool.requiredPlan]}
                    </span>
                  </div>
                )}

                {/* Icon + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${tool.color}18`, border: `1px solid ${tool.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: locked ? TEXT3 : tool.color, flexShrink: 0 }}>
                    {locked ? <Lock size={18} color={TEXT3} /> : tool.icon}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: locked ? TEXT3 : tool.color, letterSpacing: '0.08em', background: locked ? 'rgba(255,255,255,0.05)' : `${tool.color}15`, border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : tool.color + '30'}`, padding: '3px 9px', borderRadius: 100 }}>
                    {tool.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: locked ? TEXT3 : TEXT, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  {tool.label}
                </h3>

                <p style={{ fontSize: 12, color: locked ? TEXT3 : TEXT2, lineHeight: 1.65, marginBottom: 16 }}>
                  {tool.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: locked ? planColor : tool.color, fontSize: 12, fontWeight: 600 }}>
                  {locked
                    ? <><Lock size={11} /> Upgrade to {PLAN_LABELS[tool.requiredPlan]}</>
                    : <><span>Launch tool</span><ArrowRight size={13} /></>
                  }
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Upgrade modal */}
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
