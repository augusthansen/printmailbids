import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Shield, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SMS Consent & Verification | PrintMailBids',
  description: 'How PrintMailBids collects SMS consent for phone verification',
};

export default function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">SMS Consent Collection</h1>
        <p className="text-stone-600 mb-8">
          This page demonstrates how PrintMailBids collects explicit SMS consent from users
          during the phone verification process.
        </p>

        {/* Demo of the actual consent form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Verify Your Phone
                </h3>
                <p className="text-sm text-gray-500">
                  Required to place bids and make offers
                </p>
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg bg-gray-50"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                US phone numbers only
              </p>
            </div>

            {/* SMS Opt-In Consent Box - This is the key part Twilio needs to see */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                SMS Messaging Consent
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                By clicking &quot;Send Verification Code&quot; below, I consent to receive SMS text
                messages from PrintMailBids.com at the phone number provided, including verification
                codes, transaction alerts, bid notifications, and account updates. Message frequency
                varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply
                HELP for help.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Consent is not a condition of purchase. View our{' '}
                <Link href="/sms-terms" className="underline font-medium">
                  SMS Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline font-medium">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            {/* Submit Button */}
            <button
              disabled
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium cursor-not-allowed opacity-75"
            >
              Send Verification Code
            </button>
          </div>
        </div>

        {/* Explanation Section */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">How We Collect Consent</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">User Initiates Verification</h3>
                <p className="text-stone-600 text-sm mt-1">
                  Users voluntarily navigate to their account settings and choose to verify their
                  phone number. This is required to place bids or make offers on the marketplace.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Consent Displayed Before Action</h3>
                <p className="text-stone-600 text-sm mt-1">
                  Before sending any SMS, users see a clearly visible consent box (shown above)
                  that explains what messages they will receive, message frequency, data rates,
                  and how to opt out.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Active Consent via Button Click</h3>
                <p className="text-stone-600 text-sm mt-1">
                  Users must actively click &quot;Send Verification Code&quot; to consent. The consent
                  language explicitly states that clicking the button constitutes agreement to
                  receive SMS messages.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">One-Time Verification Code Sent</h3>
                <p className="text-stone-600 text-sm mt-1">
                  A single SMS containing a 6-digit verification code is sent. The code expires
                  in 10 minutes. No recurring messages are sent unless the user requests another code.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Compliance Points */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <Shield className="h-8 w-8 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Opt-Out Support</h3>
            <p className="text-sm text-stone-600">
              Users can reply STOP to any message to immediately opt out of all SMS communications.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Help Available</h3>
            <p className="text-sm text-stone-600">
              Users can reply HELP to any message for assistance or contact support@printmailbids.com.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <Phone className="h-8 w-8 text-amber-600 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Not Required</h3>
            <p className="text-sm text-stone-600">
              SMS consent is not a condition of purchase. Users can browse and use the platform without verifying.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 p-6 bg-slate-100 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/sms-terms" className="text-blue-600 hover:underline font-medium">
              SMS Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-blue-600 hover:underline font-medium">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
