import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchSessionFromBackend,
  getEvokeUser,
  getEvokeUserProfileSnapshot,
  setLoggedInData,
  subscribeSession,
} from "../lib/session";

const getProfileServer = () => null;

// localhost only — never runs on Vercel/production
const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const DEV_USER = isLocalhost
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

  // Skip real auth on localhost
  if (DEV_USER) {
    return { profile: DEV_USER, status: "authenticated" };
  }

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

  const status = profile
    ? "authenticated"
    : bootstrapTried
      ? "unauthenticated"
      : "loading";

  return { profile, status };
}
