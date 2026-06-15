import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, ArrowLeft, ArrowRight, Loader2, Copy, Check, AlertCircle, Send } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

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

export default function CaptionSuitePage() {
  const navigate = useNavigate()

  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [contentType, setContentType] = useState('')
  const [context, setContext] = useState('')
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [copied, setCopied] = useState({})

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
          onClick={() => navigate('/package-b')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0, fontFamily: FONT }}
        >
          <ArrowLeft size={14} /> Back to Package B
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${GREEN}18`, border: `1px solid ${GREEN}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}>
            <Hash size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Caption & Hashtag Suite</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(200,151,62,0.15)', color: GOLD, border: '1px solid rgba(200,151,62,0.3)' }}>PACKAGE B</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT2, margin: '4px 0 0', lineHeight: 1.5 }}>
              Generate platform-optimised captions, CTAs, and hashtag sets in seconds.
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

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
      </div>
    </div>
  )
}
