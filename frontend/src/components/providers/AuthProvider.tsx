'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

interface User {
  id: string;
  email?: string;
  github_username?: string;
  name?: string;
  avatar_url?: string;
  github_access_token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id, session.provider_token || '');
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user.id, session.provider_token || '');
        
        // If signing in with GitHub, register in backend
        if (event === 'SIGNED_IN' && session.provider_token) {
          await registerWithBackend(session.user.id, session.provider_token);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, githubToken: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUser({ ...data, github_access_token: githubToken });
      } else {
        // User not in DB yet, will be created after backend registration
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          setUser({
            id: authUser.user.id,
            email: authUser.user.email,
            github_access_token: githubToken
          });
        }
      }
    } catch (err) {
      console.error('[Auth] Load user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerWithBackend = async (userId: string, githubToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/auth/github/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, githubToken })
      });
    } catch (err) {
      console.error('[Auth] Backend registration error:', err);
    }
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user user:email repo',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGithub, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { supabase };
