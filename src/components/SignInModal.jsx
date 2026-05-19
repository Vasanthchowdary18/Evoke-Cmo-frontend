import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Zap } from 'lucide-react'
import { auth, googleProvider, facebookProvider, twitterProvider, signInWithPopup } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'

const friendlyError = (code) => {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
    'auth/cancelled-popup-request': '',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

const Spinner = () => (
  <div style={{
    width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'modalSpin 0.7s linear infinite',
    flexShrink: 0,
  }} />
)

export default function SignInModal({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()
  const isSignUp = mode === 'signup'

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const validate = () => {
    const e = {}
    if (isSignUp && !form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setAuthError(''); setLoading(true)
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await updateProfile(cred.user, { displayName: form.fullName.trim() })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setAuthError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider, key) => {
    setAuthError(''); setSocialLoading(key)
    try {
      await signInWithPopup(auth, provider)
      navigate('/dashboard')
    } catch (err) {
      const msg = friendlyError(err.code)
      if (msg) setAuthError(msg)
    } finally {
      setSocialLoading(null)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setForm({ fullName: '', email: '', password: '' })
    setErrors({}); setAuthError(''); setShowPass(false)
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }))
    if (authError) setAuthError('')
  }

  const socialBtns = [
    {
      key: 'google',
      label: 'Google',
      provider: googleProvider,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      provider: facebookProvider,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      provider: twitterProvider,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      <style>{`
        @keyframes modalSpin { to { transform: rotate(360deg); } }
        @keyframes modalFadeIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 440,
            background: '#0e0e14',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: '36px 36px 32px',
            position: 'relative',
            animation: 'modalFadeIn 0.28s ease',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <X size={16} />
          </button>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 0 24px rgba(124,58,237,0.4)',
            }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>EVOKE CMO</div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)',
            borderRadius: 12, padding: 4, marginBottom: 24,
          }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: mode === m ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: mode === m ? '0 2px 10px rgba(124,58,237,0.3)' : 'none',
              }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              {isSignUp ? 'Start earning EGT and launch AI campaigns' : 'Sign in to your Evoke CMO account'}
            </p>
          </div>

          {/* Error banner */}
          {authError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              color: '#fca5a5', fontSize: 13,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {authError}
            </div>
          )}

          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
            {socialBtns.map(({ key, label, provider, icon }) => (
              <button
                key={key}
                onClick={() => handleSocial(provider, key)}
                disabled={!!socialLoading || loading}
                style={{
                  width: '100%', padding: '11px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: key === 'twitter' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${key === 'twitter' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 11, cursor: 'pointer', color: 'white',
                  fontSize: 13, fontWeight: 500, transition: 'background 0.15s',
                  opacity: (socialLoading && socialLoading !== key) || loading ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!socialLoading && !loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => e.currentTarget.style.background = key === 'twitter' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)'}
              >
                {socialLoading === key ? <Spinner /> : icon}
                {socialLoading === key ? 'Connecting...' : `${isSignUp ? 'Sign up' : 'Sign in'} with ${label}`}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isSignUp && (
              <div>
                <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                  <input
                    type="text" name="fullName" value={form.fullName} onChange={handleChange}
                    placeholder="Your full name"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.fullName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10, padding: '10px 12px 10px 38px',
                      color: 'white', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                {errors.fullName && <span style={{ color: '#fca5a5', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.fullName}</span>}
              </div>
            )}

            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '10px 12px 10px 38px',
                    color: 'white', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              {errors.email && <span style={{ color: '#fca5a5', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.email}</span>}
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder={isSignUp ? 'Min. 6 characters' : 'Your password'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '10px 38px 10px 38px',
                    color: 'white', fontSize: 13, outline: 'none',
                  }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 0,
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span style={{ color: '#fca5a5', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.password}</span>}
            </div>

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: 'none', borderRadius: 11, color: 'white',
                fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}
            >
              {loading ? <><Spinner />{isSignUp ? 'Creating...' : 'Signing in...'}</> : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontWeight: 600, fontSize: 13, padding: 0 }}
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
