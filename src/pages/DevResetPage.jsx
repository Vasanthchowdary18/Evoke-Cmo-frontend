import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'

const BG   = '#0e0c09'
const GOLD = '#c8973e'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'

const STEPS = [
  'Clearing local storage…',
  'Resetting Firestore profile…',
  'Clearing brand knowledge base…',
  'Clearing social accounts…',
  'Done! Redirecting…',
]

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export default function DevResetPage() {
  const { user }               = useAuth()
  const navigate               = useNavigate()
  const [step, setStep]        = useState(-1)
  const [error, setError]      = useState('')
  const [done, setDone]        = useState(false)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    runReset()
  }, [user]) // eslint-disable-line

  async function runReset() {
    try {
      // Step 0 — clear browser storage
      setStep(0)
      await delay(400)
      localStorage.clear()
      sessionStorage.clear()

      // Step 1 — reset Firestore onboarding + plan
      setStep(1)
      await delay(400)
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, {
        onboardingComplete:  false,
        chatOnboardingDone:  deleteField(),
        brandSetupComplete:  deleteField(),
        onboardingData:      deleteField(),
        selectedPlan:        deleteField(),
        recommendedRoutes:   deleteField(),
        brandName:           deleteField(),
      })

      // Step 2 — clear brand knowledge base
      setStep(2)
      await delay(400)
      await updateDoc(ref, {
        knowledgeBase: deleteField(),
      })

      // Step 3 — clear social accounts
      setStep(3)
      await delay(400)
      await updateDoc(ref, {
        socialAccounts: deleteField(),
      })

      // Step 4 — done
      setStep(4)
      setDone(true)
      await delay(1200)
      navigate('/')
    } catch (e) {
      setError(e.message || 'Reset failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: BG, color: TEXT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',sans-serif", padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#111009', border: '1px solid rgba(200,151,62,0.2)',
        borderRadius: 20, padding: '40px 36px', textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 24px',
          background: done ? 'rgba(16,185,129,0.15)' : 'rgba(200,151,62,0.12)',
          border: `2px solid ${done ? '#10b981' : 'rgba(200,151,62,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {done ? '✓' : '⟳'}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', fontFamily: "'Syne','Inter',sans-serif" }}>
          {done ? 'Reset Complete' : 'Resetting…'}
        </h2>
        <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 32px' }}>
          {done ? 'Redirecting to home in a moment.' : 'Clearing all saved data from your account.'}
        </p>

        {/* Steps */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((label, i) => {
            const isActive = step === i
            const isDone   = step > i || done
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: isActive ? 'rgba(200,151,62,0.1)' : isDone ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(200,151,62,0.35)' : isDone ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'rgba(200,151,62,0.2)' : isDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isActive ? GOLD : isDone ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: isActive ? GOLD : isDone ? '#10b981' : 'rgba(255,255,255,0.2)',
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? TEXT : isDone ? '#10b981' : TEXT2,
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {error && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#ef4444' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
}
