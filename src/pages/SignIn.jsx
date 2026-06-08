import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { isLoggedIn, buildAccountsLoginUrl } from "../lib/session";

/**
 * Legacy /signin route — redirects to the Evoke accounts portal for SSO.
 * After sign-in, accounts redirects back to /agents-hub.
 */
export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/agents-hub", { replace: true });
      return;
    }
    const returnUrl = `${window.location.origin}/agents-hub`;
    window.location.href = buildAccountsLoginUrl(returnUrl);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0c09",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color: "rgba(255,255,255,0.6)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Zap size={24} color="#c8973e" />
      <p style={{ fontSize: 15 }}>Redirecting to Evoke sign-in…</p>
    </div>
  );
}
