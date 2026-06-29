import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, ArrowLeft, Loader2, Sparkles, Copy, Check,
  Globe, Package, DollarSign, MapPin, Target, BarChart2,
  Users, Calendar, Lightbulb, RefreshCw, ChevronRight,
  Download, Zap, BookOpen, History, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems, getContentItems } from '../services/contentService'

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

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const INDUSTRIES = [
  'Technology & SaaS', 'E-commerce & Retail', 'Marketing & Advertising',
  'Health & Wellness', 'Finance & Fintech', 'Education & EdTech',
  'Real Estate', 'Food & Beverage', 'Fashion & Lifestyle', 'Events & Entertainment',
  'Manufacturing', 'Professional Services',
]

const PRICING_MODELS = [
  'SaaS / Subscription', 'Freemium', 'One-time Purchase', 'Usage-based / Pay-as-you-go',
  'Enterprise / Custom Pricing', 'E-commerce / Product Sales', 'Service / Retainer',
  'Marketplace / Commission', 'Tiered Pricing', 'Licence-based',
]

const GEO_MARKETS = [
  'India', 'Southeast Asia (SEA)', 'Global', 'USA & Canada', 'Europe (EU)',
  'Middle East & Africa (MEA)', 'Asia Pacific (APAC)', 'Latin America (LATAM)',
  'UK & Ireland', 'Australia & New Zealand',
]

const DEMOGRAPHICS = [
  'B2B — Enterprise / C-Suite', 'B2B — SMBs & Startups', 'B2B — Marketing Teams',
  'B2C — Gen Z (18–28)', 'B2C — Millennials (25–40)', 'B2C — Gen X (40–55)',
  'D2C — Health & Wellness', 'D2C — Fashion & Lifestyle',
  'Professionals (35–55)', 'Small Business Owners',
]

const REVENUE_TARGETS = [
  'Under $10K',
  '$10K – $50K',
  '$50K – $100K',
  '$100K – $500K',
  '$500K – $2.5M',
  '$2.5M – $10M',
  '$10M+',
]

async function generateStrategy(inputs) {
  const prompt = `You are a Chief Marketing Officer AI system. Generate a comprehensive marketing strategy.

Business Profile:
- Industry: ${inputs.industry}
- Product/Service: ${inputs.product}
- Pricing Model: ${inputs.pricing}
- Geographic Market: ${inputs.geoMarket}
- Main Competitor: ${inputs.competitor}
- Revenue Target: ${inputs.revenueTarget}
- Demographics: ${inputs.demographics}

Return ONLY valid JSON:
{
  "executiveSummary": "2-sentence strategic overview",
  "annualPlan": {
    "title": "Annual Marketing Plan",
    "objective": "Primary annual objective",
    "budget": "Recommended annual budget allocation",
    "topChannels": ["Channel 1", "Channel 2", "Channel 3"],
    "keyInitiatives": ["Initiative 1", "Initiative 2", "Initiative 3", "Initiative 4"],
    "expectedROI": "3.2x"
  },
  "quarterlyPlan": [
    { "quarter": "Q1", "focus": "Quarter focus theme", "budget": "25%", "activities": ["Activity 1", "Activity 2", "Activity 3"], "kpi": "Primary KPI target" },
    { "quarter": "Q2", "focus": "Quarter focus theme", "budget": "30%", "activities": ["Activity 1", "Activity 2", "Activity 3"], "kpi": "Primary KPI target" },
    { "quarter": "Q3", "focus": "Quarter focus theme", "budget": "25%", "activities": ["Activity 1", "Activity 2", "Activity 3"], "kpi": "Primary KPI target" },
    { "quarter": "Q4", "focus": "Quarter focus theme", "budget": "20%", "activities": ["Activity 1", "Activity 2", "Activity 3"], "kpi": "Primary KPI target" }
  ],
  "monthlyPlan": {
    "cadence": "Monthly execution rhythm description",
    "contentVolume": "X posts/month across channels",
    "reviewCycle": "Monthly review focus areas",
    "optimizationTriggers": ["Trigger 1", "Trigger 2"]
  },
  "campaignRecommendations": [
    { "name": "Campaign name", "type": "Brand Awareness", "platform": "Meta + Google", "budget": "30% of total", "expectedReach": "500K", "timeline": "Q1–Q2", "priority": "high" },
    { "name": "Campaign name", "type": "Lead Generation", "platform": "LinkedIn", "budget": "25% of total", "expectedReach": "80K", "timeline": "Q2", "priority": "high" },
    { "name": "Campaign name", "type": "Retargeting", "platform": "Meta", "budget": "15% of total", "expectedReach": "50K", "timeline": "Q3", "priority": "medium" },
    { "name": "Campaign name", "type": "Retention", "platform": "Email", "budget": "10% of total", "expectedReach": "20K", "timeline": "Ongoing", "priority": "medium" }
  ],
  "budgetRecommendations": {
    "totalBudget": "Recommended total",
    "breakdown": [
      { "channel": "Paid Social (Meta/LinkedIn)", "allocation": "35%", "rationale": "Brief reason" },
      { "channel": "Search (Google/SEO)", "allocation": "25%", "rationale": "Brief reason" },
      { "channel": "Content & Creative", "allocation": "20%", "rationale": "Brief reason" },
      { "channel": "Email & CRM", "allocation": "10%", "rationale": "Brief reason" },
      { "channel": "Events & Partnerships", "allocation": "10%", "rationale": "Brief reason" }
    ],
    "contingency": "5-10% reserve recommendation"
  }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert CMO AI. Respond ONLY with valid JSON — no markdown, no explanation, no extra text.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 4000,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0])
}

const INPUT_FIELDS = [
  { key: 'industry',      label: 'Industry',            icon: <Globe size={14}/>,      placeholder: 'Select industry...',      type: 'select', options: INDUSTRIES },
  { key: 'product',       label: 'Product / Service',   icon: <Package size={14}/>,    placeholder: 'e.g. AI marketing platform', type: 'text' },
  { key: 'pricing',       label: 'Pricing Model',       icon: <DollarSign size={14}/>, placeholder: 'Select pricing model...',  type: 'select', options: PRICING_MODELS },
  { key: 'geoMarket',     label: 'Geographic Market',   icon: <MapPin size={14}/>,     placeholder: 'Select market...',         type: 'select', options: GEO_MARKETS },
  { key: 'competitor',    label: 'Main Competitor',     icon: <Target size={14}/>,     placeholder: 'e.g. HubSpot, Salesforce', type: 'text' },
  { key: 'revenueTarget', label: 'Revenue Target',      icon: <BarChart2 size={14}/>,  placeholder: 'Select revenue target...',  type: 'select', options: REVENUE_TARGETS },
  { key: 'demographics',  label: 'Target Demographics', icon: <Users size={14}/>,      placeholder: 'Select demographics...',   type: 'select', options: DEMOGRAPHICS },
]

const priorityColor = (p) => ({ high: '#10b981', medium: '#f59e0b', low: TEXT2 }[p] || TEXT2)

export default function MarketingStrategyPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inputs, setInputs] = useState({ industry: '', product: '', pricing: '', geoMarket: '', competitor: '', revenueTarget: '', demographics: '' })
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState('')
  const [activeTab, setActiveTab] = useState('annual')
  const [savedDocId, setSavedDocId] = useState(null)
  const [history, setHistory]   = useState([])

  const set = (k, v) => setInputs(p => ({ ...p, [k]: v }))
  const ready = inputs.industry && inputs.product && inputs.revenueTarget

  const loadHistory = async () => {
    if (!user?.uid) return
    try {
      const items = await getContentItems(user.uid)
      setHistory(items.filter(i => i.campaignType === 'marketing_strategy').slice(0, 5))
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user?.uid])

  const handleGenerate = async () => {
    if (!ready) return
    setLoading(true)
    setError('')
    setResult(null)
    setSavedDocId(null)
    try {
      const r = await generateStrategy(inputs)
      setResult(r)
      setActiveTab('annual')
      try {
        const ids = await saveContentItems(
          user?.uid,
          { name: inputs.product, type: 'marketing_strategy', source: 'campaign' },
          [{ key: 'output', type: 'strategy', platform: '', text: r.executiveSummary, data: JSON.stringify(r) }],
          'draft'
        )
        setSavedDocId(ids['output'] || null)
        loadHistory()
      } catch {}
    } catch {
      setError('Strategy generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) })
  }

  const downloadReport = () => {
    if (!result) return
    const r = result
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '                  MARKETING STRATEGY REPORT',
      `  Product: ${inputs.product}  |  Industry: ${inputs.industry}`,
      `  Market: ${inputs.geoMarket}  |  Revenue Target: ${inputs.revenueTarget}`,
      '═══════════════════════════════════════════════════════════',
      '',
      '── EXECUTIVE SUMMARY ──────────────────────────────────────',
      r.executiveSummary || '',
      '',
      '── ANNUAL PLAN ─────────────────────────────────────────────',
      `Objective  : ${r.annualPlan?.objective || ''}`,
      `Budget     : ${r.annualPlan?.budget || ''}`,
      `Expected ROI: ${r.annualPlan?.expectedROI || ''}`,
      `Top Channels: ${(r.annualPlan?.topChannels || []).join(', ')}`,
      '',
      'Key Initiatives:',
      ...(r.annualPlan?.keyInitiatives || []).map((i, n) => `  ${n + 1}. ${i}`),
      '',
      '── QUARTERLY PLAN ──────────────────────────────────────────',
      ...(r.quarterlyPlan || []).flatMap(q => [
        `${q.quarter} — ${q.focus}  |  Budget: ${q.budget}  |  KPI: ${q.kpi}`,
        ...(q.activities || []).map(a => `  • ${a}`),
        '',
      ]),
      '── MONTHLY CADENCE ─────────────────────────────────────────',
      `Cadence        : ${r.monthlyPlan?.cadence || ''}`,
      `Content Volume : ${r.monthlyPlan?.contentVolume || ''}`,
      `Review Cycle   : ${r.monthlyPlan?.reviewCycle || ''}`,
      '',
      '── CAMPAIGN RECOMMENDATIONS ────────────────────────────────',
      ...(r.campaignRecommendations || []).map(c =>
        `• ${c.name}  [${c.type}]  Platform: ${c.platform}  Budget: ${c.budget}  Timeline: ${c.timeline}  Priority: ${c.priority}`
      ),
      '',
      '── BUDGET RECOMMENDATIONS ──────────────────────────────────',
      `Total Budget : ${r.budgetRecommendations?.totalBudget || ''}`,
      `Contingency  : ${r.budgetRecommendations?.contingency || ''}`,
      '',
      ...(r.budgetRecommendations?.breakdown || []).map(b =>
        `  ${b.channel.padEnd(30)} ${b.allocation.padEnd(6)}  ${b.rationale}`
      ),
      '',
      '═══════════════════════════════════════════════════════════',
      `  Generated by EVOX AI  |  ${new Date().toLocaleDateString()}`,
      '═══════════════════════════════════════════════════════════',
    ]
    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Marketing_Strategy_${inputs.product || 'Report'}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle = { width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const tabBtn = (key) => ({ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: activeTab === key ? GOLD : 'transparent', color: activeTab === key ? '#0e0c09' : TEXT2, transition: 'all 0.15s' })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '100px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color={GOLD} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Marketing Strategy</h1>
              <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>AI Marketing Strategy Agent — Annual, Quarterly & Monthly Plans</p>
            </div>
          </div>
        </div>

        {/* Data Inputs */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Business profile inputs</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT2 }}>7 data points feed the Marketing Strategy Agent</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {INPUT_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                  <span style={{ color: TEXT3 }}>{f.icon}</span> {f.label} {(f.key === 'industry' || f.key === 'product' || f.key === 'revenueTarget') && <span style={{ color: GOLD }}>*</span>}
                </label>
                {f.type === 'select'
                  ? <select value={inputs[f.key]} onChange={e => set(f.key, e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">{f.placeholder}</option>
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  : <input value={inputs[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                }
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <button onClick={handleGenerate} disabled={loading || !ready} style={{
            background: !ready ? 'rgba(200,151,62,0.3)' : GOLD,
            color: '#0e0c09', border: 'none', borderRadius: 12, padding: '14px 44px',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Building strategy...</> : <><Sparkles size={18} /> Generate Marketing Strategy</>}
          </button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', marginBottom: 20, fontSize: 14 }}>{error}</div>}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Stat row */}
              {savedDocId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, color: '#10b981' }}>
                  <CheckCircle2 size={14} color="#10b981" /> Saved to history
                </div>
              )}

              {/* Executive Summary */}
              <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative' }}>
                <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  <Zap size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />Executive Summary
                </div>
                <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.7 }}>{result.executiveSummary}</div>
                <button onClick={() => copy(result.executiveSummary, 'exec')} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: TEXT3 }}>
                  {copied === 'exec' ? <Check size={14} color={GOLD} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Output Tabs */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                  {[
                    { key: 'annual',    label: 'Annual Plan',              icon: <Calendar size={13}/> },
                    { key: 'quarterly', label: 'Quarterly Plan',           icon: <BarChart2 size={13}/> },
                    { key: 'monthly',   label: 'Monthly Cadence',          icon: <RefreshCw size={13}/> },
                    { key: 'campaigns', label: 'Campaign Recommendations', icon: <Sparkles size={13}/> },
                    { key: 'budget',    label: 'Budget Recommendations',   icon: <DollarSign size={13}/> },
                  ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{t.icon}{t.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ padding: 22 }}>

                  {/* Annual Plan */}
                  {activeTab === 'annual' && result.annualPlan && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'Objective', value: result.annualPlan.objective, color: GOLD },
                          { label: 'Budget',    value: result.annualPlan.budget,    color: '#10b981' },
                          { label: 'Expected ROI', value: result.annualPlan.expectedROI, color: '#6366f1' },
                        ].map(m => (
                          <div key={m.label} style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 11, color: TEXT3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: m.color, lineHeight: 1.4 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 12, color: TEXT3, marginBottom: 10, fontWeight: 600 }}>Top Channels</div>
                          {(result.annualPlan.topChannels || []).map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < result.annualPlan.topChannels.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: TEXT }}>{c}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 12, color: TEXT3, marginBottom: 10, fontWeight: 600 }}>Key Initiatives</div>
                          {(result.annualPlan.keyInitiatives || []).map((ki, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: i < result.annualPlan.keyInitiatives.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                              <div style={{ width: 18, height: 18, borderRadius: 4, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: GOLD, fontWeight: 700 }}>{i + 1}</div>
                              <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{ki}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quarterly Plan */}
                  {activeTab === 'quarterly' && result.quarterlyPlan && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {result.quarterlyPlan.map((q, i) => (
                        <div key={i} style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{q.quarter}</span>
                            <span style={{ fontSize: 11, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 20, padding: '2px 10px', color: GOLD }}>{q.budget} budget</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{q.focus}</div>
                          <div style={{ fontSize: 11, color: '#10b981', marginBottom: 10 }}>KPI: {q.kpi}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(q.activities || []).map((a, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: TEXT2 }}>
                                <ChevronRight size={12} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />{a}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Monthly Cadence */}
                  {activeTab === 'monthly' && result.monthlyPlan && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Monthly cadence', value: result.monthlyPlan.cadence },
                        { label: 'Content volume',  value: result.monthlyPlan.contentVolume },
                        { label: 'Review cycle',    value: result.monthlyPlan.reviewCycle },
                      ].map(m => (
                        <div key={m.label} style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{m.label}</div>
                          <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{m.value}</div>
                        </div>
                      ))}
                      <div style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 11, color: TEXT3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Optimization triggers</div>
                        {(result.monthlyPlan.optimizationTriggers || []).map((t, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT2, padding: '5px 0', borderBottom: i < result.monthlyPlan.optimizationTriggers.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            <Lightbulb size={13} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />{t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaign Recommendations */}
                  {activeTab === 'campaigns' && result.campaignRecommendations && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {result.campaignRecommendations.map((c, i) => (
                        <div key={i} style={{ background: CARD2, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{c.name}</span>
                              <span style={{ fontSize: 10, background: `${priorityColor(c.priority)}20`, color: priorityColor(c.priority), borderRadius: 20, padding: '2px 8px', fontWeight: 600, textTransform: 'uppercase' }}>{c.priority}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: TEXT2 }}>
                              <span>Type: <span style={{ color: TEXT }}>{c.type}</span></span>
                              <span>Platform: <span style={{ color: TEXT }}>{c.platform}</span></span>
                              <span>Reach: <span style={{ color: '#10b981' }}>{c.expectedReach}</span></span>
                              <span>Budget: <span style={{ color: GOLD }}>{c.budget}</span></span>
                              <span>Timeline: <span style={{ color: TEXT }}>{c.timeline}</span></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Budget Recommendations */}
                  {activeTab === 'budget' && result.budgetRecommendations && (
                    <div>
                      <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended total budget</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{result.budgetRecommendations.totalBudget}</div>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>Contingency: {result.budgetRecommendations.contingency}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(result.budgetRecommendations.breakdown || []).map((b, i) => (
                          <div key={i} style={{ background: CARD2, borderRadius: 12, padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{b.channel}</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{b.allocation}</span>
                            </div>
                            <div style={{ height: 4, background: BORDER, borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: b.allocation }} />
                            </div>
                            <div style={{ fontSize: 12, color: TEXT2 }}>{b.rationale}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                <button onClick={handleGenerate} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 22px', color: TEXT2, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={13} /> Regenerate Strategy
                </button>
                <button onClick={downloadReport} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, padding: '9px 22px', color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Download size={13} /> Download Report
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
                  <button onClick={() => { try { setResult(JSON.parse(item.data)); setActiveTab('annual') } catch {} }} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: GOLD, cursor: 'pointer', fontWeight: 500 }}>Load</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
