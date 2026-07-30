import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Sparkles, AlertCircle, Shield, Copy, Check,
  RefreshCw, ScrollText, Cookie, AlertTriangle,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems } from '../services/contentService'

const BG     = '#0a0907'
const CARD   = '#131109'
const CARD2  = '#181510'
const GOLD   = '#c8973e'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = 'rgba(255,255,255,0.06)'
const RED    = '#ef4444'
const AMBER  = '#f59e0b'

const JURISDICTIONS = ['Global / General', 'United States', 'European Union (GDPR)', 'California (CCPA)', 'United Kingdom (UK GDPR)']

async function generateCompliancePack(inputs) {
  const prompt = `You are a compliance drafting assistant helping a small business create a FIRST DRAFT of standard legal pages. This is not legal advice and will be reviewed by a licensed attorney before use — write clear, standard, reasonable boilerplate for:
- Company: ${inputs.company}
- Website/domain: ${inputs.website}
- Data collected: ${inputs.dataCollected}
- Primary jurisdiction: ${inputs.jurisdiction}

Return ONLY valid JSON:
{
  "privacyPolicy": "Full privacy policy draft, 300-500 words, plain paragraphs separated by \\n\\n",
  "termsOfService": "Full terms of service draft, 300-500 words, plain paragraphs separated by \\n\\n",
  "cookiePolicy": "Short cookie policy snippet, 100-150 words",
  "gdprChecklist": ["checklist item 1", "checklist item 2", "checklist item 3", "checklist item 4", "checklist item 5"]
}`

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

export default function CompliancePage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm]       = useState({ company: '', website: '', dataCollected: '', jurisdiction: 'Global / General' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState('')
  const [tab, setTab]         = useState('privacy')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.company.trim() || !form.dataCollected.trim()) { setError('Fill in Company and Data Collected to continue.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await generateCompliancePack(form)
      setResult(res)
      setTab('privacy')
      if (user?.uid) {
        await saveContentItems([{
          userId: user.uid,
          campaignId: `compliance_${Date.now()}`,
          campaignName: `Compliance Pack — ${form.company}`,
          campaignType: 'ai_compliance',
          type: 'compliance',
          platform: 'internal',
          text: res.privacyPolicy || '',
          data: JSON.stringify(res),
          status: 'draft',
          source: 'compliance-agent',
        }])
      }
    } catch (e) {
      setError('Generation failed. Check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) })
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 13px', color: TEXT, fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT2, letterSpacing: '0.04em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }

  const tabBtn = (key, label) => (
    <button onClick={() => setTab(key)} style={{
      padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
      background: tab === key ? GOLD : 'transparent', color: tab === key ? '#0a0907' : TEXT2,
    }}>{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 28px 80px' }}>

          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, marginBottom: 18, padding: 0 }}>
            <ArrowLeft size={13}/> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${GOLD}18`, border: `1px solid ${GBORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
              <Shield size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Compliance Agent</h1>
              <p style={{ margin: 0, fontSize: 12.5, color: TEXT2 }}>Draft privacy policy, terms of service & GDPR checklist</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', marginBottom: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, fontSize: 12.5, color: TEXT2 }}>
            <AlertTriangle size={14} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong style={{ color: AMBER }}>Not legal advice.</strong> This generates a first-draft starting point only. Have a licensed attorney review before publishing or relying on these documents.</span>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Company / Brand *</label>
                <input style={inputStyle} placeholder="e.g. EVOX AI" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Website / Domain</label>
                <input style={inputStyle} placeholder="e.g. evokemedia.io" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Primary Jurisdiction</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.jurisdiction} onChange={e => set('jurisdiction', e.target.value)}>
                  {JURISDICTIONS.map(j => <option key={j} value={j} style={{ background: CARD }}>{j}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Data You Collect *</label>
                <input style={inputStyle} placeholder="e.g. name, email, browsing behavior, payment info" value={form.dataCollected} onChange={e => set('dataCollected', e.target.value)} />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 14 }}>
                <AlertCircle size={13} color={RED} />
                <span style={{ fontSize: 12.5, color: TEXT2 }}>{error}</span>
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? `${GOLD}55` : GOLD, color: '#0a0907', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit' }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating Compliance Pack…</> : <><Sparkles size={14} /> Generate Compliance Pack</>}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {tabBtn('privacy', 'Privacy Policy')}
                  {tabBtn('terms', 'Terms of Service')}
                  {tabBtn('cookie', 'Cookie Policy')}
                  {tabBtn('gdpr', 'GDPR Checklist')}
                </div>

                {tab !== 'gdpr' && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <button onClick={() => copyText(tab === 'privacy' ? result.privacyPolicy : tab === 'terms' ? result.termsOfService : result.cookiePolicy, tab)}
                        style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: TEXT2, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {copied === tab ? <Check size={11} color="#10b981" /> : <Copy size={11} />} Copy
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {tab === 'privacy' ? result.privacyPolicy : tab === 'terms' ? result.termsOfService : result.cookiePolicy}
                    </div>
                  </div>
                )}

                {tab === 'gdpr' && (
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 12 }}>GDPR Readiness Checklist</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.gdprChecklist?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
                          <ScrollText size={13} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setResult(null)} style={{ marginTop: 14, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
