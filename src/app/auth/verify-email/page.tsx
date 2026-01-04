'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Loader2, RefreshCw, CheckCircle, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleResendEmail = async () => {
    setResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email');
      } else {
        setResent(true);
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-stone-50">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/25">
          <Mail className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4 font-display">
          Verify your email
        </h1>

        <p className="text-stone-600 mb-6 leading-relaxed">
          Please check your inbox and click the verification link to activate your account.
          You need to verify your email before accessing the dashboard.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>Don&apos;t see it?</strong> Check your spam or junk folder. The email is from <span className="font-medium">noreply@printmailbids.com</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {resent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Verification email sent! Check your inbox.
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={resending || resent}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : resent ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Email Sent
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Resend verification email
              </>
            )}
          </button>

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 border border-stone-300 text-slate-700 py-3.5 rounded-xl font-semibold hover:bg-stone-100 transition-all disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                Sign out and use different email
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-sm text-stone-500">
          Already verified?{' '}
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Try accessing dashboard
            <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
}
