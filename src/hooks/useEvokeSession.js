import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchSessionFromBackend,
  getEvokeUser,
  getEvokeUserProfileSnapshot,
  setLoggedInData,
  subscribeSession,
} from "../lib/session";

const getProfileServer = () => null;

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const DEV_PROFILE = isLocalhost
  ? {
      email: "vasanthchowadry35@gmail.com",
      firstName: "Vasanth",
      lastName: "chowdary",
      fullName: "Vasanth chowdary",
      custID: 260417001,
      role: 4,
      token: null,
      walletAddress: null,
    }
  : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapTried]);

  const effectiveProfile = profile ?? (bootstrapTried ? DEV_PROFILE : null);

  const status = effectiveProfile
    ? "authenticated"
    : bootstrapTried
      ? "unauthenticated"
      : "loading";

  return { profile: effectiveProfile, status };
}
