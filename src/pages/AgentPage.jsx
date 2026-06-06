import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, FileText, MessageCircle, Linkedin,
  Hash, Sparkles, Code2, Video, ArrowLeft, Copy, Check,
  Loader2, Zap, Coins, Globe, RefreshCw
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getUserData, deductToken } from '../services/userService'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function buildAgentPrompt(agentType, form) {
  const prompts = {
    writer: `You are an expert content writer and thought leader. Write a detailed, long-form article for a brand.

Topic: ${form.topic}
Brand: ${form.brandName}
Target Audience: ${Array.isArray(form.audience) ? form.audience.join(', ') : form.audience}
Tone: ${form.tone || 'Professional, Authoritative, Engaging'}

Write a complete article with an introduction, 4-5 substantive sections, and a conclusion. Make it insightful, original, and valuable.

Return ONLY valid JSON in this exact format, no markdown:
{"title":"Article title","sections":[{"heading":"Introduction","content":"..."},{"heading":"Section title","content":"..."},{"heading":"Conclusion","content":"..."}]}`,

    reddit: `You are an expert Reddit marketer. Find relevant threads and draft authentic replies.

Subreddit(s): ${form.subreddit}
Topic/Thread Focus: ${form.topic}
Brand/Product Context: ${form.brandContext}

Provide thread ideas and draft 3 authentic, non-promotional replies that add genuine value.

Return ONLY valid JSON:
{"title":"Reddit Strategy for ${form.subreddit}","sections":[{"heading":"Recommended Subreddits & Thread Ideas","content":"..."},{"heading":"Reply Draft 1","content":"..."},{"heading":"Reply Draft 2","content":"..."},{"heading":"Reply Draft 3","content":"..."},{"heading":"Engagement Tips","content":"..."}]}`,

    seo: `You are an expert SEO strategist. Analyze keyword opportunities and draft an SEO blog post.

Website: ${form.websiteUrl}
Target Keyword: ${form.targetKeyword}
Industry: ${form.industry || 'Not specified'}

Provide keyword analysis, a full SEO-optimized blog post outline, meta tags, and internal linking suggestions.

Return ONLY valid JSON:
{"title":"SEO Strategy: ${form.targetKeyword}","sections":[{"heading":"Keyword Analysis & Opportunities","content":"..."},{"heading":"Blog Post: [Title]","content":"..."},{"heading":"Meta Title & Description","content":"..."},{"heading":"Internal Linking Strategy","content":"..."},{"heading":"Quick Win Actions","content":"..."}]}`,

    linkedin_agent: `You are a LinkedIn content expert. Draft professional posts optimized for reach and thought leadership.

Topic/Insight: ${form.topic}
Brand/Person: ${form.brandName}
Target Audience: ${Array.isArray(form.audience) ? form.audience.join(', ') : form.audience || 'Business professionals'}

Draft 3 LinkedIn posts with different angles: a story post, an insight post, and a list post.

Return ONLY valid JSON:
{"title":"LinkedIn Content for ${form.brandName}","sections":[{"heading":"Story Post (Hook + Narrative)","content":"..."},{"heading":"Insight Post (Thought Leadership)","content":"..."},{"heading":"List Post (Value + Engagement)","content":"..."},{"heading":"Hashtag Strategy","content":"..."},{"heading":"Posting Schedule Recommendation","content":"..."}]}`,

    hackernews: `You are a Hacker News community expert. Identify engagement opportunities and draft authentic technical comments.

Topic/Domain: ${form.topic}
Brand/Product: ${form.brandName}
Unique Value Proposition: ${form.value}

Find the best HN threads to engage with and draft 3 technical, authentic comments.

Return ONLY valid JSON:
{"title":"HN Engagement Strategy for ${form.brandName}","sections":[{"heading":"Best Thread Types to Target","content":"..."},{"heading":"Comment Draft 1 (Technical Insight)","content":"..."},{"heading":"Comment Draft 2 (Problem-Solution)","content":"..."},{"heading":"Comment Draft 3 (Show HN Angle)","content":"..."},{"heading":"HN Community Tips","content":"..."}]}`,

    geo: `You are a Generative Engine Optimization (GEO) expert. Optimize content to appear in AI-generated answers.

Brand: ${form.brandName}
Target Keywords for AI Search: ${form.keywords}
Brand Description: ${form.description}

Create content optimized to be cited by ChatGPT, Perplexity, and Google AI Overviews.

Return ONLY valid JSON:
{"title":"GEO Strategy for ${form.brandName}","sections":[{"heading":"AI Citation Strategy","content":"..."},{"heading":"Optimized Brand Description (for AI training)","content":"..."},{"heading":"FAQ Content (AI loves Q&A format)","content":"..."},{"heading":"Authority Signals to Build","content":"..."},{"heading":"Content Calendar for GEO","content":"..."}]}`,

    coding: `You are a technical SEO and web development expert. Generate code fixes for technical SEO issues.

Website: ${form.websiteUrl}
Issue/Goal: ${form.issue}
Tech Stack: ${form.techStack || 'Not specified'}

Provide specific code solutions for the SEO issue.

Return ONLY valid JSON:
{"title":"Technical SEO Fix: ${form.issue}","sections":[{"heading":"Issue Diagnosis","content":"..."},{"heading":"Code Solution","content":"..."},{"heading":"Implementation Steps","content":"..."},{"heading":"Testing & Validation","content":"..."},{"heading":"Additional Quick Wins","content":"..."}]}`,

    ugc_videos: `You are a UGC video content strategist. Create detailed video briefs and scripts.

Product/Service: ${form.product}
Video Style: ${form.style}
Target Audience: ${Array.isArray(form.audience) ? form.audience.join(', ') : form.audience || 'General social media users'}
Platforms: ${form.platforms || 'Instagram Reels, TikTok'}

Create a complete video brief with script, hooks, and platform adaptations.

Return ONLY valid JSON:
{"title":"UGC Video Brief: ${form.product}","sections":[{"heading":"Video Brief & Concept","content":"..."},{"heading":"Full Script (Hook + Body + CTA)","content":"..."},{"heading":"Instagram Reels Version","content":"..."},{"heading":"TikTok Version","content":"..."},{"heading":"Filming & Production Tips","content":"..."}]}`,
  }
  return prompts[agentType] || prompts.writer
}

async function callGroqAgent(agentType, form) {
  const prompt = buildAgentPrompt(agentType, form)
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq API error ${res.status}`)
  }
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

const AGENTS = {
  reddit: {
    title: 'Reddit Agent',
    subtitle: 'Identify relevant threads & draft authentic replies',
    description: 'Finds Reddit communities where your brand can add value and drafts replies that feel genuine — not promotional.',
    color: '#ff4500',
    icon: MessageSquare,
    fields: [
      { name: 'subreddit', label: 'Target Subreddit(s)', placeholder: 'e.g. r/startups, r/marketing, r/entrepreneur', required: true },
      { name: 'topic', label: 'Topic / Thread Focus', placeholder: 'What discussion topic are you targeting?', required: true },
      { name: 'brandContext', label: 'Brand / Product Context', placeholder: 'Brief description of your brand or product', required: true, multiline: true },
    ],
  },
  seo: {
    title: 'SEO Agent',
    subtitle: 'Keyword opportunities & rank-ready blog drafts',
    description: 'Analyzes keyword gaps, drafts full SEO-optimized blog posts, and provides meta optimization to drive organic traffic.',
    color: '#10b981',
    icon: Search,
    fields: [
      { name: 'websiteUrl', label: 'Website URL', placeholder: 'https://yoursite.com', required: true },
      { name: 'targetKeyword', label: 'Target Keyword / Topic', placeholder: 'e.g. "email marketing for startups"', required: true },
      { name: 'industry', label: 'Industry (optional)', placeholder: 'e.g. SaaS, E-commerce, Health', required: false },
    ],
  },
  writer: {
    title: 'Writer Agent',
    subtitle: 'Long-form content aligned to your brand voice',
    description: 'Creates articles, thought leadership pieces, and long-form copy that stays true to your brand voice and engages your target audience.',
    color: '#8b5cf6',
    icon: FileText,
    fields: [
      { name: 'topic', label: 'Article Topic', placeholder: 'What do you want to write about?', required: true },
      { name: 'brandName', label: 'Brand Name', placeholder: 'Your brand name', required: true },
      { name: 'audience', label: 'Target Audience', placeholder: 'Select target audience(s)', required: true, fieldType: 'audience' },
      { name: 'tone', label: 'Tone (optional)', placeholder: 'e.g. Professional, Casual, Authoritative, Friendly', required: false },
    ],
  },
  twitter: {
    title: 'X (Twitter) Agent',
    subtitle: 'Post and thread drafts for X',
    description: 'Generates high-engagement tweets and threads tailored to your brand voice, with hooks, hashtags, and call-to-actions.',
    color: '#1a1a2e',
    icon: MessageCircle,
    fields: [
      { name: 'topic', label: 'Topic', placeholder: 'What do you want to post about?', required: true },
      { name: 'brandName', label: 'Brand / Handle', placeholder: 'Your brand name or @handle', required: true },
      { name: 'tone', label: 'Tone (optional)', placeholder: 'e.g. Bold, Witty, Educational, Controversial', required: false },
    ],
  },
  linkedin_agent: {
    title: 'LinkedIn Agent',
    subtitle: 'Professional post ideas & engagement drafts',
    description: 'Proposes content ideas and drafts professional LinkedIn posts optimized for reach, engagement, and thought leadership.',
    color: '#0a66c2',
    icon: Linkedin,
    fields: [
      { name: 'topic', label: 'Post Topic / Insight', placeholder: 'What insight or story do you want to share?', required: true },
      { name: 'brandName', label: 'Brand / Person Name', placeholder: 'Your brand or personal name', required: true },
      { name: 'audience', label: 'Target Audience (optional)', placeholder: 'Select target audience(s)', required: false, fieldType: 'audience' },
    ],
  },
  hackernews: {
    title: 'Hacker News Agent',
    subtitle: 'Pinpoint moments to share & draft comments',
    description: 'Identifies the best moments to engage on HN and drafts technical, authentic comments that earn upvotes without feeling like ads.',
    color: '#ff6600',
    icon: Hash,
    fields: [
      { name: 'topic', label: 'Topic / Domain', placeholder: 'e.g. developer tools, AI/ML, SaaS, open source', required: true },
      { name: 'brandName', label: 'Brand / Product Name', placeholder: 'Your brand or product name', required: true },
      { name: 'value', label: 'Unique Value Proposition', placeholder: 'What unique value do you bring to the HN community?', required: true },
    ],
  },
  geo: {
    title: 'GEO Agent',
    subtitle: 'Brand citations in ChatGPT & Google AI Overviews',
    description: 'Optimizes your content to be cited by AI models like ChatGPT and Google AI Overviews, establishing your brand in the new AI search landscape.',
    color: '#06b6d4',
    icon: Sparkles,
    fields: [
      { name: 'brandName', label: 'Brand Name', placeholder: 'Your brand name', required: true },
      { name: 'keywords', label: 'Target Keywords for AI Search', placeholder: 'e.g. best CRM for startups, sales automation tool', required: true },
      { name: 'description', label: 'Brand / Product Description', placeholder: 'What does your brand do? What problem does it solve?', required: true, multiline: true },
    ],
  },
  coding: {
    title: 'Coding Agent',
    subtitle: 'Automate technical SEO fixes & site improvements',
    description: 'Generates code-level fixes for technical SEO issues — structured data, page speed, Core Web Vitals, and more.',
    color: '#f59e0b',
    icon: Code2,
    fields: [
      { name: 'websiteUrl', label: 'Website URL', placeholder: 'https://yoursite.com', required: true },
      { name: 'issue', label: 'Issue / Goal', placeholder: 'e.g. fix structured data, improve LCP, add canonical tags', required: true },
      { name: 'techStack', label: 'Tech Stack (optional)', placeholder: 'e.g. React/Next.js, WordPress, Shopify, Vue', required: false },
    ],
  },
  ugc_videos: {
    title: 'UGC Videos Agent',
    subtitle: 'AI video briefs & multi-aspect clip scripts',
    description: 'Creates guided video briefs, full scripts, and platform-specific adaptations for UGC-style content on Instagram, TikTok, and YouTube Shorts.',
    color: '#ec4899',
    icon: Video,
    fields: [
      { name: 'product', label: 'Product / Service', placeholder: 'What are you promoting?', required: true },
      { name: 'style', label: 'Video Style', placeholder: 'e.g. Testimonial, How-to, Unboxing, Day-in-life', required: true },
      { name: 'audience', label: 'Target Audience (optional)', placeholder: 'Select target audience(s)', required: false, fieldType: 'audience' },
      { name: 'platforms', label: 'Platforms (optional)', placeholder: 'e.g. Instagram Reels, TikTok, YouTube Shorts', required: false },
    ],
  },
}

const AUDIENCE_OPTIONS = [
  "Gen Z (18-24)", "Millennials (25-40)", "Gen X (41-56)", "Baby Boomers (57+)", "Teens (13-17)",
  "Professionals / B2B", "C-Suite / Executives", "Marketing Managers", "Founders & CEOs",
  "Entrepreneurs", "Freelancers", "Sales Teams", "HR Professionals", "Finance Professionals",
  "Developers / Engineers", "Small Business Owners", "Mid-Market Companies", "Enterprise Clients",
  "Startups", "Agencies", "Students", "Parents", "Homeowners", "First-Time Buyers",
  "Luxury Buyers", "Budget-Conscious Shoppers", "Tech Enthusiasts", "Fitness & Wellness",
  "Fashion & Lifestyle", "Food & Beverage Lovers", "Travel Enthusiasts", "Home & Family",
  "Gamers", "Health-Conscious Consumers", "Eco-Conscious / Sustainability", "Sports & Outdoor",
  "E-commerce Shoppers", "SaaS Users", "Healthcare Professionals", "Real Estate Investors",
  "Event Attendees", "Content Creators / Influencers", "Investors / HNIs",
]

function AudienceDropdown({ value, onChange, color, required }) {
  const [open, setOpen] = React.useState(false)
  const selected = Array.isArray(value) ? value : value ? [value] : []
  const toggle = (opt) => onChange(selected.includes(opt) ? selected.filter(a => a !== opt) : [...selected, opt])
  const ref = React.useRef(null)
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '11px 14px', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? color + '60' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10, fontSize: 14, color: selected.length ? '#f0ebe0' : 'rgba(240,235,224,0.35)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color 0.2s', userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected.length ? selected.join(', ') : 'Select target audience(s)'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginLeft: 8, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 4l4 4 4-4" stroke="rgba(240,235,224,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#1c1a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          maxHeight: 260, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          padding: '8px 6px',
        }}>
          {AUDIENCE_OPTIONS.map(opt => {
            const active = selected.includes(opt)
            return (
              <div key={opt} onClick={() => toggle(opt)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, cursor: 'pointer', fontSize: 13,
                background: active ? `${color}18` : 'transparent',
                color: active ? '#f0ebe0' : 'rgba(240,235,224,0.6)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: active ? color : 'transparent',
                  border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}>
                  {active && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                </div>
                {opt}
              </div>
            )
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {selected.map(s => (
            <span key={s} onClick={() => toggle(s)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
              background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 100,
              fontSize: 11, fontWeight: 600, color: color, cursor: 'pointer',
            }}>
              {s} ×
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2500)
    }).catch(() => {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(key)
      setTimeout(() => setCopied(null), 2500)
    })
  }
  return { copied, copy }
}

export default function AgentPage() {
  const { agentType } = useParams()
  const navigate = useNavigate()
  const agent = AGENTS[agentType]

  const { user, authReady } = useRequireAuth()
  const [tokenBalance, setTokenBalance] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { copied, copy } = useCopy()

  useEffect(() => {
    if (!authReady || !user) return
    getUserData(user.uid).then((data) => {
      setTokenBalance(data?.tokenBalance ?? 0)
    })
  }, [authReady, user])

  useEffect(() => {
    if (authReady && !agent) navigate('/dashboard')
  }, [authReady, agent, navigate])

  if (!authReady || !agent) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0c09', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#c8973e', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const Icon = agent.icon

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tokenBalance < 1) {
      setError('You need at least 1 token to run an agent. Please purchase tokens.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      await deductToken(user.uid)
      setTokenBalance(b => b - 1)

      const data = await callGroqAgent(agentType, form)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Agent failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasResult = result && Array.isArray(result.sections) && result.sections.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#0e0c09', color: '#f0ebe0' }}>
      <Navbar />

      {/* Subtle glow */}
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vh', pointerEvents: 'none', background: `radial-gradient(ellipse, ${agent.color}0a 0%, transparent 70%)`, zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '108px 24px 64px', position: 'relative', zIndex: 1 }}>

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32, padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(240,235,224,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f0ebe0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(240,235,224,0.6)' }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `${agent.color}18`, border: `1px solid ${agent.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.color, flexShrink: 0, boxShadow: `0 0 24px ${agent.color}18` }}>
              <Icon size={28} />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: `${agent.color}15`, border: `1px solid ${agent.color}35`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: agent.color, marginBottom: 8, letterSpacing: '0.06em' }}>
                <Zap size={10} /> AI AGENT
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.025em', color: '#f0ebe0', marginBottom: 4, fontFamily: "'Syne','Inter',sans-serif" }}>{agent.title}</h1>
              <p style={{ color: 'rgba(240,235,224,0.5)', fontSize: 15 }}>{agent.subtitle}</p>
            </div>
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: hasResult || loading ? 'minmax(320px, 420px) 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ background: '#1c1a13', border: `1px solid ${agent.color}35`, borderRadius: 20, padding: 32, boxShadow: `0 0 32px ${agent.color}0c` }}
          >
            <p style={{ color: 'rgba(240,235,224,0.5)', fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>{agent.description}</p>

            <form onSubmit={handleSubmit}>
              {agent.fields.map(field => (
                <div key={field.name} style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(240,235,224,0.55)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {field.label}
                    {field.required && <span style={{ color: agent.color, marginLeft: 3 }}>*</span>}
                  </label>
                  {field.fieldType === 'audience' ? (
                    <AudienceDropdown
                      value={form[field.name] || []}
                      onChange={val => setForm(f => ({ ...f, [field.name]: val }))}
                      color={agent.color}
                      required={field.required}
                    />
                  ) : field.multiline ? (
                    <textarea
                      value={form[field.name] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                        fontSize: 14, color: '#f0ebe0', outline: 'none', resize: 'vertical',
                        fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = agent.color + '60'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  ) : (
                    <input
                      type="text"
                      value={form[field.name] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                        fontSize: 14, color: '#f0ebe0', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = agent.color + '60'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  )}
                </div>
              ))}

              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                  {error}
                  {tokenBalance < 1 && (
                    <button
                      type="button"
                      onClick={() => navigate('/purchase')}
                      style={{ display: 'block', marginTop: 8, color: '#c8973e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}
                    >
                      Buy tokens →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 20px',
                  background: loading
                    ? 'rgba(255,255,255,0.05)'
                    : `linear-gradient(135deg, ${agent.color}, ${agent.color}bb)`,
                  border: 'none', borderRadius: 12,
                  color: loading ? 'rgba(240,235,224,0.35)' : '#fff',
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: "'Inter',sans-serif",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = `0 8px 24px ${agent.color}40` }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating content...</>
                  : <><Zap size={15} /> Run {agent.title} <span style={{ opacity: 0.65, fontSize: 12, fontWeight: 600 }}>· 1 token</span></>
                }
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <Coins size={11} style={{ color: tokenBalance > 0 ? '#c8973e' : '#ef4444' }} />
                <span style={{ fontSize: 12, color: 'rgba(240,235,224,0.4)' }}>
                  Balance: <strong style={{ color: tokenBalance > 0 ? '#c8973e' : '#ef4444' }}>{tokenBalance} token{tokenBalance !== 1 ? 's' : ''}</strong>
                </span>
              </div>
            </form>
          </motion.div>

          {/* Loading skeleton */}
          {loading && !hasResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Loader2 size={14} style={{ color: agent.color, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: 'rgba(240,235,224,0.5)', fontWeight: 600 }}>Agent is thinking... this takes 15–30 seconds</span>
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: '#1c1a13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                  <div style={{ height: 13, background: 'rgba(255,255,255,0.07)', borderRadius: 6, width: `${30 + i * 10}%`, marginBottom: 14 }} />
                  <div style={{ height: 9, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '100%', marginBottom: 6 }} />
                  <div style={{ height: 9, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '88%', marginBottom: 6 }} />
                  <div style={{ height: 9, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '72%' }} />
                </div>
              ))}
            </motion.div>
          )}

          {/* Results */}
          {hasResult && !loading && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Agent Complete</span>
                  <span style={{ fontSize: 13, color: 'rgba(240,235,224,0.4)' }}>— {result.title || agent.title + ' Results'}</span>
                </div>
                <button
                  onClick={() => { setResult(null); setForm({}) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(240,235,224,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <RefreshCw size={11} /> Run again
                </button>
              </div>

              {result.sections.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ background: '#1c1a13', border: `1px solid ${agent.color}22`, borderRadius: 16, padding: 24 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0ebe0', letterSpacing: '-0.01em', margin: 0, fontFamily: "'Syne','Inter',sans-serif" }}>{section.heading}</h3>
                    <button
                      onClick={() => copy(section.content, i)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(240,235,224,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${agent.color}15`; e.currentTarget.style.color = agent.color }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(240,235,224,0.5)' }}
                    >
                      {copied === i
                        ? <><Check size={12} style={{ color: '#10b981' }} /> Copied</>
                        : <><Copy size={12} /> Copy</>
                      }
                    </button>
                  </div>
                  <p style={{ color: 'rgba(240,235,224,0.65)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
