import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JourneyFooter from '../components/JourneyFooter.jsx'
import {
  CheckCircle2, XCircle, Clock, Send, Pencil, X, Check,
  Linkedin, Instagram, Facebook, Mail, MessageSquare,
  ArrowLeft, Inbox, Loader2, RefreshCw, Zap, Filter, CalendarClock,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getContentItems, setItemStatus, updateContentItem, scheduleItem } from '../services/contentService'

const PLATFORM_META = {
  linkedin:  { label: 'LinkedIn',   color: '#0a66c2', icon: <Linkedin  size={14} /> },
  instagram: { label: 'Instagram',  color: '#e1306c', icon: <Instagram size={14} /> },
  facebook:  { label: 'Facebook',   color: '#1877f2', icon: <Facebook  size={14} /> },
  tiktok:    { label: 'TikTok',     color: '#ff0050', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
  whatsapp:  { label: 'WhatsApp',   color: '#25d366', icon: <MessageSquare size={14} /> },
  email:     { label: 'Email',      color: '#ea4335', icon: <Mail size={14} /> },
  gmail:     { label: 'Gmail',      color: '#ea4335', icon: <Mail size={14} /> },
  twitter:   { label: 'X / Twitter',color: '#000000', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.625L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> },
}

const STATUS_META = {
  draft:     { label: 'Draft',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',     border: 'rgba(245,158,11,0.25)'     },
  approved:  { label: 'Approved',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',     border: 'rgba(16,185,129,0.25)'     },
  scheduled: { label: 'Scheduled', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',     border: 'rgba(99,102,241,0.25)'     },
  published: { label: 'Published', color: '#0a66c2', bg: 'rgba(10,102,194,0.1)',     border: 'rgba(10,102,194,0.25)'     },
  rejected:  { label: 'Rejected',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',     border: 'rgba(239,68,68,0.2)'       },
}

const TYPE_LABELS = {
  post: 'Social Post', email: 'Email', ad: 'Ad Copy',
  seo: 'SEO Content', strategy: 'Strategy Doc',
}

const FILTERS = ['all', 'draft', 'approved', 'scheduled', 'published', 'rejected']

/** Displays a colour-coded pill badge for a content item's current status. */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
      background: m.bg, border: `1px solid ${m.border}`, color: m.color,
    }}>
      {status === 'draft'     && <Clock size={10} />}
      {status === 'approved'  && <CheckCircle2 size={10} />}
      {status === 'published' && <Send size={10} />}
      {status === 'rejected'  && <XCircle size={10} />}
      {status === 'scheduled' && <Clock size={10} />}
      {m.label}
    </span>
  )
}

/** Renders a small branded chip showing which platform a content item targets. */
function PlatformChip({ platform }) {
  const m = PLATFORM_META[platform]
  if (!m) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: `${m.color}12`, border: `1px solid ${m.color}30`, color: m.color,
    }}>
      {m.icon} {m.label}
    </span>
  )
}

/**
 * ContentCard — displays a single AI-generated content item with inline editing,
 * approve/reject actions, and a date-time scheduler for approved items.
 */
function ContentCard({ item, onApprove, onReject, onUndoReject, onSave, onSchedule }) {
  const [editing, setEditing]         = useState(false)
  const [draft, setDraft]             = useState(item.text)
  const [saving, setSaving]           = useState(false)
  const [acting, setActing]           = useState(null) // 'approve' | 'reject' | 'schedule'
  const [showScheduler, setShowScheduler] = useState(false)

  // Default to tomorrow 9am local time
  const defaultDateTime = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    // datetime-local input requires "YYYY-MM-DDTHH:MM"
    return d.toISOString().slice(0, 16)
  }
  const [scheduleAt, setScheduleAt] = useState(defaultDateTime)

  const handleSave = async () => {
    setSaving(true)
    await onSave(item.id, draft)
    setEditing(false)
    setSaving(false)
  }

  const handleApprove = async () => {
    setActing('approve')
    await onApprove(item.id)
    setActing(null)
  }

  const handleReject = async () => {
    setActing('reject')
    await onReject(item.id)
    setActing(null)
  }

  const handleScheduleConfirm = async () => {
    if (!scheduleAt) return
    setActing('schedule')
    await onSchedule(item.id, new Date(scheduleAt))
    setShowScheduler(false)
    setActing(null)
  }

  const isDraft      = item.status === 'draft'
  const isRejected   = item.status === 'rejected'
  const isApproved   = item.status === 'approved'
  const isScheduled  = item.status === 'scheduled'

  const sm = STATUS_META[item.status] || STATUS_META.draft

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      style={{
        background: '#fff',
        border: `1px solid ${sm.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
        padding: '14px 18px',
        borderBottom: `1px solid ${sm.border}`,
        background: sm.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <StatusBadge status={item.status} />
          {item.platform && <PlatformChip platform={item.platform} />}
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            {TYPE_LABELS[item.type] || item.type}
          </span>
          {item.campaignName && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>· {item.campaignName}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
            : '—'}
        </span>
      </div>

      {/* Content body */}
      <div style={{ padding: '16px 18px' }}>
        {item.subject && (
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Subject: <span style={{ color: '#334155', fontWeight: 600, textTransform: 'none' }}>{item.subject}</span>
          </p>
        )}

        {editing ? (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            style={{
              width: '100%', minHeight: 120, resize: 'vertical', boxSizing: 'border-box',
              padding: '10px 12px', background: '#f8fafc',
              border: '1.5px solid #c8973e', borderRadius: 8,
              color: '#0f172a', fontSize: 14, lineHeight: 1.7,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        ) : (
          <p style={{
            color: '#334155', fontSize: 14, lineHeight: 1.75,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 180, overflow: 'hidden',
            maskImage: item.text?.length > 400 ? 'linear-gradient(to bottom, black 70%, transparent)' : 'none',
          }}>
            {item.text || <em style={{ color: '#cbd5e1' }}>No text content</em>}
          </p>
        )}

        {(item.imageUrl || item.videoUrl) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {item.imageUrl && (
              <img src={item.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
            )}
            {item.videoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                🎬 Video attached
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
        padding: '12px 18px',
        borderTop: '1px solid #f1f5f9',
        background: '#fafbff',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)',
                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(item.text) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: '#64748b', fontSize: 12, cursor: 'pointer',
                }}
              >
                <X size={12} /> Cancel
              </button>
            </>
          ) : (
            <>
              {(isDraft || isApproved) && (
                <button
                  onClick={() => { setEditing(true); setDraft(item.text) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Pencil size={11} /> Edit
                </button>
              )}

              {isDraft && (
                <button
                  onClick={handleApprove}
                  disabled={acting === 'approve'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {acting === 'approve'
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <CheckCircle2 size={12} />}
                  Approve
                </button>
              )}

              {isDraft && (
                <button
                  onClick={handleReject}
                  disabled={acting === 'reject'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {acting === 'reject'
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <XCircle size={12} />}
                  Reject
                </button>
              )}

              {isApproved && !showScheduler && (
                <button
                  onClick={() => setShowScheduler(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    border: '1px solid rgba(99,102,241,0.35)',
                    background: 'rgba(99,102,241,0.08)',
                    color: '#6366f1', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <CalendarClock size={12} /> Schedule
                </button>
              )}

              {isRejected && (
                <button
                  onClick={() => onUndoReject(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#64748b', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={11} /> Restore to Draft
                </button>
              )}
            </>
          )}
        </div>

        {/* Scheduled time label */}
        {isScheduled && item.scheduledAt && !editing && (
          <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarClock size={11} />
            {new Date(item.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        )}
        {isApproved && !showScheduler && !editing && (
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={11} /> Ready to schedule
          </span>
        )}
      </div>

      {/* ── Schedule picker panel ── */}
      <AnimatePresence>
        {showScheduler && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '16px 18px',
              background: 'rgba(99,102,241,0.04)',
              borderTop: '1px solid rgba(99,102,241,0.15)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarClock size={12} /> Pick a date & time to post
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setScheduleAt(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 13,
                    border: '1.5px solid rgba(99,102,241,0.35)',
                    background: '#fff', color: '#0f172a',
                    outline: 'none', fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                />
                <button
                  onClick={handleScheduleConfirm}
                  disabled={acting === 'schedule' || !scheduleAt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {acting === 'schedule'
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <CalendarClock size={12} />}
                  Confirm Schedule
                </button>
                <button
                  onClick={() => setShowScheduler(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  <X size={11} /> Cancel
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                n8n will automatically post this at the scheduled time.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * ApprovalQueue — content review page where users can approve, reject,
 * edit, or schedule AI-generated content before it goes live.
 * Fetches all content_items for the logged-in user from Firestore.
 */
export default function ApprovalQueue() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('draft')
  const [refreshing, setRefreshing] = useState(false)

  /** Fetches all content items for the current user. Pass showSpinner=true for manual refresh. */
  const load = async (showSpinner = false) => {
    if (!user) return
    if (showSpinner) setRefreshing(true)
    try {
      const all = await getContentItems(user.uid)
      setItems(all)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [user])

  const approve     = async (id) => { await setItemStatus(id, 'approved'); setItems(p => p.map(i => i.id === id ? { ...i, status: 'approved' } : i)) }
  const reject      = async (id) => { await setItemStatus(id, 'rejected'); setItems(p => p.map(i => i.id === id ? { ...i, status: 'rejected' } : i)) }
  const undoReject  = async (id) => { await setItemStatus(id, 'draft');    setItems(p => p.map(i => i.id === id ? { ...i, status: 'draft'    } : i)) }
  const save        = async (id, text) => {
    await updateContentItem(id, { text })
    setItems(p => p.map(i => i.id === id ? { ...i, text } : i))
  }
  const schedule    = async (id, date) => {
    await scheduleItem(id, date)
    setItems(p => p.map(i => i.id === id ? { ...i, status: 'scheduled', scheduledAt: date.toISOString() } : i))
  }

  const filtered  = filter === 'all' ? items : items.filter(i => i.status === filter)

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? items.length : items.filter(i => i.status === f).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '108px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/agents-hub')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' }}
          >
            <ArrowLeft size={14} /> Back to Hub
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)',
                borderRadius: 100, fontSize: 10, fontWeight: 700, color: '#c8973e',
                letterSpacing: '0.08em', marginBottom: 10,
              }}>
                <Inbox size={11} /> APPROVAL QUEUE
              </div>
              <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: 6 }}>
                Content <span style={{ background: 'linear-gradient(135deg,#d4a853,#b8803a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Queue</span>
              </h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Review every piece of AI-generated content before it goes live.
              </p>
            </div>

            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {refreshing
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Summary chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}
        >
          {[
            { key: 'draft',     label: 'Awaiting Review', color: '#f59e0b' },
            { key: 'approved',  label: 'Approved',        color: '#10b981' },
            { key: 'scheduled', label: 'Scheduled',       color: '#6366f1' },
            { key: 'published', label: 'Published',       color: '#0a66c2' },
            { key: 'rejected',  label: 'Rejected',        color: '#ef4444' },
          ].map(s => (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: 10,
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 800, color: s.color }}>{counts[s.key] || 0}</span>
              <span style={{ color: '#64748b', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4, color: '#94a3b8', fontSize: 12 }}>
            <Filter size={12} /> Filter:
          </div>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: filter === f ? 'linear-gradient(135deg,#d4a853,#b8803a)' : '#fff',
                color: filter === f ? '#fff' : '#64748b',
                border: filter === f ? 'none' : '1px solid #e2e8f0',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] > 0 && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px', borderRadius: 100,
                  background: filter === f ? 'rgba(255,255,255,0.25)' : 'rgba(200,151,62,0.1)',
                  color: filter === f ? '#fff' : '#c8973e', fontSize: 10, fontWeight: 800,
                }}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Content list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#94a3b8', fontSize: 14 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading your content…
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', border: '1px dashed #e2e8f0', borderRadius: 20 }}
          >
            <Inbox size={40} style={{ color: '#cbd5e1', marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
              {filter === 'draft' ? 'No items awaiting review' : `No ${filter} items`}
            </p>
            <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 24 }}>
              {filter === 'draft'
                ? 'Generate a campaign and your content drafts will appear here for review.'
                : 'Switch to a different filter to see other content.'}
            </p>
            {filter === 'draft' && (
              <button
                onClick={() => navigate('/agents-hub')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
                  background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Zap size={14} /> Generate a Campaign
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map(item => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onApprove={approve}
                  onReject={reject}
                  onUndoReject={undoReject}
                  onSave={save}
                  onSchedule={schedule}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <JourneyFooter currentPath="/queue" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

