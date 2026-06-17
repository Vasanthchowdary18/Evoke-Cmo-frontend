import React, { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Users, DollarSign, Mail, ExternalLink } from 'lucide-react'

function fmt(d) {
  if (!d) return ''
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return d }
}

function fmtTime(t) {
  if (!t) return ''
  try {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  } catch { return t }
}

export default function EventViewPage() {
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) { setError(true); return }
      const data = JSON.parse(atob(hash))
      setEvent(data)
    } catch {
      setError(true)
    }
  }, [])

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0d0b08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f0ebe0', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Event Not Found</h1>
      <p style={{ color: '#64748b' }}>This event link may be invalid or expired.</p>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#0d0b08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#c8973e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const locations = Array.isArray(event.locations) && event.locations.length ? event.locations : event.location ? [event.location] : []
  const audience  = Array.isArray(event.targetAudience) ? event.targetAudience.join(', ') : event.targetAudience || ''
  const hasImage  = !!event.imageUrl

  const chips = [
    event.date    && { icon: Calendar,   label: 'Date',     val: fmt(event.date) + (event.endDate ? ` — ${fmt(event.endDate)}` : '') },
    event.time    && { icon: Clock,      label: 'Time',     val: fmtTime(event.time) },
    locations[0]  && { icon: MapPin,     label: 'Location', val: locations.join(' · ') },
    audience      && { icon: Users,      label: 'Audience', val: audience },
    event.price   && { icon: DollarSign, label: 'Price',    val: event.price },
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b08', color: '#f0ebe0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Hero */}
      <div style={{ position: 'relative', minHeight: hasImage ? 460 : 280, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Background */}
        {hasImage ? (
          <>
            <img src={event.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0b08 30%, rgba(13,11,8,0.4) 100%)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1208 0%, #0d0b08 60%)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: 'linear-gradient(to left, rgba(200,151,62,0.04), transparent)' }} />
          </div>
        )}

        {/* Gold top line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c8973e, transparent)' }} />

        {/* Nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1, color: '#c8973e' }}>EVOKE</span>
            <span style={{ fontSize: 10, background: 'rgba(200,151,62,0.15)', color: '#c8973e', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 5, padding: '2px 6px', fontWeight: 700 }}>CMO</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(240,235,224,0.3)' }}>Powered by EVOX AI</span>
        </div>

        {/* Title block */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 32px 40px' }}>
          {event.brandName && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#c8973e', textTransform: 'uppercase', marginBottom: 10 }}>{event.brandName}</div>
          )}
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, maxWidth: 760 }}>{event.name}</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Chips row */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 40 }}>
            {chips.map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 16px' }}>
                <Icon size={14} style={{ color: '#c8973e', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: hasImage ? '1fr 1fr' : '1fr', gap: 36, alignItems: 'start' }}>
          <div>
            {event.description && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>About this Event</h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{event.description}</p>
              </>
            )}

            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {event.registrationUrl ? (
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#c8973e', color: '#0d0b08', borderRadius: 12, fontWeight: 800, fontSize: 15 }}>
                  Register Now <ExternalLink size={14} />
                </a>
              ) : (
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#c8973e', color: '#0d0b08', borderRadius: 12, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                  Learn More
                </button>
              )}
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', background: 'rgba(255,255,255,0.05)', color: '#f0ebe0', borderRadius: 12, fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                📋 Copy Link
              </button>
            </div>

            {event.contactEmail && (
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                <Mail size={13} />
                <a href={`mailto:${event.contactEmail}`} style={{ color: '#c8973e' }}>{event.contactEmail}</a>
              </div>
            )}
          </div>

          {hasImage && (
            <img src={event.imageUrl} alt={event.name} style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#334155' }}>Event page created with</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#c8973e', letterSpacing: 0.5 }}>EVOX AI</span>
      </div>
    </div>
  )
}
