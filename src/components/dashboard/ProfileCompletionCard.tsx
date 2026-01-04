'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Phone,
  CreditCard,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileStatus {
  hasName: boolean;
  hasCompany: boolean;
  hasPhone: boolean;
  phoneVerified: boolean;
  hasAddress: boolean;
  hasStripeAccount: boolean; // For sellers
  isSeller: boolean;
}

interface ProfileCompletionCardProps {
  userId: string;
  isSeller: boolean;
  onDismiss?: () => void;
}

export function ProfileCompletionCard({ userId, isSeller, onDismiss }: ProfileCompletionCardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadProfileStatus() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_name, phone, phone_verified, stripe_account_id, is_seller')
          .eq('id', userId)
          .single();

        // Load address data
        const { data: address } = await supabase
          .from('user_addresses')
          .select('id')
          .eq('user_id', userId)
          .eq('is_default', true)
          .single();

        if (profile) {
          setStatus({
            hasName: !!profile.full_name,
            hasCompany: !!profile.company_name,
            hasPhone: !!profile.phone,
            phoneVerified: !!profile.phone_verified,
            hasAddress: !!address,
            hasStripeAccount: !!profile.stripe_account_id,
            isSeller: profile.is_seller,
          });
        }
      } catch (error) {
        console.error('Error loading profile status:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfileStatus();
  }, [userId, supabase]);

  if (loading || !status || dismissed) {
    return null;
  }

  const isSellerAccount = isSeller || status.isSeller;

  // Only show this card for sellers - buyers get prompted contextually
  // (phone verification when bidding, address when paying)
  if (!isSellerAccount) {
    return null;
  }

  // Seller completion items
  const completionItems = [
    {
      id: 'phone',
      label: 'Verify phone number',
      description: 'Required to list equipment and communicate with buyers',
      completed: status.phoneVerified,
      href: '/dashboard/settings?tab=security',
      icon: Phone,
      priority: 1,
    },
    {
      id: 'stripe',
      label: 'Set up payouts',
      description: 'Connect Stripe to receive payments from sales',
      completed: status.hasStripeAccount,
      href: '/dashboard/settings?tab=billing',
      icon: CreditCard,
      priority: 1,
    },
  ];

  // Sort by priority (lower = higher priority), then by completion status
  completionItems.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.priority - b.priority;
  });

  const completedCount = completionItems.filter(item => item.completed).length;
  const totalCount = completionItems.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // If everything is complete, don't show the card
  if (completedCount === totalCount) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Find the first incomplete item
  const nextAction = completionItems.find(item => !item.completed);

  // Header text for sellers
  const headerText = 'Complete seller setup';
  const subText = 'Required to publish listings and receive payments';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{headerText}</h3>
              <p className="text-sm text-slate-600">{subText} - {progressPercent}% complete</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-blue-100 rounded-full mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Completion items */}
        <div className="space-y-2">
          {completionItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                item.completed
                  ? 'bg-white/50 opacity-60'
                  : 'bg-white hover:bg-white/80 hover:shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.completed ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {item.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <item.icon className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {item.label}
                </p>
                {!item.completed && (
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                )}
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* CTA for next action */}
      {nextAction && (
        <div className="px-5 py-4 bg-blue-600 text-white">
          <Link
            href={nextAction.href}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Next: {nextAction.label}</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
