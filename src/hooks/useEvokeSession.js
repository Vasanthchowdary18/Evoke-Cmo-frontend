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
      const hasCookie = Boolean(getEvokeUser()?.data?.email);
      if (hasCookie || !profile) {
        let payload = null;

        // In dev, skip the backend call entirely — it always fails with a CORS
        // error from localhost and the red console noise is misleading.
        // Go straight to the hardcoded dev session.
        if (import.meta.env.DEV) {
          payload = {
            status: "success",
            message: "Dev session",
            data: {
              email: "vasanthchowdary35@gmail.com",
              custID: 260417001,
              firstName: "Vasanth",
              lastName: "chowdary",
              role: 4,
              memberShipTypeID: null,
              walletAddress: "0x5114eAaC97602E33921A9d474ea70Ec181e8F4b6",
              referralCode: "Vasanth_h5u0r",
              referralID: "260417001_h5u0r",
              // No token field — cookie uses 7-day fallback max-age
            },
          };
        } else {
          // Production: refresh session from backend (SSO cross-domain)
          payload = await fetchSessionFromBackend();
        }

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
