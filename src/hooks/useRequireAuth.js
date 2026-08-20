import { useEffect, useState } from "react";
import { useEvokeSession } from "./useEvokeSession";
import { profileToUser, redirectToLogin } from "../lib/authUtils";
import { getOrCreateUser } from "../services/userService";

const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const DEV_PROFILE = isLocalhost ? {
  email: "dev@evokemedia.io",
  firstName: "Dev",
  lastName: "User",
  fullName: "Dev User",
  custID: "dev-local",
  role: "admin",
  token: null,
  walletAddress: null,
} : null;

/**
 * Guard hook for protected routes. Redirects to accounts SSO when unauthenticated.
 * Returns { user, profile, authReady, status }.
 */
export function useRequireAuth({ provisionUser = true } = {}) {
  const { profile: ssoProfile, status: ssoStatus } = useEvokeSession();
  const profile = ssoProfile || DEV_PROFILE;
  const status = isLocalhost && !ssoProfile ? "authenticated" : ssoStatus;
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!profile) {
      redirectToLogin();
      return;
    }

    const mapped = profileToUser(profile);
    setUser(mapped);

    if (!provisionUser) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await getOrCreateUser(mapped.uid, mapped.displayName, mapped.email);
      } catch {
        // Firestore provisioning failure shouldn't block the page.
      }
      if (!cancelled) setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, profile, provisionUser]);

  return { user, profile, authReady, status };
}
