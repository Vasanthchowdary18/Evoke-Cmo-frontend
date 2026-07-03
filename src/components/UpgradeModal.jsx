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
        <div style={{ fontSize: 10, fontWeight: 800, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          {p.label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 2 }}>
          {p.price}
        </div>
        <div style={{ fontSize: 11, color: TEXT3, marginBottom: 8 }}>{p.tokens}</div>
        <p style={{ fontSize: 12, color: TEXT2, margin: 0, lineHeight: 1.5 }}>{p.tagline}</p>
      </div>

      <div style={{ flex: 1, marginBottom: 18 }}>
        {p.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 9 }}>
            <Check size={13} color={p.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => { onClose(); navigate(PLAN_DETAILS[planKey]?.route || '/plans') }}
        style={{
          width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
          border: 'none', borderRadius: 10,
          color: planKey === 'package-b' ? '#0e0c09' : '#fff',
          fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Upgrade to {p.label} <ArrowRight size={14} />
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: BG, border: `1px solid ${BORDER}`, borderRadius: 24,
            padding: '32px 30px', maxWidth: showComparison ? 720 : 420, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, cursor: 'pointer' }}>
            <X size={15} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px',
              background: `${reqColor}15`, border: `1px solid ${reqColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: reqColor,
            }}>
              <Lock size={22} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif", margin: '0 0 6px' }}>
              {featureTitle ? `"${featureTitle}" needs ${reqLabel}+` : `${reqLabel} or higher required`}
            </h2>
            <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>
              Upgrade your plan to unlock this feature and everything else in {reqLabel}.
            </p>
          </div>

          {showComparison ? (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
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
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Star size={13} color={GOLD} />
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{featureTitle}</div>
              </div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.08em', marginBottom: 12 }}>
                  WHAT YOU GET WITH {PLAN_TAGS[requiredPlan]}
                </div>
                {(PLAN_DETAILS[requiredPlan]?.features || []).map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 9 }}>
                    <Check size={13} color={reqColor} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { onClose(); navigate(PLAN_DETAILS[requiredPlan]?.route || '/plans') }}
                style={{
                  width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: `linear-gradient(135deg, ${reqColor}, ${reqColor}cc)`, border: 'none', borderRadius: 12,
                  color: requiredPlan === 'package-b' ? '#0e0c09' : '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Zap size={15} /> Upgrade to {reqLabel} <ArrowRight size={15} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
