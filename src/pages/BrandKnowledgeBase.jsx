import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Target, Palette, Rocket, ChevronRight, ChevronLeft,
  Check, Loader2, Zap, Globe, Users, DollarSign, Megaphone,
  Sparkles, AlertCircle, RefreshCw, BookOpen, Activity,
  Linkedin, Facebook, Instagram, Mail, MessageSquare,
  CheckCircle2, Pencil, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { getKnowledgeBase, saveKnowledgeBase } from '../services/knowledgeBaseService.js'
import { getUserData } from '../services/userService'
import { PLANS as PLAN_ORDER } from '../lib/planGate.js'
import { getRecommendedActions } from '../lib/recommendations.jsx'
import UpgradeModal from '../components/UpgradeModal.jsx'

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
  { value: 'under_50',       label: 'Under $50' },
  { value: '50_200',         label: '$50 – $200' },
  { value: '200_500',        label: '$200 – $500' },
  { value: '500_2k',         label: '$500 – $2,000' },
  { value: '2k_10k',         label: '$2,000 – $10,000' },
  { value: 'above_10k',      label: 'Above $10,000' },
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

const METRIC_OPTIONS = [
  { value: '10_pct',     label: '10% growth' },
  { value: '20_pct',     label: '20% growth' },
  { value: '30_pct',     label: '30% growth' },
  { value: '50_pct',     label: '50% growth' },
  { value: '2x',         label: '2× current performance' },
  { value: '100_leads',  label: '100 leads / month' },
  { value: '500_leads',  label: '500 leads / month' },
  { value: '1k_leads',   label: '1,000 leads / month' },
  { value: '5k_leads',   label: '5,000 leads / month' },
  { value: '10k_follow', label: '10,000 followers' },
  { value: '50k_follow', label: '50,000 followers' },
  { value: '100k_follow',label: '100,000 followers' },
  { value: 'custom',     label: 'Custom target' },
]

const REVENUE_OPTIONS = [
  { value: '10k_mo',   label: '$10,000 / mo' },
  { value: '25k_mo',   label: '$25,000 / mo' },
  { value: '50k_mo',   label: '$50,000 / mo' },
  { value: '100k_mo',  label: '$100,000 / mo' },
  { value: '250k_arr', label: '$250K ARR' },
  { value: '500k_arr', label: '$500K ARR' },
  { value: '1m_arr',   label: '$1M ARR' },
  { value: '5m_arr',   label: '$5M ARR' },
  { value: '10m_arr',  label: '$10M ARR' },
  { value: 'custom',   label: 'Custom / Other' },
]

const BUDGET_OPTIONS = [
  { value: 'under_1k',  label: 'Under $1,000/mo' },
  { value: '1k_5k',     label: '$1,000 – $5,000/mo' },
  { value: '5k_15k',    label: '$5,000 – $15,000/mo' },
  { value: '15k_50k',   label: '$15,000 – $50,000/mo' },
  { value: 'above_50k', label: 'Above $50,000/mo' },
  { value: 'flexible',  label: 'Flexible / Project-based' },
]

const CHANNEL_OPTIONS = [
  { value: 'social_organic', label: 'Social Media (Organic)' },
  { value: 'paid_social',    label: 'Paid Social Ads' },
  { value: 'google_ads',     label: 'Google / Search Ads' },
  { value: 'seo_content',    label: 'SEO & Content' },
  { value: 'email',          label: 'Email Marketing' },
  { value: 'whatsapp',       label: 'WhatsApp / SMS' },
  { value: 'influencer',     label: 'Influencer Marketing' },
  { value: 'events',         label: 'Events & Webinars' },
  { value: 'referral',       label: 'Referral / Word of Mouth' },
  { value: 'video',          label: 'Video / YouTube' },
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

/* ── Color conversion helpers ── */
function hexToHsv(hex) {
  try {
    const r = parseInt(hex.slice(1,3), 16) / 255
    const g = parseInt(hex.slice(3,5), 16) / 255
    const b = parseInt(hex.slice(5,7), 16) / 255
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
    const v = max
    const s = max === 0 ? 0 : d / max
    let h = 0
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6)
      else if (max === g) h = 60 * ((b - r) / d + 2)
      else h = 60 * ((r - g) / d + 4)
    }
    return { h: (h + 360) % 360, s, v }
  } catch { return { h: 30, s: 0.7, v: 0.8 } }
}

function hsvToHex(h, s, v) {
  const f = n => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const toHex = x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
}

/* ── Color Picker ── */
function ColorPicker({ value, onChange, label }) {
  const init = hexToHsv(value || '#c8973e')
  const [open, setOpen]         = useState(false)
  const [hue, setHue]           = useState(init.h)
  const [sat, setSat]           = useState(init.s)
  const [val, setVal]           = useState(init.v)
  const [hexInput, setHexInput] = useState(value || '#c8973e')
  const gradRef = useRef(null)
  const hueRef  = useRef(null)

  useEffect(() => {
    const hsv = hexToHsv(value || '#c8973e')
    setHue(hsv.h); setSat(hsv.s); setVal(hsv.v)
    setHexInput(value || '#c8973e')
  }, [value])

  function commit(h, s, v) {
    const hex = hsvToHex(h, s, v)
    setHexInput(hex)
    onChange(hex)
  }

  function handleGradMouseDown(e) {
    e.preventDefault()
    updateGrad(e)
    const move = e2 => updateGrad(e2)
    const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  function updateGrad(e) {
    if (!gradRef.current) return
    const rect = gradRef.current.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setSat(s); setVal(v)
    commit(hue, s, v)
  }

  function handleHueMouseDown(e) {
    e.preventDefault()
    updateHue(e)
    const move = e2 => updateHue(e2)
    const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  function updateHue(e) {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const h = Math.max(0, Math.min(360, ((e.clientY - rect.top) / rect.height) * 360))
    setHue(h)
    commit(h, sat, val)
  }

  function handleHexInput(e) {
    const hex = e.target.value
    setHexInput(hex)
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      const hsv = hexToHsv(hex)
      setHue(hsv.h); setSat(hsv.s); setVal(hsv.v)
      onChange(hex)
    }
  }

  function handlePreset(c) {
    const hsv = hexToHsv(c)
    setHue(hsv.h); setSat(hsv.s); setVal(hsv.v)
    setHexInput(c)
    onChange(c)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      <span style={{ fontSize: 11, color: TEXT2 }}>{label}</span>

      {/* Trigger button — just the color swatch */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: 44, height: 44, borderRadius: 10,
        background: value || '#c8973e',
        border: `2px solid ${open ? GOLD : 'rgba(255,255,255,0.15)'}`,
        cursor: 'pointer', padding: 0,
        transition: 'border-color 0.2s',
        boxShadow: open ? `0 0 0 3px rgba(200,151,62,0.2)` : 'none',
      }} />

      {/* Picker panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000,
          background: '#1a1813', border: `1px solid rgba(200,151,62,0.3)`,
          borderRadius: 14, padding: 16, width: 260,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}>
          {/* Gradient + hue slider */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {/* Saturation / Value */}
            <div
              ref={gradRef}
              onMouseDown={handleGradMouseDown}
              style={{
                flex: 1, height: 160, borderRadius: 10, position: 'relative',
                cursor: 'crosshair', userSelect: 'none',
                background: `linear-gradient(to bottom, transparent, #000),
                             linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
              }}
            >
              <div style={{
                position: 'absolute',
                left: `${sat * 100}%`, top: `${(1 - val) * 100}%`,
                width: 14, height: 14, borderRadius: '50%',
                border: '2.5px solid #fff', transform: 'translate(-50%, -50%)',
                background: value || '#c8973e', pointerEvents: 'none',
                boxShadow: '0 0 6px rgba(0,0,0,0.6)',
              }} />
            </div>

            {/* Hue slider */}
            <div
              ref={hueRef}
              onMouseDown={handleHueMouseDown}
              style={{
                width: 20, height: 160, borderRadius: 10, cursor: 'ns-resize',
                position: 'relative', userSelect: 'none',
                background: 'linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
              }}
            >
              <div style={{
                position: 'absolute', top: `${(hue / 360) * 100}%`,
                left: -4, right: -4, height: 4, background: '#fff',
                borderRadius: 2, transform: 'translateY(-50%)',
                pointerEvents: 'none', boxShadow: '0 0 4px rgba(0,0,0,0.6)',
              }} />
            </div>
          </div>

          {/* Hex input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: value || '#c8973e', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
            <input
              value={hexInput}
              onChange={handleHexInput}
              placeholder="#000000"
              style={{
                flex: 1, background: '#111009', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '7px 10px', color: TEXT,
                fontSize: 13, fontFamily: 'monospace', outline: 'none',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Preset swatches */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => handlePreset(c)} style={{
                width: 24, height: 24, borderRadius: 5, background: c, border: 'none',
                cursor: 'pointer', outline: value === c ? `2px solid ${TEXT}` : '2px solid transparent',
                outlineOffset: 2, transition: 'outline 0.15s',
              }} />
            ))}
          </div>
        </div>
      )}
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
  const location = useLocation()
  const forceEdit = !!location.state?.edit
  const { plan: userPlan } = useUserPlan()

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [healthScore, setHealthScore] = useState(20)
  const [scoreBreakdown, setScoreBreakdown] = useState({ profile: 20, kb: 20, social: 0, campaigns: 0 })
  const [socialAccounts, setSocialAccounts] = useState({})
  const [upgradeFor, setUpgradeFor] = useState(null)

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
    primaryObjectives: [],
    objectiveTarget:   '',
    timeline:          '',
    revenueTarget:     '',
    marketingBudget:   '',
    priorityChannels:  [],
    additionalNotes:   '',
  })

  // Marketing Health Score preview: Profile(20) + Brand KB(20) + Social(20) + Campaigns(20)
  function loadCompletionData(uid) {
    getUserData(uid).then(data => {
      const accounts = data?.socialAccounts || {}
      setSocialAccounts(accounts)
      const connected = Object.values(accounts).filter(a => a?.connected).length
      const socialScore = Math.min(Math.round((connected / 6) * 20), 20)
      let campaignScore = 0
      try { campaignScore = (JSON.parse(localStorage.getItem('evoke_campaigns') || '[]').length > 0) ? 20 : 0 } catch {}
      setScoreBreakdown({ profile: 20, kb: 20, social: socialScore, campaigns: campaignScore })
      setHealthScore(20 + 20 + socialScore + campaignScore)
    }).catch(() => {})
  }

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      if (data) setForm(f => ({ ...f, ...data }))
      setLoading(false)
      // Brand profile is already set up — land on the "AI CMO is ready" dashboard
      // instead of re-showing the wizard from step 0. Skip this when the user
      // explicitly asked to edit (e.g. clicking "Update" on the brand profile card).
      const isComplete = !!(data?.companyName && data?.industry)
      if (isComplete && !forceEdit) {
        setStep(STEPS.length - 1)
        loadCompletionData(user.uid)
        setShowCompletion(true)
      }
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
        loadCompletionData(user.uid)
        setTimeout(() => setShowCompletion(true), 600)
      }
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (showCompletion) {
    const healthColor   = healthScore >= 80 ? '#10b981' : healthScore >= 50 ? GOLD : '#f97316'
    const objectiveLabel = OBJECTIVE_OPTIONS.find(o => o.value === form.primaryObjective)?.label
    const objectives    = form.primaryObjectives?.length ? form.primaryObjectives : (form.primaryObjective ? [form.primaryObjective] : [])
    const channels      = form.priorityChannels || []
    const industryLabel = INDUSTRY_OPTIONS.find(i => i.value === form.industry)?.label || 'your industry'
    const budgetLabel   = BUDGET_OPTIONS.find(b => b.value === form.marketingBudget)?.label
    const revenueLabel  = REVENUE_OPTIONS.find(r => r.value === form.revenueTarget)?.label

    // Build personalised growth action cards from brand data
    const _grow = []
    if (objectives.includes('generate_leads'))
      _grow.push({ icon: <Target size={18} />, color: '#10b981', badge: 'High Impact', title: 'Launch a Lead Generation Campaign', insight: `${form.companyName} in ${industryLabel} can 3× ${form.audienceType === 'b2b' ? 'B2B pipeline' : 'customer sign-ups'} with targeted campaigns tailored to your audience.`, metric: '2–5× more leads in 30 days', path: '/caption-suite', cta: 'Start Campaign' })
    if (objectives.includes('increase_revenue'))
      _grow.push({ icon: <DollarSign size={18} />, color: GOLD, badge: 'Revenue Driver', title: 'Revenue-Focused Multi-Channel Plan', insight: `Brands with ${budgetLabel ? budgetLabel + ' budget' : 'your budget'} in ${industryLabel} see the fastest ROI from coordinated content + paid campaigns.`, metric: revenueLabel ? `On track for ${revenueLabel}` : 'Grow revenue predictably', path: '/strategy', cta: 'Build Strategy' })
    if (objectives.includes('grow_social') || channels.some(c => ['social_organic','video','influencer'].includes(c)))
      _grow.push({ icon: <Sparkles size={18} />, color: '#ec4899', badge: 'Quick Win', title: '30-Day Content Calendar', insight: `Your ${TONE_OPTIONS.find(t => t.value === form.toneOfVoice)?.label || 'unique'} brand voice + consistent posting = organic growth engine for ${industryLabel}.`, metric: '40% more reach in 4 weeks', path: '/caption-suite', cta: 'Generate Content' })
    if (objectives.includes('brand_awareness'))
      _grow.push({ icon: <Globe size={18} />, color: '#06b6d4', badge: 'Visibility', title: 'Brand Awareness Campaign', insight: `Reach your ${GEO_OPTIONS.find(g => g.value === form.geographicFocus)?.label || 'target market'} audience with creatives built around ${form.companyName}'s identity.`, metric: 'Reach 10× more potential customers', path: '/campaign/brand', cta: 'Create Campaign' })
    if (objectives.includes('launch_product'))
      _grow.push({ icon: <Rocket size={18} />, color: '#f97316', badge: 'Launch Ready', title: 'Product Launch Strategy', insight: `A ${TIMELINE_OPTIONS.find(t => t.value === form.timeline)?.label || '3-month'} launch plan around your brand identity maximises first-week impact.`, metric: 'Full launch plan in under 10 min', path: '/strategy', cta: 'Plan Launch' })
    if (objectives.includes('retain_customers'))
      _grow.push({ icon: <Users size={18} />, color: '#8b5cf6', badge: 'Retention', title: 'Customer Retention Campaigns', insight: `Keeping existing ${form.audienceType === 'b2b' ? 'clients' : 'customers'} costs 5× less than acquiring new ones. Build loyalty with personalised nurture flows.`, metric: 'Increase retention by 20–40%', path: '/campaign/retention', cta: 'Build Campaign' })
    if (channels.includes('email') && _grow.length < 3)
      _grow.push({ icon: <Mail size={18} />, color: '#f59e0b', badge: 'High ROI', title: 'Email Marketing Sequences', insight: `Email delivers $42 ROI per $1 spent. Your ${form.audienceType === 'b2b' ? 'B2B' : 'consumer'} audience in ${industryLabel} is primed for nurture campaigns.`, metric: '$42 return per $1 spent', path: '/campaign/email', cta: 'Create Email' })
    if (_grow.length === 0) {
      _grow.push({ icon: <Activity size={18} />, color: GOLD, badge: 'First Step', title: 'Market & Competitor Analysis', insight: `Understand how competitors position in ${industryLabel} — find the gaps ${form.companyName} can own today.`, metric: 'Clear strategy in 1 hour', path: '/trends', cta: 'Analyse Market' })
      _grow.push({ icon: <Sparkles size={18} />, color: '#ec4899', badge: 'Quick Win', title: 'Generate Your First Content', insight: `Your AI CMO knows ${form.companyName}. Let it write captions, scripts and campaigns — all in your brand voice.`, metric: 'Save 5+ hours per week', path: '/caption-suite', cta: 'Generate Content' })
    }
    const topGrowthActions = _grow.slice(0, 3)

    const PLATFORMS = [
      { key: 'linkedin',  label: 'LinkedIn',  icon: <Linkedin size={17} />,     color: '#0a66c2' },
      { key: 'facebook',  label: 'Facebook',  icon: <Facebook size={17} />,     color: '#1877f2' },
      { key: 'instagram', label: 'Instagram', icon: <Instagram size={17} />,    color: '#e1306c' },
      { key: 'gmail',     label: 'Gmail',     icon: <Mail size={17} />,         color: '#ea4335' },
      { key: 'whatsapp',  label: 'WhatsApp',  icon: <MessageSquare size={17} />, color: '#25d366' },
    ]

    const connectedForScore = Object.values(socialAccounts || {}).filter(a => a?.connected).length
    let savedCampaigns = []
    try { savedCampaigns = JSON.parse(localStorage.getItem('evoke_campaigns') || '[]') } catch {}
    const recommendedActions = getRecommendedActions(connectedForScore, savedCampaigns, 0, form)

    const goToRecommendation = (action) => {
      const required = action.planRequired || 'free'
      if (PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(required)) {
        setUpgradeFor({ requiredPlan: required, featureTitle: action.title })
        return
      }
      navigate(action.path)
    }

    const SectionBadge = ({ children }) => (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
        {children}
      </div>
    )

    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '90px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#d4a853,#b8803a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', boxShadow: '0 0 40px rgba(200,151,62,0.3)',
            }}>
              <Check size={30} color="#0e0c09" strokeWidth={3} />
            </div>
            <h1 style={{ fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 900, fontFamily: "'Syne','Inter',sans-serif", letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Your AI CMO is ready,{' '}
              <span style={{ background: 'linear-gradient(135deg,#e8c47a,#c8973e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {form.companyName || 'let\'s go'}
              </span>
            </h1>
            <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, margin: '0 auto', maxWidth: 520 }}>
              Everything you need is on this one page — your score, brand profile, platform connections and campaign launcher.
            </p>
          </motion.div>

          {/* ── Marketing Health Score ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 32 }}>
            <SectionBadge><Activity size={11} /> Marketing Health Score</SectionBadge>
            <div style={{ background: `linear-gradient(135deg, ${healthColor}10, ${CARD})`, border: `1px solid ${healthColor}35`, borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', flexShrink: 0, background: `${healthColor}12`, border: `3px solid ${healthColor}45`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: healthColor, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1 }}>{healthScore}</span>
                <span style={{ fontSize: 9, color: TEXT3, fontWeight: 700 }}>/100</span>
              </div>
              <div style={{ flex: 1, minWidth: 220, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {[
                  { label: 'Profile', score: scoreBreakdown.profile, color: GOLD },
                  { label: 'Brand KB', score: scoreBreakdown.kb, color: '#f59e0b' },
                  { label: 'Social', score: scoreBreakdown.social, color: '#3b82f6' },
                  { label: 'Campaigns', score: scoreBreakdown.campaigns, color: '#10b981' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.score >= 20 ? b.color : 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 12, color: TEXT2, fontWeight: 600 }}>{b.label} {b.score}/20</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/health-score')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: `${healthColor}15`, border: `1px solid ${healthColor}40`, borderRadius: 100, color: healthColor, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Full Report <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>

          {/* ── Brand Profile Summary ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 32 }}>
            <SectionBadge><Building2 size={11} /> Your Brand Profile</SectionBadge>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '20px 24px' }}>
              {/* Key fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 18 }}>
                {[
                  { label: 'Company',          value: form.companyName },
                  { label: 'Industry',         value: industryLabel },
                  { label: 'Audience',         value: AUDIENCE_TYPE_OPTIONS.find(a => a.value === form.audienceType)?.label },
                  { label: 'Geographic Focus', value: GEO_OPTIONS.find(g => g.value === form.geographicFocus)?.label },
                  { label: 'Tone of Voice',    value: TONE_OPTIONS.find(t => t.value === form.toneOfVoice)?.label },
                  { label: 'Timeline',         value: TIMELINE_OPTIONS.find(t => t.value === form.timeline)?.label },
                  { label: 'Marketing Budget', value: budgetLabel },
                  { label: 'Revenue Goal',     value: revenueLabel },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Business Objectives tags */}
              {objectives.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Business Objectives</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {objectives.map(v => (
                      <span key={v} style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                        {OBJECTIVE_OPTIONS.find(o => o.value === v)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Channels tags */}
              {channels.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Priority Channels</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {channels.map(v => (
                      <span key={v} style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 100, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                        {CHANNEL_OPTIONS.find(c => c.value === v)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                <button onClick={() => setShowCompletion(false)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Pencil size={12} /> Edit Profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Connect Platforms ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 32 }}>
            <SectionBadge><Globe size={11} /> Connect Your Platforms</SectionBadge>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              {PLATFORMS.map(p => {
                const connected = !!socialAccounts?.[p.key]?.connected
                return (
                  <div key={p.key} style={{ background: CARD, border: `1px solid ${connected ? '#10b98140' : BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${p.color}15`, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                      {p.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{p.label}</div>
                      {connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                          <CheckCircle2 size={11} /> Connected
                        </div>
                      ) : (
                        <button onClick={() => navigate('/connect-accounts')} style={{ background: 'none', border: 'none', color: TEXT3, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          Connect →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ── Recommended Agents — personalised to this brand profile ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginBottom: 40 }}>
            <SectionBadge><Sparkles size={11} /> AI Agents For {form.companyName || 'Your Brand'}</SectionBadge>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {recommendedActions.map(a => {
                const locked = PLAN_ORDER.indexOf(userPlan || 'free') < PLAN_ORDER.indexOf(a.planRequired || 'free')
                return (
                  <motion.div
                    key={a.path}
                    whileHover={{ y: -3 }}
                    onClick={() => goToRecommendation(a)}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + '50' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
                  >
                    {locked && (
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 9, fontWeight: 800, color: TEXT3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        <Lock size={9} /> {a.planRequired?.replace('package-', 'Pkg ').toUpperCase()}
                      </div>
                    )}
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${a.color}15`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 10 }}>
                      {a.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.4, marginBottom: 10 }}>{a.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: locked ? TEXT3 : a.color }}>
                      {locked ? <><Lock size={10} /> Upgrade to unlock</> : <>{a.cta} <ChevronRight size={11} /></>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* ── Your Growth Path ── */}
          {topGrowthActions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginBottom: 40 }}>
              <SectionBadge><Rocket size={11} /> Your Growth Path — Start Here</SectionBadge>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                {topGrowthActions.map((action, idx) => {
                  const isFirst = idx === 0
                  return (
                    <div
                      key={action.path + idx}
                      onClick={() => navigate(action.path)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '18px 24px',
                        borderBottom: idx < topGrowthActions.length - 1 ? `1px solid ${BORDER}` : 'none',
                        cursor: 'pointer',
                        background: isFirst ? `${action.color}08` : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${action.color}12` }}
                      onMouseLeave={e => { e.currentTarget.style.background = isFirst ? `${action.color}08` : 'transparent' }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: isFirst ? action.color : `${action.color}18`,
                        border: `1px solid ${action.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: isFirst ? '#0e0c09' : action.color,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{action.title}</span>
                          {isFirst && (
                            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: `${action.color}20`, color: action.color, border: `1px solid ${action.color}40` }}>
                              Start Here
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: TEXT3, lineHeight: 1.45 }}>{action.insight}</div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: action.color, whiteSpace: 'nowrap' }}>
                        {action.cta} <ChevronRight size={13} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {upgradeFor && (
            <UpgradeModal
              requiredPlan={upgradeFor.requiredPlan}
              featureTitle={upgradeFor.featureTitle}
              onClose={() => setUpgradeFor(null)}
            />
          )}

          {/* Go to dashboard */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/agents-hub')}
              style={{
                background: 'none', border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 100, padding: '11px 28px',
                color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = TEXT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = TEXT2 }}
            >
              Go to Dashboard →
            </button>
          </div>

        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
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

                <Field label="Brand Tagline / USP" hint="required">
                  <input value={form.brandTagline} onChange={e => set('brandTagline', e.target.value)}
                    placeholder='e.g. "Marketing that thinks for you"' style={inputStyle} />
                </Field>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Tone of Voice <span style={{ fontSize: 11, color: TEXT3, fontWeight: 400 }}>(required)</span></span>
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
            {step === 3 && (() => {
              const objectives = form.primaryObjectives?.length ? form.primaryObjectives : (form.primaryObjective ? [form.primaryObjective] : [])
              const toggleObjective = (val) => {
                const curr = form.primaryObjectives || []
                set('primaryObjectives', curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val])
              }
              const toggleChannel = (val) => {
                const curr = form.priorityChannels || []
                set('priorityChannels', curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val])
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Business Objectives — multi-select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>
                      Business Objectives <span style={{ color: TEXT3, fontWeight: 400 }}>(required · select all that apply)</span>
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {OBJECTIVE_OPTIONS.map(o => {
                        const selected = objectives.includes(o.value)
                        return (
                          <button key={o.value} onClick={() => toggleObjective(o.value)} style={{
                            background: selected ? 'rgba(16,185,129,0.1)' : INPUT_BG,
                            border: `1px solid ${selected ? '#10b981' : BORDER}`,
                            borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                            textAlign: 'left', transition: 'all 0.18s', position: 'relative',
                          }}>
                            {selected && (
                              <div style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Check size={10} color="#fff" strokeWidth={3} />
                              </div>
                            )}
                            <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#10b981' : TEXT }}>{o.label}</div>
                            <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{o.metric}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Target + Revenue */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Target Number / Metric" hint="required">
                      <select value={form.objectiveTarget} onChange={e => set('objectiveTarget', e.target.value)} style={selectStyle}>
                        <option value="" disabled>Select a target</option>
                        {METRIC_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Revenue Target" hint="optional">
                      <select value={form.revenueTarget} onChange={e => set('revenueTarget', e.target.value)} style={selectStyle}>
                        <option value="" disabled>Select revenue goal</option>
                        {REVENUE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Marketing Budget */}
                  <Field label="Monthly Marketing Budget" hint="required">
                    <select value={form.marketingBudget} onChange={e => set('marketingBudget', e.target.value)} style={selectStyle}>
                      <option value="" disabled>Select your budget range</option>
                      {BUDGET_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Timeline <span style={{ color: TEXT3, fontWeight: 400 }}>(required)</span></span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TIMELINE_OPTIONS.map(t => (
                        <button key={t.value} onClick={() => set('timeline', t.value)} style={{
                          background: form.timeline === t.value ? 'rgba(16,185,129,0.12)' : INPUT_BG,
                          border: `1px solid ${form.timeline === t.value ? '#10b981' : BORDER}`,
                          borderRadius: 100, padding: '8px 18px', cursor: 'pointer', transition: 'all 0.18s',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: form.timeline === t.value ? '#10b981' : TEXT }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: TEXT3, textAlign: 'center' }}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Channels — multi-select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>
                      Priority Marketing Channels <span style={{ color: TEXT3, fontWeight: 400 }}>(pick your top channels)</span>
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {CHANNEL_OPTIONS.map(c => {
                        const selected = (form.priorityChannels || []).includes(c.value)
                        return (
                          <button key={c.value} onClick={() => toggleChannel(c.value)} style={{
                            padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                            background: selected ? 'rgba(99,102,241,0.12)' : INPUT_BG,
                            border: `1px solid ${selected ? '#6366f1' : BORDER}`,
                            color: selected ? '#6366f1' : TEXT2,
                            fontSize: 12, fontWeight: selected ? 700 : 500,
                            transition: 'all 0.18s',
                          }}>
                            {selected && '✓ '}{c.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <Field label="Additional Notes" hint="anything your AI CMO should know">
                    <textarea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)}
                      placeholder="Upcoming product launches, seasonal campaigns, budget constraints, markets to avoid…" style={taStyle} />
                  </Field>

                  {/* Preview */}
                  {objectives.length > 0 && form.timeline && (
                    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
                        YOUR AI CMO OBJECTIVES
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {objectives.map(v => (
                          <span key={v} style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            {OBJECTIVE_OPTIONS.find(o => o.value === v)?.label}
                          </span>
                        ))}
                      </div>
                      {form.objectiveTarget && (
                        <div style={{ fontSize: 12, color: TEXT2, marginTop: 8 }}>
                          Target: <strong style={{ color: TEXT }}>{METRIC_OPTIONS.find(o => o.value === form.objectiveTarget)?.label || form.objectiveTarget}</strong>
                          {' '}within <strong style={{ color: TEXT }}>{TIMELINE_OPTIONS.find(t => t.value === form.timeline)?.label}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
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
          <button onClick={() => step === 0 ? navigate(-1) : setStep(s => Math.max(0, s - 1))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '10px 20px', color: TEXT2,
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
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
