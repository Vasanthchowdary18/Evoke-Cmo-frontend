import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider.jsx'
import Landing from './pages/Landing.jsx'
import SignIn from './pages/SignIn.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CmoDashboard from './pages/CmoDashboard.jsx'
import CampaignForm from './pages/CampaignForm.jsx'
import AgentPage from './pages/AgentPage.jsx'
import Tokens from './pages/Tokens.jsx'
import Results from './pages/Results.jsx'
import Purchase from './pages/Purchase.jsx'
import ConnectAccounts from './pages/ConnectAccounts.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import MetaAdsBoost from './pages/MetaAdsBoost.jsx'
import AgentsHub from './pages/AgentsHub.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductDescription from './pages/ProductDescription.jsx'
import ImageToolPage from './pages/ImageToolPage.jsx'
import Chatbot from './components/Chatbot.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/signin"            element={<SignIn />} />
        <Route path="/onboarding"        element={<Onboarding />} />
        <Route path="/dashboard"         element={<Navigate to="/agents-hub" replace />} />
        <Route path="/dashboard-legacy"  element={<Dashboard />} />
        <Route path="/cmo"               element={<Dashboard />} />
        <Route path="/cmo-terminal"      element={<CmoDashboard />} />
        <Route path="/campaign/:type"    element={<CampaignForm />} />
        <Route path="/agent/:agentType"  element={<AgentPage />} />
        <Route path="/results"           element={<Results />} />
        <Route path="/tokens"            element={<Tokens />} />
        <Route path="/purchase"          element={<Purchase />} />
        <Route path="/connect-accounts"  element={<ConnectAccounts />} />
        <Route path="/products"          element={<ProductsPage />} />
        <Route path="/product-desc"      element={<ProductDescription />} />
        <Route path="/image-angles"      element={<ImageToolPage />} />
        <Route path="/image-360"         element={<ImageToolPage />} />
        <Route path="/image-seo"         element={<ImageToolPage />} />
        <Route path="/image-video"       element={<ImageToolPage />} />
        <Route path="/image-lifestyle"   element={<ImageToolPage />} />
        <Route path="/meta-ads-boost"    element={<MetaAdsBoost />} />
        <Route path="/agents-hub"         element={<AgentsHub />} />
        <Route path="/privacy"            element={<Privacy />} />
        <Route path="/terms"              element={<Terms />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
      </AuthProvider>
    </BrowserRouter>
  )
}
