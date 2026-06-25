import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Zap, ArrowLeft, Loader2, Download,
  Target, ChevronRight, Copy, Check, Sparkles,
  Globe, BarChart2, DollarSign, Heart, ShoppingBag,
  Briefcase, GraduationCap, MapPin, Clock,
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

  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    }
  )
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
      style={{ background: CARD, border: `2px solid ${seg.color}30`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${seg.color}, ${seg.color}60)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: seg.color, letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>{seg.name}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 2 }}>Est. Reach</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: seg.color }}>{seg.size}</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, margin: '0 0 14px' }}>{seg.description}</p>

      {/* Demographics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {Object.entries(seg.demographics || {}).map(([k, v]) => (
          <div key={k} style={{ background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Interests */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em' }}>INTERESTS</span>
          <button onClick={copyInterests} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '3px 8px', color: TEXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(seg.interests || []).map((int, i) => (
            <span key={i} style={{ padding: '3px 9px', background: seg.color + '10', border: `1px solid ${seg.color}25`, borderRadius: 100, fontSize: 11, fontWeight: 600, color: seg.color }}>{int}</span>
          ))}
        </div>
      </div>

      {/* Behaviours */}
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

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(seg.platforms || []).map(p => (
            <span key={p} style={{ padding: '2px 8px', background: BORDER, borderRadius: 100, fontSize: 10, fontWeight: 700, color: TEXT3 }}>{p}</span>
          ))}
        </div>
        <div style={{ display: 'flex', align: 'center', gap: 10 }}>
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

export default function AudienceBuilder() {
  useRequireAuth()
  const navigate = useNavigate()
  const [inputs, setInputs] = useState({ product: '', industry: 'Marketing & Advertising', goal: 'Lead Generation', budget: '₹500 - ₹2,000/day', geo: 'India' })
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('segments')

  function set(k, v) { setInputs(p => ({ ...p, [k]: v })) }

  async function build() {
    if (!inputs.product.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const result = await buildAudiences(inputs)
      setData(result); setTab('segments')
    } catch (e) { setError('Failed to build audiences. Try again.') }
    setLoading(false)
  }

  const SEL = { width: '100%', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px', color: TEXT, fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const INP = { ...SEL }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.07em', marginBottom: 4 }}>
              <Users size={10} /> AUDIENCE BUILDER
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', margin: 0 }}>AI Audience Builder</h1>
            <p style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>Build precision audience segments for Meta, Google & LinkedIn ads</p>
          </div>
        </div>

        {/* Input form */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>PRODUCT / SERVICE</label>
              <input value={inputs.product} onChange={e => set('product', e.target.value)} placeholder="e.g. SaaS Marketing Platform, Luxury Watches, Online Courses…" style={INP} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>INDUSTRY</label>
              <select value={inputs.industry} onChange={e => set('industry', e.target.value)} style={SEL}>
                {['Marketing & Advertising','Technology & SaaS','E-commerce & Retail','Food & Beverage','Health & Wellness','Finance & Fintech','Education & EdTech','Real Estate','Fashion & Lifestyle','Events & Entertainment'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>CAMPAIGN GOAL</label>
              <select value={inputs.goal} onChange={e => set('goal', e.target.value)} style={SEL}>
                {['Lead Generation','Sales & Conversions','Brand Awareness','App Installs','Event Registrations','Website Traffic','Retargeting'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>DAILY BUDGET</label>
              <select value={inputs.budget} onChange={e => set('budget', e.target.value)} style={SEL}>
                {['₹200 - ₹500/day','₹500 - ₹2,000/day','₹2,000 - ₹10,000/day','₹10,000+/day','$50-$200/day','$200-$1,000/day'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>GEO TARGET</label>
              <select value={inputs.geo} onChange={e => set('geo', e.target.value)} style={SEL}>
                {['India','USA','UK','UAE','Global','Southeast Asia','Australia','Canada'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={build} disabled={loading || !inputs.product.trim()}
                style={{
                  width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: loading ? GDIM : `linear-gradient(135deg, ${GOLD}, #a87030)`,
                  border: 'none', borderRadius: 10, color: loading ? GOLD : '#0e0c09',
                  fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: !inputs.product.trim() ? 0.4 : 1,
                }}
              >
                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Building Audiences…</> : <><Users size={14} /> Build Audiences</>}
              </button>
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Results */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
              {['segments','adsets','keywords','messaging'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: tab === t ? GOLD : TEXT3, borderBottom: `2px solid ${tab === t ? GOLD : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize' }}>
                  {t === 'segments' ? 'Audience Segments' : t === 'adsets' ? 'Meta Ad Sets' : t === 'keywords' ? 'Google Keywords' : 'Messaging Guide'}
                </button>
              ))}
            </div>

            {tab === 'segments' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16 }}>
                <AudienceCard seg={data.primaryAudience}    label="PRIMARY AUDIENCE" />
                <AudienceCard seg={data.secondaryAudience}  label="SECONDARY AUDIENCE" />
                <AudienceCard seg={data.lookalikeSeed}      label="LOOKALIKE SEED" />
                <AudienceCard seg={data.retargetingAudience}label="RETARGETING" />
              </div>
            )}

            {tab === 'adsets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.metaAdSets || []).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>AD SET NAME</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{s.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>AUDIENCE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{s.audience}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>BUDGET</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{s.budget}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>OBJECTIVE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{s.objective}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                      {(s.placements || []).map(p => (
                        <span key={p} style={{ padding: '3px 9px', background: BORDER, borderRadius: 100, fontSize: 10, fontWeight: 700, color: TEXT3 }}>{p}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => navigate('/connect-accounts')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: `linear-gradient(135deg, ${GOLD}, #a87030)`, border: 'none', borderRadius: 11, color: '#0e0c09', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Target size={14} /> Export to Meta Ads Manager →
                  </button>
                </div>
              </div>
            )}

            {tab === 'keywords' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {Object.entries(data.googleKeywords || {}).map(([type, kws]) => {
                  const colors = { branded: '#10b981', competitor: '#ef4444', highIntent: GOLD, discovery: '#6366f1' }
                  const c = colors[type] || GOLD
                  return (
                    <div key={type} style={{ background: CARD, border: `1px solid ${c}25`, borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: c, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' }}>
                        {type === 'highIntent' ? 'High Intent' : type.charAt(0).toUpperCase() + type.slice(1)} Keywords
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(kws || []).map((kw, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{kw}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'messaging' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(data.messagingBySegment || {}).map(([seg, msg]) => {
                  const colors = { primary: '#10b981', secondary: '#6366f1', retargeting: '#ec4899' }
                  return (
                    <div key={seg} style={{ background: CARD, border: `1px solid ${(colors[seg] || GOLD)}25`, borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: colors[seg] || GOLD, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{seg} Segment Message</div>
                      <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{msg}"</p>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {!data && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16 }}>
            <Users size={44} style={{ color: TEXT3, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Describe your product to build audiences</h3>
            <p style={{ fontSize: 14, color: TEXT2, maxWidth: 400, margin: '0 auto' }}>AI builds 4 precision audience segments with demographics, interests, behaviours, and ad-ready configurations for Meta & Google.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #1c1a13; color: #f0ebe0; }`}</style>
    </div>
  )
}
