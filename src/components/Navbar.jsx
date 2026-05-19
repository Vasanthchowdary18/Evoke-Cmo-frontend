import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import GratitudeToken from './GratitudeToken'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const isDashboard =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/campaign') ||
    location.pathname.startsWith('/results')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 24px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(10, 10, 10, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
          }}
        >
          <Zap size={18} color="white" fill="white" />
        </div>

        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background:
              'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          EVOKE CMO
        </span>
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {!isDashboard ? (
          <>
            {['features', 'pricing', 'how-it-works'].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                {id === 'how-it-works'
                  ? 'How It Works'
                  : id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}

            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'rgba(255,255,255,0.1)',
                margin: '0 4px',
              }}
            />

            <Link
              to="/signin"
              className="btn-secondary"
              style={{ padding: '9px 20px', fontSize: '14px' }}
            >
              Sign In
            </Link>

            <Link
              to="/signin"
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '14px' }}
            >
              Get Started
            </Link>

            <GratitudeToken />
          </>
        ) : (
          <>
            <Link
              to="/dashboard"
              style={{
                color:
                  location.pathname === '/dashboard'
                    ? 'white'
                    : 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: '8px',
              }}
            >
              Dashboard
            </Link>

            <GratitudeToken />

            <button onClick={() => navigate('/')} className="btn-ghost">
              Sign Out
            </button>
          </>
        )}
      </div>
    </motion.nav>
  )
}