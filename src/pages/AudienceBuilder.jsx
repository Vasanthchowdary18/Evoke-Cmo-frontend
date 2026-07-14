import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, ArrowLeft, Loader2, Target, Copy, Check,
  ChevronRight, ArrowRight, CheckCircle2, Sparkles,
} from 'lucide-react'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const BORDER = 'rgba(255,255,255,0.07)'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.13)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.32)'
const FONT   = "'Inter','Syne',sans-serif"

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

async function buildAudiences(inputs) {
  const prompt = `You are an expert audience strategist for digital marketing platforms.

Based on this business profile:
- Product/Service: ${inputs.product}
- Industry: ${inputs.industry}
- Goal: ${inputs.goal}
- Budget Range: ${inputs.budget}
- Geographic Focus: ${inputs.geo}

Create 4 detailed audience segments for Meta Ads and Google Ads.

Return ONLY valid JSON:
{
  "primaryAudience": {
    "name": "Segment name",
    "size": "Estimated reach (e.g. 2.4M - 5.1M)",
    "description": "Who these people are",
    "demographics": { "age": "25-44", "gender": "All", "income": "Middle to Upper", "education": "Graduate+" },
    "interests": ["interest1","interest2","interest3","interest4","interest5","interest6"],
    "behaviours": ["behaviour1","behaviour2","behaviour3","behaviour4"],
    "platforms": ["Facebook","Instagram"],
    "cpmEstimate": "₹180-320",
    "conversionProbability": "High",
    "color": "#10b981"
  },
  "secondaryAudience": {
    "name": "Segment name",
    "size": "...",
    "description": "...",
    "demographics": { "age": "...", "gender": "...", "income": "...", "education": "..." },
    "interests": ["...","...","...","...","..."],
    "behaviours": ["...","...","..."],
    "platforms": ["LinkedIn","Google"],
    "cpmEstimate": "...",
    "conversionProbability": "Medium-High",
    "color": "#6366f1"
  },
  "lookalikeSeed": {
    "name": "Lookalike Audience",
    "size": "...",
    "description": "Built from your top 1-5% customers to find similar profiles",
    "demographics": { "age": "...", "gender": "...", "income": "...", "education": "..." },
    "interests": ["...","...","...","..."],
    "behaviours": ["...","...","..."],
    "platforms": ["Facebook","Instagram","Google"],
    "cpmEstimate": "...",
    "conversionProbability": "Very High",
    "color": "#f59e0b"
  },
  "retargetingAudience": {
    "name": "Retargeting Warm Audience",
    "size": "...",
    "description": "People who visited your site or engaged with your content in the last 30 days",
    "demographics": { "age": "...", "gender": "...", "income": "...", "education": "..." },
    "interests": ["...","...","..."],
    "behaviours": ["...","...","...","..."],
    "platforms": ["Facebook","Instagram","Google"],
    "cpmEstimate": "...",
    "conversionProbability": "Highest",
    "color": "#ec4899"
  },
  "metaAdSets": [
    { "name": "Ad set name", "audience": "Primary", "budget": "₹500/day", "objective": "Conversions", "placements": ["Feed","Stories"] },
    { "name": "...", "audience": "Secondary", "budget": "₹300/day", "objective": "Traffic", "placements": ["Feed","Reels"] },
    { "name": "...", "audience": "Retargeting", "budget": "₹200/day", "objective": "Conversions", "placements": ["Feed","Stories","Messenger"] }
  ],
  "googleKeywords": {
    "branded": ["keyword1","keyword2","keyword3"],
    "competitor": ["keyword1","keyword2","keyword3"],
    "highIntent": ["keyword1","keyword2","keyword3","keyword4"],
    "discovery": ["keyword1","keyword2","keyword3"]
  },
  "messagingBySegment": {
    "primary": "Key message / value prop for this audience",
    "secondary": "Key message for secondary audience",
    "retargeting": "Urgency / reminder message for warm audience"
  }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 3000 }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const d = await res.json()
  const raw = d?.choices?.[0]?.message?.content || ''
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('No JSON')
  return JSON.parse(m[0])
}

const PROB_COLORS = { 'High': '#10b981', 'Medium-High': '#f59e0b', 'Very High': '#6366f1', 'Highest': '#ec4899' }

function AudienceCard({ seg, label }) {
  const [copied, setCopied] = useState(false)
  if (!seg) return null
  const prob = PROB_COLORS[seg.conversionProbability] || GOLD
  const copyInterests = async () => {
    await navigator.clipboard.writeText((seg.interests || []).join(', '))
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#0e0c09', border: `1.5px solid ${seg.color}30`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${seg.color}, ${seg.color}60)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: seg.color, letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0 }}>{seg.name}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: TEXT3, marginBottom: 2 }}>Est. Reach</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: seg.color }}>{seg.size}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, margin: '0 0 14px' }}>{seg.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
        {Object.entries(seg.demographics || {}).map(([k, v]) => (
          <div key={k} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em' }}>INTERESTS</span>
          <button onClick={copyInterests} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '3px 8px', color: TEXT3, fontSize: 10, cursor: 'pointer', fontFamily: FONT }}>
            {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(seg.interests || []).map((int, i) => (
            <span key={i} style={{ padding: '3px 9px', background: seg.color + '10', border: `1px solid ${seg.color}25`, borderRadius: 100, fontSize: 11, fontWeight: 600, color: seg.color }}>{int}</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', marginBottom: 8 }}>BEHAVIOURS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(seg.behaviours || []).map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT2 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />{b}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(seg.platforms || []).map(p => (
            <span key={p} style={{ padding: '2px 8px', background: BORDER, borderRadius: 100, fontSize: 10, fontWeight: 700, color: TEXT3 }}>{p}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: TEXT3, marginBottom: 1 }}>CPM</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{seg.cpmEstimate}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: TEXT3, marginBottom: 1 }}>CONVERSION</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: prob }}>{seg.conversionProbability}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const STEPS = [
  { id: 'build',      label: 'Build',     num: 1 },
  { id: 'segments',   label: 'Segments',  num: 2 },
  { id: 'adsets',     label: 'Ad Sets',   num: 3 },
  { id: 'keywords',   label: 'Keywords',  num: 4 },
  { id: 'messaging',  label: 'Messaging', num: 5 },
]

function StepBar({ current }) {
  const idx = STEPS.findIndex(s => s.id === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done    = i < idx
        const active  = i === idx
        const locked  = i > idx
        const color   = done ? '#10b981' : active ? GOLD : TEXT3
        const bgColor = done ? 'rgba(16,185,129,0.12)' : active ? GDIM : 'transparent'
        const border  = done ? 'rgba(16,185,129,0.3)' : active ? GBORDER : BORDER
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px 6px 8px', background: bgColor, border: `1px solid ${border}`, borderRadius: 100, transition: 'all 0.3s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#10b981' : active ? GOLD : 'transparent', border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done
                  ? <CheckCircle2 size={12} color="#0e0c09" />
                  : <span style={{ fontSize: 10, fontWeight: 800, color }}>{s.num}</span>
                }
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: i < idx ? 'rgba(16,185,129,0.4)' : BORDER, flexShrink: 0 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function AudienceBuilder() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inputs, setInputs] = useState({ product: '', industry: 'Marketing & Advertising', goal: 'Lead Generation', budget: '$50 - $200/day', geo: 'India' })
  const [loading, setLoading]   = useState(false)
  const [data, setData]         = useState(null)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState('build')
  const [kbLoaded, setKbLoaded] = useState(false)

  const stepRef = useRef(null)

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(kb => {
      if (!kb) return
      setInputs(prev => ({
        ...prev,
        product:  prev.product  || kb.product  || kb.companyName || '',
        industry: prev.industry !== 'Marketing & Advertising' ? prev.industry : (kb.industry || prev.industry),
        geo:      prev.geo !== 'India' ? prev.geo : (kb.geoMarket || prev.geo),
        goal:     prev.goal,
      }))
      setKbLoaded(true)
    }).catch(() => {})
  }, [user?.uid])

  function set(k, v) { setInputs(p => ({ ...p, [k]: v })) }

  async function build() {
    if (!inputs.product.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const result = await buildAudiences(inputs)
      setData(result)
      setStep('segments')
      setTimeout(() => stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch { setError('Failed to build audiences. Try again.') }
    setLoading(false)
  }

  function goStep(s) {
    setStep(s)
    setTimeout(() => stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const SEL = { width: '100%', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '10px 12px', color: TEXT, fontSize: 13, fontFamily: FONT, outline: 'none' }
  const INP = { ...SEL }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT }}>
      <div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0, marginBottom: 18 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.07em', marginBottom: 10, display: 'flex', width: 'fit-content' }}>
            <Users size={10} /> AUDIENCE BUILDER
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', margin: '0 0 6px', fontFamily: "'Syne','Inter',sans-serif" }}>AI Audience Builder</h1>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Build precision audience segments for Meta, Google & LinkedIn ads</p>
        </div>

        {/* Step bar */}
        <div ref={stepRef}>
          <StepBar current={step} />
        </div>

        {/* ── STEP 1: Build form ── */}
        <AnimatePresence mode="wait">
          {step === 'build' && (
            <motion.div key="build" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {kbLoaded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, marginBottom: 16, width: 'fit-content' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Brand KB loaded — fields pre-filled</span>
                </div>
              )}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 26px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>PRODUCT / SERVICE</label>
                    <input value={inputs.product} onChange={e => set('product', e.target.value)} placeholder="e.g. SaaS Marketing Platform, Luxury Watches…" style={INP} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>INDUSTRY</label>
                    <select value={inputs.industry} onChange={e => set('industry', e.target.value)} style={SEL}>
                      {['Marketing & Advertising','Technology & SaaS','E-commerce & Retail','Food & Beverage','Health & Wellness','Finance & Fintech','Education & EdTech','Real Estate','Fashion & Lifestyle','Events & Entertainment'].map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>CAMPAIGN GOAL</label>
                    <select value={inputs.goal} onChange={e => set('goal', e.target.value)} style={SEL}>
                      {['Lead Generation','Sales & Conversions','Brand Awareness','App Installs','Event Registrations','Website Traffic','Retargeting'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>DAILY BUDGET</label>
                    <select value={inputs.budget} onChange={e => set('budget', e.target.value)} style={SEL}>
                      {['$10 - $50/day','$50 - $200/day','$200 - $1,000/day','$1,000+/day','₹500 - ₹2,000/day','₹2,000 - ₹10,000/day'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>GEO TARGET</label>
                    <select value={inputs.geo} onChange={e => set('geo', e.target.value)} style={SEL}>
                      {['India','USA','UK','UAE','Global','Southeast Asia','Australia','Canada'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={build} disabled={loading || !inputs.product.trim()}
                      style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? GDIM : `linear-gradient(135deg, ${GOLD}, #a87030)`, border: 'none', borderRadius: 10, color: loading ? GOLD : '#0e0c09', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: FONT, opacity: !inputs.product.trim() ? 0.4 : 1 }}
                    >
                      {loading
                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Building Audiences…</>
                        : <><Users size={14} /> Build Audiences</>}
                    </button>
                  </div>
                </div>
                {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#ef4444', fontSize: 13 }}>{error}</div>}
              </div>

              {/* Empty state */}
              <div style={{ marginTop: 20, textAlign: 'center', padding: '50px 20px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16 }}>
                <Users size={40} style={{ color: TEXT3, marginBottom: 14 }} />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Describe your product to build audiences</h3>
                <p style={{ fontSize: 13, color: TEXT2, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>AI builds 4 precision audience segments with demographics, interests, behaviours, and ad-ready configurations for Meta & Google.</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Audience Segments ── */}
          {step === 'segments' && data && (
            <motion.div key="segments" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <StepHeader
                icon={<Users size={16} />}
                title="Audience Segments"
                desc="4 precision segments built — review each one before moving to ad sets"
                color="#10b981"
                onBack={() => goStep('build')}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16, marginBottom: 24 }}>
                <AudienceCard seg={data.primaryAudience}     label="PRIMARY AUDIENCE" />
                <AudienceCard seg={data.secondaryAudience}   label="SECONDARY AUDIENCE" />
                <AudienceCard seg={data.lookalikeSeed}       label="LOOKALIKE AUDIENCE" />
                <AudienceCard seg={data.retargetingAudience} label="HIGH VALUE / RETARGETING" />
              </div>
              <NextBar label="Next: Meta Ad Sets" onNext={() => goStep('adsets')} color="#6366f1" />
            </motion.div>
          )}

          {/* ── STEP 3: Meta Ad Sets ── */}
          {step === 'adsets' && data && (
            <motion.div key="adsets" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <StepHeader
                icon={<Sparkles size={16} />}
                title="Meta Ad Sets"
                desc="Ready-to-use ad set configurations for Meta Ads Manager"
                color="#6366f1"
                onBack={() => goStep('segments')}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {(data.metaAdSets || []).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: CARD, border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 14, padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#6366f1' }} />
                    <div style={{ paddingLeft: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, padding: '2px 10px', letterSpacing: '0.06em' }}>AD SET {i + 1}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                        <Pill label="AUDIENCE" value={s.audience} color={GOLD} />
                        <Pill label="BUDGET" value={s.budget} color="#10b981" />
                        <Pill label="OBJECTIVE" value={s.objective} color="#6366f1" />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginRight: 4 }}>PLACEMENTS:</span>
                        {(s.placements || []).map(p => (
                          <span key={p} style={{ padding: '2px 9px', background: BORDER, borderRadius: 100, fontSize: 10, fontWeight: 700, color: TEXT3 }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <NextBar label="Next: Google Keywords" onNext={() => goStep('keywords')} color={GOLD} />
            </motion.div>
          )}

          {/* ── STEP 4: Google Keywords ── */}
          {step === 'keywords' && data && (
            <motion.div key="keywords" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <StepHeader
                icon={<Target size={16} />}
                title="Google Keywords"
                desc="Keyword groups ready to import into Google Ads campaigns"
                color={GOLD}
                onBack={() => goStep('adsets')}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
                {Object.entries(data.googleKeywords || {}).map(([type, kws]) => {
                  const colors = { branded: '#10b981', competitor: '#ef4444', highIntent: GOLD, discovery: '#6366f1' }
                  const c = colors[type] || GOLD
                  return (
                    <motion.div key={type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: CARD, border: `1px solid ${c}25`, borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: c, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' }}>
                        {type === 'highIntent' ? 'High Intent' : type.charAt(0).toUpperCase() + type.slice(1)} Keywords
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(kws || []).map((kw, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{kw}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <NextBar label="Next: Messaging Guide" onNext={() => goStep('messaging')} color="#ec4899" />
            </motion.div>
          )}

          {/* ── STEP 5: Messaging ── */}
          {step === 'messaging' && data && (
            <motion.div key="messaging" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <StepHeader
                icon={<Sparkles size={16} />}
                title="Messaging Guide"
                desc="Tailored copy angles for each audience segment"
                color="#ec4899"
                onBack={() => goStep('keywords')}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {Object.entries(data.messagingBySegment || {}).map(([seg, msg], i) => {
                  const colors = { primary: '#10b981', secondary: '#6366f1', retargeting: '#ec4899' }
                  const labels = { primary: 'PRIMARY SEGMENT', secondary: 'SECONDARY SEGMENT', retargeting: 'RETARGETING SEGMENT' }
                  const c = colors[seg] || GOLD
                  return (
                    <motion.div key={seg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ background: CARD, border: `1px solid ${c}25`, borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c }} />
                      <div style={{ paddingLeft: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: c, letterSpacing: '0.07em', marginBottom: 10 }}>{labels[seg] || seg.toUpperCase()}</div>
                        <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>"{msg}"</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Done CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'rgba(249,115,22,0.06)', border: '2px solid rgba(249,115,22,0.3)', borderRadius: 16, padding: '22px 26px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Audiences ready — what's next?</span>
                </div>
                {/* Journey progress — 12-step CMO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Brand Setup',       done: true },
                    { label: 'Strategy',           done: true },
                    { label: 'Campaign Planning',  done: true },
                    { label: 'Audiences',          done: true, active: true },
                    { label: 'Content Generation', done: false, next: true },
                    { label: 'Creative Assets',    done: false },
                    { label: '+ 7 more',           done: false, dim: true },
                  ].map((s, i, arr) => (
                    <React.Fragment key={s.label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, opacity: s.dim ? 0.4 : 1, background: s.active ? 'rgba(16,185,129,0.12)' : s.next ? 'rgba(249,115,22,0.1)' : s.done ? 'rgba(16,185,129,0.06)' : 'transparent', border: `1px solid ${s.active ? 'rgba(16,185,129,0.35)' : s.next ? 'rgba(249,115,22,0.3)' : s.done ? 'rgba(16,185,129,0.15)' : BORDER}` }}>
                        {s.done && !s.next
                          ? <CheckCircle2 size={10} color="#10b981" />
                          : <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${s.next ? '#f97316' : TEXT3}`, flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.active ? '#10b981' : s.next ? '#f97316' : s.done ? TEXT3 : TEXT3, whiteSpace: 'nowrap' }}>{s.label}</span>
                        {s.next && <span style={{ fontSize: 9, fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.15)', borderRadius: 100, padding: '1px 6px', marginLeft: 2 }}>NEXT</span>}
                      </div>
                      {i < arr.length - 1 && <div style={{ width: 8, height: 1, background: s.done ? 'rgba(16,185,129,0.3)' : BORDER, flexShrink: 0 }} />}
                    </React.Fragment>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 18px' }}>
                  Step 4 complete. Next up is <strong style={{ color: TEXT }}>Step 5: Content Generation</strong> — create captions, posts and copy targeted at the audiences you just built.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/caption-suite')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 24px', background: '#f97316', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}
                  >
                    Next: Content Generation <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => goStep('segments')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                  >
                    Review Audiences
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #1c1a13; color: #f0ebe0; }`}</style>
    </div>
  )
}

function StepHeader({ icon, title, desc, color, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>{title}</h2>
        </div>
        <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>{desc}</p>
      </div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', color: TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
        ← Back
      </button>
    </div>
  )
}

function NextBar({ label, onNext, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px 20px', background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12 }}
    >
      <button
        onClick={onNext}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: color, border: 'none', borderRadius: 10, color: color === GOLD ? '#0e0c09' : '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
      >
        {label} <ChevronRight size={16} />
      </button>
    </motion.div>
  )
}

function Pill({ label, value, color }) {
  return (
    <div style={{ background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
