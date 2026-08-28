'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { getProfileById, updateProfile, mapDbProfileToProfile, PROFILE_SELECT_COLUMNS } from '@/lib/services/profile.service';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isSupabaseReady: boolean;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();

  const loadUserProfile = useCallback(async (userId: string, authUser?: User) => {
    try {
      let p = await getProfileById(userId);

      // If user profile does not exist yet (e.g. newly signed up), create one.
      // Plain upsert (no ignoreDuplicates): if two loads race, the loser's write
      // lands ON CONFLICT DO UPDATE and BOTH callers get the surviving row back,
      // so neither can null out the other's good state. The payload only ever
      // contains signup defaults, so a conflict update is harmless.
      if (!p && authUser) {
        const defaultName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Sinemasever';
        const defaultUsername = (authUser.user_metadata?.user_name || authUser.email?.split('@')[0] || `user_${userId.slice(0, 5)}`).toLowerCase().replace(/[^a-z0-9_]/g, '');
        const defaultAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900`;

        const defaultBirthDate = authUser.user_metadata?.birthdate || authUser.user_metadata?.birthday || undefined;

        const { data: newProfileRow, error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              username: defaultUsername,
              full_name: defaultName,
              avatar_url: defaultAvatar,
              birth_date: defaultBirthDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select(PROFILE_SELECT_COLUMNS)
          .single();

        if (!upsertError && newProfileRow) {
          p = mapDbProfileToProfile(newProfileRow);
        } else if (upsertError) {
          // The upsert payload carries username/full_name/created_at, which are
          // NOT in authenticated's UPDATE grants — so a load that races into
          // ON CONFLICT DO UPDATE fails the whole statement with 42501. The
          // winner of the race (or handle_new_user) created the row; fetch it
          // instead of leaving profile state null.
          const { data: racedRow } = await supabase
            .from('profiles')
            .select(PROFILE_SELECT_COLUMNS)
            .eq('id', userId)
            .maybeSingle();
          if (racedRow) {
            p = mapDbProfileToProfile(racedRow);
          }
        }
      }

      setProfile(p);
      if (typeof window !== 'undefined') {
        try {
          if (p) localStorage.setItem('izledin_cached_profile', JSON.stringify(p));
          if (authUser) localStorage.setItem('izledin_cached_user', JSON.stringify(authUser));
        } catch {}
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user);
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    // 0. Restore from local cache on client mount (safe after hydration)
    try {
      const cachedUser = localStorage.getItem('izledin_cached_user');
      const cachedProfile = localStorage.getItem('izledin_cached_profile');
      if (cachedUser) setUser(JSON.parse(cachedUser));
      if (cachedProfile) setProfile(JSON.parse(cachedProfile));
    } catch {}

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Single driver of profile loading. supabase-js v2 fires INITIAL_SESSION
    // immediately on subscribe (with the cached session or null), so no separate
    // getSession() priming pass — running both used to fetch the profile twice
    // and race the create-on-missing upsert against itself.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('izledin_cached_user', JSON.stringify(newSession.user));
            } catch {}
          }
          await loadUserProfile(newSession.user.id, newSession.user);
        } else {
          setProfile(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('izledin_cached_user');
              localStorage.removeItem('izledin_cached_profile');
            } catch {}
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      return { error: 'Sunucu bağlantısı kurulamadı. Lütfen tekrar deneyin.' };
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://www.izledin.com/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    // Clear caches immediately so a failed/delayed auth event doesn't leave stale data
    try {
      localStorage.removeItem('izledin_cached_user');
      localStorage.removeItem('izledin_cached_profile');
    } catch {}
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: 'Oturum açık değil.' };
    }

    const updated = await updateProfile(user.id, data);
    if (!updated) {
      return { success: false, error: 'Profil güncellenirken hata oluştu.' };
    }

    setProfile(updated);
    // Keep the hydration cache authoritative after edits, otherwise the next
    // mount flashes (or sticks with) the pre-edit profile.
    try {
      localStorage.setItem('izledin_cached_profile', JSON.stringify(updated));
    } catch {}
    return { success: true, error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isSupabaseReady: isSupabaseConfigured,
        signInWithOAuth,
        signOut,
        refreshProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
