import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Copy, Check, Loader2, Video, Link } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

/* ─── Tool configs ─── */
const TOOLS = {
  'image-angles': {
    title:    'Image → Multi Angles',
    subtitle: 'Generate multiple product viewpoints as video',
    color:    '#10b981',
    badge:    'VISUAL',
    type:     'video', // uses WaveSpeed
    model:    'bytedance/seedance-2.0-fast/image-to-video',
    fields: [
      { key: 'productName', label: 'Product Name',     placeholder: 'e.g. Premium Leather Watch' },
      { key: 'angles',      label: 'Angles to show',   placeholder: 'e.g. front, back, side, top, lifestyle' },
      { key: 'style',       label: 'Visual Style',     placeholder: 'e.g. studio white background, clean minimal' },
    ],
    buildPrompt: (f) =>
      `Product photography showcase of a ${f.productName || 'product'}. Smooth camera rotation revealing ${f.angles || 'front, back, side, top and lifestyle angles'}. ${f.style || 'Clean studio white background, professional lighting'}. High-resolution e-commerce product video. Cinematic, no people.`,
    duration: 5,
  },

  'image-360': {
    title:    'Image → 360° Video',
    subtitle: 'Turntable orbital rotation video',
    color:    '#a855f7',
    badge:    '360 VIDEO',
    type:     'video',
    model:    'bytedance/seedance-2.0-fast/image-to-video',
    fields: [
      { key: 'productName', label: 'Product Name',      placeholder: 'e.g. Wireless Earbuds' },
      { key: 'background',  label: 'Background',        placeholder: 'e.g. white, dark, gradient grey' },
      { key: 'speed',       label: 'Rotation Speed',    placeholder: 'e.g. slow and smooth, medium' },
    ],
    buildPrompt: (f) =>
      `${f.productName || 'Product'} 360 degree turntable rotation video. The product rotates smoothly in a ${f.speed || 'slow and smooth'} clockwise orbit. ${f.background || 'Pure white'} background, professional studio lighting with subtle shadows. Perfect loop, e-commerce product showcase, no people, no text.`,
    duration: 5,
  },

  'image-lifestyle': {
    title:    'AI Lifestyle Images',
    subtitle: 'Product in real-world lifestyle settings',
    color:    '#ec4899',
    badge:    'LIFESTYLE',
    type:     'video',
    model:    'bytedance/seedance-2.0-fast/image-to-video',
    fields: [
      { key: 'productName', label: 'Product Name',    placeholder: 'e.g. Organic Face Serum' },
      { key: 'setting',     label: 'Lifestyle Setting', placeholder: 'e.g. morning bathroom routine, outdoor café table' },
      { key: 'mood',        label: 'Mood / Aesthetic',  placeholder: 'e.g. luxury minimal, warm cosy, bright fresh' },
    ],
    buildPrompt: (f) =>
      `Lifestyle product video showcasing ${f.productName || 'a premium product'} in a ${f.setting || 'real-world lifestyle setting'}. ${f.mood || 'Clean minimal'} aesthetic, natural light, elegant composition. Product prominently featured, cinematic camera movement, aspirational brand feel. High quality, no text overlays.`,
    duration: 5,
  },

  'image-video': {
    title:    'AI Lifestyle Videos',
    subtitle: 'Story-driven product videos for Reels & Shorts',
    color:    '#f97316',
    badge:    'VIDEO',
    type:     'video',
    model:    'bytedance/seedance-2.0/image-to-video',
    fields: [
      { key: 'productName', label: 'Product Name',  placeholder: 'e.g. Bluetooth Speaker' },
      { key: 'scene',       label: 'Scene / Story', placeholder: 'e.g. person enjoying music on a rooftop at sunset' },
      { key: 'platform',    label: 'Platform',      placeholder: 'e.g. Instagram Reels, TikTok, YouTube Shorts' },
    ],
    buildPrompt: (f) =>
      `Story-driven lifestyle video featuring ${f.productName || 'a product'}. Scene: ${f.scene || 'person using the product in a beautiful real-world setting'}. Optimised for ${f.platform || 'social media'}. Cinematic quality, smooth motion, vibrant colours, aspirational feel. No text, no voiceover.`,
    duration: 5,
  },

  'image-seo': {
    title:    'SEO, Meta Tags & Backlinks',
    subtitle: 'Complete SEO package for your product page',
    color:    '#c8973e',
    badge:    'SEO',
    type:     'text', // uses Gemini
    fields: [
      { key: 'productName',   label: 'Product / Page Name',    placeholder: 'e.g. Leather Wallet for Men' },
      { key: 'targetKeyword', label: 'Primary Keyword',         placeholder: 'e.g. slim leather wallet' },
      { key: 'audience',      label: 'Target Audience',         placeholder: 'e.g. Men 25–45, gift buyers' },
      { key: 'website',       label: 'Website URL (optional)',  placeholder: 'e.g. yourstore.com' },
    ],
    buildPrompt: (f) => `You are an expert SEO strategist. Generate a complete SEO package for:
Product: ${f.productName || ''}
Primary Keyword: ${f.targetKeyword || ''}
Target Audience: ${f.audience || ''}
Website: ${f.website || 'N/A'}

Return ONLY valid JSON:
{
  "metaTitle": "60-char SEO title with primary keyword",
  "metaDescription": "155-char meta description with CTA",
  "h1Tag": "H1 heading (different from meta title)",
  "openGraphTitle": "OG title for social sharing",
  "openGraphDescription": "OG description (2 sentences)",
  "imageAltText": "SEO-optimised image alt text",
  "primaryKeyword": "exact match keyword",
  "secondaryKeywords": ["kw2","kw3","kw4","kw5"],
  "longTailKeywords": ["phrase1","phrase2","phrase3","phrase4","phrase5"],
  "backlinkTargets": [
    {"site":"site name","type":"guest post / directory","reason":"why relevant"},
    {"site":"site name","type":"type","reason":"reason"},
    {"site":"site name","type":"type","reason":"reason"}
  ],
  "contentGaps": ["opportunity1","opportunity2","opportunity3"]
}`,
  },
}

/* ─── WaveSpeed API ─── */
const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3'

async function submitWaveSpeedJob(apiKey, model, prompt, imageUrl, duration) {
  const body = { prompt, duration: duration || 5, size: '720p' }
  if (imageUrl) body.image = imageUrl

  const res = await fetch(`${WAVESPEED_BASE}/${model}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.message || `WaveSpeed error ${res.status}`)
  }
  const data = await res.json()
  return data?.data // { id, status, urls: { get } }
}

async function pollWaveSpeedJob(apiKey, getUrl) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(getUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) continue
    const data = await res.json()
    const job = data?.data
    if (!job) continue
    if (job.status === 'completed') return job.outputs?.[0] || null
    if (job.status === 'failed')    throw new Error('Video generation failed. Please try again.')
  }
  throw new Error('Timed out waiting for video. Please try again.')
}

/* ─── Gemini API ─── */
const GEMINI_MODEL = 'gemini-2.0-flash'

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e?.error?.message || `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function tryParseJSON(text) {
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
    if (s !== -1 && e !== -1) return JSON.parse(clean.slice(s, e + 1))
  } catch {}
  return null
}

/* ─── Colours ─── */
const BG = '#0e0c09', GOLD = '#c8973e'
const TEXT = '#f0ebe0', TEXT2 = 'rgba(240,235,224,0.55)', TEXT3 = 'rgba(240,235,224,0.32)'
const inp = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 13, boxSizing: 'border-box',
  outline: 'none', fontFamily: "'Inter',sans-serif",
}

export default function ImageToolPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const toolId = pathname.replace('/', '')
  const tool = TOOLS[toolId]

  const isVideo = tool?.type === 'video'

  const wsKey  = import.meta.env.VITE_WAVESPEED_API_KEY || ''
  const gemKey = import.meta.env.VITE_GEMINI_API_KEY   || ''
  const [imageUrl,   setImageUrl]   = useState('')
  const [fields,     setFields]     = useState({})
  const [loading,    setLoading]    = useState(false)
  const [status,     setStatus]     = useState('')
  const [videoUrl,   setVideoUrl]   = useState(null)
  const [textResult, setTextResult] = useState(null)
  const [error,      setError]      = useState('')
  const [copied,     setCopied]     = useState(null)

  if (!tool) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: TEXT2, marginBottom: 20 }}>Tool not found.</p>
          <button onClick={() => navigate('/products')} style={{ padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 10, color: '#0e0c09', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        </div>
      </div>
    )
  }

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000) })
  }

  const generate = async () => {
    setError(''); setLoading(true); setVideoUrl(null); setTextResult(null); setStatus('')

    try {
      if (isVideo) {
        if (!wsKey) throw new Error('WaveSpeed API key not configured. Add VITE_WAVESPEED_API_KEY to your .env file.')
        if (!imageUrl.trim()) throw new Error('Enter your product image URL.')

        const prompt = tool.buildPrompt(fields)
        setStatus('Submitting job to WaveSpeed...')
        const job = await submitWaveSpeedJob(wsKey.trim(), tool.model, prompt, imageUrl.trim(), tool.duration)
        if (!job?.urls?.get) throw new Error('No job ID returned from WaveSpeed.')

        setStatus('Generating video — this takes 30–90 seconds...')
        const url = await pollWaveSpeedJob(wsKey.trim(), job.urls.get)
        if (!url) throw new Error('No video URL in response.')
        setVideoUrl(url)
        setStatus('')
      } else {
        if (!gemKey) throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.')
        setStatus('Generating with Gemini AI...')
        const text = await callGemini(gemKey.trim(), tool.buildPrompt(fields))
        const json = tryParseJSON(text)
        setTextResult({ raw: text, json })
        setStatus('')
      }
    } catch (e) {
      setError(e.message)
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  const renderTextResult = () => {
    if (!textResult) return null
    if (textResult.json) {
      return Object.entries(textResult.json).map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        const display = Array.isArray(val)
          ? val.map((v, i) => typeof v === 'object' ? `${i+1}. ${Object.values(v).join(' — ')}` : `${i+1}. ${v}`).join('\n')
          : typeof val === 'object' ? Object.entries(val).map(([k,v]) => `${k}: ${v}`).join('\n')
          : String(val)
        return (
          <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: tool.color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
              <button onClick={() => copy(display, key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === key ? '#4ade80' : TEXT3, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                {copied === key ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <pre style={{ margin: 0, padding: '11px 14px', fontSize: 12, color: TEXT2, lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Inter',sans-serif" }}>{display}</pre>
          </div>
        )
      })
    }
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: tool.color }}>RESULT</span>
          <button onClick={() => copy(textResult.raw, 'raw')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <Copy size={10} /> Copy
          </button>
        </div>
        <pre style={{ margin: 0, padding: '14px', fontSize: 12, color: TEXT2, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Inter',sans-serif" }}>{textResult.raw}</pre>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Back */}
        <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT2, fontSize: 14, cursor: 'pointer', marginBottom: 36, padding: 0 }}>
          <ArrowLeft size={15} /> Back to Tools
        </button>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', background: `${tool.color}15`, border: `1px solid ${tool.color}35`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: tool.color, letterSpacing: '0.08em', marginBottom: 14 }}>
            {tool.badge}
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', color: TEXT, marginBottom: 8, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1.15 }}>{tool.title}</h1>
          <p style={{ color: TEXT2, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{tool.subtitle}</p>
          {isVideo && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '5px 12px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, fontSize: 11, color: '#fb923c' }}>
              <Video size={11} /> Powered by WaveSpeed AI · {tool.model}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 28 }}>

          {/* ── LEFT: Inputs ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Image URL (video tools only) */}
            {isVideo && (
              <div>
                <label style={{ display: 'block', fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
                  Product Image URL <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Link size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT3 }} />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://your-product-image.jpg"
                    style={{ ...inp, paddingLeft: 34 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: TEXT3, marginTop: 5 }}>Paste a direct link to your product image (JPG, PNG, WebP)</p>
              </div>
            )}

            {/* Tool-specific fields */}
            {tool.fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>{f.label}</label>
                <input
                  type="text"
                  value={fields[f.key] || ''}
                  onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={inp}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading}
              style={{ padding: '14px', background: loading ? 'rgba(200,151,62,0.4)' : 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,151,62,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {status || 'Working...'}</>
                : <><Sparkles size={16} /> {isVideo ? 'Generate Video' : 'Generate SEO'}</>
              }
            </button>

            {loading && status && (
              <p style={{ fontSize: 12, color: TEXT3, textAlign: 'center', marginTop: -4 }}>{status}</p>
            )}
          </div>

          {/* ── RIGHT: Output ── */}
          <div>
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', padding: '60px 20px', border: `1px dashed ${tool.color}35`, borderRadius: 16 }}>
                  <Loader2 size={36} color={tool.color} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                  <p style={{ color: TEXT2, fontSize: 14, marginBottom: 8 }}>{status || 'Processing...'}</p>
                  {isVideo && <p style={{ color: TEXT3, fontSize: 12 }}>Video generation typically takes 30–90 seconds</p>}
                </motion.div>
              )}

              {!loading && videoUrl && (
                <motion.div key="video" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: tool.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Generated Video</span>
                    <a href={videoUrl} download target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: `${tool.color}15`, border: `1px solid ${tool.color}35`, borderRadius: 8, color: tool.color, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                      Download
                    </a>
                  </div>
                  <video
                    src={videoUrl} controls autoPlay loop muted playsInline
                    style={{ width: '100%', borderRadius: 14, border: `1px solid ${tool.color}35`, background: '#000' }}
                  />
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input value={videoUrl} readOnly style={{ ...inp, fontSize: 11, color: TEXT3, flex: 1, padding: '6px 10px' }} />
                    <button onClick={() => copy(videoUrl, 'url')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'url' ? '#4ade80' : TEXT3, flexShrink: 0 }}>
                      {copied === 'url' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </motion.div>
              )}

              {!loading && textResult && (
                <motion.div key="text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: tool.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEO Results</span>
                    <button onClick={() => copy(textResult.raw, 'all')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: `${tool.color}12`, border: `1px solid ${tool.color}30`, borderRadius: 8, color: tool.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {copied === 'all' ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy All</>}
                    </button>
                  </div>
                  <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
                    {renderTextResult()}
                  </div>
                </motion.div>
              )}

              {!loading && !videoUrl && !textResult && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 16 }}>
                  {isVideo ? <Video size={32} color={TEXT3} style={{ marginBottom: 14 }} /> : <Sparkles size={32} color={TEXT3} style={{ marginBottom: 14 }} />}
                  <p style={{ color: TEXT3, fontSize: 13, marginBottom: 6 }}>
                    {isVideo ? 'Enter your product image URL and details, then click Generate Video' : 'Fill in the details and click Generate SEO'}
                  </p>
                  {isVideo && <p style={{ color: TEXT3, fontSize: 11 }}>Output: MP4 video · 720p · ~5 seconds</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
