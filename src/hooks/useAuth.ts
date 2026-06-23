import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("mock_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    const stored = localStorage.getItem("mock_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { id: parsed.id, name: parsed.user_metadata?.name || "Convidado", avatar_url: null };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const storedMock = localStorage.getItem("mock_user");
    if (storedMock && mounted) {
      setLoading(false);
    }

    async function fetchProfile(userId: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", userId)
          .single();
        return data as Profile | null;
      } catch {
        return null;
      }
    }

    // Set up auth listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        if (localStorage.getItem("mock_user")) {
          // If mock user is logged in, don't let supabase override with null
          return;
        }
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock on token refresh
          setTimeout(async () => {
            if (!mounted) return;
            const p = await fetchProfile(newSession.user.id);
            if (mounted) setProfile(p);
          }, 0);
        } else {
          setProfile(null);
        }
        if (mounted) setLoading(false);
      }
    );

    // Then get initial session
    if (!localStorage.getItem("mock_user")) {
      supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        if (!mounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          const p = await fetchProfile(initialSession.user.id);
          if (mounted) setProfile(p);
        }
        if (mounted) setLoading(false);
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const loginAsGuest = () => {
    const mockUser = {
      id: "guest-id-123",
      email: "guest@example.com",
      user_metadata: { name: "Convidado de Teste" },
    } as unknown as User;
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile({ id: mockUser.id, name: "Convidado de Teste", avatar_url: null });
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem("mock_user");
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  return { user, session, profile, loading, signUp, signIn, signOut, loginAsGuest };
}
