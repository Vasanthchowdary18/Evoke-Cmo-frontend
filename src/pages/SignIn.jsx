import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, User, AlertCircle } from 'lucide-react'
import { auth, googleProvider, signInWithPopup } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'

// Maps Firebase error codes to readable messages
const friendlyError = (code) => {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/popup-closed-by-user':    'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':           'Popup was blocked. Please allow popups for this site and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/cancelled-popup-request': '',
    'auth/network-request-failed':  'Network error. Check your connection and try again.',
    'auth/unauthorized-domain':     'This domain is not authorised. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/internal-error':          'Authentication error. Please try again in a moment.',
  }
  return map[code] || `Something went wrong (${code}). Please try again.`
}

export default function SignIn() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null) // 'google'
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()

  const isSignUp = mode === 'signup'

  const validate = () => {
    const e = {}
    if (isSignUp && !form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setAuthError('')
    setLoading(true)
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

  const handleGoogle = async () => {
    setAuthError('')
    setSocialLoading('google')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      const msg = friendlyError(err.code)
      if (msg) setAuthError(msg)
    } finally {
      setSocialLoading(null)
    }
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }))
    if (authError) setAuthError('')
  }

  const switchMode = (next) => {
    setMode(next)
    setForm({ fullName: '', email: '', password: '' })
    setErrors({})
    setAuthError('')
    setShowPass(false)
  }

  const Spinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
    />
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div className="glow-orb glow-purple" style={{ width: 500, height: 500, top: -150, left: -150, opacity: 0.35 }} />
      <div className="glow-orb glow-cyan" style={{ width: 400, height: 400, bottom: -100, right: -100, opacity: 0.25 }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}>
              <Zap size={24} color="white" fill="white" />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>EVOKE CMO</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '40px', backdropFilter: 'blur(20px)',
          }}
        >
          {/* Mode tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {['signin', 'signup'].map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)} style={{
                flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600, transition: 'all 0.25s',
                background: mode === m ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: mode === m ? '0 2px 12px rgba(124,58,237,0.35)' : 'none',
              }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ marginBottom: '24px' }}
            >
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
                {isSignUp ? 'Start generating AI-powered campaigns today' : 'Sign in to your Evoke CMO account'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Auth error banner */}
          <AnimatePresence>
            {authError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '18px',
                  color: '#fca5a5', fontSize: '13px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {/* Google */}
            <motion.button type="button" onClick={handleGoogle}
              disabled={!!socialLoading || loading} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', cursor: 'pointer', color: 'white',
                fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
                opacity: (socialLoading === 'facebook' || loading) ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!socialLoading && !loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              {socialLoading === 'google' ? <Spinner /> : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {socialLoading === 'google' ? 'Connecting...' : `${isSignUp ? 'Sign up' : 'Sign in'} with Google`}
            </motion.button>

          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <AnimatePresence>
              {isSignUp && (
                <motion.div key="fullName" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  className="form-group" style={{ overflow: 'hidden' }}
                >
                  <label className="form-label">Full name <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                      placeholder="Your full name"
                      className={`form-input ${errors.fullName ? 'error' : ''}`}
                      style={{ paddingLeft: '42px' }} autoComplete="name" />
                  </div>
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label">Email address <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: '42px' }} autoComplete="email" />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder={isSignUp ? 'Create a password (min. 6 chars)' : 'Your password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 0, transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <motion.button type="submit" className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '4px' }}
              disabled={loading || !!socialLoading} whileTap={{ scale: 0.99 }}
            >
              {loading ? <><Spinner />{isSignUp ? 'Creating account...' : 'Signing in...'}</> : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={17} /></>}
            </motion.button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '14px' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" onClick={() => switchMode(isSignUp ? 'signin' : 'signup')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a78bfa', fontWeight: 600, fontSize: '14px', padding: 0, transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                onMouseLeave={e => e.currentTarget.style.color = '#a78bfa'}
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </button>
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: '24px' }}
        >
          <Link to="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >
            ← Back to homepage
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
