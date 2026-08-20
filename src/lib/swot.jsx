import React from 'react'

const QUADRANTS = [
  { key: 'strengths',     label: 'Strengths',     color: '#10b981' },
  { key: 'weaknesses',    label: 'Weaknesses',    color: '#ef4444' },
  { key: 'opportunities', label: 'Opportunities', color: '#3b82f6' },
  { key: 'threats',       label: 'Threats',       color: '#f59e0b' },
]

const HEADING_RE = /^#{0,3}\s*\**(strengths|weaknesses|opportunities|threats)\**\s*:?\s*$/i
const BULLET_RE  = /^[\s]*[-•*]|^\d+[.)]\s*/

/**
 * Best-effort parse of the freeform "SWOT: 2 bullets per quadrant" text the
 * AI agent returns into { strengths: [...], weaknesses: [...], ... }.
 * Returns null if nothing resembling a quadrant heading was found, so
 * callers can fall back to rendering the raw text instead.
 */
export function parseSwot(raw) {
  if (!raw || typeof raw !== 'string') return null
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const out = { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  let current = null
  let found = false

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE)
    if (headingMatch) {
      current = headingMatch[1].toLowerCase()
      found = true
      continue
    }
    if (!current) continue
    const text = line.replace(BULLET_RE, '').trim()
    if (text) out[current].push(text)
  }

  if (!found || Object.values(out).every(arr => arr.length === 0)) return null
  return out
}

export function SwotGrid({ swot, cardBg, border, textColor }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
      {QUADRANTS.map(q => (
        <div key={q.key} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.color }} />
            <span style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{q.label}</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(swot[q.key] || []).length === 0
              ? <li style={{ fontSize: 12, color: textColor }}>—</li>
              : swot[q.key].map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: textColor, lineHeight: 1.5, display: 'flex', gap: 8 }}>
                  <span style={{ color: q.color, flexShrink: 0 }}>•</span>{item}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function timeAgo(ts) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null
  if (!d || isNaN(d.getTime())) return ''
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
