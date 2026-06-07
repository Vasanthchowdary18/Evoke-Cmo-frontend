import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Calendar, Package, Rocket, BookOpen, Globe, Mail, Users, PieChart, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import OnboardingModal from '../components/OnboardingModal.jsx'
import { getOrCreateUser } from '../services/userService'

function goToEvokeAuth() {
  const redirectUrl = encodeURIComponent(window.location.href)
  window.location.href = `https://accounts.evokemarketplace.com/login/?redirect_url=${redirectUrl}`
}

/* ─── colour tokens ─── */
const BG   = '#0e0c09'
const GOLD = '#c8973e'
const GDIM = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.32)'

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

/* ─── Generation agents ─── */
const GEN_AGENTS = [
  { key: 'event',          title: 'Events',               badge: 'EVENT',      color: '#c8973e', path: '/campaign/event',          icon: <Calendar size={20} />,  desc: 'Launch high-impact event marketing with email, WhatsApp & 7-day calendar.' },
  { key: 'product',        title: 'Products',             badge: 'POPULAR',    color: '#a855f7', path: '/campaign/product',         icon: <Package size={20} />,   desc: 'Drive product launches with multi-channel content including LinkedIn, SMS & email.' },
  { key: 'brand',          title: 'Brands',               badge: 'BRAND',      color: '#6366f1', path: '/campaign/brand',           icon: <Zap size={20} />,       desc: 'Build a complete brand strategy with ad copy, full brand messaging & Google Sheets logging.' },
  { key: 'growth_strategy',title: 'Growth Strategy',      badge: 'STRATEGY',   color: '#10b981', path: '/campaign/growth_strategy', icon: <Rocket size={20} />,    desc: 'Create GTM strategies, identify revenue opportunities & develop expansion roadmaps.' },
  { key: 'content_calendar',title: 'Content Calendar',    badge: 'CONTENT',    color: '#3b82f6', path: '/campaign/content_calendar',icon: <BookOpen size={20} />,  desc: 'Full content strategy & planning: 30-day calendars, campaign recommendations.' },
  { key: 'seo_blog',       title: 'SEO & Blog',           badge: 'SEO',        color: '#14b8a6', path: '/campaign/seo_blog',        icon: <Globe size={20} />,     desc: 'Generate full SEO blog posts, keyword strategies & content link-building plans.' },
  { key: 'email_drip',     title: 'Email Drip Campaign',  badge: 'EMAIL',      color: '#f59e0b', path: '/campaign/email_drip',      icon: <Mail size={20} />,      desc: 'Build complete email funnels with 5-email drip sequences & lifecycle flows.' },
  { key: 'influencer',     title: 'Influencer & PR',      badge: 'INFLUENCE',  color: '#ec4899', path: '/campaign/influencer',      icon: <Users size={20} />,     desc: 'Create influencer templates, press releases & PR strategies for outreach.' },
  { key: 'analytics_report',title: 'Analytics Report',   badge: 'ANALYTICS',  color: '#8b5cf6', path: '/campaign/analytics_report',icon: <PieChart size={20} />,  desc: 'Data-driven marketing performance reports, KPI dashboards & CAGTS.' },
]

/* ─── Agent cards data ─── */
const AGENTS = [
  {
    key: 'cmo',
    label: 'CMO Agent',
    role: 'Chief Marketing Officer',
    desc: 'Generate complete multi-channel marketing campaigns for events, products, and brands — deployed in seconds.',
    tags: ['Campaigns', 'Content', 'Social'],
    active: true,
    href: '/cmo',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
]

export default function AgentsHub() {
  const navigate = useNavigate()
  const [user,            setUser]            = useState(null)
  const [showOnboarding,  setShowOnboarding]  = useState(false)
  const [pendingHref,     setPendingHref]     = useState(null)

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), [])

  const handleLaunch = async (agent) => {
    if (!agent.active) return
    if (!user) { goToEvokeAuth(); return }

    try {
      const data = await getOrCreateUser(user.uid, user.displayName, user.email)
      if (!data.onboardingComplete) {
        // Show onboarding first, then go to agent after completion
        setPendingHref(agent.href)
        setShowOnboarding(true)
      } else {
        navigate(agent.href)
      }
    } catch {
      navigate(agent.href)
    }
  }

  const goldGrad = {
    background: 'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

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

      <div style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 1200, margin: '0 auto', padding: '100px 32px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 16px', background: GDIM, border: `1px solid ${GBORDER}`,
            borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24,
          }}>
            <Zap size={11} fill={GOLD} /> AI Chief Marketing Officer
          </div>
          <h1 style={{
            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800,
            letterSpacing: '-0.03em', lineHeight: 1.15,
            fontFamily: "'Syne','Inter',sans-serif", marginBottom: 14,
          }}>
            Your AI <span style={goldGrad}>Chief Marketing Officer</span>
          </h1>
          <p style={{ fontSize: 16, color: TEXT2, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Select an active agent to launch its dashboard.
          </p>
        </motion.div>

        {/* Agent cards grid */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="agents-hub-grid" style={{ display: 'flex', justifyContent: 'center', gap: 20 }}
        >
          {AGENTS.map((agent) => (
            <motion.div key={agent.key} variants={fadeUp} style={{ width: '100%', maxWidth: 400 }}>
              <div
                onClick={() => handleLaunch(agent)}
                style={{
                  background: agent.active
                    ? 'linear-gradient(160deg,#221d10,#1c1a13)'
                    : 'linear-gradient(160deg,#161410,#131210)',
                  border: `1px solid ${agent.active ? 'rgba(200,151,62,0.5)' : 'rgba(200,151,62,0.15)'}`,
                  borderRadius: 20, padding: '28px 24px',
                  cursor: agent.active ? 'pointer' : 'default',
                  opacity: agent.active ? 1 : 0.7,
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  boxShadow: agent.active ? '0 0 40px rgba(200,151,62,0.08)' : 'none',
                  height: '100%', boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  if (agent.active) {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 20px 56px rgba(200,151,62,0.18)'
                    e.currentTarget.style.borderColor = 'rgba(200,151,62,0.7)'
                  }
                }}
                onMouseLeave={e => {
                  if (agent.active) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(200,151,62,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(200,151,62,0.5)'
                  }
                }}
              >
                {/* Coming soon badge */}
                {!agent.active && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    padding: '3px 10px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100,
                    fontSize: 9, fontWeight: 700, color: 'rgba(240,235,224,0.35)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    COMING SOON
                  </div>
                )}

                {/* Icon */}
                <div style={{
                  width: 60, height: 60, borderRadius: 14,
                  background: agent.active ? GDIM : 'rgba(200,151,62,0.05)',
                  border: `1px solid ${agent.active ? GBORDER : 'rgba(200,151,62,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  boxShadow: agent.active ? '0 0 18px rgba(200,151,62,0.1)' : 'none',
                }}>
                  {agent.icon}
                </div>

                {/* Label pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px',
                  background: agent.active ? GDIM : 'rgba(200,151,62,0.05)',
                  border: `1px solid ${agent.active ? GBORDER : 'rgba(200,151,62,0.12)'}`,
                  borderRadius: 100, fontSize: 11, fontWeight: 700,
                  color: agent.active ? GOLD : 'rgba(200,151,62,0.4)',
                  letterSpacing: '0.07em', marginBottom: 12,
                }}>
                  {agent.label}
                </div>

                {/* Role */}
                <h3 style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2,
                  color: agent.active ? TEXT : 'rgba(240,235,224,0.45)',
                  marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif",
                }}>
                  {agent.role}
                </h3>

                {/* Desc */}
                <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, marginBottom: 20, opacity: agent.active ? 1 : 0.6 }}>
                  {agent.desc}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                  {agent.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px',
                      background: agent.active ? 'rgba(200,151,62,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${agent.active ? 'rgba(200,151,62,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 100, fontSize: 11,
                      color: agent.active ? 'rgba(240,235,224,0.65)' : 'rgba(240,235,224,0.25)',
                      fontWeight: 500,
                    }}>{tag}</span>
                  ))}
                </div>

                {/* CTA button */}
                {agent.active ? (
                  <button
                    onClick={e => { e.stopPropagation(); handleLaunch(agent) }}
                    style={{
                      width: '100%', padding: '13px',
                      background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                      border: 'none', borderRadius: 12,
                      color: '#0e0c09', fontSize: 14, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                      fontFamily: "'Inter',sans-serif", transition: 'all 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,151,62,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                  >
                    Launch {agent.label} <ArrowRight size={15} />
                  </button>
                ) : (
                  <div style={{
                    width: '100%', padding: '13px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: 'rgba(240,235,224,0.25)',
                    fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxSizing: 'border-box',
                  }}>
                    Coming Soon
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}
