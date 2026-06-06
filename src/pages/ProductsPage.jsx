import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RotateCcw, Video, FileText, Search, Box, Film,
  ArrowRight, ArrowLeft, Zap
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const CONVERTERS = [
  {
    icon: <RotateCcw size={28} />,
    color: '#10b981',
    title: 'Image → New Angles & Lifestyle',
    tag: 'Multi-view synthesis',
    description:
      'Generate consistent alternate viewpoints from a single photo — perfect for products, packaging, and catalog coverage without another shoot.',
    active: true,
    route: '/image-angles',
  },
  {
    icon: <Video size={28} />,
    color: '#a855f7',
    title: 'Image → 360° Rotation Frames',
    tag: 'Orbital motion',
    description:
      'Turn stills into smooth orbital motion — turntable-style frames for web, social, and PDP interactive embeds.',
    active: true,
    route: '/image-360',
  },
  {
    icon: <FileText size={28} />,
    color: '#06b6d4',
    title: 'Product Description Generator',
    tag: 'Caption & copy',
    description:
      'Generate marketing copy, alt text, bullet points, and SEO metadata from a product image — ready for PDPs and listings.',
    active: true,
    route: '/product-desc',
  },
  {
    icon: <Search size={28} />,
    color: '#f59e0b',
    title: 'Image → SEO & Meta Tags',
    tag: 'Search & discoverability',
    description:
      'Generate page titles, meta descriptions, Open Graph tags, structured data, and keyword strategy from your product image.',
    active: true,
    route: '/image-seo',
  },
  {
    icon: <Box size={28} />,
    color: '#ec4899',
    title: 'Image → 3D',
    tag: 'Depth & mesh',
    description:
      'Lift flat images into depth-aware geometry and export-friendly 3D outputs for previews, AR, and downstream pipelines.',
    active: true,
    route: '/image-3d',
    comingSoon: true,
  },
  {
    icon: <Film size={28} />,
    color: '#7c3aed',
    title: 'Image → Video Script',
    tag: 'Motion & social',
    description:
      'Transform product images into complete video storyboards for Reels, Shorts, and social ads — scenes, voiceover, music, and captions.',
    active: true,
    route: '/image-video',
  },
]

export default function ProductsPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', position: 'relative' }}>
      <Navbar />

      <div className="glow-orb glow-purple" style={{ width: 500, height: 500, top: -80, right: -80, opacity: 0.12 }} />
      <div className="glow-orb glow-cyan"   style={{ width: 400, height: 400, bottom: 0, left: -80, opacity: 0.1 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '108px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Back + Launch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => navigate('/agents-hub')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '14px', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/campaign/product')}
            style={{ fontSize: '14px', padding: '11px 22px' }}
          >
            Launch Product Campaign <ArrowRight size={16} />
          </button>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>
            <Zap size={13} /> AI Visual Tools
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px', lineHeight: 1.1 }}>
            Six converters,{' '}
            <span className="gradient-text">one creative stack</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '17px', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Pick the transformation you need — each tool is tuned for retail, brand, and studio workflows.
          </p>
        </motion.div>

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {CONVERTERS.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={c.active ? { y: -5 } : {}}
              onClick={() => c.active && navigate(c.route)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${c.active ? c.color + '30' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '20px',
                padding: '32px',
                cursor: c.active ? 'pointer' : 'default',
                transition: 'all 0.25s',
                position: 'relative',
                overflow: 'hidden',
                opacity: c.comingSoon ? 0.75 : 1,
              }}
              onMouseEnter={e => { if (c.active) e.currentTarget.style.borderColor = c.color + '55' }}
              onMouseLeave={e => { if (c.active) e.currentTarget.style.borderColor = c.color + '30' }}
            >
              {/* Coming soon badge */}
              {c.comingSoon && (
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '3px 10px', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: '#ec4899', letterSpacing: '0.06em' }}>
                  COMING SOON
                </div>
              )}
              {!c.active && !c.comingSoon && (
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                  COMING SOON
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: '16px',
                background: `${c.color}15`,
                border: `1px solid ${c.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.color, marginBottom: '20px',
              }}>
                {c.icon}
              </div>

              {/* Title + tag */}
              <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px', lineHeight: 1.3 }}>
                {c.title}
              </h3>
              <p style={{ color: c.active ? c.color : 'rgba(255,255,255,0.25)', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                {c.tag}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
                {c.description}
              </p>

              {/* Footer link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: c.color }}>
                {c.tag} {!c.comingSoon && <ArrowRight size={13} />}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
