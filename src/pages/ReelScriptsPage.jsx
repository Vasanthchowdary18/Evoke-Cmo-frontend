import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, ArrowLeft, ArrowRight, Loader2, Copy, Check, AlertCircle, Download } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const GOLD   = '#c8973e'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'
const ORANGE = '#f97316'
const FONT   = "'Inter', sans-serif"

const PLATFORMS = [
  { key: 'instagram_reels', label: 'Instagram Reels', color: '#dd2a7b', duration: '15–60s' },
  { key: 'tiktok',          label: 'TikTok',          color: '#ff0050', duration: '15–60s' },
  { key: 'youtube_shorts',  label: 'YouTube Shorts',  color: '#ff0000', duration: '≤60s'   },
  { key: 'facebook_reels',  label: 'Facebook Reels',  color: '#1877f2', duration: '15–90s' },
]

const SCRIPT_TYPES = [
  'Product Showcase',
  'Brand Story',
  'Tutorial / How-to',
  'Trend / Challenge',
  'Testimonial',
  'Behind the Scenes',
  'Promotional / Sale',
  'Educational / Tips',
]

const DURATIONS = ['15 seconds', '30 seconds', '45 seconds', '60 seconds']
const TARGET_AUDIENCES = ['Marketing Managers', 'CMOs & Marketing Leaders', 'Small Business Owners', 'Startup Founders', 'E-Commerce Brands', 'B2B Decision Makers', 'Sales Professionals', 'Product Managers', 'Entrepreneurs', 'Enterprise Teams', 'Agency Clients', 'General Consumers']

async function generateScriptForPlatform({ platformKey, scriptType, context, audience, duration }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''
  const platformLabel = PLATFORMS.find(p => p.key === platformKey)?.label || platformKey

  const prompt = `You are an expert short-form video scriptwriter. Generate a complete ${duration} ${platformLabel} video script.

Platform: ${platformLabel}
Script Type: ${scriptType}
Product / Brand Context: ${context}
Target Audience: ${audience || 'General audience'}
Duration: ${duration}

Generate a complete, ready-to-shoot video script. Return ONLY valid JSON (no markdown):
{
  "hook": "Opening line or visual (first 3 seconds — must stop the scroll)",
  "hookVariants": ["alternative hook 1", "alternative hook 2", "alternative hook 3"],
  "script": [
    { "timecode": "0:00–0:03", "action": "what happens on screen", "voiceover": "what is said", "onscreenText": "text overlay if any" },
    { "timecode": "0:03–0:10", "action": "...", "voiceover": "...", "onscreenText": "..." },
    { "timecode": "0:10–0:20", "action": "...", "voiceover": "...", "onscreenText": "..." },
    { "timecode": "0:20–0:30", "action": "...", "voiceover": "...", "onscreenText": "..." }
  ],
  "cta": "Final call-to-action line",
  "visualDirection": "Overall visual style, colour palette, editing pace, music vibe",
  "caption": "Ready-to-post caption for ${platformLabel} with hashtags",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10"]
}`

  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an expert short-form video scriptwriter. Always respond with only valid JSON.' },
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

function copyText(text, key, setCopied) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(c => ({ ...c, [key]: true }))
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000)
  })
}

export default function ReelScriptsPage() {
  const navigate = useNavigate()

  const [platforms, setPlatforms]   = useState([])       // ← multi-select array
  const [scriptType, setScriptType] = useState('')
  const [context, setContext]       = useState('')
  const [audience, setAudience]     = useState('')
  const [duration, setDuration]     = useState('30 seconds')
  const [loading, setLoading]       = useState(false)
  const [loadingPlatform, setLoadingPlatform] = useState('')
  const [error, setError]           = useState('')
  const [results, setResults]       = useState({})       // keyed by platform key
  const [copied, setCopied]         = useState({})
  const [activeTab, setActiveTab]   = useState('')

  const togglePlatform = (key) => {
    setPlatforms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleGenerate = async () => {
    setError('')
    if (platforms.length === 0) return setError('Please select at least one platform.')
    if (!scriptType)             return setError('Please select a script type.')
    if (!context.trim())         return setError('Please describe your product or brand.')

    setLoading(true)
    setResults({})
    setActiveTab(platforms[0])

    // Generate scripts sequentially per platform
    const newResults = {}
    for (const pKey of platforms) {
      setLoadingPlatform(PLATFORMS.find(p => p.key === pKey)?.label || pKey)
      try {
        const data = await generateScriptForPlatform({ platformKey: pKey, scriptType, context, audience, duration })
        newResults[pKey] = data
        setResults(r => ({ ...r, [pKey]: data }))
      } catch (err) {
        newResults[pKey] = { error: err.message }
        setResults(r => ({ ...r, [pKey]: { error: err.message } }))
      }
    }

    setLoading(false)
    setLoadingPlatform('')
  }

  const downloadScript = (pKey) => {
    const result = results[pKey]
    if (!result || result.error) return
    const platformLabel = PLATFORMS.find(p => p.key === pKey)?.label || pKey
    const lines = [
      `REEL / VIDEO SCRIPT`,
      `Platform: ${platformLabel}  |  Type: ${scriptType}  |  Duration: ${duration}`,
      ``,
      `━━━ HOOK ━━━`,
      result.hook,
      ``,
      `Alternative Hooks:`,
      ...(result.hookVariants || []).map((h, i) => `  ${i + 1}. ${h}`),
      ``,
      `━━━ SCRIPT ━━━`,
      ...(result.script || []).flatMap(s => [
        `[${s.timecode}]`,
        `  ACTION:      ${s.action}`,
        `  VOICEOVER:   ${s.voiceover}`,
        `  ON-SCREEN:   ${s.onscreenText || '—'}`,
        ``,
      ]),
      `━━━ CTA ━━━`,
      result.cta,
      ``,
      `━━━ VISUAL DIRECTION ━━━`,
      result.visualDirection,
      ``,
      `━━━ CAPTION ━━━`,
      result.caption,
      ``,
      `━━━ HASHTAGS ━━━`,
      (result.hashtags || []).join(' '),
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reel-script-${platformLabel.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const s = {
    page: { minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT },
    container: { maxWidth: 780, margin: '0 auto', padding: '88px 24px 60px' },
    label: { fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 8, display: 'block' },
    req: { color: ORANGE, marginLeft: 3 },
    input: {
      width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
    },
    textarea: {
      width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', resize: 'vertical',
      minHeight: 90, boxSizing: 'border-box',
    },
    select: {
      width: '100%', padding: '12px 14px', background: '#1c1a13',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT,
      fontSize: 14, fontFamily: FONT, outline: 'none', cursor: 'pointer',
      colorScheme: 'dark',
    },
    generateBtn: {
      width: '100%', marginTop: 24, padding: '15px',
      background: loading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${ORANGE}, #ea580c)`,
      border: 'none', borderRadius: 12, color: loading ? TEXT3 : '#fff',
      fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: FONT,
    },
    card: {
      background: CARD, border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 20px', marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 10, fontWeight: 800, color: TEXT3,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
    },
    copyBtn: {
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: TEXT2,
      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: FONT,
    },
  }

  const hasResults = Object.keys(results).length > 0
  const currentTab = activeTab || platforms[0] || ''
  const activePlatformData = PLATFORMS.find(p => p.key === currentTab)
  const currentResult = results[currentTab]

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Back */}
        <button
          onClick={() => navigate('/hub/content')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0, fontFamily: FONT }}
        >
          <ArrowLeft size={14} /> Back to Content Generation
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${ORANGE}18`, border: `1px solid ${ORANGE}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE }}>
            <Film size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Reel & Video Scripts</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(200,151,62,0.15)', color: GOLD, border: '1px solid rgba(200,151,62,0.3)' }}>PACKAGE B</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT2, margin: '4px 0 0' }}>
              AI-generated scripts with hook, body, CTA, on-screen text cues & visual direction.
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

        {/* ── Platform multi-select ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>
            Platforms <span style={s.req}>*</span>
            <span style={{ color: TEXT3, fontWeight: 400, marginLeft: 8, fontSize: 12 }}>Select as many as you like</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => {
              const active = platforms.includes(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                    background: active ? `${p.color}22` : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.1)'}`,
                    color: active ? p.color : TEXT3,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {active && <Check size={11} />}
                  {p.label}
                  <span style={{ fontSize: 10, opacity: 0.55 }}>{p.duration}</span>
                </button>
              )
            })}
          </div>
          {platforms.length > 0 && (
            <p style={{ fontSize: 11, color: TEXT3, marginTop: 8, margin: '8px 0 0' }}>
              {platforms.length} platform{platforms.length > 1 ? 's' : ''} selected — a unique script will be generated for each.
            </p>
          )}
        </div>

        {/* ── Script type + Duration ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
          <div>
            <label style={s.label}>Script Type <span style={s.req}>*</span></label>
            <select value={scriptType} onChange={e => setScriptType(e.target.value)} style={s.select}>
              <option value="" style={{ background: '#1c1a13', color: TEXT3 }}>Select script type...</option>
              {SCRIPT_TYPES.map(t => (
                <option key={t} value={t} style={{ background: '#1c1a13', color: TEXT }}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.label}>Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={s.select}>
              {DURATIONS.map(d => (
                <option key={d} value={d} style={{ background: '#1c1a13', color: TEXT }}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Context ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>Product / Brand Context <span style={s.req}>*</span></label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe your product, service or brand. Include key benefits, unique selling points, and the message you want to get across..."
            style={s.textarea}
          />
        </div>

        {/* ── Audience ── */}
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>
            Target Audience
            <span style={{ color: TEXT3, fontWeight: 400, marginLeft: 6 }}>(optional)</span>
          </label>
          <select value={audience} onChange={e => setAudience(e.target.value)} style={s.select}>
            <option value="">Select target audience...</option>
            {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
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
              {loadingPlatform ? `Generating ${loadingPlatform} script…` : 'Generating scripts…'}
            </>
          ) : (
            <>
              Generate Script{platforms.length > 1 ? 's' : ''} <ArrowRight size={17} />
            </>
          )}
        </button>

        {/* ── Results ── */}
        <AnimatePresence>
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 36 }}
            >
              <p style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                Generated Scripts
              </p>

              {/* ── Platform tabs ── */}
              {platforms.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {platforms.map(pKey => {
                    const p = PLATFORMS.find(x => x.key === pKey)
                    const isActive = currentTab === pKey
                    const isReady = !!results[pKey]
                    return (
                      <button
                        key={pKey}
                        onClick={() => setActiveTab(pKey)}
                        style={{
                          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                          background: isActive ? `${p.color}22` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${isActive ? p.color : 'rgba(255,255,255,0.08)'}`,
                          color: isActive ? p.color : TEXT3,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {isReady ? <Check size={11} /> : <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                        {p?.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Script content for active tab ── */}
              {currentResult && !currentResult.error && (
                <div>
                  {/* Hook */}
                  <div style={{ ...s.card, borderLeft: `3px solid ${activePlatformData?.color || ORANGE}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ ...s.sectionTitle, margin: 0 }}>Hook (first 3 seconds — stop the scroll)</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => downloadScript(currentTab)} style={s.copyBtn}>
                          <Download size={12} /> Download
                        </button>
                        <button
                          onClick={() => {
                            const full = [currentResult.hook, ...(currentResult.script||[]).map(s=>`[${s.timecode}] ${s.voiceover}`), currentResult.cta].join('\n\n')
                            copyText(full, `all-${currentTab}`, setCopied)
                          }}
                          style={s.copyBtn}
                        >
                          {copied[`all-${currentTab}`] ? <Check size={12} /> : <Copy size={12} />}
                          {copied[`all-${currentTab}`] ? 'Copied!' : 'Copy all'}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 14px', lineHeight: 1.5 }}>
                      "{currentResult.hook}"
                    </p>
                    {currentResult.hookVariants?.length > 0 && (
                      <>
                        <p style={{ ...s.sectionTitle, marginTop: 8 }}>Alternative Hooks</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {currentResult.hookVariants.map((h, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ fontSize: 11, color: ORANGE, fontWeight: 700, marginTop: 2 }}>{i + 1}.</span>
                              <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{h}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Script */}
                  {currentResult.script?.length > 0 && (
                    <div style={s.card}>
                      <p style={s.sectionTitle}>Full Script</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {currentResult.script.map((row, i) => (
                          <div key={i} style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: '0.08em' }}>{row.timecode}</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                              <div>
                                <p style={{ ...s.sectionTitle, marginBottom: 4 }}>Action</p>
                                <p style={{ fontSize: 12, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{row.action}</p>
                              </div>
                              <div>
                                <p style={{ ...s.sectionTitle, marginBottom: 4 }}>Voiceover</p>
                                <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{row.voiceover}"</p>
                              </div>
                            </div>
                            {row.onscreenText && row.onscreenText !== '—' && (
                              <div style={{ marginTop: 8 }}>
                                <p style={{ ...s.sectionTitle, marginBottom: 4 }}>On-screen Text</p>
                                <span style={{
                                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                                  background: `${activePlatformData?.color || ORANGE}18`,
                                  border: `1px solid ${activePlatformData?.color || ORANGE}30`,
                                  color: activePlatformData?.color || ORANGE, fontSize: 12, fontWeight: 600,
                                }}>{row.onscreenText}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA + Visual direction */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {currentResult.cta && (
                      <div style={s.card}>
                        <p style={s.sectionTitle}>CTA</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: GOLD, margin: 0 }}>{currentResult.cta}</p>
                      </div>
                    )}
                    {currentResult.visualDirection && (
                      <div style={s.card}>
                        <p style={s.sectionTitle}>Visual Direction</p>
                        <p style={{ fontSize: 12, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{currentResult.visualDirection}</p>
                      </div>
                    )}
                  </div>

                  {/* Caption + Hashtags */}
                  {currentResult.caption && (
                    <div style={s.card}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p style={{ ...s.sectionTitle, margin: 0 }}>Post Caption</p>
                        <button onClick={() => copyText(currentResult.caption, `caption-${currentTab}`, setCopied)} style={s.copyBtn}>
                          {copied[`caption-${currentTab}`] ? <Check size={12} /> : <Copy size={12} />}
                          {copied[`caption-${currentTab}`] ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{currentResult.caption}</p>
                      {currentResult.hashtags?.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {currentResult.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              onClick={() => copyText(tag, `tag-${currentTab}-${i}`, setCopied)}
                              title="Click to copy"
                              style={{
                                padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                                background: `${activePlatformData?.color || ORANGE}14`,
                                border: `1px solid ${activePlatformData?.color || ORANGE}25`,
                                color: activePlatformData?.color || ORANGE, cursor: 'pointer',
                              }}
                            >
                              {copied[`tag-${currentTab}-${i}`] ? '✓' : tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentResult?.error && (
                <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#fca5a5', fontSize: 13 }}>
                  Failed to generate script for this platform: {currentResult.error}
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={handleGenerate}
                style={{
                  marginTop: 16, padding: '11px 24px',
                  background: `rgba(249,115,22,0.1)`,
                  border: `1px solid ${ORANGE}35`, borderRadius: 10, color: ORANGE,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Regenerate All Scripts
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  )
}
