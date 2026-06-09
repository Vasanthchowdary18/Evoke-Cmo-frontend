import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Linkedin,
  Facebook,
  Mail,
  MessageSquare,
  Check,
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
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          stroke="url(#ig-grad)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="url(#ig-grad)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b" />
      </svg>
    ),
    color: "#dd2a7b",
    description:
      "Post Reels, Stories, and feed content from your campaigns directly to Instagram.",
    oauthType: "instagram",
    btnLabel: "Connect with Instagram",
  },
  {
    key: "meta-ads",
    label: "Meta Ads",
    icon: (
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#0866FF" />
        <path
          d="M8 20.5C8 13.596 13.596 8 20.5 8S33 13.596 33 20.5c0 6.27-4.587 11.464-10.594 12.373V24.18h3.3l.628-4.096h-3.928v-2.66c0-1.12.549-2.212 2.309-2.212H26.6v-3.487s-1.586-.271-3.101-.271c-3.165 0-5.232 1.918-5.232 5.39v3.24h-3.52V24.18h3.52v8.693C12.587 31.964 8 26.77 8 20.5z"
          fill="white"
        />
      </svg>
    ),
    color: "#0866FF",
    description:
      "Create and manage Facebook & Instagram ad campaigns directly from Evoke CMO.",
    oauthType: "meta-ads",
    btnLabel: "Connect Meta Ads",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    color: "#ff4500",
    description:
      "Post Reddit content and campaign updates to your selected subreddit.",
    note: "Enter your Reddit API details and subreddit name.",
    oauthType: "manual",
    fields: [
      {
        name: "clientId",
        label: "Reddit Client ID",
        placeholder: "Your Reddit app client ID",
        help: "Reddit app settings → client ID",
      },
      {
        name: "clientSecret",
        label: "Reddit Client Secret",
        placeholder: "Your Reddit app secret",
        help: "Reddit app settings → secret",
      },
      {
        name: "refreshToken",
        label: "Reddit Refresh Token",
        placeholder: "Your Reddit OAuth refresh token",
        help: "Used to keep Reddit connected",
      },
      {
        name: "subreddit",
        label: "Subreddit",
        placeholder: "example: entrepreneur",
        help: "Do not include r/",
      },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: <Facebook size={22} />,
    color: "#1877f2",
    description: "Post to your Facebook Page automatically",
    oauthType: "facebook",
    btnLabel: "Connect with Facebook",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin size={22} />,
    color: "#0a66c2",
    description: "Share posts to your LinkedIn profile",
    oauthType: "linkedin",
    btnLabel: "Connect with LinkedIn",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.625L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
    color: "#ffffff",
    description:
      "Post campaign updates and short-form content to your X / Twitter account.",
    oauthType: "twitter",
    btnLabel: "Connect with X",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
    color: "#ff0050",
    description: "Post videos and content to your TikTok Business account",
    oauthType: "tiktok",
    btnLabel: "Connect with TikTok",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Campaigns",
    icon: <MessageSquare size={22} />,
    color: "#25d366",
    description:
      "Platform WhatsApp Business API is active. Add recipient numbers in your campaign form to send invitation messages.",
    oauthType: "platform_whatsapp",
    note: "No setup needed. When creating a campaign, select WhatsApp and paste the phone numbers you want to invite.",
  },
  {
    key: "gmail",
    label: "Gmail / Email",
    icon: <Mail size={22} />,
    color: "#ea4335",
    description:
      "Send campaign emails directly from your Gmail account to your contacts.",
    oauthType: "gmail",
    btnLabel: "Connect with Gmail",
  },
  {
    key: "eventbrite",
    label: "Eventbrite",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
    color: "#F05537",
    description:
      "Create and publish events directly to your Eventbrite account.",
    oauthType: "eventbrite",
    btnLabel: "Connect with Eventbrite",
  },
  {
    key: "luma",
    label: "Luma",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    color: "#6C47FF",
    description: "Create and manage events on Luma for your community.",
    note: "Get your API Key from lu.ma → Settings → API",
    oauthType: "manual",
    fields: [
      {
        name: "apiKey",
        label: "Luma API Key",
        placeholder: "luma-api-key-xxxxxxxxxxxxxxxx",
        help: "lu.ma → Settings → Integrations → API → Create API Key",
      },
    ],
  },
  {
    key: "meetup",
    label: "Meetup",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.24 12.94c-.36-.07-.72-.13-1.08-.18.03-.18.05-.36.05-.55 0-1.66-1.35-3.01-3.01-3.01-.34 0-.67.06-.98.16C13.78 8.2 12.54 7.3 11.1 7.3c-1.83 0-3.32 1.49-3.32 3.32 0 .1.01.19.02.29-.19-.03-.38-.05-.58-.05-1.66 0-3.01 1.35-3.01 3.01 0 1.66 1.35 3.01 3.01 3.01h11.58c1.1 0 2-.9 2-2 0-1.01-.75-1.85-1.56-1.94zM12 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 1.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM7.5 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
      </svg>
    ),
    color: "#ED1C40",
    description: "Post events and invite members of your Meetup group.",
    note: "Get your Access Token from meetup.com → Settings → API",
    oauthType: "manual",
    fields: [
      {
        name: "accessToken",
        label: "Meetup Access Token",
        placeholder: "Your Meetup OAuth access token",
        help: "meetup.com → Account Settings → API → Get OAuth Token",
      },
      {
        name: "groupUrlName",
        label: "Group URL Name",
        placeholder: "my-meetup-group",
        help: "The URL slug of your group, meetup.com/YOUR-GROUP-NAME",
      },
    ],
  },
];

export default function ConnectAccounts() {
  const navigate = useNavigate();
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

      await saveSocialAccount(uid, "tiktok", {
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
              background: connectedCount > 0 ? "#1b141400" : "#f8fafc",
              border: `1px solid ${
                connectedCount > 0
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(245,240,232,0.15)"
              }`,
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span style={{ color: connectedCount > 0 ? "#10b981" : "#94a3b8" }}>
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
                  background: connected ? `${p.color}08` : "#fff",
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
            onClick={() => navigate("/dashboard")}
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
            {connectedCount > 0 ? "Start Creating Campaigns" : "Skip for now"}
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
