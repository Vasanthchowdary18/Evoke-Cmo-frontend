import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { redirectToLogin } from "../lib/authUtils.js";
import {
  Linkedin,
  Facebook,
  Mail,
  MessageSquare,
  Check,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Zap,
  ExternalLink,
  Link2,
  Unlink,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getOrCreateUser,
  saveSocialAccount,
  disconnectSocialAccount,
} from "../services/userService";

const META_APP_ID = import.meta.env.VITE_META_APP_ID || "1587533479009417";
const FACEBOOK_REDIRECT = window.location.origin + "/connect-accounts";
const FACEBOOK_SCOPE =
  "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list";

const LINKEDIN_CLIENT_ID =
  import.meta.env.VITE_LINKEDIN_CLIENT_ID || "86xauinshp202e";
const LINKEDIN_REDIRECT = window.location.origin + "/connect-accounts";
const LINKEDIN_SCOPE = "openid profile email w_member_social";
const LINKEDIN_N8N =
  "https://vasanthchowadry373.app.n8n.cloud/webhook/linkedin-oauth";

const TWITTER_CLIENT_ID =
  import.meta.env.VITE_TWITTER_CLIENT_ID || "YOUR_TWITTER_CLIENT_ID";
const TWITTER_REDIRECT = window.location.origin + "/connect-accounts";
const TWITTER_SCOPE = "tweet.read tweet.write users.read offline.access";
const TWITTER_N8N =
  "https://vasanthchowadry373.app.n8n.cloud/webhook/twitter-oauth";

const GOOGLE_CLIENT_ID =
  "53481639003-g903a5274f1bcq4jvkgpeoispls7aps9.apps.googleusercontent.com";
const GOOGLE_REDIRECT = window.location.origin + "/connect-accounts";
const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
const GMAIL_N8N = "https://vasanthchowadry373.app.n8n.cloud/webhook/gmail-oauth";

const GOOGLE_ADS_SCOPE =
  "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
const GOOGLE_ADS_N8N = "https://vasanthchowadry373.app.n8n.cloud/webhook/google-ads-oauth";

const TIKTOK_CLIENT_KEY = "sbawq8ejz7li1bzsf1";
const TIKTOK_REDIRECT = window.location.origin + "/connect-accounts";
const TIKTOK_SCOPE = "user.info.basic,video.upload";
const TIKTOK_N8N =
  "https://vasanthchowadry373.app.n8n.cloud/webhook/tiktok-oauth";

const EVENTBRITE_CLIENT_ID =
  import.meta.env.VITE_EVENTBRITE_CLIENT_ID || "AQUWB7RTTS3CUWMCXM";
const EVENTBRITE_REDIRECT = window.location.origin + "/connect-accounts";
const EVENTBRITE_N8N =
  "https://vasanthchowadry373.app.n8n.cloud/webhook/eventbrite-oauth";

function genVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function genChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function loadFBSDK() {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      resolve();
    };

    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  });
}

const INSTAGRAM_REDIRECT = window.location.origin + "/connect-accounts";
const INSTAGRAM_SCOPE =
  "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";

const META_ADS_SCOPE =
  "ads_management,ads_read,pages_show_list,business_management";

const PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0">
            <stop offset="0%" stopColor="#f58529" />
            <stop offset="50%" stopColor="#dd2a7b" />
            <stop offset="100%" stopColor="#8134af" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-grad)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="2" fill="none" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b" />
      </svg>
    ),
    color: "#dd2a7b",
    description: "Post Reels, Stories, and feed content from your campaigns directly to Instagram.",
    oauthType: "instagram",
    btnLabel: "Connect with Instagram",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: "#1877f2",
    description: "Post to your Facebook Page automatically.",
    oauthType: "facebook",
    btnLabel: "Connect with Facebook",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a66c2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: "#0a66c2",
    description: "Share posts to your LinkedIn profile.",
    oauthType: "linkedin",
    btnLabel: "Connect with LinkedIn",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#000000">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
    color: "#ff0050",
    description: "Post videos to your TikTok account directly from your campaigns.",
    oauthType: "tiktok",
    btnLabel: "Connect with TikTok",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#25d366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    color: "#25d366",
    description: "Platform WhatsApp Business API is active. Add recipient numbers in your campaign form to send invitation messages.",
    oauthType: "platform_whatsapp",
    note: "No setup needed. When creating a campaign, select WhatsApp and paste the phone numbers you want to invite.",
  },
  {
    key: "google-ads",
    label: "Google Ads",
    icon: (
      <svg width="22" height="22" viewBox="0 0 48 48">
        <path fill="#fbbc05" d="M5.6 30.3 15 14a4.5 4.5 0 0 1 7.8 4.5L13.4 34.8A4.5 4.5 0 0 1 5.6 30.3z"/>
        <path fill="#34a853" d="M24 38.5h-9a4.5 4.5 0 0 1 0-9h18a4.5 4.5 0 0 1 0 9H24z"/>
        <path fill="#ea4335" d="M33 14a4.5 4.5 0 0 0-7.8 4.5l9.4 16.3a4.5 4.5 0 1 0 7.8-4.5L33 14z"/>
      </svg>
    ),
    color: "#4285f4",
    description: "Connect your Google Ads account to build and push Search campaigns directly from EVOX.",
    oauthType: "google-ads",
    btnLabel: "Connect Google Ads",
  },
  {
    key: "gmail",
    label: "Gmail",
    icon: (
      <svg width="22" height="22" viewBox="0 0 48 48">
        <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
        <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
        <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
        <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/>
        <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/>
      </svg>
    ),
    color: "#ea4335",
    description: "Send campaign emails directly from your Gmail account to your contacts.",
    oauthType: "gmail",
    btnLabel: "Connect with Gmail",
  },
  {
    key: "eventbrite",
    label: "Eventbrite",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#F05537">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H7.5v-2h9v2zm0-4H7.5v-2h9v2zm0-4H7.5V6h9v2z"/>
      </svg>
    ),
    color: "#F05537",
    description: "Publish events and sell tickets directly from your campaigns via Eventbrite.",
    oauthType: "eventbrite",
    btnLabel: "Connect Eventbrite",
  },
  {
    key: "luma",
    label: "Luma",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#6c47ff" opacity="0.15"/>
        <circle cx="12" cy="12" r="10" stroke="#6c47ff" strokeWidth="1.5" fill="none"/>
        <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" fill="#6c47ff"/>
        <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "#6c47ff",
    description: "Create and promote events on Luma. Enter your API key to sync campaigns.",
    fields: [
      { name: "apiKey", label: "Luma API Key", placeholder: "luma_..." },
      { name: "calendarId", label: "Calendar ID (optional)", placeholder: "cal_..." },
    ],
    btnLabel: "Connect Luma",
  },
  {
    key: "meetup",
    label: "Meetup",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#ED1C40">
        <path d="M19.24 12.59c.14-.45.21-.92.21-1.39 0-2.69-2.09-4.91-4.76-5.1a4.93 4.93 0 0 0-3.47-2.02 3.6 3.6 0 0 0-5.13 2.27 3.56 3.56 0 0 0-2.88 3.49c0 .28.03.56.09.83A3.55 3.55 0 0 0 4.7 17.4a3.56 3.56 0 0 0 3.44 2.6h8.43a3.56 3.56 0 0 0 2.67-5.41zM12 16.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1-5.5a1 1 0 1 1-2 0V7a1 1 0 0 1 2 0v4z"/>
      </svg>
    ),
    color: "#ED1C40",
    description: "Promote your events to Meetup groups and reach your local community.",
    fields: [
      { name: "accessToken", label: "Meetup Access Token", placeholder: "Paste your Meetup OAuth token" },
      { name: "groupUrlName", label: "Group URL Name", placeholder: "your-meetup-group" },
    ],
    btnLabel: "Connect Meetup",
  },
];

export default function ConnectAccounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: navState } = location;
  // navState.from is set on direct navigate; sessionStorage survives OAuth full-page redirects
  const returnTo = navState?.from || sessionStorage.getItem('connectReturnTo');
  const fromPackageA = returnTo === '/package-a' || returnTo === '/products';
  // Brand KB setup flow — connects Brand Profile → Connect Platforms → Campaign Hub
  const isKbFlow = navState?.from === '/brand-profile' || sessionStorage.getItem('kbSetupFlow') === '1';
  if (isKbFlow) sessionStorage.setItem('kbSetupFlow', '1'); // persist across OAuth redirects

  // CMO setup flow — navigate to selected plan page after connecting
  const isCmoSetup = new URLSearchParams(location.search).get('setup') === 'cmo' ||
    sessionStorage.getItem('cmoSetup') === '1';
  const selectedPackage = (() => {
    try { return localStorage.getItem('evoke_selected_package') || 'free' } catch { return 'free' }
  })()
  const packageRoute = {
    'free':      '/agents-hub',
    'package-a': '/package-a',
    'package-b': '/package-b',
    'package-c': '/package-c',
  }[selectedPackage] || '/agents-hub'
  const packageLabel = {
    'free':      'Go to CMO Dashboard',
    'package-a': 'Go to Package A',
    'package-b': 'Go to Package B',
    'package-c': 'Go to Package C',
  }[selectedPackage] || 'Go to CMO Dashboard'
  const { user: evokeUser, status: authStatus } = useAuth();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [manualForms, setManualForms] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const userRef = useRef(null);
  const callbackProcessed = useRef(false);

  // Persist CMO setup flag so it survives OAuth full-page redirects
  useEffect(() => {
    if (new URLSearchParams(location.search).get('setup') === 'cmo') {
      sessionStorage.setItem('cmoSetup', '1');
    }
  }, []); // eslint-disable-line

  // Auto-redirect back after successful connection when returnTo is set
  useEffect(() => {
    const anySuccess = Object.values(success).some(Boolean);
    if (!anySuccess) return;
    if (isCmoSetup) {
      const t = setTimeout(() => {
        sessionStorage.removeItem('cmoSetup');
        navigate(packageRoute);
      }, 1500);
      return () => clearTimeout(t);
    }
    const dest = sessionStorage.getItem('connectReturnTo');
    if (!dest) return;
    // Auto-advance to post-content after connecting (not back to the source page)
    const t = setTimeout(() => {
      sessionStorage.removeItem('connectReturnTo');
      navigate('/post-content', { state: { from: dest, toolTitle: 'Post to Social', toolColor: '#c8973e' } });
    }, 1500);
    return () => clearTimeout(t);
  }, [success]); // eslint-disable-line

  // Handle OAuth callbacks — runs once user is available (Evoke session auth, not Firebase)
  useEffect(() => {
    if (!user || callbackProcessed.current) return;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const fbToken = hash.get("access_token");
    const fbState = hash.get("state");

    if (fbToken && fbState === "facebook_connect") {
      callbackProcessed.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      handleFacebookTokenConnect(fbToken, user.uid);
      return;
    }
    if (fbToken && fbState === "instagram_connect") {
      callbackProcessed.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      handleInstagramTokenConnect(fbToken, user.uid);
      return;
    }
    if (fbToken && fbState === "metaads_connect") {
      callbackProcessed.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      handleMetaAdsTokenConnect(fbToken, user.uid);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) return;

    callbackProcessed.current = true;
    window.history.replaceState({}, "", window.location.pathname);

    if (state === "linkedin_connect") handleLinkedInCallback(code, user.uid);
    if (state === "twitter_connect") handleTwitterCallback(code, user.uid);
    if (state === "gmail_connect") handleGmailCallback(code, user.uid);
    if (state === "tiktok_connect") handleTikTokCallback(code, user.uid);
    if (state === "eventbrite_connect") handleEventbriteCallback(code, user.uid);
    if (state === "google_ads_connect") handleGoogleAdsCallback(code, user.uid);
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!evokeUser) { redirectToLogin(); return; }

    setUser(evokeUser);
    userRef.current = evokeUser;
    getOrCreateUser(evokeUser.uid, evokeUser.displayName, evokeUser.email)
      .then((data) => {
        setAccounts(data.socialAccounts || {});
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));

    loadFBSDK();
  }, [evokeUser, authStatus]); // eslint-disable-line

  const setErr = (k, m) => setErrors((e) => ({ ...e, [k]: m }));

  const clrErr = (k) =>
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });

  const setLoad = (k, v) => setLoading((l) => ({ ...l, [k]: v }));
  const setOk = (k, v) => setSuccess((s) => ({ ...s, [k]: v }));

  const connectFacebook = () => {
    const url = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: FACEBOOK_REDIRECT,
      scope: FACEBOOK_SCOPE,
      response_type: "token",
      state: "facebook_connect",
    });
    window.location.href = `https://www.facebook.com/dialog/oauth?${url}`;
  };

  const connectInstagram = () => {
    const url = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: INSTAGRAM_REDIRECT,
      scope: INSTAGRAM_SCOPE,
      response_type: "token",
      state: "instagram_connect",
    });
    window.location.href = `https://www.facebook.com/dialog/oauth?${url}`;
  };

  const connectMetaAds = () => {
    const url = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: INSTAGRAM_REDIRECT,
      scope: META_ADS_SCOPE,
      response_type: "token",
      state: "metaads_connect",
    });
    window.location.href = `https://www.facebook.com/dialog/oauth?${url}`;
  };

  const handleFacebookTokenConnect = async (accessToken, uid) => {
    setLoad("facebook", true);
    clrErr("facebook");

    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`,
      );

      const pagesData = await pagesRes.json();

      if (pagesData.error) {
        throw new Error(pagesData.error.message || "Failed to fetch pages");
      }

      if (!pagesData.data?.length) {
        throw new Error(
          "No Facebook Pages found. When Facebook asks which pages to allow, make sure to select your page.",
        );
      }

      const page = pagesData.data[0];
      const pageToken = page.access_token;

      await saveSocialAccount(uid, "facebook", {
        pageId: page.id,
        pageAccessToken: pageToken,
        pageName: page.name,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        facebook: {
          connected: true,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: pageToken,
        },
      }));

      setOk("facebook", true);
    } catch (e) {
      setErr("facebook", "Facebook connection failed: " + e.message);
    } finally {
      setLoad("facebook", false);
    }
  };

  const handleInstagramTokenConnect = async (accessToken, uid) => {
    setLoad("instagram", true);
    clrErr("instagram");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const igAccount = data.data?.find((p) => p.instagram_business_account);
      const igId = igAccount?.instagram_business_account?.id || "connected";
      const pageName = igAccount?.name || "Instagram Account";

      await saveSocialAccount(uid, "instagram", {
        accessToken,
        instagramId: igId,
        pageName,
        connected: true,
      });
      setAccounts((a) => ({
        ...a,
        instagram: { connected: true, name: pageName },
      }));
      setOk("instagram", true);
    } catch (e) {
      setErr("instagram", "Instagram connection failed: " + e.message);
    } finally {
      setLoad("instagram", false);
    }
  };

  const handleMetaAdsTokenConnect = async (accessToken, uid) => {
    setLoad("meta-ads", true);
    clrErr("meta-ads");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const adAccount = data.data?.[0];
      await saveSocialAccount(uid, "meta-ads", {
        accessToken,
        adAccountId: adAccount?.id || "connected",
        adAccountName: adAccount?.name || "Meta Ads Account",
        connected: true,
      });
      setAccounts((a) => ({
        ...a,
        "meta-ads": {
          connected: true,
          name: adAccount?.name || "Meta Ads Account",
        },
      }));
      setOk("meta-ads", true);
    } catch (e) {
      setErr("meta-ads", "Meta Ads connection failed: " + e.message);
    } finally {
      setLoad("meta-ads", false);
    }
  };

  const connectLinkedIn = () => {
    if (!LINKEDIN_CLIENT_ID) {
      setErr("linkedin", "LinkedIn Client ID not set.");
      return;
    }

    console.log("LinkedIn redirect_uri being sent:", LINKEDIN_REDIRECT);

    const url = new URLSearchParams({
      response_type: "code",
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT,
      scope: LINKEDIN_SCOPE,
      state: "linkedin_connect",
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${url}`;
  };

  const handleLinkedInCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || auth.currentUser?.uid || userRef.current?.uid;
    if (!resolvedUid) return;

    setLoad("linkedin", true);
    clrErr("linkedin");

    try {
      const res = await fetch(LINKEDIN_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: LINKEDIN_REDIRECT, uid: resolvedUid }),
      });

      const rawText = await res.text();
      console.log("n8n LinkedIn response:", res.status, rawText);

      if (!res.ok || !rawText.trim()) {
        throw new Error("n8n returned empty/error response. Status: " + res.status + " Body: " + rawText);
      }

      const data = JSON.parse(rawText);
      if (!data.accessToken) {
        throw new Error("No accessToken in response: " + rawText);
      }
      const { accessToken, name, personUrn } = data;
      const connectedAt = Date.now();

      await saveSocialAccount(resolvedUid, "linkedin", {
        accessToken,
        name,
        personUrn,
        connectedAt,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        linkedin: { connected: true, name, personUrn, connectedAt },
      }));

      setOk("linkedin", true);
    } catch (e) {
      console.error("LinkedIn OAuth error:", e.message);
      setErr("linkedin", "LinkedIn error: " + e.message);
    } finally {
      setLoad("linkedin", false);
    }
  }, []);

  const connectTwitter = async () => {
    if (!TWITTER_CLIENT_ID || TWITTER_CLIENT_ID === "YOUR_TWITTER_CLIENT_ID") {
      setErr(
        "twitter",
        "Twitter/X Client ID not set. Add VITE_TWITTER_CLIENT_ID in your .env file.",
      );
      return;
    }

    const verifier = genVerifier();
    const challenge = await genChallenge(verifier);

    sessionStorage.setItem("twitter_verifier", verifier);

    const url = new URLSearchParams({
      response_type: "code",
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT,
      scope: TWITTER_SCOPE,
      state: "twitter_connect",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://twitter.com/i/oauth2/authorize?${url}`;
  };

  const handleTwitterCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || auth.currentUser?.uid || userRef.current?.uid;
    if (!resolvedUid) return;
    const verifier = sessionStorage.getItem("twitter_verifier") || "";

    sessionStorage.removeItem("twitter_verifier");

    setLoad("twitter", true);
    clrErr("twitter");

    try {
      const res = await fetch(TWITTER_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: TWITTER_REDIRECT,
          uid: resolvedUid,
          codeVerifier: verifier,
        }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.message || "Twitter/X auth failed");
      }

      const { accessToken, refreshToken, username, userId, name } = data;

      if (!accessToken) {
        throw new Error("No access token returned from Twitter/X");
      }

      await saveSocialAccount(resolvedUid, "twitter", {
        accessToken,
        refreshToken,
        username,
        userId,
        name,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        twitter: {
          connected: true,
          username,
          userId,
          name,
        },
      }));

      setOk("twitter", true);
    } catch (e) {
      setErr("twitter", "Twitter/X connection failed: " + e.message);
    } finally {
      setLoad("twitter", false);
    }
  }, []);

  const connectGmail = () => {
    const url = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      scope: GOOGLE_SCOPE,
      response_type: "code",
      state: "gmail_connect",
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${url}`;
  };

  const connectGoogleAds = () => {
    const url = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      scope: GOOGLE_ADS_SCOPE,
      response_type: "code",
      state: "google_ads_connect",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${url}`;
  };

  const handleGoogleAdsCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || userRef.current?.uid;
    if (!resolvedUid) return;
    setLoad("google-ads", true);
    clrErr("google-ads");
    try {
      const res = await fetch(GOOGLE_ADS_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: GOOGLE_REDIRECT, uid: resolvedUid }),
      });
      if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));
      const { accessToken, refreshToken, email, customerId } = await res.json();
      await saveSocialAccount(resolvedUid, "google-ads", {
        accessToken, refreshToken, email,
        customerId: customerId || "",
        connected: true,
      });
      setAccounts((a) => ({ ...a, "google-ads": { connected: true, email } }));
      setOk("google-ads", true);
    } catch (e) {
      setErr("google-ads", "Google Ads connection failed: " + e.message);
    } finally {
      setLoad("google-ads", false);
    }
  }, []);

  const handleGmailCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || auth.currentUser?.uid || userRef.current?.uid;
    if (!resolvedUid) return;

    setLoad("gmail", true);
    clrErr("gmail");

    try {
      const res = await fetch(GMAIL_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: GOOGLE_REDIRECT, uid: resolvedUid }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const { accessToken, refreshToken, email } = await res.json();

      await saveSocialAccount(resolvedUid, "gmail", {
        accessToken,
        refreshToken,
        email,
        connected: true,
      });

      setAccounts((a) => ({ ...a, gmail: { connected: true, email } }));
      setOk("gmail", true);
    } catch (e) {
      setErr("gmail", "Gmail connection failed: " + e.message);
    } finally {
      setLoad("gmail", false);
    }
  }, []);

  const connectTikTok = async () => {
    const verifier = genVerifier();
    const challenge = await genChallenge(verifier);

    sessionStorage.setItem("tiktok_verifier", verifier);

    const url = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      redirect_uri: TIKTOK_REDIRECT,
      scope: TIKTOK_SCOPE,
      response_type: "code",
      state: "tiktok_connect",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://www.tiktok.com/v2/auth/authorize?${url}`;
  };

  const handleTikTokCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || auth.currentUser?.uid || userRef.current?.uid;
    if (!resolvedUid) return;
    const verifier = sessionStorage.getItem("tiktok_verifier") || "";

    sessionStorage.removeItem("tiktok_verifier");

    setLoad("tiktok", true);
    clrErr("tiktok");

    try {
      const res = await fetch(TIKTOK_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: TIKTOK_REDIRECT,
          uid: resolvedUid,
          codeVerifier: verifier,
        }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.message || "TikTok auth failed");
      }

      const { accessToken, openId, displayName } = data;

      if (!accessToken) {
        throw new Error("No access token returned from TikTok");
      }

      await saveSocialAccount(resolvedUid, "tiktok", {
        accessToken,
        openId,
        displayName,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        tiktok: { connected: true, name: displayName, openId },
      }));

      setOk("tiktok", true);
    } catch (e) {
      setErr("tiktok", "TikTok connection failed: " + e.message);
    } finally {
      setLoad("tiktok", false);
    }
  }, []);

  const connectEventbrite = () => {
    const url = new URLSearchParams({
      response_type: "code",
      client_id: EVENTBRITE_CLIENT_ID,
      redirect_uri: EVENTBRITE_REDIRECT,
      state: "eventbrite_connect",
    });

    window.location.href = `https://www.eventbrite.com/oauth/authorize?${url}`;
  };

  const handleEventbriteCallback = useCallback(async (code, uid) => {
    const resolvedUid = uid || auth.currentUser?.uid || userRef.current?.uid;
    if (!resolvedUid) return;

    setLoad("eventbrite", true);
    clrErr("eventbrite");

    try {
      const res = await fetch(EVENTBRITE_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: EVENTBRITE_REDIRECT, uid: resolvedUid }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.message || "Eventbrite auth failed");
      }

      const { accessToken, organizationId, organizationName } = data;

      if (!accessToken) {
        throw new Error("No access token returned from Eventbrite");
      }

      await saveSocialAccount(resolvedUid, "eventbrite", {
        accessToken,
        organizationId,
        organizationName,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        eventbrite: { connected: true, organizationName, organizationId },
      }));

      setOk("eventbrite", true);
    } catch (e) {
      setErr("eventbrite", "Eventbrite connection failed: " + e.message);
    } finally {
      setLoad("eventbrite", false);
    }
  }, []);

  const saveManual = async (platform, fields) => {
    const form = manualForms[platform] || {};
    const missing = fields.filter((f) => !form[f.name]?.trim());

    if (missing.length > 0) {
      setErr(
        platform,
        `Please fill in: ${missing.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    setLoad(platform, true);
    clrErr(platform);

    try {
      await saveSocialAccount(user.uid, platform, form);
      setAccounts((a) => ({ ...a, [platform]: { connected: true, ...form } }));
      setOk(platform, true);
      setExpanded(null);
    } catch {
      setErr(platform, "Failed to save. Please try again.");
    } finally {
      setLoad(platform, false);
    }
  };

  const disconnect = async (key) => {
    setLoad(key, true);

    try {
      await disconnectSocialAccount(user.uid, key);
      setAccounts((a) => ({ ...a, [key]: { connected: false } }));
      setOk(key, false);
    } catch {
      setErr(key, "Disconnect failed.");
    } finally {
      setLoad(key, false);
    }
  };

  const connectedCount = PLATFORMS.filter(
    (p) => accounts[p.key]?.connected,
  ).length;

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

      <div
        style={{ maxWidth: 820, margin: "0 auto", padding: "108px 24px 80px" }}
      >
        {/* KB Setup flow progress banner */}
        {isKbFlow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24, padding: '14px 20px', background: 'rgba(200,151,62,0.07)', border: '1px solid rgba(200,151,62,0.22)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Brand Profile', 'Connect Platforms', 'Launch Campaign'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: i === 1 ? 'rgba(200,151,62,0.18)' : i === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 1 ? 'rgba(200,151,62,0.4)' : i === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: i === 1 ? '#c8973e' : i === 0 ? '#10b981' : 'rgba(240,235,224,0.35)' }}>
                      {i === 0 ? '✓ ' : ''}{s}
                    </span>
                    {i < 2 && <span style={{ fontSize: 11, color: 'rgba(240,235,224,0.25)' }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { sessionStorage.removeItem('kbSetupFlow'); navigate('/agents-hub') }} style={{ background: 'none', border: 'none', color: 'rgba(240,235,224,0.35)', cursor: 'pointer', fontSize: 12 }}>
              Exit setup
            </button>
          </motion.div>
        )}

        {/* Back button — only when coming from another page */}
        {fromPackageA && (
          <button
            onClick={() => { sessionStorage.removeItem('connectReturnTo'); navigate(returnTo) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: 'rgba(240,235,224,0.32)', cursor: 'pointer',
              fontSize: 13, marginBottom: 24, padding: 0,
            }}
          >
            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
            Back to {returnTo === '/products' ? 'Products' : 'Package A'}
          </button>
        )}


        {/* Header */}
        {/* Back to Campaign banner — shown when user arrived from campaign form via direct OAuth */}
        {sessionStorage.getItem('connectReturnPath') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="#c8973e" />
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Connect your account below, then return to your campaign to continue.
              </p>
            </div>
            <button
              onClick={() => { const p = sessionStorage.getItem('connectReturnPath'); sessionStorage.removeItem('connectReturnPath'); navigate(p); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(200,151,62,0.15)', border: '1px solid rgba(200,151,62,0.35)', borderRadius: 9, color: '#c8973e', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ← Back to Campaign
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 48 }}
        >
          <div
            className="badge"
            style={{ marginBottom: 16, display: "inline-flex", gap: 6 }}
          >
            <Link2 size={13} /> {isCmoSetup ? 'CMO Setup — Connect Social Accounts' : fromPackageA ? 'Social Posting Setup' : 'Connect Your Accounts'}
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              color: "#14121204",
              marginBottom: 12,
            }}
          >
            Connect <span className="gradient-text">your social accounts</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 16,
              maxWidth: 520,
            }}
          >
            {fromPackageA
              ? 'Connect your platforms below. Once done, use the Content Agent to create your post, then launch it directly to your connected accounts.'
              : 'Click the button next to each platform and log in with your own account. Your campaigns will post directly to your accounts, not ours.'}
          </p>

          {/* Marketing Readiness % */}
          <div style={{ marginTop: 28, maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Marketing Readiness
                </span>
              </div>
              <span style={{
                fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
                color: connectedCount === 0 ? "#ef4444" : "#10b981",
              }}>
                {connectedCount === 0 ? "Not Ready" : "Ready!"}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 100,
                width: connectedCount === 0 ? "4%" : "100%",
                background: connectedCount === 0 ? "#ef4444" : "linear-gradient(90deg,#10b981,#34d399)",
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {connectedCount === 0
                ? "Connect at least one platform to get started"
                : `${connectedCount} of ${PLATFORMS.length} platforms connected — you're ready to proceed! Connect more for wider reach.`
              }
            </div>
          </div>
        </motion.div>

        {/* Platform cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLATFORMS.map((p, i) => {
            const connected = accounts[p.key]?.connected;
            const isLoading = loading[p.key];
            const hasError = errors[p.key];
            const isOpen = expanded === p.key;

            const connectedLabel = accounts[p.key]?.organizationName
              ? `Connected: ${accounts[p.key].organizationName}`
              : accounts[p.key]?.pageName
                ? `Connected as: ${accounts[p.key].pageName}`
                : accounts[p.key]?.name
                  ? `Connected as: ${accounts[p.key].name}`
                  : accounts[p.key]?.groupUrlName
                    ? `Connected: meetup.com/${accounts[p.key].groupUrlName}`
                    : accounts[p.key]?.username
                      ? `Connected as: @${accounts[p.key].username}`
                      : accounts[p.key]?.email
                        ? `Connected: ${accounts[p.key].email}`
                        : "Connected";

            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  background: connected ? `${p.color}08` : "#1c1a13",
                  border: `1px solid ${
                    connected
                      ? p.color + "35"
                      : hasError
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(245,240,232,0.15)"
                  }`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "border-color 0.3s",
                }}
              >
                {/* Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "20px 24px",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 13,
                      background: `${p.color}12`,
                      border: `1px solid ${p.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: p.color,
                      flexShrink: 0,
                    }}
                  >
                    {p.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
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
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#ffffff",
                        }}
                      >
                        {p.label}
                      </span>

                      {connected && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 8px",
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#10b981",
                          }}
                        >
                          <Check size={10} /> Connected
                        </span>
                      )}
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                      {connected ? connectedLabel : p.description}
                    </p>

                    {p.note && !connected && (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 11,
                          marginTop: 3,
                        }}
                      >
                        {p.note}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ flexShrink: 0 }}>
                    {p.oauthType === "instagram" ? (
                      <button
                        onClick={connectInstagram}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background:
                            "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)",
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>{p.btnLabel}</>
                        )}
                      </button>
                    ) : p.oauthType === "meta-ads" ? (
                      <button
                        onClick={connectMetaAds}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: "#0866FF",
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>{p.btnLabel}</>
                        )}
                      </button>
                    ) : p.oauthType === "google-ads" ? (
                      connected ? (
                        <button
                          onClick={() => disconnect(p.key)}
                          disabled={isLoading}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 14px", background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10,
                            color: "#ef4444", fontSize: 13, fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {isLoading
                            ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                            : <><Unlink size={13} /> Disconnect</>}
                        </button>
                      ) : (
                        <button
                          onClick={connectGoogleAds}
                          disabled={isLoading}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 18px", background: "#4285f4",
                            border: "none", borderRadius: 10, color: "white",
                            fontSize: 14, fontWeight: 700,
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {isLoading
                            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            : <>{p.btnLabel}</>}
                        </button>
                      )
                    ) : p.oauthType === "platform_whatsapp" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 16px",
                          background: "rgba(16,185,129,0.1)",
                          border: "1px solid rgba(37,211,102,0.3)",
                          borderRadius: 10,
                          color: "#25d366",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <Check size={13} /> Always Enabled
                      </span>
                    ) : connected ? (
                      <button
                        onClick={() => disconnect(p.key)}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: 10,
                          color: "#ef4444",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={13}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <Unlink size={13} />
                        )}
                        Disconnect
                      </button>
                    ) : p.oauthType === "facebook" ? (
                      <button
                        onClick={connectFacebook}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: p.color,
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <Facebook size={14} /> {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === "linkedin" ? (
                      <button
                        onClick={connectLinkedIn}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: p.color,
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <Linkedin size={14} /> {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === "twitter" ? (
                      <button
                        onClick={connectTwitter}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: p.color,
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.625L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === "tiktok" ? (
                      <button
                        onClick={connectTikTok}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: "#ff0050",
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === "gmail" ? (
                      <button
                        onClick={connectGmail}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: "#ea4335",
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : p.oauthType === "eventbrite" ? (
                      <button
                        onClick={connectEventbrite}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: "#F05537",
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                            </svg>
                            {p.btnLabel}
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          background: p.color,
                          border: "none",
                          borderRadius: 10,
                          color: "white",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isOpen ? "Cancel" : "Enter Credentials"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Error row */}
                <AnimatePresence>
                  {hasError && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "0 24px 16px",
                          color: "#ef4444",
                          fontSize: 13,
                        }}
                      >
                        <AlertCircle
                          size={14}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <span>{hasError}</span>

                        <button
                          onClick={() => clrErr(p.key)}
                          style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.35)",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual form */}
                <AnimatePresence>
                  {isOpen && p.fields && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          padding: "0 24px 24px",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div style={{ height: 16 }} />

                        {p.fields.map((field) => (
                          <div key={field.name} style={{ marginBottom: 14 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.5)",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                marginBottom: 6,
                              }}
                            >
                              {field.label}
                            </label>

                            <input
                              type={
                                [
                                  "accessToken",
                                  "clientSecret",
                                  "refreshToken",
                                  "apiKey",
                                ].includes(field.name)
                                  ? "password"
                                  : "text"
                              }
                              placeholder={field.placeholder}
                              value={
                                (manualForms[p.key] || {})[field.name] || ""
                              }
                              onChange={(e) =>
                                setManualForms((f) => ({
                                  ...f,
                                  [p.key]: {
                                    ...(f[p.key] || {}),
                                    [field.name]: e.target.value,
                                  },
                                }))
                              }
                              className="form-input"
                              style={{ width: "100%", boxSizing: "border-box" }}
                            />

                            {field.help && (
                              <p
                                style={{
                                  color: "rgba(255,255,255,0.35)",
                                  fontSize: 11,
                                  marginTop: 5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <ExternalLink size={10} /> {field.help}
                              </p>
                            )}
                          </div>
                        ))}

                        <button
                          onClick={() => saveManual(p.key, p.fields)}
                          disabled={loading[p.key]}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "11px 20px",
                            background: p.color,
                            border: "none",
                            borderRadius: 10,
                            color: "white",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            marginTop: 4,
                          }}
                        >
                          {loading[p.key] ? (
                            <>
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />{" "}
                              Saving…
                            </>
                          ) : (
                            <>
                              <Check size={14} /> Save Credentials
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 40, display: "flex", justifyContent: "center" }}
        >
          <button
            onClick={() => {
              if (isKbFlow) {
                sessionStorage.removeItem('kbSetupFlow');
                navigate('/campaign-hub');
                return;
              }
              if (isCmoSetup) {
                sessionStorage.removeItem('cmoSetup');
                navigate(packageRoute);
                return;
              }
              sessionStorage.removeItem('connectReturnTo');
              if (fromPackageA && connectedCount > 0) {
                navigate('/post-content', { state: { from: returnTo, toolTitle: 'Post to Social', toolColor: '#c8973e' } });
              } else if (returnTo === '/post-content') {
                navigate('/post-content', { state: { toolTitle: 'Post to Social', toolColor: '#c8973e' } });
              } else {
                // Always return to wherever the user came from — only fall
                // back to the health score dashboard when nothing set a
                // return path at all.
                navigate(returnTo || '/health-score');
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 32px",
              background: "linear-gradient(135deg, #d4a853, #b8803a)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Zap size={16} />
            {isKbFlow
              ? (connectedCount > 0 ? 'Next: Launch a Campaign' : 'Skip — Go to Campaign Hub')
              : isCmoSetup
                ? (connectedCount > 0 ? packageLabel : `Skip — ${packageLabel}`)
                : fromPackageA
                  ? (connectedCount > 0
                      ? 'Next: Create & Post Content'
                      : `Skip — Back to ${returnTo === '/products' ? 'Products' : 'Package A'}`)
                  : (connectedCount > 0 ? 'Start Creating Campaigns' : 'Skip for now')
            }
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 24,
            padding: "16px 20px",
            background: "#1c1a13",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: "#ffffff" }}>
              Your credentials are encrypted
            </strong>{" "}
            and stored securely in Firebase. They are only used to post content
            you explicitly approve. You can disconnect any account at any time.
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
