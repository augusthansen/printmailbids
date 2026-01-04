'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Phone,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Shield,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SellerRequirements {
  phoneVerified: boolean;
  stripeConnected: boolean;
  loading: boolean;
}

interface SellerOnboardingBannerProps {
  userId: string;
  onComplete?: () => void;
}

export function SellerOnboardingBanner({ userId, onComplete }: SellerOnboardingBannerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [requirements, setRequirements] = useState<SellerRequirements>({
    phoneVerified: false,
    stripeConnected: false,
    loading: true,
  });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    async function checkRequirements() {
      if (!userId) {
        setRequirements(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_verified, stripe_account_id')
          .eq('id', userId)
          .single();

        if (profile) {
          const phoneVerified = !!profile.phone_verified;
          const stripeConnected = !!profile.stripe_account_id;

          setRequirements({
            phoneVerified,
            stripeConnected,
            loading: false,
          });

          // If all requirements are met, call onComplete
          if (phoneVerified && stripeConnected && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Error checking seller requirements:', error);
        setRequirements(prev => ({ ...prev, loading: false }));
      }
    }

    checkRequirements();
  }, [userId, supabase, onComplete]);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start Stripe onboarding');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Stripe connect error:', error);
      setConnecting(false);
    }
  };

  if (requirements.loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
          <span className="text-yellow-800">Checking requirements...</span>
        </div>
      </div>
    );
  }

  const allComplete = requirements.phoneVerified && requirements.stripeConnected;

  if (allComplete) {
    return null;
  }

  const completedCount = [requirements.phoneVerified, requirements.stripeConnected].filter(Boolean).length;

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">Complete Seller Setup</h3>
            <p className="text-sm text-slate-600 mt-1">
              Complete these steps to start selling equipment. This helps protect buyers and ensures you can receive payments.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">{completedCount} of 2 completed</span>
            <span className="text-slate-500">{Math.round((completedCount / 2) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-yellow-100 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="px-6 pb-6 space-y-3">
        {/* Phone Verification */}
        <div className={`rounded-xl p-4 ${requirements.phoneVerified ? 'bg-green-50 border border-green-200' : 'bg-white border border-yellow-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              requirements.phoneVerified ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {requirements.phoneVerified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Phone className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900">Verify Phone Number</h4>
                {requirements.phoneVerified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Complete
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {requirements.phoneVerified
                  ? 'Your phone number has been verified'
                  : 'Required for account security and buyer communication'}
              </p>
              {!requirements.phoneVerified && (
                <Link
                  href="/dashboard/settings?tab=security"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-yellow-700 hover:text-yellow-800 transition-colors"
                >
                  Verify now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stripe Connect */}
        <div className={`rounded-xl p-4 ${requirements.stripeConnected ? 'bg-green-50 border border-green-200' : 'bg-white border border-yellow-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              requirements.stripeConnected ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {requirements.stripeConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900">Connect Stripe for Payouts</h4>
                {requirements.stripeConnected && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Complete
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {requirements.stripeConnected
                  ? 'Your Stripe account is connected for payouts'
                  : 'Required to receive payments from sales'}
              </p>
              {!requirements.stripeConnected && (
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-yellow-700 hover:text-yellow-800 transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Stripe
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning footer */}
      <div className="px-6 py-4 bg-yellow-100/50 border-t border-yellow-200">
        <div className="flex items-center gap-2 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>You can create listing drafts, but you must complete setup before publishing.</span>
        </div>
      </div>
    </div>
  );
}
