import { buildAccountsLoginUrl } from "./session";

/**
 * Map an Evoke SSO profile to a user object compatible with existing
 * Firestore helpers that expect { uid, displayName, email }.
 */
export function profileToUser(profile) {
  if (!profile) return null;
  const uid =
    profile.custID != null ? `sso_${profile.custID}` : profile.email;
  return {
    uid,
    displayName: profile.fullName,
    email: profile.email,
    custID: profile.custID,
    token: profile.token,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
}

/** Redirect the browser to the accounts portal for SSO sign-in. */
export function redirectToLogin(redirectUrl) {
  if (typeof window === "undefined") return;
  window.location.href = buildAccountsLoginUrl(
    redirectUrl || window.location.href,
  );
}
