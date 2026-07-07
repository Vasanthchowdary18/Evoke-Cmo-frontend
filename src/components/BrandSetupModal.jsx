import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth.js'
import { saveKnowledgeBase } from '../services/knowledgeBaseService.js'
import { X, ArrowRight, ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react'

const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.3)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.3)'
const CARD   = '#1a1714'
const BORDER = 'rgba(255,255,255,0.08)'

const QUESTIONS = [
  {
    key: 'businessName',
    step: 1,
    title: "What's your business name?",
    subtitle: 'We personalise every AI agent output around your brand identity.',
    type: 'text',
    placeholder: 'e.g. Evoke Marketing Co.',
  },
  {
    key: 'industry',
    step: 2,
    title: 'What industry are you in?',
    subtitle: 'Select all that apply — we tailor agents to every vertical you operate in.',
    type: 'choice',
    multi: true,
    cols: 4,
    options: [
      { value: 'ecommerce',   label: 'E-commerce',       emoji: '🛍️' },
      { value: 'saas',        label: 'SaaS / Tech',       emoji: '💻' },
      { value: 'services',    label: 'Services',          emoji: '🤝' },
      { value: 'restaurant',  label: 'Food & Beverage',   emoji: '🍽️' },
      { value: 'fashion',     label: 'Fashion & Apparel', emoji: '👗' },
      { value: 'health',      label: 'Health & Fitness',  emoji: '💪' },
      { value: 'education',   label: 'Education',         emoji: '📚' },
      { value: 'other',       label: 'Other',             emoji: '✨' },
    ],
  },
  {
    key: 'audience',
    step: 3,
    title: 'Who is your target audience?',
    subtitle: 'Select all that apply — your audience shapes tone and platform strategy.',
    type: 'choice',
    multi: true,
    cols: 2,
    options: [
      { value: 'b2c_young',      label: 'Consumers 18–35',          emoji: '🧑' },
      { value: 'b2c_mature',     label: 'Consumers 35–55',          emoji: '👤' },
      { value: 'b2b_small',      label: 'Small Businesses',         emoji: '🏪' },
      { value: 'b2b_enterprise', label: 'Enterprise / Corporate',   emoji: '🏢' },
      { value: 'mixed',          label: 'Mixed — Both B2B & B2C',   emoji: '🌐' },
    ],
  },
  {
    key: 'goal',
    step: 4,
    title: "What's your main marketing goal?",
    subtitle: "Select all that apply — we'll prioritise agents that drive these outcomes.",
    type: 'choice',
    multi: true,
    cols: 2,
    options: [
      { value: 'social_growth',   label: 'Grow Social Following',      emoji: '📈' },
      { value: 'leads',           label: 'Generate Leads & Enquiries', emoji: '🎯' },
      { value: 'sales',           label: 'Drive Online Sales',         emoji: '💰' },
      { value: 'brand_awareness', label: 'Build Brand Awareness',      emoji: '✨' },
    ],
  },
  {
    key: 'tone',
    step: 5,
    title: "What's your brand's tone of voice?",
    subtitle: 'Select all that apply — shapes every piece of AI content we generate.',
    type: 'choice',
    multi: true,
    cols: 2,
    options: [
      { value: 'professional', label: 'Professional & Authoritative', emoji: '🎩' },
      { value: 'casual',       label: 'Casual & Friendly',            emoji: '😊' },
      { value: 'bold',         label: 'Bold & Edgy',                  emoji: '⚡' },
      { value: 'luxury',       label: 'Luxury & Premium',             emoji: '💎' },
      { value: 'educational',  label: 'Educational & Informative',    emoji: '📖' },
    ],
  },
]

/* Agent catalogue — used for scoring */
const AGENT_CATALOGUE = [
  { label: 'Marketing Strategy',   route: '/strategy',        color: '#c8973e', emoji: '📊' },
  { label: 'Caption Suite',        route: '/caption-suite',   color: '#10b981', emoji: '✍️' },
  { label: 'Content Generation',   route: '/content-gen',     color: '#6366f1', emoji: '📝' },
  { label: 'Reel Scripts',         route: '/reel-scripts',    color: '#f59e0b', emoji: '🎬' },
  { label: 'Copywriting Agent',    route: '/copywriting',     color: '#ec4899', emoji: '✏️' },
  { label: 'Product Description',  route: '/product-desc',    color: '#84cc16', emoji: '📦' },
  { label: 'Product Image Angles', route: '/image-angles',    color: '#f97316', emoji: '📸' },
  { label: 'Video Generation',     route: '/video-gen',       color: '#f97316', emoji: '🎥' },
  { label: 'SEO Agent',            route: '/seo-agent',       color: '#3b82f6', emoji: '🔍' },
  { label: 'Email Marketing',      route: '/email-marketing', color: '#a855f7', emoji: '📧' },
  { label: 'Meta Ads Boost',       route: '/meta-ads-boost',  color: '#ef4444', emoji: '📣' },
  { label: 'Campaign Hub',         route: '/campaign-hub',    color: '#f59e0b', emoji: '🚀' },
]

const REASONS = {
  'Marketing Strategy':   'Build your annual plan, KPIs and brand positioning',
  'Caption Suite':        'AI captions and hashtags for every social platform',
  'Content Generation':   '30-day content calendar and blog posts',
  'Reel Scripts':         'TikTok & Reels scripts that grow your following',
  'Copywriting Agent':    'Landing pages, ads and web copy that convert',
  'Product Description':  'SEO-optimised product copy that drives sales',
  'Product Image Angles': 'Professional multi-angle product photography',
  'Video Generation':     'AI-powered video ads and content',
  'SEO Agent':            'Rank higher on Google with keyword-rich content',
  'Email Marketing':      'Nurture sequences and newsletters that convert',
  'Meta Ads Boost':       'Facebook & Instagram ad campaigns that convert',
  'Campaign Hub':         'End-to-end campaign planning and management',
}

export function getRecommendations(brandSetup) {
  const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : [])
  const industries = toArr(brandSetup?.industry).map(s => s.toLowerCase())
  const goals      = toArr(brandSetup?.goal)
  const audiences  = toArr(brandSetup?.audience)

  const hasIndustry = (...ids) => ids.some(i => industries.some(ind => ind.includes(i)))
  const hasGoal     = (...gs)  => gs.some(g => goals.includes(g))
  const hasAudience = (...as)  => as.some(a => audiences.includes(a))

  const scores = {}
  const boost  = (name, pts) => { scores[name] = (scores[name] || 0) + pts }

  // Goal signals
  if (hasGoal('social_growth'))   { boost('Caption Suite', 4); boost('Reel Scripts', 3); boost('Content Generation', 2); boost('Video Generation', 2) }
  if (hasGoal('leads'))           { boost('Copywriting Agent', 4); boost('SEO Agent', 3); boost('Email Marketing', 3); boost('Campaign Hub', 2) }
  if (hasGoal('sales'))           { boost('Product Description', 4); boost('Product Image Angles', 3); boost('Caption Suite', 2); boost('Meta Ads Boost', 3) }
  if (hasGoal('brand_awareness')) { boost('Content Generation', 4); boost('Marketing Strategy', 3); boost('Caption Suite', 2); boost('SEO Agent', 2) }

  // Industry signals
  if (hasIndustry('ecommerce', 'retail', 'fashion', 'clothing')) { boost('Product Description', 3); boost('Product Image Angles', 3); boost('Caption Suite', 2) }
  if (hasIndustry('saas', 'tech', 'software', 'startup'))        { boost('SEO Agent', 3); boost('Copywriting Agent', 2); boost('Email Marketing', 2) }
  if (hasIndustry('restaurant', 'food'))                          { boost('Caption Suite', 3); boost('Reel Scripts', 3); boost('Content Generation', 2) }
  if (hasIndustry('health', 'fitness'))                           { boost('Caption Suite', 3); boost('Content Generation', 3); boost('Reel Scripts', 2) }
  if (hasIndustry('education'))                                   { boost('Content Generation', 3); boost('Email Marketing', 3); boost('SEO Agent', 2) }
  if (hasIndustry('services'))                                    { boost('Email Marketing', 3); boost('Copywriting Agent', 3); boost('Marketing Strategy', 2) }

  // Audience signals
  if (hasAudience('b2b_small', 'b2b_enterprise'))  { boost('Email Marketing', 2); boost('Marketing Strategy', 2) }
  if (hasAudience('b2c_young'))                     { boost('Caption Suite', 2); boost('Reel Scripts', 2); boost('Video Generation', 1) }
  if (hasAudience('b2c_mature'))                    { boost('Email Marketing', 2); boost('Content Generation', 2) }

  const ranked = AGENT_CATALOGUE
    .map(a => ({ ...a, score: scores[a.label] || 0 }))
    .filter(a => a.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(a => ({ ...a, reason: REASONS[a.label] || 'Recommended for your brand' }))

  return ranked.length >= 2 ? ranked : [
    { label: 'Marketing Strategy', route: '/strategy',      color: '#c8973e', emoji: '📊', reason: 'Start with a clear annual marketing plan' },
    { label: 'Caption Suite',      route: '/caption-suite', color: '#10b981', emoji: '✍️', reason: 'Consistent social media presence' },
    { label: 'Content Generation', route: '/content-gen',   color: '#6366f1', emoji: '📝', reason: 'AI-written blog posts and landing pages' },
  ]
}

/* Helper: get current selection as array */
function getArr(val) {
  if (Array.isArray(val)) return val
  if (val) return [val]
  return []
}

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '£0',
    period: 'forever',
    color: '#6b7280',
    badge: 'Start free',
    desc: 'Perfect for exploring EVOX AI and setting up your brand profile.',
    features: ['4 core AI agents', 'Brand Knowledge Base', 'Marketing Strategy', 'KPI Recommendations'],
  },
  {
    key: 'package-a',
    name: 'Package A',
    price: '£49',
    period: '/month',
    color: '#c8973e',
    badge: 'Most popular',
    desc: 'Everything you need to create and publish great content.',
    features: ['12 AI agents', 'Caption Suite & Copywriting', 'Video & Reel Scripts', 'Product Images & Descriptions'],
    highlight: true,
  },
  {
    key: 'package-b',
    name: 'Package B',
    price: '£149',
    period: '/month',
    color: '#3b82f6',
    badge: 'Growth',
    desc: 'Full marketing automation with analytics and campaign management.',
    features: ['20+ AI agents', 'Email & SEO Automation', 'A/B Testing & Analytics', 'Approval Queue & CRM'],
  },
  {
    key: 'package-c',
    name: 'Package C',
    price: '£299',
    period: '/month',
    color: '#f59e0b',
    badge: 'Enterprise',
    desc: 'Complete CMO suite with paid ads and full campaign execution.',
    features: ['All 25+ AI agents', 'Meta & Google Ads', 'Full Campaign Execution', 'Team Management'],
  },
]

export default function BrandSetupModal({ onComplete, onDismiss }) {
  const { user } = useAuth()

  // Read plan chosen on the home page pricing section
  const [selectedPlan, setSelectedPlan] = useState(() => {
    try { return localStorage.getItem('evoke_selected_package') || 'free' } catch { return 'free' }
  })
  const [step,         setStep]         = useState(0)
  const [answers,      setAnswers]      = useState({})
  const [saving,       setSaving]       = useState(false)
  const [done,         setDone]         = useState(false)
  const [dir,          setDir]          = useState(1)
  const answersRef = useRef({})

  const q       = QUESTIONS[step]
  const isLast  = step === QUESTIONS.length - 1
  const current = answers[q.key]

  // canNext: text needs non-empty string; choice needs at least 1 selected
  const canNext = q.type === 'text'
    ? !!(current?.trim())
    : getArr(current).length > 0

  const setAnswer = (key, val) => {
    const next = { ...answersRef.current, [key]: val }
    answersRef.current = next
    setAnswers(next)
  }

  // Toggle one option in/out of the array
  const toggleChoice = (key, val) => {
    const arr = getArr(answersRef.current[key])
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
    setAnswer(key, next)
  }

  // Select all / deselect all
  const toggleAll = (key, options) => {
    const arr   = getArr(answersRef.current[key])
    const allVals = options.map(o => o.value)
    const allSelected = allVals.every(v => arr.includes(v))
    setAnswer(key, allSelected ? [] : allVals)
  }

  const go = (delta) => {
    setDir(delta)
    setStep(s => s + delta)
  }

  const handleFinish = async () => {
    const final = { ...answersRef.current, selectedPlan: selectedPlan || 'free' }
    setSaving(true)
    try {
      const recs = getRecommendations(final)
      if (user?.uid) {
        await saveKnowledgeBase(user.uid, { ...final, completedAt: new Date().toISOString() })
        await updateDoc(doc(db, 'users', user.uid), {
          brandSetupComplete: true,
          brandKbComplete:    true,
          onboardingComplete: true,
          brandName:          final.businessName || '',
          brandSetup:         { ...final, completedAt: serverTimestamp() },
          recommendedRoutes:  recs.map(r => r.route),
          selectedPlan:       final.selectedPlan,
          userPlan:           final.selectedPlan,
        })
        sessionStorage.setItem('evox_setup_recs', JSON.stringify(recs))
      }
      try { localStorage.removeItem('evoke_selected_package') } catch {}
      setDone(true)
      setTimeout(() => onComplete(final, recs), 1400)
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(8,7,5,0.88)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter',sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: 540,
          background: '#111009',
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          transition: 'max-width 0.3s ease',
        }}>

        {/* Top gold accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, #f59e0b, ${GOLD})` }} />

        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg,${GOLD},#8b5e1e)`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#0e0c09' }}>E</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: TEXT, letterSpacing: '0.05em' }}>EVOX CMO</span>
            <span style={{ fontSize: 11, color: TEXT3, marginLeft: 4 }}>— Brand Setup</span>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = TEXT}
            onMouseLeave={e => e.currentTarget.style.color = TEXT3}>
            <X size={16}/>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 28px 0' }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{
              height: 4, flex: 1, borderRadius: 2,
              background: i <= step ? GOLD : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease',
            }}/>
          ))}
        </div>
        <div style={{ padding: '6px 28px 0', fontSize: 10, color: TEXT3 }}>
          Step {step + 1} of {QUESTIONS.length}
        </div>

        {/* Question content */}
        <div style={{ padding: '24px 28px 28px', minHeight: 320, overflow: 'hidden' }}>
          <style>{`
            @keyframes modalSlideR { from { opacity:0; transform:translateX(36px);  } to { opacity:1; transform:translateX(0); } }
            @keyframes modalSlideL { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }
            @keyframes modalFadeIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {done ? (
            <div style={{ animation: 'modalFadeIn 0.3s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 16 }}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#f59e0b)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={28} color="#0e0c09"/>
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Your CMO is personalised!</div>
                <div style={{ fontSize: 13, color: TEXT2 }}>Opening your dashboard…</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}/>
                ))}
              </div>
            </div>
          ) : (
            <div key={step} style={{ animation: `${dir > 0 ? 'modalSlideR' : 'modalSlideL'} 0.22s cubic-bezier(0.22,1,0.36,1) both` }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: '0 0 6px', lineHeight: 1.3 }}>{q.title}</h2>
              <p style={{ fontSize: 13, color: TEXT2, margin: '0 0 16px', lineHeight: 1.6 }}>{q.subtitle}</p>

              {q.type === 'text' ? (
                <input
                  autoFocus
                  value={current || ''}
                  onChange={e => setAnswer(q.key, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext && go(1)}
                  placeholder={q.placeholder}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: CARD, border: `1px solid ${current ? GBORD : BORDER}`,
                    borderRadius: 12, color: TEXT, fontSize: 15, fontWeight: 500,
                    outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.border = `1px solid ${GOLD}`}
                  onBlur={e => e.target.style.border = `1px solid ${current ? GBORD : BORDER}`}
                />
              ) : (
                <>
                  {/* Select All row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    {/* Selection count badge */}
                    <span style={{ fontSize: 10, color: TEXT3 }}>
                      {getArr(current).length > 0
                        ? `${getArr(current).length} selected`
                        : 'Select one or more'}
                    </span>
                    <button
                      onClick={() => toggleAll(q.key, q.options)}
                      style={{
                        padding: '4px 11px',
                        background: getArr(current).length === q.options.length ? GDIM : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${getArr(current).length === q.options.length ? GBORD : BORDER}`,
                        borderRadius: 100, cursor: 'pointer',
                        fontSize: 10, fontWeight: 700,
                        color: getArr(current).length === q.options.length ? GOLD : TEXT2,
                        fontFamily: 'inherit', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                      {getArr(current).length === q.options.length
                        ? <><Check size={10}/> All Selected</>
                        : 'Select All'}
                    </button>
                  </div>

                  {/* Option grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.cols}, 1fr)`, gap: 8 }}>
                    {q.options.map(opt => {
                      const selected = getArr(current).includes(opt.value)
                      return (
                        <button key={opt.value}
                          onClick={() => toggleChoice(q.key, opt.value)}
                          style={{
                            padding: '12px 10px',
                            background: selected ? GDIM : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selected ? GOLD : BORDER}`,
                            borderRadius: 12, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s ease', position: 'relative',
                            boxShadow: selected ? `0 0 0 1px ${GOLD}30` : 'none',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { if (!selected) e.currentTarget.style.border = `1px solid rgba(200,151,62,0.4)` }}
                          onMouseLeave={e => { if (!selected) e.currentTarget.style.border = `1px solid ${BORDER}` }}
                        >
                          {selected && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#0e0c09" strokeWidth={3}/>
                            </div>
                          )}
                          <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? GOLD : TEXT2, textAlign: 'center', lineHeight: 1.3 }}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{ padding: '0 28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => step > 0 && go(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px', background: 'none',
                border: `1px solid ${step === 0 ? 'transparent' : BORDER}`,
                borderRadius: 10, color: step === 0 ? 'transparent' : TEXT2,
                cursor: step === 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
              <ArrowLeft size={14}/> Back
            </button>

            {isLast ? (
              <button onClick={handleFinish} disabled={!canNext || saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 22px',
                  background: canNext ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 10,
                  color: canNext ? '#0e0c09' : TEXT3,
                  cursor: canNext ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }}/> : <Sparkles size={14}/>}
                {saving ? 'Setting up…' : 'Get My Recommendations'}
              </button>
            ) : (
              <button onClick={() => canNext && go(1)} disabled={!canNext}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 22px',
                  background: canNext ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 10,
                  color: canNext ? '#0e0c09' : TEXT3,
                  cursor: canNext ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}>
                Continue <ArrowRight size={14}/>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
