import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Check, Star, Zap, TrendingUp, Target, Calendar, Search, Mail, Users, BarChart2, Briefcase, Megaphone, ShoppingCart, Sparkles, Activity } from 'lucide-react'
// OnboardingModal moved to AgentsHub — not triggered on landing page
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { redirectToLogin } from '../lib/authUtils'

/* ─── animation ─── */
const fadeUp = { hidden:{opacity:0,y:24}, visible:{opacity:1,y:0,transition:{duration:0.55,ease:[0.22,1,0.36,1]}} }
const stagger = { visible:{ transition:{ staggerChildren:0.07 } } }
function FadeIn({children,delay=0,style={}}) {
  const ref = useRef(null)
  const inView = useInView(ref,{once:true,margin:'-60px'})
  return <motion.div ref={ref} initial="hidden" animate={inView?'visible':'hidden'} variants={fadeUp} transition={{delay}} style={style}>{children}</motion.div>
}

/* ─── PDF colours (exact) ─── */
const BG      = '#0e0c09'
const BG2     = '#0b0a07'
const CARD    = '#1c1a13'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.22)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

/* ─── shared button styles ─── */
const goldPill = {
  display:'inline-flex', alignItems:'center', gap:8,
  padding:'13px 30px',
  background:'linear-gradient(135deg, #d4a853 0%, #b8803a 100%)',
  color:'#0e0c09', border:'none', borderRadius:100,
  fontSize:15, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
  fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap',
}
const outlinePill = {
  display:'inline-flex', alignItems:'center', gap:8,
  padding:'13px 30px', background:'transparent', color:TEXT,
  border:`1px solid rgba(240,235,224,0.22)`, borderRadius:100,
  fontSize:15, fontWeight:500, cursor:'pointer', transition:'all 0.2s',
  textDecoration:'none', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap',
}

/* ─── data ─── */
const STATS = [
  { v:'12+',  l:'AI MODULES'     },
  { v:'8',    l:'PLATFORMS'      },
  { v:'<60s', l:'CAMPAIGN READY' },
  { v:'$49',  l:'PER MONTH'      },
]

/* Platform logos — PDF strip_02: 2 rows static grid */
const LOGO_ROW1 = [
  { label:'ramp',     symbol:'ramp ↗'    },
  { label:'HEX',      symbol:'HEX'       },
  { label:'Vercel',   symbol:'▲ Vercel'  },
  { label:'descript', symbol:'≡ descript'},
  { label:'Cash App', symbol:'$ Cash App'},
  { label:'SUPERCELL',symbol:'SUPERCELL' },
]
const LOGO_ROW2 = [
  { label:'Mercury',  symbol:'⊙ MERCURY' },
  { label:'Retool',   symbol:'≡ Retool'  },
  { label:'remote',   symbol:'R remote'  },
  { label:'ARC',      symbol:'⚡ ARC'    },
  { label:'Raycast',  symbol:'◎ Raycast' },
  { label:'runway',   symbol:'® runway'  },
]

/* Agent cards — PDF strip_03/04 */
const AGENTS = [
  { title:'Growth Strategy',     desc:'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.',            icon:<TrendingUp size={16}/>,  color:'#b87d3a' },
  { title:'Competitive Intel',   desc:'SWOT analysis, competitor profiles, pricing analysis, and positioning.',            icon:<Target size={16}/>,      color:'#b87d3a' },
  { title:'Content Calendar',    desc:'30-day multi-platform content plan with daily post ideas and hashtags.',             icon:<Calendar size={16}/>,    color:'#b87d3a' },
  { title:'SEO Blog Post',       desc:'Full 1,500-word SEO-optimised blog with meta, keywords, and internal links.',       icon:<Search size={16}/>,      color:'#b87d3a' },
  { title:'Email Drip Campaign', desc:'5-email nurture sequence with subject lines, preheaders, and CTAs.',                icon:<Mail size={16}/>,        color:'#b87d3a' },
  { title:'Influencer & PR Brief',desc:'Influencer campaign brief, press release, and media pitch templates.',             icon:<Users size={16}/>,       color:'#b87d3a' },
  { title:'Analytics Report',    desc:'Executive KPI summary, channel breakdown, and data-driven recommendations.',       icon:<BarChart2 size={16}/>,   color:'#b87d3a' },
  { title:'Sales Enablement',    desc:'Sales deck, elevator pitch, objection handling, and cold-call scripts.',            icon:<Briefcase size={16}/>,   color:'#b87d3a' },
  { title:'Event Marketing',     desc:'Full event campaign — promotion timeline, content plan, and post-event follow-up.', icon:<Megaphone size={16}/>,   color:'#b87d3a' },
  { title:'Marketplace Growth',  desc:'Vendor strategy, buyer acquisition plan, and promotional campaign roadmap.',        icon:<ShoppingCart size={16}/>,color:'#b87d3a' },
  { title:'Brand Strategy',      desc:'Brand identity, tone of voice, messaging framework, and content pillars.',          icon:<Sparkles size={16}/>,    color:'#b87d3a' },
  { title:'Funnel & CRO Audit',  desc:'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.',     icon:<Activity size={16}/>,    color:'#b87d3a' },
]

const PLANS = [
  {
    key: 'base', label: 'BASE', popular: false,
    tagline: 'For solo marketers – In-house, founders, or freelancers',
    monthly: 299, annual: 239,
    brands: '3 brands', seats: 'Personal workspace',
    credits: '1,000 credits/month',
    breakdown: ['~500 images', '~40 videos', '~200 blog posts, emails or ad copies'],
    perfectFor: ['In-house marketers at small & mid-size businesses', 'Founders and owners running their own marketing', 'Consultants and freelancers with a small client roster'],
    features: ['100+ marketing tools – Image Center, Video Studio, PPC & SEO, Blog Writer', 'Strategy Creator & Strategy Tracker', 'Marketing Pulse – performance dashboard with alerts', 'Brand voice training & memory across every output', 'Competitor Spy – track rival ads, pricing, positioning', 'Landing page + email campaign builders', 'Creative Analyzer – ad grading & feedback', 'Ad copy for Google, Meta, LinkedIn, TikTok', 'Email & chat support'],
    cta: 'Start creating', ctaDark: false,
  },
  {
    key: 'pro', label: 'PRO', popular: true,
    tagline: 'For teams ready to go autonomous',
    note: 'vs. a marketing manager at $7–10k/mo',
    monthly: 799, annual: 639,
    brands: '10 brands', seats: 'Up to 5 team members',
    credits: '5,000 credits/month',
    breakdown: ['~2,500 images', '~200 videos', '~1,000 blog posts, emails or ad copies'],
    perfectFor: ['Startup teams of 2–5 running growth', 'Agencies managing up to 10 client brands', 'Growing e-commerce and SaaS teams'],
    features: ['Everything in Base', 'Autonomous Mode – All agent runs campaigns end-to-end', 'Approval queue with brand guardrails', 'Customer segments & targeting', 'Premium AI models', 'Shared team library & templates', 'Multi brand voice management', 'Workflow automations', 'Priority support'],
    cta: 'Go autonomous', ctaDark: true,
  },
  {
    key: 'max', label: 'MAX', popular: false,
    tagline: 'For companies scaling to millions',
    note: 'vs. a marketing CMO at $15–30k/mo',
    monthly: 1499, annual: 1199,
    brands: '25 brands', seats: 'Up to 15 team members',
    credits: '10,000 credits/month',
    breakdown: ['~5,000 images', '~400 videos', '~2,000 blog posts, emails or ad copies'],
    perfectFor: ['Scale-up marketing departments', 'Mid-market brands running multi-channel', 'Agencies with multiple premium clients'],
    features: ['Everything in Pro', 'Data Warehouse (ClickHouse, setup included)', 'Customer Intelligence – AI powered segmentation', 'Bring your own API keys (BYOK)', 'Advanced reasoning models', 'Auto publish with confidence tiers', 'Dedicated success manager', 'Advanced analytics & attribution', 'Integration level customization'],
    cta: 'Scale marketing', ctaDark: false,
  },
  {
    key: 'enterprise', label: 'ENTERPRISE', popular: false,
    tagline: 'Your marketing team, amplified',
    note: 'Replaces a marketing department',
    monthly: null, annual: null,
    brands: 'Unlimited brands', seats: 'Unlimited members',
    credits: 'Custom allocation',
    breakdown: ['Negotiated volume', 'Dedicated infrastructure', 'SLAs & uptime commitments'],
    perfectFor: ['In-house marketing teams of 20+', 'Multi-brand holding companies', 'Regulated industries with compliance needs'],
    features: ['Everything in Max', 'SSO / SAML authentication', 'SOC 2 artifacts & security review', 'Named CSM + executive sponsor', '99.9% SLA with uptime credits', 'Custom integrations & white glove onboarding', 'Priority feature requests', 'Dedicated infrastructure options', 'MSA, DPA, and procurement support'],
    cta: 'Talk to sales', ctaDark: true,
  },
]

const COMPARE = [
  { role:'Marketing Manager',          cost:'$5,000 - $7,000 /mo' },
  { role:'Content Writer',             cost:'$3,000 - $4,000 /mo' },
  { role:'Social Media Manager',       cost:'$2,500 - $4,000 /mo' },
  { role:'Email Marketing Specialist', cost:'$2,000 - $3,500 /mo' },
  { role:'Brand Strategist',           cost:'$3,000 - $5,000 /mo' },
  { role:'SEO Specialist',             cost:'$2,000 - $3,000 /mo' },
  { role:'Analytics Manager',          cost:'$2,500 - $4,000 /mo' },
]

const EVOKE_FEATURES = [
  'Growth Strategy & GTM',
  'SEO Blog + Content Calendar',
  'Email Drip Campaigns',
  'Social Media (All Platforms)',
  'Brand Strategy + CRO',
  'Analytics Reports',
  'Event & Influencer Marketing',
]

const TESTIMONIALS = [
  { quote:'"Evoke CMO replaced our need for a full marketing team. In minutes I had a complete campaign live on LinkedIn, Instagram, and Gmail — all AI-generated and perfectly on-brand."', name:'Sarah J.', role:'Founder, TechStart India', initials:'SJ', bg:'#6b5c3e' },
  { quote:'"For $49/month I\'m getting what used to cost me $5,000+ in freelancers. The ROI is incredible. I run our entire brand marketing myself now using Evoke."',                      name:'Marcus T.', role:'Product Manager, FinScale', initials:'MT', bg:'#2e5940' },
  { quote:'"The 12 CMO modules are insane. Growth strategy, email drips, SEO blogs — all done in seconds. This is what a $15,000/month CMO used to do for us."',                         name:'Priya K.', role:'E-commerce Founder',         initials:'PK', bg:'#2e4a5e' },
]

const THE_SHIFT = [
  {
    number: '01',
    before: 'AI tools wait for your prompts — you do all the thinking.',
    after:  'Evoke CMO initiates campaigns independently. Give it a goal; it plans, writes, and deploys.',
  },
  {
    number: '02',
    before: 'Every tool forgets your brand the moment you close the tab.',
    after:  'Evoke CMO retains your brand voice, past results, and audience insights across every campaign.',
  },
  {
    number: '03',
    before: 'Tools hand you drafts. You still have to execute, schedule, and track everything manually.',
    after:  'Evoke CMO executes complete, multi-channel campaigns end-to-end — not just content, but strategy.',
  },
]

const AUTO_STEPS = [
  { day: 'Day 1–2',   task: 'Market research & positioning strategy',      done: true  },
  { day: 'Day 3',     task: 'Landing page copy + SEO structure',            done: true  },
  { day: 'Day 4–5',   task: 'Hero video script & ad creative brief',        done: true  },
  { day: 'Day 6–7',   task: 'Email drip sequence (5 emails)',                done: true  },
  { day: 'Day 8',     task: 'Social media content calendar (30 days)',       done: true  },
  { day: 'Day 9–10',  task: 'LinkedIn thought-leadership posts',             done: true  },
  { day: 'Day 11',    task: 'Paid ad launch — Google & Meta',               done: false },
  { day: 'Day 14',    task: 'Mid-campaign performance review',               done: false },
  { day: 'Day 16',    task: 'A/B test variants generated & deployed',        done: false },
  { day: 'Day 18–20', task: 'Influencer brief & PR pitch',                   done: false },
  { day: 'Day 22',    task: 'Retargeting campaign activated',                done: false },
  { day: 'Day 28',    task: 'Full analytics report + next-cycle brief',      done: false },
  { day: 'Day 30',    task: 'Autonomous handoff to Month 2 strategy',        done: false },
]

/* ═══════════════════════════════════════════════════════════ */

export default function Landing() {
  const { user } = useAuth()
  const [billingAnnual,  setBillingAnnual]  = useState(false)
  const navigate = useNavigate()

  const goSignIn = () => redirectToLogin()
  const goBoard = () => user ? navigate('/cmo') : goSignIn()

  /* Gold gradient text helper */
  const goldGrad = {
    background:'linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  }

  /* Section badge */
  const SBadge = ({children}) => (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',background:GDIM,border:`1px solid ${GBORDER}`,borderRadius:100,fontSize:11,fontWeight:700,color:GOLD,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:24}}>
      {children}
    </div>
  )

  return (
    <div style={{background:BG, minHeight:'100vh', color:TEXT, fontFamily:"'Inter',sans-serif", overflowX:'hidden'}}>
      <Navbar />

      {/* ══════════════════════════════════════════════════
          HERO  (strip_01)
      ══════════════════════════════════════════════════ */}
      <section className="hero-section" style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', textAlign:'center',
        padding:'120px 24px 80px', position:'relative', overflow:'hidden',
      }}>
        {/* centre-top golden glow */}
        <div style={{position:'absolute',top:-60,left:'50%',transform:'translateX(-50%)',width:'80vw',height:'55vh',pointerEvents:'none',background:'radial-gradient(ellipse at 50% 0%, rgba(200,151,62,0.08) 0%, transparent 65%)'}} />

        <div style={{position:'relative',zIndex:1,width:'100%',padding:'0 max(16px, 4vw)',maxWidth:1280,margin:'0 auto'}}>
          {/* badge */}
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(15,12,8,0.7)',border:`1px solid ${GBORDER}`,borderRadius:100,padding:'7px 18px',marginBottom:44,fontSize:13,color:GOLD,fontWeight:500}}>
            ✦ AI-Powered Marketing Platform
          </motion.div>

          {/* H1 — font scales with viewport so each line stays single-line */}
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.7}}>
            <h1 style={{
              fontSize:'clamp(18px, 3.2vw, 46px)',
              fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.14,
              marginBottom:6, fontFamily:"'Syne','Inter',sans-serif", color:TEXT,
            }}>
              Meet Evoke CMO,
            </h1>
            <h1 style={{
              fontSize:'clamp(18px, 3.2vw, 46px)',
              fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.14,
              marginBottom:32, fontFamily:"'Syne','Inter',sans-serif",
              ...goldGrad,
            }}>
              Your AI Chief Marketing Officer
            </h1>
          </motion.div>

          {/* subtext */}
          <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.22,duration:0.5}}
            style={{fontSize:'clamp(13px,1.1vw,16px)',color:TEXT2,lineHeight:1.7,maxWidth:520,margin:'0 auto 40px'}}>
            The only AI CMO you need for growth and marketing. Generate complete campaigns, post to every channel, and scale your brand — automatically.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.32,duration:0.5}}
            className="hero-btns" style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:36}}>
            <button onClick={goBoard} style={goldPill}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(200,151,62,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              {user?'Go to Dashboard':'Get Started Free'} <ArrowRight size={17}/>
            </button>
            <a href="#how-it-works" style={outlinePill}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(200,151,62,0.4)';e.currentTarget.style.color=GOLD}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(240,235,224,0.22)';e.currentTarget.style.color=TEXT}}>
              See All Features
            </a>
          </motion.div>

          {/* trust chips */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.45}}
            style={{display:'flex',gap:24,justifyContent:'center',flexWrap:'wrap'}}>
            {['Free to start','No credit card required','12 AI modules'].map(t=>(
              <span key={t} style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:TEXT3}}>
                <Check size={12} color={GOLD}/> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          AI C-SUITE AGENTS — directly below Hero
      ══════════════════════════════════════════════════ */}
      <section id="agents" style={{padding:'56px 40px',background:'#0a0908',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'60vw',height:'50vh',pointerEvents:'none',background:'radial-gradient(ellipse, rgba(200,151,62,0.05) 0%, transparent 70%)'}} />
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <FadeIn style={{textAlign:'center',marginBottom:60}}>
            <SBadge>AI Executive Suite</SBadge>
            <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT}}>
              Your AI <span style={goldGrad}>C-Suite Agents</span>
            </h2>
            <p style={{fontSize:14,color:TEXT2,maxWidth:480,margin:'12px auto 0',lineHeight:1.7}}>
              Select an AI agent to run your executive-level business functions. Click an active agent to launch its dashboard.
            </p>
          </FadeIn>

          <div className="csuite-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {[
              {
                key:'cmo', label:'CMO Agent', role:'Chief Marketing Officer',
                desc:'Generate complete multi-channel marketing campaigns for events, products, and brands — deployed in seconds.',
                icon:(<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>),
                color:GOLD, active:true, href:'/cmo', tags:['Campaigns','Content','Social'],
              },
              {
                key:'cfo', label:'CFO Agent', role:'Chief Financial Officer',
                desc:'AI-powered financial forecasting, budget planning, and ROI analysis for your marketing campaigns.',
                icon:(<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>),
                color:'rgba(200,151,62,0.4)', active:false, tags:['Forecasting','Budgets','ROI'],
              },
              {
                key:'cro', label:'CRO Agent', role:'Chief Revenue Officer',
                desc:'Revenue growth strategy, funnel optimisation, conversion rate improvements, and sales pipeline management.',
                icon:(<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
                color:'rgba(200,151,62,0.4)', active:false, tags:['Revenue','Funnels','Growth'],
              },
              {
                key:'cto', label:'CTO Agent', role:'Chief Technology Officer',
                desc:'Technology roadmap planning, stack recommendations, and AI integration strategies for your business.',
                icon:(<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>),
                color:'rgba(200,151,62,0.4)', active:false, tags:['Roadmap','Stack','AI'],
              },
            ].map((agent,i)=>(
              <FadeIn key={agent.key} delay={i*0.09}>
                <div
                  onClick={()=>agent.active&&(user?navigate(agent.href):goSignIn())}
                  style={{
                    background:agent.active?'linear-gradient(160deg,#221d10,#1c1a13)':'linear-gradient(160deg,#161410,#131210)',
                    border:`1px solid ${agent.active?'rgba(200,151,62,0.5)':'rgba(200,151,62,0.15)'}`,
                    borderRadius:20,padding:'28px 22px',cursor:agent.active?'pointer':'default',
                    position:'relative',opacity:agent.active?1:0.65,transition:'all 0.25s ease',
                    boxShadow:agent.active?'0 0 40px rgba(200,151,62,0.08)':'none',height:'100%',
                  }}
                  onMouseEnter={e=>{if(agent.active){e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(200,151,62,0.18)';e.currentTarget.style.borderColor='rgba(200,151,62,0.7)'}}}
                  onMouseLeave={e=>{if(agent.active){e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 0 40px rgba(200,151,62,0.08)';e.currentTarget.style.borderColor='rgba(200,151,62,0.5)'}}}
                >
                  {!agent.active&&(<div style={{position:'absolute',top:14,right:14,padding:'3px 10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,fontSize:9,fontWeight:700,color:'rgba(240,235,224,0.35)',letterSpacing:'0.08em'}}>COMING SOON</div>)}
                  <div style={{width:52,height:52,borderRadius:14,background:agent.active?GDIM:'rgba(200,151,62,0.05)',border:`1px solid ${agent.active?GBORDER:'rgba(200,151,62,0.12)'}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18,boxShadow:agent.active?'0 0 16px rgba(200,151,62,0.1)':'none'}}>{agent.icon}</div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',background:agent.active?GDIM:'rgba(200,151,62,0.05)',border:`1px solid ${agent.active?GBORDER:'rgba(200,151,62,0.12)'}`,borderRadius:100,fontSize:10,fontWeight:700,color:agent.active?GOLD:'rgba(200,151,62,0.4)',letterSpacing:'0.07em',marginBottom:10}}>{agent.label}</div>
                  <h3 style={{fontSize:15,fontWeight:800,color:agent.active?TEXT:'rgba(240,235,224,0.45)',marginBottom:8,letterSpacing:'-0.02em',fontFamily:"'Syne','Inter',sans-serif",lineHeight:1.25}}>{agent.role}</h3>
                  <p style={{fontSize:12,color:TEXT2,lineHeight:1.65,marginBottom:16,opacity:agent.active?1:0.6}}>{agent.desc}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
                    {agent.tags.map(tag=>(<span key={tag} style={{padding:'3px 9px',background:agent.active?'rgba(200,151,62,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${agent.active?'rgba(200,151,62,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:100,fontSize:10,color:agent.active?'rgba(240,235,224,0.6)':'rgba(240,235,224,0.25)',fontWeight:500}}>{tag}</span>))}
                  </div>
                  {agent.active?(
                    <button onClick={e=>{e.stopPropagation();user?navigate(agent.href):goSignIn()}} style={{width:'100%',padding:'11px',background:'linear-gradient(135deg,#d4a853,#b8803a)',border:'none',borderRadius:10,color:'#0e0c09',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'Inter',sans-serif",transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(200,151,62,0.4)'}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'}}>
                      Launch CMO Agent
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  ):(
                    <div style={{width:'100%',padding:'11px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'rgba(240,235,224,0.25)',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',boxSizing:'border-box'}}>Coming Soon</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          12 AI AGENTS  (strip_02 bottom, strip_03, strip_04 top)
      ══════════════════════════════════════════════════ */}
      <section id="features" style={{padding:'56px 40px',background:'#0a0908'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center',marginBottom:60}}>
            <SBadge>12 AI Agents</SBadge>
            <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,color:TEXT,fontFamily:"'Syne','Inter',sans-serif"}}>
              Everything you need to market<br/>
              like a <span style={goldGrad}>Fortune 500 CMO</span>
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:500,margin:'14px auto 0',lineHeight:1.65}}>
              12 specialised AI marketing agents. Each one generates complete, professional output in under 60 seconds.
            </p>
          </FadeIn>

          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} variants={stagger}
            className="agents-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {AGENTS.map(a=>(
              <motion.div key={a.title} variants={fadeUp}
                style={{background:CARD,border:`1px solid ${GBORDER}`,borderRadius:16,padding:'26px 24px',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(200,151,62,0.45)';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=GBORDER;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                <div style={{width:36,height:36,borderRadius:9,background:GDIM,border:`1px solid ${GBORDER}`,display:'flex',alignItems:'center',justifyContent:'center',color:GOLD,marginBottom:16}}>
                  {a.icon}
                </div>
                <h3 style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:8,letterSpacing:'-0.01em'}}>{a.title}</h3>
                <p style={{fontSize:13,color:TEXT2,lineHeight:1.65}}>{a.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          THE SHIFT
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'56px 40px',background:'#0a0908',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',right:-100,width:400,height:400,borderRadius:'50%',background:'radial-gradient(ellipse, rgba(200,151,62,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:820,margin:'0 auto',position:'relative',zIndex:1}}>
          <FadeIn style={{textAlign:'center',marginBottom:60}}>
            <SBadge>Why Evoke CMO Is Different</SBadge>
            <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT}}>
              This isn&apos;t another AI tool.<br/><span style={goldGrad}>This is the shift.</span>
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:500,margin:'14px auto 0',lineHeight:1.65}}>
              Three fundamental differences between using AI tools and having an autonomous AI CMO.
            </p>
          </FadeIn>

          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} variants={stagger} style={{display:'flex',flexDirection:'column',gap:16}}>
            {THE_SHIFT.map(item=>(
              <motion.div key={item.number} variants={fadeUp}
                style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr',gap:28,alignItems:'center',background:'linear-gradient(145deg,#1a1710,#141210)',border:`1px solid rgba(200,151,62,0.18)`,borderRadius:20,padding:'28px 32px',transition:'all 0.25s ease'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(200,151,62,0.4)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(200,151,62,0.18)';e.currentTarget.style.boxShadow='none'}}>
                <div style={{fontSize:48,fontWeight:900,color:GOLD,opacity:0.2,letterSpacing:'-0.04em',lineHeight:1,userSelect:'none',fontFamily:"'Syne','Inter',sans-serif"}}>{item.number}</div>
                <div style={{borderRight:`1px solid rgba(200,151,62,0.1)`,paddingRight:28}}>
                  <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'0.08em',marginBottom:10}}>BEFORE</div>
                  <p style={{fontSize:14,color:TEXT2,lineHeight:1.65,margin:0}}>{item.before}</p>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:'0.08em',marginBottom:10}}>WITH EVOKE CMO</div>
                  <p style={{fontSize:14,color:TEXT,lineHeight:1.65,margin:0}}>{item.after}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS BAR  (strip_01 bottom / strip_02 top)
      ══════════════════════════════════════════════════ */}
      <div style={{background:'#141210',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,padding:'48px 24px'}}>
        <div className="stats-grid" style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24,textAlign:'center'}}>
          {STATS.map((s,i)=>(
            <FadeIn key={s.l} delay={i*0.07}>
              <div style={{fontSize:'clamp(22px,2.4vw,32px)',fontWeight:800,letterSpacing:'-0.03em',color:TEXT,marginBottom:8,fontFamily:"'Syne','Inter',sans-serif"}}>{s.v}</div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:TEXT3}}>{s.l}</div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PLATFORM LOGOS — static 2-row grid  (strip_02)
      ══════════════════════════════════════════════════ */}
      <div style={{padding:'72px 40px',background:BG}}>
        <FadeIn>
          <p style={{textAlign:'center',fontSize:11,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:TEXT3,marginBottom:40}}>
            POSTS DIRECTLY TO ALL YOUR CHANNELS
          </p>
        </FadeIn>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          {[LOGO_ROW1, LOGO_ROW2].map((row,ri)=>(
            <FadeIn key={ri} delay={ri*0.1}>
              <div className="logo-grid-row" style={{display:'flex',justifyContent:'center',gap:0,marginBottom:ri===0?0:0}}>
                {row.map((logo,li)=>(
                  <div key={logo.label} style={{
                    flex:1, textAlign:'center',
                    padding:'18px 12px',
                    fontSize:'clamp(11px,1.2vw,15px)',
                    fontWeight:600, color:'rgba(240,235,224,0.45)',
                    letterSpacing:'0.02em',
                    fontFamily:"'Inter',sans-serif",
                    borderRight: li < row.length-1 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                    borderBottom: ri===0 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                  }}>
                    {logo.symbol}
                  </div>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BLUE/PURPLE GLOW ORB  (strip_02 bottom)
      ══════════════════════════════════════════════════ */}
      <div style={{position:'relative',height:200,overflow:'hidden',background:BG}}>
        <div style={{position:'absolute',bottom:-80,left:'50%',transform:'translateX(-50%)',width:700,height:280,borderRadius:'50%',background:'radial-gradient(ellipse, rgba(80,60,200,0.22) 0%, rgba(60,40,160,0.12) 40%, transparent 70%)',filter:'blur(20px)'}} />
        <div style={{position:'absolute',bottom:-60,left:'50%',transform:'translateX(-50%)',width:500,height:200,borderRadius:'50%',background:'radial-gradient(ellipse, rgba(100,80,220,0.18) 0%, transparent 70%)',filter:'blur(8px)'}} />
      </div>

      {/* ══════════════════════════════════════════════════
          AI C-SUITE AGENTS (moved — rendered after Hero)
      ══════════════════════════════════════════════════ */}
      <section id="agents" style={{padding:'96px 40px',background:'#0a0908',position:'relative',overflow:'hidden',display:'none'}}>
        {/* glow */}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'60vw',height:'50vh',pointerEvents:'none',background:'radial-gradient(ellipse, rgba(200,151,62,0.05) 0%, transparent 70%)'}} />

        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <FadeIn style={{textAlign:'center',marginBottom:60}}>
            <SBadge>AI Executive Suite</SBadge>
            <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT}}>
              Your AI <span style={goldGrad}>C-Suite Agents</span>
            </h2>
            <p style={{fontSize:14,color:TEXT2,maxWidth:480,margin:'12px auto 0',lineHeight:1.7}}>
              Select an AI agent to run your executive-level business functions. Click an active agent to launch its dashboard.
            </p>
          </FadeIn>

          <div className="csuite-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {[
              {
                key:'cmo',
                label:'CMO Agent',
                role:'Chief Marketing Officer',
                desc:'Generate complete multi-channel marketing campaigns for events, products, and brands — deployed in seconds.',
                icon:(
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                ),
                color: GOLD,
                active: true,
                href: '/dashboard',
                tags:['Campaigns','Content','Social'],
              },
              {
                key:'cfo',
                label:'CFO Agent',
                role:'Chief Financial Officer',
                desc:'AI-powered financial forecasting, budget planning, and ROI analysis for your marketing campaigns.',
                icon:(
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                ),
                color:'rgba(200,151,62,0.4)',
                active: false,
                tags:['Forecasting','Budgets','ROI'],
              },
              {
                key:'cro',
                label:'CRO Agent',
                role:'Chief Revenue Officer',
                desc:'Revenue growth strategy, funnel optimisation, conversion rate improvements, and sales pipeline management.',
                icon:(
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                ),
                color:'rgba(200,151,62,0.4)',
                active: false,
                tags:['Revenue','Funnels','Growth'],
              },
              {
                key:'cto',
                label:'CTO Agent',
                role:'Chief Technology Officer',
                desc:'Technology roadmap planning, stack recommendations, and AI integration strategies for your business.',
                icon:(
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,151,62,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                ),
                color:'rgba(200,151,62,0.4)',
                active: false,
                tags:['Roadmap','Stack','AI'],
              },
            ].map((agent,i)=>(
              <FadeIn key={agent.key} delay={i*0.09}>
                <div
                  onClick={() => agent.active && (user ? navigate(agent.href) : goSignIn())}
                  style={{
                    background: agent.active
                      ? 'linear-gradient(160deg,#221d10,#1c1a13)'
                      : 'linear-gradient(160deg,#161410,#131210)',
                    border:`1px solid ${agent.active ? 'rgba(200,151,62,0.5)' : 'rgba(200,151,62,0.15)'}`,
                    borderRadius:20,
                    padding:'28px 22px',
                    cursor: agent.active ? 'pointer' : 'default',
                    position:'relative',
                    opacity: agent.active ? 1 : 0.65,
                    transition:'all 0.25s ease',
                    boxShadow: agent.active ? '0 0 40px rgba(200,151,62,0.08)' : 'none',
                    height:'100%',
                  }}
                  onMouseEnter={e=>{
                    if(agent.active){
                      e.currentTarget.style.transform='translateY(-5px)'
                      e.currentTarget.style.boxShadow='0 16px 48px rgba(200,151,62,0.18)'
                      e.currentTarget.style.borderColor='rgba(200,151,62,0.7)'
                    }
                  }}
                  onMouseLeave={e=>{
                    if(agent.active){
                      e.currentTarget.style.transform='translateY(0)'
                      e.currentTarget.style.boxShadow='0 0 40px rgba(200,151,62,0.08)'
                      e.currentTarget.style.borderColor='rgba(200,151,62,0.5)'
                    }
                  }}
                >
                  {/* Coming soon badge */}
                  {!agent.active && (
                    <div style={{
                      position:'absolute',top:14,right:14,
                      padding:'3px 10px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:100,fontSize:9,fontWeight:700,
                      color:'rgba(240,235,224,0.35)',letterSpacing:'0.08em',
                    }}>
                      COMING SOON
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{
                    width:52,height:52,borderRadius:14,
                    background: agent.active ? GDIM : 'rgba(200,151,62,0.05)',
                    border:`1px solid ${agent.active ? GBORDER : 'rgba(200,151,62,0.12)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    marginBottom:18,
                    boxShadow: agent.active ? '0 0 16px rgba(200,151,62,0.1)' : 'none',
                  }}>
                    {agent.icon}
                  </div>

                  {/* Label pill */}
                  <div style={{
                    display:'inline-flex',alignItems:'center',gap:5,
                    padding:'3px 10px',
                    background: agent.active ? GDIM : 'rgba(200,151,62,0.05)',
                    border:`1px solid ${agent.active ? GBORDER : 'rgba(200,151,62,0.12)'}`,
                    borderRadius:100,fontSize:10,fontWeight:700,
                    color: agent.active ? GOLD : 'rgba(200,151,62,0.4)',
                    letterSpacing:'0.07em',marginBottom:10,
                  }}>
                    {agent.label}
                  </div>

                  <h3 style={{fontSize:15,fontWeight:800,color:agent.active?TEXT:'rgba(240,235,224,0.45)',marginBottom:8,letterSpacing:'-0.02em',fontFamily:"'Syne','Inter',sans-serif",lineHeight:1.25}}>
                    {agent.role}
                  </h3>
                  <p style={{fontSize:12,color:TEXT2,lineHeight:1.65,marginBottom:16,opacity:agent.active?1:0.6}}>
                    {agent.desc}
                  </p>

                  {/* Tags */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
                    {agent.tags.map(tag=>(
                      <span key={tag} style={{
                        padding:'3px 9px',
                        background: agent.active ? 'rgba(200,151,62,0.08)' : 'rgba(255,255,255,0.03)',
                        border:`1px solid ${agent.active ? 'rgba(200,151,62,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius:100,fontSize:10,
                        color: agent.active ? 'rgba(240,235,224,0.6)' : 'rgba(240,235,224,0.25)',
                        fontWeight:500,
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Launch / Coming Soon button */}
                  {agent.active ? (
                    <button
                      onClick={e=>{e.stopPropagation(); user ? navigate(agent.href) : goSignIn()}}
                      style={{
                        width:'100%',padding:'11px',
                        background:'linear-gradient(135deg,#d4a853,#b8803a)',
                        border:'none',borderRadius:10,
                        color:'#0e0c09',fontSize:13,fontWeight:700,
                        cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                        fontFamily:"'Inter',sans-serif",
                        transition:'all 0.2s',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(200,151,62,0.4)'}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'}}
                    >
                      Launch CMO Agent
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  ) : (
                    <div style={{
                      width:'100%',padding:'11px',
                      background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:10,color:'rgba(240,235,224,0.25)',
                      fontSize:13,fontWeight:600,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxSizing:'border-box',
                    }}>
                      Coming Soon
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS  (strip_04, strip_05)
      ══════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{padding:'100px 40px 112px',background:BG,position:'relative',overflow:'hidden'}}>
        {/* soft gold glow behind heading */}
        <div style={{position:'absolute',top:'0',left:'50%',transform:'translateX(-50%)',width:'60vw',height:'40vh',pointerEvents:'none',background:'radial-gradient(ellipse at 50% 0%, rgba(200,151,62,0.06) 0%, transparent 70%)'}} />

        <div style={{maxWidth:1140,margin:'0 auto',position:'relative',zIndex:1}}>
          {/* Badge + Heading */}
          <FadeIn style={{textAlign:'center',marginBottom:72}}>
            <SBadge>Simple 3-Step Process</SBadge>
            <h2 style={{
              fontSize:'clamp(18px,2.6vw,38px)',
              fontWeight:800,
              letterSpacing:'-0.03em',
              lineHeight:1.2,
              fontFamily:"'Syne','Inter',sans-serif",
              color:TEXT,
              marginBottom:0,
            }}>
              From idea to live campaign
            </h2>
            <h2 style={{
              fontSize:'clamp(18px,2.6vw,38px)',
              fontWeight:800,
              letterSpacing:'-0.03em',
              lineHeight:1.25,
              fontFamily:"'Syne','Inter',sans-serif",
              ...goldGrad,
            }}>
              in under 60 seconds
            </h2>
          </FadeIn>

          {/* 3 step cards */}
          <div className="steps-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,alignItems:'center'}}>
            {[
              {
                n:'01',
                title:'Connect Your Accounts',
                desc:'Link Facebook, Instagram, LinkedIn, TikTok, Gmail, and more in one click using OAuth. Your tokens are encrypted and stored securely.',
                featured:false,
              },
              {
                n:'02',
                title:'Describe Your Campaign',
                desc:'Fill a simple form — name, goal, audience, date — and pick which platforms you want to post to. Takes under 30 seconds.',
                featured:true,
              },
              {
                n:'03',
                title:'AI Generates & Posts',
                desc:"Evoke CMO generates professional content for every platform and publishes it live — images included. You're done.",
                featured:false,
              },
            ].map((s,i)=>(
              <FadeIn key={s.n} delay={i*0.1}>
                <div style={{
                  background: s.featured
                    ? 'linear-gradient(160deg, #26200f 0%, #1c1a10 50%, #161410 100%)'
                    : 'linear-gradient(160deg, #1c1a13 0%, #161410 100%)',
                  border:`1px solid ${s.featured ? 'rgba(200,151,62,0.55)' : 'rgba(200,151,62,0.2)'}`,
                  borderRadius:22,
                  padding: s.featured ? '48px 32px' : '40px 28px',
                  textAlign:'center',
                  position:'relative',
                  boxShadow: s.featured
                    ? '0 0 60px rgba(200,151,62,0.12), 0 24px 48px rgba(0,0,0,0.5)'
                    : '0 8px 32px rgba(0,0,0,0.35)',
                  transform: s.featured ? 'translateY(-16px)' : 'translateY(0)',
                  transition:'all 0.3s ease',
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform=s.featured?'translateY(-20px)':'translateY(-6px)';e.currentTarget.style.boxShadow=s.featured?'0 0 80px rgba(200,151,62,0.2), 0 32px 64px rgba(0,0,0,0.6)':'0 16px 48px rgba(0,0,0,0.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform=s.featured?'translateY(-16px)':'translateY(0)';e.currentTarget.style.boxShadow=s.featured?'0 0 60px rgba(200,151,62,0.12), 0 24px 48px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.35)'}}
                >
                  {/* Gold top line on featured */}
                  {s.featured && (
                    <div style={{position:'absolute',top:0,left:'20%',right:'20%',height:2,background:'linear-gradient(90deg,transparent,rgba(200,151,62,0.7),transparent)',borderRadius:2}} />
                  )}

                  {/* Number circle */}
                  <div style={{
                    width:60, height:60, borderRadius:'50%',
                    border:`1.5px solid ${s.featured ? 'rgba(200,151,62,0.6)' : 'rgba(200,151,62,0.25)'}`,
                    background: s.featured
                      ? 'radial-gradient(circle, rgba(200,151,62,0.18) 0%, rgba(200,151,62,0.06) 100%)'
                      : 'rgba(200,151,62,0.05)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 28px',
                    fontSize:18, fontWeight:800,
                    color: s.featured ? GOLD : 'rgba(240,235,224,0.4)',
                    fontFamily:"'Syne','Inter',sans-serif",
                    letterSpacing:'0.02em',
                    boxShadow: s.featured ? '0 0 20px rgba(200,151,62,0.15)' : 'none',
                  }}>
                    {s.n}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: s.featured ? 17 : 15,
                    fontWeight:700,
                    color:TEXT,
                    marginBottom:12,
                    letterSpacing:'-0.02em',
                    fontFamily:"'Syne','Inter',sans-serif",
                    lineHeight:1.3,
                  }}>
                    {s.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize:14,
                    color:'rgba(240,235,224,0.5)',
                    lineHeight:1.75,
                    margin:0,
                  }}>
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          AUTONOMOUS MODE
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'96px 40px',background:'#0a0908',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'60vw',height:'50vh',pointerEvents:'none',background:'radial-gradient(ellipse, rgba(200,151,62,0.04) 0%, transparent 70%)'}}/>
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <div className="auto-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>

            {/* Left: copy */}
            <FadeIn>
              <SBadge>Autonomous Mode</SBadge>
              <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT,marginBottom:20}}>
                A 30-day campaign plan.<br/><span style={goldGrad}>Executed without you.</span>
              </h2>
              <p style={{fontSize:15,color:TEXT2,lineHeight:1.7,marginBottom:32}}>
                Evoke CMO doesn&apos;t just generate content — it runs entire campaigns. Strategy, writing, scheduling, publishing, and reporting. All autonomous, all on brand.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  'Initiates work without waiting for prompts',
                  'Maintains brand voice across every asset',
                  'Publishes across channels automatically',
                  'Adapts based on live performance data',
                ].map((point,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:GDIM,border:`1px solid ${GBORDER}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Check size={10} color={GOLD} strokeWidth={3}/>
                    </div>
                    <span style={{fontSize:14,color:TEXT2,lineHeight:1.5}}>{point}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Right: checklist */}
            <FadeIn delay={0.15}>
              <div style={{background:'linear-gradient(145deg,#1a1710,#141210)',border:`1px solid rgba(200,151,62,0.22)`,borderRadius:20,padding:28}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'0.08em',marginBottom:20}}>30-DAY LAUNCH PLAN — AUTO-EXECUTING</div>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  {AUTO_STEPS.map((step,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'9px 10px',borderRadius:10,background:step.done?'rgba(200,151,62,0.05)':'transparent'}}>
                      <div style={{width:18,height:18,borderRadius:'50%',background:step.done?GDIM:'rgba(255,255,255,0.04)',border:`1px solid ${step.done?GBORDER:'rgba(255,255,255,0.08)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        {step.done
                          ? <Check size={9} color={GOLD} strokeWidth={3}/>
                          : <div style={{width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.15)'}}/>
                        }
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontSize:12,color:step.done?TEXT2:TEXT3,lineHeight:1.4,display:'block'}}>{step.task}</span>
                        <span style={{fontSize:10,color:step.done?GOLD:TEXT3,marginTop:2,display:'block'}}>{step.day}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:20,padding:'11px 14px',background:'rgba(200,151,62,0.05)',border:`1px solid rgba(200,151,62,0.15)`,borderRadius:10,fontSize:12,color:TEXT3,textAlign:'center'}}>
                  All steps executed autonomously — no approval pauses required
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════ */}
      <section id="pricing" style={{padding:'96px 40px',background:'#0a0908'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>

          {/* Header */}
          <FadeIn style={{textAlign:'center',marginBottom:48}}>
            <SBadge>Pricing</SBadge>
            <h2 style={{fontSize:'clamp(22px,3vw,40px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT,marginBottom:14}}>
              Simple, transparent pricing
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:480,margin:'0 auto 32px',lineHeight:1.65}}>
              Choose the plan that fits your team. Upgrade or downgrade anytime.
            </p>

            {/* Monthly / Annual toggle */}
            <div style={{display:'inline-flex',alignItems:'center',gap:0,background:'#1c1a13',border:`1px solid ${GBORDER}`,borderRadius:100,padding:4}}>
              <button onClick={()=>setBillingAnnual(false)} style={{padding:'7px 20px',borderRadius:100,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,transition:'all 0.2s',background:!billingAnnual?GOLD:'transparent',color:!billingAnnual?'#0e0c09':TEXT2,fontFamily:"'Inter',sans-serif"}}>Monthly</button>
              <button onClick={()=>setBillingAnnual(true)}  style={{padding:'7px 20px',borderRadius:100,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,transition:'all 0.2s',background:billingAnnual?GOLD:'transparent',color:billingAnnual?'#0e0c09':TEXT2,fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',gap:7}}>
                Annual <span style={{fontSize:10,fontWeight:800,background:'rgba(16,185,129,0.2)',color:'#10b981',border:'1px solid rgba(16,185,129,0.3)',borderRadius:100,padding:'1px 7px'}}>Save 20%</span>
              </button>
            </div>
          </FadeIn>

          {/* Plan cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,alignItems:'start'}}>
            {PLANS.map((plan, i) => {
              const price = plan.monthly === null ? null : billingAnnual ? plan.annual : plan.monthly
              return (
                <FadeIn key={plan.key} delay={i*0.07}>
                  <div style={{
                    background: plan.popular ? 'linear-gradient(160deg,#221d10,#1c1a13)' : CARD,
                    border: `1px solid ${plan.popular ? 'rgba(200,151,62,0.5)' : BORDER}`,
                    borderRadius:20, padding:'28px 24px', position:'relative',
                    boxShadow: plan.popular ? '0 0 48px rgba(200,151,62,0.1)' : 'none',
                    height:'100%', boxSizing:'border-box',
                  }}>

                    {/* Popular badge */}
                    {plan.popular && (
                      <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#d4a853,#b8803a)',color:'#0e0c09',fontSize:10,fontWeight:800,padding:'4px 16px',borderRadius:100,letterSpacing:'0.08em',whiteSpace:'nowrap'}}>
                        MOST POPULAR
                      </div>
                    )}

                    {/* Plan label */}
                    <div style={{fontSize:10,fontWeight:800,color: plan.popular ? GOLD : TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>{plan.label}</div>

                    {/* Price */}
                    <div style={{marginBottom:4}}>
                      {price === null ? (
                        <span style={{fontSize:36,fontWeight:800,letterSpacing:'-0.03em',color:TEXT,fontFamily:"'Syne','Inter',sans-serif"}}>Custom</span>
                      ) : (
                        <>
                          <span style={{fontSize:36,fontWeight:800,letterSpacing:'-0.03em',color:TEXT,fontFamily:"'Syne','Inter',sans-serif"}}>${price.toLocaleString()}</span>
                          <span style={{fontSize:13,color:TEXT3,fontWeight:400}}>/month</span>
                        </>
                      )}
                    </div>
                    {plan.note && <p style={{fontSize:11,color:TEXT3,marginBottom:4}}>{plan.note}</p>}
                    <p style={{fontSize:12,color:TEXT2,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${BORDER}`}}>{plan.tagline}</p>

                    {/* Seats & credits */}
                    <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${BORDER}`}}>
                      <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:2}}>{plan.brands}</div>
                      <div style={{fontSize:12,color:TEXT2,marginBottom:6}}>{plan.seats}</div>
                      <div style={{fontSize:13,fontWeight:700,color: plan.popular ? GOLD : TEXT,marginBottom:4}}>{plan.credits}</div>
                      {plan.breakdown.map(b=>(
                        <div key={b} style={{fontSize:11,color:TEXT3,lineHeight:1.6}}>{b}</div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={plan.key==='enterprise' ? ()=>window.open('mailto:hello@evokecmo.com','_blank') : open}
                      style={{
                        width:'100%', padding:'12px', marginBottom:20,
                        background: plan.ctaDark ? 'linear-gradient(135deg,#d4a853,#b8803a)' : 'rgba(255,255,255,0.06)',
                        border: plan.ctaDark ? 'none' : `1px solid ${BORDER}`,
                        borderRadius:10, color: plan.ctaDark ? '#0e0c09' : TEXT2,
                        fontSize:13, fontWeight:700, cursor:'pointer',
                        fontFamily:"'Inter',sans-serif", transition:'all 0.2s',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
                    >{plan.cta}</button>

                    {/* Perfect for */}
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,fontWeight:800,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>PERFECT FOR</div>
                      {plan.perfectFor.map(f=>(
                        <div key={f} style={{fontSize:12,color:TEXT2,lineHeight:1.6,paddingLeft:10,borderLeft:`2px solid ${GBORDER}`,marginBottom:4}}>{f}</div>
                      ))}
                    </div>

                    {/* Features */}
                    <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:16}}>
                      {plan.features.map(f=>(
                        <div key={f} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                          <Check size={12} color={plan.popular ? GOLD : '#10b981'} strokeWidth={2.5} style={{flexShrink:0,marginTop:2}}/>
                          <span style={{fontSize:12,color:TEXT2,lineHeight:1.55}}>{f}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS  (strip_07)
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'96px 40px',background:BG}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center',marginBottom:56}}>
            <SBadge>Testimonials</SBadge>
            <h2 style={{fontSize:'clamp(18px,2.6vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT}}>
              Loved by marketers &<br/>
              <span style={goldGrad}>bootstrapped founders</span>
            </h2>
          </FadeIn>

          <div className="testimonials-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
            {TESTIMONIALS.map((t,i)=>(
              <FadeIn key={t.name} delay={i*0.1}>
                <div style={{background:CARD,border:`1px solid ${GBORDER}`,borderRadius:18,padding:'28px',height:'100%',display:'flex',flexDirection:'column'}}>
                  <div style={{display:'flex',gap:3,marginBottom:18}}>
                    {Array.from({length:5}).map((_,j)=><Star key={j} size={14} fill={GOLD} color={GOLD}/>)}
                  </div>
                  <p style={{fontSize:14,color:TEXT2,lineHeight:1.75,marginBottom:24,flex:1}}>{t.quote}</p>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:t.bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0}}>{t.initials}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:TEXT}}>{t.name}</div>
                      <div style={{fontSize:12,color:TEXT3}}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOUNDER STORY
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'96px 40px',background:'#0a0908',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'50vw',height:'40vh',pointerEvents:'none',background:'radial-gradient(ellipse, rgba(200,151,62,0.04) 0%, transparent 70%)'}}/>
        <div style={{maxWidth:760,margin:'0 auto',position:'relative',zIndex:1}}>
          <FadeIn style={{textAlign:'center'}}>
            <SBadge>Why We Built This</SBadge>
            <div style={{fontSize:48,color:'rgba(200,151,62,0.25)',marginBottom:20,lineHeight:1,fontFamily:'Georgia,serif'}}>&ldquo;</div>
            <p style={{fontSize:'clamp(16px,1.8vw,22px)',color:'rgba(240,235,224,0.78)',lineHeight:1.8,fontStyle:'italic',marginBottom:32,letterSpacing:'-0.01em'}}>
              I watched great businesses lose to worse ones — simply because they couldn&apos;t afford a full marketing team. Agencies were too expensive. AI tools were too fragmented. Every tool forgot your brand the moment you closed the tab. So I built what I wished existed: one system that thinks like a CMO, works like an agency, and never forgets who you are.
            </p>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#d4a853,#b8803a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#0e0c09',flexShrink:0,fontFamily:"'Syne','Inter',sans-serif"}}>E</div>
              <div style={{textAlign:'left'}}>
                <div style={{fontWeight:800,fontSize:15,color:TEXT,letterSpacing:'-0.01em',fontFamily:"'Syne','Inter',sans-serif"}}>Evoke CMO Team</div>
                <div style={{fontSize:12,color:TEXT3,marginTop:2}}>Founders, Evoke CMO</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA  (strip_07 bottom, strip_08)
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'100px 40px 120px',textAlign:'center',background:'#0a0908'}}>
        <FadeIn>
          <h2 style={{fontSize:'clamp(22px,3vw,44px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.12,marginBottom:18,fontFamily:"'Syne','Inter',sans-serif",color:TEXT}}>
            Start marketing like a<br/>
            <span style={goldGrad}>CMO today</span>
          </h2>
          <p style={{fontSize:16,color:TEXT2,maxWidth:480,margin:'0 auto 44px',lineHeight:1.7}}>
            Join hundreds of founders and marketers who replaced their expensive marketing teams with Evoke CMO.
          </p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
            <button onClick={open} style={goldPill}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(200,151,62,0.45)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              Get Started Free <ArrowRight size={18}/>
            </button>
            <a href="#features" style={outlinePill}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(240,235,224,0.4)';e.currentTarget.style.color=TEXT}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(240,235,224,0.22)';e.currentTarget.style.color=TEXT}}>
              See All Features
            </a>
          </div>
          <p style={{fontSize:13,color:TEXT3}}>Free to start · No credit card required</p>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER  (strip_08)
      ══════════════════════════════════════════════════ */}
      <footer style={{borderTop:`1px solid ${BORDER}`,padding:'56px 40px 40px',background:BG2}}>
        <div className="footer-grid" style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 180px 180px',gap:60,alignItems:'start'}}>

          {/* Brand */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              {/* EVOKE image logo — matches navbar */}
              <img
                src="/evoke-logo.png"
                alt="EVOKE"
                style={{height:26,width:'auto',objectFit:'contain',display:'block'}}
              />
              <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px 5px 8px',background:'#0a0805',border:'1px solid rgba(200,151,62,0.32)',borderRadius:100,boxShadow:'0 0 0 1px rgba(0,0,0,0.6) inset'}}>
                <Zap size={11} color={GOLD} fill={GOLD}/>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.09em',color:GOLD,fontFamily:"'Inter',sans-serif"}}>CMO</span>
              </div>
            </div>
            <p style={{fontSize:13,color:TEXT3,lineHeight:1.7,maxWidth:280}}>Your AI Chief Marketing Officer. Generate campaigns, post to every channel, grow your brand.</p>
          </div>

          {/* Product */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20}}>PRODUCT</div>
            {['Features','Pricing','How It Works'].map(l=>(
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                style={{display:'block',fontSize:14,color:TEXT2,textDecoration:'none',marginBottom:14,transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color=TEXT}
                onMouseLeave={e=>e.target.style.color='rgba(240,235,224,0.55)'}>{l}</a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20}}>LEGAL</div>
            {['Privacy Policy','Terms of Service'].map(l=>(
              <a key={l} href={`/${l.toLowerCase().replace(/ /g,'-')}`}
                style={{display:'block',fontSize:14,color:TEXT2,textDecoration:'none',marginBottom:14,transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color=TEXT}
                onMouseLeave={e=>e.target.style.color='rgba(240,235,224,0.55)'}>{l}</a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div style={{maxWidth:1200,margin:'36px auto 0',paddingTop:24,borderTop:`1px solid ${BORDER}`,textAlign:'center'}}>
          <p style={{fontSize:13,color:TEXT3}}>© 2026 Evoke CMO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
