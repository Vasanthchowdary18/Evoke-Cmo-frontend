import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft, Map } from 'lucide-react'

const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const JOURNEY = [
  { step: 1,  label: 'Brand Setup',          path: '/brand-kb' },
  { step: 2,  label: 'Marketing Strategy',    path: '/strategy' },
  { step: 3,  label: 'Campaign Planning',     path: '/campaign-hub' },
  { step: 4,  label: 'Audience Builder',      path: '/audience-builder' },
  { step: 5,  label: 'Content Generation',    path: '/caption-suite' },
  { step: 6,  label: 'Creative Assets',       path: '/products' },
  { step: 7,  label: 'Video Generation',      path: '/video-gen' },
  { step: 8,  label: 'Brand Governance',      path: '/brand-governance' },
  { step: 9,  label: 'Approval Queue',        path: '/queue' },
  { step: 10, label: 'Post Content',          path: '/post-content' },
  { step: 11, label: 'Analytics',             path: '/analytics' },
  { step: 12, label: 'Executive Report',      path: '/executive-report' },
]

export default function JourneyFooter({ currentPath }) {
  const navigate = useNavigate()

  const currentIndex = JOURNEY.findIndex(j => j.path === currentPath)
  const current  = JOURNEY[currentIndex]
  const prev     = JOURNEY[currentIndex - 1] || null
  const next     = JOURNEY[currentIndex + 1] || null

  if (!current) return null

  return (
    <div style={{
      maxWidth: 960, margin: '48px auto 0', padding: '0 20px 60px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Map size={13} color={GOLD} />
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Step {current.step} of {JOURNEY.length}
        </span>
        <span style={{ fontSize: 11, color: TEXT3, margin: '0 4px' }}>·</span>
        {JOURNEY.map((j, i) => (
          <div
            key={j.step}
            title={j.label}
            style={{
              width: i === currentIndex ? 20 : 8,
              height: 6, borderRadius: 3,
              background: i < currentIndex ? '#10b981' : i === currentIndex ? GOLD : BORDER,
              transition: 'all 0.2s', cursor: 'pointer', flexShrink: 0,
            }}
            onClick={() => navigate(j.path)}
          />
        ))}
      </div>

      {/* Prev / Next buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {prev ? (
          <button
            onClick={() => navigate(prev.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', background: 'transparent',
              border: `1px solid ${BORDER}`, borderRadius: 12,
              color: TEXT2, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} /> Step {prev.step}: {prev.label}
          </button>
        ) : <div />}

        {next ? (
          <button
            onClick={() => navigate(next.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 28px',
              background: `linear-gradient(135deg, ${GOLD}, #a87030)`,
              border: 'none', borderRadius: 12,
              color: '#0e0c09', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(200,151,62,0.3)',
            }}
          >
            Next: Step {next.step} — {next.label} <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/agents-hub')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 28px',
              background: `linear-gradient(135deg, #10b981, #059669)`,
              border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Journey Complete — Back to Dashboard <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
