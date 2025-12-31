import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SMS Terms & Conditions | PrintMailBids',
  description: 'SMS messaging terms and conditions for PrintMailBids marketplace',
};

export default function SmsTermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">SMS Terms & Conditions</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 prose prose-slate max-w-none">
          <p className="text-stone-600 mb-2">
            <strong>Effective Date:</strong> January 1, 2025
          </p>
          <p className="text-stone-600 mb-6">
            <strong>Last Updated:</strong> December 31, 2024
          </p>

          <p className="text-stone-600 mb-6">
            PrintMailBids.com (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated by Megabox Supply LLC, offers SMS (Short Message Service) messaging to provide account verification, transaction alerts, and service notifications to users of our platform. By providing your mobile phone number and opting in to receive SMS messages from PrintMailBids.com, you agree to these SMS Terms & Conditions.
          </p>

          {/* Section 1 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Opt-In and Consent</h2>
          <p className="text-stone-600 mb-4">
            By providing your mobile phone number on PrintMailBids.com, you expressly consent to receive SMS messages from us. You may opt in to receive SMS messages in the following ways:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>Phone Verification:</strong> When you enter your phone number on our phone verification page to verify your account, you consent to receive a one-time verification code via SMS.</li>
            <li><strong>Account Registration:</strong> When you provide your phone number during account registration or in your account settings, you may opt in to receive transactional and service-related SMS messages.</li>
            <li><strong>Notification Preferences:</strong> You may enable SMS notifications for specific events (such as bid alerts, auction endings, or payment confirmations) through your account notification settings.</li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-blue-800 text-sm font-medium mb-0">
              <strong>Your Consent is Voluntary:</strong> Consent to receive SMS messages is not a condition of purchasing any goods or services from PrintMailBids.com. You may use the platform without opting in to SMS messaging.
            </p>
          </div>

          {/* Section 2 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Types of SMS Messages</h2>
          <p className="text-stone-600 mb-4">
            When you opt in, you may receive the following types of SMS messages from PrintMailBids.com:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>Verification Codes:</strong> One-time passwords (OTP) to verify your phone number and secure your account.</li>
            <li><strong>Transaction Alerts:</strong> Notifications about your bids, purchases, sales, payments, and shipping updates.</li>
            <li><strong>Auction Notifications:</strong> Alerts when you are outbid, when auctions you are watching are ending, or when items you&apos;ve bid on have new activity.</li>
            <li><strong>Account Security:</strong> Alerts about login attempts, password changes, or suspicious activity on your account.</li>
            <li><strong>Service Updates:</strong> Important announcements about the platform, your listings, or your account status.</li>
          </ul>

          {/* Section 3 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Message Frequency</h2>
          <p className="text-stone-600 mb-4">
            Message frequency varies based on your account activity and notification preferences:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Verification codes are sent only when you request phone verification (typically once per verification attempt).</li>
            <li>Transaction alerts are sent as transactions occur on your account.</li>
            <li>Auction notifications depend on your bidding activity and the auctions you are watching.</li>
            <li>You can expect to receive between 1-20 messages per month depending on your activity level.</li>
          </ul>

          {/* Section 4 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Opting Out</h2>
          <p className="text-stone-600 mb-4">
            You may opt out of receiving SMS messages at any time using any of the following methods:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>Reply STOP:</strong> Reply &quot;STOP&quot; to any SMS message you receive from us. You will receive a confirmation message and will no longer receive SMS messages from PrintMailBids.com.</li>
            <li><strong>Account Settings:</strong> Log in to your PrintMailBids.com account, navigate to Settings &gt; Notifications, and disable SMS notifications.</li>
            <li><strong>Contact Support:</strong> Email us at <a href="mailto:support@printmailbids.com" className="text-blue-600 hover:underline">support@printmailbids.com</a> or call (877) 450-7756 to request removal from our SMS list.</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
            <p className="text-amber-800 text-sm font-medium mb-0">
              <strong>Note:</strong> If you opt out of SMS messages, you may still need to verify your phone via SMS to place bids or complete certain transactions. In such cases, you will need to temporarily opt back in to receive the verification code.
            </p>
          </div>

          {/* Section 5 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Message and Data Rates</h2>
          <p className="text-stone-600 mb-4">
            Standard message and data rates may apply to SMS messages sent to or received from PrintMailBids.com. These charges are determined by your mobile carrier and are your responsibility. Please contact your mobile carrier for details about your messaging plan.
          </p>

          {/* Section 6 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Supported Carriers</h2>
          <p className="text-stone-600 mb-4">
            Our SMS service is designed to work with major U.S. mobile carriers, including but not limited to:
          </p>
          <p className="text-stone-600 mb-4">
            AT&T, Verizon, T-Mobile, Sprint, U.S. Cellular, and most regional carriers. Carriers are not liable for delayed or undelivered messages.
          </p>

          {/* Section 7 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Privacy and Data Protection</h2>
          <p className="text-stone-600 mb-4">
            Your phone number and SMS preferences are protected in accordance with our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. We will not sell, rent, or share your phone number with third parties for their marketing purposes. Your phone number is used solely for:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Sending SMS messages as described in these terms</li>
            <li>Facilitating communication between buyers and sellers for transactions</li>
            <li>Account verification and security purposes</li>
          </ul>

          {/* Section 8 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Disclaimer of Liability</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids.com and its affiliates shall not be liable for:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Delays or failures in receiving SMS messages due to carrier issues, network outages, or technical problems beyond our control.</li>
            <li>Any charges incurred from your mobile carrier for receiving SMS messages.</li>
            <li>Any actions taken or not taken based on information received via SMS.</li>
          </ul>

          {/* Section 9 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Changes to These Terms</h2>
          <p className="text-stone-600 mb-4">
            We may update these SMS Terms & Conditions from time to time. We will notify you of material changes by posting the updated terms on this page with a new &quot;Last Updated&quot; date. Your continued receipt of SMS messages after changes are posted constitutes your acceptance of the revised terms.
          </p>

          {/* Section 10 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Help and Support</h2>
          <p className="text-stone-600 mb-4">
            For help with our SMS service, you can:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>Reply &quot;HELP&quot; to any SMS message for assistance</li>
            <li>Email: <a href="mailto:support@printmailbids.com" className="text-blue-600 hover:underline">support@printmailbids.com</a></li>
            <li>Phone: (877) 450-7756</li>
          </ul>

          {/* Section 11 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">11. Contact Information</h2>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
            <p className="text-stone-700 font-medium mb-2">PrintMailBids.com</p>
            <p className="text-stone-600 text-sm mb-2">Operated by Megabox Supply LLC</p>
            <ul className="text-stone-600 space-y-1">
              <li>Email: <a href="mailto:support@printmailbids.com" className="text-blue-600 hover:underline">support@printmailbids.com</a></li>
              <li>Phone: (877) 450-7756</li>
              <li>SMS Support: Reply HELP to any message</li>
            </ul>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Summary</h3>
            <ul className="text-stone-700 space-y-2 text-sm">
              <li><strong>Opt-In:</strong> By entering your phone number on PrintMailBids.com, you consent to receive SMS messages.</li>
              <li><strong>Message Types:</strong> Verification codes, transaction alerts, auction notifications, security alerts.</li>
              <li><strong>Frequency:</strong> Varies by activity; typically 1-20 messages per month.</li>
              <li><strong>Opt-Out:</strong> Reply STOP to any message, or update your notification settings.</li>
              <li><strong>Cost:</strong> Message and data rates may apply per your carrier plan.</li>
              <li><strong>Help:</strong> Reply HELP or contact support@printmailbids.com</li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-sm text-stone-500 mb-4">
              These SMS Terms & Conditions are incorporated into and subject to our <Link href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
            <div className="bg-slate-900 text-white rounded-lg p-4">
              <p className="text-sm font-medium text-center mb-0">
                BY PROVIDING YOUR PHONE NUMBER AND OPTING IN TO SMS MESSAGES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO THESE SMS TERMS & CONDITIONS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
