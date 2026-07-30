import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getContentItems } from '../services/contentService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toDate(scheduledAt) {
  if (!scheduledAt) return null
  if (scheduledAt.seconds) return new Date(scheduledAt.seconds * 1000)
  const d = new Date(scheduledAt)
  return isNaN(d.getTime()) ? null : d
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function SocialCalendarPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getContentItems(user.uid).then(setItems).catch(() => setItems([]))
  }, [user?.uid])

  const scheduledByDay = useMemo(() => {
    const map = {}
    ;(items || []).forEach(it => {
      const d = toDate(it.scheduledAt)
      if (!d || d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) return
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push({ ...it, _date: d })
    })
    return map
  }, [items, cursor])

  const weeks = buildMonthGrid(cursor.year, cursor.month)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const selectedDate = new Date(cursor.year, cursor.month, selectedDay)
  const selectedItems = (scheduledByDay[selectedDay] || []).sort((a, b) => a._date - b._date)

  const changeMonth = (delta) => {
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
    setSelectedDay(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Social Calendar Studio"
          subtitle="Workspace: Editorial and Dispatch Ingestion Layout"
          pillLabel={items === null ? 'Loading…' : `${items.filter(i => toDate(i.scheduledAt)).length} Posts Scheduled`}
          action={{ label: 'Schedule Post', icon: <CalendarClock size={13} />, onClick: () => navigate('/queue') }}
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ── Calendar ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{monthLabel}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => changeMonth(-1)} style={navBtn}><ChevronLeft size={14} /></button>
                <button onClick={() => changeMonth(1)} style={navBtn}><ChevronRight size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 8 }}>
              {WEEKDAYS.map(w => <div key={w} style={{ fontSize: 11, color: TEXT3, textAlign: 'center', fontWeight: 600 }}>{w}</div>)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} />
                    const count = (scheduledByDay[day] || []).length
                    const isSelected = day === selectedDay
                    const isToday = cursor.year === today.getFullYear() && cursor.month === today.getMonth() && day === today.getDate()
                    return (
                      <div
                        key={di} onClick={() => setSelectedDay(day)}
                        style={{
                          minHeight: 56, borderRadius: 8, padding: 6, cursor: 'pointer', boxSizing: 'border-box',
                          background: isSelected ? GDIM : CARD2,
                          border: `1px solid ${isSelected ? GBORD : isToday ? 'rgba(200,151,62,0.3)' : BORDER}`,
                        }}
                      >
                        <div style={{ fontSize: 11, color: isSelected ? GOLD : '#fff', fontWeight: isToday ? 800 : 500 }}>{day}</div>
                        {count > 0 && (
                          <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, color: GOLD, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 100, padding: '1px 6px', display: 'inline-block' }}>{count}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Selected Day Details ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 4 }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: 12, color: TEXT2, marginBottom: 16 }}>
              {items === null ? 'Loading…' : selectedItems.length === 0 ? 'No posts queued for this day.' : `${selectedItems.length} post${selectedItems.length > 1 ? 's' : ''} queued for automated dispatch`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedItems.map(it => (
                <div key={it.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'capitalize' }}>{it.platform || 'General'}</span>
                    <span style={{ fontSize: 10, color: TEXT3 }}>{it._date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {it.text || '(no caption)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const navBtn = {
  width: 28, height: 28, borderRadius: 6, background: CARD2, border: `1px solid ${BORDER}`,
  color: TEXT2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
