import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X, LayoutDashboard, Image, LogOut, ChevronDown } from 'lucide-react'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import GratitudeToken from './GratitudeToken'

export default function Navbar({ onSignIn }) {
  const [scrolled, setScrolled]       = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [user, setUser]               = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef                    = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const isApp =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/campaign')  ||
    location.pathname.startsWith('/results')   ||
    location.pathname.startsWith('/connect')   ||
    location.pathname.startsWith('/tokens')    ||
    location.pathname.startsWith('/purchase')  ||
    location.pathname.startsWith('/agent')     ||
    location.pathname.startsWith('/cmo-terminal') ||
    location.pathname.startsWith('/dashboard-legacy')

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => auth.onAuthStateChanged(u => setUser(u)), [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => { await signOut(auth); navigate('/') }

  const landingLinks = [
    { label: 'Features',     href: '#features'     },
    { label: 'Agents',       href: '#agents'       },
    { label: 'Pricing',      href: '#pricing'      },
    { label: 'How It Works', href: '#how-it-works' },
  ]
  const appLinks = [
    { label: 'Dashboard',  href: '/dashboard'        },
    { label: 'Agents',     href: '/dashboard-legacy' },
    { label: 'Connect',    href: '/connect-accounts' },
  ]
  const navLinks = isApp ? appLinks : landingLinks

  const navLink = {
    fontSize: 14, fontWeight: 500,
    color: 'rgba(240,235,224,0.55)',
    textDecoration: 'none', padding: '6px 14px', borderRadius: 8,
    transition: 'color 0.15s', cursor: 'pointer',
    background: 'none', border: 'none',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 40px',
          background: scrolled ? 'rgba(14,12,9,0.98)' : 'rgba(14,12,9,0.82)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(200,151,62,0.12)' : 'transparent'}`,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          {/* EVOKE image logo */}
          <img
            src="/evoke-logo.png"
            alt="EVOKE"
            style={{
              height: 28,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {/* CMO pill badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px 5px 8px',
            background: '#0a0805',
            border: '1px solid rgba(200,151,62,0.32)',
            borderRadius: 100,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.6) inset',
          }}>
            <Zap size={11} color="#c8973e" fill="#c8973e" />
            <span style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.09em', color: '#c8973e',
              fontFamily: "'Inter', sans-serif",
            }}>CMO</span>
          </div>
        </Link>

        {/* ── Nav links — only on landing page, NOT inside the app ── */}
        {!isApp && (
          <div className="nav-center" style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}>
            {navLinks.map(link => (
              link.href.startsWith('#') ? (
                <a key={link.label} href={link.href} style={navLink}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0ebe0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.55)'}
                >{link.label}</a>
              ) : (
                <Link key={link.label} to={link.href} style={{
                  ...navLink,
                  color: location.pathname === link.href ? '#c8973e' : 'rgba(240,235,224,0.55)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0ebe0'}
                  onMouseLeave={e => e.currentTarget.style.color = location.pathname === link.href ? '#c8973e' : 'rgba(240,235,224,0.55)'}
                >{link.label}</Link>
              )
            ))}
          </div>
        )}

        {/* Spacer — pushes right actions to the far right */}
        <div style={{ flex: 1 }} />

        {/* ── Right actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="mobile-hide">

          {/* GratitudeToken — only on app pages */}
          {isApp && <GratitudeToken />}

          {user ? (
            /* ── User profile pill + dropdown ── */
            <div ref={profileRef} style={{ position: 'relative' }}>
              {/* Pill trigger */}
              <button
                onClick={() => setProfileOpen(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px 5px 5px',
                  background: profileOpen ? 'rgba(200,151,62,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${profileOpen ? 'rgba(200,151,62,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 100, cursor: 'pointer',
                  transition: 'all 0.18s',
                  fontFamily: "'Inter',sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.12)'; e.currentTarget.style.borderColor = 'rgba(200,151,62,0.35)' }}
                onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' } }}
              >
                {/* Avatar circle */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d4a853, #b8803a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#0e0c09',
                  flexShrink: 0, letterSpacing: '0.02em',
                }}>
                  {(user.displayName || user.email || 'U')
                    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                </div>
                {/* First name */}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ebe0', whiteSpace: 'nowrap' }}>
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown size={13} style={{ color: 'rgba(240,235,224,0.5)', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      minWidth: 220,
                      background: '#1c1a13',
                      border: '1px solid rgba(200,151,62,0.2)',
                      borderRadius: 14,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                      overflow: 'hidden',
                      zIndex: 999,
                    }}
                  >
                    {/* User info header */}
                    <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ebe0', marginBottom: 3 }}>
                        {user.displayName || 'User'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(240,235,224,0.4)', wordBreak: 'break-all' }}>
                        {user.email}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '8px 0' }}>
                      {[
                        { icon: <LayoutDashboard size={15} />, label: 'Workspace',      action: () => { navigate('/agents-hub'); setProfileOpen(false) } },
                        { icon: <Image size={15} />,           label: 'My Generations', action: () => { navigate('/results');   setProfileOpen(false) } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 18px', background: 'none', border: 'none',
                            color: 'rgba(240,235,224,0.75)', fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif",
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.08)'; e.currentTarget.style.color = '#f0ebe0' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(240,235,224,0.75)' }}
                        >
                          <span style={{ color: 'rgba(200,151,62,0.7)' }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div style={{ padding: '0 0 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <button onClick={() => { handleSignOut(); setProfileOpen(false) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px', background: 'none', border: 'none',
                          color: 'rgba(240,235,224,0.55)', fontSize: 14, fontWeight: 500,
                          cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif",
                          transition: 'all 0.12s', marginTop: 4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(240,235,224,0.55)' }}
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          ) : (
            /* ── Not signed in ── */
            <>
              {onSignIn ? (
                <button onClick={onSignIn} style={navLink}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0ebe0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.55)'}
                >Sign In</button>
              ) : (
                <Link to="/signin" style={navLink}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0ebe0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.55)'}
                >Sign In</Link>
              )}
              {onSignIn ? (
                <button onClick={onSignIn} style={{
                  padding: '9px 22px', marginLeft: 4,
                  background: 'linear-gradient(135deg, #d4a853 0%, #b8803a 100%)',
                  color: '#0e0c09', border: 'none', borderRadius: 100,
                  fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif",
                  cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(200,151,62,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >Get Started Free</button>
              ) : (
                <Link to="/signin" style={{
                  display: 'inline-block', padding: '9px 22px', marginLeft: 4,
                  background: 'linear-gradient(135deg, #d4a853 0%, #b8803a 100%)',
                  color: '#0e0c09', borderRadius: 100,
                  fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif",
                  textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(200,151,62,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >Get Started Free</Link>
              )}
            </>
          )}
        </div>

        {/* Mobile btn */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,235,224,0.7)', padding: 4, marginLeft: 12 }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 199,
              background: '#0e0c09', borderBottom: '1px solid rgba(200,151,62,0.12)',
              padding: '16px 24px 28px', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ fontSize: 16, fontWeight: 500, color: 'rgba(240,235,224,0.7)', textDecoration: 'none', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {link.label}
              </a>
            ))}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isApp ? (
                <button onClick={handleSignOut} style={{ padding: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'rgba(240,235,224,0.6)', fontSize: 15, cursor: 'pointer' }}>Sign Out</button>
              ) : (
                <>
                  <button onClick={onSignIn || (() => navigate('/signin'))} style={{ padding: 12, background: 'transparent', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 100, color: '#c8973e', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
                  <button onClick={onSignIn || (() => navigate('/signin'))} style={{ padding: 12, background: 'linear-gradient(135deg, #d4a853, #b8803a)', border: 'none', borderRadius: 100, color: '#0e0c09', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Get Started Free</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
