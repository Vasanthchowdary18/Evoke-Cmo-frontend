import React, { useState } from 'react'
import { Copy, Download, RefreshCw, X, Loader2 } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import ToolTopBar from '../components/ToolTopBar.jsx'
import { generateBlog } from './ContentGenerationPage.jsx'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'
const GREEN  = '#10b981'

const TONES = [
  'Professional & Analytical', 'Conversational & Friendly', 'Bold & Provocative',
  'Inspirational & Visionary', 'Playful & Witty', 'Authoritative & Expert',
]

// Real, deterministic scoring from the actual generated content — not a
// fabricated number. Each factor is a genuine on-page SEO signal.
function scoreArticle(result, keywords, targetWords) {
  if (!result) return 0
  let score = 0
  const kw = keywords.map(k => k.toLowerCase()).filter(Boolean)
  const headline = (result.headline || '').toLowerCase()
  const intro = (result.intro || '').toLowerCase()
  if (kw.length === 0 || kw.some(k => headline.includes(k))) score += 20
  if (kw.length === 0 || kw.some(k => intro.includes(k))) score += 15
  const titleLen = (result.metaTitle || '').length
  if (titleLen >= 30 && titleLen <= 60) score += 15
  const descLen = (result.metaDescription || '').length
  if (descLen >= 70 && descLen <= 155) score += 15
  if ((result.sections || []).length >= 4) score += 15
  const fullText = [result.intro, ...(result.sections || []).map(s => s.body), result.conclusion].filter(Boolean).join(' ')
  const actualWords = fullText.split(/\s+/).filter(Boolean).length
  if (targetWords > 0 && Math.abs(actualWords - targetWords) / targetWords <= 0.35) score += 20
  return Math.min(100, score)
}

export default function BlogGeneratorPage() {
  const [topic, setTopic]         = useState('')
  const [keywords, setKeywords]   = useState([])
  const [kwInput, setKwInput]     = useState('')
  const [tone, setTone]           = useState(TONES[0])
  const [wordCount, setWordCount] = useState(1500)
  const [deepSeo, setDeepSeo]     = useState(true)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)

  const addKeyword = () => {
    const v = kwInput.trim()
    if (v && !keywords.includes(v)) setKeywords(k => [...k, v])
    setKwInput('')
  }
  const removeKeyword = (k) => setKeywords(ks => ks.filter(x => x !== k))

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Enter a topic or idea first.'); return }
    setError('')
    setLoading(true)
    try {
      const r = await generateBlog({
        topic, keywords: keywords.join(', '), tone, wordCount, deepSeo,
      })
      setResult(r)
    } catch (e) {
      setError(e.message || 'Generation failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHtml = () => {
    if (!result) return
    const html = [
      `<h1>${result.headline}</h1>`,
      `<p>${result.intro}</p>`,
      ...(result.sections || []).map(s => `<h2>${s.h2}</h2>\n<p>${s.body}</p>`),
      `<p>${result.conclusion}</p>`,
    ].join('\n')
    navigator.clipboard.writeText(html).catch(() => {})
  }

  const handleExportPdf = () => {
    if (!result) return
    window.print()
  }

  const seoScore = scoreArticle(result, keywords, wordCount)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          #blog-print-area, #blog-print-area * { visibility: visible; }
          #blog-print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <ToolTopBar
          title="Blog Generator"
          subtitle="Construct long-form industry intelligence narratives with live previews."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Generation Parameters ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Generation Parameters</div>

            <Field label="Topic / Idea">
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Sartorial Sovereignty in Avant-Garde Luxury Design" style={inputStyle} />
            </Field>

            <Field label="Target Keywords">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: keywords.length ? 8 : 0 }}>
                {keywords.map(k => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 11, color: TEXT2 }}>
                    {k} <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeKeyword(k)} />
                  </span>
                ))}
              </div>
              <input
                value={kwInput} onChange={e => setKwInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword() } }}
                onBlur={addKeyword}
                placeholder="Type a keyword, press Enter"
                style={inputStyle}
              />
            </Field>

            <Field label="Tone of Voice">
              <Select value={tone} onChange={setTone} options={TONES} />
            </Field>

            <Field label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Target Word Count</span><span style={{ color: GOLD, fontWeight: 700 }}>{wordCount.toLocaleString()} words</span></div>}>
              <input type="range" min={500} max={3000} step={100} value={wordCount} onChange={e => setWordCount(Number(e.target.value))} style={{ width: '100%', accentColor: GOLD }} />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#fff' }}>Deep SEO Structural Opt</span>
              <Toggle checked={deepSeo} onChange={setDeepSeo} />
            </div>

            {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}

            <button onClick={handleGenerate} disabled={loading} style={{
              padding: '14px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit','Inter',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1,
            }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Blog Post →</>}
            </button>
          </div>

          {/* ── RIGHT: Live Article Preview ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Live Article Preview</div>
              {result && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <SmallBtn icon={<Copy size={12} />} label="Copy HTML" onClick={handleCopyHtml} />
                  <SmallBtn icon={<Download size={12} />} label="Export PDF" onClick={handleExportPdf} />
                  <SmallBtn icon={<RefreshCw size={12} />} label="Regenerate" gold onClick={handleGenerate} />
                </div>
              )}
            </div>

            {!result ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: TEXT3, fontSize: 13, textAlign: 'center' }}>
                {loading ? 'Drafting your article…' : 'Fill in the parameters and generate to see a live preview here.'}
              </div>
            ) : (
              <div id="blog-print-area">
                <h1 style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>{result.headline}</h1>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>SEO Score: {seoScore}/100</span>
                  <span style={{ fontSize: 12, color: TEXT2 }}>Target: {keywords[0] ? `"${keywords[0]}" audience` : 'General audience'}</span>
                  <span style={{ fontSize: 12, color: TEXT3 }}>{result.readTime}</span>
                </div>
                <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />
                <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, marginBottom: 20 }}>{result.intro}</p>
                {(result.sections || []).map((s, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <h2 style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.h2}</h2>
                    <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
                  </div>
                ))}
                {result.conclusion && (
                  <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75 }}>{result.conclusion}</p>
                )}
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

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}>
      {options.map(o => <option key={o} value={o} style={{ background: '#1a1a24' }}>{o}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 100, cursor: 'pointer', padding: 2, boxSizing: 'border-box',
      background: checked ? GOLD : BORDER, transition: 'background 0.2s', display: 'flex', alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
    </div>
  )
}

function SmallBtn({ icon, label, onClick, gold }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
      background: gold ? GDIM : CARD2, border: `1px solid ${gold ? GBORD : BORDER}`, borderRadius: 6,
      color: gold ? GOLD : TEXT2, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif", whiteSpace: 'nowrap',
    }}>
      {icon} {label}
    </button>
  )
}
