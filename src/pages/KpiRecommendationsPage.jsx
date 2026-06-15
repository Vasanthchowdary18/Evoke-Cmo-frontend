import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BarChart2, Target, TrendingUp, Users,
  Download, RefreshCw, AlertCircle, Loader2, CheckCircle2,
  Instagram, Linkedin, Facebook, Hash, Youtube, Twitter,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

/* ── brand palette ─────────────────────────────────────── */
const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.08)'

/* ── platforms ─────────────────────────────────────────── */
const PLATFORMS = [
  { key: 'instagram',  label: 'Instagram',  color: '#dd2a7b' },
  { key: 'facebook',   label: 'Facebook',   color: '#1877f2' },
  { key: 'linkedin',   label: 'LinkedIn',   color: '#0a66c2' },
  { key: 'tiktok',     label: 'TikTok',     color: '#010101' },
  { key: 'youtube',    label: 'YouTube',    color: '#ff0000' },
  { key: 'twitter',    label: 'X (Twitter)', color: '#1d9bf0' },
]

/* ── campaign goals ────────────────────────────────────── */
const GOALS = [
  'Brand Awareness',
  'Lead Generation',
  'Sales / Conversions',
  'Community Growth',
  'Website Traffic',
  'Product Launch',
  'Customer Retention',
]

/* ── budget ranges ─────────────────────────────────────── */
const BUDGETS = [
  'Under $500/month',
  '$500 – $1,000/month',
  '$1,000 – $3,000/month',
  '$3,000 – $5,000/month',
  '$5,000 – $10,000/month',
  '$10,000+/month',
]

/* ── industries ────────────────────────────────────────── */
const INDUSTRIES = [
  'E-commerce / Retail',
  'SaaS / Software',
  'Fashion & Apparel',
  'Food & Beverage',
  'Health & Wellness / Fitness',
  'Beauty & Skincare',
  'Real Estate',
  'Travel & Hospitality',
  'Education & Online Courses',
  'Finance & Fintech',
  'Healthcare & Medical',
  'Automotive',
  'Home & Interior Design',
  'Entertainment & Media',
  'Non-Profit / NGO',
  'Legal Services',
  'Marketing & Advertising Agency',
  'Photography & Creative Services',
  'Coaching & Consulting',
  'Other',
]

/* ── target audiences ──────────────────────────────────── */
const AUDIENCES = [
  'Gen Z (18–24)',
  'Millennials (25–34)',
  'Young Professionals (25–40)',
  'Parents & Families',
  'Small Business Owners',
  'Entrepreneurs & Startups',
  'Corporate / B2B Decision Makers',
  'Women 25–45',
  'Men 25–45',
  'Fitness Enthusiasts',
  'Tech Savvy Consumers',
  'Luxury / High-Income Consumers',
  'Students & Graduates',
  'Senior Professionals (45+)',
  'Local / Community Audience',
  'Global / International Audience',
]

/* ── helpers ───────────────────────────────────────────── */
async function callGroq(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert digital marketing strategist specialising in KPI benchmarking and performance measurement. Always respond with valid JSON only — no markdown fences, no extra text.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 3000,
  })

  let res
  if (apiKey && apiKey !== 'your_groq_api_key_here') {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body,
    })
  } else {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  }
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content || ''
}

function buildPrompt({ brandName, goal, budget, platforms, industry, audience }) {
  return `
You are generating KPI recommendations for a 30-day social media campaign.

Brand: ${brandName}
Industry: ${industry || 'General'}
Campaign Goal: ${goal}
Monthly Budget: ${budget}
Target Audience: ${audience || 'General audience'}
Platforms: ${platforms.join(', ')}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the KPI strategy",
  "kpiDashboard": [
    {
      "platform": "Instagram",
      "metrics": [
        { "name": "Reach", "target": "10,000–15,000", "unit": "accounts/month" },
        { "name": "Engagement Rate", "target": "3–5", "unit": "%" },
        { "name": "Follower Growth", "target": "200–400", "unit": "new followers" },
        { "name": "Story Views", "target": "500–800", "unit": "views/story" }
      ]
    }
  ],
  "engagementGoals": [
    { "metric": "Total Likes", "target": "...", "timeframe": "30 days" },
    { "metric": "Comments", "target": "...", "timeframe": "30 days" },
    { "metric": "Shares / Reposts", "target": "...", "timeframe": "30 days" },
    { "metric": "Click-through Rate", "target": "...", "timeframe": "30 days" }
  ],
  "leadTrackingPlan": [
    { "step": 1, "action": "...", "tool": "...", "kpi": "..." }
  ],
  "performanceBenchmarks": [
    { "category": "...", "benchmark": "...", "industry": "...", "yourTarget": "..." }
  ],
  "weeklyMilestones": [
    { "week": "Week 1", "focus": "...", "keyMetric": "...", "target": "..." },
    { "week": "Week 2", "focus": "...", "keyMetric": "...", "target": "..." },
    { "week": "Week 3", "focus": "...", "keyMetric": "...", "target": "..." },
    { "week": "Week 4", "focus": "...", "keyMetric": "...", "target": "..." }
  ]
}

Generate realistic KPI targets for each of the selected platforms: ${platforms.join(', ')}.
Include one entry per platform in kpiDashboard.
Make all numbers realistic for the budget range: ${budget}.
`.trim()
}

/* ── CSV export ────────────────────────────────────────── */
function exportCSV(data, formData) {
  const rows = []
  rows.push(['EVOX AI — KPI Recommendations Report'])
  rows.push(['Brand', formData.brandName])
  rows.push(['Goal', formData.goal])
  rows.push(['Budget', formData.budget])
  rows.push(['Platforms', formData.platforms.join(', ')])
  rows.push([])

  rows.push(['=== KPI DASHBOARD ==='])
  rows.push(['Platform', 'Metric', 'Target', 'Unit'])
  data.kpiDashboard?.forEach(p =>
    p.metrics?.forEach(m => rows.push([p.platform, m.name, m.target, m.unit]))
  )
  rows.push([])

  rows.push(['=== ENGAGEMENT GOALS (30 Days) ==='])
  rows.push(['Metric', 'Target', 'Timeframe'])
  data.engagementGoals?.forEach(g => rows.push([g.metric, g.target, g.timeframe]))
  rows.push([])

  rows.push(['=== LEAD TRACKING PLAN ==='])
  rows.push(['Step', 'Action', 'Tool', 'KPI'])
  data.leadTrackingPlan?.forEach(s => rows.push([s.step, s.action, s.tool, s.kpi]))
  rows.push([])

  rows.push(['=== PERFORMANCE BENCHMARKS ==='])
  rows.push(['Category', 'Industry Benchmark', 'Your Target'])
  data.performanceBenchmarks?.forEach(b => rows.push([b.category, b.benchmark, b.yourTarget]))
  rows.push([])

  rows.push(['=== WEEKLY MILESTONES ==='])
  rows.push(['Week', 'Focus', 'Key Metric', 'Target'])
  data.weeklyMilestones?.forEach(w => rows.push([w.week, w.focus, w.keyMetric, w.target]))

  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `KPI_Recommendations_${formData.brandName || 'campaign'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function KpiRecommendationsPage() {
  const navigate = useNavigate()

  /* form state */
  const [brandName,  setBrandName]  = useState('')
  const [goal,       setGoal]       = useState('')
  const [budget,     setBudget]     = useState('')
  const [platforms,  setPlatforms]  = useState([])
  const [industry,   setIndustry]   = useState('')
  const [audience,   setAudience]   = useState('')

  /* ui state */
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [results,    setResults]    = useState(null)

  /* active results tab */
  const [activeTab,  setActiveTab]  = useState('kpiDashboard')

  const togglePlatform = key =>
    setPlatforms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  /* ── generate ─────────────────────────────────────────── */
  async function handleGenerate() {
    setError('')
    if (!brandName.trim()) { setError('Please enter your brand name.'); return }
    if (!goal)             { setError('Please select a campaign goal.'); return }
    if (!budget)           { setError('Please select your budget range.'); return }
    if (platforms.length === 0) { setError('Please select at least one platform.'); return }

    setLoading(true)
    setResults(null)
    try {
      const raw  = await callGroq(buildPrompt({ brandName, goal, budget, platforms, industry, audience }))
      const clean = raw.replace(/```json|```/g, '').trim()
      const data  = JSON.parse(clean)
      setResults(data)
      setActiveTab('kpiDashboard')
    } catch (e) {
      setError(`Generation failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  /* ── styles ───────────────────────────────────────────── */
  const s = {
    page: { minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, sans-serif', paddingBottom: 80 },
    inner: { maxWidth: 900, margin: '0 auto', padding: '32px 20px' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 6, color: TEXT2, fontSize: 13, cursor: 'pointer', marginBottom: 28, background: 'none', border: 'none', padding: 0 },
    header: { marginBottom: 36 },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', marginBottom: 14 },
    title: { fontSize: 28, fontWeight: 800, color: TEXT, margin: 0 },
    sub: { color: TEXT2, fontSize: 14, marginTop: 8 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 20 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT2, letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    select: { width: '100%', background: '#1c1a13', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' },
    chip: (active, color) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
      borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      border: `1.5px solid ${active ? color : BORDER}`,
      background: active ? `${color}22` : 'transparent',
      color: active ? color : TEXT2, transition: 'all 0.15s',
    }),
    genBtn: { width: '100%', padding: '16px', borderRadius: 12, background: GOLD, color: '#0e0c09', fontSize: 15, fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    errBox: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, marginBottom: 16 },
    tabs: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
    tab: (active) => ({
      padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      border: `1.5px solid ${active ? GOLD : BORDER}`,
      background: active ? `${GOLD}18` : 'transparent',
      color: active ? GOLD : TEXT2, transition: 'all 0.15s',
    }),
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '10px 14px', color: TEXT2, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${BORDER}` },
    td: { padding: '12px 14px', color: TEXT, borderBottom: `1px solid rgba(255,255,255,0.04)`, verticalAlign: 'top' },
    sectionTitle: { fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16 },
    milCard: { background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', marginBottom: 10 },
  }

  /* ── tab content ──────────────────────────────────────── */
  const renderTab = () => {
    if (!results) return null
    switch (activeTab) {
      case 'kpiDashboard':
        return (
          <div>
            <p style={{ color: TEXT2, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{results.summary}</p>
            {results.kpiDashboard?.map((p, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 10 }}>{p.platform}</div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Metric</th>
                      <th style={s.th}>Target</th>
                      <th style={s.th}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.metrics?.map((m, j) => (
                      <tr key={j}>
                        <td style={s.td}>{m.name}</td>
                        <td style={{ ...s.td, color: '#34d399', fontWeight: 700 }}>{m.target}</td>
                        <td style={{ ...s.td, color: TEXT2 }}>{m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )

      case 'engagementGoals':
        return (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Metric</th>
                <th style={s.th}>Target</th>
                <th style={s.th}>Timeframe</th>
              </tr>
            </thead>
            <tbody>
              {results.engagementGoals?.map((g, i) => (
                <tr key={i}>
                  <td style={s.td}>{g.metric}</td>
                  <td style={{ ...s.td, color: '#34d399', fontWeight: 700 }}>{g.target}</td>
                  <td style={{ ...s.td, color: TEXT2 }}>{g.timeframe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'leadTrackingPlan':
        return (
          <div>
            {results.leadTrackingPlan?.map((step, i) => (
              <div key={i} style={s.milCard}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: `${GOLD}22`, border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: GOLD }}>{step.step}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: TEXT, marginBottom: 4 }}>{step.action}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>Tool: {step.tool}</div>
                    <div style={{ fontSize: 12, color: '#34d399', marginTop: 2 }}>KPI: {step.kpi}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'performanceBenchmarks':
        return (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Category</th>
                <th style={s.th}>Industry Benchmark</th>
                <th style={s.th}>Your Target</th>
              </tr>
            </thead>
            <tbody>
              {results.performanceBenchmarks?.map((b, i) => (
                <tr key={i}>
                  <td style={s.td}>{b.category}</td>
                  <td style={{ ...s.td, color: TEXT2 }}>{b.benchmark}</td>
                  <td style={{ ...s.td, color: GOLD, fontWeight: 700 }}>{b.yourTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'weeklyMilestones':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {results.weeklyMilestones?.map((w, i) => (
              <div key={i} style={{ ...s.milCard, borderLeft: `3px solid ${GOLD}` }}>
                <div style={{ fontWeight: 800, color: GOLD, fontSize: 12, marginBottom: 6 }}>{w.week}</div>
                <div style={{ fontWeight: 700, color: TEXT, fontSize: 13, marginBottom: 6 }}>{w.focus}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>{w.keyMetric}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{w.target}</div>
              </div>
            ))}
          </div>
        )

      default: return null
    }
  }

  /* ── render ───────────────────────────────────────────── */
  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.inner}>
        {/* back */}
        <button style={s.back} onClick={() => navigate('/package-b')}>
          <ArrowLeft size={14} /> Back to Agents
        </button>

        {/* header */}
        <div style={s.header}>
          <div style={s.badge}><BarChart2 size={11} /> KPI RECOMMENDATIONS</div>
          <h1 style={s.title}>KPI Recommendations</h1>
          <p style={s.sub}>AI-generated benchmarks, engagement goals, lead tracking & performance targets for your 30-day campaign.</p>
        </div>

        {/* ── form ── */}
        {!results && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={s.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* brand name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>Brand / Business Name *</label>
                  <input style={s.input} placeholder="e.g. Evoke Marketing" value={brandName} onChange={e => setBrandName(e.target.value)} />
                </div>

                {/* campaign goal */}
                <div>
                  <label style={s.label}>Campaign Goal *</label>
                  <select style={s.select} value={goal} onChange={e => setGoal(e.target.value)}>
                    <option value="">Select goal...</option>
                    {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* budget */}
                <div>
                  <label style={s.label}>Monthly Budget *</label>
                  <select style={s.select} value={budget} onChange={e => setBudget(e.target.value)}>
                    <option value="">Select budget range...</option>
                    {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* industry */}
                <div>
                  <label style={s.label}>Industry / Niche</label>
                  <select style={s.select} value={industry} onChange={e => setIndustry(e.target.value)}>
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {/* audience */}
                <div>
                  <label style={s.label}>Target Audience</label>
                  <select style={s.select} value={audience} onChange={e => setAudience(e.target.value)}>
                    <option value="">Select target audience...</option>
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* platforms */}
              <div style={{ marginTop: 24 }}>
                <label style={s.label}>Platforms to Track * <span style={{ color: TEXT3, fontWeight: 400 }}>— select all that apply</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PLATFORMS.map(p => (
                    <button key={p.key} style={s.chip(platforms.includes(p.key), p.color)} onClick={() => togglePlatform(p.key)}>
                      {platforms.includes(p.key) && <CheckCircle2 size={13} />}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* error */}
            {error && (
              <div style={s.errBox}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* generate */}
            <button style={s.genBtn} onClick={handleGenerate} disabled={loading}>
              {loading ? <><Loader2 size={17} className="spin" /> Generating KPI Report…</> : <><BarChart2 size={17} /> Generate KPI Recommendations</>}
            </button>
          </motion.div>
        )}

        {/* ── loading ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={36} style={{ color: GOLD, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div style={{ color: TEXT2, fontSize: 14 }}>Analysing your campaign and generating KPI benchmarks…</div>
          </motion.div>
        )}

        {/* ── results ── */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Your KPI Report</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{brandName} · {goal} · {budget}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => exportCSV(results, { brandName, goal, budget, platforms })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.4)', color: '#34d399', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Download size={14} /> Download CSV
                  </button>
                  <button
                    onClick={() => { setResults(null); setError('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${BORDER}`, color: TEXT2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <RefreshCw size={14} /> New Report
                  </button>
                </div>
              </div>

              {/* tabs */}
              <div style={s.tabs}>
                {[
                  { key: 'kpiDashboard',        label: 'KPI Dashboard' },
                  { key: 'engagementGoals',      label: 'Engagement Goals' },
                  { key: 'leadTrackingPlan',      label: 'Lead Tracking Plan' },
                  { key: 'performanceBenchmarks', label: 'Performance Benchmarks' },
                  { key: 'weeklyMilestones',      label: 'Weekly Milestones' },
                ].map(t => (
                  <button key={t.key} style={s.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* tab content */}
              <div style={s.card}>{renderTab()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } } .spin { animation: spin 1s linear infinite }`}</style>
    </div>
  )
}
