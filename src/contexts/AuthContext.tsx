import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAuthCallbackUrl, getPasswordRecoveryUrl } from '@/lib/siteUrl';

type AuthError = {
  message: string;
} | null;

export type Profile = {
  id: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at?: string;
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthError>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError; needsConfirmation: boolean }>;
  signOut: () => Promise<AuthError>;
  updatePassword: (password: string) => Promise<AuthError>;
  updateDisplayName: (name: string) => Promise<AuthError>;
  deleteAccount: () => Promise<AuthError>;
  resetPassword: (email: string) => Promise<AuthError>;
  resendConfirmation: (email: string) => Promise<AuthError>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    display_name: (data.display_name as string | null) ?? null,
    role: data.role === 'admin' ? 'admin' : 'user',
    created_at: data.created_at as string | undefined,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const applySession = async (nextSession: Session | null) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        const nextProfile = await fetchProfile(nextSession.user.id);
        if (!cancelled) {
          setProfile(nextProfile);
        }
      } else {
        setProfile(null);
      }
    };

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        await applySession(data.session);
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      void applySession(currentSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return { message: 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { message: error.message } : null;
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ error: AuthError; needsConfirmation: boolean }> => {
    if (!isSupabaseConfigured) {
      return {
        error: { message: 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' },
        needsConfirmation: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        data: {
          display_name: name ?? '',
        },
      },
    });

    if (error) {
      return { error: { message: error.message }, needsConfirmation: false };
    }

    return { error: null, needsConfirmation: !data.session };
  };

  const signOut = async (): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { error } = await supabase.auth.signOut();
    return error ? { message: error.message } : null;
  };

  const updatePassword = async (password: string): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return { message: 'Supabase não configurado.' };
    }

    const { error } = await supabase.auth.updateUser({ password });
    return error ? { message: error.message } : null;
  };

  const updateDisplayName = async (name: string): Promise<AuthError> => {
    if (!isSupabaseConfigured || !user) {
      return { message: 'É preciso estar autenticado.' };
    }

    const trimmed = name.trim();
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    if (authError) {
      return { message: authError.message };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id);

    if (error) {
      return { message: error.message };
    }

    setProfile((current) => (current ? { ...current, display_name: trimmed } : current));
    return null;
  };

  const deleteAccount = async (): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return { message: 'Supabase não configurado.' };
    }

    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return { message: error.message };
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    return null;
  };

  const resetPassword = async (email: string): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return { message: 'Supabase não configurado.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordRecoveryUrl(),
    });
    return error ? { message: error.message } : null;
  };

  const resendConfirmation = async (email: string): Promise<AuthError> => {
    if (!isSupabaseConfigured) {
      return { message: 'Supabase não configurado.' };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    return error ? { message: error.message } : null;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      signIn,
      signUp,
      signOut,
      updatePassword,
      updateDisplayName,
      deleteAccount,
      resetPassword,
      resendConfirmation,
    }),
    [user, session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
