import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap, Brain, Share2, Calendar, Search, BarChart2, Clock,
  ArrowRight, Check, Star, ChevronRight, Sparkles,
  Mail, MessageSquare, Linkedin, Target, FileText, TrendingUp,
  TrendingDown, Cpu, Users
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

function AnimatedSection({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

const features = [
  {
    icon: <Brain size={22} />,
    title: 'AI Content Generation',
    desc: 'GPT-powered copywriting for emails, social posts, SMS, and ad copy — all tailored to your brand voice.',
    color: '#7c3aed',
  },
  {
    icon: <Share2 size={22} />,
    title: 'Multi-Channel Distribution',
    desc: 'One campaign, every channel. Email, WhatsApp, LinkedIn, SMS — all generated simultaneously.',
    color: '#06b6d4',
  },
  {
    icon: <Calendar size={22} />,
    title: '7-Day Campaign Calendar',
    desc: 'A structured day-by-day execution plan so your team knows exactly what to do and when.',
    color: '#a855f7',
  },
  {
    icon: <Search size={22} />,
    title: 'SEO Optimization',
    desc: 'Meta titles, descriptions, and keyword-rich content that ranks. Built into every campaign automatically.',
    color: '#06b6d4',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Analytics Logging',
    desc: 'Enterprise campaigns auto-log to Google Sheets for tracking, reporting, and team collaboration.',
    color: '#7c3aed',
  },
  {
    icon: <Clock size={22} />,
    title: 'Real-time Results',
    desc: 'From form submission to complete campaign package in under 30 seconds. No waiting, no revisions.',
    color: '#a855f7',
  },
]

const agentCards = [
  {
    key: 'cmo',
    icon: <TrendingUp size={28} />,
    label: 'CMO Agent',
    role: 'Chief Marketing Officer',
    desc: 'Generate complete multi-channel marketing campaigns for Events, Products, and Brands — ready to deploy in seconds.',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.05))',
    border: 'rgba(124,58,237,0.3)',
    href: '/dashboard',
    active: true,
    tags: ['Events', 'Products', 'Brands'],
  },
  {
    key: 'cfo',
    icon: <TrendingDown size={28} />,
    label: 'CFO Agent',
    role: 'Chief Financial Officer',
    desc: 'AI-powered financial forecasting, budget planning, and ROI analysis for your marketing campaigns.',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.04))',
    border: 'rgba(6,182,212,0.25)',
    href: null,
    active: false,
    tags: ['Forecasting', 'Budgets', 'ROI'],
  },
  {
    key: 'ceo',
    icon: <Users size={28} />,
    label: 'CEO Agent',
    role: 'Chief Executive Officer',
    desc: 'Strategic business planning, market positioning, and executive-level insights powered by AI.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.04))',
    border: 'rgba(168,85,247,0.25)',
    href: null,
    active: false,
    tags: ['Strategy', 'Positioning', 'Growth'],
  },
  {
    key: 'cto',
    icon: <Cpu size={28} />,
    label: 'CTO Agent',
    role: 'Chief Technology Officer',
    desc: 'Technology roadmap planning, stack recommendations, and AI integration strategies for your business.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.04))',
    border: 'rgba(16,185,129,0.25)',
    href: null,
    active: false,
    tags: ['Roadmap', 'Stack', 'AI Integration'],
  },
]

const pricingTiers = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    description: 'Perfect for events and one-time campaigns',
    campaignType: 'Events',
    color: '#7c3aed',
    featured: false,
    features: [
      'Events campaign type',
      'Email subject + body',
      'WhatsApp message',
      '7-day campaign calendar',
      'SEO title + meta description',
      'Standard support',
    ],
  },
  {
    name: 'Growth',
    price: '₹1,999',
    period: '/month',
    description: 'For businesses launching new products',
    campaignType: 'Products',
    color: '#06b6d4',
    featured: true,
    features: [
      'Everything in Starter',
      'Products campaign type',
      'LinkedIn post',
      'SMS message',
      'Product positioning statement',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    price: '₹4,999',
    period: '/month',
    description: 'Full brand strategy and ad campaigns',
    campaignType: 'Brands',
    color: '#a855f7',
    featured: false,
    features: [
      'Everything in Growth',
      'Brand campaign type',
      'Full brand strategy',
      'Ad headline + body copy',
      'Google Sheet auto-logging',
      'Priority 24/7 support',
    ],
  },
]

const outputs = [
  { icon: <Mail size={16} />, label: 'Email' },
  { icon: <MessageSquare size={16} />, label: 'WhatsApp' },
  { icon: <Linkedin size={16} />, label: 'LinkedIn' },
  { icon: <MessageSquare size={16} />, label: 'SMS' },
  { icon: <Search size={16} />, label: 'SEO' },
  { icon: <Calendar size={16} />, label: '7-Day Plan' },
  { icon: <TrendingUp size={16} />, label: 'Ad Copy' },
  { icon: <Target size={16} />, label: 'Positioning' },
]

export default function Landing() {
  return (
    <div className="page-wrapper" style={{ background: '#0a0a0a' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '120px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div className="glow-orb glow-purple" style={{ width: 600, height: 600, top: -200, left: -200, opacity: 0.6 }} />
        <div className="glow-orb glow-cyan" style={{ width: 500, height: 500, bottom: -150, right: -150, opacity: 0.5 }} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 860 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge" style={{ margin: '0 auto 28px', display: 'inline-flex' }}>
              <Sparkles size={13} />
              AI-Powered Marketing Intelligence
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontSize: 'clamp(42px, 7vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '10px',
            }}
          >
            Evoke
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            style={{
              fontSize: 'clamp(42px, 7vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '10px',
            }}
            className="gradient-text"
          >
            Chief Marketing
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.26 }}
            style={{
              fontSize: 'clamp(42px, 7vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '28px',
            }}
          >
            Officer Agent
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            style={{
              fontSize: 'clamp(17px, 2.5vw, 21px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.65,
              maxWidth: 640,
              margin: '0 auto 44px',
            }}
          >
            Generate complete, multi-channel marketing campaigns in seconds.
            Events, products, brands — Evoke CMO handles the strategy so you can focus on execution.
          </motion.p>

          {/* Output tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '48px',
            }}
          >
            {outputs.map((o, i) => (
              <motion.div
                key={o.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '100px',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                <span style={{ color: i % 2 === 0 ? '#7c3aed' : '#06b6d4' }}>{o.icon}</span>
                {o.label}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/signin" className="btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ fontSize: '16px', padding: '14px 32px' }}>
              See How It Works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Trusted by 500+ marketing teams
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              10,000+ campaigns generated
            </span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section" style={{ position: 'relative' }}>
        <div className="glow-orb glow-purple" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.2 }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="badge" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>
              <Zap size={13} />
              What You Get
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '16px' }}>
              Everything a CMO Does,{' '}
              <span className="gradient-text">In Seconds</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', maxWidth: 540, margin: '0 auto' }}>
              Evoke CMO replaces weeks of marketing work with AI-generated campaigns that are ready to deploy instantly.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="glass-card"
                style={{
                  padding: '28px',
                  cursor: 'default',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `${f.color}20`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: f.color,
                  marginBottom: '18px',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI C-Suite Agents */}
      <section id="how-it-works" className="section" style={{
        background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.04) 50%, transparent)',
        position: 'relative',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="badge" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>
              <Sparkles size={13} />
              AI Executive Suite
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '16px' }}>
              Your AI{' '}
              <span className="gradient-text">C-Suite Agents</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', maxWidth: 520, margin: '0 auto' }}>
              Select an AI agent to run your executive-level business functions — powered by Evoke.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {agentCards.map((agent) => (
              <motion.div
                key={agent.key}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                style={{
                  background: agent.gradient,
                  border: `1px solid ${agent.border}`,
                  borderRadius: '20px',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: agent.active ? 'pointer' : 'default',
                  transition: 'all 0.25s ease',
                  opacity: agent.active ? 1 : 0.7,
                }}
                onClick={() => { if (agent.active && agent.href) window.location.href = agent.href }}
              >
                {!agent.active && (
                  <div style={{ position: 'absolute', top: 18, right: 18, padding: '3px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                    COMING SOON
                  </div>
                )}
                <div style={{ width: 60, height: 60, borderRadius: '16px', background: `${agent.color}18`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.color, marginBottom: '20px' }}>
                  {agent.icon}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: `${agent.color}18`, border: `1px solid ${agent.color}30`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: agent.color, letterSpacing: '0.06em', marginBottom: '14px' }}>
                  {agent.label}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>{agent.role}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.65, marginBottom: '20px' }}>{agent.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '24px' }}>
                  {agent.tags.map(tag => (
                    <div key={tag} style={{ padding: '4px 10px', background: `${agent.color}12`, border: `1px solid ${agent.color}25`, borderRadius: '100px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{tag}</div>
                  ))}
                </div>
                {agent.active ? (
                  <Link to={agent.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: `linear-gradient(135deg, ${agent.color}, ${agent.color}aa)`, border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }}>
                    Launch {agent.label} <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '15px', fontWeight: 600, boxSizing: 'border-box' }}>
                    Coming Soon
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section" style={{ position: 'relative' }}>
        <div className="glow-orb glow-cyan" style={{ width: 500, height: 500, top: '30%', right: -150, opacity: 0.15 }} />
        <div className="glow-orb glow-purple" style={{ width: 400, height: 400, bottom: '10%', left: -100, opacity: 0.15 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="badge" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>
              <Star size={13} />
              Transparent Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '16px' }}>
              Choose Your{' '}
              <span className="gradient-text">Growth Plan</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', maxWidth: 480, margin: '0 auto' }}>
              Start with events, scale to full brand campaigns. Every plan pays for itself with one good campaign.
            </p>
          </AnimatedSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}>
            {pricingTiers.map((tier, i) => (
              <AnimatedSection key={tier.name} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6 }}
                  style={{
                    background: tier.featured
                      ? `linear-gradient(145deg, rgba(6,182,212,0.1), rgba(124,58,237,0.1))`
                      : 'rgba(255,255,255,0.03)',
                    border: tier.featured
                      ? '1px solid rgba(6,182,212,0.35)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '32px',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {tier.featured && (
                    <div style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '5px 18px',
                      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.04em',
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    background: `${tier.color}18`,
                    border: `1px solid ${tier.color}30`,
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: tier.color,
                    marginBottom: '20px',
                    letterSpacing: '0.04em',
                  }}>
                    {tier.campaignType.toUpperCase()}
                  </div>

                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>{tier.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '24px' }}>
                    {tier.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                    <span style={{
                      fontSize: '42px',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      background: `linear-gradient(135deg, ${tier.color}, ${tier.color}aa)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {tier.price}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>{tier.period}</span>
                  </div>

                  <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tier.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: `${tier.color}20`,
                          border: `1px solid ${tier.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}>
                          <Check size={11} color={tier.color} strokeWidth={3} />
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/signin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '13px',
                      background: tier.featured
                        ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                        : 'transparent',
                      border: tier.featured
                        ? 'none'
                        : `1px solid ${tier.color}50`,
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!tier.featured) {
                        e.currentTarget.style.background = `${tier.color}18`
                        e.currentTarget.style.borderColor = tier.color
                      }
                    }}
                    onMouseLeave={e => {
                      if (!tier.featured) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = `${tier.color}50`
                      }
                    }}
                  >
                    Get Started <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection style={{ textAlign: 'center', marginTop: '48px' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
              All plans include a 7-day free trial. No credit card required to start.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="container">
          <AnimatedSection>
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.12) 50%, rgba(168,85,247,0.15) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '24px',
              padding: 'clamp(48px, 8vw, 80px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div className="glow-orb glow-purple" style={{ width: 400, height: 400, top: -200, left: -100, opacity: 0.4 }} />
              <div className="glow-orb glow-cyan" style={{ width: 300, height: 300, bottom: -150, right: -50, opacity: 0.3 }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="badge" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
                  <Sparkles size={13} />
                  Ready to Scale?
                </div>
                <h2 style={{
                  fontSize: 'clamp(28px, 5vw, 52px)',
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  marginBottom: '16px',
                }}>
                  Stop Guessing.{' '}
                  <span className="gradient-text">Start Evoking.</span>
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '18px',
                  maxWidth: 500,
                  margin: '0 auto 40px',
                  lineHeight: 1.65,
                }}>
                  Join hundreds of businesses that have replaced their entire marketing workflow with Evoke CMO.
                </p>
                <Link to="/signin" className="btn-primary" style={{ fontSize: '17px', padding: '15px 40px' }}>
                  Launch Your First Campaign <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 24px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Zap size={16} color="white" fill="white" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>EVOKE CMO</span>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center' }}>
              © 2025 Evoke CMO. All rights reserved. Your AI-Powered Chief Marketing Officer.
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
              {['Privacy', 'Terms', 'Contact'].map(link => (
                <a key={link} href="#" style={{
                  color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
