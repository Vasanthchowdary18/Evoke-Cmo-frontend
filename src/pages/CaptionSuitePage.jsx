import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, ArrowLeft, ArrowRight, Loader2, Copy, Check,
  AlertCircle, Send, ShoppingBag, Layout, Shield,
  CheckCircle2, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase, appendJourneyOutput } from '../services/knowledgeBaseService.js'
import { captionSuiteToCreativeAsset } from '../lib/journeyHandoff.js'

const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const CARD2 = '#141210'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const GREEN = '#10b981'
const PURPLE = '#6366f1'
const BORDER = 'rgba(255,255,255,0.08)'
const FONT  = "'Inter', sans-serif"

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram',   color: '#dd2a7b' },
  { key: 'linkedin',  label: 'LinkedIn',    color: '#0a66c2' },
  { key: 'tiktok',    label: 'TikTok',      color: '#ff0050' },
  { key: 'facebook',  label: 'Facebook',    color: '#1877f2' },
  { key: 'twitter',   label: 'X / Twitter', color: '#e7e9ea' },
  { key: 'youtube',   label: 'YouTube',     color: '#ff0000' },
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
  if (!match) throw new Error('Could not parse AI response.')
  return JSON.parse(match[1])
}

async function generateAll({ platforms, contentType, context, tone, prodName, prodFeatures, prodAudience, prodTone, lpGoal, lpHeadline, lpBenefits, lpCta, lpAudience }) {
  const [captions, product, landing] = await Promise.all([
    callGroq(`You are an expert social media copywriter. Generate platform-optimised captions.
Platforms: ${platforms.join(', ')}
Content Type: ${contentType}
Context: ${context}
${tone ? `Tone: ${tone}` : ''}
Return ONLY valid JSON: { ${platforms.map(p => `"${p}": { "caption": "...", "cta": "...", "hashtags": ["#tag1","#tag2"] }`).join(', ')} }`),

    callGroq(`You are an expert product copywriter.
Product: ${prodName || context}
Features: ${prodFeatures || context}
Audience: ${prodAudience}
Tone: ${prodTone}
Return ONLY valid JSON: { "short": "~50 words", "medium": "~100 words", "long": "~200 words" }`, 1200),

    callGroq(`You are an expert landing page copywriter.
Goal: ${lpGoal || contentType}
Headline: ${lpHeadline || context}
Benefits: ${lpBenefits || context}
CTA: ${lpCta || 'Get Started'}
Audience: ${lpAudience || prodAudience}
Return ONLY valid JSON: {
  "hero": { "headline": "...", "subheadline": "...", "cta": "..." },
  "features": { "title": "...", "points": ["...","...","..."] },
  "socialProof": { "title": "...", "placeholder": "..." },
  "ctaSection": { "headline": "...", "subtext": "...", "cta": "..." }
}`, 1200),
  ])
  return { captions, product, landing }
}

function CopyBtn({ text, id, copied, onCopy }) {
  return (
    <button onClick={() => onCopy(id, text)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: TEXT2, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT }}>
      {copied[id] ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
    </button>
  )
}

function SectionBlock({ title, icon, color, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${color}25`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${color}20`, background: `${color}08` }}>
        <div style={{ color, display: 'flex' }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{title}</span>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

export default function CaptionSuitePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const fromAudience = location.state?.payload?.fromStep === 4 ? location.state.payload : null

  const [copied, setCopied] = useState({})

  // Shared inputs — a hand-off from Audience Builder pre-fills these ahead of the KB defaults below
  const [platforms, setPlatforms]     = useState(fromAudience?.platforms || [])
  const [contentType, setContentType] = useState('')
  const [context, setContext]         = useState(fromAudience?.context || '')
  const [tone, setTone]               = useState(fromAudience?.tone || '')

  // Product inputs
  const [prodName, setProdName]         = useState('')
  const [prodFeatures, setProdFeatures] = useState('')
  const [prodAudience, setProdAudience] = useState(fromAudience?.prodAudience || '')
  const [prodTone, setProdTone]         = useState('Professional')

  // Landing page inputs
  const [lpGoal, setLpGoal]         = useState('')
  const [lpHeadline, setLpHeadline] = useState('')
  const [lpBenefits, setLpBenefits] = useState('')
  const [lpCta, setLpCta]           = useState('Get Started')
  const [lpAudience, setLpAudience] = useState(fromAudience?.lpAudience || '')

  // Generation
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [results, setResults] = useState(null)

  // KB auto-fill — a hand-off from Audience Builder is more specific than these
  // brand-wide defaults, so it wins wherever it already supplied a value.
  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(kb => {
      if (!kb) return
      if (kb.toneOfVoice && !fromAudience?.tone) setTone(TONE_LABELS[kb.toneOfVoice] || kb.toneOfVoice)
      if (kb.productService) {
        if (!fromAudience?.context) setContext(kb.productService)
        setProdFeatures(kb.productService)
        setLpHeadline(kb.companyName ? `${kb.companyName} — ${kb.productService}` : kb.productService)
      }
      if (kb.companyName)    setProdName(kb.companyName)
      if (kb.targetAudience && !fromAudience?.prodAudience) { setProdAudience(kb.targetAudience); setLpAudience(kb.targetAudience) }
      if (!fromAudience?.platforms) {
        const mapped = new Set()
        ;(kb.priorityChannels || []).forEach(ch => (CHANNEL_TO_PLATFORM[ch] || []).forEach(p => mapped.add(p)))
        if (mapped.size > 0) setPlatforms([...mapped])
      }
    }).catch(() => {})
  }, [user?.uid]) // eslint-disable-line

  function copyText(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [id]: true }))
      setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 2000)
    })
  }

  async function handleGenerate() {
    setError('')
    if (!platforms.length) return setError('Select at least one platform.')
    if (!contentType)      return setError('Select a content type.')
    if (!context.trim())   return setError('Enter your product or campaign context.')
    setLoading(true); setResults(null)
    try {
      const r = await generateAll({ platforms, contentType, context, tone, prodName, prodFeatures, prodAudience, prodTone, lpGoal, lpHeadline, lpBenefits, lpCta, lpAudience })
      setResults(r)
      setTimeout(() => document.getElementById('cgs-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      try {
        if (user?.uid) await appendJourneyOutput(user.uid, 'content', r.product?.short || context)
      } catch {}
    } catch (e) { setError(e.message || 'Generation failed. Please try again.') }
    setLoading(false)
  }

  const INP = { width: '100%', padding: '11px 14px', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
  const TA  = { ...INP, resize: 'vertical', minHeight: 90 }
  const SEL = { ...INP, cursor: 'pointer', colorScheme: 'dark' }
  const LBL = { fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', marginBottom: 7, display: 'block', textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT }}>
      <Navbar />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '88px 24px 80px' }}>

        {/* Header */}
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: FONT }}>
          <ArrowLeft size={14}/> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${GREEN}18`, border: `1px solid ${GREEN}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}>
            <Sparkles size={22}/>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Content Generation Suite</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(200,151,62,0.15)', color: GOLD, border: '1px solid rgba(200,151,62,0.3)' }}>STEP 5</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT2, margin: '4px 0 0' }}>Fill in once — generate captions, product descriptions & landing page copy together.</p>
          </div>
        </div>

        {fromAudience && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, marginBottom: 16, width: 'fit-content' }}>
            <Check size={13} color={GREEN} />
            <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>Pre-filled from your Audience Builder segments</span>
          </div>
        )}

        {/* ── Single unified form ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px', marginBottom: 20 }}>

          {/* Section A: Social Captions */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${GREEN}18`, border: `1px solid ${GREEN}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}><Hash size={13}/></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>Social Captions</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Platforms <span style={{ color: GREEN }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {PLATFORMS.map(p => {
                  const active = platforms.includes(p.key)
                  return <button key={p.key} onClick={() => setPlatforms(prev => active ? prev.filter(k => k !== p.key) : [...prev, p.key])} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${active ? p.color : BORDER}`, color: active ? p.color : TEXT3 }}>{p.label}</button>
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LBL}>Content Type <span style={{ color: GREEN }}>*</span></label>
                <select value={contentType} onChange={e => setContentType(e.target.value)} style={SEL}>
                  <option value="">Select...</option>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Brand Tone</label>
                <input value={tone} onChange={e => setTone(e.target.value)} placeholder="e.g. Professional, Bold..." style={INP}/>
              </div>
            </div>
          </div>

          {/* Section B: Shared context + Product */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${PURPLE}18`, border: `1px solid ${PURPLE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE }}><ShoppingBag size={13}/></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: PURPLE }}>Product / Campaign</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Campaign Context <span style={{ color: GREEN }}>*</span></label>
              <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Describe your product, service, or campaign. Include key benefits and what you want to promote..." style={TA}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={LBL}>Product / Brand Name</label>
                <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Evoke Market Place" style={INP}/>
              </div>
              <div>
                <label style={LBL}>Target Audience</label>
                <input value={prodAudience} onChange={e => setProdAudience(e.target.value)} placeholder="e.g. Marketing managers, 25–40" style={INP}/>
              </div>
            </div>
            <div>
              <label style={LBL}>Key Features / Benefits</label>
              <textarea value={prodFeatures} onChange={e => setProdFeatures(e.target.value)} placeholder="e.g. AI campaign builder, audience targeting, real-time analytics..." style={{ ...TA, minHeight: 72 }}/>
            </div>
          </div>

          {/* Section C: Landing Page */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}><Layout size={13}/></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>Landing Page</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={LBL}>Campaign Goal</label>
                <input value={lpGoal} onChange={e => setLpGoal(e.target.value)} placeholder="e.g. Increase sign-ups by 30%" style={INP}/>
              </div>
              <div>
                <label style={LBL}>Hero Headline</label>
                <input value={lpHeadline} onChange={e => setLpHeadline(e.target.value)} placeholder="e.g. Your AI Marketing Team, Ready in 60s" style={INP}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LBL}>CTA Button Text</label>
                <input value={lpCta} onChange={e => setLpCta(e.target.value)} placeholder="e.g. Start Free Trial" style={INP}/>
              </div>
              <div>
                <label style={LBL}>Key Benefits (brief)</label>
                <input value={lpBenefits} onChange={e => setLpBenefits(e.target.value)} placeholder="e.g. Fast, affordable, AI-powered" style={INP}/>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertCircle size={15}/> {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate} disabled={loading}
          style={{ width: '100%', padding: '15px', background: loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${GREEN}, #059669)`, border: 'none', borderRadius: 13, color: loading ? TEXT3 : '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT, marginBottom: 32 }}
        >
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Generating all content…</>
            : <><Sparkles size={18}/> Generate Captions + Product Copy + Landing Page</>
          }
        </button>

        {/* ── Results ── */}
        <AnimatePresence>
          {results && (
            <motion.div id="cgs-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* 1. Social Captions */}
              <SectionBlock title="Social Captions" icon={<Hash size={15}/>} color={GREEN}>
                {platforms.map(pKey => {
                  const plat = PLATFORMS.find(p => p.key === pKey)
                  const d = results.captions?.[pKey]
                  if (!d) return null
                  const full = `${d.caption}\n\n${d.cta}\n\n${(d.hashtags||[]).join(' ')}`
                  return (
                    <div key={pKey} style={{ borderLeft: `3px solid ${plat.color}`, paddingLeft: 14, marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: plat.color }}>{plat.label}</span>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <CopyBtn text={full} id={pKey} copied={copied} onCopy={copyText}/>
                          <button onClick={() => navigate('/post-content', { state: { captionPrefill: full, platform: pKey, from: '/caption-suite' } })} style={{ background: `${plat.color}18`, border: `1px solid ${plat.color}35`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: plat.color, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT }}>
                            <Send size={11}/> Post
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{d.caption}</p>
                      {d.cta && <p style={{ fontSize: 12, color: GOLD, fontWeight: 600, margin: '0 0 10px' }}>{d.cta}</p>}
                      {d.hashtags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {d.hashtags.map((tag, i) => <span key={i} onClick={() => copyText(`${pKey}-tag-${i}`, tag)} style={{ padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${plat.color}12`, border: `1px solid ${plat.color}22`, color: plat.color, cursor: 'pointer' }}>{tag}</span>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </SectionBlock>

              {/* 2. Product Descriptions */}
              <SectionBlock title="Product Descriptions" icon={<ShoppingBag size={15}/>} color={PURPLE}>
                {results.product && ['short','medium','long'].map(len => (
                  <div key={len} style={{ borderLeft: `3px solid ${PURPLE}`, paddingLeft: 14, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{len}</span>
                      <CopyBtn text={results.product[len]} id={`prod-${len}`} copied={copied} onCopy={copyText}/>
                    </div>
                    <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.75, margin: 0 }}>{results.product[len]}</p>
                  </div>
                ))}
              </SectionBlock>

              {/* 3. Landing Page */}
              <SectionBlock title="Landing Page Copy" icon={<Layout size={15}/>} color={GOLD}>
                {results.landing && [
                  { key: 'hero',        label: 'Hero Section',     color: GREEN },
                  { key: 'features',    label: 'Features Section', color: PURPLE },
                  { key: 'socialProof', label: 'Social Proof',     color: '#f59e0b' },
                  { key: 'ctaSection',  label: 'CTA Section',      color: GOLD },
                ].map(sec => {
                  const d = results.landing[sec.key]
                  if (!d) return null
                  const fullText = Object.values(d).flat().join('\n')
                  return (
                    <div key={sec.key} style={{ borderLeft: `3px solid ${sec.color}`, paddingLeft: 14, marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: sec.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sec.label}</span>
                        <CopyBtn text={fullText} id={sec.key} copied={copied} onCopy={copyText}/>
                      </div>
                      {Object.entries(d).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 8 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k}</p>
                          {Array.isArray(v)
                            ? <ul style={{ margin: 0, paddingLeft: 18 }}>{v.map((item, i) => <li key={i} style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{item}</li>)}</ul>
                            : <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, margin: 0 }}>{v}</p>
                          }
                        </div>
                      ))}
                    </div>
                  )
                })}
              </SectionBlock>

              {/* Done CTA */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'rgba(249,115,22,0.06)', border: '2px solid rgba(249,115,22,0.3)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle2 size={15} color={GREEN}/>
                  <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Content Suite complete — Step 5 done!</span>
                </div>
                <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 16px' }}>Next up: <strong style={{ color: TEXT }}>Step 6 — Creative Assets</strong>. Generate product images and visual content.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/creative-asset', { state: { payload: captionSuiteToCreativeAsset(prodName, context) } })} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: '#f97316', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                    Next: Creative Assets <ArrowRight size={14}/>
                  </button>
                  <button onClick={() => navigate('/brand-governance')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(200,151,62,0.1)', border: `1px solid ${GOLD}35`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    <Shield size={13}/> Brand Review
                  </button>
                  <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                    Regenerate
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } select option { background: #1c1a13; color: #f0ebe0; }`}</style>
    </div>
  )
}
