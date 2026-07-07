import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, ArrowLeft, Loader2, Sparkles, Copy, Check,
  RefreshCw, ChevronRight, Download, Zap, Users,
  Clock, BarChart2, Send, Target, MessageSquare,
  TrendingUp, AlertCircle, CheckCircle2, Eye, MousePointer,
  UserMinus, ShoppingCart,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems } from '../services/contentService'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const CARD2   = '#211e14'
const BORDER  = 'rgba(255,255,255,0.07)'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const ACCENT  = '#a855f7'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const EMAIL_TYPES = [
  { key: 'broadcast',      label: 'Broadcast',       icon: <Send size={18}/>,         desc: 'One-time send to full list',   color: '#c8973e' },
  { key: 'welcome',        label: 'Welcome Sequence', icon: <Sparkles size={18}/>,     desc: 'Onboard new subscribers',      color: '#10b981' },
  { key: 'nurture',        label: 'Nurture',          icon: <TrendingUp size={18}/>,   desc: 'Move leads down the funnel',   color: '#3b82f6' },
  { key: 'reengage',       label: 'Re-Engage',        icon: <RefreshCw size={18}/>,    desc: 'Win back dormant contacts',    color: '#f59e0b' },
  { key: 'post_purchase',  label: 'Post-Purchase',    icon: <ShoppingCart size={18}/>, desc: 'Follow up after a sale',       color: '#a855f7' },
  { key: 'abandon',        label: 'Abandon',          icon: <AlertCircle size={18}/>,  desc: 'Recover abandoned carts',      color: '#ef4444' },
]

const TONES = ['Professional', 'Friendly', 'Urgent', 'Inspirational', 'Conversational', 'Bold']
const AUDIENCE_SEGMENTS = [
  'All Subscribers', 'New Leads', 'Hot Prospects', 'Existing Customers',
  'Dormant Contacts', 'VIP / High-Value', 'Trial Users', 'Event Attendees',
]

async function generateEmailPackage(inputs) {
  const prompt = `You are a world-class email marketing strategist.

Create a complete email marketing package for:
- Brand: ${inputs.brand}
- Email Type: ${inputs.emailType}
- Audience Segment: ${inputs.audience}
- Campaign Objective: ${inputs.objective}
- Tone: ${inputs.tone}
- Product/Offer: ${inputs.offer}

Return ONLY valid JSON (no markdown, no explanation):
{
  "campaignName": "Campaign name",
  "subjectLines": [
    { "line": "Subject line 1", "preheader": "Preheader text 1", "score": 92 },
    { "line": "Subject line 2", "preheader": "Preheader text 2", "score": 88 },
    { "line": "Subject line 3", "preheader": "Preheader text 3", "score": 85 }
  ],
  "emailBody": {
    "greeting": "Opening greeting line",
    "intro": "2-3 sentence intro paragraph",
    "mainContent": "Main email body — 3-4 paragraphs with value, story, proof",
    "cta": "Primary call-to-action button text",
    "ctaUrl": "example.com/offer",
    "ps": "P.S. line to boost clicks"
  },
  "abTestIdea": {
    "variantA": "Subject line A idea",
    "variantB": "Subject line B idea",
    "hypothesis": "What you are testing and why"
  },
  "predictedMetrics": {
    "openRate": "28-34%",
    "clickRate": "4-7%",
    "conversionRate": "1.8-3.2%",
    "unsubscribeRate": "0.2%"
  },
  "sendTimeRecommendation": "Best send time with reason",
  "sequenceIdea": "Brief 3-email sequence suggestion for this type"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

export default function EmailMarketingPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep]           = useState('type')  // type | brief | result
  const [emailType, setEmailType] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)
  const [copied, setCopied]       = useState('')
  const [savedOk, setSavedOk]     = useState(false)

  const [form, setForm] = useState({
    brand: '', objective: '', offer: '', audience: 'All Subscribers', tone: 'Professional',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.brand || !form.objective) { setError('Fill in Brand and Objective to continue.'); return }
    setError(''); setLoading(true)
    try {
      const res = await generateEmailPackage({ ...form, emailType: emailType?.label })
      setResult(res)
      setStep('result')

      if (user?.uid) {
        await saveContentItems([{
          userId: user.uid,
          campaignId: `email_${Date.now()}`,
          campaignName: res.campaignName || 'Email Campaign',
          campaignType: 'email_marketing',
          type: 'email',
          platform: 'email',
          subject: res.subjectLines?.[0]?.line || '',
          text: res.emailBody?.mainContent || '',
          data: JSON.stringify(res),
          status: 'draft',
          source: 'email-marketing',
        }])
      }
    } catch (e) {
      setError('Generation failed. Check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: '#0e0c09', border: `1px solid ${BORDER}`,
    borderRadius: 10, padding: '11px 14px',
    color: TEXT, fontSize: 14, fontFamily: "'Inter',sans-serif",
    outline: 'none', transition: 'border 0.15s',
  }

  const labelStyle = { fontSize: 12, fontWeight: 600, color: TEXT2, letterSpacing: '0.06em', display: 'block', marginBottom: 7 }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <button onClick={() => step === 'result' ? setStep('brief') : navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={15} /> {step === 'result' ? 'Edit Brief' : 'Back'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} color={ACCENT} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', marginBottom: 2 }}>EMAIL MARKETING AGENT</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>Email Marketing Agent</h1>
            </div>
          </div>
          <p style={{ fontSize: 14, color: TEXT2, margin: 0, maxWidth: 560, lineHeight: 1.65 }}>
            Generate full email campaigns — subject lines, body copy, CTA, send time, and performance predictions.
          </p>
        </motion.div>

        {/* ── Step indicator ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[['type','1','Email Type'],['brief','2','Campaign Brief'],['result','3','Generated Email']].map(([s, n, label]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: step === s ? ACCENT : ['type','brief','result'].indexOf(step) > ['type','brief','result'].indexOf(s) ? `${ACCENT}30` : 'rgba(255,255,255,0.06)',
                color: step === s ? '#fff' : ['type','brief','result'].indexOf(step) > ['type','brief','result'].indexOf(s) ? ACCENT : TEXT3,
                border: `1px solid ${step === s ? ACCENT : 'transparent'}`,
              }}>{n}</div>
              <span style={{ fontSize: 12, color: step === s ? TEXT : TEXT3, fontWeight: step === s ? 600 : 400 }}>{label}</span>
              {n !== '3' && <ChevronRight size={12} color={TEXT3} style={{ marginLeft: 2 }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Email Type ── */}
          {step === 'type' && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 28px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Select Email Type</div>
                <p style={{ fontSize: 13, color: TEXT2, marginBottom: 24, lineHeight: 1.6 }}>What kind of email campaign do you want to create?</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                  {EMAIL_TYPES.map(et => (
                    <motion.button key={et.key} whileHover={{ y: -2 }}
                      onClick={() => { setEmailType(et); setStep('brief') }}
                      style={{
                        background: emailType?.key === et.key ? `${et.color}15` : '#0e0c09',
                        border: `1.5px solid ${emailType?.key === et.key ? et.color : BORDER}`,
                        borderRadius: 12, padding: '16px 18px',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${et.color}15`, border: `1px solid ${et.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: et.color, flexShrink: 0 }}>
                        {et.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{et.label}</div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>{et.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Brief ── */}
          {step === 'brief' && (
            <motion.div key="brief" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Selected type badge */}
              {emailType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 16px', background: `${emailType.color}10`, border: `1px solid ${emailType.color}30`, borderRadius: 10 }}>
                  <div style={{ color: emailType.color }}>{emailType.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: emailType.color }}>{emailType.label}</span>
                  <button onClick={() => setStep('type')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', fontSize: 12 }}>Change</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* Brand */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>BRAND / COMPANY NAME *</label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. EVOX AI" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>

                {/* Objective */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>CAMPAIGN OBJECTIVE *</label>
                  <input value={form.objective} onChange={e => set('objective', e.target.value)} placeholder="e.g. Drive signups for our new AI tool launch" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>

                {/* Offer */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>PRODUCT / OFFER</label>
                  <input value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. 30-day free trial, 20% off, free consultation" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>

                {/* Audience */}
                <div>
                  <label style={labelStyle}>AUDIENCE SEGMENT</label>
                  <select value={form.audience} onChange={e => set('audience', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER}>
                    {AUDIENCE_SEGMENTS.map(a => <option key={a} value={a} style={{ background: CARD }}>{a}</option>)}
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label style={labelStyle}>TONE</label>
                  <select value={form.tone} onChange={e => set('tone', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER}>
                    {TONES.map(t => <option key={t} value={t} style={{ background: CARD }}>{t}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
                  <AlertCircle size={14} color="#ef4444" />
                  <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleGenerate} disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(168,85,247,0.3)' : `linear-gradient(135deg, #a855f7, #7c3aed)`,
                  color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Email Campaign…</> : <><Sparkles size={16} /> Generate Email Campaign</>}
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 3: Result ── */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* Campaign name banner */}
              <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 14, padding: '16px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', marginBottom: 3 }}>CAMPAIGN READY</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{result.campaignName}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setStep('brief'); setResult(null) }}
                    style={{ padding: '8px 14px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer' }}>
                    <RefreshCw size={12} style={{ marginRight: 5 }} />Regenerate
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Subject Lines */}
                <div style={{ gridColumn: '1/-1', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <MessageSquare size={14} color={ACCENT} /> Subject Lines
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.subjectLines?.map((s, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: i === 0 ? `${ACCENT}0d` : '#0e0c09', border: `1px solid ${i === 0 ? `${ACCENT}35` : BORDER}`, borderRadius: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: ACCENT, color: '#fff', padding: '2px 7px', borderRadius: 100 }}>BEST</span>}
                            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{s.line}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: s.score >= 90 ? '#10b981' : s.score >= 80 ? GOLD : TEXT2 }}>{s.score}%</span>
                            <button onClick={() => copyText(s.line, `subj_${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, padding: 4 }}>
                              {copied === `subj_${i}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT3 }}>Preview: {s.preheader}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Body */}
                <div style={{ gridColumn: '1/-1', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Mail size={14} color={GOLD} /> Email Body</div>
                    <button onClick={() => copyText(`${result.emailBody?.greeting}\n\n${result.emailBody?.intro}\n\n${result.emailBody?.mainContent}\n\n${result.emailBody?.cta}\n\n${result.emailBody?.ps}`, 'body')}
                      style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: TEXT2, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {copied === 'body' ? <Check size={11} color="#10b981" /> : <Copy size={11} />} Copy All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'GREETING', value: result.emailBody?.greeting, color: TEXT2 },
                      { label: 'INTRO', value: result.emailBody?.intro, color: TEXT },
                      { label: 'MAIN CONTENT', value: result.emailBody?.mainContent, color: TEXT },
                      { label: 'P.S.', value: result.emailBody?.ps, color: TEXT2 },
                    ].map(({ label, value, color }) => value && (
                      <div key={label} style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
                        <div style={{ fontSize: 13, color, lineHeight: 1.7 }}>{value}</div>
                      </div>
                    ))}
                    {/* CTA Button */}
                    <div style={{ textAlign: 'center', paddingTop: 4 }}>
                      <div style={{ display: 'inline-block', padding: '12px 28px', background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700 }}>
                        {result.emailBody?.cta}
                      </div>
                    </div>
                  </div>
                </div>

                {/* A/B Test Idea */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Target size={14} color="#f59e0b" /> A/B Test Suggestion
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: '10px 12px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>VARIANT A</div>
                      <div style={{ fontSize: 12, color: TEXT }}>{result.abTestIdea?.variantA}</div>
                    </div>
                    <div style={{ flex: 1, padding: '10px 12px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, marginBottom: 4 }}>VARIANT B</div>
                      <div style={{ fontSize: 12, color: TEXT }}>{result.abTestIdea?.variantB}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT2, fontStyle: 'italic' }}>{result.abTestIdea?.hypothesis}</div>
                </div>

                {/* Predicted Metrics */}
                <div style={{ gridColumn: '1/-1', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 22px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <BarChart2 size={14} color={GOLD} /> Predicted Performance Metrics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {[
                      { label: 'Open Rate', value: result.predictedMetrics?.openRate, icon: <Eye size={14}/>, color: '#10b981' },
                      { label: 'Click Rate', value: result.predictedMetrics?.clickRate, icon: <MousePointer size={14}/>, color: '#3b82f6' },
                      { label: 'Conversion Rate', value: result.predictedMetrics?.conversionRate, icon: <CheckCircle2 size={14}/>, color: GOLD },
                      { label: 'Unsubscribe Rate', value: result.predictedMetrics?.unsubscribeRate, icon: <UserMinus size={14}/>, color: '#ef4444' },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '14px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ color: m.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{m.icon}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color, marginBottom: 3 }}>{m.value}</div>
                        <div style={{ fontSize: 11, color: TEXT3 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send Time + Sequence */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Clock size={14} color={ACCENT} /> Best Send Time
                  </div>
                  <div style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>{result.sendTimeRecommendation}</div>
                </div>

                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Zap size={14} color={GOLD} /> Sequence Idea
                  </div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.65 }}>{result.sequenceIdea}</div>
                </div>

              </div>

              {savedOk && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7, color: '#10b981', fontSize: 13 }}>
                  <CheckCircle2 size={14} /> Saved to Approval Queue
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
