'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MailX, CheckCircle } from 'lucide-react';

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'all';

  const getMessage = () => {
    switch (type) {
      case 'daily':
        return "You've been unsubscribed from daily digest emails.";
      case 'weekly':
        return "You've been unsubscribed from weekly seller summary emails.";
      default:
        return "You've been unsubscribed from all marketing emails.";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Unsubscribed Successfully
        </h1>

        <p className="text-slate-600 mb-6">
          {getMessage()}
        </p>

        <div className="bg-stone-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-stone-500 mb-2">
            <MailX className="w-5 h-5" />
            <span className="text-sm font-medium">Changed your mind?</span>
          </div>
          <p className="text-sm text-stone-500">
            You can update your email preferences anytime in your{' '}
            <Link href="/dashboard/settings" className="text-blue-600 hover:underline">
              account settings
            </Link>.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/marketplace"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-stone-100 text-slate-700 rounded-lg font-semibold hover:bg-stone-200 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnsubscribedContent />
    </Suspense>
  );
}
