import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Sparkles, AlertCircle, DollarSign, Cpu,
  Crown, TrendingUp, CheckCircle2, RefreshCw, Target, Layers,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems } from '../services/contentService'

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
const RED    = '#ef4444'

/* ── Role configs — each is its own AI executive ── */
const ROLES = {
  'ai-cfo': {
    label: 'AI CFO', color: '#10b981', icon: <DollarSign size={20} />,
    tagline: 'Budget planning, ROI forecasting & P&L clarity',
    fields: [
      { key: 'brand',    label: 'Company / Brand',        placeholder: 'e.g. EVOX AI' },
      { key: 'revenue',  label: 'Monthly Revenue (USD)',  placeholder: 'e.g. 45000' },
      { key: 'budget',   label: 'Monthly Marketing Budget (USD)', placeholder: 'e.g. 8000' },
      { key: 'goal',     label: 'Growth Goal (next 90 days)', placeholder: 'e.g. Grow revenue 20% while cutting CAC' },
    ],
    prompt: (f) => `You are an experienced AI CFO for a growing company. Given:
- Company: ${f.brand}
- Monthly revenue: $${f.revenue}
- Monthly marketing budget: $${f.budget}
- 90-day goal: ${f.goal}

Return ONLY valid JSON:
{
  "plSummary": { "revenue": "$45,000", "marketingSpend": "$8,000", "estProfit": "$12,000", "runwayNote": "1-sentence note on cash runway health" },
  "budgetAllocation": [
    { "channel": "Paid Social", "pct": 30, "amount": "$2,400", "reason": "why this allocation" },
    { "channel": "Content & SEO", "pct": 25, "amount": "$2,000", "reason": "why" },
    { "channel": "Email/CRM", "pct": 15, "amount": "$1,200", "reason": "why" },
    { "channel": "Paid Search", "pct": 20, "amount": "$1,600", "reason": "why" },
    { "channel": "Tools/Software", "pct": 10, "amount": "$800", "reason": "why" }
  ],
  "roiForecast": { "projectedRevenue90d": "$XX,XXX", "projectedROAS": "3.2x", "confidence": "Medium" },
  "risks": ["risk 1", "risk 2"],
  "recommendations": [ { "priority": "high", "action": "specific action", "impact": "expected $ or % impact" } ]
}`,
  },
  'ai-cto': {
    label: 'AI CTO', color: '#3b82f6', icon: <Cpu size={20} />,
    tagline: 'Tech stack advisory & sprint planning',
    fields: [
      { key: 'brand',     label: 'Company / Brand',       placeholder: 'e.g. EVOX AI' },
      { key: 'stack',     label: 'Current Tech Stack',    placeholder: 'e.g. React, Firebase, Vercel, n8n' },
      { key: 'teamSize',  label: 'Engineering Team Size', placeholder: 'e.g. 3' },
      { key: 'priority',  label: 'Top Technical Priority', placeholder: 'e.g. Reduce page load time, add real-time chat' },
    ],
    prompt: (f) => `You are an experienced AI CTO advising a small engineering team. Given:
- Company: ${f.brand}
- Current stack: ${f.stack}
- Team size: ${f.teamSize}
- Top priority: ${f.priority}

Return ONLY valid JSON:
{
  "stackAssessment": [ { "area": "Frontend", "note": "assessment", "risk": "low|medium|high" } ],
  "sprintPlan": {
    "next30Days": ["item 1", "item 2", "item 3"],
    "next60Days": ["item 1", "item 2"],
    "next90Days": ["item 1", "item 2"]
  },
  "toolRecommendations": [ { "tool": "name", "reason": "why", "costEstimate": "$/mo estimate" } ],
  "technicalRisks": ["risk 1", "risk 2"],
  "recommendations": [ { "priority": "high", "action": "specific action", "impact": "expected impact" } ]
}`,
  },
  'ai-ceo': {
    label: 'AI CEO', color: GOLD, icon: <Crown size={20} />,
    tagline: 'Vision, board updates & investor communication',
    fields: [
      { key: 'brand',     label: 'Company / Brand',   placeholder: 'e.g. EVOX AI' },
      { key: 'stage',     label: 'Company Stage',     placeholder: 'e.g. Pre-seed, Seed, Series A, Bootstrapped' },
      { key: 'milestone', label: 'Recent Milestone',  placeholder: 'e.g. Hit $50K MRR, launched v2' },
      { key: 'audience',  label: 'Update Audience',   placeholder: 'e.g. Board, Investors, Whole team' },
    ],
    prompt: (f) => `You are an experienced AI CEO advisor. Given:
- Company: ${f.brand}
- Stage: ${f.stage}
- Recent milestone: ${f.milestone}
- Update audience: ${f.audience}

Return ONLY valid JSON:
{
  "visionStatement": "1-2 sentence vision statement",
  "boardUpdate": { "wins": ["win 1", "win 2"], "challenges": ["challenge 1"], "asks": ["what you need from the board"] },
  "investorPitch": { "hook": "1-sentence hook", "traction": "traction summary", "ask": "what you're asking for" },
  "okrs": [ { "objective": "objective", "keyResults": ["kr 1", "kr 2"] } ],
  "recommendations": [ { "priority": "high", "action": "specific action", "impact": "expected impact" } ]
}`,
  },
  'ai-cro': {
    label: 'AI CRO', color: '#a855f7', icon: <TrendingUp size={20} />,
    tagline: 'Revenue optimization, pricing & upsell strategy',
    fields: [
      { key: 'brand',    label: 'Company / Brand',       placeholder: 'e.g. EVOX AI' },
      { key: 'mrr',      label: 'Current MRR (USD)',     placeholder: 'e.g. 20000' },
      { key: 'churn',    label: 'Monthly Churn Rate (%)', placeholder: 'e.g. 4' },
      { key: 'goal',     label: 'Growth Target (90 days)', placeholder: 'e.g. Grow MRR to $30,000' },
    ],
    prompt: (f) => `You are an experienced AI Chief Revenue Officer. Given:
- Company: ${f.brand}
- Current MRR: $${f.mrr}
- Monthly churn: ${f.churn}%
- 90-day target: ${f.goal}

Return ONLY valid JSON:
{
  "revenueForecast": { "current": "$20,000", "projected90d": "$XX,XXX", "confidence": "Medium" },
  "pricingRecommendations": [ { "idea": "pricing idea", "expectedImpact": "expected impact" } ],
  "upsellOpportunities": [ { "segment": "customer segment", "opportunity": "upsell idea", "estValue": "$ estimate" } ],
  "retentionPlan": ["retention tactic 1", "retention tactic 2"],
  "recommendations": [ { "priority": "high", "action": "specific action", "impact": "expected impact" } ]
}`,
  },
}

async function generateExecBrief(role, inputs) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: role.prompt(inputs) }],
      temperature: 0.6,
      max_tokens: 2200,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

export default function CSuitePage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const roleKey = pathname.replace('/', '')
  const role = ROLES[roleKey]

  const [inputs, setInputs] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)

  if (!role) return null

  const set = (k, v) => setInputs(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    const missing = role.fields.some(f => !inputs[f.key]?.trim())
    if (missing) { setError('Fill in all fields to continue.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await generateExecBrief(role, inputs)
      setResult(res)
      if (user?.uid) {
        await saveContentItems([{
          userId: user.uid,
          campaignId: `${roleKey}_${Date.now()}`,
          campaignName: `${role.label} Brief — ${inputs.brand || ''}`,
          campaignType: roleKey,
          type: 'exec_brief',
          platform: 'internal',
          text: JSON.stringify(res),
          data: JSON.stringify(res),
          status: 'draft',
          source: roleKey,
        }])
      }
    } catch (e) {
      setError('Generation failed. Check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', background: CARD2, border: `1px solid ${BORDER}`,
    borderRadius: 10, padding: '10px 13px', color: TEXT, fontSize: 13.5,
    fontFamily: 'inherit', outline: 'none',
  }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT2, letterSpacing: '0.04em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }

  const renderList = (items) => (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items?.map((it, i) => <li key={i} style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>)}
    </ul>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 28px 80px' }}>

          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, marginBottom: 18, padding: 0 }}>
            <ArrowLeft size={13}/> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${role.color}18`, border: `1px solid ${role.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
              {role.icon}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>{role.label}</h1>
              <p style={{ margin: 0, fontSize: 12.5, color: TEXT2 }}>{role.tagline}</p>
            </div>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {role.fields.map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'brand' || f.key === 'goal' ? '1/-1' : 'auto' }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input style={inputStyle} placeholder={f.placeholder} value={inputs[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 14 }}>
                <AlertCircle size={13} color={RED} />
                <span style={{ fontSize: 12.5, color: TEXT2 }}>{error}</span>
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? `${role.color}55` : role.color, color: '#0a0907', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
              }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating {role.label} Brief…</> : <><Sparkles size={14} /> Generate {role.label} Brief</>}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {result.plSummary && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>P&L Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      <div><div style={{ fontSize: 10, color: TEXT3, marginBottom: 3 }}>REVENUE</div><div style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{result.plSummary.revenue}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3, marginBottom: 3 }}>MKTG SPEND</div><div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{result.plSummary.marketingSpend}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3, marginBottom: 3 }}>EST. PROFIT</div><div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{result.plSummary.estProfit}</div></div>
                    </div>
                    {result.plSummary.runwayNote && <div style={{ fontSize: 12, color: TEXT2, marginTop: 10, fontStyle: 'italic' }}>{result.plSummary.runwayNote}</div>}
                  </div>
                )}

                {result.budgetAllocation && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={13} color={GOLD}/> Recommended Budget Allocation</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.budgetAllocation.map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, minWidth: 120 }}>{b.channel}</div>
                          <div style={{ flex: 1, height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${b.pct}%`, height: '100%', background: GOLD }} />
                          </div>
                          <div style={{ fontSize: 12, color: TEXT2, minWidth: 60, textAlign: 'right' }}>{b.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.roiForecast && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>ROI Forecast (90 Days)</div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>PROJECTED REVENUE</div><div style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{result.roiForecast.projectedRevenue90d}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>PROJECTED ROAS</div><div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{result.roiForecast.projectedROAS}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>CONFIDENCE</div><div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{result.roiForecast.confidence}</div></div>
                    </div>
                  </div>
                )}

                {result.stackAssessment && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Stack Assessment</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.stackAssessment.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: s.risk === 'high' ? RED : s.risk === 'medium' ? GOLD : GREEN, background: `${s.risk === 'high' ? RED : s.risk === 'medium' ? GOLD : GREEN}15` }}>{s.risk?.toUpperCase()}</span>
                          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, minWidth: 90 }}>{s.area}</div>
                          <div style={{ fontSize: 12, color: TEXT2 }}>{s.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.sprintPlan && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Sprint Plan</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                      {[['Next 30 Days', result.sprintPlan.next30Days], ['Next 60 Days', result.sprintPlan.next60Days], ['Next 90 Days', result.sprintPlan.next90Days]].map(([label, items]) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
                          {renderList(items)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.visionStatement && (
                  <div style={{ background: `${GOLD}10`, border: `1px solid ${GBORD}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 8, textTransform: 'uppercase' }}>Vision Statement</div>
                    <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.6, fontStyle: 'italic' }}>"{result.visionStatement}"</div>
                  </div>
                )}

                {result.boardUpdate && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Board Update</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: GREEN, marginBottom: 6 }}>WINS</div>{renderList(result.boardUpdate.wins)}</div>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: GOLD, marginBottom: 6 }}>CHALLENGES</div>{renderList(result.boardUpdate.challenges)}</div>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: TEXT2, marginBottom: 6 }}>ASKS</div>{renderList(result.boardUpdate.asks)}</div>
                    </div>
                  </div>
                )}

                {result.investorPitch && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Investor Pitch</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
                      <div><strong style={{ color: TEXT }}>Hook:</strong> {result.investorPitch.hook}</div>
                      <div><strong style={{ color: TEXT }}>Traction:</strong> {result.investorPitch.traction}</div>
                      <div><strong style={{ color: TEXT }}>Ask:</strong> {result.investorPitch.ask}</div>
                    </div>
                  </div>
                )}

                {result.okrs && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>OKRs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {result.okrs.map((o, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 5 }}>{o.objective}</div>
                          {renderList(o.keyResults)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.revenueForecast && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Revenue Forecast</div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>CURRENT</div><div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{result.revenueForecast.current}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>PROJECTED 90D</div><div style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{result.revenueForecast.projected90d}</div></div>
                      <div><div style={{ fontSize: 10, color: TEXT3 }}>CONFIDENCE</div><div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{result.revenueForecast.confidence}</div></div>
                    </div>
                  </div>
                )}

                {result.pricingRecommendations && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Pricing Recommendations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.pricingRecommendations.map((p, i) => (
                        <div key={i} style={{ padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <div style={{ fontSize: 13, color: TEXT, marginBottom: 3 }}>{p.idea}</div>
                          <div style={{ fontSize: 11.5, color: GREEN }}>{p.expectedImpact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.upsellOpportunities && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Upsell Opportunities</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.upsellOpportunities.map((u, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <div><div style={{ fontSize: 13, color: TEXT }}>{u.segment}</div><div style={{ fontSize: 11.5, color: TEXT2 }}>{u.opportunity}</div></div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{u.estValue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(result.risks || result.technicalRisks) && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: RED, marginBottom: 10 }}>Risks to Watch</div>
                    {renderList(result.risks || result.technicalRisks)}
                  </div>
                )}

                {result.retentionPlan && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Retention Plan</div>
                    {renderList(result.retentionPlan)}
                  </div>
                )}

                {result.toolRecommendations && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Tool Recommendations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.toolRecommendations.map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <div><div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{t.tool}</div><div style={{ fontSize: 11.5, color: TEXT2 }}>{t.reason}</div></div>
                          <div style={{ fontSize: 12, color: TEXT2 }}>{t.costEstimate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations && (
                  <div style={{ background: `${role.color}0d`, border: `1px solid ${role.color}30`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Target size={13} color={role.color}/> Recommendations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.recommendations.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: CARD2, borderRadius: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, color: r.priority === 'high' ? RED : GOLD, background: `${r.priority === 'high' ? RED : GOLD}15`, marginTop: 2 }}>{r.priority?.toUpperCase()}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, color: TEXT }}>{r.action}</div>
                            <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{r.impact}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { setResult(null) }} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
