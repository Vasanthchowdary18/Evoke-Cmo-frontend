import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { buildAccountsLoginUrl } from '../lib/session'

/**
 * SSO sign-in modal — redirects to the Evoke accounts portal.
 * Replaces the previous Firebase email/social popup flow.
 */
export default function SignInModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSignIn = (e) => {
    e?.preventDefault?.()
    window.location.href = buildAccountsLoginUrl(window.location.href)
  }

  return (
    <>
      <style>{`
        @keyframes ssoIn {
          from { opacity:0; transform:scale(0.96) translateY(14px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .sso-close:hover { background:rgba(0,0,0,0.1) !important; }
        @media (max-width:640px) {
          .sso-left { display:none !important; }
          .sso-right { padding:36px 28px 32px !important; }
        }
      `}</style>

      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:10001,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width:'100%', maxWidth:900,
          background:'white', borderRadius:20,
          overflow:'hidden', display:'flex',
          animation:'ssoIn 0.28s ease',
          boxShadow:'0 40px 100px rgba(0,0,0,0.45)',
          maxHeight:'94vh',
        }}>
          <div className="sso-left" style={{ width:'45%', flexShrink:0, position:'relative', overflow:'hidden' }}>
            <img src="/signin-hero.webp" alt="" aria-hidden="true"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }}
            />
          </div>

          <div className="sso-right" style={{
            flex:1, background:'#fafaf8',
            padding:'48px 44px 40px',
            overflowY:'auto', position:'relative',
          }}>
            <button onClick={onClose} className="sso-close" style={{
              position:'absolute', top:16, right:16,
              width:32, height:32, borderRadius:'50%',
              background:'rgba(0,0,0,0.06)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'#777', transition:'background 0.15s',
            }}>
              <X size={15} />
            </button>

            <h2 style={{ color:'#111', fontSize:30, fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 6px' }}>
              Sign in to Evoke
            </h2>
            <p style={{ color:'#aaa', fontSize:15, margin:'0 0 32px', lineHeight:1.5 }}>
              Use your Evoke Marketplace account to access AI agents, campaigns, and your workspace.
            </p>

            <button type="button" onClick={handleSignIn} style={{
              width:'100%', padding:'14px',
              background:'linear-gradient(135deg, #d4a853 0%, #b8803a 100%)',
              border:'none', borderRadius:50, color:'white',
              fontWeight:700, fontSize:16, cursor:'pointer',
              boxShadow:'0 4px 14px rgba(184,128,58,0.35)',
              fontFamily:'inherit', marginBottom:14,
            }}>
              Continue with Evoke SSO
            </button>

            <p style={{ color:'#999', fontSize:13, textAlign:'center', margin:0 }}>
              Sign in with email, Google, or Facebook on the accounts portal.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
