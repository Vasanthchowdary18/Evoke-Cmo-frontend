import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Package, Zap, ArrowRight, Star, TrendingUp,
  Mail, MessageSquare, Linkedin, Search, BarChart2, Shield,
  Clock, Eye, Trash2, ChevronDown, ChevronUp, Coins,
  Link2, AlertCircle, X, Check, Loader2
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getOrCreateUser, getTokenBalance } from '../services/userService'

const campaignCards = [
  {
    type: 'event',
    icon: <Calendar size={32} />,
    title: 'Events',
    subtitle: '1 token per campaign',
    description: 'Launch high-impact event marketing with email, WhatsApp messages, a 7-day calendar, and SEO content — all generated instantly.',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.05))',
    border: 'rgba(124,58,237,0.25)',
    features: [
      { icon: <Mail size={13} />,          label: 'Email Campaign'   },
      { icon: <MessageSquare size={13} />, label: 'WhatsApp Message' },
      { icon: <Calendar size={13} />,      label: '7-Day Calendar'   },
      { icon: <Search size={13} />,        label: 'SEO Content'      },
    ],
    badge: 'Event',
  },
  {
    type: 'product',
    icon: <Package size={32} />,
    title: 'Products',
    subtitle: '1 token per campaign',
    description: 'Drive product launches with multi-channel content including LinkedIn posts, SMS, email, and compelling positioning statements.',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(6,182,212,0.05))',
    border: 'rgba(6,182,212,0.25)',
    features: [
      { icon: <Mail size={13} />,          label: 'Email Campaign' },
      { icon: <Linkedin size={13} />,      label: 'LinkedIn Post'  },
      { icon: <MessageSquare size={13} />, label: 'SMS + WhatsApp' },
      { icon: <TrendingUp size={13} />,    label: 'Positioning'    },
    ],
    badge: 'Product',
    popular: true,
  },
  {
    type: 'brand',
    icon: <Zap size={32} />,
    title: 'Brands',
    subtitle: '1 token per campaign',
    description: 'Build a complete brand strategy with ad copy, full brand messaging, Google Sheet logging, and priority support for enterprise teams.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.05))',
    border: 'rgba(168,85,247,0.25)',
    features: [
      { icon: <Shield size={13} />,    label: 'Brand Strategy'  },
      { icon: <BarChart2 size={13} />, label: 'Ad Copy'         },
      { icon: <BarChart2 size={13} />, label: 'Sheet Logging'   },
      { icon: <Star size={13} />,      label: 'Priority Support'},
    ],
    badge: 'Brand',
  },
]

const TYPE_META = {
  event:   { color: '#7c3aed', icon: <Calendar size={14} />, label: 'Event'   },
  product: { color: '#06b6d4', icon: <Package  size={14} />, label: 'Product' },
  brand:   { color: '#a855f7', icon: <Zap      size={14} />, label: 'Brand'   },
}

function timeAgo(iso) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── No-accounts gate modal ──────────────────────────────────────────────────
function NoAccountsModal({ onConnect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        style={{ background: '#111', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 440, width: '100%', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
          <X size={18} />
        </button>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Link2 size={32} style={{ color: '#06b6d4' }} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Connect your accounts first
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
          You need to connect at least <strong style={{ color: '#06b6d4' }}>one social media account</strong> before launching a campaign. Your content will post directly to your own accounts.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onConnect}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #06b6d4, #7c3aed)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Link2 size={16} /> Connect Accounts <ArrowRight size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          {['Facebook', 'Instagram', 'LinkedIn', 'WhatsApp'].map(p => (
            <div key={p} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {p}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── No-token gate modal ─────────────────────────────────────────────────────
function NoTokensModal({ onBuy, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        style={{ background: '#111', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 440, width: '100%', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
          <X size={18} />
        </button>

        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Coins size={32} style={{ color: '#7c3aed' }} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>
          You're out of tokens
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
          You need at least <strong style={{ color: '#a78bfa' }}>1 campaign token</strong> to generate and post a campaign. Purchase a pack to continue.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onBuy}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Coins size={16} /> Buy Tokens <ArrowRight size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          {[['$10', '10 campaigns'], ['$20', '20 campaigns'], ['$30', '35 campaigns']].map(([price, label]) => (
            <div key={price} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <strong style={{ color: 'white' }}>{price}</strong> · {label}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns]     = useState([])
  const [showAll, setShowAll]         = useState(false)
  const [user, setUser]               = useState(null)
  const [tokenBalance, setTokenBalance] = useState(null)
  const [socialAccounts, setSocialAccounts] = useState({})
  const [authReady, setAuthReady]     = useState(false)
  const [showNoTokens, setShowNoTokens] = useState(false)
  const [showNoAccounts, setShowNoAccounts] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/signin'); return }
      setUser(u)
      const data = await getOrCreateUser(u.uid, u.displayName, u.email)
      setTokenBalance(data.tokenBalance ?? 0)
      setSocialAccounts(data.socialAccounts || {})
      setAuthReady(true)
    })
    return unsub
  }, [navigate])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
    setCampaigns(stored)
  }, [])

  const handleLaunch = (type) => {
    if (tokenBalance !== null && tokenBalance < 1) {
      setShowNoTokens(true)
      return
    }
    if (connectedCount === 0) {
      setShowNoAccounts(true)
      return
    }
    navigate(`/campaign/${type}`)
  }

  const viewCampaign = (c) => {
    sessionStorage.setItem('campaignResult', JSON.stringify(c.result))
    sessionStorage.setItem('campaignType',   c.type)
    sessionStorage.setItem('campaignMeta',   JSON.stringify(c.meta))
    navigate('/results')
  }

  const deleteCampaign = (id) => {
    const updated = campaigns.filter(c => c.id !== id)
    setCampaigns(updated)
    localStorage.setItem('evoke_campaigns', JSON.stringify(updated))
  }

  const connectedCount = Object.values(socialAccounts).filter(a => a?.connected).length
  const displayed = showAll ? campaigns : campaigns.slice(0, 5)

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <Navbar />

      <AnimatePresence>
        {showNoTokens && (
          <NoTokensModal
            onBuy={() => { setShowNoTokens(false); navigate('/purchase') }}
            onClose={() => setShowNoTokens(false)}
          />
        )}
        {showNoAccounts && (
          <NoAccountsModal
            onConnect={() => { setShowNoAccounts(false); navigate('/connect-accounts') }}
            onClose={() => setShowNoAccounts(false)}
          />
        )}
      </AnimatePresence>

      <div className="glow-orb glow-purple" style={{ width: 500, height: 500, top: -100, right: -100, opacity: 0.18 }} />
      <div className="glow-orb glow-cyan"   style={{ width: 400, height: 400, bottom: 0,    left: -100,  opacity: 0.14 }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '108px 24px 64px', position: 'relative', zIndex: 1 }}>

        {/* ── Header with token balance ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="badge" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <Zap size={13} /> Campaign Dashboard
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '10px' }}>
                What are you <span className="gradient-text">marketing today?</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', maxWidth: 480 }}>
                {user?.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}!` : 'Select a campaign type to generate your complete marketing package.'}
              </p>
            </div>

            {/* Token balance card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  background: tokenBalance > 0 ? 'rgba(124,58,237,0.12)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${tokenBalance > 0 ? 'rgba(124,58,237,0.35)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 14,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, background: tokenBalance > 0 ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={20} style={{ color: tokenBalance > 0 ? '#a78bfa' : '#f87171' }} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: tokenBalance > 0 ? 'white' : '#f87171' }}>
                    {tokenBalance ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    campaign token{tokenBalance !== 1 ? 's' : ''}
                  </div>
                </div>
              </motion.div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => navigate('/purchase')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Coins size={12} /> Buy Tokens
                </button>
                <button
                  onClick={() => navigate('/connect-accounts')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: connectedCount > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Link2 size={12} />
                  {connectedCount > 0 ? `${connectedCount} connected` : 'Connect Accounts'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Connect Accounts Banner (if nothing connected) ── */}
        <AnimatePresence>
          {connectedCount === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 14, marginBottom: 28, flexWrap: 'wrap' }}
            >
              <AlertCircle size={18} style={{ color: '#06b6d4', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Connect your social accounts</div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                  Your campaigns will post to your own Facebook, Instagram, LinkedIn & WhatsApp — not ours.
                </p>
              </div>
              <button
                onClick={() => navigate('/connect-accounts')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: 10, color: '#06b6d4', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                <Link2 size={13} /> Connect now <ArrowRight size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Campaign Type Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {campaignCards.map((card, i) => (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              onClick={() => handleLaunch(card.type)}
              style={{
                background: card.gradient,
                border: `1px solid ${card.border}`,
                borderRadius: '20px',
                padding: '32px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {card.popular && (
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '4px 12px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
                  POPULAR
                </div>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${card.color}20`, border: `1px solid ${card.color}35`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: card.color, letterSpacing: '0.06em', marginBottom: '20px' }}>
                {card.badge.toUpperCase()}
              </div>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: `${card.color}18`, border: `1px solid ${card.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '22px' }}>
                {card.icon}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>{card.title}</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>{card.subtitle}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>{card.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                {card.features.map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: `${card.color}12`, border: `1px solid ${card.color}25`, borderRadius: '100px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ color: card.color }}>{f.icon}</span>{f.label}
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', padding: '13px', background: (tokenBalance < 1 || connectedCount === 0) ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${card.color}, ${card.color}aa)`, border: (tokenBalance < 1 || connectedCount === 0) ? `1px solid ${card.color}30` : 'none', borderRadius: '12px', color: (tokenBalance < 1 || connectedCount === 0) ? 'rgba(255,255,255,0.4)' : 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                {tokenBalance < 1
                  ? <><Coins size={15} /> Buy Tokens to Launch</>
                  : connectedCount === 0
                  ? <><Link2 size={15} /> Connect Accounts to Launch</>
                  : <>Launch Campaign <ArrowRight size={17} /></>}
              </button>
            </motion.div>
          ))}
        </div>

        {/* ── Campaign History ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginTop: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Campaign History</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
                {campaigns.length === 0
                  ? 'No campaigns yet — launch one above'
                  : `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} generated`}
              </p>
            </div>
            {campaigns.length > 5 && (
              <button onClick={() => setShowAll(v => !v)} className="btn-ghost" style={{ fontSize: '13px' }}>
                {showAll
                  ? <><ChevronDown size={14} /> Show less</>
                  : <><ChevronDown size={14} /> Show all ({campaigns.length})</>}
              </button>
            )}
          </div>

          {campaigns.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <Clock size={36} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '14px' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>Your campaign history will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence>
                {displayed.map((c, i) => {
                  const meta = TYPE_META[c.type] || TYPE_META.event
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${meta.color}40`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: '11px', background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                          <span style={{ padding: '2px 8px', background: `${meta.color}18`, border: `1px solid ${meta.color}30`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: meta.color, letterSpacing: '0.04em', flexShrink: 0 }}>
                            {meta.label.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                          <Clock size={11} />
                          {timeAgo(c.date)}
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                          <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '11px' }}>● Posted</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => viewCampaign(c)} className="btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }}>
                          <Eye size={13} /> View Results
                        </button>
                        <button
                          onClick={() => deleteCampaign(c.id)}
                          style={{ padding: '7px 10px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── Info strip ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} style={{ marginTop: '40px', padding: '20px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Zap size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>1 token</strong> = one full AI campaign posted to your own LinkedIn, Instagram, Facebook, Email & WhatsApp accounts automatically.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
