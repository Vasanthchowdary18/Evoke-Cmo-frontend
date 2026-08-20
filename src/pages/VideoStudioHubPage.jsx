import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clapperboard, Video, BookOpen, Mic, Hash, Plus, Film } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import ToolTopBar from '../components/ToolTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getContentItems } from '../services/contentService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

// Commercial/Social/Explainer all route to the real /video-gen generator
// (Groq script + WaveSpeed render) with the matching type pre-selected.
// Voiceover Suite and Captions & Subtitles have no backend anywhere in the
// app (no TTS integration, no subtitle-burning pipeline) — honestly marked
// Coming Soon rather than pointed at an unrelated tool.
const TOOLS = [
  { key: 'commercial', label: 'Commercial Videos',   desc: 'Automate luxury commercials with context narration.',              icon: Clapperboard, videoType: 'promotional' },
  { key: 'social',     label: 'Social Videos',        desc: 'Autonomously drafts hooks, visual directions, and scene changes.', icon: Video,        videoType: 'reel' },
  { key: 'explainer',  label: 'Explainer Narratives', desc: 'Construct instructional, voice-acted features in minutes.',        icon: BookOpen,     videoType: 'educational' },
  { key: 'voiceover',  label: 'AI Voiceover Suite',   desc: 'Synthesize emotional narration using multi-language voice models.', icon: Mic,          comingSoon: true },
  { key: 'captions',   label: 'Captions & Subtitles', desc: 'Inject dynamic typography effects direct to video frames.',        icon: Hash,         comingSoon: true },
]

function timeAgo(seconds) {
  if (!seconds) return ''
  const diff = Date.now() / 1000 - seconds
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Formats the real duration the user picked in Step 2 (e.g. "90 seconds",
// "2 minutes") into a Figma-style "1:30" label. No fabricated numbers.
function formatDuration(d) {
  if (!d) return '—'
  const sec = d.match(/^(\d+)\s*seconds?$/)
  if (sec) { const s = +sec[1]; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` }
  const min = d.match(/^(\d+)\s*minutes?$/)
  if (min) return `${min[1]}:00 min`
  return d
}

export default function VideoStudioHubPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getContentItems(user.uid)
      .then(items => setProjects(items.filter(i => i.campaignType === 'video_generation').slice(0, 4)))
      .catch(() => setProjects([]))
  }, [user?.uid])

  const openTool = (tool) => {
    if (tool.comingSoon) return
    navigate('/video-gen', { state: { prefill: { videoType: tool.videoType } } })
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <ToolTopBar
          title="Video Studio"
          subtitle="Generate luxury advertisement videos with fully synthesized voice acting and transitions."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Video Generation Suite</div>
              <button onClick={() => navigate('/video-gen')} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: GOLD, border: 'none',
                borderRadius: 8, color: '#0A0A0F', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif",
              }}>
                Create New Video <Plus size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {TOOLS.map((t, i) => (
                <ToolCard key={t.key} tool={t} i={i} onClick={() => openTool(t)} />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Recent Projects</div>

            {projects === null ? (
              <div style={{ fontSize: 13, color: TEXT3 }}>Loading…</div>
            ) : projects.length === 0 ? (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: 'center', color: TEXT3, fontSize: 13 }}>
                No video projects yet — generate your first one above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {projects.map(p => {
                  const title = p.text || p.campaignName || 'Untitled Project'
                  let duration = ''
                  try { duration = JSON.parse(p.data || '{}').duration || '' } catch {}
                  const rendered = !!p.videoUrl
                  const GREEN = '#10b981'
                  return (
                    <div key={p.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ height: 90, background: 'linear-gradient(135deg,#1a1440,#0A0A0F 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {rendered
                          ? <video src={p.videoUrl} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Film size={24} color="#6366f1" style={{ opacity: 0.4 }} />}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: TEXT3 }}>{duration ? formatDuration(duration) : timeAgo(p.createdAt?.seconds)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: rendered ? GREEN : GOLD, background: rendered ? 'rgba(16,185,129,0.1)' : GDIM, border: `1px solid ${rendered ? 'rgba(16,185,129,0.3)' : GBORD}`, borderRadius: 100, padding: '2px 8px' }}>
                            {rendered ? 'Rendered' : 'Script Only'}
                          </span>
                        </div>
                        <div style={{ height: 3, borderRadius: 100, background: BORDER, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: rendered ? '100%' : '35%', background: rendered ? GREEN : GOLD, borderRadius: 100 }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolCard({ tool, i, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = tool.icon
  const disabled = tool.comingSoon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, border: `1px solid ${hov && !disabled ? '#BE954A55' : BORDER}`, borderRadius: 14,
        padding: 18, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.18s',
        opacity: disabled ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#BE954A1A', border: '1px solid #BE954A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BE954A' }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{tool.label}</div>
        <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>{tool.desc}</div>
      </div>
      {disabled && (
        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3 }}>Coming Soon</div>
      )}
    </motion.div>
  )
}
