import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target, TrendingUp, Layers, Image, Camera, Share2, ArrowRight,
  Check, Zap, BookOpen, BarChart2, Mail, PenTool, Sliders,
  Video, FileText, Globe, CheckCircle2, Link2,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser } from '../services/userService'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.12)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.07)'
const GREEN  = '#10b981'

// Free tools (included in Package A)
const FREE_TOOLS = [
  { label: 'Marketing Strategy',  desc: 'Annual, quarterly & monthly marketing plans with budgets and KPIs.',     icon: <TrendingUp size={20}/>, color: '#c8973e', route: '/strategy' },
  { label: 'Brand Knowledge Base',desc: 'Store your brand voice, visuals, messaging, and audience guidelines.',   icon: <BookOpen size={20}/>,   color: '#f59e0b', route: '/brand-kb' },
  { label: 'Growth Strategy',     desc: 'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.', icon: <Zap size={20}/>,        color: '#f97316', route: '/campaign/growth_strategy' },
  { label: 'Content Calendar',    desc: '30-day multi-platform content plan with daily post ideas.',               icon: <Layers size={20}/>,     color: '#3b82f6', route: '/campaign/content_calendar' },
]

// Package A tools (unlocked with this plan)
const PKG_A_TOOLS = [
  { label: 'Caption Suite',        desc: 'AI captions for Instagram, LinkedIn, TikTok, Twitter and more.',          icon: <PenTool size={20}/>,   color: '#10b981', route: '/caption-suite' },
  { label: 'Reel Scripts',         desc: 'Hook + body + CTA scripts for Reels, TikTok, and YouTube Shorts.',        icon: <Sliders size={20}/>,   color: '#f59e0b', route: '/reel-scripts' },
  { label: 'Copywriting Agent',    desc: 'Ad copy, taglines, slogans, brand voice, and value propositions.',        icon: <FileText size={20}/>,  color: '#ec4899', route: '/copywriting' },
  { label: 'Content Generation',   desc: 'Blog posts, landing page copy, newsletters — full AI-written content.',   icon: <Globe size={20}/>,     color: '#6366f1', route: '/content-gen' },
  { label: 'Product Image Angles', desc: 'Multi-angle product shots — front, side, top, lifestyle on clean BG.',    icon: <Camera size={20}/>,    color: '#f97316', route: '/image-angles' },
  { label: 'Lifestyle Photos',     desc: 'Product in real-life settings — homes, outdoors, and social contexts.',   icon: <Image size={20}/>,     color: '#a855f7', route: '/image-lifestyle' },
  { label: '360° Product Video',   desc: 'Smooth rotating product showcase video for e-commerce and ads.',          icon: <Video size={20}/>,     color: '#ef4444', route: '/image-360' },
  { label: 'SEO Product Images',   desc: 'Keyword-rich product images with alt text optimised for Google Shopping.',icon: <Target size={20}/>,    color: '#06b6d4', route: '/image-seo' },
  { label: 'Product Description',  desc: 'AI-generated product copy with features, benefits, and SEO keywords.',    icon: <Mail size={20}/>,      color: '#84cc16', route: '/product-desc' },
  { label: 'Video Generation',     desc: 'Promo, product showcase, social reel, and event videos — all AI-driven.', icon: <Video size={20}/>,     color: '#f59e0b', route: '/video-gen' },
]

// Social platform icons
const SOCIALS = [
  { key: 'instagram', label: 'Instagram', color: '#dd2a7b',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stopColor="#f58529"/><stop offset="50%" stopColor="#dd2a7b"/><stop offset="100%" stopColor="#8134af"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig)" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b"/></svg> },
  { key: 'facebook',  label: 'Facebook',  color: '#1877f2',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { key: 'twitter',   label: 'Twitter/X', color: '#1d9bf0',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
]

export default function PackageAPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const [accounts, setAccounts] = useState({})

  useEffect(() => {
    if (!user) return
    getOrCreateUser(user.uid, user.displayName, user.email).then(d => {
      setAccounts(d.socialAccounts || {})
    }).catch(() => {})
  }, [user])

  const connectedCount = SOCIALS.filter(s => accounts[s.key]?.connected).length

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '96px 24px 80px' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', marginBottom: 12 }}>
                <Zap size={11} /> PACKAGE A — ACTIVE
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: '-0.03em', margin: '0 0 8px', fontFamily: "'Syne','Inter',sans-serif" }}>
                Your Creative & Content Tools
              </h1>
              <p style={{ fontSize: 14, color: TEXT2, margin: 0, lineHeight: 1.65, maxWidth: 520 }}>
                Everything you need to create content, visuals, and copy. Click any tool to launch it — your brand knowledge is already loaded.
              </p>
            </div>
            <button
              onClick={() => navigate('/agents-hub')}
              style={{ padding: '10px 18px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              All Agents <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>

        {/* ── Social accounts banner ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link2 size={16} color={GOLD} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Social Accounts</div>
              <div style={{ fontSize: 11, color: TEXT3 }}>{connectedCount} of {SOCIALS.length} connected</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {SOCIALS.map(s => {
              const connected = accounts[s.key]?.connected
              return (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  background: connected ? `${s.color}12` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${connected ? s.color + '35' : BORDER}`,
                  borderRadius: 8,
                }}>
                  <span style={{ color: connected ? s.color : TEXT3 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: connected ? s.color : TEXT3 }}>{s.label}</span>
                  {connected && <CheckCircle2 size={10} color={GREEN} />}
                </div>
              )
            })}
            <button onClick={() => navigate('/connect-accounts')}
              style={{ padding: '5px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Manage
            </button>
          </div>
        </motion.div>

        {/* ── Package A Tools ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.1em' }}>PACKAGE A TOOLS</div>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 11, color: TEXT3 }}>{PKG_A_TOOLS.length} tools</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {PKG_A_TOOLS.map((tool, i) => (
              <ToolCard key={tool.label} tool={tool} i={i} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* ── Free Tools (also included) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em' }}>ALSO INCLUDED — FREE PLAN</div>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 11, color: TEXT3 }}>{FREE_TOOLS.length} tools</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {FREE_TOOLS.map((tool, i) => (
              <ToolCard key={tool.label} tool={tool} i={i} navigate={navigate} dim />
            ))}
          </div>
        </div>

        {/* ── Upgrade nudge ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ marginTop: 40, background: 'linear-gradient(135deg, rgba(200,151,62,0.06), rgba(200,151,62,0.02))', border: `1px solid ${GBORDER}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Want Email Marketing, SEO Agent & A/B Testing?</div>
            <div style={{ fontSize: 12, color: TEXT2 }}>Upgrade to Package B to unlock AI agents + social posting + analytics.</div>
          </div>
          <button onClick={() => navigate('/package-b')}
            style={{ padding: '10px 18px', background: `linear-gradient(135deg, ${GOLD}, #b8803a)`, border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            See Package B <ArrowRight size={13} />
          </button>
        </motion.div>

      </div>
    </div>
  )
}

function ToolCard({ tool, i, navigate, dim = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(tool.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: dim ? 'rgba(255,255,255,0.02)' : '#1c1a13',
        border: `1px solid ${hovered ? tool.color + '55' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 32px ${tool.color}12` : 'none',
        opacity: dim ? 0.7 : 1,
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tool.color}18`, border: `1px solid ${tool.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool.color, marginBottom: 12 }}>
        {tool.icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0ebe0', marginBottom: 5, lineHeight: 1.3 }}>{tool.label}</div>
      <div style={{ fontSize: 11, color: 'rgba(240,235,224,0.45)', lineHeight: 1.55, marginBottom: 12 }}>{tool.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: hovered ? tool.color : 'rgba(240,235,224,0.35)', fontSize: 11, fontWeight: 600, transition: 'color 0.15s' }}>
        Launch <ArrowRight size={11} />
      </div>
    </motion.div>
  )
}
