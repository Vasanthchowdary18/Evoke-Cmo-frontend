import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, Loader2, Send, Sparkles, Check } from 'lucide-react'
import { saveOnboardingData } from '../services/userService'

/* ─── Gemini ─── */
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

const LS_STEP    = 'evoke_onboarding_step'      // 'needs_social'
const LS_PROFILE = 'evoke_onboarding_profile'   // JSON of cmoData

const buildSystemPrompt = (name) => `
You are Evoke CMO — a real, sharp AI Chief Marketing Officer having your very first conversation with ${name}, a new client.

YOUR PERSONALITY:
- You sound like a brilliant CMO they just hired — confident, warm, direct
- You listen carefully and reference exactly what they said
- You give quick expert reactions ("Oh, SaaS for HR? Email drip sequences are massive there.")
- You're conversational, not robotic — like texting a knowledgeable friend
- Keep every reply SHORT — max 2-3 sentences

YOUR GOAL IN THIS CONVERSATION:
- Understand what they do / their role naturally
- Learn their industry and product/brand
- Know what marketing help they need most (campaigns, content, social, launches)
- Feel like a REAL CMO consultation, not a form or survey

CONVERSATION RULES:
- Ask only ONE question per message — never list multiple questions
- React intelligently to what they say before asking the next thing
- Show expertise: if they mention "SaaS" say something insightful about SaaS marketing; if "fashion" — visual storytelling
- After 4-5 exchanges when you have enough context, naturally wrap up: say something like "Okay, I think I have a solid picture of what you need — ready to set up your campaigns?"
- If they say yes/ready, respond with EXACTLY this format on the last line:
  [CMO_READY] {"background":"their role","industry":"their industry","goal":"their goal"}

NEVER:
- Say "Step 1", "Question 1", or any numbered steps
- Ask "what is your role?" robotically — ask it naturally
- Repeat the same question
- Be generic — always be specific to what they just said
`.trim()

/* ─── Typing dots ─── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8973e' }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function AgentAvatar({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #c8973e, #a87030)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 12px rgba(200,151,62,0.4)',
    }}>
      <Zap size={size * 0.42} color="#0e0c09" fill="#0e0c09" />
    </div>
  )
}

/* ═══════════════════════════════════════ MAIN ═══════════════════════════════════════ */

export default function OnboardingModal({ user, onComplete }) {
  const navigate = useNavigate()
  const name = user?.displayName?.split(' ')[0] || 'there'

  const [messages,   setMessages]   = useState([])
  const [draft,      setDraft]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [isDone,     setIsDone]     = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [cmoData,    setCmoData]    = useState(null)
  const [msgCount,   setMsgCount]   = useState(0)
  // 'token' = must connect Gratitude Token first
  // 'social' = token done, must connect social media
  const [doneStep,   setDoneStep]   = useState('token')

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const historyRef = useRef([])

  /* auto-scroll */
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages, loading])

  /* focus input */
  useEffect(() => {
    if (!isDone && !loading) setTimeout(() => inputRef.current?.focus(), 150)
  }, [messages, isDone, loading])

  /* ── On mount: check if user already completed chat but not social ── */
  useEffect(() => {
    const savedStep = localStorage.getItem(LS_STEP)

    if (savedStep === 'needs_social') {
      // Chat already done, token step skipped — jump straight to social
      try {
        const savedProfile = localStorage.getItem(LS_PROFILE)
        if (savedProfile) setCmoData(JSON.parse(savedProfile))
      } catch { /* ignore */ }
      setIsDone(true)
      setDoneStep('social')
      return
    }

    // Fresh start — show opening message
    const opener = `Hey ${name}! 👋 I'm your AI CMO — I'll handle your marketing strategy, campaigns, and content so you don't have to.\n\nTell me about yourself and what you're building. What's the business?`
    addAgentMessage(opener)
    historyRef.current = [{ role: 'model', parts: [{ text: opener }] }]
  }, []) // eslint-disable-line

  function addAgentMessage(text) {
    setMessages(prev => [...prev, { role: 'agent', text, time: now() }])
  }

  function now() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  function isAffirmative(text) {
    return /^(yes|sure|ok|okay|go ahead|yep|yeah|absolutely|let'?s go|do it|ready|start|proceed|sounds good|great|perfect|cool|of course|please)/i.test(text.trim())
  }

  async function extractProfileData() {
    const convoText = historyRef.current
      .map(m => `${m.role === 'user' ? 'User' : 'CMO'}: ${m.parts[0].text}`)
      .join('\n')

    const extractPrompt = `Based on this conversation extract the user's profile as JSON.
Return ONLY valid JSON, nothing else. No markdown, no explanation.

Conversation:
${convoText}

Extract:
{
  "background": "their job role or professional background",
  "industry": "their industry or business sector",
  "goal": "their main marketing goal",
  "businessName": "their business or brand name if mentioned, else empty string",
  "campaignType": "most relevant type from: event | product | brand | social"
}`

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: extractPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }),
      })
      const data = await res.json()
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const clean = raw.replace(/```json|```/g, '').trim()
      return JSON.parse(clean)
    } catch {
      const convoLower = convoText.toLowerCase()
      return {
        background: convoLower.includes('founder') ? 'Founder' : convoLower.includes('market') ? 'Marketer' : 'Business Professional',
        industry:   convoLower.includes('tech') || convoLower.includes('saas') ? 'Tech/SaaS' : convoLower.includes('fashion') ? 'Fashion' : 'Business',
        goal:       convoLower.includes('lead') ? 'Generate leads' : convoLower.includes('sale') ? 'Drive sales' : 'Build brand awareness',
        businessName: '',
        campaignType: convoLower.includes('event') ? 'event' : convoLower.includes('product') ? 'product' : 'brand',
      }
    }
  }

  function getCampaignRoute(type) {
    const map = { event: '/campaign/events', conference: '/campaign/events', webinar: '/campaign/events', product: '/campaign/product', retail: '/campaign/product', brand: '/campaign/brand', social: '/campaign/brand' }
    return map[type] || '/campaign/events'
  }

  /* ── After chat: extract profile, show Token step (DON'T save to Firestore yet) ── */
  async function completeOnboarding(confirmText) {
    setLoading(false)
    if (confirmText) addAgentMessage(confirmText)

    const profileData = await extractProfileData()
    setCmoData(profileData)
    // Persist profile locally so it survives navigation
    localStorage.setItem(LS_PROFILE, JSON.stringify(profileData))
    setIsDone(true)
    setDoneStep('token')
  }

  /* ── Step 1: Connect Gratitude Token ── */
  function handleConnectToken() {
    // Mark that user completed chat + needs to connect social next
    localStorage.setItem(LS_STEP, 'needs_social')
    // Navigate to tokens page — modal will re-show on return since onboardingComplete is still false
    navigate('/tokens')
  }

  /* ── Step 2: Connect Social Media (final step — saves profile + completes onboarding) ── */
  async function handleConnectSocial() {
    localStorage.removeItem(LS_STEP)
    localStorage.removeItem(LS_PROFILE)

    if (user && cmoData) {
      setSaving(true)
      try { await saveOnboardingData(user.uid, cmoData) }
      catch (e) { console.error('Save error:', e) }
      finally { setSaving(false) }
    }

    onComplete()
    navigate(`/connect-accounts?setup=1&campaign=${encodeURIComponent('/cmo')}`)
  }

  async function callGemini(userText) {
    historyRef.current = [...historyRef.current, { role: 'user', parts: [{ text: userText }] }]

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(name) }] },
        contents: historyRef.current,
        generationConfig: { temperature: 0.8, maxOutputTokens: 220 },
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!replyText) throw new Error('Empty response')

    historyRef.current = [...historyRef.current, { role: 'model', parts: [{ text: replyText }] }]
    return replyText
  }

  async function handleSend() {
    const text = draft.trim()
    if (!text || loading || isDone) return

    setDraft('')
    setMessages(prev => [...prev, { role: 'user', text, time: now() }])
    setLoading(true)
    const newCount = msgCount + 1
    setMsgCount(newCount)

    try {
      if (isAffirmative(text) && newCount >= 3) {
        await completeOnboarding(`Perfect! 🎉 Setting up your personalised CMO profile now...`)
        return
      }

      let replyRaw = await callGemini(text)
      const cleanReply = replyRaw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()

      if (newCount >= 5) {
        await completeOnboarding(cleanReply || `I've got everything I need! Setting up your CMO profile... 🚀`)
        return
      }

      setLoading(false)
      if (cleanReply) addAgentMessage(cleanReply)

    } catch (err) {
      console.error('[CMO Chat]', err)
      setLoading(false)
      const fallbacks = [
        `What industry are you working in?`,
        `Got it! What kind of marketing do you need most — social, campaigns, or content?`,
        `What's your main goal right now — generate leads, drive sales, or build awareness?`,
        `Sounds great! I think I have a good picture — ready to set up your CMO profile?`,
      ]
      addAgentMessage(fallbacks[Math.min(newCount - 1, fallbacks.length - 1)])
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const SUGGESTIONS = ['I run a startup', "I'm a marketer", 'I have an ecommerce brand', "I'm a freelancer"]

  /* ── Step indicator ── */
  const steps = [
    { n: 1, label: 'Tell us about your business', done: isDone },
    { n: 2, label: 'Connect Gratitude Token',      done: doneStep === 'social' },
    { n: 3, label: 'Connect Social Media',          done: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,4,3,0.9)', backdropFilter: 'blur(16px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'Inter',sans-serif",
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{
          background: '#111009', border: '1px solid rgba(200,151,62,0.2)',
          borderRadius: 24, width: '100%', maxWidth: 540,
          height: '90vh', maxHeight: 720,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,151,62,0.08)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #1c1a12, #181510)',
          borderBottom: '1px solid rgba(200,151,62,0.12)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <AgentAvatar size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#f0ebe0', fontFamily: "'Syne','Inter',sans-serif", letterSpacing: '-0.01em' }}>
              Evoke CMO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: 11, color: 'rgba(240,235,224,0.45)', fontWeight: 500 }}>Your AI Chief Marketing Officer · Online</span>
            </div>
          </div>
        </div>

        {/* ── Step progress bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '10px 20px', background: '#0d0b09',
          borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
        }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.done
                    ? 'linear-gradient(135deg,#c8973e,#a87030)'
                    : (isDone && s.n === (doneStep === 'social' ? 3 : 2))
                      ? 'rgba(200,151,62,0.18)'
                      : 'rgba(255,255,255,0.05)',
                  border: s.done
                    ? 'none'
                    : (isDone && s.n === (doneStep === 'social' ? 3 : 2))
                      ? '1.5px solid rgba(200,151,62,0.6)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                  fontSize: 10, fontWeight: 800,
                  color: s.done ? '#0e0c09' : 'rgba(240,235,224,0.35)',
                }}>
                  {s.done ? <Check size={11} /> : s.n}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: s.done
                    ? '#c8973e'
                    : (isDone && s.n === (doneStep === 'social' ? 3 : 2))
                      ? 'rgba(240,235,224,0.7)'
                      : 'rgba(240,235,224,0.25)',
                  whiteSpace: 'nowrap',
                }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 8px', minWidth: 12 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '18px 18px 8px',
          display: 'flex', flexDirection: 'column', gap: 12,
          background: '#0c0a08',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,151,62,0.15) transparent',
        }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', flexDirection: msg.role === 'agent' ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 9 }}
              >
                {msg.role === 'agent' && <AgentAvatar size={30} />}
                <div style={{
                  maxWidth: '80%', padding: '11px 15px',
                  borderRadius: msg.role === 'agent' ? '3px 16px 16px 16px' : '16px 3px 16px 16px',
                  background: msg.role === 'agent' ? 'linear-gradient(135deg, #1e1c14, #1a1810)' : 'linear-gradient(135deg, #c8973e, #a87030)',
                  border: msg.role === 'agent' ? '1px solid rgba(200,151,62,0.15)' : 'none',
                  boxShadow: msg.role === 'agent' ? '0 2px 16px rgba(0,0,0,0.4)' : '0 4px 18px rgba(200,151,62,0.25)',
                  fontSize: 14, lineHeight: 1.7,
                  color: msg.role === 'agent' ? '#f0ebe0' : '#0e0c09',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontWeight: msg.role === 'user' ? 600 : 400,
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: 10, color: 'rgba(240,235,224,0.2)', alignSelf: 'flex-end', marginBottom: 2, flexShrink: 0, paddingBottom: 1 }}>
                  {msg.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div key="typing"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}
            >
              <AgentAvatar size={30} />
              <div style={{
                padding: '12px 16px', borderRadius: '3px 16px 16px 16px',
                background: 'linear-gradient(135deg, #1e1c14, #1a1810)',
                border: '1px solid rgba(200,151,62,0.15)', boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
              }}>
                <TypingDots />
              </div>
            </motion.div>
          )}

          {messages.length === 1 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 38, marginTop: 4 }}
            >
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setDraft(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                  style={{
                    padding: '6px 14px', background: 'rgba(200,151,62,0.08)',
                    border: '1px solid rgba(200,151,62,0.22)', borderRadius: 100, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, color: '#c8973e', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.16)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.08)' }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Chat input (only while chatting) ── */}
        {!isDone && (
          <div style={{
            padding: '12px 16px 16px',
            background: 'linear-gradient(135deg, #1c1a12, #181510)',
            borderTop: '1px solid rgba(200,151,62,0.1)', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: `1.5px solid rgba(200,151,62,${draft.trim() ? '0.55' : '0.2'})`,
              borderRadius: 16, padding: '10px 14px', transition: 'border-color 0.18s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(200,151,62,0.6)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = draft.trim() ? 'rgba(200,151,62,0.55)' : 'rgba(200,151,62,0.2)'}
            >
              <textarea
                ref={inputRef} value={draft}
                onChange={e => setDraft(e.target.value)} onKeyDown={handleKey}
                disabled={loading}
                placeholder={loading ? 'Your CMO is thinking…' : 'Message your CMO…'}
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 14, lineHeight: 1.55,
                  color: loading ? 'rgba(240,235,224,0.3)' : '#f0ebe0',
                  fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto',
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              />
              <motion.button onClick={handleSend} disabled={!draft.trim() || loading} whileTap={{ scale: 0.88 }}
                style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0, border: 'none',
                  background: draft.trim() && !loading ? 'linear-gradient(135deg, #c8973e, #a87030)' : 'rgba(255,255,255,0.05)',
                  cursor: draft.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                  boxShadow: draft.trim() && !loading ? '0 4px 14px rgba(200,151,62,0.4)' : 'none',
                }}
              >
                {loading
                  ? <Loader2 size={15} color="rgba(240,235,224,0.25)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Send size={15} color={draft.trim() ? '#0e0c09' : 'rgba(240,235,224,0.2)'} />
                }
              </motion.button>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.2)', marginTop: 6, paddingLeft: 2 }}>
              Press <kbd style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: 'rgba(240,235,224,0.35)' }}>Enter</kbd> to send · <kbd style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: 'rgba(240,235,224,0.35)' }}>Shift+Enter</kbd> for new line
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            DONE CTA — Step 2: Connect Token
        ══════════════════════════════════════ */}
        <AnimatePresence>
          {isDone && doneStep === 'token' && (
            <motion.div key="step-token"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 24 }}
              style={{
                padding: '18px 20px 22px',
                background: 'linear-gradient(135deg, #1c1a12, #181510)',
                borderTop: '1px solid rgba(200,151,62,0.15)', flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, color: 'rgba(240,235,224,0.7)', marginBottom: 4, fontWeight: 600 }}>
                🎉 Profile ready! Now complete 2 required steps:
              </div>

              {/* Profile summary (compact) */}
              {cmoData && (
                <div style={{ background: 'rgba(200,151,62,0.07)', border: '1px solid rgba(200,151,62,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[{ l: 'Role', v: cmoData.background }, { l: 'Industry', v: cmoData.industry }, { l: 'Goal', v: cmoData.goal }]
                      .filter(r => r.v).map(row => (
                        <div key={row.l} style={{ fontSize: 11 }}>
                          <span style={{ color: 'rgba(240,235,224,0.35)' }}>{row.l}: </span>
                          <span style={{ color: '#f0ebe0', fontWeight: 600 }}>{row.v}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Token (ACTIVE) */}
              <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                onClick={handleConnectToken}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: 'linear-gradient(135deg, #c8973e, #a87030)',
                  border: 'none', borderRadius: 14, color: '#0e0c09',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 6px 24px rgba(200,151,62,0.4)',
                  fontFamily: "'Syne','Inter',sans-serif", marginBottom: 10, letterSpacing: '-0.01em',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🪙</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 10, opacity: 0.65, fontWeight: 500, marginBottom: 1 }}>Step 1 of 2 · Required</span>
                    Connect Gratitude Token
                  </span>
                </span>
                <ArrowRight size={18} />
              </motion.button>

              {/* Step 3 — Social (LOCKED) */}
              <div style={{
                width: '100%', padding: '14px 18px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>🔗</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 10, color: 'rgba(240,235,224,0.25)', fontWeight: 500, marginBottom: 1 }}>Step 2 of 2 · Unlocks after Step 1</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(240,235,224,0.25)' }}>Connect Social Media</span>
                  </span>
                </span>
                <span style={{ fontSize: 11, color: 'rgba(240,235,224,0.2)', fontWeight: 600 }}>🔒 Locked</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════
            DONE CTA — Step 3: Connect Social
        ══════════════════════════════════════ */}
        <AnimatePresence>
          {isDone && doneStep === 'social' && (
            <motion.div key="step-social"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}
              style={{
                padding: '18px 20px 22px',
                background: 'linear-gradient(135deg, #1c1a12, #181510)',
                borderTop: '1px solid rgba(200,151,62,0.15)', flexShrink: 0,
              }}
            >
              {saving ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '14px 0' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#c8973e' }} />
                  <span style={{ fontSize: 13, color: 'rgba(240,235,224,0.5)' }}>Saving your CMO profile…</span>
                </div>
              ) : (
                <>
                  {/* Step 2 token — shown as completed */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', marginBottom: 12,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 12,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={12} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Gratitude Token connected ✓</span>
                  </div>

                  <div style={{ fontSize: 13, color: 'rgba(240,235,224,0.6)', marginBottom: 14, fontWeight: 500 }}>
                    Almost there! One final step to go live:
                  </div>

                  {/* Step 3 — Social (ACTIVE) */}
                  <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                    onClick={handleConnectSocial}
                    style={{
                      width: '100%', padding: '14px 18px',
                      background: 'linear-gradient(135deg, #c8973e, #a87030)',
                      border: 'none', borderRadius: 14, color: '#0e0c09',
                      fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 6px 24px rgba(200,151,62,0.4)',
                      fontFamily: "'Syne','Inter',sans-serif", letterSpacing: '-0.01em',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>🔗</span>
                      <span>
                        <span style={{ display: 'block', fontSize: 10, opacity: 0.65, fontWeight: 500, marginBottom: 1 }}>Step 2 of 2 · Required to launch campaigns</span>
                        Connect Social Media
                      </span>
                    </span>
                    <ArrowRight size={18} />
                  </motion.button>

                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                    <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.8)', fontWeight: 600 }}>
                      ⚠️ Social accounts are required — your CMO cannot post or launch campaigns without them.
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,151,62,0.18); border-radius: 2px; }
      `}</style>
    </motion.div>
  )
}
