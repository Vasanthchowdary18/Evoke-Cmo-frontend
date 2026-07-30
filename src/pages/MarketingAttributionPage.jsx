import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Sparkles, TrendingUp, MessageSquare,
  Megaphone, Share2, FileText, DollarSign, Target, Users,
  BarChart2, RefreshCw, CheckCircle2, Zap, Eye,
  MousePointer, ShoppingCart, Activity,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { getGoogleAdsMetrics } from '../services/googleAdsService'
import { getContacts } from '../services/crmService'

const BG     = '#0a0907'
const CARD   = '#131109'
const CARD2  = '#181510'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = 'rgba(255,255,255,0.06)'
const GREEN  = '#10b981'
const BLUE   = '#3b82f6'
const PURPLE = '#a855f7'
const RED    = '#ef4444'

const CHANNELS = [
  { key: 'sms',      label: 'SMS',          icon: <MessageSquare size={14}/>, color: GREEN,  desc: 'Text campaigns' },
  { key: 'paid_ads', label: 'Paid Ads',     icon: <Megaphone size={14}/>,     color: RED,    desc: 'Google & Meta' },
  { key: 'social',   label: 'Social',       icon: <Share2 size={14}/>,        color: BLUE,   desc: 'Organic posts' },
  { key: 'posts',    label: 'Content',      icon: <FileText size={14}/>,      color: PURPLE, desc: 'Blog & email' },
]

const MODELS = [
  { key: 'last_touch',  label: 'Last Touch',  short: 'Last' },
  { key: 'first_touch', label: 'First Touch', short: 'First' },
  { key: 'linear',      label: 'Linear',      short: 'Linear' },
  { key: 'time_decay',  label: 'Time Decay',  short: 'Decay' },
  { key: 'data_driven', label: 'Data-Driven', short: 'AI' },
]

const MODEL_DESC = {
  last_touch:  '100% credit to the last channel before conversion',
  first_touch: '100% credit to the first channel that acquired the lead',
  linear:      'Equal credit distributed across all touchpoints',
  time_decay:  'More credit to channels closer to the conversion event',
  data_driven: 'AI assigns credit based on actual measured impact',
}

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 6 months', 'This year']

async function generateAttribution(inputs, realData) {
  const realDataBlock = (realData?.googleAds || realData?.crm)
    ? `

REAL CONNECTED-ACCOUNT DATA — use these numbers exactly, do not invent different figures for anything listed here:
${realData.googleAds ? `- Google Ads (last 30 days, from the user's connected account): spend $${realData.googleAds.spend.toFixed(2)}, ${realData.googleAds.clicks} clicks, ${realData.googleAds.conversions} conversions, ROAS ${realData.googleAds.roas.toFixed(1)}x. Use this as the real basis for the "Paid Ads" channel's spend/conversions/roas — you may still estimate revenue and attributionShare from it, but do not contradict these real figures.` : '- Google Ads: not connected, no real spend data available for Paid Ads — estimate as before.'}
${realData.crm ? `- CRM (real contact records): ${realData.crm.total} total contacts, ${realData.crm.leads} at lead stage, ${realData.crm.prospects} at prospect stage, ${realData.crm.customers} converted to customer or retained. Use ${realData.crm.total} as a grounding signal for total leads/reach, and ${realData.crm.customers} as a grounding signal for total conversions — keep summary.totalLeads and summary.totalLeads/conversion figures consistent with this real data rather than inventing unrelated numbers.` : '- CRM: no contacts recorded yet — estimate total leads as before.'}

For any channel or metric NOT covered by the real data above (SMS, Social, Content, funnel awareness/consideration/intent, touchpoint journey timing), continue estimating realistically as usual.`
    : ''

  const prompt = `You are a marketing analytics expert. Generate a realistic marketing attribution analysis for:
- Brand: ${inputs.brand}
- Campaign Goal: ${inputs.goal}
- Time Period: ${inputs.period}
- Attribution Model: ${inputs.model}
- Active Channels: ${inputs.channels.join(', ')}
- Total Budget: $${inputs.budget}
${realDataBlock}

Return ONLY valid JSON with this structure:
{
  "summary": {
    "totalRevenue": "$125,400",
    "totalLeads": 847,
    "avgCAC": "$42.30",
    "roas": "3.8x",
    "topChannel": "SMS Marketing",
    "conversionRate": "4.2%"
  },
  "channels": [
    {
      "channel": "SMS Marketing",
      "key": "sms",
      "spend": "$8,200",
      "revenue": "$38,500",
      "leads": 312,
      "conversions": 89,
      "roas": "4.7x",
      "cac": "$92.13",
      "attributionShare": 30.7,
      "touchpoints": 1240,
      "avgPosition": "Last",
      "trend": "up",
      "insight": "SMS has highest close rate — 28.5% of leads convert"
    }
  ],
  "funnel": {
    "awareness": 15420,
    "consideration": 4231,
    "intent": 1847,
    "conversion": 847,
    "retention": 612
  },
  "touchpointJourney": [
    { "step": 1, "channel": "Paid Ads", "avgTime": "Day 1", "action": "First brand exposure via Google Search ad" },
    { "step": 2, "channel": "Social Media", "avgTime": "Day 3", "action": "Retargeted via Instagram Story" },
    { "step": 3, "channel": "Content Posts", "avgTime": "Day 6", "action": "Read comparison blog post" },
    { "step": 4, "channel": "SMS Marketing", "avgTime": "Day 9", "action": "Promo SMS triggered conversion" }
  ],
  "recommendations": [
    { "priority": "high", "channel": "SMS Marketing", "action": "Increase SMS frequency by 20% — highest ROI channel", "impact": "+$12,400 revenue" },
    { "priority": "medium", "channel": "Paid Ads", "action": "Shift 15% budget from Google Display to Meta Retargeting", "impact": "+8% ROAS" },
    { "priority": "low", "channel": "Social Media", "action": "Add video content — video posts get 3x more attribution weight", "impact": "+18% awareness" }
  ]
}`

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2500,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0])
}

export default function MarketingAttributionPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inputs, setInputs]       = useState({ brand: '', goal: '', period: 'Last 30 days', model: 'data_driven', budget: '', channels: ['sms', 'paid_ads', 'social', 'posts'] })
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [groundedIn, setGroundedIn] = useState(null) // { googleAds: bool, crm: bool } for the last run

  async function fetchRealData() {
    const [googleAdsRaw, contacts] = await Promise.all([
      getGoogleAdsMetrics(user.uid).catch(() => null),
      getContacts(user.uid).catch(() => []),
    ])
    const googleAds = googleAdsRaw && googleAdsRaw.spend > 0 ? googleAdsRaw : null
    const crm = contacts.length > 0
      ? {
          total: contacts.length,
          leads: contacts.filter(c => c.stage === 'lead').length,
          prospects: contacts.filter(c => c.stage === 'prospect').length,
          customers: contacts.filter(c => c.stage === 'customer' || c.stage === 'retained').length,
        }
      : null
    return { googleAds, crm }
  }

  const toggleChannel = (key) => {
    setInputs(p => ({
      ...p,
      channels: p.channels.includes(key) ? p.channels.filter(c => c !== key) : [...p.channels, key],
    }))
  }

  const handleGenerate = async () => {
    if (!inputs.brand || !inputs.goal || inputs.channels.length === 0) return
    setLoading(true); setError(''); setResult(null)
    try {
      const realData = await fetchRealData()
      const r = await generateAttribution(inputs, realData)
      setResult(r); setActiveTab('overview')
      setGroundedIn({ googleAds: !!realData.googleAds, crm: !!realData.crm })
    } catch {
      setError('Attribution analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', background: CARD2, border: `1px solid ${BORDER}`,
    borderRadius: 9, color: TEXT, fontSize: 13, padding: '9px 12px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const tabBtn = (key) => ({
    padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none',
    background: activeTab === key ? GOLD : 'transparent',
    color: activeTab === key ? '#0a0907' : TEXT2,
    transition: 'all 0.15s',
  })

  const channelMap = { sms: GREEN, paid_ads: RED, social: BLUE, posts: PURPLE }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 80px' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 22 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, marginBottom: 14, padding: 0 }}>
              <ArrowLeft size={13}/> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: GDIM, border: `1px solid ${GBORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color={GOLD}/>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Marketing Attribution Model</h1>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 5, padding: '3px 7px' }}>AI Estimate</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: TEXT2 }}>Track revenue & conversions across SMS, Paid Ads, Social & Content</p>
              </div>
            </div>
            <div style={{ marginTop: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>
              {!groundedIn && 'Most figures here are AI-generated estimates. Paid Ads and lead totals will use your real connected Google Ads and CRM data automatically if you have them connected — everything else (SMS, Social, Content, funnel, journey) is always modeled, not measured.'}
              {groundedIn && (groundedIn.googleAds || groundedIn.crm) && (
                <>This run is grounded in your real {[groundedIn.googleAds && 'Google Ads', groundedIn.crm && 'CRM'].filter(Boolean).join(' and ')} data for Paid Ads spend/ROAS and lead totals. Everything else (SMS, Social, Content, funnel, journey) is still an AI estimate, not measured.</>
              )}
              {groundedIn && !groundedIn.googleAds && !groundedIn.crm && (
                <>No connected Google Ads account or CRM contacts were found, so every figure in this run is an AI estimate. Connect Google Ads and add CRM contacts for real Paid Ads and lead numbers next time.</>
              )}
            </div>
          </div>

          {/* ── Compact Config Panel ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>

            {/* Row 1: Brand + Goal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Brand / Business *</div>
                <input style={inp} placeholder="e.g. EvoX AI" value={inputs.brand} onChange={e => setInputs(p => ({ ...p, brand: e.target.value }))}/>
              </div>
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Campaign Goal *</div>
                <input style={inp} placeholder="e.g. Drive 500 sign-ups" value={inputs.goal} onChange={e => setInputs(p => ({ ...p, goal: e.target.value }))}/>
              </div>
            </div>

            {/* Row 2: Budget + Period */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Total Budget (USD)</div>
                <input style={inp} type="number" placeholder="e.g. 25000" value={inputs.budget} onChange={e => setInputs(p => ({ ...p, budget: e.target.value }))}/>
              </div>
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Time Period</div>
                <select style={{ ...inp, cursor: 'pointer' }} value={inputs.period} onChange={e => setInputs(p => ({ ...p, period: e.target.value }))}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: BORDER, marginBottom: 16 }}/>

            {/* Row 3: Attribution Model pills + Channel toggles side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Attribution Model */}
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Attribution Model</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {MODELS.map(m => {
                    const active = inputs.model === m.key
                    return (
                      <button key={m.key} onClick={() => setInputs(p => ({ ...p, model: m.key }))} style={{
                        padding: '5px 12px', borderRadius: 100, cursor: 'pointer',
                        background: active ? GOLD : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? GOLD : BORDER}`,
                        color: active ? '#0a0907' : TEXT2,
                        fontSize: 11, fontWeight: active ? 700 : 500,
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}>
                        {m.label}
                      </button>
                    )
                  })}
                </div>
                {/* Selected model description */}
                <div style={{ fontSize: 11, color: TEXT3, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px', lineHeight: 1.5 }}>
                  {MODEL_DESC[inputs.model]}
                </div>
              </div>

              {/* Active Channels — 2×2 grid */}
              <div>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Active Channels</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  {CHANNELS.map(ch => {
                    const active = inputs.channels.includes(ch.key)
                    return (
                      <button key={ch.key} onClick={() => toggleChannel(ch.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: active ? `${ch.color}12` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? ch.color + '50' : BORDER}`,
                        borderRadius: 9, padding: '8px 10px', cursor: 'pointer',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}>
                        <div style={{ color: active ? ch.color : TEXT3, flexShrink: 0, display: 'flex' }}>{ch.icon}</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: active ? TEXT : TEXT2 }}>{ch.label}</div>
                          <div style={{ fontSize: 10, color: TEXT3 }}>{ch.desc}</div>
                        </div>
                        {active && <CheckCircle2 size={12} color={ch.color} style={{ flexShrink: 0 }}/>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: BORDER, margin: '18px 0 16px' }}/>

            {/* Run button + error */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleGenerate}
                disabled={loading || !inputs.brand || !inputs.goal || inputs.channels.length === 0}
                style={{
                  background: (!inputs.brand || !inputs.goal) ? 'rgba(200,151,62,0.3)' : GOLD,
                  color: '#0a0907', border: 'none', borderRadius: 10, padding: '11px 24px',
                  fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}>
                {loading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> Analysing…</>
                  : <><Sparkles size={14}/> Run Attribution Analysis</>}
              </button>
              {error && (
                <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── Results ── */}
          {!result && !loading && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '50px 40px', textAlign: 'center' }}>
              <Activity size={36} color={TEXT3} style={{ marginBottom: 14 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Attribution Analysis Ready</div>
              <div style={{ fontSize: 12, color: TEXT3, lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
                Fill in your campaign details above, then click <strong style={{ color: TEXT2 }}>Run Attribution Analysis</strong> to see how each channel contributes to your conversions.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '50px 40px', textAlign: 'center' }}>
              <Loader2 size={32} color={GOLD} style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }}/>
              <div style={{ fontSize: 13, color: TEXT2 }}>Running AI attribution analysis…</div>
              <div style={{ fontSize: 11, color: TEXT3, marginTop: 5 }}>Calculating channel weights & revenue contribution</div>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* ── KPI row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: <DollarSign size={13}/>, label: 'Revenue',     value: result.summary?.totalRevenue,   color: GOLD   },
                    { icon: <Users size={13}/>,      label: 'Leads',       value: result.summary?.totalLeads,     color: BLUE   },
                    { icon: <TrendingUp size={13}/>, label: 'ROAS',        value: result.summary?.roas,           color: GREEN  },
                    { icon: <Target size={13}/>,     label: 'Avg. CAC',    value: result.summary?.avgCAC,         color: PURPLE },
                    { icon: <MousePointer size={13}/>,label:'Conv. Rate',  value: result.summary?.conversionRate, color: RED    },
                    { icon: <Zap size={13}/>,        label: 'Top Channel', value: result.summary?.topChannel,     color: GOLD   },
                  ].map(s => (
                    <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '12px 14px' }}>
                      <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 2 }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* ── Tabbed results ── */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { key: 'overview',  label: 'Channel Overview' },
                        { key: 'funnel',    label: 'Funnel' },
                        { key: 'journey',   label: 'Journey' },
                        { key: 'recommend', label: 'Recommendations' },
                      ].map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>{t.label}</button>)}
                    </div>
                    <button onClick={handleGenerate} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 12px', color: TEXT3, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                      <RefreshCw size={11}/> Regenerate
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>

                    {/* Channel Overview */}
                    {activeTab === 'overview' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(result.channels || []).map((ch, i) => {
                          const color = channelMap[ch.key] || GOLD
                          return (
                            <motion.div key={ch.channel} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                              style={{ background: CARD2, borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                                    {CHANNELS.find(c => c.key === ch.key)?.icon || <Activity size={14}/>}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{ch.channel}</div>
                                    <div style={{ fontSize: 10, color: TEXT3 }}>Avg position: {ch.avgPosition} touch</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{ch.attributionShare}%</div>
                                  <div style={{ fontSize: 9, color: TEXT3 }}>attribution</div>
                                </div>
                              </div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${ch.attributionShare}%` }} transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                                  style={{ height: '100%', background: `linear-gradient(90deg,${color},${color}80)`, borderRadius: 2 }}/>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                {[
                                  { label: 'Spend',       value: ch.spend },
                                  { label: 'Revenue',     value: ch.revenue },
                                  { label: 'ROAS',        value: ch.roas },
                                  { label: 'CAC',         value: ch.cac },
                                  { label: 'Leads',       value: ch.leads },
                                  { label: 'Conversions', value: ch.conversions },
                                  { label: 'Touchpoints', value: ch.touchpoints },
                                  { label: 'Trend',       value: ch.trend === 'up' ? '↑ Up' : '↓ Down', c: ch.trend === 'up' ? GREEN : RED },
                                ].map(m => (
                                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 7, padding: '6px 9px' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: m.c || TEXT }}>{m.value}</div>
                                    <div style={{ fontSize: 9, color: TEXT3 }}>{m.label}</div>
                                  </div>
                                ))}
                              </div>
                              {ch.insight && (
                                <div style={{ marginTop: 8, padding: '6px 10px', background: `${color}0a`, border: `1px solid ${color}20`, borderRadius: 7, fontSize: 11, color: TEXT2 }}>
                                  💡 {ch.insight}
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                    {/* Funnel */}
                    {activeTab === 'funnel' && result.funnel && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, color: TEXT2, marginBottom: 6 }}>Customer funnel across all channels</div>
                        {[
                          { key: 'awareness',     label: 'Awareness',     icon: <Eye size={13}/>,          color: '#6366f1' },
                          { key: 'consideration', label: 'Consideration', icon: <BarChart2 size={13}/>,    color: BLUE },
                          { key: 'intent',        label: 'Intent',        icon: <Target size={13}/>,       color: GOLD },
                          { key: 'conversion',    label: 'Conversion',    icon: <ShoppingCart size={13}/>, color: GREEN },
                          { key: 'retention',     label: 'Retention',     icon: <Activity size={13}/>,     color: PURPLE },
                        ].map((stage, i) => {
                          const val = result.funnel[stage.key] || 0
                          const max = result.funnel.awareness || 1
                          const pct = Math.round((val / max) * 100)
                          return (
                            <div key={stage.key} style={{ background: CARD2, borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${stage.color}14`, border: `1px solid ${stage.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stage.color, flexShrink: 0 }}>{stage.icon}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{stage.label}</span>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: stage.color }}>{val.toLocaleString()}</span>
                                </div>
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.08, duration: 0.6 }}
                                    style={{ height: '100%', background: stage.color, borderRadius: 2 }}/>
                                </div>
                                <div style={{ fontSize: 9, color: TEXT3, marginTop: 3 }}>{pct}% of awareness reach</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Journey */}
                    {activeTab === 'journey' && result.touchpointJourney && (
                      <div>
                        <div style={{ fontSize: 12, color: TEXT2, marginBottom: 14 }}>Average customer journey from first touch to conversion</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {result.touchpointJourney.map((tp, i) => {
                            const chInfo = CHANNELS.find(c => c.label.toLowerCase().includes(tp.channel.toLowerCase().split(' ')[0]))
                            const color = chInfo ? channelMap[chInfo.key] : GOLD
                            return (
                              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < result.touchpointJourney.length - 1 ? 18 : 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color, zIndex: 1 }}>{tp.step}</div>
                                  {i < result.touchpointJourney.length - 1 && <div style={{ width: 2, flex: 1, background: `linear-gradient(${color},rgba(255,255,255,0.04))`, marginTop: 3 }}/>}
                                </div>
                                <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{tp.channel}</span>
                                    <span style={{ fontSize: 9, color: TEXT3, background: BORDER, borderRadius: 4, padding: '1px 6px' }}>{tp.avgTime}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: TEXT2 }}>{tp.action}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {activeTab === 'recommend' && result.recommendations && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, color: TEXT2, marginBottom: 4 }}>AI-powered recommendations to optimise attribution & spend</div>
                        {result.recommendations.map((rec, i) => {
                          const pc = rec.priority === 'high' ? RED : rec.priority === 'medium' ? GOLD : BLUE
                          return (
                            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                              style={{ background: CARD2, borderRadius: 12, padding: '14px 16px', border: `1px solid ${pc}20`, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: pc, borderRadius: '12px 0 0 12px' }}/>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <span style={{ fontSize: 8, fontWeight: 800, color: pc, background: `${pc}14`, border: `1px solid ${pc}28`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rec.priority}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{rec.channel}</span>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{rec.impact}</span>
                              </div>
                              <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>{rec.action}</div>
                              <button
                                onClick={() => navigate('/execution', { state: { applyRecommendation: rec } })}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6, background: `${pc}14`,
                                  border: `1px solid ${pc}30`, borderRadius: 8, padding: '6px 12px',
                                  color: pc, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                <Zap size={12}/> Apply in Marketing Execution
                              </button>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
