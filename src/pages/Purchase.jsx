import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Check, ArrowRight, Coins, Shield, Star, AlertCircle, Loader2, X } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getOrCreateUser, addTokens, TOKEN_PACKAGES } from '../services/userService'

// Load Razorpay script dynamically
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── CONFIGURE YOUR RAZORPAY KEY HERE ────────────────────────────────────────
// Replace with your Razorpay Key ID from dashboard.razorpay.com
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_REPLACE_ME'
// ─────────────────────────────────────────────────────────────────────────────

export default function Purchase() {
  const navigate = useNavigate()
  const [user, setUser]           = useState(null)
  const [balance, setBalance]     = useState(0)
  const [selected, setSelected]   = useState(null)
  const [paying, setPaying]       = useState(false)
  const [success, setSuccess]     = useState(null)
  const [error, setError]         = useState('')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/signin'); return }
      setUser(u)
      const data = await getOrCreateUser(u.uid, u.displayName, u.email)
      setBalance(data.tokenBalance || 0)
      setAuthReady(true)
    })
    return unsub
  }, [navigate])

  const handleBuy = async (pkg) => {
    if (!user) return
    setSelected(pkg.id)
    setError('')
    setPaying(true)

    const loaded = await loadRazorpay()
    if (!loaded) {
      setError('Could not load payment system. Check your internet connection.')
      setPaying(false)
      return
    }

    const options = {
      key:          RAZORPAY_KEY_ID,
      amount:       pkg.price * 100,   // paise (multiply by 100)
      currency:     'INR',
      name:         'Evoke CMO',
      description:  `${pkg.tokens} Campaign Tokens — ${pkg.label} Pack`,
      image:        '/logo.png',
      prefill: {
        name:  user.displayName || '',
        email: user.email || '',
      },
      theme:  { color: pkg.color },
      modal: {
        ondismiss: () => {
          setPaying(false)
          setSelected(null)
        },
      },
      handler: async (response) => {
        // Payment succeeded — add tokens to Firestore
        try {
          await addTokens(user.uid, pkg.tokens)
          setBalance(b => b + pkg.tokens)
          setSuccess(pkg)
        } catch (e) {
          setError('Payment captured but token update failed. Please contact support with payment ID: ' + response.razorpay_payment_id)
        } finally {
          setPaying(false)
          setSelected(null)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (resp) => {
      setError('Payment failed: ' + resp.error.description)
      setPaying(false)
      setSelected(null)
    })
    rzp.open()
  }

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

      <div className="glow-orb glow-purple" style={{ width: 600, height: 600, top: -150, right: -150, opacity: 0.15 }} />
      <div className="glow-orb glow-cyan"   style={{ width: 400, height: 400, bottom: 0, left: -100, opacity: 0.12 }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '108px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="badge" style={{ marginBottom: 16, display: 'inline-flex', gap: 6 }}>
            <Coins size={13} /> Campaign Tokens
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>
            Buy <span className="gradient-text">Campaign Tokens</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
            Each token powers one full AI campaign — email, WhatsApp, LinkedIn, Instagram, Facebook and more, posted automatically to your accounts.
          </p>

          {/* Current balance pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginTop: 24, padding: '10px 20px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 100, fontSize: 14, fontWeight: 700,
          }}>
            <Zap size={15} style={{ color: '#7c3aed' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Current balance:</span>
            <span style={{ color: '#a78bfa' }}>{balance} token{balance !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>

        {/* ── Success Modal ── */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                style={{ background: '#111', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 420, width: '100%' }}
              >
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Check size={32} style={{ color: '#4ade80' }} />
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>Tokens Added!</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 8 }}>
                  <strong style={{ color: '#4ade80' }}>{success.tokens} tokens</strong> have been added to your account.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 32 }}>
                  New balance: {balance} token{balance !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => { setSuccess(null); navigate('/connect-accounts') }}
                    style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    Connect Accounts <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => { setSuccess(null); navigate('/dashboard') }}
                    className="btn-ghost"
                    style={{ fontSize: 14 }}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, marginBottom: 32 }}
          >
            <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
            <span style={{ color: '#f87171', fontSize: 14 }}>{error}</span>
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* ── Packages ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 56 }}>
          {TOKEN_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: `linear-gradient(135deg, ${pkg.color}14, ${pkg.color}06)`,
                border: `1px solid ${pkg.popular ? pkg.color + '55' : pkg.color + '28'}`,
                borderRadius: 20,
                padding: 32,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {pkg.popular && (
                <div style={{ position: 'absolute', top: 18, right: 18, padding: '4px 12px', background: `linear-gradient(135deg, ${pkg.color}, #7c3aed)`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
                  BEST VALUE
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${pkg.color}20`, border: `1px solid ${pkg.color}35`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: pkg.color, letterSpacing: '0.06em', marginBottom: 16 }}>
                  {pkg.label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', color: 'white' }}>₹{pkg.price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 10 }}>INR</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: pkg.color }}>{pkg.tokens}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600 }}>campaign tokens</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>
                  {pkg.perToken} per campaign
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {pkg.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${pkg.color}20`, border: `1px solid ${pkg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} style={{ color: pkg.color }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleBuy(pkg)}
                disabled={paying}
                style={{
                  width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer',
                  background: paying && selected === pkg.id ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${pkg.color}, ${pkg.color}bb)`,
                  border: paying && selected !== pkg.id ? `1px solid ${pkg.color}40` : 'none',
                  borderRadius: 12, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: paying && selected !== pkg.id ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {paying && selected === pkg.id
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                  : <>Buy {pkg.tokens} Tokens <ArrowRight size={16} /></>
                }
              </button>
            </motion.div>
          ))}
        </div>

        {/* ── Trust strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 32, padding: '24px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}
        >
          {[
            { icon: <Shield size={16} />, text: 'Secure payment via Razorpay' },
            { icon: <Zap size={16} />,    text: 'Tokens added instantly'      },
            { icon: <Star size={16} />,   text: 'No subscription, pay once'   },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              <span style={{ color: '#7c3aed' }}>{icon}</span> {text}
            </div>
          ))}
        </motion.div>

        {/* ── Setup note ── */}
        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Add your Razorpay Key ID to <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>VITE_RAZORPAY_KEY_ID</code> in <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>.env</code> to enable live payments.
        </p>

      </div>
    </div>
  )
}
