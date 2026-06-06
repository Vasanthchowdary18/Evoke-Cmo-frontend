/**
 * Client-side helpers for the cross-domain Evoke SSO session.
 *
 * The accounts portal (`accounts.evokemarketplace.com`) writes a non-httpOnly
 * `evoke_user` cookie at the parent domain `.evokemarketplace.com`. Any
 * `*.evokemarketplace.com` subdomain can therefore read it without an extra API
 * call. We use it purely to render the logged-in UI; gated actions should still
 * verify the JWT server-side.
 */

import { useEffect } from "react";

const COOKIE_NAME = "evoke_user";
const SESSION_ACTIVE_KEY = "evoke_session_active";
const SESSION_EXPIRY_KEY = "evoke_session_expiry_ms";

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
  return {
    email: data.email,
    firstName,
    lastName,
    fullName,
    custID: data.custID ?? null,
    role: data.role ?? null,
    token: data.token || null,
  };
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
 */
export function buildAccountsLoginUrl(redirectUrl) {
  const accountsBaseUrl = (
    import.meta?.env?.VITE_ACCOUNTS_URL ||
    "https://accounts.evokemarketplace.com"
  ).replace(/\/$/, "");
  const target =
    redirectUrl || (typeof window !== "undefined" ? window.location.href : "/");
  return `${accountsBaseUrl}/login/?redirect_url=${encodeURIComponent(target)}`;
}

function resolveCookieDomainAttribute() {
  const raw = String(import.meta?.env?.VITE_COOKIE_DOMAIN || "").trim();
  if (!raw || raw.toLowerCase() === "none") return "";
  const bare = raw.replace(/^\./, "").toLowerCase();
  if (bare === "localhost" || bare === "127.0.0.1" || bare === "::1") return "";
  return `domain=${raw.startsWith(".") ? raw : `.${raw}`}; `;
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
}

/**
 * Best-effort signout: hit backend `/auth/signout` to clear httpOnly cookies,
 * then erase the local `evoke_user` cookie.
 */
export async function signOut() {
  const apiBaseUrl = String(import.meta?.env?.VITE_API_BASE_URL || "").trim();
  if (apiBaseUrl) {
    const signoutUrl = `${apiBaseUrl.replace(/\/$/, "")}/auth/signout`;
    try {
      await fetch(signoutUrl, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Network failure shouldn't block local cleanup.
    }
  }
  clearLoggedInData();
}
