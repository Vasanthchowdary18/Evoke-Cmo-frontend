import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenLine, ArrowLeft, Loader2, Copy, Check, AlertCircle,
  RefreshCw, Sparkles, Tag, Megaphone, Star, Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
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
const GROQ   = import.meta.env.VITE_GROQ_API_KEY || ''

const COPY_TYPES = [
  { key: 'ad_copy',        label: 'Ad Copy',           icon: <Megaphone size={16} />, color: '#6366f1', desc: 'Paid ad headlines + body copy' },
  { key: 'taglines',       label: 'Taglines',          icon: <Tag size={16} />,       color: '#10b981', desc: 'Brand slogans & tagline variants' },
  { key: 'brand_voice',    label: 'Brand Voice Copy',  icon: <Star size={16} />,      color: '#f59e0b', desc: 'On-brand messaging & boilerplate' },
  { key: 'product_names',  label: 'Product Names',     icon: <Sparkles size={16} />,  color: '#ec4899', desc: 'Creative name generation' },
  { key: 'value_prop',     label: 'Value Proposition', icon: <Zap size={16} />,       color: '#3b82f6', desc: 'Core value statement & pitch' },
]

const PLATFORMS_AD = ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok Ads', 'Display Ads']
const TONES = ['Bold', 'Professional', 'Playful', 'Inspirational', 'Conversational', 'Provocative', 'Minimalist']
const TARGET_AUDIENCES = ['Marketing Managers', 'CMOs & Marketing Leaders', 'Small Business Owners', 'Startup Founders', 'E-Commerce Brands', 'B2B Decision Makers', 'Sales Professionals', 'Product Managers', 'Entrepreneurs', 'Enterprise Teams', 'Agency Clients', 'General Consumers']

async function groqGenerate(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 2000,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateCopy({ type, product, brand, audience, tone, platform, goal, keywords }) {
  const prompts = {
    ad_copy: `You are an expert paid advertising copywriter. Create high-converting ad copy for ${platform || 'digital ads'}.

Product/Service: ${product}
Brand: ${brand || 'Our Brand'}
Target Audience: ${audience || 'potential customers'}
Ad Goal: ${goal || 'drive conversions'}
Tone: ${tone || 'Bold'}
Keywords to include: ${keywords || 'none specified'}

Return ONLY valid JSON:
{
  "variations": [
    {
      "headline1": "Headline 1 (30 chars max)",
      "headline2": "Headline 2 (30 chars max)",
      "headline3": "Headline 3 (30 chars max)",
      "description": "Ad description (90 chars max)",
      "cta": "CTA text"
    },
    {
      "headline1": "...",
      "headline2": "...",
      "headline3": "...",
      "description": "...",
      "cta": "..."
    },
    {
      "headline1": "...",
      "headline2": "...",
      "headline3": "...",
      "description": "...",
      "cta": "..."
    }
  ],
  "longformAd": {
    "hook": "Scroll-stopping first line (10 words max)",
    "body": "2-3 sentences that build desire and handle objections",
    "cta": "Strong CTA line"
  }
}`,

    taglines: `You are a brand strategist and creative director. Generate memorable taglines.

Product/Service: ${product}
Brand: ${brand || 'Our Brand'}
Target Audience: ${audience || 'general consumers'}
Tone/Personality: ${tone || 'Bold'}
Core Benefit: ${goal || 'the main value'}

Return ONLY valid JSON:
{
  "primary": {
    "tagline": "Main recommended tagline (under 8 words)",
    "rationale": "Why this tagline works"
  },
  "alternatives": [
    { "tagline": "Alternative 1", "style": "Emotional/Rational/Witty/etc" },
    { "tagline": "Alternative 2", "style": "..." },
    { "tagline": "Alternative 3", "style": "..." },
    { "tagline": "Alternative 4", "style": "..." },
    { "tagline": "Alternative 5", "style": "..." }
  ],
  "campaignSlogans": [
    { "campaign": "Launch campaign theme", "slogan": "Campaign-specific slogan" },
    { "campaign": "Growth campaign theme", "slogan": "Campaign-specific slogan" }
  ]
}`,

    brand_voice: `You are a brand voice specialist. Create on-brand copy examples and guidelines.

Product/Service: ${product}
Brand: ${brand || 'Our Brand'}
Audience: ${audience || 'target customers'}
Voice Personality: ${tone || 'Professional'}
Brand Goal: ${goal || 'build trust and drive action'}

Return ONLY valid JSON:
{
  "voiceStatement": "One-sentence brand voice definition",
  "doList": ["Do: Write like this...", "Do: Always say...", "Do: Sound like..."],
  "dontList": ["Don't: Avoid this...", "Don't: Never say...", "Don't: Not our style..."],
  "copyExamples": [
    { "context": "Homepage hero", "copy": "Example copy for this context" },
    { "context": "Social media bio", "copy": "Example copy for this context" },
    { "context": "Email subject line", "copy": "Example copy for this context" },
    { "context": "Ad headline", "copy": "Example copy for this context" },
    { "context": "Product description", "copy": "Example copy for this context" }
  ],
  "boilerplate": "Standard 1-2 sentence brand description for press releases and bios"
}`,

    product_names: `You are a brand naming specialist with expertise in memorable, marketable product names.

Product Category: ${product}
Brand: ${brand || 'Our Brand'}
Target Audience: ${audience || 'consumers'}
Name Style: ${tone || 'Modern/Bold'}
Key Association: ${goal || 'innovation and quality'}
Keywords to consider: ${keywords || 'none'}

Return ONLY valid JSON:
{
  "topPick": {
    "name": "Best recommended name",
    "pronunciation": "How to say it",
    "meaning": "Why this name works",
    "domain": "Likely .com availability (check separately)"
  },
  "nameList": [
    { "name": "Name 1", "style": "Invented/Descriptive/Metaphorical/etc", "rationale": "Brief reason" },
    { "name": "Name 2", "style": "...", "rationale": "..." },
    { "name": "Name 3", "style": "...", "rationale": "..." },
    { "name": "Name 4", "style": "...", "rationale": "..." },
    { "name": "Name 5", "style": "...", "rationale": "..." },
    { "name": "Name 6", "style": "...", "rationale": "..." },
    { "name": "Name 7", "style": "...", "rationale": "..." }
  ],
  "namingGuidelines": "Brief guidance on what makes a name work for this brand"
}`,

    value_prop: `You are a positioning strategist. Create a compelling value proposition framework.

Product/Service: ${product}
Brand: ${brand || 'Our Brand'}
Target Audience: ${audience || 'potential customers'}
Tone: ${tone || 'Professional'}
Primary Benefit: ${goal || 'the main value'}
Keywords: ${keywords || 'none'}

Return ONLY valid JSON:
{
  "coreStatement": "Single sentence core value proposition (under 20 words)",
  "elevator pitch": "30-second pitch (3-4 sentences)",
  "oneLiner": "Twitter-length pitch (under 140 chars)",
  "framework": {
    "who": "Ideal customer description",
    "problem": "Pain point being solved",
    "solution": "How the product solves it",
    "differentiator": "What makes it unique vs alternatives",
    "proof": "Evidence or social proof element"
  },
  "headlines": [
    "Homepage headline option 1",
    "Homepage headline option 2",
    "Homepage headline option 3"
  ],
  "objectionHandlers": [
    { "objection": "Common objection", "response": "How to address it in copy" },
    { "objection": "Common objection", "response": "How to address it in copy" }
  ]
}`
  }

  const raw = await groqGenerate(prompts[type])
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: TEXT2,
      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
    }}>
      {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function AdCopyResult({ result, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(result.variations || []).map((v, i) => (
        <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Variation {i + 1}</span>
            <CopyBtn text={`H1: ${v.headline1}\nH2: ${v.headline2}\nH3: ${v.headline3}\n\n${v.description}\n\nCTA: ${v.cta}`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {[v.headline1, v.headline2, v.headline3].map((h, hi) => (
              <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: TEXT3, minWidth: 20 }}>H{hi + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{h}</span>
              </div>
            ))}
          </div>
          <div style={{ background: BG, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{v.description}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, padding: '4px 12px', borderRadius: 20 }}>{v.cta}</span>
        </div>
      ))}
      {result.longformAd && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Long-form / Social Ad</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{result.longformAd.hook}</div>
          <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, margin: '0 0 10px' }}>{result.longformAd.body}</p>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{result.longformAd.cta}</div>
        </div>
      )}
    </div>
  )
}

function TaglineResult({ result, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {result.primary && (
        <div style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recommended Tagline</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 10, letterSpacing: '-0.02em' }}>"{result.primary.tagline}"</div>
          <div style={{ fontSize: 13, color: TEXT2, marginBottom: 14 }}>{result.primary.rationale}</div>
          <CopyBtn text={result.primary.tagline} />
        </div>
      )}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Alternative Taglines</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(result.alternatives || []).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: BG, borderRadius: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, flex: 1 }}>"{a.tagline}"</span>
              <span style={{ fontSize: 10, color: TEXT3, background: CARD, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{a.style}</span>
              <CopyBtn text={a.tagline} />
            </div>
          ))}
        </div>
      </div>
      {result.campaignSlogans?.length > 0 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Campaign Slogans</div>
          {result.campaignSlogans.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>{s.campaign}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>"{s.slogan}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BrandVoiceResult({ result, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Voice Statement</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, lineHeight: 1.6 }}>{result.voiceStatement}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 10 }}>DO ✓</div>
          {(result.doList || []).map((d, i) => <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 6, lineHeight: 1.5 }}>{d}</div>)}
        </div>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 10 }}>DON'T ✗</div>
          {(result.dontList || []).map((d, i) => <div key={i} style={{ fontSize: 12, color: TEXT2, marginBottom: 6, lineHeight: 1.5 }}>{d}</div>)}
        </div>
      </div>
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Copy Examples by Context</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(result.copyExamples || []).map((ex, i) => (
            <div key={i} style={{ background: BG, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color, fontWeight: 700, marginBottom: 6 }}>{ex.context}</div>
              <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 8 }}>{ex.copy}</div>
              <CopyBtn text={ex.copy} />
            </div>
          ))}
        </div>
      </div>
      {result.boilerplate && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Boilerplate</span>
            <CopyBtn text={result.boilerplate} />
          </div>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, margin: 0 }}>{result.boilerplate}</p>
        </div>
      )}
    </div>
  )
}

function ProductNamesResult({ result, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {result.topPick && (
        <div style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Top Pick</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: TEXT, marginBottom: 6, letterSpacing: '-0.03em' }}>{result.topPick.name}</div>
          <div style={{ fontSize: 12, color: TEXT3, marginBottom: 6 }}>/{result.topPick.pronunciation}/</div>
          <div style={{ fontSize: 13, color: TEXT2, marginBottom: 14 }}>{result.topPick.meaning}</div>
          <CopyBtn text={result.topPick.name} />
        </div>
      )}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Name Candidates</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(result.nameList || []).map((n, i) => (
            <div key={i} style={{ background: BG, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{n.name}</div>
              <div style={{ fontSize: 11, color: color, marginBottom: 6, fontWeight: 600 }}>{n.style}</div>
              <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.4 }}>{n.rationale}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ValuePropResult({ result, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Core Value Proposition</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: TEXT, lineHeight: 1.4, marginBottom: 10 }}>{result.coreStatement}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <CopyBtn text={result.coreStatement} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>One-Liner</div>
          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 8 }}>{result.oneLiner}</div>
          <CopyBtn text={result.oneLiner} />
        </div>
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Elevator Pitch</div>
          <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 8 }}>{result['elevator pitch']}</div>
          <CopyBtn text={result['elevator pitch']} />
        </div>
      </div>
      {result.framework && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Positioning Framework</div>
          {Object.entries(result.framework).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 100, textTransform: 'capitalize' }}>{k}</span>
              <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      {result.headlines?.length > 0 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Homepage Headlines</div>
          {result.headlines.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: BG, borderRadius: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{h}</span>
              <CopyBtn text={h} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CopywritingAgentPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState('ad_copy')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [product, setProduct]   = useState('')
  const [brand, setBrand]       = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone]         = useState('Bold')
  const [goal, setGoal]         = useState('')
  const [keywords, setKeywords] = useState('')
  const [platform, setPlatform] = useState('Meta Ads')

  const currentType = COPY_TYPES.find(t => t.key === selectedType)

  const handleGenerate = async () => {
    if (!product.trim()) { setError('Please describe your product or service.'); return }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const r = await generateCopy({ type: selectedType, product, brand, audience, tone, platform, goal, keywords })
      setResult(r)
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: CARD2, border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '96px 20px 60px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenLine size={22} color={GOLD} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Copywriting Agent</h1>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT2 }}>AI-powered copy — ads, taglines, brand voice, product names & value propositions</p>
          </div>
        </div>

        {/* Copy type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
          {COPY_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => { setSelectedType(t.key); setResult(null); setError('') }}
              style={{
                padding: '12px 10px', borderRadius: 12, border: `1.5px solid`,
                borderColor: selectedType === t.key ? t.color : BORDER,
                background: selectedType === t.key ? `${t.color}12` : CARD,
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              <div style={{ color: selectedType === t.key ? t.color : TEXT3, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: selectedType === t.key ? TEXT : TEXT2, marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: TEXT3, lineHeight: 1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '340px 1fr' : '440px 1fr', gap: 20 }}>
          {/* Form */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, alignSelf: 'start' }}>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Product / Service <span style={{ color: '#10b981' }}>*</span></label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} placeholder="Describe your product or service in detail — what it does, key features, target use case..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Brand Name</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="EvoX AI" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select target audience...</option>
                {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {selectedType === 'ad_copy' ? 'Ad Goal' : selectedType === 'value_prop' ? 'Primary Benefit' : selectedType === 'taglines' ? 'Core Benefit' : 'Brand Goal'}
              </label>
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder={
                selectedType === 'ad_copy' ? 'e.g. drive free trial signups' :
                selectedType === 'taglines' ? 'e.g. saves time, boosts revenue' :
                'e.g. build authority and trust'
              } style={inputStyle} />
            </div>

            {selectedType === 'ad_copy' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Ad Platform</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PLATFORMS_AD.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {(selectedType === 'ad_copy' || selectedType === 'product_names' || selectedType === 'value_prop') && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Keywords</label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. fast, AI, results, guaranteed" style={inputStyle} />
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 12, border: `1px solid ${currentType.color}40`,
              background: loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${currentType.color}, ${currentType.color}cc)`,
              color: loading ? TEXT3 : '#fff', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <>{currentType.icon} Generate {currentType.label}</>
              )}
            </button>

            {result && !loading && (
              <button onClick={handleGenerate} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
          </div>

          {/* Result panel */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 14 }}>
                  Generated {currentType.label}
                </div>
                {selectedType === 'ad_copy'       && <AdCopyResult       result={result} color={currentType.color} />}
                {selectedType === 'taglines'       && <TaglineResult       result={result} color={currentType.color} />}
                {selectedType === 'brand_voice'    && <BrandVoiceResult    result={result} color={currentType.color} />}
                {selectedType === 'product_names'  && <ProductNamesResult  result={result} color={currentType.color} />}
                {selectedType === 'value_prop'     && <ValuePropResult     result={result} color={currentType.color} />}
              </motion.div>
            )}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16, minHeight: 300 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✍️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Your copy will appear here</div>
                  <div style={{ fontSize: 13, color: TEXT3 }}>Fill in the form and click Generate</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
