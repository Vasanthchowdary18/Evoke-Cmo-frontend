import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, Target, Calendar, Search, Mail, Users, BarChart2, Briefcase,
  ShoppingCart, Sparkles, Activity, Image, Film, Monitor, Share2, Layers,
  Zap, ChevronLeft, ArrowRight, BookOpen, Inbox, LineChart, Globe, Megaphone,
  PenTool, Video, Camera, Box, Layout, Crosshair, UserCheck, Sliders, FileText,
  Shield, Play, DollarSign, Bell
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const BG   = '#0e0c09'
const CARD = '#141210'
const GOLD = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.32)'
const FONT  = "'Inter','Syne',sans-serif"

const HUB_CONFIG = {
  strategy: {
    badge: 'MARKETING STRATEGY AGENT',
    title: 'Marketing Strategy',
    subtitle: 'Generate annual, quarterly, and monthly marketing plans with AI — channel budgets, KPIs, and full roadmaps.',
    accentColor: '#c8973e',
    tools: [
      { label: 'Marketing Strategy Planner', badge: 'STRATEGY', desc: 'Annual, quarterly & monthly plans with channel budgets, KPIs, and milestone roadmaps.', icon: <TrendingUp size={20}/>, color: '#c8973e', route: '/strategy' },
      { label: 'Growth Strategy', badge: 'GROWTH', desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.', icon: <Zap size={20}/>, color: '#f97316', route: '/campaign/growth_strategy' },
      { label: 'Competitive Intel', badge: 'INTEL', desc: 'SWOT analysis, competitor profiles, pricing analysis, and positioning.', icon: <Target size={20}/>, color: '#ef4444', route: '/campaign/competitive_intel' },
      { label: 'Funnel & CRO Audit', badge: 'CRO', desc: 'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.', icon: <Activity size={20}/>, color: '#14b8a6', route: '/campaign/funnel_cro' },
      { label: 'Executive Report', badge: 'NEW', desc: 'Board-ready marketing report — ROI, ROAS, channel performance, risks, and strategic recommendations.', icon: <BarChart2 size={20}/>, color: '#c8973e', route: '/executive-report', isNew: true },
      { label: 'Analytics Report', badge: 'ANALYTICS', desc: 'Executive KPI summary, channel breakdown, and data-driven recommendations.', icon: <BarChart2 size={20}/>, color: '#f59e0b', route: '/campaign/analytics_report' },
      { label: 'Sales Enablement', badge: 'SALES', desc: 'Sales deck, elevator pitch, objection handling, and cold-call scripts.', icon: <Briefcase size={20}/>, color: '#84cc16', route: '/campaign/sales_enablement' },
    ],
  },

  audience: {
    badge: 'AUDIENCE INTELLIGENCE',
    title: 'Audience Intelligence',
    subtitle: 'Build precision audience segments, track trends, and manage your CRM — all powered by AI.',
    accentColor: '#a855f7',
    tools: [
      { label: 'Trend Analysis', badge: 'TRENDS', desc: 'Real-time trend tracking across your market, keywords, and competitor movements.', icon: <TrendingUp size={20}/>, color: '#06b6d4', route: '/trends' },
      { label: 'Audience Builder', badge: 'SEGMENTS', desc: 'Build 4 precision audience segments with demographics, interests, and ad-ready configurations for Meta & Google.', icon: <Users size={20}/>, color: '#a855f7', route: '/audience-builder' },
      { label: 'CRM & Lifecycle', badge: 'CRM', desc: 'Manage your customer lifecycle, segment contacts, and automate follow-ups.', icon: <UserCheck size={20}/>, color: '#10b981', route: '/crm' },
    ],
  },

  content: {
    badge: 'CONTENT GENERATION AGENT',
    title: 'Content Generation',
    subtitle: 'Generate captions, scripts, blogs, emails, and full content plans — matched to your brand voice.',
    accentColor: '#10b981',
    tools: [
      { label: 'Blog Article Generator', badge: 'NEW', desc: 'Full SEO-optimised blog post — H1, H2 sections, meta title, meta description, intro and CTA.', icon: <FileText size={20}/>, color: '#6366f1', route: '/content-gen', isNew: true },
      { label: 'Landing Page Copy', badge: 'NEW', desc: 'Complete landing page — hero headline, benefits, testimonials, FAQ, and final CTA.', icon: <Globe size={20}/>, color: '#10b981', route: '/content-gen', isNew: true },
      { label: 'Newsletter Generator', badge: 'NEW', desc: 'Ready-to-send email — subject line, preview text, full body sections, and sign-off.', icon: <Mail size={20}/>, color: '#f59e0b', route: '/content-gen', isNew: true },
      { label: 'Copywriting Agent', badge: 'NEW', desc: 'Ad copy, taglines, slogans, brand voice, product names, and value propositions — 5 modes.', icon: <PenTool size={20}/>, color: '#ec4899', route: '/copywriting', isNew: true },
      { label: 'Caption Suite', badge: 'CAPTIONS', desc: 'AI-generated captions for every platform — Instagram, LinkedIn, TikTok, Twitter, and more.', icon: <PenTool size={20}/>, color: '#10b981', route: '/caption-suite' },
      { label: 'Reel Scripts', badge: 'SCRIPTS', desc: 'Hook, body, and CTA scripts for short-form videos — Reels, TikTok, and YouTube Shorts.', icon: <Sliders size={20}/>, color: '#f59e0b', route: '/reel-scripts' },
      { label: 'Content Calendar', badge: 'CALENDAR', desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags.', icon: <Calendar size={20}/>, color: '#3b82f6', route: '/campaign/content_calendar' },
      { label: 'Email Drip Campaign', badge: 'EMAIL', desc: '5-email nurture sequence with subject lines, preheaders, and CTAs.', icon: <Mail size={20}/>, color: '#8b5cf6', route: '/campaign/email_drip' },
    ],
  },

  creative: {
    badge: 'CREATIVE ASSET AGENT',
    title: 'Creative Assets',
    subtitle: 'AI-generated images, banners, lifestyle photos, and product visuals — ready for ads and social.',
    accentColor: '#ec4899',
    tools: [
      { label: 'Creative Asset Generator', badge: 'NEW', desc: 'Generate brand-approved images, graphics, social creatives, display ads and infographics from a campaign brief.', icon: <Sparkles size={20}/>, color: '#ec4899', route: '/creative-asset', isNew: true },
      { label: 'Product Image Angles', badge: 'IMAGES', desc: 'Generate multiple product angles — front, side, top, and lifestyle on clean backgrounds.', icon: <Camera size={20}/>, color: '#f97316', route: '/image-angles' },
      { label: '360° Product Video', badge: '360°', desc: 'Smooth rotating product showcase video for e-commerce and ads.', icon: <Video size={20}/>, color: '#f97316', route: '/image-360' },
      { label: 'Lifestyle Photos', badge: 'LIFESTYLE', desc: 'Product in real-life settings — homes, outdoors, events, and social contexts.', icon: <Image size={20}/>, color: '#10b981', route: '/image-lifestyle' },
      { label: '3D Product Images', badge: '3D', desc: 'Photorealistic 3D renders of your product for premium campaigns.', icon: <Box size={20}/>, color: '#8b5cf6', route: '/image-3d' },
      { label: 'SEO Product Images', badge: 'SEO', desc: 'Optimised product images with keyword-rich alt text for Google Shopping.', icon: <Search size={20}/>, color: '#06b6d4', route: '/image-seo' },
      { label: 'Meta Ads Boost', badge: 'ADS', desc: 'Turn your best creative into high-converting Meta ad sets with AI copy.', icon: <DollarSign size={20}/>, color: '#c8973e', route: '/meta-ads-boost' },
    ],
  },

  video: {
    badge: 'VIDEO GENERATION AGENT',
    title: 'Video Generation',
    subtitle: 'Generate promo videos, product reels, ad creatives, and event videos — script to visual in seconds.',
    accentColor: '#ef4444',
    tools: [
      { label: 'Promo Video',       badge: 'PROMO',   desc: 'High-energy promotional video with motion, text overlays, and brand colours.', icon: <Play size={20}/>,      color: '#ef4444', route: '/video-gen', videoType: 'promo'   },
      { label: 'Product Showcase',  badge: 'PRODUCT', desc: 'Clean product-focused video with close-ups, features, and CTA.',                icon: <Film size={20}/>,      color: '#f97316', route: '/video-gen', videoType: 'product' },
      { label: 'Social Reel',       badge: 'REEL',    desc: 'Short-form vertical video for Instagram Reels, TikTok, and YouTube Shorts.',     icon: <Sparkles size={20}/>,  color: '#ec4899', route: '/video-gen', videoType: 'reel'    },
      { label: 'Ad Creative Video', badge: 'AD',      desc: 'Conversion-optimised video ad with hook, offer, and CTA for paid campaigns.',    icon: <DollarSign size={20}/>, color: '#c8973e', route: '/video-gen', videoType: 'ad'      },
      { label: 'Event Video',       badge: 'EVENT',   desc: 'Event highlight reel or promotional video for upcoming or past events.',         icon: <Calendar size={20}/>,  color: '#10b981', route: '/video-gen', videoType: 'event'   },
    ],
  },

  governance: {
    badge: 'BRAND GOVERNANCE AGENT',
    title: 'Brand Governance',
    subtitle: 'Maintain brand consistency with a standards database, approval routing, and live conformance auditing.',
    accentColor: '#06b6d4',
    tools: [
      { label: 'Brand Knowledge Base', badge: 'BRAND KB', desc: '5-pillar brand standards database — voice, visuals, messaging, audience, and values.', icon: <BookOpen size={20}/>, color: '#c8973e', route: '/brand-kb' },
      { label: 'Brand Governance', badge: 'GOVERNANCE', desc: 'Approved / Flagged / Rejected routing with conformance review and live audit log.', icon: <Shield size={20}/>, color: '#06b6d4', route: '/brand-governance' },
      { label: 'Approval Queue', badge: 'APPROVALS', desc: 'Review and approve content before it goes live — with brand rules enforced.', icon: <Bell size={20}/>, color: '#8b5cf6', route: '/queue' },
    ],
  },

  execution: {
    badge: 'MARKETING EXECUTION AGENT',
    title: 'Marketing Execution',
    subtitle: 'Deploy campaigns across 7 channels — Meta, LinkedIn, TikTok, Google, Email, SMS, and Marketplace.',
    accentColor: '#84cc16',
    tools: [
      { label: 'Marketing Execution', badge: 'EXECUTE', desc: '7-channel deployment — Meta, LinkedIn, TikTok, Google, Email, SMS, Marketplace with scheduler and budget.', icon: <Share2 size={20}/>, color: '#84cc16', route: '/execution' },
      { label: 'Social Inbox', badge: 'INBOX', desc: 'Manage all your social messages, comments, and DMs in one unified inbox.', icon: <Inbox size={20}/>, color: '#06b6d4', route: '/inbox' },
      { label: 'Post Content', badge: 'PUBLISH', desc: 'Schedule and publish content directly to your connected social platforms.', icon: <Layers size={20}/>, color: '#3b82f6', route: '/post-content' },
      { label: 'Analytics Dashboard', badge: 'ANALYTICS', desc: 'Live KPI tracking across all channels — reach, engagement, conversions, and ROI.', icon: <LineChart size={20}/>, color: '#f59e0b', route: '/analytics' },
      { label: 'Team Management', badge: 'TEAM', desc: 'Assign roles, manage access, and collaborate with your marketing team.', icon: <Users size={20}/>, color: '#a855f7', route: '/team' },
      { label: 'Partner Sharing', badge: 'PARTNERS', desc: 'Share campaigns and assets with partners, agencies, and collaborators.', icon: <Globe size={20}/>, color: '#10b981', route: '/partner-sharing' },
    ],
  },
}

export default function AgentHub() {
  const { agent } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(null)

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

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 32px 80px' }}>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {config.tools.map((tool, i) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(tool.route, { state: { from: `/hub/${agent}`, fromLabel: config.title, ...(tool.videoType && { videoType: tool.videoType }) } })}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: CARD,
                border: `1px solid ${hovered === i ? tool.color + '55' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16,
                padding: '22px 22px 20px',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                transform: hovered === i ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered === i ? `0 16px 40px ${tool.color}14` : 'none',
              }}
            >
              {/* Icon + badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${tool.color}18`, border: `1px solid ${tool.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool.color, flexShrink: 0 }}>
                  {tool.icon}
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: tool.color, letterSpacing: '0.08em', background: `${tool.color}15`, border: `1px solid ${tool.color}30`, padding: '3px 9px', borderRadius: 100 }}>
                  {tool.badge}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {tool.label}
              </h3>

              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, marginBottom: 16 }}>
                {tool.desc}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: tool.color, fontSize: 12, fontWeight: 600 }}>
                <span>Launch tool</span>
                <ArrowRight size={13} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
