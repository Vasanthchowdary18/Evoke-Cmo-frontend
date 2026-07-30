import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Check, Sparkles, Zap } from 'lucide-react'
import { useUserPlan } from '../hooks/useUserPlan'
import { PLANS, PLAN_LABELS, PLAN_COLORS, PLAN_HIGHLIGHTS } from '../lib/planGate'
import Navbar from './Navbar.jsx'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const BORDER = 'rgba(255,255,255,0.07)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'

const PLAN_PRICES = {
  'package-a': '$1,000',
  'package-b': '$1,800',
  'package-c': '$4,000',
}

const STRIPE_LINKS = {
  'package-a': import.meta.env.VITE_STRIPE_LINK_A || null,
  'package-b': import.meta.env.VITE_STRIPE_LINK_B || null,
  'package-c': import.meta.env.VITE_STRIPE_LINK_C || null,
}

// On localhost, plan gates are bypassed so you can develop freely
const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Plan gating is off everywhere while packages and billing are being reworked.
// Flip back to true to re-enable the upgrade walls — the pricing pages, Stripe
// links and per-plan config below are all still intact and untouched.
const PLAN_GATES_ENABLED = false

export default function PlanGate({ requiredPlan, featureName, children }) {
  const { plan: userPlan, loading } = useUserPlan()
  const navigate = useNavigate()

  // Gates disabled, or running locally — render the feature.
  if (!PLAN_GATES_ENABLED || IS_DEV) return children

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(200,151,62,0.3)',
          borderTopColor: '#c8973e',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const userLevel     = PLANS.indexOf(userPlan || 'free')
  const requiredLevel = PLANS.indexOf(requiredPlan || 'free')

  // User's plan is sufficient — render the page normally
  if (userLevel >= requiredLevel) return children

  const color      = PLAN_COLORS[requiredPlan]  || '#c8973e'
  const label      = PLAN_LABELS[requiredPlan]  || requiredPlan
  const price      = PLAN_PRICES[requiredPlan]
  const highlights = PLAN_HIGHLIGHTS[requiredPlan] || []
  const stripe     = STRIPE_LINKS[requiredPlan]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      {/* Blurred page preview behind the gate */}
      <div style={{
        position: 'fixed', inset: 0, top: 64,
        filter: 'blur(10px) brightness(0.3)',
        pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}>
        {children}
      </div>

      {/* Lock card */}
      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        marginTop: 64,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: CARD,
            border: `1.5px solid ${color}40`,
            borderRadius: 24,
            padding: '44px 40px',
            maxWidth: 480,
            width: '100%',
            boxShadow: `0 0 80px ${color}12, 0 32px 80px rgba(0,0,0,0.5)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow orb */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Lock icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: `${color}15`, border: `1.5px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px',
          }}>
            <Lock size={26} color={color} />
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 22, fontWeight: 900, color: TEXT,
            textAlign: 'center', margin: '0 0 10px',
            fontFamily: "'Syne','Inter',sans-serif", letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}>
            {featureName
              ? <>{featureName} requires <span style={{ color }}>{label}</span></>
              : <><span style={{ color }}>{label}</span> required</>
            }
          </h2>
          <p style={{
            fontSize: 13, color: TEXT2, textAlign: 'center',
            margin: '0 0 28px', lineHeight: 1.65,
          }}>
            Upgrade to unlock this feature along with everything else included in {label}.
          </p>

          {/* Price pill */}
          <div style={{
            background: `${color}10`, border: `1px solid ${color}28`,
            borderRadius: 14, padding: '16px 22px', marginBottom: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '0.1em', marginBottom: 4 }}>
                {label.toUpperCase()}
              </div>
              <div style={{
                fontSize: 30, fontWeight: 900, color: TEXT,
                fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1,
              }}>
                {price}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Zap size={18} color={color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: TEXT3 }}>{highlights.length} features</div>
            </div>
          </div>

          {/* Feature list */}
          <div style={{ marginBottom: 28 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
                <Check size={13} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Upgrade button */}
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (stripe) window.open(stripe, '_blank')
              else navigate(`/${requiredPlan}`)
            }}
            style={{
              width: '100%', padding: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              border: 'none', borderRadius: 12,
              color: requiredPlan === 'package-b' ? '#0e0c09' : '#fff',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            <Sparkles size={15} />
            Upgrade to {label} — {price}
            <ArrowRight size={15} />
          </motion.button>

          <button
            onClick={() => navigate('/plans')}
            style={{
              width: '100%', marginTop: 12, background: 'none', border: 'none',
              color: TEXT3, fontSize: 12, cursor: 'pointer', padding: '6px',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            View all plans →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
