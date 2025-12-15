'use client';

import { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  is_seller: boolean;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the supabase client to prevent re-creation on each render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch profile to get is_seller and is_admin status
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_seller, is_admin')
            .eq('id', user.id)
            .single();

          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);

        // Fetch profile when auth state changes
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_seller, is_admin')
            .eq('id', session.user.id)
            .single();

          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    // Clear state first
    setUser(null);
    setProfile(null);

    try {
      // Sign out locally (more reliable than global)
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }

    // Force a full page reload to clear any cached state
    window.location.href = '/';
  };

  const isSeller = profile?.is_seller ?? false;
  const isAdmin = profile?.is_admin ?? false;

  return { user, loading, signOut, isSeller, isAdmin };
}
