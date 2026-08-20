import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, ChevronDown, Upload, ExternalLink, X } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import EventBannerGenerator from '../components/EventBannerGenerator.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'
const GREEN  = '#10b981'

// Same categories as the existing campaign-type grid (CampaignHub.jsx),
// surfaced here as the wizard's "Campaign Type" field per Figma's layout.
const CAMPAIGN_TYPES = [
  { value: 'event',             label: 'Event Campaign' },
  { value: 'product',           label: 'Product Campaign' },
  { value: 'brand',             label: 'Brand Campaign' },
  { value: 'growth_strategy',   label: 'Growth Strategy' },
  { value: 'content_calendar',  label: 'Content Calendar' },
  { value: 'email_drip',        label: 'Email Drip Campaign' },
  { value: 'influencer',        label: 'Influencer & PR' },
  { value: 'seo_blog',          label: 'SEO & Blog Post' },
  { value: 'analytics_report',  label: 'Analytics Report' },
  { value: 'sales_enablement',  label: 'Sales Enablement' },
  { value: 'marketplace',       label: 'Marketplace Growth' },
  { value: 'funnel_cro',        label: 'Funnel & CRO Audit' },
]

// Real goalType values CampaignForm.jsx's prefill already understands.
const OBJECTIVES = [
  'Increase Brand Awareness', 'Generate Leads', 'Drive Sales / Conversions',
  'Grow Community / Following', 'Build Brand Authority', 'Launch New Product / Event',
  'Re-engage Existing Customers', 'Boost Website Traffic',
]

const AUDIENCE_PROFILES = [
  'Gen Z (18-24)', 'Millennials (25-40)', 'Gen X (41-56)',
  'Professionals / B2B', 'C-Suite / Executives', 'Founders & CEOs',
  'HNW / Luxury Buyers', 'E-commerce Shoppers',
]

const CHANNELS = [
  { key: 'meta_ads',   label: 'Meta Ads' },
  { key: 'google_ads', label: 'Google Ads' },
  { key: 'linkedin',   label: 'LinkedIn Network' },
  { key: 'tiktok',     label: 'TikTok Ingest' },
  { key: 'email',      label: 'Dedicated Email' },
  { key: 'sms',        label: 'SMS Stream' },
]

// Fields that actually matter per campaign type — shown right after Campaign
// Type is picked, so the relevant details are captured before handoff.
const TYPE_FIELDS = {
  event: [
    { key: 'eventDate', label: 'Event Date',                    type: 'date' },
    { key: 'eventUrl',  label: 'Event URL / Registration Link', type: 'text', placeholder: 'https://...' },
  ],
  product: [
    { key: 'price',    label: 'Price',                type: 'text', placeholder: '$49.99' },
    { key: 'website',  label: 'Product / Store URL',   type: 'text', placeholder: 'https://...' },
    { key: 'imageUrl', label: 'Product Image URL',     type: 'text', placeholder: 'https://...' },
  ],
  brand: [
    { key: 'website',     label: 'Website',            type: 'text', placeholder: 'https://...' },
    { key: 'description', label: 'Brand Description',  type: 'textarea', placeholder: 'What does your brand do, and who is it for?' },
  ],
}
const DEFAULT_TYPE_FIELDS = [
  { key: 'website',     label: 'Website (optional)',     type: 'text', placeholder: 'https://...' },
  { key: 'description', label: 'Additional context',     type: 'textarea', placeholder: 'Anything the AI CMO should know before generating this...' },
]

const STEPS = [
  { n: 1, label: 'Campaign Setup' },
  { n: 2, label: 'AI Creative Draft' },
  { n: 3, label: 'Audit & Compliance' },
  { n: 4, label: 'Deploy Launch' },
]

export default function NewCampaignWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()
  const incomingPrefill = location.state?.prefill || {}

  const [brandKb, setBrandKb] = useState(null)
  const [name, setName]         = useState(incomingPrefill.name || '')
  const [type, setType]         = useState(incomingPrefill.type || 'brand')
  const [objective, setObjective] = useState('Increase Brand Awareness')
  const [audience, setAudience]   = useState(AUDIENCE_PROFILES[0])
  const [budget, setBudget]       = useState(10000)
  const [channels, setChannels]   = useState(['meta_ads', 'google_ads', 'linkedin'])
  const [details, setDetails]     = useState({})
  const [error, setError]         = useState('')
  // Seeded from a handed-off AI-generated image (e.g. Image Generator's
  // "Use in Campaign") — same File/preview shape EventUploadDropzone expects.
  const [posterFile, setPosterFile]       = useState(incomingPrefill.imageFile || null)
  const [posterPreview, setPosterPreview] = useState(incomingPrefill.imagePreview || null)

  const setDetail = (key, value) => setDetails(d => ({ ...d, [key]: value }))
  const typeFields = TYPE_FIELDS[type] || DEFAULT_TYPE_FIELDS

  const handlePosterFile = (file) => {
    if (!file) return
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  // EventBannerGenerator hands back a canvas-rendered image URL — convert it
  // to a real File so it carries through to the next screen's upload slot.
  const handleBannerGenerated = (banner) => {
    if (!banner?.imageUrl) return
    fetch(banner.imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'event-poster.png', { type: 'image/png' })
        setPosterFile(file)
        setPosterPreview(banner.imageUrl)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => { if (data) setBrandKb(data) }).catch(() => {})
  }, [user?.uid])

  const toggleChannel = (key) => {
    setChannels(cs => cs.includes(key) ? cs.filter(c => c !== key) : [...cs, key])
  }

  const handleNext = () => {
    if (!name.trim()) return setError('Give your campaign a name first.')
    setError('')
    const channelLabels = CHANNELS.filter(c => channels.includes(c.key)).map(c => c.label).join(', ')
    const contextNote = [
      `Budget allocation: $${budget.toLocaleString()}.`,
      `Priority channels: ${channelLabels || 'none selected'}.`,
      details.imageUrl && `Reference image: ${details.imageUrl}`,
      details.description,
    ].filter(Boolean).join(' ')

    navigate(`/campaign/${type}`, {
      state: {
        prefill: {
          name,
          goalType: objective,
          targetAudience: [audience],
          website: details.website || '',
          date: details.eventDate || '',
          eventUrl: details.eventUrl || '',
          price: details.price || '',
          description: contextNote,
          imageFile: posterFile,
          imagePreview: posterPreview,
        },
      },
    })
  }

  const brandName = brandKb?.brandName || brandKb?.companyName
  const advisorInsight = brandKb
    ? `${brandName || 'Your brand'}'s profile lists ${Array.isArray(brandKb.tone) ? brandKb.tone[0] : brandKb.tone || 'your'} tone for ${Array.isArray(brandKb.audience) ? brandKb.audience[0] : brandKb.audience || 'this audience'} — keep creative drafts aligned to that in the next step.`
    : 'Complete your Brand Profile to get personalized strategy insights here on future campaigns.'

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="New Campaign Wizard"
          subtitle="Setup brand params and deploy autonomous strategy sequences."
        />

        <div style={{ padding: 40, maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Stepper ── */}
          <div style={{ display: 'flex', alignItems: 'center', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 28px' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.n === 1 ? GOLD : 'transparent', border: `1.5px solid ${s.n === 1 ? GOLD : BORDER}`,
                    color: s.n === 1 ? '#0A0A0F' : TEXT2, fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: s.n === 1 ? 700 : 500, color: s.n === 1 ? '#fff' : TEXT2, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: BORDER, margin: '0 20px' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* ── Main two-column layout ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

            {/* ── LEFT: Campaign Configuration ── */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Campaign Configuration</div>

              <Field label="Campaign Name">
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Autumn Collection 2026 Drive"
                  style={inputStyle}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Campaign Type">
                  <Select value={type} onChange={setType} options={CAMPAIGN_TYPES.map(c => ({ value: c.value, label: c.label }))} />
                </Field>
                <Field label="Target Audience Profile">
                  <Select value={audience} onChange={setAudience} options={AUDIENCE_PROFILES.map(a => ({ value: a, label: a }))} />
                </Field>
              </div>

              {/* ── Fields specific to the selected Campaign Type ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {CAMPAIGN_TYPES.find(c => c.value === type)?.label} Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {typeFields.map(f => (
                    <Field key={f.key} label={f.label}>
                      {f.type === 'textarea' ? (
                        <textarea
                          value={details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)}
                          placeholder={f.placeholder} rows={2}
                          style={{ ...inputStyle, resize: 'vertical', gridColumn: '1 / -1' }}
                        />
                      ) : (
                        <input
                          type={f.type} value={details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)}
                          placeholder={f.placeholder} style={{ ...inputStyle, colorScheme: f.type === 'date' ? 'dark' : 'normal' }}
                        />
                      )}
                    </Field>
                  ))}
                </div>

                {type === 'event' && (
                  <Field label="Event Image">
                    <EventBannerGenerator
                      eventData={{
                        name,
                        date: details.eventDate || '',
                        time: '',
                        location: '',
                        tagline: (details.description || '').slice(0, 80),
                        brandName: brandName || '',
                        eventUrl: details.eventUrl || '',
                      }}
                      onBannerGenerated={handleBannerGenerated}
                      disabled={!name.trim()}
                    />
                    <EventUploadDropzone file={posterFile} preview={posterPreview} onSelect={handlePosterFile} onRemove={() => { setPosterFile(null); setPosterPreview(null) }} />
                  </Field>
                )}
              </div>

              <Field label="Campaign Objective">
                <Select value={objective} onChange={setObjective} options={OBJECTIVES.map(o => ({ value: o, label: o }))} />
              </Field>

              <Field label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Budget Allocation</span><span style={{ color: GOLD, fontWeight: 700 }}>${budget.toLocaleString()}</span></div>}>
                <input
                  type="range" min={1000} max={100000} step={1000}
                  value={budget} onChange={e => setBudget(Number(e.target.value))}
                  style={{ width: '100%', accentColor: GOLD }}
                />
              </Field>

              <Field label="Target Channels">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {CHANNELS.map(c => {
                    const active = channels.includes(c.key)
                    return (
                      <button key={c.key} onClick={() => toggleChannel(c.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: active ? GDIM : 'transparent', border: `1px solid ${active ? GBORD : BORDER}`,
                        borderRadius: 8, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif",
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${active ? GOLD : TEXT2}`, background: active ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {active && <Check size={10} color="#0A0A0F" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 12, color: active ? '#fff' : TEXT2, whiteSpace: 'nowrap' }}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>

              {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={() => navigate('/campaigns')} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif" }}>
                  Back
                </button>
                <button onClick={handleNext} style={{ padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif" }}>
                  Next: AI Strategy Craft
                </button>
              </div>
            </div>

            {/* ── RIGHT: Evoke Strategy Advisor ── */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Evoke Strategy Advisor</div>

              <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{brandKb ? 'Brand Profile Insight' : 'Getting Started'}</span>
                </div>
                <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>{advisorInsight}</div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Compliance Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ChecklistItem text="Brand voice & tone guidelines will apply to generated copy" />
                <ChecklistItem text="Creative assets will be sized for your selected channels" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#1a1a24', border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: "'Geist','Inter',sans-serif", outline: 'none',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif" }}>{label}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: 32, colorScheme: 'dark' }}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a24' }}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} color={TEXT2} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

// Matches CampaignForm.jsx's event-image dropzone exactly, so the same
// upload UI you already know carries straight into this earlier step.
function EventUploadDropzone({ file, preview, onSelect, onRemove }) {
  const inputId = 'wizard-event-image-input'
  return (
    <div
      style={{
        border: `2px dashed ${file ? 'rgba(124,58,237,0.5)' : 'rgba(245,240,232,0.15)'}`,
        borderRadius: 14, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
        color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10,
        background: file ? 'rgba(124,58,237,0.04)' : 'transparent', transition: 'all 0.2s',
      }}
      onClick={() => document.getElementById(inputId).click()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) onSelect(f) }}
      onDragOver={(e) => e.preventDefault()}
    >
      {preview ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={preview} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: `1px solid ${GBORD}` }} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>{file?.name || 'event-poster.png'}</div>
            {file && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · Click to change</div>}
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <a href={preview} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none' }}>
                <ExternalLink size={12} /> View
              </a>
              <button onClick={(e) => { e.stopPropagation(); onRemove() }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Upload size={22} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 6 }} />
          <div>Drag &amp; drop or <span style={{ color: GOLD }}>click to upload</span></div>
          <div style={{ fontSize: 11, marginTop: 4 }}>PNG, JPG, WEBP - max 10MB</div>
        </>
      )}
      <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; if (f) onSelect(f) }} />
    </div>
  )
}

function ChecklistItem({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Check size={13} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}
