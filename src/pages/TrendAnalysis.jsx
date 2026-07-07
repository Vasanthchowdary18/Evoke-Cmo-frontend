import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Zap, Search, ArrowLeft, RefreshCw,
  Hash, Globe, Instagram, Linkedin, Target, Rocket,
  ChevronRight, Copy, Check, Loader2, Sparkles,
  BarChart2, Users, Calendar, BookOpen, ArrowUpRight,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const CARD2  = '#211e14'
const BORDER = 'rgba(255,255,255,0.07)'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.13)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.32)'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const INDUSTRIES = [
  'Marketing & Advertising', 'Technology & SaaS', 'E-commerce & Retail',
  'Food & Beverage', 'Health & Wellness', 'Finance & Fintech',
  'Education & EdTech', 'Real Estate', 'Fashion & Lifestyle', 'Events & Entertainment',
]

const PLATFORMS_LIST = [
  { key: 'instagram', label: 'Instagram', color: '#e1306c' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
  { key: 'tiktok',   label: 'TikTok',    color: '#ff0050' },
  { key: 'twitter',  label: 'X/Twitter', color: '#e2e8f0' },
  { key: 'youtube',  label: 'YouTube',   color: '#ff0000' },
]

async function fetchTrends(industry, platforms, region) {
  const prompt = `You are a real-time social media trend analyst for ${industry}.

Generate a comprehensive trend report for ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} covering ${platforms.join(', ')} in ${region || 'India / Global'}.

Return ONLY valid JSON in this exact structure:
{
  "summary": "2-sentence executive summary of the current trend landscape",
  "topTrends": [
    { "title": "Trend name", "description": "Why this is trending now", "score": 94, "platforms": ["instagram","linkedin"], "category": "content" },
    { "title": "...", "description": "...", "score": 88, "platforms": ["tiktok"], "category": "format" },
    { "title": "...", "description": "...", "score": 82, "platforms": ["linkedin"], "category": "topic" },
    { "title": "...", "description": "...", "score": 79, "platforms": ["instagram","tiktok"], "category": "format" },
    { "title": "...", "description": "...", "score": 74, "platforms": ["twitter"], "category": "topic" }
  ],
  "hashtags": {
    "instagram": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"],
    "linkedin":  ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6"],
    "tiktok":    ["#tag1","#tag2","#tag3","#tag4","#tag5"],
    "twitter":   ["#tag1","#tag2","#tag3","#tag4","#tag5"]
  },
  "contentIdeas": [
    { "title": "Content idea title", "format": "Reel", "platform": "Instagram", "hook": "Opening hook line", "why": "Why this will perform" },
    { "title": "...", "format": "Carousel", "platform": "LinkedIn", "hook": "...", "why": "..." },
    { "title": "...", "format": "Short Video", "platform": "TikTok", "hook": "...", "why": "..." },
    { "title": "...", "format": "Thread", "platform": "X/Twitter", "hook": "...", "why": "..." },
    { "title": "...", "format": "Reel", "platform": "Instagram", "hook": "...", "why": "..." },
    { "title": "...", "format": "Article", "platform": "LinkedIn", "hook": "...", "why": "..." }
  ],
  "audienceInsights": [
    "Key insight about current audience behaviour",
    "What audiences in this industry are engaging with most",
    "Timing insight — best posting windows",
    "Content format preference insight"
  ],
  "competitorMoves": [
    { "move": "Competitor tactic description", "opportunity": "How to counter or capitalise" },
    { "move": "...", "opportunity": "..." },
    { "move": "...", "opportunity": "..." }
  ]
}`

  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    }
  )
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const d = await res.json()
  const raw = d?.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
}

function ScoreBar({ score, color = GOLD }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: BORDER, borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color, minWidth: 28, textAlign: 'right' }}>{score}</span>
    </div>
  )
}

const CATEGORY_COLORS = {
  content: '#10b981', format: '#6366f1', topic: '#f59e0b', strategy: '#ec4899',
}

export default function TrendAnalysis() {
  useRequireAuth()
  const navigate = useNavigate()

  const [industry, setIndustry]   = useState('Marketing & Advertising')
  const [selPlatforms, setSelPlat] = useState(['instagram', 'linkedin', 'tiktok'])
  const [region, setRegion]       = useState('India')
  const [loading, setLoading]     = useState(false)
  const [data, setData]           = useState(null)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(null)
  const [activeTab, setActiveTab] = useState('trends')

  function togglePlatform(key) {
    setSelPlatforms(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])
  }

  async function runAnalysis() {
    if (selPlatforms.length === 0) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const result = await fetchTrends(industry, selPlatforms, region)
      setData(result)
      setActiveTab('trends')
    } catch (e) {
      setError('Failed to fetch trends. Check your Gemini API key or try again.')
    }
    setLoading(false)
  }

  async function copyText(text, key) {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const tabs = ['trends', 'hashtags', 'ideas', 'audience', 'competitors']

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate('/agents-hub')} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.07em', marginBottom: 4 }}>
              <TrendingUp size={10} /> TREND ANALYSIS
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', margin: 0 }}>Real-Time Trend Intelligence</h1>
            <p style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>AI-powered trend analysis — hashtags, content ideas & competitor moves</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>INDUSTRY</label>
              <select
                value={industry} onChange={e => setIndustry(e.target.value)}
                style={{ width: '100%', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px', color: TEXT, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>REGION</label>
              <select
                value={region} onChange={e => setRegion(e.target.value)}
                style={{ width: '100%', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px', color: TEXT, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {['India', 'Global', 'USA', 'UK', 'Southeast Asia', 'Middle East', 'Australia'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={runAnalysis}
                disabled={loading || selPlatforms.length === 0}
                style={{
                  width: '100%', padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: loading ? GDIM : `linear-gradient(135deg, ${GOLD}, #a87030)`,
                  border: 'none', borderRadius: 10, color: loading ? GOLD : '#0e0c09',
                  fontSize: 13, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: selPlatforms.length === 0 ? 0.4 : 1,
                }}
              >
                {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</> : <><Sparkles size={13} /> Analyse</>}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>PLATFORMS</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PLATFORMS_LIST.map(p => (
                <button
                  key={p.key} onClick={() => togglePlatform(p.key)}
                  style={{
                    padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${selPlatforms.includes(p.key) ? p.color + '80' : BORDER}`,
                    background: selPlatforms.includes(p.key) ? p.color + '15' : 'transparent',
                    color: selPlatforms.includes(p.key) ? p.color : TEXT3,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={36} style={{ color: GOLD, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ color: TEXT2, fontSize: 14 }}>Analysing trends for <strong style={{ color: TEXT }}>{industry}</strong> in <strong style={{ color: TEXT }}>{region}</strong>…</p>
            <p style={{ color: TEXT3, fontSize: 12, marginTop: 6 }}>Scanning social signals, hashtags & competitor activity</p>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Summary */}
            <div style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Sparkles size={16} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.65, margin: 0 }}>{data.summary}</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
              {tabs.map(t => (
                <button
                  key={t} onClick={() => setActiveTab(t)}
                  style={{
                    padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700,
                    color: activeTab === t ? GOLD : TEXT3,
                    borderBottom: `2px solid ${activeTab === t ? GOLD : 'transparent'}`,
                    marginBottom: -1, textTransform: 'capitalize', transition: 'all 0.15s',
                  }}
                >
                  {t === 'trends' ? 'Top Trends' : t === 'hashtags' ? 'Hashtags' : t === 'ideas' ? 'Content Ideas' : t === 'audience' ? 'Audience' : 'Competitors'}
                </button>
              ))}
            </div>

            {/* TOP TRENDS */}
            {activeTab === 'trends' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.topTrends || []).map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? GOLD : TEXT3, minWidth: 28, marginTop: 2 }}>#{i+1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{t.title}</span>
                          {t.category && (
                            <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: (CATEGORY_COLORS[t.category] || GOLD) + '18', color: CATEGORY_COLORS[t.category] || GOLD, border: `1px solid ${(CATEGORY_COLORS[t.category] || GOLD)}30` }}>
                              {t.category.toUpperCase()}
                            </span>
                          )}
                          {(t.platforms || []).map(p => {
                            const pm = PLATFORMS_LIST.find(x => x.key === p)
                            return pm ? (
                              <span key={p} style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: pm.color + '15', color: pm.color, border: `1px solid ${pm.color}30` }}>{pm.label}</span>
                            ) : null
                          })}
                        </div>
                        <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, margin: '0 0 10px' }}>{t.description}</p>
                        <ScoreBar score={t.score} color={i === 0 ? GOLD : '#6366f1'} />
                      </div>
                      <button
                        onClick={() => navigate(`/campaign/content_calendar`)}
                        style={{ padding: '7px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 9, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                      >
                        Create →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* HASHTAGS */}
            {activeTab === 'hashtags' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {Object.entries(data.hashtags || {}).filter(([p]) => selPlatforms.includes(p)).map(([platform, tags]) => {
                  const pm = PLATFORMS_LIST.find(x => x.key === platform)
                  if (!pm) return null
                  return (
                    <motion.div key={platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: pm.color }}>{pm.label}</span>
                        <button
                          onClick={() => copyText((tags || []).join(' '), `hash-${platform}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, color: TEXT3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {copied === `hash-${platform}` ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy All</>}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(tags || []).map((tag, i) => (
                          <span key={i} onClick={() => copyText(tag, `tag-${i}-${platform}`)} style={{ padding: '4px 10px', background: pm.color + '12', border: `1px solid ${pm.color}25`, borderRadius: 100, fontSize: 12, fontWeight: 600, color: pm.color, cursor: 'pointer' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* CONTENT IDEAS */}
            {activeTab === 'ideas' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {(data.contentIdeas || []).map((idea, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130' }}>{idea.format}</span>
                      <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: '#10b98115', color: '#10b981', border: '1px solid #10b98130' }}>{idea.platform}</span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: TEXT, margin: '0 0 8px', lineHeight: 1.4 }}>{idea.title}</h3>
                    <p style={{ fontSize: 12, color: GOLD, fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.5 }}>"{idea.hook}"</p>
                    <p style={{ fontSize: 12, color: TEXT2, margin: '0 0 14px', lineHeight: 1.5 }}>{idea.why}</p>
                    <button
                      onClick={() => navigate('/campaign/content_calendar')}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: GOLD, background: 'none', border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Use This Idea <ChevronRight size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* AUDIENCE INSIGHTS */}
            {activeTab === 'audience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.audienceInsights || []).map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={13} style={{ color: GOLD }} />
                    </div>
                    <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.65, margin: 0 }}>{ins}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* COMPETITORS */}
            {activeTab === 'competitors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.competitorMoves || []).map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.07em', marginBottom: 6 }}>COMPETITOR MOVE</div>
                        <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{c.move}</p>
                      </div>
                      <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.07em', marginBottom: 6 }}>YOUR OPPORTUNITY</div>
                        <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{c.opportunity}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16 }}>
            <TrendingUp size={44} style={{ color: TEXT3, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Select your industry and platforms</h3>
            <p style={{ fontSize: 14, color: TEXT2, maxWidth: 420, margin: '0 auto 20px' }}>Get AI-powered trend reports, trending hashtags, content ideas, and competitor intelligence — updated in real time.</p>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Top Trends', 'Trending Hashtags', 'Content Ideas', 'Audience Insights', 'Competitor Moves'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />{f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1c1a13; color: #f0ebe0; }
      `}</style>
    </div>
  )
}
