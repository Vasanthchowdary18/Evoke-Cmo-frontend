import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Trash2, Edit2, X, ChevronRight,
  Mail, Phone, Building2, Tag, Loader2, Zap, BarChart2,
  UserCheck, TrendingUp, Star, RefreshCw, FileText,
  CheckCircle, ArrowLeft
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import {
  getContacts, addContact, updateContact, deleteContact, calcScore
} from '../services/crmService'

/* ── Design tokens ── */
const BG     = '#0a0a0a'
const CARD   = '#111115'
const BORDER = 'rgba(255,255,255,0.07)'
const GOLD   = '#c8973e'

/* ── Stage config ── */
const STAGES = [
  { key: 'all',      label: 'All',       color: '#818cf8' },
  { key: 'lead',     label: 'Lead',      color: '#f59e0b' },
  { key: 'prospect', label: 'Prospect',  color: '#3b82f6' },
  { key: 'customer', label: 'Customer',  color: '#10b981' },
  { key: 'retained', label: 'Retained',  color: '#a855f7' },
]

const STAGE_META = {
  lead:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Lead' },
  prospect: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Prospect' },
  customer: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Customer' },
  retained: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'Retained' },
}

/* ── Score badge ── */
function ScoreBadge({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const bg    = score >= 70 ? 'rgba(16,185,129,0.12)' : score >= 40 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 100,
      background: bg, border: `1px solid ${color}30`,
    }}>
      <Star size={9} style={{ color }} fill={color} />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

/* ── Initials avatar ── */
function Avatar({ name, color }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

/* ── Empty state ── */
function Empty({ stage, onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <Users size={36} style={{ color: '#222', marginBottom: 14 }} />
      <p style={{ color: '#555', fontSize: 14, marginBottom: 6 }}>
        {stage === 'all' ? 'No contacts yet' : `No ${stage}s yet`}
      </p>
      <p style={{ color: '#333', fontSize: 12, marginBottom: 20 }}>
        Add your first contact to start tracking leads
      </p>
      <button onClick={onAdd} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 18px', background: 'rgba(200,151,62,0.12)',
        border: '1px solid rgba(200,151,62,0.3)', borderRadius: 10,
        color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <Plus size={14} /> Add Contact
      </button>
    </div>
  )
}

/* ── Contact form modal (add + edit) ── */
function ContactModal({ contact, onSave, onClose, saving }) {
  const isEdit = !!contact?.id
  const [form, setForm] = useState({
    name:        contact?.name        || '',
    email:       contact?.email       || '',
    company:     contact?.company     || '',
    phone:       contact?.phone       || '',
    stage:       contact?.stage       || 'lead',
    notes:       contact?.notes       || '',
    lastContact: contact?.lastContact || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const liveScore = calcScore(form)

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: '#e0e0e0',
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#131318', border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: '24px 24px 20px',
        width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {isEdit ? 'Edit Contact' : 'Add Contact'}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
              Lead score: <span style={{
                fontWeight: 700,
                color: liveScore >= 70 ? '#10b981' : liveScore >= 40 ? '#f59e0b' : '#ef4444'
              }}>{liveScore}/100</span> — updates as you fill in fields
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4,
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Full Name *
              </label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Company
              </label>
              <input
                value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="Acme Corp" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jane@acme.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Phone
              </label>
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Pipeline Stage
              </label>
              <select
                value={form.stage} onChange={e => set('stage', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              >
                <option value="lead"     style={{ background: '#1a1a22', color: '#e0e0e0' }}>Lead</option>
                <option value="prospect" style={{ background: '#1a1a22', color: '#e0e0e0' }}>Prospect</option>
                <option value="customer" style={{ background: '#1a1a22', color: '#e0e0e0' }}>Customer</option>
                <option value="retained" style={{ background: '#1a1a22', color: '#e0e0e0' }}>Retained</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Last Contact Date
              </label>
              <input
                type="date" value={form.lastContact} onChange={e => set('lastContact', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
              Notes
            </label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Key details, preferences, context..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Score preview bar */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            padding: '10px 12px', border: `1px solid ${BORDER}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#666' }}>Lead score preview</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: liveScore >= 70 ? '#10b981' : liveScore >= 40 ? '#f59e0b' : '#ef4444'
              }}>{liveScore}/100</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 100 }}>
              <div style={{
                height: '100%', borderRadius: 100, transition: 'width 0.3s ease',
                width: `${liveScore}%`,
                background: liveScore >= 70 ? '#10b981' : liveScore >= 40 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
          </div>

        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`, borderRadius: 9,
            color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || saving}
            style={{
              flex: 2, padding: '10px', borderRadius: 9,
              background: form.name.trim() && !saving ? 'rgba(200,151,62,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${form.name.trim() && !saving ? 'rgba(200,151,62,0.4)' : BORDER}`,
              color: form.name.trim() && !saving ? GOLD : '#555',
              fontSize: 13, fontWeight: 700, cursor: form.name.trim() && !saving ? 'pointer' : 'default',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><CheckCircle size={14} /> {isEdit ? 'Save Changes' : 'Add Contact'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete confirmation modal ── */
function DeleteModal({ contact, onConfirm, onClose, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#131318', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 14, padding: 24, maxWidth: 360, width: '100%',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Delete contact?
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>
          <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{contact.name}</span>
          {contact.company && <span> from {contact.company}</span>}
          {' '}will be permanently removed from your CRM.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`, borderRadius: 8,
            color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{
            flex: 1, padding: '9px', background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
            color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {deleting
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Trash2 size={13} />
            }
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   MAIN CRM PAGE
══════════════════════════════════════ */
export default function CrmPage() {
  const navigate  = useNavigate()
  const { user, authReady } = useRequireAuth()

  const [contacts,     setContacts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [stageFilter,  setStageFilter]  = useState('all')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editContact,  setEditContact]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  const loadContacts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getContacts(user.uid)
      setContacts(data)
    } catch (e) {
      console.error('CRM load failed', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (authReady && user) loadContacts() }, [authReady, user, loadContacts])

  /* ── Stage counts ── */
  const counts = contacts.reduce((acc, c) => {
    acc[c.stage] = (acc[c.stage] || 0) + 1
    return acc
  }, {})

  /* ── Filtered list ── */
  const filtered = contacts.filter(c => {
    const matchStage  = stageFilter === 'all' || c.stage === stageFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    return matchStage && matchSearch
  })

  /* ── Handlers ── */
  const handleAdd = async (form) => {
    setSaving(true)
    try {
      const created = await addContact(user.uid, form)
      setContacts(p => [created, ...p])
      setShowAdd(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      const updated = await updateContact(user.uid, editContact.id, form)
      setContacts(p => p.map(c => c.id === editContact.id ? { ...c, ...updated } : c))
      setEditContact(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteContact(user.uid, deleteTarget.id)
      setContacts(p => p.filter(c => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { console.error(e) }
    finally { setDeleting(false) }
  }

  if (!authReady || loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={26} style={{ color: GOLD, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#f0ebe0', fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 64px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button onClick={() => navigate(-1)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 12, marginBottom: 10, padding: 0, fontFamily: 'inherit',
            }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', background: 'rgba(200,151,62,0.1)',
              border: '1px solid rgba(200,151,62,0.25)', borderRadius: 100,
              fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em',
              marginBottom: 10, marginLeft: 0,
            }}>
              <Users size={11} /> CRM
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', margin: 0 }}>
              Contacts & Pipeline
            </h1>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} · AI lead scoring active
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadContacts} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 9, color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={13} />
            </button>
            <button onClick={() => navigate('/campaign-hub')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 9, color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <BarChart2 size={13} /> Campaign Builder
            </button>
            <button onClick={() => setShowAdd(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', background: 'rgba(200,151,62,0.12)',
              border: '1px solid rgba(200,151,62,0.3)', borderRadius: 9,
              color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Plus size={14} /> Add Contact
            </button>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            {
              icon: '📧',
              title: 'Email Drip for Leads',
              desc: 'Build an automated email sequence to nurture your leads into customers.',
              color: '#8b5cf6',
              action: () => navigate('/campaign/email_drip', { state: { prefill: { goalType: 'Generate Leads', description: 'Email nurture sequence for CRM leads' } } }),
              cta: 'Build Email Campaign →',
            },
            {
              icon: '📢',
              title: 'Campaign for Prospects',
              desc: 'Create a targeted campaign to convert warm prospects into paying customers.',
              color: '#3b82f6',
              action: () => navigate('/campaign-hub', { state: { prefill: { goalType: 'Drive Sales / Conversions', description: 'Convert prospects from CRM pipeline' } } }),
              cta: 'Build Campaign →',
            },
            {
              icon: '🤝',
              title: 'Retention Campaign',
              desc: 'Keep existing customers engaged with loyalty content and re-engagement campaigns.',
              color: '#a855f7',
              action: () => navigate('/campaign-hub', { state: { prefill: { goalType: 'Re-engage Existing Customers', description: 'Retention campaign for existing customers' } } }),
              cta: 'Build Retention Campaign →',
            },
          ].map((a, i) => (
            <div key={i} onClick={a.action} style={{ background: CARD, border: `1px solid ${a.color}22`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color + '55'}
              onMouseLeave={e => e.currentTarget.style.borderColor = a.color + '22'}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e0', marginBottom: 6 }}>{a.title}</div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.55, margin: '0 0 12px' }}>{a.desc}</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.cta}</span>
            </div>
          ))}
        </div>

        {/* ── Pipeline stage stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {STAGES.filter(s => s.key !== 'all').map(s => (
            <div
              key={s.key}
              onClick={() => setStageFilter(stageFilter === s.key ? 'all' : s.key)}
              style={{
                background: stageFilter === s.key ? `${s.color}12` : CARD,
                border: `1px solid ${stageFilter === s.key ? s.color + '40' : BORDER}`,
                borderTop: `2px solid ${s.color}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                {counts[s.key] || 0}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 2 }}>
                {s.key === 'retained' ? 'Retained' : `${s.label}s`}
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + stage filters ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9,
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '0 12px',
          }}>
            <Search size={14} style={{ color: '#444', flexShrink: 0 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, company..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#e0e0e0', fontSize: 13, padding: '10px 0', fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => setStageFilter(s.key)}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  background: stageFilter === s.key ? `${s.color}18` : CARD,
                  border: `1px solid ${stageFilter === s.key ? s.color + '40' : BORDER}`,
                  color: stageFilter === s.key ? s.color : '#666',
                  fontSize: 12, fontWeight: stageFilter === s.key ? 700 : 500,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {s.label}
                {s.key !== 'all' && (
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>
                    {counts[s.key] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contacts list ── */}
        {filtered.length === 0 ? (
          <Empty stage={stageFilter} onAdd={() => setShowAdd(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(contact => {
              const stage = STAGE_META[contact.stage] || STAGE_META.lead
              return (
                <div
                  key={contact.id}
                  style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 12, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                >
                  <Avatar name={contact.name} color={stage.color} />

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>
                        {contact.name}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: stage.bg, color: stage.color,
                      }}>
                        {stage.label.toUpperCase()}
                      </span>
                      <ScoreBadge score={contact.score || 0} />
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {contact.company && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
                          <Building2 size={11} /> {contact.company}
                        </span>
                      )}
                      {contact.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
                          <Mail size={11} /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
                          <Phone size={11} /> {contact.phone}
                        </span>
                      )}
                    </div>
                    {contact.notes && (
                      <div style={{ fontSize: 11, color: '#444', marginTop: 5, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <FileText size={10} style={{ flexShrink: 0, marginTop: 2 }} />
                        {contact.notes.length > 100 ? contact.notes.slice(0, 100) + '…' : contact.notes}
                      </div>
                    )}
                  </div>

                  {/* Last contact date */}
                  {contact.lastContact && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: '#444' }}>Last contact</div>
                      <div style={{ fontSize: 11, color: '#777', fontWeight: 600, marginTop: 1 }}>
                        {new Date(contact.lastContact).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button
                      onClick={() => navigate('/campaign/email_drip', {
                        state: { prefill: { name: contact.company || contact.name, brandName: contact.company || '', goalType: 'Generate Leads', description: `Follow-up email sequence for ${contact.name}${contact.company ? ` at ${contact.company}` : ''}` } }
                      })}
                      style={{
                        padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                        color: '#8b5cf6', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)' }}
                    >
                      <Mail size={11} /> Follow Up
                    </button>
                    <button
                      onClick={() => setEditContact(contact)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = 'rgba(200,151,62,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = BORDER }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(contact)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = BORDER }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <ContactModal
          contact={null}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
          saving={saving}
        />
      )}
      {editContact && (
        <ContactModal
          contact={editContact}
          onSave={handleEdit}
          onClose={() => setEditContact(null)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          contact={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
