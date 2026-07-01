import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  Target, DollarSign, Calendar, Users, Globe, Image,
  Link2, Unlink, TrendingUp, Eye, MousePointer,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, X,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { META_API_BASE } from '../config.js'

/* ─── colour tokens (matches Landing.jsx / Navbar.jsx) ─── */
const BG      = '#0e0c09'
const BG2     = '#141210'
const CARD    = '#1c1a13'
const CARD2   = '#211f16'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.25)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.6)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'
const RED     = '#e05252'
const GREEN   = '#4caf7d'

/* ─── goal options ─── */
const GOALS = [
  {
    key: 'reach',
    label: 'Reach',
    desc: 'Show your ad to as many people as possible.',
    icon: <Eye size={18} />,
    objective: 'OUTCOME_AWARENESS',
  },
  {
    key: 'engagement',
    label: 'Engagement',
    desc: 'Get more likes, comments, and shares.',
    icon: <TrendingUp size={18} />,
    objective: 'OUTCOME_ENGAGEMENT',
  },
  {
    key: 'traffic',
    label: 'Traffic',
    desc: 'Drive people to your website or landing page.',
    icon: <MousePointer size={18} />,
    objective: 'OUTCOME_TRAFFIC',
  },
]

/* ─── shared input style ─── */
const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#0e0c09',
  border: `1px solid rgba(255,255,255,0.09)`,
  borderRadius: 10,
  color: TEXT,
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: TEXT3,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: 7,
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: TEXT3, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

/* ─── small status chip ─── */
function StatusChip({ ok, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: ok ? 'rgba(76,175,125,0.12)' : 'rgba(224,82,82,0.12)',
      border: `1px solid ${ok ? 'rgba(76,175,125,0.3)' : 'rgba(224,82,82,0.3)'}`,
      borderRadius: 100, fontSize: 11, fontWeight: 600,
      color: ok ? GREEN : RED,
    }}>
      {ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {label}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════ */

export default function MetaAdsBoost() {
  const navigate  = useNavigate()
  const { state: navState } = useLocation()
  const { user } = useRequireAuth()

  /* ── connection state ── */
  const [metaConn,    setMetaConn]    = useState(null)   // full meta_ads connection object
  const [adAccounts,  setAdAccounts]  = useState([])
  const [connLoading, setConnLoading] = useState(true)

  /* ── form state ── */
  const [goal,           setGoal]           = useState('reach')
  const [postId,         setPostId]         = useState('')
  const [pageId,         setPageId]         = useState('')
  const [imageUrl,       setImageUrl]       = useState('')
  const [caption,        setCaption]        = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [dailyBudget,    setDailyBudget]    = useState(5)
  const [durationDays,   setDurationDays]   = useState(3)
  const [countries,      setCountries]      = useState('IN')
  const [ageMin,         setAgeMin]         = useState(18)
  const [ageMax,         setAgeMax]         = useState(65)
  const [gender,         setGender]         = useState('all')
  const [interests,      setInterests]      = useState('')
  const [placements,     setPlacements]     = useState(['instagram', 'facebook'])
  const [adAccountId,    setAdAccountId]    = useState('')

  /* ── submit state ── */
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState(null)   // success response
  const [error,      setError]      = useState(null)

  /* ── advanced toggle ── */
  const [showAdvanced, setShowAdvanced] = useState(false)

  /* ── load connection status ── */
  const loadConnections = useCallback(async (uid) => {
    if (!uid || !META_API_BASE) { setConnLoading(false); return }
    setConnLoading(true)
    try {
      const res = await fetch(`${META_API_BASE}/status/${uid}`, {
        headers: { 'evoke-api-key': import.meta.env.VITE_EVOKE_API_KEY || '' },
      })
      const data = await res.json()
      const ma = data?.connections?.meta_ads
      setMetaConn(ma?.connected ? ma : null)
      if (ma?.connected) {
        const accRes = await fetch(`${META_API_BASE}/api/ads/accounts/${uid}`, {
          headers: { 'evoke-api-key': import.meta.env.VITE_EVOKE_API_KEY || '' },
        })
        const accData = await accRes.json()
        const accounts = accData?.ad_accounts || []
        setAdAccounts(accounts)
        setAdAccountId(accData?.active_ad_account_id || accounts[0]?.id || '')
      }
    } catch (e) {
      console.error('[MetaAds] Failed to load connections:', e)
    } finally {
      setConnLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadConnections(user.uid)
  }, [user, loadConnections])

  /* ── connect Meta Ads ── */
  const connectMetaAds = () => {
    if (!user) return
    window.location.href = `${META_API_BASE}/auth/meta-ads?user_id=${user.uid}`
  }

  /* ── disconnect ── */
  const disconnectMetaAds = async () => {
    if (!user) return
    try {
      await fetch(`${META_API_BASE}/disconnect/${user.uid}/meta_ads`, {
        method: 'DELETE',
        headers: { 'evoke-api-key': import.meta.env.VITE_EVOKE_API_KEY || '' },
      })
      setMetaConn(null)
      setAdAccounts([])
    } catch (e) {
      console.error('[MetaAds] Disconnect failed:', e)
    }
  }

  /* ── placement toggle ── */
  const togglePlacement = (p) => {
    setPlacements(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  /* ── submit boost ── */
  const handleBoost = async () => {
    if (!user) return
    setError(null)
    setResult(null)

    // basic validation
    if (!postId.trim()) { setError('Post ID is required.'); return }
    if (goal === 'traffic' && !destinationUrl.trim()) {
      setError('Destination URL is required when goal is Traffic.')
      return
    }
    if (placements.length === 0) { setError('Select at least one placement.'); return }

    setSubmitting(true)
    try {
      const body = {
        app_user_id:     user.uid,
        ad_account_id:   adAccountId || undefined,
        post_id:         postId.trim(),
        page_id:         pageId.trim() || undefined,
        image_url:       imageUrl.trim() || undefined,
        caption:         caption.trim() || undefined,
        destination_url: destinationUrl.trim() || undefined,
        daily_budget_usd: parseFloat(dailyBudget),
        duration_days:   parseInt(durationDays),
        goal,
        countries:       countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
        age_min:         parseInt(ageMin),
        age_max:         parseInt(ageMax),
        gender,
        interests:       interests.trim()
          ? interests.split(',').map(i => i.trim()).filter(Boolean)
          : undefined,
        placements,
      }

      const res = await fetch(`${META_API_BASE}/api/ads/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'evoke-api-key': import.meta.env.VITE_EVOKE_API_KEY || '',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || 'Boost failed.')
      setResult(data)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── reset form ── */
  const resetForm = () => {
    setResult(null); setError(null)
    setPostId(''); setImageUrl(''); setCaption('')
    setDestinationUrl(''); setPageId('')
    setGoal('reach'); setDailyBudget(5); setDurationDays(3)
    setCountries('IN'); setAgeMin(18); setAgeMax(65)
    setGender('all'); setInterests('')
    setPlacements(['instagram', 'facebook'])
  }

  /* ── total spend ── */
  const totalSpend = (parseFloat(dailyBudget) * parseInt(durationDays)).toFixed(2)

  /* ─────────────────────────────── render ─────────────────────────── */
  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 36 }}>
          <button onClick={() => navigate(navState?.from || '/hub/creative')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20 }}
            onMouseEnter={e => e.currentTarget.style.color = GOLD}
            onMouseLeave={e => e.currentTarget.style.color = TEXT3}>
            <ArrowLeft size={14} /> {navState?.fromLabel ? `Back to ${navState.fromLabel}` : 'Back to Creative Assets'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color={GOLD} fill={GOLD} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Syne','Inter',sans-serif" }}>
                Meta Ads Boost
              </h1>
              <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Boost your marketing images directly on Instagram & Facebook</p>
            </div>
          </div>
        </div>

        {/* ── Connection Card ── */}
        <div style={{ background: CARD, border: `1px solid ${metaConn ? GBORDER : BORDER}`, borderRadius: 16, padding: '22px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Meta logo */}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: metaConn ? 'rgba(76,175,125,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${metaConn ? 'rgba(76,175,125,0.3)' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={metaConn ? GREEN : 'rgba(240,235,224,0.3)'}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.17 2.55 7.75 6.23 9.28L19.07 9.6A9.96 9.96 0 0012 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Meta Ads Account</div>
              {connLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT3 }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Checking connection…
                </div>
              ) : metaConn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusChip ok label="Connected" />
                  {metaConn.active_ad_account_id && (
                    <span style={{ fontSize: 11, color: TEXT3 }}>Account: {metaConn.active_ad_account_id}</span>
                  )}
                </div>
              ) : (
                <StatusChip ok={false} label="Not connected" />
              )}
            </div>
          </div>

          {connLoading ? null : metaConn ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => loadConnections(user?.uid)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT2, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                <RefreshCw size={13} /> Refresh
              </button>
              <button onClick={disconnectMetaAds} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 8, color: RED, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                <Unlink size={13} /> Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connectMetaAds} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 10, color: '#0e0c09', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,151,62,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <Link2 size={14} /> Connect Meta Ads
            </button>
          )}
        </div>

        {/* ── Ad Account Selector ── */}
        {metaConn && adAccounts.length > 1 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 24px', marginBottom: 28 }}>
            <Field label="Active Ad Account">
              <select
                value={adAccountId}
                onChange={e => setAdAccountId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {adAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name || acc.id} ({acc.currency || ''})</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ── Result Banner ── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} color={GREEN} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>Boost Live! 🎉</span>
                </div>
                <button onClick={resetForm} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Campaign ID', value: result.campaign_id },
                  { label: 'Ad Set ID',   value: result.adset_id },
                  { label: 'Creative ID', value: result.creative_id },
                  { label: 'Ad ID',       value: result.ad_id },
                  { label: 'Goal',        value: result.goal?.toUpperCase() },
                  { label: 'Daily Budget',value: `$${result.daily_budget_usd}` },
                  { label: 'Duration',    value: `${result.duration_days} days` },
                  { label: 'Total Spend', value: `$${(result.daily_budget_usd * result.duration_days).toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 600, wordBreak: 'break-all' }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
              {result.targeting_summary && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Targeting</div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
                    📍 {result.targeting_summary.countries?.join(', ')} &nbsp;·&nbsp;
                    👤 Age {result.targeting_summary.age} &nbsp;·&nbsp;
                    ⚧ {result.targeting_summary.gender} &nbsp;·&nbsp;
                    📱 {result.targeting_summary.placements?.join(' + ')}
                    {result.targeting_summary.interests?.length > 0 && (
                      <> &nbsp;·&nbsp; 🎯 {result.targeting_summary.interests.join(', ')}</>
                    )}
                  </div>
                </div>
              )}
              <button onClick={resetForm} style={{ marginTop: 14, padding: '9px 18px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 8, color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                + Create Another Boost
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={16} color={RED} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: RED }}>{error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: RED, cursor: 'pointer', flexShrink: 0 }}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Form (only when connected) ── */}
        {!connLoading && !result && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

            {/* GOAL SELECTOR */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color={GOLD} /> Campaign Goal
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {GOALS.map(g => (
                  <button key={g.key} onClick={() => setGoal(g.key)} style={{
                    padding: '16px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: goal === g.key ? GDIM : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${goal === g.key ? GBORDER : BORDER}`,
                    transition: 'all 0.15s', fontFamily: "'Inter',sans-serif",
                    boxShadow: goal === g.key ? `0 0 16px rgba(200,151,62,0.12)` : 'none',
                  }}
                    onMouseEnter={e => { if (goal !== g.key) e.currentTarget.style.borderColor = 'rgba(200,151,62,0.2)' }}
                    onMouseLeave={e => { if (goal !== g.key) e.currentTarget.style.borderColor = BORDER }}>
                    <div style={{ color: goal === g.key ? GOLD : TEXT3, marginBottom: 8 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: goal === g.key ? TEXT : TEXT2, marginBottom: 4 }}>{g.label}</div>
                    <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.5 }}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* POST / IMAGE */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Image size={16} color={GOLD} /> Post & Image
              </div>

              <Field label="Post ID *" hint="For an existing Meta post: use the format pageId_postId (e.g. 123456_789012). For a new ad from scratch, enter any unique label.">
                <input
                  value={postId}
                  onChange={e => setPostId(e.target.value)}
                  placeholder="e.g. 123456789_987654321"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </Field>

              <Field label="Image URL" hint="Paste the URL of the image you want to boost (S3 or public URL).">
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </Field>

              <Field label="Caption / Ad Copy">
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write your ad caption here…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </Field>

              {goal === 'traffic' && (
                <Field label="Destination URL *" hint="Where should people land when they click your ad?">
                  <input
                    value={destinationUrl}
                    onChange={e => setDestinationUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </Field>
              )}
            </div>

            {/* BUDGET & DURATION */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={16} color={GOLD} /> Budget & Duration
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label={`Daily Budget (USD) — $${dailyBudget}`}>
                  <input
                    type="range" min={1} max={100} step={1}
                    value={dailyBudget}
                    onChange={e => setDailyBudget(e.target.value)}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT3, marginTop: 4 }}>
                    <span>$1</span><span>$100</span>
                  </div>
                </Field>

                <Field label={`Duration — ${durationDays} day${durationDays > 1 ? 's' : ''}`}>
                  <input
                    type="range" min={1} max={30} step={1}
                    value={durationDays}
                    onChange={e => setDurationDays(e.target.value)}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT3, marginTop: 4 }}>
                    <span>1 day</span><span>30 days</span>
                  </div>
                </Field>
              </div>

              {/* Total spend chip */}
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: TEXT3 }}>Estimated total spend:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>${totalSpend}</span>
              </div>
            </div>

            {/* TARGETING */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color={GOLD} /> Audience Targeting
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Countries" hint="Comma-separated country codes, e.g. IN, US, GB">
                  <input
                    value={countries}
                    onChange={e => setCountries(e.target.value)}
                    placeholder="IN, US, GB"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </Field>

                <Field label="Gender">
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>

                <Field label={`Min Age — ${ageMin}`}>
                  <input type="range" min={13} max={65} step={1} value={ageMin}
                    onChange={e => { const v = parseInt(e.target.value); setAgeMin(Math.min(v, ageMax - 1)) }}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT3, marginTop: 4 }}>
                    <span>13</span><span>65</span>
                  </div>
                </Field>

                <Field label={`Max Age — ${ageMax}`}>
                  <input type="range" min={13} max={65} step={1} value={ageMax}
                    onChange={e => { const v = parseInt(e.target.value); setAgeMax(Math.max(v, ageMin + 1)) }}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT3, marginTop: 4 }}>
                    <span>13</span><span>65</span>
                  </div>
                </Field>
              </div>

              <Field label="Interests" hint="Comma-separated, e.g. Fashion, Technology, Fitness">
                <input
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  placeholder="e.g. Fashion, Fitness, Startups"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </Field>

              {/* Placements */}
              <label style={labelStyle}>Placements</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['instagram', 'facebook'].map(p => (
                  <button key={p} onClick={() => togglePlacement(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                    background: placements.includes(p) ? GDIM : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${placements.includes(p) ? GBORDER : BORDER}`,
                    color: placements.includes(p) ? GOLD : TEXT3,
                    fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
                    transition: 'all 0.15s',
                  }}>
                    {placements.includes(p) && <CheckCircle2 size={13} />}
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ADVANCED */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <button onClick={() => setShowAdvanced(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Globe size={15} color={GOLD} /> Advanced Options
                </div>
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 24px 22px', borderTop: `1px solid ${BORDER}', paddingTop: 20` }}>
                      <div style={{ paddingTop: 20 }}>
                        <Field label="Facebook Page ID" hint="Required when post_id is NOT an existing Meta post ID (e.g. building a brand-new ad).">
                          <input
                            value={pageId}
                            onChange={e => setPageId(e.target.value)}
                            placeholder="e.g. 123456789"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = GOLD}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                          />
                        </Field>

                        {goal !== 'traffic' && (
                          <Field label="Destination URL" hint="Optional for reach/engagement. Defaults to your Instagram profile.">
                            <input
                              value={destinationUrl}
                              onChange={e => setDestinationUrl(e.target.value)}
                              placeholder="https://yourwebsite.com"
                              style={inputStyle}
                              onFocus={e => e.target.style.borderColor = GOLD}
                              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                            />
                          </Field>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Boost Summary + Submit ── */}
            <div style={{ background: 'linear-gradient(145deg,#221d10,#1c1a13)', border: `1px solid ${GBORDER}`, borderRadius: 16, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: TEXT3, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Boost Summary</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { icon: <Target size={12} />, label: GOALS.find(g => g.key === goal)?.label },
                      { icon: <DollarSign size={12} />, label: `$${dailyBudget}/day` },
                      { icon: <Calendar size={12} />, label: `${durationDays} days` },
                      { icon: <Globe size={12} />, label: countries },
                      { icon: <Users size={12} />, label: `${ageMin}–${ageMax} yrs` },
                    ].map(({ icon, label }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(200,151,62,0.08)', border: `1px solid rgba(200,151,62,0.18)`, borderRadius: 100, fontSize: 11, color: 'rgba(240,235,224,0.7)', fontWeight: 500 }}>
                        <span style={{ color: GOLD }}>{icon}</span> {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: TEXT3, marginBottom: 2 }}>Total estimated spend</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, letterSpacing: '-0.02em' }}>${totalSpend}</div>
                </div>
              </div>

              {!metaConn ? (
                <div style={{ padding: '14px', background: 'rgba(200,151,62,0.06)', border: `1px solid rgba(200,151,62,0.2)`, borderRadius: 10, textAlign: 'center', fontSize: 13, color: TEXT2 }}>
                  Connect your Meta Ads account above to launch a boost.
                </div>
              ) : (
                <button
                  onClick={handleBoost}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                    background: submitting ? 'rgba(200,151,62,0.3)' : 'linear-gradient(135deg,#d4a853,#b8803a)',
                    color: '#0e0c09', fontSize: 15, fontWeight: 800, fontFamily: "'Inter',sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,151,62,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                  {submitting ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Launching Boost…</>
                  ) : (
                    <><Zap size={18} fill="#0e0c09" /> Launch Meta Ads Boost</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Not configured notice ── */}
        {!META_API_BASE && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 12, fontSize: 13, color: RED, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>API not configured.</strong> Add <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4 }}>VITE_META_API_BASE=https://your-api.com</code> to your <code>.env</code> file and restart the dev server.
            </span>
          </div>
        )}

      </div>

      {/* spin keyframe injected inline */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
