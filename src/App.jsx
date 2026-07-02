import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider.jsx'
import { auth } from './firebase'
import { signInWithCustomToken } from 'firebase/auth'
import { getOrCreateUser } from './services/userService'
import Landing from './pages/Landing.jsx'
import SignIn from './pages/SignIn.jsx'
import Onboarding from './pages/Onboarding.jsx'
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
import FreePlanPage from './pages/FreePlanPage.jsx'
import PackageAPage from './pages/PackageAPage.jsx'
import PackageBPage from './pages/PackageBPage.jsx'
import PackageCPage from './pages/PackageCPage.jsx'
import CaptionSuitePage from './pages/CaptionSuitePage.jsx'
import ReelScriptsPage from './pages/ReelScriptsPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductDescription from './pages/ProductDescription.jsx'
import ImageToolPage from './pages/ImageToolPage.jsx'
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
import AgentHub from './pages/AgentHub.jsx'
import MarketingHealthPage from './pages/MarketingHealthPage.jsx'
import Chatbot from './components/Chatbot.jsx'

// Handles token returned from accounts.evokemarketplace.com after login
function EvokeAuthHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token') || params.get('customToken') ||
                   params.get('access_token') || params.get('auth_token')
    if (!token) return

    // Clean token from URL immediately
    window.history.replaceState({}, '', window.location.pathname)

    const postLoginRoute = sessionStorage.getItem('evoke_post_login_route') || '/agents-hub'
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
        <Route path="/"                  element={<Landing />} />
        <Route path="/signin"            element={<SignIn />} />
        <Route path="/onboarding"        element={<Onboarding />} />
        <Route path="/dashboard"         element={<Navigate to="/agents-hub" replace />} />
        <Route path="/campaign/:type"    element={<CampaignForm />} />
        <Route path="/results"           element={<Results />} />
        <Route path="/tokens"            element={<Tokens />} />
        <Route path="/purchase"          element={<Purchase />} />
        <Route path="/connect-accounts"  element={<ConnectAccounts />} />
        <Route path="/post-content"      element={<PostContent />} />
        <Route path="/products"          element={<ProductsPage />} />
        <Route path="/product-desc"      element={<ProductDescription />} />
        <Route path="/image-angles"      element={<ImageToolPage />} />
        <Route path="/image-360"         element={<ImageToolPage />} />
        <Route path="/image-seo"         element={<ImageToolPage />} />
        <Route path="/image-lifestyle"   element={<ImageToolPage />} />
        <Route path="/image-3d"          element={<ImageToolPage />} />
        <Route path="/meta-ads-boost"    element={<MetaAdsBoost />} />
        <Route path="/agents-hub"         element={<AgentsHub />} />
        <Route path="/plans"              element={<PlansPage />} />
        <Route path="/free-plan"          element={<FreePlanPage />} />
        <Route path="/package-a"          element={<PackageAPage />} />
        <Route path="/package-b"          element={<PackageBPage />} />
        <Route path="/package-c"          element={<PackageCPage />} />
        <Route path="/caption-suite"      element={<CaptionSuitePage />} />
        <Route path="/reel-scripts"       element={<ReelScriptsPage />} />
        <Route path="/queue"              element={<ApprovalQueue />} />
        <Route path="/kpi-recommendations" element={<KpiRecommendationsPage />} />
        <Route path="/analytics"             element={<AnalyticsDashboard />} />
        <Route path="/crm"                   element={<CrmPage />} />
        <Route path="/brand-kb"              element={<BrandKnowledgeBase />} />
        <Route path="/health-score"          element={<MarketingHealthPage />} />
        <Route path="/inbox"                 element={<SocialInbox />} />
        <Route path="/trends"                element={<TrendAnalysis />} />
        <Route path="/audience-builder"      element={<AudienceBuilder />} />
        <Route path="/team"                  element={<TeamManagement />} />
        <Route path="/partner-sharing"       element={<PartnerSharing />} />
        <Route path="/video-gen"             element={<VideoGenerationPage />} />
        <Route path="/brand-governance"      element={<BrandGovernancePage />} />
        <Route path="/strategy"              element={<MarketingStrategyPage />} />
        <Route path="/execution"             element={<MarketingExecutionPage />} />
        <Route path="/campaign-hub"          element={<CampaignHub />} />
        <Route path="/hub/:agent"            element={<AgentHub />} />
        <Route path="/privacy"            element={<Privacy />} />
        <Route path="/terms"              element={<Terms />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
      </AuthProvider>
    </BrowserRouter>
  )
}
