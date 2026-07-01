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
  'Disconnecting social accounts…',
  'Clearing brand knowledge base…',
  'Done! Redirecting to home…',
]

export default function DevResetPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [step, setStep]     = useState(0)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    runReset()
  }, [user])

  async function runReset() {
    try {
      // Step 1 — clear local storage
      setStep(0)
      await delay(500)
      localStorage.clear()
      sessionStorage.clear()

      // Step 2 — reset Firestore
      setStep(1)
      await delay(500)
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingComplete: false,
        onboardingData:     deleteField(),
      })

      // Step 3 — disconnect social accounts
      setStep(2)
      await delay(500)
      await updateDoc(doc(db, 'users', user.uid), {
        socialAccounts: {
          facebook:  { connected: false, pageId: '', pageAccessToken: '', pageName: '' },
          instagram: { connected: false, businessAccountId: '', pageName: '' },
          linkedin:  { connected: false, personUrn: '', accessToken: '', name: '' },
          twitter:   { connected: false, accessToken: '', username: '', userId: '' },
          whatsapp:  { connected: false, phoneNumberId: '', accessToken: '' },
          gmail:     { connected: false, email: '' },
        },
        tokenBalance: 0,
      })

      // Step 4 — clear brand KB
      setStep(3)
      await delay(500)
      await updateDoc(doc(db, 'users', user.uid), {
        knowledgeBase: deleteField(),
      })

      // Step 5 — done
      setStep(4)
      setDone(true)
      await delay(1000)
      navigate('/agents-hub')

    } catch (err) {
      setError(err.message)
    }
  }

  function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
  }

  return (
    <div style={{
      minHeight: '100vh', background: BG, color: TEXT,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Inter', sans-serif", gap: 32,
    }}>
      {/* Logo / label */}
      <div style={{
        fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.12em',
        textTransform: 'uppercase', opacity: 0.7,
      }}>
        EVOX CMO · Dev Reset
      </div>

      {/* Spinner */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: `3px solid rgba(200,151,62,0.15)`,
        borderTopColor: done ? '#10b981' : GOLD,
        animation: done ? 'none' : 'spin 0.8s linear infinite',
      }} />

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: i <= step ? 1 : 0.25,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? '#10b981' : i === step ? GOLD : 'rgba(255,255,255,0.08)',
              fontSize: 10, fontWeight: 800,
              color: i <= step ? '#0e0c09' : 'transparent',
              transition: 'background 0.3s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 13,
              color: i === step ? TEXT : i < step ? '#10b981' : TEXT2,
              fontWeight: i === step ? 600 : 400,
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 20px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
          color: '#ef4444', fontSize: 13, maxWidth: 320, textAlign: 'center',
        }}>
          Error: {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
