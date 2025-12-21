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
let authLoading = true;
let authListeners: Set<() => void> = new Set();

function notifyListeners() {
  authListeners.forEach(listener => listener());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(authLoading);

  // Memoize the supabase client to prevent re-creation on each render
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout') }), 5000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('is_seller, is_admin, full_name, company_name, avatar_url')
        .eq('id', userId)
        .single();

      const { data: profileData } = await Promise.race([profilePromise, timeoutPromise]);
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
      setLoading(authLoading);
    };
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialCheckDone = false;

    // Listen for auth changes FIRST - this is more reliable with SSR client
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[useAuth] onAuthStateChange:', event, 'hasSession:', !!session);
        if (!mounted) return;

        initialCheckDone = true;

        if (session?.user) {
          const userChanged = cachedUser?.id !== session.user.id;
          cachedUser = session.user;
          setUser(session.user);

          // Only fetch profile if user changed
          if (userChanged || !cachedProfile) {
            console.log('[useAuth] Fetching profile for:', session.user.id);
            const profileData = await fetchProfile(session.user.id);
            console.log('[useAuth] Profile fetched:', profileData);
            if (mounted) {
              cachedProfile = profileData;
              setProfile(profileData);
            }
          }
          authInitialized = true;
          authLoading = false;
          setLoading(false);
          notifyListeners();
        } else {
          // No session
          cachedUser = null;
          cachedProfile = null;
          authInitialized = true;
          authLoading = false;
          setUser(null);
          setProfile(null);
          setLoading(false);
          notifyListeners();
        }
      }
    );

    // Fallback timeout - if onAuthStateChange doesn't fire within 2s, check manually
    const fallbackTimer = setTimeout(async () => {
      if (initialCheckDone || !mounted) return;

      console.log('[useAuth] Fallback: onAuthStateChange did not fire, checking session manually');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useAuth] Fallback getSession result:', !!session);

        if (!mounted || initialCheckDone) return;

        if (session?.user) {
          cachedUser = session.user;
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            cachedProfile = profileData;
            setProfile(profileData);
          }
        } else {
          cachedUser = null;
          cachedProfile = null;
          setUser(null);
          setProfile(null);
        }
        authInitialized = true;
        authLoading = false;
        setLoading(false);
        notifyListeners();
      } catch (err) {
        console.error('[useAuth] Fallback error:', err);
        if (mounted) {
          authInitialized = true;
          authLoading = false;
          setLoading(false);
          notifyListeners();
        }
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = () => {
    // Clear cached state
    cachedUser = null;
    cachedProfile = null;
    authInitialized = false;
    authLoading = true;

    // Clear component state
    setUser(null);
    setProfile(null);
    setLoading(true);
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
