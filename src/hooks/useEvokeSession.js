import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchSessionFromBackend,
  getEvokeUser,
  getEvokeUserProfileSnapshot,
  setLoggedInData,
  subscribeSession,
} from "../lib/session";

const getProfileServer = () => null;

// DEV ONLY — remove before production
const DEV_USER = {
  email: "vasanthchowadry35@gmail.com",
  displayName: "Vasanth",
  uid: "dev-vasanth-local",
};

export function useEvokeSession() {
  const profile = useSyncExternalStore(
    subscribeSession,
    getEvokeUserProfileSnapshot,
    getProfileServer,
  );
  const [bootstrapTried, setBootstrapTried] = useState(false);

  //  Return hardcoded dev user instantly on localhost
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
