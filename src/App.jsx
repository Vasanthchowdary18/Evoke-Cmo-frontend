import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider.jsx'
import { auth } from './firebase'
import { signInWithCustomToken } from 'firebase/auth'
import { getOrCreateUser } from './services/userService'
import PlanGate from './components/PlanGate.jsx'
import Landing from './pages/Landing.jsx'
import SignIn from './pages/SignIn.jsx'
import CampaignForm from './pages/CampaignForm.jsx'
import Tokens from './pages/Tokens.jsx'
import Results from './pages/Results.jsx'
import Purchase from './pages/Purchase.jsx'
import ConnectAccounts from './pages/ConnectAccounts.jsx'
import PostContent from './pages/PostContent.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import MetaAdsBoost from './pages/MetaAdsBoost.jsx'
import AgentsHub from './pages/AgentsHub.jsx'
import PlansPage from './pages/PlansPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import FreePlanPage from './pages/FreePlanPage.jsx'
import PackageAPage from './pages/PackageAPage.jsx'
import PackageBPage from './pages/PackageBPage.jsx'
import PackageCPage from './pages/PackageCPage.jsx'
import CaptionSuitePage from './pages/CaptionSuitePage.jsx'
import ReelScriptsPage from './pages/ReelScriptsPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductDescription from './pages/ProductDescription.jsx'
import ImageToolPage from './pages/ImageToolPage.jsx'
import CreativeAssetPage from './pages/CreativeAssetPage.jsx'
import ApprovalQueue from './pages/ApprovalQueue.jsx'
import KpiRecommendationsPage from './pages/KpiRecommendationsPage.jsx'
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx'
import CrmPage from './pages/CrmPage.jsx'
import BrandKnowledgeBase from './pages/BrandKnowledgeBase.jsx'
import SocialInbox from './pages/SocialInbox.jsx'
import TrendAnalysis from './pages/TrendAnalysis.jsx'
import AudienceBuilder from './pages/AudienceBuilder.jsx'
import TeamManagement from './pages/TeamManagement.jsx'
import PartnerSharing from './pages/PartnerSharing.jsx'
import VideoGenerationPage from './pages/VideoGenerationPage.jsx'
import BrandGovernancePage from './pages/BrandGovernancePage.jsx'
import MarketingStrategyPage from './pages/MarketingStrategyPage.jsx'
import MarketingExecutionPage from './pages/MarketingExecutionPage.jsx'
import CampaignHub from './pages/CampaignHub.jsx'
import ContentGenerationPage from './pages/ContentGenerationPage.jsx'
import CopywritingAgentPage from './pages/CopywritingAgentPage.jsx'
import ExecutiveReportPage from './pages/ExecutiveReportPage.jsx'
import MarketingHealthPage from './pages/MarketingHealthPage.jsx'
import BrandProfilePage from './pages/BrandProfilePage.jsx'
import EventbritePost from './pages/EventbritePost.jsx'
import DevResetPage from './pages/DevResetPage.jsx'
import SupabaseTestPage from './pages/SupabaseTestPage.jsx'
import CmoAgentOverviewPage from './pages/CmoAgentOverviewPage.jsx'
import EmailMarketingPage from './pages/EmailMarketingPage.jsx'
import SeoAgentPage from './pages/SeoAgentPage.jsx'
import ABTestingPage from './pages/ABTestingPage.jsx'
import MarketingAttributionPage from './pages/MarketingAttributionPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import StrategyHome from './pages/StrategyHome.jsx'
import CompetitorIntelPage from './pages/CompetitorIntelPage.jsx'
import SwotAnalysisPage from './pages/SwotAnalysisPage.jsx'
import CampaignsPage from './pages/CampaignsPage.jsx'
import NewCampaignWizardPage from './pages/NewCampaignWizardPage.jsx'
import CampaignPerformancePage from './pages/CampaignPerformancePage.jsx'
import ContentStudioHubPage from './pages/ContentStudioHubPage.jsx'
import BlogGeneratorPage from './pages/BlogGeneratorPage.jsx'
import EmailComposerPage from './pages/EmailComposerPage.jsx'
import CreativeStudioHubPage from './pages/CreativeStudioHubPage.jsx'
import AIImageGeneratorPage from './pages/AIImageGeneratorPage.jsx'
import VideoStudioHubPage from './pages/VideoStudioHubPage.jsx'
import SeoIntelligenceCenterPage from './pages/SeoIntelligenceCenterPage.jsx'
import AdsCenterHubPage from './pages/AdsCenterHubPage.jsx'
import SocialMediaManagerPage from './pages/SocialMediaManagerPage.jsx'
import SocialCalendarPage from './pages/SocialCalendarPage.jsx'
import CompliancePage from './pages/CompliancePage.jsx'
import CSuitePage from './pages/CSuitePage.jsx'
import Chatbot from './components/Chatbot.jsx'

// Helper: wrap a page component with a plan gate
// On localhost this is a no-op (PlanGate bypasses in dev)
function G(plan, name, Comp) {
  return (
    <PlanGate requiredPlan={plan} featureName={name}>
      <Comp />
    </PlanGate>
  )
}

// Dev/test utilities should never be usable in production
const IS_LOCAL = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Handles token returned from accounts.evokemarketplace.com after login
function EvokeAuthHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token') || params.get('customToken') ||
                   params.get('access_token') || params.get('auth_token')
    if (!token) return

    window.history.replaceState({}, '', window.location.pathname)

    const postLoginRoute = sessionStorage.getItem('evoke_post_login_route') || '/dashboard'
    sessionStorage.removeItem('evoke_post_login_route')

    signInWithCustomToken(auth, token)
      .then(async (cred) => {
        await getOrCreateUser(cred.user.uid, cred.user.displayName, cred.user.email)
        navigate(postLoginRoute)
      })
      .catch(() => {
        navigate(postLoginRoute)
      })
  }, [navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                  element={<Landing />} />
        <Route path="/signin"            element={<SignIn />} />
        {/* Retired: legacy chat-wizard onboarding chain, nothing links here anymore — superseded by /brand-profile's OnboardingWizard, the flow everything else actually reads from */}
        <Route path="/onboarding"        element={<Navigate to="/brand-profile" replace />} />
        <Route path="/setup"             element={<Navigate to="/brand-profile" replace />} />
        <Route path="/privacy"           element={<Privacy />} />
        <Route path="/terms"             element={<Terms />} />
        <Route path="/dashboard"         element={<DashboardPage />} />
        <Route path="/strategy-home"     element={<StrategyHome />} />
        <Route path="/competitor-intel"  element={<CompetitorIntelPage />} />
        <Route path="/swot-analysis"     element={<SwotAnalysisPage />} />
        <Route path="/campaigns"         element={G('package-b', 'Campaigns', CampaignsPage)} />
        <Route path="/new-campaign"      element={G('package-b', 'New Campaign', NewCampaignWizardPage)} />
        <Route path="/campaign-performance/:campaignId" element={G('package-b', 'Campaign Performance', CampaignPerformancePage)} />
        <Route path="/content-studio"    element={<ContentStudioHubPage />} />
        <Route path="/blog-generator"    element={G('package-a', 'Blog Generator', BlogGeneratorPage)} />
        <Route path="/email-composer"    element={G('package-a', 'Email Composer', EmailComposerPage)} />
        <Route path="/hub/creative"      element={<CreativeStudioHubPage />} />
        <Route path="/image-generator"   element={G('package-a', 'AI Image Generator', AIImageGeneratorPage)} />
        <Route path="/hub/video-studio"  element={G('package-a', 'Video Studio', VideoStudioHubPage)} />
        <Route path="/hub/seo"           element={G('package-b', 'SEO Intelligence Center', SeoIntelligenceCenterPage)} />
        <Route path="/hub/ads"           element={G('package-c', 'Campaign Ads Hub', AdsCenterHubPage)} />
        <Route path="/hub/social"        element={G('package-b', 'Social Media Manager', SocialMediaManagerPage)} />
        <Route path="/social-calendar"   element={G('package-b', 'Social Calendar Studio', SocialCalendarPage)} />
        {/* Legacy CMO command-center route — replaced by /dashboard */}
        <Route path="/cmo"               element={<Navigate to="/dashboard" replace />} />

        {/* ── Plans & packages (always accessible) ── */}
        <Route path="/plans"             element={<PlansPage />} />
        <Route path="/pricing"           element={<PricingPage />} />
        <Route path="/free-plan"         element={<FreePlanPage />} />
        <Route path="/package-a"         element={<PackageAPage />} />
        <Route path="/package-b"         element={<PackageBPage />} />
        <Route path="/package-c"         element={<PackageCPage />} />

        {/* ── Free tier (all authenticated users) ── */}
        <Route path="/agents-hub"         element={<AgentsHub />} />
        {/* Retired 2026-07-27: old function-grouped hub, superseded by /hub/creative, /hub/video-studio, /hub/seo, /hub/ads, /hub/social + /agents-hub — nothing links here anymore */}
        <Route path="/hub/:agent"         element={<Navigate to="/agents-hub" replace />} />
        <Route path="/agent/:type"        element={<CmoAgentOverviewPage />} />
        <Route path="/brand-profile"      element={<BrandProfilePage />} />
        <Route path="/health-score"       element={<MarketingHealthPage />} />
        {/* Retired 2026-07-27: superseded by /strategy-home, the page actually linked from the sidebar — nothing links here anymore */}
        <Route path="/strategy-hub"        element={<Navigate to="/strategy-home" replace />} />
        <Route path="/strategy"           element={<MarketingStrategyPage />} />

        {/* Brand KB tool & KPI moved to Package A (setup wizard /brand-profile stays free) */}
        <Route path="/brand-kb"           element={G('package-a', 'Brand Knowledge Base', BrandKnowledgeBase)} />
        <Route path="/kpi-recommendations" element={G('package-a', 'KPI Recommendations', KpiRecommendationsPage)} />
        <Route path="/campaign/:type"     element={<CampaignForm />} />
        <Route path="/results"            element={<Results />} />
        <Route path="/tokens"             element={<Tokens />} />
        <Route path="/purchase"           element={<Purchase />} />
        <Route path="/products"           element={<ProductsPage />} />
        <Route path="/eventbrite-post"    element={<EventbritePost />} />
        <Route path="/dev-reset"          element={IS_LOCAL ? <DevResetPage /> : <Navigate to="/" replace />} />
        <Route path="/supabase-test"      element={IS_LOCAL ? <SupabaseTestPage /> : <Navigate to="/" replace />} />

        {/* ── Package A — Creative & Content ── */}
        <Route path="/caption-suite"   element={G('package-a', 'Caption Suite',          CaptionSuitePage)} />
        <Route path="/reel-scripts"    element={G('package-a', 'Reel Scripts',            ReelScriptsPage)} />
        <Route path="/content-gen"     element={G('package-a', 'Content Generation',      ContentGenerationPage)} />
        <Route path="/copywriting"     element={G('package-a', 'Copywriting Agent',       CopywritingAgentPage)} />
        <Route path="/product-desc"    element={G('package-a', 'Product Description',     ProductDescription)} />
        <Route path="/image-angles"    element={G('package-a', 'Product Image Angles',    ImageToolPage)} />
        <Route path="/image-360"       element={G('package-a', '360° Product Video',      ImageToolPage)} />
        <Route path="/image-seo"       element={G('package-a', 'SEO Product Images',      ImageToolPage)} />
        <Route path="/image-lifestyle" element={G('package-a', 'Lifestyle Photos',        ImageToolPage)} />
        <Route path="/creative-asset"  element={G('package-a', 'Creative Assets',         CreativeAssetPage)} />
        <Route path="/video-gen"       element={G('package-a', 'Video Generation',        VideoGenerationPage)} />

        {/* ── Package B — AI Agents + Social ── */}
        <Route path="/email-marketing"     element={G('package-b', 'Email Marketing Agent',    EmailMarketingPage)} />
        <Route path="/seo-agent"           element={G('package-b', 'SEO Agent',                SeoAgentPage)} />
        <Route path="/ab-testing"          element={G('package-b', 'A/B Testing Framework',    ABTestingPage)} />
        <Route path="/marketing-attribution" element={G('package-b', 'Marketing Attribution',   MarketingAttributionPage)} />
        <Route path="/audience-builder"    element={G('package-b', 'Audience Builder',          AudienceBuilder)} />
        <Route path="/trends"              element={G('package-b', 'Trend Analysis',            TrendAnalysis)} />
        <Route path="/crm"                 element={G('package-b', 'CRM & Lifecycle',           CrmPage)} />
        <Route path="/analytics"           element={G('package-b', 'Analytics Dashboard',       AnalyticsDashboard)} />
        <Route path="/executive-report"    element={G('package-b', 'Executive Report',          ExecutiveReportPage)} />
        {/* Retired 2026-07-17: was a duplicate page running entirely on hardcoded mock data; nothing in the app links here */}
        <Route path="/executive-reporting" element={<Navigate to="/executive-report" replace />} />
        <Route path="/campaign-hub"        element={G('package-b', 'Campaign Hub',              CampaignHub)} />
        <Route path="/connect-accounts"    element={G('package-b', 'Connect Social Accounts',   ConnectAccounts)} />
        <Route path="/queue"               element={G('package-b', 'Approval Queue',            ApprovalQueue)} />
        <Route path="/post-content"        element={G('package-b', 'Post Content',              PostContent)} />
        <Route path="/inbox"               element={G('package-b', 'Social Inbox',              SocialInbox)} />
        <Route path="/brand-governance"    element={G('package-b', 'Brand Governance',          BrandGovernancePage)} />
        <Route path="/image-3d"            element={G('package-b', '3D Product Images',         ImageToolPage)} />

        {/* ── Package C — Paid Ads & Full Deploy ── */}
        <Route path="/meta-ads-boost"  element={G('package-c', 'Meta Ads Boost',          MetaAdsBoost)} />
        <Route path="/execution"       element={G('package-c', 'Marketing Execution',      MarketingExecutionPage)} />
        <Route path="/team"            element={G('package-c', 'Team Management',          TeamManagement)} />
        <Route path="/partner-sharing" element={G('package-c', 'Partner Sharing',          PartnerSharing)} />
        <Route path="/compliance-agent" element={G('package-c', 'Compliance Agent',       CompliancePage)} />
        <Route path="/ai-cfo"          element={G('package-c', 'AI CFO',                  CSuitePage)} />
        <Route path="/ai-cto"          element={G('package-c', 'AI CTO',                  CSuitePage)} />
        <Route path="/ai-ceo"          element={G('package-c', 'AI CEO',                  CSuitePage)} />
        <Route path="/ai-cro"          element={G('package-c', 'AI CRO',                  CSuitePage)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
      </AuthProvider>
    </BrowserRouter>
  )
}
