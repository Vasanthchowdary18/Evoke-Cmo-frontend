import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, MessageSquare, Linkedin, Phone, Target,
  Search, Calendar, Megaphone, Copy, Check,
  ArrowLeft, Zap, AlertCircle, RefreshCw, Send,
  CheckCircle2, Instagram, Facebook, ExternalLink, Loader2, RotateCcw
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { WEBHOOK_URL } from '../config.js'

// ─── Posting status platforms ─────────────────────────────────────────────────
const PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',      icon: <Linkedin size={15} />,   color: '#0a66c2', desc: 'Posted to LinkedIn'     },
  { key: 'instagram', label: 'Instagram',     icon: <Instagram size={15} />,  color: '#e1306c', desc: 'Posted to Instagram'    },
  { key: 'facebook',  label: 'Facebook',      icon: <Facebook size={15} />,   color: '#1877f2', desc: 'Posted to Facebook'     },
  { key: 'email',     label: 'Email',         icon: <Mail size={15} />,       color: '#7c3aed', desc: 'Sent to contact'        },
  { key: 'sheets',    label: 'Google Sheets', icon: <Send size={15} />,       color: '#34a853', desc: 'Logged to Sheets'       },
]

// Helper to copy text
function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {
      // fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copied, copy }
}

function CopyButton({ text, id, copied, copy }) {
  const isCopied = copied === id
  return (
    <motion.button
      onClick={() => copy(text, id)}
      className="btn-ghost"
      style={{ padding: '7px 14px', fontSize: '12px' }}
      whileTap={{ scale: 0.95 }}
    >
      {isCopied ? (
        <>
          <Check size={12} style={{ color: '#4ade80' }} />
          <span style={{ color: '#4ade80' }}>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </motion.button>
  )
}

function ResultCard({ icon, title, color, children, copyText, copyId, copied, copy, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}>
            {icon}
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{title}</span>
        </div>
        {copyText && (
          <CopyButton text={copyText} id={copyId} copied={copied} copy={copy} />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </motion.div>
  )
}

function ContentText({ value, fallback = 'Not provided' }) {
  if (!value) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', fontStyle: 'italic' }}>{fallback}</p>
  return (
    <p style={{
      color: 'rgba(255,255,255,0.75)',
      fontSize: '14px',
      lineHeight: 1.75,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {value}
    </p>
  )
}

function FieldRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {value}
      </p>
    </div>
  )
}

// Parse 7-day calendar from string
function parseCalendar(calText) {
  if (!calText) return []
  if (typeof calText === 'object') return Object.entries(calText).map(([k, v]) => ({ day: k, content: v }))

  const lines = calText.split('\n').filter(l => l.trim())
  const days = []
  let current = null

  for (const line of lines) {
    const dayMatch = line.match(/^(?:day\s*)?(\d+)[:\.\-\s]/i)
    if (dayMatch) {
      if (current) days.push(current)
      current = { day: `Day ${dayMatch[1]}`, content: line.replace(/^(?:day\s*)?\d+[:\.\-\s]*/i, '').trim() }
    } else if (current) {
      current.content += '\n' + line.trim()
    }
  }
  if (current) days.push(current)
  if (days.length === 0 && calText.trim()) {
    return [{ day: 'Calendar', content: calText }]
  }
  return days
}

// Flatten nested response
function flattenResult(data) {
  if (!data) return {}
  // Handle if data has a nested output key
  if (data.output) return flattenResult(data.output)
  if (data.result) return flattenResult(data.result)
  if (Array.isArray(data) && data.length > 0) return flattenResult(data[0])
  return data
}

const dayColors = ['#7c3aed', '#8b5cf6', '#a855f7', '#06b6d4', '#0891b2', '#0e7490', '#7c3aed']

// ─── Platform content previews ────────────────────────────────────────────────
const PLATFORM_CONTENT = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin size={16} />,
    color: '#0a66c2',
    getContent: (r) => r.linkedinPost,
    previewBg: 'rgba(10,102,194,0.06)',
    previewBorder: 'rgba(10,102,194,0.2)',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram size={16} />,
    color: '#e1306c',
    getContent: (r) => r.instagramCaption,
    previewBg: 'rgba(225,48,108,0.06)',
    previewBorder: 'rgba(225,48,108,0.2)',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <Facebook size={16} />,
    color: '#1877f2',
    getContent: (r) => r.facebookPost,
    previewBg: 'rgba(24,119,242,0.06)',
    previewBorder: 'rgba(24,119,242,0.2)',
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail size={16} />,
    color: '#7c3aed',
    getContent: (r) => r.emailBody,
    previewBg: 'rgba(124,58,237,0.06)',
    previewBorder: 'rgba(124,58,237,0.2)',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare size={16} />,
    color: '#25d366',
    getContent: (r) => r.whatsappMessage,
    previewBg: 'rgba(37,211,102,0.06)',
    previewBorder: 'rgba(37,211,102,0.2)',
  },
]

function PostingStatusBanner({ r }) {
  const postDate = r.postDate || ''
  const postTime = r.postTime || '09:00'
  const [expanded, setExpanded] = useState(null)
  const [webhookStatus, setWebhookStatus] = useState(
    () => sessionStorage.getItem('webhookStatus') || 'pending'
  )
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    const raw = sessionStorage.getItem('webhookPayload')
    if (!raw) return
    setRetrying(true)
    setWebhookStatus('pending')
    try {
      const res = await Promise.race([
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: raw,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
      ])
      const status = res.ok ? 'success' : 'failed'
      setWebhookStatus(status)
      sessionStorage.setItem('webhookStatus', status)
    } catch {
      setWebhookStatus('failed')
      sessionStorage.setItem('webhookStatus', 'failed')
    } finally {
      setRetrying(false)
    }
  }

  const isPosted = webhookStatus === 'success'
  const isFailed = webhookStatus === 'failed'
  const isPending = webhookStatus === 'pending'

  const scheduleLabel = postDate ? `${postDate} at ${postTime}` : 'now'

  const bannerBg = isPosted
    ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.07))'
    : isFailed
    ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
    : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(6,182,212,0.06))'

  const bannerBorder = isPosted
    ? 'rgba(34,197,94,0.25)'
    : isFailed
    ? 'rgba(239,68,68,0.25)'
    : 'rgba(245,158,11,0.25)'

  const statusColor = isPosted ? '#4ade80' : isFailed ? '#f87171' : '#f59e0b'

  const statusTitle = isPosted
    ? 'Campaign sent — posting to all platforms now!'
    : isFailed
    ? 'Could not reach n8n — posting failed'
    : 'Sending campaign to n8n pipeline…'

  const statusSub = isPosted
    ? `n8n received your campaign and is posting to LinkedIn, Instagram, Facebook, Email & WhatsApp`
    : isFailed
    ? 'Make sure your n8n workflow is Active (toggled ON), then click Retry.'
    : 'Connecting to n8n… this takes a few seconds'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{ marginBottom: '28px' }}
    >
      {/* Status header */}
      <div style={{
        background: bannerBg,
        border: `1px solid ${bannerBorder}`,
        borderRadius: '16px',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPending || retrying
              ? <Loader2 size={20} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
              : <CheckCircle2 size={20} style={{ color: statusColor }} />
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: statusColor }}>
                {statusTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {statusSub}
              </div>
            </div>
          </div>
          {isFailed && !retrying && (
            <button
              onClick={handleRetry}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} /> Retry Posting
            </button>
          )}
          {!isPosted && !isFailed && (
            <span style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.45)',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap',
            }}>
              🕐 {scheduleLabel}
            </span>
          )}
        </div>

        {/* Platform chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px',
                background: `${p.color}14`,
                border: `1px solid ${isPosted ? p.color + '55' : p.color + '30'}`,
                borderRadius: '10px',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: isPosted ? '#4ade80' : isFailed ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                  {isPosted ? 'Posting now via n8n' : isFailed ? 'Failed' : 'Connecting…'}
                </div>
              </div>
              {isPosted
                ? <Check size={13} style={{ color: '#4ade80', marginLeft: '2px' }} />
                : isFailed
                ? <span style={{ fontSize: 11, marginLeft: 2, color: '#f87171' }}>✕</span>
                : <span style={{ fontSize: 11, marginLeft: 2, color: '#f59e0b' }}>⏳</span>
              }
            </motion.div>
          ))}
        </div>
      </div>

      {/* Per-platform content previews */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>
          {isPosted ? 'What was posted to each platform' : 'Content queued for each platform'}
        </div>
        {PLATFORM_CONTENT.map((p, i) => {
          const content = p.getContent(r)
          if (!content) return null
          const isOpen = expanded === p.key
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              style={{
                background: p.previewBg,
                border: `1px solid ${isPosted ? p.previewBorder : isFailed ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.3s',
              }}
            >
              {/* Platform header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : p.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '9px', background: `${p.color}20`, border: `1px solid ${p.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                    {p.icon}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{p.label}</div>
                    <div style={{ fontSize: '11px', color: isPosted ? '#4ade80' : isFailed ? '#f87171' : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isPosted ? <><Check size={10} /> Posting via n8n</> : isFailed ? '✕ Failed' : '⏳ Connecting…'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>
                    {isOpen ? 'Hide' : 'Preview'}
                  </span>
                </div>
              </button>

              {/* Expandable content preview */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* Image preview if available */}
                      {r.imageUrl && (p.key === 'linkedin' || p.key === 'instagram' || p.key === 'facebook') && (
                        <img
                          src={r.imageUrl}
                          alt="Campaign visual"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '10px', marginBottom: '12px', border: `1px solid ${p.color}25` }}
                        />
                      )}
                      <div style={{
                        background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '14px',
                        fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        maxHeight: '200px', overflowY: 'auto',
                      }}>
                        {content}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { copied, copy } = useCopy()
  const [result, setResult] = useState(null)
  const [campaignType, setCampaignType] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('campaignResult')
    const type = sessionStorage.getItem('campaignType') || ''
    setCampaignType(type)

    if (!raw) {
      setError('No campaign results found. Please submit a campaign form first.')
      return
    }
    try {
      const parsed = JSON.parse(raw)
      const flat = flattenResult(parsed)

      // Check for API/AI error — if error field exists and no campaign content
      const hasContent = flat.emailSubject || flat.emailBody || flat.linkedinPost ||
        flat.instagramCaption || flat.facebookPost || flat.whatsappMessage ||
        flat.smsMessage || flat.seoTitle || flat.adHeadline || flat.campaignCalendar
      if (!hasContent && flat.error) {
        setError(flat.error)
        return
      }

      setResult(flat)
    } catch (e) {
      setError('Failed to parse campaign results.')
    }
  }, [])

  const handleNewCampaign = () => {
    sessionStorage.removeItem('campaignResult')
    sessionStorage.removeItem('campaignType')
    sessionStorage.removeItem('campaignMeta')
    sessionStorage.removeItem('webhookStatus')
    sessionStorage.removeItem('webhookPayload')
    navigate('/dashboard')
  }

  if (error) {
    const isRateLimit = error.toLowerCase().includes('too many requests') || error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('quota')
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: 480, position: 'relative', zIndex: 1 }}
        >
          <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <AlertCircle size={28} style={{ color: '#f87171' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {isRateLimit ? 'AI Rate Limit Reached' : 'Campaign Generation Failed'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontSize: '15px', lineHeight: 1.65 }}>
            {isRateLimit
              ? 'The Gemini AI service is temporarily busy. This usually resolves in 30–60 seconds.'
              : error}
          </p>
          {isRateLimit && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '28px' }}>
              Free tier has limited requests per minute. Wait a moment and try again.
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => navigate(-1)}
              style={{ fontSize: '14px', padding: '11px 24px' }}
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/dashboard')}
              style={{ fontSize: '14px' }}
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!result) return null

  // Extract fields from result
  const r = result
  const emailSubject       = r.emailSubject       || r.email_subject  || r['Email Subject']          || ''
  const emailBody          = r.emailBody          || r.email_body     || r['Email Body']              || r.email || ''
  const linkedinPost       = r.linkedinPost       || r.linkedin_post  || r['LinkedIn Post']           || r.linkedin || ''
  const instagramCaption   = r.instagramCaption   || r.instagram_caption || r['Instagram Caption']    || r.instagram || ''
  const facebookPost       = r.facebookPost       || r.facebook_post  || r['Facebook Post']           || r.facebook || ''
  const whatsappMessage    = r.whatsappMessage    || r.whatsapp_message || r['WhatsApp Message']      || r.whatsapp || ''
  const smsMessage         = r.smsMessage         || r.sms_message    || r['SMS Message']             || r.sms || ''
  const positioningStatement = r.positioningStatement || r.positioning_statement || r['Positioning Statement'] || r.positioning || ''
  const seoTitle           = r.seoTitle           || r.seo_title      || r['SEO Title']               || ''
  const seoDescription     = r.seoDescription     || r.seo_description || r['SEO Meta Description']  || r.metaDescription || r.seo || ''
  const campaignCalendar   = r.campaignCalendar   || r.campaign_calendar || r['7-Day Calendar']       || r.calendar || r['Campaign Calendar'] || ''
  const adHeadline         = r.adHeadline         || r.ad_headline    || r['Ad Headline']             || ''
  const adBody             = r.adBody             || r.ad_body        || r['Ad Body']                 || r.ad || ''
  const imageUrl           = r.imageUrl           || r.image_url      || r['Image URL']               || ''

  const calendarDays = parseCalendar(campaignCalendar)
  const hasAnyCampaignContent = !!(emailSubject || emailBody || linkedinPost || instagramCaption || facebookPost || whatsappMessage || smsMessage || seoTitle || adHeadline || calendarDays.length)

  // Build full text for download
  const fullText = [
    emailSubject        && `EMAIL SUBJECT:\n${emailSubject}`,
    emailBody           && `EMAIL BODY:\n${emailBody}`,
    linkedinPost        && `LINKEDIN POST:\n${linkedinPost}`,
    instagramCaption    && `INSTAGRAM CAPTION:\n${instagramCaption}`,
    facebookPost        && `FACEBOOK POST:\n${facebookPost}`,
    whatsappMessage     && `WHATSAPP MESSAGE:\n${whatsappMessage}`,
    smsMessage          && `SMS MESSAGE:\n${smsMessage}`,
    positioningStatement && `POSITIONING STATEMENT:\n${positioningStatement}`,
    seoTitle            && `SEO TITLE:\n${seoTitle}`,
    seoDescription      && `SEO META DESCRIPTION:\n${seoDescription}`,
    adHeadline          && `AD HEADLINE:\n${adHeadline}`,
    adBody              && `AD BODY:\n${adBody}`,
    campaignCalendar    && `7-DAY CAMPAIGN CALENDAR:\n${campaignCalendar}`,
  ].filter(Boolean).join('\n\n---\n\n')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <Navbar />

      <div className="glow-orb glow-purple" style={{ width: 400, height: 400, top: 0, right: 0, opacity: 0.12 }} />
      <div className="glow-orb glow-cyan" style={{ width: 350, height: 350, bottom: '20%', left: 0, opacity: 0.1 }} />

      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '108px 24px 80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost"
            style={{ marginBottom: '24px' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="badge" style={{ marginBottom: '12px', display: 'inline-flex' }}>
                <Zap size={13} />
                Campaign Generated
              </div>
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                marginBottom: '8px',
              }}>
                Your{' '}
                <span className="gradient-text">Campaign is Ready</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
                Your AI CMO has generated a complete multi-channel campaign package below.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-ghost"
                onClick={() => copy(fullText, 'all')}
                style={{ fontSize: '14px' }}
              >
                {copied === 'all' ? <><Check size={14} style={{ color: '#4ade80' }} /><span style={{ color: '#4ade80' }}>Copied All</span></> : <><Copy size={14} /> Copy All</>}
              </button>
              <button
                className="btn-primary"
                onClick={handleNewCampaign}
                style={{ fontSize: '14px', padding: '10px 20px' }}
              >
                <RefreshCw size={14} /> New Campaign
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Social Media Posting Status Banner ── */}
        {hasAnyCampaignContent && <PostingStatusBanner r={r} />}

        {/* Generated Image */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
          >
            <img src={imageUrl} alt="Campaign visual" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>AI-Generated Campaign Visual</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '10px' }}>Created by DALL·E 3 based on your campaign</p>
              <a href={imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                View Full Image ↗
              </a>
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email */}
          {(emailSubject || emailBody) && (
            <ResultCard
              icon={<Mail size={16} />}
              title="Email Campaign"
              color="#7c3aed"
              copyText={[emailSubject && `Subject: ${emailSubject}`, emailBody].filter(Boolean).join('\n\n')}
              copyId="email"
              copied={copied}
              copy={copy}
              delay={0.05}
            >
              <FieldRow label="Subject Line" value={emailSubject} />
              <FieldRow label="Email Body" value={emailBody} />
            </ResultCard>
          )}

          {/* LinkedIn */}
          {linkedinPost && (
            <ResultCard
              icon={<Linkedin size={16} />}
              title="LinkedIn Post"
              color="#0a66c2"
              copyText={linkedinPost}
              copyId="linkedin"
              copied={copied}
              copy={copy}
              delay={0.1}
            >
              <ContentText value={linkedinPost} />
            </ResultCard>
          )}

          {/* Instagram */}
          {instagramCaption && (
            <ResultCard
              icon={<Instagram size={16} />}
              title="Instagram Caption"
              color="#e1306c"
              copyText={instagramCaption}
              copyId="instagram"
              copied={copied}
              copy={copy}
              delay={0.13}
            >
              <ContentText value={instagramCaption} />
            </ResultCard>
          )}

          {/* Facebook */}
          {facebookPost && (
            <ResultCard
              icon={<Facebook size={16} />}
              title="Facebook Post"
              color="#1877f2"
              copyText={facebookPost}
              copyId="facebook"
              copied={copied}
              copy={copy}
              delay={0.16}
            >
              <ContentText value={facebookPost} />
            </ResultCard>
          )}

          {/* WhatsApp */}
          {whatsappMessage && (
            <ResultCard
              icon={<MessageSquare size={16} />}
              title="WhatsApp Message"
              color="#25d366"
              copyText={whatsappMessage}
              copyId="whatsapp"
              copied={copied}
              copy={copy}
              delay={0.15}
            >
              <ContentText value={whatsappMessage} />
            </ResultCard>
          )}

          {/* SMS */}
          {smsMessage && (
            <ResultCard
              icon={<Phone size={16} />}
              title="SMS Message"
              color="#06b6d4"
              copyText={smsMessage}
              copyId="sms"
              copied={copied}
              copy={copy}
              delay={0.2}
            >
              <ContentText value={smsMessage} />
            </ResultCard>
          )}

          {/* Positioning */}
          {positioningStatement && (
            <ResultCard
              icon={<Target size={16} />}
              title="Positioning Statement"
              color="#a855f7"
              copyText={positioningStatement}
              copyId="positioning"
              copied={copied}
              copy={copy}
              delay={0.25}
            >
              <ContentText value={positioningStatement} />
            </ResultCard>
          )}

          {/* SEO */}
          {(seoTitle || seoDescription) && (
            <ResultCard
              icon={<Search size={16} />}
              title="SEO Content"
              color="#f59e0b"
              copyText={[seoTitle && `Title: ${seoTitle}`, seoDescription && `Description: ${seoDescription}`].filter(Boolean).join('\n\n')}
              copyId="seo"
              copied={copied}
              copy={copy}
              delay={0.3}
            >
              <FieldRow label="SEO Title" value={seoTitle} />
              <FieldRow label="Meta Description" value={seoDescription} />
            </ResultCard>
          )}

          {/* Ad Copy */}
          {(adHeadline || adBody) && (
            <ResultCard
              icon={<Megaphone size={16} />}
              title="Ad Copy"
              color="#ec4899"
              copyText={[adHeadline && `Headline: ${adHeadline}`, adBody].filter(Boolean).join('\n\n')}
              copyId="ad"
              copied={copied}
              copy={copy}
              delay={0.35}
            >
              <FieldRow label="Headline" value={adHeadline} />
              <FieldRow label="Ad Body" value={adBody} />
            </ResultCard>
          )}

          {/* 7-Day Calendar */}
          {calendarDays.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '9px',
                    background: 'rgba(124,58,237,0.18)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7c3aed',
                  }}>
                    <Calendar size={16} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>7-Day Campaign Calendar</span>
                </div>
                <CopyButton text={campaignCalendar} id="calendar" copied={copied} copy={copy} />
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {calendarDays.map((day, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.025)',
                      border: `1px solid ${dayColors[idx % 7]}25`,
                      borderLeft: `3px solid ${dayColors[idx % 7]}`,
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{
                      minWidth: 64,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: dayColors[idx % 7],
                      paddingTop: '2px',
                    }}>
                      {day.day}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.65, flex: 1, whiteSpace: 'pre-wrap' }}>
                      {day.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No content fallback */}
          {!emailSubject && !emailBody && !linkedinPost && !instagramCaption && !facebookPost && !whatsappMessage && !smsMessage && !positioningStatement && !seoTitle && !adHeadline && calendarDays.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}
            >
              <AlertCircle size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '14px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '20px' }}>
                No campaign content was generated. The AI may have timed out.
              </p>
              <button className="btn-primary" onClick={() => navigate(-1)} style={{ fontSize: '14px' }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </motion.div>
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            marginTop: '40px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.08))',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <p style={{ fontWeight: 700, marginBottom: '4px' }}>Ready to launch another campaign?</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>Generate unlimited campaigns across all your marketing channels.</p>
          </div>
          <button className="btn-primary" onClick={handleNewCampaign} style={{ whiteSpace: 'nowrap' }}>
            New Campaign <Zap size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
