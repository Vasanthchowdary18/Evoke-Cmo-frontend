import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Star, Zap, TrendingUp, Target, BarChart2, Mail, Calendar, Search, Users, Megaphone, Rocket, Shield, Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils'

const BG   = '#0e0c09'
const CARD = '#1c1a13'
const GOLD = '#c8973e'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.60)'
const BORDER = 'rgba(200,151,62,0.22)'

const FEATURES = [
  { icon: <TrendingUp size={20} />, title: 'Growth Strategy', desc: 'Full GTM plan, revenue forecast & milestone roadmap — in seconds' },
  { icon: <Calendar size={20} />, title: 'Content Calendar', desc: '30-day multi-platform plan with daily posts, captions & hashtags' },
  { icon: <Mail size={20} />, title: 'Email Drip Campaign', desc: '5-email nurture sequence with subject lines and CTAs' },
  { icon: <Search size={20} />, title: 'SEO Blog Posts', desc: '1,500-word SEO-optimised blog with meta tags and internal links' },
  { icon: <Target size={20} />, title: 'Competitive Intel', desc: 'SWOT analysis, competitor profiles & positioning map' },
  { icon: <BarChart2 size={20} />, title: 'Analytics Reports', desc: 'Executive KPI summary with data-driven recommendations' },
  { icon: <Users size={20} />, title: 'Influencer & PR', desc: 'Campaign briefs, press releases & media pitch templates' },
  { icon: <Megaphone size={20} />, title: 'Paid Ads Manager', desc: 'Facebook & Google Ads campaigns built and deployed for you' },
]

const COMPARE = [
  { role: 'Marketing Manager',    cost: '$5,000–$7,000/mo' },
  { role: 'Content Writer',       cost: '$3,000–$4,000/mo' },
  { role: 'Social Media Manager', cost: '$2,500–$4,000/mo' },
  { role: 'SEO Specialist',       cost: '$2,000–$3,000/mo' },
  { role: 'Brand Strategist',     cost: '$3,000–$5,000/mo' },
]

const TESTIMONIALS = [
  { quote: 'Evoke CMO replaced our full marketing team. In minutes I had a complete campaign live on LinkedIn, Instagram, and Gmail — all AI-generated.', name: 'Sarah J.', role: 'Founder, TechStart India', initials: 'SJ', color: '#6b5c3e' },
  { quote: 'For $49/month I\'m getting what used to cost me $5,000+ in freelancers. The ROI is incredible. I run our entire brand marketing myself now.', name: 'Marcus T.', role: 'Product Manager, FinScale', initials: 'MT', color: '#2e5940' },
  { quote: 'The 12 CMO modules are insane. Growth strategy, email drips, SEO blogs — done in seconds. This is what a $15,000/month CMO used to do for us.', name: 'Priya K.', role: 'E-commerce Founder', initials: 'PK', color: '#2e4a5e' },
]

function CTAButton({ onClick, large }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: large ? '16px 40px' : '13px 30px',
        background: hover
          ? 'linear-gradient(135deg,#e0b860 0%,#c8973e 100%)'
          : 'linear-gradient(135deg,#d4a853 0%,#b8803a 100%)',
        color: '#0e0c09', border: 'none', borderRadius: 100,
        fontSize: large ? 17 : 15, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.2s', fontFamily: "'Inter',sans-serif",
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? '0 8px 30px rgba(200,151,62,0.35)' : '0 4px 16px rgba(200,151,62,0.20)',
      }}
    >
      Start Free — No Credit Card <ArrowRight size={large ? 18 : 16} />
    </button>
  )
}

export default function StartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  function handleCTA() {
    if (user) {
      navigate('/agents-hub')
    } else {
      redirectToLogin()
    }
  }

  const totalSaved = '$17,500+/mo'

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter',sans-serif", color: TEXT, overflowX: 'hidden' }}>

      {/* ── Announcement bar ── */}
      <div style={{ background: 'linear-gradient(90deg,#2a1f0a,#1c1508)', borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', textAlign: 'center', fontSize: 13, color: TEXT2 }}>
        <span style={{ color: GOLD, fontWeight: 600 }}>NEW</span>
        &nbsp;&nbsp;Google Ads & Meta Ads Manager now live inside EVOX CMO
        &nbsp;&nbsp;
        <span style={{ color: GOLD, cursor: 'pointer', textDecoration: 'underline' }} onClick={handleCTA}>Try it free →</span>
      </div>

      {/* ── Minimal header ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#d4a853,#b8803a)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#0e0c09' }}>E</div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>EVOX CMO</span>
        </div>
        <button
          onClick={handleCTA}
          style={{ background: 'transparent', color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '8px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
        >
          Sign In
        </button>
      </header>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 64px', maxWidth: 820, margin: '0 auto' }}>

        {/* Social proof badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,62,0.10)', border: `1px solid ${BORDER}`, borderRadius: 100, padding: '6px 16px', marginBottom: 32, fontSize: 13, color: GOLD }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill={GOLD} color={GOLD} />)}
          </div>
          Trusted by 500+ marketing teams worldwide
        </div>

        <h1 style={{ fontSize: 'clamp(36px,6vw,68px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', margin: '0 0 24px', color: TEXT }}>
          Your AI CMO That Runs<br />
          <span style={{ background: 'linear-gradient(135deg,#d4a853,#c8973e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Entire Marketing
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: TEXT2, lineHeight: 1.7, margin: '0 auto 40px', maxWidth: 620 }}>
          Replace a $17,500/month marketing team with one AI platform. Strategy, content, ads, SEO, email campaigns — all done in under 60 seconds.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <CTAButton onClick={handleCTA} large />
          <button
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 30px', background: 'transparent', color: TEXT2, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
          >
            See how it works
          </button>
        </div>

        {/* Trust signals */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: <Zap size={14} />, text: 'Campaign ready in <60 seconds' },
            { icon: <Shield size={14} />, text: 'No credit card required' },
            { icon: <Clock size={14} />, text: 'Start free, upgrade anytime' },
          ].map(t => (
            <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT2 }}>
              <span style={{ color: GOLD }}>{t.icon}</span>
              {t.text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(32px,6vw,80px)', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
          {[
            { v: '12+', l: 'AI Modules' },
            { v: '8',   l: 'Platforms Connected' },
            { v: '<60s', l: 'Campaign Ready' },
            { v: '$49', l: 'Per Month' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: GOLD, letterSpacing: '-1px' }}>{s.v}</div>
              <div style={{ fontSize: 12, color: TEXT2, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What you get ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>12 AI Marketing Modules</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Everything your marketing team does — at a fraction of the cost</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: CARD, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 12, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ color: GOLD, marginTop: 2, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cost comparison ── */}
      <section style={{ padding: '64px 24px', background: '#0b0a07' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>The real cost of a marketing team</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Stop paying agency prices</h2>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
            {COMPARE.map((c, i) => (
              <div key={c.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < COMPARE.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(200,151,62,0.10)', border: `1px solid ${BORDER}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: GOLD, fontSize: 10 }}>✕</span>
                  </div>
                  <span style={{ fontSize: 14, color: TEXT2 }}>{c.role}</span>
                </div>
                <span style={{ fontSize: 14, color: '#ef4444', fontWeight: 600 }}>{c.cost}</span>
              </div>
            ))}
            {/* Total vs Evoke */}
            <div style={{ padding: '20px 24px', background: 'rgba(200,151,62,0.06)', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Traditional team total</span>
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 15 }}>$17,500+/mo</span>
            </div>
          </div>

          {/* Evoke comparison */}
          <div style={{ marginTop: 16, background: 'linear-gradient(135deg,#2a1f0a,#1c1508)', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, color: TEXT2, marginBottom: 4 }}>EVOX CMO — all 12 modules</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>Start Free · From $49/mo</div>
            </div>
            <CTAButton onClick={handleCTA} />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>From zero to live campaign in 3 steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 24 }}>
          {[
            { n: '1', title: 'Answer 5 questions', desc: 'Tell EVOX about your business, goals, and target audience. Takes under 2 minutes.' },
            { n: '2', title: 'AI builds everything', desc: 'Strategy, content, ad copy, email sequences — generated instantly across all 12 modules.' },
            { n: '3', title: 'Deploy & grow', desc: 'Push campaigns to Meta, Google, LinkedIn, email — directly from your CMO dashboard.' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '32px 24px', background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#d4a853,#b8803a)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#0e0c09', margin: '0 auto 20px' }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '64px 24px', background: '#0b0a07' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>What customers say</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Real results, real businesses</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill={GOLD} color={GOLD} />)}
                </div>
                <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: t.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: TEXT, flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Simple pricing</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Start free. Scale when ready.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {[
            {
              label: 'Free', price: '$0', note: 'No credit card',
              features: ['Growth Strategy', 'Competitive Intel', 'Content Framework'],
              cta: 'Start Free', dark: false,
            },
            {
              label: 'Package A', price: 'Contact Us', note: 'Custom pricing',
              features: ['Everything in Free', 'Multi-angle product shots', 'Lifestyle images', 'Ad banners', 'Social media scheduling'],
              cta: 'Get a Quote', dark: false,
            },
            {
              label: 'Package B', price: 'Contact Us', note: 'Custom pricing', popular: true,
              features: ['Everything in A', 'Brand story video', '360° product video', '30-day content calendar'],
              cta: 'Get a Quote', dark: true,
            },
            {
              label: 'Package C', price: 'Contact Us', note: 'Custom pricing',
              features: ['Everything in B', '3D product renders', 'Ads creation', 'FB & Google Ads Manager', 'Full campaign launch'],
              cta: 'Get a Quote', dark: false,
            },
          ].map(p => (
            <div key={p.label} style={{ position: 'relative', background: p.popular ? 'linear-gradient(135deg,#2a1f0a,#1c1508)' : CARD, border: `1px solid ${p.popular ? BORDER : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '28px 24px' }}>
              {p.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#d4a853,#b8803a)', color: '#0e0c09', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{p.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{p.price}</div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 20 }}>{p.note}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: TEXT2 }}>
                    <Check size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCTA}
                style={{ width: '100%', padding: '12px', background: p.popular ? 'linear-gradient(135deg,#d4a853,#b8803a)' : 'transparent', color: p.popular ? '#0e0c09' : TEXT2, border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: '#0b0a07', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 16px' }}>
            Your AI marketing team<br />
            <span style={{ background: 'linear-gradient(135deg,#d4a853,#c8973e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>is ready right now</span>
          </h2>
          <p style={{ fontSize: 17, color: TEXT2, lineHeight: 1.7, margin: '0 auto 40px', maxWidth: 500 }}>
            Join 500+ businesses that replaced their marketing team with EVOX CMO. Start free today — no credit card, no commitment.
          </p>
          <CTAButton onClick={handleCTA} large />
          <p style={{ fontSize: 13, color: TEXT2, marginTop: 20 }}>Free forever · Upgrade anytime · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg,#d4a853,#b8803a)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0e0c09' }}>E</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT2 }}>EVOX CMO by Evoke Media</span>
        </div>
        <div style={{ fontSize: 13, color: TEXT2 }}>© 2025 Evoke Media. All rights reserved.</div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>View full site →</button>
      </footer>

    </div>
  )
}
