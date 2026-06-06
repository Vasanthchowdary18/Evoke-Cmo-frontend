import React, { createContext, useContext, useMemo } from "react";
import { useEvokeSession } from "../hooks/useEvokeSession";
import { profileToUser } from "../lib/authUtils";
import OAuthCallbackHandler from "./OAuthCallbackHandler";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { profile, status } = useEvokeSession();
  const value = useMemo(
    () => ({
      profile,
      status,
      user: profileToUser(profile),
    }),
    [profile, status],
  );

  return (
    <AuthContext.Provider value={value}>
      <OAuthCallbackHandler />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
