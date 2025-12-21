import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | PrintMailBids',
  description: 'Terms of Service for PrintMailBids marketplace',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 prose prose-slate max-w-none">
          <p className="text-stone-600 mb-6">
            <strong>Effective Date:</strong> December 2024
          </p>

          <p className="text-stone-600 mb-6">
            PrintMailBids is operated by Megabox Supply LLC. By accessing or using PrintMailBids.com
            (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-stone-600 mb-4">
            By creating an account or using PrintMailBids, you agree to these Terms of Service and our
            Privacy Policy. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids is an online marketplace that connects buyers and sellers of printing, mailing,
            and industrial equipment. We provide a platform for listing equipment, placing bids, making
            offers, and facilitating transactions between users.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. User Accounts</h2>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must be at least 18 years old to use the Service.</li>
            <li>You are responsible for all activities that occur under your account.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Buying and Selling</h2>
          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">For Sellers:</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>You must have the legal right to sell any equipment you list.</li>
            <li>Listings must accurately describe the equipment&apos;s condition and specifications.</li>
            <li>You are responsible for fulfilling sales and shipping equipment as described.</li>
            <li>PrintMailBids may charge fees for successful transactions.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">For Buyers:</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Bids and offers are binding commitments to purchase.</li>
            <li>You must complete payment for won auctions or accepted offers.</li>
            <li>Review listing details carefully before bidding or making offers.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Fees and Payments</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids may charge transaction fees on completed sales. All fees will be clearly
            disclosed before you complete a transaction. Payments are processed securely through
            our third-party payment processor.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Prohibited Activities</h2>
          <p className="text-stone-600 mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>List counterfeit, stolen, or illegal items.</li>
            <li>Manipulate bidding or pricing.</li>
            <li>Harass or defraud other users.</li>
            <li>Circumvent fees or policies.</li>
            <li>Use the Service for any unlawful purpose.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Disclaimers</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids is a marketplace platform. We do not own, inspect, or guarantee the equipment
            listed. Transactions are between buyers and sellers. We are not responsible for the quality,
            safety, or legality of items listed.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Limitation of Liability</h2>
          <p className="text-stone-600 mb-4">
            To the maximum extent permitted by law, Megabox Supply LLC and PrintMailBids shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages arising
            from your use of the Service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Changes to Terms</h2>
          <p className="text-stone-600 mb-4">
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Contact</h2>
          <p className="text-stone-600 mb-4">
            For questions about these Terms, contact us at:{' '}
            <a href="mailto:support@printmailbids.com" className="text-blue-600 hover:underline">
              support@printmailbids.com
            </a>
          </p>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-sm text-stone-500">
              PrintMailBids is operated by Megabox Supply LLC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
