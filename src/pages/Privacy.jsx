import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>EVOKE CMO</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 80px' }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 48 }}>
          Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {[
          {
            title: '1. Introduction',
            body: `Evoke CMO ("we", "our", or "us") is an AI-powered marketing platform that helps businesses generate and publish multi-channel marketing campaigns. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform at evokecmo.com.

By using Evoke CMO, you agree to the collection and use of information in accordance with this policy.`,
          },
          {
            title: '2. Information We Collect',
            body: `We collect the following types of information:

Account Information: When you create an account, we collect your name, email address, and password (encrypted).

Social Media Credentials: When you connect your social media accounts (Facebook, Instagram, LinkedIn, X/Twitter, WhatsApp Business), we collect and securely store your OAuth access tokens and account identifiers. These are used solely to publish campaign content on your behalf.

Campaign Data: Content you submit to generate campaigns, including event details, product descriptions, brand information, images, and campaign goals.

Payment Information: When you purchase tokens, your payment is processed by Razorpay. We do not store credit card or payment details — only the transaction confirmation.

Usage Data: We collect basic usage information such as pages visited and features used to improve our service.`,
          },
          {
            title: '3. How We Use Your Information',
            body: `We use the information we collect to:

• Provide and maintain our platform and services
• Generate AI-powered marketing content using the details you provide
• Publish campaign content to your connected social media accounts on your behalf
• Process payments and manage your token balance
• Send you important account and service notifications
• Improve and personalize your experience on our platform
• Comply with legal obligations`,
          },
          {
            title: '4. Social Media Account Access',
            body: `When you connect your social media accounts, Evoke CMO requests only the permissions necessary to publish content on your behalf. Specifically:

Facebook & Instagram: We request pages_manage_posts and instagram_content_publish permissions to post campaign content to your Facebook Page and Instagram Business account.

LinkedIn: We request w_member_social permission to share posts on your LinkedIn profile.

X / Twitter: We request tweet.write permission to post tweets on your behalf.

We do not read your private messages, access your followers' data, or use your social media accounts for any purpose other than publishing the campaign content you approve.

You can disconnect any social media account at any time from your account settings.`,
          },
          {
            title: '5. Data Storage and Security',
            body: `Your data is stored securely using Google Firebase (Firestore), which provides enterprise-grade security including encryption at rest and in transit.

Social media access tokens are stored in your private Firestore document, accessible only to you. We use Firebase security rules to ensure no other user or unauthorized party can access your data.

We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us.`,
          },
          {
            title: '6. Third-Party Services',
            body: `We use the following third-party services to operate our platform:

• Google Firebase — Authentication and database storage
• Groq AI — AI language model for generating campaign content
• Razorpay — Payment processing for token purchases
• n8n — Workflow automation for publishing campaigns
• ImgBB — Temporary image hosting for campaign images
• Meta (Facebook/Instagram) — Social media publishing
• LinkedIn — Professional network publishing
• X Corp (Twitter) — Social media publishing

Each of these services has their own privacy policy. We encourage you to review them.`,
          },
          {
            title: '7. Data Sharing',
            body: `We do not sell, rent, or share your personal information with third parties for marketing purposes.

We only share your information in the following limited circumstances:

• With service providers listed above who help us operate our platform (only the data they need to perform their function)
• If required by law, court order, or government authority
• To protect the rights, property, or safety of Evoke CMO, our users, or the public`,
          },
          {
            title: '8. Your Rights',
            body: `You have the right to:

• Access the personal data we hold about you
• Correct inaccurate or incomplete data
• Request deletion of your account and all associated data
• Disconnect any connected social media account at any time
• Withdraw consent for data processing
• Export your campaign history data

To exercise any of these rights, please contact us at the email address below.`,
          },
          {
            title: '9. Cookies',
            body: `We use essential cookies to keep you logged in and maintain your session. We do not use tracking cookies or third-party advertising cookies.

The Facebook SDK may set cookies when you use the "Connect with Facebook" feature. These are governed by Meta's cookie policy.`,
          },
          {
            title: '10. Children\'s Privacy',
            body: `Evoke CMO is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete it.`,
          },
          {
            title: '11. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or by a prominent notice on our platform. Continued use of Evoke CMO after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '12. Contact Us',
            body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: vasanthchowdarythumati@gmail.com
Platform: Evoke CMO — AI-Powered Marketing Platform`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: '#a78bfa' }}>{section.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {section.body}
            </p>
          </div>
        ))}

        <div style={{ marginTop: 56, padding: '24px 28px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 14 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
            This privacy policy was last updated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
            If you have questions, email us at <a href="mailto:vasanthchowdarythumati@gmail.com" style={{ color: '#a78bfa' }}>vasanthchowdarythumati@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
