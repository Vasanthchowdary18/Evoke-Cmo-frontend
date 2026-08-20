import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Instagram, Facebook, Linkedin, Music2, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getSocialAccounts } from '../services/userService.js'
import { getContentItems } from '../services/contentService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const GREEN  = '#10b981'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#dd2a7b' },
  { key: 'facebook',  label: 'Facebook',  icon: Facebook,  color: '#1877f2' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: Linkedin,  color: '#0a66c2' },
  { key: 'tiktok',    label: 'TikTok',    icon: Music2,    color: '#ff0050' },
]

// Real Groq call — no fabricated copy. Mirrors the same prompt/JSON pattern
// used by generateBlog / generateEmailPackage elsewhere in the app.
async function generatePostDraft(prompt) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `You are a social media strategist writing in an executive, confident tone. Write a social media post for: "${prompt}"\n\nReturn ONLY valid JSON: { "caption": "the post text, 2-4 sentences", "hashtags": ["tag1","tag2","tag3"] }` }],
      temperature: 0.8,
      max_tokens: 400,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

function timeAgo(seconds) {
  if (!seconds) return ''
  const diff = Date.now() / 1000 - seconds
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function SocialMediaManagerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [queue, setQueue] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getSocialAccounts(user.uid).then(setAccounts).catch(() => setAccounts({}))
    getContentItems(user.uid)
      .then(items => setQueue(items.filter(i => ['scheduled', 'published'].includes(i.status) && i.platform).slice(0, 8)))
      .catch(() => setQueue([]))
  }, [user?.uid])

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Describe what you want to post about first.'); return }
    setError('')
    setLoading(true)
    try {
      const r = await generatePostDraft(prompt)
      setDraft(r)
    } catch (e) {
      setError(e.message || 'Generation failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Social Media Manager"
          subtitle="Workspace: Dynamic Multi-Channel Publication Studio"
          pillLabel="Publication Studio Ready"
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── AI Quick Composer ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>AI Quick Composer</div>
            <textarea
              value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="What should your AI CMO draft today? (e.g., 'A professional post about Evoke 2.0 release for LinkedIn')"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 13, fontFamily: "'Geist','Inter',sans-serif", outline: 'none', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: TEXT3 }}>Tone: Executive &nbsp;|&nbsp; Uses your Brand Profile automatically</span>
              <button onClick={handleGenerate} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: GOLD, border: 'none',
                borderRadius: 8, color: '#0A0A0F', fontSize: 12, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
                fontFamily: "'Outfit','Inter',sans-serif", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={13} /> Generate Post Draft</>}
              </button>
            </div>
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>{error}</div>}
            {draft && (
              <div style={{ marginTop: 14, background: CARD2, border: `1px solid ${GBORD}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, marginBottom: 8 }}>{draft.caption}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(draft.hashtags || []).map(h => (
                    <span key={h} style={{ fontSize: 11, color: GOLD, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 100, padding: '3px 10px' }}>#{h.replace(/^#/, '')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Platform connection cards (real status — no fabricated follower counts) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {PLATFORMS.map(p => {
              const Icon = p.icon
              const connected = !!accounts?.[p.key]?.connected
              return (
                <div key={p.key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {p.label}</span>
                    <ExternalLink size={12} color={TEXT3} style={{ cursor: 'pointer' }} onClick={() => navigate('/connect-accounts')} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: connected ? GREEN : TEXT3, fontFamily: "'Outfit','Inter',sans-serif" }}>
                    {accounts === null ? '—' : connected ? 'Connected' : 'Not Connected'}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>{connected ? accounts[p.key].pageName || accounts[p.key].username || accounts[p.key].name || 'Account linked' : 'Connect in Integrations'}</div>
                </div>
              )
            })}
          </div>

          {/* ── Live Outbound Queue & Metrics ── */}
          <div>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Live Outbound Queue &amp; Metrics</div>
            {queue === null ? (
              <div style={{ fontSize: 13, color: TEXT3 }}>Loading…</div>
            ) : queue.length === 0 ? (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28, textAlign: 'center', color: TEXT3, fontSize: 13 }}>
                No scheduled or published posts yet — draft one above, or check the Approval Queue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queue.map(item => (
                  <div key={item.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text || '(no caption)'}</div>
                      <div style={{ fontSize: 11, color: TEXT3, marginTop: 3, textTransform: 'capitalize' }}>{item.platform} · {timeAgo(item.createdAt?.seconds)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.status === 'published' ? GREEN : GOLD, background: item.status === 'published' ? 'rgba(16,185,129,0.1)' : GDIM, border: `1px solid ${item.status === 'published' ? 'rgba(16,185,129,0.3)' : GBORD}`, borderRadius: 100, padding: '3px 10px', textTransform: 'capitalize', flexShrink: 0 }}>{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
