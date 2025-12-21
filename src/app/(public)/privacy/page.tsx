import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PrintMailBids',
  description: 'Privacy Policy for PrintMailBids marketplace',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 prose prose-slate max-w-none">
          <p className="text-stone-600 mb-6">
            <strong>Effective Date:</strong> December 2024
          </p>

          <p className="text-stone-600 mb-6">
            PrintMailBids, operated by Megabox Supply LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), is committed to
            protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard
            your information when you use PrintMailBids.com.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">Information You Provide:</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Account information (name, email, phone number, company name)</li>
            <li>Profile information and preferences</li>
            <li>Listing details and equipment information</li>
            <li>Communications with other users and support</li>
            <li>Payment information (processed securely by our payment provider)</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">Information Collected Automatically:</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Device and browser information</li>
            <li>IP address and location data</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-stone-600 mb-2">We use your information to:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send notifications about bids, offers, and listings</li>
            <li>Communicate with you about updates and promotions</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Information Sharing</h2>
          <p className="text-stone-600 mb-2">We may share your information with:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>
              <strong>Other Users:</strong> Your profile information, listings, and reviews are visible
              to other users as part of the marketplace.
            </li>
            <li>
              <strong>Service Providers:</strong> Third parties that help us operate the platform
              (payment processing, email services, analytics).
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights.
            </li>
          </ul>
          <p className="text-stone-600 mb-4">
            We do not sell your personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Data Security</h2>
          <p className="text-stone-600 mb-4">
            We implement appropriate technical and organizational measures to protect your information.
            However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Your Rights and Choices</h2>
          <p className="text-stone-600 mb-2">You can:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Access and update your account information</li>
            <li>Delete your account</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Cookies</h2>
          <p className="text-stone-600 mb-4">
            We use cookies and similar technologies to improve your experience, analyze usage, and
            personalize content. You can control cookies through your browser settings.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Third-Party Services</h2>
          <p className="text-stone-600 mb-4">
            Our service integrates with third-party services (such as payment processors and
            authentication providers). These services have their own privacy policies.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Children&apos;s Privacy</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids is not intended for users under 18 years of age. We do not knowingly collect
            information from children.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Changes to This Policy</h2>
          <p className="text-stone-600 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by posting a notice on our website or sending you an email.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Contact Us</h2>
          <p className="text-stone-600 mb-4">
            For questions about this Privacy Policy or your data, contact us at:{' '}
            <a href="mailto:privacy@printmailbids.com" className="text-blue-600 hover:underline">
              privacy@printmailbids.com
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
