import { useEffect, useState } from "react";
import { useEvokeSession } from "./useEvokeSession";
import { profileToUser, redirectToLogin } from "../lib/authUtils";
import { getOrCreateUser } from "../services/userService";

/**
 * Guard hook for protected routes. Redirects to accounts SSO when unauthenticated.
 * Returns { user, profile, authReady, status }.
 */
export function useRequireAuth({ provisionUser = true } = {}) {
  const { profile, status } = useEvokeSession();
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
