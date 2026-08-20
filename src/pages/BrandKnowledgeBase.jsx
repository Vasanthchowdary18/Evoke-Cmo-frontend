import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { saveKnowledgeBase, getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/* ── Design tokens ── */
const BG    = '#0a0907'
const CARD  = '#111009'
const GOLD  = '#c8973e'
const GDIM  = 'rgba(200,151,62,0.1)'
const GBORD = 'rgba(200,151,62,0.28)'
const TEXT  = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const TEXT3 = 'rgba(240,235,224,0.28)'
const BORDER= 'rgba(255,255,255,0.08)'

/* ── CMO Questions ─────────────────────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 'businessName',
    type: 'text',
    label: 'Q1 of 8',
    question: "What's your business name?",
    hint: 'This is how your AI CMO will refer to your brand in every campaign.',
    placeholder: 'e.g. Evoke Marketing Co.',
    required: true,
  },
  {
    id: 'industry',
    type: 'choice',
    label: 'Q2 of 8',
    question: 'What industry are you in?',
    hint: 'Your AI CMO uses this to benchmark against competitors and find the right positioning.',
    cols: 4,
    options: [
      { value: 'ecommerce',   emoji: '🛍️', label: 'E-commerce & Retail' },
      { value: 'tech',        emoji: '💻', label: 'Tech / SaaS' },
      { value: 'services',    emoji: '🤝', label: 'Professional Services' },
      { value: 'food',        emoji: '🍽️', label: 'Food & Beverage' },
      { value: 'fashion',     emoji: '👗', label: 'Fashion & Lifestyle' },
      { value: 'health',      emoji: '💪', label: 'Health & Fitness' },
      { value: 'education',   emoji: '📚', label: 'Education / EdTech' },
      { value: 'realestate',  emoji: '🏠', label: 'Real Estate' },
      { value: 'finance',     emoji: '💰', label: 'Finance / Fintech' },
      { value: 'media',       emoji: '🎬', label: 'Media & Entertainment' },
      { value: 'beauty',      emoji: '💄', label: 'Beauty & Personal Care' },
      { value: 'other',       emoji: '✨', label: 'Other' },
    ],
  },
  {
    id: 'description',
    type: 'textarea',
    label: 'Q3 of 8',
    question: 'What do you sell and what problem do you solve?',
    hint: 'Be specific — your CMO uses this to write every ad, email, and caption.',
    placeholder: 'e.g. We help small e-commerce brands automate their social media so they can focus on growing their store without hiring a marketing team.',
    required: true,
  },
  {
    id: 'audience',
    type: 'choice',
    label: 'Q4 of 8',
    question: 'Who is your target customer?',
    hint: 'Knowing your audience determines which platforms, tone, and campaigns we run for you.',
    cols: 2,
    options: [
      { value: 'b2c_young',      emoji: '🧑‍💻', label: 'Consumers aged 18–35',         desc: 'Social-first, mobile buyers' },
      { value: 'b2c_mature',     emoji: '👤',   label: 'Consumers aged 35–55',         desc: 'Value-driven, trust-focused' },
      { value: 'b2b_small',      emoji: '🏪',   label: 'Small business owners',        desc: 'Decision makers, budget-conscious' },
      { value: 'b2b_enterprise', emoji: '🏢',   label: 'Enterprise / Corporate',       desc: 'Multi-stakeholder, long sales cycle' },
      { value: 'mixed',          emoji: '🌐',   label: 'Mixed — B2B and B2C both',     desc: 'Broad market reach' },
    ],
  },
  {
    id: 'goal',
    type: 'choice',
    label: 'Q5 of 8',
    question: "What's your primary marketing goal right now?",
    hint: 'Your CMO will focus every agent and campaign recommendation around this goal.',
    cols: 3,
    options: [
      { value: 'leads',     emoji: '🎯', label: 'Generate Leads',          desc: 'Fill your pipeline with prospects' },
      { value: 'sales',     emoji: '💰', label: 'Drive Sales',             desc: 'Convert prospects to customers fast' },
      { value: 'awareness', emoji: '📢', label: 'Build Brand Awareness',   desc: 'Get known by more people' },
      { value: 'social',    emoji: '📈', label: 'Grow Social Following',   desc: 'Build a loyal online audience' },
      { value: 'launch',    emoji: '🚀', label: 'Launch a New Product',    desc: 'Bring something new to market' },
      { value: 'engage',    emoji: '💬', label: 'Retain & Engage Customers', desc: 'Keep your existing base active' },
    ],
  },
  {
    id: 'platforms',
    type: 'multiselect',
    label: 'Q6 of 8',
    question: 'Which platforms do you market on?',
    hint: 'Select all that apply — your CMO will focus campaigns on these channels.',
    options: [
      { value: 'instagram', emoji: '📸', label: 'Instagram' },
      { value: 'facebook',  emoji: '👥', label: 'Facebook' },
      { value: 'linkedin',  emoji: '💼', label: 'LinkedIn' },
      { value: 'tiktok',    emoji: '🎵', label: 'TikTok' },
      { value: 'youtube',   emoji: '▶️', label: 'YouTube' },
      { value: 'twitter',   emoji: '🐦', label: 'Twitter / X' },
      { value: 'email',     emoji: '📧', label: 'Email Marketing' },
      { value: 'google',    emoji: '🔍', label: 'Google / SEO' },
      { value: 'whatsapp',  emoji: '💬', label: 'WhatsApp' },
    ],
  },
  {
    id: 'tone',
    type: 'choice',
    label: 'Q7 of 8',
    question: "What's your brand's tone of voice?",
    hint: 'Every caption, email, and ad your CMO writes will match this voice exactly.',
    cols: 3,
    options: [
      { value: 'professional', emoji: '🎩', label: 'Professional',     desc: 'Expert, trustworthy, formal' },
      { value: 'casual',       emoji: '😊', label: 'Casual & Friendly', desc: 'Warm, approachable, human' },
      { value: 'bold',         emoji: '⚡', label: 'Bold & Direct',     desc: 'Confident, punchy, stands out' },
      { value: 'luxury',       emoji: '💎', label: 'Luxury & Premium',  desc: 'Refined, aspirational, exclusive' },
      { value: 'playful',      emoji: '🎉', label: 'Playful & Fun',     desc: 'Light-hearted, energetic, quirky' },
      { value: 'educational',  emoji: '📖', label: 'Educational',       desc: 'Informative, helpful, insightful' },
    ],
  },
  {
    id: 'challenge',
    type: 'choice',
    label: 'Q8 of 8',
    question: "What's your biggest marketing challenge right now?",
    hint: 'Your CMO will prioritise fixing this first.',
    cols: 2,
    options: [
      { value: 'content',   emoji: '📝', label: 'Creating content consistently',   desc: 'Not enough time or ideas' },
      { value: 'leads',     emoji: '🎯', label: 'Not getting enough leads',        desc: 'Traffic but no conversions' },
      { value: 'growth',    emoji: '📉', label: 'Slow follower / audience growth', desc: 'Low engagement and reach' },
      { value: 'channels',  emoji: '🔀', label: 'Managing multiple channels',      desc: 'Spread too thin across platforms' },
      { value: 'budget',    emoji: '💸', label: 'Limited marketing budget',        desc: 'Need to do more with less' },
      { value: 'analytics', emoji: '📊', label: "Not knowing what's working",      desc: 'No clear data or attribution' },
    ],
  },
]

/* ── Agent recommendations engine ──────────────────────────────────────────── */
function buildAgentRecs({ industry, goal, audience, platforms = [], challenge }) {
  const all = [
    { emoji: '📊', label: 'Marketing Strategy',   route: '/strategy',        color: '#c8973e', why: 'Annual plan, KPIs & brand positioning' },
    { emoji: '✍️', label: 'Caption Suite',         route: '/caption-suite',   color: '#10b981', why: 'Social captions & hashtags for all platforms' },
    { emoji: '📝', label: 'Content Generation',   route: '/content-gen',     color: '#6366f1', why: '30-day content plan & blog posts' },
    { emoji: '📧', label: 'Email Marketing',       route: '/email-marketing', color: '#a855f7', why: 'Campaigns, sequences & newsletters' },
    { emoji: '🔍', label: 'SEO Agent',             route: '/seo-agent',       color: '#3b82f6', why: 'Rank higher on Google with keyword content' },
    { emoji: '🎬', label: 'Reel Scripts',          route: '/reel-scripts',    color: '#f59e0b', why: 'TikTok & Reels video scripts' },
    { emoji: '📸', label: 'Product Images',        route: '/image-angles',    color: '#f97316', why: 'Multi-angle product photography' },
    { emoji: '📝', label: 'Copywriting Agent',     route: '/copywriting',     color: '#ec4899', why: 'Ads, landing pages & web copy' },
    { emoji: '📣', label: 'Meta Ads Boost',        route: '/meta-ads-boost',  color: '#ef4444', why: 'Facebook & Instagram ad campaigns' },
    { emoji: '🧪', label: 'A/B Testing',           route: '/ab-testing',      color: '#06b6d4', why: 'Test headlines, CTAs & creatives' },
  ]
  const pick = (...names) => names.map(n => all.find(a => a.label === n)).filter(Boolean)

  // Industry-first
  if (industry === 'ecommerce')  return pick('Caption Suite', 'Product Images', 'Email Marketing', 'Meta Ads Boost')
  if (industry === 'tech')       return pick('SEO Agent', 'Copywriting Agent', 'Email Marketing', 'Content Generation')
  if (industry === 'fashion')    return pick('Caption Suite', 'Reel Scripts', 'Product Images', 'Content Generation')
  if (industry === 'food')       return pick('Caption Suite', 'Reel Scripts', 'Content Generation', 'Email Marketing')
  if (industry === 'health')     return pick('Caption Suite', 'Content Generation', 'Reel Scripts', 'Email Marketing')
  if (industry === 'education')  return pick('Content Generation', 'Email Marketing', 'SEO Agent', 'Caption Suite')
  if (industry === 'realestate') return pick('Marketing Strategy', 'Caption Suite', 'Email Marketing', 'Copywriting Agent')
  if (industry === 'finance')    return pick('Marketing Strategy', 'Copywriting Agent', 'Email Marketing', 'SEO Agent')

  // Goal-based fallback
  if (goal === 'leads')     return pick('Copywriting Agent', 'Email Marketing', 'SEO Agent', 'A/B Testing')
  if (goal === 'sales')     return pick('Caption Suite', 'Meta Ads Boost', 'Copywriting Agent', 'Email Marketing')
  if (goal === 'social')    return pick('Caption Suite', 'Reel Scripts', 'Content Generation', 'A/B Testing')
  if (goal === 'awareness') return pick('Marketing Strategy', 'Content Generation', 'SEO Agent', 'Caption Suite')
  if (goal === 'launch')    return pick('Marketing Strategy', 'Caption Suite', 'Copywriting Agent', 'Meta Ads Boost')

  return pick('Marketing Strategy', 'Caption Suite', 'Content Generation', 'Email Marketing')
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function BrandKnowledgeBase() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState({})
  const [dir,     setDir]     = useState(1)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(true)

  // Ref always holds the latest answers — avoids stale closure in setTimeout handlers
  const answersRef = useRef({})
  useEffect(() => { answersRef.current = answers }, [answers])

  // Pre-fill existing answers if user has already done this
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    getKnowledgeBase(user.uid).then(kb => {
      if (kb) {
        const pre = {}
        QUESTIONS.forEach(q => { if (kb[q.id]) pre[q.id] = kb[q.id] })
        setAnswers(pre)
        answersRef.current = pre
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  const q = QUESTIONS[step]
  const total = QUESTIONS.length

  const canContinue = (ans = answers) => {
    if (q.required === false) return true
    const val = ans[q.id]
    if (q.type === 'text' || q.type === 'textarea') return !!(val?.trim())
    if (q.type === 'multiselect') return !!(val?.length > 0)
    return !!val
  }

  const set = (key, val) => {
    const next = { ...answersRef.current, [key]: val }
    answersRef.current = next
    setAnswers(next)
  }

  const toggleMulti = (key, val) => {
    const curr = answersRef.current[key] || []
    set(key, curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val])
  }

  const advance = () => {
    setDir(1)
    setStep(s => s + 1)
  }

  const next = () => {
    if (!canContinue()) return
    if (step < total - 1) {
      advance()
    } else {
      handleFinish()
    }
  }

  // Called by choice cards — uses answersRef to avoid stale closure
  const selectChoice = (qId, val) => {
    set(qId, val)
    setTimeout(() => {
      if (step < total - 1) {
        setDir(1)
        setStep(s => s + 1)
      } else {
        handleFinish()
      }
    }, 220)
  }

  const back = () => {
    if (step === 0) { navigate(-1); return }
    setDir(-1)
    setStep(s => s - 1)
  }

  const handleFinish = async () => {
    const finalAnswers = answersRef.current
    setSaving(true)
    const recs = buildAgentRecs(finalAnswers)
    try {
      if (user?.uid) {
        await saveKnowledgeBase(user.uid, { ...finalAnswers, completedAt: new Date().toISOString() })
        await updateDoc(doc(db, 'users', user.uid), {
          brandKbComplete: true,
          onboardingComplete: true,
          brandSetupComplete: true,
          brandName: finalAnswers.businessName || '',
          recommendedRoutes: recs.map(r => r.route),
          brandKbUpdatedAt: serverTimestamp(),
        })
        sessionStorage.setItem('evox_setup_recs', JSON.stringify(recs))
        sessionStorage.removeItem('evox_welcome_dismissed')
      }
    } catch (e) { console.error(e) }
    setDone(true)
    setTimeout(() => navigate('/dashboard'), 2400)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} color={GOLD} style={{ animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const progress = ((step + (done ? 1 : 0)) / total) * 100

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideFromRight { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes slideFromLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,151,62,0.18); border-radius: 4px; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${GOLD},#8b5e1e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#0a0907' }}>E</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: TEXT, letterSpacing: '0.05em' }}>EVOX CMO</div>
            <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.12em', fontWeight: 600 }}>BRAND PROFILE</div>
          </div>
        </div>
        {!done && (
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 600 }}>
            Question <span style={{ color: GOLD, fontWeight: 800 }}>{step + 1}</span> of {total}
          </div>
        )}
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', margin: '16px 0 0' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg,${GOLD},#f59e0b)`, borderRadius: '0 2px 2px 0' }}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>

            {/* ── DONE SCREEN ── */}
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#f59e0b)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Sparkles size={30} color="#0a0907"/>
                </motion.div>
                <div style={{ fontSize: 26, fontWeight: 900, color: TEXT, fontFamily: "'Syne','Inter',sans-serif" }}>
                  Your CMO knows your brand!
                </div>
                <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, maxWidth: 380 }}>
                  EVOX AI has built your brand profile and selected the best agents to hit your goals.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: TEXT3 }}>Opening your personalised dashboard…</div>
              </motion.div>

            ) : (
              /* ── QUESTION SCREEN — key change unmounts/remounts, CSS handles slide-in ── */
              <div
                key={step}
                style={{ animation: `${dir > 0 ? 'slideFromRight' : 'slideFromLeft'} 0.22s cubic-bezier(0.22,1,0.36,1) both` }}
              >
                {/* Q label */}
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {q.label}
                </div>

                {/* Question */}
                <h2 style={{ fontSize: 28, fontWeight: 900, color: TEXT, margin: '0 0 8px', fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1.25 }}>
                  {q.question}
                </h2>

                {/* Hint */}
                <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 32px', lineHeight: 1.65 }}>
                  {q.hint}
                </p>

                {/* ── Text input ── */}
                {q.type === 'text' && (
                  <input
                    autoFocus
                    value={answers[q.id] || ''}
                    onChange={e => set(q.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && next()}
                    placeholder={q.placeholder}
                    style={{
                      width: '100%', padding: '16px 18px',
                      background: CARD, border: `1px solid ${answers[q.id] ? GBORD : BORDER}`,
                      borderRadius: 14, color: TEXT, fontSize: 16, outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                      transition: 'border 0.15s',
                    }}
                    onFocus={e => e.target.style.border = `1px solid ${GOLD}`}
                    onBlur={e => e.target.style.border = `1px solid ${answers[q.id] ? GBORD : BORDER}`}
                  />
                )}

                {/* ── Textarea ── */}
                {q.type === 'textarea' && (
                  <textarea
                    autoFocus
                    value={answers[q.id] || ''}
                    onChange={e => set(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={4}
                    style={{
                      width: '100%', padding: '16px 18px',
                      background: CARD, border: `1px solid ${answers[q.id] ? GBORD : BORDER}`,
                      borderRadius: 14, color: TEXT, fontSize: 14, outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
                      lineHeight: 1.7, transition: 'border 0.15s',
                    }}
                    onFocus={e => e.target.style.border = `1px solid ${GOLD}`}
                    onBlur={e => e.target.style.border = `1px solid ${answers[q.id] ? GBORD : BORDER}`}
                  />
                )}

                {/* ── Single-select choice grid ── */}
                {q.type === 'choice' && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.cols || 3}, 1fr)`, gap: 10 }}>
                    {q.options.map(opt => {
                      const sel = answers[q.id] === opt.value
                      return (
                        <ChoiceCard
                          key={opt.value}
                          opt={opt}
                          selected={sel}
                          onClick={() => selectChoice(q.id, opt.value)}
                        />
                      )
                    })}
                  </div>
                )}

                {/* ── Multi-select ── */}
                {q.type === 'multiselect' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {q.options.map(opt => {
                      const sel = (answers[q.id] || []).includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleMulti(q.id, opt.value)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 18px',
                            background: sel ? GDIM : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${sel ? GOLD : BORDER}`,
                            borderRadius: 12, cursor: 'pointer',
                            color: sel ? GOLD : TEXT2,
                            fontSize: 13, fontWeight: sel ? 700 : 400,
                            fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = GBORD; e.currentTarget.style.color = TEXT } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 } }}
                        >
                          <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                          {opt.label}
                          {sel && <Check size={13} color={GOLD}/>}
                        </button>
                      )
                    })}
                  </div>
                )}

              </div>
            )}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      {!done && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 32px', background: `${BG}ee`, backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={back}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', background: 'none',
              border: `1px solid ${BORDER}`, borderRadius: 10,
              color: TEXT2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GBORD; e.currentTarget.style.color = TEXT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2 }}
          >
            <ArrowLeft size={14}/> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 5 }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                  background: i < step ? GOLD : i === step ? GOLD : BORDER,
                  opacity: i < step ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}/>
              ))}
            </div>

            {/* Continue / skip for choice questions (auto-advance), show for text/textarea/multiselect */}
            {(q.type === 'text' || q.type === 'textarea' || q.type === 'multiselect') && (
              <button
                onClick={next}
                disabled={!canContinue() || saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '11px 24px',
                  background: canContinue() ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.07)',
                  border: 'none', borderRadius: 11,
                  color: canContinue() ? '#0a0907' : TEXT3,
                  fontSize: 14, fontWeight: 800, cursor: canContinue() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                {saving
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }}/> Saving…</>
                  : step === total - 1
                    ? <><Sparkles size={15}/> Build My CMO Profile</>
                    : <>Continue <ArrowRight size={15}/></>
                }
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── ChoiceCard sub-component ───────────────────────────────────────────────── */
function ChoiceCard({ opt, selected, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '16px 14px',
        background: selected ? GDIM : hov ? 'rgba(200,151,62,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? GOLD : hov ? GBORD : BORDER}`,
        borderRadius: 14, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
        fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
        boxShadow: selected ? `0 0 0 1px rgba(200,151,62,0.15)` : 'none',
        position: 'relative', textAlign: 'left',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={11} color="#0a0907" strokeWidth={3}/>
        </div>
      )}
      <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? GOLD : 'rgba(240,235,224,0.8)', lineHeight: 1.3 }}>
        {opt.label}
      </span>
      {opt.desc && (
        <span style={{ fontSize: 11, color: TEXT3, lineHeight: 1.4 }}>{opt.desc}</span>
      )}
    </motion.button>
  )
}
