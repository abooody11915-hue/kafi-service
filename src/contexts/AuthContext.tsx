import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ServiceRole = "customer" | "provider" | "platform_owner" | "platform_operator" | "compliance_reviewer" | "finance_operator" | "support_agent";
export type ServiceProfile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  locale: string;
  role: ServiceRole;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: ServiceProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null, session: null, profile: null, loading: true,
  refreshProfile: async () => undefined,
  signOut: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;

  const loadProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) { setProfile(null); return; }
    const userId = activeSession.user.id;
    const [profileResult, platformResult, providerResult] = await Promise.all([
      supabase.from("profiles" as never).select("id,display_name,phone,locale").eq("id", userId).maybeSingle(),
      supabase.from("platform_memberships" as never).select("role").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle(),
      supabase.from("maintenance_providers" as never).select("id").eq("user_id", userId).maybeSingle(),
    ]);
    const row = profileResult.data as unknown as Omit<ServiceProfile, "role"> | null;
    const platformRole = (platformResult.data as unknown as { role?: ServiceRole } | null)?.role;
    const role: ServiceRole = platformRole ?? (providerResult.data ? "provider" : "customer");
    setProfile(row ? { ...row, role } : {
      id: userId,
      display_name: activeSession.user.user_metadata?.display_name ?? null,
      phone: activeSession.user.phone ?? null,
      locale: "ar",
      role,
    });
  }, []);

  const refreshProfile = useCallback(async () => loadProfile(session), [loadProfile, session]);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (mounted) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      window.setTimeout(() => void loadProfile(nextSession), 0);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>{children}</AuthContext.Provider>;
}
