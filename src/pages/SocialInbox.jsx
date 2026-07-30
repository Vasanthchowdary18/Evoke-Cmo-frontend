import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, Send, Search, ArrowLeft, RefreshCw,
  MessageSquare, Mail, Star, Archive, Trash2,
  Reply, ChevronRight, Circle, CheckCheck, Check,
  Linkedin, Instagram, Facebook, Filter, X, Zap,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'
import { saveThreadReply, getSavedThreads } from '../services/socialInboxService'

const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const CARD2  = '#211e14'
const BORDER = 'rgba(255,255,255,0.07)'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.13)'
const GBORDER= 'rgba(200,151,62,0.28)'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.32)'

const PLATFORMS = {
  linkedin:  { label: 'LinkedIn',  color: '#0a66c2', bg: 'rgba(10,102,194,0.15)' },
  instagram: { label: 'Instagram', color: '#e1306c', bg: 'rgba(225,48,108,0.15)' },
  facebook:  { label: 'Facebook',  color: '#1877f2', bg: 'rgba(24,119,242,0.15)' },
  whatsapp:  { label: 'WhatsApp',  color: '#25d366', bg: 'rgba(37,211,102,0.15)' },
  email:     { label: 'Email',     color: '#ea4335', bg: 'rgba(234,67,53,0.15)'  },
}

const MESSAGES = [
  { id: '1', platform: 'linkedin', sender: 'Priya Sharma', initials: 'PS', role: 'Head of Marketing · TechCo', preview: 'Hi! I saw your post about AI-driven marketing and would love to connect and discuss a potential partnership.', time: '2m ago', unread: true, starred: false, thread: [
    { from: 'them', text: 'Hi! I saw your post about AI-driven marketing and would love to connect and discuss a potential partnership.', time: '2m ago' },
  ]},
  { id: '2', platform: 'instagram', sender: 'design_studio_hz', initials: 'DH', role: 'Content Creator · 45K followers', preview: "Love your content! Would you be interested in a collab? We create premium visual assets 🎨", time: '18m ago', unread: true, starred: true, thread: [
    { from: 'them', text: "Love your content! Would you be interested in a collab? We create premium visual assets 🎨", time: '18m ago' },
  ]},
  { id: '3', platform: 'email', sender: 'partnerships@brandhub.com', initials: 'BH', role: 'Brand Partnerships', preview: 'Following up on our proposal for Q3 partnership opportunities. We have an exciting campaign lined up.', time: '1h ago', unread: true, starred: false, thread: [
    { from: 'me',   text: "Thanks for reaching out! We'd love to hear more about the Q3 campaign.", time: '3h ago' },
    { from: 'them', text: 'Following up on our proposal for Q3 partnership opportunities. We have an exciting campaign lined up.', time: '1h ago' },
  ]},
  { id: '4', platform: 'facebook', sender: 'Raj Kumar', initials: 'RK', role: 'Entrepreneur · Mumbai', preview: "Just saw your ad! This is exactly what I've been looking for. Can you tell me more about your services?", time: '2h ago', unread: false, starred: false, thread: [
    { from: 'them', text: "Just saw your ad! This is exactly what I've been looking for. Can you tell me more about your services?", time: '2h ago' },
  ]},
  { id: '5', platform: 'whatsapp', sender: '+91 98765 43210', initials: 'WA', role: 'WhatsApp Lead', preview: 'Hello, I am interested in your marketing packages. What are the pricing options?', time: '3h ago', unread: false, starred: true, thread: [
    { from: 'them', text: 'Hello, I am interested in your marketing packages. What are the pricing options?', time: '3h ago' },
    { from: 'me',   text: 'Hi! Thanks for reaching out. Our packages start at $199/month. I will send you the full brochure shortly.', time: '2h ago' },
    { from: 'them', text: 'That sounds great! Please do send it across. Looking forward to it.', time: '1h ago' },
  ]},
  { id: '6', platform: 'linkedin', sender: 'Anita Singh', initials: 'AS', role: 'CEO · StartupXYZ', preview: "We're looking for a marketing partner for our Series A launch. Your EVOX platform looks perfect for us.", time: '5h ago', unread: false, starred: false, thread: [
    { from: 'them', text: "We're looking for a marketing partner for our Series A launch. Your EVOX platform looks perfect for us.", time: '5h ago' },
  ]},
  { id: '7', platform: 'instagram', sender: 'foodie_adventures_', initials: 'FA', role: 'Food Blogger · 120K followers', preview: 'Hey! Loved your event promo content. Would you like to collaborate on our food festival campaign?', time: '1d ago', unread: false, starred: false, thread: [
    { from: 'them', text: 'Hey! Loved your event promo content. Would you like to collaborate on our food festival campaign?', time: '1d ago' },
  ]},
  { id: '8', platform: 'email', sender: 'noreply@eventbrite.com', initials: 'EB', role: 'Eventbrite Platform', preview: 'Your event "Marketing Summit 2025" is now live and accepting registrations on Eventbrite.', time: '1d ago', unread: false, starred: false, thread: [
    { from: 'them', text: 'Your event "Marketing Summit 2025" is now live and accepting registrations on Eventbrite.', time: '1d ago' },
  ]},
  { id: '9', platform: 'facebook', sender: 'Meera Nair', initials: 'MN', role: 'Marketing Manager · Retail Brand', preview: 'Saw your case study on Instagram growth — impressive results! We need something similar for our brand.', time: '2d ago', unread: false, starred: true, thread: [
    { from: 'them', text: 'Saw your case study on Instagram growth — impressive results! We need something similar for our brand.', time: '2d ago' },
  ]},
]

function PlatformIcon({ platform, size = 12 }) {
  if (platform === 'linkedin')  return <Linkedin  size={size} />
  if (platform === 'instagram') return <Instagram size={size} />
  if (platform === 'facebook')  return <Facebook  size={size} />
  if (platform === 'whatsapp')  return <MessageSquare size={size} />
  if (platform === 'email')     return <Mail size={size} />
  return null
}

export default function SocialInbox() {
  useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(MESSAGES[0])
  const [reply, setReply]         = useState('')
  const [sending, setSending]     = useState(false)
  const [messages, setMessages]   = useState(MESSAGES)
  const [aiLoading, setAiLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function loadThreads() {
    if (!user?.uid) return
    try {
      const saved = await getSavedThreads(user.uid)
      const merged = MESSAGES.map(m => saved[m.id] ? { ...m, thread: saved[m.id] } : m)
      setMessages(merged)
      setSelected(prev => merged.find(m => m.id === prev?.id) || merged[0])
    } catch (e) { console.error('Failed to load saved inbox threads', e) }
  }

  useEffect(() => { loadThreads() }, [user?.uid])

  async function handleRefresh() {
    setRefreshing(true)
    await loadThreads()
    setRefreshing(false)
  }

  const filtered = messages.filter(m => {
    if (filter === 'unread' && !m.unread) return false
    if (filter === 'starred' && !m.starred) return false
    if (filter !== 'all' && filter !== 'unread' && filter !== 'starred' && m.platform !== filter) return false
    if (search && !m.sender.toLowerCase().includes(search.toLowerCase()) && !m.preview.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const unreadCount = messages.filter(m => m.unread).length

  function markRead(id) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m))
  }

  function toggleStar(id) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m))
  }

  function selectMessage(msg) {
    setSelected(msg)
    markRead(msg.id)
    setReply('')
  }

  async function handleSend() {
    if (!reply.trim() || !selected) return
    setSending(true)
    const newThread = [...(selected.thread || []), { from: 'me', text: reply, time: 'Just now' }]
    setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, thread: newThread } : m))
    setSelected(prev => ({ ...prev, thread: newThread }))
    setReply('')
    try {
      await saveThreadReply(user?.uid, selected.id, newThread)
    } catch (e) { console.error('Failed to save reply', e) }
    setSending(false)
  }

  async function generateAIReply() {
    if (!selected) return
    setAiLoading(true)
    try {
      const lastFromThem = [...(selected.thread || [])].reverse().find(m => m.from === 'them')
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `You are a helpful marketing assistant drafting a reply to a ${PLATFORMS[selected.platform]?.label || 'social'} message.
Sender: ${selected.sender} (${selected.role || ''})
Their message: "${lastFromThem?.text || selected.preview}"

Write a warm, professional, concise reply (2-3 sentences max). Respond with ONLY the reply text — no quotes, no explanation.`,
          }],
          temperature: 0.7,
          max_tokens: 200,
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (text) setReply(text)
    } catch (e) {
      console.error('AI reply generation failed', e)
    } finally {
      setAiLoading(false)
    }
  }

  const sel = selected

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 20px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <button onClick={() => navigate('/agents-hub')} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.07em', marginBottom: 4 }}>
              <Inbox size={10} /> SOCIAL INBOX
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', margin: 0 }}>
              Unified Inbox {unreadCount > 0 && <span style={{ fontSize: 14, background: '#ef4444', color: '#fff', borderRadius: 100, padding: '2px 8px', fontWeight: 800, verticalAlign: 'middle', marginLeft: 8 }}>{unreadCount}</span>}
            </h1>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, color: GOLD, fontSize: 12, fontWeight: 700, cursor: refreshing ? 'default' : 'pointer', fontFamily: 'inherit', opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <style>{'@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }'}</style>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', marginBottom: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, fontSize: 12.5, color: TEXT2 }}>
          <Zap size={13} color="#f59e0b" /> <strong style={{ color: '#f59e0b' }}>Example conversations</strong> — no live LinkedIn/Instagram/Facebook/WhatsApp inbox is connected yet, so these threads are sample data. Replies you send are saved to your account, and Suggested Reply uses a real AI call.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', minHeight: 600 }}>

          {/* LEFT — Message List */}
          <div style={{ borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>

            {/* Search */}
            <div style={{ padding: '14px 14px 0' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: TEXT3 }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search messages…"
                  style={{ width: '100%', background: '#0e0c09', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '8px 10px 8px 30px', color: TEXT, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
                {['all', 'unread', 'starred', 'linkedin', 'instagram', 'facebook', 'whatsapp', 'email'].map(f => (
                  <button
                    key={f} onClick={() => setFilter(f)}
                    style={{
                      padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid',
                      background: filter === f ? (PLATFORMS[f]?.color || GOLD) + '18' : 'transparent',
                      borderColor: filter === f ? (PLATFORMS[f]?.color || GOLD) + '60' : BORDER,
                      color: filter === f ? (PLATFORMS[f]?.color || GOLD) : TEXT3,
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : f === 'starred' ? '★ Starred' : PLATFORMS[f]?.label || f}
                  </button>
                ))}
              </div>
            </div>

            {/* Message rows */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: TEXT3, fontSize: 13 }}>No messages</div>
              ) : filtered.map(msg => {
                const p = PLATFORMS[msg.platform]
                const isActive = sel?.id === msg.id
                return (
                  <div
                    key={msg.id}
                    onClick={() => selectMessage(msg)}
                    style={{
                      padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`,
                      background: isActive ? CARD2 : 'transparent',
                      borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: p.bg, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: p.color }}>{msg.initials}</span>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, border: `1px solid ${BORDER}` }}>
                          <PlatformIcon platform={msg.platform} size={8} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: msg.unread ? 800 : 600, color: msg.unread ? TEXT : TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{msg.sender}</span>
                          <span style={{ fontSize: 10, color: TEXT3, flexShrink: 0 }}>{msg.time}</span>
                        </div>
                        <div style={{ fontSize: 11, color: TEXT3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{msg.preview}</div>
                      </div>
                    </div>
                    {msg.unread && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Conversation */}
          {sel ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Conversation header */}
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{sel.sender}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                      background: PLATFORMS[sel.platform].bg,
                      color: PLATFORMS[sel.platform].color,
                      border: `1px solid ${PLATFORMS[sel.platform].color}30`,
                    }}>
                      <PlatformIcon platform={sel.platform} size={9} />
                      {PLATFORMS[sel.platform].label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{sel.role}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleStar(sel.id)} style={{ padding: '6px 8px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', color: sel.starred ? '#f59e0b' : TEXT3, display: 'flex', alignItems: 'center' }}>
                    <Star size={13} fill={sel.starred ? '#f59e0b' : 'none'} />
                  </button>
                  <button style={{ padding: '6px 8px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center' }}>
                    <Archive size={13} />
                  </button>
                  <button style={{ padding: '6px 8px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(sel.thread || []).map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: msg.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.from === 'me' ? `linear-gradient(135deg, ${GOLD}22, ${GOLD}10)` : CARD2,
                      border: `1px solid ${msg.from === 'me' ? GBORDER : BORDER}`,
                    }}>
                      <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{msg.text}</p>
                      <div style={{ fontSize: 10, color: TEXT3, marginTop: 5, textAlign: msg.from === 'me' ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4, justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                        {msg.time}
                        {msg.from === 'me' && <CheckCheck size={10} style={{ color: '#10b981' }} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply composer */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={generateAIReply}
                    disabled={aiLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', background: GDIM, border: `1px solid ${GBORDER}`,
                      borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700,
                      cursor: aiLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
                      opacity: aiLoading ? 0.6 : 1,
                    }}
                  >
                    <Zap size={11} /> {aiLoading ? 'Loading…' : 'Suggested Reply'}
                  </button>
                  <span style={{ fontSize: 11, color: TEXT3, alignSelf: 'center' }}>or type your reply below</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={`Reply to ${sel.sender}…`}
                    rows={3}
                    style={{
                      flex: 1, background: '#0e0c09', border: `1px solid ${BORDER}`,
                      borderRadius: 10, padding: '10px 12px', color: TEXT, fontSize: 13,
                      fontFamily: 'inherit', resize: 'none', outline: 'none',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    style={{
                      padding: '10px 16px', background: reply.trim() ? `linear-gradient(135deg, ${GOLD}, #a87030)` : CARD2,
                      border: 'none', borderRadius: 10, color: reply.trim() ? '#0e0c09' : TEXT3,
                      fontWeight: 700, cursor: reply.trim() ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      fontSize: 11, transition: 'all 0.2s',
                    }}
                  >
                    <Send size={16} />
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: TEXT3, marginTop: 6 }}>Ctrl+Enter to send · Sends via {PLATFORMS[sel.platform].label}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3 }}>
              <div style={{ textAlign: 'center' }}>
                <Inbox size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
