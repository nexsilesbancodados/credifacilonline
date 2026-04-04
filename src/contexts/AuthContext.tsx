import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  cnpj: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isReady: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const initialSessionResolved = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        // Only mark as not loading after the initial session has been resolved
        if (initialSessionResolved.current) {
          setIsLoading(false);
        }
      }
    );

    // THEN restore session from storage
    supabase.auth.getSession().then(({ data: { session: restoredSession } }) => {
      initialSessionResolved.current = true;
      setSession(restoredSession);
      setUser(restoredSession?.user ?? null);

      if (restoredSession?.user) {
        fetchProfile(restoredSession.user.id).then((p) => {
          setProfile(p);
          setIsLoading(false);
          setIsReady(true);
        });
      } else {
        setIsLoading(false);
        setIsReady(true);
      }
    }).catch(() => {
      // Even on error, stop loading to prevent infinite spinner
      initialSessionResolved.current = true;
      setIsLoading(false);
      setIsReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", user.id);

    if (!error) {
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isReady,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
