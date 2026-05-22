import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Linkedin, Instagram, Facebook, Mail, MessageSquare,
  Check, X, Loader2, AlertCircle, ArrowRight, Zap,
  ExternalLink, Link2, Unlink
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getOrCreateUser, saveSocialAccount, disconnectSocialAccount } from '../services/userService'

// ─── Config v2 ─────────────────────────────────────────────────────────────
const META_APP_ID        = import.meta.env.VITE_META_APP_ID || '1587533479009417'
const FACEBOOK_REDIRECT  = window.location.origin + '/connect-accounts'
const FACEBOOK_SCOPE     = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list'
const FACEBOOK_N8N       = 'https://evoke2026.app.n8n.cloud/webhook/facebook-oauth'

const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86xauinshp202e'
const LINKEDIN_REDIRECT  = window.location.origin + '/connect-accounts'
const LINKEDIN_SCOPE     = 'openid profile email w_member_social'
const LINKEDIN_N8N       = 'https://evoke2026.app.n8n.cloud/webhook/linkedin-oauth'

const INSTAGRAM_APP_ID   = '1490643592209115'
const INSTAGRAM_REDIRECT = window.location.origin + '/connect-accounts'
const INSTAGRAM_SCOPE    = 'instagram_business_basic,instagram_business_content_publish'
const INSTAGRAM_N8N      = 'https://evoke2026.app.n8n.cloud/webhook/instagram-oauth'

const TWITTER_CLIENT_ID  = import.meta.env.VITE_TWITTER_CLIENT_ID || ''
const TWITTER_REDIRECT   = window.location.origin + '/connect-accounts'
const TWITTER_SCOPE      = 'tweet.read tweet.write users.read offline.access'
const TWITTER_N8N        = 'https://evoke2026.app.n8n.cloud/webhook/twitter-oauth'

const GOOGLE_CLIENT_ID   = '53481639003-g903a5274f1bcq4jvkgpeoispls7aps9.apps.googleusercontent.com'
const GOOGLE_REDIRECT    = window.location.origin + '/connect-accounts'
const GOOGLE_SCOPE       = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
const GMAIL_N8N          = 'https://evoke2026.app.n8n.cloud/webhook/gmail-oauth'

const TIKTOK_CLIENT_KEY  = 'sbawq8ejz7li1bzsf1' // sandbox
const TIKTOK_REDIRECT    = window.location.origin + '/connect-accounts'
const TIKTOK_SCOPE       = 'user.info.basic,video.upload'
const TIKTOK_N8N         = 'https://evoke2026.app.n8n.cloud/webhook/tiktok-oauth'

// ─── PKCE helpers for Twitter ──────────────────────────────────────────────
function genVerifier() {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
async function genChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ─── Load Facebook SDK ─────────────────────────────────────────────────────
function loadFBSDK() {
  return new Promise((resolve) => {
    if (window.FB) { resolve(); return }
    window.fbAsyncInit = () => {
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: 'v21.0' })
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://connect.facebook.net/en_US/sdk.js'
    s.async = true; s.defer = true
    document.body.appendChild(s)
  })
}

// ─── Platform definitions ──────────────────────────────────────────────────
const PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <Facebook size={22} />,
    color: '#1877f2',
    gradient: 'linear-gradient(135deg, rgba(24,119,242,0.15), rgba(24,119,242,0.05))',
    border: 'rgba(24,119,242,0.3)',
    description: 'Post to your Facebook Page automatically',
    oauthType: 'facebook',
    btnLabel: 'Connect with Facebook',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram size={22} />,
    color: '#e1306c',
    gradient: 'linear-gradient(135deg, rgba(225,48,108,0.15), rgba(225,48,108,0.05))',
    border: 'rgba(225,48,108,0.3)',
    description: 'Connect your Instagram Business account via your Facebook Page',
    note: 'Requires an Instagram Business account linked to a Facebook Page',
    oauthType: 'instagram_direct',
    btnLabel: 'Connect with Instagram',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin size={22} />,
    color: '#0a66c2',
    gradient: 'linear-gradient(135deg, rgba(10,102,194,0.15), rgba(10,102,194,0.05))',
    border: 'rgba(10,102,194,0.3)',
    description: 'Share posts to your LinkedIn profile',
    oauthType: 'linkedin',
    btnLabel: 'Connect with LinkedIn',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
      </svg>
    ),
    color: '#ff0050',
    gradient: 'linear-gradient(135deg, rgba(255,0,80,0.15), rgba(0,242,234,0.05))',
    border: 'rgba(255,0,80,0.3)',
    description: 'Post videos and content to your TikTok Business account',
    oauthType: 'tiktok',
    btnLabel: 'Connect with TikTok',
  },
  {
    key: 'metaads',
    label: 'Meta Ads',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
    color: '#0866ff',
    gradient: 'linear-gradient(135deg, rgba(8,102,255,0.15), rgba(8,102,255,0.05))',
    border: 'rgba(8,102,255,0.3)',
    description: 'Run paid ads on Facebook & Instagram using Meta Ads Manager',
    oauthType: 'manual',
    note: 'You need a Meta Business Ad Account. Find your Ad Account ID in Meta Ads Manager.',
    fields: [
      { name: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_1234567890123456', help: 'Meta Ads Manager → Account Overview → Account ID (prefix with act_)' },
    ],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Campaigns',
    icon: <MessageSquare size={22} />,
    color: '#25d366',
    gradient: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05))',
    border: 'rgba(37,211,102,0.3)',
    description: 'Platform WhatsApp Business API is active — add recipient numbers in your campaign form to send invitation messages.',
    oauthType: 'platform_whatsapp',
    note: 'No setup needed. When creating a campaign, select WhatsApp and paste the phone numbers you want to invite.',
  },
  {
    key: 'gmail',
    label: 'Gmail / Email',
    icon: <Mail size={22} />,
    color: '#ea4335',
    gradient: 'linear-gradient(135deg, rgba(234,67,53,0.15), rgba(234,67,53,0.05))',
    border: 'rgba(234,67,53,0.3)',
    description: 'Send campaign emails directly from your Gmail account to your contacts.',
    oauthType: 'gmail',
    btnLabel: 'Connect with Gmail',
  },
]

export default function ConnectAccounts() {
  const navigate = useNavigate()
  const [user, setUser]             = useState(null)
  const [accounts, setAccounts]     = useState({})
  const [loading, setLoading]       = useState({})
  const [errors, setErrors]         = useState({})
  const [success, setSuccess]       = useState({})
  const [manualForms, setManualForms] = useState({})
  const [expanded, setExpanded]     = useState(null)
  const [authReady, setAuthReady]   = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code  = params.get('code')
    const state = params.get('state')
    if (!code || !state) return
    window.history.replaceState({}, '', window.location.pathname)
    console.log('🔵 OAuth callback detected, state:', state)

    // Wait for Firebase Auth to be ready, then process
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return
      unsub() // stop listening once we have the user
      console.log('🔵 Auth ready, processing OAuth for user:', u.uid)
      if (state === 'facebook_connect')  handleFacebookCallback(code)
      if (state === 'linkedin_connect')  handleLinkedInCallback(code)
      if (state === 'instagram_connect') handleInstagramCallback(code)
      if (state === 'twitter_connect')   handleTwitterCallback(code)
      if (state === 'gmail_connect')     handleGmailCallback(code)
      if (state === 'tiktok_connect')    handleTikTokCallback(code)
    })
  }, []) // eslint-disable-line

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/signin'); return }
      setUser(u)
      const data = await getOrCreateUser(u.uid, u.displayName, u.email)
      setAccounts(data.socialAccounts || {})
      setAuthReady(true)
    })
    loadFBSDK()
    return unsub
  }, [navigate])

  const setErr  = (k, m) => setErrors(e => ({ ...e, [k]: m }))
  const clrErr  = (k)    => setErrors(e => { const n = { ...e }; delete n[k]; return n })
  const setLoad = (k, v) => setLoading(l => ({ ...l, [k]: v }))
  const setOk   = (k, v) => setSuccess(s => ({ ...s, [k]: v }))

  // ── Facebook + Instagram (SDK approach) ─────────────────────────────────
  const connectFacebook = () => {
    if (!window.FB) {
      setErr('facebook', 'Facebook SDK not loaded. Please refresh and try again.')
      return
    }
    setLoad('facebook', true); clrErr('facebook')
    const timeout = setTimeout(() => {
      setLoad('facebook', false)
      setErr('facebook', 'Login timed out. Please allow popups and try again.')
    }, 30000)
    window.FB.login((resp) => {
      if (!resp || !resp.authResponse) {
        clearTimeout(timeout)
        setErr('facebook', 'Facebook login cancelled or popup blocked. Allow popups and try again.')
        setLoad('facebook', false); return
      }
      const { accessToken } = resp.authResponse
      window.FB.api('/me/accounts', { access_token: accessToken }, (pagesResp) => {
        if (!pagesResp || pagesResp.error || !pagesResp.data?.length) {
          clearTimeout(timeout)
          setErr('facebook', pagesResp?.error?.message || 'No Facebook Pages found.')
          setLoad('facebook', false); return
        }
        const page = pagesResp.data[0]
        saveSocialAccount(user.uid, 'facebook', {
          pageId: page.id, pageAccessToken: page.access_token, pageName: page.name,
        }).then(() => {
          setAccounts(a => ({ ...a, facebook: { connected: true, pageId: page.id, pageName: page.name } }))
          setOk('facebook', true)
          window.FB.api(`/${page.id}?fields=instagram_business_account`, { access_token: page.access_token }, (igResp) => {
            clearTimeout(timeout)
            if (igResp?.instagram_business_account) {
              const igId = igResp.instagram_business_account.id
              saveSocialAccount(user.uid, 'instagram', {
                businessAccountId: igId, pageAccessToken: page.access_token, pageName: page.name,
              }).then(() => {
                setAccounts(a => ({ ...a, instagram: { connected: true, businessAccountId: igId, pageName: page.name } }))
                setOk('instagram', true)
              })
            }
            setLoad('facebook', false)
          })
        }).catch(() => {
          clearTimeout(timeout)
          setErr('facebook', 'Failed to save. Please try again.')
          setLoad('facebook', false)
        })
      })
    }, { scope: FACEBOOK_SCOPE })
  }

  // ── Instagram via Facebook SDK ───────────────────────────────────────────
  const connectInstagram = () => {
    if (!user) return
    setLoad('instagram', true); clrErr('instagram')

    loadFBSDK().then(() => {
      window.FB.login((resp) => {
        if (!resp.authResponse?.accessToken) {
          setErr('instagram', 'Connection cancelled.')
          setLoad('instagram', false)
          return
        }

        window.FB.api('/me/accounts', { access_token: resp.authResponse.accessToken }, (pagesResp) => {
          const pages = pagesResp?.data || []
          if (!pages.length) {
            setErr('instagram', 'No Facebook Pages found. Make sure your Facebook account has a Page linked to an Instagram Business account.')
            setLoad('instagram', false)
            return
          }

          let pageIndex = 0
          const checkNextPage = () => {
            if (pageIndex >= pages.length) {
              setErr('instagram', 'No Instagram Business account linked to your Facebook Pages. Go to Instagram → Edit Profile → link your Facebook Page first.')
              setLoad('instagram', false)
              return
            }
            const page = pages[pageIndex++]
            window.FB.api(`/${page.id}`, { fields: 'instagram_business_account', access_token: page.access_token }, (igResp) => {
              if (igResp?.instagram_business_account?.id) {
                const igId = igResp.instagram_business_account.id
                saveSocialAccount(user.uid, 'instagram', {
                  businessAccountId: igId,
                  pageAccessToken:   page.access_token,
                  pageName:          page.name,
                  connected:         true,
                }).then(() => {
                  setAccounts(a => ({ ...a, instagram: { connected: true, businessAccountId: igId, pageName: page.name } }))
                  setOk('instagram', true)
                  setLoad('instagram', false)
                }).catch((err) => {
                  setErr('instagram', 'Failed to save Instagram account: ' + err.message)
                  setLoad('instagram', false)
                })
              } else {
                checkNextPage()
              }
            })
          }
          checkNextPage()
        })
      }, { scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish' })
    }).catch((e) => {
      setErr('instagram', 'Instagram connection failed: ' + e.message)
      setLoad('instagram', false)
    })
  }

  const handleInstagramCallback = useCallback(async () => {}, [])

  // ── LinkedIn OAuth ───────────────────────────────────────────────────────
  const connectLinkedIn = () => {
    if (!LINKEDIN_CLIENT_ID) {
      setErr('linkedin', 'LinkedIn Client ID not set. Add VITE_LINKEDIN_CLIENT_ID to your .env file.')
      return
    }
    const url = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT,
      scope: LINKEDIN_SCOPE,
      state: 'linkedin_connect',
    })
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${url}`
  }

  const handleLinkedInCallback = useCallback(async (code) => {
    console.log('🔵 LinkedIn callback started, user:', auth.currentUser?.uid)
    if (!auth.currentUser) { console.error('❌ No user found'); return }
    const uid = auth.currentUser.uid
    setLoad('linkedin', true); clrErr('linkedin')
    try {
      console.log('🔵 Calling n8n webhook:', LINKEDIN_N8N)
      const res = await fetch(LINKEDIN_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: LINKEDIN_REDIRECT, uid }),
      })
      console.log('🔵 n8n response status:', res.status, res.ok)
      if (!res.ok) {
        const errText = await res.text()
        console.error('❌ n8n error response:', errText)
        throw new Error('Token exchange failed: ' + errText)
      }
      const data = await res.json()
      console.log('🔵 n8n response data:', data)
      const { accessToken, name, personUrn } = data
      await saveSocialAccount(uid, 'linkedin', { accessToken, name, personUrn })
      setAccounts(a => ({ ...a, linkedin: { connected: true, name, personUrn } }))
      setOk('linkedin', true)
      console.log('✅ LinkedIn connected successfully!')
    } catch(e) {
      console.error('❌ LinkedIn error:', e.message)
      setErr('linkedin', 'LinkedIn connection failed. Make sure the n8n LinkedIn OAuth webhook is active.')
    } finally {
      setLoad('linkedin', false)
    }
  }, [])

  // ── X / Twitter OAuth (PKCE via n8n) ────────────────────────────────────
  const connectTwitter = async () => {
    if (!TWITTER_CLIENT_ID) {
      setErr('twitter', 'Twitter Client ID not set. Add VITE_TWITTER_CLIENT_ID to your .env file.')
      return
    }
    const verifier   = genVerifier()
    const challenge  = await genChallenge(verifier)
    sessionStorage.setItem('twitter_verifier', verifier)

    const url = new URLSearchParams({
      response_type: 'code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT,
      scope: TWITTER_SCOPE,
      state: 'twitter_connect',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })
    window.location.href = `https://twitter.com/i/oauth2/authorize?${url}`
  }

  const handleTwitterCallback = useCallback(async (code) => {
    if (!auth.currentUser) return
    const uid      = auth.currentUser.uid
    const verifier = sessionStorage.getItem('twitter_verifier') || ''
    sessionStorage.removeItem('twitter_verifier')
    setLoad('twitter', true); clrErr('twitter')
    try {
      const res = await fetch(TWITTER_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: TWITTER_REDIRECT, verifier, uid }),
      })
      if (!res.ok) throw new Error('Token exchange failed')
      const { accessToken, username, userId } = await res.json()
      await saveSocialAccount(uid, 'twitter', { accessToken, username, userId })
      setAccounts(a => ({ ...a, twitter: { connected: true, username, userId } }))
      setOk('twitter', true)
    } catch {
      setErr('twitter', 'X / Twitter connection failed. Make sure the n8n Twitter OAuth webhook is active.')
    } finally {
      setLoad('twitter', false)
    }
  }, [])

  // ── Gmail OAuth ─────────────────────────────────────────────────────────
  const connectGmail = () => {
    const url = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  GOOGLE_REDIRECT,
      scope:         GOOGLE_SCOPE,
      response_type: 'code',
      state:         'gmail_connect',
      access_type:   'offline',
      prompt:        'consent',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${url}`
  }

  const handleGmailCallback = useCallback(async (code) => {
    if (!auth.currentUser) return
    const uid = auth.currentUser.uid
    setLoad('gmail', true); clrErr('gmail')
    try {
      const res = await fetch(GMAIL_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: GOOGLE_REDIRECT, uid }),
      })
      if (!res.ok) throw new Error('Token exchange failed: ' + await res.text())
      const { accessToken, refreshToken, email } = await res.json()
      await saveSocialAccount(uid, 'gmail', { accessToken, refreshToken, email, connected: true })
      setAccounts(a => ({ ...a, gmail: { connected: true, email } }))
      setOk('gmail', true)
    } catch (e) {
      setErr('gmail', 'Gmail connection failed: ' + e.message)
    } finally {
      setLoad('gmail', false)
    }
  }, [])

  // ── TikTok OAuth ────────────────────────────────────────────────────────
  const connectTikTok = async () => {
    const verifier  = genVerifier()
    const challenge = await genChallenge(verifier)
    sessionStorage.setItem('tiktok_verifier', verifier)
    const url = new URLSearchParams({
      client_key:            TIKTOK_CLIENT_KEY,
      redirect_uri:          TIKTOK_REDIRECT,
      scope:                 TIKTOK_SCOPE,
      response_type:         'code',
      state:                 'tiktok_connect',
      code_challenge:        challenge,
      code_challenge_method: 'S256',
    })
    window.location.href = `https://www.tiktok.com/v2/auth/authorize?${url}`
  }

  const handleTikTokCallback = useCallback(async (code) => {
    if (!auth.currentUser) return
    const uid      = auth.currentUser.uid
    const verifier = sessionStorage.getItem('tiktok_verifier') || ''
    sessionStorage.removeItem('tiktok_verifier')
    setLoad('tiktok', true); clrErr('tiktok')
    try {
      const res = await fetch(TIKTOK_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: TIKTOK_REDIRECT, uid, codeVerifier: verifier }),
      })
      if (!res.ok) throw new Error('Token exchange failed: ' + await res.text())
      const data = await res.json()
      if (data.error) throw new Error(data.message || 'TikTok auth failed')
      const { accessToken, openId, displayName } = data
      if (!accessToken) throw new Error('No access token returned from TikTok')
      await saveSocialAccount(uid, 'tiktok', { accessToken, openId, displayName, connected: true })
      setAccounts(a => ({ ...a, tiktok: { connected: true, name: displayName, openId } }))
      setOk('tiktok', true)
    } catch (e) {
      setErr('tiktok', 'TikTok connection failed: ' + e.message)
    } finally {
      setLoad('tiktok', false)
    }
  }, [])

  // ── Manual form (WhatsApp / Gmail) ───────────────────────────────────────
  const saveManual = async (platform, fields) => {
    const form = manualForms[platform] || {}
    const missing = fields.filter(f => !form[f.name]?.trim())
    if (missing.length > 0) {
      setErr(platform, `Please fill in: ${missing.map(f => f.label).join(', ')}`)
      return
    }
    setLoad(platform, true); clrErr(platform)
    try {
      await saveSocialAccount(user.uid, platform, form)
      setAccounts(a => ({ ...a, [platform]: { connected: true, ...form } }))
      setOk(platform, true)
      setExpanded(null)
    } catch {
      setErr(platform, 'Failed to save. Please try again.')
    } finally {
      setLoad(platform, false)
    }
  }

  const disconnect = async (key) => {
    setLoad(key, true)
    try {
      await disconnectSocialAccount(user.uid, key)
      setAccounts(a => ({ ...a, [key]: { connected: false } }))
      setOk(key, false)
    } catch {
      setErr(key, 'Disconnect failed.')
    } finally {
      setLoad(key, false)
    }
  }

  const connectedCount = PLATFORMS.filter(p => accounts[p.key]?.connected).length

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <Navbar />
      <div className="glow-orb glow-purple" style={{ width: 500, height: 500, top: -100, right: -100, opacity: 0.15 }} />
      <div className="glow-orb glow-cyan"   style={{ width: 400, height: 400, bottom: 100, left: -100, opacity: 0.12 }} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '108px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div className="badge" style={{ marginBottom: 16, display: 'inline-flex', gap: 6 }}>
            <Link2 size={13} /> Connect Your Accounts
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: 12 }}>
            Connect <span className="gradient-text">your social accounts</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 520 }}>
            Click the button next to each platform and log in with your own account. Your campaigns will post directly to your accounts — not ours.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 20, padding: '8px 18px', background: connectedCount > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${connectedCount > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 100, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: connectedCount > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
              {connectedCount} / {PLATFORMS.length} connected
            </span>
          </div>
        </motion.div>

        {/* Platform cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PLATFORMS.map((p, i) => {
            const connected = accounts[p.key]?.connected
            const isLoading = loading[p.key]
            const hasError  = errors[p.key]
            const isOpen    = expanded === p.key

            const connectedLabel =
              accounts[p.key]?.pageName  ? `Connected as: ${accounts[p.key].pageName}` :
              accounts[p.key]?.name      ? `Connected as: ${accounts[p.key].name}` :
              accounts[p.key]?.username  ? `Connected as: @${accounts[p.key].username}` :
              accounts[p.key]?.email     ? `Connected: ${accounts[p.key].email}` :
              'Connected'

            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  background: connected ? `linear-gradient(135deg, ${p.color}14, ${p.color}06)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${connected ? p.color + '40' : hasError ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.3s',
                }}
              >
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: `${p.color}18`, border: `1px solid ${p.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, flexShrink: 0 }}>
                    {p.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{p.label}</span>
                      {connected && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#4ade80' }}>
                          <Check size={10} /> Connected
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                      {connected ? connectedLabel : p.description}
                    </p>
                    {p.note && !connected && (
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 3 }}>{p.note}</p>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ flexShrink: 0 }}>
                    {p.oauthType === 'platform_whatsapp' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.35)', borderRadius: 10, color: '#25d366', fontSize: 13, fontWeight: 700 }}>
                        <Check size={13} /> Always Enabled
                      </span>
                    ) : connected ? (
                      <button
                        onClick={() => disconnect(p.key)}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlink size={13} />}
                        Disconnect
                      </button>
                    ) : p.oauthType === 'facebook' ? (
                      <button onClick={connectFacebook} disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Facebook size={14} /> {p.btnLabel}</>}
                      </button>
                    ) : p.oauthType === 'instagram_direct' ? (
                      <button onClick={connectInstagram} disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `linear-gradient(135deg, #f58529, #e1306c, #833ab4)`, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Instagram size={14} /> {p.btnLabel}</>}
                      </button>
                    ) : p.oauthType === 'linkedin' ? (
                      <button onClick={connectLinkedIn} disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Linkedin size={14} /> {p.btnLabel}</>}
                      </button>
                    ) : p.oauthType === 'tiktok' ? (
                      <button onClick={connectTikTok} disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #ff0050, #ff0050bb)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === 'gmail' ? (
                      <button onClick={connectGmail} disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #ea4335, #ea4335bb)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : (
                      // Manual form toggle
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        {isOpen ? 'Cancel' : 'Enter Credentials'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Error row */}
                <AnimatePresence>
                  {hasError && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 24px 16px', color: '#f87171', fontSize: 13 }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{hasError}</span>
                        <button onClick={() => clrErr(p.key)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual credential form */}
                <AnimatePresence>
                  {isOpen && p.fields && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ height: 16 }} />
                        {p.fields.map(field => (
                          <div key={field.name} style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                              {field.label}
                            </label>
                            <input
                              type={field.name === 'accessToken' ? 'password' : 'text'}
                              placeholder={field.placeholder}
                              value={(manualForms[p.key] || {})[field.name] || ''}
                              onChange={e => setManualForms(f => ({ ...f, [p.key]: { ...(f[p.key] || {}), [field.name]: e.target.value } }))}
                              className="form-input"
                              style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                            {field.help && (
                              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ExternalLink size={10} /> {field.help}
                              </p>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => saveManual(p.key, p.fields)}
                          disabled={loading[p.key]}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                        >
                          {loading[p.key]
                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                            : <><Check size={14} /> Save Credentials</>
                          }
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            <Zap size={16} />
            {connectedCount > 0 ? 'Start Creating Campaigns' : 'Skip for now'}
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Your credentials are encrypted</strong> and stored securely in Firebase.
            They are only used to post content you explicitly approve. You can disconnect any account at any time.
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
