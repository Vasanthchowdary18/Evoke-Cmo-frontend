import React, { useState, useEffect } from 'react'
import { Plus, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import ToolTopBar from '../components/ToolTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

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
const RED    = '#ef4444'
const CAMPAIGN_TYPES = [
  { key: 'newsletter',  label: 'Newsletter' },
  { key: 'promotional', label: 'Promotional' },
  { key: 'drip',        label: 'Drip' },
]

const AUDIENCE_SEGMENTS = [
  'All Subscribers', 'VIP / High-Value', 'New Subscribers',
  'Cart Abandoners', 'Dormant Contacts', 'Trial Users',
]

async function groqGenerate(prompt) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateEmailVariant({ campaignType, subjectPrompt, audience, tokens, brandName, variantLabel }) {
  const prompt = `You are an expert email marketer. Write a ${campaignType} email.

Brand: ${brandName || 'Our Company'}
Subject line theme: ${subjectPrompt}
Audience segment: ${audience}
Available personalization tokens: ${tokens.join(', ') || '{{first_name}}'}
${variantLabel === 'B' ? 'This is Variant B for an A/B test — take a genuinely different angle, hook, or subject line style than a typical first draft.' : 'This is Variant A — a strong, on-brand first draft.'}

Use at least one personalization token naturally in the greeting or body.

Return ONLY valid JSON (no markdown):
{
  "subject": "Subject line, under 60 characters",
  "greeting": "Opening line, using a personalization token",
  "body": "2-3 short paragraphs of email body copy",
  "ctaText": "Call-to-action button text"
}`

  const raw = await groqGenerate(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

const SPAM_WORDS = ['free', 'buy now', 'click here', 'limited time', 'act now', 'guarantee', 'no cost', 'risk-free', '100% free', 'winner', 'cash']

// Real, deterministic score from the actual generated copy — not a fabricated
// percentage. Each factor is a genuine deliverability/spam-trigger signal.
function scoreDeliverability(variant, tokens) {
  if (!variant) return { score: 0, reasons: [] }
  let score = 100
  const reasons = []
  const subject = (variant.subject || '')
  const fullText = `${variant.subject} ${variant.greeting} ${variant.body} ${variant.ctaText}`.toLowerCase()

  const hitWords = SPAM_WORDS.filter(w => fullText.includes(w))
  if (hitWords.length > 0) { score -= hitWords.length * 12; reasons.push(`Contains spam-trigger phrase${hitWords.length > 1 ? 's' : ''}: ${hitWords.join(', ')}`) }

  const exclaims = (fullText.match(/!/g) || []).length
  if (exclaims > 2) { score -= 10; reasons.push('Excessive exclamation marks') }

  const capsWords = subject.split(' ').filter(w => w.length > 2 && w === w.toUpperCase())
  if (capsWords.length > 0) { score -= 10; reasons.push('ALL-CAPS words in subject line') }

  if (subject.length > 60) { score -= 10; reasons.push('Subject line over 60 characters') }
  if (subject.length < 10) { score -= 5; reasons.push('Subject line very short') }

  const usesToken = tokens.some(t => fullText.includes(t.toLowerCase().split(' ')[0].replace(/[{}]/g, '')))
  if (!usesToken) { score -= 8; reasons.push('No personalization token detected in copy') }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

export default function EmailComposerPage() {
  const { user } = useAuth()
  const [brandKb, setBrandKb] = useState(null)

  const [campaignType, setCampaignType] = useState('newsletter')
  const [subjectPrompt, setSubjectPrompt] = useState('')
  const [audience, setAudience]     = useState(AUDIENCE_SEGMENTS[0])
  const [tokens, setTokens]         = useState(['{{first_name}}'])
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [variants, setVariants]     = useState(null) // { A, B }
  const [activeVariant, setActiveVariant] = useState('A')

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => { if (data) setBrandKb(data) }).catch(() => {})
  }, [user?.uid])

  const brandName = brandKb?.brandName || brandKb?.companyName

  const addToken = () => {
    const v = tokenInput.trim()
    if (v && !tokens.includes(v)) setTokens(t => [...t, v])
    setTokenInput('')
  }
  const removeToken = (t) => setTokens(ts => ts.filter(x => x !== t))

  const handleGenerate = async () => {
    if (!subjectPrompt.trim()) { setError('Enter a subject line prompt first.'); return }
    setError('')
    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        generateEmailVariant({ campaignType, subjectPrompt, audience, tokens, brandName, variantLabel: 'A' }),
        generateEmailVariant({ campaignType, subjectPrompt, audience, tokens, brandName, variantLabel: 'B' }),
      ])
      setVariants({ A: a, B: b })
      setActiveVariant('A')
    } catch (e) {
      setError(e.message || 'Generation failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const current = variants?.[activeVariant]
  const { score, reasons } = scoreDeliverability(current, tokens)
  const passed = score >= 70

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <ToolTopBar
          title="Email Composer"
          subtitle="Automated transactional and retention drip workflows with spam analysis."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Email Parameters ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Email Parameters</div>

            <Field label="Campaign Type">
              <div style={{ display: 'flex', gap: 8 }}>
                {CAMPAIGN_TYPES.map(c => {
                  const active = campaignType === c.key
                  return (
                    <button key={c.key} onClick={() => setCampaignType(c.key)} style={{
                      flex: 1, padding: '8px 10px', background: active ? GDIM : 'transparent',
                      border: `1px solid ${active ? GBORD : BORDER}`, borderRadius: 6,
                      color: active ? GOLD : TEXT2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif",
                    }}>
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Subject Line Prompt">
              <input value={subjectPrompt} onChange={e => setSubjectPrompt(e.target.value)} placeholder="e.g. Unveiling our exclusive winter collection" style={inputStyle} />
            </Field>

            <Field label="Audience Segment">
              <Select value={audience} onChange={setAudience} options={AUDIENCE_SEGMENTS} />
            </Field>

            <Field label="Personalization Tokens">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tokens.length ? 8 : 0 }}>
                {tokens.map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 100, fontSize: 11, color: TEXT2 }}>
                    {t} <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeToken(t)} />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToken() } }}
                  placeholder="{{last_name}} - Custom token"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addToken} style={{ width: 36, flexShrink: 0, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} />
                </button>
              </div>
            </Field>

            {error && <div style={{ fontSize: 12, color: RED }}>{error}</div>}

            <button onClick={handleGenerate} disabled={loading} style={{
              padding: '14px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit','Inter',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1,
            }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Email Body →</>}
            </button>
          </div>

          {/* ── RIGHT: Newsletter Variant Mockup ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {CAMPAIGN_TYPES.find(c => c.key === campaignType)?.label} Variant Mockup
              </div>
              {variants && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['A', 'B'].map(v => (
                    <button key={v} onClick={() => setActiveVariant(v)} style={{
                      padding: '6px 12px', background: activeVariant === v ? GDIM : 'transparent',
                      border: `1px solid ${activeVariant === v ? GBORD : BORDER}`, borderRadius: 6,
                      color: activeVariant === v ? GOLD : TEXT2, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif",
                    }}>
                      A/B Variant {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!current ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: TEXT3, fontSize: 13, textAlign: 'center' }}>
                {loading ? 'Drafting both variants…' : 'Fill in the parameters and generate to preview both A/B variants here.'}
              </div>
            ) : (
              <>
                <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>
                    <div>Subject: {current.subject}</div>
                    <div>From: {brandName || 'Your Brand'} {brandKb?.email ? `<${brandKb.email}>` : ''}</div>
                  </div>
                  <div style={{ height: 1, background: BORDER }} />
                  <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff' }}>{current.greeting}</div>
                  <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{current.body}</p>
                  <button style={{ alignSelf: 'flex-start', padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif" }}>
                    {current.ctaText}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: passed ? GREEN : RED }} />
                    <span style={{ fontSize: 12, color: TEXT2 }}>Deliverability Score: <strong style={{ color: passed ? GREEN : RED }}>{score}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: passed ? GREEN : RED }}>
                    {passed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {passed ? 'Spam Check Passed' : 'Spam Check Flagged'}
                  </div>
                </div>
                {!passed && reasons.length > 0 && (
                  <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.6 }}>{reasons.join(' · ')}</div>
                )}
              </>
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
