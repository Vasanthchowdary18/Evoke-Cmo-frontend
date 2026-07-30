import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Image, Camera, Users, RotateCw, Clapperboard, Music2, LayoutGrid,
  BarChart3, Sun, SlidersHorizontal, ToggleLeft, Languages, ChevronRight, Lock,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import ToolTopBar from '../components/ToolTopBar.jsx'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { PLANS, PLAN_LABELS } from '../lib/planGate.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

// Only "AI Image Generator" / "Product Catalog Imagery" / "Lifestyle
// Narratives" / "Display Ad Creatives" route to a real generator
// (/image-generator, backed by the live Gemini/DALL-E edge function).
// "Social Reels Composer" / "TikTok Brief Synthesizer" route to the real
// /reel-scripts generator. Everything else here (3D rendering, ambient
// relighting, upscaling, brand-rule enforcement, translation) has no
// backend anywhere in the app yet, so those are honestly marked Coming Soon
// instead of being wired to a tool that doesn't actually do the job.
const TOOLS = [
  { key: 'ai-image',   label: 'AI Image Generator',        desc: 'Production-ready brand imagery with strict context models.',            icon: Image,            thumb: 'tech',      image: '/creative-hub/ai-image-generator.png', route: '/image-generator', cta: 'Create Asset', plan: 'package-a' },
  { key: 'product',    label: 'Product Catalog Imagery',   desc: 'Isolate items onto luxurious, hyper-realistic canvas backgrounds.',      icon: Camera,           thumb: 'product',   image: '/creative-hub/product-catalog.png',    route: '/image-generator', prefillPrompt: 'A product isolated on a clean, luxurious catalog background', cta: 'Create Asset', plan: 'package-a' },
  { key: 'lifestyle',  label: 'Lifestyle Narratives',      desc: 'Synthesize target personas naturally handling your core catalog.',        icon: Users,            thumb: 'lifestyle', image: '/creative-hub/lifestyle-narratives.png', route: '/image-generator', prefillPrompt: 'A person naturally using the product in an everyday premium lifestyle setting', cta: 'Create Asset', plan: 'package-a' },
  { key: 'rotation',   label: '360° Rotational Views',     desc: 'Seamless product rendering workflows from multiple focal points.',        icon: RotateCw,         thumb: 'rotation',  image: '/creative-hub/rotational-views.png',   route: null,               comingSoon: true },
  { key: 'reels',      label: 'Social Reels Composer',     desc: 'Autonomously pair video hooks with bespoke voiceovers.',                  icon: Clapperboard,     thumb: 'reels',     image: '/creative-hub/social-reels.png',       route: '/reel-scripts',    cta: 'Create Asset', plan: 'package-a' },
  { key: 'tiktok',     label: 'TikTok Brief Synthesizer',  desc: 'Formulate script flows perfectly engineered to algorithmic indices.',      icon: Music2,           thumb: 'tiktok',    route: '/reel-scripts',    cta: 'Create Asset', plan: 'package-a' },
  { key: 'display-ad', label: 'Display Ad Creatives',      desc: 'Export automated multi-size formats matching optimal CTR playbooks.',     icon: LayoutGrid,       thumb: 'display',   route: '/image-generator', prefillPrompt: 'A high-CTR display advertisement creative with bold negative space for headline copy', cta: 'Create Asset', plan: 'package-a' },
  { key: 'infographic',label: 'Infographics Generator',    desc: 'Synthesize data playbooks into highly shareable formats.',                icon: BarChart3,        thumb: 'infographic', route: null,             comingSoon: true },
  { key: 'ambient',    label: 'AI Ambient Editor',         desc: 'Direct ambient lighting edits, scene tones, and filters.',                icon: Sun,              thumb: 'ambient',   route: null,               comingSoon: true },
  { key: 'studio',     label: 'Image Studio suite',        desc: 'Clean up unwanted artifacts and upscale canvas resolutions.',             icon: SlidersHorizontal,thumb: 'studio',    route: null,               comingSoon: true },
  { key: 'brand',      label: 'Brand Asset Toggles',       desc: 'Enforce typography overlays, color rules, and logos.',                    icon: ToggleLeft,       thumb: 'brand',     route: null,               comingSoon: true },
  { key: 'translate',  label: 'Translational Creative Engine', desc: 'Translate copy elements safely while retaining baseline styling.',     icon: Languages,        thumb: 'translate', route: null,               comingSoon: true },
]

const THUMBS = {
  tech:        { bg: 'linear-gradient(135deg,#1a1440,#0A0A0F 70%)',        glow: '#6366f1' },
  product:     { bg: 'linear-gradient(135deg,#3a2a10,#0A0A0F 70%)',        glow: GOLD },
  lifestyle:   { bg: 'linear-gradient(135deg,#3a1f2a,#0A0A0F 70%)',        glow: '#e1306c' },
  rotation:    { bg: 'linear-gradient(135deg,#1c2430,#0A0A0F 70%)',        glow: '#94a3b8' },
  reels:       { bg: 'linear-gradient(135deg,#2a1440,#0A0A0F 70%)',        glow: '#a855f7' },
  tiktok:      { bg: 'linear-gradient(135deg,#3a1018,#0A0A0F 70%)',        glow: '#ef4444' },
  display:     { bg: 'linear-gradient(135deg,#102338,#0A0A0F 70%)',        glow: '#3b82f6' },
  infographic: { bg: 'linear-gradient(135deg,#0f2f28,#0A0A0F 70%)',        glow: '#10b981' },
  ambient:     { bg: 'linear-gradient(135deg,#3a2a08,#0A0A0F 70%)',        glow: '#f59e0b' },
  studio:      { bg: 'linear-gradient(135deg,#22242e,#0A0A0F 70%)',        glow: '#9b9bb0' },
  brand:       { bg: 'linear-gradient(135deg,#3a2a10,#0A0A0F 70%)',        glow: GOLD },
  translate:   { bg: 'linear-gradient(135deg,#141c3a,#0A0A0F 70%)',        glow: '#6366f1' },
}

function planAllows(userPlan, requiredPlan) {
  if (!requiredPlan || requiredPlan === 'free') return true
  return PLANS.indexOf(userPlan || 'free') >= PLANS.indexOf(requiredPlan)
}

export default function CreativeStudioHubPage() {
  const navigate = useNavigate()
  const { plan: userPlan } = useUserPlan()

  const openTool = (tool) => {
    if (!tool.route) return
    if (tool.prefillPrompt) navigate(tool.route, { state: { prefill: { prompt: tool.prefillPrompt } } })
    else navigate(tool.route)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <ToolTopBar
          title="Creative Studio"
          subtitle="Generate luxury-grade, brand-coherent visual and video assets."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Visual &amp; Video Creative Tools</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {TOOLS.map((t, i) => {
              const locked = !t.comingSoon && !planAllows(userPlan, t.plan)
              return (
                <ToolCard
                  key={t.key} tool={t} i={i} locked={locked}
                  onClick={() => openTool(t)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolCard({ tool, i, locked, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = tool.icon
  const disabled = tool.comingSoon
  const thumb = THUMBS[tool.thumb] || THUMBS.tech

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, border: `1px solid ${hov && !disabled ? '#BE954A55' : BORDER}`, borderRadius: 14,
        overflow: 'hidden', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.18s',
        opacity: disabled ? 0.65 : 1, display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ height: 108, background: thumb.bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {tool.image
          ? <img src={tool.image} alt={tool.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <Icon size={34} color={thumb.glow} style={{ opacity: 0.35 }} />}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#BE954A1A', border: '1px solid #BE954A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BE954A', flexShrink: 0 }}>
            <Icon size={14} />
          </div>
          {!disabled && <ChevronRight size={14} color={hov ? '#BE954A' : TEXT3} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{tool.label}</div>
          <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>{tool.desc}</div>
        </div>
        <button
          disabled={disabled}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 16px', background: disabled ? 'transparent' : '#1A1A24', border: `1px solid ${disabled ? BORDER : '#2A2A3A'}`,
            borderRadius: 6, color: disabled ? TEXT3 : '#BE954A', fontSize: 13, fontWeight: 600,
            cursor: disabled ? 'default' : 'pointer', fontFamily: "'Geist','Inter',sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {locked && <Lock size={11} />}
          {disabled ? 'Coming Soon' : locked ? `Upgrade to ${PLAN_LABELS[tool.plan]}` : tool.cta}
        </button>
      </div>
    </motion.div>
  )
}
