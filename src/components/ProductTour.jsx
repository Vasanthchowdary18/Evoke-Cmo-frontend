/**
 * ProductTour.jsx
 * A guided spotlight walkthrough for first-time users, shown once on their
 * first Dashboard visit after finishing setup (see DashboardPage.jsx).
 * Steps target real UI elements via a `data-tour="<id>"` attribute — no
 * fake screenshots, it points at the actual sidebar/dashboard.
 */
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const GOLD = '#c8973e'
const CARD = '#1c1a13'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.65)'
const BORDER = 'rgba(200,151,62,0.35)'

const STEPS = [
  {
    target: '[data-tour="dashboard-header"]',
    title: 'Welcome to your Command Console',
    body: 'This is your AI CMO command center — everything you need to plan, launch, and track marketing lives here.',
  },
  {
    target: '[data-tour="nav-connect-channels"]',
    title: 'Connect Channels',
    body: 'Link Facebook, Instagram, LinkedIn, and more. Campaigns publish directly to whatever you connect here.',
  },
  {
    target: '[data-tour="nav-agents-hub"]',
    title: 'AI Agents Hub',
    body: 'Meet your AI executive team — CMO, CFO, CTO, and more, each ready to help with a specific part of your business.',
  },
  {
    target: '[data-tour="nav-campaigns"]',
    title: 'Campaign Builder',
    body: 'Create a new campaign here — choose your objective, audience, and let AI generate the content.',
  },
  {
    target: '[data-tour="nav-campaign-execution"]',
    title: 'Campaign Execution',
    body: 'Review, approve, and schedule content before it goes live — nothing publishes without your say-so.',
  },
  {
    target: '[data-tour="dashboard-getting-started"]',
    title: "You're all set",
    body: 'This checklist tracks your progress — the "Next" step is always marked, so you always know what to do next.',
  },
]

function useTargetRect(selector, stepIndex) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(selector)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    window.addEventListener('resize', measure)
    const t = setTimeout(measure, 50)
    return () => { window.removeEventListener('resize', measure); clearTimeout(t) }
  }, [selector, stepIndex])

  return rect
}

export default function ProductTour({ onFinish }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const rect = useTargetRect(current.target, step)
  const cardRef = useRef(null)

  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) onFinish()
    else setStep(s => s + 1)
  }
  const skip = () => onFinish()

  const pad = 8
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Position the tooltip card near the spotlighted element, flipping side if it'd overflow.
  const cardTop = spot ? Math.min(Math.max(spot.top, 16), window.innerHeight - 220) : window.innerHeight / 2 - 100
  const cardLeft = spot
    ? (spot.left + spot.width + 320 < window.innerWidth ? spot.left + spot.width + 20 : Math.max(16, spot.left - 320))
    : window.innerWidth / 2 - 160

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      {/* Dimmed backdrop with a spotlight cutout via box-shadow trick */}
      {spot ? (
        <div
          style={{
            position: 'fixed',
            top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(5,5,10,0.72)',
            border: `2px solid ${GOLD}`,
            transition: 'all 0.25s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,10,0.72)' }} />
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed', top: cardTop, left: cardLeft, width: 300,
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: '20px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          fontFamily: "'Inter',sans-serif", transition: 'all 0.25s ease',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', marginBottom: 8 }}>
          STEP {step + 1} OF {STEPS.length}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 8, fontFamily: "'Syne','Inter',sans-serif" }}>
          {current.title}
        </div>
        <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.55, margin: '0 0 18px' }}>
          {current.body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={skip} style={{ background: 'none', border: 'none', color: TEXT2, fontSize: 12, cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit' }}>
            Skip tour
          </button>
          <button onClick={next} style={{
            padding: '8px 18px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none',
            borderRadius: 8, color: '#0e0c09', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
