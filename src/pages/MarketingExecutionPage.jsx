import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ArrowLeft, Loader2, Zap, CheckCircle2,
  Calendar, DollarSign, Target, Globe, Mail, MessageSquare,
  ShoppingCart, Linkedin, Instagram, Youtube, BarChart2,
  Play, RefreshCw, Activity, TrendingUp, ChevronRight,
  AlertCircle, Clock, Send, MonitorPlay, Sparkles, History, X,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems, getContentItems, setItemStatus } from '../services/contentService'
import { WEBHOOK_URL } from '../config'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const CARD2   = '#211e14'
const BORDER  = 'rgba(255,255,255,0.07)'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'

const CHANNELS = [
  { key: 'meta',      label: 'Meta / Instagram', icon: <Instagram size={16}/>,    color: '#e1306c' },
  { key: 'linkedin',  label: 'LinkedIn',          icon: <Linkedin size={16}/>,     color: '#0a66c2' },
  { key: 'tiktok',   label: 'TikTok',            icon: <MonitorPlay size={16}/>,  color: '#ff0050' },
  { key: 'google',   label: 'Google / YouTube',  icon: <Youtube size={16}/>,      color: '#ff0000' },
  { key: 'email',    label: 'Email Marketing',   icon: <Mail size={16}/>,         color: '#10b981' },
  { key: 'sms',      label: 'SMS',               icon: <MessageSquare size={16}/>, color: '#6366f1' },
  { key: 'marketplace', label: 'Marketplace',    icon: <ShoppingCart size={16}/>, color: '#f59e0b' },
]

async function generateExecutionPlan(inputs) {
  const selectedChannels = inputs.channels.join(', ')
  const prompt = `You are a Marketing Execution Engine AI. Create a detailed campaign execution plan.

Campaign: ${inputs.campaignName}
Objective: ${inputs.objective}
Total Budget: ${inputs.budget}
Duration: ${inputs.duration}
Selected Channels: ${selectedChannels}
Target Audience: ${inputs.audience}
Launch Date: ${inputs.launchDate || 'ASAP'}

Return ONLY valid JSON:
{
  "executionSummary": "2-sentence execution overview",
  "scheduler": {
    "launchDate": "Recommended launch date",
    "phases": [
      { "phase": "Phase 1: Warm-up", "duration": "Week 1-2", "focus": "What happens", "budget": "20%" },
      { "phase": "Phase 2: Scale", "duration": "Week 3-6", "focus": "What happens", "budget": "60%" },
      { "phase": "Phase 3: Optimize", "duration": "Week 7-8", "focus": "What happens", "budget": "20%" }
    ],
    "bestPostTimes": { "weekdays": "Best posting time", "weekends": "Best weekend time" }
  },
  "budgetAllocation": {
    "total": "${inputs.budget}",
    "byChannel": [
      { "channel": "Meta / Instagram", "amount": "Allocated amount", "percentage": "35%", "expectedCPM": "$8-15", "expectedROAS": "2.8x" },
      { "channel": "LinkedIn", "amount": "Allocated amount", "percentage": "25%", "expectedCPM": "$30-60", "expectedROAS": "3.2x" },
      { "channel": "Google / YouTube", "amount": "Allocated amount", "percentage": "25%", "expectedCPM": "$5-12", "expectedROAS": "4.1x" },
      { "channel": "Email Marketing", "amount": "Allocated amount", "percentage": "15%", "expectedCPM": "$0.5-1.5", "expectedROAS": "8.5x" }
    ]
  },
  "audienceTargeting": {
    "primarySegment": "Primary audience description",
    "lookalike": "Lookalike audience strategy",
    "retargeting": "Retargeting pool description",
    "exclusions": "Who to exclude"
  },
  "channelPlan": {
    "meta": { "formats": ["Reel", "Carousel", "Story"], "frequency": "2x/day", "cta": "Primary CTA" },
    "linkedin": { "formats": ["Sponsored Post", "Document Ad"], "frequency": "1x/day", "cta": "Primary CTA" },
    "google": { "formats": ["Search", "Display", "YouTube Pre-roll"], "frequency": "Continuous", "cta": "Primary CTA" },
    "email": { "formats": ["Welcome", "Nurture", "Conversion"], "frequency": "2x/week", "cta": "Primary CTA" },
    "sms": { "formats": ["Promotional", "Reminder"], "frequency": "1x/week", "cta": "Primary CTA" }
  },
  "performanceKPIs": [
    { "metric": "Total Reach", "target": "500K+", "channel": "All" },
    { "metric": "Click-through Rate", "target": "3.5%", "channel": "Meta" },
    { "metric": "Cost per Lead", "target": "$20-35", "channel": "LinkedIn" },
    { "metric": "Email Open Rate", "target": "28%", "channel": "Email" },
    { "metric": "Conversion Rate", "target": "4.2%", "channel": "Google" },
    { "metric": "Overall ROAS", "target": "3.5x", "channel": "All" }
  ],
  "optimizationFeedback": {
    "weeklyChecks": ["Check 1", "Check 2", "Check 3"],
    "pauseTriggers": ["If CTR < 1% pause the ad set", "If CPC exceeds 2x target, reallocate budget"],
    "scalingTriggers": ["If ROAS > 4x, increase budget by 20%", "If CPL drops 30%, expand audience"]
  }
}`

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2200,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0])
}

// Maps an attribution recommendation's free-text channel name to a Channel Router key.
const matchChannelKey = (channelText = '') => {
  const t = channelText.toLowerCase()
  if (t.includes('sms')) return 'sms'
  if (t.includes('meta') || t.includes('instagram') || t.includes('facebook')) return 'meta'
  if (t.includes('linkedin')) return 'linkedin'
  if (t.includes('tiktok')) return 'tiktok'
  if (t.includes('google') || t.includes('youtube') || t.includes('search') || t.includes('display')) return 'google'
  if (t.includes('email')) return 'email'
  if (t.includes('marketplace')) return 'marketplace'
  return null
}

export default function MarketingExecutionPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [inputs, setInputs] = useState({
    campaignName: '', objective: '', budget: '', duration: '4 weeks',
    audience: '', launchDate: '', channels: ['meta', 'email', 'google'],
  })
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [activeTab, setActiveTab] = useState('scheduler')
  const [activated, setActivated] = useState(false)
  const [savedDocId, setSavedDocId] = useState(null)
  const [history, setHistory]     = useState([])
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched]   = useState(false)
  const [appliedRec, setAppliedRec] = useState(location.state?.applyRecommendation || null)

  const set = (k, v) => setInputs(p => ({ ...p, [k]: v }))
  const toggleChannel = (key) => {
    setInputs(p => ({
      ...p,
      channels: p.channels.includes(key) ? p.channels.filter(c => c !== key) : [...p.channels, key],
    }))
  }
  const ready = inputs.campaignName && inputs.objective && inputs.budget && inputs.channels.length > 0

  const loadHistory = async () => {
    if (!user?.uid) return
    try {
      const items = await getContentItems(user.uid)
      setHistory(items.filter(i => i.campaignType === 'marketing_execution').slice(0, 5))
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user?.uid])

  // Coming from Marketing Attribution's "Apply in Marketing Execution" — pre-fill the
  // objective and the recommended channel so the user doesn't retype the recommendation.
  useEffect(() => {
    const rec = location.state?.applyRecommendation
    if (!rec) return
    setInputs(p => ({
      ...p,
      objective: p.objective || rec.action || '',
      channels: matchChannelKey(rec.channel) && !p.channels.includes(matchChannelKey(rec.channel))
        ? [...p.channels, matchChannelKey(rec.channel)]
        : p.channels,
    }))
    window.history.replaceState({}, document.title)
  }, [])

  const handleActivate = async () => {
    if (!ready) return
    setLoading(true)
    setError('')
    setResult(null)
    setActivated(false)
    setSavedDocId(null)
    setLaunched(false)
    try {
      const r = await generateExecutionPlan(inputs)
      setResult(r)
      setActiveTab('scheduler')
      try {
        const ids = await saveContentItems(
          user?.uid,
          { name: inputs.campaignName, type: 'marketing_execution', source: 'campaign' },
          [{ key: 'output', type: 'strategy', platform: '', text: r.executionSummary, data: JSON.stringify(r) }],
          'draft'
        )
        setSavedDocId(ids['output'] || null)
        loadHistory()
      } catch {}
    } catch {
      setError('Execution plan generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLaunch = async () => {
    if (!result) return
    setLaunching(true)
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketing_execution',
          campaignName: inputs.campaignName,
          channels: inputs.channels,
          budget: inputs.budget,
          audience: inputs.audience,
          launchDate: inputs.launchDate,
          plan: result,
          userId: user?.uid,
        }),
      })
    } catch {}
    try {
      if (savedDocId) await setItemStatus(savedDocId, 'published')
    } catch {}
    await loadHistory()
    setLaunched(true)
    setLaunching(false)
  }

  const inputStyle = { width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const tabBtn = (key) => ({ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: activeTab === key ? GOLD : 'transparent', color: activeTab === key ? '#0e0c09' : TEXT2, transition: 'all 0.15s' })
  const label = { fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }

  const DURATIONS = ['1 week', '2 weeks', '4 weeks', '6 weeks', '2 months', '3 months', '6 months']
  const TARGET_AUDIENCES = ['Marketing Managers', 'CMOs & Marketing Leaders', 'Small Business Owners', 'Startup Founders', 'E-Commerce Brands', 'B2B Decision Makers', 'Sales Professionals', 'Product Managers', 'Entrepreneurs', 'Enterprise Teams', 'Agency Clients', 'General Consumers']

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '36px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rocket size={22} color={GOLD} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Marketing Execution</h1>
              <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>Fig. 20 · Marketing Execution Engine — Channel Router, Activation & Performance Monitoring</p>
            </div>
          </div>
        </div>

        {appliedRec && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <Zap size={16} color={GOLD} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Applied from Marketing Attribution</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>{appliedRec.action} {appliedRec.impact ? `— expected ${appliedRec.impact}` : ''}</div>
            </div>
            <button onClick={() => setAppliedRec(null)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Engine Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <Calendar size={18}/>, label: 'Scheduler Module', desc: 'Launch timing & content calendar', color: '#c8973e' },
            { icon: <DollarSign size={18}/>, label: 'Budget Allocation', desc: 'Distribute spend across channels', color: '#10b981' },
            { icon: <Target size={18}/>, label: 'Audience Targeting', desc: 'Segment, lookalike & retargeting', color: '#6366f1' },
          ].map(m => (
            <div key={m.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ color: m.color, marginBottom: 10 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Campaign Setup */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Campaign details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={label}>Campaign name *</label>
              <input value={inputs.campaignName} onChange={e => set('campaignName', e.target.value)} placeholder="e.g. Q3 Lead Gen Push" style={inputStyle} />
            </div>
            <div>
              <label style={label}>Campaign objective *</label>
              <input value={inputs.objective} onChange={e => set('objective', e.target.value)} placeholder="e.g. Generate 500 qualified leads" style={inputStyle} />
            </div>
            <div>
              <label style={label}>Total budget *</label>
              <input value={inputs.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. $10,000" style={inputStyle} />
            </div>
            <div>
              <label style={label}>Duration</label>
              <select value={inputs.duration} onChange={e => set('duration', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Target audience</label>
              <select value={inputs.audience} onChange={e => set('audience', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select target audience...</option>
                {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Launch date</label>
              <input type="date" value={inputs.launchDate} onChange={e => set('launchDate', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Channel Router */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Channel Router</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: TEXT2 }}>Select channels for campaign distribution</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
              {CHANNELS.map(ch => {
                const active = inputs.channels.includes(ch.key)
                return (
                  <button key={ch.key} onClick={() => toggleChannel(ch.key)} style={{
                    background: active ? `${ch.color}15` : CARD2,
                    border: `1px solid ${active ? ch.color + '50' : BORDER}`,
                    borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ color: active ? ch.color : TEXT3 }}>{ch.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: active ? TEXT : TEXT2 }}>{ch.label}</span>
                    {active && <CheckCircle2 size={13} color={ch.color} style={{ marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Campaign Activation */}
        <div style={{ background: CARD, border: `1px solid ${GBORDER}`, borderRadius: 16, padding: 22, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Campaign Activation</h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: TEXT2 }}>
            {inputs.channels.length} channel{inputs.channels.length !== 1 ? 's' : ''} selected
            {inputs.campaignName ? ` · "${inputs.campaignName}"` : ''}
          </p>
          <button onClick={handleActivate} disabled={loading || !ready} style={{
            background: !ready ? 'rgba(200,151,62,0.3)' : GOLD,
            color: '#0e0c09', border: 'none', borderRadius: 12, padding: '14px 48px',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
          }}>
            {loading
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Building execution plan...</>
              : <><Rocket size={18} /> Activate Campaign</>}
          </button>
          {!ready && <div style={{ marginTop: 10, fontSize: 12, color: TEXT3 }}>Fill in campaign name, objective, budget and select at least one channel</div>}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', marginBottom: 20, fontSize: 14 }}>{error}</div>}

        {/* Performance Monitoring */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Stat row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 12 }}>
                {savedDocId && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
                    <CheckCircle2 size={14} color="#10b981" /> Saved to history
                  </span>
                )}
                <span style={{ color: TEXT2 }}>{inputs.channels.length} channel{inputs.channels.length !== 1 ? 's' : ''} selected</span>
              </div>

              {/* Launch success banner */}
              {launched && (
                <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>Campaign launched to n8n — check your connected channels</span>
                </div>
              )}

              {/* Summary */}
              <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 14, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={20} color="#10b981" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 2 }}>Execution plan ready</div>
                  <div style={{ fontSize: 13, color: TEXT2 }}>{result.executionSummary}</div>
                </div>
                <button onClick={handleLaunch} disabled={launching || launched} style={{
                  background: launched ? 'rgba(16,185,129,0.15)' : GOLD,
                  color: launched ? '#10b981' : '#0e0c09',
                  border: launched ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  borderRadius: 20, padding: '9px 20px', fontSize: 13, fontWeight: 700,
                  cursor: launching || launched ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'all 0.2s',
                }}>
                  {launching
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Launching...</>
                    : launched
                      ? <><CheckCircle2 size={14} /> Launched</>
                      : <><Send size={14} /> Launch Campaign</>}
                </button>
              </div>

              {/* Tabs */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                  {[
                    { key: 'scheduler', label: 'Scheduler',          icon: <Calendar size={13}/> },
                    { key: 'budget',    label: 'Budget Allocation',  icon: <DollarSign size={13}/> },
                    { key: 'targeting', label: 'Audience Targeting', icon: <Target size={13}/> },
                    { key: 'kpis',      label: 'Performance KPIs',   icon: <BarChart2 size={13}/> },
                    { key: 'optimize',  label: 'Optimization',       icon: <TrendingUp size={13}/> },
                  ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{t.icon}{t.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ padding: 20 }}>

                  {/* Scheduler */}
                  {activeTab === 'scheduler' && result.scheduler && (
                    <div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: CARD2, borderRadius: 10, padding: '10px 16px', flex: 1 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>LAUNCH DATE</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: GOLD }}>{result.scheduler.launchDate}</div>
                        </div>
                        <div style={{ background: CARD2, borderRadius: 10, padding: '10px 16px', flex: 1 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>WEEKDAYS</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{result.scheduler.bestPostTimes?.weekdays}</div>
                        </div>
                        <div style={{ background: CARD2, borderRadius: 10, padding: '10px 16px', flex: 1 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>WEEKENDS</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{result.scheduler.bestPostTimes?.weekends}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(result.scheduler.phases || []).map((ph, i) => (
                          <div key={i} style={{ background: CARD2, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{ph.phase}</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: TEXT3 }}>{ph.duration}</span>
                                  <span style={{ fontSize: 11, background: GDIM, borderRadius: 20, padding: '1px 8px', color: GOLD }}>{ph.budget} budget</span>
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: TEXT2 }}>{ph.focus}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget Allocation */}
                  {activeTab === 'budget' && result.budgetAllocation && (
                    <div>
                      <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: TEXT2 }}>Total campaign budget</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{result.budgetAllocation.total}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(result.budgetAllocation.byChannel || []).map((b, i) => (
                          <div key={i} style={{ background: CARD2, borderRadius: 12, padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{b.channel}</span>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <span style={{ fontSize: 12, color: TEXT2 }}>CPM: <span style={{ color: TEXT }}>{b.expectedCPM}</span></span>
                                <span style={{ fontSize: 12, color: TEXT2 }}>ROAS: <span style={{ color: '#10b981' }}>{b.expectedROAS}</span></span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{b.percentage}</span>
                              </div>
                            </div>
                            <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: b.percentage }} />
                            </div>
                            <div style={{ marginTop: 4, fontSize: 12, color: TEXT3 }}>{b.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audience Targeting */}
                  {activeTab === 'targeting' && result.audienceTargeting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Primary Segment',  value: result.audienceTargeting.primarySegment,  color: GOLD },
                        { label: 'Lookalike',         value: result.audienceTargeting.lookalike,        color: '#6366f1' },
                        { label: 'Retargeting',       value: result.audienceTargeting.retargeting,      color: '#10b981' },
                        { label: 'Exclusions',        value: result.audienceTargeting.exclusions,       color: '#ef4444' },
                      ].map(t => (
                        <div key={t.label} style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
                          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{t.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* KPIs */}
                  {activeTab === 'kpis' && result.performanceKPIs && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {result.performanceKPIs.map((kpi, i) => (
                        <div key={i} style={{ background: CARD2, borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>{kpi.channel}</div>
                          <div style={{ fontSize: 12, color: TEXT2, marginBottom: 6 }}>{kpi.metric}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{kpi.target}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimization Feedback */}
                  {activeTab === 'optimize' && result.optimizationFeedback && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 10 }}>Weekly checks</div>
                        {result.optimizationFeedback.weeklyChecks?.map((c, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: TEXT2, padding: '5px 0', borderBottom: i < result.optimizationFeedback.weeklyChecks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            <Activity size={13} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />{c}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 10 }}>Pause triggers</div>
                          {result.optimizationFeedback.pauseTriggers?.map((t, i) => (
                            <div key={i} style={{ fontSize: 12, color: TEXT2, padding: '4px 0' }}>• {t}</div>
                          ))}
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 10 }}>Scaling triggers</div>
                          {result.optimizationFeedback.scalingTriggers?.map((t, i) => (
                            <div key={i} style={{ fontSize: 12, color: TEXT2, padding: '4px 0' }}>• {t}</div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <RefreshCw size={16} color={GOLD} />
                        <div style={{ fontSize: 13, color: TEXT2 }}>Optimization feedback loops back to the Marketing Execution Engine automatically after each weekly review.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={handleActivate} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 22px', color: TEXT2, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={13} /> Regenerate Plan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Generations */}
        {history.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <History size={15} color={GOLD} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Generations</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(item => (
                <div key={item.id} style={{ background: CARD2, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${BORDER}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{item.campaignName || '—'}</div>
                    <div style={{ fontSize: 11, color: TEXT3 }}>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, borderRadius: 20, padding: '2px 10px', fontWeight: 500, background: item.status === 'published' ? 'rgba(16,185,129,0.12)' : GDIM, color: item.status === 'published' ? '#10b981' : GOLD, border: `1px solid ${item.status === 'published' ? 'rgba(16,185,129,0.25)' : GBORDER}` }}>{item.status}</span>
                  <button onClick={() => { try { setResult(JSON.parse(item.data)); setActiveTab('scheduler') } catch {} }} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: GOLD, cursor: 'pointer', fontWeight: 500 }}>Load</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
