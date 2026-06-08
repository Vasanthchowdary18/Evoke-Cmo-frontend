import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Package,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Mail,
  MessageSquare,
  Linkedin,
  Search,
  BarChart2,
  Shield,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Coins,
  Link2,
  AlertCircle,
  X,
  Check,
  Loader2,
  Rocket,
  Target,
  FileText,
  Globe,
  Users,
  PieChart,
  Briefcase,
  Store,
  Megaphone,
  BookOpen,
  Brain,
  Activity,
  TrendingDown,
  Award,
  Handshake,
  ChevronRight,
  Hash,
  Sparkles,
  Code2,
  Video,
  MessageCircle,
  Bot,
  RotateCcw,
  Image,
  Film,
  Tag,
  RefreshCw,
  MonitorPlay,
  UserCheck,
  BadgePercent,
  HeartHandshake,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import OnboardingModal from "../components/OnboardingModal.jsx";
import ProductLaunchModal from "../components/ProductLaunchModal.jsx";
import { db } from "../firebase";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { doc, updateDoc } from "firebase/firestore";
import { getOrCreateUser, getTokenBalance } from "../services/userService";
import { DAY_WEBHOOK_URL } from "../config.js";

const campaignCards = [
  {
    type: "event",
    icon: <Calendar size={32} />,
    title: "Events",
    subtitle: "1 token per campaign",
    description:
      "Launch high-impact event marketing with email, WhatsApp messages, a 7-day calendar, and SEO content — all generated instantly.",
    color: "#c8973e",
    border: "rgba(124,58,237,0.25)",
    features: [
      { icon: <Mail size={13} />, label: "Email Campaign" },
      { icon: <MessageSquare size={13} />, label: "WhatsApp Message" },
      { icon: <Calendar size={13} />, label: "7-Day Calendar" },
      { icon: <Search size={13} />, label: "SEO Content" },
    ],
    badge: "Event",
  },
  {
    type: "product",
    icon: <Package size={32} />,
    title: "Products",
    subtitle: "1 token per campaign",
    description:
      "Drive product launches with multi-channel content including LinkedIn posts, SMS, email, and compelling positioning statements.",
    color: "#c8973e",
    border: "rgba(200,151,62,0.22)",
    features: [
      { icon: <Mail size={13} />, label: "Email Campaign" },
      { icon: <Linkedin size={13} />, label: "LinkedIn Post" },
      { icon: <MessageSquare size={13} />, label: "SMS + WhatsApp" },
      { icon: <TrendingUp size={13} />, label: "Positioning" },
    ],
    badge: "Product",
    popular: true,
  },
  {
    type: "brand",
    icon: <Zap size={32} />,
    title: "Brands",
    subtitle: "1 token per campaign",
    description:
      "Build a complete brand strategy with ad copy, full brand messaging, Google Sheet logging, and priority support for enterprise teams.",
    color: "#a855f7",
    border: "rgba(168,85,247,0.25)",
    features: [
      { icon: <Shield size={13} />, label: "Brand Strategy" },
      { icon: <BarChart2 size={13} />, label: "Ad Copy" },
      { icon: <BarChart2 size={13} />, label: "Sheet Logging" },
      { icon: <Star size={13} />, label: "Priority Support" },
    ],
    badge: "Brand",
  },
];

const cmoIntelligenceModules = [
  {
    type: "growth_strategy",
    icon: <Rocket size={24} />,
    title: "Growth Strategy",
    subtitle: "Executive-level growth planning",
    description:
      "Create GTM strategies, identify revenue opportunities, forecast growth, and develop expansion roadmaps with AI-powered market analysis.",
    color: "#10b981",
    border: "rgba(16,185,129,0.25)",
    features: [
      "GTM Plan",
      "Revenue Forecast",
      "Market Analysis",
      "Partnerships",
    ],
    category: "STRATEGY",
  },
  {
    type: "competitive_intel",
    icon: <Target size={24} />,
    title: "Competitive Intel",
    subtitle: "Real-time competitor analysis",
    description:
      "Analyze competitors, monitor ad strategies, track SEO rankings, and identify market gaps to stay ahead of your competition.",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
    features: [
      "Competitor Ads",
      "SWOT Analysis",
      "Market Gaps",
      "Pricing Intel",
    ],
    category: "INTELLIGENCE",
  },
  {
    type: "content_calendar",
    icon: <BookOpen size={24} />,
    title: "Content Calendar",
    subtitle: "Full content strategy & planning",
    description:
      "Generate 30-day content calendars, seasonal campaigns, cross-platform posting schedules, and content mix strategies tailored to your brand.",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
    features: [
      "30-Day Calendar",
      "Platform Strategy",
      "Content Mix",
      "Seasonal Plans",
    ],
    category: "CONTENT",
  },
  {
    type: "seo_blog",
    icon: <Globe size={24} />,
    title: "SEO & Blog",
    subtitle: "Rank-ready content creation",
    description:
      "Generate full SEO blog posts, keyword strategies, meta optimization, and content briefs designed to rank and drive organic traffic.",
    color: "#c8973e",
    border: "rgba(200,151,62,0.22)",
    features: [
      "Full Blog Post",
      "Keyword Research",
      "Meta Tags",
      "Content Brief",
    ],
    category: "SEO",
  },
  {
    type: "email_drip",
    icon: <Mail size={24} />,
    title: "Email Drip Campaign",
    subtitle: "Automated email sequences",
    description:
      "Build complete email funnels with 5-email drip sequences, lifecycle campaigns, segmented messaging, and conversion-optimized copy.",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.25)",
    features: [
      "5-Email Sequence",
      "Subject Lines",
      "Lifecycle Flows",
      "A/B Variants",
    ],
    category: "EMAIL",
  },
  {
    type: "influencer",
    icon: <Users size={24} />,
    title: "Influencer & PR",
    subtitle: "Influencer campaigns & media",
    description:
      "Create influencer briefs, outreach templates, press releases, PR strategies, and partnership frameworks for maximum brand reach.",
    color: "#ec4899",
    border: "rgba(236,72,153,0.25)",
    features: [
      "Influencer Brief",
      "Press Release",
      "Outreach Template",
      "KPI Tracker",
    ],
    category: "INFLUENCE",
  },
  {
    type: "analytics_report",
    icon: <PieChart size={24} />,
    title: "Analytics Report",
    subtitle: "Executive KPI dashboards",
    description:
      "Generate marketing performance reports, KPI dashboards, ROAS analysis, CAC/LTV insights, and actionable strategic recommendations.",
    color: "#f97316",
    border: "rgba(249,115,22,0.25)",
    features: ["KPI Dashboard", "ROAS Report", "CAC/LTV", "Recommendations"],
    category: "ANALYTICS",
  },
  {
    type: "sales_enablement",
    icon: <Briefcase size={24} />,
    title: "Sales Enablement",
    subtitle: "Close more deals faster",
    description:
      "Generate sales decks, pitch scripts, objection handling guides, lead nurture sequences, and closing strategies for your sales team.",
    color: "#6366f1",
    border: "rgba(99,102,241,0.25)",
    features: ["Sales Deck", "Pitch Script", "Objection Guide", "Lead Nurture"],
    category: "SALES",
  },
  {
    type: "event_full",
    icon: <Megaphone size={24} />,
    title: "ELEVATE Event",
    subtitle: "Full event marketing lifecycle",
    description:
      "Complete end-to-end event marketing: speaker campaigns, countdown sequences, attendee emails, live social, and post-event upsell campaigns.",
    color: "#c8973e",
    border: "rgba(124,58,237,0.25)",
    features: [
      "Speaker Assets",
      "Countdown Series",
      "Attendee Emails",
      "Post-Event",
    ],
    category: "ELEVATE",
  },
  {
    type: "marketplace",
    icon: <Store size={24} />,
    title: "Marketplace Growth",
    subtitle: "EVOKE vendor & buyer campaigns",
    description:
      "Drive vendor growth, product launches, seasonal promotions, buyer retention campaigns, and marketplace SEO for EVOKE Marketplace.",
    color: "#14b8a6",
    border: "rgba(20,184,166,0.25)",
    features: [
      "Vendor Onboarding",
      "Product Listings",
      "Seasonal Promos",
      "Buyer Retention",
    ],
    category: "MARKETPLACE",
  },
];

const agentCards = [
  {
    type: "reddit",
    icon: <MessageSquare size={22} />,
    title: "Reddit Agent",
    subtitle: "Find threads & draft replies",
    color: "#ff4500",
    border: "rgba(255,69,0,0.2)",
    badge: "REDDIT",
  },
  {
    type: "seo",
    icon: <Search size={22} />,
    title: "SEO Agent",
    subtitle: "Keywords & blog drafts",
    color: "#10b981",
    border: "rgba(16,185,129,0.2)",
    badge: "SEO",
  },
  {
    type: "writer",
    icon: <FileText size={22} />,
    title: "Writer Agent",
    subtitle: "Long-form brand content",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.2)",
    badge: "WRITER",
  },
  {
    type: "linkedin_agent",
    icon: <Linkedin size={22} />,
    title: "LinkedIn Agent",
    subtitle: "Professional post drafts",
    color: "#0a66c2",
    border: "rgba(10,102,194,0.2)",
    badge: "LINKEDIN",
  },
];

const productToolCards = [
  {
    icon: <RotateCcw size={24} />,
    title: "Image → Multi Angles",
    subtitle: "E-commerce ready photos",
    description: "Upload one product photo and generate front, back, side, top and lifestyle angles — high-resolution and ready for your store.",
    color: "#10b981",
    border: "rgba(16,185,129,0.22)",
    badge: "VISUAL",
    active: true,
    path: "/products",
  },
  {
    icon: <Video size={24} />,
    title: "Image → 360° Video",
    subtitle: "Turntable product video",
    description: "Turn a single product image into a smooth 360° orbital rotation video — perfect for PDPs, social ads, and interactive embeds.",
    color: "#a855f7",
    border: "rgba(168,85,247,0.22)",
    badge: "360 VIDEO",
    active: true,
    path: "/products",
  },
  {
    icon: <Image size={24} />,
    title: "AI Lifestyle Images",
    subtitle: "Models wearing your product",
    description: "Upload a product image and AI places it on professional models in real-world lifestyle settings — ready for Instagram and e-commerce.",
    color: "#ec4899",
    border: "rgba(236,72,153,0.22)",
    badge: "LIFESTYLE",
    active: true,
    path: "/products",
  },
  {
    icon: <Film size={24} />,
    title: "AI Lifestyle Videos",
    subtitle: "Story-driven product videos",
    description: "Generate realistic lifestyle videos of your product being used by AI models based on your brand storyline — for Reels, Shorts & ads.",
    color: "#f97316",
    border: "rgba(249,115,22,0.22)",
    badge: "VIDEO",
    active: true,
    path: "/products",
  },
  {
    icon: <FileText size={24} />,
    title: "Product Description + Specs",
    subtitle: "E-commerce copy & SEO",
    description: "AI generates your product title, 6 bullet points, full description, technical specifications, meta tags, and 12 SEO keywords instantly.",
    color: "#06b6d4",
    border: "rgba(6,182,212,0.22)",
    badge: "COPY & SEO",
    active: true,
    path: "/product-desc",
  },
  {
    icon: <Tag size={24} />,
    title: "SEO, Meta Tags & Backlinks",
    subtitle: "Search visibility & ranking",
    description: "Generate SEO-optimised page titles, meta descriptions, Open Graph tags, structured data, keyword strategy and backlink targets.",
    color: "#c8973e",
    border: "rgba(200,151,62,0.22)",
    badge: "SEO",
    active: true,
    path: "/products",
  },
  {
    icon: <Sparkles size={24} />,
    title: "Banners & 30-Day Calendar",
    subtitle: "Visual content + schedule",
    description: "Create social media banners, ad creatives, and a full 30-day content calendar with daily post copy for every platform.",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.22)",
    badge: "CONTENT",
    active: false,
    comingSoon: true,
    path: null,
  },
  {
    icon: <MonitorPlay size={24} />,
    title: "Meta & Google Ads",
    subtitle: "Create & deploy campaigns",
    description: "Build ad creatives, define audiences, connect your Meta & Google Ads Manager accounts, and deploy campaigns within your chosen budget.",
    color: "#6366f1",
    border: "rgba(99,102,241,0.22)",
    badge: "ADS",
    active: false,
    comingSoon: true,
    path: null,
  },
  {
    icon: <UserCheck size={24} />,
    title: "Audience Builder",
    subtitle: "Target the right customers",
    description: "AI builds custom audience profiles — demographics, interests, behaviours and lookalike seeds — ready to export to Meta or Google.",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.22)",
    badge: "AUDIENCE",
    active: false,
    comingSoon: true,
    path: null,
  },
  {
    icon: <RefreshCw size={24} />,
    title: "Retargeting Ads",
    subtitle: "Re-engage warm audiences",
    description: "Automatically build retargeting audiences from pixel data and launch retargeting campaigns to convert visitors who didn't buy.",
    color: "#ef4444",
    border: "rgba(239,68,68,0.22)",
    badge: "RETARGET",
    active: false,
    comingSoon: true,
    path: null,
  },
  {
    icon: <BarChart2 size={24} />,
    title: "Ads Dashboard & Analytics",
    subtitle: "All your ad data in one place",
    description: "Collect impressions, clicks, CTR, spend, ROAS and conversion data from Meta and Google Ads Manager into a single dashboard.",
    color: "#14b8a6",
    border: "rgba(20,184,166,0.22)",
    badge: "ANALYTICS",
    active: false,
    comingSoon: true,
    path: null,
  },
  {
    icon: <HeartHandshake size={24} />,
    title: "After-Sales & Loyalty",
    subtitle: "Retain & reward customers",
    description: "Automate post-purchase emails, WhatsApp follow-ups, loyalty reward messages, and retention sequences for maximum customer lifetime value.",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.22)",
    badge: "RETENTION",
    active: false,
    comingSoon: true,
    path: null,
  },
];

const TYPE_META = {
  event: { color: "#c8973e", icon: <Calendar size={14} />, label: "Event" },
  product: { color: "#c8973e", icon: <Package size={14} />, label: "Product" },
  brand: { color: "#a855f7", icon: <Zap size={14} />, label: "Brand" },
  growth_strategy: {
    color: "#10b981",
    icon: <Rocket size={14} />,
    label: "Growth",
  },
  competitive_intel: {
    color: "#f59e0b",
    icon: <Target size={14} />,
    label: "Intel",
  },
  content_calendar: {
    color: "#3b82f6",
    icon: <BookOpen size={14} />,
    label: "Content",
  },
  seo_blog: { color: "#c8973e", icon: <Globe size={14} />, label: "SEO" },
  email_drip: { color: "#8b5cf6", icon: <Mail size={14} />, label: "Email" },
  influencer: {
    color: "#ec4899",
    icon: <Users size={14} />,
    label: "Influencer",
  },
  analytics_report: {
    color: "#f97316",
    icon: <PieChart size={14} />,
    label: "Analytics",
  },
  sales_enablement: {
    color: "#6366f1",
    icon: <Briefcase size={14} />,
    label: "Sales",
  },
  event_full: {
    color: "#c8973e",
    icon: <Megaphone size={14} />,
    label: "ELEVATE",
  },
  marketplace: {
    color: "#14b8a6",
    icon: <Store size={14} />,
    label: "Marketplace",
  },
  brand_strategy: {
    color: "#a855f7",
    icon: <Brain size={14} />,
    label: "Brand",
  },
  funnel_cro: { color: "#ef4444", icon: <Activity size={14} />, label: "CRO" },
};

const PLATFORM_META = {
  linkedin: { color: "#0a66c2", label: "LinkedIn" },
  instagram: { color: "#e1306c", label: "Instagram" },
  facebook: { color: "#1877f2", label: "Facebook" },
  whatsapp: { color: "#25d366", label: "WhatsApp" },
  email: { color: "#c8973e", label: "Email" },
  tiktok: { color: "#ff0050", label: "TikTok" },
  eventbrite: { color: "#F05537", label: "Eventbrite" },
  luma: { color: "#6C47FF", label: "Luma" },
  meetup: { color: "#ED1C40", label: "Meetup" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function NoAccountsModal({ onConnect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        style={{
          background: "#1c1a13",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 48,
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            display: "flex",
            borderRadius: 8,
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(200,151,62,0.1)",
            border: "1px solid rgba(212,168,83,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Link2 size={32} style={{ color: "#c8973e" }} />
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginBottom: 10,
            color: "#ffffff",
          }}
        >
          Connect your accounts first
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 15,
            lineHeight: 1.65,
            marginBottom: 32,
          }}
        >
          You need to connect at least{" "}
          <strong style={{ color: "#c8973e" }}>one social media account</strong>{" "}
          before launching a campaign. Your content will post directly to your
          own accounts.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onConnect}
            style={{
              padding: "13px 28px",
              background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Link2 size={16} /> Connect Accounts <ArrowRight size={16} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 24,
          }}
        >
          {["Facebook", "Instagram", "LinkedIn", "WhatsApp"].map((p) => (
            <div
              key={p}
              style={{
                padding: "5px 12px",
                background: "#0e0c09",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoTokensModal({ onBuy, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        style={{
          background: "#1c1a13",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 48,
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            display: "flex",
            borderRadius: 8,
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(200,151,62,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Coins size={32} style={{ color: "#c8973e" }} />
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginBottom: 10,
            color: "#ffffff",
          }}
        >
          You're out of tokens
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 15,
            lineHeight: 1.65,
            marginBottom: 32,
          }}
        >
          You need at least{" "}
          <strong style={{ color: "#c8973e" }}>1 campaign token</strong> to
          generate and post a campaign. Purchase a pack to continue.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onBuy}
            style={{
              padding: "13px 28px",
              background: "linear-gradient(135deg, #d4a853, #b8803a)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Coins size={16} /> Buy Tokens <ArrowRight size={16} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 24,
          }}
        >
          {[
            ["$10", "10 campaigns"],
            ["$20", "20 campaigns"],
            ["$30", "35 campaigns"],
          ].map(([price, label]) => (
            <div
              key={price}
              style={{
                padding: "6px 14px",
                background: "#0e0c09",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <strong style={{ color: "#ffffff" }}>{price}</strong> · {label}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { user, authReady } = useRequireAuth();
  const [tokenBalance, setTokenBalance] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState({});
  const [onboardingData, setOnboardingData] = useState(null);
  const [showNoTokens, setShowNoTokens] = useState(false);
  const [showNoAccounts, setShowNoAccounts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (!authReady || !user) return;
    getOrCreateUser(user.uid, user.displayName, user.email).then((data) => {
      setTokenBalance(data.tokenBalance ?? 0);
      setSocialAccounts(data.socialAccounts || {});
      if (data.onboardingData) setOnboardingData(data.onboardingData);
      if (!data.onboardingComplete) setShowOnboarding(true);
    });
  }, [authReady, user]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("evoke_campaigns") || "[]");
    setCampaigns(stored);

    // ── Check for missed day posts (browser was closed, now reopened) ──
    try {
      const queue = JSON.parse(
        localStorage.getItem("evoke_pending_days") || "[]",
      );
      const now = Date.now();
      let queueChanged = false;
      const updatedQueue = queue.map((item) => {
        if (item.posted) return item;
        const due = new Date(item.scheduledAt).getTime();
        if (due <= now) {
          // Trigger overdue day post
          fetch(DAY_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          })
            .then(() => {
              const campaigns = JSON.parse(
                localStorage.getItem("evoke_campaigns") || "[]",
              );
              const ci = campaigns.findIndex((c) => c.id === item.campaignId);
              if (ci !== -1) {
                campaigns[ci].daysPosted = [
                  ...new Set([...(campaigns[ci].daysPosted || [1]), item.day]),
                ];
                localStorage.setItem(
                  "evoke_campaigns",
                  JSON.stringify(campaigns),
                );
                setCampaigns([...campaigns]);
              }
            })
            .catch((e) =>
              console.warn(`Missed day ${item.day} post failed:`, e),
            );
          queueChanged = true;
          return { ...item, posted: true };
        }
        return item;
      });
      if (queueChanged)
        localStorage.setItem(
          "evoke_pending_days",
          JSON.stringify(updatedQueue),
        );
    } catch (e) {
      console.warn("Pending day check failed:", e);
    }
  }, []);

  const handleLaunch = (type) => {
    if (tokenBalance !== null && tokenBalance < 1) {
      setShowNoTokens(true);
      return;
    }
    if (connectedCount === 0) {
      setShowNoAccounts(true);
      return;
    }
    // Product campaigns → show the AI visual tools modal first
    if (type === 'product') {
      setShowProductModal(true);
      return;
    }
    navigate(`/campaign/${type}`);
  };

  const viewCampaign = (c) => {
    sessionStorage.setItem("campaignResult", JSON.stringify(c.result));
    sessionStorage.setItem("campaignType", c.type);
    sessionStorage.setItem("campaignMeta", JSON.stringify(c.meta));
    navigate("/results");
  };

  const deleteCampaign = (id) => {
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("evoke_campaigns", JSON.stringify(updated));
  };

  const connectedCount = Object.values(socialAccounts).filter(
    (a) => a?.connected,
  ).length;
  const displayed = showAll ? campaigns : campaigns.slice(0, 5);

  const handleRetakeOnboarding = async () => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { onboardingComplete: false });
    setShowOnboarding(true);
  };

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1c1a13",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={32}
          style={{ color: "#c8973e", animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c09", color: "#fff" }}>
      <Navbar />

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            user={user}
            onComplete={() => setShowOnboarding(false)}
          />
        )}
        {showNoTokens && (
          <NoTokensModal
            onBuy={() => {
              setShowNoTokens(false);
              navigate("/purchase");
            }}
            onClose={() => setShowNoTokens(false)}
          />
        )}
        {showNoAccounts && (
          <NoAccountsModal
            onConnect={() => {
              setShowNoAccounts(false);
              navigate("/connect-accounts");
            }}
            onClose={() => setShowNoAccounts(false)}
          />
        )}
        {showProductModal && (
          <ProductLaunchModal
            onClose={() => setShowProductModal(false)}
            onProceed={() => {
              setShowProductModal(false);
              navigate('/campaign/product');
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "108px 24px 64px" }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 44 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                className="badge"
                style={{ marginBottom: 16, display: "inline-flex" }}
              >
                <Zap size={13} /> Campaign Dashboard
              </div>
              <h1
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 900,
                  letterSpacing: "-0.025em",
                  color: "#ffffff",
                  marginBottom: 10,
                }}
              >
                {user?.displayName ? (
                  <>
                    Welcome back,{" "}
                    <span className="gradient-text">
                      {user.displayName.split(" ")[0]}!
                    </span>
                  </>
                ) : (
                  <>
                    What are you{" "}
                    <span className="gradient-text">marketing today?</span>
                  </>
                )}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, maxWidth: 480 }}>
                {onboardingData?.industry
                  ? `Your AI CMO is ready to build ${
                      {
                        tech: "Tech/SaaS",
                        fashion: "Fashion & Retail",
                        food: "Food & Beverage",
                        health: "Health & Wellness",
                        finance: "Finance/Fintech",
                        education: "Education",
                        events: "Events & Entertainment",
                        realestate: "Real Estate",
                        other: "",
                      }[onboardingData.industry] || onboardingData.industry
                    } campaigns tailored to your goal.`
                  : "Select a campaign type to generate your complete marketing package."}
              </p>
            </div>

            {/* Token balance card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 20px",
                  background: tokenBalance > 0 ? "rgba(200,151,62,0.12)" : "#fef2f2",
                  border: `1px solid ${tokenBalance > 0 ? "rgba(200,151,62,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background:
                      tokenBalance > 0
                        ? "rgba(200,151,62,0.12)"
                        : "rgba(239,68,68,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Coins
                    size={20}
                    style={{ color: tokenBalance > 0 ? "#c8973e" : "#ef4444" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      color: tokenBalance > 0 ? "#c8973e" : "#ef4444",
                    }}
                  >
                    {tokenBalance ?? "—"}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}
                  >
                    campaign token{tokenBalance !== 1 ? "s" : ""}
                  </div>
                </div>
              </motion.div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => navigate("/purchase")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: "rgba(200,151,62,0.12)",
                    border: "1px solid rgba(200,151,62,0.3)",
                    borderRadius: 10,
                    color: "#c8973e",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Coins size={12} /> Buy Tokens
                </button>
                <button
                  onClick={() => navigate("/connect-accounts")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: "#0e0c09",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: connectedCount > 0 ? "#10b981" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Link2 size={12} />
                  {connectedCount > 0
                    ? `${connectedCount} connected`
                    : "Connect Accounts"}
                </button>
                <button
                  onClick={handleRetakeOnboarding}
                  title="Retake CMO onboarding"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: "rgba(200,151,62,0.12)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: 10,
                    color: "#c8973e",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Zap size={12} /> CMO Setup
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CMO Profile Card */}
        {onboardingData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 22px",
              background: "#1c1a13",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              marginBottom: 24,
              flexWrap: "wrap",
              boxShadow: "none",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                flexShrink: 0,
                background: "linear-gradient(135deg, #d4a853, #b8803a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={20} color="#fff" fill="#fff" />
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 700,
                  marginBottom: 8,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Your CMO Profile
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {onboardingData.background && (
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "rgba(200,151,62,0.12)",
                      border: "1px solid rgba(124,58,237,0.2)",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#c8973e",
                    }}
                  >
                    👤{" "}
                    {{
                      digital_marketer: "Digital Marketer",
                      business_owner: "Business Owner",
                      sales_pro: "Sales Pro",
                      agency: "Agency/Freelancer",
                      creator: "Content Creator",
                      starter: "Just Starting",
                      founder: "Founder",
                      marketer: "Marketer",
                      ecommerce: "E-commerce",
                      other: "Other",
                    }[onboardingData.background] || onboardingData.background}
                  </span>
                )}
                {onboardingData.industry && (
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "rgba(200,151,62,0.1)",
                      border: "1px solid rgba(200,151,62,0.22)",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0891b2",
                    }}
                  >
                    🏭{" "}
                    {{
                      tech: "Tech/SaaS",
                      fashion: "Fashion & Retail",
                      food: "Food & Beverage",
                      health: "Health & Wellness",
                      finance: "Finance/Fintech",
                      education: "Education",
                      events: "Events & Entertainment",
                      realestate: "Real Estate",
                      other: "Other",
                    }[onboardingData.industry] || onboardingData.industry}
                  </span>
                )}
                {onboardingData.goal && (
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "#faf5ff",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#9333ea",
                    }}
                  >
                    🎯{" "}
                    {{
                      leads: "Generate Leads",
                      awareness: "Brand Awareness",
                      launch: "Launch Product/Event",
                      sales: "Drive Sales",
                      social: "Grow Social",
                      engage: "Engage Customers",
                    }[onboardingData.goal] || onboardingData.goal}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                ✨ Campaigns will auto-fill based on your profile
              </div>
              <button
                onClick={handleRetakeOnboarding}
                style={{
                  padding: "6px 14px",
                  background: "#0e0c09",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✏️ Edit Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* Connect Accounts Banner */}
        <AnimatePresence>
          {connectedCount === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                background: "rgba(200,151,62,0.1)",
                border: "1px solid rgba(212,168,83,0.25)",
                borderRadius: 14,
                marginBottom: 28,
                flexWrap: "wrap",
              }}
            >
              <AlertCircle
                size={18}
                style={{ color: "#c8973e", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#ffffff",
                    marginBottom: 2,
                  }}
                >
                  Connect your social accounts
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                  Your campaigns will post to your own Facebook, Instagram,
                  LinkedIn & WhatsApp — not ours.
                </p>
              </div>
              <button
                onClick={() => navigate("/connect-accounts")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  background: "#c8973e",
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Link2 size={13} /> Connect now <ArrowRight size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All AI Agents in One Continuous Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          style={{ marginTop: 40 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  background: "rgba(200,151,62,0.12)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#c8973e",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                <Bot size={11} /> ALL AI AGENTS
              </div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  marginBottom: 8,
                }}
              >
                All AI Marketing Agents
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 650 }}>
                Choose any agent below to create campaigns, content, strategy,
                events, emails, SEO, growth assets, and platform-specific
                marketing drafts in one place.
              </p>
            </div>
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 10,
                fontSize: 12,
                color: "#10b981",
                fontWeight: 700,
              }}
            >
              {campaignCards.length +
                cmoIntelligenceModules.length +
                agentCards.length}{" "}
              Agents Active
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            {[
              ...campaignCards.map((card) => ({
                ...card,
                group: "CAMPAIGN",
                cta: "Launch Campaign",
                path: `/campaign/${card.type}`,
                requiresAccounts: true,
                featureList:
                  card.features?.map((f) => ({
                    label: f.label,
                    icon: f.icon,
                  })) || [],
              })),
              ...cmoIntelligenceModules.map((mod) => ({
                ...mod,
                group: mod.category,
                badge: mod.category,
                cta: "Generate",
                path: `/campaign/${mod.type}`,
                requiresAccounts: true,
                featureList: mod.features?.map((f) => ({ label: f })) || [],
              })),
              ...agentCards.map((ag) => ({
                ...ag,
                group: ag.badge,
                description: ag.subtitle,
                cta: "Run Agent",
                path: `/agent/${ag.type}`,
                requiresAccounts: false,
                featureList: [],
              })),
            ].map((agent, i) => (
              <motion.div
                key={`${agent.group}-${agent.type}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.82 + i * 0.035 }}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => {
                  if (tokenBalance !== null && tokenBalance < 1) {
                    setShowNoTokens(true);
                    return;
                  }
                  if (agent.requiresAccounts && connectedCount === 0) {
                    setShowNoAccounts(true);
                    return;
                  }
                  navigate(agent.path);
                }}
                style={{
                  background: "#1c1a13",
                  border: `1px solid ${agent.border || `${agent.color}30`}`,
                  borderRadius: 16,
                  padding: 18,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {agent.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      padding: "4px 11px",
                      background: "linear-gradient(135deg, #d4a853, #b8803a)",
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 800,
                      color: "white",
                      letterSpacing: "0.05em",
                    }}
                  >
                    POPULAR
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: `${agent.color}12`,
                      border: `1px solid ${agent.border || `${agent.color}30`}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: agent.color,
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(agent.icon, { size: 20 })}
                  </div>
                  <div
                    style={{
                      padding: "2px 8px",
                      background: `${agent.color}10`,
                      border: `1px solid ${agent.border || `${agent.color}30`}`,
                      borderRadius: 100,
                      fontSize: 9,
                      fontWeight: 800,
                      color: agent.color,
                      letterSpacing: "0.06em",
                      maxWidth: 100,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {(agent.badge || agent.group).toUpperCase()}
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    color: "#ffffff",
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {agent.title}
                </h3>
                {agent.subtitle && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {agent.subtitle}
                  </p>
                )}
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    lineHeight: 1.55,
                    marginBottom: 12,
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {agent.description}
                </p>

                {agent.featureList.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 5,
                      marginBottom: 12,
                    }}
                  >
                    {agent.featureList.slice(0, 3).map((f) => (
                      <div
                        key={f.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "2px 7px",
                          background: `${agent.color}08`,
                          border: `1px solid ${agent.border || `${agent.color}30`}`,
                          borderRadius: 100,
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {f.icon && (
                          <span style={{ color: agent.color, display: "flex" }}>
                            {React.cloneElement(f.icon, { size: 10 })}
                          </span>
                        )}
                        {f.label}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    marginTop: "auto",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}
                  >
                    1 token
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 12,
                      fontWeight: 800,
                      color: agent.color,
                    }}
                  >
                    {tokenBalance < 1
                      ? "Buy Tokens"
                      : agent.requiresAccounts && connectedCount === 0
                        ? "Connect Accounts"
                        : agent.cta}
                    <ChevronRight size={13} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Product & E-Commerce Tools ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ marginTop: 56 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.06em", marginBottom: 12 }}>
                <Package size={11} /> PRODUCT & E-COMMERCE TOOLS
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 8 }}>
                Product Visual & Sales Tools
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 620 }}>
                Turn a single product image into a complete e-commerce asset library — photos, videos, copy, ads, and customer retention, all in one place.
              </p>
            </div>
            <div style={{ padding: "8px 16px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, fontSize: 12, color: "#06b6d4", fontWeight: 700, whiteSpace: "nowrap" }}>
              {productToolCards.filter(t => t.active).length} Active · {productToolCards.filter(t => t.comingSoon).length} Coming Soon
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {productToolCards.map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.05 + i * 0.04 }}
                whileHover={tool.active ? { y: -4, scale: 1.01 } : {}}
                onClick={() => { if (tool.active && tool.path) navigate(tool.path) }}
                style={{
                  background: "#1c1a13",
                  border: `1px solid ${tool.border}`,
                  borderRadius: 18,
                  padding: 24,
                  cursor: tool.active ? "pointer" : "default",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                  opacity: tool.comingSoon ? 0.72 : 1,
                  minHeight: 230,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Coming soon badge */}
                {tool.comingSoon && (
                  <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
                    COMING SOON
                  </div>
                )}

                {/* Icon + badge row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `${tool.color}12`, border: `1px solid ${tool.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}>
                    {tool.icon}
                  </div>
                  <div style={{ padding: "3px 9px", background: `${tool.color}10`, border: `1px solid ${tool.border}`, borderRadius: 100, fontSize: 10, fontWeight: 800, color: tool.color, letterSpacing: "0.06em" }}>
                    {tool.badge}
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em", color: "#ffffff", marginBottom: 4 }}>{tool.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>{tool.subtitle}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, flex: 1 }}>{tool.description}</p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "auto" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                    {tool.active ? "Free" : "Coming Soon"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 800, color: tool.active ? tool.color : "rgba(255,255,255,0.2)" }}>
                    {tool.active ? "Open Tool" : "Notify Me"} <ChevronRight size={13} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Executive Suite CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          style={{
            marginTop: 48,
            padding: 36,
            background: "#1c1a13",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: "none",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #d4a853, #b8803a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Brain size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: 6,
              }}
            >
              AI Executive Workforce — Coming Soon
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>
              Deploy AI CFO, CRO, CTO, and Compliance Officers alongside your
              CMO for full executive AI coverage across finance, revenue,
              technology, and governance.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {[
              {
                label: "AI CFO",
                color: "#c8973e",
                desc: "Financial Forecasting",
              },
              { label: "AI CRO", color: "#10b981", desc: "Revenue & Sales" },
              {
                label: "AI CTO",
                color: "#f59e0b",
                desc: "Tech & Infrastructure",
              },
            ].map((ag) => (
              <div
                key={ag.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  background: "#0e0c09",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: ag.color,
                  }}
                />
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: ag.color }}
                >
                  {ag.label}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  {ag.desc}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    background: "#1c1a13",
                    borderRadius: 6,
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 700,
                  }}
                >
                  SOON
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Campaign History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: 64 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  background: "rgba(200,151,62,0.12)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#c8973e",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                <Clock size={11} /> CAMPAIGN HISTORY
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                Campaign History
              </h2>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 4 }}>
                {campaigns.length === 0
                  ? "No campaigns yet — launch one above"
                  : `${campaigns.length} campaign${campaigns.length > 1 ? "s" : ""} generated`}
              </p>
            </div>
            {campaigns.length > 5 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="btn-ghost"
                style={{ fontSize: 13 }}
              >
                {showAll ? (
                  <>
                    <ChevronUp size={14} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Show all ({campaigns.length})
                  </>
                )}
              </button>
            )}
          </div>

          {campaigns.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                background: "#1c1a13",
                border: "1px dashed #cbd5e1",
                borderRadius: 16,
              }}
            >
              <Clock size={36} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 14 }} />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 15 }}>
                Your campaign history will appear here once you launch your
                first campaign
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AnimatePresence>
                {displayed.map((c, i) => {
                  const meta = TYPE_META[c.type] || TYPE_META.event;
                  const platforms = Array.isArray(c.platforms)
                    ? c.platforms
                    : [];
                  const goalText = c.goal
                    ? c.goal.length > 90
                      ? c.goal.slice(0, 90) + "…"
                      : c.goal
                    : "";
                  const audience = c.targetAudience || "";
                  const totalDays = c.campaignDays || 1;
                  const postedDays = Array.isArray(c.daysPosted)
                    ? c.daysPosted.length
                    : 1;
                  const isMultiDay = totalDays > 1;
                  const pct = Math.round((postedDays / totalDays) * 100);
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        background: "#1c1a13",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        padding: "18px 20px",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${meta.color}40`;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(245,240,232,0.15)";
                        e.currentTarget.style.boxShadow =
                          "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    >
                      {/* ── Top row: icon + name + actions ── */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 13,
                            background: `${meta.color}12`,
                            border: `1px solid ${meta.color}25`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: meta.color,
                            flexShrink: 0,
                          }}
                        >
                          {React.cloneElement(meta.icon, { size: 20 })}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 15,
                                color: "#ffffff",
                              }}
                            >
                              {c.name}
                            </span>
                            <span
                              style={{
                                padding: "2px 9px",
                                background: `${meta.color}12`,
                                border: `1px solid ${meta.color}25`,
                                borderRadius: 100,
                                fontSize: 10,
                                fontWeight: 700,
                                color: meta.color,
                                letterSpacing: "0.05em",
                                flexShrink: 0,
                              }}
                            >
                              {meta.label.toUpperCase()}
                            </span>
                            {isMultiDay && (
                              <span
                                style={{
                                  padding: "2px 9px",
                                  background: "rgba(16,185,129,0.1)",
                                  border: "1px solid rgba(16,185,129,0.3)",
                                  borderRadius: 100,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#10b981",
                                  flexShrink: 0,
                                }}
                              >
                                🗓 {totalDays}-DAY
                              </span>
                            )}
                            <span
                              style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.35)",
                              }}
                            >
                              <Clock size={10} /> {timeAgo(c.date)}
                            </span>
                          </div>

                          {/* Goal */}
                          {goalText && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.5)",
                                lineHeight: 1.55,
                                marginBottom: 8,
                                margin: "0 0 8px",
                              }}
                            >
                              🎯 {goalText}
                            </p>
                          )}

                          {/* Brand name if different from campaign name */}
                          {c.brandName && c.brandName !== c.name && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.35)",
                                marginBottom: 8,
                              }}
                            >
                              Brand:{" "}
                              <span
                                style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}
                              >
                                {c.brandName}
                              </span>
                            </p>
                          )}

                          {/* Target audience */}
                          {audience && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.35)",
                                marginBottom: 8,
                              }}
                            >
                              <Users size={10} />
                              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                                {audience.length > 60
                                  ? audience.slice(0, 60) + "…"
                                  : audience}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexShrink: 0,
                            alignItems: "flex-start",
                          }}
                        >
                          <button
                            onClick={() => viewCampaign(c)}
                            className="btn-ghost"
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Eye size={12} /> View Results
                          </button>
                          <button
                            onClick={() => deleteCampaign(c.id)}
                            style={{
                              padding: "6px 9px",
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 8,
                              cursor: "pointer",
                              color: "rgba(255,255,255,0.25)",
                              display: "flex",
                              alignItems: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                "rgba(239,68,68,0.4)";
                              e.currentTarget.style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "rgba(245,240,232,0.15)";
                              e.currentTarget.style.color = "#cbd5e1";
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* ── Multi-day progress bar ── */}
                      {isMultiDay && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.5)",
                              }}
                            >
                              Campaign Progress
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "#10b981",
                                fontWeight: 700,
                              }}
                            >
                              {postedDays} / {totalDays} days posted
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: "#1c1a13",
                              borderRadius: 100,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`,
                                borderRadius: 100,
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                          {c.dailyPostTime && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.35)",
                                marginTop: 4,
                              }}
                            >
                              ⏰ Auto-posts daily at {c.dailyPostTime} via n8n
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Bottom row: platform badges + posted status ── */}
                      {platforms.length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.35)",
                              letterSpacing: "0.06em",
                              marginRight: 4,
                            }}
                          >
                            POSTED TO
                          </span>
                          {platforms.map((p) => {
                            const pm = PLATFORM_META[p];
                            if (!pm) return null;
                            return (
                              <span
                                key={p}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 9px",
                                  background: `${pm.color}0f`,
                                  border: `1px solid ${pm.color}30`,
                                  borderRadius: 100,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: pm.color,
                                }}
                              >
                                <span
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: pm.color,
                                    flexShrink: 0,
                                  }}
                                />
                                {pm.label}
                              </span>
                            );
                          })}
                          <span
                            style={{
                              marginLeft: "auto",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              color: "#10b981",
                              fontWeight: 600,
                            }}
                          >
                            <Check size={11} /> Sent
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
