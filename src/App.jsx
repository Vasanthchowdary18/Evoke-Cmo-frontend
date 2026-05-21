import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import SignIn from './pages/SignIn.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CampaignForm from './pages/CampaignForm.jsx'
import Tokens from './pages/Tokens.jsx'
import Results from './pages/Results.jsx'
import Purchase from './pages/Purchase.jsx'
import ConnectAccounts from './pages/ConnectAccounts.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Chatbot from './components/Chatbot.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/signin"            element={<SignIn />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/campaign/:type"    element={<CampaignForm />} />
        <Route path="/results"           element={<Results />} />
        <Route path="/tokens"            element={<Tokens />} />
        <Route path="/purchase"          element={<Purchase />} />
        <Route path="/connect-accounts"  element={<ConnectAccounts />} />
        <Route path="/products"          element={<Navigate to="/campaign/product" replace />} />
        <Route path="/privacy"            element={<Privacy />} />
        <Route path="/terms"              element={<Terms />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  )
}
