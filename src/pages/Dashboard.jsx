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
  LayoutDashboard,
  Share2,
  Layers,
  Box,
  Clapperboard,
  CalendarRange,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import OnboardingModal from "../components/OnboardingModal.jsx";
import ProductLaunchModal from "../components/ProductLaunchModal.jsx";
import { db } from "../firebase";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { doc, updateDoc } from "firebase/firestore";
import { getOrCreateUser, getTokenBalance } from "../services/userService";

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
    active: true,
    comingSoon: false,
    path: "/campaign/content_calendar",
  },
  {
    icon: <MonitorPlay size={24} />,
    title: "Meta & Google Ads",
    subtitle: "Create & deploy campaigns",
    description: "Build ad creatives, define audiences, connect your Meta & Google Ads Manager accounts, and deploy campaigns within your chosen budget.",
    color: "#6366f1",
    border: "rgba(99,102,241,0.22)",
    badge: "ADS",
    active: true,
    comingSoon: false,
    path: "/connect-accounts",
  },
  {
    icon: <UserCheck size={24} />,
    title: "Audience Builder",
    subtitle: "Target the right customers",
    description: "AI builds custom audience profiles — demographics, interests, behaviours and lookalike seeds — ready to export to Meta or Google.",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.22)",
    badge: "AUDIENCE",
    active: true,
    comingSoon: false,
    path: "/audience-builder",
  },
  {
    icon: <RefreshCw size={24} />,
    title: "Retargeting Ads",
    subtitle: "Re-engage warm audiences",
    description: "Automatically build retargeting audiences from pixel data and launch retargeting campaigns to convert visitors who didn't buy.",
    color: "#ef4444",
    border: "rgba(239,68,68,0.22)",
    badge: "RETARGET",
    active: true,
    comingSoon: false,
    path: "/campaign/paid_advertising",
  },
  {
    icon: <BarChart2 size={24} />,
    title: "Ads Dashboard & Analytics",
    subtitle: "All your ad data in one place",
    description: "Collect impressions, clicks, CTR, spend, ROAS and conversion data from Meta and Google Ads Manager into a single dashboard.",
    color: "#14b8a6",
    border: "rgba(20,184,166,0.22)",
    badge: "ANALYTICS",
    active: true,
    comingSoon: false,
    path: "/analytics",
  },
  {
    icon: <HeartHandshake size={24} />,
    title: "After-Sales & Loyalty",
    subtitle: "Retain & reward customers",
    description: "Automate post-purchase emails, WhatsApp follow-ups, loyalty reward messages, and retention sequences for maximum customer lifetime value.",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.22)",
    badge: "RETENTION",
    active: true,
    comingSoon: false,
    path: "/campaign/crm_lifecycle",
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

/** Converts an ISO timestamp to a human-readable relative time string (e.g. "3h ago"). */
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

/** Modal shown when a user tries to launch a campaign without any connected social accounts. */
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

/** Modal shown when a user tries to launch a campaign but has 0 tokens remaining. */
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

/**
 * Dashboard — main page after login.
 * Loads the user's token balance and social accounts from Firestore,
 * displays campaign launcher cards, and shows campaign history from localStorage.
 * Also checks for any overdue scheduled day-posts on mount.
 */
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
      // Onboarding modal disabled — users go directly to dashboard
      // if (!data.onboardingComplete) setShowOnboarding(true);
    });
  }, [authReady, user]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("evoke_campaigns") || "[]");
    setCampaigns(stored);
    // Day 2+ posting is now handled server-side by the n8n Auto Publish
    // Schedule Trigger reading content_items from Firestore — no client-side
    // catch-up needed here regardless of whether this tab was open.
  }, []);

  /** Routes to the campaign form. Product type shows the visual tools modal first. */
  const handleLaunch = (type) => {
    // Product campaigns → show the AI visual tools modal first
    if (type === 'product') {
      setShowProductModal(true);
      return;
    }
    navigate(`/campaign/${type}`, { state: { from: '/cmo' } });
  };

  /** Stores campaign result in sessionStorage and navigates to the results page. */
  const viewCampaign = (c) => {
    sessionStorage.setItem("campaignResult", JSON.stringify(c.result));
    sessionStorage.setItem("campaignType", c.type);
    sessionStorage.setItem("campaignMeta", JSON.stringify(c.meta));
    navigate("/results");
  };

  /** Removes a campaign from localStorage and updates local state. */
  const deleteCampaign = (id) => {
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("evoke_campaigns", JSON.stringify(updated));
  };

  const connectedCount = Object.values(socialAccounts).filter(
    (a) => a?.connected,
  ).length;
  const displayed = showAll ? campaigns : campaigns.slice(0, 5);

  /** Resets onboardingComplete in Firestore so the user can redo the CMO setup wizard. */
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
              navigate('/campaign/product', { state: { from: '/cmo' } });
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "108px 24px 64px" }}
      >
        {/* Back to Campaign */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none",
            color: "rgba(240,235,224,0.35)", cursor: "pointer",
            fontSize: 13, marginBottom: 20, padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Campaign
        </button>

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
                  onClick={() => navigate('/analytics')}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: "rgba(129,140,248,0.1)",
                    border: "1px solid rgba(129,140,248,0.25)",
                    borderRadius: 10, color: "#818cf8",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <BarChart2 size={12} /> Analytics
                </button>
                <button
                  onClick={() => navigate('/crm')}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 10, color: "#10b981",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Users size={12} /> CRM
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

        {/* ═══ Campaign Launcher — choose a campaign type to generate ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{ marginBottom: 48 }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", background: "rgba(200,151,62,0.12)", border: "1px solid rgba(200,151,62,0.28)",
              borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#c8973e", letterSpacing: "0.06em", marginBottom: 12,
            }}>
              <LayoutDashboard size={11} /> CAMPAIGN STUDIO
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 4 }}>
              Choose a campaign type
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>All 25 AI agents, tools and campaign types in one place — pick one to generate.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
            {[
              { title: "Events",           color: "#c8973e", icon: <Calendar size={16} />, type: "event" },
              { title: "Products",         color: "#a855f7", icon: <Package size={16} />,  type: "product" },
              { title: "Brand Strategy",   color: "#6366f1", icon: <Zap size={16} />,      type: "brand" },
              { title: "Brand Knowledge Base", color: "#c8973e", icon: <BookOpen size={16} />, path: "/brand-kb" },
              { title: "Growth Strategy",  color: "#10b981", icon: <Rocket size={16} />,   type: "growth_strategy" },
              { title: "Content Calendar", color: "#3b82f6", icon: <Calendar size={16} />, type: "content_calendar" },
              { title: "SEO & Blog",       color: "#14b8a6", icon: <Globe size={16} />,    type: "seo_blog" },
              { title: "Email Drip",       color: "#f59e0b", icon: <Mail size={16} />,     type: "email_drip" },
              { title: "Influencer & PR",  color: "#ec4899", icon: <Users size={16} />,    type: "influencer" },
              { title: "Analytics Report", color: "#8b5cf6", icon: <PieChart size={16} />, type: "analytics_report" },
              { title: "Product Images",   color: "#06b6d4", icon: <Image size={16} />,    path: "/products" },
              { title: "360° Videos",      color: "#f97316", icon: <Film size={16} />,     path: "/products" },
              { title: "Lifestyle Photos", color: "#10b981", icon: <Image size={16} />,    path: "/products" },
              { title: "Trend Analysis",   color: "#ec4899", icon: <Hash size={16} />,     path: "/trends" },
              { title: "Audience Builder", color: "#8b5cf6", icon: <Users size={16} />,    path: "/audience-builder" },
              { title: "Paid Advertising", color: "#f59e0b", icon: <MonitorPlay size={16} />, type: "paid_advertising" },
              { title: "GEO Targeting",    color: "#14b8a6", icon: <Globe size={16} />,    type: "growth_strategy" },
              { title: "CRM & Lifecycle",  color: "#a855f7", icon: <HeartHandshake size={16} />, type: "crm_lifecycle" },
              { title: "Team Management",    color: "#6366f1", icon: <Users size={16} />,        path: "/team" },
              { title: "Partner Sharing",    color: "#14b8a6", icon: <Share2 size={16} />,      path: "/partner-sharing" },
              { title: "Banner Creation",    color: "#f59e0b", icon: <Sparkles size={16} />,    path: "/campaign/content_calendar", pkg: "A" },
              { title: "Social Posting",     color: "#10b981", icon: <Share2 size={16} />,      path: "/connect-accounts", pkg: "A" },
              { title: "Lifestyle Video",    color: "#f97316", icon: <Clapperboard size={16} />,path: "/products", pkg: "B" },
              { title: "30-Day Content Plan",color: "#3b82f6", icon: <CalendarRange size={16} />,type: "content_calendar", pkg: "B" },
              { title: "3D Product Images",  color: "#a855f7", icon: <Box size={16} />,         path: "/products", pkg: "C" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                whileHover={{ y: -2 }}
                onClick={() => item.path ? navigate(item.path) : handleLaunch(item.type)}
                style={{
                  background: "#1c1a13", border: `1px solid ${item.color}20`,
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}55` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.color}20` }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${item.color}12`, border: `1px solid ${item.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: item.color,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f0ebe0", letterSpacing: "-0.01em" }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,235,224,0.32)", marginTop: 1 }}>
                    {item.pkg ? <span style={{ color: "#c8973e", fontWeight: 700 }}>Pkg {item.pkg}</span> : "1 token"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
