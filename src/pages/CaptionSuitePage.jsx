import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, ArrowLeft, ArrowRight, Loader2, Copy, Check,
  AlertCircle, Send, ShoppingBag, Layout, Shield,
  ChevronRight, CheckCircle2, Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const GREEN = '#10b981'
const BORDER = 'rgba(255,255,255,0.08)'
const FONT  = "'Inter', sans-serif"

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram',  color: '#dd2a7b' },
  { key: 'linkedin',  label: 'LinkedIn',   color: '#0a66c2' },
  { key: 'tiktok',    label: 'TikTok',     color: '#ff0050' },
  { key: 'facebook',  label: 'Facebook',   color: '#1877f2' },
  { key: 'twitter',   label: 'X / Twitter',color: '#e7e9ea' },
  { key: 'youtube',   label: 'YouTube',    color: '#ff0000' },
]

const CONTENT_TYPES = [
  'Product Post','Campaign Promo','Brand Awareness','Engagement / Question',
  'Reel / Short Video','Story Post','Event Announcement','Testimonial / Review',
]

const CHANNEL_TO_PLATFORM = {
  social_organic: ['instagram','facebook'],
  paid_social:    ['instagram','facebook'],
  video:          ['youtube','tiktok'],
  influencer:     ['instagram','tiktok'],
}

const TONE_LABELS = {
  professional:'Professional', friendly:'Friendly & Warm', bold:'Bold & Confident',
  playful:'Playful & Fun', inspirational:'Inspirational', luxurious:'Luxurious & Premium',
}

const STEPS = [
  { id: 'captions', label: 'Social Captions',     num: 1, color: GREEN,    icon: <Hash size={15}/> },
  { id: 'product',  label: 'Product Description',  num: 2, color: '#6366f1',icon: <ShoppingBag size={15}/> },
  { id: 'landing',  label: 'Landing Page',         num: 3, color: GOLD,     icon: <Layout size={15}/> },
]

async function callGroq(prompt, max_tokens = 2500) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.75, max_tokens }),
  })
  if (!res.ok) throw new Error(`Generation failed (${res.status})`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!match) throw new Error('Could not parse AI response. Please try again.')
  return JSON.parse(match[1])
}

async function generateCaptions({ platforms, contentType, context, tone }) {
  return callGroq(`You are an expert social media copywriter. Generate platform-optimised captions.

Platforms: ${platforms.join(', ')}
Content Type: ${contentType}
Brand/Campaign Context: ${context}
${tone ? `Tone: ${tone}` : ''}

For EACH platform, generate caption, CTA, and 10-15 hashtags.
Return ONLY valid JSON:
{ ${platforms.map(p => `"${p}": { "caption": "...", "cta": "...", "hashtags": ["#tag1","#tag2"] }`).join(', ')} }`)
}

async function generateProductDescription({ productName, features, audience, tone }) {
  return callGroq(`You are an expert product copywriter. Write product descriptions.

Product: ${productName}
Features: ${features}
Audience: ${audience}
Tone: ${tone}

Return ONLY valid JSON:
{ "short": "~50 word description", "medium": "~100 word description", "long": "~200 word description" }`, 1200)
}

async function generateLandingPage({ goal, headline, benefits, cta, audience }) {
  return callGroq(`You are an expert landing page copywriter.

Goal: ${goal}
Headline: ${headline}
Benefits: ${benefits}
CTA: ${cta}
Audience: ${audience}

Return ONLY valid JSON:
{
  "hero": { "headline": "...", "subheadline": "...", "cta": "..." },
  "features": { "title": "...", "points": ["...","...","..."] },
  "socialProof": { "title": "...", "placeholder": "..." },
  "ctaSection": { "headline": "...", "subtext": "...", "cta": "..." }
}`, 1200)
}

function StepBar({ current }) {
  const idx = STEPS.findIndex(s => s.id === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done   = i < idx
        const active = i === idx
        const color  = done ? GREEN : active ? s.color : TEXT3
        const bg     = done ? 'rgba(16,185,129,0.1)' : active ? `${s.color}12` : 'transparent'
        const border = done ? 'rgba(16,185,129,0.25)' : active ? `${s.color}40` : BORDER
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px 6px 8px', background: bg, border: `1px solid ${border}`, borderRadius: 100, transition: 'all 0.3s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? GREEN : active ? s.color : 'transparent', border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done
                  ? <CheckCircle2 size={12} color="#0e0c09" />
                  : <span style={{ fontSize: 10, fontWeight: 800, color }}>{s.num}</span>
                }
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: i < idx ? 'rgba(16,185,129,0.35)' : BORDER, flexShrink: 0 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function SectionHeader({ icon, title, desc, color, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: TEXT2, margin: 0 }}>{desc}</p>
        </div>
      </div>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', color: TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          ← Back
        </button>
      )}
    </div>
  )
}

function NextBar({ label, onNext, color }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '14px 18px', background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12, marginTop: 8 }}>
      <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: color, border: 'none', borderRadius: 10, color: color === GOLD ? '#0e0c09' : '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
        {label} <ChevronRight size={16} />
      </button>
    </motion.div>
  )
}

function CopyBtn({ text, id, copied, onCopy, style: extraStyle = {} }) {
  return (
    <button onClick={() => onCopy(id, text)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: TEXT2, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, ...extraStyle }}>
      {copied[id] ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  )
}

export default function CaptionSuitePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const stepRef  = useRef(null)

  const [step, setStep] = useState('captions')
  const [copied, setCopied] = useState({})

  // Captions state
  const [platforms, setPlatforms]   = useState([])
  const [contentType, setContentType] = useState('')
  const [context, setContext]       = useState('')
  const [tone, setTone]             = useState('')
  const [capLoading, setCapLoading] = useState(false)
  const [capError, setCapError]     = useState('')
  const [capResults, setCapResults] = useState(null)

  // Product Description state
  const [prodName, setProdName]         = useState('')
  const [prodFeatures, setProdFeatures] = useState('')
  const [prodAudience, setProdAudience] = useState('')
  const [prodTone, setProdTone]         = useState('Professional')
  const [prodLoading, setProdLoading]   = useState(false)
  const [prodError, setProdError]       = useState('')
  const [prodResults, setProdResults]   = useState(null)

  // Landing Page state
  const [lpGoal, setLpGoal]         = useState('')
  const [lpHeadline, setLpHeadline] = useState('')
  const [lpBenefits, setLpBenefits] = useState('')
  const [lpCta, setLpCta]           = useState('')
  const [lpAudience, setLpAudience] = useState('')
  const [lpLoading, setLpLoading]   = useState(false)
  const [lpError, setLpError]       = useState('')
  const [lpResults, setLpResults]   = useState(null)

  // KB auto-fill
  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(kb => {
      if (!kb) return
      if (kb.toneOfVoice) setTone(TONE_LABELS[kb.toneOfVoice] || kb.toneOfVoice)
      if (kb.productService) {
        setContext(kb.productService)
        setProdName(kb.companyName || '')
        setProdAudience(kb.targetAudience || '')
        setLpAudience(kb.targetAudience || '')
      }
      const channels = kb.priorityChannels || []
      const mapped = new Set()
      channels.forEach(ch => (CHANNEL_TO_PLATFORM[ch] || []).forEach(p => mapped.add(p)))
      if (mapped.size > 0) setPlatforms([...mapped])
    }).catch(() => {})
  }, [user?.uid])

  function goStep(s) {
    setStep(s)
    setTimeout(() => stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function copyText(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [id]: true }))
      setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 2000)
    })
  }

  const INP = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT, fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
  const TA  = { ...INP, resize: 'vertical', minHeight: 100 }
  const SEL = { ...INP, cursor: 'pointer', colorScheme: 'dark', background: CARD }
  const LBL = { fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 8, display: 'block' }
  const REQ = { color: GREEN, marginLeft: 3 }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '88px 24px 80px' }}>

        {/* Header */}
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: FONT }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${GREEN}18`, border: `1px solid ${GREEN}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}>
            <Hash size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Content Generation Suite</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(200,151,62,0.15)', color: GOLD, border: '1px solid rgba(200,151,62,0.3)' }}>STEP 5</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT2, margin: '4px 0 0' }}>Generate captions, product descriptions, and landing page copy — all in one flow.</p>
          </div>
        </div>

        <div ref={stepRef}>
          <StepBar current={step} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Social Captions ── */}
          {step === 'captions' && (
            <motion.div key="captions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <SectionHeader icon={<Hash size={15}/>} title="Social Captions" desc="AI-written captions, CTAs & hashtags for every platform" color={GREEN} />

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Platforms <span style={REQ}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const active = platforms.includes(p.key)
                    return (
                      <button key={p.key} onClick={() => setPlatforms(prev => active ? prev.filter(k => k !== p.key) : [...prev, p.key])}
                        style={{ padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', background: active ? `${p.color}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.1)'}`, color: active ? p.color : TEXT3 }}>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Content Type <span style={REQ}>*</span></label>
                <select value={contentType} onChange={e => setContentType(e.target.value)} style={SEL}>
                  <option value="">Select content type...</option>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Product / Campaign Context <span style={REQ}>*</span></label>
                <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Describe your product, service, or campaign..." style={TA} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Brand Tone <span style={{ color: TEXT3, fontWeight: 400, marginLeft: 6 }}>(optional)</span></label>
                <input value={tone} onChange={e => setTone(e.target.value)} placeholder="e.g. Professional, Bold, Playful..." style={INP} />
              </div>

              {capError && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><AlertCircle size={15} />{capError}</div>}

              <button
                onClick={async () => {
                  setCapError('')
                  if (!platforms.length) return setCapError('Select at least one platform.')
                  if (!contentType) return setCapError('Select a content type.')
                  if (!context.trim()) return setCapError('Enter your campaign context.')
                  setCapLoading(true); setCapResults(null)
                  try { setCapResults(await generateCaptions({ platforms, contentType, context, tone })) }
                  catch (e) { setCapError(e.message || 'Generation failed.') }
                  setCapLoading(false)
                }}
                disabled={capLoading}
                style={{ width: '100%', padding: '14px', background: capLoading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${GREEN}, #059669)`, border: 'none', borderRadius: 12, color: capLoading ? TEXT3 : '#fff', fontSize: 15, fontWeight: 800, cursor: capLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT }}
              >
                {capLoading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating Captions…</> : <>Generate Captions & Hashtags <ArrowRight size={17} /></>}
              </button>

              <AnimatePresence>
                {capResults && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Generated Captions</p>
                    {platforms.map(pKey => {
                      const plat = PLATFORMS.find(p => p.key === pKey)
                      const d = capResults[pKey]
                      if (!d) return null
                      const full = `${d.caption}\n\n${d.cta}\n\n${(d.hashtags||[]).join(' ')}`
                      return (
                        <div key={pKey} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${plat.color}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: plat.color }}>{plat.label}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <CopyBtn text={full} id={pKey} copied={copied} onCopy={copyText} />
                              <button onClick={() => navigate('/post-content', { state: { captionPrefill: full, platform: pKey, from: '/caption-suite' } })} style={{ background: `${plat.color}18`, border: `1px solid ${plat.color}40`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: plat.color, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT }}>
                                <Send size={12} /> Post Now
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Caption</p>
                          <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{d.caption}</p>
                          {d.cta && <><p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>CTA</p><p style={{ fontSize: 13, color: GOLD, fontWeight: 600, margin: '0 0 12px' }}>{d.cta}</p></>}
                          {d.hashtags?.length > 0 && (
                            <>
                              <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hashtags</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {d.hashtags.map((tag, i) => <span key={i} onClick={() => copyText(`${pKey}-tag-${i}`, tag)} title="Click to copy" style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${plat.color}14`, border: `1px solid ${plat.color}25`, color: plat.color, cursor: 'pointer' }}>{tag}</span>)}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                    <NextBar label="Next: Product Description" onNext={() => goStep('product')} color="#6366f1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── STEP 2: Product Description ── */}
          {step === 'product' && (
            <motion.div key="product" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <SectionHeader icon={<ShoppingBag size={15}/>} title="Product Description" desc="Short, medium and long copy — ready to use on any channel" color="#6366f1" onBack={() => goStep('captions')} />

              <div style={{ marginBottom: 18 }}>
                <label style={LBL}>Product Name <span style={REQ}>*</span></label>
                <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. EvoX AI Marketing Platform" style={INP} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={LBL}>Key Features <span style={REQ}>*</span></label>
                <textarea value={prodFeatures} onChange={e => setProdFeatures(e.target.value)} placeholder="e.g. AI campaign builder, audience segmentation, real-time analytics..." style={TA} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={LBL}>Target Audience</label>
                  <input value={prodAudience} onChange={e => setProdAudience(e.target.value)} placeholder="e.g. Marketing managers, SMB owners" style={INP} />
                </div>
                <div>
                  <label style={LBL}>Tone</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Professional','Casual','Persuasive'].map(t => (
                      <button key={t} onClick={() => setProdTone(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${prodTone === t ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, background: prodTone === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: prodTone === t ? '#6366f1' : TEXT3, fontFamily: FONT }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {prodError && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><AlertCircle size={15} />{prodError}</div>}

              <button
                onClick={async () => {
                  setProdError('')
                  if (!prodName.trim() || !prodFeatures.trim()) return setProdError('Product name and features are required.')
                  setProdLoading(true); setProdResults(null)
                  try { setProdResults(await generateProductDescription({ productName: prodName, features: prodFeatures, audience: prodAudience, tone: prodTone })) }
                  catch (e) { setProdError(e.message || 'Generation failed.') }
                  setProdLoading(false)
                }}
                disabled={prodLoading}
                style={{ width: '100%', padding: '14px', background: prodLoading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 12, color: prodLoading ? TEXT3 : '#fff', fontSize: 15, fontWeight: 800, cursor: prodLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT }}
              >
                {prodLoading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Product Description <ArrowRight size={17} /></>}
              </button>

              <AnimatePresence>
                {prodResults && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Generated Descriptions</p>
                    {['short','medium','long'].map(len => (
                      <div key={len} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #6366f1', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>{len} Version</span>
                          <CopyBtn text={prodResults[len]} id={`prod-${len}`} copied={copied} onCopy={copyText} />
                        </div>
                        <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, margin: 0 }}>{prodResults[len]}</p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <button onClick={() => navigate('/brand-governance', { state: { contentPrefill: prodResults.medium, contentType: 'Product Description' } })} style={{ padding: '9px 18px', background: 'rgba(200,151,62,0.1)', border: `1px solid ${GOLD}35`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Shield size={13} /> Send for Brand Review
                      </button>
                      <button onClick={() => goStep('landing')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: GOLD, border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                        Next: Landing Page <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── STEP 3: Landing Page ── */}
          {step === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <SectionHeader icon={<Layout size={15}/>} title="Landing Page Copy" desc="Hero, features, social proof & CTA sections — all generated" color={GOLD} onBack={() => goStep('product')} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={LBL}>Campaign Goal <span style={REQ}>*</span></label>
                  <input value={lpGoal} onChange={e => setLpGoal(e.target.value)} placeholder="e.g. Increase trial sign-ups by 30%" style={INP} />
                </div>
                <div>
                  <label style={LBL}>Headline <span style={REQ}>*</span></label>
                  <input value={lpHeadline} onChange={e => setLpHeadline(e.target.value)} placeholder="e.g. Your AI Marketing Team, Ready in 60 Seconds" style={INP} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={LBL}>Key Benefits <span style={REQ}>*</span></label>
                <textarea value={lpBenefits} onChange={e => setLpBenefits(e.target.value)} placeholder="e.g.&#10;• 10x faster campaign creation&#10;• AI audience targeting&#10;• Real-time analytics" style={{ ...TA, minHeight: 90 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={LBL}>CTA Button Text <span style={REQ}>*</span></label>
                  <input value={lpCta} onChange={e => setLpCta(e.target.value)} placeholder="e.g. Start Free Trial" style={INP} />
                </div>
                <div>
                  <label style={LBL}>Target Audience</label>
                  <input value={lpAudience} onChange={e => setLpAudience(e.target.value)} placeholder="e.g. Marketing managers" style={INP} />
                </div>
              </div>

              {lpError && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><AlertCircle size={15} />{lpError}</div>}

              <button
                onClick={async () => {
                  setLpError('')
                  if (!lpGoal.trim() || !lpHeadline.trim() || !lpBenefits.trim() || !lpCta.trim()) return setLpError('Goal, headline, benefits, and CTA are required.')
                  setLpLoading(true); setLpResults(null)
                  try { setLpResults(await generateLandingPage({ goal: lpGoal, headline: lpHeadline, benefits: lpBenefits, cta: lpCta, audience: lpAudience })) }
                  catch (e) { setLpError(e.message || 'Generation failed.') }
                  setLpLoading(false)
                }}
                disabled={lpLoading}
                style={{ width: '100%', padding: '14px', background: lpLoading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${GOLD}, #a87030)`, border: 'none', borderRadius: 12, color: lpLoading ? TEXT3 : '#0e0c09', fontSize: 15, fontWeight: 800, cursor: lpLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT }}
              >
                {lpLoading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Landing Page Copy <ArrowRight size={17} /></>}
              </button>

              <AnimatePresence>
                {lpResults && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Landing Page Copy</p>
                    {[
                      { key: 'hero',        label: 'Hero Section',     color: GREEN },
                      { key: 'features',    label: 'Features Section', color: '#6366f1' },
                      { key: 'socialProof', label: 'Social Proof',     color: '#f59e0b' },
                      { key: 'ctaSection',  label: 'CTA Section',      color: GOLD },
                    ].map(sec => {
                      const d = lpResults[sec.key]
                      if (!d) return null
                      const fullText = Object.values(d).flat().join('\n')
                      return (
                        <div key={sec.key} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${sec.color}`, borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: sec.color, textTransform: 'uppercase' }}>{sec.label}</span>
                            <CopyBtn text={fullText} id={sec.key} copied={copied} onCopy={copyText} />
                          </div>
                          {Object.entries(d).map(([k, v]) => (
                            <div key={k} style={{ marginBottom: 8 }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k}</p>
                              {Array.isArray(v)
                                ? <ul style={{ margin: 0, paddingLeft: 18 }}>{v.map((item, i) => <li key={i} style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{item}</li>)}</ul>
                                : <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, margin: 0 }}>{v}</p>
                              }
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    {/* Done CTA */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      style={{ background: 'rgba(249,115,22,0.06)', border: '2px solid rgba(249,115,22,0.3)', borderRadius: 16, padding: '20px 24px', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <CheckCircle2 size={15} color={GREEN} />
                        <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Content Suite complete — Step 5 done!</span>
                      </div>
                      <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 16px' }}>Next up is <strong style={{ color: TEXT }}>Step 6: Creative Assets</strong> — generate product images and visual content.</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: '#f97316', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                          Next: Creative Assets <ArrowRight size={14} />
                        </button>
                        <button onClick={() => navigate('/brand-governance', { state: { contentPrefill: lpHeadline, contentType: 'Landing Page' } })} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(200,151,62,0.1)', border: `1px solid ${GOLD}35`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                          <Shield size={13} /> Brand Review
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
