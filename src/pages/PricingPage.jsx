import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Check,
  Minus,
  ArrowRight,
  Zap,
  ChevronDown,
  Plus,
  Shield,
  Lock,
  Activity,
  UserCheck,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { redirectToLogin } from "../lib/authUtils";

/* ─── Figma "Pricing" frame colours (shared with Landing) ─── */
const BG = "#05050A"; // Figma frame background (1440 × 3800)
const BG2 = "#050810";
const CARD = "#0d1121";
const GOLD = "#c8973e";
const ORANGE = "#e08c35";
const GDIM = "rgba(200,151,62,0.10)";
const GBORDER = "rgba(200,151,62,0.22)";
const TEXT = "#f0ebe0";
const TEXT2 = "rgba(240,235,224,0.55)";
const TEXT3 = "rgba(240,235,224,0.32)";
const BORDER = "rgba(255,255,255,0.08)";
const NAVY = "#0a0f1e";

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};
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

const goldGrad = {
  background: "linear-gradient(135deg, #e8c47a 10%, #c8973e 60%, #a87030 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};
const DISCOUNT_GRADIENT =
  "linear-gradient(306.67deg, #9F6F3A 34.55%, #BE954A 95.9%)";

/* ═══════════════════════════════════════════════════════════
   DATA  — Figma "Pricing" frame
   NOTE: tier names, prices and bullet copy are read from the Figma
   export. Annual price (Pro) is derived as monthly − 20%; the
   comparison-table detail rows + FAQ copy are best-effort fill —
   verify against the Figma "ComparisonSection" / "FAQSection".
   ═══════════════════════════════════════════════════════════ */
// NOTE: Starter tier price/features are placeholders (Vasanth asked to proceed
// without giving exact numbers) — adjust monthly/annual/features to your real
// pricing before launch. Free Trial now tracks a real trialDays length (see
// trialStartedAt written in OnboardingWizard.jsx) — expiry ENFORCEMENT
// (what happens when the trial runs out) is intentionally not built yet since
// that wasn't specified; flag before shipping to real users.
const PLANS = [
  {
    key: "freeTrial",
    label: "FREE TRIAL",
    col: "Free Trial",
    accent: "#6C63FF",
    monthly: "$0",
    annual: "$0",
    per: "/14 days",
    trialDays: 14,
    desc: "Try the full platform free for 14 days — no card required.",
    features: [
      "Access to 4 core agents",
      "Up to $10,000 ad spend managed",
      "Bi-weekly performance audit",
      "Slack dashboard integration",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    key: "starter",
    label: "STARTER",
    col: "Starter",
    accent: "#10b981",
    monthly: "$30",
    annual: "$24",
    per: "/month",
    desc: "For small teams getting serious about consistent growth.",
    features: [
      "Access to 6 core agents",
      "Up to $50,000 ad spend managed",
      "Weekly performance audit",
      "Email support",
    ],
    cta: "Get Started Now",
    popular: false,
  },
  {
    key: "pro",
    label: "PROFESSIONAL",
    col: "Professional",
    accent: "#C8962A",
    monthly: "$100",
    annual: "$80",
    per: "/month",
    desc: "Designed for mid-market scale-ups requiring systematic, continuous growth loops.",
    features: [
      "Access to all 12 core agents",
      "Up to $500,000 ad spend managed",
      "Dynamic cross-agent orchestration",
      "Dedicated technical workspace",
    ],
    cta: "Get Started Now",
    popular: true,
  },
  {
    key: "enterprise",
    label: "ENTERPRISE",
    col: "Enterprise",
    accent: "#06B6D4",
    monthly: "Custom",
    annual: "Custom",
    per: "",
    desc: "Full corporate marketing ecosystem with custom vector agent tooling.",
    features: [
      "Unlimited custom agents",
      "No ad spend limits",
      "Dedicated localized deployment",
      "Custom vector-database migration",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

/* Comparison table — Feature / Starter / Pro / Enterprise
   A cell value: string → shown as text, true → ✓, false → — */
const COMPARE_GROUPS = [
  {
    group: "Core Features",
    rows: [
      {
        feature: "AI Agents Count",
        freeTrial: "4",
        starter: "6",
        pro: "12",
        enterprise: "Unlimited",
      },
      {
        feature: "Monthly Actions",
        freeTrial: "5,000",
        starter: "15,000",
        pro: "50,000",
        enterprise: "Unlimited",
      },
      {
        feature: "Brand Workspaces",
        freeTrial: "1",
        starter: "2",
        pro: "5",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    group: "Support",
    rows: [
      { feature: "Email Support", freeTrial: true, starter: true, pro: true, enterprise: true },
      { feature: "Chat Support", freeTrial: false, starter: true, pro: true, enterprise: true },
      {
        feature: "Priority 24/7 Support",
        freeTrial: false,
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        feature: "Dedicated Success Manager",
        freeTrial: false,
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    group: "Analytics",
    rows: [
      {
        feature: "Basic Dashboard",
        freeTrial: true,
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        feature: "Advanced Reports",
        freeTrial: false,
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        feature: "White-label Reports",
        freeTrial: false,
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
];

/* FAQ — first item copy confirmed from Figma; remaining 5 are best-effort fill (verify against Figma) */
const FAQS = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. If you upgrade, the change is instant and prorated. Downgrades apply at the end of your billing cycle.",
  },
  {
    q: "What’s included in the Free plan?",
    a: "The Free plan gives you access to 4 core agents, up to $10,000 in managed ad spend, bi-weekly performance audits, and Slack dashboard integration — with no credit card required to start.",
  },
  {
    q: "What counts as a “monthly action”?",
    a: "An action is any agent-executed task — generating a campaign, drafting content, launching an ad set, or producing a report. Your plan resets its action allowance at the start of each billing cycle.",
  },
  {
    q: "How does the 20% annual discount work?",
    a: "Choosing Annual billing charges you once per year at a 20% discount versus paying month-to-month. Your effective monthly rate is shown on each card when Annual is selected.",
  },
  {
    q: "What does “ad spend managed” mean?",
    a: "It’s the maximum monthly advertising budget the agents are allowed to plan, deploy, and optimise on your behalf across connected channels — it is not an additional charge from Evoke.",
  },
  {
    q: "Do you offer custom enterprise deployments?",
    a: "Yes. The Sovereign CMO tier includes unlimited custom agents, dedicated localized deployment, and custom vector-database migration. Reach out via Contact Sales to scope your rollout.",
  },
];

/* ─── comparison cell renderer ─── */
function Cell({ value, accent }) {
  if (value === true)
    return (
      /* Frame — 20×20, radius 10, gold-gradient bg, dark checkmark */
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 10,
          background: DISCOUNT_GRADIENT,
          flexShrink: 0,
        }}
      >
        <Check size={12} color="#080810" strokeWidth={2.5} />
      </span>
    );
  if (value === false)
    return <Minus size={16} color="rgba(240,235,224,0.22)" strokeWidth={2.5} />;
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: accent ? 700 : 500,
        color: accent ? TEXT : TEXT2,
        fontFamily: "'Manrope','Inter',sans-serif",
      }}
    >
      {value}
    </span>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null);

  const getStarted = (planKey) => {
    try {
      if (planKey) localStorage.setItem("evoke_selected_package", planKey);
    } catch {}
    if (user) navigate("/brand-profile");
    else redirectToLogin(window.location.origin + "/brand-profile");
  };
  // NOTE: replace with the team's real sales inbox / contact route.
  const contactSales = () => {
    window.location.href =
      "mailto:sales@evokemarketplace.com?subject=Sovereign%20CMO%20%E2%80%94%20Enterprise%20enquiry";
  };

  const colFor = (plan) =>
    plan.monthly === "Custom"
      ? "Custom"
      : billing === "annual"
        ? plan.annual
        : plan.monthly;

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
      {/* ── Global orbs background (matches homepage) ── */}
      <div
        style={{
          position: "absolute",
          top: -450,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1200,
          height: 900,
          borderRadius: "50%",
          background: "#6C63FF",
          opacity: 0.18,
          filter: "blur(220px)",
        }}
      />

      <Navbar />

      {/* ══════════════════════════════════════════════════
          PRICING HERO  — "Choose the plan that scales with you"
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "120px 40px 0",
          textAlign: "center",
        }}
      >
        {/* Hero — Figma: 1000×426, padding-top 40, padding-bottom 64, gap 24 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            width: 1000,
            maxWidth: "100%",
            minHeight: 426,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 40,
            paddingBottom: 64,
            gap: 24,
            boxSizing: "border-box",
          }}
        >
          {/* BadgePill — 231×32, gap 8, radius 20, border 1px solid #6C63FF, bg #6C63FF22 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              padding: "8px 16px",
              background: "rgba(108,99,255,0.13)",
              border: "1px solid #6C63FF",
              borderRadius: 20,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#6C63FF",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Manrope','Inter',sans-serif",
                lineHeight: "100%",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
              }}
            >
              Simple, Transparent Pricing
            </span>
          </div>

          <div>
            {/* H1 — Manrope 800, 56px, line-height 110%, solid white, no gradient span (per Figma) */}
            <h1
              style={{
                fontSize: "clamp(32px,5.5vw,56px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: "110%",
                margin: "0 0 18px",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              Choose the plan that scales with
              <br />
              you
            </h1>
            {/* Subtext — Manrope 400, 18px, line-height 150%, center, #A3A3C2 */}
            <p
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: "#A3A3C2",
                lineHeight: "150%",
                letterSpacing: 0,
                maxWidth: 560,
                margin: "0 auto",
                fontFamily: "'Manrope','Inter',sans-serif",
                textAlign: "center",
              }}
            >
              All plans include access to the Evoke agent infrastructure. No
              hidden fees.
            </p>
          </div>

          {/* ToggleContainer — 260×40, gap 16 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              paddingTop: 12,
              height: 40,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Manrope','Inter',sans-serif",
                lineHeight: "100%",
                color: billing === "monthly" ? "#FFFFFF" : "#A3A3C2",
                transition: "color 0.2s",
              }}
            >
              Monthly
            </span>

            {/* Switch — 52×28, radius 14, padding 2, bg #6C63FF when annual */}
            <button
              onClick={() =>
                setBilling((b) => (b === "monthly" ? "annual" : "monthly"))
              }
              aria-label="Toggle billing period"
              style={{
                position: "relative",
                width: 52,
                height: 28,
                borderRadius: 14,
                padding: 2,
                border: "none",
                background:
                  billing === "annual" ? "#6C63FF" : "rgba(255,255,255,0.12)",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: billing === "annual" ? 26 : 2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  transition: "left 0.22s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              />
            </button>

            {/* Frame — Annual label + DiscountBadge, 121×22, gap 8 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 22,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Manrope','Inter',sans-serif",
                  lineHeight: "100%",
                  color: billing === "annual" ? "#FFFFFF" : "#A3A3C2",
                  transition: "color 0.2s",
                }}
              >
                Annual
              </span>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  background: DISCOUNT_GRADIENT,
                  color: "#080810",
                  whiteSpace: "nowrap",
                }}
              >
                SAVE 20%
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          PRICING CARDS  — 3 tiers — Figma: 1280×542, padding-bottom 80
      ══════════════════════════════════════════════════ */}
      <section
        style={{ position: "relative", zIndex: 1, padding: "0 40px 80px" }}
      >
        {/* pricing-grid — 1280×442, gap 24 */}
        <div
          className="pricing-grid"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.key} delay={i * 0.08} style={{ display: "flex" }}>
              {/* pricing-card — 410.67×442, gap 24, radius 20, padding 32, bg #11111E99, blur(12px) */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  background: "rgba(17,17,30,0.6)",
                  border: plan.popular
                    ? `2px solid ${plan.accent}`
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: 32,
                  boxSizing: "border-box",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {plan.popular && (
                  /* badge — 74×23, padding 4px 12px, radius 100, bg #C8962A */
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#C8962A",
                      color: "#080810",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "'Manrope','Inter',sans-serif",
                      padding: "4px 12px",
                      borderRadius: 100,
                      lineHeight: "100%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    POPULAR
                  </div>
                )}

                {/* pricing-header — gap 8, height 139 */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'Manrope','Inter',sans-serif",
                      lineHeight: "100%",
                      color: plan.accent,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {plan.label}
                  </div>

                  {/* price-row — gap 4, flex row */}
                  <div
                    style={{ display: "flex", alignItems: "flex-end", gap: 4 }}
                  >
                    <span
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        letterSpacing: 0,
                        lineHeight: "100%",
                        color: "#F8FAFC",
                        fontFamily: "'Manrope','Inter',sans-serif",
                      }}
                    >
                      {colFor(plan)}
                    </span>
                    {plan.per && plan.monthly !== "Custom" && (
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: "100%",
                          color: "#94A3B8",
                          fontFamily: "'Manrope','Inter',sans-serif",
                          paddingBottom: 3,
                        }}
                      >
                        {plan.per}
                      </span>
                    )}
                  </div>
                  {plan.monthly !== "Custom" &&
                    billing === "annual" &&
                    plan.key !== "freeTrial" && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        billed annually · 20% off
                      </div>
                    )}

                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      lineHeight: "140%",
                      color: "#94A3B8",
                      fontFamily: "'Manrope','Inter',sans-serif",
                      margin: 0,
                    }}
                  >
                    {plan.desc}
                  </p>
                </div>

                {/* Line divider — 1px solid #FFFFFF0A */}
                <div
                  style={{
                    width: "100%",
                    height: 0,
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                />

                {/* features-list — gap 12 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {plan.features.map((f) => (
                    <div
                      key={f}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Check
                        size={16}
                        color={plan.accent}
                        strokeWidth={2.5}
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: "100%",
                          color: "#F8FAFC",
                          fontFamily: "'Manrope','Inter',sans-serif",
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* cta-wrapper — padding-top 12 */}
                <div style={{ paddingTop: 12 }}>
                  <button
                    onClick={
                      plan.key === "enterprise" ? contactSales : () => getStarted(plan.key)
                    }
                    style={{
                      width: "100%",
                      height: 43,
                      borderRadius: 100,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'Manrope','Inter',sans-serif",
                      lineHeight: "100%",
                      border: plan.popular
                        ? "none"
                        : "1px solid rgba(255,255,255,0.06)",
                      background: plan.popular
                        ? "linear-gradient(81.63deg,#BE954A -7.2%,#9F6F3A 64.21%)"
                        : "transparent",
                      color: plan.popular ? "#080810" : "#F8FAFC",
                      transition:
                        "transform 0.18s, box-shadow 0.18s, filter 0.18s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      if (plan.popular)
                        e.currentTarget.style.boxShadow =
                          "0 12px 32px rgba(190,149,74,0.45)";
                      else e.currentTarget.style.filter = "brightness(1.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.filter = "none";
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          COMPARE ALL FEATURES — Figma: 1280×1247, padding-top 64, padding-bottom 80, gap 32
      ══════════════════════════════════════════════════ */}
      <section
        style={{ position: "relative", zIndex: 1, padding: "64px 40px 80px" }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <FadeIn>
            {/* Heading — Manrope 800, 32px, line-height 100%, white */}
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: "100%",
                letterSpacing: 0,
                color: "#FFFFFF",
                fontFamily: "'Manrope','Inter',sans-serif",
                margin: 0,
              }}
            >
              Compare all features
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            {/* Table — 1280×1068, radius 16, bg #0F0F1A, border 1px solid #1E1E30 */}
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #1E1E30",
                borderRadius: 16,
                background: "#0F0F1A",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 640,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  {/* TableRow — height 55, padding 18px 24px, border-bottom 1px solid #1E1E30 */}
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        height: 55,
                        padding: "18px 24px",
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: "100%",
                        color: "#FFFFFF",
                        fontFamily: "'Manrope','Inter',sans-serif",
                        borderBottom: "1px solid #1E1E30",
                        width: "40%",
                        boxSizing: "border-box",
                      }}
                    >
                      Feature
                    </th>
                    {["Free Trial", "Starter", "Professional", "Enterprise"].map((c) => (
                      <th
                        key={c}
                        style={{
                          textAlign: "center",
                          height: 55,
                          padding: "18px 16px",
                          fontSize: 14,
                          fontWeight: 800,
                          lineHeight: "100%",
                          color: c === "Professional" ? "#C8962A" : "#FFFFFF",
                          borderBottom: "1px solid #1E1E30",
                          fontFamily: "'Manrope','Inter',sans-serif",
                          boxSizing: "border-box",
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_GROUPS.map((group) => (
                    <React.Fragment key={group.group}>
                      {/* CategoryRow — height 48, padding 16px 24px, bg #111122 */}
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            height: 48,
                            padding: "16px 24px",
                            fontSize: 12,
                            fontWeight: 800,
                            lineHeight: "100%",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "#6C63FF",
                            background: "#111122",
                            fontFamily: "'Manrope','Inter',sans-serif",
                            boxSizing: "border-box",
                          }}
                        >
                          {group.group}
                        </td>
                      </tr>
                      {/* TableRow — height 56, padding 18px 24px, border-bottom 1px solid #1E1E30 */}
                      {group.rows.map((row, ri) => (
                        <tr
                          key={row.feature}
                          style={{
                            height: 56,
                            borderBottom: "1px solid #1E1E30",
                          }}
                        >
                          <td
                            style={{
                              padding: "18px 24px",
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: "100%",
                              color: "#A3A3C2",
                              fontFamily: "'Manrope','Inter',sans-serif",
                              boxSizing: "border-box",
                            }}
                          >
                            {row.feature}
                          </td>
                          <td
                            style={{
                              padding: "18px 16px",
                              textAlign: "center",
                            }}
                          >
                            <Cell value={row.freeTrial} />
                          </td>
                          <td
                            style={{
                              padding: "18px 16px",
                              textAlign: "center",
                            }}
                          >
                            <Cell value={row.starter} />
                          </td>
                          <td
                            style={{
                              padding: "18px 16px",
                              textAlign: "center",
                              background: "rgba(200,151,62,0.03)",
                            }}
                          >
                            <Cell value={row.pro} accent />
                          </td>
                          <td
                            style={{
                              padding: "18px 16px",
                              textAlign: "center",
                            }}
                          >
                            <Cell value={row.enterprise} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQSection — Figma: 1280×671, padding-top 64, padding-bottom 80, gap 40
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "64px 40px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <FadeIn>
            {/* Heading — Manrope 800, 32px, line-height 100%, center, white */}
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: "100%",
                letterSpacing: 0,
                textAlign: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#FFFFFF",
                margin: "0 0 40px",
              }}
            >
              Frequently Asked Questions
            </h2>
          </FadeIn>

          {/* FAQGrid — 1280×443, gap 24, 2 columns of 628 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            {[0, 1].map((col) => (
              <div
                key={col}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {FAQS.filter((_, i) => i % 2 === col).map((faq) => {
                  const i = FAQS.indexOf(faq);
                  const isOpen = openFaq === i;
                  return (
                    <FadeIn key={faq.q} delay={i * 0.04}>
                      {/* Accordion — radius 12, padding 24, bg #0F0F1A, border 1px solid #1E1E30, gap 12 */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          borderRadius: 12,
                          padding: 24,
                          background: "#0F0F1A",
                          border: "1px solid #1E1E30",
                          boxSizing: "border-box",
                        }}
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              lineHeight: "100%",
                              fontFamily: "'Manrope','Inter',sans-serif",
                              color: "#FFFFFF",
                            }}
                          >
                            {faq.q}
                          </span>
                          {/* Toggle — 28×28, radius 14, bg #6C63FF22, border 1px solid #6C63FF, plus icon */}
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              background: "rgba(108,99,255,0.13)",
                              border: "1px solid #6C63FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transform: isOpen
                                ? "rotate(45deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.25s",
                            }}
                          >
                            <Plus size={14} color="#6C63FF" strokeWidth={2} />
                          </span>
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 400,
                              lineHeight: "150%",
                              fontFamily: "'Manrope','Inter',sans-serif",
                              color: "#A3A3C2",
                            }}
                          >
                            {faq.a}
                          </div>
                        )}
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BottomCTASection — Figma: 1440×469, padding 100/80, gap 32, bg #0F0F1A, border-top/bottom 1px #1E1E30
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "100px 80px",
          textAlign: "center",
          background: "#0F0F1A",
          borderTop: "1px solid #1E1E30",
          borderBottom: "1px solid #1E1E30",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          boxSizing: "border-box",
        }}
      >
        {/* Ellipse glow — 600×600, opacity 0.08, gold, blur(120px) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "#C8962A",
            opacity: 0.08,
            filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />
        <FadeIn
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            width: "100%",
          }}
        >
          {/* CtaHeaders — 800×115, gap 16 */}
          <div
            style={{
              maxWidth: 800,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontSize: 40,
                fontWeight: 800,
                lineHeight: "100%",
                letterSpacing: 0,
                textAlign: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              Start building with AI agents today
            </h2>
            <p
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "100%",
                textAlign: "center",
                fontFamily: "'Manrope','Inter',sans-serif",
                color: "#A3A3C2",
                margin: 0,
              }}
            >
              Get up and running in less than 5 minutes. No credit card required
              to start your initial explore sandbox.
            </p>
          </div>

          {/* CtaActions — 318×50, gap 16 */}
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => getStarted()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 50,
                padding: "14px 24px",
                borderRadius: 200,
                border: "none",
                cursor: "pointer",
                background: DISCOUNT_GRADIENT,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 600,
                textTransform: "uppercase",
                fontFamily: "'Manrope','Inter',sans-serif",
                lineHeight: "100%",
                transition: "transform 0.18s, box-shadow 0.18s",
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
              Get Started
            </button>
            <button
              onClick={contactSales}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 47,
                padding: "14px 24px",
                borderRadius: 200,
                cursor: "pointer",
                background: "rgba(108,99,255,0.13)",
                color: "#FFFFFF",
                border: "1.5px solid #6C63FF",
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "'Manrope','Inter',sans-serif",
                lineHeight: "100%",
                transition: "background 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(108,99,255,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(108,99,255,0.13)";
              }}
            >
              Talk to Sales
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
            {[
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
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                {item.icon}
                <span
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
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER  (matches homepage)
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.04)",
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
    </div>
  );
}
