import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ArrowLeft, Loader2, Copy, Check, AlertCircle,
  Globe, Mail, BookOpen, ChevronDown, ChevronUp, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'

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
const GROQ   = import.meta.env.VITE_GROQ_API_KEY || ''

const TABS = [
  { key: 'blog',       label: 'Blog Article', fullName: 'Blog Article Generator', desc: 'SEO-optimised blog posts with headlines, sections & meta',        icon: <BookOpen size={15} />, icon48: <BookOpen size={22} />, color: '#6366f1' },
  { key: 'landing',    label: 'Landing Page', fullName: 'Landing Page Copy',      desc: 'Hero headline, benefits, testimonials, FAQ & final CTA',          icon: <Globe size={15} />,    icon48: <Globe size={22} />,    color: '#10b981' },
  { key: 'newsletter', label: 'Newsletter',   fullName: 'Newsletter Generator',   desc: 'Ready-to-send emails — subject line, body sections & sign-off',   icon: <Mail size={15} />,     icon48: <Mail size={22} />,     color: '#f59e0b' },
]

const TONES = ['Professional', 'Conversational', 'Bold', 'Inspirational', 'Playful', 'Authoritative']
const ARTICLE_LENGTHS = [
  { value: 'short',  label: 'Short  (~500 words)'   },
  { value: 'medium', label: 'Medium (~1,000 words)'  },
  { value: 'long',   label: 'Long   (~1,500 words)'  },
]
const NEWSLETTER_TYPES = [
  'Weekly Digest',
  'Product Promotion',
  'Educational / Tips',
  'Event Announcement',
  'Welcome Email',
  'Re-engagement',
  'Company News',
]
const INDUSTRIES = ['SaaS / Tech', 'E-Commerce', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Marketing Agency', 'Retail', 'Other']
const TARGET_AUDIENCES = [
  'Marketing Managers',
  'CMOs & Marketing Leaders',
  'Small Business Owners',
  'Startup Founders',
  'E-Commerce Brands',
  'B2B Decision Makers',
  'Sales Professionals',
  'Product Managers',
  'Entrepreneurs',
  'Enterprise Teams',
  'Agency Clients',
  'General Consumers',
]

async function groqGenerate(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 3000,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateBlog({ topic, keywords, brand, audience, tone, industry, length }) {
  const lengthGuide = {
    short:  { sections: '2-3', wordsPerSection: '80-100',  readTime: '~3 min' },
    medium: { sections: '4-5', wordsPerSection: '150-200', readTime: '~5 min' },
    long:   { sections: '6-7', wordsPerSection: '200-250', readTime: '~8 min' },
  }
  const guide = lengthGuide[length] || lengthGuide.medium

  const prompt = `You are an expert SEO blog writer. Write a complete, high-quality blog article.

Topic: ${topic}
Brand/Company: ${brand || 'Our Company'}
Target Audience: ${audience || 'business professionals'}
Tone: ${tone || 'Professional'}
Industry: ${industry || 'general'}
Focus Keywords: ${keywords || topic}
Article Length: ${length || 'medium'} (${guide.sections} H2 sections, ~${guide.wordsPerSection} words each, estimated read time ${guide.readTime})

Write a full blog article with:
- A compelling, SEO-optimised headline (H1)
- Meta title (under 60 chars)
- Meta description (under 155 chars)
- Introduction paragraph (hook the reader)
- ${guide.sections} H2 sections with body content (~${guide.wordsPerSection} words each)
- Conclusion with CTA
- Estimated read time

Return ONLY valid JSON (no markdown code blocks):
{
  "metaTitle": "...",
  "metaDescription": "...",
  "headline": "...",
  "readTime": "5 min read",
  "intro": "...",
  "sections": [
    { "h2": "Section heading", "body": "Section body text..." },
    { "h2": "Section heading", "body": "Section body text..." }
  ],
  "conclusion": "...",
  "cta": "Call to action text"
}`

  const raw = await groqGenerate(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

async function generateLandingPage({ product, headline_focus, cta_goal, brand, audience, tone }) {
  const prompt = `You are an expert conversion copywriter. Create a complete landing page copy structure.

Product/Service: ${product}
Brand: ${brand || 'Our Company'}
Target Audience: ${audience || 'potential customers'}
Main Goal: ${cta_goal || 'get a free trial signup'}
Headline Focus: ${headline_focus || 'the main benefit'}
Tone: ${tone || 'Professional'}

Write complete landing page copy including all sections.

Return ONLY valid JSON:
{
  "heroHeadline": "Bold 8-12 word headline that conveys the main benefit",
  "heroSubheadline": "Supporting 1-2 sentence subheadline with more detail",
  "heroCta": "Action-oriented CTA button text",
  "benefits": [
    { "icon": "emoji", "title": "Benefit title", "description": "2-sentence benefit description" },
    { "icon": "emoji", "title": "Benefit title", "description": "2-sentence benefit description" },
    { "icon": "emoji", "title": "Benefit title", "description": "2-sentence benefit description" }
  ],
  "socialProof": {
    "stat1": { "number": "10,000+", "label": "Happy Customers" },
    "stat2": { "number": "98%", "label": "Satisfaction Rate" },
    "stat3": { "number": "5min", "label": "Setup Time" }
  },
  "testimonials": [
    { "quote": "Short compelling testimonial", "author": "First Name L.", "role": "Job Title, Company" },
    { "quote": "Short compelling testimonial", "author": "First Name L.", "role": "Job Title, Company" }
  ],
  "faqItems": [
    { "question": "Common objection as question?", "answer": "Clear, reassuring answer" },
    { "question": "Common objection as question?", "answer": "Clear, reassuring answer" },
    { "question": "Common objection as question?", "answer": "Clear, reassuring answer" }
  ],
  "finalCta": {
    "headline": "Final closing headline",
    "subtext": "Risk reversal or guarantee text",
    "button": "Final CTA button text"
  }
}`

  const raw = await groqGenerate(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

async function generateNewsletter({ topic, audience, brand, tone, type }) {
  const prompt = `You are an expert email marketer. Write a complete newsletter email.

Topic/Theme: ${topic}
Brand: ${brand || 'Our Company'}
Audience: ${audience || 'subscribers'}
Newsletter Type: ${type || 'Educational / Tips'}
Tone: ${tone || 'Professional'}

Return ONLY valid JSON:
{
  "subjectLine": "Compelling email subject line (under 50 chars)",
  "previewText": "Preview text shown in inbox (under 90 chars)",
  "greeting": "Personalised greeting line",
  "intro": "2-3 sentence opening that hooks the reader and states the value",
  "sections": [
    { "type": "main", "heading": "Main section heading", "body": "2-3 paragraphs of content" },
    { "type": "tip", "heading": "Quick tip or highlight", "body": "1-2 sentences of value" },
    { "type": "cta", "heading": "Action section heading", "body": "Brief description of what to do next", "buttonText": "CTA button text", "buttonUrl": "#" }
  ],
  "signoff": "Warm, branded sign-off line",
  "ps": "Optional P.S. line with bonus tip or urgency"
}`

  const raw = await groqGenerate(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0])
}

function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: TEXT2,
      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
    }}>
      {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 11, color: TEXT3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}{required && <span style={{ color: '#10b981', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: CARD2, border: `1px solid ${BORDER}`,
  borderRadius: 10, color: TEXT, fontSize: 14, padding: '10px 14px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const selectStyle = {
  ...inputStyle, cursor: 'pointer',
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6,
}

function BlogResult({ result }) {
  const [expandedSection, setExpandedSection] = useState(null)
  const fullText = [
    result.headline,
    result.intro,
    ...(result.sections || []).map(s => `${s.h2}\n\n${s.body}`),
    result.conclusion,
    result.cta,
  ].join('\n\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Meta */}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SEO Meta</span>
          <span style={{ fontSize: 11, color: TEXT3 }}>{result.readTime}</span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>Meta Title</div>
          <div style={{ fontSize: 13, color: TEXT, marginBottom: 6 }}>{result.metaTitle}</div>
          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 4 }}>Meta Description</div>
          <div style={{ fontSize: 13, color: TEXT2 }}>{result.metaDescription}</div>
        </div>
        <CopyBtn text={`${result.metaTitle}\n${result.metaDescription}`} label="Copy meta" />
      </div>

      {/* Headline */}
      <div style={{ background: CARD2, border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>H1 Headline</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, lineHeight: 1.3, marginBottom: 10 }}>{result.headline}</div>
        <CopyBtn text={result.headline} />
      </div>

      {/* Intro */}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Introduction</div>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, margin: 0 }}>{result.intro}</p>
      </div>

      {/* Sections */}
      {(result.sections || []).map((sec, i) => (
        <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <button onClick={() => setExpandedSection(expandedSection === i ? null : i)} style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>H2: {sec.h2}</span>
            {expandedSection === i ? <ChevronUp size={15} color={TEXT3} /> : <ChevronDown size={15} color={TEXT3} />}
          </button>
          <AnimatePresence>
            {expandedSection === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', padding: '0 16px 16px' }}>
                <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, margin: 0 }}>{sec.body}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Conclusion + CTA */}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Conclusion + CTA</div>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, margin: '0 0 10px' }}>{result.conclusion}</p>
        <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{result.cta}</div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <CopyBtn text={fullText} label="Copy full article" />
      </div>
    </div>
  )
}

function LandingResult({ result }) {
  const [openFaq, setOpenFaq] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Hero */}
      <div style={{ background: CARD2, border: `1px solid rgba(16,185,129,0.25)`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Hero Section</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, lineHeight: 1.2, marginBottom: 10 }}>{result.heroHeadline}</div>
        <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, marginBottom: 12 }}>{result.heroSubheadline}</div>
        <div style={{ display: 'inline-block', background: '#10b981', color: '#0e0c09', padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{result.heroCta}</div>
        <br />
        <CopyBtn text={`${result.heroHeadline}\n\n${result.heroSubheadline}\n\n[CTA: ${result.heroCta}]`} label="Copy hero" />
      </div>

      {/* Stats */}
      {result.socialProof && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Social Proof Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {Object.values(result.socialProof).map((s, i) => (
              <div key={i} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{s.number}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {result.benefits?.length > 0 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>3 Core Benefits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {result.testimonials?.length > 0 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Testimonials</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.testimonials.map((t, i) => (
              <div key={i} style={{ background: BG, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${GOLD}` }}>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' }}>"{t.quote}"</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{t.author}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {result.faqItems?.length > 0 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>FAQ</div>
          {result.faqItems.map((faq, i) => (
            <div key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{faq.question}</span>
                {openFaq === i ? <ChevronUp size={14} color={TEXT3} /> : <ChevronDown size={14} color={TEXT3} />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 16px 14px', fontSize: 13, color: TEXT2, lineHeight: 1.7 }}>{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Final CTA */}
      {result.finalCta && (
        <div style={{ background: `${GDIM}`, border: `1px solid ${GBORDER}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{result.finalCta.headline}</div>
          <div style={{ fontSize: 13, color: TEXT2, marginBottom: 14 }}>{result.finalCta.subtext}</div>
          <div style={{ background: GOLD, color: '#0e0c09', display: 'inline-block', padding: '10px 24px', borderRadius: 8, fontWeight: 800, fontSize: 14 }}>{result.finalCta.button}</div>
        </div>
      )}
    </div>
  )
}

function NewsletterResult({ result }) {
  const fullEmail = [
    `Subject: ${result.subjectLine}`,
    `Preview: ${result.previewText}`,
    '',
    result.greeting,
    '',
    result.intro,
    '',
    ...(result.sections || []).flatMap(s => [`${s.heading}\n\n${s.body}`, '']),
    result.signoff,
    result.ps ? `\nP.S. ${result.ps}` : '',
  ].join('\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Subject */}
      <div style={{ background: CARD2, border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Inbox Preview</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} color="#0e0c09" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{result.subjectLine}</div>
            <div style={{ fontSize: 12, color: TEXT3 }}>{result.previewText}</div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Email Body</div>
        <div style={{ fontSize: 14, color: GOLD, marginBottom: 14, fontWeight: 600 }}>{result.greeting}</div>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.8, margin: '0 0 16px' }}>{result.intro}</p>
        {(result.sections || []).map((s, i) => (
          <div key={i} style={{ marginBottom: 16, background: BG, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{s.heading}</div>
            <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.8, margin: s.buttonText ? '0 0 12px' : 0 }}>{s.body}</p>
            {s.buttonText && (
              <div style={{ display: 'inline-block', background: GOLD, color: '#0e0c09', padding: '8px 18px', borderRadius: 7, fontWeight: 700, fontSize: 13 }}>{s.buttonText}</div>
            )}
          </div>
        ))}
        <div style={{ fontSize: 14, color: TEXT, marginBottom: result.ps ? 8 : 0 }}>{result.signoff}</div>
        {result.ps && <div style={{ fontSize: 13, color: TEXT3, fontStyle: 'italic' }}>P.S. {result.ps}</div>}
      </div>

      <CopyBtn text={fullEmail} label="Copy full email" />
    </div>
  )
}

export default function ContentGenerationPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('blog')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Blog fields
  const [blogTopic, setBlogTopic]       = useState('')
  const [blogKeywords, setBlogKeywords] = useState('')
  const [blogBrand, setBlogBrand]       = useState('')
  const [blogAudience, setBlogAudience] = useState('')
  const [blogTone, setBlogTone]         = useState('Professional')
  const [blogIndustry, setBlogIndustry] = useState('SaaS / Tech')
  const [blogLength, setBlogLength]     = useState('medium')

  // Landing fields
  const [landProduct, setLandProduct]   = useState('')
  const [landFocus, setLandFocus]       = useState('')
  const [landCtaGoal, setLandCtaGoal]   = useState('')
  const [landBrand, setLandBrand]       = useState('')
  const [landAudience, setLandAudience] = useState('')
  const [landTone, setLandTone]         = useState('Professional')

  // Newsletter fields
  const [nlTopic, setNlTopic]           = useState('')
  const [nlAudience, setNlAudience]     = useState('')
  const [nlBrand, setNlBrand]           = useState('')
  const [nlTone, setNlTone]             = useState('Professional')
  const [nlType, setNlType]             = useState('Educational / Tips')

  const handleGenerate = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      if (tab === 'blog') {
        if (!blogTopic.trim()) { setError('Please enter a blog topic.'); setLoading(false); return }
        const r = await generateBlog({ topic: blogTopic, keywords: blogKeywords, brand: blogBrand, audience: blogAudience, tone: blogTone, industry: blogIndustry, length: blogLength })
        setResult(r)
      } else if (tab === 'landing') {
        if (!landProduct.trim()) { setError('Please enter your product/service.'); setLoading(false); return }
        const r = await generateLandingPage({ product: landProduct, headline_focus: landFocus, cta_goal: landCtaGoal, brand: landBrand, audience: landAudience, tone: landTone })
        setResult(r)
      } else {
        if (!nlTopic.trim()) { setError('Please enter a newsletter topic.'); setLoading(false); return }
        const r = await generateNewsletter({ topic: nlTopic, audience: nlAudience, brand: nlBrand, tone: nlTone, type: nlType })
        setResult(r)
      }
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentTab = TABS.find(t => t.key === tab)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '96px 20px 60px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${currentTab.color}18`, border: `1px solid ${currentTab.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab.color, transition: 'all 0.2s' }}>
            {currentTab.icon48}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{currentTab.fullName}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT2 }}>{currentTab.desc}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, margin: '28px 0 24px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 6 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setResult(null); setError('') }}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: tab === t.key ? CARD2 : 'transparent',
                color: tab === t.key ? t.color : TEXT3,
                fontWeight: tab === t.key ? 700 : 500, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s', fontFamily: 'inherit',
                boxShadow: tab === t.key ? `0 0 0 1px ${t.color}30` : 'none',
              }}
            >
              <span style={{ color: tab === t.key ? t.color : TEXT3 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '380px 1fr' : '1fr', gap: 20 }}>
          {/* Form */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>

            {tab === 'blog' && (
              <>
                <Field label="Blog Topic" required>
                  <input value={blogTopic} onChange={e => setBlogTopic(e.target.value)} placeholder="e.g. How AI is transforming digital marketing in 2025" style={inputStyle} />
                </Field>
                <Field label="Focus Keywords">
                  <input value={blogKeywords} onChange={e => setBlogKeywords(e.target.value)} placeholder="e.g. AI marketing, automation, ROI" style={inputStyle} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Brand Name">
                    <input value={blogBrand} onChange={e => setBlogBrand(e.target.value)} placeholder="EvoX AI" style={inputStyle} />
                  </Field>
                  <Field label="Industry">
                    <select value={blogIndustry} onChange={e => setBlogIndustry(e.target.value)} style={selectStyle}>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Target Audience">
                  <select value={blogAudience} onChange={e => setBlogAudience(e.target.value)} style={selectStyle}>
                    <option value="">Select target audience...</option>
                    {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Tone">
                    <select value={blogTone} onChange={e => setBlogTone(e.target.value)} style={selectStyle}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Article Length">
                    <select value={blogLength} onChange={e => setBlogLength(e.target.value)} style={selectStyle}>
                      {ARTICLE_LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            {tab === 'landing' && (
              <>
                <Field label="Product / Service" required>
                  <textarea value={landProduct} onChange={e => setLandProduct(e.target.value)} placeholder="Describe your product or service — what it does and who it's for" style={textareaStyle} />
                </Field>
                <Field label="Main Benefit / Headline Focus">
                  <input value={landFocus} onChange={e => setLandFocus(e.target.value)} placeholder="e.g. 10x faster campaign creation" style={inputStyle} />
                </Field>
                <Field label="CTA Goal">
                  <input value={landCtaGoal} onChange={e => setLandCtaGoal(e.target.value)} placeholder="e.g. get a free trial signup, book a demo" style={inputStyle} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Brand Name">
                    <input value={landBrand} onChange={e => setLandBrand(e.target.value)} placeholder="EvoX AI" style={inputStyle} />
                  </Field>
                  <Field label="Tone">
                    <select value={landTone} onChange={e => setLandTone(e.target.value)} style={selectStyle}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Target Audience">
                  <select value={landAudience} onChange={e => setLandAudience(e.target.value)} style={selectStyle}>
                    <option value="">Select target audience...</option>
                    {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </>
            )}

            {tab === 'newsletter' && (
              <>
                <Field label="Newsletter Topic" required>
                  <input value={nlTopic} onChange={e => setNlTopic(e.target.value)} placeholder="e.g. 5 AI marketing trends you can't ignore this quarter" style={inputStyle} />
                </Field>
                <Field label="Newsletter Type">
                  <select value={nlType} onChange={e => setNlType(e.target.value)} style={selectStyle}>
                    {NEWSLETTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Brand Name">
                    <input value={nlBrand} onChange={e => setNlBrand(e.target.value)} placeholder="EvoX AI" style={inputStyle} />
                  </Field>
                  <Field label="Tone">
                    <select value={nlTone} onChange={e => setNlTone(e.target.value)} style={selectStyle}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Audience">
                  <select value={nlAudience} onChange={e => setNlAudience(e.target.value)} style={selectStyle}>
                    <option value="">Select target audience...</option>
                    {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading} style={{
              width: '100%', marginTop: 20, padding: '13px',
              background: loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}cc)`,
              border: `1px solid ${currentTab.color}40`, borderRadius: 12,
              color: loading ? TEXT3 : '#fff', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating {currentTab.label}...</>
              ) : (
                <>{currentTab.icon} Generate {currentTab.label}</>
              )}
            </button>

            {result && !loading && (
              <button onClick={handleGenerate} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Regenerate
              </button>
            )}
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 14 }}>
                  Generated {currentTab.label}
                </div>
                {tab === 'blog'       && <BlogResult result={result} />}
                {tab === 'landing'    && <LandingResult result={result} />}
                {tab === 'newsletter' && <NewsletterResult result={result} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
