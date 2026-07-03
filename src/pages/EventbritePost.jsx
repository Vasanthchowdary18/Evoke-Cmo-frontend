import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Ticket, Globe, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser } from '../services/userService'

const BG    = '#0e0c09'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const EB    = '#F05537'

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Pacific/Auckland',
  'UTC',
]

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'SGD', 'AED']

function localToUtc(datetimeLocal) {
  if (!datetimeLocal) return ''
  return new Date(datetimeLocal).toISOString().replace('.000', '')
}

function minorUnits(currency) {
  // These currencies use 0 decimal places
  const zero = ['JPY', 'KRW', 'VND']
  return zero.includes(currency) ? 1 : 100
}

const EVENTBRITE_API = import.meta.env.DEV
  ? '/api/eventbrite'
  : '/api/eventbrite'

async function ebCall(action, params) {
  const res = await fetch(EVENTBRITE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error_description || data.error || `API error ${res.status}`)
  return data
}

export default function EventbritePost() {
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [account, setAccount]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // Form state
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [eventType, setEventType] = useState('in_person') // 'in_person' | 'online'
  const [venueName, setVenueName] = useState('')
  const [address1, setAddress1] = useState('')
  const [city, setCity]         = useState('')
  const [region, setRegion]     = useState('')
  const [country, setCountry]   = useState('IN')
  const [postal, setPostal]     = useState('')
  const [startDt, setStartDt]   = useState('')
  const [endDt, setEndDt]       = useState('')
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  )
  const [ticketType, setTicketType] = useState('free') // 'free' | 'paid'
  const [ticketName, setTicketName] = useState('General Admission')
  const [price, setPrice]       = useState('')
  const [currency, setCurrency] = useState('INR')
  const [capacity, setCapacity] = useState('')
  const [publish, setPublish]   = useState(true)

  // Submission state
  const [step, setStep]         = useState('') // '' | 'venue' | 'event' | 'ticket' | 'publish' | 'done'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null) // { eventId, eventUrl }

  useEffect(() => {
    if (!user) return
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(data => {
        const eb = data.socialAccounts?.eventbrite
        if (eb?.connected && eb?.accessToken) {
          setAccount(eb)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const validate = () => {
    if (!name.trim()) return 'Event name is required.'
    if (!startDt) return 'Start date & time is required.'
    if (!endDt) return 'End date & time is required.'
    if (new Date(endDt) <= new Date(startDt)) return 'End time must be after start time.'
    if (eventType === 'in_person') {
      if (!venueName.trim()) return 'Venue name is required for in-person events.'
      if (!city.trim()) return 'City is required.'
    }
    if (ticketType === 'paid' && (!price || Number(price) <= 0)) return 'Enter a valid ticket price.'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    try {
      let venueId = null

      // Step 1: Create venue (in-person only)
      if (eventType === 'in_person') {
        setStep('venue')
        const venueData = await ebCall('create_venue', {
          accessToken: account.accessToken,
          organizationId: account.organizationId,
          venue: {
            name: venueName.trim(),
            address: {
              address_1: address1.trim(),
              city: city.trim(),
              region: region.trim(),
              postal_code: postal.trim(),
              country,
            },
          },
        })
        venueId = venueData.id
      }

      // Step 2: Create event
      setStep('event')
      const eventPayload = {
        name: { html: name.trim() },
        description: { html: desc.trim() ? `<p>${desc.trim().replace(/\n/g, '</p><p>')}</p>` : '' },
        start: { timezone, utc: localToUtc(startDt) },
        end:   { timezone, utc: localToUtc(endDt) },
        currency,
        online_event: eventType === 'online',
        listed: true,
        shareable: true,
        ...(venueId ? { venue_id: venueId } : {}),
      }

      const eventData = await ebCall('create_event', {
        accessToken: account.accessToken,
        organizationId: account.organizationId,
        event: eventPayload,
      })
      const eventId  = eventData.id
      const eventUrl = eventData.url

      // Step 3: Create ticket class
      setStep('ticket')
      const tcPayload =
        ticketType === 'free'
          ? { name: ticketName.trim(), free: true, quantity_total: capacity ? Number(capacity) : 0 }
          : {
              name: ticketName.trim(),
              free: false,
              cost: `${currency},${Math.round(Number(price) * minorUnits(currency))}`,
              quantity_total: capacity ? Number(capacity) : 100,
            }

      await ebCall('create_ticket', {
        accessToken: account.accessToken,
        eventId,
        ticketClass: tcPayload,
      })

      // Step 4: Publish (optional)
      if (publish) {
        setStep('publish')
        await ebCall('publish_event', {
          accessToken: account.accessToken,
          eventId,
        })
      }

      setStep('done')
      setResult({ eventId, eventUrl })
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: TEXT,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

  const sectionStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '20px 22px',
    marginBottom: 16,
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color={EB} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!account) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,85,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={26} color={EB} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: TEXT, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Eventbrite not connected</div>
            <div style={{ color: TEXT2, fontSize: 14, maxWidth: 320 }}>Connect your Eventbrite account first to post events.</div>
          </div>
          <button
            onClick={() => navigate('/connect-accounts')}
            style={{ padding: '12px 28px', background: EB, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Connect Eventbrite
          </button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24 }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={36} color="#10b981" />
            </div>
            <div style={{ color: TEXT, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              {publish ? 'Event Published!' : 'Event Saved as Draft!'}
            </div>
            <div style={{ color: TEXT2, fontSize: 15, marginBottom: 28 }}>
              {account.organizationName ? `Posted to ${account.organizationName}` : 'Your Eventbrite event is ready.'}
            </div>
            {result.eventUrl && (
              <a
                href={result.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', background: EB, borderRadius: 12,
                  color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 16,
                }}
              >
                <ExternalLink size={16} /> View on Eventbrite
              </a>
            )}
            <br />
            <button
              onClick={() => { setResult(null); setStep(''); setName(''); setDesc(''); setStartDt(''); setEndDt(''); }}
              style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 10, color: TEXT2, fontSize: 13, padding: '10px 20px', cursor: 'pointer', marginTop: 8 }}
            >
              Post Another Event
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      <Navbar />
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        select option { background: #1a1714; }
        input::placeholder, textarea::placeholder { color: rgba(240,235,224,0.25); }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: TEXT2, display: 'flex' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(240,85,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={EB}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H7.5v-2h9v2zm0-4H7.5v-2h9v2zm0-4H7.5V6h9v2z"/>
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800 }}>Post Event to Eventbrite</span>
            </div>
            {account.organizationName && (
              <div style={{ color: TEXT2, fontSize: 13, marginTop: 2, paddingLeft: 42 }}>
                {account.organizationName}
              </div>
            )}
          </div>
        </div>

        {/* Event basics */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Calendar size={16} color={EB} />
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Event Details</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Event Name *</label>
            <input
              type="text"
              placeholder="e.g. Annual Marketing Summit 2025"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              placeholder="Tell attendees what to expect…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Calendar size={16} color={EB} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Date & Time</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Start *</label>
              <input type="datetime-local" value={startDt} onChange={e => setStartDt(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End *</label>
              <input type="datetime-local" value={endDt} onChange={e => setEndDt(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        {/* Location */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <MapPin size={16} color={EB} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Location</span>
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {['in_person', 'online'].map(t => (
              <button
                key={t}
                onClick={() => setEventType(t)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: eventType === t ? `rgba(240,85,55,0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${eventType === t ? 'rgba(240,85,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, color: eventType === t ? EB : TEXT2,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {t === 'in_person' ? <><MapPin size={14} /> In Person</> : <><Globe size={14} /> Online</>}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {eventType === 'in_person' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Venue Name *</label>
                  <input type="text" placeholder="e.g. The Grand Ballroom" value={venueName} onChange={e => setVenueName(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Street Address</label>
                  <input type="text" placeholder="123 Main Street" value={address1} onChange={e => setAddress1(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input type="text" placeholder="Mumbai" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>State / Region</label>
                    <input type="text" placeholder="Maharashtra" value={region} onChange={e => setRegion(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Postal Code</label>
                    <input type="text" placeholder="400001" value={postal} onChange={e => setPostal(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Country Code</label>
                    <input type="text" placeholder="IN" maxLength={2} value={country} onChange={e => setCountry(e.target.value.toUpperCase())} style={inputStyle} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tickets */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Ticket size={16} color={EB} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Tickets</span>
          </div>

          {/* Free / Paid */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['free', 'paid'].map(t => (
              <button
                key={t}
                onClick={() => setTicketType(t)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: ticketType === t ? `rgba(240,85,55,0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${ticketType === t ? 'rgba(240,85,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, color: ticketType === t ? EB : TEXT2,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Ticket Name</label>
            <input type="text" value={ticketName} onChange={e => setTicketName(e.target.value)} style={inputStyle} />
          </div>

          <AnimatePresence>
            {ticketType === 'paid' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Price *</label>
                    <input type="number" min="1" placeholder="500" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={labelStyle}>Total Capacity <span style={{ color: TEXT3, fontWeight: 400, textTransform: 'none' }}>(leave blank for unlimited)</span></label>
            <input type="number" min="1" placeholder="100" value={capacity} onChange={e => setCapacity(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Publish option */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Publish immediately</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>Turn off to save as a draft instead</div>
          </div>
          <button
            onClick={() => setPublish(p => !p)}
            style={{
              width: 46, height: 26, borderRadius: 13,
              background: publish ? EB : 'rgba(255,255,255,0.12)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: publish ? 23 : 3, transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Progress steps while submitting */}
        <AnimatePresence>
          {submitting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(240,85,55,0.08)', border: '1px solid rgba(240,85,55,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}
            >
              {[
                eventType === 'in_person' && { id: 'venue', label: 'Creating venue…' },
                { id: 'event', label: 'Creating event…' },
                { id: 'ticket', label: 'Adding ticket class…' },
                publish && { id: 'publish', label: 'Publishing event…' },
              ].filter(Boolean).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  {step === s.id
                    ? <Loader2 size={14} color={EB} style={{ animation: 'spin 1s linear infinite' }} />
                    : ['venue','event','ticket','publish'].indexOf(step) > ['venue','event','ticket','publish'].indexOf(s.id)
                      ? <CheckCircle2 size={14} color="#10b981" />
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                  }
                  <span style={{ fontSize: 13, color: step === s.id ? EB : TEXT2 }}>{s.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}
            >
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px 0',
            background: submitting ? 'rgba(240,85,55,0.4)' : EB,
            border: 'none', borderRadius: 14,
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.2s',
          }}
        >
          {submitting
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Working…</>
            : publish ? 'Publish Event on Eventbrite' : 'Save Event as Draft'
          }
        </button>
      </div>
    </div>
  )
}
