import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, ArrowLeft, Loader2, Sparkles, Check, Copy,
  Play, Mic, MonitorPlay, Clapperboard, ShoppingBag,
  Instagram, Megaphone, GraduationCap, Calendar,
  ChevronRight, Download, Shield, RefreshCw, CheckCircle2,
  AlertCircle, Clock, Zap, History,
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

const VIDEO_TYPES = [
  { key: 'promotional',  label: 'Promotional',       icon: <Megaphone size={20}/>,      desc: 'Brand awareness & offers',   color: '#c8973e' },
  { key: 'product',      label: 'Product Video',      icon: <ShoppingBag size={20}/>,    desc: 'Showcase features & demos',  color: '#10b981' },
  { key: 'reel',         label: 'Social Media Reel',  icon: <Instagram size={20}/>,      desc: '15–60 sec viral content',    color: '#e1306c' },
  { key: 'advertising',  label: 'Advertising',        icon: <Zap size={20}/>,            desc: 'Paid ad creatives',          color: '#6366f1' },
  { key: 'educational',  label: 'Educational',        icon: <GraduationCap size={20}/>,  desc: 'How-to & explainer videos',  color: '#3b82f6' },
  { key: 'event',        label: 'Event Video',        icon: <Calendar size={20}/>,       desc: 'Event promos & recaps',      color: '#f59e0b' },
]

async function generateVideoPackage(inputs) {
  const prompt = `You are an expert video production strategist for digital marketing.

Create a complete video production package for:
- Brand/Product: ${inputs.brand}
- Video Type: ${inputs.videoType}
- Campaign Goal: ${inputs.goal}
- Target Audience: ${inputs.audience}
- Duration: ${inputs.duration}
- Tone: ${inputs.tone}

Return ONLY valid JSON:
{
  "title": "Video project title",
  "hook": "Opening hook line (first 3 seconds)",
  "script": {
    "intro": "10-15 word intro script section",
    "body": "Main body script — 3 key points each in 1-2 sentences",
    "cta": "Call to action line"
  },
  "visualComposition": {
    "style": "Visual style description",
    "scenes": [
      { "scene": 1, "duration": "0-5s", "visual": "What appears on screen", "text": "On-screen text overlay" },
      { "scene": 2, "duration": "5-15s", "visual": "Scene description", "text": "Text overlay" },
      { "scene": 3, "duration": "15-25s", "visual": "Scene description", "text": "Text overlay" },
      { "scene": 4, "duration": "25-30s", "visual": "CTA scene description", "text": "CTA text" }
    ],
    "colorPalette": ["#hex1", "#hex2", "#hex3"],
    "fontStyle": "Font recommendation"
  },
  "audio": {
    "musicGenre": "Recommended background music genre",
    "musicMood": "Energetic / Calm / Inspirational / etc.",
    "voiceoverTone": "Professional / Friendly / Authoritative / etc.",
    "soundEffects": ["effect1", "effect2", "effect3"]
  },
  "brandConformance": {
    "status": "approved",
    "score": 92,
    "checks": [
      { "item": "Brand color usage", "pass": true },
      { "item": "Logo placement", "pass": true },
      { "item": "Font consistency", "pass": true },
      { "item": "Messaging alignment", "pass": true },
      { "item": "CTA clarity", "pass": true }
    ],
    "notes": "Brief governance note"
  },
  "estimatedEngagement": {
    "views": "10K–50K estimated views",
    "completionRate": "65%",
    "ctr": "3.2%"
  }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

const DURATIONS = ['15 seconds', '30 seconds', '60 seconds', '90 seconds', '2 minutes', '3-5 minutes']
const TONES     = ['Energetic', 'Professional', 'Friendly', 'Inspirational', 'Urgent', 'Cinematic']

export default function VideoGenerationPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [videoType, setVideoType] = useState('')
  const [inputs, setInputs]       = useState({ brand: '', goal: '', audience: '', duration: '30 seconds', tone: 'Energetic' })
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState('')
  const [activeTab, setActiveTab] = useState('script')
  const [savedDocId, setSavedDocId] = useState(null)
  const [history, setHistory]     = useState([])

  const inp = (field) => ({ value: inputs[field], onChange: e => setInputs(p => ({ ...p, [field]: e.target.value })) })

  const loadHistory = async () => {
    if (!user?.uid) return
    try {
      const items = await getContentItems(user.uid)
      setHistory(items.filter(i => i.campaignType === 'video_generation').slice(0, 5))
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user?.uid])

  const handleGenerate = async () => {
    if (!videoType || !inputs.brand || !inputs.goal) return
    setLoading(true)
    setError('')
    setResult(null)
    setSavedDocId(null)
    try {
      const r = await generateVideoPackage({ ...inputs, videoType })
      setResult(r)
      setActiveTab('script')
      try {
        const ids = await saveContentItems(
          user?.uid,
          { name: inputs.brand, type: 'video_generation', source: 'campaign' },
          [{ key: 'output', type: 'strategy', platform: '', text: r.title, data: JSON.stringify(r) }],
          'draft'
        )
        setSavedDocId(ids['output'] || null)
        loadHistory()
      } catch {}
    } catch (e) {
      setError('Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const label = { fontSize: 12, color: TEXT3, marginBottom: 6, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const inputStyle = {
    width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10,
    color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const tabBtn = (key) => ({
    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: activeTab === key ? GOLD : 'transparent',
    color: activeTab === key ? '#0e0c09' : TEXT2,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={22} color={GOLD} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Video Generation</h1>
              <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>Fig. 17 · AI-powered video production package</p>
            </div>
          </div>
        </div>

        {/* Step 1 — Video Type Selector */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Step 1 — Select video type</h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: TEXT2 }}>Choose the format that matches your campaign objective</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {VIDEO_TYPES.map(vt => (
              <button key={vt.key} onClick={() => setVideoType(vt.key)} style={{
                background: videoType === vt.key ? GDIM : CARD2,
                border: `1px solid ${videoType === vt.key ? GBORDER : BORDER}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <div style={{ color: videoType === vt.key ? GOLD : TEXT2, marginBottom: 8 }}>{vt.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: videoType === vt.key ? TEXT : TEXT2, marginBottom: 3 }}>{vt.label}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>{vt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Inputs */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Step 2 — Campaign details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={label}>Brand / Product name *</label>
              <input style={inputStyle} placeholder="e.g. EvoX AI Platform" {...inp('brand')} />
            </div>
            <div>
              <label style={label}>Campaign goal *</label>
              <input style={inputStyle} placeholder="e.g. Increase trial sign-ups by 30%" {...inp('goal')} />
            </div>
            <div>
              <label style={label}>Target audience</label>
              <input style={inputStyle} placeholder="e.g. Marketing managers, 28-45, India" {...inp('audience')} />
            </div>
            <div>
              <label style={label}>Video duration</label>
              <select style={selectStyle} value={inputs.duration} onChange={e => setInputs(p => ({ ...p, duration: e.target.value }))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>Tone & style</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setInputs(p => ({ ...p, tone: t }))} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', border: `1px solid ${inputs.tone === t ? GBORDER : BORDER}`,
                    background: inputs.tone === t ? GDIM : 'transparent',
                    color: inputs.tone === t ? GOLD : TEXT2,
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <button onClick={handleGenerate} disabled={loading || !videoType || !inputs.brand || !inputs.goal} style={{
            background: (!videoType || !inputs.brand || !inputs.goal) ? 'rgba(200,151,62,0.3)' : GOLD,
            color: '#0e0c09', border: 'none', borderRadius: 12, padding: '14px 40px',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Clapperboard size={18} /> Generate Video Package</>}
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

              {/* Title bar */}
              <div style={{ background: CARD, border: `1px solid ${GBORDER}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{result.title}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>Hook: "{result.hook}"</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ textAlign: 'center', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '6px 12px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{result.estimatedEngagement?.views}</div>
                    <div style={{ fontSize: 10, color: TEXT3 }}>Est. views</div>
                  </div>
                  <div style={{ textAlign: 'center', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '6px 12px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{result.estimatedEngagement?.completionRate}</div>
                    <div style={{ fontSize: 10, color: TEXT3 }}>Completion</div>
                  </div>
                  <div style={{ textAlign: 'center', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '6px 12px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{result.estimatedEngagement?.ctr}</div>
                    <div style={{ fontSize: 10, color: TEXT3 }}>CTR</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    { key: 'script', label: 'Script', icon: <Clapperboard size={13}/> },
                    { key: 'visual', label: 'Visual Composition', icon: <MonitorPlay size={13}/> },
                    { key: 'audio',  label: 'Audio & Voiceover',  icon: <Mic size={13}/> },
                    { key: 'brand',  label: 'Brand Review',       icon: <Shield size={13}/> },
                  ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{t.icon}{t.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ padding: 20 }}>
                  {/* Script tab */}
                  {activeTab === 'script' && result.script && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { key: 'intro', label: 'Intro', color: '#10b981' },
                        { key: 'body',  label: 'Main Body', color: GOLD },
                        { key: 'cta',   label: 'Call to Action', color: '#6366f1' },
                      ].map(s => (
                        <div key={s.key} style={{ background: CARD2, borderRadius: 12, padding: 16, position: 'relative' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                          <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{result.script[s.key]}</div>
                          <button onClick={() => copyText(result.script[s.key], s.key)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: TEXT3 }}>
                            {copied === s.key ? <Check size={14} color={GOLD} /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Visual Composition tab */}
                  {activeTab === 'visual' && result.visualComposition && (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ background: CARD2, borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                          <span style={{ color: TEXT3 }}>Style: </span><span style={{ color: TEXT }}>{result.visualComposition.style}</span>
                        </div>
                        <div style={{ background: CARD2, borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                          <span style={{ color: TEXT3 }}>Font: </span><span style={{ color: TEXT }}>{result.visualComposition.fontStyle}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD2, borderRadius: 8, padding: '8px 14px' }}>
                          <span style={{ fontSize: 13, color: TEXT3 }}>Palette:</span>
                          {(result.visualComposition.colorPalette || []).map((c, i) => (
                            <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: `1px solid ${BORDER}` }} title={c} />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(result.visualComposition.scenes || []).map((sc, i) => (
                          <div key={i} style={{ background: CARD2, borderRadius: 12, padding: 14, display: 'flex', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Scene {sc.scene}</span>
                                <span style={{ fontSize: 11, color: TEXT3, background: BORDER, borderRadius: 6, padding: '2px 8px' }}><Clock size={10} style={{ verticalAlign: 'middle' }} /> {sc.duration}</span>
                              </div>
                              <div style={{ fontSize: 13, color: TEXT2, marginBottom: 4 }}>{sc.visual}</div>
                              {sc.text && <div style={{ fontSize: 12, color: GOLD, fontStyle: 'italic' }}>"{sc.text}"</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio tab */}
                  {activeTab === 'audio' && result.audio && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { label: 'Music Genre', value: result.audio.musicGenre, icon: '🎵' },
                        { label: 'Music Mood', value: result.audio.musicMood, icon: '🎭' },
                        { label: 'Voiceover Tone', value: result.audio.voiceoverTone, icon: '🎙️' },
                      ].map(a => (
                        <div key={a.label} style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 12, color: TEXT3, marginBottom: 6 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{a.value}</div>
                        </div>
                      ))}
                      <div style={{ background: CARD2, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 12, color: TEXT3, marginBottom: 8 }}>🔊 Sound Effects</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(result.audio.soundEffects || []).map((s, i) => (
                            <span key={i} style={{ fontSize: 12, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 20, padding: '3px 10px', color: GOLD }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Brand Review tab */}
                  {activeTab === 'brand' && result.brandConformance && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: CARD2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 700, color: result.brandConformance.status === 'approved' ? '#10b981' : '#f59e0b' }}>
                            {result.brandConformance.score}
                          </div>
                          <div style={{ fontSize: 11, color: TEXT3 }}>Brand Score</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            {result.brandConformance.status === 'approved'
                              ? <CheckCircle2 size={16} color="#10b981" />
                              : <AlertCircle size={16} color="#f59e0b" />}
                            <span style={{ fontSize: 14, fontWeight: 600, color: result.brandConformance.status === 'approved' ? '#10b981' : '#f59e0b', textTransform: 'capitalize' }}>
                              {result.brandConformance.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: TEXT2 }}>{result.brandConformance.notes}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(result.brandConformance.checks || []).map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD2, borderRadius: 10, padding: '10px 14px' }}>
                            {c.pass
                              ? <CheckCircle2 size={16} color="#10b981" />
                              : <AlertCircle size={16} color="#f59e0b" />}
                            <span style={{ fontSize: 14, color: TEXT }}>{c.item}</span>
                          </div>
                        ))}
                      </div>
                      {result.brandConformance.status === 'approved' && (
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                          <div style={{ fontSize: 13, color: TEXT2, marginBottom: 10 }}>Ready for publishing queue</div>
                          <button onClick={() => navigate('/queue')} style={{ background: GOLD, color: '#0e0c09', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Send to Approval Queue <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Re-generate */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={handleGenerate} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 22px', color: TEXT2, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={13} /> Regenerate
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
                  <button onClick={() => { try { setResult(JSON.parse(item.data)); setActiveTab('script') } catch {} }} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: GOLD, cursor: 'pointer', fontWeight: 500 }}>Load</button>
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
