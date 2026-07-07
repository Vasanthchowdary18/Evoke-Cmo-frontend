import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ArrowLeft, Loader2, Sparkles, Copy, Check,
  RefreshCw, ChevronRight, Globe, Target, BarChart2,
  FileText, AlertCircle, CheckCircle2, TrendingUp,
  MapPin, Zap, Link2, FileCode, Users, Eye,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems } from '../services/contentService'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const BORDER  = 'rgba(255,255,255,0.07)'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const ACCENT  = '#3b82f6'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const SEO_MODULES = [
  { key: 'keyword',    label: 'Keyword Research',    icon: <Search size={16}/>,    color: '#3b82f6', desc: 'Find high-intent keywords' },
  { key: 'technical',  label: 'Tech SEO Audit',      icon: <FileCode size={16}/>,     color: '#f59e0b', desc: 'Fix site-level issues' },
  { key: 'competitor', label: 'Competitor Analysis',  icon: <Target size={16}/>,    color: '#ef4444', desc: 'Gaps & opportunities' },
  { key: 'local',      label: 'Local SEO',           icon: <MapPin size={16}/>,    color: '#10b981', desc: 'Dominate local search' },
]

const INDUSTRIES = [
  'Technology & SaaS', 'E-commerce & Retail', 'Health & Wellness', 'Finance & Fintech',
  'Real Estate', 'Education', 'Food & Beverage', 'Professional Services',
  'Marketing & Advertising', 'Events & Entertainment',
]

const CONTENT_GOALS = [
  'Drive organic traffic', 'Generate leads', 'Increase brand awareness',
  'Rank for product keywords', 'Target local customers', 'Outrank competitors',
]

const LOCATIONS = [
  'Global (No specific location)',
  // United States
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Austin, TX', 'Dallas, TX', 'San Francisco, CA', 'Seattle, WA',
  'Miami, FL', 'Atlanta, GA', 'Boston, MA', 'Denver, CO',
  'Phoenix, AZ', 'Las Vegas, NV', 'Nashville, TN', 'Portland, OR',
  // United Kingdom
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK',
  // Australia
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia',
  // Canada
  'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada',
  // UAE & Middle East
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Riyadh, Saudi Arabia', 'Doha, Qatar',
  // India
  'Mumbai, India', 'Bengaluru, India', 'Delhi, India', 'Hyderabad, India',
  // Europe
  'Berlin, Germany', 'Paris, France', 'Amsterdam, Netherlands', 'Madrid, Spain',
  // Asia Pacific
  'Singapore', 'Hong Kong', 'Tokyo, Japan',
  // Africa
  'Johannesburg, South Africa', 'Lagos, Nigeria', 'Nairobi, Kenya',
]

async function generateSeoPackage(inputs) {
  const prompt = `You are a world-class SEO strategist with 15 years of experience.

Generate a complete SEO strategy package for:
- Business/Brand: ${inputs.brand}
- Website: ${inputs.website || 'Not provided'}
- Industry: ${inputs.industry}
- Target Keyword / Topic: ${inputs.keyword}
- Content Goal: ${inputs.goal}
- Location (if local SEO): ${inputs.location || 'Global'}

Return ONLY valid JSON (no markdown):
{
  "overview": "2-sentence SEO opportunity summary",
  "keywordResearch": {
    "primaryKeyword": { "term": "main keyword", "volume": "5K/mo", "difficulty": "Medium", "intent": "Commercial" },
    "secondaryKeywords": [
      { "term": "keyword", "volume": "1.2K/mo", "difficulty": "Low", "intent": "Informational" },
      { "term": "keyword", "volume": "800/mo", "difficulty": "Low", "intent": "Navigational" },
      { "term": "keyword", "volume": "600/mo", "difficulty": "Medium", "intent": "Transactional" },
      { "term": "keyword", "volume": "400/mo", "difficulty": "Low", "intent": "Informational" }
    ],
    "longTailKeywords": ["long tail 1", "long tail 2", "long tail 3", "long tail 4", "long tail 5"],
    "lsiKeywords": ["LSI term 1", "LSI term 2", "LSI term 3", "LSI term 4"]
  },
  "technicalAudit": {
    "score": 72,
    "issues": [
      { "issue": "Missing meta descriptions on 12 pages", "priority": "High", "fix": "Add unique 150-160 char meta descriptions" },
      { "issue": "Page speed > 3s on mobile", "priority": "High", "fix": "Compress images, enable lazy load, use CDN" },
      { "issue": "No structured data / schema markup", "priority": "Medium", "fix": "Add FAQ, Article, and LocalBusiness schema" },
      { "issue": "Thin content on product pages", "priority": "Medium", "fix": "Add 300+ words of unique copy per product" },
      { "issue": "Missing alt text on images", "priority": "Low", "fix": "Add descriptive alt text to all images" }
    ]
  },
  "competitorAnalysis": {
    "topCompetitors": ["Competitor A", "Competitor B", "Competitor C"],
    "gaps": [
      "Competitor A ranks for 45 keywords you don't target",
      "No competitor has optimised for voice search queries",
      "Weak content around comparison pages — opportunity exists"
    ],
    "opportunities": [
      "Target informational keywords competitors ignore",
      "Create in-depth comparison landing pages",
      "Build authority through guest posting on industry blogs"
    ],
    "backlinksNeeded": "15-25 quality backlinks from DA 40+ domains"
  },
  "localSeo": {
    "googleBusinessTips": ["Optimise GMB with photos and weekly posts", "Collect 10+ 5-star reviews this month", "Add service area pages to website"],
    "localKeywords": ["${inputs.keyword} near me", "${inputs.keyword} in ${inputs.location || 'your city'}", "best ${inputs.keyword} ${inputs.location || 'local'}"],
    "citationSites": ["Google Business Profile", "Yelp", "Bing Places", "Apple Maps", "TripAdvisor"]
  },
  "contentBrief": {
    "recommendedTitle": "SEO-optimised article title",
    "metaTitle": "Meta title under 60 chars",
    "metaDescription": "Meta description 150-160 chars with primary keyword",
    "h1": "H1 heading",
    "h2Sections": ["Section 1 heading", "Section 2 heading", "Section 3 heading", "Section 4 heading", "FAQ Section"],
    "wordCount": "1,800-2,200",
    "internalLinks": 3,
    "externalLinks": 2,
    "schema": "Article + FAQ"
  },
  "onPageOptimisation": {
    "titleTag": "Optimised title tag example",
    "metaDescription": "Optimised meta description example",
    "urlSlug": "recommended-url-slug",
    "imageAlt": "Recommended alt text pattern",
    "schemaMarkup": "{ \"@type\": \"Article\", \"name\": \"title\" }"
  },
  "rankingProjection": {
    "month1": "Position 18-30 for primary keyword",
    "month3": "Position 8-15 for primary keyword",
    "month6": "Position 3-8 for primary keyword",
    "estimatedTraffic": "800-2,400 monthly organic visitors by month 6"
  }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
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

export default function SeoAgentPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null)
  const [activeTab, setActiveTab] = useState('keyword')
  const [copied, setCopied]     = useState('')

  const [form, setForm] = useState({
    brand: '', website: '', keyword: '', industry: 'Technology & SaaS',
    goal: 'Drive organic traffic', location: 'Global (No specific location)',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.brand || !form.keyword) { setError('Fill in Brand and Target Keyword to continue.'); return }
    setError(''); setLoading(true)
    try {
      const res = await generateSeoPackage(form)
      setResult(res)
      if (user?.uid) {
        await saveContentItems([{
          userId: user.uid,
          campaignId: `seo_${Date.now()}`,
          campaignName: `SEO — ${form.keyword}`,
          campaignType: 'seo_agent',
          type: 'seo',
          platform: '',
          subject: res.contentBrief?.metaTitle || '',
          text: res.contentBrief?.metaDescription || '',
          data: JSON.stringify(res),
          status: 'draft',
          source: 'seo-agent',
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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: '#0e0c09', border: `1px solid ${BORDER}`,
    borderRadius: 10, padding: '11px 14px',
    color: TEXT, fontSize: 14, fontFamily: "'Inter',sans-serif",
    outline: 'none', transition: 'border 0.15s',
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: TEXT2, letterSpacing: '0.06em', display: 'block', marginBottom: 7 }

  const priorityColor = p => p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#10b981'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <button onClick={() => result ? setResult(null) : navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={15} /> {result ? 'Edit Brief' : 'Back'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={20} color={ACCENT} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', marginBottom: 2 }}>SEO AGENT</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>SEO Agent</h1>
            </div>
          </div>
          <p style={{ fontSize: 14, color: TEXT2, margin: 0, maxWidth: 560, lineHeight: 1.65 }}>
            Keyword research, tech audit, competitor analysis, content brief, on-page optimisation, and ranking projections — all in one AI run.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── INPUT FORM ── */}
          {!result && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              {/* Module overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
                {SEO_MODULES.map(m => (
                  <div key={m.key} style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <div style={{ color: m.color }}>{m.icon}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT3 }}>{m.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 20 }}>Business / Content Objective</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>BRAND / BUSINESS NAME *</label>
                    <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. EVOX AI" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>WEBSITE URL</label>
                    <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. evoxai.com" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>TARGET KEYWORD / TOPIC *</label>
                    <input value={form.keyword} onChange={e => set('keyword', e.target.value)} placeholder="e.g. AI marketing tools" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <label style={labelStyle}>LOCATION (for Local SEO)</label>
                    <select value={form.location} onChange={e => set('location', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {LOCATIONS.map((l, i) => <option key={i} value={l} style={{ background: CARD }}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>INDUSTRY</label>
                    <select value={form.industry} onChange={e => set('industry', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {INDUSTRIES.map(i => <option key={i} value={i} style={{ background: CARD }}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>CONTENT GOAL</label>
                    <select value={form.goal} onChange={e => set('goal', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = BORDER}>
                      {CONTENT_GOALS.map(g => <option key={g} value={g} style={{ background: CARD }}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
                    <AlertCircle size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate} disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? `${ACCENT}50` : `linear-gradient(135deg, #3b82f6, #1d4ed8)`,
                    color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running 4 SEO Modules…</>
                    : <><Sparkles size={16} /> Run SEO Agent</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* Overview banner */}
              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 14, padding: '16px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', marginBottom: 4 }}>SEO ANALYSIS COMPLETE</div>
                  <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{result.overview}</div>
                </div>
                <button onClick={() => setResult(null)} style={{ padding: '8px 14px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> Re-run
                </button>
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  ...SEO_MODULES,
                  { key: 'brief',    label: 'Content Brief',      icon: <FileText size={16}/>,   color: GOLD },
                  { key: 'onpage',   label: 'On-Page',            icon: <Globe size={16}/>,      color: '#a855f7' },
                  { key: 'ranking',  label: 'Ranking Projection', icon: <TrendingUp size={16}/>, color: '#10b981' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: `1px solid ${activeTab === tab.key ? tab.color : BORDER}`,
                      background: activeTab === tab.key ? `${tab.color}15` : 'transparent',
                      color: activeTab === tab.key ? tab.color : TEXT2,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
                    }}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* KEYWORD RESEARCH */}
                {activeTab === 'keyword' && (
                  <motion.div key="keyword" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}><Search size={14} color={ACCENT} /> Primary Keyword</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                        {[
                          { label: 'Keyword', value: result.keywordResearch?.primaryKeyword?.term },
                          { label: 'Volume', value: result.keywordResearch?.primaryKeyword?.volume },
                          { label: 'Difficulty', value: result.keywordResearch?.primaryKeyword?.difficulty },
                          { label: 'Intent', value: result.keywordResearch?.primaryKeyword?.intent },
                        ].map(item => (
                          <div key={item.label} style={{ padding: '12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14 }}>Secondary Keywords</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.keywordResearch?.secondaryKeywords?.map((kw, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                            <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{kw.term}</span>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <span style={{ fontSize: 12, color: TEXT2 }}>{kw.volume}</span>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: kw.difficulty === 'Low' ? 'rgba(16,185,129,0.12)' : kw.difficulty === 'Medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: kw.difficulty === 'Low' ? '#10b981' : kw.difficulty === 'Medium' ? '#f59e0b' : '#ef4444' }}>{kw.difficulty}</span>
                              <span style={{ fontSize: 11, color: TEXT3 }}>{kw.intent}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Long-Tail Keywords</div>
                        {result.keywordResearch?.longTailKeywords?.map((k, i) => (
                          <div key={i} style={{ fontSize: 13, color: TEXT2, marginBottom: 7, display: 'flex', gap: 7 }}>
                            <span style={{ color: ACCENT }}>→</span>{k}
                          </div>
                        ))}
                      </div>
                      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>LSI / Related Terms</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {result.keywordResearch?.lsiKeywords?.map((k, i) => (
                            <span key={i} style={{ fontSize: 12, padding: '5px 10px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 6, color: ACCENT }}>{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TECH SEO AUDIT */}
                {activeTab === 'technical' && (
                  <motion.div key="technical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: 7 }}><FileCode size={14} color="#f59e0b" /> Technical SEO Score</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: result.technicalAudit?.score >= 80 ? '#10b981' : result.technicalAudit?.score >= 60 ? '#f59e0b' : '#ef4444' }}>{result.technicalAudit?.score}<span style={{ fontSize: 14, color: TEXT3 }}>/100</span></div>
                      </div>
                      <div style={{ height: 6, background: BORDER, borderRadius: 100, overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ height: '100%', width: `${result.technicalAudit?.score}%`, background: result.technicalAudit?.score >= 80 ? '#10b981' : result.technicalAudit?.score >= 60 ? '#f59e0b' : '#ef4444', borderRadius: 100, transition: 'width 0.8s' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {result.technicalAudit?.issues?.map((issue, i) => (
                          <div key={i} style={{ padding: '14px 16px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{issue.issue}</span>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: `${priorityColor(issue.priority)}15`, color: priorityColor(issue.priority), fontWeight: 700, flexShrink: 0 }}>{issue.priority}</span>
                            </div>
                            <div style={{ fontSize: 12, color: TEXT3 }}>Fix: {issue.fix}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* COMPETITOR ANALYSIS */}
                {activeTab === 'competitor' && (
                  <motion.div key="competitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><Users size={14} color="#ef4444" /> Top Competitors</div>
                        {result.competitorAnalysis?.topCompetitors?.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{i + 1}</div>
                            <span style={{ fontSize: 13, color: TEXT }}>{c}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 14, padding: '10px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 3 }}>BACKLINKS NEEDED</div>
                          <div style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>{result.competitorAnalysis?.backlinksNeeded}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Content Gaps</div>
                          {result.competitorAnalysis?.gaps?.map((g, i) => (
                            <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 7, display: 'flex', gap: 7 }}><span style={{ color: '#ef4444', flexShrink: 0 }}>!</span>{g}</div>
                          ))}
                        </div>
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Opportunities</div>
                          {result.competitorAnalysis?.opportunities?.map((o, i) => (
                            <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 7, display: 'flex', gap: 7 }}><span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>{o}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LOCAL SEO */}
                {activeTab === 'local' && (
                  <motion.div key="local" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><MapPin size={14} color="#10b981" /> Google Business Tips</div>
                        {result.localSeo?.googleBusinessTips?.map((t, i) => (
                          <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 8, display: 'flex', gap: 7 }}><CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />{t}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Local Keywords</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {result.localSeo?.localKeywords?.map((k, i) => (
                              <div key={i} style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, color: '#10b981' }}>{k}</div>
                            ))}
                          </div>
                        </div>
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Citation Sites</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {result.localSeo?.citationSites?.map((s, i) => (
                              <span key={i} style={{ fontSize: 11, padding: '4px 10px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT2 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CONTENT BRIEF */}
                {activeTab === 'brief' && (
                  <motion.div key="brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: 7 }}><FileText size={14} color={GOLD} /> Content Brief</div>
                        <button onClick={() => copyText(JSON.stringify(result.contentBrief, null, 2), 'brief')}
                          style={{ padding: '5px 12px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT2, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {copied === 'brief' ? <Check size={11} color="#10b981" /> : <Copy size={11} />} Copy Brief
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { label: 'RECOMMENDED TITLE', value: result.contentBrief?.recommendedTitle },
                          { label: 'META TITLE', value: result.contentBrief?.metaTitle },
                          { label: 'META DESCRIPTION', value: result.contentBrief?.metaDescription },
                          { label: 'H1 HEADING', value: result.contentBrief?.h1 },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ padding: '12px 14px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
                            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{value}</div>
                          </div>
                        ))}
                        <div style={{ padding: '12px 14px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', marginBottom: 8 }}>H2 SECTIONS</div>
                          {result.contentBrief?.h2Sections?.map((h, i) => (
                            <div key={i} style={{ fontSize: 13, color: TEXT2, marginBottom: 5, display: 'flex', gap: 8 }}>
                              <span style={{ color: GOLD, fontWeight: 700 }}>H2</span>{h}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                          {[
                            { label: 'Word Count', value: result.contentBrief?.wordCount },
                            { label: 'Internal Links', value: result.contentBrief?.internalLinks },
                            { label: 'Schema Type', value: result.contentBrief?.schema },
                          ].map(m => (
                            <div key={m.label} style={{ padding: '10px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: TEXT3, marginBottom: 3 }}>{m.label}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ON-PAGE */}
                {activeTab === 'onpage' && (
                  <motion.div key="onpage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}><Globe size={14} color="#a855f7" /> On-Page Optimisation</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { label: 'TITLE TAG', value: result.onPageOptimisation?.titleTag, copy: 'title' },
                          { label: 'META DESCRIPTION', value: result.onPageOptimisation?.metaDescription, copy: 'meta' },
                          { label: 'URL SLUG', value: result.onPageOptimisation?.urlSlug, copy: 'url' },
                          { label: 'IMAGE ALT TEXT PATTERN', value: result.onPageOptimisation?.imageAlt, copy: 'alt' },
                          { label: 'SCHEMA MARKUP', value: result.onPageOptimisation?.schemaMarkup, copy: 'schema' },
                        ].map(({ label, value, copy }) => (
                          <div key={label} style={{ padding: '12px 14px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em' }}>{label}</span>
                              <button onClick={() => copyText(value, copy)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, padding: 2 }}>
                                {copied === copy ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <div style={{ fontSize: 13, color: TEXT, fontFamily: label === 'SCHEMA MARKUP' ? 'monospace' : 'inherit', lineHeight: 1.6, wordBreak: 'break-all' }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* RANKING PROJECTION */}
                {activeTab === 'ranking' && (
                  <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 7 }}><TrendingUp size={14} color="#10b981" /> Ranking Monitor — Projection</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'Month 1', value: result.rankingProjection?.month1, color: '#ef4444' },
                          { label: 'Month 3', value: result.rankingProjection?.month3, color: '#f59e0b' },
                          { label: 'Month 6', value: result.rankingProjection?.month6, color: '#10b981' },
                        ].map(m => (
                          <div key={m.label} style={{ padding: '16px', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: TEXT3, marginBottom: 8 }}>{m.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: m.color, lineHeight: 1.5 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '16px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: TEXT3, marginBottom: 6 }}>ESTIMATED ORGANIC TRAFFIC</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{result.rankingProjection?.estimatedTraffic}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
