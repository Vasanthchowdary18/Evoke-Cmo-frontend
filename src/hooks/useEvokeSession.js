import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchSessionFromBackend,
  getEvokeUser,
  getEvokeUserProfileSnapshot,
  setLoggedInData,
  subscribeSession,
} from "../lib/session";

const getProfileServer = () => null;

/**
 * Single source of truth for Evoke SSO session state.
 * Returns { profile, status } where status is loading | authenticated | unauthenticated.
 */
export function useEvokeSession() {
  const profile = useSyncExternalStore(
    subscribeSession,
    getEvokeUserProfileSnapshot,
    getProfileServer,
  );
  const [bootstrapTried, setBootstrapTried] = useState(false);

  useEffect(() => {
    if (bootstrapTried) return;
    let cancelled = false;
    (async () => {
      // Refresh from marketplace when `evoke_user` exists or httpOnly session may
      // still be valid — keeps token in sync after cross-app SSO.
      const hasCookie = Boolean(getEvokeUser()?.data?.email);
      if (hasCookie || !profile) {
        const payload = await fetchSessionFromBackend();
        if (!cancelled && payload) {
          setLoggedInData(payload);
        }
      }
      if (!cancelled) setBootstrapTried(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapTried, profile]);

  const status = profile
    ? "authenticated"
    : bootstrapTried
      ? "unauthenticated"
      : "loading";

  return { profile, status };
}
