/**
 * Client-side helpers for the cross-domain Evoke SSO session.
 *
 * The accounts portal (`accounts.evokemarketplace.com`) writes a non-httpOnly
 * `evoke_user` cookie at the parent domain `.evokemarketplace.com`. Any
 * `*.evokemarketplace.com` subdomain can therefore read it without an extra API
 * call. We use it purely to render the logged-in UI; gated actions should still
 * verify the JWT server-side.
 *
 * Mirrors `converters_fronend/src/lib/session.js` and `evoke_auth/src/lib/session.ts`.
 */

const COOKIE_NAME = "evoke_user";
const SESSION_ACTIVE_KEY = "evoke_session_active";
const SESSION_EXPIRY_KEY = "evoke_session_expiry_ms";
const SIGNOUT_MARKER_KEY = "evoke_signed_out_at";
const SIGNOUT_MARKER_GRACE_MS = 5 * 60 * 1000;
const SIGNOUT_FETCH_TIMEOUT_MS = 4000;
const ACCESS_TOKEN_FALLBACK_SEC = 60 * 60 * 2;
const SEVEN_DAYS_SEC = 60 * 60 * 24 * 7;

export const EVOKE_SESSION_EVENT = "evoke-session-change";

function readCookieValue(name) {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!row) return null;
  const raw = row.slice(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function markSignedOutInTab() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SIGNOUT_MARKER_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function clearSignedOutMarker() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SIGNOUT_MARKER_KEY);
  } catch {
    // ignore
  }
}

function isRecentlySignedOutInTab() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(SIGNOUT_MARKER_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at) || at <= 0) return false;
    return Date.now() - at < SIGNOUT_MARKER_GRACE_MS;
  } catch {
    return false;
  }
}

function dispatchSessionChange() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(EVOKE_SESSION_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeSession(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVOKE_SESSION_EVENT, callback);
  return () => window.removeEventListener(EVOKE_SESSION_EVENT, callback);
}

export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = window.atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function computeEvokeUserCookieMaxAgeSeconds(payload) {
  const token = payload?.data?.token;
  if (!token || typeof token !== "string") return ACCESS_TOKEN_FALLBACK_SEC;
  const jwtPayload = decodeJwtPayload(token);
  if (!jwtPayload?.exp) return ACCESS_TOKEN_FALLBACK_SEC;
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(jwtPayload.exp) - now;
  if (remaining <= 0) return 0;
  return Math.min(remaining, SEVEN_DAYS_SEC);
}

function isLocalBrowserHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function resolveCookieDomainAttribute() {
  if (isLocalBrowserHost()) return "";
  const raw = String(import.meta?.env?.VITE_COOKIE_DOMAIN || "").trim();
  if (!raw || raw.toLowerCase() === "none") return "";
  const bare = raw.replace(/^\./, "").toLowerCase();
  if (bare === "localhost" || bare === "127.0.0.1" || bare === "::1") return "";
  return `domain=${raw.startsWith(".") ? raw : `.${raw}`}; `;
}

/**
 * Parsed `evoke_user` cookie. Returns null when no session.
 * Shape: { status, message, data: { email, firstName, lastName, custID, role, token } }
 */
export function getEvokeUser() {
  const raw = readCookieValue(COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getEvokeUserProfile() {
  const payload = getEvokeUser();
  const data = payload?.data;
  if (!data || !data.email) return null;
  const firstName = data.firstName || "";
  const lastName = data.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || data.email;
  const walletRaw = data.walletAddress ?? data.WalletAddress;
  const walletAddress =
    typeof walletRaw === "string" && /^0x[a-fA-F0-9]{40}$/.test(walletRaw.trim())
      ? walletRaw.trim()
      : null;

  return {
    email: data.email,
    firstName,
    lastName,
    fullName,
    custID: data.custID ?? null,
    role: data.role ?? null,
    token: data.token || null,
    walletAddress,
  };
}

let cachedCookieValue = null;
let cachedProfileSnapshot = null;

function readEvokeUserCookieRaw() {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  return row ? row.slice(COOKIE_NAME.length + 1) : null;
}

function isProfileExpired(profile) {
  if (!profile?.token) return false;
  const jwtPayload = decodeJwtPayload(profile.token);
  if (!jwtPayload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return Number(jwtPayload.exp) <= now;
}

export function getEvokeUserProfileSnapshot() {
  const raw = readEvokeUserCookieRaw();
  if (raw === cachedCookieValue) return cachedProfileSnapshot;
  cachedCookieValue = raw;
  // Keep profile for UI while token refresh runs — stale `auth_token` must not
  // hide a valid `evoke_user` cookie (same fix as evoke-events).
  cachedProfileSnapshot = getEvokeUserProfile();
  return cachedProfileSnapshot;
}

/**
 * Whether a usable Evoke SSO session is present.
 */
export function isLoggedIn() {
  return !!getEvokeUserProfile();
}

/**
 * Build the URL to send the user to for sign-in on the accounts portal.
 * After signing in, accounts will redirect back to `redirectUrl`.
 * On localhost, the redirect_url is omitted — CloudFront blocks localhost URLs.
 */
export function buildAccountsLoginUrl(redirectUrl) {
  const accountsBaseUrl = (
    import.meta?.env?.VITE_ACCOUNTS_URL ||
    "https://accounts.evokemarketplace.com"
  ).replace(/\/$/, "");

  if (isLocalBrowserHost()) {
    return `${accountsBaseUrl}/login/`;
  }

  const target =
    redirectUrl || (typeof window !== "undefined" ? window.location.href : "/");
  return `${accountsBaseUrl}/login/?redirect_url=${encodeURIComponent(target)}`;
}

/**
 * Write the `evoke_user` cookie after a successful sign-in or session bootstrap.
 */
export function setLoggedInData(payload) {
  if (typeof document === "undefined") return;

  const maxAge = computeEvokeUserCookieMaxAgeSeconds(payload);
  const maxAgePart = maxAge > 0 ? `max-age=${maxAge}` : "max-age=0";
  const domainPart = resolveCookieDomainAttribute();
  const isSecure = window.location.protocol === "https:";
  const securePart = isSecure ? "secure; " : "";

  const value = encodeURIComponent(JSON.stringify(payload));
  document.cookie =
    `${COOKIE_NAME}=${value}; path=/; ${domainPart}${maxAgePart}; samesite=lax; ${securePart}`.trim();

  try {
    localStorage.removeItem("userData");
    localStorage.setItem(SESSION_ACTIVE_KEY, "1");
    const jwtPayload = decodeJwtPayload(payload?.data?.token);
    if (jwtPayload?.exp) {
      localStorage.setItem(SESSION_EXPIRY_KEY, String(Number(jwtPayload.exp) * 1000));
    }
  } catch {
    // ignore
  }

  clearSignedOutMarker();
  cachedCookieValue = null;
  cachedProfileSnapshot = null;
  dispatchSessionChange();
}

/** Erases the local `evoke_user` cookie and clears session localStorage keys. */
export function clearLoggedInData() {
  if (typeof document === "undefined") return;
  const domainPart = resolveCookieDomainAttribute();
  document.cookie =
    `${COOKIE_NAME}=; path=/; ${domainPart}expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
  try {
    localStorage.removeItem(SESSION_ACTIVE_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // ignore
  }
  cachedCookieValue = null;
  cachedProfileSnapshot = null;
  markSignedOutInTab();
  dispatchSessionChange();
}

/**
 * After OAuth, exchange the JWT for httpOnly cookies and return canonical payload.
 */
export async function establishAuthSessionFromOAuthPayload(oauthPayload) {
  const token = oauthPayload?.data?.token;
  if (!token || typeof token !== "string") return null;

  const apiBaseUrl = String(import.meta?.env?.VITE_API_BASE_URL || "").trim();
  if (!apiBaseUrl) return null;
  const url = `${apiBaseUrl.replace(/\/$/, "")}/auth/session`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data?.status === "success" &&
      data?.data &&
      Object.keys(data.data).length > 0 &&
      data.data.email
    ) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recover session from httpOnly `auth_token` when `evoke_user` is missing.
 */
export async function fetchSessionFromBackend() {
  if (isRecentlySignedOutInTab()) return null;

  const apiBaseUrl = String(import.meta?.env?.VITE_API_BASE_URL || "").trim();
  if (!apiBaseUrl) return null;
  const url = `${apiBaseUrl.replace(/\/$/, "")}/auth/session`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data?.status === "success" &&
      data?.data &&
      Object.keys(data.data).length > 0 &&
      data.data.email
    ) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Best-effort signout: hit backend `/auth/signout` to clear httpOnly cookies,
 * then erase the local `evoke_user` cookie.
 */
export async function signOut() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    const signoutUrl = `${apiBaseUrl.replace(/\/$/, "")}/auth/signout`;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId =
      controller && typeof window !== "undefined"
        ? window.setTimeout(() => controller.abort(), SIGNOUT_FETCH_TIMEOUT_MS)
        : null;
    try {
      await fetch(signoutUrl, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: controller?.signal,
      });
    } catch {
      // Network failure shouldn't block local cleanup.
    } finally {
      if (timeoutId !== null && typeof window !== "undefined") {
        window.clearTimeout(timeoutId);
      }
    }
  }
  clearLoggedInData();
}
