'use client'
import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, RotateCcw, Video, Image, Film, FileText, Tag,
  Loader2, Check, ChevronRight, Sparkles, AlertCircle, Download,
  Play, ZoomIn
} from 'lucide-react'

const CLOUDINARY_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxbn3vyig'
const CLOUDINARY_PRESET = 'tiktok_videos'

/* ── Upload base64 image to Cloudinary, return URL ─────────────────────── */
async function uploadToCloudinary(base64, mimeType = 'image/jpeg') {
  const blob = await fetch(`data:${mimeType};base64,${base64}`).then(r => r.blob())
  const fd   = new FormData()
  fd.append('file', blob, 'generated.jpg')
  fd.append('upload_preset', CLOUDINARY_PRESET)
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  return data.secure_url || ''
}

/* ── Generate image via Pollinations (free, no API key) ─────────────────── */
async function pollinationsGenerateImage(prompt) {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Pollinations error ${res.status}`)
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  return [{ base64, mimeType: 'image/jpeg' }]
}

/* ── Call Groq text model ───────────────────────────────────────────────── */
async function groqText(prompt) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `API ${res.status}`) }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (match) { try { return JSON.parse(match[1]) } catch (_) {} }
  return { raw: text }
}

/* ── Tool definitions ───────────────────────────────────────────────────── */
const TOOLS = [
  {
    key: 'angles',
    icon: <RotateCcw size={22} />,
    color: '#10b981',
    title: 'Image → Multi Angles',
    subtitle: 'Front, side, back, top views',
    desc: 'Generate 4 e-commerce ready product angles from your uploaded image.',
    needsImage: true,
  },
  {
    key: 'lifestyle',
    icon: <Image size={22} />,
    color: '#ec4899',
    title: 'AI Lifestyle Images',
    subtitle: 'Professional model shots',
    desc: 'Place your product on AI models in real-world lifestyle settings.',
    needsImage: true,
  },
  {
    key: 'video',
    icon: <Film size={22} />,
    color: '#f97316',
    title: 'Image → Lifestyle Video',
    subtitle: 'Story-driven product video',
    desc: 'Generate a video script + storyboard ready to post on Reels & TikTok.',
    needsImage: false,
  },
  {
    key: '360',
    icon: <Video size={22} />,
    color: '#a855f7',
    title: 'Image → 360° Frames',
    subtitle: 'Turntable rotation frames',
    desc: 'Create smooth 360° orbital frames for interactive product embeds.',
    needsImage: true,
  },
  {
    key: 'description',
    icon: <FileText size={22} />,
    color: '#06b6d4',
    title: 'Product Description',
    subtitle: 'Copy, specs & bullet points',
    desc: 'AI writes your title, 6 bullet points, full description & tech specs.',
    needsImage: false,
  },
  {
    key: 'seo',
    icon: <Tag size={22} />,
    color: '#c8973e',
    title: 'SEO & Meta Tags',
    subtitle: 'Search & discoverability',
    desc: 'Generate meta title, description, keywords and backlink targets.',
    needsImage: false,
  },
]

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function ProductLaunchModal({ onClose, onProceed, productName = '', productDesc = '' }) {
  const fileRef  = useRef()
  const [imgFile,    setImgFile]    = useState(null)
  const [imgBase64,  setImgBase64]  = useState('')
  const [imgMime,    setImgMime]    = useState('image/jpeg')
  const [imgPreview, setImgPreview] = useState('')
  const [prodName,   setProdName]   = useState(productName)
  const [prodDesc2,  setProdDesc2]  = useState(productDesc)

  /* per-tool state: idle | generating | done | error */
  const [toolState,   setToolState]   = useState({})
  const [toolResults, setToolResults] = useState({})
  const [toolErrors,  setToolErrors]  = useState({})

  const [lightbox, setLightbox] = useState(null)

  const setTs  = (key, val) => setToolState(p  => ({ ...p, [key]: val }))
  const setTr  = (key, val) => setToolResults(p => ({ ...p, [key]: val }))
  const setTe  = (key, val) => setToolErrors(p  => ({ ...p, [key]: val }))

  /* ── Image upload ─────────────────────────────────────────────────────── */
  const handleFile = (file) => {
    if (!file) return
    setImgFile(file)
    setImgMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setImgPreview(dataUrl)
      const b64 = dataUrl.split(',')[1]
      setImgBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  /* ── Generate per tool ────────────────────────────────────────────────── */
  const generate = async (toolKey) => {
    setTs(toolKey, 'generating')
    setTe(toolKey, '')
    try {
      if (toolKey === 'angles') {
        const imgs = await pollinationsGenerateImage(
          `Professional product photography, ${prodName || 'product'}, four angles 2x2 grid, front side back top views, pure white background, studio lighting, e-commerce quality, ultra realistic`
        )
        const urls = await Promise.all(imgs.map(i => uploadToCloudinary(i.base64, i.mimeType)))
        setTr(toolKey, { type: 'images', urls, base64s: imgs })
      }

      else if (toolKey === 'lifestyle') {
        const imgs = await pollinationsGenerateImage(
          `Lifestyle product photography, ${prodName || 'product'}, person using the product in a real-world setting, natural light, social media ready, high resolution, professional`
        )
        const urls = await Promise.all(imgs.map(i => uploadToCloudinary(i.base64, i.mimeType)))
        setTr(toolKey, { type: 'images', urls, base64s: imgs })
      }

      else if (toolKey === '360') {
        const imgs = await pollinationsGenerateImage(
          `Product photography 360 rotation strip, ${prodName || 'product'}, 8 rotation frames 0 45 90 135 180 225 270 315 degrees, pure white background, consistent lighting, e-commerce quality`
        )
        const urls = await Promise.all(imgs.map(i => uploadToCloudinary(i.base64, i.mimeType)))
        setTr(toolKey, { type: 'images', urls, base64s: imgs })
      }

      else if (toolKey === 'video') {
        const result = await groqText(`You are an expert video director and social media strategist. Create a complete lifestyle video script for the product "${prodName || 'product'}". ${prodDesc2 ? `Product details: ${prodDesc2}` : ''}

Return ONLY valid JSON:
{
  "videoTitle": "Catchy video title for Reels/TikTok (max 60 chars)",
  "hook": "Opening hook line spoken in first 2 seconds (max 10 words, stops the scroll)",
  "duration": "15 seconds or 30 seconds",
  "scenes": [
    { "second": "0-3s", "visual": "what the camera shows", "text": "on-screen text overlay", "voiceover": "voiceover line if any" },
    { "second": "3-8s", "visual": "scene description", "text": "overlay text", "voiceover": "voiceover" },
    { "second": "8-13s", "visual": "scene description", "text": "overlay text", "voiceover": "voiceover" },
    { "second": "13-15s", "visual": "CTA scene", "text": "call to action text", "voiceover": "closing line" }
  ],
  "caption": "Instagram/TikTok caption with hashtags (150 chars)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "musicMood": "Describe the ideal background music mood/style"
}`)
        setTr(toolKey, { type: 'video_script', data: result })
      }

      else if (toolKey === 'description') {
        const result = await groqText(`You are an expert ecommerce copywriter. Generate complete product listing copy for: "${prodName || 'product'}". ${prodDesc2 ? `Details: ${prodDesc2}` : ''}

Return ONLY valid JSON:
{
  "productTitle": "SEO-optimized product title (60-80 chars)",
  "marketingTagline": "Short punchy tagline (max 12 words)",
  "shortDescription": "2-3 sentence product summary",
  "fullDescription": "Detailed 200-300 word benefit-led marketing description",
  "bulletPoints": ["Feature 1: benefit", "Feature 2: benefit", "Feature 3: benefit", "Feature 4: benefit", "Feature 5: benefit", "Feature 6: benefit"],
  "technicalSpecs": {"Key Spec 1": "value", "Key Spec 2": "value", "Key Spec 3": "value", "Key Spec 4": "value", "Key Spec 5": "value"},
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "searchKeywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10"]
}`)
        setTr(toolKey, { type: 'description', data: result })
      }

      else if (toolKey === 'seo') {
        const result = await groqText(`You are an SEO expert. Generate complete SEO content for the product "${prodName || 'product'}". ${prodDesc2 ? `Details: ${prodDesc2}` : ''}

Return ONLY valid JSON:
{
  "pageTitle": "Primary SEO page title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "h1": "Primary H1 heading",
  "focusKeyword": "Primary target keyword",
  "secondaryKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "longTailKeywords": ["long tail phrase 1","long tail phrase 2","long tail phrase 3"],
  "openGraphTitle": "OG title for social sharing",
  "openGraphDescription": "OG description (max 200 chars)",
  "backLinkTargets": ["Type of site 1 to get backlinks from", "Type of site 2", "Type of site 3"],
  "schemaType": "Product",
  "canonicalAdvice": "Brief canonical URL advice"
}`)
        setTr(toolKey, { type: 'seo', data: result })
      }

      setTs(toolKey, 'done')
    } catch (err) {
      setTe(toolKey, err.message || 'Generation failed. Please try again.')
      setTs(toolKey, 'error')
    }
  }

  /* ── Proceed to campaign ──────────────────────────────────────────────── */
  const handleProceed = () => {
    const assets = {}
    for (const key of Object.keys(toolResults)) {
      if (toolState[key] === 'done') assets[key] = toolResults[key]
    }
    sessionStorage.setItem('productAssets', JSON.stringify(assets))
    sessionStorage.setItem('productMeta', JSON.stringify({ name: prodName, desc: prodDesc2 }))
    onProceed()
  }

  const doneCount = Object.values(toolState).filter(s => s === 'done').length

  /* ── Styles ───────────────────────────────────────────────────────────── */
  const BG   = '#0e0c09'
  const GOLD = '#c8973e'

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, backdropFilter: 'blur(6px)' }}
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 32 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 32 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        position: 'fixed', inset: '0', margin: 'auto',
        width: '95vw', maxWidth: 980,
        height: '92vh', maxHeight: 880,
        background: BG, border: '1px solid rgba(200,151,62,0.25)',
        borderRadius: 24, zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} style={{ color: GOLD }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Enhance Your Product Campaign
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Generate visuals, video & copy — then launch your campaign with everything attached
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

        {/* Product info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Product Name</label>
            <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. ProGrip X1 Wireless Earbuds"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Brief Description</label>
            <input value={prodDesc2} onChange={e => setProdDesc2(e.target.value)} placeholder="e.g. True wireless earbuds with 40h battery, ANC"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}/>
          </div>
        </div>

        {/* Image upload */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          style={{
            border: `2px dashed ${imgPreview ? GOLD : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 14, padding: imgPreview ? '14px' : '28px 20px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 24,
            background: imgPreview ? 'rgba(200,151,62,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
          }}
        >
          {imgPreview ? (
            <>
              <img src={imgPreview} alt="product" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>✅ Product image uploaded</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{imgFile?.name} — Click to change</p>
              </div>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <Upload size={28} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Upload Product Image</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Required for image & video tools · PNG, JPG, WEBP</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

        {/* Tool cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {TOOLS.map(tool => {
            const state  = toolState[tool.key]  || 'idle'
            const result = toolResults[tool.key]
            const err    = toolErrors[tool.key]
            const locked = tool.needsImage && !imgBase64

            return (
              <div key={tool.key} style={{ background: '#1c1a13', border: `1px solid ${state === 'done' ? tool.color + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Card header */}
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${tool.color}14`, border: `1px solid ${tool.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool.color, flexShrink: 0 }}>
                    {tool.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{tool.subtitle}</p>
                  </div>
                  {state === 'done' && <Check size={16} style={{ color: '#4ade80', flexShrink: 0 }} />}
                </div>

                <div style={{ padding: '0 18px 16px' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 12, marginTop: 0 }}>{tool.desc}</p>

                  {/* Error */}
                  {err && (
                    <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 11, color: '#f87171', marginBottom: 10, display: 'flex', gap: 6 }}>
                      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />{err}
                    </div>
                  )}

                  {/* Result preview */}
                  {state === 'done' && result && (
                    <div style={{ marginBottom: 12 }}>
                      {result.type === 'images' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {result.urls.filter(Boolean).map((url, i) => (
                            <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setLightbox(url)}>
                              <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: `1px solid ${tool.color}30` }} />
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                <ZoomIn size={14} style={{ color: '#fff' }} />
                              </div>
                            </div>
                          ))}
                          {result.urls.filter(Boolean).length === 0 && (
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Images generated — upload to Cloudinary pending</p>
                          )}
                        </div>
                      )}
                      {result.type === 'video_script' && result.data && (
                        <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#f97316', margin: '0 0 4px' }}>🎬 {result.data.videoTitle || 'Video Script Ready'}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Hook: "{result.data.hook}"</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{result.data.scenes?.length || 0} scenes · {result.data.duration}</p>
                        </div>
                      )}
                      {result.type === 'description' && result.data && (
                        <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', margin: '0 0 4px' }}>{result.data.productTitle || 'Description Ready'}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{result.data.bulletPoints?.length || 0} bullet points · specs included</p>
                        </div>
                      )}
                      {result.type === 'seo' && result.data && (
                        <div style={{ background: 'rgba(200,151,62,0.06)', border: '1px solid rgba(200,151,62,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: '0 0 4px' }}>{result.data.pageTitle || 'SEO Ready'}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{result.data.secondaryKeywords?.length || 0} keywords · backlink targets included</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generate button */}
                  <button
                    disabled={state === 'generating' || locked}
                    onClick={() => generate(tool.key)}
                    style={{
                      width: '100%', padding: '9px 0',
                      background: state === 'done' ? 'rgba(74,222,128,0.1)' : locked ? 'rgba(255,255,255,0.04)' : `${tool.color}18`,
                      border: `1px solid ${state === 'done' ? 'rgba(74,222,128,0.3)' : locked ? 'rgba(255,255,255,0.08)' : tool.color + '40'}`,
                      borderRadius: 9, cursor: locked || state === 'generating' ? 'not-allowed' : 'pointer',
                      color: state === 'done' ? '#4ade80' : locked ? 'rgba(255,255,255,0.2)' : tool.color,
                      fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all 0.2s',
                    }}
                  >
                    {state === 'generating' ? (
                      <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    ) : state === 'done' ? (
                      <><Check size={13} /> Regenerate</>
                    ) : locked ? (
                      <>Upload image first</>
                    ) : (
                      <><Sparkles size={13} /> Generate</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '18px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#0e0c09', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {doneCount > 0
            ? <span style={{ color: '#4ade80', fontWeight: 700 }}>✅ {doneCount} asset{doneCount !== 1 ? 's' : ''} generated — will be attached to your campaign</span>
            : 'Generate assets above, or skip to go straight to the campaign form'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleProceed} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            {doneCount > 0 ? `Launch Campaign with ${doneCount} Asset${doneCount !== 1 ? 's' : ''}` : 'Skip & Launch Campaign'} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </motion.div>

    {/* ── Lightbox ── */}
    <AnimatePresence>
      {lightbox && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
