import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchSessionFromBackend,
  getEvokeUser,
  getEvokeUserProfileSnapshot,
  setLoggedInData,
  subscribeSession,
} from "../lib/session";

const getProfileServer = () => null;

// DEV ONLY — hardcoded local session, remove before production
const DEV_USER =
  window.location.hostname === "localhost"
    ? {
        email: "vasanthchowdary35@gmail.com",
        firstName: "Vasanth",
        lastName: "chowdary",
        fullName: "Vasanth chowdary",
        custID: 260417001,
        role: 4,
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjY4LCJyb2xlIjo0LCJjdXN0aWQiOjI2MDQxNzAwMSwiaWF0IjoxNzgxNzc2NjcyLCJleHAiOjE3ODE3ODM4NzJ9.4LGLH1L5T5LMWh0BB2CtKHUNb26g-SYPr4FX5DGTbv4",
        walletAddress: "0x5114eAaC97602E33921A9d474ea70Ec181e8F4b6",
      }
    : null;

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
