import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Zap, Megaphone, Users, Target,
  Activity, BarChart2, DollarSign, Code2, TrendingUp, Crown,
  Shield, CheckCircle2, FileText, Mail, Globe, Calendar,
  Lightbulb, Package, Rocket,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const AGENTS = {
  pr_reputation: {
    title: 'PR & Reputation Management',
    badge: 'PR',
    color: '#06b6d4',
    icon: <Megaphone size={28} />,
    tagline: 'Build authority, manage your narrative, and dominate media coverage.',
    description:
      'Your AI PR Director runs a full public-relations operation: crafting press releases, building 12-month editorial calendars, writing crisis playbooks, and pitching media contacts — all tailored to your brand and industry.',
    outputs: [
      { icon: <FileText size={15} />, label: 'Press Release',        desc: 'Announcement-ready draft with headline, quotes, and boilerplate.' },
      { icon: <Calendar size={15} />, label: '12-Month PR Calendar', desc: 'Monthly themes, media moments, and content cadence.' },
      { icon: <Megaphone size={15} />, label: 'Media Pitch Templates', desc: 'Personalised pitches for journalists and podcast hosts.' },
      { icon: <Shield size={15} />,   label: 'Crisis Playbook',       desc: 'Step-by-step response plan for reputation risks.' },
      { icon: <Globe size={15} />,    label: 'Review Templates',      desc: 'G2, Trustpilot, and Google review request sequences.' },
      { icon: <Mail size={15} />,     label: 'LinkedIn Announcement', desc: 'Polished post for news, milestones, and launches.' },
    ],
    inputs: ['Brand / company name', 'Industry & target market', 'Recent news or upcoming milestone', 'Target media outlets (optional)', 'Crisis scenario to prepare for (optional)'],
    useCases: ['New product launch PR', 'Reputation recovery after negative press', 'Thought leadership & executive positioning', 'Award submissions and media coverage'],
  },

  crm_lifecycle: {
    title: 'CRM & Customer Lifecycle',
    badge: 'CRM',
    color: '#10b981',
    icon: <Users size={28} />,
    tagline: 'Turn leads into loyal customers with AI-powered lifecycle automation.',
    description:
      'Your AI CRM Director designs the entire customer journey — from first touch to re-engagement. Get lead scoring models, onboarding sequences, win-back campaigns, and churn prevention frameworks built for your business model.',
    outputs: [
      { icon: <Target size={15} />,    label: 'Lead Scoring Model',        desc: 'Weighted criteria to prioritise high-value prospects.' },
      { icon: <Mail size={15} />,      label: 'Onboarding Email Sequence', desc: '5-email nurture flow for new customers.' },
      { icon: <Zap size={15} />,       label: 'Win-Back Campaign',         desc: 'Re-engagement strategy for dormant leads.' },
      { icon: <Shield size={15} />,    label: 'Churn Prevention Playbook', desc: 'Early warning signs and intervention actions.' },
      { icon: <FileText size={15} />,  label: 'NPS Survey Templates',      desc: 'Timed satisfaction surveys with follow-up logic.' },
      { icon: <BarChart2 size={15} />, label: 'Lifecycle Metrics Dashboard',desc: 'Key CRM KPIs and health indicators to track.' },
    ],
    inputs: ['Business type & model (B2B / B2C / SaaS)', 'Current CRM tool (HubSpot, Salesforce, etc.)', 'Customer lifecycle stages', 'Average churn rate or problem area'],
    useCases: ['SaaS onboarding improvement', 'E-commerce repeat purchase strategy', 'B2B lead nurturing pipeline', 'Customer success & retention'],
  },

  paid_advertising: {
    title: 'Paid Advertising Agent',
    badge: 'PAID ADS',
    color: '#f59e0b',
    icon: <Target size={28} />,
    tagline: 'Full-funnel paid media strategy across Meta, Google, TikTok & LinkedIn.',
    description:
      'Your AI Media Buyer creates platform-specific ad campaigns with audience targeting, creative direction, A/B test plans, and budget allocation — ready to hand straight to your ad manager.',
    outputs: [
      { icon: <Megaphone size={15} />, label: 'Ad Copy (All Platforms)',  desc: 'Headlines, primary text, and CTAs for Meta, Google & TikTok.' },
      { icon: <Users size={15} />,     label: 'Audience Targeting Plan',  desc: 'Custom, lookalike, and retargeting audience strategies.' },
      { icon: <Activity size={15} />,  label: 'A/B Test Plan',            desc: '3 creative variants to test with hypothesis and KPIs.' },
      { icon: <DollarSign size={15} />,label: 'Budget Allocation',        desc: 'Platform-by-platform spend breakdown with ROAS targets.' },
      { icon: <Calendar size={15} />,  label: 'Ad Campaign Calendar',     desc: 'Flight dates, creative refresh schedule, and seasonal peaks.' },
      { icon: <BarChart2 size={15} />, label: 'Performance Benchmarks',   desc: 'Expected CPC, CTR, CPL, and ROAS by platform.' },
    ],
    inputs: ['Product or service being advertised', 'Total monthly ad budget', 'Target platforms (Meta, Google, TikTok, LinkedIn)', 'Target audience & location', 'Campaign goal (leads, sales, awareness)'],
    useCases: ['E-commerce product launches', 'Lead generation for services', 'App installs and SaaS trials', 'Brand awareness campaigns'],
  },

  funnel_cro: {
    title: 'Funnel & CRO Agent',
    badge: 'CRO',
    color: '#ef4444',
    icon: <Activity size={28} />,
    tagline: 'Find where you\'re leaking revenue and fix it — fast.',
    description:
      'Your AI Conversion Rate Optimisation specialist audits your funnel, identifies drop-off points, and generates tested CTA copy, A/B variants, and landing page improvements that move the needle.',
    outputs: [
      { icon: <Activity size={15} />,  label: 'Funnel Audit Report',     desc: 'Stage-by-stage analysis of friction and drop-off.' },
      { icon: <Zap size={15} />,       label: 'A/B Test Variants',        desc: '3 headline and CTA alternatives with test hypothesis.' },
      { icon: <Target size={15} />,    label: 'CTA Optimisations',        desc: 'Copy rewrites and placement improvements.' },
      { icon: <FileText size={15} />,  label: 'Landing Page Copy',        desc: 'Above-the-fold, benefits, and social proof sections.' },
      { icon: <Zap size={15} />,       label: 'Conversion Quick Wins',    desc: '10 high-impact changes you can ship this week.' },
      { icon: <BarChart2 size={15} />, label: 'CRO Metrics Tracker',      desc: 'KPIs and benchmarks to measure improvement.' },
    ],
    inputs: ['Website or landing page URL', 'Current funnel stages (awareness → purchase)', 'Primary conversion goal', 'Main traffic source', 'Current conversion rate (if known)'],
    useCases: ['Landing page optimisation', 'Checkout funnel improvement', 'Lead form conversion', 'SaaS trial-to-paid conversion'],
  },

  analytics_report: {
    title: 'Analytics & Reporting',
    badge: 'ANALYTICS',
    color: '#f97316',
    icon: <BarChart2 size={28} />,
    tagline: 'Turn raw data into board-ready insights and clear next steps.',
    description:
      'Your AI Analytics Director builds a full performance report: KPI dashboard, ROAS by channel, executive summary, and actionable recommendations — formatted for stakeholder presentations.',
    outputs: [
      { icon: <BarChart2 size={15} />, label: 'KPI Dashboard',              desc: 'Core metrics with targets, actuals, and trend indicators.' },
      { icon: <DollarSign size={15} />,label: 'ROAS by Channel',            desc: 'Return on ad spend breakdown across all platforms.' },
      { icon: <FileText size={15} />,  label: 'Executive Summary',          desc: 'One-page board-ready overview of marketing performance.' },
      { icon: <TrendingUp size={15} />,label: 'Channel Performance Report', desc: 'Deep-dive on top and underperforming channels.' },
      { icon: <Lightbulb size={15} />, label: 'Strategic Recommendations',  desc: 'Prioritised actions for next quarter.' },
      { icon: <Calendar size={15} />,  label: 'Reporting Calendar',         desc: 'When and what to measure across the quarter.' },
    ],
    inputs: ['Business type & industry', 'Marketing platforms in use', 'Key metrics to report on', 'Reporting period (monthly, quarterly)', 'Business goals and targets'],
    useCases: ['Monthly marketing reviews', 'Board and investor reporting', 'Agency client reports', 'Campaign post-mortems'],
  },

  influencer: {
    title: 'Influencer & Partnership',
    badge: 'INFLUENCE',
    color: '#ec4899',
    icon: <Users size={28} />,
    tagline: 'Build an influencer programme that drives real reach and revenue.',
    description:
      'Your AI Influencer Manager identifies the right creator profiles, writes personalised outreach, builds content briefs, and creates partnership terms — so you land collaborations that convert.',
    outputs: [
      { icon: <Users size={15} />,     label: 'Influencer Brief Template', desc: 'Campaign goals, deliverables, creative guidelines, and dos/don\'ts.' },
      { icon: <Mail size={15} />,      label: 'Outreach Email Sequence',   desc: 'Cold and follow-up DMs tailored for creator inboxes.' },
      { icon: <Package size={15} />,   label: 'Media Kit Content',         desc: 'Stats, audience fit, and brand story for your pitch deck.' },
      { icon: <FileText size={15} />,  label: 'Partnership Terms',         desc: 'Rate negotiation framework and usage rights guidance.' },
      { icon: <Megaphone size={15} />, label: 'Content Brief',             desc: 'Post format, key messages, and mandatory disclosures.' },
      { icon: <BarChart2 size={15} />, label: 'Campaign Tracking Plan',    desc: 'UTM strategy and KPIs to measure influencer ROI.' },
    ],
    inputs: ['Brand name & product/service', 'Influencer type (nano, micro, macro)', 'Target platforms (Instagram, TikTok, YouTube)', 'Campaign goal (awareness, conversions, UGC)', 'Budget range (optional)'],
    useCases: ['Product launch seeding', 'Affiliate & ambassador programmes', 'Seasonal gifting campaigns', 'B2B partnership outreach'],
  },

  ai_cfo: {
    title: 'AI CFO',
    badge: 'AI CFO',
    color: '#22c55e',
    icon: <DollarSign size={28} />,
    tagline: 'Financial clarity, budget control, and ROI maximisation.',
    description:
      'Your AI Chief Financial Officer builds financial forecasts, allocates marketing budgets with ROI models, and translates your spend into board-ready dashboards — no spreadsheet expertise required.',
    outputs: [
      { icon: <BarChart2 size={15} />,  label: 'Revenue Forecast',            desc: '12-month projection with best/base/worst scenarios.' },
      { icon: <DollarSign size={15} />, label: 'Marketing Budget Allocation', desc: 'Channel-by-channel spend with expected returns.' },
      { icon: <Activity size={15} />,   label: 'Unit Economics Model',        desc: 'CAC, LTV, payback period, and gross margin analysis.' },
      { icon: <BarChart2 size={15} />,  label: 'Marketing ROI Dashboard',     desc: 'Visual KPIs linking spend to pipeline and revenue.' },
      { icon: <FileText size={15} />,   label: 'Investor-Ready Summary',      desc: 'Financial narrative for fundraising and board decks.' },
      { icon: <Lightbulb size={15} />,  label: 'Cost Reduction Opportunities',desc: 'Where to cut, optimise, and redeploy budget.' },
    ],
    inputs: ['Business type and stage (seed, growth, scale)', 'Current annual revenue or MRR', 'Monthly marketing spend', 'Primary growth goals', 'Investor or board context (optional)'],
    useCases: ['Fundraising financial prep', 'Annual budget planning', 'Marketing ROI justification', 'Unit economics deep-dive'],
  },

  ai_cto: {
    title: 'AI CTO',
    badge: 'AI CTO',
    color: '#6366f1',
    icon: <Code2 size={28} />,
    tagline: 'Build the tech stack and automation roadmap your marketing needs.',
    description:
      'Your AI Chief Technology Officer audits your marketing tech stack, designs AI integration plans, maps automation opportunities, and creates a data infrastructure blueprint — without the six-figure salary.',
    outputs: [
      { icon: <Activity size={15} />,  label: 'MarTech Stack Audit',       desc: 'Review of current tools with redundancy and gap analysis.' },
      { icon: <Zap size={15} />,       label: 'AI Integration Roadmap',    desc: 'Phased plan to add AI to your marketing operations.' },
      { icon: <Code2 size={15} />,     label: 'Automation Blueprint',      desc: 'Workflows to automate repetitive marketing tasks.' },
      { icon: <Globe size={15} />,     label: 'Data Infrastructure Plan',  desc: 'How to collect, store, and activate your customer data.' },
      { icon: <Shield size={15} />,    label: 'Tech Vendor Evaluation',    desc: 'Criteria to assess and shortlist new marketing tools.' },
      { icon: <Calendar size={15} />,  label: '90-Day Tech Sprint',        desc: 'Quick wins in tooling and integration for Q1.' },
    ],
    inputs: ['Current marketing tech stack', 'Team size and technical capability', 'Key operational bottlenecks', 'Budget for new tools', 'Top tech goals (AI, automation, data)'],
    useCases: ['Marketing ops overhaul', 'CRM & automation setup', 'Data & analytics stack design', 'AI adoption planning'],
  },

  ai_cro_exec: {
    title: 'AI CRO (Revenue)',
    badge: 'AI CRO',
    color: '#f97316',
    icon: <TrendingUp size={28} />,
    tagline: 'Unlock the next revenue tier with a full growth playbook.',
    description:
      'Your AI Chief Revenue Officer identifies your fastest path to revenue growth — designing partnership pipelines, upsell strategies, pricing experiments, and a 90-day client acquisition sprint.',
    outputs: [
      { icon: <TrendingUp size={15} />, label: 'Revenue Growth Strategy',      desc: 'Prioritised levers: pricing, expansion, new channels.' },
      { icon: <Users size={15} />,      label: 'Partnership Pipeline',          desc: 'Strategic partners to approach and co-sell with.' },
      { icon: <Zap size={15} />,        label: 'Upsell & Cross-sell Playbook', desc: 'Scripts and triggers to expand existing accounts.' },
      { icon: <Target size={15} />,     label: '90-Day Acquisition Sprint',    desc: 'Weekly targets and tactics to hit new revenue fast.' },
      { icon: <DollarSign size={15} />, label: 'Pricing Experiment Plan',      desc: 'A/B test ideas for pricing tiers and packaging.' },
      { icon: <FileText size={15} />,   label: 'Sales Enablement Kit',         desc: 'Objection handlers, case studies, and talk tracks.' },
    ],
    inputs: ['Current MRR or ARR', 'Target market and ICP (Ideal Customer Profile)', 'Current sales process', 'Key revenue blockers', 'Growth target for next 12 months'],
    useCases: ['Series A / B revenue scaling', 'Channel partnership strategy', 'Account expansion and upsell', 'Sales process redesign'],
  },

  ai_ceo: {
    title: 'AI CEO',
    badge: 'AI CEO',
    color: '#c8973e',
    icon: <Crown size={28} />,
    tagline: 'Company vision, strategic priorities, and board-ready leadership.',
    description:
      'Your AI Chief Executive Officer synthesises your market position, business model, and goals into a clear company vision, strategic roadmap, and executive communication — ready for investors, employees, and partners.',
    outputs: [
      { icon: <Lightbulb size={15} />, label: 'Company Vision Statement',      desc: 'Inspiring, memorable direction for the next 3–5 years.' },
      { icon: <Target size={15} />,    label: 'Strategic Priorities',           desc: 'Top 3–5 bets for the year with rationale.' },
      { icon: <Globe size={15} />,     label: 'Market Opportunity Analysis',    desc: 'TAM/SAM/SOM and competitive positioning.' },
      { icon: <FileText size={15} />,  label: 'Board-Ready Executive Summary', desc: 'One-pager covering strategy, progress, and asks.' },
      { icon: <Users size={15} />,     label: 'Team Communication Template',   desc: 'All-hands message that aligns and motivates the team.' },
      { icon: <Calendar size={15} />,  label: 'Annual Planning Framework',     desc: 'OKR structure and quarterly review cadence.' },
    ],
    inputs: ['Company stage (idea, early, growth, scale)', 'Industry and competitive landscape', 'Current biggest challenge', '12-month goals', 'Intended audience (investors, team, partners)'],
    useCases: ['Fundraising narrative and pitch deck', 'Annual strategic planning', 'All-hands and company communications', 'Competitive positioning'],
  },

  deploy_ads: {
    title: 'Deploy Ads',
    badge: 'PACKAGE C',
    color: '#ec4899',
    icon: <Rocket size={28} />,
    tagline: 'Launch, manage, and optimise your full ad campaigns — all from EVOX.',
    description:
      'Deploy Ads is your end-to-end campaign management hub. Once your creatives are ready from Ads Creation, Deploy Ads pushes them live across Facebook, Instagram, and Google — then continuously optimises spend, rotates creatives, runs A/B tests, and delivers weekly performance reports directly to your dashboard.',
    outputs: [
      { icon: <Zap size={15} />,        label: 'One-Click Campaign Launch',   desc: 'Push approved creatives live across all selected ad platforms.' },
      { icon: <Activity size={15} />,   label: 'A/B Testing Engine',          desc: 'Auto-rotate 3 creative variants and pause underperformers.' },
      { icon: <DollarSign size={15} />, label: 'Budget Pacing Control',       desc: 'Daily spend limits, bid adjustments, and ROAS guardrails.' },
      { icon: <BarChart2 size={15} />,  label: 'Performance Dashboard',       desc: 'Real-time CPC, CTR, CPL, ROAS, and conversion tracking.' },
      { icon: <Users size={15} />,      label: 'Retargeting Automation',      desc: 'Auto-build audiences from site visitors and engaged users.' },
      { icon: <Calendar size={15} />,   label: 'Weekly Report Delivery',      desc: 'AI-written performance digest with next-step recommendations.' },
    ],
    inputs: ['Approved ad creatives from Ads Creation', 'Facebook / Google Ads account connected', 'Total campaign budget', 'Target audience and campaign objective', 'Campaign flight dates'],
    useCases: ['Product launch campaigns', 'Lead generation at scale', 'Retargeting warm audiences', 'Black Friday / seasonal ad pushes'],
  },

  ai_compliance: {
    title: 'AI Compliance Officer',
    badge: 'COMPLIANCE',
    color: '#94a3b8',
    icon: <Shield size={28} />,
    tagline: 'Stay compliant with GDPR, CCPA, and AI content regulations.',
    description:
      'Your AI Compliance Officer audits your marketing for legal and regulatory risk — producing GDPR/CCPA checklists, advertising compliance reviews, AI content governance policies, and risk matrices to keep your brand protected.',
    outputs: [
      { icon: <Shield size={15} />,    label: 'GDPR / CCPA Audit Checklist',   desc: 'Data collection, consent, and storage compliance review.' },
      { icon: <Megaphone size={15} />, label: 'Advertising Compliance Review', desc: 'FTC, ASA, and platform policy checklist for your ads.' },
      { icon: <FileText size={15} />,  label: 'AI Content Governance Policy',  desc: 'Internal rules for using AI-generated marketing content.' },
      { icon: <Activity size={15} />,  label: 'Risk Assessment Matrix',        desc: 'Likelihood × impact grid for your top compliance risks.' },
      { icon: <Globe size={15} />,     label: 'Cookie & Privacy Policy Draft', desc: 'Website-ready privacy disclosure language.' },
      { icon: <Users size={15} />,     label: 'Employee Compliance Training',  desc: 'Key rules brief for marketing and sales teams.' },
    ],
    inputs: ['Business type and industry', 'Regions and countries you market to', 'Current data collection practices', 'Types of content produced (ads, AI, email)', 'Specific compliance concern (optional)'],
    useCases: ['Pre-launch compliance audit', 'GDPR/CCPA gap analysis', 'AI content policy creation', 'Advertising standards review'],
  },
}

export default function CmoAgentOverviewPage() {
  const { type } = useParams()
  const navigate = useNavigate()
  const agent = AGENTS[type]

  if (!agent) {
    navigate('/agents-hub')
    return null
  }

  const { title, badge, color, icon, tagline, description, outputs, inputs, useCases } = agent

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh', pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${color}0d 0%, transparent 70%)`,
        zIndex: 0,
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '108px 28px 80px', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/agents-hub')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 36,
            padding: '9px 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = TEXT }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = TEXT2 }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 48 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, flexShrink: 0,
              background: `${color}15`, border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color,
              boxShadow: `0 0 32px ${color}18`,
            }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
                padding: '4px 12px', background: `${color}12`, border: `1px solid ${color}30`,
                borderRadius: 100, fontSize: 11, fontWeight: 800, color, letterSpacing: '0.1em',
              }}>
                <Zap size={10} /> {badge}
              </div>
              <h1 style={{
                fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.025em',
                color: TEXT, marginBottom: 10, fontFamily: "'Syne','Inter',sans-serif", lineHeight: 1.15,
              }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color, fontWeight: 600, marginBottom: 10 }}>{tagline}</p>
              <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.75, maxWidth: 680 }}>{description}</p>
            </div>
          </div>

          {/* Launch CTA */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate(`/campaign/${type}`, { state: { from: window.location.pathname } })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 30px', background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              border: 'none', borderRadius: 13, color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 6px 28px ${color}35`,
            }}
          >
            <Zap size={16} /> Launch {title} <ArrowRight size={15} />
          </motion.button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

          {/* Outputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color,
              }}>
                <FileText size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: '-0.01em' }}>What you get</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {outputs.map((o, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${color}12`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                    marginTop: 1,
                  }}>
                    {o.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{o.label}</div>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{o.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Inputs needed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2,
                }}>
                  <Lightbulb size={14} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>What the agent needs from you</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {inputs.map((inp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={14} style={{ color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT2 }}>{inp}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Use cases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, background: `${color}12`, border: `1px solid ${color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}>
                  <Zap size={14} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Best used for</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {useCases.map((uc, i) => (
                  <span key={i} style={{
                    padding: '6px 14px', background: `${color}0e`, border: `1px solid ${color}28`,
                    borderRadius: 100, fontSize: 12, fontWeight: 600, color,
                  }}>
                    {uc}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Token info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{
                background: 'rgba(200,151,62,0.06)', border: '1px solid rgba(200,151,62,0.2)',
                borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(200,151,62,0.12)',
                border: '1px solid rgba(200,151,62,0.28)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#c8973e', flexShrink: 0,
              }}>
                <Zap size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, marginBottom: 3 }}>1 token per run</div>
                <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>
                  Each agent run consumes 1 campaign token and delivers the full output above.
                  <button
                    onClick={() => navigate('/purchase')}
                    style={{ background: 'none', border: 'none', color: '#c8973e', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 0 0 6px', fontFamily: 'inherit' }}
                  >
                    Top up tokens →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            marginTop: 40, padding: '28px 32px',
            background: `linear-gradient(135deg, ${color}0c, ${color}04)`,
            border: `1px solid ${color}30`, borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Ready to activate your {title}?
            </p>
            <p style={{ fontSize: 13, color: TEXT2 }}>
              Fill in a few details and your AI agent will generate the full output in under 30 seconds.
            </p>
          </div>
          <motion.button
            onClick={() => navigate(`/campaign/${type}`, { state: { from: window.location.pathname } })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              border: 'none', borderRadius: 12, color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: `0 6px 24px ${color}30`, fontFamily: 'inherit',
            }}
          >
            <Zap size={16} /> Launch Agent <ArrowRight size={15} />
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}
