import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  establishAuthSessionFromOAuthPayload,
  setLoggedInData,
} from "../lib/session";

const OAUTH_QUERY_PARAMS = ["googleLogin", "facebookLogin"];

/**
 * Handles ?googleLogin= and ?facebookLogin= after backend OAuth redirects.
 * Parses the payload, bootstraps session cookies, and strips OAuth params.
 */
export default function OAuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    (async () => {
      const params = new URLSearchParams(location.search);

      for (const param of OAUTH_QUERY_PARAMS) {
        const raw = params.get(param);
        if (!raw) continue;

        handledRef.current = true;

        try {
          const parsed = JSON.parse(decodeURIComponent(raw));
          if (parsed?.status === "success") {
            const established = await establishAuthSessionFromOAuthPayload(parsed);
            setLoggedInData(established || parsed);
          }
        } catch (err) {
          console.error("OAuth callback parsing error:", err);
        }

        for (const key of OAUTH_QUERY_PARAMS) params.delete(key);
        const qs = params.toString();
        navigate(qs ? `${location.pathname}?${qs}` : location.pathname, {
          replace: true,
        });
        return;
      }
    })();
  }, [location.search, location.pathname, navigate]);

  return null;
}
