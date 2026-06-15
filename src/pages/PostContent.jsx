import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Check, Loader2, AlertCircle,
  Linkedin, Facebook, Instagram, CheckCircle2, X, Sparkles, RefreshCw, Image, Mail,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser } from '../services/userService'
import { saveContentItems } from '../services/contentService'
import { WEBHOOK_URL, AGENT_WEBHOOK_URL } from '../config.js'

const BG = '#0e0c09'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'

const PLATFORM_META = {
  linkedin:  { label: 'LinkedIn',    color: '#0a66c2', icon: <Linkedin size={18} /> },
  instagram: { label: 'Instagram',   color: '#dd2a7b', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="ig2" x1="0" y1="24" x2="24" y2="0">
        <stop offset="0%" stopColor="#f58529"/><stop offset="50%" stopColor="#dd2a7b"/><stop offset="100%" stopColor="#8134af"/>
      </linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig2)" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4" stroke="url(#ig2)" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b"/>
    </svg>
  )},
  facebook:  { label: 'Facebook',    color: '#1877f2', icon: <Facebook size={18} /> },
  twitter:   { label: 'X / Twitter', color: '#000000', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.625L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  )},
  tiktok: { label: 'TikTok', color: '#ff0050', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  )},
  gmail: { label: 'Gmail Invitation', color: '#ea4335', icon: <Mail size={18} /> },
}

export default function PostContent() {
  const navigate = useNavigate()
  const { state: navState } = useLocation()
  const { user: evokeUser } = useAuth()

  const mediaUrl   = navState?.mediaUrl   || ''
  const mediaType  = navState?.mediaType  || 'video'
  const toolTitle  = navState?.toolTitle  || 'Generated Content'
  const toolColor  = navState?.toolColor  || '#c8973e'
  const productName = navState?.productName || ''
  const productContext = navState?.productContext || ''
  const fromPath   = navState?.from || '/package-a'
  const captionPrefill = navState?.captionPrefill || ''
  const platformPrefill = navState?.platform || ''

  const [accounts, setAccounts]         = useState({})
  const [caption, setCaption]           = useState(
    captionPrefill || (productName ? `Check out our latest ${productName}! 🚀\n\n#marketing #product #evokecmo` : '')
  )
  const [selectedPlatforms, setSelected] = useState(platformPrefill ? [platformPrefill] : [])
  const [posting, setPosting]           = useState(false)
  const [posted, setPosted]             = useState(false)
  const [error, setError]               = useState('')
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [topic, setTopic]               = useState(
    productName
      ? `Announcing our ${productName} with a new product showcase video.${productContext ? ' ' + productContext + '.' : ''} Highlight the key benefits and include a CTA.`
      : ''
  )
  const [generating, setGenerating]     = useState(false)
  const [genError, setGenError]         = useState('')
  const [generatedImage, setGeneratedImage] = useState(mediaType === 'image' ? (mediaUrl || '') : '')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError]     = useState('')
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubject, setEmailSubject] = useState(
    productName ? `You're invited: ${productName}` : ''
  )

  useEffect(() => {
    if (!evokeUser) return
    getOrCreateUser(evokeUser.uid, evokeUser.displayName, evokeUser.email)
      .then(data => {
        setAccounts(data.socialAccounts || {})
        setLoadingAccounts(false)
      })
      .catch(() => setLoadingAccounts(false))
  }, [evokeUser])

  const connectedPlatforms = Object.entries(accounts)
    .filter(([, v]) => v?.connected)
    .map(([k]) => k)
    .filter(k => PLATFORM_META[k])

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const generateContent = async () => {
    if (!topic.trim()) { setGenError('Enter a topic or brief first.'); return }
    setGenError('')
    setGenerating(true)
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY
      if (!groqKey) throw new Error('VITE_GROQ_API_KEY not set in .env')
      const platform = selectedPlatforms[0] || connectedPlatforms[0] || 'linkedin'
      const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a professional social media content writer specialising in ${platformLabel}. Write engaging, concise posts that drive likes and comments. Use relevant emojis and hashtags. The post will be published with the product image or video already attached — never include [link] placeholders, URLs, or phrases like "watch the video here". Return only the post text — no explanations, no preamble.`,
            },
            {
              role: 'user',
              content: `Write a compelling ${platformLabel} post about: ${topic.trim()}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.8,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `Groq returned ${res.status}`)
      }
      const data = await res.json()
      const generated = data.choices?.[0]?.message?.content?.trim() || ''
      if (!generated) throw new Error('Empty response from Groq. Try again.')
      setCaption(generated)
    } catch (e) {
      setGenError('Generation failed: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  // Auto-generate post copy about the product when arriving from a media tool
  const autoGenRan = useRef(false)
  useEffect(() => {
    if (autoGenRan.current) return
    if (mediaUrl && topic.trim() && import.meta.env.VITE_GROQ_API_KEY) {
      autoGenRan.current = true
      generateContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateImage = () => {
    if (!topic.trim()) { setImageError('Enter a topic first so we know what to illustrate.'); return }
    setImageError('')
    setGeneratingImage(true)
    setGeneratedImage('')
    const prompt = encodeURIComponent(`${topic.trim()}, professional product marketing photo, high quality, vibrant, studio lighting`)
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=800&nologo=true&seed=${Date.now()}`
    const img = new window.Image()
    const timer = setTimeout(() => {
      img.src = ''
      setGeneratingImage(false)
      setImageError('Timed out after 60s. Try again.')
    }, 60000)
    img.onload = () => {
      clearTimeout(timer)
      setGeneratedImage(url)
      setGeneratingImage(false)
    }
    img.onerror = () => {
      clearTimeout(timer)
      setGeneratingImage(false)
      setImageError('Image generation failed. Try again.')
    }
    img.src = url
  }

  const handlePost = async () => {
    if (!caption.trim()) { setError('Please write a caption before posting.'); return }
    if (selectedPlatforms.length === 0) { setError('Select at least one platform to post to.'); return }
    if (selectedPlatforms.includes('gmail') && !emailRecipients.trim()) {
      setError('Enter at least one recipient email for the Gmail invitation.'); return
    }
    setError('')
    setPosting(true)

    try {
      const creds = {}
      selectedPlatforms.forEach(p => { creds[p] = accounts[p] })

      const isVideo = mediaType === 'video' && mediaUrl
      const finalMediaUrl = isVideo ? mediaUrl : (generatedImage || mediaUrl)
      const finalMediaType = isVideo ? 'video' : (finalMediaUrl ? 'image' : mediaType)
      const payload = {
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType,
        caption,
        platforms: selectedPlatforms.join(','),
        userCredentials: creds,
        linkedinPost: caption,
        instagramCaption: caption,
        facebookPost: caption,
        imageUrl: finalMediaType === 'image' ? finalMediaUrl : '',
        videoUrl: finalMediaType === 'video' ? finalMediaUrl : '',
        name: productName || toolTitle,
        source: 'post-content',
        emailRecipients: selectedPlatforms.includes('gmail') ? emailRecipients.trim() : '',
        emailSubject: emailSubject.trim(),
        emailBody: caption,
      }

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Post failed: ' + res.status)
      setPosted(true)

      // ── Record published items in the Firestore content library ──
      if (evokeUser) {
        const items = selectedPlatforms.map(p => ({
          key: p,
          type: p === 'gmail' ? 'email' : 'post',
          platform: p,
          text: caption,
          subject: p === 'gmail' ? emailSubject.trim() : '',
          imageUrl: finalMediaType === 'image' ? finalMediaUrl : '',
          videoUrl: finalMediaType === 'video' ? finalMediaUrl : '',
        }))
        saveContentItems(evokeUser.uid, {
          campaignId: Date.now().toString(),
          name: productName || toolTitle,
          type: 'post-content',
          source: 'post-content',
        }, items, 'published').catch(err => console.warn('Failed to save to content library:', err))
      }
    } catch (e) {
      setError('Failed to post: ' + e.message)
    } finally {
      setPosting(false)
    }
  }

  if (posted) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={40} color="#10b981" />
            </div>
          </motion.div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Content Posted!</h2>
          <p style={{ color: TEXT2, marginBottom: 8 }}>
            Your content has been sent to {selectedPlatforms.map(p => PLATFORM_META[p]?.label).join(', ')}.
          </p>
          <p style={{ color: TEXT3, fontSize: 13, marginBottom: 36 }}>
            It may take a few moments to appear on your social media pages.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate(fromPath)}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 12, color: '#0e0c09', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Tools
            </button>
            <button
              onClick={() => { setPosted(false); setSelected([]) }}
              style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: TEXT, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Post Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT2, fontSize: 14, cursor: 'pointer', marginBottom: 32, padding: 0 }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', background: `${toolColor}15`, border: `1px solid ${toolColor}35`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: toolColor, letterSpacing: '0.08em', marginBottom: 12 }}>
            REVIEW & POST
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: 8 }}>
            Review & Post Content
          </h1>
          <p style={{ color: TEXT2, fontSize: 14 }}>
            Check your content, write a caption, select platforms and post.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 28, alignItems: 'start' }}>

          {/* LEFT — AI Generate + Caption */}
          <div>

            {/* AI Generation Box */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(200,151,62,0.08),rgba(200,151,62,0.04))',
              border: '1px solid rgba(200,151,62,0.25)', borderRadius: 16, padding: 20, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={15} color="#c8973e" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#c8973e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Generate Content with AI
                </span>
              </div>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder={`What do you want to post about?\n\nE.g. "Launching our new product, highlight the key benefits and include a CTA"`}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(200,151,62,0.2)',
                  borderRadius: 10, color: TEXT, fontSize: 13, lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', fontFamily: "'Inter',sans-serif",
                  marginBottom: 10,
                }}
              />
              {genError && (
                <p style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{genError}</p>
              )}
              {imageError && (
                <p style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{imageError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={generateContent}
                  disabled={generating || !topic.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    background: generating || !topic.trim() ? 'rgba(200,151,62,0.25)' : 'linear-gradient(135deg,#d4a853,#b8803a)',
                    border: 'none', borderRadius: 10,
                    color: generating || !topic.trim() ? 'rgba(200,151,62,0.5)' : '#0e0c09',
                    fontSize: 13, fontWeight: 700, cursor: generating ? 'wait' : !topic.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : <><Sparkles size={14} /> Generate Post</>
                  }
                </button>

                <button
                  onClick={generateImage}
                  disabled={generatingImage || !topic.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    background: generatingImage || !topic.trim() ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.85)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: 10,
                    color: generatingImage || !topic.trim() ? 'rgba(167,139,250,0.5)' : '#fff',
                    fontSize: 13, fontWeight: 700, cursor: generatingImage ? 'wait' : !topic.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generatingImage
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating Image…</>
                    : <><Image size={14} /> Generate Image</>
                  }
                </button>
              </div>
            </div>

            {/* Incoming video preview */}
            {mediaType === 'video' && mediaUrl && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Video Preview
                </p>
                <video
                  src={mediaUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(200,151,62,0.3)', background: '#000' }}
                />
              </div>
            )}

            {/* Generated image preview */}
            {generatedImage && (
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Image Preview
                  </p>
                  <button
                    onClick={() => setGeneratedImage('')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', padding: 0 }}
                  >
                    <X size={10} /> Remove
                  </button>
                </div>
                {generatingImage && (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(167,139,250,0.7)', fontSize: 13 }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Generating image… this takes ~20 seconds
                  </div>
                )}
                <img
                  src={generatedImage}
                  alt="Generated"
                  onLoad={() => setGeneratingImage(false)}
                  onError={() => { setGeneratingImage(false); setImageError('Image generation failed. Try again.'); setGeneratedImage('') }}
                  style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(139,92,246,0.3)', objectFit: 'cover', maxHeight: 320, display: generatingImage ? 'none' : 'block' }}
                />
                <button
                  onClick={generateImage}
                  disabled={generatingImage}
                  style={{
                    position: 'absolute', bottom: 10, right: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>
            )}

            {/* Caption */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Post Copy
                </label>
                {caption && (
                  <button
                    onClick={() => setCaption('')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: TEXT3, fontSize: 11, cursor: 'pointer', padding: 0 }}
                  >
                    <RefreshCw size={10} /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={7}
                placeholder="AI-generated content will appear here, or write your own..."
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                  background: caption ? 'rgba(200,151,62,0.05)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${caption ? 'rgba(200,151,62,0.2)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, color: TEXT, fontSize: 13, lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', fontFamily: "'Inter',sans-serif",
                  transition: 'all 0.3s',
                }}
              />
              <p style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>{caption.length} characters</p>
            </div>
          </div>

          {/* RIGHT — Platform Selection + Post */}
          <div style={{ position: 'sticky', top: 100 }}>

            {/* Connected Platforms */}
            <div style={{ background: '#1c1a13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                Select Platforms to Post
              </p>

              {loadingAccounts ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT3, fontSize: 13 }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading accounts...
                </div>
              ) : connectedPlatforms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ color: TEXT2, fontSize: 13, marginBottom: 12 }}>No social accounts connected yet.</p>
                  <button
                    onClick={() => navigate('/connect-accounts', { state: { from: '/post-content' } })}
                    style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Connect Accounts
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {connectedPlatforms.map(key => {
                    const meta = PLATFORM_META[key]
                    const selected = selectedPlatforms.includes(key)
                    const acct = accounts[key]
                    const label = acct?.name || acct?.pageName || acct?.username || acct?.email || 'Connected'

                    return (
                      <motion.button
                        key={key}
                        onClick={() => toggle(key)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          background: selected ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selected ? meta.color + '50' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ color: meta.color, flexShrink: 0 }}>{meta.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{meta.label}</div>
                          <div style={{ fontSize: 11, color: TEXT3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: selected ? meta.color : 'rgba(255,255,255,0.08)',
                          border: `2px solid ${selected ? meta.color : 'rgba(255,255,255,0.15)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={11} color="#fff" />}
                        </div>
                      </motion.button>
                    )
                  })}

                  {/* Select all / none */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => setSelected(connectedPlatforms)} style={{ flex: 1, padding: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: TEXT2, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      Select All
                    </button>
                    <button onClick={() => setSelected([])} style={{ flex: 1, padding: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: TEXT2, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gmail invitation details */}
            {selectedPlatforms.includes('gmail') && (
              <div style={{ background: '#1c1a13', border: '1px solid rgba(234,67,53,0.25)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#ea4335', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={12} /> Email Invitation Details
                </p>
                <label style={{ display: 'block', fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Recipients <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={e => setEmailRecipients(e.target.value)}
                  placeholder="friend@gmail.com, client@company.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", marginBottom: 12 }}
                />
                <label style={{ display: 'block', fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="You're invited to check out our new product"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif" }}
                />
                <p style={{ fontSize: 11, color: TEXT3, marginTop: 8, lineHeight: 1.5 }}>
                  Your caption becomes the email body, with the video link included automatically.
                </p>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', gap: 8, padding: '11px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 12 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: TEXT3 }}><X size={12}/></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post Button */}
            <button
              onClick={handlePost}
              disabled={posting || selectedPlatforms.length === 0 || !caption.trim()}
              style={{
                width: '100%', padding: '14px',
                background: (posting || selectedPlatforms.length === 0 || !caption.trim())
                  ? 'rgba(200,151,62,0.3)'
                  : 'linear-gradient(135deg,#d4a853,#b8803a)',
                border: 'none', borderRadius: 12, color: '#0e0c09',
                fontSize: 15, fontWeight: 800, cursor: posting ? 'wait' : selectedPlatforms.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {posting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Posting...</>
                : <><Send size={16} /> Post Now{selectedPlatforms.length > 0 ? ` to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}` : ''}</>
              }
            </button>

            <p style={{ fontSize: 11, color: TEXT3, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Content will be published immediately to your connected accounts via n8n automation.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
