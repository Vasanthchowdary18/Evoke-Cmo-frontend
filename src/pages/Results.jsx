import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, MessageSquare, Linkedin, Phone, Target,
  Search, Calendar, Megaphone, Copy, Check,
  ArrowLeft, Zap, AlertCircle, RefreshCw, Send,
  CheckCircle2, Facebook, Loader2, RotateCcw,
  Pencil, X, Instagram, TrendingUp, BarChart2,
  Globe, Rocket, Users,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { getEvokeUserProfile } from '../lib/session'
import { profileToUser } from '../lib/authUtils'
import { deductToken } from '../services/userService'
import { WEBHOOK_URL, DAY_WEBHOOK_URL } from '../config.js'

const PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',      icon: <Linkedin size={15} />,        color: '#0a66c2' },
  { key: 'instagram', label: 'Instagram',     icon: <Instagram size={15} />,       color: '#e1306c' },
  { key: 'facebook',  label: 'Facebook',      icon: <Facebook size={15} />,        color: '#1877f2' },
  { key: 'tiktok',    label: 'TikTok',        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>, color: '#ff0050' },
  { key: 'whatsapp',  label: 'WhatsApp',      icon: <MessageSquare size={15} />,   color: '#25d366' },
  { key: 'email',     label: 'Gmail / Email', icon: <Mail size={15} />,            color: '#ea4335' },
  { key: 'sheets',    label: 'Google Sheets', icon: <Send size={15} />,            color: '#34a853' },
]

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }).finally(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }
  return { copied, copy }
}

// Light-theme style helpers
const editBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 9px', background: '#f8fafc',
  border: '1px solid rgba(245,240,232,0.15)', borderRadius: 6,
  color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}
const cancelBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', background: '#f8fafc',
  border: '1px solid rgba(245,240,232,0.15)', borderRadius: 6,
  color: '#94a3b8', fontSize: 11, cursor: 'pointer',
}
const saveBtn = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 9px', background: `${color}15`,
  border: `1px solid ${color}55`, borderRadius: 6,
  color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
})
const copyBtnSmall = (isCopied) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '4px 8px', background: isCopied ? '#f0fdf4' : '#f8fafc',
  border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(245,240,232,0.15)'}`,
  borderRadius: 6, color: isCopied ? '#4ade80' : 'rgba(255,255,255,0.4)',
  fontSize: 11, cursor: 'pointer',
})
const textareaStyle = (color, minH = 140) => ({
  width: '100%', minHeight: minH, resize: 'vertical',
  background: '#f8fafc', border: `1.5px solid ${color}`,
  borderRadius: 8, padding: '10px 12px',
  color: '#ffffff', fontSize: 14,
  lineHeight: 1.7, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
})

function ResultCard({
  icon, title, color, children, copyText, copyId, copied, copy,
  editKey, editValue, editingKey, editDraft,
  onStartEdit, onSaveEdit, onCancelEdit, onDraftChange,
  launched, delay = 0,
}) {
  const isEditing = editingKey === editKey
  const isCopied = copied === copyId
  const displayValue = editValue || copyText || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        background: '#fff',
        border: `1px solid ${isEditing ? color + '55' : 'rgba(245,240,232,0.15)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'border-color 0.3s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: '1px solid #f5f0e8',
        background: isEditing ? `${color}06` : '#fafbff',
        transition: 'background 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEditing ? (
            <>
              <motion.button onClick={() => onSaveEdit(editKey)} whileTap={{ scale: 0.95 }} style={saveBtn(color)}>
                <Check size={12} /> Save
              </motion.button>
              <motion.button onClick={onCancelEdit} whileTap={{ scale: 0.95 }} style={cancelBtn}>
                <X size={12} /> Cancel
              </motion.button>
            </>
          ) : (
            <>
              {!launched && (
                <motion.button onClick={() => onStartEdit(editKey, displayValue)} whileTap={{ scale: 0.95 }} style={editBtn}>
                  <Pencil size={11} /> Edit
                </motion.button>
              )}
              <motion.button
                onClick={() => copy(displayValue, copyId)}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', background: isCopied ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(245,240,232,0.15)'}`,
                  borderRadius: 8, color: isCopied ? '#10b981' : '#64748b',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {isCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
              </motion.button>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {isEditing ? (
          <textarea
            value={editDraft}
            onChange={e => onDraftChange(e.target.value)}
            autoFocus
            style={textareaStyle(color, 140)}
          />
        ) : children}
      </div>
    </motion.div>
  )
}

function EmailCard({
  emailSubject, emailBody, editedContent, setEditedContent,
  editingKey, editDraft, onStartEdit, onSaveEdit, onCancelEdit, onDraftChange,
  copied, copy, launched, delay,
}) {
  const subjectEditing = editingKey === 'emailSubject'
  const bodyEditing = editingKey === 'emailBody'
  const copiedSubject = copied === 'emailSubject'
  const copiedBody = copied === 'emailBody'
  const copiedAll = copied === 'email'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8973e' }}>
            <Mail size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Email Campaign</span>
        </div>
        <motion.button
          onClick={() => copy(
            [emailSubject && `Subject: ${editedContent.emailSubject || emailSubject}`, editedContent.emailBody || emailBody].filter(Boolean).join('\n\n'),
            'email'
          )}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', background: copiedAll ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${copiedAll ? 'rgba(16,185,129,0.3)' : 'rgba(245,240,232,0.15)'}`,
            borderRadius: 8, color: copiedAll ? '#10b981' : '#64748b',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {copiedAll ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy All</>}
        </motion.button>
      </div>

      {/* Subject */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f0e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Subject Line</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {subjectEditing ? (
              <>
                <button onClick={() => onSaveEdit('emailSubject')} style={saveBtn('#c8973e')}><Check size={10} /> Save</button>
                <button onClick={onCancelEdit} style={cancelBtn}><X size={10} /></button>
              </>
            ) : (
              <>
                {!launched && <button onClick={() => onStartEdit('emailSubject', editedContent.emailSubject || emailSubject)} style={editBtn}><Pencil size={10} /> Edit</button>}
                <button onClick={() => copy(editedContent.emailSubject || emailSubject, 'emailSubject')} style={copyBtnSmall(copiedSubject)}>{copiedSubject ? <Check size={10} /> : <Copy size={10} />}</button>
              </>
            )}
          </div>
        </div>
        {subjectEditing ? (
          <textarea value={editDraft} onChange={e => onDraftChange(e.target.value)} autoFocus style={textareaStyle('#c8973e', 60)} />
        ) : (
          <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 600 }}>
            {editedContent.emailSubject || emailSubject || <em style={{ color: '#cbd5e1' }}>No subject</em>}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email Body</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {bodyEditing ? (
              <>
                <button onClick={() => onSaveEdit('emailBody')} style={saveBtn('#c8973e')}><Check size={10} /> Save</button>
                <button onClick={onCancelEdit} style={cancelBtn}><X size={10} /></button>
              </>
            ) : (
              <>
                {!launched && <button onClick={() => onStartEdit('emailBody', editedContent.emailBody || emailBody)} style={editBtn}><Pencil size={10} /> Edit</button>}
                <button onClick={() => copy(editedContent.emailBody || emailBody, 'emailBody')} style={copyBtnSmall(copiedBody)}>{copiedBody ? <Check size={10} /> : <Copy size={10} />}</button>
              </>
            )}
          </div>
        </div>
        {bodyEditing ? (
          <textarea value={editDraft} onChange={e => onDraftChange(e.target.value)} autoFocus style={textareaStyle('#c8973e', 160)} />
        ) : (
          <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {editedContent.emailBody || emailBody || <em style={{ color: '#cbd5e1' }}>No body</em>}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function ContentText({ value, fallback = 'Not generated' }) {
  if (!value) return <p style={{ color: '#cbd5e1', fontSize: 14, fontStyle: 'italic' }}>{fallback}</p>
  return <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</p>
}

function FieldRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 5, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{value}</p>
    </div>
  )
}

function parseCalendar(calText) {
  if (!calText) return []
  if (typeof calText === 'object') return Object.entries(calText).map(([k, v]) => ({ day: k, content: v }))
  const lines = calText.split('\n').filter(l => l.trim())
  const days = []
  let current = null
  for (const line of lines) {
    const dayMatch = line.match(/^(?:day\s*)?(\d+)[:\.\-\s]/i)
    if (dayMatch) {
      if (current) days.push(current)
      current = { day: `Day ${dayMatch[1]}`, content: line.replace(/^(?:day\s*)?\d+[:\.\-\s]*/i, '').trim() }
    } else if (current) {
      current.content += '\n' + line.trim()
    }
  }
  if (current) days.push(current)
  if (days.length === 0 && calText.trim()) return [{ day: 'Calendar', content: calText }]
  return days
}

function flattenResult(data) {
  if (!data) return {}
  if (data.output) return flattenResult(data.output)
  if (data.result) return flattenResult(data.result)
  if (Array.isArray(data) && data.length > 0) return flattenResult(data[0])
  return data
}

const dayColors = ['#c8973e', '#8b5cf6', '#a855f7', '#c8973e', '#0891b2', '#0e7490', '#c8973e']

function PostingStatusBanner({ postingStatus, selectedPlatforms, onRetry }) {
  const isPosting = postingStatus === 'posting'
  const isSuccess = postingStatus === 'success'
  const isFailed  = postingStatus === 'failed'

  const bannerBg     = isSuccess ? '#f0fdf4' : isFailed ? '#fef2f2' : '#fffbeb'
  const bannerBorder = isSuccess ? 'rgba(16,185,129,0.3)' : isFailed ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
  const statusColor  = isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b'

  const title = isSuccess ? 'Campaign sent to your platforms!' : isFailed ? 'Could not send — check your accounts and try again' : 'Sending your campaign…'
  const sub   = isSuccess ? 'Your content is now posting to all selected platforms.' : isFailed ? 'Make sure your connected accounts are active and retry.' : 'Connecting to your accounts…'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: bannerBg, border: `1px solid ${bannerBorder}`, borderRadius: 14, padding: '18px 22px', marginBottom: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPosting
            ? <Loader2 size={20} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
            : <CheckCircle2 size={20} style={{ color: statusColor }} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: statusColor }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
          </div>
        </div>
        {isFailed && (
          <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fef2f2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw size={13} /> Retry
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PLATFORMS
          .filter(p => !selectedPlatforms || selectedPlatforms.includes(p.key) || p.key === 'sheets')
          .map((p, i) => (
            <motion.div
              key={p.key + i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: `${p.color}10`, border: `1px solid ${isSuccess ? p.color + '55' : p.color + '28'}`, borderRadius: 9 }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{p.label}</div>
                <div style={{ fontSize: 10, color: isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b' }}>
                  {isSuccess ? 'Sent ✓' : isFailed ? 'Failed' : 'Sending…'}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { copied, copy } = useCopy()

  const [result, setResult]               = useState(null)
  const [campaignType, setCampaignType]   = useState('')
  const [error, setError]                 = useState('')
  const [editedContent, setEditedContent] = useState({})
  const [editingKey, setEditingKey]       = useState(null)
  const [editDraft, setEditDraft]         = useState('')
  const [postingStatus, setPostingStatus] = useState('idle')
  const [selectedPlatforms, setSelectedPlatforms] = useState(null)
  const [campaignDays, setCampaignDays]   = useState(7)
  const [dailySchedule, setDailySchedule] = useState([])
  const [calExpanded, setCalExpanded]     = useState(false)

  useEffect(() => {
    const raw  = sessionStorage.getItem('campaignResult')
    const type = sessionStorage.getItem('campaignType') || ''
    setCampaignType(type)

    const savedStatus = sessionStorage.getItem('webhookStatus')
    if (savedStatus && savedStatus !== 'idle') setPostingStatus(savedStatus)

    const days = parseInt(sessionStorage.getItem('campaignDays') || '7', 10)
    setCampaignDays(days || 7)

    try {
      const ds = sessionStorage.getItem('dailySchedule')
      if (ds) setDailySchedule(JSON.parse(ds))
    } catch {}

    try {
      const payloadRaw = sessionStorage.getItem('webhookPayload')
      if (payloadRaw) {
        const p = JSON.parse(payloadRaw)
        if (p.platforms) setSelectedPlatforms(p.platforms.split(','))
      }
    } catch {}

    if (!raw) { setError('No campaign results found. Please generate a campaign first.'); return }
    try {
      const flat = flattenResult(JSON.parse(raw))
      const hasContent = flat.emailSubject || flat.emailBody || flat.linkedinPost ||
        flat.instagramCaption || flat.facebookPost || flat.whatsappMessage || flat.tiktokCaption || flat.adHeadline
      if (!hasContent && flat.error) { setError(flat.error); return }
      setResult(flat)
      setEditedContent({
        emailSubject:         flat.emailSubject         || flat.email_subject         || '',
        emailBody:            flat.emailBody            || flat.email_body            || '',
        linkedinPost:         flat.linkedinPost         || flat.linkedin_post         || '',
        instagramCaption:     flat.instagramCaption     || flat.instagram_caption     || '',
        facebookPost:         flat.facebookPost         || flat.facebook_post         || '',
        tiktokCaption:        flat.tiktokCaption        || flat.tiktok_caption        || '',
        whatsappMessage:      flat.whatsappMessage      || flat.whatsapp_message      || '',
        positioningStatement: flat.positioningStatement || '',
        seoTitle:             flat.seoTitle             || '',
        seoDescription:       flat.seoDescription       || '',
        adHeadline:           flat.adHeadline           || '',
        adBody:               flat.adBody               || '',
      })
    } catch { setError('Failed to parse campaign results.') }
  }, [])

  const startEdit  = (key, value) => { setEditingKey(key); setEditDraft(value || '') }
  const saveEdit   = (key) => { setEditedContent(p => ({ ...p, [key]: editDraft })); setEditingKey(null); setEditDraft('') }
  const cancelEdit = () => { setEditingKey(null); setEditDraft('') }

  // Schedule remaining days (2…N) using localStorage queue + setTimeout
  const scheduleDailyPosts = (campaignId, payload, schedule, totalDays, postTime) => {
    if (totalDays <= 1 || schedule.length === 0) return
    const [postHour, postMin] = (postTime || '09:00').split(':').map(Number)
    const now = new Date()
    const pending = []

    for (let day = 2; day <= totalDays; day++) {
      const target = new Date(now)
      target.setDate(target.getDate() + (day - 1))
      target.setHours(postHour, postMin, 0, 0)
      const delayMs = target.getTime() - now.getTime()
      const dayContent = schedule[day - 1] || {}
      const dayPayload = {
        ...payload,
        day,
        linkedinPost:     dayContent.linkedinPost     || payload.linkedinPost     || '',
        instagramCaption: dayContent.instagramCaption || payload.instagramCaption || '',
        facebookPost:     dayContent.facebookPost     || payload.facebookPost     || '',
        whatsappMessage:  dayContent.whatsappMessage  || payload.whatsappMessage  || '',
        emailSubject:     dayContent.emailSubject     || payload.emailSubject     || '',
        emailBody:        dayContent.emailBody        || payload.emailBody        || '',
        dailySchedule:    schedule,
      }
      pending.push({ campaignId, day, scheduledAt: target.toISOString(), payload: dayPayload, posted: false })

      // Browser-session setTimeout (works when tab stays open)
      if (delayMs > 0 && delayMs < 2147483647) {
        setTimeout(async () => {
          try {
            await fetch(DAY_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dayPayload) })
            // Mark as posted in localStorage
            const queue = JSON.parse(localStorage.getItem('evoke_pending_days') || '[]')
            const qi = queue.findIndex(q => q.campaignId === campaignId && q.day === day)
            if (qi !== -1) { queue[qi].posted = true; localStorage.setItem('evoke_pending_days', JSON.stringify(queue)) }
            // Update daysPosted in campaign history
            const campaigns = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
            const ci = campaigns.findIndex(c => c.id === campaignId)
            if (ci !== -1) {
              campaigns[ci].daysPosted = [...new Set([...(campaigns[ci].daysPosted || [1]), day])]
              localStorage.setItem('evoke_campaigns', JSON.stringify(campaigns))
            }
          } catch (e) { console.warn(`Day ${day} post failed:`, e) }
        }, delayMs)
      }
    }

    // Save pending queue so Dashboard can pick up missed days (browser closed/reopened)
    const existingQueue = JSON.parse(localStorage.getItem('evoke_pending_days') || '[]')
    localStorage.setItem('evoke_pending_days', JSON.stringify([...pending, ...existingQueue]))
  }

  const handleLaunch = async () => {
    const raw = sessionStorage.getItem('webhookPayload')
    if (!raw) { setPostingStatus('failed'); return }
    setPostingStatus('posting')
    try {
      const payload = { ...JSON.parse(raw), ...editedContent }
      const res = await Promise.race([
        fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
      ])
      if (res.ok) {
        setPostingStatus('success')
        sessionStorage.setItem('webhookStatus', 'success')
        const ssoUser = profileToUser(getEvokeUserProfile())
        if (ssoUser) { try { await deductToken(ssoUser.uid) } catch {} }

        // ── Save to campaign history ──
        try {
          const metaRaw  = sessionStorage.getItem('campaignMeta')
          const meta     = metaRaw ? JSON.parse(metaRaw) : {}
          const totalDays   = payload.campaignDays || campaignDays || 1
          const postTime    = payload.dailyPostTime || payload.postTime || '09:00'
          const campaignId  = Date.now().toString()
          const newCampaign = {
            id:             campaignId,
            name:           payload.name        || meta.name     || 'Campaign',
            type:           payload.campaignType || campaignType || 'event',
            date:           new Date().toISOString(),
            platforms:      payload.platforms   ? payload.platforms.split(',') : [],
            goal:           payload.goal        || '',
            brandName:      payload.brandName   || meta.brandName || '',
            description:    payload.description || '',
            imageUrl:       payload.imageUrl    || '',
            targetAudience: payload.targetAudience || '',
            campaignDays:   totalDays,
            dailyPostTime:  postTime,
            dailySchedule:  dailySchedule || [],
            daysPosted:     [1],
            result:         { ...result, ...editedContent },
            meta:           { name: payload.name || meta.name, brandName: payload.brandName || meta.brandName },
          }
          const existing = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
          localStorage.setItem('evoke_campaigns', JSON.stringify([newCampaign, ...existing]))

          // ── Schedule remaining days (2…N) ──
          if (totalDays > 1) {
            scheduleDailyPosts(campaignId, payload, dailySchedule || [], totalDays, postTime)
          }
        } catch (saveErr) {
          console.warn('Failed to save campaign history:', saveErr)
        }
      } else {
        setPostingStatus('failed')
        sessionStorage.setItem('webhookStatus', 'failed')
      }
    } catch {
      setPostingStatus('failed')
      sessionStorage.setItem('webhookStatus', 'failed')
    }
  }

  const handleNewCampaign = () => {
    ['campaignResult','campaignType','campaignMeta','webhookStatus','webhookPayload','campaignDays','dailySchedule'].forEach(k => sessionStorage.removeItem(k))
    navigate('/agents-hub')
  }

  if (error) {
    const isRateLimit   = error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('too many')
    const isNoAccount   = error.toLowerCase().includes('account') || error.toLowerCase().includes('connect') || error.toLowerCase().includes('linked')
    const isNoCampaign  = error.toLowerCase().includes('no campaign') || error.toLowerCase().includes('not found')

    const errorTitle = isRateLimit  ? 'AI Rate Limit Reached'
                     : isNoAccount  ? 'Account Not Connected'
                     : isNoCampaign ? 'No Campaign Found'
                     : 'Campaign Could Not Complete'

    const errorDesc = isRateLimit  ? 'The AI is temporarily busy. Please wait 30–60 seconds and try again.'
                    : isNoAccount  ? error
                    : isNoCampaign ? 'No campaign data was found. Please go back and generate a campaign first.'
                    : error

    const suggestedFix = isRateLimit  ? { label: 'Wait & Retry',       action: () => navigate(-1),             icon: <RefreshCw size={14} /> }
                       : isNoAccount  ? { label: 'Connect Accounts',    action: () => navigate('/connect-accounts'), icon: <AlertCircle size={14} /> }
                       : isNoCampaign ? { label: 'Launch New Campaign',  action: () => navigate('/agents-hub'),  icon: <ArrowLeft size={14} /> }
                       :                { label: 'Try Again',            action: () => navigate(-1),             icon: <RefreshCw size={14} /> }

    return (
      <div style={{ minHeight: '100vh', background: '#0e0c09', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: 480, position: 'relative', zIndex: 1 }}
        >
          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <AlertCircle size={30} style={{ color: '#ef4444' }} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {errorTitle}
          </h2>

          {/* Description */}
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontSize: 14, lineHeight: 1.7 }}>
            {errorDesc}
          </p>

          {/* Suggested fix */}
          <div style={{
            margin: '20px 0 24px',
            padding: '14px 18px',
            background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.22)',
            borderRadius: 12, textAlign: 'left',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c8973e', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
              Suggested Fix
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              {isRateLimit  ? 'Wait 30–60 seconds, then click "Try Again" below.'
               : isNoAccount ? 'Go to Connect Accounts and link at least one platform before running campaigns.'
               : isNoCampaign ? 'Return to the Campaign Dashboard and select a campaign type to generate.'
               : 'Check your internet connection and campaign settings, then retry.'}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={suggestedFix.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px',
                background: 'linear-gradient(135deg, #d4a853, #b8803a)',
                border: 'none', borderRadius: 10,
                color: '#0e0c09', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {suggestedFix.icon} {suggestedFix.label}
            </button>
            <button
              onClick={() => navigate('/cmo')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: 'rgba(255,255,255,0.55)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!result) return null

  const r = result
  const emailSubject         = r.emailSubject         || r.email_subject         || ''
  const emailBody            = r.emailBody            || r.email_body            || ''
  const linkedinPost         = r.linkedinPost         || r.linkedin_post         || ''
  const instagramCaption     = r.instagramCaption     || r.instagram_caption     || ''
  const facebookPost         = r.facebookPost         || r.facebook_post         || ''
  const tiktokCaption        = r.tiktokCaption        || r.tiktok_caption        || ''
  const whatsappMessage      = r.whatsappMessage      || r.whatsapp_message      || ''
  const smsMessage           = r.smsMessage           || r.sms_message           || ''
  const positioningStatement = r.positioningStatement || r.positioning_statement || ''
  const seoTitle             = r.seoTitle             || r.seo_title             || ''
  const seoDescription       = r.seoDescription       || r.seo_description       || ''
  const campaignCalendar     = r.campaignCalendar     || r.campaign_calendar     || ''
  const adHeadline           = r.adHeadline           || r.ad_headline           || ''
  const adBody               = r.adBody               || r.ad_body               || ''
  const imageUrl             = r.imageUrl             || r.image_url             || ''
  const videoUrl             = r.videoUrl             || ''
  const hasVideo             = r.hasVideo             || !!videoUrl

  const calendarDays = parseCalendar(campaignCalendar)
  const launched = postingStatus !== 'idle'

  // Strategy-specific fields (only populated for growth_strategy)
  const isStrategy         = campaignType === 'growth_strategy'
  const executiveSummary   = r.executiveSummary   || r.executive_summary   || ''
  const growthOpportunities= r.growthOpportunities|| r.growth_opportunities|| ''
  const gtmPlan            = r.gtmPlan            || r.gtm_plan            || ''
  const revenueProjection  = r.revenueProjection  || r.revenue_projection  || ''
  const partnershipIdeas   = r.partnershipIdeas   || r.partnership_ideas   || ''
  const expansionRoadmap   = r.expansionRoadmap   || r.expansion_roadmap   || ''
  const competitorGaps     = r.competitorGaps     || r.competitor_gaps     || ''

  const fullText = [
    editedContent.emailSubject && `EMAIL SUBJECT:\n${editedContent.emailSubject}`,
    editedContent.emailBody    && `EMAIL BODY:\n${editedContent.emailBody}`,
    editedContent.linkedinPost && `LINKEDIN:\n${editedContent.linkedinPost}`,
    editedContent.instagramCaption && `INSTAGRAM:\n${editedContent.instagramCaption}`,
    editedContent.facebookPost && `FACEBOOK:\n${editedContent.facebookPost}`,
    editedContent.tiktokCaption && `TIKTOK:\n${editedContent.tiktokCaption}`,
    editedContent.whatsappMessage && `WHATSAPP:\n${editedContent.whatsappMessage}`,
    positioningStatement && `POSITIONING:\n${positioningStatement}`,
    seoTitle && `SEO TITLE:\n${seoTitle}`,
    seoDescription && `SEO DESC:\n${seoDescription}`,
    adHeadline && `AD HEADLINE:\n${adHeadline}`,
    adBody && `AD BODY:\n${adBody}`,
    campaignCalendar && `${campaignDays}-DAY CALENDAR:\n${campaignCalendar}`,
  ].filter(Boolean).join('\n\n---\n\n')

  const editProps = { editingKey, editDraft, onStartEdit: startEdit, onSaveEdit: saveEdit, onCancelEdit: cancelEdit, onDraftChange: setEditDraft, launched }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '108px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <button onClick={() => navigate('/agents-hub')} className="btn-ghost" style={{ marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="badge" style={{ marginBottom: 10, display: 'inline-flex' }}>
                {isStrategy ? <><TrendingUp size={13} /> Strategy Generated</> : <><Zap size={13} /> Campaign Generated</>}
              </div>
              <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: 6 }}>
                {isStrategy
                  ? <>Your <span className="gradient-text">Growth Strategy is Ready</span></>
                  : <>Your <span className="gradient-text">Campaign is Ready</span></>}
              </h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {isStrategy
                  ? 'Your AI-generated strategy document is below. Copy any section or download the full strategy.'
                  : 'Review and edit your content below, then launch to post to all platforms.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={() => copy(fullText, 'all')} style={{ fontSize: 13 }}>
                {copied === 'all' ? <><Check size={13} style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>Copied!</span></> : <><Copy size={13} /> Copy All</>}
              </button>
              <button className="btn-ghost" onClick={handleNewCampaign} style={{ fontSize: 13 }}>
                <RefreshCw size={13} /> {isStrategy ? 'New Strategy' : 'New Campaign'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Posting status — hidden for strategy (no social posting) */}
        <AnimatePresence>
          {!isStrategy && launched && (
            <PostingStatusBanner postingStatus={postingStatus} selectedPlatforms={selectedPlatforms} onRetry={handleLaunch} />
          )}
        </AnimatePresence>

        {/* Launch Banner (before launch) — hidden for strategy */}
        {!isStrategy && !launched && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Pencil size={15} style={{ color: '#c8973e' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Review & Edit Before Posting</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Use the <strong style={{ color: '#c8973e' }}>Edit</strong> button on any card to customise the AI content. When ready, click Launch.
              </p>
            </div>
            <motion.button
              onClick={handleLaunch}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 28px', background: 'linear-gradient(135deg, #d4a853, #b8803a)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(200,151,62,0.3)' }}
            >
              <Zap size={16} /> Launch Campaign
            </motion.button>
          </motion.div>
        )}

        {/* Campaign visual — image + video */}
        {(imageUrl || videoUrl) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ marginBottom: 16, background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>Campaign Visual</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Image */}
              {imageUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <img src={imageUrl} alt="Campaign image" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(245,240,232,0.15)' }} />
                  <a href={imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>View Image ↗</a>
                </div>
              )}
              {/* Generated Video */}
              {videoUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ position: 'relative' }}>
                    <video src={videoUrl} autoPlay loop muted playsInline controls
                      style={{ width: 180, borderRadius: 10, border: '2px solid #10b981', display: 'block' }} />
                    <span style={{ position: 'absolute', top: 6, left: 6, background: '#10b981', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 100, letterSpacing: '0.06em' }}>VIDEO</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={videoUrl} download target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>Download ↓</a>
                    <span style={{ fontSize: 11, color: '#64748b' }}>· Will be posted as video</span>
                  </div>
                </div>
              )}
            </div>
            {hasVideo && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                ✓ Video detected — n8n will post as video to Instagram, Facebook & LinkedIn
              </div>
            )}
          </motion.div>
        )}

        {/* ── Strategy-specific cards (growth_strategy only) ── */}
        {isStrategy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
            {[
              { key: 'executiveSummary',    value: executiveSummary,    icon: <Zap size={16}/>,          color: '#10b981', title: 'Executive Summary'        },
              { key: 'growthOpportunities', value: growthOpportunities, icon: <TrendingUp size={16}/>,   color: '#c8973e', title: 'Growth Opportunities'      },
              { key: 'gtmPlan',             value: gtmPlan,             icon: <Rocket size={16}/>,       color: '#6366f1', title: 'Go-To-Market Plan'         },
              { key: 'revenueProjection',   value: revenueProjection,   icon: <BarChart2 size={16}/>,    color: '#f59e0b', title: '12-Month Revenue Forecast' },
              { key: 'partnershipIdeas',    value: partnershipIdeas,    icon: <Users size={16}/>,        color: '#0a66c2', title: 'Strategic Partnerships'    },
              { key: 'expansionRoadmap',    value: expansionRoadmap,    icon: <Globe size={16}/>,        color: '#14b8a6', title: 'Expansion Roadmap'         },
              { key: 'competitorGaps',      value: competitorGaps,      icon: <Target size={16}/>,       color: '#a855f7', title: 'Competitor Gaps to Exploit'},
            ].filter(s => s.value).map((s, i) => (
              <ResultCard key={s.key}
                icon={s.icon} title={s.title} color={s.color}
                copyText={s.value} copyId={s.key}
                copied={copied} copy={copy}
                editKey={s.key} editValue={s.value}
                delay={i * 0.06}
                {...editProps}
              >
                <ContentText value={s.value} />
              </ResultCard>
            ))}
          </div>
        )}

        {/* Content Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {(emailSubject || emailBody) && (
            <EmailCard emailSubject={emailSubject} emailBody={emailBody} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.05} {...editProps} />
          )}

          {linkedinPost && (
            <ResultCard icon={<Linkedin size={16} />} title="LinkedIn Post" color="#0a66c2" copyText={linkedinPost} copyId="linkedin" copied={copied} copy={copy} editKey="linkedinPost" editValue={editedContent.linkedinPost} delay={0.08} {...editProps}>
              <ContentText value={editedContent.linkedinPost || linkedinPost} />
            </ResultCard>
          )}

          {facebookPost && (
            <ResultCard icon={<Facebook size={16} />} title="Facebook Post" color="#1877f2" copyText={facebookPost} copyId="facebook" copied={copied} copy={copy} editKey="facebookPost" editValue={editedContent.facebookPost} delay={0.11} {...editProps}>
              <ContentText value={editedContent.facebookPost || facebookPost} />
            </ResultCard>
          )}

          {tiktokCaption && (
            <ResultCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>}
              title="TikTok Caption" color="#ff0050" copyText={tiktokCaption} copyId="tiktok" copied={copied} copy={copy} editKey="tiktokCaption" editValue={editedContent.tiktokCaption} delay={0.14} {...editProps}>
              <ContentText value={editedContent.tiktokCaption || tiktokCaption} />
            </ResultCard>
          )}

          {whatsappMessage && (
            <ResultCard icon={<MessageSquare size={16} />} title="WhatsApp Message" color="#25d366" copyText={whatsappMessage} copyId="whatsapp" copied={copied} copy={copy} editKey="whatsappMessage" editValue={editedContent.whatsappMessage} delay={0.17} {...editProps}>
              <ContentText value={editedContent.whatsappMessage || whatsappMessage} />
            </ResultCard>
          )}

          {instagramCaption && (
            <ResultCard icon={<Instagram size={16} />} title="Instagram Caption" color="#e1306c" copyText={instagramCaption} copyId="instagram" copied={copied} copy={copy} editKey="instagramCaption" editValue={editedContent.instagramCaption} delay={0.2} {...editProps}>
              <ContentText value={editedContent.instagramCaption || instagramCaption} />
            </ResultCard>
          )}

          {smsMessage && (
            <ResultCard icon={<Phone size={16} />} title="SMS Message" color="#c8973e" copyText={smsMessage} copyId="sms" copied={copied} copy={copy} editKey="smsMessage" editValue={editedContent.smsMessage} delay={0.2} {...editProps}>
              <ContentText value={editedContent.smsMessage || smsMessage} />
            </ResultCard>
          )}

          {positioningStatement && (
            <ResultCard icon={<Target size={16} />} title="Positioning Statement" color="#a855f7" copyText={positioningStatement} copyId="positioning" copied={copied} copy={copy} editKey="positioningStatement" editValue={editedContent.positioningStatement} delay={0.23} {...editProps}>
              <ContentText value={editedContent.positioningStatement || positioningStatement} />
            </ResultCard>
          )}

          {(seoTitle || seoDescription) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Search size={16} /></div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>SEO Content</span>
                </div>
                <button onClick={() => copy(`${seoTitle}\n\n${seoDescription}`, 'seo')} style={copyBtnSmall(copied === 'seo')}>{copied === 'seo' ? <Check size={11} /> : <Copy size={11} />}</button>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <FieldRow label="SEO Title" value={seoTitle} />
                <FieldRow label="Meta Description" value={seoDescription} />
              </div>
            </motion.div>
          )}

          {(adHeadline || adBody) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}
              style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}><Megaphone size={16} /></div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Ad Copy</span>
                </div>
                <button onClick={() => copy(`${adHeadline}\n\n${adBody}`, 'ad')} style={copyBtnSmall(copied === 'ad')}>{copied === 'ad' ? <Check size={11} /> : <Copy size={11} />}</button>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <FieldRow label="Headline" value={adHeadline} />
                <FieldRow label="Ad Body" value={adBody} />
              </div>
            </motion.div>
          )}

          {/* ── Campaign Calendar (N-day) ── */}
          {(calendarDays.length > 0 || dailySchedule.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8973e' }}><Calendar size={16} /></div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{campaignDays}-Day Campaign Calendar</span>
                    <span style={{ marginLeft: 10, padding: '2px 9px', background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 100, fontSize: 10, fontWeight: 700, color: '#c8973e' }}>
                      {campaignDays} DAYS · AUTO-POST
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {calendarDays.length > 5 && (
                    <button onClick={() => setCalExpanded(v => !v)} style={{ ...copyBtnSmall(false), gap: 4 }}>
                      {calExpanded ? '▲ Show less' : `▼ Show all ${campaignDays} days`}
                    </button>
                  )}
                  <button onClick={() => copy(campaignCalendar, 'calendar')} style={copyBtnSmall(copied === 'calendar')}>{copied === 'calendar' ? <Check size={11} /> : <Copy size={11} />}</button>
                </div>
              </div>

              {/* Info bar for multi-day campaigns */}
              {campaignDays > 1 && (
                <div style={{ padding: '10px 18px', background: 'rgba(124,58,237,0.04)', borderBottom: '1px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#c8973e', fontWeight: 700 }}>🗓 {campaignDays}-day auto-campaign</span>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Unique AI content generated for every day</span>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Posts automatically at your chosen time via n8n</span>
                </div>
              )}

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Show daily schedule if available (rich content per day) */}
                {dailySchedule.length > 0 ? (
                  <>
                    {(calExpanded ? dailySchedule : dailySchedule.slice(0, 5)).map((d, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: `1px solid ${dayColors[idx % 7]}20`, borderLeft: `3px solid ${dayColors[idx % 7]}`, borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                          <div style={{ minWidth: 54, fontWeight: 800, fontSize: 12, color: dayColors[idx % 7] }}>Day {d.day}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{d.theme || 'Campaign post'}</div>
                            {d.focus && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Focus: {d.focus}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {['linkedin','instagram','facebook','whatsapp','email'].filter(p => selectedPlatforms?.includes(p)).map(p => (
                              <span key={p} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(200,151,62,0.08)', borderRadius: 100, color: '#c8973e', fontWeight: 700 }}>
                                {p.charAt(0).toUpperCase() + p.slice(1,2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!calExpanded && dailySchedule.length > 5 && (
                      <button onClick={() => setCalExpanded(true)} style={{ padding: '10px', background: 'none', border: '1px dashed rgba(245,240,232,0.15)', borderRadius: 10, color: '#c8973e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        + Show remaining {dailySchedule.length - 5} days
                      </button>
                    )}
                  </>
                ) : (
                  /* Fallback: parsed text calendar */
                  <>
                    {(calExpanded ? calendarDays : calendarDays.slice(0, 5)).map((day, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: '#f8fafc', border: `1px solid ${dayColors[idx % 7]}20`, borderLeft: `3px solid ${dayColors[idx % 7]}`, borderRadius: 10 }}>
                        <div style={{ minWidth: 56, fontWeight: 700, fontSize: 12, color: dayColors[idx % 7], paddingTop: 2 }}>{day.day}</div>
                        <p style={{ color: '#334155', fontSize: 13, lineHeight: 1.65, flex: 1, whiteSpace: 'pre-wrap' }}>{day.content}</p>
                      </div>
                    ))}
                    {!calExpanded && calendarDays.length > 5 && (
                      <button onClick={() => setCalExpanded(true)} style={{ padding: '10px', background: 'none', border: '1px dashed rgba(245,240,232,0.15)', borderRadius: 10, color: '#c8973e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        + Show remaining {calendarDays.length - 5} days
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {!emailSubject && !emailBody && !linkedinPost && !facebookPost && !tiktokCaption && !whatsappMessage && !smsMessage && !positioningStatement && !seoTitle && !adHeadline && calendarDays.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 16 }}>
              <AlertCircle size={32} style={{ color: '#cbd5e1', marginBottom: 14 }} />
              <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 20 }}>No campaign content was generated. Please try again.</p>
              <button className="btn-primary" onClick={() => navigate(-1)} style={{ fontSize: 14 }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </motion.div>
          )}
        </div>

        {/* Bottom CTA — strategy gets "Go to Dashboard", campaigns get "Launch" */}
        {isStrategy ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 32, padding: '24px 28px', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                Your growth strategy is ready 🎉
              </p>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Copy individual sections or use the "Copy All" button at the top. Head back to launch your next agent.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => navigate('/agents-hub')}
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', background: 'linear-gradient(135deg, #d4a853, #b8803a)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Zap size={15} /> Go to Dashboard
              </motion.button>
              <motion.button
                onClick={handleNewCampaign}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={14} /> New Strategy
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Bottom Launch CTA */}
            {!launched && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ marginTop: 32, padding: '24px 28px', background: '#fff', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                    {campaignDays > 1 ? `Ready to launch your ${campaignDays}-day campaign?` : 'Ready to go live?'}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>
                    {campaignDays > 1
                      ? `n8n will auto-post unique content every day for ${campaignDays} days across all your connected platforms.`
                      : 'All edits are saved. Click Launch to post across all your connected platforms.'}
                  </p>
                </div>
                <motion.button
                  onClick={handleLaunch}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 28px', background: 'linear-gradient(135deg, #d4a853, #b8803a)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(200,151,62,0.3)' }}
                >
                  <Zap size={16} /> {campaignDays > 1 ? `Launch ${campaignDays}-Day Campaign` : 'Launch Campaign'}
                </motion.button>
              </motion.div>
            )}

            {/* Success CTA */}
            {launched && postingStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ marginTop: 32, padding: '22px 26px', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
              >
                <div>
                  <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Campaign launched successfully!</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>Ready to create your next campaign?</p>
                </div>
                <button className="btn-primary" onClick={handleNewCampaign} style={{ whiteSpace: 'nowrap' }}>
                  New Campaign <Zap size={16} />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
