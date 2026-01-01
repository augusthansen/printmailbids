import { Metadata } from 'next';
import Link from 'next/link';
import { Check, HelpCircle } from 'lucide-react';
import { getPlatformSettings } from '@/lib/commissions';

export const metadata: Metadata = {
  title: 'Pricing & Fees | PrintMailBids',
  description: 'Simple, transparent pricing for selling on PrintMailBids',
};

export const revalidate = 60; // Revalidate every 60 seconds

async function getFees() {
  try {
    const settings = await getPlatformSettings();
    return {
      buyerPremium: settings?.default_buyer_premium_percent ?? 8.0,
      sellerCommission: settings?.default_seller_commission_percent ?? 8.0,
    };
  } catch {
    return { buyerPremium: 8.0, sellerCommission: 8.0 };
  }
}

export default async function FeesPage() {
  const { buyerPremium, sellerCommission } = await getFees();

  // Generate fee examples based on actual commission rate
  const feeExamples = [1000, 5000, 10000, 25000, 50000].map((sale) => ({
    sale,
    fee: Math.round(sale * (sellerCommission / 100)),
    net: Math.round(sale * (1 - sellerCommission / 100)),
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Simple, Transparent Pricing</h1>
          <p className="text-stone-600">No listing fees. You only pay when your equipment sells.</p>
        </div>

        {/* Main Pricing Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden mb-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Seller Commission</h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold">{sellerCommission}%</span>
              <span className="text-blue-200">of final sale price</span>
            </div>
          </div>

          <div className="p-8">
            <h3 className="font-semibold text-slate-900 mb-4">What&apos;s included:</h3>
            <ul className="space-y-3">
              {[
                'Free listing creation',
                'Unlimited photos per listing',
                'Featured placement in search results',
                'Secure payment processing',
                'Buyer messaging system',
                'Analytics dashboard',
                'Customer support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fee Examples */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-10">
          <h3 className="font-semibold text-slate-900 mb-4">Fee Examples</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 text-sm font-medium text-stone-500">Sale Price</th>
                  <th className="text-left py-3 text-sm font-medium text-stone-500">Commission ({sellerCommission}%)</th>
                  <th className="text-left py-3 text-sm font-medium text-stone-500">You Receive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {feeExamples.map((row) => (
                  <tr key={row.sale}>
                    <td className="py-3 text-slate-900">${row.sale.toLocaleString()}</td>
                    <td className="py-3 text-stone-600">${row.fee.toLocaleString()}</td>
                    <td className="py-3 text-green-600 font-medium">${row.net.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buyer Fees */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-10">
          <h3 className="font-semibold text-slate-900 mb-2">Buyer Fees</h3>
          {buyerPremium > 0 ? (
            <p className="text-stone-600">
              A <strong>{buyerPremium}% buyer premium</strong> is added to the sale price at checkout.
              This helps maintain the platform and provide secure payment processing.
            </p>
          ) : (
            <p className="text-stone-600">
              <strong>No buyer fees!</strong> The price you see is the price you pay (plus any applicable
              shipping arranged with the seller).
            </p>
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Common Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900">When is the commission charged?</h4>
              <p className="text-stone-600 text-sm mt-1">
                The commission is deducted from the sale price when the buyer completes payment. You receive
                the net amount in your payout.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900">Are there any listing fees?</h4>
              <p className="text-stone-600 text-sm mt-1">
                No! Creating listings is completely free. You can list as many items as you want with no
                upfront costs.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900">What if my item doesn&apos;t sell?</h4>
              <p className="text-stone-600 text-sm mt-1">
                You pay nothing. The commission only applies to completed sales. You can relist items
                as many times as needed at no charge.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900">When do I get paid?</h4>
              <p className="text-stone-600 text-sm mt-1">
                Payouts are processed weekly. Once the buyer confirms receipt (or after 14 days with no
                issues), your funds are released.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/sell"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            Start Selling Today
          </Link>
          <p className="text-sm text-stone-500 mt-3">No credit card required to list</p>
        </div>
      </div>
    </div>
  );
}
