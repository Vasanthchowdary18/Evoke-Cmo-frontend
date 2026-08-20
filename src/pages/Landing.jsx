import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Check,
  Star,
  Zap,
  TrendingUp,
  Target,
  Calendar,
  Search,
  Mail,
  Users,
  BarChart2,
  Briefcase,
  Megaphone,
  ShoppingCart,
  Sparkles,
  Activity,
  Lightbulb,
  DollarSign,
  Rocket,
  Image,
  Film,
  Monitor,
  Share2,
  Layers,
  Play,
  BookOpen,
  Twitter,
  Linkedin,
  Github,
  Quote,
  Shield,
  Lock,
  UserCheck,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import OnboardingWizard from "../components/OnboardingWizard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { redirectToLogin } from "../lib/authUtils";
import { saveOnboardingData, getUserData } from "../services/userService";

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Figma CMO New colours ─── */
const BG = "#05050A"; // Figma root "cmo" frame background (1440 × 5300)
const CARD = "#0d1121";
const GOLD = "#c8973e";
const ORANGE = "#e08c35";
const GDIM = "rgba(200,151,62,0.10)";
const GBORDER = "rgba(200,151,62,0.22)";
const TEXT = "#f0ebe0";
const TEXT2 = "rgba(240,235,224,0.55)";
const TEXT3 = "rgba(240,235,224,0.32)";
const BORDER = "rgba(255,255,255,0.08)";

/* ─── shared button styles ─── */
const goldPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "13px 30px",
  background: "linear-gradient(135deg, #d4a853 0%, #b8803a 100%)",
  color: "#0e0c09",
  border: "none",
  borderRadius: 100,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
  fontFamily: "'Inter',sans-serif",
  whiteSpace: "nowrap",
};
const outlinePill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "13px 30px",
  background: "transparent",
  color: TEXT,
  border: `1px solid rgba(240,235,224,0.22)`,
  borderRadius: 100,
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
  textDecoration: "none",
  fontFamily: "'Inter',sans-serif",
  whiteSpace: "nowrap",
};

/* ─── data ─── */
const STATS = [
  { v: "$2.4M+", l: "Ad Spend Managed" },
  { v: "+34.8%", l: "Average Acquisition Increase" },
  { v: "180,000+", l: "AI Agent Execution Hours" },
  { v: "82%", l: "Production Cost Saved" },
];

/* Platform logos — PDF strip_02: 2 rows static grid */
const LOGO_ROW1 = [
  { label: "ramp", symbol: "ramp ↗" },
  { label: "HEX", symbol: "HEX" },
  { label: "Vercel", symbol: "▲ Vercel" },
  { label: "descript", symbol: "≡ descript" },
  { label: "Cash App", symbol: "$ Cash App" },
  { label: "SUPERCELL", symbol: "SUPERCELL" },
];
const LOGO_ROW2 = [
  { label: "Mercury", symbol: "⊙ MERCURY" },
  { label: "Retool", symbol: "≡ Retool" },
  { label: "remote", symbol: "R remote" },
  { label: "ARC", symbol: "⚡ ARC" },
  { label: "Raycast", symbol: "◎ Raycast" },
  { label: "runway", symbol: "® runway" },
];

/* Agent cards — PDF strip_03/04 */
const AGENTS = [
  {
    title: "Growth Strategy",
    type: "growth_strategy",
    desc: "Full GTM plan, revenue forecast, market sizing, and milestone roadmap.",
    icon: <TrendingUp size={28} />,
    color: "#c8973e",
    bg: "linear-gradient(135deg,#2a1f0a,#1c1508)",
  },
  {
    title: "Competitive Intel",
    type: "competitive_intel",
    desc: "SWOT analysis, competitor profiles, pricing analysis, and positioning.",
    icon: <Target size={28} />,
    color: "#ef4444",
    bg: "linear-gradient(135deg,#2a0a0a,#1c0808)",
  },
  {
    title: "Content Calendar",
    type: "content_calendar",
    desc: "30-day multi-platform content plan with daily post ideas and hashtags.",
    icon: <Calendar size={28} />,
    color: "#10b981",
    bg: "linear-gradient(135deg,#0a2a1a,#081c12)",
  },
  {
    title: "SEO Blog Post",
    type: "seo_blog",
    desc: "Full 1,500-word SEO-optimised blog with meta, keywords, and internal links.",
    icon: <Search size={28} />,
    color: "#3b82f6",
    bg: "linear-gradient(135deg,#0a1a2a,#08121c)",
  },
  {
    title: "Email Drip Campaign",
    type: "email_drip",
    desc: "5-email nurture sequence with subject lines, preheaders, and CTAs.",
    icon: <Mail size={28} />,
    color: "#a855f7",
    bg: "linear-gradient(135deg,#1a0a2a,#12081c)",
  },
  {
    title: "Influencer & PR Brief",
    type: "influencer",
    desc: "Influencer campaign brief, press release, and media pitch templates.",
    icon: <Users size={28} />,
    color: "#f59e0b",
    bg: "linear-gradient(135deg,#2a1f0a,#1c1508)",
  },
  {
    title: "Analytics Report",
    type: "analytics_report",
    desc: "Executive KPI summary, channel breakdown, and data-driven recommendations.",
    icon: <BarChart2 size={28} />,
    color: "#06b6d4",
    bg: "linear-gradient(135deg,#0a1f2a,#081418)",
  },
  {
    title: "Sales Enablement",
    type: "sales_enablement",
    desc: "Sales deck, elevator pitch, objection handling, and cold-call scripts.",
    icon: <Briefcase size={28} />,
    color: "#84cc16",
    bg: "linear-gradient(135deg,#0f2a0a,#0a1c08)",
  },
  {
    title: "Event Marketing",
    type: "event_full",
    desc: "Full event campaign — promotion timeline, content plan, and post-event follow-up.",
    icon: <Megaphone size={28} />,
    color: "#f97316",
    bg: "linear-gradient(135deg,#2a1208,#1c0c06)",
  },
  {
    title: "Marketplace Growth",
    type: "marketplace",
    desc: "Vendor strategy, buyer acquisition plan, and promotional campaign roadmap.",
    icon: <ShoppingCart size={28} />,
    color: "#ec4899",
    bg: "linear-gradient(135deg,#2a0a1a,#1c0812)",
  },
  {
    title: "Brand Strategy",
    type: "brand_strategy",
    desc: "Brand identity, tone of voice, messaging framework, and content pillars.",
    icon: <Sparkles size={28} />,
    color: "#8b5cf6",
    bg: "linear-gradient(135deg,#1a0a2a,#12081c)",
  },
  {
    title: "Funnel & CRO Audit",
    type: "funnel_cro",
    desc: "Top-to-bottom funnel audit, A/B test ideas, and quick-win CTA optimisations.",
    icon: <Activity size={28} />,
    color: "#14b8a6",
    bg: "linear-gradient(135deg,#0a2a28,#081c1a)",
  },
];

const PLAN_OPTIONS = [
  {
    key: "free",
    label: "Free Plan",
    tag: "FREE",
    tagColor: "#10b981",
    desc: "Try this module instantly — no payment required.",
    cta: "Try Free",
    path: null, // uses module type → /campaign/{type}
  },
  {
    key: "package-a",
    label: "Package A",
    tag: "STARTER",
    tagColor: "#3b82f6",
    desc: "Images, banners, social posting + all strategy modules.",
    cta: "Choose Package A",
    path: "/package-a",
  },
  {
    key: "package-b",
    label: "Package B",
    tag: "POPULAR",
    tagColor: "#c8973e",
    desc: "Full motion — lifestyle video, 360° product video & 30-day content.",
    cta: "Choose Package B",
    path: "/package-b",
  },
  {
    key: "package-c",
    label: "Package C",
    tag: "PREMIUM",
    tagColor: "#a855f7",
    desc: "Deploy paid ads at scale — FB & Google, managed end-to-end.",
    cta: "Choose Package C",
    path: "/package-c",
  },
];

const PLANS = [
  {
    key: "free",
    label: "FREE",
    popular: false,
    tagline: "Start with strategy — no cost, no commitment",
    price: "$0",
    priceNote: "No credit card required",
    features: [
      {
        icon: <BookOpen size={13} />,
        text: "Brand Knowledge Base Setup — Your AI CMO",
        desc: "Set up your brand profile — business identity, target audience, brand voice and goals — so your AI CMO understands your brand from day one and every recommendation is on-brand.",
      },
      {
        icon: <Target size={13} />,
        text: "Objective & Strategy Development",
        desc: "EVOX CMO works with you to define clear, measurable marketing goals — whether that's lead generation, brand awareness, or revenue growth. It builds a full GTM strategy aligned to your business objectives.",
      },
      {
        icon: <Megaphone size={13} />,
        text: "New Leads / Client Retention Planning",
        desc: "Get a custom plan for attracting new customers and keeping existing ones engaged. Includes outreach strategies, nurture sequences, and loyalty campaign frameworks tailored to your audience.",
      },
      {
        icon: <Layers size={13} />,
        text: "Content Creation Framework",
        desc: "A structured content blueprint covering your brand voice, content pillars, post formats, and publishing cadence across all channels — so every piece of content works toward your goals.",
      },
    ],
    cta: "Get Started Free",
    ctaDark: false,
  },
  {
    key: "package-a",
    label: "PACKAGE A",
    popular: false,
    tagline: "Elevate your brand with professional visuals",
    price: "Contact Us",
    priceNote: "Custom pricing for your brand",
    features: [
      {
        icon: <Check size={13} />,
        text: "Everything in Free",
        desc: "Includes all deliverables from the Free plan — Objective & Strategy Development, Leads/Retention Planning, and Content Creation Framework.",
      },
      {
        icon: <Image size={13} />,
        text: "Image to Angles — Multi-angle product shots",
        desc: "Professional AI-generated multi-angle product photography. Showcase your product from every angle with studio-quality visuals — no photoshoot required.",
      },
      {
        icon: <Image size={13} />,
        text: "Lifestyle Images — On-brand scene photography",
        desc: "Contextual lifestyle images that place your product in real-world scenes. Perfect for social media, ads, and e-commerce listings that convert.",
      },
      {
        icon: <Monitor size={13} />,
        text: "Banner Creation — Ad-ready static banners",
        desc: "Conversion-optimised static banners in all standard ad sizes (300×250, 728×90, 160×600, etc.) ready to deploy on Google Display, Meta, and LinkedIn.",
      },
      {
        icon: <Share2 size={13} />,
        text: "Posting on Social Media — Managed scheduling",
        desc: "We handle the publishing — your content is scheduled and posted across Instagram, Facebook, LinkedIn, and Twitter on your behalf at the optimal times for engagement.",
      },
    ],
    cta: "Choose Package A",
    ctaDark: false,
  },
  {
    key: "package-b",
    label: "PACKAGE B",
    popular: true,
    tagline: "Go full motion with video & 30-day content",
    price: "Contact Us",
    priceNote: "Custom pricing for your brand",
    features: [
      {
        icon: <Check size={13} />,
        text: "Everything in Package A",
        desc: "Includes all deliverables from Package A — strategy, product images, lifestyle images, banners, and managed social posting.",
      },
      {
        icon: <Film size={13} />,
        text: "Lifestyle Video — Brand story short-form video",
        desc: "A professionally crafted short-form video (15–60 seconds) that tells your brand story. Designed for Instagram Reels, TikTok, YouTube Shorts, and paid video ads.",
      },
      {
        icon: <Monitor size={13} />,
        text: "360° Product Video — Immersive product showcase",
        desc: "A full 360-degree rotating product video that lets customers see every detail. Dramatically increases purchase confidence on e-commerce and landing pages.",
      },
      {
        icon: <Layers size={13} />,
        text: "30 Days Content — Full month of ready-to-post assets",
        desc: "A complete 30-day content calendar with daily posts, captions, hashtags, and visual assets for all platforms — fully mapped to your campaign goals and brand voice.",
      },
    ],
    cta: "Choose Package B",
    ctaDark: true,
  },
  {
    key: "package-c",
    label: "PACKAGE C",
    popular: false,
    tagline: "Deploy paid ads at scale across FB & Google",
    price: "Contact Us",
    priceNote: "Custom pricing for your brand",
    features: [
      {
        icon: <Check size={13} />,
        text: "Everything in Package B",
        desc: "Includes all deliverables from Package B — strategy, images, lifestyle video, 360° product video, and 30-day content calendar.",
      },
      {
        icon: <Layers size={13} />,
        text: "3D Images — Premium product renders",
        desc: "Photorealistic 3D renders of your product in any environment or configuration. No physical samples needed — ideal for pre-launch campaigns and premium brand positioning.",
      },
      {
        icon: <Monitor size={13} />,
        text: "Ads Creation — Conversion-optimised creatives",
        desc: "Complete ad creative packages including static images, animated banners, and video ads — each designed with proven CRO principles to maximise click-through and conversion rates.",
      },
      {
        icon: <Share2 size={13} />,
        text: "Ads Manager Connect — FB & Google campaigns",
        desc: "Full integration with your Facebook Ads Manager and Google Ads account. We set up campaigns, ad sets, targeting, and bidding strategies ready for launch.",
      },
      {
        icon: <Target size={13} />,
        text: "Target Audience Selection — Precision segmentation",
        desc: "Deep audience research and segmentation — custom audiences, lookalikes, interest targeting, and retargeting lists built specifically for your product and goals.",
      },
      {
        icon: <Rocket size={13} />,
        text: "Deploy Ads — Full campaign launch & management",
        desc: "End-to-end campaign launch and ongoing management. We monitor performance daily, optimise bids, rotate creatives, and report results — so you get maximum ROI hands-free.",
      },
    ],
    cta: "Choose Package C",
    ctaDark: false,
  },
];

const WORKFLOW = [
  {
    label: "Objectives",
    icon: <Target size={18} />,
    desc: "Define clear goals aligned to revenue",
  },
  {
    label: "Strategies",
    icon: <Lightbulb size={18} />,
    desc: "Build channel & messaging frameworks",
  },
  {
    label: "Budget",
    icon: <DollarSign size={18} />,
    desc: "Allocate spend based on ROI benchmarks",
  },
  {
    label: "Execution",
    icon: <Rocket size={18} />,
    desc: "Deploy campaigns with precision",
  },
  {
    label: "Analytics",
    icon: <BarChart2 size={18} />,
    desc: "Track KPIs & surface insights",
  },
  {
    label: "Optimization",
    icon: <TrendingUp size={18} />,
    desc: "Refine through AI-driven iteration",
  },
];

const COMPARE = [
  { role: "Marketing Manager", cost: "$5,000 - $7,000 /mo" },
  { role: "Content Writer", cost: "$3,000 - $4,000 /mo" },
  { role: "Social Media Manager", cost: "$2,500 - $4,000 /mo" },
  { role: "Email Marketing Specialist", cost: "$2,000 - $3,500 /mo" },
  { role: "Brand Strategist", cost: "$3,000 - $5,000 /mo" },
  { role: "SEO Specialist", cost: "$2,000 - $3,000 /mo" },
  { role: "Analytics Manager", cost: "$2,500 - $4,000 /mo" },
];

const EVOKE_FEATURES = [
  "Growth Strategy & GTM",
  "SEO Blog + Content Calendar",
  "Email Drip Campaigns",
  "Social Media (All Platforms)",
  "Brand Strategy + CRO",
  "Analytics Reports",
  "Event & Influencer Marketing",
];

const TESTIMONIALS = [
  {
    quote:
      '"Evoke CMO replaced our need for a full marketing team. In minutes I had a complete campaign live on LinkedIn, Instagram, and Gmail — all AI-generated and perfectly on-brand."',
    name: "Sarah J.",
    role: "Founder, TechStart India",
    initials: "SJ",
    bg: "#6b5c3e",
  },
  {
    quote:
      '"For $49/month I\'m getting what used to cost me $5,000+ in freelancers. The ROI is incredible. I run our entire brand marketing myself now using Evoke."',
    name: "Marcus T.",
    role: "Product Manager, FinScale",
    initials: "MT",
    bg: "#2e5940",
  },
  {
    quote:
      '"The 12 CMO modules are insane. Growth strategy, email drips, SEO blogs — all done in seconds. This is what a $15,000/month CMO used to do for us."',
    name: "Priya K.",
    role: "E-commerce Founder",
    initials: "PK",
    bg: "#2e4a5e",
  },
];

const AUTO_STEPS = [
  {
    day: "Day 1–2",
    task: "Market research & positioning strategy",
    done: true,
  },
  { day: "Day 3", task: "Landing page copy + SEO structure", done: true },
  { day: "Day 4–5", task: "Hero video script & ad creative brief", done: true },
  { day: "Day 6–7", task: "Email drip sequence (5 emails)", done: true },
  { day: "Day 8", task: "Social media content calendar (30 days)", done: true },
  { day: "Day 9–10", task: "LinkedIn thought-leadership posts", done: true },
  { day: "Day 11", task: "Paid ad launch — Google & Meta", done: false },
  { day: "Day 14", task: "Mid-campaign performance review", done: false },
  {
    day: "Day 16",
    task: "A/B test variants generated & deployed",
    done: false,
  },
  { day: "Day 18–20", task: "Influencer brief & PR pitch", done: false },
  { day: "Day 22", task: "Retargeting campaign activated", done: false },
  {
    day: "Day 28",
    task: "Full analytics report + next-cycle brief",
    done: false,
  },
  {
    day: "Day 30",
    task: "Autonomous handoff to Month 2 strategy",
    done: false,
  },
];

/* ═══════════════════════════════════════════════════════════ */

const WIZARD_STEPS = [
  {
    key: "objective",
    frameworkIdx: 0,
    multiSelect: true,
    question: "What is your #1 marketing objective right now?",
    sub: "Select all that apply — EVOX will align every module to your goals.",
    options: [
      {
        value: "leads",
        label: "Generate Leads",
        icon: "🎯",
        desc: "Fill your pipeline with qualified prospects",
      },
      {
        value: "awareness",
        label: "Brand Awareness",
        icon: "📢",
        desc: "Get more people to know and trust your brand",
      },
      {
        value: "sales",
        label: "Drive Sales",
        icon: "💰",
        desc: "Convert leads and increase revenue directly",
      },
      {
        value: "retention",
        label: "Retain Customers",
        icon: "🔄",
        desc: "Keep customers engaged and reduce churn",
      },
    ],
  },
  {
    key: "strategy",
    frameworkIdx: 1,
    multiSelect: true,
    question: "Which channels deliver your best marketing results?",
    sub: "Select all that apply — EVOX will build strategies around your top channels.",
    options: [
      {
        value: "social",
        label: "Social Media",
        icon: "📱",
        desc: "Instagram, LinkedIn, Twitter & Facebook",
      },
      {
        value: "email",
        label: "Email / Outreach",
        icon: "📧",
        desc: "Newsletters, drip campaigns & cold outreach",
      },
      {
        value: "content",
        label: "Content / SEO",
        icon: "✍️",
        desc: "Blog posts, SEO & organic search traffic",
      },
      {
        value: "paid",
        label: "Paid Ads",
        icon: "💡",
        desc: "Google Ads, Meta Ads & performance marketing",
      },
    ],
  },
  {
    key: "budget",
    frameworkIdx: 2,
    multiSelect: false,
    question: "What is your monthly marketing investment?",
    sub: "EVOX will optimise ROI allocation based on your spend tier.",
    options: [
      {
        value: "low",
        label: "Under $500 / mo",
        icon: "🌱",
        desc: "Starting out or running lean",
      },
      {
        value: "mid",
        label: "$500 – $2,500 / mo",
        icon: "📈",
        desc: "Growing and actively scaling up",
      },
      {
        value: "high",
        label: "$2,500 – $12,000 / mo",
        icon: "🚀",
        desc: "Established brand with a strong budget",
      },
      {
        value: "enterprise",
        label: "$12,000+ / mo",
        icon: "🏢",
        desc: "Enterprise-level investment and scale",
      },
      {
        value: "custom",
        label: "Custom",
        icon: "✏️",
        desc: "Enter your own budget figure",
      },
    ],
    hasCustomBudget: true,
  },
  {
    key: "execution",
    frameworkIdx: 3,
    multiSelect: true,
    question: "How do you currently run your marketing campaigns?",
    sub: "Select all that apply — EVOX automates whatever takes your team the most time.",
    options: [
      {
        value: "manual",
        label: "Fully Manual",
        icon: "✋",
        desc: "I do everything by hand — very time-consuming",
      },
      {
        value: "tools",
        label: "Mix of Tools",
        icon: "🔧",
        desc: "I use several tools but it's still fragmented",
      },
      {
        value: "team",
        label: "In-house Team",
        icon: "👥",
        desc: "I have a small team but need more output",
      },
      {
        value: "agency",
        label: "External Agency",
        icon: "🏛️",
        desc: "Outsourcing but want more control and speed",
      },
    ],
  },
  {
    key: "analytics",
    frameworkIdx: 4,
    multiSelect: true,
    question: "How do you currently measure campaign performance?",
    sub: "Select all that apply — EVOX will surface the insights that matter most.",
    options: [
      {
        value: "none",
        label: "Not Tracking Yet",
        icon: "❓",
        desc: "I don't have proper analytics set up yet",
      },
      {
        value: "basic",
        label: "Basic Metrics",
        icon: "📊",
        desc: "Likes, clicks and open rates only",
      },
      {
        value: "crm",
        label: "CRM + Analytics",
        icon: "📉",
        desc: "Lead tracking and conversion funnels",
      },
      {
        value: "advanced",
        label: "Full Dashboard",
        icon: "🖥️",
        desc: "Custom KPIs, attribution and ROI tracking",
      },
    ],
  },
  {
    key: "optimization",
    frameworkIdx: 5,
    multiSelect: true,
    question: "What are your biggest growth challenges right now?",
    sub: "Select all that apply — EVOX's AI will prioritise these areas first.",
    options: [
      {
        value: "content",
        label: "Creating Content",
        icon: "✏️",
        desc: "Not enough quality content going out regularly",
      },
      {
        value: "converting",
        label: "Converting Traffic",
        icon: "🔄",
        desc: "Visitors aren't turning into customers",
      },
      {
        value: "consistency",
        label: "Staying Consistent",
        icon: "⏰",
        desc: "Hard to maintain a regular marketing cadence",
      },
      {
        value: "roi",
        label: "Proving ROI",
        icon: "💹",
        desc: "Can't clearly show what's working",
      },
    ],
  },
];

function getPersonalisedResult(answers) {
  // Answers can be a string (single-select) or array (multi-select)
  const first = (v) => (Array.isArray(v) ? v[0] : v);

  const roleLabel = {
    founder: "Founder",
    marketer: "Marketing Leader",
    business: "Business Owner",
    agency: "Agency Owner",
  };
  const objectiveLabel = {
    leads: "lead generation",
    awareness: "brand awareness",
    sales: "driving sales",
    retention: "customer retention",
  };
  const challengeLabel = {
    content: "content creation",
    converting: "conversion optimisation",
    consistency: "marketing consistency",
    roi: "ROI measurement",
  };
  const modulesMap = {
    leads: ["Lead Gen Campaigns", "Email Drip Sequences", "LinkedIn Outreach"],
    awareness: [
      "Brand Strategy",
      "30-Day Content Calendar",
      "Social Media Scheduler",
    ],
    sales: ["Sales Enablement", "Funnel & CRO Audit", "Paid Ad Campaigns"],
    retention: [
      "Email Nurture Flows",
      "Customer Re-engagement",
      "Analytics Reports",
    ],
  };
  const bg = first(answers.background);
  const obj = first(answers.objective);
  const opt = first(answers.optimization);
  return {
    role: roleLabel[bg] || answers.background || "Marketing Professional",
    objective: objectiveLabel[obj] || "growth",
    challenge: challengeLabel[opt] || "scaling",
    modules: modulesMap[obj] || [
      "Growth Strategy",
      "Content Calendar",
      "Analytics",
    ],
  };
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPhase, setWizardPhase] = useState("plan"); // 'plan' | 'questions' | 'connect'
  const [wizardPlan, setWizardPlan] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const [wizardDone, setWizardDone] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState(null);

  // "Other" free-text for the background step
  const [otherBgInput, setOtherBgInput] = useState("");
  const [otherBgSelected, setOtherBgSelected] = useState(false);

  // Persisted assessment + selected package (remembered until logout)
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Plan selector modal triggered by clicking an agent card
  const [activeModule, setActiveModule] = useState(null);

  const persistAssessment = (answers) => {
    try {
      localStorage.setItem(
        "evoke_assessment",
        JSON.stringify({ answers, ts: Date.now() }),
      );
    } catch {}
  };

  const saveProgress = (step, answers) => {
    try {
      localStorage.setItem(
        "evoke_wizard_progress",
        JSON.stringify({ step, answers }),
      );
    } catch {}
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem("evoke_wizard_progress");
    } catch {}
  };

  // On mount: restore completed assessment OR partial progress + selected package
  useEffect(() => {
    // Scroll to hash anchor when returning from a sub-page (e.g. back from campaign-hub)
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el)
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          100,
        );
    }
  }, []);

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("evoke_assessment") || "null");
      if (a?.answers) {
        setWizardAnswers(a.answers);
        setWizardDone(true);
      } else {
        const p = JSON.parse(
          localStorage.getItem("evoke_wizard_progress") || "null",
        );
        if (p?.answers) {
          setWizardAnswers(p.answers);
          setWizardStep(p.step ?? 0);
        }
      }
    } catch {}
    try {
      const pkg = localStorage.getItem("evoke_selected_package");
      if (pkg) setSelectedPackage(pkg);
    } catch {}
  }, []);

  // Sync assessment from Firestore when user logs in (same account, any device)
  useEffect(() => {
    if (!user) return;
    getUserData(user.uid)
      .then((data) => {
        if (data?.onboardingComplete && data?.onboardingData) {
          setWizardAnswers(data.onboardingData);
          setWizardDone(true);
          try {
            localStorage.setItem(
              "evoke_assessment",
              JSON.stringify({ answers: data.onboardingData, ts: Date.now() }),
            );
          } catch {}
        }
      })
      .catch(() => {});
  }, [user]);

  const handleWizardSelect = (value) => {
    const step = WIZARD_STEPS[wizardStep];
    if (step.multiSelect) {
      // Toggle in array — don't auto-advance
      setWizardAnswers((prev) => {
        const current = Array.isArray(prev[step.key]) ? prev[step.key] : [];
        const has = current.includes(value);
        const next = {
          ...prev,
          [step.key]: has
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
        saveProgress(wizardStep, next);
        return next;
      });
    } else {
      // Single-select — set answer, but don't auto-advance if it needs extra input
      const finalAnswers = { ...wizardAnswers, [step.key]: value };
      setWizardAnswers(finalAnswers);
      setOtherBgSelected(false);
      setOtherBgInput("");
      // If custom budget selected, stay on step to show the $ input
      if (step.hasCustomBudget && value === "custom") {
        saveProgress(wizardStep, finalAnswers);
        return;
      }
      if (wizardStep < WIZARD_STEPS.length - 1) {
        const nextStep = wizardStep + 1;
        setWizardStep(nextStep);
        saveProgress(nextStep, finalAnswers);
      } else {
        setWizardDone(true);
        persistAssessment(finalAnswers);
        clearProgress();
      }
    }
  };

  const goToConnect = (answers) => {
    if (answers) persistAssessment(answers);
    clearProgress();
    setWizardDone(true);
    setWizardOpen(false);
    if (user) {
      saveOnboardingData(user.uid, answers).catch(() => {});
    }
    const planRoute =
      wizardPlan === "free"
        ? "/free-plan"
        : wizardPlan
          ? `/${wizardPlan}`
          : "/agents-hub";
    navigate(planRoute);
  };

  const handleWizardContinue = () => {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      const nextStep = wizardStep + 1;
      setWizardStep(nextStep);
      saveProgress(nextStep, wizardAnswers);
    } else {
      setWizardDone(true);
      goToConnect(wizardAnswers);
    }
  };

  // "Retake Assessment" — clear the saved result and start fresh
  const closeWizard = () => {
    setWizardOpen(false);
    // Don't clear progress on close — user can resume where they left off
  };

  const resetWizard = () => {
    try {
      localStorage.removeItem("evoke_assessment");
    } catch {}
    clearProgress();
    setWizardOpen(false);
    setWizardPhase("questions");
    setWizardPlan(null);
    setWizardStep(0);
    setWizardAnswers({});
    setWizardDone(false);
    setOtherBgInput("");
    setOtherBgSelected(false);
    setExpandedFeature(null);
    setTimeout(
      () =>
        document
          .getElementById("pricing")
          ?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const goSignIn = () => {
    if (user) {
      setShowSetupModal(true);
    } else {
      try {
        sessionStorage.setItem("evoke_post_login_route", "/brand-profile");
      } catch {}
      redirectToLogin();
    }
  };
  const goBoard = () => (user ? navigate("/dashboard") : goSignIn());

  const goFreeStart = () => {
    if (user) {
      document
        .getElementById("pricing")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      document
        .getElementById("pricing")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Navigate directly to a specific CMO agent page.
  // If not logged in, redirect to accounts portal with the agent route as redirect_url
  // so they land on the exact agent after signing in — not the landing page.
  const goFreeAgent = (path) => {
    if (user) {
      navigate(path);
    } else {
      redirectToLogin(window.location.origin + path);
    }
  };

  const openAssessment = () => {
    navigate("/pricing");
  };

  const handleSetupComplete = (answers, recs) => {
    setShowSetupModal(false);
    navigate("/dashboard");
  };

  const startWizardWithPlan = (planKey) => {
    try {
      localStorage.setItem("evoke_selected_package", planKey);
    } catch {}
    if (user) {
      setShowSetupModal(true);
    } else {
      try {
        sessionStorage.setItem("evoke_post_login_route", "/dashboard");
      } catch {}
      redirectToLogin();
    }
  };

  /* Gold gradient text helper */
  const goldGrad = {
    background:
      "linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  /* Section badge */
  const SBadge = ({ children }) => (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 14px",
        background: GDIM,
        border: `1px solid ${GBORDER}`,
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: GOLD,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        background: BG,
        width: "100%",
        minHeight: "100vh",
        color: TEXT,
        fontFamily: "'Inter',sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ── Global orbs background layer — sized to actual content, not a stale fixed height ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1440,
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
          opacity: 1,
        }}
      >
        {/* glow-orb 1: purple-left */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: `
      radial-gradient(
        ellipse 900px 700px at 110% 30%,
        rgba(200,151,62,.14) 0%,
        rgba(200,151,62,.07) 35%,
        transparent 75%
      )
    `,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 100,
            left: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#6C63FF",
            opacity: 0.15,
            filter: "blur(150px)",
          }}
        />
        {/* glow-orb 2: gold-right */}
        <div
          style={{
            position: "absolute",
            top: 300,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#C8962A",
            opacity: 0.1,
            filter: "blur(150px)",
          }}
        />
        {/* glow-orb 3: purple-mid */}
        <div
          style={{
            position: "absolute",
            top: 2400,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#6C63FF",
            opacity: 0.12,
            filter: "blur(150px)",
          }}
        />
        {/* glow-orb 1 repeat — bottom */}
        <div
          style={{
            position: "absolute",
            top: 4000,
            left: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#6C63FF",
            opacity: 0.15,
            filter: "blur(150px)",
          }}
        />
        {/* glow-orb 2 repeat — bottom-right */}
        {/* <div
          style={{
            position: "absolute",
            top: 4200,
            right: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#C8962A",
            opacity: 0.1,
            filter: "blur(150px)",
          }}
        /> */}
        {/* glow-orb 3 repeat — mid-right */}
        <div
          style={{
            position: "absolute",
            top: 1800,
            right: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#6C63FF",
            opacity: 0.12,
            filter: "blur(150px)",
          }}
        />
        {/* glow-orb 2 repeat — mid-left */}
        {/* <div
          style={{
            position: "absolute",
            top: 1400,
            left: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#C8962A",
            opacity: 0.1,
            filter: "blur(150px)",
          }}
        /> */}
      </div>
      <Navbar />

      {/* ══════════════════════════════════════════════════
          HERO  — Figma CMO New
      ══════════════════════════════════════════════════ */}
      <section
        className="hero-section"
        style={{
          width: "100%",
          height: 1143,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: 180,
          paddingRight: 80,
          paddingBottom: 80,
          paddingLeft: 80,
          position: "relative",
          overflow: "hidden",
          background: BG,
          gap: 40,
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* radial glow top-centre */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
      radial-gradient(
        90% 80% at 8% 5%,
        rgba(92,92,255,.22) 0%,
        rgba(92,92,255,.12) 35%,
        transparent 75%
      )
    `,
          }}
        />{" "}
        {/* subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          {/* Heading layout — 1280×261, gap 16 (badge + h1 inside) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            style={{
              width: "100%",
              maxWidth: 1280,
              minHeight: 261,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Live pill badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 28,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 11,
                color: "rgba(240,235,224,0.6)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                justifyContent: "center",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ORANGE,
                  boxShadow: `0 0 8px ${ORANGE}`,
                  flexShrink: 0,
                }}
              />
              Your AI Chief Marketing Officer Built on EVOX
            </div>
            {/* H1 — 1000×158, single text element with gold span */}
            <h1
              style={{
                width: "100%",
                maxWidth: 1000,
                fontSize: "clamp(32px, 6vw, 72px)",
                fontWeight: 700,
                letterSpacing: "-1px",
                lineHeight: "110%",
                margin: 0,
                fontFamily: "'Manrope','Inter',sans-serif",
                textAlign: "center",
                color: "#F8FAFC",
              }}
            >
              AI Brand Marketing Powered by{" "}
              <span
                style={{
                  background:
                    "linear-gradient(306.67deg, #9F6F3A 34.55%, #BE954A 95.9%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Autonomous CMO Agents
              </span>
            </h1>
          </motion.div>

          {/* Subtext — 680×87, Manrope 400 18px, line-height 160%, color #94A3B8 */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            style={{
              width: "100%",
              maxWidth: 680,
              fontSize: 18,
              fontWeight: 400,
              fontFamily: "'Manrope','Inter',sans-serif",
              color: "#94A3B8",
              lineHeight: "160%",
              letterSpacing: "0%",
              textAlign: "center",
              margin: "0 auto",
              padding: 0,
              marginBottom: 40,
            }}
          >
            Deploy a specialized squad of 12 hyper-focused AI marketing
            specialists working in perfect orchestration to scale your pipeline,
            brand content, and digital acquisition channels 24/7.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="hero-btns"
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 64,
              width: 378,
              height: 54,
              maxWidth: "100%",
              margin: "0 auto 64px",
              alignItems: "center",
            }}
          >
            <button
              onClick={openAssessment}
              style={{
                width: 178,
                height: 54,
                gap: 8,
                padding: "16px 32px",
                borderRadius: 100,
                border: "none",
                cursor: "pointer",
                background:
                  "linear-gradient(81.63deg, #BE954A -7.2%, #9F6F3A 64.21%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                transition: "transform 0.18s, box-shadow 0.18s",
                boxSizing: "border-box",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(190,149,74,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Get Started <ArrowRight size={17} style={{ marginLeft: 6 }} />
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("agents")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                width: 184,
                height: 54,
                gap: 8,
                padding: "16px 32px",
                borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                background: "rgba(17,17,30,0.6)",
                color: TEXT,
                fontSize: 15,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                transition: "border-color 0.18s, color 0.18s",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(190,149,74,0.5)";
                e.currentTarget.style.color = "#BE954A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = TEXT;
              }}
            >
              Meet All Agents
            </button>
          </motion.div>

          {/* ── CMO Dashboard Mockup — Figma: 1024 wide, uniform #0C0C16, 32px inset ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            style={{
              width: 1024,
              maxWidth: "100%",
              margin: "0 auto",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              background: "#0C0C16",
            }}
          >
            {/* Browser chrome — same bg as body, no divider */}
            <div
              style={{
                height: 155,
                padding: "9px 32px 0",
                display: "flex",
                alignItems: "center",
                position: "relative",
                boxSizing: "border-box",
              }}
            >
              {/* Traffic lights — left */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#FF5F56",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#FFBD2E",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#27C93F",
                    flexShrink: 0,
                  }}
                />
              </div>
              {/* URL bar — centered absolutely */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 239,
                  height: 26,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxSizing: "border-box",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 400,
                    fontFamily: "'Manrope','Inter',sans-serif",
                    lineHeight: "100%",
                    color: "#94A3B8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  app.evokemarketplace.com/cmo-hq
                </span>
              </div>
            </div>
            {/* Dashboard content — sidebar | spacer | stats, 32px side margins */}
            <div
              style={{
                display: "flex",
                padding: "0 32px 32px",
                gap: 24,
                boxSizing: "border-box",
              }}
            >
              {/* Sidebar — 180 wide, no bg, gap 16 */}
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  boxSizing: "border-box",
                }}
              >
                {[
                  { label: "CMO Dashboard", active: true },
                  { label: "Campaign Strategy", active: false },
                  { label: "Agent Workforce", active: false },
                  { label: "Attribution & ROI", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      width: "100%",
                      height: 37,
                      padding: "11px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: item.active ? 700 : 400,
                      fontFamily: "'Manrope','Inter',sans-serif",
                      letterSpacing: 0,
                      lineHeight: "100%",
                      color: item.active ? "#6C63FF" : "#94A3B8",
                      background: item.active ? "#6C63FF1A" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              {/* Spacer — faint top rule across the empty middle */}
              <div
                style={{
                  flex: 1,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              />
              {/* Stats + chart column — 366 wide, no panel bg */}
              <div
                style={{
                  width: 430,
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                {/* stat-top — full width, gap 16 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(130px, 1fr))",
                    gap: 16,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {[
                    {
                      label: "ACTIVE AGENTS",
                      value: "12 / 12",
                      color: "#C8962A",
                      valueFontSize: 24,
                    },
                    {
                      label: "TOTAL ACQUISITION RATE",
                      value: "+34.8%",
                      color: "#10b981",
                      valueFontSize: 20,
                    },
                    {
                      label: "COST REDUCTION",
                      value: "-82% vs\nAgency",
                      color: "#06B6D4",
                      valueFontSize: 20,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        minHeight: 110,
                        background: "#FFFFFF05",
                        border: "1px solid #FFFFFF0F",
                        borderRadius: 12,
                        padding: "18px",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 400,
                          fontFamily: "'Manrope','Inter',sans-serif",
                          color: "#64748B",
                          lineHeight: "130%",
                          letterSpacing: 0,
                          textTransform: "uppercase",
                        }}
                      >
                        {stat.label}
                      </div>
                      <div
                        style={{
                          fontSize: stat.valueFontSize || 24,
                          fontWeight: 700,
                          fontFamily: "'Manrope','Inter',sans-serif",
                          color: stat.color,
                          lineHeight: "115%",
                          letterSpacing: 0,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                {/* mockup-chart — 100%×160, gap 12, padding 20 */}
                <div
                  style={{
                    width: "100%",
                    height: 160,
                    background: "#FFFFFF03",
                    border: "1px solid #FFFFFF0F",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxSizing: "border-box",
                  }}
                >
                  {/* chart-header — full width, space-between */}
                  <div
                    style={{
                      width: "100%",
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'Manrope','Inter',sans-serif",
                        color: "#F8FAFC",
                        lineHeight: "100%",
                        letterSpacing: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Evox Performance Analytics
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 400,
                        fontFamily: "'Manrope','Inter',sans-serif",
                        color: "#C8962A",
                        lineHeight: "100%",
                        letterSpacing: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Updated 1m ago
                    </span>
                  </div>
                  {/* Bars — 5 solid bars, last one gold */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 11,
                      flex: 1,
                    }}
                  >
                    {[35, 55, 45, 70, 95].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          borderRadius: "4px 4px 0 0",
                          background: i === 4 ? "#C8962A" : "#6C63FF",
                          height: `${h}%`,
                          transition: "height 0.3s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SOCIAL PROOF BAR — 1440×160
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          width: "100%",
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "48px 80px",
          background: BG,
          boxSizing: "border-box",
        }}
      >
        {STATS.map((s, i) => (
          <React.Fragment key={i}>
            {/* stat-item — 290×64, gap 4 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 290,
                height: 64,
                gap: 4,
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: "'Manrope','Inter',sans-serif",
                  color: "#F8FAFC",
                  lineHeight: "100%",
                  letterSpacing: 0,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: "'Manrope','Inter',sans-serif",
                  color: "#94A3B8",
                  lineHeight: "100%",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {s.l}
              </div>
            </div>
            {/* line — vertical divider between stat items */}
            {i < STATS.length - 1 && (
              <div
                style={{
                  width: 1,
                  height: 40,
                  background: "rgba(255,255,255,0.04)",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════
          AGENTS SECTION — Figma: 1440×928, padding 120/80, gap 64
      ══════════════════════════════════════════════════ */}
      <section
        id="agents"
        style={{
          padding: "120px 80px",
          background: BG,
          display: "flex",
          flexDirection: "column",
          gap: 64,
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: 60 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 14px",
                background: "rgba(108,99,255,0.10)",
                border: "1px solid rgba(108,99,255,0.3)",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                color: "#6C63FF",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Active Agent Fleet
            </div>
            <h2
              style={{
                fontSize: "clamp(22px,2.8vw,42px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                color: TEXT,
                fontFamily: "'Manrope','Inter',sans-serif",
              }}
            >
              Meet the Core Agents driving your brand growth
            </h2>
            <p
              style={{
                fontSize: 15,
                color: TEXT2,
                maxWidth: 520,
                margin: "14px auto 0",
                lineHeight: 1.65,
              }}
            >
              A complete collaborative executive system mapped to every
              high-performing corporate marketing division.
            </p>
          </FadeIn>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 20,
            }}
          >
            {[
              {
                title: "Sovereign CMO",
                tag: "SYSTEM ARCHITECT",
                color: "#6C63FF",
                desc: "Translates broad revenue directives into hyper-granular tactical pipelines. Orchestrates the 11 secondary specialists under unified KPI governance.",
                pills: ["Master Orchestration", "Dynamic Re-allocation"],
              },
              {
                title: "Creative Director",
                tag: "BRAND STYLIST",
                color: "#C8962A",
                desc: "Guarantees brand style guide coherence at infinite scale. Reviews all visual generation assets, color-space mapping, typography constraints.",
                pills: ["Visual Guardrails", "Asset Auditing"],
              },
              {
                title: "Acquisition Lead",
                tag: "PAID TRAFFIC",
                color: "#10b981",
                desc: "Runs real-time multi-variate search and social ad placement, automated bid optimization, structural copy revisions based on real-time ROAS feedback.",
                pills: ["High ROAS Engine", "Instant Placement"],
              },
              {
                title: "SEO Strategist",
                tag: "CONTENT PIPELINE",
                color: "#06b6d4",
                desc: "Monitors shifting search landscape shifts. Auto-drafts deep-dive topical authority clusters designed for real human reading first, crawl efficiency second.",
                pills: ["Topical Authority", "Automatic Indexing"],
              },
              {
                title: "Copywriter AI",
                tag: "CREATIVE PROSE",
                color: "#ef4444",
                desc: "Adapts brand-specific voice profiles with strict stylistic metrics. Drafts conversion-oriented lander headers, long-form newsletters, and short-form social hooks.",
                pills: ["Style Calibration", "Micro-copy Optimization"],
              },
              {
                title: "Attribution Agent",
                tag: "DATA COMPLIANCE",
                color: "#6C63FF",
                desc: "De-duplicates attribution channels using deep machine learning vectors. Maps clear, reliable touchpoints to prove exactly where your conversions originate.",
                pills: ["Clean Data Pools", "Vector Modeling"],
              },
            ].map((agent) => (
              <motion.div
                key={agent.title}
                variants={fadeUp}
                style={{
                  background: "#0d1121",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: `3px solid ${agent.color}`,
                  borderRadius: 16,
                  padding: "24px 22px",
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 20px 50px ${agent.color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: TEXT,
                      letterSpacing: "-0.01em",
                      fontFamily: "'Manrope','Inter',sans-serif",
                      margin: 0,
                    }}
                  >
                    {agent.title}
                  </h3>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: agent.color,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: TEXT3,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  {agent.tag}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: TEXT2,
                    lineHeight: 1.65,
                    margin: "0 0 18px",
                  }}
                >
                  {agent.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {agent.pills.map((pill) => (
                    <span
                      key={pill}
                      style={{
                        padding: "5px 11px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 100,
                        fontSize: 11,
                        color: TEXT2,
                        fontWeight: 500,
                      }}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CAPABILITY SHIFT — comparison table
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 80px",
          background: "#080812",
          border: "1px solid rgba(255,255,255,0.04)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 64,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(100,120,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 14px",
                background: GDIM,
                border: `1px solid ${GBORDER}`,
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              The Capability Shift
            </div>
            <h2
              style={{
                fontSize: "clamp(22px,2.8vw,40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                fontFamily: "'Manrope','Inter',sans-serif",
                color: TEXT,
              }}
            >
              How Evox compares to the old way
            </h2>
            <p
              style={{
                fontSize: 15,
                color: TEXT2,
                maxWidth: 560,
                margin: "14px auto 0",
                lineHeight: 1.65,
              }}
            >
              A radical upgrade over traditional performance marketing agencies
              and rigid manual automations.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div
              style={{
                border: "1px solid #1E1E30",
                borderRadius: 16,
                background: "#0F0F1A",
                overflow: "hidden",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  padding: "18px 24px",
                  borderBottom: "1px solid #1E1E30",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: TEXT2,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Capability
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: GOLD,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Evox CMO Fleet
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: TEXT3,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Traditional Performance Agency
                </span>
              </div>
              {[
                {
                  cap: "Latency to Deployment",
                  evox: "< 60 seconds (Instant execution)",
                  old: "4 – 6 weeks kickoff & onboarding",
                },
                {
                  cap: "Attribution Drift",
                  evox: "Zero (Real-time ML vector tracing)",
                  old: "Extensive duplicate reporting",
                },
                {
                  cap: "Cost Efficiency",
                  evox: "Flat monthly SaaS rate (82% saved)",
                  old: "High monthly retainer + % of spend",
                },
                {
                  cap: "Execution Timeframe",
                  evox: "24/7 continuous autonomous pacing",
                  old: "Mon–Fri 9-5 (Subject to delays)",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.cap}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "20px 24px",
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
                    {row.cap}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      color: TEXT,
                    }}
                  >
                    <Check size={15} color={GOLD} strokeWidth={2.5} />
                    {row.evox}
                  </span>
                  <span style={{ fontSize: 14, color: TEXT3 }}>{row.old}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS  (strip_04, strip_05)
      ══════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        style={{
          padding: "120px 80px",
          background: BG,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 64,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "1400px",
            height: "700px",
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(ellipse at center, rgba(108,99,255,0.10) 0%, rgba(108,99,255,0.05) 40%, transparent 75%)",
            filter: "blur(180px)",
          }}
        />
        {/* soft gold glow behind heading */}
        {/* <div
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60vw",
            height: "40vh",
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(200,151,62,0.06) 0%, transparent 70%)",
          }}
        /> */}

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          {/* section-header — 1280×144, gap 16 */}
          <FadeIn
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              marginBottom: 64,
            }}
          >
            {/* section-tag — 167×24, padding 4px 12px, radius 999, bg #6C63FF1A, border 1px solid #6C63FF33 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "4px 12px",
                background: "rgba(108,99,255,0.10)",
                border: "1px solid rgba(108,99,255,0.2)",
                borderRadius: 999,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: "'Manrope','Inter',sans-serif",
                  lineHeight: "100%",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6C63FF",
                }}
              >
                Workflow Integration
              </span>
            </div>
            {/* Heading — Manrope 700, 48px, line-height 100%, center, #F8FAFC */}
            <h2
              style={{
                fontSize: "clamp(28px,4.5vw,48px)",
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: "100%",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#F8FAFC",
                margin: 0,
              }}
            >
              Simple, powerful 3-step process
            </h2>
            {/* Subtitle — Manrope 400, 16px, line-height 100%, center, #94A3B8 */}
            <p
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "100%",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#94A3B8",
                maxWidth: 480,
                margin: 0,
              }}
            >
              Get autonomous growth active across your company in under an hour.
            </p>
          </FadeIn>

          {/* steps-grid — 1280×250, gap 24 */}
          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
            }}
          >
            {[
              {
                n: "01",
                title: "Map Channels",
                desc: "Connect your current ad managers, site analytics, and style guide docs. Evox immediately registers your style profiles.",
              },
              {
                n: "02",
                title: "Confirm Strategy",
                desc: "The Sovereign CMO outlines exact acquisition targets, dynamic content channels, and ad spend thresholds based on historical benchmarks.",
              },
              {
                n: "03",
                title: "Deploy Autonomous Fleet",
                desc: "Our specialized agents launch simultaneous copy generation, bidding modifications, and conversion landing tests in seamless loops.",
              },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1}>
                {/* process-step — 410.67×250, gap 16, radius 16, padding 32, bg #11111E99, blur(12px) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    background: "rgba(17,17,30,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: 32,
                    boxSizing: "border-box",
                    height: "100%",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {/* Number — Manrope 700, 40px, line-height 100%, gold */}
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      lineHeight: "100%",
                      fontFamily: "'Manrope','Inter',sans-serif",
                      color: "#C8962A",
                    }}
                  >
                    {s.n}
                  </div>

                  {/* Title — Manrope 700, 24px, line-height 100%, #F8FAFC */}
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: "100%",
                      fontFamily: "'Manrope','Inter',sans-serif",
                      color: "#F8FAFC",
                      margin: 0,
                    }}
                  >
                    {s.title}
                  </h3>

                  {/* Description — Manrope 400, 14px, line-height 160%, #94A3B8 */}
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      lineHeight: "160%",
                      fontFamily: "'Manrope','Inter',sans-serif",
                      color: "#94A3B8",
                      margin: 0,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOUNDER STORY
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 80px",
          background: "#080812",
          border: "1px solid rgba(255,255,255,0.04)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 64,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "50vw",
            height: "40vh",
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(100,120,255,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <FadeIn
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
            }}
          >
            {/* icon-quote-right — 48×48, Vector 36×36 inset top/left 6px, 2px stroke gold */}
            <div
              style={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Quote
                size={36}
                color="#C8962A"
                strokeWidth={2}
                style={{ marginTop: 6, marginLeft: 6 }}
              />
            </div>
            {/* Quote text — 800×225, Manrope 700, 32px, line-height 140%, center, #F8FAFC */}
            <p
              style={{
                width: "100%",
                maxWidth: 800,
                fontSize: 32,
                fontWeight: 700,
                lineHeight: "140%",
                letterSpacing: 0,
                textAlign: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#F8FAFC",
                margin: 0,
              }}
            >
              Evox essentially replaced our bloated performance agency team
              within three weeks. We are shipping six times more copy, tracking
              conversions reliably down to the penny, and our customer
              acquisition cost dropped by 42%.
            </p>
            {/* testimonial-user — 257×48, gap 12 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#6C63FF",
                  flexShrink: 0,
                }}
              />
              {/* user-info — 197×38, gap 2 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: "100%",
                    letterSpacing: 0,
                    fontFamily: "'Manrope','Inter',sans-serif",
                    color: "#F8FAFC",
                  }}
                >
                  Hanson Vance
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: "100%",
                    letterSpacing: 0,
                    fontFamily: "'Manrope','Inter',sans-serif",
                    color: "#94A3B8",
                  }}
                >
                  VP of Acquisition, Cambridge Digital
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA  (strip_07 bottom, strip_08)
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          // background: BG,
          padding: "100px 40px 120px",
          textAlign: "center",
          background: BG,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-420px",
            transform: "translateX(-50%)",
            width: "1600px",
            height: "800px",
            pointerEvents: "none",
            zIndex: 0,
            background: `
      radial-gradient(
        ellipse at center,
        rgba(200,151,62,0.08) 0%,
        rgba(200,151,62,0.04) 40%,
        transparent 75%
      )
    `,
            filter: "blur(180px)",
          }}
        />
        <FadeIn>
          <div
            style={{
              position: "relative",
              zIndex: 1,
            }}
          ></div>
          <h2
            style={{
              fontSize: "56px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: "110.00000000000001%",
              marginBottom: 18,
              fontFamily: "Manrope",
              color: TEXT,
            }}
          >
            Start marketing like a <span style={goldGrad}>CMO today</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: TEXT2,
              maxWidth: 555,
              margin: "0 auto 44px",
              lineHeight: 1.7,
            }}
          >
            Join the future of autonomous revenue. Activate your dedicated
            growth fleet in less than five minutes.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <button
              onClick={openAssessment}
              style={goldPill}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 32px rgba(200,151,62,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <div
              style={{
                position: "relative",
                zIndex: 1,
              }}
            ></div>
            <button
              onClick={() =>
                document
                  .getElementById("agents")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={outlinePill}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(240,235,224,0.4)";
                e.currentTarget.style.color = TEXT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(240,235,224,0.22)";
                e.currentTarget.style.color = TEXT;
              }}
            >
              View All Agents
            </button>
          </div>
          {/* TrustRow — 602×40, padding-top 24, gap 40 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 24,
              gap: 40,
              flexWrap: "wrap",
            }}
          >
            {/* {[
              {
                icon: <Shield size={16} color="#636385" strokeWidth={2} />,
                label: "SOC2 Compliant",
              },
              {
                icon: <Lock size={16} color="#636385" strokeWidth={2} />,
                label: "256-bit Encryption",
              },
              {
                icon: <Activity size={16} color="#636385" strokeWidth={2} />,
                label: "99.9% Uptime",
              },
              {
                icon: <UserCheck size={16} color="#636385" strokeWidth={2} />,
                label: "GDPR Ready",
              },
            ].map((item) => ( */}
            <div
              // key={item.label}
              style={{
                display: "inline-flex",
                fontSize: "12px",
                letterSpacing: "0%",
                fontStyle: "Manrope",
                alignItems: "center",
                lineHeight: "100%",
                gap: 8,
              }}
            >
              Free onboarding · Standard SOC2 Compliance · 24/7 Security
              {/* <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: "100%",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "'Manrope','Inter',sans-serif",
                    color: "#A3A3C2",
                  }}
                >
                  Free onboarding · Standard SOC2 Compliance · 24/7 Security
                </span> */}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER  (strip_08)
      ══════════════════════════════════════════════════ */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 80px 40px",
          background: "#030307",
          border: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 48,
          boxSizing: "border-box",
        }}
      >
        {/* footer-columns — 1280×155, justify space-between (no explicit gap — space-between distributes it) */}
        <div
          className="footer-grid"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            flexWrap: "wrap",
            rowGap: 32,
          }}
        >
          {/* brand-column — 320×103, gap 16 (only column with a fixed width, to wrap the tagline) */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <img
                src="/evoke-logo.png"
                alt="EVOKE"
                style={{
                  height: 25,
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px 5px 8px",
                  background: "#0a0805",
                  border: "1px solid rgba(200,151,62,0.32)",
                  borderRadius: 100,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.6) inset",
                }}
              >
                <Zap size={11} color={GOLD} fill={GOLD} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    color: GOLD,
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  CMO
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                lineHeight: "150%",
                letterSpacing: 0,
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#94A3B8",
                margin: 0,
              }}
            >
              Autonomous corporate marketing departments designed to scale
              acquisition pipelines with surgical machine precision.
            </p>
          </div>

          {/* links-column — WORKFORCE — auto width (hug content), gap 16 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: "100%",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#F8FAFC",
              }}
            >
              WORKFORCE
            </div>
            {[
              "Sovereign CMO",
              "Acquisition Lead",
              "Creative Director",
              "SEO Pipeline",
            ].map((l) => (
              <a
                key={l}
                href="#agents"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: "100%",
                  fontFamily: "'Manrope','Inter',sans-serif",
                  color: "#94A3B8",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#F8FAFC")}
                onMouseLeave={(e) => (e.target.style.color = "#94A3B8")}
              >
                {l}
              </a>
            ))}
          </div>

          {/* links-column — PLATFORM — auto width (hug content), gap 16 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: "100%",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#F8FAFC",
              }}
            >
              PLATFORM
            </div>
            {[
              "Vector Attribution",
              "Integrations",
              "SOC2 Protocol",
              "Attribution Drift",
            ].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: "100%",
                  fontFamily: "'Manrope','Inter',sans-serif",
                  color: "#94A3B8",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#F8FAFC")}
                onMouseLeave={(e) => (e.target.style.color = "#94A3B8")}
              >
                {l}
              </a>
            ))}
          </div>

          {/* links-column — LEGAL — auto width (hug content), gap 16 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: "100%",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#F8FAFC",
              }}
            >
              LEGAL
            </div>
            {[
              { l: "Privacy Policy", href: "/privacy" },
              { l: "Terms of Service", href: "/terms" },
              { l: "Agency SLA", href: "#" },
              { l: "Security", href: "#" },
            ].map((item) => (
              <a
                key={item.l}
                href={item.href}
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: "100%",
                  fontFamily: "'Manrope','Inter',sans-serif",
                  color: "#94A3B8",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#F8FAFC")}
                onMouseLeave={(e) => (e.target.style.color = "#94A3B8")}
              >
                {item.l}
              </a>
            ))}
          </div>
        </div>

        {/* footer-bottom — 1280×42, justify space-between, padding-top 24, border-top 1px solid #FFFFFF0A */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "100%",
              fontFamily: "'Manrope','Inter',sans-serif",
              color: "#64748B",
              margin: 0,
            }}
          >
            © 2026 Evoke CMO Inc. All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[
              { icon: <Twitter size={18} />, href: "#", label: "Twitter" },
              { icon: <Linkedin size={18} />, href: "#", label: "LinkedIn" },
              { icon: <Github size={18} />, href: "#", label: "GitHub" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                style={{
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                {s.icon}
              </a>
            ))}
          </div>
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
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              key="plan-panel"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0d1121",
                border: `1px solid ${activeModule.color}40`,
                borderRadius: 24,
                padding: "36px 32px",
                maxWidth: 540,
                width: "100%",
                boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${activeModule.color}20`,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    flexShrink: 0,
                    background: `${activeModule.color}18`,
                    border: `1.5px solid ${activeModule.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: activeModule.color,
                  }}
                >
                  {activeModule.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#f0ebe0",
                      margin: 0,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {activeModule.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(240,235,224,0.45)",
                      margin: "4px 0 0",
                    }}
                  >
                    Select a plan to get started
                  </p>
                </div>
                <button
                  onClick={() => setActiveModule(null)}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: "rgba(240,235,224,0.35)",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                    padding: 4,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  height: 1,
                  background: `${activeModule.color}20`,
                  margin: "20px 0",
                }}
              />

              {/* Plan options */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {PLAN_OPTIONS.map((plan) => (
                  <motion.button
                    key={plan.key}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveModule(null);
                      if (plan.path) {
                        navigate(plan.path);
                      } else {
                        navigate(`/campaign/${activeModule.type}`);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 18px",
                      background:
                        plan.key === "package-b"
                          ? "rgba(200,151,62,0.08)"
                          : "rgba(255,255,255,0.03)",
                      border:
                        plan.key === "package-b"
                          ? "1px solid rgba(200,151,62,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      cursor: "pointer",
                      fontFamily: "'Inter',sans-serif",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${activeModule.color}55`;
                      e.currentTarget.style.background = `${activeModule.color}0d`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        plan.key === "package-b"
                          ? "rgba(200,151,62,0.35)"
                          : "rgba(255,255,255,0.08)";
                      e.currentTarget.style.background =
                        plan.key === "package-b"
                          ? "rgba(200,151,62,0.08)"
                          : "rgba(255,255,255,0.03)";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#f0ebe0",
                          }}
                        >
                          {plan.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            padding: "2px 7px",
                            borderRadius: 100,
                            background: `${plan.tagColor}18`,
                            color: plan.tagColor,
                            border: `1px solid ${plan.tagColor}30`,
                          }}
                        >
                          {plan.tag}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(240,235,224,0.45)",
                          lineHeight: 1.5,
                        }}
                      >
                        {plan.desc}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: plan.tagColor,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
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
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              key="wizard-panel"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: 24,
              }}
            >
              {/* ══ PHASE 1: Plan Selection ══ */}
              {wizardPhase === "plan" && (
                <motion.div
                  key="plan-select"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    background: "linear-gradient(160deg,#0d1121,#0a0f1e)",
                    border: `1px solid ${GBORDER}`,
                    borderRadius: 24,
                    padding: "32px 28px",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={closeWizard}
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 20,
                      background: "none",
                      border: "none",
                      color: TEXT3,
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: 4,
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Step 1 of 3
                    </div>
                    <h2
                      style={{
                        fontSize: "clamp(18px,2vw,24px)",
                        fontWeight: 800,
                        color: TEXT,
                        fontFamily: "'Syne','Inter',sans-serif",
                        margin: "0 0 6px",
                        lineHeight: 1.3,
                      }}
                    >
                      Choose your <span style={goldGrad}>production tier</span>
                    </h2>
                    <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>
                      Each tier builds on the previous — start free, scale up
                      anytime.
                    </p>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                      gap: 14,
                      alignItems: "start",
                    }}
                  >
                    {PLANS.map((plan, i) => (
                      <div
                        key={plan.key}
                        style={{
                          background: plan.popular
                            ? "linear-gradient(160deg,#141a2e,#0d1121)"
                            : CARD,
                          border: `1px solid ${plan.popular ? "rgba(200,151,62,0.5)" : BORDER}`,
                          borderRadius: 18,
                          padding: "22px 18px",
                          position: "relative",
                          boxShadow: plan.popular
                            ? "0 0 40px rgba(200,151,62,0.1)"
                            : "none",
                          boxSizing: "border-box",
                          height: "100%",
                        }}
                      >
                        {plan.popular && (
                          <div
                            style={{
                              position: "absolute",
                              top: -12,
                              left: "50%",
                              transform: "translateX(-50%)",
                              background:
                                "linear-gradient(135deg,#d4a853,#b8803a)",
                              color: "#0e0c09",
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "4px 14px",
                              borderRadius: 100,
                              letterSpacing: "0.08em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            MOST POPULAR
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: plan.popular ? GOLD : TEXT3,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          {plan.label}
                        </div>
                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            color: TEXT,
                            fontFamily: "'Syne','Inter',sans-serif",
                            marginBottom: 3,
                          }}
                        >
                          {plan.price}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: TEXT3,
                            marginBottom: 8,
                          }}
                        >
                          {plan.priceNote}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: TEXT2,
                            marginBottom: 14,
                            paddingBottom: 14,
                            borderBottom: `1px solid ${BORDER}`,
                            lineHeight: 1.55,
                          }}
                        >
                          {plan.tagline}
                        </p>
                        {/* CTA button */}
                        <button
                          onClick={() => {
                            try {
                              localStorage.setItem(
                                "evoke_selected_package",
                                plan.key,
                              );
                            } catch {}
                            user
                              ? navigate("/brand-profile")
                              : redirectToLogin(
                                  window.location.origin + "/brand-profile",
                                );
                          }}
                          style={{
                            width: "100%",
                            padding: "11px",
                            marginBottom: 16,
                            background:
                              plan.key === "free"
                                ? "linear-gradient(135deg,#d4a853,#b8803a)"
                                : plan.ctaDark
                                  ? "linear-gradient(135deg,#d4a853,#b8803a)"
                                  : "rgba(255,255,255,0.06)",
                            border:
                              plan.ctaDark || plan.key === "free"
                                ? "none"
                                : `1px solid ${BORDER}`,
                            borderRadius: 10,
                            color:
                              plan.ctaDark || plan.key === "free"
                                ? "#0e0c09"
                                : TEXT2,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Inter',sans-serif",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.88";
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {plan.key === "free"
                            ? "Start Free →"
                            : plan.cta + " →"}
                        </button>
                        {/* Features list */}
                        <div
                          style={{
                            borderTop: `1px solid ${BORDER}`,
                            paddingTop: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: TEXT3,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              marginBottom: 10,
                            }}
                          >
                            WHAT'S INCLUDED
                          </div>
                          {plan.features.map((f, fi) => {
                            const fKey = `wiz-${plan.key}-${fi}`;
                            const isOpen = expandedFeature === fKey;
                            return (
                              <div
                                key={f.text}
                                style={{
                                  marginBottom: 5,
                                  borderRadius: 7,
                                  border: `1px solid ${isOpen ? (plan.popular ? "rgba(200,151,62,0.35)" : BORDER) : BORDER}`,
                                  overflow: "hidden",
                                  background: isOpen
                                    ? "rgba(255,255,255,0.03)"
                                    : "transparent",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    setExpandedFeature(isOpen ? null : fKey)
                                  }
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 9px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  <div
                                    style={{
                                      color: plan.popular ? GOLD : TEXT3,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {f.icon}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: isOpen
                                        ? plan.popular
                                          ? GOLD
                                          : TEXT
                                        : TEXT2,
                                      lineHeight: 1.5,
                                      flex: 1,
                                      fontWeight: isOpen ? 600 : 400,
                                      transition: "color 0.2s",
                                    }}
                                  >
                                    {f.text}
                                  </span>
                                  <span
                                    style={{
                                      color: TEXT3,
                                      fontSize: 13,
                                      flexShrink: 0,
                                      transform: isOpen
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                      transition: "transform 0.25s",
                                      lineHeight: 1,
                                    }}
                                  >
                                    ›
                                  </span>
                                </button>
                                {isOpen && (
                                  <div
                                    style={{
                                      padding: "0 9px 9px 29px",
                                      fontSize: 11,
                                      color: TEXT2,
                                      lineHeight: 1.65,
                                      borderTop: `1px solid ${BORDER}`,
                                    }}
                                  >
                                    <div style={{ paddingTop: 7 }}>
                                      {f.desc}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ══ PHASE 2: Workflow Questions ══ */}
              {wizardPhase === "questions" &&
                !wizardDone &&
                (() => {
                  const step = WIZARD_STEPS[wizardStep];
                  const totalSteps = WIZARD_STEPS.length;
                  const selectedArr = Array.isArray(wizardAnswers[step.key])
                    ? wizardAnswers[step.key]
                    : [];
                  const singleSel = wizardAnswers[step.key];
                  return (
                    <motion.div
                      key={wizardStep}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        background: "linear-gradient(160deg,#0d1121,#0a0f1e)",
                        border: `1px solid ${GBORDER}`,
                        borderRadius: 24,
                        padding: "40px 36px",
                        position: "relative",
                      }}
                    >
                      {/* Progress */}
                      <div style={{ marginBottom: 28 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: GOLD,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            Step 2 of 3 ·{" "}
                            {WORKFLOW[step.frameworkIdx]?.label ?? step.key} ·{" "}
                            {wizardStep + 1}/{totalSteps}
                          </span>
                          <button
                            onClick={closeWizard}
                            style={{
                              background: "none",
                              border: "none",
                              color: TEXT3,
                              cursor: "pointer",
                              fontSize: 18,
                              lineHeight: 1,
                              padding: 4,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        {/* Workflow steps track */}
                        <div
                          style={{ display: "flex", gap: 6, marginBottom: 12 }}
                        >
                          {WORKFLOW.map((w, i) => (
                            <div
                              key={w.label}
                              style={{
                                flex: 1,
                                height: 3,
                                borderRadius: 3,
                                background:
                                  i <= wizardStep
                                    ? GOLD
                                    : "rgba(200,151,62,0.15)",
                                transition: "background 0.3s",
                              }}
                            />
                          ))}
                        </div>
                        {/* Workflow labels */}
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            overflowX: "auto",
                            paddingBottom: 4,
                          }}
                        >
                          {WORKFLOW.map((w, i) => (
                            <div
                              key={w.label}
                              style={{
                                flex: "0 0 auto",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                opacity: i === wizardStep ? 1 : 0.4,
                                transition: "opacity 0.3s",
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background:
                                    i < wizardStep
                                      ? GOLD
                                      : i === wizardStep
                                        ? "rgba(200,151,62,0.25)"
                                        : "rgba(255,255,255,0.05)",
                                  border: `1.5px solid ${i <= wizardStep ? GOLD : "rgba(255,255,255,0.08)"}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {i < wizardStep ? (
                                  <Check size={12} color="#0e0c09" />
                                ) : (
                                  <span
                                    style={{
                                      fontSize: 8,
                                      color: i === wizardStep ? GOLD : TEXT3,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {i + 1}
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: 8,
                                  color: i === wizardStep ? GOLD : TEXT3,
                                  fontWeight: 600,
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {w.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          marginBottom: 8,
                          fontSize: "clamp(16px,1.6vw,22px)",
                          fontWeight: 700,
                          color: TEXT,
                          fontFamily: "'Syne','Inter',sans-serif",
                          lineHeight: 1.3,
                        }}
                      >
                        {step.question}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: TEXT2,
                          marginBottom: 28,
                          lineHeight: 1.6,
                        }}
                      >
                        {step.sub}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(200px,1fr))",
                          gap: 14,
                        }}
                      >
                        {step.options.map((opt) => {
                          const isSelected = step.multiSelect
                            ? selectedArr.includes(opt.value)
                            : singleSel === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleWizardSelect(opt.value)}
                              style={{
                                background: isSelected
                                  ? "rgba(200,151,62,0.12)"
                                  : CARD,
                                border: `2px solid ${isSelected ? GOLD : GBORDER}`,
                                borderRadius: 14,
                                padding: "18px 16px",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.18s",
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                position: "relative",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor =
                                    "rgba(200,151,62,0.55)";
                                  e.currentTarget.style.background =
                                    "rgba(200,151,62,0.05)";
                                  e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = GBORDER;
                                  e.currentTarget.style.background = CARD;
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                }
                              }}
                            >
                              {step.multiSelect && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 10,
                                    right: 10,
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: isSelected
                                      ? "linear-gradient(135deg,#d4a853,#b8803a)"
                                      : "rgba(255,255,255,0.06)",
                                    border: `1.5px solid ${isSelected ? GOLD : "rgba(255,255,255,0.12)"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.18s",
                                  }}
                                >
                                  {isSelected && (
                                    <Check size={10} color="#0e0c09" />
                                  )}
                                </div>
                              )}
                              <span style={{ fontSize: 22 }}>{opt.icon}</span>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: isSelected ? GOLD : TEXT,
                                  transition: "color 0.18s",
                                }}
                              >
                                {opt.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: TEXT2,
                                  lineHeight: 1.5,
                                }}
                              >
                                {opt.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom budget input */}
                      {step.hasCustomBudget && singleSel === "custom" && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              background: "rgba(255,255,255,0.05)",
                              border: `1.5px solid ${GOLD}`,
                              borderRadius: 12,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                padding: "0 14px",
                                fontSize: 16,
                                fontWeight: 700,
                                color: GOLD,
                                borderRight: `1px solid ${GBORDER}`,
                                lineHeight: "50px",
                              }}
                            >
                              $
                            </span>
                            <input
                              autoFocus
                              id="wiz-custom-budget"
                              type="text"
                              placeholder="Enter your budget e.g. 5,000"
                              value={wizardAnswers["customBudgetText"] || ""}
                              onChange={(e) =>
                                setWizardAnswers((prev) => ({
                                  ...prev,
                                  customBudgetText: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (
                                    wizardAnswers["customBudgetText"] || ""
                                  ).trim()
                                ) {
                                  if (wizardStep < WIZARD_STEPS.length - 1)
                                    setWizardStep((s) => s + 1);
                                  else {
                                    setWizardDone(true);
                                    goToConnect(wizardAnswers);
                                  }
                                }
                              }}
                              style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                padding: "12px 14px",
                                fontSize: 15,
                                fontWeight: 600,
                                color: TEXT,
                                fontFamily: "'Inter',sans-serif",
                              }}
                            />
                            <span
                              style={{
                                padding: "0 14px",
                                fontSize: 12,
                                color: TEXT3,
                                whiteSpace: "nowrap",
                              }}
                            >
                              /&nbsp;mo
                            </span>
                          </div>
                          <div
                            style={{
                              marginTop: 14,
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              disabled={
                                !(
                                  wizardAnswers["customBudgetText"] || ""
                                ).trim()
                              }
                              onClick={() => {
                                if (wizardStep < WIZARD_STEPS.length - 1)
                                  setWizardStep((s) => s + 1);
                                else {
                                  setWizardDone(true);
                                  goToConnect(wizardAnswers);
                                }
                              }}
                              style={{
                                padding: "11px 28px",
                                borderRadius: 100,
                                background: (
                                  wizardAnswers["customBudgetText"] || ""
                                ).trim()
                                  ? "linear-gradient(135deg,#d4a853,#b8803a)"
                                  : "rgba(200,151,62,0.15)",
                                border: "none",
                                color: (
                                  wizardAnswers["customBudgetText"] || ""
                                ).trim()
                                  ? "#0e0c09"
                                  : TEXT3,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: (
                                  wizardAnswers["customBudgetText"] || ""
                                ).trim()
                                  ? "pointer"
                                  : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                transition: "all 0.2s",
                              }}
                            >
                              Continue <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {step.multiSelect && (
                        <div
                          style={{
                            marginTop: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 11, color: TEXT3 }}>
                            {selectedArr.length === 0
                              ? "Select at least one option"
                              : `${selectedArr.length} selected`}
                          </span>
                          <button
                            disabled={selectedArr.length === 0}
                            onClick={() => {
                              if (wizardStep < WIZARD_STEPS.length - 1) {
                                setWizardStep((s) => s + 1);
                              } else {
                                setWizardDone(true);
                                goToConnect(wizardAnswers);
                              }
                            }}
                            style={{
                              padding: "11px 28px",
                              borderRadius: 100,
                              background:
                                selectedArr.length > 0
                                  ? "linear-gradient(135deg,#d4a853,#b8803a)"
                                  : "rgba(200,151,62,0.15)",
                              border: "none",
                              color: selectedArr.length > 0 ? "#0e0c09" : TEXT3,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor:
                                selectedArr.length > 0
                                  ? "pointer"
                                  : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedArr.length > 0) {
                                e.currentTarget.style.transform =
                                  "translateY(-1px)";
                                e.currentTarget.style.boxShadow =
                                  "0 6px 20px rgba(200,151,62,0.35)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {wizardStep === WIZARD_STEPS.length - 1
                              ? "Finish"
                              : "Continue"}{" "}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <button
                          onClick={() =>
                            wizardStep > 0
                              ? setWizardStep((s) => s - 1)
                              : setWizardPhase("plan")
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: TEXT2,
                            cursor: "pointer",
                            fontSize: 12,
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = TEXT)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = TEXT2)
                          }
                        >
                          ← Back
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

              {/* ══ PHASE: Ready to Go ══ */}
              {wizardPhase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    background: "linear-gradient(160deg,#0d1121,#0a0f1e)",
                    border: `1px solid ${GBORDER}`,
                    borderRadius: 24,
                    padding: "48px 36px",
                    position: "relative",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={closeWizard}
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 20,
                      background: "none",
                      border: "none",
                      color: TEXT3,
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: 4,
                    }}
                  >
                    ✕
                  </button>

                  {/* Success icon */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "rgba(16,185,129,0.15)",
                      border: "2px solid rgba(16,185,129,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      boxShadow: "0 0 32px rgba(16,185,129,0.2)",
                    }}
                  >
                    <Check size={32} color="#10b981" />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: GOLD,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Assessment Complete
                  </div>
                  <h2
                    style={{
                      fontSize: "clamp(20px,2.5vw,28px)",
                      fontWeight: 900,
                      color: TEXT,
                      fontFamily: "'Syne','Inter',sans-serif",
                      marginBottom: 12,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    You're ready to go! 🎯
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: TEXT2,
                      maxWidth: 400,
                      margin: "0 auto 32px",
                      lineHeight: 1.7,
                    }}
                  >
                    We already have your preferences saved. Your AI CMO is
                    personalised and ready — no need to answer questions again.
                  </p>

                  {/* Plan label */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 16px",
                      background: "rgba(200,151,62,0.1)",
                      border: `1px solid ${GBORDER}`,
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 700,
                      color: GOLD,
                      marginBottom: 28,
                    }}
                  >
                    {wizardPlan === "free"
                      ? "Free Plan"
                      : wizardPlan === "package-a"
                        ? "Package A"
                        : wizardPlan === "package-b"
                          ? "Package B"
                          : "Package C"}{" "}
                    selected
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => {
                        setWizardOpen(false);
                        navigate("/brand-profile");
                      }}
                      style={{
                        padding: "14px 40px",
                        background: "linear-gradient(135deg,#d4a853,#b8803a)",
                        border: "none",
                        borderRadius: 100,
                        color: "#0e0c09",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 24px rgba(200,151,62,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      Launch{" "}
                      {wizardPlan === "free"
                        ? "Free Plan"
                        : wizardPlan === "package-a"
                          ? "Package A"
                          : wizardPlan === "package-b"
                            ? "Package B"
                            : "Package C"}{" "}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setWizardDone(false);
                        setWizardPhase("questions");
                        setWizardStep(0);
                        setWizardAnswers({});
                        try {
                          localStorage.removeItem("evoke_assessment");
                        } catch {}
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: TEXT3,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 0",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = TEXT2)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = TEXT3)
                      }
                    >
                      Retake Assessment
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSetupModal && (
        <OnboardingWizard
          onComplete={handleSetupComplete}
          onDismiss={() => setShowSetupModal(false)}
        />
      )}
    </div>
  );
}
