import React, { createContext, useMemo } from "react";
import { useEvokeSession } from "../hooks/useEvokeSession";
import { profileToUser } from "../lib/authUtils";
import OAuthCallbackHandler from "./OAuthCallbackHandler";

export const AuthContext = createContext(null);

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

