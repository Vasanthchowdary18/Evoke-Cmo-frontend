import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Check, ChevronRight, Play,
  Target, Lightbulb, DollarSign, Rocket, BarChart2, TrendingUp,
  Image, Film, Monitor, Megaphone, Share2, Layers, Tv2,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

/* ─── animation ─── */
const fadeUp = { hidden:{opacity:0,y:24}, visible:{opacity:1,y:0,transition:{duration:0.55,ease:[0.22,1,0.36,1]}} }
function FadeIn({children,delay=0,style={}}) {
  const ref = useRef(null)
  const inView = useInView(ref,{once:true,margin:'-60px'})
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView?'visible':'hidden'}
      variants={fadeUp}
      transition={{delay}}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ─── design tokens ─── */
const BG      = '#0e0c09'
const BG2     = '#0b0a07'
const CARD    = '#1c1a13'
const GOLD    = '#c8973e'
const GBORDER = 'rgba(200,151,62,0.22)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const BORDER  = 'rgba(255,255,255,0.07)'

const goldGrad = {
  background:'linear-gradient(135deg,#d4a853,#b8803a)',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
}
const goldPill = {
  display:'inline-flex', alignItems:'center', gap:8,
  padding:'13px 30px',
  background:'linear-gradient(135deg,#d4a853 0%,#b8803a 100%)',
  color:'#0e0c09', border:'none', borderRadius:100,
  fontSize:15, fontWeight:700, cursor:'pointer', transition:'all 0.2s',
  fontFamily:"'Inter',sans-serif",
}
const outlinePill = {
  display:'inline-flex', alignItems:'center', gap:8,
  padding:'13px 30px', background:'transparent', color:TEXT,
  border:`1px solid rgba(240,235,224,0.22)`, borderRadius:100,
  fontSize:15, fontWeight:500, cursor:'pointer', transition:'all 0.2s',
  fontFamily:"'Inter',sans-serif",
}

/* ─── CMO workflow steps ─── */
const WORKFLOW = [
  { label:'Objectives', icon:<Target size={20}/>,    desc:'Define clear marketing goals aligned to revenue targets'       },
  { label:'Strategies', icon:<Lightbulb size={20}/>, desc:'Build channel strategies and messaging frameworks per segment'  },
  { label:'Budget',     icon:<DollarSign size={20}/>,desc:'Allocate spend across channels based on ROI benchmarks'         },
  { label:'Execution',  icon:<Rocket size={20}/>,    desc:'Deploy campaigns across platforms with precision and speed'     },
  { label:'Analytics',  icon:<BarChart2 size={20}/>, desc:'Track KPIs in real-time and surface actionable insights'        },
  { label:'Optimization',icon:<TrendingUp size={20}/>,desc:'Continuously refine performance through AI-driven iteration'   },
]

/* ─── service packages ─── */
const PACKAGES = [
  {
    key:'free',
    label:'FREE',
    tagline:'Start your CMO journey',
    price:'$0',
    priceNote:'No credit card required',
    popular:false,
    color:TEXT3,
    features:[
      { icon:<Target size={14}/>,     text:'Objective & Strategy Development' },
      { icon:<Megaphone size={14}/>,  text:'New Leads / Client Retention Planning' },
      { icon:<Layers size={14}/>,     text:'Content Creation Framework' },
    ],
    cta:'Get Started Free',
    ctaDark:false,
    description:'Launch your marketing foundation with a clear strategy and content plan.',
  },
  {
    key:'package-a',
    label:'PACKAGE A',
    tagline:'Elevate your visual brand',
    price:'Contact Us',
    priceNote:'Custom pricing for your brand',
    popular:false,
    color:GOLD,
    features:[
      { icon:<Target size={14}/>,     text:'Everything in Free' },
      { icon:<Image size={14}/>,      text:'Image to Angles — Multi-angle product photography' },
      { icon:<Image size={14}/>,      text:'Lifestyle Images — On-brand scene photography' },
      { icon:<Monitor size={14}/>,    text:'Banner Creation — Ad-ready static banners' },
      { icon:<Share2 size={14}/>,     text:'Posting on Social Media — Managed scheduling' },
    ],
    cta:'Choose Package A',
    ctaDark:false,
    description:'Add visual content production — from angles to lifestyle imagery — plus social posting.',
  },
  {
    key:'package-b',
    label:'PACKAGE B',
    tagline:'Go full motion & 30-day content',
    price:'Contact Us',
    priceNote:'Custom pricing for your brand',
    popular:true,
    color:GOLD,
    features:[
      { icon:<Target size={14}/>,     text:'Everything in Package A' },
      { icon:<Film size={14}/>,       text:'Lifestyle Video — Brand story short-form video' },
      { icon:<Tv2 size={14}/>,        text:'360° Product Video — Immersive product showcase' },
      { icon:<Layers size={14}/>,     text:'30 Days Content — Full month of ready-to-post assets' },
    ],
    cta:'Choose Package B',
    ctaDark:true,
    description:'Add video production and a full 30-day content calendar to your visual suite.',
  },
  {
    key:'package-c',
    label:'PACKAGE C',
    tagline:'Deploy paid ads at scale',
    price:'Contact Us',
    priceNote:'Custom pricing for your brand',
    popular:false,
    color:'#a78bfa',
    features:[
      { icon:<Target size={14}/>,     text:'Everything in Package B' },
      { icon:<Layers size={14}/>,     text:'3D Images — Premium product renders' },
      { icon:<Monitor size={14}/>,    text:'Ads Creation — Conversion-optimised ad creatives' },
      { icon:<Share2 size={14}/>,     text:'Ads Manager Connect — FB & Google campaigns' },
      { icon:<Target size={14}/>,     text:'Target Audience Selection — Precision segmentation' },
      { icon:<Rocket size={14}/>,     text:'Deploy Ads — Full campaign launch & management' },
    ],
    cta:'Choose Package C',
    ctaDark:false,
    description:'The complete paid acquisition engine — 3D assets, full ad management, and live campaign deployment.',
  },
]

/* ─── small helper badge ─── */
function SBadge({children}) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'5px 14px', borderRadius:100,
      border:`1px solid ${GBORDER}`,
      background:'rgba(200,151,62,0.07)',
      fontSize:11, fontWeight:700, color:GOLD,
      letterSpacing:'0.1em', textTransform:'uppercase',
      marginBottom:20,
    }}>{children}</div>
  )
}

/* ─── main page ─── */
export default function EvoxServices() {
  const navigate = useNavigate()
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <div style={{background:BG, minHeight:'100vh', color:TEXT, fontFamily:"'Inter',sans-serif"}}>
      <Navbar />

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        padding:'120px 40px 80px',
        background:`radial-gradient(ellipse 70% 50% at 50% -10%, rgba(200,151,62,0.12) 0%, transparent 70%), ${BG}`,
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* glow orbs */}
        <div style={{position:'absolute',top:'10%',left:'15%',width:400,height:400,background:'radial-gradient(circle,rgba(200,151,62,0.06) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'20%',right:'10%',width:300,height:300,background:'radial-gradient(circle,rgba(200,151,62,0.04) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>

        <div style={{maxWidth:800, margin:'0 auto', position:'relative', zIndex:1}}>
          <FadeIn>
            <SBadge>EVOX C-Suite Platform</SBadge>
            <h1 style={{
              fontSize:'clamp(32px,5vw,64px)', fontWeight:800,
              letterSpacing:'-0.03em', lineHeight:1.1,
              fontFamily:"'Syne','Inter',sans-serif", color:TEXT,
              marginBottom:20,
            }}>
              Enterprise Marketing Services<br/>
              <span style={goldGrad}>Built for CMOs</span>
            </h1>
            <p style={{fontSize:'clamp(15px,2vw,18px)', color:TEXT2, maxWidth:580, margin:'0 auto 36px', lineHeight:1.75}}>
              A complete, tiered marketing production system that takes you from
              strategy to paid ad deployment — powered by the EVOX platform and
              managed by senior creative specialists.
            </p>
            <div style={{display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center'}}>
              <button
                style={goldPill}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                onClick={()=>document.getElementById('packages')?.scrollIntoView({behavior:'smooth'})}
              >
                View Packages <ArrowRight size={16}/>
              </button>
              <button
                style={outlinePill}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>document.getElementById('video')?.scrollIntoView({behavior:'smooth'})}
              >
                <Play size={16}/> Watch Overview
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CMO WORKFLOW PIPELINE
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'80px 40px', background:BG2, overflow:'hidden'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center', marginBottom:52}}>
            <SBadge>The CMO Framework</SBadge>
            <h2 style={{fontSize:'clamp(20px,3vw,38px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.2, fontFamily:"'Syne','Inter',sans-serif", color:TEXT, marginBottom:12}}>
              From Objectives to <span style={goldGrad}>Optimization</span>
            </h2>
            <p style={{fontSize:15, color:TEXT2, maxWidth:500, margin:'0 auto', lineHeight:1.65}}>
              Every EVOX engagement follows this proven C-suite framework — ensuring
              each dollar and decision drives measurable outcomes.
            </p>
          </FadeIn>

          {/* Horizontal pipeline */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(6,1fr)',
            gap:0,
            position:'relative',
          }}>
            {/* connector line */}
            <div style={{
              position:'absolute', top:40, left:'8%', right:'8%', height:2,
              background:`linear-gradient(90deg, transparent, ${GBORDER}, ${GOLD}, ${GBORDER}, transparent)`,
              zIndex:0,
            }}/>

            {WORKFLOW.map((step, i) => (
              <FadeIn key={step.label} delay={i * 0.08}>
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  textAlign:'center', padding:'0 8px', position:'relative', zIndex:1,
                }}>
                  {/* step circle */}
                  <div style={{
                    width:80, height:80, borderRadius:'50%',
                    background: i === 0 ? `linear-gradient(135deg,${GOLD},#b8803a)` : CARD,
                    border:`2px solid ${i === 0 ? GOLD : GBORDER}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: i === 0 ? '#0e0c09' : GOLD,
                    marginBottom:16,
                    boxShadow: i === 0 ? `0 0 24px rgba(200,151,62,0.3)` : 'none',
                    transition:'all 0.3s',
                  }}>
                    {step.icon}
                  </div>
                  <div style={{fontSize:12, fontWeight:800, color:TEXT, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6}}>
                    {step.label}
                  </div>
                  <div style={{fontSize:11, color:TEXT3, lineHeight:1.55}}>
                    {step.desc}
                  </div>
                  {/* arrow connector (except last) */}
                  {i < WORKFLOW.length - 1 && (
                    <div style={{
                      position:'absolute', top:30, right:-12, zIndex:2,
                      color:GOLD, fontSize:18, fontWeight:900, lineHeight:1,
                    }}>›</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Mobile: vertical stack fallback via CSS is handled in Landing.jsx pattern */}
          <style>{`
            @media(max-width:900px){
              .workflow-grid { grid-template-columns: repeat(3,1fr) !important; }
              .workflow-connector { display: none !important; }
            }
            @media(max-width:540px){
              .workflow-grid { grid-template-columns: repeat(2,1fr) !important; }
            }
          `}</style>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES DESCRIPTION
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'80px 40px', background:BG}}>
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center'}}>
            <FadeIn>
              <SBadge>Description of Services</SBadge>
              <h2 style={{fontSize:'clamp(20px,2.8vw,36px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.2, fontFamily:"'Syne','Inter',sans-serif", color:TEXT, marginBottom:16}}>
                What EVOX Delivers for<br/>
                <span style={goldGrad}>Your C-Suite</span>
              </h2>
              <p style={{fontSize:14, color:TEXT2, lineHeight:1.8, marginBottom:20}}>
                EVOX is a full-service marketing production platform purpose-built
                for C-suite decision-makers. We combine AI-powered strategy with
                human creative expertise to produce high-converting assets — from
                foundational content to fully deployed paid advertising campaigns.
              </p>
              <p style={{fontSize:14, color:TEXT2, lineHeight:1.8, marginBottom:28}}>
                Our tiered service model lets you start with strategic foundations
                and scale up to end-to-end paid acquisition management — all within
                a single, unified platform experience.
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {[
                  'AI-powered strategy & objectives framework',
                  'Professional creative production (images, video, 3D)',
                  'Social media scheduling & channel management',
                  'Full-funnel paid advertising deployment',
                  'Real-time analytics & performance optimization',
                ].map(item => (
                  <div key={item} style={{display:'flex', alignItems:'flex-start', gap:10}}>
                    <Check size={14} color={GOLD} strokeWidth={2.5} style={{flexShrink:0, marginTop:3}}/>
                    <span style={{fontSize:13, color:TEXT2, lineHeight:1.55}}>{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              {/* Stats cards */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                {[
                  {v:'4',     l:'Service Tiers',          s:'From free strategy to full ad deployment'},
                  {v:'30+',   l:'Assets per Campaign',    s:'Images, videos, banners, and 3D renders'},
                  {v:'6',     l:'CMO Workflow Stages',    s:'Objectives through optimization'},
                  {v:'100%',  l:'Managed Service',        s:'EVOX specialists handle execution'},
                ].map((stat,i) => (
                  <div key={stat.l} style={{
                    background:CARD, border:`1px solid ${BORDER}`, borderRadius:16,
                    padding:'24px 20px', textAlign:'center',
                  }}>
                    <div style={{fontSize:32, fontWeight:800, letterSpacing:'-0.03em', ...goldGrad, fontFamily:"'Syne','Inter',sans-serif", marginBottom:6}}>
                      {stat.v}
                    </div>
                    <div style={{fontSize:12, fontWeight:700, color:TEXT, marginBottom:4}}>{stat.l}</div>
                    <div style={{fontSize:11, color:TEXT3, lineHeight:1.5}}>{stat.s}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VIDEO
      ══════════════════════════════════════════════════ */}
      <section id="video" style={{padding:'80px 40px', background:BG2}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center', marginBottom:40}}>
            <SBadge>Product Overview</SBadge>
            <h2 style={{fontSize:'clamp(20px,3vw,38px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.2, fontFamily:"'Syne','Inter',sans-serif", color:TEXT, marginBottom:12}}>
              See EVOX <span style={goldGrad}>in Action</span>
            </h2>
            <p style={{fontSize:15, color:TEXT2, maxWidth:480, margin:'0 auto', lineHeight:1.65}}>
              Watch how EVOX transforms raw brand inputs into a complete,
              multi-channel marketing engine — in minutes.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{
              position:'relative', borderRadius:20, overflow:'hidden',
              border:`1px solid ${GBORDER}`,
              boxShadow:'0 0 60px rgba(200,151,62,0.12)',
              aspectRatio:'16/9',
              background:'#111008',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {!videoPlaying ? (
                <>
                  {/* Thumbnail placeholder */}
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(135deg,#1c1a13 0%,#0e0c09 100%)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap:16,
                  }}>
                    <div style={{
                      fontSize:'clamp(24px,4vw,48px)', fontWeight:800,
                      fontFamily:"'Syne','Inter',sans-serif",
                      ...goldGrad, letterSpacing:'-0.03em', marginBottom:8,
                    }}>
                      EVOX C-Suite Platform
                    </div>
                    <div style={{fontSize:14, color:TEXT3}}>Product walkthrough — coming soon</div>
                  </div>
                  {/* Play button overlay */}
                  <button
                    onClick={()=>setVideoPlaying(true)}
                    style={{
                      position:'relative', zIndex:2,
                      width:80, height:80, borderRadius:'50%',
                      background:'linear-gradient(135deg,#d4a853,#b8803a)',
                      border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 0 40px rgba(200,151,62,0.4)',
                      transition:'all 0.2s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow='0 0 60px rgba(200,151,62,0.5)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 40px rgba(200,151,62,0.4)'}}
                  >
                    <Play size={28} color="#0e0c09" fill="#0e0c09"/>
                  </button>
                </>
              ) : (
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center', background:CARD,
                  fontSize:14, color:TEXT3,
                }}>
                  Video player — add your video URL here
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PACKAGES
      ══════════════════════════════════════════════════ */}
      <section id="packages" style={{padding:'96px 40px', background:BG}}>
        <div style={{maxWidth:1300, margin:'0 auto'}}>

          <FadeIn style={{textAlign:'center', marginBottom:52}}>
            <SBadge>Packages & Rates</SBadge>
            <h2 style={{fontSize:'clamp(22px,3vw,42px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.2, fontFamily:"'Syne','Inter',sans-serif", color:TEXT, marginBottom:14}}>
              Choose your <span style={goldGrad}>production tier</span>
            </h2>
            <p style={{fontSize:15, color:TEXT2, maxWidth:520, margin:'0 auto', lineHeight:1.65}}>
              Start with strategy and scale up to full paid-ad deployment.
              Each tier builds on the previous — upgrade anytime.
            </p>
          </FadeIn>

          {/* Package tier cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, alignItems:'start'}}>
            {PACKAGES.map((pkg, i) => (
              <FadeIn key={pkg.key} delay={i * 0.08}>
                <div style={{
                  background: pkg.popular ? 'linear-gradient(160deg,#221d10,#1c1a13)' : CARD,
                  border:`1px solid ${pkg.popular ? 'rgba(200,151,62,0.5)' : BORDER}`,
                  borderRadius:20, padding:'28px 24px', position:'relative',
                  boxShadow: pkg.popular ? '0 0 48px rgba(200,151,62,0.1)' : 'none',
                  height:'100%', boxSizing:'border-box',
                }}>

                  {/* Popular badge */}
                  {pkg.popular && (
                    <div style={{
                      position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                      background:'linear-gradient(135deg,#d4a853,#b8803a)',
                      color:'#0e0c09', fontSize:10, fontWeight:800,
                      padding:'4px 16px', borderRadius:100,
                      letterSpacing:'0.08em', whiteSpace:'nowrap',
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  {/* Tier label */}
                  <div style={{fontSize:10, fontWeight:800, color:pkg.color, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10}}>
                    {pkg.label}
                  </div>

                  {/* Price */}
                  <div style={{fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:TEXT, fontFamily:"'Syne','Inter',sans-serif", marginBottom:4}}>
                    {pkg.price}
                  </div>
                  <div style={{fontSize:11, color:TEXT3, marginBottom:10}}>{pkg.priceNote}</div>

                  {/* Tagline */}
                  <p style={{fontSize:13, color:TEXT2, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${BORDER}`, lineHeight:1.55}}>
                    {pkg.description}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={()=>window.open('mailto:hello@evokecmo.com','_blank')}
                    style={{
                      width:'100%', padding:'12px', marginBottom:20,
                      background: pkg.ctaDark ? 'linear-gradient(135deg,#d4a853,#b8803a)' : 'rgba(255,255,255,0.06)',
                      border: pkg.ctaDark ? 'none' : `1px solid ${BORDER}`,
                      borderRadius:10, color: pkg.ctaDark ? '#0e0c09' : TEXT2,
                      fontSize:13, fontWeight:700, cursor:'pointer',
                      fontFamily:"'Inter',sans-serif", transition:'all 0.2s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
                  >
                    {pkg.cta}
                  </button>

                  {/* Features */}
                  <div style={{borderTop:`1px solid ${BORDER}`, paddingTop:16}}>
                    <div style={{fontSize:10, fontWeight:800, color:TEXT3, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12}}>
                      WHAT'S INCLUDED
                    </div>
                    {pkg.features.map(f => (
                      <div key={f.text} style={{display:'flex', alignItems:'flex-start', gap:10, marginBottom:10}}>
                        <div style={{color:pkg.popular ? GOLD : TEXT3, flexShrink:0, marginTop:1}}>
                          {f.icon}
                        </div>
                        <span style={{fontSize:12, color:TEXT2, lineHeight:1.55}}>{f.text}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </FadeIn>
            ))}
          </div>

          {/* Upsell ladder visual */}
          <FadeIn delay={0.2} style={{marginTop:40}}>
            <div style={{
              background:CARD, border:`1px solid ${BORDER}`, borderRadius:16,
              padding:'24px 28px', display:'flex', alignItems:'center',
              justifyContent:'space-between', flexWrap:'wrap', gap:16,
            }}>
              <div style={{fontSize:13, color:TEXT2, lineHeight:1.6, maxWidth:500}}>
                <span style={{fontWeight:700, color:TEXT}}>Build up as you grow.</span>{' '}
                Every higher tier includes all deliverables from the tier below —
                so you never lose what you've already invested in.
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                {['Free','Package A','Package B','Package C'].map((t,i,arr)=>(
                  <React.Fragment key={t}>
                    <span style={{
                      padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:700,
                      background: t==='Package B' ? 'linear-gradient(135deg,rgba(200,151,62,0.2),rgba(200,151,62,0.1))' : 'rgba(255,255,255,0.05)',
                      border:`1px solid ${t==='Package B' ? GBORDER : BORDER}`,
                      color: t==='Package B' ? GOLD : TEXT2,
                    }}>{t}</span>
                    {i < arr.length-1 && <ChevronRight size={14} color={TEXT3}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section style={{padding:'96px 40px', background:BG2, textAlign:'center'}}>
        <div style={{maxWidth:600, margin:'0 auto'}}>
          <FadeIn>
            <SBadge>Get Started</SBadge>
            <h2 style={{fontSize:'clamp(22px,3.5vw,44px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.15, fontFamily:"'Syne','Inter',sans-serif", color:TEXT, marginBottom:16}}>
              Ready to run marketing<br/>
              <span style={goldGrad}>like a C-suite team?</span>
            </h2>
            <p style={{fontSize:15, color:TEXT2, lineHeight:1.7, marginBottom:36}}>
              Book a discovery call with our team. We'll map the right package
              to your objectives and get you up and running within days.
            </p>
            <div style={{display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center'}}>
              <button
                style={goldPill}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                onClick={()=>window.open('mailto:hello@evokecmo.com','_blank')}
              >
                Book a Discovery Call <ArrowRight size={16}/>
              </button>
              <button
                style={outlinePill}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>document.getElementById('packages')?.scrollIntoView({behavior:'smooth'})}
              >
                Compare Packages
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer strip */}
      <div style={{background:BG, borderTop:`1px solid ${BORDER}`, padding:'28px 40px', textAlign:'center'}}>
        <div style={{fontSize:12, color:TEXT3}}>
          © {new Date().getFullYear()} EVOX C-Suite Platform · All rights reserved ·{' '}
          <span
            style={{color:GOLD, cursor:'pointer'}}
            onClick={()=>navigate('/privacy')}
          >Privacy</span>
          {' '}·{' '}
          <span
            style={{color:GOLD, cursor:'pointer'}}
            onClick={()=>navigate('/terms')}
          >Terms</span>
        </div>
      </div>
    </div>
  )
}
