import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Sparkles, Check, Copy, Download,
  Camera, Layers, Box, Layout, BarChart2, Instagram,
  ChevronRight, RefreshCw, CheckCircle2, XCircle,
  Shield, Zap, History, Image, FileText, Palette,
  AlertCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import JourneyFooter from '../components/JourneyFooter.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveContentItems, getContentItems } from '../services/contentService'
import { appendJourneyOutput } from '../services/knowledgeBaseService.js'

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
const PINK    = '#ec4899'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const ASSET_TYPES = [
  { key: 'photo',          label: 'Image / Photo',           icon: <Camera size={22}/>,    desc: 'Product & lifestyle photography',      color: '#ec4899' },
  { key: 'graphic',        label: 'Graphic / Illustration',  icon: <Layers size={22}/>,    desc: 'Digital illustrations & graphics',     color: '#6366f1' },
  { key: 'product_render', label: 'Product Render',          icon: <Box size={22}/>,       desc: 'Photorealistic 3D product renders',    color: '#a855f7' },
  { key: 'social',         label: 'Social Creative',         icon: <Instagram size={22}/>, desc: 'Instagram, TikTok & LinkedIn posts',   color: '#10b981' },
  { key: 'display_ad',     label: 'Display Ad',              icon: <Layout size={22}/>,    desc: 'Banner & display advertising',         color: '#f59e0b' },
  { key: 'infographic',    label: 'Infographic',             icon: <BarChart2 size={22}/>, desc: 'Data-driven visual storytelling',      color: '#3b82f6' },
]

const PLATFORMS  = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter / X', 'YouTube', 'Google Display', 'Pinterest', 'Email']
const STYLES     = ['Minimalist', 'Bold & Vibrant', 'Elegant / Luxury', 'Playful & Fun', 'Corporate / Professional', 'Cinematic', 'Editorial', 'Street & Urban']
const TONES      = ['Inspirational', 'Energetic', 'Calm & Trustworthy', 'Urgency / FOMO', 'Premium', 'Friendly', 'Authoritative', 'Witty']

// Asset-type specific field definitions
const ASSET_FIELDS = {
  photo: [
    { key: 'subject',   label: 'Subject / Scene *',       placeholder: 'e.g. Woman wearing gold watch at sunset', type: 'input' },
    { key: 'lighting',  label: 'Lighting Mood',            placeholder: '', type: 'select', options: ['Natural Light', 'Studio Light', 'Golden Hour', 'Dramatic / Moody', 'Soft Diffused', 'Neon / Night'] },
    { key: 'cameraStyle', label: 'Camera Style',           placeholder: '', type: 'select', options: ['Portrait / Close-up', 'Lifestyle / Candid', 'Aerial / Bird\'s Eye', 'Product Flat Lay', 'Environmental / Wide'] },
    { key: 'setting',   label: 'Setting / Location',       placeholder: 'e.g. Luxury hotel rooftop, White studio, Outdoor market', type: 'input' },
  ],
  graphic: [
    { key: 'illustrationStyle', label: 'Illustration Style', placeholder: '', type: 'select', options: ['Flat Design', '3D Render', 'Watercolor', 'Line Art', 'Vector / Geometric', 'Isometric', 'Pixel Art'] },
    { key: 'keyElements', label: 'Key Visual Elements *',  placeholder: 'e.g. Bold typography, abstract shapes, product icon', type: 'input' },
    { key: 'colorPalette', label: 'Color Palette',         placeholder: 'e.g. Deep blue + gold + white', type: 'input' },
    { key: 'background', label: 'Background Style',        placeholder: '', type: 'select', options: ['Solid Color', 'Gradient', 'Abstract Pattern', 'Transparent', 'Dark / Black', 'White / Minimal'] },
  ],
  product_render: [
    { key: 'productName',  label: 'Product Name / Model *', placeholder: 'e.g. EvoX Pro Watch Series 5', type: 'input' },
    { key: 'material',     label: 'Material / Finish',       placeholder: '', type: 'select', options: ['Glossy', 'Matte', 'Metallic / Chrome', 'Transparent / Glass', 'Leather', 'Carbon Fibre'] },
    { key: 'background',   label: 'Render Background',       placeholder: '', type: 'select', options: ['Pure White Studio', 'Dark Luxury', 'Lifestyle Scene', 'Abstract / Gradient', 'Transparent'] },
    { key: 'cameraAngle',  label: 'Camera Angle',            placeholder: '', type: 'select', options: ['Hero / 3/4 View', 'Front View', 'Top Down', 'Side Profile', '360 Perspective'] },
  ],
  social: [
    { key: 'postType',     label: 'Post Type',               placeholder: '', type: 'select', options: ['Feed Post', 'Story (9:16)', 'Reel Cover', 'Carousel Slide', 'Profile Banner'] },
    { key: 'contentTheme', label: 'Content Theme *',         placeholder: 'e.g. Product launch, testimonial, behind the scenes, sale announcement', type: 'input' },
    { key: 'engagementHook', label: 'Engagement Hook',       placeholder: 'e.g. Ask a question, bold statement, countdown', type: 'input' },
    { key: 'hashtags',     label: 'Niche / Hashtag Area',    placeholder: 'e.g. #luxury #watches #style', type: 'input' },
  ],
  display_ad: [
    { key: 'adFormat',     label: 'Ad Format / Size',        placeholder: '', type: 'select', options: ['Leaderboard 728×90', 'Rectangle 300×250', 'Half Page 300×600', 'Billboard 970×250', 'Square 250×250', 'Custom'] },
    { key: 'headline',     label: 'Primary Headline *',      placeholder: 'e.g. Get 30% Off Today Only', type: 'input' },
    { key: 'ctaText',      label: 'CTA Button Text',         placeholder: 'e.g. Shop Now, Get Started, Claim Offer', type: 'input' },
    { key: 'offer',        label: 'Offer / Promotion',       placeholder: 'e.g. Free shipping, 20% off, Limited time deal', type: 'input' },
  ],
  infographic: [
    { key: 'topic',        label: 'Topic / Title *',         placeholder: 'e.g. 5 Reasons Why Customers Choose Us', type: 'input' },
    { key: 'dataFormat',   label: 'Infographic Format',      placeholder: '', type: 'select', options: ['Statistics / Numbers', 'Step-by-Step Process', 'Comparison / VS', 'Timeline', 'List / Tips', 'Flowchart'] },
    { key: 'dataPoints',   label: 'Key Data Points *',       placeholder: 'e.g. 95% satisfaction, 10k+ users, 3x faster results', type: 'input' },
    { key: 'sections',     label: 'Number of Sections',      placeholder: '', type: 'select', options: ['3 sections', '4 sections', '5 sections', '6 sections', '7+ sections'] },
  ],
}

async function generateCreativeAsset(inputs, assetType) {
  const typeLabel = ASSET_TYPES.find(t => t.key === assetType)?.label || assetType

  // Build asset-type-specific details string
  const specificFields = (ASSET_FIELDS[assetType] || [])
    .map(f => inputs[f.key] ? `- ${f.label.replace(' *','')}: ${inputs[f.key]}` : '')
    .filter(Boolean)
    .join('\n')

  const prompt = `You are a world-class creative director and brand strategist.

Generate a complete creative asset package for:
- Brand / Product: ${inputs.brand}
- Asset Type: ${typeLabel}
- Campaign Brief: ${inputs.brief}
- Target Platform: ${inputs.platform}
- Visual Style: ${inputs.style}
- Tone: ${inputs.tone}
- Brand Colors: ${inputs.brandColors || 'Not specified'}
${specificFields ? `\nAsset-Specific Details:\n${specificFields}` : ''}

Return ONLY valid JSON (no markdown):
{
  "title": "Creative project title",
  "concept": "2-3 sentence creative concept explaining the big idea",
  "visualDirection": {
    "composition": "How the visual is structured/composed",
    "colorUsage": "How colors are used in the asset",
    "typography": "Font style and text treatment recommendation",
    "keyVisual": "The single most important visual element to include",
    "mood": "The emotional feeling the asset should evoke"
  },
  "imagePrompt": "Detailed AI image generation prompt (60-80 words) — specific, descriptive, camera angle, lighting, style, no text overlays",
  "copyElements": {
    "headline": "Primary headline (max 8 words)",
    "subheadline": "Supporting line (max 12 words)",
    "cta": "Call to action text",
    "caption": "Social media caption (if applicable)"
  },
  "platformSpecs": {
    "dimensions": "Recommended dimensions for the platform",
    "fileFormat": "Recommended file format",
    "safeZone": "Safe zone / bleed guidance"
  },
  "brandConformance": {
    "status": "approved",
    "score": 88,
    "checks": [
      { "item": "Brand color alignment", "pass": true, "note": "Brief note" },
      { "item": "Visual style consistency", "pass": true, "note": "Brief note" },
      { "item": "Messaging clarity", "pass": true, "note": "Brief note" },
      { "item": "Platform best practice", "pass": true, "note": "Brief note" },
      { "item": "CTA effectiveness", "pass": true, "note": "Brief note" }
    ],
    "governanceNote": "One sentence brand governance summary"
  },
  "estimatedPerformance": {
    "engagementRate": "Estimated engagement rate range",
    "reach": "Estimated reach range",
    "bestPostTime": "Best time to post for this platform"
  }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a creative director. Respond ONLY with valid JSON, no markdown fences, no extra text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.75,
      max_tokens: 2500,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

const inputStyle = {
  width: '100%', background: CARD2, border: `1px solid ${BORDER}`,
  borderRadius: 10, padding: '10px 14px', color: TEXT, fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
}
const selectStyle = { ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }

export default function CreativeAssetPage() {
  useRequireAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()
  const fromContent = location.state?.payload?.fromStep === 5 ? location.state.payload : null

  const [assetType, setAssetType] = useState('')
  const [inputs, setInputs]       = useState({ brand: fromContent?.productName || '', brief: fromContent?.context || '', brandColors: '', platform: 'Instagram', style: 'Minimalist', tone: 'Inspirational' })

  const selectAssetType = (key) => {
    setAssetType(key)
    // Clear asset-specific fields from previous type
    const prevFields = ASSET_FIELDS[assetType] || []
    const nextFields = ASSET_FIELDS[key] || []
    const prevKeys = prevFields.map(f => f.key)
    const nextKeys = nextFields.map(f => f.key)
    const toRemove = prevKeys.filter(k => !nextKeys.includes(k))
    if (toRemove.length > 0) {
      setInputs(p => {
        const copy = { ...p }
        toRemove.forEach(k => delete copy[k])
        return copy
      })
    }
    setResult(null); setGeneratedImg(null); setImgError(''); setError('')
  }
  const [loading, setLoading]     = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [result, setResult]       = useState(null)
  const [generatedImg, setGeneratedImg] = useState(null)
  const [imgError, setImgError]   = useState('')
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState('')
  const [activeTab, setActiveTab] = useState('preview')
  const [savedDocId, setSavedDocId] = useState(null)
  const [history, setHistory]     = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const set = (field, val) => setInputs(p => ({ ...p, [field]: val }))

  const loadHistory = async () => {
    if (!user?.uid) return
    try {
      const items = await getContentItems(user.uid)
      setHistory(items.filter(i => i.campaignType === 'creative_asset').slice(0, 5))
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user?.uid])

  const canGenerate = assetType && inputs.brand.trim() && inputs.brief.trim()

  const generateImage = async (prompt) => {
    if (!prompt) return
    setImgLoading(true)
    setGeneratedImg(null)
    setImgError('')
    try {
      const size =
        inputs.platform === 'LinkedIn' || inputs.platform === 'Facebook' || inputs.platform === 'Google Display'
          ? '1536x1024'
          : inputs.platform === 'Pinterest'
            ? '1024x1536'
            : '1024x1024'

      const res = await fetch('/api/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'dalle', size }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Image API error ${res.status}`)
      if (data.base64Image) {
        setGeneratedImg(`data:${data.mimeType || 'image/png'};base64,${data.base64Image}`)
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (e) {
      setImgError(e.message || 'Image generation failed')
    } finally {
      setImgLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!canGenerate) return
    setLoading(true); setError(''); setResult(null); setGeneratedImg(null); setImgError(''); setSavedDocId(null)
    try {
      const r = await generateCreativeAsset(inputs, assetType)
      setResult(r)
      setActiveTab('preview')
      generateImage(r.imagePrompt)
      try {
        const ids = await saveContentItems(
          user?.uid,
          { name: inputs.brand, type: 'creative_asset', source: 'campaign' },
          [{ key: 'output', type: 'creative', platform: inputs.platform, text: r.title, data: JSON.stringify(r) }],
          'draft'
        )
        if (ids?.[0]) setSavedDocId(ids[0])
        await loadHistory()
      } catch {}
      try {
        if (user?.uid) await appendJourneyOutput(user.uid, 'creative', r.title)
      } catch {}
    } catch (e) {
      setError(e.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRevise = async () => {
    setResult(null); setGeneratedImg(null)
    await handleGenerate()
  }

  const downloadImage = () => {
    if (!generatedImg) return
    const a = document.createElement('a')
    a.href = generatedImg
    a.download = `${inputs.brand.replace(/\s+/g, '_')}_${assetType}_${new Date().toISOString().slice(0, 10)}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const copyText = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 1800)
  }

  const downloadBrief = () => {
    if (!result) return
    const type = ASSET_TYPES.find(t => t.key === assetType)
    const lines = [
      `CREATIVE ASSET BRIEF`,
      `=`.repeat(50),
      `Brand / Product : ${inputs.brand}`,
      `Asset Type      : ${type?.label}`,
      `Platform        : ${inputs.platform}`,
      `Style           : ${inputs.style}`,
      `Tone            : ${inputs.tone}`,
      ``,
      `PROJECT TITLE`,
      result.title,
      ``,
      `CREATIVE CONCEPT`,
      result.concept,
      ``,
      `VISUAL DIRECTION`,
      `Composition  : ${result.visualDirection?.composition}`,
      `Color Usage  : ${result.visualDirection?.colorUsage}`,
      `Typography   : ${result.visualDirection?.typography}`,
      `Key Visual   : ${result.visualDirection?.keyVisual}`,
      `Mood         : ${result.visualDirection?.mood}`,
      ``,
      `AI IMAGE PROMPT`,
      result.imagePrompt,
      ``,
      `COPY ELEMENTS`,
      `Headline     : ${result.copyElements?.headline}`,
      `Subheadline  : ${result.copyElements?.subheadline}`,
      `CTA          : ${result.copyElements?.cta}`,
      `Caption      : ${result.copyElements?.caption}`,
      ``,
      `PLATFORM SPECS`,
      `Dimensions   : ${result.platformSpecs?.dimensions}`,
      `File Format  : ${result.platformSpecs?.fileFormat}`,
      `Safe Zone    : ${result.platformSpecs?.safeZone}`,
      ``,
      `BRAND CONFORMANCE`,
      `Status : ${result.brandConformance?.status?.toUpperCase()} (${result.brandConformance?.score}/100)`,
      ...(result.brandConformance?.checks || []).map(c => `  ${c.pass ? '✓' : '✗'} ${c.item} — ${c.note}`),
      ``,
      `ESTIMATED PERFORMANCE`,
      `Engagement Rate : ${result.estimatedPerformance?.engagementRate}`,
      `Reach           : ${result.estimatedPerformance?.reach}`,
      `Best Post Time  : ${result.estimatedPerformance?.bestPostTime}`,
      ``,
      `Generated by EVOX AI — ${new Date().toLocaleDateString()}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `Creative_Brief_${inputs.brand.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
  }

  const conformanceStatus = result?.brandConformance?.status
  const conformancePassed = conformanceStatus === 'approved'
  const conformanceScore  = result?.brandConformance?.score || 0

  const TABS = [
    { key: 'preview',     label: 'Preview' },
    { key: 'concept',     label: 'Concept' },
    { key: 'visual',      label: 'Visual Direction' },
    { key: 'prompt',      label: 'Image Prompt' },
    { key: 'copy',        label: 'Copy & Caption' },
    { key: 'conformance', label: 'Brand Check' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter','Syne',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Creative Asset Generator</h1>
            <p style={{ fontSize: 13, color: TEXT2, margin: '3px 0 0' }}>
              Campaign brief → AI creative package → Brand-approved assets
            </p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(p => !p)}
              style={{ marginLeft: 'auto', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 12px', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <History size={15}/> History
            </button>
          )}
        </div>

        {fromContent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, marginBottom: 16, width: 'fit-content' }}>
            <Check size={13} color="#10b981" />
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Brief pre-filled from your Content Generation step{fromContent.productName ? ` — ${fromContent.productName}` : ''}</span>
          </div>
        )}

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: TEXT3, margin: '0 0 10px', fontWeight: 600, letterSpacing: '0.06em' }}>RECENT</p>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < history.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: 13, color: TEXT }}>{h.text || h.name}</span>
                  <span style={{ fontSize: 11, color: TEXT3 }}>{h.platform}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1 — Asset Type */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', margin: '0 0 14px' }}>STEP 1 — SELECT ASSET TYPE</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {ASSET_TYPES.map(t => (
              <button key={t.key} onClick={() => selectAssetType(t.key)}
                style={{
                  background: assetType === t.key ? `${t.color}18` : CARD2,
                  border: `1.5px solid ${assetType === t.key ? t.color : BORDER}`,
                  borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.18s',
                }}>
                <div style={{ color: assetType === t.key ? t.color : TEXT2, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: assetType === t.key ? t.color : TEXT, marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: TEXT3, lineHeight: 1.4 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Inputs */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', margin: '0 0 16px' }}>STEP 2 — CAMPAIGN BRIEF + BRAND GUIDELINES</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Always visible: Brand + Brand Colors */}
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Brand / Product Name *</label>
              <input value={inputs.brand} onChange={e => set('brand', e.target.value)}
                placeholder="e.g. EVOX AI" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Brand Colors</label>
              <input value={inputs.brandColors} onChange={e => set('brandColors', e.target.value)}
                placeholder="e.g. Gold #c8973e, Dark #0e0c09" style={inputStyle} />
            </div>

            {/* Always visible: Campaign Brief */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Campaign Brief *</label>
              <textarea value={inputs.brief} onChange={e => set('brief', e.target.value)}
                placeholder="Describe the campaign goal, product, and what you want the asset to achieve..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            {/* Asset-type specific fields */}
            {assetType && (ASSET_FIELDS[assetType] || []).map(field => (
              <div key={field.key} style={{ gridColumn: field.type === 'input' && field.key === (ASSET_FIELDS[assetType][0]?.key) ? '1 / -1' : undefined }}>
                <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select value={inputs[field.key] || field.options[0]} onChange={e => set(field.key, e.target.value)} style={selectStyle}>
                    {field.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={inputs[field.key] || ''} onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder} style={inputStyle} />
                )}
              </div>
            ))}

            {/* Always visible: Platform, Style, Tone */}
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Target Platform</label>
              <select value={inputs.platform} onChange={e => set('platform', e.target.value)} style={selectStyle}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Visual Style</label>
              <select value={inputs.style} onChange={e => set('style', e.target.value)} style={selectStyle}>
                {STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: 'block', marginBottom: 6 }}>Tone</label>
              <select value={inputs.tone} onChange={e => set('tone', e.target.value)} style={selectStyle}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: canGenerate && !loading ? `linear-gradient(135deg, ${PINK}, #a855f7)` : CARD2,
            border: 'none', color: canGenerate && !loading ? '#fff' : TEXT3,
            fontSize: 15, fontWeight: 700, cursor: canGenerate && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 24, transition: 'all 0.2s',
          }}>
          {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Generating Creative Package...</>
                   : <><Sparkles size={18}/> Generate Creative Asset</>}
        </motion.button>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={16} color="#ef4444"/>
            <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Title + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: TEXT3, letterSpacing: '0.07em', marginBottom: 4 }}>GENERATED CREATIVE PACKAGE</div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: TEXT }}>{result.title}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleRevise} disabled={loading}
                    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', color: TEXT2, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14}/> Regenerate
                  </button>
                  <button onClick={downloadBrief}
                    style={{ background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, padding: '8px 14px', color: GOLD, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={14}/> Download Brief
                  </button>
                </div>
              </div>

              {/* Brand conformance banner */}
              <div style={{
                background: conformancePassed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${conformancePassed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} color={conformancePassed ? '#10b981' : '#ef4444'}/>
                  <span style={{ fontSize: 13, color: conformancePassed ? '#6ee7b7' : '#fca5a5', fontWeight: 600 }}>
                    Brand Conformance: {conformancePassed ? 'APPROVED' : 'NEEDS REVISION'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: conformancePassed ? '#10b981' : '#ef4444' }}>{conformanceScore}</span>
                  <span style={{ fontSize: 12, color: TEXT3 }}>/100</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none',
                      background: activeTab === t.key ? PINK : CARD,
                      color: activeTab === t.key ? '#fff' : TEXT2,
                      fontWeight: activeTab === t.key ? 600 : 400,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>

                {activeTab === 'preview' && (
                  <div>
                    {/* Generated Image */}
                    <div style={{ borderRadius: 12, overflow: 'hidden', background: CARD2, marginBottom: 16, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {imgLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <Loader2 size={32} color={PINK} style={{ animation: 'spin 1s linear infinite' }}/>
                          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Generating your image...</p>
                        </div>
                      )}
                      {!imgLoading && generatedImg && (
                        <img src={generatedImg} alt="Generated creative asset"
                          style={{ width: '100%', display: 'block', borderRadius: 12 }}
                          onError={() => setGeneratedImg(null)}
                        />
                      )}
                      {!imgLoading && !generatedImg && (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                          <Image size={32} color={imgError ? '#ef4444' : TEXT3} style={{ marginBottom: 8 }}/>
                          {imgError ? (
                            <>
                              <p style={{ fontSize: 13, color: '#fca5a5', margin: '0 0 6px', fontWeight: 600 }}>Image generation failed</p>
                              <p style={{ fontSize: 12, color: TEXT3, margin: 0, maxWidth: 340 }}>{imgError}</p>
                            </>
                          ) : (
                            <p style={{ fontSize: 13, color: TEXT3, margin: 0 }}>Image preview unavailable — use the prompt below in Midjourney or DALL-E</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {generatedImg && (
                        <button onClick={downloadImage}
                          style={{ flex: 1, padding: '11px 16px', borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #a855f7)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Download size={16}/> Download Image
                        </button>
                      )}
                      <button onClick={() => generateImage(result?.imagePrompt)} disabled={imgLoading}
                        style={{ flex: 1, padding: '11px 16px', borderRadius: 10, background: CARD2, border: `1px solid ${BORDER}`, color: TEXT2, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <RefreshCw size={15}/> Regenerate Image
                      </button>
                      <button onClick={() => copyText(result?.copyElements?.caption || result?.copyElements?.headline, 'caption_quick')}
                        style={{ flex: 1, padding: '11px 16px', borderRadius: 10, background: CARD2, border: `1px solid ${BORDER}`, color: TEXT2, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {copied === 'caption_quick' ? <><Check size={15}/> Copied!</> : <><Copy size={15}/> Copy Caption</>}
                      </button>
                    </div>

                    {/* Caption preview */}
                    {result?.copyElements?.caption && (
                      <div style={{ background: CARD2, borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
                        <div style={{ fontSize: 10, color: TEXT3, letterSpacing: '0.06em', marginBottom: 6 }}>CAPTION — READY TO POST</div>
                        <p style={{ fontSize: 14, color: TEXT, margin: 0, lineHeight: 1.7 }}>{result.copyElements.caption}</p>
                      </div>
                    )}

                    {/* Performance stats */}
                    {result?.estimatedPerformance && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                        {[
                          { label: 'Est. Engagement', val: result.estimatedPerformance.engagementRate },
                          { label: 'Est. Reach', val: result.estimatedPerformance.reach },
                          { label: 'Best Post Time', val: result.estimatedPerformance.bestPostTime },
                        ].map(s => (
                          <div key={s.label} style={{ background: CARD2, borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: TEXT3, marginBottom: 3 }}>{s.label.toUpperCase()}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'concept' && (
                  <div>
                    <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75, margin: '0 0 18px' }}>{result.concept}</p>
                    {result.estimatedPerformance && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                        {[
                          { label: 'Est. Engagement', val: result.estimatedPerformance.engagementRate },
                          { label: 'Est. Reach', val: result.estimatedPerformance.reach },
                          { label: 'Best Post Time', val: result.estimatedPerformance.bestPostTime },
                        ].map(s => (
                          <div key={s.label} style={{ background: CARD2, borderRadius: 10, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: TEXT3, marginBottom: 4, letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'visual' && result.visualDirection && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Composition', val: result.visualDirection.composition, icon: <Image size={15}/> },
                      { label: 'Color Usage', val: result.visualDirection.colorUsage, icon: <Palette size={15}/> },
                      { label: 'Typography', val: result.visualDirection.typography, icon: <FileText size={15}/> },
                      { label: 'Key Visual', val: result.visualDirection.keyVisual, icon: <Zap size={15}/> },
                      { label: 'Mood', val: result.visualDirection.mood, icon: <Sparkles size={15}/> },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{ color: PINK, marginTop: 2 }}>{row.icon}</div>
                        <div>
                          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>{row.label.toUpperCase()}</div>
                          <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{row.val}</div>
                        </div>
                      </div>
                    ))}
                    {result.platformSpecs && (
                      <div style={{ background: CARD2, borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: TEXT3, marginBottom: 8, letterSpacing: '0.05em' }}>PLATFORM SPECS — {inputs.platform.toUpperCase()}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          {[
                            { k: 'Dimensions', v: result.platformSpecs.dimensions },
                            { k: 'File Format', v: result.platformSpecs.fileFormat },
                            { k: 'Safe Zone', v: result.platformSpecs.safeZone },
                          ].map(s => (
                            <div key={s.k}>
                              <div style={{ fontSize: 10, color: TEXT3 }}>{s.k}</div>
                              <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prompt' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ fontSize: 12, color: TEXT3, margin: 0, letterSpacing: '0.05em' }}>AI IMAGE GENERATION PROMPT</p>
                      <button onClick={() => copyText(result.imagePrompt, 'prompt')}
                        style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 10px', color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        {copied === 'prompt' ? <><Check size={13}/> Copied</> : <><Copy size={13}/> Copy Prompt</>}
                      </button>
                    </div>
                    <div style={{ background: CARD2, borderRadius: 12, padding: '16px', fontSize: 14, color: TEXT, lineHeight: 1.8, fontFamily: 'monospace' }}>
                      {result.imagePrompt}
                    </div>
                    <p style={{ fontSize: 12, color: TEXT3, marginTop: 12 }}>
                      Paste this prompt into Midjourney, DALL-E, Adobe Firefly, or Stable Diffusion.
                    </p>
                  </div>
                )}

                {activeTab === 'copy' && result.copyElements && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Headline', val: result.copyElements.headline, key: 'headline' },
                      { label: 'Subheadline', val: result.copyElements.subheadline, key: 'sub' },
                      { label: 'Call to Action', val: result.copyElements.cta, key: 'cta' },
                      { label: 'Caption', val: result.copyElements.caption, key: 'caption' },
                    ].map(row => (
                      <div key={row.key} style={{ background: CARD2, borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: TEXT3, letterSpacing: '0.06em', fontWeight: 600 }}>{row.label.toUpperCase()}</span>
                          <button onClick={() => copyText(row.val, row.key)}
                            style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                            {copied === row.key ? <Check size={12}/> : <Copy size={12}/>}
                          </button>
                        </div>
                        <p style={{ fontSize: 14, color: TEXT, margin: 0, lineHeight: 1.6 }}>{row.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'conformance' && result.brandConformance && (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                      {(result.brandConformance.checks || []).map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ marginTop: 1 }}>
                            {c.pass
                              ? <CheckCircle2 size={17} color="#10b981"/>
                              : <XCircle size={17} color="#ef4444"/>}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{c.item}</div>
                            <div style={{ fontSize: 12, color: TEXT2 }}>{c.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: CARD2, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Shield size={15} color={conformancePassed ? '#10b981' : '#f59e0b'} style={{ marginTop: 2 }}/>
                      <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{result.brandConformance.governanceNote}</p>
                    </div>
                    {!conformancePassed && (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleRevise} disabled={loading}
                        style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <RefreshCw size={15}/> Revise & Regenerate
                      </motion.button>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <JourneyFooter currentPath="/creative-asset" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
