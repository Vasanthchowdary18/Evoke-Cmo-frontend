import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, TrendingUp, Layers, Image, Camera,
  LayoutTemplate, Share2, ArrowRight, Check, Unlink,
  Loader2, ChevronRight, Zap, Link2,
  Linkedin, Facebook, Mail, MessageSquare,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils.js'
import { getOrCreateUser, disconnectSocialAccount } from '../services/userService'

const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.08)'

/* ─── All agents ─── */
const ALL_AGENTS = [
  {
    id: 'strategy',
    name: 'Strategy Agent',
    sub: 'Define goals & GTM',
    icon: <Target size={17} />,
    path: '/campaign/growth_strategy',
    tag: 'FREE',
    color: '#c8973e',
  },
  {
    id: 'growth',
    name: 'Growth Agent',
    sub: 'Get clients & leads',
    icon: <TrendingUp size={17} />,
    path: '/campaign/growth_agent',
    tag: 'FREE',
    color: '#c8973e',
    popular: true,
  },
  {
    id: 'content',
    name: 'Content Agent',
    sub: 'Brand & content plan',
    icon: <Layers size={17} />,
    path: '/campaign/content_calendar',
    tag: 'FREE',
    color: '#c8973e',
  },
  {
    id: 'image-angles',
    name: 'Image to Angles',
    sub: 'Multi-angle product shots',
    icon: <Image size={17} />,
    path: '/image-angles',
    tag: 'PACKAGE A',
    color: '#10b981',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Images',
    sub: 'On-brand scene photography',
    icon: <Camera size={17} />,
    path: '/image-lifestyle',
    tag: 'PACKAGE A',
    color: '#ec4899',
  },
  {
    id: 'banner',
    name: 'Banner Creation',
    sub: 'Ad-ready static banners',
    icon: <LayoutTemplate size={17} />,
    path: null,
    tag: 'PACKAGE A',
    color: '#a855f7',
    soon: true,
  },
  {
    id: 'social',
    name: 'Post to Social',
    sub: 'Schedule & publish',
    icon: <Share2 size={17} />,
    path: '/connect-accounts',
    tag: 'PACKAGE A',
    color: '#3b82f6',
  },
]

/* ─── Social platforms ─── */
const PLATFORMS = [
  {
    key: 'instagram', label: 'Instagram', color: '#dd2a7b',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <defs><linearGradient id="igA" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0%" stopColor="#f58529"/><stop offset="50%" stopColor="#dd2a7b"/><stop offset="100%" stopColor="#8134af"/>
        </linearGradient></defs>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#igA)" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="4" stroke="url(#igA)" strokeWidth="2" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b"/>
      </svg>
    ),
    oauthPath: '/connect-accounts',
  },
  {
    key: 'facebook', label: 'Facebook', color: '#1877f2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    oauthPath: '/connect-accounts',
  },
  {
    key: 'linkedin', label: 'LinkedIn', color: '#0a66c2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    oauthPath: '/connect-accounts',
  },
  {
    key: 'whatsapp', label: 'WhatsApp', color: '#25d366',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    alwaysOn: true,
  },
  {
    key: 'gmail', label: 'Gmail', color: '#ea4335',
    icon: (
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
        <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
        <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
        <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/>
        <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/>
      </svg>
    ),
    oauthPath: '/connect-accounts',
  },
]

export default function PackageAPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [selectedAgent, setSelectedAgent] = useState(ALL_AGENTS[0])
  const [accounts, setAccounts]           = useState({})
  const [loadingAccts, setLoadingAccts]   = useState(true)
  const [disconnecting, setDisconnecting] = useState({})
  const [sidebarOpen, setSidebarOpen]     = useState(true)

  /* Load social accounts */
  useEffect(() => {
    if (!user) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(data => { setAccounts(data.socialAccounts || {}); setLoadingAccts(false) })
      .catch(() => setLoadingAccts(false))
  }, [user])

  const connectedCount = PLATFORMS.filter(p =>
    p.alwaysOn || accounts[p.key]?.connected
  ).length

  const readiness = Math.round((connectedCount / PLATFORMS.length) * 100)

  const handleLaunch = (agent) => {
    if (agent.soon || !agent.path) return
    if (user) navigate(agent.path, { state: { from: '/package-a' } })
    else redirectToLogin(window.location.origin + agent.path)
  }

  const handleDisconnect = async (key) => {
    if (!user) return
    setDisconnecting(d => ({ ...d, [key]: true }))
    try {
      await disconnectSocialAccount(user.uid, key)
      setAccounts(a => ({ ...a, [key]: { connected: false } }))
    } finally {
      setDisconnecting(d => ({ ...d, [key]: false }))
    }
  }

  const tagColor = (tag) => tag === 'FREE' ? '#c8973e' : '#a855f7'

  return (
    <div style={{ height: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <Navbar />

      {/* ── Single unified panel ── */}
      <div style={{
        position: 'absolute', top: 64, left: 0, right: 0, bottom: 0,
        display: 'flex', padding: '12px 16px', overflow: 'hidden',
      }}>
        <div style={{
          width: '100%', display: 'flex', overflow: 'hidden',
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
        }}>

        {/* ══════════ LEFT SIDEBAR ══════════ */}
        <div style={{
          width: sidebarOpen ? 248 : 62,
          flexShrink: 0,
          padding: sidebarOpen ? '16px 14px 20px' : '16px 10px',
          transition: 'width 0.25s ease, padding 0.25s ease',
          overflow: 'hidden auto',
          borderRight: `1px solid ${BORDER}`,
        }}>

          {/* Toggle button — always at top, gold-accented */}
          <div style={{ display: 'flex', justifyContent: sidebarOpen ? 'flex-end' : 'center', marginBottom: 16 }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: 'rgba(200,151,62,0.1)',
                border: '1px solid rgba(200,151,62,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: GOLD,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.22)'; e.currentTarget.style.borderColor = GOLD }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.1)'; e.currentTarget.style.borderColor = 'rgba(200,151,62,0.35)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {sidebarOpen
                  ? <path d="M15 18l-6-6 6-6" />
                  : <path d="M9 18l6-6-6-6" />
                }
              </svg>
            </button>
          </div>

          {sidebarOpen ? (
            /* ── Expanded content ── */
            <>
              {/* Package badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.25)',
                borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD,
                letterSpacing: '0.1em', marginBottom: 14, whiteSpace: 'nowrap',
              }}>
                <Zap size={11} /> PACKAGE A
              </div>

              <h2 style={{ fontSize: 15, fontWeight: 900, color: TEXT, marginBottom: 3, letterSpacing: '-0.02em' }}>
                Your Agents
              </h2>
              <p style={{ fontSize: 11, color: TEXT3, marginBottom: 18, lineHeight: 1.5 }}>
                Select an agent to launch
              </p>

              {/* FREE PLAN section */}
              <div style={{ fontSize: 9, fontWeight: 800, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Free Plan
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: 16 }}>
                {ALL_AGENTS.filter(a => a.tag === 'FREE').map(agent => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgent?.id === agent.id}
                    onSelect={() => setSelectedAgent(agent)}
                    onLaunch={() => handleLaunch(agent)}
                  />
                ))}
              </div>

              {/* PACKAGE A section */}
              <div style={{ fontSize: 9, fontWeight: 800, color: '#a855f7', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Package A Exclusives
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                {ALL_AGENTS.filter(a => a.tag === 'PACKAGE A').map(agent => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgent?.id === agent.id}
                    onSelect={() => setSelectedAgent(agent)}
                    onLaunch={() => handleLaunch(agent)}
                  />
                ))}
              </div>
            </>
          ) : (
            /* ── Collapsed — icon-only ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ALL_AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setSidebarOpen(true) }}
                  title={agent.name}
                  style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: selectedAgent?.id === agent.id ? `${agent.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedAgent?.id === agent.id ? agent.color + '40' : 'rgba(255,255,255,0.07)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selectedAgent?.id === agent.id ? agent.color : 'rgba(240,235,224,0.35)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    margin: '0 auto',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${agent.color}18`; e.currentTarget.style.color = agent.color }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = selectedAgent?.id === agent.id ? `${agent.color}20` : 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = selectedAgent?.id === agent.id ? agent.color : 'rgba(240,235,224,0.35)'
                  }}
                >
                  {agent.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══════════ MAIN CENTER ══════════ */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAgent?.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {selectedAgent && (
                <AgentDetail agent={selectedAgent} onLaunch={() => handleLaunch(selectedAgent)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ══════════ RIGHT — Social Accounts ══════════ */}
        <div style={{
          width: 288, flexShrink: 0,
          borderLeft: `1px solid ${BORDER}`,
          padding: '20px 16px',
          overflowY: 'auto',
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Link2 size={13} color={GOLD} />
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Social Accounts</span>
              </div>
              <p style={{ fontSize: 11, color: TEXT3, margin: 0 }}>{connectedCount} of {PLATFORMS.length} connected</p>
            </div>
            <button
              onClick={() => navigate('/connect-accounts', { state: { from: '/package-a' } })}
              style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
            >
              Manage
            </button>
          </div>

          {/* Readiness bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Marketing Readiness</span>
              <span style={{
                fontSize: 14, fontWeight: 900, color:
                  readiness === 0 ? '#ef4444' : readiness < 40 ? '#f59e0b' : '#10b981'
              }}>{readiness}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readiness}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 100,
                  background: readiness === 0 ? '#ef4444' : readiness < 40 ? 'linear-gradient(90deg,#f59e0b,#d4a853)' : 'linear-gradient(90deg,#10b981,#34d399)',
                }}
              />
            </div>
          </div>

          {/* Platform list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingAccts ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: TEXT3, fontSize: 13 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
              </div>
            ) : (
              PLATFORMS.map(platform => {
                const isConnected = platform.alwaysOn || accounts[platform.key]?.connected
                const acct = accounts[platform.key]
                const label = acct?.name || acct?.pageName || acct?.username || acct?.email

                return (
                  <div
                    key={platform.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: isConnected ? `${platform.color}0d` : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${isConnected ? platform.color + '30' : BORDER}`,
                      borderRadius: 12, transition: 'all 0.2s',
                    }}
                  >
                    {/* Icon */}
                    <div style={{ color: platform.color, flexShrink: 0, width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {platform.icon}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{platform.label}</div>
                      {isConnected && label && (
                        <div style={{ fontSize: 10, color: TEXT3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </div>
                      )}
                    </div>

                    {/* Status / Action */}
                    {platform.alwaysOn ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#25d366', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap' }}>
                        Always On
                      </span>
                    ) : isConnected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <button
                          onClick={() => handleDisconnect(platform.key)}
                          disabled={disconnecting[platform.key]}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, padding: 0, display: 'flex' }}
                          title="Disconnect"
                        >
                          {disconnecting[platform.key]
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Unlink size={12} />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sessionStorage.setItem('connectReturnTo', '/package-a')
                          navigate('/connect-accounts', { state: { from: '/package-a' } })
                        }}
                        style={{
                          fontSize: 10, fontWeight: 700, color: platform.color,
                          background: `${platform.color}12`, border: `1px solid ${platform.color}30`,
                          borderRadius: 6, padding: '4px 9px', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Quick post CTA */}
          {connectedCount > 1 && (
            <button
              onClick={() => navigate('/post-content')}
              style={{
                marginTop: 14, width: '100%', padding: '11px',
                background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                border: 'none', borderRadius: 10, color: '#0e0c09',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Share2 size={13} /> Post Content Now
            </button>
          )}
        </div>

        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

/* ─── Agent Row (sidebar item) ─── */
function AgentRow({ agent, selected, onSelect }) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ backgroundColor: selected ? `${agent.color}18` : 'rgba(255,255,255,0.03)' }}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 10px 10px 16px',
        borderRadius: 0,
        cursor: agent.soon ? 'default' : 'pointer',
        background: selected ? `${agent.color}12` : 'transparent',
        border: 'none',
        borderBottom: `1px solid rgba(255,255,255,0.07)`,
        textAlign: 'left', width: '100%', opacity: agent.soon ? 0.5 : 1,
        transition: 'background 0.15s', overflow: 'hidden',
      }}
    >
      {/* Left accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: selected ? agent.color : 'transparent',
        transition: 'background 0.15s',
      }} />
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: selected ? `${agent.color}20` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${selected ? agent.color + '40' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? agent.color : 'rgba(240,235,224,0.4)',
      }}>
        {agent.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#fff' : 'rgba(240,235,224,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.name}
          {agent.popular && <span style={{ marginLeft: 5, fontSize: 8, fontWeight: 800, color: '#c8973e', background: 'rgba(200,151,62,0.15)', padding: '1px 5px', borderRadius: 4 }}>HOT</span>}
          {agent.soon && <span style={{ marginLeft: 5, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>SOON</span>}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.sub}</div>
      </div>
      {selected && !agent.soon && (
        <ChevronRight size={13} color={agent.color} style={{ flexShrink: 0 }} />
      )}
    </motion.button>
  )
}

/* ─── Agent Detail (center panel) ─── */
function AgentDetail({ agent, onLaunch }) {
  const DESCRIPTIONS = {
    strategy:     { full: 'Build a full Go-To-Market strategy with clear, measurable goals aligned to your revenue targets. The Strategy Agent creates a complete plan covering positioning, target audience, key channels, and 90-day milestones.', steps: ['Define your target market & ICP', 'Set revenue goals & KPIs', 'Choose your GTM channels', 'Get a 90-day action plan'] },
    growth:       { full: 'Get a custom plan for attracting new clients and keeping existing ones. The Growth Agent covers outreach strategies, lead nurture flows, referral programs, and retention tactics tailored to your business.', steps: ['Prospect targeting strategy', 'Outreach message sequences', 'Lead nurture email flow', 'Referral & retention plan'] },
    content:      { full: 'A structured content blueprint covering brand voice, content pillars, post formats, and publishing cadence. The Content Agent creates a complete content calendar ready to execute across all platforms.', steps: ['Define brand voice & tone', 'Content pillars & themes', 'Platform-specific formats', 'Publishing schedule'] },
    'image-angles': { full: 'Transform a single product photo into a full set of professional multi-angle shots — front, side, back, detail — ready for e-commerce, ads, and catalogues. Powered by WaveSpeed AI video generation.', steps: ['Upload your product image URL', 'Set angles and visual style', 'AI generates 5-second video', 'Download or post directly'] },
    lifestyle:    { full: 'Place your product into realistic, on-brand lifestyle scenes — indoors, outdoors, or aspirational settings — without a costly photoshoot. Generate MP4 video showcasing your product in real-world context.', steps: ['Upload product image URL', 'Choose lifestyle setting & mood', 'AI generates lifestyle video', 'Download or post to social'] },
    banner:       { full: 'Generate platform-optimised static banners sized for Meta, Google, and display networks — pre-formatted with your brand colours, fonts, and copy. Coming soon.', steps: ['Coming soon'] },
    social:       { full: 'Connect your social media accounts, create content with the Content Agent, then launch your campaign directly to Instagram, Facebook, LinkedIn, Twitter and more.', steps: ['Connect your social accounts', 'Generate content with AI agents', 'Review content before posting', 'Launch to all platforms at once'] },
  }

  const info = DESCRIPTIONS[agent.id] || { full: agent.sub, steps: [] }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24,
        padding: '20px', background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${agent.color}25`, borderRadius: 18,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: `${agent.color}15`, border: `1px solid ${agent.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.color,
        }}>
          {React.cloneElement(agent.icon, { size: 24 })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>{agent.name}</h2>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.08em',
              background: agent.tag === 'FREE' ? 'rgba(200,151,62,0.15)' : 'rgba(168,85,247,0.15)',
              color: agent.tag === 'FREE' ? '#c8973e' : '#a855f7',
              border: `1px solid ${agent.tag === 'FREE' ? 'rgba(200,151,62,0.3)' : 'rgba(168,85,247,0.3)'}`,
            }}>{agent.tag}</span>
            {agent.popular && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>MOST POPULAR</span>}
          </div>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{info.full}</p>
        </div>
      </div>

      {/* How it works */}
      {info.steps.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            How it works
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {info.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${BORDER}`, borderRadius: 10,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: `${agent.color}20`, border: `1px solid ${agent.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: agent.color,
                }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onLaunch}
        disabled={agent.soon}
        style={{
          padding: '14px 32px',
          background: agent.soon ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#d4a853,#b8803a)',
          border: agent.soon ? `1px solid ${BORDER}` : 'none',
          borderRadius: 12, color: agent.soon ? TEXT3 : '#0e0c09',
          fontSize: 15, fontWeight: 800, cursor: agent.soon ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}
      >
        {agent.soon ? 'Coming Soon' : `Launch ${agent.name}`}
        {!agent.soon && <ArrowRight size={16} />}
      </button>
    </div>
  )
}
