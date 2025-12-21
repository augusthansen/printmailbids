'use client';

import { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  is_seller: boolean;
  is_admin: boolean;
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
}

// Cache for auth state to persist across component mounts
let cachedUser: User | null = null;
let cachedProfile: Profile | null = null;
let authInitialized = false;
let authListeners: Set<() => void> = new Set();

function notifyListeners() {
  authListeners.forEach(listener => listener());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!authInitialized);

  // Memoize the supabase client to prevent re-creation on each render
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_seller, is_admin, full_name, company_name, avatar_url')
        .eq('id', userId)
        .single();
      return profileData;
    } catch {
      return null;
    }
  }, [supabase]);

  // Subscribe to cached auth state changes
  useEffect(() => {
    const listener = () => {
      setUser(cachedUser);
      setProfile(cachedProfile);
      setLoading(!authInitialized);
    };
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // If already initialized, just sync state
      if (authInitialized) {
        if (mounted) {
          setUser(cachedUser);
          setProfile(cachedProfile);
          setLoading(false);
        }
        return;
      }

      try {
        // Use getUser() - validates the token with the server
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !authUser) {
          cachedUser = null;
          cachedProfile = null;
          authInitialized = true;
          setUser(null);
          setProfile(null);
          setLoading(false);
          notifyListeners();
          return;
        }

        cachedUser = authUser;
        setUser(authUser);

        // Fetch profile
        const profileData = await fetchProfile(authUser.id);
        if (mounted) {
          cachedProfile = profileData;
          setProfile(profileData);
        }
        authInitialized = true;
        notifyListeners();
      } catch (err) {
        console.error('[useAuth] Error fetching user:', err);
        if (mounted) {
          cachedUser = null;
          cachedProfile = null;
          authInitialized = true;
          setUser(null);
          setProfile(null);
          notifyListeners();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            cachedUser = session.user;
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              cachedProfile = profileData;
              setProfile(profileData);
            }
            notifyListeners();
          }
        } else if (event === 'SIGNED_OUT') {
          cachedUser = null;
          cachedProfile = null;
          authInitialized = true;
          setUser(null);
          setProfile(null);
          notifyListeners();
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = () => {
    // Clear cached state
    cachedUser = null;
    cachedProfile = null;
    authInitialized = false;

    // Clear component state
    setUser(null);
    setProfile(null);
    notifyListeners();

    // Clear localStorage items related to Supabase
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        localStorage.removeItem(key);
      }
    }

    // Navigate to server-side signout page (handles cookies)
    window.location.href = '/auth/signout';
  };

  const isSeller = profile?.is_seller ?? false;
  const isAdmin = profile?.is_admin ?? false;
  const profileName = profile?.full_name || profile?.company_name || null;
  const avatarUrl = profile?.avatar_url || null;

  return { user, loading, signOut, isSeller, isAdmin, profile, profileName, avatarUrl };
}
