import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, MessageSquare, Linkedin, Phone, Target,
  Search, Calendar, Megaphone, Copy, Check,
  ArrowLeft, Zap, AlertCircle, RefreshCw, Send,
  CheckCircle2, Facebook, Loader2, RotateCcw,
  Pencil, X, Instagram, TrendingUp, BarChart2,
  Globe, Rocket, Users, Download,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { getEvokeUserProfile } from '../lib/session'
import { profileToUser } from '../lib/authUtils'
import { useAuth } from '../hooks/useAuth.js'
import { deductToken, getUserData } from '../services/userService'
import { saveContentItems, updateContentItem, markItemsPublished } from '../services/contentService'
import { WEBHOOK_URL, DAY_WEBHOOK_URL } from '../config.js'
import { getGoogleAdsAccount, createGoogleAdsCampaign, extractAdsContent } from '../services/googleAdsService'

const PLATFORMS = [
  { key: 'linkedin',   label: 'LinkedIn',      icon: <Linkedin size={15} />,        color: '#0a66c2' },
  { key: 'instagram',  label: 'Instagram',     icon: <Instagram size={15} />,       color: '#e1306c' },
  { key: 'facebook',   label: 'Facebook',      icon: <Facebook size={15} />,        color: '#1877f2' },
  { key: 'tiktok',     label: 'TikTok',        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>, color: '#ff0050' },
  { key: 'whatsapp',   label: 'WhatsApp',      icon: <MessageSquare size={15} />,   color: '#25d366' },
  { key: 'email',      label: 'Gmail / Email', icon: <Mail size={15} />,            color: '#ea4335' },
  { key: 'sheets',     label: 'Google Sheets', icon: <Send size={15} />,            color: '#34a853' },
  { key: 'eventbrite', label: 'Eventbrite',    icon: <Calendar size={15} />,        color: '#f05537' },
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

// Safely convert any value (including nested objects/arrays from AI) to a plain string.
// Handles: string | array-of-objects | array-of-strings | plain object | number
function safeStr(val) {
  if (!val) return ''
  if (typeof val === 'string') return val

  // ── Arrays: e.g. partnershipIdeas: [{partnerType, valueExchange, approach}, …] ──
  if (Array.isArray(val)) {
    return val.map((item, i) => {
      if (typeof item !== 'object' || item === null) return `• ${item}`
      const entries = Object.entries(item)
      // Try to find a meaningful "title" field to use as the bullet header
      const titleEntry = entries.find(([k]) =>
        ['partnerType','type','name','title','phase','quarter','category',
         'strategy','channel','tactic','partner','role','step','goal','action']
          .some(t => k.toLowerCase().includes(t))
      )
      if (titleEntry) {
        const header = `${i + 1}. ${titleEntry[1]}`
        const rest = entries
          .filter(([k]) => k !== titleEntry[0])
          .map(([, v]) => `   › ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n')
        return rest ? `${header}\n${rest}` : header
      }
      // Generic fallback: join all values separated by " — "
      return `${i + 1}. ${entries.map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v).join(' — ')}`
    }).join('\n\n')
  }

  // ── Plain objects: e.g. { "Phase 1": "...", "Phase 2": "..." } ──
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}:\n${typeof v === 'object' ? safeStr(v) : v}`)
      .join('\n\n')
  }

  return String(val)
}

function ContentText({ value, fallback = 'Not generated' }) {
  if (!value) return <p style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>{fallback}</p>
  const text = safeStr(value)
  return <p style={{ color: '#1e293b', fontSize: 14.5, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text || fallback}</p>
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

// ── Parse a revenue-projection string into chartable segments ──
// Handles lines like "Month 1-3: $100,000 - $150,000" / "Q1: $50k" / "Month 4-6 — 200000"
function parseRevenue(text) {
  const str = safeStr(text)
  if (!str) return []
  const segments = []
  for (const rawLine of str.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    // Label = leading "Month X-Y", "Quarter N", "Qn", "Year N" or text before first ":" / "—"
    const labelMatch = line.match(/^((?:month|quarter|q|year|week|phase)\s*[\d\-–to ]+|[^:—-]+?)(?:[:—-]|\s\$|\s\d)/i)
    let label = labelMatch ? labelMatch[1].trim() : line.slice(0, 18).trim()
    // Find all dollar/number values in the line
    const nums = []
    const re = /\$?\s*([\d][\d,\.]*)\s*([kKmM])?/g
    let m
    while ((m = re.exec(line)) !== null) {
      let val = parseFloat(m[1].replace(/,/g, ''))
      if (isNaN(val)) continue
      const suffix = (m[2] || '').toLowerCase()
      if (suffix === 'k') val *= 1_000
      if (suffix === 'm') val *= 1_000_000
      // Ignore tiny numbers that are just part of the label (e.g. "Month 1-3")
      if (val >= 1000 || suffix) nums.push(val)
    }
    if (nums.length === 0) continue
    // Use the highest figure on the line as the bar value (the upper projection)
    const value = Math.max(...nums)
    segments.push({ label: label.replace(/\s+/g, ' '), value })
  }
  return segments
}

function fmtMoney(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'K'
  return '$' + n
}

// ── Compact revenue bars that fit inside a fixed card ──
function RevenueBars({ data }) {
  const segments = parseRevenue(data)
  if (segments.length < 2) return <ContentText value={data} />
  const max = Math.max(...segments.map(s => s.value))
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Projected Total</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{fmtMoney(total)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
        {segments.map((s, i) => {
          const h = max > 0 ? Math.max(10, (s.value / max) * 100) : 10
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{fmtMoney(s.value)}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                style={{ width: '100%', maxWidth: 48, borderRadius: '6px 6px 0 0', background: 'linear-gradient(180deg, #d4a853, #c8973e)', minHeight: 10 }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Parse "increase revenue by 15%" style impact lines into {label, pct} ──
function parseImpacts(text) {
  const str = safeStr(text)
  if (!str) return []
  // Split into numbered items ("1. …", "2) …") or paragraphs
  const items = str.split(/\n(?=\s*\d+\s*[\.\):—-])/).map(s => s.trim()).filter(Boolean)
  const out = []
  for (const it of items) {
    const pm = it.match(/(\d{1,3})\s*%/)
    if (!pm) continue
    const pct = parseInt(pm[1], 10)
    if (isNaN(pct) || pct <= 0) continue
    // Label = text after the leading number, before the first dash/colon
    let label = it.replace(/^\s*\d+\s*[\.\):—-]*\s*\d*\s*[—-]?\s*/, '').split(/[—:]|\.\s|increase|drive|improve/i)[0].trim()
    label = label.replace(/\s+/g, ' ').slice(0, 52) || `Opportunity ${out.length + 1}`
    out.push({ label, pct })
  }
  return out.slice(0, 6)
}

// ── Impact bars for Growth Opportunities ──
function ImpactBars({ data }) {
  const items = parseImpacts(data)
  if (items.length < 2) return null
  const max = Math.max(...items.map(i => i.pct))
  return (
    <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Projected Impact</div>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, marginBottom: 3, gap: 8 }}>
            <span style={{ color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
            <span style={{ color: '#c8973e', fontWeight: 800, flexShrink: 0 }}>+{it.pct}%</span>
          </div>
          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(it.pct / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#d4a853,#c8973e)', borderRadius: 100 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Parse "Phase 1 …", "Q1 …", "Week 1-2 …", "Month 1-3 …" into timeline steps ──
function parsePhases(text) {
  const str = safeStr(text)
  if (!str) return []
  const out = []
  for (const rawLine of str.split(/\n+/)) {
    const line = rawLine.trim()
    if (!line) continue
    const m = line.match(/^(Q\s*[1-4]|Quarter\s*\d|Phase\s*\d|Week\s*[\d\-–]+|Month\s*[\d\-–]+)\s*[:.—-]?\s*(.+)/i)
    if (m) {
      const tag = m[1].replace(/quarter\s*/i, 'Q').replace(/\s+/g, ' ').replace(/^phase\s*/i, 'P').replace(/^week\s*/i, 'W').replace(/^month\s*/i, 'M').toUpperCase()
      out.push({ tag, text: m[2].trim() })
    }
  }
  return out.slice(0, 6)
}

// ── Vertical phase/quarter timeline for GTM Plan & Expansion Roadmap ──
function PhaseTimeline({ data, color }) {
  const phases = parsePhases(data)
  if (phases.length < 2) return null
  return (
    <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
      {phases.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ minWidth: 30, height: 22, padding: '0 5px', borderRadius: 6, background: `${color}18`, border: `1px solid ${color}40`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{p.tag}</div>
            {i < phases.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 12, background: `${color}25`, margin: '2px 0' }} />}
          </div>
          <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5, paddingTop: 3, paddingBottom: 8 }}>{p.text}</div>
        </div>
      ))}
    </div>
  )
}

const dayColors = ['#c8973e', '#8b5cf6', '#a855f7', '#c8973e', '#0891b2', '#0e7490', '#c8973e']

function PostingStatusBanner({ postingStatus, selectedPlatforms, connectedAccounts, onRetry }) {
  const navigate  = useNavigate()
  const isPosting = postingStatus === 'posting'
  const isSuccess = postingStatus === 'success'
  const isFailed  = postingStatus === 'failed'

  // Determine which selected platforms are actually connected
  const ALWAYS_ON = ['whatsapp', 'sheets'] // no OAuth required
  const isPlatformConnected = (key) => {
    if (ALWAYS_ON.includes(key)) return true
    if (!connectedAccounts) return true // unknown — show optimistically while loading
    const acctKey = key === 'email' ? 'gmail' : key
    return !!connectedAccounts[acctKey]?.connected
  }

  const selectedList = selectedPlatforms
    ? PLATFORMS.filter(p => selectedPlatforms.includes(p.key))
    : PLATFORMS

  const connectedSelected   = selectedList.filter(p => isPlatformConnected(p.key))
  const unconnectedSelected = selectedList.filter(p => !isPlatformConnected(p.key))

  const allFailed = connectedSelected.length === 0 && unconnectedSelected.length > 0
  const someUnconnected = unconnectedSelected.length > 0

  const bannerBg     = isSuccess ? '#f0fdf4' : isFailed || allFailed ? '#fef2f2' : '#fffbeb'
  const bannerBorder = isSuccess ? 'rgba(16,185,129,0.3)' : isFailed || allFailed ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
  const statusColor  = isSuccess ? '#10b981' : isFailed || allFailed ? '#ef4444' : '#f59e0b'

  const title = isSuccess
    ? connectedSelected.length > 0 ? 'Campaign sent to your platforms!' : 'No connected platforms to post to'
    : isFailed ? 'Could not send — check your accounts and try again'
    : 'Sending your campaign…'
  const sub = isSuccess
    ? someUnconnected ? `Sent to ${connectedSelected.length} platform(s). ${unconnectedSelected.length} not connected.` : 'Your content is now posting to all selected platforms.'
    : isFailed ? 'Make sure your connected accounts are active and retry.'
    : 'Connecting to your accounts…'

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isFailed && (
            <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fef2f2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw size={13} /> Retry
            </button>
          )}
          {(isFailed || someUnconnected) && (
            <button onClick={() => navigate('/connect-accounts')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#eff6ff', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Connect Accounts
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {connectedSelected.map((p, i) => (
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
        {unconnectedSelected.map((p, i) => (
          <motion.div
            key={p.key + 'nc' + i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (connectedSelected.length + i) * 0.06 }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 9, opacity: 0.65 }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{p.label}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Not connected</div>
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
  const { user: authUser } = useAuth()

  const [result, setResult]               = useState(null)
  const [campaignType, setCampaignType]   = useState('')
  const [error, setError]                 = useState('')
  const [editedContent, setEditedContent] = useState({})
  const [editingKey, setEditingKey]       = useState(null)
  const [editDraft, setEditDraft]         = useState('')
  const [postingStatus, setPostingStatus] = useState('idle')
  const [selectedPlatforms, setSelectedPlatforms] = useState(null)
  const [connectedAccounts, setConnectedAccounts] = useState(null)
  const [campaignDays, setCampaignDays]   = useState(7)
  const [googleAdsAccount, setGoogleAdsAccount] = useState(null)
  const [googleAdsStatus, setGoogleAdsStatus]   = useState('idle') // idle | loading | success | error
  const [googleAdsError, setGoogleAdsError]     = useState('')
  const [googleAdsCampaignId, setGoogleAdsCampaignId] = useState('')

  const checkGoogleAdsAccount = () => {
    const user = authUser || profileToUser(getEvokeUserProfile())
    if (!user) return
    getUserData(user.uid).then(data => {
      if (data?.socialAccounts) setConnectedAccounts(data.socialAccounts)
    }).catch(() => {})
    getGoogleAdsAccount(user.uid).then(acc => { if (acc) setGoogleAdsAccount(acc) }).catch(() => {})
  }

  useEffect(() => {
    if (authUser) checkGoogleAdsAccount()
  }, [authUser]) // eslint-disable-line

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') checkGoogleAdsAccount() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, []) // eslint-disable-line
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
        flat.instagramCaption || flat.facebookPost || flat.whatsappMessage || flat.tiktokCaption || flat.adHeadline ||
        flat.executiveSummary || flat.growthOpportunities || flat.gtmPlan ||
        flat.adStrategy || flat.staticAdVariants?.length || flat.carouselAdVariant || flat.videoStillAdVariant
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

      // ── Auto-save growth_strategy to dashboard (no launch step for strategy docs) ──
      if ((type === 'growth_strategy' || type === 'growth_agent' || type === 'content_calendar') && (flat.executiveSummary || flat.gtmPlan)) {
        try {
          const metaRaw = sessionStorage.getItem('campaignMeta')
          const meta    = metaRaw ? JSON.parse(metaRaw) : {}
          const newEntry = {
            id:       Date.now().toString(),
            name:     flat.campaignName || meta.name || 'Growth Strategy',
            type:     'growth_strategy',
            date:     new Date().toISOString(),
            platforms: [],
            goal:     meta.goal || '',
            status:   'completed',
            result:   flat,
          }
          const existing = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
          // Avoid exact duplicates (same name + type within last 90 seconds)
          const isDup = existing.some(c =>
            c.type === 'growth_strategy' &&
            c.name === newEntry.name &&
            Date.now() - new Date(c.date).getTime() < 90000
          )
          if (!isDup) {
            localStorage.setItem('evoke_campaigns', JSON.stringify([newEntry, ...existing]))
          }
        } catch {}
      }

      // ── Persist generated content to Firestore as drafts (content library) ──
      try {
        const ssoUser = profileToUser(getEvokeUserProfile())
        const sig = `${type}:${raw.length}:${raw.slice(0, 80)}`
        if (ssoUser && sessionStorage.getItem('firestoreContentSig') !== sig) {
          const metaRaw = sessionStorage.getItem('campaignMeta')
          const meta = metaRaw ? JSON.parse(metaRaw) : {}
          const img = flat.imageUrl || flat.image_url || ''
          const vid = flat.videoUrl || ''
          const items = []
          const push = (key, itemType, platform, text, subject) => {
            const str = safeStr(text)
            if (str) items.push({ key, type: itemType, platform, text: str, subject: subject || '', imageUrl: img, videoUrl: vid })
          }
          push('linkedinPost',     'post', 'linkedin',  flat.linkedinPost     || flat.linkedin_post)
          push('instagramCaption', 'post', 'instagram', flat.instagramCaption || flat.instagram_caption)
          push('facebookPost',     'post', 'facebook',  flat.facebookPost     || flat.facebook_post)
          push('tiktokCaption',    'post', 'tiktok',    flat.tiktokCaption    || flat.tiktok_caption)
          push('whatsappMessage',  'post', 'whatsapp',  flat.whatsappMessage  || flat.whatsapp_message)
          push('emailBody',        'email', 'email',    flat.emailBody        || flat.email_body, safeStr(flat.emailSubject || flat.email_subject))
          if (flat.adHeadline || flat.adBody) {
            push('adBody', 'ad', '', [safeStr(flat.adHeadline), safeStr(flat.adBody)].filter(Boolean).join('\n\n'))
          }
          if (Array.isArray(flat.staticAdVariants) && flat.staticAdVariants.length) {
            push('staticAdVariants', 'ad', '', flat.staticAdVariants.map((v, i) =>
              `Variant ${i + 1}\nHeadline: ${v.headline || ''}\n${v.primaryText || ''}\n${v.description || ''}\nCTA: ${v.cta || ''}`
            ).join('\n\n'))
          }
          if (flat.carouselAdVariant) {
            const c = flat.carouselAdVariant
            push('carouselAdVariant', 'ad', '', `${c.headline || ''}\n\n${(c.slides || []).map((s, i) => `Slide ${i + 1}: ${s.title || ''} — ${s.text || ''}`).join('\n')}\n\nCTA: ${c.cta || ''}`)
          }
          if (flat.videoStillAdVariant) {
            const v = flat.videoStillAdVariant
            push('videoStillAdVariant', 'ad', '', `Hook: ${v.hook || ''}\n\nScript:\n${v.script || ''}\n\nCaption: ${v.caption || ''}\nCTA: ${v.cta || ''}`)
          }
          if (flat.seoTitle || flat.seoDescription) {
            push('seoTitle', 'seo', '', [safeStr(flat.seoTitle), safeStr(flat.seoDescription)].filter(Boolean).join('\n\n'))
          }
          if (flat.executiveSummary || flat.gtmPlan) {
            items.push({ key: 'strategy', type: 'strategy', platform: '', text: safeStr(flat.executiveSummary), data: JSON.stringify(flat), imageUrl: '', videoUrl: '' })
          }
          if (items.length) {
            const campaignId = Date.now().toString()
            // Set the signature before the async save so StrictMode's double
            // effect run (and quick remounts) can't create duplicate drafts.
            sessionStorage.setItem('firestoreContentSig', sig)
            saveContentItems(ssoUser.uid, {
              campaignId,
              name: flat.campaignName || meta.name || 'Campaign',
              type: type || 'event',
              source: 'campaign',
            }, items)
              .then(ids => {
                sessionStorage.setItem('firestoreContentIds', JSON.stringify(ids))
                sessionStorage.setItem('firestoreCampaignId', campaignId)
              })
              .catch(err => {
                sessionStorage.removeItem('firestoreContentSig')
                console.warn('Failed to save drafts to Firestore:', err)
              })
          }
        }
      } catch {}
    } catch { setError('Failed to parse campaign results.') }
  }, [])

  const startEdit  = (key, value) => { setEditingKey(key); setEditDraft(value || '') }
  const saveEdit   = (key) => {
    setEditedContent(p => ({ ...p, [key]: editDraft }))
    // Keep the Firestore draft in sync with user edits
    try {
      const ids = JSON.parse(sessionStorage.getItem('firestoreContentIds') || '{}')
      const docKey = key === 'emailSubject' ? 'emailBody' : key
      if (ids[docKey]) {
        const update = key === 'emailSubject' ? { subject: editDraft } : { text: editDraft }
        updateContentItem(ids[docKey], update).catch(() => {})
      }
    } catch {}
    setEditingKey(null); setEditDraft('')
  }
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

        // ── Mark Firestore drafts as published ──
        try {
          const ids = JSON.parse(sessionStorage.getItem('firestoreContentIds') || '{}')
          markItemsPublished(ids, editedContent).catch(() => {})
        } catch {}

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
    ['campaignResult','campaignType','campaignMeta','webhookStatus','webhookPayload','campaignDays','dailySchedule','firestoreContentSig','firestoreContentIds','firestoreCampaignId'].forEach(k => sessionStorage.removeItem(k))
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

  // Email Drip — extract all 5 emails
  const email1Subject = r.email1Subject || r.email_1_subject || ''
  const email1Body = r.email1Body || r.email_1_body || ''
  const email2Subject = r.email2Subject || r.email_2_subject || ''
  const email2Body = r.email2Body || r.email_2_body || ''
  const email3Subject = r.email3Subject || r.email_3_subject || ''
  const email3Body = r.email3Body || r.email_3_body || ''
  const email4Subject = r.email4Subject || r.email_4_subject || ''
  const email4Body = r.email4Body || r.email_4_body || ''
  const email5Subject = r.email5Subject || r.email_5_subject || ''
  const email5Body = r.email5Body || r.email_5_body || ''
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

  // Email Drip campaign — show only email content
  const isEmailDrip          = campaignType === 'email_drip'

  // Influencer & PR — specialized brief content
  const isInfluencer         = campaignType === 'influencer'

  // Analytics Report — report-specific content
  const isAnalyticsReport    = campaignType === 'analytics_report'

  // Ads Creation (Package C) — multi-variant ad creative output
  const isAdsCreation        = campaignType === 'ads_creation'
  const adStrategy           = r.adStrategy           || ''
  const staticAdVariants     = Array.isArray(r.staticAdVariants) ? r.staticAdVariants : []
  const carouselAdVariant    = r.carouselAdVariant    || null
  const videoStillAdVariant  = r.videoStillAdVariant  || null
  const adHeadlineVariants   = Array.isArray(r.adHeadlineVariants) ? r.adHeadlineVariants : []
  const landingPageTips      = r.landingPageTips      || ''

  const calendarDays = parseCalendar(campaignCalendar)
  const launched = postingStatus !== 'idle'

  // Free trial detection — memberShipTypeID is null for free/trial users
  const profile    = getEvokeUserProfile()
  const isFreeUser = !profile?.data?.memberShipTypeID

  // Strategy-specific fields (populated for growth_strategy, growth_agent and content_calendar free-form)
  const isStrategy         = campaignType === 'growth_strategy' || campaignType === 'growth_agent' || campaignType === 'content_calendar'
  const executiveSummary   = r.executiveSummary   || r.executive_summary   || ''
  const growthOpportunities= r.growthOpportunities|| r.growth_opportunities|| ''
  const gtmPlan            = r.gtmPlan            || r.gtm_plan            || ''
  const revenueProjection  = r.revenueProjection  || r.revenue_projection  || ''
  const partnershipIdeas   = r.partnershipIdeas   || r.partnership_ideas   || ''
  const expansionRoadmap   = r.expansionRoadmap   || r.expansion_roadmap   || ''
  const competitorGaps     = r.competitorGaps     || r.competitor_gaps     || ''

  // ── Ordered strategy sections (used by the report download + cards) ──
  const strategySections = [
    { title: 'Executive Summary',          value: executiveSummary },
    { title: 'Growth Opportunities',       value: growthOpportunities },
    { title: 'Go-To-Market Plan',          value: gtmPlan },
    { title: '12-Month Revenue Forecast',  value: revenueProjection },
    { title: 'Strategic Partnerships',     value: partnershipIdeas },
    { title: 'Expansion Roadmap',          value: expansionRoadmap },
    { title: 'Competitor Gaps to Exploit', value: competitorGaps },
  ].filter(s => s.value)

  // ── Download the full strategy as a branded, print-ready report (Save as PDF) ──
  const downloadReport = () => {
    const reportTitle = r.campaignName || 'Growth Strategy Report'
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const esc = (t) => safeStr(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const sectionsHtml = strategySections.map(s => `
      <section>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.value).replace(/\n/g, '<br/>')}</p>
      </section>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(reportTitle)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 48px 40px; line-height: 1.7; }
        .brand { font-size: 13px; font-weight: 800; letter-spacing: 0.15em; color: #c8973e; text-transform: uppercase; }
        h1 { font-size: 30px; font-weight: 900; margin: 6px 0 2px; letter-spacing: -0.02em; }
        .date { color: #64748b; font-size: 13px; margin-bottom: 28px; }
        section { margin-bottom: 26px; padding-bottom: 22px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; }
        h2 { font-size: 17px; font-weight: 800; color: #c8973e; margin: 0 0 8px; }
        p { font-size: 14px; white-space: pre-wrap; margin: 0; }
        footer { margin-top: 32px; color: #94a3b8; font-size: 11px; text-align: center; }
        @media print { body { padding: 24px; } }
      </style></head>
      <body>
        <div class="brand">EVOX AI · CMO Strategy</div>
        <h1>${esc(reportTitle)}</h1>
        <div class="date">Generated ${dateStr}</div>
        ${sectionsHtml}
        <footer>Generated by EVOX AI CMO · ${dateStr}</footer>
      </body></html>`

    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 350)
  }

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
    adStrategy && `AD STRATEGY:\n${adStrategy}`,
    staticAdVariants.length > 0 && `STATIC AD VARIANTS:\n${staticAdVariants.map((v, i) =>
      `Variant ${i + 1}\nHeadline: ${v.headline || ''}\n${v.primaryText || ''}\n${v.description || ''}\nCTA: ${v.cta || ''}`
    ).join('\n\n')}`,
    carouselAdVariant && `CAROUSEL AD:\n${carouselAdVariant.headline || ''}\n${(carouselAdVariant.slides || []).map((s, i) => `Slide ${i + 1}: ${s.title || ''} — ${s.text || ''}`).join('\n')}\nCTA: ${carouselAdVariant.cta || ''}`,
    videoStillAdVariant && `VIDEO/REEL AD:\nHook: ${videoStillAdVariant.hook || ''}\nScript:\n${videoStillAdVariant.script || ''}\nCaption: ${videoStillAdVariant.caption || ''}\nCTA: ${videoStillAdVariant.cta || ''}`,
    adHeadlineVariants.length > 0 && `HEADLINE VARIANTS:\n${adHeadlineVariants.map(h => `• ${h}`).join('\n')}`,
    landingPageTips && `LANDING PAGE TIPS:\n${landingPageTips}`,
  ].filter(Boolean).join('\n\n---\n\n')

  const editProps = { editingKey, editDraft, onStartEdit: startEdit, onSaveEdit: saveEdit, onCancelEdit: cancelEdit, onDraftChange: setEditDraft, launched }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      <Navbar />

      <div style={{
        maxWidth: isStrategy ? 1100 : 860,
        margin: '0 auto',
        padding: isStrategy ? '88px 24px 60px' : '108px 24px 40px',
      }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isStrategy ? 28 : 32 }}>
          <button
            onClick={() => navigate('/agents-hub')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              marginBottom: 20, padding: '9px 16px',
              background: '#1c1a13', border: '1px solid rgba(200,151,62,0.3)',
              borderRadius: 10, color: '#f0ebe0', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#26231a'; e.currentTarget.style.borderColor = '#c8973e' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1c1a13'; e.currentTarget.style.borderColor = 'rgba(200,151,62,0.3)' }}
          >
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
              {isStrategy && (
                <button
                  onClick={downloadReport}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, padding: '9px 18px', background: 'linear-gradient(135deg, #d4a853, #b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Download size={14} /> Download Report
                </button>
              )}
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
            <PostingStatusBanner postingStatus={postingStatus} selectedPlatforms={selectedPlatforms} connectedAccounts={connectedAccounts} onRetry={handleLaunch} />
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

        {/* Campaign visual — image + video (not needed for email drip, influencer, or analytics) */}
        {!isEmailDrip && !isInfluencer && !isAnalyticsReport && (imageUrl || videoUrl) && (
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

        {/* ── Strategy-specific cards — scrollable report layout ── */}
        {isStrategy && (() => {
          const sections = [
            { key: 'executiveSummary',    value: executiveSummary,    icon: <Zap size={16}/>,        color: '#10b981', title: 'Executive Summary',          span: 'full' },
            { key: 'growthOpportunities', value: growthOpportunities, icon: <TrendingUp size={16}/>, color: '#c8973e', title: 'Growth Opportunities',        span: 'half' },
            { key: 'gtmPlan',             value: gtmPlan,             icon: <Rocket size={16}/>,     color: '#6366f1', title: 'Go-To-Market Plan',           span: 'half' },
            { key: 'revenueProjection',   value: revenueProjection,   icon: <BarChart2 size={16}/>,  color: '#f59e0b', title: '12-Month Revenue Forecast',   span: 'full' },
            { key: 'partnershipIdeas',    value: partnershipIdeas,    icon: <Users size={16}/>,      color: '#0a66c2', title: 'Strategic Partnerships',      span: 'half' },
            { key: 'expansionRoadmap',    value: expansionRoadmap,    icon: <Globe size={16}/>,      color: '#14b8a6', title: 'Expansion Roadmap',           span: 'half' },
            { key: 'competitorGaps',      value: competitorGaps,      icon: <Target size={16}/>,     color: '#a855f7', title: 'Competitor Gaps to Exploit',  span: 'full' },
          ].filter(s => s.value)

          const rows = []
          let i = 0
          while (i < sections.length) {
            const s = sections[i]
            if (s.span === 'full') { rows.push([s]); i++ }
            else {
              const next = sections[i + 1]
              if (next && next.span === 'half') { rows.push([s, next]); i += 2 }
              else { rows.push([s]); i++ }
            }
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
                  {row.map((s, si) => {
                    const isCopied = copied === s.key
                    return (
                      <motion.div key={s.key}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: (ri * 2 + si) * 0.07 }}
                        style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      >
                        {/* Card header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `2px solid ${s.color}20`, background: `linear-gradient(135deg, ${s.color}08, #ffffff)` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, border: `1.5px solid ${s.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                              {s.icon}
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-0.01em' }}>{s.title}</span>
                          </div>
                          <button onClick={() => copy(safeStr(s.value), s.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: isCopied ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isCopied ? 'rgba(16,185,129,0.35)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 8, color: isCopied ? '#10b981' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            {isCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                          </button>
                        </div>
                        {/* Card body */}
                        <div style={{ padding: '20px 22px' }}>
                          {s.key === 'revenueProjection' ? (
                            <RevenueBars data={s.value} />
                          ) : s.key === 'growthOpportunities' ? (
                            <><ImpactBars data={s.value} /><ContentText value={s.value} /></>
                          ) : (s.key === 'gtmPlan' || s.key === 'expansionRoadmap') ? (
                            <><PhaseTimeline data={s.value} color={s.color} /><ContentText value={s.value} /></>
                          ) : (
                            <ContentText value={s.value} />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })()}

        {/* ── Ads Creation — multi-variant ad creative cards ── */}
        {isAdsCreation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
            {adStrategy && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}><Megaphone size={16} /></div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Creative Strategy</span>
                  </div>
                  <button onClick={() => copy(adStrategy, 'adStrategy')} style={copyBtnSmall(copied === 'adStrategy')}>{copied === 'adStrategy' ? <Check size={11} /> : <Copy size={11} />}</button>
                </div>
                <div style={{ padding: '16px 18px' }}><ContentText value={adStrategy} /></div>
              </motion.div>
            )}

            {staticAdVariants.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Static Ad Variants ({staticAdVariants.length})</span>
                </div>
                <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(staticAdVariants.length, 3)}, 1fr)`, gap: 12 }}>
                  {staticAdVariants.map((v, i) => (
                    <div key={i} style={{ border: '1px solid rgba(245,240,232,0.2)', borderRadius: 12, padding: 14, background: '#fafbff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', letterSpacing: '0.05em' }}>VARIANT {i + 1}</span>
                        <button onClick={() => copy(`${v.headline || ''}\n${v.primaryText || ''}\n${v.description || ''}\nCTA: ${v.cta || ''}`, `static${i}`)} style={copyBtnSmall(copied === `static${i}`)}>{copied === `static${i}` ? <Check size={11} /> : <Copy size={11} />}</button>
                      </div>
                      <FieldRow label="Headline" value={v.headline} />
                      <FieldRow label="Primary Text" value={v.primaryText} />
                      <FieldRow label="Description" value={v.description} />
                      <FieldRow label="CTA" value={v.cta} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {carouselAdVariant && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Carousel Ad</span>
                  <button onClick={() => copy(`${carouselAdVariant.headline || ''}\n${(carouselAdVariant.slides || []).map((s, i) => `Slide ${i + 1}: ${s.title || ''} — ${s.text || ''}`).join('\n')}\nCTA: ${carouselAdVariant.cta || ''}`, 'carousel')} style={copyBtnSmall(copied === 'carousel')}>{copied === 'carousel' ? <Check size={11} /> : <Copy size={11} />}</button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <FieldRow label="Headline" value={carouselAdVariant.headline} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {(carouselAdVariant.slides || []).map((s, i) => (
                      <div key={i} style={{ width: 160, border: '1px solid rgba(245,240,232,0.2)', borderRadius: 10, padding: 10, background: '#fafbff' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>SLIDE {i + 1}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.title}</p>
                        <p style={{ fontSize: 11, color: '#64748b' }}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                  <FieldRow label="CTA" value={carouselAdVariant.cta} />
                </div>
              </motion.div>
            )}

            {videoStillAdVariant && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Video / Reel Ad</span>
                  <button onClick={() => copy(`Hook: ${videoStillAdVariant.hook || ''}\n\nScript:\n${videoStillAdVariant.script || ''}\n\nCaption: ${videoStillAdVariant.caption || ''}\nCTA: ${videoStillAdVariant.cta || ''}`, 'videoAd')} style={copyBtnSmall(copied === 'videoAd')}>{copied === 'videoAd' ? <Check size={11} /> : <Copy size={11} />}</button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <FieldRow label="Hook (first 3 seconds)" value={videoStillAdVariant.hook} />
                  <FieldRow label="Script" value={videoStillAdVariant.script} />
                  <FieldRow label="Caption" value={videoStillAdVariant.caption} />
                  <FieldRow label="CTA" value={videoStillAdVariant.cta} />
                </div>
              </motion.div>
            )}

            {adHeadlineVariants.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Headline Variants</span>
                  <button onClick={() => copy(adHeadlineVariants.join('\n'), 'headlineVariants')} style={copyBtnSmall(copied === 'headlineVariants')}>{copied === 'headlineVariants' ? <Check size={11} /> : <Copy size={11} />}</button>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {adHeadlineVariants.map((h, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>{h}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {landingPageTips && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: '#fff', border: '1px solid rgba(245,240,232,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f0e8', background: '#fafbff' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Landing Page Tips</span>
                </div>
                <div style={{ padding: '16px 18px' }}><ContentText value={landingPageTips} /></div>
              </motion.div>
            )}
          </div>
        )}

        {/* Content Cards — hidden entirely for growth_strategy (pure strategy doc, no social posts needed) */}
        <div style={{ display: isStrategy ? 'none' : 'flex', flexDirection: 'column', gap: 14 }}>

          {!isStrategy && !isAdsCreation && <>
            {isEmailDrip ? (
              /* Email Drip — show all 5 emails */
              <>
                {email1Subject && (
                  <EmailCard emailSubject={email1Subject} emailBody={email1Body} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.05} {...editProps} />
                )}
                {email2Subject && (
                  <EmailCard emailSubject={email2Subject} emailBody={email2Body} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.08} {...editProps} />
                )}
                {email3Subject && (
                  <EmailCard emailSubject={email3Subject} emailBody={email3Body} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.11} {...editProps} />
                )}
                {email4Subject && (
                  <EmailCard emailSubject={email4Subject} emailBody={email4Body} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.14} {...editProps} />
                )}
                {email5Subject && (
                  <EmailCard emailSubject={email5Subject} emailBody={email5Body} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.17} {...editProps} />
                )}
              </>
            ) : (
              /* Other campaigns — show single email if present */
              (emailSubject || emailBody) && (
                <EmailCard emailSubject={emailSubject} emailBody={emailBody} editedContent={editedContent} setEditedContent={setEditedContent} copied={copied} copy={copy} delay={0.05} {...editProps} />
              )
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && linkedinPost && (
              <ResultCard icon={<Linkedin size={16} />} title="LinkedIn Post" color="#0a66c2" copyText={linkedinPost} copyId="linkedin" copied={copied} copy={copy} editKey="linkedinPost" editValue={editedContent.linkedinPost} delay={0.08} {...editProps}>
                <ContentText value={editedContent.linkedinPost || linkedinPost} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && facebookPost && (
              <ResultCard icon={<Facebook size={16} />} title="Facebook Post" color="#1877f2" copyText={facebookPost} copyId="facebook" copied={copied} copy={copy} editKey="facebookPost" editValue={editedContent.facebookPost} delay={0.11} {...editProps}>
                <ContentText value={editedContent.facebookPost || facebookPost} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && tiktokCaption && (
              <ResultCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>}
                title="TikTok Caption" color="#ff0050" copyText={tiktokCaption} copyId="tiktok" copied={copied} copy={copy} editKey="tiktokCaption" editValue={editedContent.tiktokCaption} delay={0.14} {...editProps}>
                <ContentText value={editedContent.tiktokCaption || tiktokCaption} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && whatsappMessage && (
              <ResultCard icon={<MessageSquare size={16} />} title="WhatsApp Message" color="#25d366" copyText={whatsappMessage} copyId="whatsapp" copied={copied} copy={copy} editKey="whatsappMessage" editValue={editedContent.whatsappMessage} delay={0.17} {...editProps}>
                <ContentText value={editedContent.whatsappMessage || whatsappMessage} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && instagramCaption && (
              <ResultCard icon={<Instagram size={16} />} title="Instagram Caption" color="#e1306c" copyText={instagramCaption} copyId="instagram" copied={copied} copy={copy} editKey="instagramCaption" editValue={editedContent.instagramCaption} delay={0.2} {...editProps}>
                <ContentText value={editedContent.instagramCaption || instagramCaption} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && smsMessage && (
              <ResultCard icon={<Phone size={16} />} title="SMS Message" color="#c8973e" copyText={smsMessage} copyId="sms" copied={copied} copy={copy} editKey="smsMessage" editValue={editedContent.smsMessage} delay={0.2} {...editProps}>
                <ContentText value={editedContent.smsMessage || smsMessage} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && positioningStatement && (
              <ResultCard icon={<Target size={16} />} title="Positioning Statement" color="#a855f7" copyText={positioningStatement} copyId="positioning" copied={copied} copy={copy} editKey="positioningStatement" editValue={editedContent.positioningStatement} delay={0.23} {...editProps}>
                <ContentText value={editedContent.positioningStatement || positioningStatement} />
              </ResultCard>
            )}

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && (seoTitle || seoDescription) && (
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

            {!isEmailDrip && !isInfluencer && !isAnalyticsReport && (adHeadline || adBody) && (
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
          </>}

          {/* ── Campaign Calendar (N-day) — hidden for free trial users on growth_strategy, email_drip, influencer, and analytics ── */}
          {!isEmailDrip && !isInfluencer && !isAnalyticsReport && !(isStrategy && isFreeUser) && (calendarDays.length > 0 || dailySchedule.length > 0) && (
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
                  <span style={{ fontSize: 12, color: '#64748b' }}>Posts automatically at your chosen time</span>
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

          {!emailSubject && !emailBody && !linkedinPost && !facebookPost && !tiktokCaption && !whatsappMessage && !smsMessage && !positioningStatement && !seoTitle && !adHeadline && calendarDays.length === 0 && !executiveSummary && !growthOpportunities && !gtmPlan && !revenueProjection && !partnershipIdeas && !expansionRoadmap && !competitorGaps && !adStrategy && staticAdVariants.length === 0 && !carouselAdVariant && !videoStillAdVariant && adHeadlineVariants.length === 0 && !landingPageTips && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 16 }}>
              <AlertCircle size={32} style={{ color: '#cbd5e1', marginBottom: 14 }} />
              <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 20 }}>No campaign content was generated. Please try again.</p>
              <button className="btn-primary" onClick={() => navigate(-1)} style={{ fontSize: 14 }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </motion.div>
          )}
        </div>

        {/* Google Ads launch panel — shown for non-strategy, non-email-drip, non-influencer, and non-analytics campaigns */}
        {!isStrategy && !isEmailDrip && !isInfluencer && !isAnalyticsReport && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ marginTop: 16, background: '#fff', border: '1px solid rgba(66,133,244,0.25)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #f0f4ff', background: '#f8faff' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#fbbc05" d="M5.6 30.3 15 14a4.5 4.5 0 0 1 7.8 4.5L13.4 34.8A4.5 4.5 0 0 1 5.6 30.3z"/>
                  <path fill="#34a853" d="M24 38.5h-9a4.5 4.5 0 0 1 0-9h18a4.5 4.5 0 0 1 0 9H24z"/>
                  <path fill="#ea4335" d="M33 14a4.5 4.5 0 0 0-7.8 4.5l9.4 16.3a4.5 4.5 0 1 0 7.8-4.5L33 14z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Launch on Google Ads</span>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Push this campaign as a Responsive Search Ad to your Google Ads account</p>
              </div>
              {googleAdsStatus === 'success' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                  <Check size={11} /> Live
                </span>
              )}
            </div>

            <div style={{ padding: '16px 20px' }}>
              {!googleAdsAccount ? (
                /* Not connected */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Connect your Google Ads account to push campaigns directly from EVOX.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={checkGoogleAdsAccount}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 10, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ↻ Refresh
                    </button>
                    <button
                      onClick={() => navigate('/connect-accounts')}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#4285f4', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Connect Google Ads
                    </button>
                  </div>
                </div>
              ) : googleAdsStatus === 'success' ? (
                /* Success */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: '0 0 2px' }}>Campaign created in Google Ads!</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      Campaign ID: <strong style={{ color: '#4285f4' }}>{googleAdsCampaignId}</strong> · Under review — goes live in 1–3 hours.
                    </p>
                  </div>
                </div>
              ) : googleAdsStatus === 'error' ? (
                /* Error */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{googleAdsError || 'Failed to create campaign. Please try again.'}</p>
                  </div>
                  <button
                    onClick={() => setGoogleAdsStatus('idle')}
                    style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                /* Ready to launch */
                (() => {
                  const { headlines, descriptions } = extractAdsContent(result, campaignType)
                  const metaRaw = sessionStorage.getItem('campaignMeta')
                  const meta = metaRaw ? (() => { try { return JSON.parse(metaRaw) } catch { return {} } })() : {}
                  return (
                    <div>
                      {/* Preview extracted content */}
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Ad Headlines (auto-extracted)</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {headlines.slice(0, 5).map((h, i) => (
                            <span key={i} style={{ padding: '4px 10px', background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: '#4285f4' }}>{h}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34a853' }} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>Connected: <strong style={{ color: '#0f172a' }}>{googleAdsAccount.email || 'Google Ads'}</strong></span>
                        </div>
                        <button
                          disabled={googleAdsStatus === 'loading'}
                          onClick={async () => {
                            setGoogleAdsStatus('loading')
                            setGoogleAdsError('')
                            try {
                              const user = authUser || profileToUser(getEvokeUserProfile())
                              const data = await createGoogleAdsCampaign(user.uid, {
                                name: meta.name || meta.brandName || 'EVOX Campaign',
                                headlines,
                                descriptions,
                                keywords: meta.keywords ? meta.keywords.split(',').map(k => k.trim()) : ['marketing', 'campaign'],
                                budget: 500,
                                finalUrl: meta.website || window.location.origin,
                              })
                              setGoogleAdsCampaignId(data.campaignId || data.id || 'created')
                              setGoogleAdsStatus('success')
                              // Track Google Ads launch in campaign history
                              try {
                                const campaigns = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]')
                                if (campaigns.length > 0) {
                                  campaigns[0].platforms = [...new Set([...(campaigns[0].platforms || []), 'google-ads'])]
                                  localStorage.setItem('evoke_campaigns', JSON.stringify(campaigns))
                                }
                              } catch {}
                            } catch (e) {
                              setGoogleAdsError(e.message)
                              setGoogleAdsStatus('error')
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: googleAdsStatus === 'loading' ? 'rgba(66,133,244,0.5)' : '#4285f4', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: googleAdsStatus === 'loading' ? 'not-allowed' : 'pointer' }}
                        >
                          {googleAdsStatus === 'loading'
                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                            : <>
                                <svg width="14" height="14" viewBox="0 0 48 48">
                                  <path fill="#fff" d="M5.6 30.3 15 14a4.5 4.5 0 0 1 7.8 4.5L13.4 34.8A4.5 4.5 0 0 1 5.6 30.3z" opacity="0.8"/>
                                  <path fill="#fff" d="M24 38.5h-9a4.5 4.5 0 0 1 0-9h18a4.5 4.5 0 0 1 0 9H24z"/>
                                  <path fill="#fff" d="M33 14a4.5 4.5 0 0 0-7.8 4.5l9.4 16.3a4.5 4.5 0 1 0 7.8-4.5L33 14z" opacity="0.8"/>
                                </svg>
                                Launch on Google Ads
                              </>
                          }
                        </button>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          </motion.div>
        )}

        {/* Bottom CTA — strategy fills the screen (no bottom CTA); campaigns get "Launch" */}
        {isStrategy ? null : (
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
