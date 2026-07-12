import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "../lib/auth-client.js";

const PermissionsContext = createContext(null);

const LEVEL_RANK = { full: 2, none: 0, view: 1 };

export function PermissionsProvider({ children }) {
  const { data: session, isPending: sessionPending } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed to fetch RBAC profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const sessionId = session?.session?.id;

  useEffect(() => {
    if (sessionPending) {
      return;
    }

    if (session) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [sessionId, sessionPending, fetchProfile]);

  const hasPermission = useCallback(
    (resource, minLevel = "view") => {
      if (!profile) {
        return false;
      }

      // settings gate
      if (resource === "settings") {
        return !!profile.canManageSettings;
      }

      const userLevel = profile.permissions?.[resource] ?? "none";
      return LEVEL_RANK[userLevel] >= LEVEL_RANK[minLevel];
    },
    [profile]
  );

  const value = {
    canManageSettings: !!profile?.canManageSettings,
    hasPermission,
    loading: sessionPending || loading,
    permissions: profile?.permissions || {},
    refreshPermissions: fetchProfile,
    roleSlug: profile?.roleSlug || null,
    user: profile?.user || null,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
