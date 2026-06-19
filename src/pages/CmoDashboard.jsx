'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Settings, FileText, Users,
  MessageSquare, Search, Globe, Hash, Linkedin, Send,
  Zap, ArrowRight, ExternalLink, RefreshCw, AtSign,
  BarChart2, Bot, Link2, Loader2, X, ChevronRight, ChevronLeft,
  Monitor, Smartphone, AlertTriangle, CheckCircle,
  Terminal, Paperclip, TrendingUp, Copy, Check,
  Activity, Plus, Wifi, Home
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
// AGENT_WEBHOOK_URL not used here — chat uses Gemini directly for real-time CMO conversations

/* ─── Terminal log lines ─── */
const LOG_LINES = [
  { t: 'info',    m: 'Opening the selected product document...' },
  { t: 'info',    m: 'Reading key product context and messaging...' },
  { t: 'error',   m: 'Response stopped.' },
  { t: 'info',    m: 'Thinking...' },
  { t: 'success', m: 'Done!' },
  { t: 'info',    m: 'Fetching data...' },
  { t: 'info',    m: 'Loading documents and initializing AI Chat...' },
  { t: 'success', m: 'AI Chat initialized' },
  { t: 'info',    m: 'Running daily campaign scan across all platforms...' },
  { t: 'success', m: 'Reddit: 2 opportunities detected' },
  { t: 'success', m: 'SEO: 2 critical issues found' },
  { t: 'info',    m: 'LinkedIn: Drafting post...' },
  { t: 'success', m: 'All agents running. CMO Terminal is live.' },
]

/* ─── Agents feed data ─── */
const INIT_AGENTS = [
  {
    key: 'reddit', name: 'REDDIT AGENT', status: '2 opportunities ready',
    color: '#ff4500', emoji: '🔴', expanded: false,
    items: [
      { text: 'r/startups: "Best marketing tools for bootstrapped founders"', action: 'Draft Reply' },
      { text: 'r/entrepreneur: "How do I scale content without a team?"', action: 'Draft Reply' },
    ],
  },
  {
    key: 'seo', name: 'SEO AGENT', status: '2 recommendations ready; SEO fixes queued',
    color: '#10b981', emoji: '🌐', expanded: true,
    issues: [
      { text: 'Images missing alt text', severity: 'High', type: 'On-Page' },
      { text: 'Title tag too short', severity: 'Medium', type: 'On-Page' },
    ],
    applyFix: true,
  },
  {
    key: 'twitter', name: 'X AGENT', status: '2 ideas ready',
    color: '#e2e8f0', emoji: '✖', expanded: false,
    items: [
      { text: 'Thread: "5 reasons your B2B marketing is failing"', action: 'Review' },
      { text: 'Tweet: Industry stat hook with strong CTA', action: 'Review' },
    ],
  },
  {
    key: 'writer', name: 'ARTICLES AGENT', status: '1 topic ready',
    color: '#8b5cf6', emoji: '✍', expanded: false,
    items: [
      { text: 'Blog: "How AI is replacing traditional CMOs in 2025"', action: 'Write' },
    ],
  },
  {
    key: 'hackernews', name: 'HACKER NEWS AGENT', status: '1 post ready',
    color: '#ff6600', emoji: '🟠', expanded: false,
    items: [
      { text: 'Show HN: AI-powered CMO for startups at $49/month', action: 'Review' },
    ],
  },
  {
    key: 'linkedin_agent', name: 'LINKEDIN AGENT', status: '1 post ready',
    color: '#0a66c2', emoji: '🔵', expanded: false,
    items: [
      { text: '"The future of AI in marketing" — thought leadership post', action: 'Publish' },
    ],
  },
]

const DOCUMENTS = [
  { name: 'Product Information', tag: 'New' },
  { name: 'Competitor Analysis', tag: 'New' },
  { name: 'Brand Voice', tag: 'New' },
  { name: 'Marketing Strategy', tag: 'New' },
  { name: 'Articles', tag: '' },
]

const INITIAL_CHAT = [
  {
    role: 'ai',
    text: `**About your audience:**\n\n• Who are you trying to reach?\n• What channels do they hang out on? (LinkedIn, X/Twitter, Reddit, email, etc.)\n\n**About your current setup:**\n\n• Do you have a landing page or registration link ready?\n• What's your timeline — when do you want to start promoting?\n\nOnce I have these, I can put together a concrete campaign.`,
  },
]

/* ─── Circular score SVG ─── */
function ScoreRing({ value, label }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = ((100 - value) / 100) * circ
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 27 27)" />
        <text x="27" y="32" textAnchor="middle" fill={color} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">
          {value}
        </text>
      </svg>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  )
}

/* ─── Severity badge ─── */
function Severity({ level }) {
  const c = level === 'High' ? { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', text: '#f87171' }
    : { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' }
  return (
    <span style={{ padding: '2px 7px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: c.text }}>{level}</span>
  )
}

export default function CmoDashboard() {
  const navigate = useNavigate()
  const { user, authReady } = useRequireAuth()
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [logs, setLogs] = useState([])
  const [agents, setAgents] = useState(INIT_AGENTS)
  const [chat, setChat] = useState(INITIAL_CHAT)
  const [msg, setMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [analyticsTab, setAnalyticsTab] = useState('SEO')
  const [copied, setCopied] = useState(null)
  const [showHire, setShowHire] = useState(false)
  const [billing, setBilling] = useState('annual') // 'monthly' | 'annual'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSideNav, setActiveSideNav] = useState('agents')
  const termRef = useRef(null)
  const chatRef = useRef(null)

  /* terminal playback */
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      if (i < LOG_LINES.length) { setLogs(p => [...p, LOG_LINES[i++]]) }
      else clearInterval(id)
    }, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [logs])
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  const toggleAgent = (key) => setAgents(p => p.map(a => a.key === key ? { ...a, expanded: !a.expanded } : a))

  const sendMsg = async () => {
    if (!msg.trim() || chatLoading) return
    const txt = msg.trim()
    setMsg('')

    const updatedChat = [...chat, { role: 'user', text: txt }]
    setChat(updatedChat)
    setChatLoading(true)

    try {
      // Build Gemini conversation history (skip initial AI greeting for context efficiency)
      const history = updatedChat.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }))

      const systemPrompt = `You are an expert AI Chief Marketing Officer (CMO) built into Evoke CMO — an AI marketing platform. You help businesses plan and execute marketing campaigns across LinkedIn, Instagram, Facebook, X/Twitter, Reddit, TikTok, Gmail, WhatsApp, and Eventbrite.

Your personality: strategic, concise, data-driven, and direct. You ask clarifying questions when needed. You give specific, actionable recommendations — never vague advice.

When the user asks about campaigns:
- Ask about target audience, goal, budget, timeline, and preferred platforms
- Suggest which Evoke CMO agents to use (Events, Products, Brands, Growth Strategy, SEO, Email Drip, etc.)
- Recommend content angles and posting schedules

Keep responses under 200 words unless the user asks for detail. Use bullet points for clarity.`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: history,
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
        }
      )

      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "I'm ready to help with your marketing strategy. What's your campaign goal?"
      setChat(p => [...p, { role: 'ai', text: reply }])
    } catch (err) {
      setChat(p => [...p, { role: 'ai', text: "Something went wrong connecting to the AI. Please check your internet connection and try again." }])
    } finally {
      setChatLoading(false)
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000) })
  }

  if (!authReady) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} style={{ color: '#c8973e', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const logColor = { info: 'rgba(240,235,224,0.6)', success: '#10b981', error: '#f87171' }
  const logPrefix = { info: '>', success: '✓', error: '✗' }

  return (
    <div style={{ height: '100vh', background: '#0a0a0a', color: '#f0ebe0', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      {/* ── Platform tab bar ── */}
      <div style={{
        marginTop: 64, height: 44, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 0, flexShrink: 0,
      }}>
        {/* LinkedIn tab */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '0 18px', height: '100%', cursor: 'pointer',
          background: 'rgba(10,102,194,0.12)', borderRight: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '2px solid #0a66c2',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a66c2"><rect width="24" height="24" rx="4" fill="#0a66c2"/><path d="M7 10H5v9h2v-9zM6 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19 19h-2v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2V19h-2v-9h2v1.2c.6-.9 1.7-1.5 2.8-1.5 2.3 0 3.2 1.6 3.2 3.9V19z" fill="white"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ebe0' }}>LinkedIn</span>
          <ChevronDown size={12} style={{ color: 'rgba(240,235,224,0.4)' }} />
        </div>

        {/* Terminal status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', color: 'rgba(240,235,224,0.45)', fontSize: 12 }}>
          <Terminal size={13} />
          <span>AI CMO Terminal</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
            Running Daily
          </span>
        </div>

        {/* Boost Ads button */}
        <div style={{ marginLeft: 'auto', paddingRight: 16 }}>
          <button
            onClick={() => navigate('/meta-ads-boost')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: 'linear-gradient(135deg, rgba(200,151,62,0.18), rgba(200,151,62,0.08))',
              border: '1px solid rgba(200,151,62,0.35)',
              borderRadius: 8, cursor: 'pointer',
              color: '#c8973e', fontSize: 12, fontWeight: 700,
              fontFamily: "'Inter',sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(200,151,62,0.28),rgba(200,151,62,0.14))'; e.currentTarget.style.boxShadow = '0 0 14px rgba(200,151,62,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(200,151,62,0.18),rgba(200,151,62,0.08))'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Zap size={12} fill="#c8973e" /> Boost Ads
          </button>
        </div>
      </div>

      {/* ── Terminal console ── */}
      <div style={{
        background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0, transition: 'height 0.25s ease',
        height: terminalOpen ? 140 : 36, overflow: 'hidden',
      }}>
        {/* Terminal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 36, borderBottom: terminalOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(240,235,224,0.35)', fontFamily: 'monospace' }}>evoke-cmo-terminal — bash</span>
          </div>
          <button onClick={() => setTerminalOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,235,224,0.4)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            {terminalOpen ? <><ChevronUp size={12} /> Hide</> : <><ChevronDown size={12} /> Show</>}
          </button>
        </div>

        {/* Terminal logs */}
        <div ref={termRef} style={{ padding: '8px 16px', height: 104, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ color: logColor[l.t] }}>
              <span style={{ marginRight: 8, opacity: 0.6 }}>{logPrefix[l.t]}</span>
              {l.m}
            </div>
          ))}
          {logs.length < LOG_LINES.length && (
            <div style={{ color: 'rgba(240,235,224,0.3)' }}>
              <span style={{ animation: 'blink 1s step-end infinite', display: 'inline-block' }}>█</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main area: sidebar + panels ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ════ LEFT SIDEBAR ════ */}
        <div style={{
          width: sidebarOpen ? 220 : 52,
          flexShrink: 0,
          background: '#0e0c09',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s ease',
          overflow: 'hidden',
          zIndex: 10,
        }}>
          {/* Collapse toggle */}
          <div style={{ padding: '12px 10px 8px', display: 'flex', justifyContent: sidebarOpen ? 'flex-end' : 'center', flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(p => !p)} style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(240,235,224,0.4)', flexShrink: 0,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,151,62,0.1)'; e.currentTarget.style.color = '#c8973e' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(240,235,224,0.4)' }}>
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { key: 'agents',  label: 'Agents',    icon: <Bot size={16} />,       action: () => { setActiveSideNav('agents');  navigate('/agents-hub') } },
              { key: 'connect', label: 'Connect',   icon: <Link2 size={16} />,     action: () => { setActiveSideNav('connect'); navigate('/connect-accounts') } },
              { key: 'boost',   label: 'Boost Ads', icon: <Zap size={16} />,       action: () => { setActiveSideNav('boost');   navigate('/meta-ads-boost') } },
              { key: 'results', label: 'Results',   icon: <BarChart2 size={16} />, action: () => { setActiveSideNav('results'); navigate('/results') } },
            ].map(item => (
              <button key={item.key} onClick={item.action} title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: sidebarOpen ? '9px 12px' : '9px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: activeSideNav === item.key
                    ? 'linear-gradient(135deg, rgba(200,151,62,0.18), rgba(200,151,62,0.08))'
                    : 'transparent',
                  color: activeSideNav === item.key ? '#c8973e' : 'rgba(240,235,224,0.5)',
                  fontSize: 13, fontWeight: activeSideNav === item.key ? 700 : 500,
                  fontFamily: "'Inter',sans-serif",
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  borderLeft: activeSideNav === item.key ? '2px solid #c8973e' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (activeSideNav !== item.key) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0ebe0' } }}
                onMouseLeave={e => { if (activeSideNav !== item.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(240,235,224,0.5)' } }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom: logo watermark */}
          {sidebarOpen && (
            <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/evoke-logo.png" alt="EVOKE" style={{ height: 20, width: 'auto', objectFit: 'contain', opacity: 0.75 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px 3px 7px', background: '#0a0805', border: '1px solid rgba(200,151,62,0.28)', borderRadius: 100 }}>
                  <Zap size={9} color="#c8973e" fill="#c8973e" />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: '#c8973e', fontFamily: "'Inter',sans-serif" }}>CMO</span>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* ── 4-panel main content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ════ PANEL 1: Company ════ */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0e0c09',
        }}>
          {/* Panel header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,235,224,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Company</span>
            <ChevronRight size={14} style={{ color: 'rgba(240,235,224,0.3)' }} />
          </div>

          {/* Platform tab */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 10H5v9h2v-9zM6 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19 19h-2v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2V19h-2v-9h2v1.2c.6-.9 1.7-1.5 2.8-1.5 2.3 0 3.2 1.6 3.2 3.9V19z" fill="white"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f0ebe0' }}>LinkedIn</span>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,235,224,0.4)', padding: 2 }}><Settings size={13} /></button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {['Add team size & category', 'Improve writing quality'].map(l => (
                <button key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, fontSize: 10, color: 'rgba(240,235,224,0.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Plus size={9} /> {l}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'rgba(240,235,224,0.4)', lineHeight: 1.65, margin: 0 }}>
              LinkedIn lets users build a professional profile, connect with colleagues and recruiters, and find job opportunities. Beyond networking, users can follow industry news, take online courses, and engage with content from professionals in their field.
            </p>
          </div>

          {/* Documents */}
          <div style={{ padding: '12px 16px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,235,224,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>DOCUMENTS</div>
            {DOCUMENTS.map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={12} style={{ color: 'rgba(240,235,224,0.3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'rgba(240,235,224,0.7)' }}>{doc.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {doc.tag && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, color: '#10b981' }}>{doc.tag}</span>
                  )}
                  <ChevronRight size={11} style={{ color: 'rgba(240,235,224,0.2)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Competitors */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,235,224,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>COMPETITORS</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#c8973e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              <Plus size={11} /> Add competitor
            </button>
          </div>
        </div>

        {/* ════ PANEL 2: Analytics ════ */}
        <div style={{
          width: 380, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0a0a0a',
        }}>
          {/* Panel header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <BarChart2 size={13} style={{ color: '#c8973e' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,235,224,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Analytics</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />
            </div>
            <Link2 size={13} style={{ color: 'rgba(240,235,224,0.3)', cursor: 'pointer' }} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            {['SEO', 'Links', 'Technical', 'GEO'].map(tab => (
              <button key={tab} onClick={() => setAnalyticsTab(tab)} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                color: analyticsTab === tab ? '#c8973e' : 'rgba(240,235,224,0.4)',
                borderBottom: analyticsTab === tab ? '2px solid #c8973e' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* SEO Tab content */}
          {analyticsTab === 'SEO' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Connect Google Services */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,235,224,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CONNECT GOOGLE SERVICES</span>
                  <X size={12} style={{ color: 'rgba(240,235,224,0.3)', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { name: 'Google Analytics', sub: 'Traffic & behavior', color: '#f59e0b', icon: '📊' },
                    { name: 'Search Console', sub: 'Search rankings', color: '#4285F4', icon: '🔍' },
                  ].map(s => (
                    <div key={s.name} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0ebe0', marginBottom: 2 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.4)', marginBottom: 12 }}>{s.sub}</div>
                      <button style={{
                        width: '100%', padding: '7px 0', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
                        fontSize: 11, fontWeight: 700, color: '#f0ebe0', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Connect</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* PageSpeed Scores */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,235,224,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>PageSpeed Scores</div>
                <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', marginBottom: 14 }}>Lighthouse scores from Google</div>

                {[
                  { label: 'MOBILE', scores: [{ v: 88, l: 'Performance' }, { v: 97, l: 'Accessibility' }, { v: 92, l: 'Best Practices' }, { v: 100, l: 'SEO' }], icon: <Smartphone size={11} /> },
                  { label: 'DESKTOP', scores: [{ v: 95, l: 'Performance' }, { v: 97, l: 'Accessibility' }, { v: 96, l: 'Best Practices' }, { v: 100, l: 'SEO' }], icon: <Monitor size={11} /> },
                ].map(device => (
                  <div key={device.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, color: 'rgba(240,235,224,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
                      {device.icon} {device.label}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
                      {device.scores.map(s => <ScoreRing key={s.l} value={s.v} label={s.l} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyticsTab !== 'SEO' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, padding: 24 }}>
              <Wifi size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: 12, color: 'rgba(240,235,224,0.3)', textAlign: 'center' }}>Connect Google Search Console to view {analyticsTab} data</p>
              <button style={{ padding: '8px 16px', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 8, fontSize: 12, color: '#c8973e', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Connect Now</button>
            </div>
          )}
        </div>

        {/* ════ PANEL 3: Agents Feed ════ */}
        <div style={{
          flex: 1, minWidth: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0a0a0a',
        }}>
          {/* Panel header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Bot size={13} style={{ color: '#c8973e' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,235,224,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Agents Feed</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Settings size={13} style={{ color: 'rgba(240,235,224,0.3)', cursor: 'pointer' }} />
              <ChevronUp size={13} style={{ color: 'rgba(240,235,224,0.3)', cursor: 'pointer' }} />
            </div>
          </div>

          {/* Agent rows */}
          <div style={{ flex: 1 }}>
            {agents.map((agent) => (
              <div key={agent.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Agent header row */}
                <div
                  onClick={() => toggleAgent(agent.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${agent.color}18`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {agent.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#f0ebe0', marginBottom: 2, letterSpacing: '0.02em' }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,235,224,0.45)' }}>{agent.status}</div>
                  </div>
                  {agent.expanded
                    ? <ChevronUp size={14} style={{ color: 'rgba(240,235,224,0.3)', flexShrink: 0 }} />
                    : <ChevronDown size={14} style={{ color: 'rgba(240,235,224,0.3)', flexShrink: 0 }} />
                  }
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {agent.expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 14px', paddingLeft: 60 }}>

                        {/* SEO Agent special UI */}
                        {agent.applyFix && (
                          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#f0ebe0', marginBottom: 2 }}>Apply fixes automatically</div>
                            <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.4)', marginBottom: 8 }}>Connect GitHub, Webflow, or WordPress</div>
                            <button style={{ padding: '6px 14px', background: '#f0ebe0', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'inherit' }}>Connect</button>
                          </div>
                        )}

                        {/* Issues */}
                        {agent.issues?.map((issue, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, marginBottom: 6 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: '#f0ebe0', marginBottom: 4 }}>{issue.text}</div>
                              <div style={{ display: 'flex', gap: 5 }}>
                                <Severity level={issue.severity} />
                                <span style={{ padding: '2px 7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, fontSize: 10, color: 'rgba(240,235,224,0.45)' }}>{issue.type}</span>
                              </div>
                            </div>
                            <button style={{ padding: '5px 14px', background: '#f0ebe0', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Fix</button>
                          </div>
                        ))}

                        {/* Items */}
                        {agent.items?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, marginBottom: 6 }}>
                            <p style={{ fontSize: 11, color: 'rgba(240,235,224,0.6)', margin: 0, flex: 1, lineHeight: 1.5 }}>{item.text}</p>
                            <button
                              onClick={() => navigate(`/agent/${agent.key}`)}
                              style={{ padding: '5px 12px', background: `${agent.color}18`, border: `1px solid ${agent.color}35`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: agent.color === '#e2e8f0' ? '#f0ebe0' : agent.color, cursor: 'pointer', flexShrink: 0, marginLeft: 10, fontFamily: 'inherit' }}
                            >
                              {item.action}
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* ════ PANEL 4: AI CMO Chat ════ */}
        <div style={{
          width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0e0c09',
        }}>
          {/* Hire CMO banner */}
          <div style={{ padding: '10px 14px', background: 'rgba(200,151,62,0.07)', borderBottom: '1px solid rgba(200,151,62,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,151,62,0.15)', border: '1px solid rgba(200,151,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={13} style={{ color: '#c8973e' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0ebe0' }}>Hire your full-time CMO</div>
                <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.45)' }}>AI-powered marketing at <span style={{ color: '#c8973e' }}>$99/month</span></div>
              </div>
            </div>
            <button onClick={() => setShowHire(true)} style={{ padding: '6px 14px', background: '#f0ebe0', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity='0.85'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>Hire Now</button>
          </div>

          {/* Chat header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <MessageSquare size={13} style={{ color: '#c8973e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,235,224,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Talk to AI CMO</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chat.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(200,151,62,0.15)', border: '1px solid rgba(200,151,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    <Bot size={11} style={{ color: '#c8973e' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '88%', padding: '10px 13px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #c8973e, #a87030)' : '#1c1a13',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  fontSize: 12, lineHeight: 1.7,
                  color: m.role === 'user' ? '#0e0c09' : 'rgba(240,235,224,0.8)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(200,151,62,0.15)', border: '1px solid rgba(200,151,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={11} style={{ color: '#c8973e' }} />
                </div>
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#1c1a13', borderRadius: '4px 12px 12px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8973e', animation: `bounce 1s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Low credits warning */}
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={11} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>Low credits</div>
                <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.35)' }}>Purchase more tokens to continue</div>
              </div>
            </div>
            <button onClick={() => navigate('/purchase')} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, fontSize: 10, fontWeight: 700, color: '#f87171', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Upgrade</button>
          </div>

          {/* Chat input */}
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,235,224,0.35)', padding: 4, display: 'flex' }}>
              <Paperclip size={15} />
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,235,224,0.35)', padding: 4, display: 'flex' }}>
              <AtSign size={15} />
            </button>
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Ask me anything..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f0ebe0', outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,151,62,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={sendMsg}
              disabled={!msg.trim() || chatLoading}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: msg.trim() && !chatLoading ? 'pointer' : 'default',
                background: msg.trim() && !chatLoading ? 'linear-gradient(135deg, #c8973e, #a87030)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              <Send size={13} color={msg.trim() && !chatLoading ? '#0e0c09' : 'rgba(240,235,224,0.3)'} />
            </button>
          </div>
        </div>

      </div>

      {/* ════ HIRE YOUR AI CMO MODAL ════ */}
      <AnimatePresence>
        {showHire && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHire(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
              backdropFilter: 'blur(6px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '32px 28px 28px',
                maxWidth: 480,
                width: '100%',
                position: 'relative',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Close */}
              <button
                onClick={() => setShowHire(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: 'rgba(240,235,224,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>

              {/* Robot icon */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 18, margin: '0 auto 18px',
                  background: '#111', border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                }}>
                  🤖
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f0ebe0', letterSpacing: '-0.025em', marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif" }}>
                  Hire your AI CMO
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(240,235,224,0.5)', lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
                  The only agent you need for growth, marketing, and distribution — every channel, one unified command.
                </p>
              </div>

              {/* Agents included */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,235,224,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  5 AGENTS INCLUDED
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { emoji: '🔴', label: 'Reddit Distribution Agent', color: '#ff4500' },
                    { emoji: '🌐', label: 'SEO Optimization Agent',     color: '#10b981' },
                    { emoji: '🔵', label: 'LinkedIn Writer Agent',       color: '#0a66c2' },
                    { emoji: '✍',  label: 'AI Content Writer Agent',    color: '#8b5cf6' },
                    { emoji: '🟠', label: 'Hacker News Agent',           color: '#ff6600' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{a.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,235,224,0.75)', lineHeight: 1.3 }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing toggle + price */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'monthly' ? '#f0ebe0' : 'rgba(240,235,224,0.4)' }}>Monthly</span>
                  <div
                    onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                    style={{
                      width: 44, height: 24, borderRadius: 100, cursor: 'pointer',
                      background: billing === 'annual' ? '#10b981' : 'rgba(255,255,255,0.15)',
                      position: 'relative', transition: 'background 0.25s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      left: billing === 'annual' ? 23 : 3,
                      transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'annual' ? '#f0ebe0' : 'rgba(240,235,224,0.4)' }}>Annual</span>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: '#f0ebe0', letterSpacing: '-0.04em', fontFamily: "'Syne','Inter',sans-serif" }}>
                    ${billing === 'annual' ? '83' : '99'}
                  </span>
                  <span style={{ fontSize: 16, color: 'rgba(240,235,224,0.4)', fontWeight: 500 }}> /mo</span>
                  {billing === 'annual' && (
                    <span style={{ marginLeft: 10, padding: '3px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                      2 months free
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(240,235,224,0.35)' }}>
                  1 AI CMO per website · Cancel anytime
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => { setShowHire(false); navigate('/purchase') }}
                style={{
                  width: '100%', padding: '15px',
                  background: '#f0ebe0', border: 'none', borderRadius: 12,
                  fontSize: 16, fontWeight: 800, color: '#0a0a0a',
                  cursor: 'pointer', fontFamily: "'Syne','Inter',sans-serif",
                  letterSpacing: '-0.01em', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0ebe0'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Start Growing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end sidebar wrapper */}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,151,62,0.2); border-radius: 2px; }
      `}</style>
    </div>
  )
}
