import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser } from '../services/userService'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const GOLD    = '#c8973e'
const GBORDER = 'rgba(200,151,62,0.22)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const PLANS = [
  {
    key: 'free',
    label: 'FREE',
    price: '$0',
    tagline: 'Start with AI strategy, zero cost',
    badge: null,
    gold: true,
    features: ['Objective & Strategy', 'Lead Planning', 'Content Framework'],
    cta: 'Start Free',
  },
  {
    key: 'package-a',
    label: 'PACKAGE A',
    price: '$1,000',
    tokens: '500 EGT Tokens',
    tagline: 'Professional visuals + social posting',
    badge: null,
    gold: false,
    color: '#10b981',
    features: ['Everything in Free', 'Multi-angle Images', 'Ad-ready Banners'],
    cta: 'Get Package A',
  },
  {
    key: 'package-b',
    label: 'PACKAGE B',
    price: '$1,800',
    tokens: '1,200 EGT Tokens',
    tagline: 'Video content + 30-day calendar',
    badge: 'MOST POPULAR',
    gold: false,
    color: '#c8973e',
    features: [
      'Everything in A',
      'Lifestyle Video Generator',
      '360° Product Video',
      '30-Day Content Calendar',
      'Reel & Short-form Scripts',
      'Multi-platform Captions & Hashtags',
      'PDF / CSV Content Export',
      'KPI & Engagement Recommendations',
    ],
    cta: 'Get Package B',
  },
  {
    key: 'package-c',
    label: 'PACKAGE C',
    price: '$4,000',
    tokens: '3,000 EGT Tokens',
    tagline: 'Full paid ad deployment at scale',
    badge: null,
    gold: false,
    color: '#a855f7',
    features: [
      'Everything in B',
      '3D Images — Premium product renders',
      'Ads Creation — Conversion-optimised creatives',
      'Ads Manager Connect — FB & Google campaigns',
      'Target Audience Selection — Precision segmentation',
      'Deploy Ads — Full campaign launch & management',
    ],
    cta: 'Get Package C',
  },
]

export default function PlansPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (!user) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(d => setBalance(d.tokenBalance || 0))
  }, [user])

  const handlePlan = (key) => {
    try { localStorage.setItem('evoke_selected_package', key) } catch {}
    // Bypass token purchase — go straight to connect social accounts
    navigate('/connect-accounts?setup=cmo')
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', fontSize: 13, marginBottom: 36, padding: 0 }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px',
            background: 'rgba(200,151,62,0.12)', border: `1px solid ${GBORDER}`,
            borderRadius: 100, fontSize: 10, fontWeight: 800, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            STEP 8 OF 8 · CHOOSE YOUR PLAN
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: TEXT,
            fontFamily: "'Syne','Inter',sans-serif", marginBottom: 12, letterSpacing: '-0.02em',
          }}>
            Which plan fits you best?
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, maxWidth: 480, margin: '0 auto' }}>
            All plans include AI strategy modules personalised to your answers.
          </p>
        </div>

        {/* Token balance bar */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 28, padding: '10px 20px',
            background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.2)',
            borderRadius: 12, fontSize: 13, color: GOLD, fontWeight: 700,
          }}>
            <Zap size={14} /> Your EGT Balance: {balance} Tokens
          </div>
        )}

        {/* Plan cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePlan(p.key)}
              style={{
                position: 'relative',
                background: p.gold ? 'linear-gradient(160deg,#221d10,#1c1a13)' : CARD,
                border: `1px solid ${p.gold ? 'rgba(200,151,62,0.5)' : GBORDER}`,
                borderRadius: 16, padding: '24px 20px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s', color: TEXT,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(200,151,62,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)', color: '#0e0c09',
                  fontSize: 9, fontWeight: 800, padding: '4px 14px', borderRadius: 100,
                  whiteSpace: 'nowrap', letterSpacing: '0.08em',
                }}>{p.badge}</div>
              )}

              <div style={{ fontSize: 10, fontWeight: 800, color: p.gold ? GOLD : TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 4, letterSpacing: '-0.02em' }}>
                {p.price}
              </div>
              {p.tokens && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 700, color: GOLD,
                  background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)',
                  borderRadius: 6, padding: '3px 8px', marginBottom: 8,
                }}>
                  ⚡ {p.tokens}
                </div>
              )}
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 16, lineHeight: 1.5 }}>
                {p.tagline}
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, marginBottom: 18 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                    <Check size={11} color={p.gold ? GOLD : TEXT3} />
                    <span style={{ fontSize: 12, color: TEXT2 }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{
                width: '100%', padding: '10px',
                background: p.gold ? 'linear-gradient(135deg,#d4a853,#b8803a)' : 'rgba(255,255,255,0.06)',
                borderRadius: 9, border: p.gold ? 'none' : `1px solid ${BORDER}`,
                color: p.gold ? '#0e0c09' : TEXT2,
                fontSize: 13, fontWeight: 700, textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {p.cta} {p.key === 'free' && <ArrowRight size={13} />}
              </div>
            </button>
          ))}
        </div>

        {/* Fine print */}
        <p style={{ textAlign: 'center', fontSize: 12, color: TEXT3 }}>
          Free plan includes all 3 AI agents · No credit card required · Upgrade anytime
        </p>
      </div>
    </div>
  )
}
