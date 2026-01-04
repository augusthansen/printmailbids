'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Building, Loader2, Check, ShoppingCart, Store, ArrowRight } from 'lucide-react';

type AccountType = 'buyer' | 'seller' | 'both';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'buyer' as AccountType,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Manually create profile if trigger doesn't work
        const isSeller = formData.accountType === 'seller' || formData.accountType === 'both';
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            company_name: formData.companyName,
            is_seller: isSeller,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't block signup if profile creation fails
        }

        // If session exists, user is already logged in (no email confirmation required)
        if (data.session) {
          router.push('/dashboard');
        } else {
          setSuccess(true);
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-stone-50">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/25">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 font-display">Check your email</h1>
          <p className="text-stone-600 mb-8 leading-relaxed">
            We&apos;ve sent a confirmation link to <strong className="text-slate-900">{formData.email}</strong>.
            Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Back to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left side - decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative">
        {/* Gradient orbs */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 lg:px-16 w-full">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <span className="text-white font-bold text-lg tracking-tight">PMB</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">PrintMail</span>
              <span className="text-2xl font-bold text-blue-400">Bids</span>
            </div>
          </Link>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Start Trading<br />
            <span className="text-blue-400">Equipment</span><br />
            Today.
          </h2>

          <p className="text-lg text-stone-400 mb-10 max-w-md mx-auto">
            Join the trusted marketplace for printing, mailing, and industrial equipment professionals.
          </p>

          {/* Benefits */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-white">No listing fees for sellers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-white">Low 8% buyer premium</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-white">Secure payments via Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - signup form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50 overflow-y-auto">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm tracking-tight">PMB</span>
            </div>
          </Link>
        </div>

        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 font-display">Create your account</h1>
            <p className="mt-3 text-stone-600">
              Join PrintMailBids and start buying or selling equipment
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200/50">
            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignup}
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

            {/* Account Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                I want to...
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'buyer' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.accountType === 'buyer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <ShoppingCart className={`h-6 w-6 mx-auto mb-2 ${
                    formData.accountType === 'buyer' ? 'text-blue-600' : 'text-stone-400'
                  }`} />
                  <span className="text-sm font-medium">Buy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'seller' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.accountType === 'seller'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Store className={`h-6 w-6 mx-auto mb-2 ${
                    formData.accountType === 'seller' ? 'text-blue-600' : 'text-stone-400'
                  }`} />
                  <span className="text-sm font-medium">Sell</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'both' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.accountType === 'both'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="flex justify-center gap-1 mb-2">
                    <ShoppingCart className={`h-5 w-5 ${
                      formData.accountType === 'both' ? 'text-blue-600' : 'text-stone-400'
                    }`} />
                    <Store className={`h-5 w-5 ${
                      formData.accountType === 'both' ? 'text-blue-600' : 'text-stone-400'
                    }`} />
                  </div>
                  <span className="text-sm font-medium">Both</span>
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-2.5">
                {formData.accountType === 'buyer' && 'Browse and bid on equipment listings'}
                {formData.accountType === 'seller' && 'List and sell your equipment'}
                {formData.accountType === 'both' && 'Buy equipment and sell your own'}
              </p>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-500">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                      placeholder="John Doe"
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company
                  </label>
                  <div className="relative">
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                      placeholder="Acme Inc."
                    />
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                    placeholder="you@company.com"
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                    placeholder="Create a password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
                </div>
                <p className="mt-1.5 text-xs text-stone-500">At least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
                    placeholder="Confirm your password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              <div className="flex items-start pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 mt-0.5 text-blue-600 border-stone-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2.5 text-sm text-stone-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-stone-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
