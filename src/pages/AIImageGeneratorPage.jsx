import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download, Loader2, ImageIcon, Layers } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import ToolTopBar from '../components/ToolTopBar.jsx'
import { downloadBanner, sanitizeBannerFilename } from '../services/bannerService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

const STYLES = [
  { key: 'photo',       label: 'Photorealistic', modifier: 'photorealistic, ultra-detailed, natural lighting, 8k resolution' },
  { key: 'illustration',label: 'Illustration',    modifier: 'digital illustration, painterly style, expressive linework' },
  { key: '3d',          label: '3D Render',       modifier: '3D render, studio lighting, octane render, high fidelity materials' },
  { key: 'flat',        label: 'Flat Design',     modifier: 'flat design, minimal vector illustration, solid color blocking, clean geometric shapes' },
]

// width/height sent straight to the (free, no-key) Pollinations provider —
// the only provider in this environment with valid, working credentials.
const ASPECTS = [
  { key: '1:1',  label: '1:1',  width: 1024, height: 1024 },
  { key: '16:9', label: '16:9', width: 1344, height: 756 },
  { key: '9:16', label: '9:16', width: 756,  height: 1344 },
  { key: '4:5',  label: '4:5',  width: 896,  height: 1120 },
]

// Calls the real /api/generate-banner Vercel edge function — same backend
// that powers the Event Banner Generator, just with a free-form prompt.
async function generateImage(prompt, { width, height }) {
  const res = await fetch('/api/generate-banner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider: 'pollinations', width, height }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error || !data.base64Image) {
    throw new Error(data.error || `Image generation failed (${res.status})`)
  }
  return `data:${data.mimeType || 'image/png'};base64,${data.base64Image}`
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

export default function AIImageGeneratorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || {}

  const [prompt, setPrompt]       = useState(prefill.prompt || '')
  const [styleKey, setStyleKey]   = useState(STYLES[0].key)
  const [aspectKey, setAspectKey] = useState(ASPECTS[0].key)
  const [variations, setVariations] = useState(4)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [results, setResults]     = useState([])

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Describe the image you want to generate first.'); return }
    setError('')
    setLoading(true)
    setResults([])
    try {
      const style = STYLES.find(s => s.key === styleKey)
      const aspect = ASPECTS.find(a => a.key === aspectKey)
      const finalPrompt = `${prompt.trim()}. ${style.modifier}.`
      const jobs = Array.from({ length: variations }, () => generateImage(finalPrompt, aspect))
      const settled = await Promise.allSettled(jobs)
      const ok = settled.filter(s => s.status === 'fulfilled').map(s => s.value)
      if (ok.length === 0) throw new Error(settled.find(s => s.status === 'rejected')?.reason?.message || 'Generation failed — please try again.')
      setResults(ok)
    } catch (e) {
      setError(e.message || 'Generation failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageUrl, i) => {
    await downloadBanner(imageUrl, sanitizeBannerFilename(`${prompt || 'ai-image'}-${i + 1}`))
  }

  const handleUseInCampaign = (imageUrl) => {
    const imageFile = dataUrlToFile(imageUrl, sanitizeBannerFilename(prompt || 'ai-image'))
    navigate('/new-campaign', { state: { prefill: { type: 'event', imageFile, imagePreview: imageUrl } } })
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <ToolTopBar
          title="AI Image Generator"
          subtitle="Generate hyper-realistic art-directed marketing imagery with prompt-perfect guidance."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Image Generation ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Image Generation</div>

            <Field label="Creative Prompt">
              <textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Luxury minimalist leather handbag placed on a monolithic travertine stone block, direct afternoon soft architectural shadow. Warm aesthetic, 8k resolution."
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Geist','Inter',sans-serif", lineHeight: 1.5 }}
              />
            </Field>

            <Field label="Image Style">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STYLES.map(s => (
                  <button
                    key={s.key} onClick={() => setStyleKey(s.key)}
                    style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Geist','Inter',sans-serif",
                      background: styleKey === s.key ? GDIM : CARD2,
                      border: `1px solid ${styleKey === s.key ? GBORD : BORDER}`,
                      color: styleKey === s.key ? GOLD : TEXT2,
                    }}
                  >{s.label}</button>
                ))}
              </div>
            </Field>

            <Field label="Aspect Ratio">
              <div style={{ display: 'flex', gap: 6 }}>
                {ASPECTS.map(a => (
                  <button
                    key={a.key} onClick={() => setAspectKey(a.key)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Geist','Inter',sans-serif",
                      background: aspectKey === a.key ? GDIM : CARD2,
                      border: `1px solid ${aspectKey === a.key ? GBORD : BORDER}`,
                      color: aspectKey === a.key ? GOLD : TEXT2,
                    }}
                  >{a.label}</button>
                ))}
              </div>
            </Field>

            <Field label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Number of Variations</span><span style={{ color: GOLD, fontWeight: 700 }}>{variations} Image{variations > 1 ? 's' : ''}</span></div>}>
              <input type="range" min={1} max={4} step={1} value={variations} onChange={e => setVariations(Number(e.target.value))} style={{ width: '100%', accentColor: GOLD }} />
            </Field>

            {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}

            <button onClick={handleGenerate} disabled={loading} style={{
              padding: '14px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit','Inter',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1,
            }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Images →</>}
            </button>
          </div>

          {/* ── RIGHT: Generated Outputs ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, minHeight: 400 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Generated Outputs</div>

            {results.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, gap: 10, color: TEXT3, fontSize: 13, textAlign: 'center' }}>
                {loading
                  ? <><Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: GOLD }} /> Rendering {variations} image{variations > 1 ? 's' : ''}…</>
                  : <><ImageIcon size={28} /> Describe an image and generate to see outputs here.</>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                {results.map((imageUrl, i) => (
                  <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                    <img src={imageUrl} alt={`${prompt} ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <div style={{ display: 'flex', gap: 8, padding: 10 }}>
                      <button onClick={() => handleDownload(imageUrl, i)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT2, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif" }}>
                        <Download size={11} /> Download
                      </button>
                      <button onClick={() => handleUseInCampaign(imageUrl)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 6, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif" }}>
                        <Layers size={11} /> Use in Campaign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif" }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#1a1a24', border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: "'Geist','Inter',sans-serif", outline: 'none',
}
