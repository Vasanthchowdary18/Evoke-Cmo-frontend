import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const BORDER = '#2A2A3A'

/**
 * The Figma "strategy-home" family top bar — title/subtitle on the left,
 * Global Strategy Search + Multi-Agent Link Secure + profile on the right.
 * Shared across every Strategy-tier screen (Strategy, Competitor Intel,
 * SWOT Analysis, …) so it stays constant no matter which page you're on.
 * Pass `action` for a page-specific button (e.g. Regenerate, Export) —
 * it renders alongside the three constants, never replacing them.
 */
export default function StrategyTopBar({ title, subtitle, action, pillLabel = 'Multi-Agent Link Secure' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div style={{ minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 100, gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 auto', minWidth: 120 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', fontFamily: "'Outfit','Inter',sans-serif" }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 400, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif" }}>{subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '7px 14px', width: 160, flexShrink: 0 }}>
          <Search size={13} color={TEXT2} style={{ flexShrink: 0 }} />
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Global Strategy Search..."
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontFamily: "'Geist','Inter',sans-serif" }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, fontFamily: "'Geist','Inter',sans-serif" }}>{pillLabel}</span>
        </div>

        {action && (
          <button onClick={action.onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
            {action.icon} {action.label}
          </button>
        )}

        <div onClick={() => navigate('/brand-profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8973e,#8b5e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0e0c09' }}>{firstName[0]?.toUpperCase()}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.displayName || firstName}</div>
            <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 10, color: GOLD }}>Executive CMO</div>
          </div>
        </div>
      </div>
    </div>
  )
}
