import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getUserData, saveOnboardingData } from '../services/userService'

// ─── Onboarding questions ────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'background',
    question: (name) =>
      `Hey ${name}! 👋 I'm your AI CMO — I handle your marketing so you don't have to.\n\nBefore I start building campaigns for you, I have a quick question.\n\nWhat's your background?`,
    options: [
      { value: 'founder',   emoji: '🚀', label: 'Founder / Startup',     desc: 'Building something new' },
      { value: 'marketer',  emoji: '📊', label: 'Marketing Professional', desc: 'Driving growth & campaigns' },
      { value: 'agency',    emoji: '🏢', label: 'Agency / Freelancer',    desc: 'Running campaigns for clients' },
      { value: 'ecommerce', emoji: '🛍️', label: 'E-commerce Seller',      desc: 'Selling products online' },
      { value: 'creator',   emoji: '🎨', label: 'Content Creator',        desc: 'Building an audience' },
      { value: 'other',     emoji: '✨', label: 'Something else',          desc: 'Another role' },
    ],
  },
  {
    id: 'industry',
    question: () => `Got it! Now tell me — what industry are you in?`,
    options: [
      { value: 'tech',       emoji: '💻', label: 'Tech / SaaS',      desc: 'Software & technology' },
      { value: 'fashion',    emoji: '👗', label: 'Fashion / Retail',  desc: 'Clothing & lifestyle' },
      { value: 'food',       emoji: '🍕', label: 'Food & Beverage',   desc: 'Restaurants & FMCG' },
      { value: 'health',     emoji: '🏥', label: 'Health & Wellness', desc: 'Healthcare & fitness' },
      { value: 'finance',    emoji: '💰', label: 'Finance / Fintech', desc: 'Banking & financial' },
      { value: 'education',  emoji: '📚', label: 'Education',         desc: 'EdTech & learning' },
      { value: 'realestate', emoji: '🏠', label: 'Real Estate',       desc: 'Property & construction' },
      { value: 'other',      emoji: '🌐', label: 'Other Industry',    desc: 'Something else' },
    ],
  },
  {
    id: 'goal',
    question: () => `Almost there! Last question — what's your primary marketing goal right now?`,
    options: [
      { value: 'leads',    emoji: '🎯', label: 'Generate Leads',         desc: 'Grow your customer base' },
      { value: 'awareness',emoji: '📢', label: 'Build Brand Awareness',  desc: 'Get noticed by more people' },
      { value: 'launch',   emoji: '🚀', label: 'Launch Products',        desc: 'Bring products to market' },
      { value: 'sales',    emoji: '💳', label: 'Drive Sales',            desc: 'Increase revenue fast' },
      { value: 'social',   emoji: '📱', label: 'Grow Social Following',  desc: 'Build a loyal audience' },
      { value: 'engage',   emoji: '💬', label: 'Engage Customers',       desc: 'Retain & delight your base' },
    ],
  },
]

const bgLabel    = (v) => STEPS[0].options.find(o => o.value === v)?.label || v
const goalLabel  = (v) => STEPS[2].options.find(o => o.value === v)?.label || v

// ─── Agent avatar ─────────────────────────────────────────────────────────────
function AgentAvatar() {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 18px rgba(124,58,237,0.5)',
    }}>
      <Zap size={17} color="#fff" fill="#fff" />
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '4px 2px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
        }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Render newlines in text ──────────────────────────────────────────────────
function AgentText({ text }) {
  return (
    <div style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap' }}>
      {text}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const { user, authReady } = useRequireAuth()
  const [step, setStep] = useState(-1)          // -1 = loading, 0/1/2 = questions, 3 = done
  const [answers, setAnswers] = useState({})
  const [messages, setMessages] = useState([])   // [{role:'agent'|'user', text, isDone?}]
  const [isTyping, setIsTyping] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages, isTyping, showOptions])

  // Redirect if onboarding already complete
  useEffect(() => {
    if (!authReady || !user) return
    getUserData(user.uid).then((userData) => {
      if (userData?.onboardingComplete) navigate('/dashboard')
    })
  }, [authReady, user, navigate])

  // Fire first question once user is known
  useEffect(() => {
    if (!user) return
    const firstName = user.displayName?.split(' ')[0] || 'there'
    pushAgentMessage(STEPS[0].question(firstName), 0)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ──────────────────────────────────────────────────────────────────
  const pushAgentMessage = (text, nextStep, isDone = false) => {
    setIsTyping(true)
    setShowOptions(false)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'agent', text, isDone }])
      setStep(nextStep)
      if (!isDone) setTimeout(() => setShowOptions(true), 280)
    }, 1300)
  }

  const handleAnswer = async (option) => {
    const currentStep = STEPS[step]
    const newAnswers = { ...answers, [currentStep.id]: option.value }
    setAnswers(newAnswers)
    setShowOptions(false)

    // User bubble
    setMessages(prev => [...prev, { role: 'user', text: `${option.emoji} ${option.label}` }])

    const nextStep = step + 1

    if (nextStep < STEPS.length) {
      setTimeout(() => pushAgentMessage(STEPS[nextStep].question(), nextStep), 500)
    } else {
      // All questions done → completion message
      const doneText =
        `Perfect! 🎉 I've set up your profile.\n\n` +
        `As a ${bgLabel(newAnswers.background)} focused on ${goalLabel(newAnswers.goal)}, ` +
        `I'll tailor every campaign to your exact needs.\n\n` +
        `Let's launch your first campaign! 🚀`

      setTimeout(() => pushAgentMessage(doneText, 3, true), 500)

      // Save to Firestore
      setSaving(true)
      try {
        await saveOnboardingData(user.uid, newAnswers)
      } catch (err) {
        console.error('Onboarding save error:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  const currentOptions = step >= 0 && step < STEPS.length ? STEPS[step].options : []

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 0 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div className="glow-orb glow-purple" style={{ width: 500, height: 500, top: -180, left: -180, opacity: 0.2 }} />
      <div className="glow-orb glow-cyan"   style={{ width: 400, height: 400, bottom: -100, right: -100, opacity: 0.15 }} />

      {/* Top bar */}
      <div style={{
        width: '100%', maxWidth: 640,
        padding: '28px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,58,237,0.35)',
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>EVOKE CMO</span>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {STEPS.map((_, i) => {
            const done = step > i
            const active = step === i
            return (
              <motion.div key={i}
                animate={{
                  width: active ? 24 : 8,
                  background: done ? '#10b981' : active ? '#06b6d4' : 'rgba(255,255,255,0.15)',
                }}
                transition={{ duration: 0.35 }}
                style={{ height: 8, borderRadius: 4 }}
              />
            )
          })}
          {step === 3 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981' }}
            />
          )}
        </div>
      </div>

      {/* Chat window */}
      <div style={{
        width: '100%', maxWidth: 640,
        flex: 1, padding: '32px 24px 0',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'agent' ? 'row' : 'row-reverse',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              {msg.role === 'agent' && <AgentAvatar />}

              <div style={{
                maxWidth: '78%',
                padding: '14px 18px',
                borderRadius: msg.role === 'agent' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                background: msg.role === 'agent'
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.35))',
                border: msg.role === 'agent'
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(6,182,212,0.3)',
                backdropFilter: 'blur(8px)',
              }}>
                {msg.role === 'agent'
                  ? <AgentText text={msg.text} />
                  : <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{msg.text}</div>
                }
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <AgentAvatar />
              <div style={{
                padding: '14px 18px',
                borderRadius: '4px 18px 18px 18px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Option cards */}
        <AnimatePresence>
          {showOptions && step >= 0 && step < STEPS.length && (
            <motion.div
              key={`options-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                paddingLeft: 50,   // align with chat bubble (avatar width + gap)
              }}
            >
              {currentOptions.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(opt)}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(6,182,212,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ fontSize: '18px', lineHeight: 1 }}>{opt.emoji}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{opt.desc}</div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done — CTA button */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              key="done-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{ paddingLeft: 50 }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/connect-accounts?setup=cmo')}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '15px 28px',
                  background: saving
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: 'none', borderRadius: '14px',
                  color: saving ? 'rgba(255,255,255,0.4)' : '#fff',
                  fontSize: '15px', fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 0 28px rgba(124,58,237,0.4)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {saving
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <>Connect Social Accounts <ArrowRight size={17} /></>
                }
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
