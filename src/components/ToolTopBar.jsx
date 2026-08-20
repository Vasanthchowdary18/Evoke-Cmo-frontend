import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

const BG     = '#0A0A0F'
const CARD2  = '#1A1A24'
const BORDER = '#2A2A3A'
const TEXT2  = '#9b9bb0'

/**
 * The Figma tool-page top bar — Blog Generator, Email Copywriter, Creative
 * Studio, AI Image Generator, Video Studio, etc. Distinct from
 * StrategyTopBar (which has the Multi-Agent Link Secure pill + name/role) —
 * this one is just search + a bell + a plain avatar, matching Figma's spec.
 */
export default function ToolTopBar({ title, subtitle, searchPlaceholder = 'Search assets, tools...' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 100, gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 auto' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', fontFamily: "'Outfit','Inter',sans-serif" }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 400, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif" }}>{subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 240, height: 33, boxSizing: 'border-box', padding: '8px 16px', borderRadius: 6, background: CARD2, border: `1px solid ${BORDER}` }}>
          <Search size={14} color={TEXT2} style={{ flexShrink: 0 }} />
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontFamily: "'Geist','Inter',sans-serif" }}
          />
        </div>

        <button style={{ width: 32, height: 32, borderRadius: 6, background: CARD2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
          <Bell size={16} color={TEXT2} />
        </button>

        <div onClick={() => navigate('/brand-profile')} style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8973e,#8b5e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0e0c09' }}>{firstName[0]?.toUpperCase()}</div>
          }
        </div>
      </div>
    </div>
  )
}
