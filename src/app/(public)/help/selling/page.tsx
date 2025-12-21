import { Metadata } from 'next';
import Link from 'next/link';
import {
  Camera,
  DollarSign,
  FileText,
  Package,
  Truck,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Seller Guide | PrintMailBids',
  description: 'Everything you need to know about selling equipment on PrintMailBids',
};

export default function SellerGuidePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Seller Guide</h1>
        <p className="text-stone-600 mb-8">
          Everything you need to know to successfully sell your equipment on PrintMailBids.
        </p>

        {/* Quick Start */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-semibold mb-4">Quick Start: List in 5 Minutes</h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>Click &quot;Sell&quot; in the navigation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>Fill out equipment details and upload photos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>Set your price (auction or Buy Now)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span>Submit and watch the bids come in!</span>
            </li>
          </ol>
          <Link
            href="/sell"
            className="inline-block mt-6 bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Create Your First Listing
          </Link>
        </div>

        {/* Guide Sections */}
        <div className="space-y-8">
          {/* Photos */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Taking Great Photos</h2>
            </div>
            <div className="prose prose-stone max-w-none">
              <p className="text-stone-600">
                Quality photos are the #1 factor in selling equipment quickly. Follow these tips:
              </p>
              <ul className="text-stone-600 space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Use good lighting - natural light works best</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Include photos from multiple angles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Show the data plate with model/serial numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Photograph any wear, damage, or defects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Include a video if possible</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Pricing Strategies</h2>
            </div>
            <div className="text-stone-600 space-y-4">
              <p>Choose the right pricing strategy for your equipment:</p>

              <div className="bg-stone-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Auction Only</h3>
                <p className="text-sm">
                  Best for unique items or when you&apos;re unsure of market value. Set a low starting
                  price to encourage bidding activity. Competition drives prices up.
                </p>
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Buy Now Only</h3>
                <p className="text-sm">
                  Best when you know exactly what you want for the item and want a quick sale.
                  Price competitively by researching similar listings.
                </p>
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Auction + Buy Now</h3>
                <p className="text-sm">
                  The best of both worlds. Let buyers bid, but offer a Buy Now price for those
                  who want to purchase immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Writing Descriptions</h2>
            </div>
            <div className="text-stone-600 space-y-4">
              <p>A good description builds buyer confidence and reduces questions:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Include make, model, year, and serial number</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Describe condition honestly (excellent, good, fair, for parts)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>List recent maintenance or upgrades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Note any known issues or wear</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Include dimensions and weight for shipping estimates</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Shipping */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Shipping Options</h2>
            </div>
            <div className="text-stone-600 space-y-4">
              <p>Offer flexible shipping and pickup options to attract more buyers:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Local Pickup</h3>
                  <p className="text-sm">
                    Most common for large equipment. List your general location (city/state)
                    and arrange pickup after sale.
                  </p>
                </div>

                <div className="bg-stone-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Freight Shipping</h3>
                  <p className="text-sm">
                    For heavy equipment. Get quotes from freight carriers or use our
                    <Link href="/partners" className="text-blue-600 hover:underline"> shipping partners</Link>.
                  </p>
                </div>

                <div className="bg-stone-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Standard Shipping</h3>
                  <p className="text-sm">
                    For smaller items that can go via UPS/FedEx. Include shipping cost in
                    your pricing or quote after sale.
                  </p>
                </div>

                <div className="bg-stone-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">White Glove</h3>
                  <p className="text-sm">
                    Premium delivery with installation. Great for expensive equipment
                    that needs professional handling.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Best Practices</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Do
                </h3>
                <ul className="text-stone-600 text-sm space-y-2">
                  <li>• Respond to questions promptly</li>
                  <li>• Be honest about condition</li>
                  <li>• Ship within agreed timeframe</li>
                  <li>• Package items securely</li>
                  <li>• Provide tracking information</li>
                  <li>• Communicate proactively</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Don&apos;t
                </h3>
                <ul className="text-stone-600 text-sm space-y-2">
                  <li>• Hide defects or damage</li>
                  <li>• Use stock photos only</li>
                  <li>• Ignore buyer messages</li>
                  <li>• Cancel sales without reason</li>
                  <li>• Ship damaged items</li>
                  <li>• Misrepresent equipment</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-slate-900 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Sell?</h3>
          <p className="text-slate-400 mb-4">Create your first listing in minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sell"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Create Listing
            </Link>
            <Link
              href="/fees"
              className="inline-block bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 font-medium transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
