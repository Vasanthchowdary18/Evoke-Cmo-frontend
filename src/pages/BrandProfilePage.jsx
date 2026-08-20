import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Edit3, Target, Palette, Building2,
  Rocket, ArrowRight, Sparkles, PenLine,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import OnboardingWizard from '../components/OnboardingWizard.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

const BG      = '#0a0907'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.1)'
const GBORDER = 'rgba(200,151,62,0.22)'
const CARD    = '#131109'
const CARD2   = '#181510'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.26)'
const BORDER  = 'rgba(255,255,255,0.06)'
const GREEN   = '#10b981'

const INDUSTRY_LABELS = { ecommerce: 'E-commerce & Retail', tech: 'Tech / SaaS', services: 'Professional Services', food: 'Food & Beverage', fashion: 'Fashion & Lifestyle', health: 'Health & Fitness', education: 'Education / EdTech', realestate: 'Real Estate', finance: 'Finance / Fintech', media: 'Media & Entertainment', beauty: 'Beauty & Personal Care', other: 'Other' }
const GOAL_LABELS     = { leads: 'Generate Leads', sales: 'Drive Sales', awareness: 'Build Brand Awareness', brand_awareness: 'Build Brand Awareness', social_growth: 'Grow Social Following', social: 'Grow Social Following', launch: 'Launch a Product', engage: 'Retain & Engage' }
const TONE_LABELS     = { professional: 'Professional', casual: 'Casual & Friendly', bold: 'Bold & Direct', luxury: 'Luxury & Premium', playful: 'Playful & Fun', educational: 'Educational' }
const AUDIENCE_LABELS = { b2c_young: 'Consumers 18–35', b2c_mature: 'Consumers 35–55', b2b_small: 'Small Business', b2b_enterprise: 'Enterprise', mixed: 'Mixed B2B & B2C' }
const GOAL_ICONS      = { leads: '🎯', sales: '💰', awareness: '✨', brand_awareness: '✨', social_growth: '📈', social: '📈', launch: '🚀', engage: '💬' }
const TONE_ICONS      = { professional: '🎩', casual: '😊', bold: '⚡', luxury: '💎', playful: '🎉', educational: '📖' }
const AUDIENCE_ICONS  = { b2c_young: '🧑', b2c_mature: '👤', b2b_small: '🏢', b2b_enterprise: '🏛️', mixed: '👥' }

export default function BrandProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading,       setLoading]       = useState(true)
  const [kb,            setKb]            = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadKb = () => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid).then(data => {
      setKb(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(loadKb, [user?.uid])

  const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : [])

  // Prefer the dedicated brand name (new 6-step flow); fall back to legacy field names
  const brandName = kb?.brandName || kb?.businessName || kb?.companyName || ''
  const industries = toArr(kb?.industry)
  const goals      = toArr(kb?.goal || kb?.primaryObjective)
  const tones      = toArr(kb?.tone || kb?.toneOfVoice)
  const audiences  = toArr(kb?.audience || kb?.audienceType)

  const hasBrand = !!(kb && (brandName || industries.length > 0))

  // Auto-open the onboarding wizard for a brand-new user landing here straight
  // from "Get Started" — no extra click needed to start Step 1.
  useEffect(() => {
    if (!loading && !hasBrand) setShowEditModal(true)
  }, [loading, hasBrand])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />

      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Top bar */}
        <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>Brand Profile</div>
            <div style={{ fontSize: 10, color: TEXT3 }}>Your brand identity & marketing goals</div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 9, color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = GDIM }}
          >
            <PenLine size={13}/> Edit Profile
          </button>
        </div>

        <div style={{ padding: '28px 28px 80px', maxWidth: 820, margin: '0 auto' }}>

          {!hasBrand ? (
            /* ── No profile yet ── */
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>📋</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 10 }}>No Brand Profile Yet</h2>
              <p style={{ color: TEXT2, fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>
                Complete the 6-step setup so EVOX AI can recommend the right agents and personalise every campaign for your brand.
              </p>
              <button onClick={() => setShowEditModal(true)}
                style={{ padding: '11px 28px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 100, color: '#0a0907', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Set Up Brand Profile →
              </button>
            </motion.div>
          ) : (
            <>
              {/* ── Brand Identity Card ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${GOLD},#8b5e1e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#0a0907', flexShrink: 0 }}>
                    {brandName?.[0]?.toUpperCase() || '🏢'}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Your Brand</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif" }}>{brandName}</div>
                  </div>
                </div>

                {/* Industry */}
                {industries.length > 0 && (
                  <ProfileSection icon={<Building2 size={14} color={GOLD}/>} label="Industry">
                    {industries.map(v => (
                      <Chip key={v} label={INDUSTRY_LABELS[v] || v} color={GOLD} />
                    ))}
                  </ProfileSection>
                )}

                {/* Goals */}
                {goals.length > 0 && (
                  <ProfileSection icon={<Target size={14} color={GREEN}/>} label="Marketing Goals">
                    {goals.map(v => (
                      <Chip key={v} label={`${GOAL_ICONS[v] || '🎯'} ${GOAL_LABELS[v] || v}`} color={GREEN} />
                    ))}
                  </ProfileSection>
                )}

                {/* Tone */}
                {tones.length > 0 && (
                  <ProfileSection icon={<Palette size={14} color="#a855f7"/>} label="Brand Voice & Tone">
                    {tones.map(v => (
                      <Chip key={v} label={`${TONE_ICONS[v] || ''} ${TONE_LABELS[v] || v}`} color="#a855f7" />
                    ))}
                  </ProfileSection>
                )}

                {/* Audience */}
                {audiences.length > 0 && (
                  <ProfileSection icon={<Activity size={14} color="#3b82f6"/>} label="Target Audience">
                    {audiences.map(v => (
                      <Chip key={v} label={`${AUDIENCE_ICONS[v] || '👥'} ${AUDIENCE_LABELS[v] || v}`} color="#3b82f6" />
                    ))}
                  </ProfileSection>
                )}
              </motion.div>

              {/* ── What's next ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: `linear-gradient(135deg,rgba(200,151,62,0.08),rgba(200,151,62,0.02))`, border: `1px solid ${GBORDER}`, borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28 }}>🚀</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 3 }}>Ready to start your campaign?</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>EVOX AI has matched agents to your brand goals.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/strategy')}
                    style={{ padding: '9px 18px', background: `linear-gradient(135deg,${GOLD},#b8803a)`, border: 'none', borderRadius: 9, color: '#0a0907', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                    Build Strategy <ArrowRight size={12}/>
                  </button>
                  <button onClick={() => navigate('/dashboard')}
                    style={{ padding: '9px 18px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Dashboard
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {showEditModal && (
        <OnboardingWizard
          onComplete={() => navigate('/plans')}
          onDismiss={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

function ProfileSection({ icon, label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 800, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  )
}

function Chip({ label, color }) {
  return (
    <span style={{ padding: '5px 12px', background: `${color}10`, border: `1px solid ${color}28`, borderRadius: 100, fontSize: 12, color, fontWeight: 600 }}>
      {label}
    </span>
  )
}
