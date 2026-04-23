import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMe } from "@/features/Auth/api";
import { hasSupabaseConfig, supabase } from "@/shared/supabase/client";
import type { AuthSession, Profile, Role } from "@/shared/types/models";

interface SignInInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  loading: boolean;
  session: AuthSession | null;
  profile: Profile | null;
  signIn: (input: SignInInput) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isE2EFakeAuth = import.meta.env.VITE_E2E_FAKE_AUTH === "true";
const e2eSessionKey = "order-dashboard-e2e-session";

const mapSupabaseSession = (session: Session | null): AuthSession | null => {
  if (!session) {
    return null;
  }
  return {
    accessToken: session.access_token,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  };
};

const mapFakeRole = (email: string): Role => (email.includes("admin") ? "admin" : "user");

const readE2ESession = (): AuthSession | null => {
  const raw = localStorage.getItem(e2eSessionKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (activeSession: AuthSession | null) => {
    if (!activeSession) {
      setProfile(null);
      return;
    }
    const me = await getMe(activeSession.accessToken);
    setProfile(me.profile);
  }, []);

  useEffect(() => {
    if (isE2EFakeAuth) {
      const fakeSession = readE2ESession();
      setSession(fakeSession);
      if (fakeSession) {
        setProfile({
          id: fakeSession.user.id,
          full_name: fakeSession.user.email ?? "E2E User",
          phone: null,
          avatar_url: null,
          role: mapFakeRole(fakeSession.user.email ?? ""),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);
      return;
    }

    if (!supabase || !hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }
      const nextSession = mapSupabaseSession(data.session);
      setSession(nextSession);
      if (nextSession) {
        await loadProfile(nextSession).catch(() => setProfile(null));
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      const mapped = mapSupabaseSession(next);
      setSession(mapped);
      if (!mapped) {
        setProfile(null);
        return;
      }
      void loadProfile(mapped).catch(() => setProfile(null));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async ({ email, password }: SignInInput) => {
      if (isE2EFakeAuth) {
        const fakeSession: AuthSession = {
          accessToken: "e2e-access-token",
          user: {
            id: "00000000-0000-0000-0000-000000000999",
            email,
          },
        };
        localStorage.setItem(e2eSessionKey, JSON.stringify(fakeSession));
        setSession(fakeSession);
        setProfile({
          id: fakeSession.user.id,
          full_name: email,
          phone: null,
          avatar_url: null,
          role: mapFakeRole(email),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return {};
      }

      if (!supabase || !hasSupabaseConfig) {
        return {
          error: "Supabase is not configured. Please check frontend .env values.",
        };
      }

      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        return { error: result.error.message };
      }
      const nextSession = mapSupabaseSession(result.data.session);
      setSession(nextSession);
      if (nextSession) {
        try {
          await loadProfile(nextSession);
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Failed to load profile",
          };
        }
      }
      return {};
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    if (isE2EFakeAuth) {
      localStorage.removeItem(e2eSessionKey);
      setSession(null);
      setProfile(null);
      return;
    }
    if (!supabase) {
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const value = useMemo(
    () => ({
      loading,
      session,
      profile,
      signIn,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
