import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Zap,
  ExternalLink,
  Link2,
  Unlink,
  ChevronLeft,
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
  "https://vasanthchowadry18.app.n8n.cloud/webhook/linkedin-oauth";

const TWITTER_CLIENT_ID =
  import.meta.env.VITE_TWITTER_CLIENT_ID || "YOUR_TWITTER_CLIENT_ID";
const TWITTER_REDIRECT = window.location.origin + "/connect-accounts";
const TWITTER_SCOPE = "tweet.read tweet.write users.read offline.access";
const TWITTER_N8N =
  "https://vasanthchowadry18.app.n8n.cloud/webhook/twitter-oauth";

const GOOGLE_CLIENT_ID =
  "53481639003-g903a5274f1bcq4jvkgpeoispls7aps9.apps.googleusercontent.com";
const GOOGLE_REDIRECT = window.location.origin + "/connect-accounts";
const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
const GMAIL_N8N = "https://vasanthchowadry18.app.n8n.cloud/webhook/gmail-oauth";

const TIKTOK_CLIENT_KEY = "sbawq8ejz7li1bzsf1";
const TIKTOK_REDIRECT = window.location.origin + "/connect-accounts";
const TIKTOK_SCOPE = "user.info.basic,video.upload";
const TIKTOK_N8N =
  "https://vasanthchowadry18.app.n8n.cloud/webhook/tiktok-oauth";

const EVENTBRITE_CLIENT_ID =
  import.meta.env.VITE_EVENTBRITE_CLIENT_ID || "AQUWB7RTTS3CUWMCXM";
const EVENTBRITE_REDIRECT = window.location.origin + "/connect-accounts";
const EVENTBRITE_N8N =
  "https://vasanthchowadry18.app.n8n.cloud/webhook/eventbrite-oauth";

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
const INSTAGRAM_SCOPE = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";

const META_ADS_SCOPE = "ads_management,ads_read,pages_show_list,business_management";

/* Brand icon helper */
const BrandImg = ({ src, alt, size = 22 }) => (
  <img src={src} alt={alt} width={size} height={size} style={{ objectFit: "contain", display: "block" }} />
);

const PLATFORMS = [
  // 1. Facebook
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="#1877F2"/>
        <path d="M25 18.5h-4.5V15c0-1.1.9-2 2-2H24V9h-1.5C19.4 9 17 11.4 17 14.5V18.5h-3V23h3v10h4.5V23H25l.5-4.5z" fill="white"/>
      </svg>
    ),
    color: "#1877f2",
    description: "Post to your Facebook Page automatically from every campaign.",
    oauthType: "facebook",
    btnLabel: "Connect with Facebook",
  },
  // 2. Instagram
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="ig2" x1="0" y1="36" x2="36" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F58529"/><stop offset="0.5" stopColor="#DD2A7B"/><stop offset="1" stopColor="#8134AF"/>
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="8" fill="url(#ig2)"/>
        <rect x="8" y="8" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="18" cy="18" r="5" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="24" cy="12" r="1.5" fill="white"/>
      </svg>
    ),
    color: "#dd2a7b",
    description: "Post Reels, Stories, and feed content from your campaigns directly to Instagram.",
    oauthType: "instagram",
    btnLabel: "Connect with Instagram",
  },
  // 3. LinkedIn
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="#0A66C2"/>
        <path d="M10 13.5a2 2 0 100-4 2 2 0 000 4zM8.5 15.5h3V27h-3zM14 15.5h2.9v1.6c.4-.8 1.5-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.8V27H22v-5.6c0-1.3 0-3-1.8-3-1.9 0-2.2 1.5-2.2 3V27H15.5V15.5H14z" fill="white"/>
      </svg>
    ),
    color: "#0a66c2",
    description: "Share posts and articles to your LinkedIn profile or company page.",
    oauthType: "linkedin",
    btnLabel: "Connect with LinkedIn",
  },
  // 4. Eventbrite
  {
    key: "eventbrite",
    label: "Eventbrite",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="#F05537"/>
        <path d="M18 8C12.5 8 8 12.5 8 18s4.5 10 10 10 10-4.5 10-10S23.5 8 18 8zm-1 14v-8h-2v-2h4v10h-2z" fill="white"/>
        <path d="M12 16h12M12 18h9M12 20h10M12 22h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="9" y="14" width="18" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
        <text x="13" y="22" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">eb</text>
      </svg>
    ),
    color: "#F05537",
    description: "Create and publish events directly to your Eventbrite account.",
    oauthType: "eventbrite",
    btnLabel: "Connect with Eventbrite",
  },
  // 5. Gmail
  {
    key: "gmail",
    label: "Gmail / Email",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="white" stroke="#ddd" strokeWidth="1"/>
        <path d="M6 11l12 9 12-9" stroke="#EA4335" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 11h24v16H6V11z" fill="none" stroke="#4285F4" strokeWidth="2"/>
        <path d="M6 11l7 7M30 11l-7 7" stroke="#EA4335" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 27l8-8M30 27l-8-8" stroke="#34A853" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: "#ea4335",
    description: "Send campaign emails directly from your Gmail account to your contacts.",
    oauthType: "gmail",
    btnLabel: "Connect with Gmail",
  },
  // 6. Reddit
  {
    key: "reddit",
    label: "Reddit",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="18" fill="#FF4500"/>
        <circle cx="24" cy="10" r="2.5" fill="white"/>
        <path d="M14 10l6 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="20" r="6" fill="white"/>
        <circle cx="15.5" cy="19.5" r="1" fill="#FF4500"/>
        <circle cx="20.5" cy="19.5" r="1" fill="#FF4500"/>
        <path d="M15.5 22.5c.7.7 2.8.7 3.5 0" stroke="#FF4500" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="26" cy="17" r="2.5" fill="white"/>
        <circle cx="10" cy="17" r="2.5" fill="white"/>
        <path d="M10.5 17a7.5 7.5 0 0115 0" fill="none"/>
      </svg>
    ),
    color: "#ff4500",
    description: "Post Reddit content and campaign updates to your selected subreddit.",
    note: "Enter your Reddit API details and subreddit name.",
    oauthType: "manual",
    fields: [
      { name: "clientId",     label: "Reddit Client ID",      placeholder: "Your Reddit app client ID",        help: "Reddit app settings → client ID" },
      { name: "clientSecret", label: "Reddit Client Secret",  placeholder: "Your Reddit app secret",           help: "Reddit app settings → secret" },
      { name: "refreshToken", label: "Reddit Refresh Token",  placeholder: "Your Reddit OAuth refresh token",  help: "Used to keep Reddit connected" },
      { name: "subreddit",    label: "Subreddit",             placeholder: "example: entrepreneur",            help: "Do not include r/" },
    ],
  },
  // 7. Luma
  {
    key: "luma",
    label: "Luma",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="8" fill="#6C47FF"/>
        <circle cx="18" cy="18" r="8" fill="none" stroke="white" strokeWidth="2"/>
        <circle cx="18" cy="18" r="4" fill="white"/>
      </svg>
    ),
    color: "#6C47FF",
    description: "Create and manage events on Luma for your community.",
    note: "Get your API Key from lu.ma → Settings → API",
    oauthType: "manual",
    fields: [
      { name: "apiKey", label: "Luma API Key", placeholder: "luma-api-key-xxxxxxxxxxxxxxxx", help: "lu.ma → Settings → Integrations → API → Create API Key" },
    ],
  },
  // 8. Meetup
  {
    key: "meetup",
    label: "Meetup",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="#ED1C40"/>
        <text x="18" y="25" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="white">m</text>
        <circle cx="24" cy="10" r="3" fill="white"/>
        <circle cx="12" cy="13" r="2" fill="white"/>
        <circle cx="28" cy="17" r="2" fill="white"/>
      </svg>
    ),
    color: "#ED1C40",
    description: "Post events and invite members of your Meetup group.",
    note: "Get your Access Token from meetup.com → Settings → API",
    oauthType: "manual",
    fields: [
      { name: "accessToken",  label: "Meetup Access Token", placeholder: "Your Meetup OAuth access token", help: "meetup.com → Account Settings → API → Get OAuth Token" },
      { name: "groupUrlName", label: "Group URL Name",       placeholder: "my-meetup-group",                help: "The URL slug of your group, meetup.com/YOUR-GROUP-NAME" },
    ],
  },
  // 9. TikTok
  {
    key: "tiktok",
    label: "TikTok",
    icon: <BrandImg src="/icons/tiktok.png" alt="TikTok" />,
    color: "#ff0050",
    description: "Post videos and content to your TikTok Business account.",
    oauthType: "tiktok",
    btnLabel: "Connect with TikTok",
  },
  // 10. Meta Ads
  {
    key: "meta-ads",
    label: "Meta Ads",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="6" fill="#0866FF"/>
        <path d="M20 8a10 10 0 100 20 10 10 0 000-20zm1.5 15.4V18h2l.4-2.5h-2.4v-1.6c0-.7.3-1.4 1.4-1.4H24V10.2s-1-.2-1.9-.2c-2 0-3.2 1.2-3.2 3.3v1.2H16.5V17h2.4v5.4h2.6z" fill="white"/>
      </svg>
    ),
    color: "#0866FF",
    description: "Create and manage Facebook & Instagram ad campaigns directly from Evoke CMO.",
    oauthType: "meta-ads",
    btnLabel: "Connect Meta Ads",
  },
  // 11. WhatsApp
  {
    key: "whatsapp",
    label: "WhatsApp Campaigns",
    icon: (
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="18" fill="#25D366"/>
        <path d="M18 9C13 9 9 13 9 18c0 1.6.4 3.1 1.2 4.4L9 27l4.7-1.2A9 9 0 0018 27c5 0 9-4 9-9s-4-9-9-9zm4.8 12.4c-.2.6-1.2 1.1-1.7 1.2-.4 0-.9.1-2.8-.6-2.3-.9-3.8-3.2-3.9-3.3-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .5.4.2.4.7 1.7.7 1.9 0 .1 0 .3-.1.4l-.3.4c-.1.1-.2.3-.1.5.5.8 1.1 1.4 1.7 1.9.6.4 1.2.6 1.5.7.2.1.4 0 .5-.1l.3-.4c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.4.3 0 .3-.1.8-.2 1z" fill="white"/>
      </svg>
    ),
    color: "#25d366",
    description: "Platform WhatsApp Business API is active. Add recipient numbers in your campaign form to send invitation messages.",
    oauthType: "platform_whatsapp",
    note: "No setup needed. When creating a campaign, select WhatsApp and paste the phone numbers you want to invite.",
  },
];

export default function ConnectAccounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSetupMode  = searchParams.get('setup') === '1';
  const targetCampaign = searchParams.get('campaign') || '/cmo';
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [manualForms, setManualForms] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const fbToken = hash.get("access_token");
    const fbState = hash.get("state");

    if (fbToken && fbState === "facebook_connect") {
      window.history.replaceState({}, "", window.location.pathname);
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!u) return;
        unsub();
        handleFacebookTokenConnect(fbToken, u.uid);
      });
      return;
    }

    if (fbToken && fbState === "instagram_connect") {
      window.history.replaceState({}, "", window.location.pathname);
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!u) return;
        unsub();
        handleInstagramTokenConnect(fbToken, u.uid);
      });
      return;
    }

    if (fbToken && fbState === "metaads_connect") {
      window.history.replaceState({}, "", window.location.pathname);
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!u) return;
        unsub();
        handleMetaAdsTokenConnect(fbToken, u.uid);
      });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) return;

    window.history.replaceState({}, "", window.location.pathname);

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      unsub();

      if (state === "linkedin_connect") handleLinkedInCallback(code);
      if (state === "twitter_connect") handleTwitterCallback(code);
      if (state === "gmail_connect") handleGmailCallback(code);
      if (state === "tiktok_connect") handleTikTokCallback(code);
      if (state === "eventbrite_connect") handleEventbriteCallback(code);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/signin");
        return;
      }

      setUser(u);

      const data = await getOrCreateUser(u.uid, u.displayName, u.email);
      setAccounts(data.socialAccounts || {});
      setAuthReady(true);
    });

    loadFBSDK();

    return unsub;
  }, [navigate]);

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
      // Step 1: get Facebook pages with linked IG business accounts
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const igAccount = data.data?.find((p) => p.instagram_business_account);
      const igId = igAccount?.instagram_business_account?.id;

      // Step 2: fetch actual Instagram username + name using the IG user ID
      let igName = igAccount?.name || "";
      let igUsername = "";
      if (igId) {
        try {
          const igRes = await fetch(
            `https://graph.facebook.com/v21.0/${igId}?fields=name,username&access_token=${accessToken}`,
          );
          const igData = await igRes.json();
          if (!igData.error) {
            igUsername = igData.username || "";
            igName = igData.name || igName;
          }
        } catch (_) { /* use fallback name */ }
      }

      const displayName = igUsername
        ? `@${igUsername}`
        : igName || "Instagram Account";

      await saveSocialAccount(uid, "instagram", {
        accessToken,
        instagramId: igId || "connected",
        pageName: displayName,
        name: displayName,
        connected: true,
      });
      setAccounts((a) => ({
        ...a,
        instagram: { connected: true, name: displayName, pageName: displayName },
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
        "meta-ads": { connected: true, name: adAccount?.name || "Meta Ads Account" },
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

    const url = new URLSearchParams({
      response_type: "code",
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT,
      scope: LINKEDIN_SCOPE,
      state: "linkedin_connect",
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${url}`;
  };

  const handleLinkedInCallback = useCallback(async (code) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    setLoad("linkedin", true);
    clrErr("linkedin");

    try {
      const res = await fetch(LINKEDIN_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: LINKEDIN_REDIRECT, uid }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const data = await res.json();
      const { accessToken, name, personUrn } = data;

      await saveSocialAccount(uid, "linkedin", {
        accessToken,
        name,
        personUrn,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        linkedin: { connected: true, name, personUrn },
      }));

      setOk("linkedin", true);
    } catch (e) {
      setErr(
        "linkedin",
        "LinkedIn connection failed. Make sure the n8n LinkedIn OAuth webhook is active.",
      );
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

  const handleTwitterCallback = useCallback(async (code) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
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
          uid,
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

      await saveSocialAccount(uid, "twitter", {
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

  const handleGmailCallback = useCallback(async (code) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    setLoad("gmail", true);
    clrErr("gmail");

    try {
      const res = await fetch(GMAIL_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: GOOGLE_REDIRECT, uid }),
      });

      if (!res.ok) {
        throw new Error("Token exchange failed: " + (await res.text()));
      }

      const { accessToken, refreshToken, email } = await res.json();

      await saveSocialAccount(uid, "gmail", {
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

  const handleTikTokCallback = useCallback(async (code) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
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
          uid,
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

      const tiktokName = displayName || openId || "TikTok Account";
      await saveSocialAccount(uid, "tiktok", {
        accessToken,
        openId,
        displayName: tiktokName,
        name: tiktokName,
        connected: true,
      });

      setAccounts((a) => ({
        ...a,
        tiktok: { connected: true, name: tiktokName, openId },
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

  const handleEventbriteCallback = useCallback(async (code) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    setLoad("eventbrite", true);
    clrErr("eventbrite");

    try {
      const res = await fetch(EVENTBRITE_N8N, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: EVENTBRITE_REDIRECT, uid }),
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

      await saveSocialAccount(uid, "eventbrite", {
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

        {/* ── Back to Dashboard ── */}
        <button
          onClick={() => navigate("/cmo")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "none", border: "none",
            color: "rgba(255,255,255,0.45)", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", marginBottom: "28px", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        {/* ── SETUP MODE: Progress banner ── */}
        {isSetupMode && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 28,
              padding: "16px 20px",
              background: "linear-gradient(135deg, rgba(200,151,62,0.12), rgba(200,151,62,0.05))",
              border: "1px solid rgba(200,151,62,0.3)",
              borderRadius: 16,
            }}
          >
            {/* Step progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 12 }}>
              {["CMO Setup", "Connect Accounts", "Launch Campaign"].map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: i === 0 ? "#10b981" : i === 1 ? "#c8973e" : connectedCount > 0 ? "#c8973e" : "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                      color: i <= 1 || connectedCount > 0 ? "#0e0c09" : "rgba(240,235,224,0.3)",
                    }}>
                      {i === 0 ? "✓" : i === 2 && connectedCount > 0 ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: i === 1 ? "#c8973e" : i === 0 ? "#10b981" : connectedCount > 0 ? "#10b981" : "rgba(240,235,224,0.3)", whiteSpace: "nowrap" }}>{s}</span>
                  </div>
                  {i < 2 && (
                    <div style={{ flex: 1, height: 2, background: i === 0 ? "rgba(16,185,129,0.4)" : connectedCount > 0 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)", margin: "0 8px", marginBottom: 18, borderRadius: 1 }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={{ fontSize: 13, color: "rgba(240,235,224,0.6)", lineHeight: 1.55 }}>
              {connectedCount === 0
                ? <span>✅ CMO profile saved! Now connect <strong style={{ color: "#c8973e" }}>at least 1 platform</strong> below to start posting campaigns automatically.</span>
                : <span>🎉 <strong style={{ color: "#10b981" }}>{connectedCount} platform{connectedCount > 1 ? 's' : ''} connected!</strong> You're all set — click the button below to launch your campaign.</span>
              }
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 48 }}
        >
          <div
            className="badge"
            style={{ marginBottom: 16, display: "inline-flex", gap: 6 }}
          >
            <Link2 size={13} /> Connect Your Accounts
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              marginBottom: 12,
            }}
          >
            Connect <span className="gradient-text">your social accounts</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, maxWidth: 520 }}>
            Click the button next to each platform and log in with your own
            account. Your campaigns will post directly to your accounts, not
            ours.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginTop: 20,
              padding: "8px 18px",
              background: connectedCount > 0 ? "#1a1a0a" : "#1a1a1a",
              border: `1px solid ${
                connectedCount > 0 ? "rgba(201,168,76,0.4)" : "#2a2a2a"
              }`,
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span style={{ color: connectedCount > 0 ? "#C9A84C" : "rgba(255,255,255,0.45)", fontWeight: 700 }}>
              {connectedCount} / {PLATFORMS.length} connected
            </span>
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
                  background: connected
                    ? `linear-gradient(135deg, #1f1b0e, #161410)`
                    : "#141414",
                  border: `1px solid ${
                    connected
                      ? "rgba(201,168,76,0.5)"
                      : hasError
                        ? "rgba(239,68,68,0.35)"
                        : "#2a2a2a"
                  }`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: connected
                    ? "0 0 18px rgba(201,168,76,0.08)"
                    : "none",
                  transition: "all 0.3s",
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
                      background: `#0a0a0a`,
                      border: `1px solid ${p.color}45`,
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
                        style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}
                      >
                        {p.note}
                      </p>
                    )}
                  </div>

                  {/* Action button — clean logic: WhatsApp=always on, connected=disconnect, else=connect */}
                  <div style={{ flexShrink: 0 }}>
                    {p.oauthType === "platform_whatsapp" ? (
                      /* WhatsApp: always enabled, no connect/disconnect */
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, color: "#25d366", fontSize: 13, fontWeight: 700 }}>
                        <Check size={13} /> Always Enabled
                      </span>
                    ) : connected ? (
                      /* ANY platform connected → show Disconnect */
                      <button
                        onClick={() => disconnect(p.key)}
                        disabled={isLoading}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer" }}
                      >
                        {isLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Unlink size={13} />}
                        Disconnect
                      </button>
                    ) : p.oauthType === "facebook" ? (
                      <button onClick={connectFacebook} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#1877f2", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect Facebook</>}
                      </button>
                    ) : p.oauthType === "instagram" ? (
                      <button onClick={connectInstagram} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect Instagram</>}
                      </button>
                    ) : p.oauthType === "linkedin" ? (
                      <button onClick={connectLinkedIn} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#0a66c2", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect LinkedIn</>}
                      </button>
                    ) : p.oauthType === "tiktok" ? (
                      <button onClick={connectTikTok} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#ff0050", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect TikTok</>}
                      </button>
                    ) : p.oauthType === "meta-ads" ? (
                      <button onClick={connectMetaAds} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#0866FF", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect Meta Ads</>}
                      </button>
                    ) : p.oauthType === "gmail" ? (
                      <button onClick={connectGmail} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#ea4335", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect Gmail</>}
                      </button>
                    ) : p.oauthType === "eventbrite" ? (
                      <button onClick={connectEventbrite} disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#F05537", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                        {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <>Connect Eventbrite</>}
                      </button>
                    ) : (
                      /* manual credentials (Reddit, Luma, Meetup) */
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.key)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: p.color, border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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
          style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          {/* Setup mode: Launch Campaign button (enabled only after connecting) */}
          {isSetupMode ? (
            <>
              <button
                onClick={() => connectedCount > 0 && navigate(targetCampaign)}
                disabled={connectedCount === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "15px 36px",
                  background: connectedCount > 0
                    ? "linear-gradient(135deg, #c8973e, #a87030)"
                    : "rgba(255,255,255,0.05)",
                  border: connectedCount > 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, fontSize: 16, fontWeight: 800,
                  color: connectedCount > 0 ? "#0e0c09" : "rgba(240,235,224,0.2)",
                  cursor: connectedCount > 0 ? "pointer" : "not-allowed",
                  fontFamily: "'Syne','Inter',sans-serif",
                  transition: "all 0.2s",
                  boxShadow: connectedCount > 0 ? "0 8px 28px rgba(200,151,62,0.4)" : "none",
                  letterSpacing: "-0.01em",
                }}
              >
                🚀
                {connectedCount > 0 ? "Launch Your Campaign →" : `Connect ${1 - connectedCount > 0 ? 'at least 1 platform first' : ''} to Launch`}
                {connectedCount > 0 && <ArrowRight size={18} />}
              </button>
              {connectedCount === 0 && (
                <p style={{ fontSize: 12, color: "rgba(240,235,224,0.3)", textAlign: "center" }}>
                  Connect at least 1 platform above to unlock this button
                </p>
              )}
              <button
                onClick={() => navigate(targetCampaign)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(240,235,224,0.3)", fontFamily: "inherit", textDecoration: "underline" }}
              >
                Skip → Go to my Campaign
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 32px",
                background: "linear-gradient(135deg, #d4a853, #b8803a)",
                border: "none", borderRadius: 12,
                color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Zap size={16} />
              {connectedCount > 0 ? "Start Creating Campaigns" : "Skip for now"}
              <ArrowRight size={16} />
            </button>
          )}
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
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7 }}>
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
