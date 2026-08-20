import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequireAuth } from '../hooks/useRequireAuth'
import {
  ArrowLeft, Share2, Link, Copy, Check, Plus, Trash2,
  Eye, BarChart2, FileText, Calendar, Lock, Unlock,
  Globe, Mail, Clock, RefreshCw, X, ChevronDown, Users,
  ShieldCheck, QrCode, ExternalLink
} from 'lucide-react'

const PERMISSION_OPTIONS = [
  { id: 'analytics', label: 'Analytics Dashboard', icon: <BarChart2 size={14} />, desc: 'View campaign performance metrics' },
  { id: 'campaigns', label: 'Campaign Reports', icon: <FileText size={14} />, desc: 'View individual campaign results' },
  { id: 'calendar', label: 'Content Calendar', icon: <Calendar size={14} />, desc: 'View scheduled content plan' },
  { id: 'audience', label: 'Audience Insights', icon: <Users size={14} />, desc: 'View audience demographics' },
]

const INITIAL_LINKS = [
  {
    id: 1,
    name: 'Q3 Client Report — BrandCo',
    token: 'evx-q3brand-8f2a',
    permissions: ['analytics', 'campaigns'],
    expiry: '2026-07-31',
    views: 14,
    lastViewed: '2h ago',
    active: true,
    passwordProtected: false,
  },
  {
    id: 2,
    name: 'Agency Partner Dashboard',
    token: 'evx-agency-5c9d',
    permissions: ['analytics', 'campaigns', 'calendar', 'audience'],
    expiry: null,
    views: 42,
    lastViewed: '1d ago',
    active: true,
    passwordProtected: true,
  },
  {
    id: 3,
    name: 'Investor Overview — June 2026',
    token: 'evx-invest-7a3b',
    permissions: ['analytics'],
    expiry: '2026-06-30',
    views: 7,
    lastViewed: '3d ago',
    active: false,
    passwordProtected: false,
  },
]

export default function PartnerSharing() {
  useRequireAuth()
  const navigate = useNavigate()

  const [links, setLinks] = useState(INITIAL_LINKS)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newPerms, setNewPerms] = useState(['analytics'])
  const [newExpiry, setNewExpiry] = useState('')
  const [newPassword, setNewPassword] = useState(false)
  const [created, setCreated] = useState(false)

  function copyLink(link) {
    const url = `${window.location.origin}/share/${link.token}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleActive(id) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l))
  }

  function deleteLink(id) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  function togglePerm(permId) {
    setNewPerms(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId])
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim() || newPerms.length === 0) return
    const token = 'evx-' + Math.random().toString(36).slice(2, 8)
    const newLink = {
      id: Date.now(),
      name: newName.trim(),
      token,
      permissions: newPerms,
      expiry: newExpiry || null,
      views: 0,
      lastViewed: 'Never',
      active: true,
      passwordProtected: newPassword,
    }
    setLinks(prev => [newLink, ...prev])
    setCreated(true)
    setTimeout(() => {
      setCreated(false)
      setShowCreate(false)
      setNewName('')
      setNewPerms(['analytics'])
      setNewExpiry('')
      setNewPassword(false)
    }, 2200)
  }

  const permLabel = (permId) => PERMISSION_OPTIONS.find(p => p.id === permId)?.label || permId

  return (
    <div style={{ minHeight: '100vh', background: '#0e0c09', color: '#f0ebe0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #2a2510', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#12100a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#c8973e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: '#3a3020' }}>|</span>
          <Share2 size={18} color="#c8973e" />
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#c8973e', fontWeight: 700 }}>PARTNER & CLIENT SHARING</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#c8973e', color: '#0e0c09', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          <Plus size={15} /> Create Share Link
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {/* Hero description */}
        <div style={{ background: 'linear-gradient(135deg, rgba(200,151,62,0.08), rgba(200,151,62,0.02))', border: '1px solid rgba(200,151,62,0.2)', borderRadius: 14, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, background: 'rgba(200,151,62,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={22} color="#c8973e" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#f0ebe0', marginBottom: 4 }}>Secure Client & Partner Portals</div>
            <div style={{ color: '#8a7a55', fontSize: 13, lineHeight: 1.5 }}>
              Share live analytics, campaign reports, and content calendars with clients or partners using secure, permission-controlled links — no login required for them.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Active Links', value: links.filter(l => l.active).length, color: '#22c55e' },
            { label: 'Total Links', value: links.length, color: '#c8973e' },
            { label: 'Total Views', value: links.reduce((s, l) => s + l.views, 0), color: '#6366f1' },
            { label: 'Password Protected', value: links.filter(l => l.passwordProtected).length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#8a7a55', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 14, padding: 32, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f0ebe0' }}>Create Share Link</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#8a7a55', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              {created ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 60, height: 60, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={28} color="#22c55e" />
                  </div>
                  <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>Share link created!</p>
                  <p style={{ color: '#8a7a55', fontSize: 13 }}>Copy and share it with your client or partner.</p>
                </div>
              ) : (
                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 6 }}>Link Name / Label</label>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Q3 Report — ClientName"
                      style={{ width: '100%', background: '#0e0c09', border: '1px solid #2a2510', color: '#f0ebe0', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' }}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 10 }}>Data Access Permissions</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {PERMISSION_OPTIONS.map(perm => (
                        <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: newPerms.includes(perm.id) ? 'rgba(200,151,62,0.1)' : '#0e0c09', border: `1px solid ${newPerms.includes(perm.id) ? 'rgba(200,151,62,0.4)' : '#2a2510'}`, transition: 'all 0.15s' }}>
                          <input type="checkbox" checked={newPerms.includes(perm.id)} onChange={() => togglePerm(perm.id)} style={{ accentColor: '#c8973e', width: 15, height: 15 }} />
                          <div style={{ color: newPerms.includes(perm.id) ? '#c8973e' : '#8a7a55' }}>{perm.icon}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ebe0' }}>{perm.label}</div>
                            <div style={{ fontSize: 11, color: '#8a7a55' }}>{perm.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 6 }}>Expiry Date (optional)</label>
                      <input
                        type="date"
                        value={newExpiry}
                        onChange={e => setNewExpiry(e.target.value)}
                        style={{ width: '100%', background: '#0e0c09', border: '1px solid #2a2510', color: '#f0ebe0', borderRadius: 8, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 6 }}>Password Protect</label>
                      <button
                        type="button"
                        onClick={() => setNewPassword(!newPassword)}
                        style={{ width: '100%', padding: '10px 12px', background: newPassword ? 'rgba(200,151,62,0.1)' : '#0e0c09', border: `1px solid ${newPassword ? 'rgba(200,151,62,0.4)' : '#2a2510'}`, color: newPassword ? '#c8973e' : '#8a7a55', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
                      >
                        {newPassword ? <Lock size={14} /> : <Unlock size={14} />}
                        {newPassword ? 'Password On' : 'No Password'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2a2510', color: '#8a7a55', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button type="submit" disabled={newPerms.length === 0} style={{ flex: 2, padding: '10px', background: newPerms.length === 0 ? '#2a2510' : '#c8973e', color: newPerms.length === 0 ? '#8a7a55' : '#0e0c09', border: 'none', borderRadius: 8, fontWeight: 700, cursor: newPerms.length === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}>Create Link</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Links list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {links.map(link => {
            const isExpired = link.expiry && new Date(link.expiry) < new Date()
            const shareUrl = `${window.location.origin}/share/${link.token}`
            return (
              <div key={link.id} style={{ background: '#1c1a13', border: `1px solid ${link.active && !isExpired ? '#2a2510' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, padding: '18px 20px', opacity: link.active && !isExpired ? 1 : 0.65 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#f0ebe0', fontSize: 15 }}>{link.name}</span>
                      {link.passwordProtected && <Lock size={12} color="#f59e0b" />}
                      {isExpired && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>EXPIRED</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Link size={11} color="#8a7a55" />
                      <span style={{ color: '#8a7a55', fontSize: 12, fontFamily: 'monospace' }}>{shareUrl.replace('http://localhost:5173', 'share.evokecmo.ai')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => toggleActive(link.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, background: link.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)', color: link.active ? '#22c55e' : '#ef4444' }}
                    >
                      {link.active ? '● Active' : '○ Paused'}
                    </button>
                    <button onClick={() => copyLink(link)} style={{ padding: '6px 10px', background: copiedId === link.id ? 'rgba(34,197,94,0.15)' : 'rgba(200,151,62,0.1)', border: `1px solid ${copiedId === link.id ? 'rgba(34,197,94,0.3)' : 'rgba(200,151,62,0.3)'}`, color: copiedId === link.id ? '#22c55e' : '#c8973e', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                      {copiedId === link.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <button onClick={() => deleteLink(link.id)} style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {link.permissions.map(permId => {
                      const perm = PERMISSION_OPTIONS.find(p => p.id === permId)
                      return perm ? (
                        <span key={permId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {React.cloneElement(perm.icon, { size: 10 })} {perm.label}
                        </span>
                      ) : null
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#8a7a55', fontSize: 12 }}>
                    {link.expiry && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isExpired ? '#ef4444' : '#8a7a55' }}><Clock size={11} /> {isExpired ? 'Expired' : `Expires ${link.expiry}`}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11} /> {link.views} views</span>
                    <span>Last: {link.lastViewed}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {links.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a7a55' }}>
            <Share2 size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ marginBottom: 8 }}>No share links yet</div>
            <button onClick={() => setShowCreate(true)} style={{ marginTop: 12, padding: '10px 20px', background: '#c8973e', color: '#0e0c09', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              Create your first share link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
