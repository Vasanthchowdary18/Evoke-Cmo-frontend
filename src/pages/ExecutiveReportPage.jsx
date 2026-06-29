import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, ArrowLeft, Loader2, Copy, Check, Download,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  DollarSign, Target, Zap, Star, ChevronRight, RefreshCw,
  FileText, Crown, Globe, Calendar,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const CARD2  = '#211e14'
const BORDER = 'rgba(255,255,255,0.07)'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.13)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.32)'
const GREEN  = '#10b981'
const GROQ   = import.meta.env.VITE_GROQ_API_KEY || ''

const PERIODS   = ['Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Last 6 Months', 'Last Year', 'Custom']
const CHANNELS  = ['Meta Ads', 'LinkedIn', 'Google Ads', 'Email Marketing', 'TikTok', 'SEO/Organic', 'WhatsApp', 'Influencer']
const AUDIENCES = ['B2B Professionals', 'B2C Consumers', 'SMEs', 'Enterprise', 'Students', 'Healthcare', 'E-Commerce Shoppers']

async function generateExecutiveReport(inputs) {
  const prompt = `You are a Chief Marketing Officer AI assistant generating an executive performance report for the board.

Company: ${inputs.company}
Campaign/Period: ${inputs.period}
Channels Used: ${inputs.channels.join(', ')}
Budget Spent: ${inputs.currency}${inputs.budgetSpent}
Revenue Generated: ${inputs.currency}${inputs.revenue}
Total Impressions: ${inputs.impressions}
Total Clicks: ${inputs.clicks}
Conversions: ${inputs.conversions}
Target Audience: ${inputs.audience}
Campaign Objective: ${inputs.objective}

Generate a comprehensive executive marketing report. Return ONLY valid JSON:
{
  "executiveSummary": "3-4 sentence high-level summary for the CEO/board — focus on business impact, not just metrics",
  "overallRating": "Excellent",
  "overallScore": 87,
  "roi": {
    "value": "340%",
    "trend": "up",
    "vs_previous": "+45% vs previous period"
  },
  "cpa": {
    "value": "$42",
    "trend": "down",
    "note": "Cost per acquisition improved"
  },
  "roas": {
    "value": "4.3x",
    "trend": "up",
    "note": "Return on ad spend"
  },
  "ctr": {
    "value": "3.2%",
    "trend": "up",
    "note": "Above industry average of 2.1%"
  },
  "channelPerformance": [
    { "channel": "Meta Ads", "spend": "$2,500", "revenue": "$12,000", "roas": "4.8x", "status": "top_performer", "insight": "Best ROAS this period" },
    { "channel": "LinkedIn", "spend": "$1,800", "revenue": "$5,400", "roas": "3.0x", "status": "good", "insight": "Strong B2B lead quality" },
    { "channel": "Email", "spend": "$500", "revenue": "$3,500", "roas": "7.0x", "status": "top_performer", "insight": "Highest ROI channel" }
  ],
  "keyWins": [
    "Specific achievement that exceeded expectations",
    "Another significant business win",
    "Third notable positive outcome"
  ],
  "keyRisks": [
    { "risk": "Risk or concern identified", "impact": "High/Medium/Low", "mitigation": "Recommended action" },
    { "risk": "Second risk", "impact": "Medium", "mitigation": "How to address" }
  ],
  "strategicRecommendations": [
    { "priority": 1, "action": "Specific next action", "expectedImpact": "Expected business outcome", "timeframe": "Next 30 days" },
    { "priority": 2, "action": "Second recommendation", "expectedImpact": "Expected outcome", "timeframe": "Next 60 days" },
    { "priority": 3, "action": "Third recommendation", "expectedImpact": "Expected outcome", "timeframe": "Next 90 days" }
  ],
  "nextPeriodForecast": {
    "projectedRevenue": "$X,XXX",
    "projectedRoas": "X.Xx",
    "confidence": "High",
    "assumptions": "Based on current trajectory and planned budget increase"
  },
  "boardStatement": "One powerful sentence the CMO would say to the board about this period's performance"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2500,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: TEXT2,
      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
    }}>
      {copied ? <Check size={11} color={GREEN} /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const ratingColor = (r) => ({ 'Excellent': GREEN, 'Good': '#3b82f6', 'Average': GOLD, 'Below Average': '#ef4444' })[r] || GOLD
const statusColor = (s) => ({ 'top_performer': GREEN, 'good': '#3b82f6', 'average': GOLD, 'underperforming': '#ef4444' })[s] || TEXT3
const statusLabel = (s) => ({ 'top_performer': '⭐ Top Performer', 'good': '✅ Good', 'average': '→ Average', 'underperforming': '⚠ Under' })[s] || s
const trendIcon   = (t) => t === 'up' ? <TrendingUp size={14} color={GREEN} /> : <TrendingDown size={14} color="#ef4444" />

export default function ExecutiveReportPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [report,   setReport]   = useState(null)

  const [company,      setCompany]      = useState('')
  const [period,       setPeriod]       = useState('Last 30 Days')
  const [objective,    setObjective]    = useState('')
  const [channels,     setChannels]     = useState([])
  const [currency,     setCurrency]     = useState('$')
  const [budgetSpent,  setBudgetSpent]  = useState('')
  const [revenue,      setRevenue]      = useState('')
  const [impressions,  setImpressions]  = useState('')
  const [clicks,       setClicks]       = useState('')
  const [conversions,  setConversions]  = useState('')
  const [audience,     setAudience]     = useState('B2B Professionals')

  const toggleChannel = (c) => setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const handleGenerate = async () => {
    if (!company.trim()) { setError('Please enter your company name.'); return }
    if (!budgetSpent) { setError('Please enter budget spent.'); return }
    setError('')
    setReport(null)
    setLoading(true)
    try {
      const r = await generateExecutiveReport({ company, period, objective, channels: channels.length ? channels : ['Multiple channels'], currency, budgetSpent, revenue: revenue || '0', impressions: impressions || '0', clicks: clicks || '0', conversions: conversions || '0', audience })
      setReport(r)
    } catch (err) {
      setError(err.message || 'Report generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!report) return
    const text = `EXECUTIVE MARKETING REPORT — ${company}
Period: ${period}
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
${report.executiveSummary}

BOARD STATEMENT
"${report.boardStatement}"

OVERALL SCORE: ${report.overallScore}/100 — ${report.overallRating}
ROI: ${report.roi?.value} (${report.roi?.vs_previous})
ROAS: ${report.roas?.value}
CPA: ${report.cpa?.value}
CTR: ${report.ctr?.value}

KEY WINS
${(report.keyWins || []).map((w, i) => `${i + 1}. ${w}`).join('\n')}

CHANNEL PERFORMANCE
${(report.channelPerformance || []).map(c => `${c.channel}: Spend ${c.spend} | Revenue ${c.revenue} | ROAS ${c.roas} — ${c.insight}`).join('\n')}

RISKS
${(report.keyRisks || []).map(r => `[${r.impact}] ${r.risk} → ${r.mitigation}`).join('\n')}

STRATEGIC RECOMMENDATIONS
${(report.strategicRecommendations || []).map(r => `${r.priority}. ${r.action} (${r.timeframe}) — ${r.expectedImpact}`).join('\n')}

NEXT PERIOD FORECAST
Projected Revenue: ${report.nextPeriodForecast?.projectedRevenue}
Projected ROAS: ${report.nextPeriodForecast?.projectedRoas}
Confidence: ${report.nextPeriodForecast?.confidence}
`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${company.replace(/\s+/g, '_')}_Executive_Report.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  const inputStyle = {
    width: '100%', background: CARD2, border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 20px 60px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={22} color={GOLD} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Executive Reporting Agent</h1>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT2 }}>Board-ready executive marketing reports — ROI, ROAS, channel performance & strategic recommendations</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: report ? '360px 1fr' : '520px 1fr', gap: 20 }}>

          {/* Form */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, alignSelf: 'start' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Report Inputs</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Company / Brand <span style={{ color: GREEN }}>*</span></label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. EvoX AI" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Period</label>
                <select value={period} onChange={e => setPeriod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Audience</label>
                <select value={audience} onChange={e => setAudience(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Campaign Objective</label>
              <input value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. Drive product trial signups" style={inputStyle} />
            </div>

            {/* Channels */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Channels Used</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CHANNELS.map(c => (
                  <button key={c} onClick={() => toggleChannel(c)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: channels.includes(c) ? `${GOLD}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${channels.includes(c) ? GOLD : BORDER}`,
                    color: channels.includes(c) ? GOLD : TEXT3,
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Key Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 11, color: TEXT3, fontWeight: 600 }}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }}>
                {['₹', '$', '€', '£', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 600 }}>Budget Spent <span style={{ color: GREEN }}>*</span></label>
                <input value={budgetSpent} onChange={e => setBudgetSpent(e.target.value)} placeholder="50,000" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 600 }}>Revenue Generated</label>
                <input value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="2,00,000" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 600 }}>Total Impressions</label>
                <input value={impressions} onChange={e => setImpressions(e.target.value)} placeholder="1,50,000" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 600 }}>Total Clicks</label>
                <input value={clicks} onChange={e => setClicks(e.target.value)} placeholder="4,500" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 600 }}>Conversions</label>
                <input value={conversions} onChange={e => setConversions(e.target.value)} placeholder="120" style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${GOLD}, #a87030)`,
              border: `1px solid ${GOLD}40`, color: loading ? TEXT3 : '#0e0c09',
              fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit',
            }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Report...</> : <><Crown size={16} /> Generate Executive Report</>}
            </button>

            {report && !loading && (
              <button onClick={handleGenerate} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
          </div>

          {/* Report Output */}
          <AnimatePresence>
            {!report && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16, minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Board-ready report appears here</div>
                  <div style={{ fontSize: 13, color: TEXT3 }}>Enter your metrics and click Generate</div>
                </div>
              </motion.div>
            )}
            {report && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>

                {/* Report header */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ background: `linear-gradient(135deg, ${GDIM}, rgba(200,151,62,0.05))`, borderBottom: `1px solid ${GBORDER}`, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Executive Marketing Report</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{company}</div>
                        <div style={{ fontSize: 13, color: TEXT2, marginTop: 3 }}>{period} · Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={exportReport} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, padding: '8px 16px', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                          <Download size={13} /> Export
                        </button>
                        <CopyBtn text={report.executiveSummary} />
                      </div>
                    </div>

                    {/* Overall score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
                      <div style={{ background: `${ratingColor(report.overallRating)}20`, border: `1px solid ${ratingColor(report.overallRating)}40`, borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: ratingColor(report.overallRating) }}>{report.overallScore}</div>
                        <div>
                          <div style={{ fontSize: 10, color: TEXT3 }}>Overall Score</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: ratingColor(report.overallRating) }}>{report.overallRating}</div>
                        </div>
                      </div>
                      {report.boardStatement && (
                        <div style={{ flex: 1, fontSize: 14, fontStyle: 'italic', color: TEXT2, lineHeight: 1.6, borderLeft: `2px solid ${GBORDER}`, paddingLeft: 16 }}>
                          "{report.boardStatement}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KPI row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${BORDER}` }}>
                    {[
                      { label: 'ROI', ...report.roi },
                      { label: 'ROAS', ...report.roas },
                      { label: 'CPA', ...report.cpa },
                      { label: 'CTR', ...report.ctr },
                    ].map((kpi, i) => (
                      <div key={i} style={{ padding: '16px 20px', borderRight: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                        <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{kpi.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{kpi.value}</span>
                          {kpi.trend && trendIcon(kpi.trend)}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT3 }}>{kpi.note || kpi.vs_previous}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {/* Executive Summary */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Executive Summary</div>
                      <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, margin: 0 }}>{report.executiveSummary}</p>
                    </div>

                    {/* Channel Performance */}
                    {report.channelPerformance?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Channel Performance</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {report.channelPerformance.map((c, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 70px 1fr', gap: 12, alignItems: 'center', background: CARD2, borderRadius: 10, padding: '12px 16px' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{c.channel}</div>
                              <div style={{ fontSize: 12, color: TEXT2 }}>{c.spend}</div>
                              <div style={{ fontSize: 12, color: GREEN }}>{c.revenue}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{c.roas}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: statusColor(c.status), fontWeight: 600 }}>{statusLabel(c.status)}</span>
                                <span style={{ fontSize: 11, color: TEXT3 }}>— {c.insight}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Wins + Risks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Key Wins ✓</div>
                    {(report.keyWins || []).map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <CheckCircle2 size={15} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Risks & Watch Items</div>
                    {(report.keyRisks || []).map((r, i) => (
                      <div key={i} style={{ background: 'rgba(245,158,11,0.07)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{r.risk}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: r.impact === 'High' ? '#ef4444' : '#f59e0b', background: r.impact === 'High' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 20 }}>{r.impact}</span>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT3 }}>→ {r.mitigation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Strategic Recommendations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(report.strategicRecommendations || []).map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, background: CARD2, borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 14, color: GOLD }}>{r.priority}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{r.action}</div>
                          <div style={{ fontSize: 12, color: GREEN, marginBottom: 3 }}>→ {r.expectedImpact}</div>
                          <div style={{ fontSize: 11, color: TEXT3, display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> {r.timeframe}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Period Forecast */}
                {report.nextPeriodForecast && (
                  <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Next Period Forecast</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{report.nextPeriodForecast.projectedRevenue}</div>
                        <div style={{ fontSize: 11, color: TEXT3 }}>Projected Revenue</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{report.nextPeriodForecast.projectedRoas}</div>
                        <div style={{ fontSize: 11, color: TEXT3 }}>Projected ROAS</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>{report.nextPeriodForecast.confidence}</div>
                        <div style={{ fontSize: 11, color: TEXT3 }}>Confidence</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT3, fontStyle: 'italic' }}>{report.nextPeriodForecast.assumptions}</div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
