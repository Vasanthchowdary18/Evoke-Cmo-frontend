import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  XCircle, Eye, FileText, Palette, Type, Mic2, MessageSquare,
  Layout, ClipboardList, ChevronRight, RefreshCw, Clock,
  Upload, Send, BookOpen, Zap, History,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems, getContentItems } from '../services/contentService'

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

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const BRAND_STANDARDS = [
  { key: 'color',    label: 'Brand Color Guidelines',  icon: <Palette size={18}/>,      desc: 'Primary, secondary & accent palette', color: '#c8973e' },
  { key: 'typo',     label: 'Typography Standards',    icon: <Type size={18}/>,          desc: 'Fonts, sizes & hierarchy rules',      color: '#6366f1' },
  { key: 'voice',    label: 'Brand Voice Guide',       icon: <Mic2 size={18}/>,          desc: 'Tone, language & personality',        color: '#10b981' },
  { key: 'message',  label: 'Messaging Guide',         icon: <MessageSquare size={18}/>, desc: 'Key messages & positioning',          color: '#3b82f6' },
  { key: 'visual',   label: 'Visual Identity',         icon: <Layout size={18}/>,        desc: 'Logo, imagery & layout rules',        color: '#ec4899' },
]

const CONTENT_TYPES = ['Social Post', 'Blog Article', 'Ad Creative', 'Email', 'Landing Page', 'Video Script', 'Banner', 'Product Description']

async function reviewContent(content, contentType, brand) {
  const prompt = `You are a brand governance specialist and conformance review engine.

Review this ${contentType} content for brand compliance:

Brand: ${brand || 'EvoX AI'}
Content: """${content}"""

Evaluate against all 5 brand standard categories and return ONLY valid JSON:
{
  "decision": "approved",
  "overallScore": 88,
  "summary": "One sentence executive summary of the review decision",
  "checks": {
    "color": { "pass": true, "score": 90, "note": "Brief note on color compliance" },
    "typography": { "pass": true, "score": 88, "note": "Brief note on typography" },
    "voice": { "pass": true, "score": 92, "note": "Brief note on voice/tone" },
    "messaging": { "pass": false, "score": 65, "note": "Issue found with messaging alignment" },
    "visual": { "pass": true, "score": 85, "note": "Brief note on visual compliance" }
  },
  "flaggedIssues": [
    { "severity": "warning", "item": "Issue description", "recommendation": "How to fix" }
  ],
  "approvedElements": ["Element 1 that passed", "Element 2", "Element 3"],
  "revisionRequests": [],
  "publishingQueue": ${Math.random() > 0.3 ? 'true' : 'false'},
  "humanReviewRequired": ${Math.random() > 0.6 ? 'false' : 'true'}
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0])
}

const AUDIT_MOCK = [
  { id: 'BG-0041', time: '2h ago',  type: 'Social Post',    status: 'approved',       score: 94, agent: 'Content Agent' },
  { id: 'BG-0040', time: '3h ago',  type: 'Ad Creative',    status: 'flagged',        score: 71, agent: 'Creative Agent' },
  { id: 'BG-0039', time: '5h ago',  type: 'Email',          status: 'approved',       score: 89, agent: 'Content Agent' },
  { id: 'BG-0038', time: '7h ago',  type: 'Banner',         status: 'rejected',       score: 42, agent: 'Creative Agent' },
  { id: 'BG-0037', time: '1d ago',  type: 'Blog Article',   status: 'approved',       score: 96, agent: 'Content Agent' },
  { id: 'BG-0036', time: '1d ago',  type: 'Landing Page',   status: 'human_review',   score: 67, agent: 'Publishing Agent' },
]

const statusStyle = (s) => {
  const map = {
    approved:     { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Approved' },
    flagged:      { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Flagged' },
    rejected:     { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected' },
    human_review: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Human Review' },
  }
  return map[s] || map.flagged
}

export default function BrandGovernancePage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [content, setContent]         = useState('')
  const [contentType, setContentType] = useState('Social Post')
  const [brand, setBrand]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState('')
  const [activeStd, setActiveStd]     = useState(null)
  const [auditLog, setAuditLog]       = useState(AUDIT_MOCK)
  const [savedDocId, setSavedDocId]   = useState(null)
  const [history, setHistory]         = useState([])

  const loadHistory = async () => {
    if (!user?.uid) return
    try {
      const items = await getContentItems(user.uid)
      setHistory(items.filter(i => i.campaignType === 'brand_governance').slice(0, 5))
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user?.uid])

  const handleReview = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSavedDocId(null)
    try {
      const r = await reviewContent(content, contentType, brand)
      setResult(r)
      const newEntry = {
        id: `BG-00${42 + auditLog.length}`,
        time: 'Just now',
        type: contentType,
        status: r.decision,
        score: r.overallScore,
        agent: 'Brand Governance Agent',
      }
      setAuditLog(prev => [newEntry, ...prev])
      try {
        const ids = await saveContentItems(
          user?.uid,
          { name: brand || contentType, type: 'brand_governance', source: 'campaign' },
          [{ key: 'output', type: 'strategy', platform: '', text: r.summary, data: JSON.stringify(r) }],
          'draft'
        )
        setSavedDocId(ids['output'] || null)
        loadHistory()
      } catch {}
    } catch {
      setError('Review failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const decisionColor = (d) => ({ approved: '#10b981', flagged: '#f59e0b', rejected: '#ef4444' }[d] || GOLD)
  const decisionIcon  = (d) => d === 'approved' ? <CheckCircle2 size={22}/> : d === 'rejected' ? <XCircle size={22}/> : <AlertCircle size={22}/>

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '100px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color={GOLD} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Brand Governance</h1>
              <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>Fig. 18 · Conformance review engine — approve, flag, or reject content</p>
            </div>
          </div>
        </div>

        {/* Brand Standards Database */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <BookOpen size={15} color={GOLD} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Brand Standards Database</h2>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT2 }}>5 governance pillars used in every conformance review</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {BRAND_STANDARDS.map(s => (
              <button key={s.key} onClick={() => setActiveStd(activeStd === s.key ? null : s.key)} style={{
                background: activeStd === s.key ? GDIM : CARD2,
                border: `1px solid ${activeStd === s.key ? GBORDER : BORDER}`,
                borderRadius: 12, padding: '14px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 3, lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>{s.desc}</div>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {activeStd && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 14, background: CARD2, borderRadius: 12, padding: 14, fontSize: 13, color: TEXT2, lineHeight: 1.7, overflow: 'hidden' }}>
                {activeStd === 'color'   && 'Primary: #c8973e Gold · Secondary: #0e0c09 Dark · Accent: #f0ebe0 Cream. Always maintain 4.5:1 contrast ratio. Never use pure white on gold backgrounds.'}
                {activeStd === 'typo'    && 'Headings: Inter 600, 24-32px · Body: Inter 400, 14-16px · Captions: Inter 500, 11-12px uppercase. Line height 1.6 for body, 1.2 for headings. No decorative fonts.'}
                {activeStd === 'voice'   && 'Tone: Authoritative yet approachable. Language: Clear, jargon-free, action-oriented. Personality: Smart, confident, forward-thinking. Avoid: superlatives, passive voice, filler words.'}
                {activeStd === 'message' && 'Core message: AI-powered marketing that outperforms. Pillars: Speed, Intelligence, Results. Always lead with outcome, not feature. CTAs must be specific (e.g. "Start your free trial" not "Learn more").'}
                {activeStd === 'visual'  && 'Logo: minimum 32px height, always on dark background. Imagery: high contrast, editorial style. No stock photo clichés. Spacing: 8px grid system. Rounded corners: 8-16px radius.'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conformance Review Engine */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Zap size={15} color={GOLD} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Conformance Review Engine</h2>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: TEXT2 }}>Paste content below — the AI agent reviews it against all 5 brand standards</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Brand name</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. EvoX AI" style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Content type</label>
              <select value={contentType} onChange={e => setContentType(e.target.value)} style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' }}>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Content to review *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your content here — caption, ad copy, email body, script, etc." rows={5}
              style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, padding: '12px 14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }} />
          </div>

          <button onClick={handleReview} disabled={loading || !content.trim()} style={{
            background: !content.trim() ? 'rgba(200,151,62,0.3)' : GOLD,
            color: '#0e0c09', border: 'none', borderRadius: 10, padding: '12px 32px',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Reviewing...</> : <><Shield size={16} /> Run Conformance Review</>}
          </button>

          {error && <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{error}</div>}
        </div>

        {/* Review Decision */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {savedDocId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, color: '#10b981' }}>
                  <CheckCircle2 size={14} color="#10b981" /> Saved to history
                </div>
              )}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>

                {/* Decision Banner */}
                <div style={{ background: `${decisionColor(result.decision)}18`, borderBottom: `1px solid ${decisionColor(result.decision)}30`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ color: decisionColor(result.decision) }}>{decisionIcon(result.decision)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: decisionColor(result.decision), textTransform: 'capitalize', marginBottom: 2 }}>{result.decision}</div>
                    <div style={{ fontSize: 13, color: TEXT2 }}>{result.summary}</div>
                  </div>
                  <div style={{ textAlign: 'center', background: `${decisionColor(result.decision)}20`, borderRadius: 10, padding: '8px 16px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: decisionColor(result.decision) }}>{result.overallScore}</div>
                    <div style={{ fontSize: 11, color: TEXT3 }}>Brand Score</div>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  {/* Per-pillar checks */}
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Pillar scores</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {BRAND_STANDARDS.map(s => {
                      const check = result.checks?.[s.key === 'typo' ? 'typography' : s.key]
                      if (!check) return null
                      return (
                        <div key={s.key} style={{ background: CARD2, borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ color: s.color }}>{s.icon}</div>
                            {check.pass ? <CheckCircle2 size={14} color="#10b981" /> : <AlertCircle size={14} color="#f59e0b" />}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{s.label.split(' ')[0]}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: check.pass ? '#10b981' : '#f59e0b' }}>{check.score}</div>
                          <div style={{ fontSize: 11, color: TEXT3, marginTop: 4, lineHeight: 1.4 }}>{check.note}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Flagged issues */}
                  {result.flaggedIssues?.length > 0 && (
                    <>
                      <h3 style={{ margin: '0 0 10px', fontSize: 13, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Flagged issues</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {result.flaggedIssues.map((f, i) => (
                          <div key={i} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>{f.item}</div>
                            <div style={{ fontSize: 12, color: TEXT2 }}>Fix: {f.recommendation}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Routing */}
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Review decision routing</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {result.publishingQueue && (
                      <button onClick={() => navigate('/queue')} style={{ flex: 1, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Publishing Queue</span>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>Content approved — send to scheduler</div>
                      </button>
                    )}
                    {result.humanReviewRequired && (
                      <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Eye size={16} color="#6366f1" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>Human Review</span>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>Flagged items need manual approval</div>
                      </div>
                    )}
                    {result.decision === 'rejected' && (
                      <button onClick={() => { setContent(''); setResult(null) }} style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <RefreshCw size={16} color="#ef4444" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Revision Request</span>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT2 }}>Return to agent for revision</div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Generations */}
        {history.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <History size={15} color={GOLD} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Generations</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(item => (
                <div key={item.id} style={{ background: CARD2, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${BORDER}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{item.campaignName || '—'}</div>
                    <div style={{ fontSize: 11, color: TEXT3 }}>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, borderRadius: 20, padding: '2px 10px', fontWeight: 500, background: item.status === 'published' ? 'rgba(16,185,129,0.12)' : GDIM, color: item.status === 'published' ? '#10b981' : GOLD, border: `1px solid ${item.status === 'published' ? 'rgba(16,185,129,0.25)' : GBORDER}` }}>{item.status}</span>
                  <button onClick={() => { try { setResult(JSON.parse(item.data)) } catch {} }} style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: GOLD, cursor: 'pointer', fontWeight: 500 }}>Load</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={15} color={GOLD} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Audit Log</h2>
            <span style={{ fontSize: 11, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 20, padding: '2px 8px', color: GOLD, marginLeft: 'auto' }}>{auditLog.length} entries</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditLog.map((entry, i) => {
              const st = statusStyle(entry.status)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: CARD2, borderRadius: 10, padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT3, minWidth: 56 }}>{entry.id}</span>
                  <span style={{ fontSize: 12, background: st.bg, color: st.color, borderRadius: 20, padding: '2px 10px', fontWeight: 500, minWidth: 90, textAlign: 'center' }}>{st.label}</span>
                  <span style={{ fontSize: 13, color: TEXT, flex: 1 }}>{entry.type}</span>
                  <span style={{ fontSize: 12, color: TEXT3 }}>{entry.agent}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444', minWidth: 32, textAlign: 'right' }}>{entry.score}</span>
                  <span style={{ fontSize: 11, color: TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{entry.time}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
