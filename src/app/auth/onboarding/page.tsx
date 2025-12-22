'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ShoppingCart, Store, Loader2, ArrowRight, Check } from 'lucide-react';

type AccountType = 'buyer' | 'seller' | 'both';

export default function OnboardingPage() {
  const [accountType, setAccountType] = useState<AccountType>('buyer');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user already has a profile with account type set
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller, full_name')
        .eq('id', user.id)
        .single();

      // If profile exists and has been set up (has full_name or is_seller is explicitly set), skip onboarding
      if (profile?.full_name) {
        router.push('/dashboard');
        return;
      }

      setCheckingAuth(false);
    };

    checkUser();
  }, [supabase, router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const isSeller = accountType === 'seller' || accountType === 'both';

      // Update the profile with account type
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_seller: isSeller,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('Failed to update profile. Please try again.');
        return;
      }

      // Redirect based on account type
      if (isSeller) {
        router.push('/dashboard');
      } else {
        router.push('/marketplace');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-stone-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm tracking-tight">PMB</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Welcome to PrintMailBids!</h1>
          <p className="mt-3 text-stone-600">
            One last step - tell us how you plan to use the marketplace
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              I want to...
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('buyer')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  accountType === 'buyer'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <ShoppingCart className={`h-6 w-6 mx-auto mb-2 ${
                  accountType === 'buyer' ? 'text-blue-600' : 'text-stone-400'
                }`} />
                <span className="text-sm font-medium">Buy</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('seller')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  accountType === 'seller'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <Store className={`h-6 w-6 mx-auto mb-2 ${
                  accountType === 'seller' ? 'text-blue-600' : 'text-stone-400'
                }`} />
                <span className="text-sm font-medium">Sell</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('both')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  accountType === 'both'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <div className="flex justify-center gap-1 mb-2">
                  <ShoppingCart className={`h-5 w-5 ${
                    accountType === 'both' ? 'text-blue-600' : 'text-stone-400'
                  }`} />
                  <Store className={`h-5 w-5 ${
                    accountType === 'both' ? 'text-blue-600' : 'text-stone-400'
                  }`} />
                </div>
                <span className="text-sm font-medium">Both</span>
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-2.5">
              {accountType === 'buyer' && 'Browse and bid on equipment listings'}
              {accountType === 'seller' && 'List and sell your equipment'}
              {accountType === 'both' && 'Buy equipment and sell your own'}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="text-xs text-stone-500 mt-4 text-center">
            You can change this later in your account settings
          </p>
        </div>
      </div>
    </div>
  );
}
