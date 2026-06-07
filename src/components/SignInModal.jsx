import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { auth, googleProvider, facebookProvider, signInWithPopup } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { getOrCreateUser } from '../services/userService'

const friendlyError = (code) => {
  const map = {
    'auth/email-already-in-use':                   'An account with this email already exists.',
    'auth/invalid-email':                           'Please enter a valid email address.',
    'auth/user-not-found':                          'No account found with this email.',
    'auth/wrong-password':                          'Incorrect password. Please try again.',
    'auth/invalid-credential':                      'Incorrect email or password. Please try again.',
    'auth/weak-password':                           'Password must be at least 6 characters.',
    'auth/popup-closed-by-user':                    'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':                           'Popup was blocked. Please allow popups for this site.',
    'auth/account-exists-with-different-credential':'An account already exists with a different sign-in method.',
    'auth/cancelled-popup-request':                 '',
    'auth/network-request-failed':                  'Network error. Check your connection.',
    'auth/operation-not-allowed':                   'This sign-in method is not enabled yet.',
    'auth/unauthorized-domain':                     'This domain is not authorised in Firebase Console.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

const Spinner = ({ dark }) => (
  <div style={{
    width: 17, height: 17,
    border: `2px solid ${dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.3)'}`,
    borderTopColor: dark ? '#444' : 'white',
    borderRadius: '50%',
    animation: 'ssoSpin 0.7s linear infinite',
    flexShrink: 0,
  }} />
)

export default function SignInModal({ onClose }) {
  const navigate = useNavigate()
  const [mode, setMode]           = useState('signin')
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [staySignedIn, setStay]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [socialLoading, setSocial]= useState(null)
  const [authError, setAuthError] = useState('')
  const [errors, setErrors]       = useState({})
  const [resetSent, setResetSent] = useState(false)
  const isSignUp = mode === 'signup'

  // Dismiss on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const switchMode = (next) => {
    setMode(next); setFullName(''); setEmail(''); setPassword('')
    setErrors({}); setAuthError(''); setShowPass(false); setResetSent(false)
  }

  const validate = () => {
    const e = {}
    if (isSignUp && !fullName.trim()) e.fullName = 'Full name is required'
    if (!email)                        e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address'
    if (!password)                     e.password = 'Password is required'
    else if (password.length < 6)      e.password = 'At least 6 characters'
    return e
  }

  // ── Email / Password login — stays in CMO ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setAuthError(''); setLoading(true)
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: fullName.trim() })
        await getOrCreateUser(cred.user.uid, fullName.trim(), email)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        await getOrCreateUser(cred.user.uid, cred.user.displayName, cred.user.email)
      }
      onClose()
      navigate('/agents-hub')
    } catch (err) {
      setAuthError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Google / Facebook login — stays in CMO ──
  const handleSocial = async (provider, key) => {
    setAuthError(''); setSocial(key)
    try {
      const result = await signInWithPopup(auth, provider)
      const u = result.user
      await getOrCreateUser(u.uid, u.displayName, u.email)
      onClose()
      navigate('/agents-hub')
    } catch (err) {
      const msg = friendlyError(err.code)
      if (msg) setAuthError(msg)
    } finally {
      setSocial(null)
    }
  }

  // ── Forgot password — Firebase sends reset email ──
  const handleForgotPassword = async () => {
    if (!email.trim()) { setErrors({ email: 'Enter your email address first' }); return }
    setAuthError('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setResetSent(true)
    } catch (err) {
      setAuthError(friendlyError(err.code))
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'white', borderRadius: 10,
    padding: '12px 14px', color: '#1a1208',
    fontSize: 15, outline: 'none',
    border: '1px solid #ddd8d0',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', color: '#555',
    textTransform: 'uppercase', marginBottom: 7,
  }

  return (
    <>
      <style>{`
        @keyframes ssoSpin { to { transform:rotate(360deg); } }
        @keyframes ssoIn {
          from { opacity:0; transform:scale(0.96) translateY(14px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .sso-input:focus {
          border-color:#b8803a !important;
          box-shadow:0 0 0 3px rgba(184,128,58,0.14) !important;
        }
        .sso-social:hover:not(:disabled) { background:#f0ede8 !important; }
        .sso-close:hover  { background:rgba(0,0,0,0.1) !important; }
        .sso-forgot:hover { color:#b8803a !important; }
        .sso-signup:hover { background:#e8e2d8 !important; }
        @media (max-width:640px) {
          .sso-left  { display:none !important; }
          .sso-right { padding:36px 28px 32px !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:10001,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      }}>
        {/* Card */}
        <div onClick={e => e.stopPropagation()} style={{
          width:'100%', maxWidth:900,
          background:'white', borderRadius:20,
          overflow:'hidden', display:'flex',
          animation:'ssoIn 0.28s ease',
          boxShadow:'0 40px 100px rgba(0,0,0,0.45)',
          maxHeight:'94vh',
        }}>

          {/* ── Left: fashion photo ── */}
          <div className="sso-left" style={{ width:'45%', flexShrink:0, position:'relative', overflow:'hidden' }}>
            <img src="/signin-hero.webp" alt="" aria-hidden="true"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }}
            />
          </div>

          {/* ── Right: Firebase auth form ── */}
          <div className="sso-right" style={{
            flex:1, background:'#fafaf8',
            padding:'48px 44px 40px',
            overflowY:'auto', position:'relative',
          }}>
            {/* Close */}
            <button onClick={onClose} className="sso-close" style={{
              position:'absolute', top:16, right:16,
              width:32, height:32, borderRadius:'50%',
              background:'rgba(0,0,0,0.06)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'#777', transition:'background 0.15s',
            }}>
              <X size={15} />
            </button>

            {/* Heading */}
            <h2 style={{ color:'#111', fontSize:30, fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 6px' }}>
              {isSignUp ? 'Create account' : 'Sign in'}
            </h2>
            <p style={{ color:'#aaa', fontSize:15, margin:'0 0 26px' }}>
              {isSignUp ? 'Start your AI marketing journey.' : 'Welcome back. Sign in to continue.'}
            </p>

            {/* Auth error */}
            {authError && (
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                background:'#fef2f2', border:'1px solid #fecaca',
                borderRadius:10, padding:'10px 14px', marginBottom:18,
                color:'#b91c1c', fontSize:13,
              }}>
                <AlertCircle size={14} style={{ flexShrink:0 }} />
                {authError}
              </div>
            )}

            {/* Password reset sent */}
            {resetSent && (
              <div style={{
                background:'#f0fdf4', border:'1px solid #bbf7d0',
                borderRadius:10, padding:'10px 14px', marginBottom:18,
                color:'#166534', fontSize:13,
              }}>
                Password reset email sent — check your inbox.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Full name (sign up only) */}
              {isSignUp && (
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>Full Name <span style={{ color:'#b8803a' }}>*</span></label>
                  <input type="text" value={fullName}
                    onChange={e => { setFullName(e.target.value); setErrors(er => ({ ...er, fullName:'' })) }}
                    placeholder="Your full name" autoComplete="name"
                    className="sso-input"
                    style={{ ...inputStyle, border:`1px solid ${errors.fullName ? '#fca5a5' : '#ddd8d0'}` }}
                  />
                  {errors.fullName && <span style={{ color:'#b91c1c', fontSize:11, marginTop:4, display:'block' }}>{errors.fullName}</span>}
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Email Address <span style={{ color:'#b8803a' }}>*</span></label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email:'' })); setAuthError('') }}
                  placeholder="Enter your email" autoComplete="email"
                  className="sso-input"
                  style={{ ...inputStyle, border:`1px solid ${errors.email ? '#fca5a5' : '#ddd8d0'}` }}
                />
                {errors.email && <span style={{ color:'#b91c1c', fontSize:11, marginTop:4, display:'block' }}>{errors.email}</span>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: isSignUp ? 22 : 12 }}>
                <label style={labelStyle}>Password <span style={{ color:'#b8803a' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password:'' })) }}
                    placeholder={isSignUp ? 'Min. 6 characters' : 'Enter your password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="sso-input"
                    style={{ ...inputStyle, paddingRight:44, border:`1px solid ${errors.password ? '#fca5a5' : '#ddd8d0'}` }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{
                    position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#aaa', padding:0, display:'flex',
                  }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <span style={{ color:'#b91c1c', fontSize:11, marginTop:4, display:'block' }}>{errors.password}</span>}
              </div>

              {/* Stay signed in + Forgot password */}
              {!isSignUp && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'#555', userSelect:'none' }}>
                    <input type="checkbox" checked={staySignedIn} onChange={e => setStay(e.target.checked)}
                      style={{ width:15, height:15, cursor:'pointer', accentColor:'#b8803a' }} />
                    Stay signed in
                  </label>
                  <button type="button" className="sso-forgot" onClick={handleForgotPassword}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:14, padding:0, transition:'color 0.15s', fontFamily:'inherit' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading || !!socialLoading} style={{
                width:'100%', padding:'14px',
                background: (loading || !!socialLoading) ? '#c8a96a' : 'linear-gradient(135deg, #d4a853 0%, #b8803a 100%)',
                border:'none', borderRadius:50, color:'white',
                fontWeight:700, fontSize:16,
                cursor: (loading || !!socialLoading) ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom:14,
                boxShadow:'0 4px 14px rgba(184,128,58,0.35)',
                transition:'opacity 0.15s', fontFamily:'inherit',
              }}>
                {loading
                  ? <><Spinner />{isSignUp ? 'Creating account...' : 'Signing in...'}</>
                  : (isSignUp ? 'Create Account' : 'Sign in')}
              </button>
            </form>

            {/* Google */}
            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <button type="button" onClick={() => handleSocial(googleProvider, 'google')}
                disabled={!!socialLoading || loading} className="sso-social"
                style={{
                  flex:1, padding:'12px 10px',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  background:'white', border:'1px solid #e0dbd0', borderRadius:50,
                  cursor:'pointer', color:'#222', fontSize:15, fontWeight:600,
                  transition:'background 0.15s',
                  opacity:(socialLoading === 'facebook' || loading) ? 0.5 : 1, fontFamily:'inherit',
                }}>
                {socialLoading === 'google' ? <Spinner dark /> : (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                {socialLoading === 'google' ? 'Connecting...' : 'Google'}
              </button>

              {/* Facebook */}
              <button type="button" onClick={() => handleSocial(facebookProvider, 'facebook')}
                disabled={!!socialLoading || loading} className="sso-social"
                style={{
                  flex:1, padding:'12px 10px',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  background:'white', border:'1px solid #e0dbd0', borderRadius:50,
                  cursor:'pointer', color:'#222', fontSize:15, fontWeight:600,
                  transition:'background 0.15s',
                  opacity:(socialLoading === 'google' || loading) ? 0.5 : 1, fontFamily:'inherit',
                }}>
                {socialLoading === 'facebook' ? <Spinner dark /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                )}
                {socialLoading === 'facebook' ? 'Connecting...' : 'Facebook'}
              </button>
            </div>

            {/* Sign up / Sign in toggle */}
            <button type="button" onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              className="sso-signup"
              style={{
                width:'100%', padding:'13px',
                background:'#f0ede8', border:'none', borderRadius:50,
                color:'#333', fontWeight:700, fontSize:15, cursor:'pointer',
                transition:'background 0.15s', fontFamily:'inherit',
              }}>
              {isSignUp ? 'Already have an account? Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
