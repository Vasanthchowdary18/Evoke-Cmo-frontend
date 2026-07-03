import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, Check, Star, Zap, TrendingUp, Target, Calendar, Search, Mail, Users, BarChart2, Briefcase, Megaphone, ShoppingCart, Sparkles, Activity, Lightbulb, DollarSign, Rocket, Image, Film, Monitor, Share2, Layers, Play, BookOpen } from 'lucide-react'
// OnboardingModal moved to AgentsHub — not triggered on landing page
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils'
import { saveOnboardingData, getUserData } from '../services/userService'

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
  { title:'Growth Strategy',      type:'growth_strategy',   desc:'Full GTM plan, revenue forecast, market sizing, and milestone roadmap.',            icon:<TrendingUp size={28}/>,  color:'#c8973e', bg:'linear-gradient(135deg,#2a1f0a,#1c1508)' },
  { title:'Competitive Intel',    type:'competitive_intel', desc:'SWOT analysis, competitor profiles, pricing analysis, and positioning.',            icon:<Target size={28}/>,      color:'#ef4444', bg:'linear-gradient(135deg,#2a0a0a,#1c0808)' },
  { title:'Content Calendar',     type:'content_calendar',  desc:'30-day multi-platform content plan with daily post ideas and hashtags.',             icon:<Calendar size={28}/>,    color:'#10b981', bg:'linear-gradient(135deg,#0a2a1a,#081c12)' },
  { title:'SEO Blog Post',        type:'seo_blog',          desc:'Full 1,500-word SEO-optimised blog with meta, keywords, and internal links.',       icon:<Search size={28}/>,      color:'#3b82f6', bg:'linear-gradient(135deg,#0a1a2a,#08121c)' },
  { title:'Email Drip Campaign',  type:'email_drip',        desc:'5-email nurture sequence with subject lines, preheaders, and CTAs.',                icon:<Mail size={28}/>,        color:'#a855f7', bg:'linear-gradient(135deg,#1a0a2a,#12081c)' },
  { title:'Influencer & PR Brief',type:'influencer',        desc:'Influencer campaign brief, press release, and media pitch templates.',              icon:<Users size={28}/>,       color:'#f59e0b', bg:'linear-gradient(135deg,#2a1f0a,#1c1508)' },
  { title:'Analytics Report',     type:'analytics_report',  desc:'Executive KPI summary, channel breakdown, and data-driven recommendations.',       icon:<BarChart2 size={28}/>,   color:'#06b6d4', bg:'linear-gradient(135deg,#0a1f2a,#081418)' },
  { title:'Sales Enablement',     type:'sales_enablement',  desc:'Sales deck, elevator pitch, objection handling, and cold-call scripts.',            icon:<Briefcase size={28}/>,   color:'#84cc16', bg:'linear-gradient(135deg,#0f2a0a,#0a1c08)' },
  { title:'Event Marketing',      type:'event_full',        desc:'Full event campaign — promotion timeline, content plan, and post-event follow-up.', icon:<Megaphone size={28}/>,   color:'#f97316', bg:'linear-gradient(135deg,#2a1208,#1c0c06)' },
  { title:'Marketplace Growth',   type:'marketplace',       desc:'Vendor strategy, buyer acquisition plan, and promotional campaign roadmap.',        icon:<ShoppingCart size={28}/>,color:'#ec4899', bg:'linear-gradient(135deg,#2a0a1a,#1c0812)' },
  { title:'Brand Strategy',       type:'brand_strategy',    desc:'Brand identity, tone of voice, messaging framework, and content pillars.',          icon:<Sparkles size={28}/>,    color:'#8b5cf6', bg:'linear-gradient(135deg,#1a0a2a,#12081c)' },
  { title:'Funnel & CRO Audit',   type:'funnel_cro',        desc:'Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.',     icon:<Activity size={28}/>,    color:'#14b8a6', bg:'linear-gradient(135deg,#0a2a28,#081c1a)' },
]

const PLAN_OPTIONS = [
  {
    key: 'free',
    label: 'Free Plan',
    tag: 'FREE',
    tagColor: '#10b981',
    desc: 'Try this module instantly — no payment required.',
    cta: 'Try Free',
    path: null, // uses module type → /campaign/{type}
  },
  {
    key: 'package-a',
    label: 'Package A',
    tag: 'STARTER',
    tagColor: '#3b82f6',
    desc: 'Images, banners, social posting + all strategy modules.',
    cta: 'Choose Package A',
    path: '/package-a',
  },
  {
    key: 'package-b',
    label: 'Package B',
    tag: 'POPULAR',
    tagColor: '#c8973e',
    desc: 'Full motion — lifestyle video, 360° product video & 30-day content.',
    cta: 'Choose Package B',
    path: '/package-b',
  },
  {
    key: 'package-c',
    label: 'Package C',
    tag: 'PREMIUM',
    tagColor: '#a855f7',
    desc: 'Deploy paid ads at scale — FB & Google, managed end-to-end.',
    cta: 'Choose Package C',
    path: '/package-c',
  },
]

const PLANS = [
  {
    key: 'free', label: 'FREE', popular: false,
    tagline: 'Start with strategy — no cost, no commitment',
    price: '$0', priceNote: 'No credit card required',
    features: [
      { icon: <BookOpen size={13}/>, text: 'Brand Knowledge Base Setup — Your AI CMO', desc: 'Set up your brand profile — business identity, target audience, brand voice and goals — so your AI CMO understands your brand from day one and every recommendation is on-brand.' },
      { icon: <Target size={13}/>, text: 'Objective & Strategy Development', desc: 'EVOX CMO works with you to define clear, measurable marketing goals — whether that\'s lead generation, brand awareness, or revenue growth. It builds a full GTM strategy aligned to your business objectives.' },
      { icon: <Megaphone size={13}/>, text: 'New Leads / Client Retention Planning', desc: 'Get a custom plan for attracting new customers and keeping existing ones engaged. Includes outreach strategies, nurture sequences, and loyalty campaign frameworks tailored to your audience.' },
      { icon: <Layers size={13}/>, text: 'Content Creation Framework', desc: 'A structured content blueprint covering your brand voice, content pillars, post formats, and publishing cadence across all channels — so every piece of content works toward your goals.' },
    ],
    cta: 'Get Started Free', ctaDark: false,
  },
  {
    key: 'package-a', label: 'PACKAGE A', popular: false,
    tagline: 'Elevate your brand with professional visuals',
    price: 'Contact Us', priceNote: 'Custom pricing for your brand',
    features: [
      { icon: <Check size={13}/>, text: 'Everything in Free', desc: 'Includes all deliverables from the Free plan — Objective & Strategy Development, Leads/Retention Planning, and Content Creation Framework.' },
      { icon: <Image size={13}/>, text: 'Image to Angles — Multi-angle product shots', desc: 'Professional AI-generated multi-angle product photography. Showcase your product from every angle with studio-quality visuals — no photoshoot required.' },
      { icon: <Image size={13}/>, text: 'Lifestyle Images — On-brand scene photography', desc: 'Contextual lifestyle images that place your product in real-world scenes. Perfect for social media, ads, and e-commerce listings that convert.' },
      { icon: <Monitor size={13}/>, text: 'Banner Creation — Ad-ready static banners', desc: 'Conversion-optimised static banners in all standard ad sizes (300×250, 728×90, 160×600, etc.) ready to deploy on Google Display, Meta, and LinkedIn.' },
      { icon: <Share2 size={13}/>, text: 'Posting on Social Media — Managed scheduling', desc: 'We handle the publishing — your content is scheduled and posted across Instagram, Facebook, LinkedIn, and Twitter on your behalf at the optimal times for engagement.' },
    ],
    cta: 'Choose Package A', ctaDark: false,
  },
  {
    key: 'package-b', label: 'PACKAGE B', popular: true,
    tagline: 'Go full motion with video & 30-day content',
    price: 'Contact Us', priceNote: 'Custom pricing for your brand',
    features: [
      { icon: <Check size={13}/>, text: 'Everything in Package A', desc: 'Includes all deliverables from Package A — strategy, product images, lifestyle images, banners, and managed social posting.' },
      { icon: <Film size={13}/>, text: 'Lifestyle Video — Brand story short-form video', desc: 'A professionally crafted short-form video (15–60 seconds) that tells your brand story. Designed for Instagram Reels, TikTok, YouTube Shorts, and paid video ads.' },
      { icon: <Monitor size={13}/>, text: '360° Product Video — Immersive product showcase', desc: 'A full 360-degree rotating product video that lets customers see every detail. Dramatically increases purchase confidence on e-commerce and landing pages.' },
      { icon: <Layers size={13}/>, text: '30 Days Content — Full month of ready-to-post assets', desc: 'A complete 30-day content calendar with daily posts, captions, hashtags, and visual assets for all platforms — fully mapped to your campaign goals and brand voice.' },
    ],
    cta: 'Choose Package B', ctaDark: true,
  },
  {
    key: 'package-c', label: 'PACKAGE C', popular: false,
    tagline: 'Deploy paid ads at scale across FB & Google',
    price: 'Contact Us', priceNote: 'Custom pricing for your brand',
    features: [
      { icon: <Check size={13}/>, text: 'Everything in Package B', desc: 'Includes all deliverables from Package B — strategy, images, lifestyle video, 360° product video, and 30-day content calendar.' },
      { icon: <Layers size={13}/>, text: '3D Images — Premium product renders', desc: 'Photorealistic 3D renders of your product in any environment or configuration. No physical samples needed — ideal for pre-launch campaigns and premium brand positioning.' },
      { icon: <Monitor size={13}/>, text: 'Ads Creation — Conversion-optimised creatives', desc: 'Complete ad creative packages including static images, animated banners, and video ads — each designed with proven CRO principles to maximise click-through and conversion rates.' },
      { icon: <Share2 size={13}/>, text: 'Ads Manager Connect — FB & Google campaigns', desc: 'Full integration with your Facebook Ads Manager and Google Ads account. We set up campaigns, ad sets, targeting, and bidding strategies ready for launch.' },
      { icon: <Target size={13}/>, text: 'Target Audience Selection — Precision segmentation', desc: 'Deep audience research and segmentation — custom audiences, lookalikes, interest targeting, and retargeting lists built specifically for your product and goals.' },
      { icon: <Rocket size={13}/>, text: 'Deploy Ads — Full campaign launch & management', desc: 'End-to-end campaign launch and ongoing management. We monitor performance daily, optimise bids, rotate creatives, and report results — so you get maximum ROI hands-free.' },
    ],
    cta: 'Choose Package C', ctaDark: false,
  },
]

const WORKFLOW = [
  { label: 'Objectives',   icon: <Target size={18}/>,      desc: 'Define clear goals aligned to revenue' },
  { label: 'Strategies',   icon: <Lightbulb size={18}/>,   desc: 'Build channel & messaging frameworks'  },
  { label: 'Budget',       icon: <DollarSign size={18}/>,  desc: 'Allocate spend based on ROI benchmarks' },
  { label: 'Execution',    icon: <Rocket size={18}/>,      desc: 'Deploy campaigns with precision'        },
  { label: 'Analytics',    icon: <BarChart2 size={18}/>,   desc: 'Track KPIs & surface insights'          },
  { label: 'Optimization', icon: <TrendingUp size={18}/>,  desc: 'Refine through AI-driven iteration'     },
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

const WIZARD_STEPS = [
  {
    key: 'objective', frameworkIdx: 0,
    multiSelect: true,
    question: 'What is your #1 marketing objective right now?',
    sub: 'Select all that apply — EVOX will align every module to your goals.',
    options: [
      { value: 'leads',     label: 'Generate Leads',      icon: '🎯', desc: 'Fill your pipeline with qualified prospects'    },
      { value: 'awareness', label: 'Brand Awareness',     icon: '📢', desc: 'Get more people to know and trust your brand'   },
      { value: 'sales',     label: 'Drive Sales',         icon: '💰', desc: 'Convert leads and increase revenue directly'    },
      { value: 'retention', label: 'Retain Customers',    icon: '🔄', desc: 'Keep customers engaged and reduce churn'        },
    ],
  },
  {
    key: 'strategy', frameworkIdx: 1,
    multiSelect: true,
    question: 'Which channels deliver your best marketing results?',
    sub: 'Select all that apply — EVOX will build strategies around your top channels.',
    options: [
      { value: 'social',  label: 'Social Media',      icon: '📱', desc: 'Instagram, LinkedIn, Twitter & Facebook'   },
      { value: 'email',   label: 'Email / Outreach',  icon: '📧', desc: 'Newsletters, drip campaigns & cold outreach' },
      { value: 'content', label: 'Content / SEO',     icon: '✍️', desc: 'Blog posts, SEO & organic search traffic'   },
      { value: 'paid',    label: 'Paid Ads',          icon: '💡', desc: 'Google Ads, Meta Ads & performance marketing' },
    ],
  },
  {
    key: 'budget', frameworkIdx: 2,
    multiSelect: false,
    question: 'What is your monthly marketing investment?',
    sub: 'EVOX will optimise ROI allocation based on your spend tier.',
    options: [
      { value: 'low',        label: 'Under $500 / mo',      icon: '🌱', desc: 'Starting out or running lean'              },
      { value: 'mid',        label: '$500 – $2,500 / mo',  icon: '📈', desc: 'Growing and actively scaling up'           },
      { value: 'high',       label: '$2,500 – $12,000 / mo', icon: '🚀', desc: 'Established brand with a strong budget'    },
      { value: 'enterprise', label: '$12,000+ / mo',       icon: '🏢', desc: 'Enterprise-level investment and scale'      },
      { value: 'custom',     label: 'Custom',               icon: '✏️', desc: 'Enter your own budget figure'              },
    ],
    hasCustomBudget: true,
  },
  {
    key: 'execution', frameworkIdx: 3,
    multiSelect: true,
    question: 'How do you currently run your marketing campaigns?',
    sub: 'Select all that apply — EVOX automates whatever takes your team the most time.',
    options: [
      { value: 'manual', label: 'Fully Manual',        icon: '✋', desc: 'I do everything by hand — very time-consuming'      },
      { value: 'tools',  label: 'Mix of Tools',        icon: '🔧', desc: "I use several tools but it's still fragmented"       },
      { value: 'team',   label: 'In-house Team',       icon: '👥', desc: 'I have a small team but need more output'            },
      { value: 'agency', label: 'External Agency',     icon: '🏛️', desc: 'Outsourcing but want more control and speed'        },
    ],
  },
  {
    key: 'analytics', frameworkIdx: 4,
    multiSelect: true,
    question: 'How do you currently measure campaign performance?',
    sub: 'Select all that apply — EVOX will surface the insights that matter most.',
    options: [
      { value: 'none',     label: 'Not Tracking Yet', icon: '❓', desc: 'I don\'t have proper analytics set up yet'    },
      { value: 'basic',    label: 'Basic Metrics',    icon: '📊', desc: 'Likes, clicks and open rates only'            },
      { value: 'crm',      label: 'CRM + Analytics',  icon: '📉', desc: 'Lead tracking and conversion funnels'         },
      { value: 'advanced', label: 'Full Dashboard',   icon: '🖥️', desc: 'Custom KPIs, attribution and ROI tracking'   },
    ],
  },
  {
    key: 'optimization', frameworkIdx: 5,
    multiSelect: true,
    question: 'What are your biggest growth challenges right now?',
    sub: "Select all that apply — EVOX's AI will prioritise these areas first.",
    options: [
      { value: 'content',     label: 'Creating Content',    icon: '✏️', desc: 'Not enough quality content going out regularly'  },
      { value: 'converting',  label: 'Converting Traffic',  icon: '🔄', desc: 'Visitors aren\'t turning into customers'          },
      { value: 'consistency', label: 'Staying Consistent',  icon: '⏰', desc: 'Hard to maintain a regular marketing cadence'     },
      { value: 'roi',         label: 'Proving ROI',         icon: '💹', desc: 'Can\'t clearly show what\'s working'              },
    ],
  },
]

function getPersonalisedResult(answers) {
  // Answers can be a string (single-select) or array (multi-select)
  const first = (v) => Array.isArray(v) ? v[0] : v

  const roleLabel = { founder:'Founder', marketer:'Marketing Leader', business:'Business Owner', agency:'Agency Owner' }
  const objectiveLabel = { leads:'lead generation', awareness:'brand awareness', sales:'driving sales', retention:'customer retention' }
  const challengeLabel = { content:'content creation', converting:'conversion optimisation', consistency:'marketing consistency', roi:'ROI measurement' }
  const modulesMap = {
    leads:     ['Lead Gen Campaigns','Email Drip Sequences','LinkedIn Outreach'],
    awareness: ['Brand Strategy','30-Day Content Calendar','Social Media Scheduler'],
    sales:     ['Sales Enablement','Funnel & CRO Audit','Paid Ad Campaigns'],
    retention: ['Email Nurture Flows','Customer Re-engagement','Analytics Reports'],
  }
  const bg  = first(answers.background)
  const obj = first(answers.objective)
  const opt = first(answers.optimization)
  return {
    role:      roleLabel[bg]  || answers.background || 'Marketing Professional',
    objective: objectiveLabel[obj] || 'growth',
    challenge: challengeLabel[opt] || 'scaling',
    modules:   modulesMap[obj]     || ['Growth Strategy','Content Calendar','Analytics'],
  }
}

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [wizardOpen,      setWizardOpen]      = useState(false)
  const [wizardPhase,     setWizardPhase]     = useState('plan') // 'plan' | 'questions' | 'connect'
  const [wizardPlan,      setWizardPlan]      = useState(null)
  const [wizardStep,      setWizardStep]      = useState(0)
  const [wizardAnswers,   setWizardAnswers]   = useState({})
  const [wizardDone,      setWizardDone]      = useState(false)
  const [expandedFeature, setExpandedFeature] = useState(null)

  // "Other" free-text for the background step
  const [otherBgInput,    setOtherBgInput]    = useState('')
  const [otherBgSelected, setOtherBgSelected] = useState(false)

  // Persisted assessment + selected package (remembered until logout)
  const [selectedPackage, setSelectedPackage] = useState(null)

  // Plan selector modal triggered by clicking an agent card
  const [activeModule, setActiveModule] = useState(null)

  const persistAssessment = (answers) => {
    try { localStorage.setItem('evoke_assessment', JSON.stringify({ answers, ts: Date.now() })) } catch {}
  }

  const saveProgress = (step, answers) => {
    try { localStorage.setItem('evoke_wizard_progress', JSON.stringify({ step, answers })) } catch {}
  }

  const clearProgress = () => {
    try { localStorage.removeItem('evoke_wizard_progress') } catch {}
  }

  // On mount: restore completed assessment OR partial progress + selected package
  useEffect(() => {
    // Scroll to hash anchor when returning from a sub-page (e.g. back from campaign-hub)
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1))
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [])

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('evoke_assessment') || 'null')
      if (a?.answers) { setWizardAnswers(a.answers); setWizardDone(true) }
      else {
        const p = JSON.parse(localStorage.getItem('evoke_wizard_progress') || 'null')
        if (p?.answers) { setWizardAnswers(p.answers); setWizardStep(p.step ?? 0) }
      }
    } catch {}
    try {
      const pkg = localStorage.getItem('evoke_selected_package')
      if (pkg) setSelectedPackage(pkg)
    } catch {}
  }, [])

  // Sync assessment from Firestore when user logs in (same account, any device)
  useEffect(() => {
    if (!user) return
    getUserData(user.uid).then(data => {
      if (data?.onboardingComplete && data?.onboardingData) {
        setWizardAnswers(data.onboardingData)
        setWizardDone(true)
        try { localStorage.setItem('evoke_assessment', JSON.stringify({ answers: data.onboardingData, ts: Date.now() })) } catch {}
      }
    }).catch(() => {})
  }, [user])

  const handleWizardSelect = (value) => {
    const step = WIZARD_STEPS[wizardStep]
    if (step.multiSelect) {
      // Toggle in array — don't auto-advance
      setWizardAnswers(prev => {
        const current = Array.isArray(prev[step.key]) ? prev[step.key] : []
        const has = current.includes(value)
        const next = { ...prev, [step.key]: has ? current.filter(v => v !== value) : [...current, value] }
        saveProgress(wizardStep, next)
        return next
      })
    } else {
      // Single-select — set answer, but don't auto-advance if it needs extra input
      const finalAnswers = { ...wizardAnswers, [step.key]: value }
      setWizardAnswers(finalAnswers)
      setOtherBgSelected(false)
      setOtherBgInput('')
      // If custom budget selected, stay on step to show the $ input
      if (step.hasCustomBudget && value === 'custom') { saveProgress(wizardStep, finalAnswers); return }
      if (wizardStep < WIZARD_STEPS.length - 1) {
        const nextStep = wizardStep + 1
        setWizardStep(nextStep)
        saveProgress(nextStep, finalAnswers)
      } else {
        setWizardDone(true)
        persistAssessment(finalAnswers)
        clearProgress()
      }
    }
  }

  const goToConnect = (answers) => {
    if (answers) persistAssessment(answers)
    clearProgress()
    setWizardDone(true)
    setWizardOpen(false)
    if (user) { saveOnboardingData(user.uid, answers).catch(() => {}) }
    const planRoute = wizardPlan === 'free' ? '/free-plan' : wizardPlan ? `/${wizardPlan}` : '/agents-hub'
    navigate(planRoute)
  }

  const handleWizardContinue = () => {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      const nextStep = wizardStep + 1
      setWizardStep(nextStep)
      saveProgress(nextStep, wizardAnswers)
    } else {
      setWizardDone(true)
      goToConnect(wizardAnswers)
    }
  }

  // "Retake Assessment" — clear the saved result and start fresh
  const closeWizard = () => {
    setWizardOpen(false)
    // Don't clear progress on close — user can resume where they left off
  }

  const resetWizard = () => {
    try { localStorage.removeItem('evoke_assessment') } catch {}
    clearProgress()
    setWizardOpen(false)
    setWizardPhase('questions')
    setWizardPlan(null)
    setWizardStep(0)
    setWizardAnswers({})
    setWizardDone(false)
    setOtherBgInput('')
    setOtherBgSelected(false)
    setExpandedFeature(null)
    setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const goSignIn = () => user ? navigate('/agents-hub') : redirectToLogin()
  const goBoard = () => user ? navigate('/agents-hub') : goSignIn()

  // "Get Started Free" from the wizard free-detail page — always lands on agents-hub
  // after login instead of bouncing back to the landing page first.
  const goFreeStart = () => {
    if (user) {
      navigate('/plans')
    } else {
      redirectToLogin(window.location.origin + '/plans')
    }
  }

  // Navigate directly to a specific CMO agent page.
  // If not logged in, redirect to accounts portal with the agent route as redirect_url
  // so they land on the exact agent after signing in — not the landing page.
  const goFreeAgent = (path) => {
    if (user) {
      navigate(path)
    } else {
      redirectToLogin(window.location.origin + path)
    }
  }

  // Open the wizard card panel and scroll to it.
  // If the user already completed the assessment, show their saved result
  // instead of asking the questions again.
  const openAssessment = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  const startWizardWithPlan = (planKey) => {
    try { localStorage.setItem('evoke_selected_package', planKey) } catch {}
    navigate('/brand-kb')
  }

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
          {/* badge — EVOX branding */}
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:44}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(15,12,8,0.7)',border:`1px solid ${GBORDER}`,borderRadius:100,padding:'7px 18px',fontSize:13,color:GOLD,fontWeight:600,letterSpacing:'0.04em'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 6px #10b981'}} />
              Powered by EVOX
            </div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:100,padding:'5px 14px',fontSize:11,color:'rgba(240,235,224,0.45)',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase'}}>
              EVOKE OS · AI Executive Workforce Platform
            </div>
          </motion.div>

          {/* H1 — font scales with viewport so each line stays single-line */}
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.7}}>
            <h1 style={{
              fontSize:'clamp(18px, 3.2vw, 46px)',
              fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.14,
              marginBottom:6, fontFamily:"'Syne','Inter',sans-serif", color:TEXT,
            }}>
              Your AI Chief Marketing Officer
            </h1>
            <h1 style={{
              fontSize:'clamp(18px, 3.2vw, 46px)',
              fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.14,
              marginBottom:32, fontFamily:"'Syne','Inter',sans-serif",
              ...goldGrad,
            }}>
              Built on EVOX
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
            <button onClick={openAssessment} style={goldPill}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(200,151,62,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              Get Started <ArrowRight size={17}/>
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
          CMO WORKFLOW PIPELINE + ASSESSMENT WIZARD
      ══════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════
          VIDEO
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'80px 40px',background:BG}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center',marginBottom:40}}>
            <SBadge>Product Overview</SBadge>
            <h2 style={{fontSize:'clamp(20px,3vw,38px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT,marginBottom:12}}>
              See EVOX <span style={goldGrad}>in Action</span>
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:460,margin:'0 auto',lineHeight:1.65}}>
              Watch how EVOX transforms brand inputs into a complete multi-channel marketing engine — in minutes.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{position:'relative',borderRadius:20,overflow:'hidden',border:`1px solid ${GBORDER}`,boxShadow:'0 0 60px rgba(200,151,62,0.1)',aspectRatio:'16/9',background:'#111008',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#1c1a13 0%,#0e0c09 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
                <div style={{fontSize:'clamp(18px,3vw,36px)',fontWeight:800,fontFamily:"'Syne','Inter',sans-serif",...goldGrad,letterSpacing:'-0.03em'}}>EVOX C-Suite Platform</div>
                <div style={{fontSize:13,color:TEXT3}}>Product walkthrough — coming soon</div>
              </div>
              <div style={{position:'relative',zIndex:2,width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#d4a853,#b8803a)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(200,151,62,0.4)'}}>
                <Play size={26} color="#0e0c09" fill="#0e0c09"/>
              </div>
            </div>
          </FadeIn>
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
                color:GOLD, active:true, href:'#pricing', tags:['Campaigns','Content','Social'],
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
                  onClick={()=>agent.active&&(agent.href.startsWith('#')?document.getElementById(agent.href.slice(1))?.scrollIntoView({behavior:'smooth'}):navigate(agent.href))}
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
                    <button onClick={e=>{e.stopPropagation();agent.href.startsWith('#')?document.getElementById(agent.href.slice(1))?.scrollIntoView({behavior:'smooth'}):navigate(agent.href)}} style={{width:'100%',padding:'11px',background:'linear-gradient(135deg,#d4a853,#b8803a)',border:'none',borderRadius:10,color:'#0e0c09',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'Inter',sans-serif",transition:'all 0.2s'}}
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
          8 CORE AI AGENTS ECOSYSTEM
      ══════════════════════════════════════════════════ */}
      <section id="agents-ecosystem" style={{padding:'80px 40px',background:BG}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center',marginBottom:60}}>
            <SBadge>Agent &amp; Tool Ecosystem</SBadge>
            <h2 style={{fontSize:'clamp(22px,2.8vw,42px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,color:TEXT,fontFamily:"'Syne','Inter',sans-serif"}}>
              8 Core Agents.<br/><span style={goldGrad}>Every business function covered.</span>
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:520,margin:'14px auto 0',lineHeight:1.65}}>
              Each agent runs its own specialist function autonomously — strategy, creative, execution, governance, and more.
            </p>
          </FadeIn>

          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} variants={stagger}
            style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {[
              {
                label:'Marketing Strategy Agent',
                badge:'STRATEGY',
                color:'#c8973e',
                headerBg:'linear-gradient(135deg,#2a1f0a,#1c1508)',
                icon:<TrendingUp size={20}/>,
                points:['Annual / Quarterly / Monthly Plans','Budget recommendations per channel','7 input fields · 5 output tabs'],
                tag:'NEW',
                route:'/hub/strategy',
              },
              {
                label:'Campaign Planning Agent',
                badge:'CAMPAIGNS',
                color:'#3b82f6',
                headerBg:'linear-gradient(135deg,#0a1428,#08101e)',
                icon:<Target size={20}/>,
                points:['Campaign brief + timeline','Growth / Content / Product types','AI-generated full plan'],
                tag:null,
                route:'/campaign-hub',
              },
              {
                label:'Audience Intelligence',
                badge:'AUDIENCE',
                color:'#a855f7',
                headerBg:'linear-gradient(135deg,#1a0828,#12061c)',
                icon:<Users size={20}/>,
                points:['Segmentation + lookalike builder','Retargeting audience profiles','Trend analysis + CRM data'],
                tag:null,
                route:'/hub/audience',
              },
              {
                label:'Content Generation Agent',
                badge:'CONTENT',
                color:'#10b981',
                headerBg:'linear-gradient(135deg,#0a2018,#081410)',
                icon:<Layers size={20}/>,
                points:['Captions + Reel scripts','Product descriptions + Blogs','Brand voice matching'],
                tag:null,
                route:'/hub/content',
              },
              {
                label:'Creative Asset Agent',
                badge:'CREATIVE',
                color:'#ec4899',
                headerBg:'linear-gradient(135deg,#280a18,#1c0812)',
                icon:<Image size={20}/>,
                points:['Images: Angles · 360 · 3D · SEO','AI Banners + Product Renders','Meta Ads Boost'],
                tag:null,
                route:'/hub/creative',
              },
              {
                label:'Video Generation Agent',
                badge:'VIDEO · NEW',
                color:'#ef4444',
                headerBg:'linear-gradient(135deg,#280a0a,#1c0808)',
                icon:<Film size={20}/>,
                points:['Promo · Product · Reel · Ad · Event','Script + Visual + Audio + Brand Review','6 video types'],
                tag:'NEW',
                route:'/hub/video',
              },
              {
                label:'Brand Governance Agent',
                badge:'GOVERNANCE · NEW',
                color:'#06b6d4',
                headerBg:'linear-gradient(135deg,#0a1e28,#08141c)',
                icon:<Monitor size={20}/>,
                points:['5-pillar brand standards database','Approved / Flagged / Rejected routing','Conformance review · Live audit log'],
                tag:'NEW',
                route:'/hub/governance',
              },
              {
                label:'Marketing Execution Agent',
                badge:'EXECUTION · NEW',
                color:'#84cc16',
                headerBg:'linear-gradient(135deg,#102808,#0a1c06)',
                icon:<Share2 size={20}/>,
                points:['7-channel: Meta · LinkedIn · TikTok · Google','Email · SMS · Marketplace','Scheduler · Budget · Audience · KPIs'],
                tag:'NEW',
                route:'/hub/execution',
              },
            ].map((agent,i)=>(
              <motion.div key={agent.label} variants={fadeUp}
                onClick={()=>{if(user){navigate(agent.route,{state:{backTo:'/',backScroll:'agents-ecosystem'}})}else{try{sessionStorage.setItem('evoke_post_login_route',agent.route)}catch{}redirectToLogin()}}}
                style={{background:'#141210',border:`1px solid rgba(255,255,255,0.07)`,borderRadius:16,overflow:'hidden',cursor:'pointer',transition:'all 0.25s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=agent.color+'66';e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=`0 20px 50px ${agent.color}18`}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                {/* Colored header */}
                <div style={{background:agent.headerBg,borderBottom:`1px solid ${agent.color}22`,padding:'16px 18px',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:`${agent.color}20`,border:`1px solid ${agent.color}40`,display:'flex',alignItems:'center',justifyContent:'center',color:agent.color,flexShrink:0}}>
                    {agent.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:9,fontWeight:800,color:agent.color,letterSpacing:'0.07em'}}>{agent.badge}</span>
                      {agent.tag&&(<span style={{fontSize:8,fontWeight:700,padding:'2px 6px',background:`${agent.color}20`,border:`1px solid ${agent.color}40`,borderRadius:100,color:agent.color,letterSpacing:'0.06em'}}>{agent.tag}</span>)}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:TEXT,lineHeight:1.3,marginTop:3}}>{agent.label}</div>
                  </div>
                </div>
                {/* Body */}
                <div style={{padding:'16px 18px 18px'}}>
                  {agent.points.map((pt,pi)=>(
                    <div key={pi} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:pi<agent.points.length-1?10:0}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:agent.color,flexShrink:0,marginTop:5}}/>
                      <span style={{fontSize:12,color:TEXT2,lineHeight:1.55}}>{pt}</span>
                    </div>
                  ))}
                  <div style={{marginTop:16,display:'flex',alignItems:'center',gap:4,color:agent.color,fontSize:11,fontWeight:600}}>
                    <span>Launch agent</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </div>
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
          PRICING — EVOX SERVICE PACKAGES
      ══════════════════════════════════════════════════ */}
      <section id="pricing" style={{padding:'96px 40px',background:'#0a0908'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>

          <FadeIn style={{textAlign:'center',marginBottom:48}}>
            <SBadge>Packages & Rates</SBadge>
            <h2 style={{fontSize:'clamp(22px,3vw,40px)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.2,fontFamily:"'Syne','Inter',sans-serif",color:TEXT,marginBottom:14}}>
              Choose your <span style={goldGrad}>production tier</span>
            </h2>
            <p style={{fontSize:15,color:TEXT2,maxWidth:480,margin:'0 auto',lineHeight:1.65}}>
              Start with strategy and scale up to full paid-ad deployment. Each tier builds on the previous.
            </p>
          </FadeIn>

          {/* Package cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,alignItems:'start'}}>
            {PLANS.map((plan,i)=>(
              <FadeIn key={plan.key} delay={i*0.07}>
                <div style={{
                  background:plan.popular?'linear-gradient(160deg,#221d10,#1c1a13)':CARD,
                  border:`1px solid ${plan.popular?'rgba(200,151,62,0.5)':BORDER}`,
                  borderRadius:20,padding:'28px 24px',position:'relative',
                  boxShadow:plan.popular?'0 0 48px rgba(200,151,62,0.1)':'none',
                  height:'100%',boxSizing:'border-box',
                }}>
                  {plan.popular&&(
                    <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#d4a853,#b8803a)',color:'#0e0c09',fontSize:10,fontWeight:800,padding:'4px 16px',borderRadius:100,letterSpacing:'0.08em',whiteSpace:'nowrap'}}>
                      MOST POPULAR
                    </div>
                  )}

                  <div style={{fontSize:10,fontWeight:800,color:plan.popular?GOLD:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>{plan.label}</div>
                  <div style={{fontSize:30,fontWeight:800,letterSpacing:'-0.03em',color:TEXT,fontFamily:"'Syne','Inter',sans-serif",marginBottom:4}}>{plan.price}</div>
                  <div style={{fontSize:11,color:TEXT3,marginBottom:10}}>{plan.priceNote}</div>
                  <p style={{fontSize:12,color:TEXT2,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${BORDER}`,lineHeight:1.55}}>{plan.tagline}</p>

                  <button
                    onClick={()=> startWizardWithPlan(plan.key)}
                    style={{
                      width:'100%',padding:'12px',marginBottom:20,
                      background:plan.key==='free'?'linear-gradient(135deg,#d4a853,#b8803a)':plan.ctaDark?'linear-gradient(135deg,#d4a853,#b8803a)':'rgba(255,255,255,0.06)',
                      border:plan.ctaDark||plan.key==='free'?'none':`1px solid ${BORDER}`,
                      borderRadius:10,color:plan.ctaDark||plan.key==='free'?'#0e0c09':TEXT2,
                      fontSize:13,fontWeight:700,cursor:'pointer',
                      fontFamily:"'Inter',sans-serif",transition:'all 0.2s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
                  >{plan.cta}</button>

                  <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:16}}>
                    <div style={{fontSize:10,fontWeight:800,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>WHAT'S INCLUDED</div>
                    {plan.features.map((f,fi)=>{
                      const featureKey = `${plan.key}-${fi}`
                      const isOpen = expandedFeature === featureKey
                      return (
                        <div key={f.text} style={{marginBottom:6,borderRadius:8,border:`1px solid ${isOpen?(plan.popular?'rgba(200,151,62,0.35)':BORDER):BORDER}`,overflow:'hidden',transition:'border-color 0.2s',background:isOpen?'rgba(255,255,255,0.03)':'transparent'}}>
                          {/* Row — always visible */}
                          <button
                            onClick={()=>setExpandedFeature(isOpen ? null : featureKey)}
                            style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}
                          >
                            <div style={{color:plan.popular?GOLD:TEXT3,flexShrink:0}}>{f.icon}</div>
                            <span style={{fontSize:12,color:isOpen?(plan.popular?GOLD:TEXT):TEXT2,lineHeight:1.5,flex:1,fontWeight:isOpen?600:400,transition:'color 0.2s'}}>{f.text}</span>
                            <span style={{color:TEXT3,fontSize:14,flexShrink:0,transform:isOpen?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.25s',lineHeight:1}}>›</span>
                          </button>
                          {/* Expanded description */}
                          {isOpen && (
                            <div style={{padding:'0 10px 10px 32px',fontSize:11,color:TEXT2,lineHeight:1.65,borderTop:`1px solid ${BORDER}`}}>
                              <div style={{paddingTop:8}}>{f.desc}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Upsell ladder */}
          <FadeIn delay={0.2} style={{marginTop:32}}>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>
                <span style={{fontWeight:700,color:TEXT}}>Build up as you grow.</span>{' '}Every higher tier includes all deliverables from the tier below.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                {['Free','Package A','Package B','Package C'].map((t,i,arr)=>(
                  <React.Fragment key={t}>
                    <span style={{padding:'4px 12px',borderRadius:100,fontSize:11,fontWeight:700,background:t==='Package B'?'rgba(200,151,62,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${t==='Package B'?GBORDER:BORDER}`,color:t==='Package B'?GOLD:TEXT2}}>{t}</span>
                    {i<arr.length-1&&<span style={{color:TEXT3,fontSize:14}}>›</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </FadeIn>
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
            <button onClick={openAssessment} style={goldPill}
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

      {/* ── Plan Selector Modal ── */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            key="plan-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModule(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              key="plan-panel"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#16140f',
                border: `1px solid ${activeModule.color}40`,
                borderRadius: 24,
                padding: '36px 32px',
                maxWidth: 540,
                width: '100%',
                boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${activeModule.color}20`,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `${activeModule.color}18`,
                  border: `1.5px solid ${activeModule.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeModule.color,
                }}>
                  {activeModule.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f0ebe0', margin: 0, letterSpacing: '-0.02em' }}>
                    {activeModule.title}
                  </h3>
                  <p style={{ fontSize: 12, color: 'rgba(240,235,224,0.45)', margin: '4px 0 0' }}>
                    Select a plan to get started
                  </p>
                </div>
                <button
                  onClick={() => setActiveModule(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(240,235,224,0.35)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}
                >
                  ×
                </button>
              </div>

              <div style={{ height: 1, background: `${activeModule.color}20`, margin: '20px 0' }} />

              {/* Plan options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PLAN_OPTIONS.map(plan => (
                  <motion.button
                    key={plan.key}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveModule(null)
                      if (plan.path) {
                        navigate(plan.path)
                      } else {
                        navigate(`/campaign/${activeModule.type}`)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px',
                      background: plan.key === 'package-b'
                        ? 'rgba(200,151,62,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border: plan.key === 'package-b'
                        ? '1px solid rgba(200,151,62,0.35)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14, cursor: 'pointer',
                      fontFamily: "'Inter',sans-serif",
                      textAlign: 'left', width: '100%',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `${activeModule.color}55`
                      e.currentTarget.style.background = `${activeModule.color}0d`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = plan.key === 'package-b' ? 'rgba(200,151,62,0.35)' : 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.background = plan.key === 'package-b' ? 'rgba(200,151,62,0.08)' : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f0ebe0' }}>{plan.label}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                          padding: '2px 7px', borderRadius: 100,
                          background: `${plan.tagColor}18`, color: plan.tagColor,
                          border: `1px solid ${plan.tagColor}30`,
                        }}>{plan.tag}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(240,235,224,0.45)', lineHeight: 1.5 }}>
                        {plan.desc}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: plan.tagColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {plan.cta} →
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Assessment Wizard Modal ── */}
        {wizardOpen && (
          <motion.div
            key="wizard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWizard}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              key="wizard-panel"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 680,
                maxHeight: '90vh', overflowY: 'auto',
                borderRadius: 24,
              }}
            >
              {/* ══ PHASE 1: Plan Selection ══ */}
              {wizardPhase === 'plan' && (
                <motion.div key="plan-select" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.35}}
                  style={{background:'linear-gradient(160deg,#161410,#131210)',border:`1px solid ${GBORDER}`,borderRadius:24,padding:'32px 28px',position:'relative'}}>
                  <button onClick={closeWizard} style={{position:'absolute',top:16,right:20,background:'none',border:'none',color:TEXT3,cursor:'pointer',fontSize:18,lineHeight:1,padding:4}}>✕</button>
                  <div style={{textAlign:'center',marginBottom:28}}>
                    <div style={{fontSize:11,fontWeight:700,color:GOLD,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Step 1 of 3</div>
                    <h2 style={{fontSize:'clamp(18px,2vw,24px)',fontWeight:800,color:TEXT,fontFamily:"'Syne','Inter',sans-serif",margin:'0 0 6px',lineHeight:1.3}}>Choose your <span style={goldGrad}>production tier</span></h2>
                    <p style={{fontSize:13,color:TEXT2,margin:0}}>Each tier builds on the previous — start free, scale up anytime.</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14,alignItems:'start'}}>
                    {PLANS.map((plan,i)=>(
                      <div key={plan.key} style={{
                        background:plan.popular?'linear-gradient(160deg,#221d10,#1c1a13)':CARD,
                        border:`1px solid ${plan.popular?'rgba(200,151,62,0.5)':BORDER}`,
                        borderRadius:18,padding:'22px 18px',position:'relative',
                        boxShadow:plan.popular?'0 0 40px rgba(200,151,62,0.1)':'none',
                        boxSizing:'border-box',height:'100%',
                      }}>
                        {plan.popular && (
                          <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#d4a853,#b8803a)',color:'#0e0c09',fontSize:10,fontWeight:800,padding:'4px 14px',borderRadius:100,letterSpacing:'0.08em',whiteSpace:'nowrap'}}>MOST POPULAR</div>
                        )}
                        <div style={{fontSize:10,fontWeight:800,color:plan.popular?GOLD:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8}}>{plan.label}</div>
                        <div style={{fontSize:26,fontWeight:800,letterSpacing:'-0.03em',color:TEXT,fontFamily:"'Syne','Inter',sans-serif",marginBottom:3}}>{plan.price}</div>
                        <div style={{fontSize:11,color:TEXT3,marginBottom:8}}>{plan.priceNote}</div>
                        <p style={{fontSize:12,color:TEXT2,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${BORDER}`,lineHeight:1.55}}>{plan.tagline}</p>
                        {/* CTA button */}
                        <button onClick={()=>{
                          try { localStorage.setItem('evoke_selected_package', plan.key) } catch {}
                          navigate('/brand-kb')
                        }} style={{
                          width:'100%',padding:'11px',marginBottom:16,
                          background:plan.key==='free'?'linear-gradient(135deg,#d4a853,#b8803a)':plan.ctaDark?'linear-gradient(135deg,#d4a853,#b8803a)':'rgba(255,255,255,0.06)',
                          border:plan.ctaDark||plan.key==='free'?'none':`1px solid ${BORDER}`,
                          borderRadius:10,color:plan.ctaDark||plan.key==='free'?'#0e0c09':TEXT2,
                          fontSize:13,fontWeight:700,cursor:'pointer',
                          fontFamily:"'Inter',sans-serif",transition:'all 0.2s',
                        }}
                          onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)'}}
                          onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
                        >{plan.key==='free'?'Start Free →':plan.cta+' →'}</button>
                        {/* Features list */}
                        <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12}}>
                          <div style={{fontSize:10,fontWeight:800,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>WHAT'S INCLUDED</div>
                          {plan.features.map((f,fi)=>{
                            const fKey=`wiz-${plan.key}-${fi}`
                            const isOpen=expandedFeature===fKey
                            return (
                              <div key={f.text} style={{marginBottom:5,borderRadius:7,border:`1px solid ${isOpen?(plan.popular?'rgba(200,151,62,0.35)':BORDER):BORDER}`,overflow:'hidden',background:isOpen?'rgba(255,255,255,0.03)':'transparent'}}>
                                <button onClick={()=>setExpandedFeature(isOpen?null:fKey)}
                                  style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 9px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                                  <div style={{color:plan.popular?GOLD:TEXT3,flexShrink:0}}>{f.icon}</div>
                                  <span style={{fontSize:11,color:isOpen?(plan.popular?GOLD:TEXT):TEXT2,lineHeight:1.5,flex:1,fontWeight:isOpen?600:400,transition:'color 0.2s'}}>{f.text}</span>
                                  <span style={{color:TEXT3,fontSize:13,flexShrink:0,transform:isOpen?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.25s',lineHeight:1}}>›</span>
                                </button>
                                {isOpen&&(
                                  <div style={{padding:'0 9px 9px 29px',fontSize:11,color:TEXT2,lineHeight:1.65,borderTop:`1px solid ${BORDER}`}}>
                                    <div style={{paddingTop:7}}>{f.desc}</div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ══ PHASE 2: Workflow Questions ══ */}
              {wizardPhase === 'questions' && !wizardDone && (()=>{
                const step = WIZARD_STEPS[wizardStep]
                const totalSteps = WIZARD_STEPS.length
                const selectedArr = Array.isArray(wizardAnswers[step.key]) ? wizardAnswers[step.key] : []
                const singleSel   = wizardAnswers[step.key]
                return (
                  <motion.div key={wizardStep} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.35}}
                    style={{background:'linear-gradient(160deg,#161410,#131210)',border:`1px solid ${GBORDER}`,borderRadius:24,padding:'40px 36px',position:'relative'}}>

                    {/* Progress */}
                    <div style={{marginBottom:28}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <span style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>
                          Step 2 of 3 · {WORKFLOW[step.frameworkIdx]?.label ?? step.key} · {wizardStep+1}/{totalSteps}
                        </span>
                        <button onClick={closeWizard} style={{background:'none',border:'none',color:TEXT3,cursor:'pointer',fontSize:18,lineHeight:1,padding:4}}>✕</button>
                      </div>
                      {/* Workflow steps track */}
                      <div style={{display:'flex',gap:6,marginBottom:12}}>
                        {WORKFLOW.map((w,i)=>(
                          <div key={w.label} style={{flex:1,height:3,borderRadius:3,background: i<=wizardStep?GOLD:'rgba(200,151,62,0.15)',transition:'background 0.3s'}}/>
                        ))}
                      </div>
                      {/* Workflow labels */}
                      <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:4}}>
                        {WORKFLOW.map((w,i)=>(
                          <div key={w.label} style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity: i===wizardStep?1:0.4,transition:'opacity 0.3s'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background: i<wizardStep?GOLD:i===wizardStep?'rgba(200,151,62,0.25)':'rgba(255,255,255,0.05)',border:`1.5px solid ${i<=wizardStep?GOLD:'rgba(255,255,255,0.08)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              {i<wizardStep ? <Check size={12} color="#0e0c09"/> : <span style={{fontSize:8,color:i===wizardStep?GOLD:TEXT3,fontWeight:700}}>{i+1}</span>}
                            </div>
                            <span style={{fontSize:8,color:i===wizardStep?GOLD:TEXT3,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{w.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{marginBottom:8,fontSize:'clamp(16px,1.6vw,22px)',fontWeight:700,color:TEXT,fontFamily:"'Syne','Inter',sans-serif",lineHeight:1.3}}>{step.question}</div>
                    <div style={{fontSize:13,color:TEXT2,marginBottom:28,lineHeight:1.6}}>{step.sub}</div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
                      {step.options.map(opt=>{
                        const isSelected = step.multiSelect ? selectedArr.includes(opt.value) : singleSel === opt.value
                        return (
                          <button key={opt.value} onClick={()=>handleWizardSelect(opt.value)}
                            style={{background:isSelected?'rgba(200,151,62,0.12)':CARD,border:`2px solid ${isSelected?GOLD:GBORDER}`,borderRadius:14,padding:'18px 16px',cursor:'pointer',textAlign:'left',transition:'all 0.18s',display:'flex',flexDirection:'column',gap:6,position:'relative'}}
                            onMouseEnter={e=>{if(!isSelected){e.currentTarget.style.borderColor='rgba(200,151,62,0.55)';e.currentTarget.style.background='rgba(200,151,62,0.05)';e.currentTarget.style.transform='translateY(-2px)'}}}
                            onMouseLeave={e=>{if(!isSelected){e.currentTarget.style.borderColor=GBORDER;e.currentTarget.style.background=CARD;e.currentTarget.style.transform='translateY(0)'}}}>
                            {step.multiSelect && (
                              <div style={{position:'absolute',top:10,right:10,width:18,height:18,borderRadius:'50%',background:isSelected?'linear-gradient(135deg,#d4a853,#b8803a)':'rgba(255,255,255,0.06)',border:`1.5px solid ${isSelected?GOLD:'rgba(255,255,255,0.12)'}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s'}}>
                                {isSelected && <Check size={10} color="#0e0c09"/>}
                              </div>
                            )}
                            <span style={{fontSize:22}}>{opt.icon}</span>
                            <span style={{fontSize:13,fontWeight:700,color:isSelected?GOLD:TEXT,transition:'color 0.18s'}}>{opt.label}</span>
                            <span style={{fontSize:11,color:TEXT2,lineHeight:1.5}}>{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom budget input */}
                    {step.hasCustomBudget && singleSel === 'custom' && (
                      <div style={{marginTop:14}}>
                        <div style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.05)',border:`1.5px solid ${GOLD}`,borderRadius:12,overflow:'hidden'}}>
                          <span style={{padding:'0 14px',fontSize:16,fontWeight:700,color:GOLD,borderRight:`1px solid ${GBORDER}`,lineHeight:'50px'}}>$</span>
                          <input autoFocus id="wiz-custom-budget" type="text" placeholder="Enter your budget e.g. 5,000"
                            value={wizardAnswers['customBudgetText']||''}
                            onChange={e=>setWizardAnswers(prev=>({...prev,customBudgetText:e.target.value}))}
                            onKeyDown={e=>{if(e.key==='Enter'&&(wizardAnswers['customBudgetText']||'').trim()){if(wizardStep<WIZARD_STEPS.length-1)setWizardStep(s=>s+1);else{setWizardDone(true);goToConnect(wizardAnswers)}}}}
                            style={{flex:1,background:'transparent',border:'none',outline:'none',padding:'12px 14px',fontSize:15,fontWeight:600,color:TEXT,fontFamily:"'Inter',sans-serif"}}/>
                          <span style={{padding:'0 14px',fontSize:12,color:TEXT3,whiteSpace:'nowrap'}}>/&nbsp;mo</span>
                        </div>
                        <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
                          <button disabled={!(wizardAnswers['customBudgetText']||'').trim()}
                            onClick={()=>{if(wizardStep<WIZARD_STEPS.length-1)setWizardStep(s=>s+1);else{setWizardDone(true);goToConnect(wizardAnswers)}}}
                            style={{padding:'11px 28px',borderRadius:100,background:(wizardAnswers['customBudgetText']||'').trim()?'linear-gradient(135deg,#d4a853,#b8803a)':'rgba(200,151,62,0.15)',border:'none',color:(wizardAnswers['customBudgetText']||'').trim()?'#0e0c09':TEXT3,fontSize:13,fontWeight:700,cursor:(wizardAnswers['customBudgetText']||'').trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',gap:7,transition:'all 0.2s'}}>
                            Continue <ArrowRight size={14}/>
                          </button>
                        </div>
                      </div>
                    )}

                    {step.multiSelect && (
                      <div style={{marginTop:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:11,color:TEXT3}}>{selectedArr.length===0?'Select at least one option':`${selectedArr.length} selected`}</span>
                        <button disabled={selectedArr.length===0}
                          onClick={()=>{
                            if(wizardStep<WIZARD_STEPS.length-1){setWizardStep(s=>s+1)}
                            else{setWizardDone(true);goToConnect(wizardAnswers)}
                          }}
                          style={{padding:'11px 28px',borderRadius:100,background:selectedArr.length>0?'linear-gradient(135deg,#d4a853,#b8803a)':'rgba(200,151,62,0.15)',border:'none',color:selectedArr.length>0?'#0e0c09':TEXT3,fontSize:13,fontWeight:700,cursor:selectedArr.length>0?'pointer':'not-allowed',display:'flex',alignItems:'center',gap:7,transition:'all 0.2s'}}
                          onMouseEnter={e=>{if(selectedArr.length>0){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(200,151,62,0.35)'}}}
                          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                          {wizardStep===WIZARD_STEPS.length-1?'Finish':'Continue'} <ArrowRight size={14}/>
                        </button>
                      </div>
                    )}

                    <div style={{marginTop:16,display:'flex',alignItems:'center',gap:12}}>
                      <button onClick={()=>wizardStep>0?setWizardStep(s=>s-1):setWizardPhase('plan')}
                        style={{background:'none',border:'none',color:TEXT2,cursor:'pointer',fontSize:12,padding:0,display:'inline-flex',alignItems:'center',gap:4}}
                        onMouseEnter={e=>e.currentTarget.style.color=TEXT}
                        onMouseLeave={e=>e.currentTarget.style.color=TEXT2}>
                        ← Back
                      </button>
                    </div>
                  </motion.div>
                )
              })()}

              {/* ══ PHASE: Ready to Go ══ */}
              {wizardPhase === 'ready' && (
                <motion.div key="ready" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{duration:0.35}}
                  style={{background:'linear-gradient(160deg,#161410,#131210)',border:`1px solid ${GBORDER}`,borderRadius:24,padding:'48px 36px',position:'relative',textAlign:'center'}}>
                  <button onClick={closeWizard} style={{position:'absolute',top:16,right:20,background:'none',border:'none',color:TEXT3,cursor:'pointer',fontSize:18,lineHeight:1,padding:4}}>✕</button>

                  {/* Success icon */}
                  <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(16,185,129,0.15)',border:'2px solid rgba(16,185,129,0.4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',boxShadow:'0 0 32px rgba(16,185,129,0.2)'}}>
                    <Check size={32} color="#10b981"/>
                  </div>

                  <div style={{fontSize:11,fontWeight:800,color:GOLD,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>Assessment Complete</div>
                  <h2 style={{fontSize:'clamp(20px,2.5vw,28px)',fontWeight:900,color:TEXT,fontFamily:"'Syne','Inter',sans-serif",marginBottom:12,letterSpacing:'-0.02em'}}>
                    You're ready to go! 🎯
                  </h2>
                  <p style={{fontSize:14,color:TEXT2,maxWidth:400,margin:'0 auto 32px',lineHeight:1.7}}>
                    We already have your preferences saved. Your AI CMO is personalised and ready — no need to answer questions again.
                  </p>

                  {/* Plan label */}
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',background:'rgba(200,151,62,0.1)',border:`1px solid ${GBORDER}`,borderRadius:100,fontSize:12,fontWeight:700,color:GOLD,marginBottom:28}}>
                    {wizardPlan === 'free' ? 'Free Plan' : wizardPlan === 'package-a' ? 'Package A' : wizardPlan === 'package-b' ? 'Package B' : 'Package C'} selected
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:12,alignItems:'center'}}>
                    <button
                      onClick={()=>{ setWizardOpen(false); navigate('/brand-kb') }}
                      style={{padding:'14px 40px',background:'linear-gradient(135deg,#d4a853,#b8803a)',border:'none',borderRadius:100,color:'#0e0c09',fontSize:15,fontWeight:800,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(200,151,62,0.4)'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                      Launch {wizardPlan === 'free' ? 'Free Plan' : wizardPlan === 'package-a' ? 'Package A' : wizardPlan === 'package-b' ? 'Package B' : 'Package C'} <ArrowRight size={16}/>
                    </button>
                    <button
                      onClick={()=>{ setWizardDone(false); setWizardPhase('questions'); setWizardStep(0); setWizardAnswers({}); try{localStorage.removeItem('evoke_assessment')}catch{} }}
                      style={{background:'none',border:'none',color:TEXT3,cursor:'pointer',fontSize:12,fontWeight:600,padding:'4px 0'}}
                      onMouseEnter={e=>e.currentTarget.style.color=TEXT2}
                      onMouseLeave={e=>e.currentTarget.style.color=TEXT3}>
                      Retake Assessment
                    </button>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
