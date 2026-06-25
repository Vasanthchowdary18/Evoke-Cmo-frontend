import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Target, Palette, Rocket, ChevronRight, ChevronLeft,
  Check, Loader2, Zap, Globe, Users, DollarSign, Megaphone,
  Sparkles, AlertCircle, RefreshCw, BookOpen,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase, saveKnowledgeBase } from '../services/knowledgeBaseService.js'

/* ── Design tokens ── */
const BG      = '#0e0c09'
const GOLD    = '#c8973e'
const GBORDER = 'rgba(200,151,62,0.28)'
const CARD    = '#1c1a13'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'
const INPUT_BG = '#141210'

const goldGrad = {
  background: 'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}

/* ── Steps config ── */
const STEPS = [
  {
    id: 'business',
    icon: <Building2 size={20} />,
    title: 'Business Identity',
    subtitle: 'Tell us who you are and what you offer',
    color: '#c8973e',
  },
  {
    id: 'market',
    icon: <Target size={20} />,
    title: 'Market Intelligence',
    subtitle: 'Your audience and competitive landscape',
    color: '#6366f1',
  },
  {
    id: 'brand',
    icon: <Palette size={20} />,
    title: 'Brand Identity',
    subtitle: 'Your look, feel and voice',
    color: '#ec4899',
  },
  {
    id: 'goals',
    icon: <Rocket size={20} />,
    title: 'Business Goals',
    subtitle: 'What success looks like for you',
    color: '#10b981',
  },
]

const INDUSTRY_OPTIONS = [
  { value: 'digital_marketing', label: 'Digital Marketing' },
  { value: 'tech_saas',         label: 'Tech / SaaS' },
  { value: 'ecommerce',         label: 'E-Commerce / Retail' },
  { value: 'fashion',           label: 'Fashion & Lifestyle' },
  { value: 'food_beverage',     label: 'Food & Beverage' },
  { value: 'health_wellness',   label: 'Health & Wellness' },
  { value: 'finance_fintech',   label: 'Finance / Fintech' },
  { value: 'education',         label: 'Education / EdTech' },
  { value: 'real_estate',       label: 'Real Estate' },
  { value: 'media_entertainment',label: 'Media & Entertainment' },
  { value: 'hospitality',       label: 'Hospitality & Travel' },
  { value: 'beauty',            label: 'Beauty & Personal Care' },
  { value: 'automotive',        label: 'Automotive' },
  { value: 'ngo_nonprofit',     label: 'NGO / Non-Profit' },
  { value: 'agency',            label: 'Agency / Consulting' },
  { value: 'other',             label: 'Other' },
]

const PRICING_OPTIONS = [
  { value: 'free',           label: 'Free / Freemium' },
  { value: 'under_1k',       label: 'Under ₹1,000' },
  { value: '1k_5k',          label: '₹1,000 – ₹5,000' },
  { value: '5k_15k',         label: '₹5,000 – ₹15,000' },
  { value: '15k_50k',        label: '₹15,000 – ₹50,000' },
  { value: '50k_150k',       label: '₹50,000 – ₹1.5L' },
  { value: 'above_150k',     label: 'Above ₹1.5L' },
  { value: 'custom',         label: 'Custom / Enterprise' },
]

const GEO_OPTIONS = [
  { value: 'india_tier1',     label: 'India — Tier 1 Cities' },
  { value: 'india_tier1_2',   label: 'India — Tier 1 & 2' },
  { value: 'india_all',       label: 'India — All Cities' },
  { value: 'uae',             label: 'UAE / Gulf (GCC)' },
  { value: 'southeast_asia',  label: 'Southeast Asia' },
  { value: 'middle_east',     label: 'Middle East (MENA)' },
  { value: 'usa',             label: 'USA' },
  { value: 'europe',          label: 'Europe' },
  { value: 'uk',              label: 'UK' },
  { value: 'australia',       label: 'Australia' },
  { value: 'global',          label: 'Global' },
  { value: 'other',           label: 'Other' },
]

const AUDIENCE_TYPE_OPTIONS = [
  { value: 'b2c',  label: 'B2C — Selling to Consumers' },
  { value: 'b2b',  label: 'B2B — Selling to Businesses' },
  { value: 'both', label: 'Both B2B & B2C' },
  { value: 'd2c',  label: 'D2C — Direct to Consumer' },
]

const AGE_RANGE_OPTIONS = [
  { value: '13_17',   label: '13 – 17 (Gen Z teens)' },
  { value: '18_24',   label: '18 – 24 (Gen Z)' },
  { value: '25_34',   label: '25 – 34 (Millennials)' },
  { value: '35_44',   label: '35 – 44 (Older Millennials)' },
  { value: '45_54',   label: '45 – 54 (Gen X)' },
  { value: '55_plus', label: '55+ (Boomers)' },
  { value: 'all',     label: 'All Ages' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', desc: 'Formal & authoritative' },
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm & approachable' },
  { value: 'bold',         label: 'Bold',         desc: 'Confident & assertive' },
  { value: 'playful',      label: 'Playful',      desc: 'Fun & creative' },
  { value: 'inspirational',label: 'Inspirational',desc: 'Motivating & uplifting' },
  { value: 'luxurious',    label: 'Luxurious',    desc: 'Premium & exclusive' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'increase_revenue',  label: 'Increase Revenue',      metric: '% growth target' },
  { value: 'generate_leads',    label: 'Generate Leads',         metric: 'leads per month' },
  { value: 'brand_awareness',   label: 'Build Brand Awareness',  metric: '% reach increase' },
  { value: 'launch_product',    label: 'Launch a Product',       metric: 'launch date' },
  { value: 'grow_social',       label: 'Grow Social Following',  metric: 'followers target' },
  { value: 'retain_customers',  label: 'Retain Customers',       metric: '% retention rate' },
]

const TIMELINE_OPTIONS = [
  { value: '1_month',   label: '1 Month',    desc: 'Sprint' },
  { value: '3_months',  label: '3 Months',   desc: 'Quarter' },
  { value: '6_months',  label: '6 Months',   desc: 'Half Year' },
  { value: '12_months', label: '12 Months',  desc: 'Annual' },
]

const PRESET_COLORS = [
  '#c8973e','#6366f1','#ec4899','#10b981','#f59e0b','#ef4444',
  '#06b6d4','#8b5cf6','#14b8a6','#f97316','#0ea5e9','#a855f7',
]

/* ── Reusable input styles ── */
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, letterSpacing: 0.3 }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: TEXT3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`,
  borderRadius: 10, padding: '11px 14px', color: TEXT, fontSize: 13,
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

const taStyle = { ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }

const selectStyle = {
  ...inputStyle,
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c8973e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  paddingRight: 36, cursor: 'pointer',
}

/* ── Color Picker ── */
function ColorPicker({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 11, color: TEXT2 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 28, height: 28, borderRadius: 6, background: c, border: 'none',
            cursor: 'pointer', outline: value === c ? `2px solid ${TEXT}` : '2px solid transparent',
            outlineOffset: 2, transition: 'outline 0.15s',
          }} />
        ))}
        <input type="color" value={value || '#c8973e'} onChange={e => onChange(e.target.value)}
          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, cursor: 'pointer', padding: 0, background: 'none' }} />
      </div>
    </div>
  )
}

/* ── Step progress bar ── */
function StepBar({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= current ? GOLD : BORDER,
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

/* ── Main page ── */
export default function BrandKnowledgeBase() {
  useRequireAuth()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    // Step 0 — Business Identity
    companyName:    '',
    industry:       '',
    productService: '',
    pricingRange:   '',
    founded:        '',
    website:        '',

    // Step 1 — Market Intelligence
    audienceType:       '',
    ageRange:           '',
    targetAudience:     '',
    geographicFocus:    '',
    competitor1:        '',
    competitor2:        '',
    competitor3:        '',
    uniqueAdvantage:    '',

    // Step 2 — Brand Identity
    primaryColor:   '#c8973e',
    secondaryColor: '#1c1a13',
    toneOfVoice:    '',
    brandTagline:   '',
    brandPersonality: '',

    // Step 3 — Business Goals
    primaryObjective:  '',
    objectiveTarget:   '',
    timeline:          '',
    revenueTarget:     '',
    additionalNotes:   '',
  })

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      if (data) setForm(f => ({ ...f, ...data }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    if (!user?.uid) return
    setSaving(true)
    setError('')
    try {
      await saveKnowledgeBase(user.uid, form)
      setSaved(true)
      if (step < STEPS.length - 1) {
        setTimeout(() => { setStep(s => s + 1); setSaved(false) }, 600)
      } else {
        setTimeout(() => navigate('/agents-hub'), 1200)
      }
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '88px 32px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#c8973e,#a87030)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, ...goldGrad }}>
                Brand Knowledge Base
              </h1>
              <p style={{ fontSize: 12, color: TEXT2, margin: 0 }}>
                The foundation your AI CMO uses to personalize every campaign
              </p>
            </div>
          </div>
        </div>

        {/* Step progress */}
        <StepBar current={step} total={STEPS.length} />

        {/* Step tab navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
              background: step === i ? `${s.color}20` : 'transparent',
              border: `1px solid ${step === i ? s.color + '50' : BORDER}`,
              color: step === i ? s.color : TEXT3,
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {i < step
                ? <Check size={13} />
                : React.cloneElement(s.icon, { size: 13 })}
              {s.title}
            </button>
          ))}
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: '28px 28px 24px',
            }}
          >
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${STEPS[step].color}18`,
                border: `1px solid ${STEPS[step].color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: STEPS[step].color,
              }}>
                {STEPS[step].icon}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{STEPS[step].title}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>{STEPS[step].subtitle}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: TEXT3 }}>
                Step {step + 1} of {STEPS.length}
              </div>
            </div>

            {/* ── Step 0: Business Identity ── */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Company Name" hint="required">
                    <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
                      placeholder="e.g. Evoke Media" style={inputStyle} />
                  </Field>
                  <Field label="Industry" hint="required">
                    <select value={form.industry} onChange={e => set('industry', e.target.value)} style={selectStyle}>
                      <option value="" disabled>Select your industry</option>
                      {INDUSTRY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="What do you sell?" hint="be specific">
                  <textarea value={form.productService} onChange={e => set('productService', e.target.value)}
                    placeholder="Describe your product or service in 2–3 sentences. What problem does it solve?" style={taStyle} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Pricing Range">
                    <select value={form.pricingRange} onChange={e => set('pricingRange', e.target.value)} style={selectStyle}>
                      <option value="" disabled>Select price range</option>
                      {PRICING_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Year Founded">
                    <input value={form.founded} onChange={e => set('founded', e.target.value)}
                      placeholder="e.g. 2021" style={inputStyle} />
                  </Field>
                </div>
                <Field label="Website URL">
                  <input value={form.website} onChange={e => set('website', e.target.value)}
                    placeholder="https://evokemedia.io" style={inputStyle} />
                </Field>
              </div>
            )}

            {/* ── Step 1: Market Intelligence ── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Audience Type" hint="required">
                    <select value={form.audienceType} onChange={e => set('audienceType', e.target.value)} style={selectStyle}>
                      <option value="" disabled>Select type</option>
                      {AUDIENCE_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Target Age Range">
                    <select value={form.ageRange} onChange={e => set('ageRange', e.target.value)} style={selectStyle}>
                      <option value="" disabled>Select age group</option>
                      {AGE_RANGE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Target Audience Description" hint="be specific">
                  <textarea value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}
                    placeholder="Describe your ideal customer — profession, interests, pain points, buying behavior…" style={taStyle} />
                </Field>
                <Field label="Geographic Focus" hint="required">
                  <select value={form.geographicFocus} onChange={e => set('geographicFocus', e.target.value)} style={selectStyle}>
                    <option value="" disabled>Select region</option>
                    {GEO_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Top Competitors</span>
                  {['competitor1','competitor2','competitor3'].map((k, i) => (
                    <input key={k} value={form[k]} onChange={e => set(k, e.target.value)}
                      placeholder={`Competitor ${i+1} name or URL`} style={inputStyle} />
                  ))}
                </div>
                <Field label="Your Unique Advantage" hint="what makes you different?">
                  <textarea value={form.uniqueAdvantage} onChange={e => set('uniqueAdvantage', e.target.value)}
                    placeholder="Why should customers choose you over the competition?" style={taStyle} />
                </Field>
              </div>
            )}

            {/* ── Step 2: Brand Identity ── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <ColorPicker label="Primary Brand Color" value={form.primaryColor} onChange={v => set('primaryColor', v)} />
                  <ColorPicker label="Secondary Brand Color" value={form.secondaryColor} onChange={v => set('secondaryColor', v)} />
                </div>

                <Field label="Brand Tagline / USP">
                  <input value={form.brandTagline} onChange={e => set('brandTagline', e.target.value)}
                    placeholder='e.g. "Marketing that thinks for you"' style={inputStyle} />
                </Field>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Tone of Voice</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {TONE_OPTIONS.map(t => (
                      <button key={t.value} onClick={() => set('toneOfVoice', t.value)} style={{
                        background: form.toneOfVoice === t.value ? 'rgba(236,72,153,0.12)' : INPUT_BG,
                        border: `1px solid ${form.toneOfVoice === t.value ? '#ec4899' : BORDER}`,
                        borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.18s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: form.toneOfVoice === t.value ? '#ec4899' : TEXT }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Brand Personality" hint="optional">
                  <textarea value={form.brandPersonality} onChange={e => set('brandPersonality', e.target.value)}
                    placeholder="Describe your brand as if it were a person — values, character, how it talks…" style={taStyle} />
                </Field>
              </div>
            )}

            {/* ── Step 3: Business Goals ── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Primary Business Objective <span style={{ color: TEXT3, fontWeight: 400 }}>(required)</span></span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {OBJECTIVE_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => set('primaryObjective', o.value)} style={{
                        background: form.primaryObjective === o.value ? 'rgba(16,185,129,0.1)' : INPUT_BG,
                        border: `1px solid ${form.primaryObjective === o.value ? '#10b981' : BORDER}`,
                        borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.18s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: form.primaryObjective === o.value ? '#10b981' : TEXT }}>
                          {o.label}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{o.metric}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Target Number / Metric" hint="e.g. 20%, 500 leads">
                    <input value={form.objectiveTarget} onChange={e => set('objectiveTarget', e.target.value)}
                      placeholder="e.g. 30% growth" style={inputStyle} />
                  </Field>
                  <Field label="Revenue Target" hint="optional">
                    <input value={form.revenueTarget} onChange={e => set('revenueTarget', e.target.value)}
                      placeholder="e.g. ₹1 Cr ARR" style={inputStyle} />
                  </Field>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Timeline</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TIMELINE_OPTIONS.map(t => (
                      <button key={t.value} onClick={() => set('timeline', t.value)} style={{
                        background: form.timeline === t.value ? 'rgba(16,185,129,0.12)' : INPUT_BG,
                        border: `1px solid ${form.timeline === t.value ? '#10b981' : BORDER}`,
                        borderRadius: 100, padding: '8px 18px', cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: form.timeline === t.value ? '#10b981' : TEXT }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 10, color: TEXT3, textAlign: 'center' }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Additional Notes" hint="anything your AI CMO should know">
                  <textarea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)}
                    placeholder="Upcoming product launches, seasonal campaigns, budget constraints, markets to avoid…" style={taStyle} />
                </Field>

                {/* Preview of objective statement */}
                {form.primaryObjective && form.objectiveTarget && form.timeline && (
                  <div style={{
                    background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 12, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>
                      YOUR AI CMO OBJECTIVE
                    </div>
                    <div style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>
                      "{OBJECTIVE_OPTIONS.find(o => o.value === form.primaryObjective)?.label} by {form.objectiveTarget}
                      {' '}within {TIMELINE_OPTIONS.find(t => t.value === form.timeline)?.label}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '10px 20px', color: TEXT2,
              fontSize: 13, cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.35 : 1, transition: 'all 0.2s',
            }}
            disabled={step === 0}>
            <ChevronLeft size={15} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13 }}>
                <Check size={14} /> Saved
              </motion.div>
            )}

            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #e8c47a, #c8973e, #a87030)',
              border: 'none', borderRadius: 100, padding: '10px 24px',
              color: '#0e0c09', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}>
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : step < STEPS.length - 1
                  ? <><span>Save & Continue</span><ChevronRight size={15} /></>
                  : <><Sparkles size={14} /><span>Complete Setup</span></>
              }
            </button>
          </div>
        </div>

        {/* Bottom hint */}
        <p style={{ textAlign: 'center', fontSize: 11, color: TEXT3, marginTop: 20 }}>
          Your data is saved to your account — you can update it anytime from the agents hub.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(200,151,62,0.5) !important;
          outline: none !important;
        }
        select option {
          background: #1c1a13;
          color: #f0ebe0;
        }
      `}</style>
    </div>
  )
}
