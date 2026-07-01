import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Lock, ArrowRight, Check, Star, Zap } from 'lucide-react'
import { PLAN_LABELS, PLAN_COLORS, PLAN_TAGS } from '../lib/planGate.js'

const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const BORDER= 'rgba(255,255,255,0.07)'

const PLAN_DETAILS = {
  'package-a': {
    label: 'Package A',
    price: '$1,000',
    tokens: '500 EGT Tokens',
    tagline: 'Professional visuals + social posting',
    color: '#10b981',
    badge: null,
    route: '/package-a',
    features: [
      'Everything in Free',
      'Multi-angle product photography',
      'Lifestyle & scene images',
      'Ad-ready static banners',
      'Managed social media posting',
      'Image SEO optimisation',
    ],
  },
  'package-b': {
    label: 'Package B',
    price: '$1,800',
    tokens: '1,200 EGT Tokens',
    tagline: 'Video content + 30-day calendar',
    color: '#c8973e',
    badge: 'MOST POPULAR',
    route: '/package-b',
    features: [
      'Everything in Package A',
      'Lifestyle short-form video',
      '360° product video',
      '30-day full content calendar',
      'Reel & short-form scripts',
      'Multi-platform captions & hashtags',
      'PDF / CSV content export',
      'KPI & engagement recommendations',
    ],
  },
  'package-c': {
    label: 'Package C',
    price: '$4,000',
    tokens: '3,000 EGT Tokens',
    tagline: 'Full paid ad deployment at scale',
    color: '#a855f7',
    badge: 'PREMIUM',
    route: '/package-c',
    features: [
      'Everything in Package B',
      '3D product renders (premium)',
      'Ad creatives — static + video',
      'Facebook & Google Ads manager',
      'Precision audience targeting',
      'Full campaign deploy & management',
    ],
  },
}

function PlanCard({ planKey, featureTitle, onClose, navigate, highlight }) {
  const p = PLAN_DETAILS[planKey]
  if (!p) return null
  return (
    <div style={{
      flex: 1,
      background: highlight ? `linear-gradient(160deg, rgba(200,151,62,0.07), rgba(200,151,62,0.02))` : 'rgba(255,255,255,0.02)',
      border: `1.5px solid ${highlight ? p.color + '45' : BORDER}`,
      borderRadius: 16,
      padding: '22px 20px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'all 0.2s',
    }}>
      {p.badge && (
        <div style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`,
          color: planKey === 'package-b' ? '#0e0c09' : '#fff',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          padding: '4px 12px', borderRadius: 100,
        }}>
          {p.badge}
        </div>
      )}

      {/* Plan header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: p.color + '18', border: `1px solid ${p.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
            {planKey === 'package-c' ? <Star size={13} fill={p.color}/> : <Zap size={13}/>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: p.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.label}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1 }}>{p.price}</div>
        <div style={{ fontSize: 11, color: TEXT3, marginTop: 3 }}>{p.tokens}</div>
        <div style={{ fontSize: 12, color: TEXT2, marginTop: 6, lineHeight: 1.4 }}>{p.tagline}</div>
      </div>

      {/* Feature list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {p.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.color + '15', border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Check size={10} color={p.color}/>
            </div>
            <span style={{ fontSize: 12, color: i === 0 ? TEXT3 : TEXT2, lineHeight: 1.5, fontStyle: i === 0 ? 'italic' : 'normal' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => { onClose(); navigate(p.route) }}
        style={{
          width: '100%', padding: '12px',
          background: highlight
            ? `linear-gradient(135deg, ${p.color}, ${p.color}bb)`
            : 'transparent',
          border: highlight ? 'none' : `1px solid ${p.color}50`,
          borderRadius: 12,
          color: highlight ? (planKey === 'package-b' ? '#0e0c09' : '#fff') : p.color,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Upgrade to {p.label} <ArrowRight size={14}/>
      </button>
    </div>
  )
}

export default function UpgradeModal({ requiredPlan, featureTitle, onClose }) {
  const navigate = useNavigate()
  if (!requiredPlan || requiredPlan === 'free') return null

  const showComparison = requiredPlan === 'package-b' || requiredPlan === 'package-c'
  const reqColor = PLAN_COLORS[requiredPlan] || GOLD
  const reqLabel = PLAN_LABELS[requiredPlan]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px',
        }}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          style={{
            width: '100%',
            maxWidth: showComparison ? 740 : 460,
            background: '#161410',
            borderRadius: 22,
            border: `1px solid ${reqColor}28`,
            overflow: 'hidden',
            boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${reqColor}12`,
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, background: showComparison
            ? 'linear-gradient(90deg, #c8973e, #a855f7)'
            : `linear-gradient(90deg, ${reqColor}, ${reqColor}88)` }} />

          <div style={{ padding: '24px 24px 28px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: reqColor + '15', border: `1px solid ${reqColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: reqColor }}>
                  <Lock size={19}/>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: reqColor, letterSpacing: '0.08em', marginBottom: 2 }}>
                    UPGRADE REQUIRED
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, letterSpacing: '-0.01em' }}>
                    {featureTitle ? `"${featureTitle}" needs ${reqLabel}+` : `${reqLabel} or higher required`}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT3, cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15}/>
              </button>
            </div>

            {showComparison ? (
              <>
                <p style={{ fontSize: 13, color: TEXT2, marginBottom: 22, lineHeight: 1.6 }}>
                  Choose the plan that fits your goals — both unlock this feature and more.
                </p>
                <div style={{ display: 'flex', gap: 14 }}>
                  <PlanCard
                    planKey="package-b"
                    featureTitle={featureTitle}
                    onClose={onClose}
                    navigate={navigate}
                    highlight={requiredPlan === 'package-b'}
                  />
                  <PlanCard
                    planKey="package-c"
                    featureTitle={featureTitle}
                    onClose={onClose}
                    navigate={navigate}
                    highlight={requiredPlan === 'package-c'}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Single plan — Package A */}
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: TEXT3, fontWeight: 600, marginBottom: 3 }}>LOCKED FEATURE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{featureTitle}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>Available on {reqLabel} and above</div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', marginBottom: 10 }}>
                    WHAT YOU GET WITH {PLAN_TAGS[requiredPlan]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {(PLAN_DETAILS[requiredPlan]?.features || []).map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: reqColor + '15', border: `1px solid ${reqColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} color={reqColor}/>
                        </div>
                        <span style={{ fontSize: 13, color: TEXT2 }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => { onClose(); navigate(PLAN_DETAILS[requiredPlan]?.route || '/plans') }}
                    style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${reqColor}, ${reqColor}bb)`, border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    Upgrade to {reqLabel} <ArrowRight size={15}/>
                  </button>
                  <button
                    onClick={onClose}
                    style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}

            {showComparison && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
