import { useMemo } from "react";
import { useEvokeSession } from "./useEvokeSession";
import { profileToUser } from "../lib/authUtils";

export function useAuth() {
  const { profile, status } = useEvokeSession();
  const user = useMemo(() => profileToUser(profile), [profile]);
  return { user, profile, status };
}
