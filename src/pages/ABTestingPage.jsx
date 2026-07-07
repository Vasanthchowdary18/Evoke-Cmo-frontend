import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, ArrowLeft, Loader2, Sparkles, Copy, Check,
  RefreshCw, ChevronRight, Target, BarChart2, AlertCircle,
  CheckCircle2, TrendingUp, Users, Clock, Zap, Trophy,
  MousePointer, Eye, ArrowRight, Play,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems } from '../services/contentService'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const BORDER  = 'rgba(255,255,255,0.07)'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const ACCENT  = '#f59e0b'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const EXPERIMENT_TYPES = [
  { key: 'copy',      label: 'Copy / Headline',  icon: <Target size={18}/>,       color: '#f59e0b', desc: 'Test subject lines, headlines, CTAs' },
  { key: 'creative',  label: 'Creative / Visual', icon: <Eye size={18}/>,          color: '#a855f7', desc: 'Test images, videos, layouts' },
  { key: 'audience',  label: 'Audience Segment',  icon: <Users size={18}/>,        color: '#10b981', desc: 'Test different audience groups' },
  { key: 'channel',   label: 'Channel / Format',  icon: <BarChart2 size={18}/>,    color: '#3b82f6', desc: 'Test email vs SMS vs social' },
]

const TRAFFIC_SPLITS = ['50% / 50%', '60% / 40%', '70% / 30%', '80% / 20%']
const DURATIONS      = ['3 days', '7 days', '14 days', '21 days', '30 days']
const SUCCESS_METRICS = ['Open Rate', 'Click-Through Rate', 'Conversion Rate', 'Revenue per User', 'Engagement Rate', 'ROAS']

async function generateABTest(inputs) {
  const prompt = `You are a world-class conversion rate optimisation (CRO) expert.

Create a complete A/B test experiment plan for:
- Brand: ${inputs.brand}
- Experiment Type: ${inputs.experimentType}
- Campaign / Page: ${inputs.campaign}
- Hypothesis: ${inputs.hypothesis}
- Traffic Split: ${inputs.trafficSplit}
- Duration: ${inputs.duration}
- Primary Success Metric: ${inputs.metric}
- Audience: ${inputs.audience || 'All users'}

Return ONLY valid JSON (no markdown):
{
  "experimentName": "Name of the experiment",
  "hypothesis": "Refined hypothesis statement",
  "variantA": {
    "name": "Control",
    "label": "Variant A — Control",
    "description": "Detailed description of control variant",
    "headline": "Actual headline or copy text",
    "cta": "CTA button text",
    "keyElement": "The key element being kept the same",
    "expectedBehaviour": "What we expect users to do"
  },
  "variantB": {
    "name": "Test",
    "label": "Variant B — Test",
    "description": "Detailed description of test variant",
    "headline": "Actual test headline or copy text",
    "cta": "Different CTA button text",
    "keyElement": "The key element being changed",
    "expectedBehaviour": "Why this change should perform better"
  },
  "experimentConfig": {
    "trafficSplit": "${inputs.trafficSplit}",
    "duration": "${inputs.duration}",
    "sampleSizeNeeded": "Minimum sample size per variant for statistical significance",
    "confidenceLevel": "95%",
    "primaryMetric": "${inputs.metric}",
    "secondaryMetrics": ["Secondary metric 1", "Secondary metric 2"]
  },
  "predictedResults": {
    "variantA": {
      "openRate": "22-26%",
      "ctr": "3.1%",
      "conversionRate": "1.8%",
      "confidence": 50
    },
    "variantB": {
      "openRate": "28-34%",
      "ctr": "4.8%",
      "conversionRate": "2.9%",
      "confidence": 73
    }
  },
  "statisticalSignificance": {
    "winner": "B",
    "confidence": "87%",
    "uplift": "+34% improvement in primary metric",
    "verdict": "Variant B is predicted to win based on the hypothesis and industry benchmarks",
    "minimumDetectableEffect": "5% relative improvement"
  },
  "implementationSteps": [
    "Step 1 with specific action",
    "Step 2 with specific action",
    "Step 3 with specific action",
    "Step 4 with specific action"
  ],
  "winnerDeployment": {
    "action": "Deploy Variant B to 100% of traffic",
    "nextTest": "Follow-up test idea based on learnings",
    "estimatedImpact": "Projected annual revenue or conversion impact"
  },
  "watchOutFor": ["Risk or confounding factor 1", "Risk or confounding factor 2", "Risk or confounding factor 3"]
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

export default function ABTestingPage() {
  useRequireAuth()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [expType, setExpType]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null)
  const [copied, setCopied]     = useState('')
  const [step, setStep]         = useState('type') // type | config | result

  const [form, setForm] = useState({
    brand: '', campaign: '', hypothesis: '', audience: '',
    trafficSplit: '50% / 50%', duration: '7 days', metric: 'Click-Through Rate',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.brand || !form.hypothesis) { setError('Fill in Brand and Hypothesis to continue.'); return }
    setError(''); setLoading(true)
    try {
      const res = await generateABTest({ ...form, experimentType: expType?.label })
      setResult(res)
      setStep('result')
      if (user?.uid) {
        await saveContentItems([{
          userId: user.uid,
          campaignId: `ab_${Date.now()}`,
          campaignName: res.experimentName || 'A/B Test',
          campaignType: 'ab_testing',
          type: 'strategy',
          platform: '',
          subject: res.experimentName || '',
          text: res.hypothesis || '',
          data: JSON.stringify(res),
          status: 'draft',
          source: 'ab-testing',
        }])
      }
    } catch (e) {
      setError('Generation failed. Check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) })
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: '#0e0c09', border: `1px solid ${BORDER}`,
    borderRadius: 10, padding: '11px 14px',
    color: TEXT, fontSize: 14, fontFamily: "'Inter',sans-serif",
    outline: 'none', transition: 'border 0.15s',
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: TEXT2, letterSpacing: '0.06em', display: 'block', marginBottom: 7 }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <button onClick={() => step === 'result' ? setStep('config') : step === 'config' ? setStep('type') : navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={15} /> {step === 'result' ? 'Edit Config' : step === 'config' ? 'Change Type' : 'Back'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} color={ACCENT} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', marginBottom: 2 }}>A/B TESTING FRAMEWORK</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>A/B Testing Framework</h1>
            </div>
          </div>
          <p style={{ fontSize: 14, color: TEXT2, margin: 0, maxWidth: 560, lineHeight: 1.65 }}>
            Design experiments, generate variants, run statistical significance analysis and deploy the winning version.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[['type','1','Experiment Type'],['config','2','Experiment Config'],['result','3','Results & Winner']].map(([s, n, label]) => {
            const steps = ['type','config','result']
            const past  = steps.indexOf(step) > steps.indexOf(s)
            const active = step === s
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: active ? ACCENT : past ? `${ACCENT}30` : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : past ? ACCENT : TEXT3,
                  border: `1px solid ${active ? ACCENT : 'transparent'}`,
                }}>{n}</div>
                <span style={{ fontSize: 12, color: active ? TEXT : TEXT3, fontWeight: active ? 600 : 400 }}>{label}</span>
                {n !== '3' && <ChevronRight size={12} color={TEXT3} style={{ marginLeft: 2 }} />}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Experiment Type ── */}
          {step === 'type' && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>What are you testing?</div>
                <p style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Select the type of experiment you want to run.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {EXPERIMENT_TYPES.map(et => (
                    <motion.button key={et.key} whileHover={{ y: -2 }}
                      onClick={() => { setExpType(et); setStep('config') }}
                      style={{
                        background: '#0e0c09', border: `1.5px solid ${BORDER}`,
                        borderRadius: 12, padding: '18px 20px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${et.color}60`; e.currentTarget.style.background = `${et.color}08` }}
                      onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${BORDER}`; e.currentTarget.style.background = '#0e0c09' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${et.color}15`, border: `1px solid ${et.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: et.color, flexShrink: 0 }}>
                        {et.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{et.label}</div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>{et.desc}</div>
                      </div>
                      <ArrowRight size={14} color={TEXT3} style={{ marginLeft: 'auto' }} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Config ── */}
          {step === 'config' && (
            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {expType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 16px', background: `${expType.color}10`, border: `1px solid ${expType.color}30`, borderRadius: 10 }}>
                  <div style={{ color: expType.color }}>{expType.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: expType.color }}>{expType.label}</span>
                  <button onClick={() => setStep('type')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', fontSize: 12 }}>Change</button>
                </div>
              )}

              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 20 }}>Experiment Configuration</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>BRAND / CAMPAIGN NAME *</label>
                    <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. EVOX AI — July Launch" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>CAMPAIGN / PAGE BEING TESTED</label>
                    <input value={form.campaign} onChange={e => set('campaign', e.target.value)} placeholder="e.g. Homepage hero, Email subject line" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>HYPOTHESIS *</label>
                    <input value={form.hypothesis} onChange={e => set('hypothesis', e.target.value)} placeholder='e.g. "Changing the CTA from Sign Up to Start Free will increase clicks by 20%"' style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>AUDIENCE</label>
                    <input value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. New visitors, existing customers" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>PRIMARY SUCCESS METRIC</label>
                    <select value={form.metric} onChange={e => set('metric', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {SUCCESS_METRICS.map(m => <option key={m} value={m} style={{ background: CARD }}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>TRAFFIC SPLIT</label>
                    <select value={form.trafficSplit} onChange={e => set('trafficSplit', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {TRAFFIC_SPLITS.map(t => <option key={t} value={t} style={{ background: CARD }}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>TEST DURATION</label>
                    <select value={form.duration} onChange={e => set('duration', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {DURATIONS.map(d => <option key={d} value={d} style={{ background: CARD }}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
                    <AlertCircle size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate} disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? `${ACCENT}40` : `linear-gradient(135deg, #f59e0b, #d97706)`,
                    color: '#0e0c09', fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Experiment…</>
                    : <><FlaskConical size={16} /> Generate A/B Test Plan</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Results ── */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* Experiment name */}
              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 14, padding: '16px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', marginBottom: 3 }}>EXPERIMENT READY</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>{result.experimentName}</div>
                  <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>{result.hypothesis}</div>
                </div>
                <button onClick={() => { setStep('config'); setResult(null) }}
                  style={{ padding: '8px 14px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {/* Variant A vs B */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { key: 'A', data: result.variantA, color: '#3b82f6', label: 'CONTROL' },
                  { key: 'B', data: result.variantB, color: '#10b981', label: 'TEST', winner: result.statisticalSignificance?.winner === 'B' },
                ].map(({ key, data, color, label, winner }) => (
                  <motion.div key={key} whileHover={{ y: -2 }}
                    style={{ background: CARD, border: `1.5px solid ${winner ? color : BORDER}`, borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                    {winner && (
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 100 }}>
                        <Trophy size={11} color={color} />
                        <span style={{ fontSize: 10, fontWeight: 800, color }}>PREDICTED WINNER</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color }}>{key}</div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.1em' }}>VARIANT {key} — {label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{data?.name}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12, padding: '10px 12px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: TEXT3, marginBottom: 4, fontWeight: 700 }}>HEADLINE / COPY</div>
                      <div style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>{data?.headline}</div>
                    </div>
                    <div style={{ marginBottom: 12, padding: '10px 12px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'center' }}>{data?.cta}</div>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>{data?.description}</div>
                    <div style={{ fontSize: 11, color: TEXT3, fontStyle: 'italic' }}>{data?.expectedBehaviour}</div>

                    {/* Predicted metrics */}
                    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                      {[
                        { label: 'Open Rate', value: key === 'A' ? result.predictedResults?.variantA?.openRate : result.predictedResults?.variantB?.openRate },
                        { label: 'CTR', value: key === 'A' ? result.predictedResults?.variantA?.ctr : result.predictedResults?.variantB?.ctr },
                        { label: 'Conv.', value: key === 'A' ? result.predictedResults?.variantA?.conversionRate : result.predictedResults?.variantB?.conversionRate },
                      ].map(m => (
                        <div key={m.label} style={{ padding: '8px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color }}>{m.value}</div>
                          <div style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Experiment Config summary */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Clock size={14} color={ACCENT} /> Experiment Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    { label: 'Traffic Split', value: result.experimentConfig?.trafficSplit },
                    { label: 'Duration', value: result.experimentConfig?.duration },
                    { label: 'Sample Size', value: result.experimentConfig?.sampleSizeNeeded },
                    { label: 'Confidence Level', value: result.experimentConfig?.confidenceLevel },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '12px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: TEXT3, marginTop: 3 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  {result.experimentConfig?.secondaryMetrics?.map((m, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '4px 10px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, borderRadius: 6, color: ACCENT }}>Also tracking: {m}</span>
                  ))}
                </div>
              </div>

              {/* Statistical Significance */}
              <div style={{ background: CARD, border: `2px solid rgba(16,185,129,0.35)`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <TrendingUp size={14} color="#10b981" /> Statistical Significance Engine
                    </div>
                    <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.65, marginBottom: 8 }}>{result.statisticalSignificance?.verdict}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{result.statisticalSignificance?.uplift}</div>
                    <div style={{ fontSize: 12, color: TEXT3, marginTop: 4 }}>Min. detectable effect: {result.statisticalSignificance?.minimumDetectableEffect}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>CONFIDENCE</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{result.statisticalSignificance?.confidence}</div>
                    <div style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>Variant {result.statisticalSignificance?.winner} wins</div>
                  </div>
                </div>
              </div>

              {/* Winner Deployment + Implementation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Play size={14} color={GOLD} /> Implementation Steps
                  </div>
                  {result.implementationSteps?.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55 }}>{step}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: CARD, border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 14, padding: '18px 20px', flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Trophy size={14} color="#10b981" /> Winner Deployment
                    </div>
                    <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginBottom: 6 }}>{result.winnerDeployment?.action}</div>
                    <div style={{ fontSize: 12, color: TEXT2, marginBottom: 8 }}>{result.winnerDeployment?.estimatedImpact}</div>
                    <div style={{ fontSize: 11, color: TEXT3 }}>Next test: {result.winnerDeployment?.nextTest}</div>
                  </div>
                  <div style={{ background: CARD, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <AlertCircle size={14} color="#ef4444" /> Watch Out For
                    </div>
                    {result.watchOutFor?.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 6, display: 'flex', gap: 7 }}>
                        <span style={{ color: '#ef4444', flexShrink: 0 }}>!</span>{w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
