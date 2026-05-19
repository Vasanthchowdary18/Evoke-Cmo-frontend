import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'

const SYSTEM_PROMPT = `You are the Evoke CMO Agent Assistant — a friendly, knowledgeable AI support agent for Evoke CMO, an AI-powered marketing platform.

ABOUT EVOKE CMO:
Evoke CMO is an AI-powered Chief Marketing Officer that generates complete multi-channel marketing campaigns in seconds for Events, Products, and Brands.

PRICING PLANS:
1. Starter Plan — ₹999/month
   - Best for: Events and one-time campaigns
   - Includes: Events campaign type, Email subject + body, WhatsApp message, 7-day campaign calendar, SEO title + meta description, Standard support

2. Growth Plan — ₹1,999/month (Most Popular)
   - Best for: Businesses launching new products
   - Includes: Everything in Starter + Products campaign type, LinkedIn post, SMS message, Product positioning statement, Priority email support

3. Enterprise Plan — ₹4,999/month
   - Best for: Full brand strategy and ad campaigns
   - Includes: Everything in Growth + Brand campaign type, Full brand strategy, Ad headline + body copy, Google Sheet auto-logging, Priority 24/7 support

CAMPAIGN TYPES:
- Events: Promote concerts, webinars, launches, conferences. Generates email, WhatsApp, 7-day calendar, SEO content.
- Products: Launch new products with email, WhatsApp, LinkedIn, SMS, positioning statement.
- Brands: Full brand strategy with ads, positioning, all channels, and analytics logging.

WHAT EVOKE CMO GENERATES:
- Email subject lines and full body copy
- WhatsApp messages
- LinkedIn posts
- SMS messages
- SEO meta titles and descriptions
- 7-day campaign calendar
- Ad headlines and body copy
- Product/brand positioning statements

GRATITUDE TOKENS (EGT):
- Free Starter: 1,000 EGT — Access basic campaign tools
- Thunderbird: 5,000 EGT — Unlock premium prompt packs
- Fortune Mindset: 10,000 EGT — Generate advanced ad copies
- Quantum Riser: 25,000 EGT — Unlock full campaign strategy
- Lexicon Leader: 50,000 EGT — Access AI content systems
- High Roller: 100,000 EGT — Unlock VIP marketing assets
- Dream Keeper: 250,000 EGT — Get premium campaign plans
- Master Mentor: 500,000 EGT — Access elite CMO workflows

HOW IT WORKS:
1. Sign up and choose your campaign type (Events, Products, or Brands)
2. Fill in your campaign details (event name, dates, target audience, etc.)
3. The AI generates a complete campaign package in under 30 seconds
4. Review and deploy across all channels

AI AGENTS (Coming Soon):
- CMO Agent: Chief Marketing Officer (Active now)
- CFO Agent: Chief Financial Officer (Coming soon)
- CEO Agent: Chief Executive Officer (Coming soon)
- CTO Agent: Chief Technology Officer (Coming soon)

CONTACT & SUPPORT:
- Standard support included in all plans
- Priority email support in Growth plan
- Priority 24/7 support in Enterprise plan
- Sign up at the website to get started

Always be helpful, concise, and enthusiastic. If asked about something outside Evoke CMO, gently redirect to how Evoke CMO can help with their marketing needs. Never make up pricing or features that aren't listed above.`

const SUGGESTED_QUESTIONS = [
  'What are the pricing plans?',
  'What does the Starter plan include?',
  'How does Evoke CMO work?',
  'What campaign types are available?',
  'What is the Enterprise plan?',
  'What are Gratitude Tokens?',
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Evoke CMO Assistant 👋 Ask me anything about our plans, features, or how to get started!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const INITIAL_MESSAGE = {
    role: 'assistant',
    content: "Hi! I'm the Evoke CMO Assistant 👋 Ask me anything about our plans, features, or how to get started!",
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    } else {
      setMessages([INITIAL_MESSAGE])
      setShowSuggestions(true)
      setInput('')
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: userMsg },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data?.error?.message || `API error (${res.status})`
        console.error('GROQ API error:', data)
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }])
        return
      }

      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error('Chatbot fetch error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: `Network error: ${err.message}. Please check your connection and try again.` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Window */}
      <div
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '360px',
          maxHeight: '520px',
          background: '#0e0e14',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9999,
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>Evoke CMO Assistant</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>AI-powered support · Always online</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(124,58,237,0.3) transparent',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                    : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {msg.role === 'user' ? <User size={13} color="white" /> : <Bot size={13} color="white" />}
              </div>
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 13px',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(168,85,247,0.25))'
                    : 'rgba(255,255,255,0.06)',
                  border: '1px solid',
                  borderColor: msg.role === 'user' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bot size={13} color="white" />
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '4px 14px 14px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'rgba(124,58,237,0.8)',
                      animation: 'bounce 1.2s ease infinite',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {showSuggestions && messages.length === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', paddingLeft: '36px' }}>
                Suggested questions
              </div>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    marginLeft: '36px',
                    textAlign: 'left',
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
            background: '#0a0a10',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about pricing, features..."
            rows={1}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '10px 13px',
              color: 'white',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: '80px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                : 'rgba(255,255,255,0.07)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <Send size={15} color={input.trim() && !loading ? 'white' : 'rgba(255,255,255,0.3)'} />
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: open
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: open ? 'none' : '0 8px 32px rgba(124,58,237,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10000,
          transition: 'all 0.25s ease',
        }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open
          ? <X size={22} color="white" />
          : <MessageCircle size={22} color="white" />
        }
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
