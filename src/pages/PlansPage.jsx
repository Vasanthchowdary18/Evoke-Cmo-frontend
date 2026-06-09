import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft, Target, Image, Film, Monitor, Share2, Layers, Rocket, Megaphone } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

/* ── colours (match Landing.jsx) ── */
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
    price: 'Contact Us',
    tagline: 'Professional visuals + social posting',
    badge: null,
    gold: false,
    features: ['Everything in Free', 'Multi-angle Images', 'Ad-ready Banners'],
    cta: 'Get Package A',
  },
  {
    key: 'package-b',
    label: 'PACKAGE B',
    price: 'Contact Us',
    tagline: 'Video content + 30-day calendar',
    badge: 'MOST POPULAR',
    gold: false,
    features: ['Everything in A', 'Brand Story Video', '360° Product Video'],
    cta: 'Get Package B',
  },
  {
    key: 'package-c',
    label: 'PACKAGE C',
    price: 'Contact Us',
    tagline: 'Full paid ad deployment at scale',
    badge: null,
    gold: false,
    features: ['Everything in B', '3D Images', 'Ads Manager + Deploy'],
    cta: 'Get Package C',
  },
]

export default function PlansPage() {
  const navigate = useNavigate()

  const handlePlan = (key) => {
    if (key === 'free') {
      navigate('/free-plan')
    } else {
      window.open('mailto:hello@evokecmo.com?subject=Enquiry: ' + key.replace('-', ' ').toUpperCase(), '_blank')
    }
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
              <div style={{ fontSize: 24, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 6 }}>
                {p.price}
              </div>
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
