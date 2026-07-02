import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Edit3, Target, Palette, Building2, Users, DollarSign,
  Rocket, ArrowRight, Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { getRecommendedActions } from '../lib/recommendations.jsx'

const BG      = '#0e0c09'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const CARD    = '#1c1a13'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const goldGrad = {
  background: 'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}

const OBJECTIVE_LABELS = {
  increase_revenue: 'Increase Revenue',
  generate_leads: 'Generate Leads',
  brand_awareness: 'Build Brand Awareness',
  launch_product: 'Launch a Product',
  grow_social: 'Grow Social Following',
  retain_customers: 'Retain Customers',
}

export default function BrandProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [kb, setKb] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      setKb(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: TEXT2, fontSize: 14 }}>Loading your brand profile…</div>
      </div>
    )
  }

  const hasBrand = !!(kb && kb.companyName && kb.industry)

  if (!hasBrand) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '140px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>No Brand Profile Yet</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginBottom: 28 }}>Complete your Brand Knowledge Base first so EVOX can build your personalised strategy.</p>
          <button onClick={() => navigate('/brand-kb')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none', borderRadius: 100, color: '#0e0c09', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Set Up Brand KB →
          </button>
        </div>
      </div>
    )
  }

  const objectives = Array.isArray(kb.primaryObjective)
    ? kb.primaryObjective
    : (kb.primaryObjective ? [kb.primaryObjective] : [])
  const channels = Array.isArray(kb.primaryChannels) ? kb.primaryChannels : []
  const recs = getRecommendedActions(0, [], 0, kb, 4)

  const chips = [
    { label: 'Industry', value: (kb.industry || '').replace(/_/g, ' ') },
    { label: 'Audience', value: (kb.audienceType || '').toUpperCase() },
    { label: 'Tone', value: kb.toneOfVoice },
    { label: 'Timeline', value: kb.timeline },
    { label: 'Budget', value: kb.marketingBudget },
  ].filter(c => c.value)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 28px 80px' }}>

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                <Activity size={11}/> EVOX CMO · Brand Profile
              </div>
              <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px', fontFamily: "'Syne','Inter',sans-serif" }}>
                {kb.companyName ? <>{kb.companyName}'s <span style={goldGrad}>CMO Strategy</span></> : <span style={goldGrad}>Your CMO Strategy</span>}
              </h1>
              <p style={{ fontSize: 14, color: TEXT2, margin: 0, lineHeight: 1.6 }}>
                Built from your brand profile · EVOX personalises every campaign to your goals
              </p>
            </div>
            <button
              onClick={() => navigate('/brand-kb', { state: { edit: true } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 100, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GBORDER; e.currentTarget.style.color = GOLD }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 }}
            >
              <Edit3 size={14}/> Edit Profile
            </button>
          </div>
        </motion.div>

        {/* ═══ CHIPS ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
          {chips.map(c => (
            <div key={c.label} style={{ padding: '7px 16px', borderRadius: 100, background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)', fontSize: 12, color: TEXT2 }}>
              <span style={{ color: GOLD, fontWeight: 700 }}>{c.label}:</span>{' '}
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{c.value}</span>
            </div>
          ))}
        </motion.div>

        {/* ═══ TWO-COLUMN: Business / Brand ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginBottom: 16 }}>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Building2 size={15} color={GOLD} />
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: '0.02em' }}>Business Identity</span>
            </div>
            {[
              ['Company', kb.companyName],
              ['What you sell', kb.productService],
              ['Pricing', kb.pricingRange],
              ['Website', kb.website],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: TEXT }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Palette size={15} color="#ec4899" />
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: '0.02em' }}>Brand Identity</span>
            </div>
            {[
              ['Tagline', kb.brandTagline],
              ['Personality', kb.brandPersonality],
              ['Visual Style', kb.visualStyle],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: TEXT3, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: TEXT, textTransform: 'capitalize' }}>{val}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Goals ═══ */}
        {objectives.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Target size={15} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: '0.02em' }}>Business Goals</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {objectives.map(o => (
                <span key={o} style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                  {OBJECTIVE_LABELS[o] || o}
                </span>
              ))}
            </div>
            {channels.length > 0 && (
              <div style={{ fontSize: 12, color: TEXT2 }}>
                <span style={{ color: TEXT3, fontWeight: 700 }}>Channels: </span>
                {channels.join(', ')}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ Recommendations ═══ */}
        {recs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 16 }}>
              <Sparkles size={11}/> AI-POWERED RECOMMENDATIONS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              {recs.map(r => (
                <div key={r.path} onClick={() => navigate(r.path)} style={{ padding: '18px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${r.color}15`, border: `1px solid ${r.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, marginBottom: 10 }}>
                    {r.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.5, marginBottom: 10 }}>{r.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: r.color }}>
                    {r.cta} <ArrowRight size={11}/>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button onClick={() => navigate('/agents-hub')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 100, color: TEXT2, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Rocket size={14}/> Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
