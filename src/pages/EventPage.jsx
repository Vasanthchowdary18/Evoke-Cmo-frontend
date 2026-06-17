import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEventPage } from '../services/eventService'
import { Calendar, Clock, MapPin, Link, Users, ExternalLink } from 'lucide-react'

function fmt(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return dateStr }
}

function fmtTime(t) {
  if (!t) return ''
  try {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return t }
}

export default function EventPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getEventPage(slug)
      .then(data => {
        if (data) setEvent(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#c8973e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#f1f5f9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Event Not Found</h1>
      <p style={{ color: '#64748b', fontSize: 15 }}>This event page may have been removed or the link is incorrect.</p>
    </div>
  )

  const locations = event.locations || (event.location ? [event.location] : [])
  const hasImage = !!event.imageUrl

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* Hero */}
      <div style={{
        position: 'relative', minHeight: hasImage ? 420 : 260,
        background: hasImage ? 'none' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        overflow: 'hidden',
      }}>
        {hasImage && (
          <>
            <img src={event.imageUrl} alt={event.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.3) 100%)' }} />
          </>
        )}

        {/* Nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1, color: '#c8973e' }}>EVOKE</span>
            <span style={{ fontSize: 11, background: 'rgba(200,151,62,0.2)', color: '#c8973e', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>CMO</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Powered by EVOX AI</span>
        </div>

        {/* Title */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 32px 40px' }}>
          {event.brandName && (
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#c8973e', textTransform: 'uppercase', marginBottom: 10 }}>
              {event.brandName}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, maxWidth: 720 }}>
            {event.name}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Key details bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 36 }}>
          {event.date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px' }}>
              <Calendar size={15} style={{ color: '#c8973e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(event.date)}{event.endDate && ` — ${fmt(event.endDate)}`}</div>
              </div>
            </div>
          )}
          {event.time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px' }}>
              <Clock size={15} style={{ color: '#c8973e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtTime(event.time)}</div>
              </div>
            </div>
          )}
          {locations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px' }}>
              <MapPin size={15} style={{ color: '#c8973e', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</div>
                {locations.map((l, i) => <div key={i} style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>)}
              </div>
            </div>
          )}
          {event.targetAudience?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px' }}>
              <Users size={15} style={{ color: '#c8973e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Audience</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{Array.isArray(event.targetAudience) ? event.targetAudience.join(', ') : event.targetAudience}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: hasImage ? '1fr 1fr' : '1fr', gap: 32, alignItems: 'start' }}>
          {/* Description */}
          <div>
            {event.description && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: '#f1f5f9' }}>About this Event</h2>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{event.description}</p>
              </>
            )}

            {/* CTA */}
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {event.registrationUrl ? (
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#c8973e', color: '#0f172a', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                  Register Now <ExternalLink size={14} />
                </a>
              ) : (
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#c8973e', color: '#0f172a', borderRadius: 12, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                  Learn More
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', borderRadius: 12, fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                <Link size={13} /> Copy Link
              </button>
            </div>
          </div>

          {/* Event image */}
          {hasImage && (
            <div>
              <img src={event.imageUrl} alt={event.name} style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#334155' }}>Event page created with</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#c8973e', letterSpacing: 0.5 }}>EVOX AI</span>
      </div>
    </div>
  )
}
