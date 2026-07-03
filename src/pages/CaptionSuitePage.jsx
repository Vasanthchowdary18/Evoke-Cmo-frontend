import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, ArrowLeft, ArrowRight, Loader2, Copy, Check, AlertCircle, Send, ShoppingBag, Layout, Shield } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const TONE_LABELS = {
  professional:  'Professional',
  friendly:      'Friendly & Warm',
  bold:          'Bold & Confident',
  playful:       'Playful & Fun',
  inspirational: 'Inspirational',
  luxurious:     'Luxurious & Premium',
}

const CHANNEL_TO_PLATFORM = {
  social_organic: ['instagram', 'facebook'],
  paid_social:    ['instagram', 'facebook'],
  video:          ['youtube', 'tiktok'],
  influencer:     ['instagram', 'tiktok'],
}

const BG    = '#0e0c09'
const CARD  = '#1c1a13'
const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const GREEN = '#10b981'
const FONT  = "'Inter', sans-serif"

const PLATFORMS = [
  { key: 'instagram',  label: 'Instagram',  color: '#dd2a7b' },
  { key: 'linkedin',   label: 'LinkedIn',   color: '#0a66c2' },
  { key: 'tiktok',     label: 'TikTok',     color: '#ff0050' },
  { key: 'facebook',   label: 'Facebook',   color: '#1877f2' },
  { key: 'twitter',    label: 'X / Twitter', color: '#e7e9ea' },
  { key: 'youtube',    label: 'YouTube',    color: '#ff0000' },
]

const CONTENT_TYPES = [
  'Product Post',
  'Campaign Promo',
  'Brand Awareness',
  'Engagement / Question',
  'Reel / Short Video',
  'Story Post',
  'Event Announcement',
  'Testimonial / Review',
]

async function generateCaptions({ platforms, contentType, context, tone }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''

  const platformList = platforms.join(', ')
  const prompt = `You are an expert social media copywriter. Generate platform-optimised captions for the following:

Platforms: ${platformList}
Content Type: ${contentType}
Brand/Campaign Context: ${context}
${tone ? `Tone: ${tone}` : ''}

For EACH platform listed, generate:
1. A caption (tailored to that platform's style and character limits)
2. One strong CTA (call-to-action)
3. A set of 10–15 relevant hashtags

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  ${platforms.map(p => `"${p}": { "caption": "...", "cta": "...", "hashtags": ["#tag1","#tag2",...] }`).join(',\n  ')}
}`

  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an expert social media copywriter. Always respond with only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 2500,
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Generation failed (${res.status})`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!match) throw new Error('Could not parse AI response. Please try again.')

  let raw = match[1]
  try { return JSON.parse(raw) } catch (_) {}
  const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, s =>
    s.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  )
  return JSON.parse(fixed)
}

const MODES = [
  { key: 'captions',    label: 'Social Captions',     icon: <Hash size={14}/> },
  { key: 'product',     label: 'Product Description',  icon: <ShoppingBag size={14}/> },
  { key: 'landing',     label: 'Landing Page',         icon: <Layout size={14}/> },
]

const PRODUCT_TONES = ['Professional', 'Casual', 'Persuasive']
const LENGTHS = ['Short (50 words)', 'Medium (100 words)', 'Long (200 words)']

async function generateProductDescription({ productName, features, audience, tone, length }) {
  const wordCount = length.includes('50') ? 50 : length.includes('100') ? 100 : 200
  const prompt = `You are an expert product copywriter. Write a product description.

Product Name: ${productName}
Key Features: ${features}
Target Audience: ${audience}
Tone: ${tone}
Length: ~${wordCount} words

Return ONLY valid JSON:
{
  "short": "~50 word description",
  "medium": "~100 word description",
  "long": "~200 word description"
}`

  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an expert product copywriter. Always respond with only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 1200,
  })

  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''
  const res = apiKey
    ? await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body })
    : await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })

  if (!res.ok) throw new Error(`Generation failed (${res.status})`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!match) throw new Error('Could not parse AI response.')
  return JSON.parse(match[1])
}

async function generateLandingPage({ goal, headline, benefits, cta, audience }) {
  const prompt = `You are an expert landing page copywriter. Create full landing page copy.

Campaign Goal: ${goal}
Headline: ${headline}
Key Benefits: ${benefits}
CTA Text: ${cta}
Target Audience: ${audience}

Return ONLY valid JSON:
{
  "hero": { "headline": "...", "subheadline": "...", "cta": "..." },
  "features": { "title": "...", "points": ["benefit 1", "benefit 2", "benefit 3"] },
  "socialProof": { "title": "...", "placeholder": "Add testimonials or stats here" },
  "ctaSection": { "headline": "...", "subtext": "...", "cta": "..." }
}`

  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an expert landing page copywriter. Always respond with only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 1200,
  })

  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''
  const res = apiKey
    ? await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body })
    : await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })

  if (!res.ok) throw new Error(`Generation failed (${res.status})`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!match) throw new Error('Could not parse AI response.')
  return JSON.parse(match[1])
}

export default function CaptionSuitePage() {
  const navigate      = useNavigate()
  const { user }      = useAuth()

  const [mode, setMode] = useState('captions')

  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [contentType, setContentType] = useState('')
  const [context, setContext] = useState('')
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [copied, setCopied] = useState({})

  // Product Description state
  const [prodName, setProdName]       = useState('')
  const [prodFeatures, setProdFeatures] = useState('')
  const [prodAudience, setProdAudience] = useState('')
  const [prodTone, setProdTone]       = useState('Professional')
  const [prodLength, setProdLength]   = useState('Medium (100 words)')
  const [prodResults, setProdResults] = useState(null)

  // Landing Page state
  const [lpGoal, setLpGoal]           = useState('')
  const [lpHeadline, setLpHeadline]   = useState('')
  const [lpBenefits, setLpBenefits]   = useState('')
  const [lpCta, setLpCta]             = useState('')
  const [lpAudience, setLpAudience]   = useState('')
  const [lpResults, setLpResults]     = useState(null)

  // Pre-fill from Brand KB
  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(kb => {
      if (!kb) return
      if (kb.toneOfVoice)    setTone(TONE_LABELS[kb.toneOfVoice] || kb.toneOfVoice)
      if (kb.productService) setContext(kb.productService)
      // Map priority channels → platforms
      const channels = kb.priorityChannels || []
      const mapped = new Set()
      channels.forEach(ch => {
        const plats = CHANNEL_TO_PLATFORM[ch] || []
        plats.forEach(p => mapped.add(p))
      })
      if (mapped.size > 0) setSelectedPlatforms([...mapped])
    }).catch(() => {})
  }, [user?.uid])

  const togglePlatform = (key) =>
    setSelectedPlatforms(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

  const handleGenerate = async () => {
    setError('')
    if (selectedPlatforms.length === 0) return setError('Please select at least one platform.')
    if (!contentType) return setError('Please select a content type.')
    if (!context.trim()) return setError('Please enter your product or campaign context.')

    setLoading(true)
    setResults(null)
    try {
      const data = await generateCaptions({ platforms: selectedPlatforms, contentType, context, tone })
      setResults(data)
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (key, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [key]: true }))
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000)
    })
  }

  const s = {
    page: { minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT },
    container: { maxWidth: 760, margin: '0 auto', padding: '88px 24px 60px' },
    label: { fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 8, display: 'block' },
    req: { color: GREEN, marginLeft: 3 },
    input: {
      width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
    },
    textarea: {
      width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', resize: 'vertical',
      minHeight: 100, boxSizing: 'border-box',
    },
    select: {
      width: '100%', padding: '12px 14px', background: '#1c1a13',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', cursor: 'pointer',
      colorScheme: 'dark',
    },
    generateBtn: {
      width: '100%', marginTop: 24, padding: '15px',
      background: loading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${GREEN}, #059669)`,
      border: 'none', borderRadius: 12, color: loading ? TEXT3 : '#fff',
      fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: FONT,
    },
    resultCard: {
      background: CARD, border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '20px', marginBottom: 16,
    },
    copyBtn: {
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: TEXT2,
      fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
      fontFamily: FONT,
    },
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0, fontFamily: FONT }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${GREEN}18`, border: `1px solid ${GREEN}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}>
            <Hash size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Content Generation Suite</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(200,151,62,0.15)', color: GOLD, border: '1px solid rgba(200,151,62,0.3)' }}>PACKAGE B</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT2, margin: '4px 0 0', lineHeight: 1.5 }}>
              Generate captions, product descriptions, and landing page copy powered by AI.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: 6, margin: '20px 0', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 5 }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setError(''); setResults(null); setProdResults(null); setLpResults(null) }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: 'none', fontFamily: FONT, transition: 'all 0.15s',
                background: mode === m.key ? GREEN : 'transparent',
                color: mode === m.key ? '#fff' : TEXT3,
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0 24px' }} />

        {/* ── PRODUCT DESCRIPTION MODE ── */}
        {mode === 'product' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Product Name <span style={s.req}>*</span></label>
              <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. EvoX AI Marketing Platform" style={s.input} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Key Features <span style={s.req}>*</span></label>
              <textarea value={prodFeatures} onChange={e => setProdFeatures(e.target.value)} placeholder="e.g. AI campaign builder, audience segmentation, real-time analytics, multi-channel publishing..." style={s.textarea} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Target Audience</label>
              <input value={prodAudience} onChange={e => setProdAudience(e.target.value)} placeholder="e.g. Marketing managers at SMBs, 28-45 years" style={s.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={s.label}>Tone</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PRODUCT_TONES.map(t => (
                    <button key={t} onClick={() => setProdTone(t)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${prodTone === t ? GREEN : 'rgba(255,255,255,0.1)'}`, background: prodTone === t ? `${GREEN}18` : 'rgba(255,255,255,0.04)', color: prodTone === t ? GREEN : TEXT3, fontFamily: FONT }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={s.label}>Length</label>
                <select value={prodLength} onChange={e => setProdLength(e.target.value)} style={s.select}>
                  {LENGTHS.map(l => <option key={l} value={l} style={{ background: '#1c1a13', color: TEXT }}>{l}</option>)}
                </select>
              </div>
            </div>
            {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><AlertCircle size={15} style={{ flexShrink: 0, color: '#f87171' }} />{error}</div>}
            <button
              onClick={async () => {
                setError(''); if (!prodName.trim() || !prodFeatures.trim()) return setError('Product name and features are required.')
                setLoading(true); setProdResults(null)
                try { setProdResults(await generateProductDescription({ productName: prodName, features: prodFeatures, audience: prodAudience, tone: prodTone, length: prodLength })) }
                catch (e) { setError(e.message || 'Generation failed.') }
                setLoading(false)
              }}
              disabled={loading}
              style={s.generateBtn}
            >
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <>Generate Product Description <ArrowRight size={17} /></>}
            </button>
            <AnimatePresence>
              {prodResults && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 32 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Generated Descriptions</p>
                  {['short', 'medium', 'long'].map((len, i) => (
                    <div key={len} style={{ ...s.resultCard, borderLeft: `3px solid ${GREEN}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: GREEN, textTransform: 'uppercase' }}>{len} Version</span>
                        <button onClick={() => { navigator.clipboard.writeText(prodResults[len]); setCopied(c => ({ ...c, [`prod-${len}`]: true })); setTimeout(() => setCopied(c => ({ ...c, [`prod-${len}`]: false })), 2000) }} style={s.copyBtn}>
                          {copied[`prod-${len}`] ? <Check size={12} /> : <Copy size={12} />} {copied[`prod-${len}`] ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, margin: 0 }}>{prodResults[len]}</p>
                    </div>
                  ))}
                  <button onClick={() => navigate('/brand-governance', { state: { contentPrefill: prodResults.medium, contentType: 'Product Description' } })} style={{ marginTop: 8, padding: '11px 24px', background: 'rgba(200,151,62,0.1)', border: `1px solid ${GOLD}35`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={14} /> Send for Brand Review
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── LANDING PAGE MODE ── */}
        {mode === 'landing' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={s.label}>Campaign Goal <span style={s.req}>*</span></label>
                <input value={lpGoal} onChange={e => setLpGoal(e.target.value)} placeholder="e.g. Increase trial sign-ups by 30%" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Headline <span style={s.req}>*</span></label>
                <input value={lpHeadline} onChange={e => setLpHeadline(e.target.value)} placeholder="e.g. Your AI Marketing Team, Ready in 60 Seconds" style={s.input} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Key Benefits (3 bullet points) <span style={s.req}>*</span></label>
              <textarea value={lpBenefits} onChange={e => setLpBenefits(e.target.value)} placeholder="e.g.&#10;• 10x faster campaign creation&#10;• AI-powered audience targeting&#10;• Real-time performance analytics" style={{ ...s.textarea, minHeight: 90 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={s.label}>CTA Button Text <span style={s.req}>*</span></label>
                <input value={lpCta} onChange={e => setLpCta(e.target.value)} placeholder="e.g. Start Free Trial" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Target Audience</label>
                <input value={lpAudience} onChange={e => setLpAudience(e.target.value)} placeholder="e.g. Marketing managers, SMB owners" style={s.input} />
              </div>
            </div>
            {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><AlertCircle size={15} style={{ flexShrink: 0, color: '#f87171' }} />{error}</div>}
            <button
              onClick={async () => {
                setError(''); if (!lpGoal.trim() || !lpHeadline.trim() || !lpBenefits.trim() || !lpCta.trim()) return setError('Goal, headline, benefits, and CTA are required.')
                setLoading(true); setLpResults(null)
                try { setLpResults(await generateLandingPage({ goal: lpGoal, headline: lpHeadline, benefits: lpBenefits, cta: lpCta, audience: lpAudience })) }
                catch (e) { setError(e.message || 'Generation failed.') }
                setLoading(false)
              }}
              disabled={loading}
              style={s.generateBtn}
            >
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <>Generate Landing Page Copy <ArrowRight size={17} /></>}
            </button>
            <AnimatePresence>
              {lpResults && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 32 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Landing Page Copy</p>
                  {[
                    { key: 'hero',        label: 'Hero Section',      color: GREEN },
                    { key: 'features',    label: 'Features Section',  color: '#6366f1' },
                    { key: 'socialProof', label: 'Social Proof',      color: '#f59e0b' },
                    { key: 'ctaSection',  label: 'CTA Section',       color: GOLD },
                  ].map(sec => {
                    const data = lpResults[sec.key]
                    if (!data) return null
                    const fullText = Object.values(data).flat().join('\n')
                    return (
                      <div key={sec.key} style={{ ...s.resultCard, borderLeft: `3px solid ${sec.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: sec.color, textTransform: 'uppercase' }}>{sec.label}</span>
                          <button onClick={() => { navigator.clipboard.writeText(fullText); setCopied(c => ({ ...c, [sec.key]: true })); setTimeout(() => setCopied(c => ({ ...c, [sec.key]: false })), 2000) }} style={s.copyBtn}>
                            {copied[sec.key] ? <Check size={12} /> : <Copy size={12} />} {copied[sec.key] ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {Object.entries(data).map(([k, v]) => (
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
                  <button onClick={() => navigate('/brand-governance', { state: { contentPrefill: lpHeadline, contentType: 'Landing Page' } })} style={{ marginTop: 8, padding: '11px 24px', background: 'rgba(200,151,62,0.1)', border: `1px solid ${GOLD}35`, borderRadius: 10, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={14} /> Send for Brand Review
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── CAPTIONS MODE ── */}
        {mode === 'captions' && <div>

        {/* ── Platform selector ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>Platforms <span style={s.req}>*</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => {
              const active = selectedPlatforms.includes(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  style={{
                    padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                    background: active ? `${p.color}22` : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.1)'}`,
                    color: active ? p.color : TEXT3,
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content type ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>Content Type <span style={s.req}>*</span></label>
          <select
            value={contentType}
            onChange={e => setContentType(e.target.value)}
            style={s.select}
          >
            <option value="" style={{ background: '#1c1a13', color: TEXT3 }}>Select content type...</option>
            {CONTENT_TYPES.map(t => (
              <option key={t} value={t} style={{ background: '#1c1a13', color: TEXT }}>{t}</option>
            ))}
          </select>
        </div>

        {/* ── Context ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>Product / Campaign Context <span style={s.req}>*</span></label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe your product, service, or campaign. Include key benefits, target audience, and any specific message you want to convey..."
            style={s.textarea}
          />
        </div>

        {/* ── Tone (optional) ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>
            Brand Tone
            <span style={{ color: TEXT3, fontWeight: 400, marginLeft: 6 }}>(optional)</span>
          </label>
          <input
            value={tone}
            onChange={e => setTone(e.target.value)}
            placeholder="e.g. Professional, Playful, Bold, Inspirational, Conversational..."
            style={s.input}
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
            border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10,
            color: '#fca5a5', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, color: '#f87171' }} />
            {error}
          </div>
        )}

        {/* ── Generate button ── */}
        <button onClick={handleGenerate} disabled={loading} style={s.generateBtn}>
          {loading ? (
            <>
              <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
              Generating captions...
            </>
          ) : (
            <>
              Generate Captions & Hashtags <ArrowRight size={17} />
            </>
          )}
        </button>

        {/* ── Results ── */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 36 }}
            >
              <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                Generated Captions
              </p>

              {selectedPlatforms.map(pKey => {
                const platform = PLATFORMS.find(p => p.key === pKey)
                const data = results[pKey]
                if (!data) return null
                const fullText = `${data.caption}\n\n${data.cta}\n\n${(data.hashtags || []).join(' ')}`

                return (
                  <motion.div
                    key={pKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ ...s.resultCard, borderLeft: `3px solid ${platform.color}` }}
                  >
                    {/* Platform header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: platform.color }}>
                        {platform.label}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => copyToClipboard(pKey, fullText)}
                          style={s.copyBtn}
                        >
                          {copied[pKey] ? <Check size={12} /> : <Copy size={12} />}
                          {copied[pKey] ? 'Copied!' : 'Copy all'}
                        </button>
                        <button
                          onClick={() => navigate('/post-content', {
                            state: {
                              captionPrefill: fullText,
                              platform: pKey,
                              toolTitle: 'Caption Suite',
                              toolColor: platform.color,
                              from: '/caption-suite',
                            }
                          })}
                          style={{
                            ...s.copyBtn,
                            background: `${platform.color}18`,
                            border: `1px solid ${platform.color}40`,
                            color: platform.color,
                          }}
                        >
                          <Send size={12} />
                          Post Now
                        </button>
                      </div>
                    </div>

                    {/* Caption */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Caption</p>
                      <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{data.caption}</p>
                    </div>

                    {/* CTA */}
                    {data.cta && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>CTA</p>
                        <p style={{ fontSize: 13, color: GOLD, fontWeight: 600, margin: 0 }}>{data.cta}</p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {data.hashtags?.length > 0 && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hashtags</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {data.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                                background: `${platform.color}14`, border: `1px solid ${platform.color}25`,
                                color: platform.color, cursor: 'pointer',
                              }}
                              onClick={() => copyToClipboard(`${pKey}-tag-${i}`, tag)}
                              title="Click to copy"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {/* Generate again */}
              <button
                onClick={handleGenerate}
                style={{
                  marginTop: 8, padding: '11px 24px', background: 'rgba(16,185,129,0.1)',
                  border: `1px solid ${GREEN}35`, borderRadius: 10, color: GREEN,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Regenerate
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

        </div>} {/* end captions mode */}

      </div>
    </div>
  )
}
