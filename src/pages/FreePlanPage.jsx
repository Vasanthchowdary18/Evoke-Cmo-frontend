import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Target, Megaphone, Layers, TrendingUp, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils.js'

/* ── colours ── */
const BG      = '#0e0c09'
const GOLD    = '#c8973e'
const GBORDER = 'rgba(200,151,62,0.22)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'

/* ── Agents ── */
const AGENTS = [
  {
    name: 'Strategy Agent',
    best: 'Best for: Defining goals',
    badge: null,
    icon: <Target size={22} />,
    path: '/campaign/growth_strategy',
    label: 'Objective & Strategy Development',
    desc: 'Build a full GTM strategy with clear, measurable goals aligned to your revenue targets.',
  },
  {
    name: 'Growth Agent',
    best: 'Best for: Getting clients',
    badge: 'MOST POPULAR',
    icon: <TrendingUp size={22} />,
    path: '/campaign/growth_agent',
    label: 'New Leads / Client Retention',
    desc: 'Get a custom plan for attracting new clients and keeping existing ones — outreach, nurture, loyalty.',
  },
  {
    name: 'Content Agent',
    best: 'Best for: Brand building',
    badge: null,
    icon: <Layers size={22} />,
    path: '/campaign/content_calendar',
    label: 'Content Creation Framework',
    desc: 'A structured content blueprint covering brand voice, pillars, post formats and publishing cadence.',
  },
]

/* ── What's included detail ── */
const FREE_FEATURES = [
  {
    icon: <Target size={15} />,
    text: 'Objective & Strategy Development',
    desc: "EVOX CMO works with you to define clear, measurable marketing goals — whether that's lead generation, brand awareness, or revenue growth. It builds a full GTM strategy aligned to your business objectives.",
  },
  {
    icon: <Megaphone size={15} />,
    text: 'New Leads / Client Retention Planning',
    desc: 'Get a custom plan for attracting new customers and keeping existing ones engaged. Includes outreach strategies, nurture sequences, and loyalty campaign frameworks tailored to your audience.',
  },
  {
    icon: <Layers size={15} />,
    text: 'Content Creation Framework',
    desc: 'A structured content blueprint covering your brand voice, content pillars, post formats, and publishing cadence across all channels — so every piece of content works toward your goals.',
  },
]

export default function FreePlanPage() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const [expanded, setExpanded] = useState(null)

  const launchAgent = (path) => {
    if (user) {
      navigate(path, { state: { from: '/free-plan' } })
    } else {
      redirectToLogin(window.location.origin + path)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '90px 24px 72px' }}>

        {/* ── Back ── */}
        <button
          onClick={() => navigate('/#pricing')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: TEXT2,
            cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Back to Plans
        </button>

        {/* ── Compact header ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px',
            background: 'rgba(200,151,62,0.12)', border: `1px solid ${GBORDER}`,
            borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
          }}>FREE PLAN</div>

          <h1 style={{
            fontSize: 'clamp(20px, 3.5vw, 30px)', fontWeight: 900, color: TEXT,
            fontFamily: "'Syne','Inter',sans-serif", marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Choose your AI agent &amp;{' '}
            <span style={{
              background: 'linear-gradient(135deg,#e8c47a 10%,#c8973e 60%,#a87030 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>get started free</span>
          </h1>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>
            No credit card required · All 3 agents included · Switch anytime
          </p>
        </div>

        {/* ── Agent cards — FIRST & prominent ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 36 }}>
          {AGENTS.map((agent) => (
            <div
              key={agent.name}
              style={{
                position: 'relative',
                borderRadius: 16,
                border: `1px solid ${agent.badge ? 'rgba(200,151,62,0.5)' : GBORDER}`,
                background: agent.badge ? 'linear-gradient(160deg,rgba(200,151,62,0.08),rgba(200,151,62,0.03))' : 'rgba(255,255,255,0.02)',
                padding: '22px 20px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              {agent.badge && (
                <div style={{
                  position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)', color: '#0e0c09',
                  fontSize: 9, fontWeight: 800, padding: '3px 14px', borderRadius: 100,
                  whiteSpace: 'nowrap', letterSpacing: '0.08em',
                }}>{agent.badge}</div>
              )}

              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0e0c09',
                }}>
                  {agent.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1.2 }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, letterSpacing: '0.03em', marginTop: 3 }}>
                    {agent.best}
                  </div>
                </div>
              </div>

              {/* What it does */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  {agent.label}
                </div>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, margin: 0 }}>
                  {agent.desc}
                </p>
              </div>

              {/* Launch button */}
              <button
                onClick={() => launchAgent(agent.path)}
                style={{
                  width: '100%', padding: '11px 0', marginTop: 'auto',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                  border: 'none', borderRadius: 10, color: '#0e0c09',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Launch {agent.name} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* ── What's included — collapsible, below agents ── */}
        <div style={{
          border: `1px solid ${GBORDER}`, borderRadius: 16,
          background: 'rgba(255,255,255,0.015)', overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpanded(expanded === 'all' ? null : 'all')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT2 }}>
              What's included in your Free plan?
            </span>
            <ChevronDown
              size={16}
              style={{
                color: GOLD, flexShrink: 0,
                transform: expanded === 'all' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s',
              }}
            />
          </button>

          {expanded === 'all' && (
            <div style={{ padding: '0 20px 20px' }}>
              {FREE_FEATURES.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '14px 0',
                    borderTop: i === 0 ? `1px solid ${GBORDER}` : `1px solid rgba(255,255,255,0.04)`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(200,151,62,0.12)', border: `1px solid ${GBORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD,
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{f.text}</div>
                    <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
