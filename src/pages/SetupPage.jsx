import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth.js'
import { getUserData } from '../services/userService'
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2, Globe, Target, Users, Mic2, MonitorSmartphone } from 'lucide-react'

const GOLD  = '#c8973e'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const CARD  = '#1a1714'
const BORDER= 'rgba(255,255,255,0.08)'
const GDIM  = 'rgba(200,151,62,0.1)'
const GBORD = 'rgba(200,151,62,0.3)'

// ── Recommendation engine ────────────────────────────────────────────────────
function buildRecommendations(data) {
  const { industry, goal, audience } = data

  const byIndustry = {
    ecommerce: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Product posts that convert on Instagram & TikTok' },
      { emoji:'📸', label:'Product Image Angles', route:'/image-angles',    color:'#f97316', why:'Professional multi-angle product photography' },
      { emoji:'📝', label:'Product Description',  route:'/product-desc',    color:'#84cc16', why:'SEO-optimised product copy that drives sales' },
    ],
    tech: [
      { emoji:'🔍', label:'SEO Agent',            route:'/seo-agent',       color:'#3b82f6', why:'Rank higher for your SaaS & tech keywords' },
      { emoji:'✍️', label:'Copywriting Agent',    route:'/copywriting',     color:'#ec4899', why:'Landing page and ad copy that converts trials' },
      { emoji:'📧', label:'Email Marketing',      route:'/email-marketing', color:'#a855f7', why:'Onboarding and lead nurture sequences' },
    ],
    fashion: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Trend-driven captions for every new drop' },
      { emoji:'📸', label:'Lifestyle Photos',     route:'/image-lifestyle', color:'#a855f7', why:'Editorial and lifestyle product shots' },
      { emoji:'🎬', label:'Reel Scripts',         route:'/reel-scripts',    color:'#f59e0b', why:'Style inspiration videos that build followers' },
    ],
    food: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Daily social content across all platforms' },
      { emoji:'📸', label:'Lifestyle Photos',     route:'/image-lifestyle', color:'#a855f7', why:'Mouth-watering food and ambience shots' },
      { emoji:'🎬', label:'Reel Scripts',         route:'/reel-scripts',    color:'#f59e0b', why:'TikTok & Reels content that gets shared' },
    ],
    health: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Motivational content that drives engagement' },
      { emoji:'📝', label:'Content Generation',   route:'/content-gen',     color:'#6366f1', why:'Health articles and training guides' },
      { emoji:'🎬', label:'Reel Scripts',         route:'/reel-scripts',    color:'#f59e0b', why:'Workout tips and transformation reels' },
    ],
    finance: [
      { emoji:'📊', label:'Marketing Strategy',   route:'/strategy',        color:'#c8973e', why:'Full GTM plan with KPIs and budget allocation' },
      { emoji:'✍️', label:'Copywriting Agent',    route:'/copywriting',     color:'#ec4899', why:'Trust-building copy for ads and landing pages' },
      { emoji:'📧', label:'Email Marketing',      route:'/email-marketing', color:'#a855f7', why:'Client nurture and follow-up automation' },
    ],
    education: [
      { emoji:'📝', label:'Content Generation',   route:'/content-gen',     color:'#6366f1', why:'Course content, blog articles and study guides' },
      { emoji:'📧', label:'Email Marketing',      route:'/email-marketing', color:'#a855f7', why:'Student enrolment and nurture sequences' },
      { emoji:'🔍', label:'SEO Agent',            route:'/seo-agent',       color:'#3b82f6', why:'Rank for course keywords on Google' },
    ],
    realestate: [
      { emoji:'📊', label:'Marketing Strategy',   route:'/strategy',        color:'#c8973e', why:'Full marketing plan for listings and leads' },
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Property captions that generate enquiries' },
      { emoji:'📸', label:'Lifestyle Photos',     route:'/image-lifestyle', color:'#a855f7', why:'Lifestyle shots that sell the dream home' },
    ],
  }

  // Goal-based fallback
  const byGoal = {
    leads: [
      { emoji:'📊', label:'Marketing Strategy',   route:'/strategy',        color:'#c8973e', why:'Build a lead generation plan with clear KPIs' },
      { emoji:'✍️', label:'Copywriting Agent',    route:'/copywriting',     color:'#ec4899', why:'High-converting copy for ads and landing pages' },
      { emoji:'📧', label:'Email Marketing',      route:'/email-marketing', color:'#a855f7', why:'Automated lead nurture sequences' },
    ],
    sales: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Social posts that drive traffic to your store' },
      { emoji:'📝', label:'Product Description',  route:'/product-desc',    color:'#84cc16', why:'Product copy that overcomes objections' },
      { emoji:'📊', label:'A/B Testing',          route:'/ab-testing',      color:'#6366f1', why:'Test what messaging converts best' },
    ],
    social: [
      { emoji:'✍️', label:'Caption Suite',        route:'/caption-suite',   color:'#10b981', why:'Daily posts across Instagram, LinkedIn & TikTok' },
      { emoji:'🎬', label:'Reel Scripts',         route:'/reel-scripts',    color:'#f59e0b', why:'Viral-ready video scripts for Reels & TikTok' },
      { emoji:'📅', label:'Content Calendar',     route:'/campaign/content_calendar', color:'#3b82f6', why:'30-day content plan with daily post ideas' },
    ],
    awareness: [
      { emoji:'📊', label:'Marketing Strategy',   route:'/strategy',        color:'#c8973e', why:'Position your brand with a clear awareness plan' },
      { emoji:'📝', label:'Content Generation',   route:'/content-gen',     color:'#6366f1', why:'Blog posts and landing pages that build authority' },
      { emoji:'🔍', label:'SEO Agent',            route:'/seo-agent',       color:'#3b82f6', why:'Get discovered by people searching for you' },
    ],
  }

  return byIndustry[industry] || byGoal[goal] || [
    { emoji:'📊', label:'Marketing Strategy',     route:'/strategy',        color:'#c8973e', why:'Start with a clear annual marketing plan' },
    { emoji:'✍️', label:'Caption Suite',          route:'/caption-suite',   color:'#10b981', why:'Consistent social media presence' },
    { emoji:'📝', label:'Content Generation',     route:'/content-gen',     color:'#6366f1', why:'AI-written blog posts and landing pages' },
  ]
}

// ── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: 'business',
    icon: <Globe size={20}/>,
    title: 'Tell us about your business',
    subtitle: 'This powers everything — your strategy, content, campaigns, and ads.',
    fields: [
      { key: 'businessName', label: 'Business name', type: 'text', placeholder: 'e.g. Evoke Marketing Co.', required: true },
      { key: 'website',      label: 'Website (optional)', type: 'text', placeholder: 'e.g. https://evokecmo.com', required: false },
    ],
    choice: {
      key: 'industry',
      label: 'Industry',
      cols: 4,
      options: [
        { value: 'ecommerce',  label: 'E-commerce',       emoji: '🛍️' },
        { value: 'tech',       label: 'Tech / SaaS',       emoji: '💻' },
        { value: 'services',   label: 'Services',          emoji: '🤝' },
        { value: 'food',       label: 'Food & Beverage',   emoji: '🍽️' },
        { value: 'fashion',    label: 'Fashion & Apparel', emoji: '👗' },
        { value: 'health',     label: 'Health & Fitness',  emoji: '💪' },
        { value: 'education',  label: 'Education',         emoji: '📚' },
        { value: 'realestate', label: 'Real Estate',       emoji: '🏠' },
        { value: 'finance',    label: 'Finance',           emoji: '💰' },
        { value: 'other',      label: 'Other',             emoji: '✨' },
      ],
    },
  },
  {
    key: 'audience',
    icon: <Users size={20}/>,
    title: 'Who is your target customer?',
    subtitle: 'Your audience determines which platforms, tone, and campaigns we build for you.',
    choice: {
      key: 'audience',
      label: 'Target audience',
      cols: 2,
      options: [
        { value: 'b2c_young',      label: 'Consumers — 18 to 35',          emoji: '🧑', desc: 'Social-first, mobile buyers' },
        { value: 'b2c_mature',     label: 'Consumers — 35 to 55',          emoji: '👤', desc: 'Value-focused, trust-driven' },
        { value: 'b2b_small',      label: 'Small Businesses',              emoji: '🏪', desc: 'Owners and decision makers' },
        { value: 'b2b_enterprise', label: 'Enterprise / Corporate',        emoji: '🏢', desc: 'Multi-stakeholder buying' },
        { value: 'mixed',          label: 'Mixed — B2B and B2C both',      emoji: '🌐', desc: 'Broad market reach' },
      ],
    },
    choice2: {
      key: 'goal',
      label: 'Primary marketing goal',
      cols: 2,
      options: [
        { value: 'leads',     label: 'Generate Leads',         emoji: '🎯', desc: 'Fill your pipeline with prospects' },
        { value: 'sales',     label: 'Drive Sales',            emoji: '💰', desc: 'Convert prospects to customers' },
        { value: 'social',    label: 'Grow Social Following',  emoji: '📈', desc: 'Build a loyal audience online' },
        { value: 'awareness', label: 'Build Brand Awareness',  emoji: '✨', desc: 'Get known by more people' },
      ],
    },
  },
  {
    key: 'brand',
    icon: <Mic2 size={20}/>,
    title: "What's your brand's personality?",
    subtitle: 'Every AI agent uses this to write in your exact voice — captions, emails, ads, all of it.',
    choice: {
      key: 'tone',
      label: 'Brand tone of voice',
      cols: 2,
      options: [
        { value: 'professional', label: 'Professional & Authoritative', emoji: '🎩', desc: 'Expert, trustworthy, formal' },
        { value: 'casual',       label: 'Casual & Friendly',            emoji: '😊', desc: 'Warm, approachable, human' },
        { value: 'bold',         label: 'Bold & Edgy',                  emoji: '⚡', desc: 'Direct, provocative, stand-out' },
        { value: 'luxury',       label: 'Luxury & Premium',             emoji: '💎', desc: 'Refined, aspirational, exclusive' },
        { value: 'educational',  label: 'Educational & Informative',    emoji: '📖', desc: 'Clear, helpful, insightful' },
      ],
    },
  },
  {
    key: 'channels',
    icon: <MonitorSmartphone size={20}/>,
    title: 'Where do you market your business?',
    subtitle: 'We focus your campaigns on the channels where your audience actually is.',
    multiSelect: {
      key: 'platforms',
      label: 'Active marketing channels',
      options: [
        { value: 'instagram', label: 'Instagram',  emoji: '📸' },
        { value: 'facebook',  label: 'Facebook',   emoji: '👥' },
        { value: 'linkedin',  label: 'LinkedIn',   emoji: '💼' },
        { value: 'tiktok',    label: 'TikTok',     emoji: '🎵' },
        { value: 'email',     label: 'Email',      emoji: '📧' },
        { value: 'google',    label: 'Google SEO', emoji: '🔍' },
        { value: 'youtube',   label: 'YouTube',    emoji: '▶️' },
        { value: 'twitter',   label: 'Twitter / X',emoji: '🐦' },
      ],
    },
    choice: {
      key: 'challenge',
      label: "Biggest marketing challenge right now",
      cols: 2,
      options: [
        { value: 'content',    label: 'Creating content consistently', emoji: '📝', desc: 'Not enough time or ideas' },
        { value: 'leads',      label: 'Not getting enough leads',      emoji: '🎯', desc: 'Traffic but no conversions' },
        { value: 'growth',     label: 'Slow follower / audience growth',emoji: '📉', desc: 'Low engagement and reach' },
        { value: 'channels',   label: 'Managing multiple channels',    emoji: '🔀', desc: 'Spread too thin across platforms' },
      ],
    },
  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function SetupPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [step,       setStep]    = useState(0)
  const [answers,    setAnswers] = useState({})
  const [saving,     setSaving]  = useState(false)
  const [done,       setDone]    = useState(false)
  const [dir,        setDir]     = useState(1)
  const [checking,   setChecking] = useState(true)

  // Skip setup if brand setup is already done
  useEffect(() => {
    if (!user?.uid) { setChecking(false); return }
    getUserData(user.uid).then(data => {
      if (data?.brandSetupComplete || data?.onboardingComplete) navigate('/dashboard', { replace: true })
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [user, navigate])

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const canNext = () => {
    if (current.fields) {
      const requiredFilled = current.fields.filter(f => f.required).every(f => answers[f.key]?.trim())
      const choiceFilled   = answers[current.choice?.key]
      return requiredFilled && choiceFilled
    }
    if (current.choice2) {
      return !!(answers[current.choice?.key] && answers[current.choice2?.key])
    }
    if (current.multiSelect) {
      return !!(answers[current.choice?.key])
    }
    return !!(answers[current.choice?.key])
  }

  const go = (delta) => { setDir(delta); setStep(s => s + delta) }

  const set = (key, val) => setAnswers(a => ({ ...a, [key]: val }))

  const togglePlatform = (val) => {
    const curr = answers.platforms || []
    set('platforms', curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val])
  }

  const handleFinish = async () => {
    setSaving(true)
    const recs = buildRecommendations(answers)
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          onboardingComplete: true,
          brandSetupComplete: true,
          onboardingData: { ...answers, completedAt: serverTimestamp() },
          recommendedRoutes: recs.map(r => r.route),
          brandName: answers.businessName || '',
        })
      }
    } catch (e) { console.error(e) }
    setDone(true)
    sessionStorage.setItem('evox_setup_recs', JSON.stringify(recs))
    setTimeout(() => navigate('/plans'), 2200)
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#0a0907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} color="#c8973e" style={{ animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0907', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse,rgba(200,151,62,0.07) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${GOLD},#8b5e1e)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#0e0c09' }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>EVOX CMO</div>
            <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.14em', fontWeight: 600 }}>BRAND SETUP</div>
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#111009', border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 20, overflow: 'hidden' }}>

          {/* Top accent */}
          <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},#f59e0b,${GOLD})` }}/>

          {/* Progress bar */}
          <div style={{ padding: '20px 28px 0' }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? GOLD : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }}/>
              ))}
            </div>
            <div style={{ fontSize: 10, color: TEXT3 }}>Step {step + 1} of {STEPS.length}</div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 28px 24px', minHeight: 380 }}>
            <AnimatePresence mode="wait" initial={false}>

              {/* Done screen */}
              {done ? (
                <motion.div key="done"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16, textAlign: 'center' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    style={{ width: 68, height: 68, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#f59e0b)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={28} color="#0e0c09"/>
                  </motion.div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Your CMO is ready!</div>
                    <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, maxWidth: 320 }}>
                      We've analysed your brand and matched you with the best AI agents to hit your goals.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }}
                        animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}/>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT3 }}>Opening your personalised dashboard…</div>
                </motion.div>

              ) : (
                <motion.div key={step}
                  initial={{ opacity: 0, x: dir * 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -36 }}
                  transition={{ duration: 0.2, ease: [0.22,1,0.36,1] }}>

                  {/* Step icon + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: GDIM, border: `1px solid ${GBORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
                      {current.icon}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.3 }}>{current.title}</h2>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: TEXT2, margin: '0 0 18px', lineHeight: 1.65 }}>{current.subtitle}</p>

                  {/* Text fields */}
                  {current.fields?.map(f => (
                    <div key={f.key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT3, marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{f.label}</div>
                      <input
                        value={answers[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        style={{ width: '100%', padding: '11px 14px', background: CARD, border: `1px solid ${answers[f.key] ? GBORD : BORDER}`, borderRadius: 10, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.15s' }}
                        onFocus={e => e.target.style.border = `1px solid ${GOLD}`}
                        onBlur={e => e.target.style.border = `1px solid ${answers[f.key] ? GBORD : BORDER}`}
                      />
                    </div>
                  ))}

                  {/* Single-select choice */}
                  {current.choice && (
                    <div style={{ marginBottom: current.choice2 || current.multiSelect ? 14 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT3, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{current.choice.label}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${current.choice.cols},1fr)`, gap: 7 }}>
                        {current.choice.options.map(opt => {
                          const sel = answers[current.choice.key] === opt.value
                          return (
                            <ChoiceBtn key={opt.value} opt={opt} selected={sel} onClick={() => set(current.choice.key, opt.value)} />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Second choice (audience step) */}
                  {current.choice2 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT3, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{current.choice2.label}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${current.choice2.cols},1fr)`, gap: 7 }}>
                        {current.choice2.options.map(opt => {
                          const sel = answers[current.choice2.key] === opt.value
                          return <ChoiceBtn key={opt.value} opt={opt} selected={sel} onClick={() => set(current.choice2.key, opt.value)} />
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-select (platforms) */}
                  {current.multiSelect && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT3, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{current.multiSelect.label} <span style={{ color: '#666', fontWeight: 400 }}>(select all that apply)</span></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {current.multiSelect.options.map(opt => {
                          const sel = (answers.platforms || []).includes(opt.value)
                          return (
                            <button key={opt.value} onClick={() => togglePlatform(opt.value)}
                              style={{ padding: '8px 12px', background: sel ? GDIM : 'rgba(255,255,255,0.04)', border: `1px solid ${sel ? GOLD : BORDER}`, borderRadius: 8, color: sel ? GOLD : TEXT2, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                              <span>{opt.emoji}</span> {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          {!done && (
            <div style={{ padding: '0 28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
              <button onClick={() => step > 0 && go(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: 'none', border: `1px solid ${step === 0 ? 'transparent' : BORDER}`, borderRadius: 9, color: step === 0 ? 'transparent' : TEXT2, cursor: step === 0 ? 'default' : 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>
                <ArrowLeft size={13}/> Back
              </button>

              {isLast ? (
                <button onClick={handleFinish} disabled={!canNext() || saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: canNext() ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, color: canNext() ? '#0e0c09' : TEXT3, cursor: canNext() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }}/> : <Sparkles size={14}/>}
                  {saving ? 'Saving…' : 'Get My AI Agents'}
                </button>
              ) : (
                <button onClick={() => canNext() && go(1)} disabled={!canNext()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: canNext() ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, color: canNext() ? '#0e0c09' : TEXT3, cursor: canNext() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  Continue <ArrowRight size={14}/>
                </button>
              )}
            </div>
          )}
        </motion.div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: TEXT3 }}>
          Your answers are used only to personalise your EVOX CMO experience.
        </div>
      </div>
    </div>
  )
}

function ChoiceBtn({ opt, selected, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '10px 8px', background: selected ? GDIM : hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected ? GOLD : hov ? 'rgba(200,151,62,0.35)' : BORDER}`, borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: selected ? `0 0 0 1px rgba(200,151,62,0.2)` : 'none' }}>
      {selected && (
        <div style={{ position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={9} color="#0e0c09" strokeWidth={3}/>
        </div>
      )}
      <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.emoji}</span>
      <span style={{ fontSize: 10, fontWeight: selected ? 700 : 500, color: selected ? GOLD : 'rgba(240,235,224,0.5)', textAlign: 'center', lineHeight: 1.3 }}>{opt.label}</span>
      {opt.desc && <span style={{ fontSize: 9, color: 'rgba(240,235,224,0.3)', textAlign: 'center', lineHeight: 1.3 }}>{opt.desc}</span>}
    </button>
  )
}
