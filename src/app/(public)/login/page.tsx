'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const searchParams = useSearchParams();
  // If there's a specific redirect, use it. Otherwise, we'll determine after login based on user type
  const explicitRedirect = searchParams.get('redirect');

  // Memoize supabase client to prevent recreation on re-renders
  const supabase = useMemo(() => createClient(), []);

  // Helper function to determine redirect based on user type
  const getRedirectForUser = async (userId: string): Promise<string> => {
    // If user was trying to access a specific page, honor that
    if (explicitRedirect) {
      return explicitRedirect;
    }

    // Check if user is a seller
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', userId)
        .single();

      // Sellers go to dashboard, buyers go to marketplace to browse
      if (profile?.is_seller) {
        return '/dashboard';
      } else {
        return '/marketplace';
      }
    } catch {
      // Default to marketplace if we can't determine
      return '/marketplace';
    }
  };

  // Check if user is already logged in (with timeout)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Race between auth check and timeout
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 3000);
        });

        const userPromise = supabase.auth.getUser().then((res: { data: { user: { id: string } | null } }) => res.data.user);
        const user = await Promise.race([userPromise, timeoutPromise]);

        if (user) {
          // Already logged in, redirect based on user type
          const redirectUrl = await getRedirectForUser(user.id);
          window.location.href = redirectUrl;
        } else {
          setCheckingSession(false);
        }
      } catch {
        // On error, just show the form
        setCheckingSession(false);
      }
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: new Error('Login timed out. Please try again.') }), 10000);
      });

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        console.error('Login error:', error);
        setError(error.message);
        setLoading(false);
      } else if (data?.user) {
        // Determine redirect based on user type (seller → dashboard, buyer → marketplace)
        const redirectUrl = await getRedirectForUser(data.user.id);
        // Use window.location for a full page reload to ensure fresh session
        window.location.href = redirectUrl;
      } else {
        setError('Login failed - no user returned');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // For Google OAuth, we pass the explicit redirect if provided
    // The callback will handle determining user type if no redirect specified
    const callbackUrl = explicitRedirect
      ? `${window.location.origin}/auth/callback?redirect=${explicitRedirect}`
      : `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
  };

  // Look up user name when email changes (debounced)
  useEffect(() => {
    const lookupUser = async () => {
      if (!email || !email.includes('@')) {
        setUserName(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', email)
        .single();

      if (data?.full_name) {
        // Get first name only
        const firstName = data.full_name.split(' ')[0];
        setUserName(firstName);
      } else {
        setUserName(null);
      }
    };

    const debounce = setTimeout(lookupUser, 500);
    return () => clearTimeout(debounce);
  }, [email, supabase]);

  // Show loading while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left side - decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">PrintMail</span>
              <span className="text-2xl font-bold text-blue-400">Bids</span>
            </div>
          </Link>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Buy & Sell<br />
            <span className="text-blue-400">Print & Mail</span><br />
            Equipment
          </h2>

          <p className="text-lg text-stone-400 mb-10 max-w-md">
            Join thousands of professionals trading printing and mailing equipment on the most trusted marketplace.
          </p>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-stone-500">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">$2M+</div>
              <div className="text-sm text-stone-500">Equipment Sold</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">1,200+</div>
              <div className="text-sm text-stone-500">Happy Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </Link>
        </div>

        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 font-display">
              {userName ? `Welcome back, ${userName}!` : 'Welcome back'}
            </h1>
            <p className="mt-3 text-stone-600">
              Sign in to your PrintMailBids account
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200/50">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-stone-300 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-all font-medium text-slate-700 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-500">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                    placeholder="you@company.com"
                  />
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-stone-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-stone-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
