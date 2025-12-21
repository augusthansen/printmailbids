import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Package, Globe, Shield, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Partners | PrintMailBids',
  description: 'Our trusted shipping and logistics partners for equipment delivery',
};

const shippingPartners = [
  {
    name: 'Freight Shipping',
    description: 'For large equipment and machinery',
    features: [
      'LTL and full truckload options',
      'Liftgate delivery available',
      'Inside delivery services',
      'Nationwide coverage',
    ],
    providers: ['R+L Carriers', 'XPO Logistics', 'Estes Express', 'Old Dominion'],
  },
  {
    name: 'White Glove Delivery',
    description: 'Premium handling for valuable equipment',
    features: [
      'Professional uncrating',
      'Placement in your facility',
      'Basic installation assistance',
      'Debris removal',
    ],
    providers: ['Craters & Freighters', 'JK Moving', 'Arpin Van Lines'],
  },
  {
    name: 'Parcel Shipping',
    description: 'For smaller parts and supplies',
    features: [
      'Next-day and ground options',
      'Package tracking',
      'Insurance included',
      'Residential delivery',
    ],
    providers: ['UPS', 'FedEx', 'USPS'],
  },
  {
    name: 'International Shipping',
    description: 'Export equipment worldwide',
    features: [
      'Customs documentation',
      'Ocean and air freight',
      'Export crating',
      'Door-to-port or door-to-door',
    ],
    providers: ['DHL Global', 'Worldwide Express', 'Freightos'],
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Shipping Partners</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            We work with trusted logistics providers to ensure your equipment arrives safely.
            Shipping is arranged between buyer and seller.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How Shipping Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Win the Auction</h3>
              <p className="text-sm text-stone-600">Complete your purchase through PrintMailBids</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Coordinate with Seller</h3>
              <p className="text-sm text-stone-600">Discuss pickup or shipping arrangements</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Arrange Delivery</h3>
              <p className="text-sm text-stone-600">Use a partner below or your own carrier</p>
            </div>
          </div>
        </div>

        {/* Partner Categories */}
        <div className="space-y-6">
          {shippingPartners.map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{category.name}</h2>
              <p className="text-stone-600 mb-4">{category.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Services Include:</h3>
                  <ul className="space-y-1">
                    {category.features.map((feature) => (
                      <li key={feature} className="text-sm text-stone-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Recommended Providers:</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.providers.map((provider) => (
                      <span
                        key={provider}
                        className="px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-10 bg-blue-50 rounded-xl border border-blue-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Shipping Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-700">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Get multiple quotes before choosing a carrier</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Always insure valuable equipment during transit</span>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Confirm delivery requirements (liftgate, inside delivery)</span>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Document condition before and after shipping</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-10 bg-slate-900 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Need Help with Shipping?</h3>
          <p className="text-slate-400 mb-4">
            Our team can help you find the right shipping solution for your equipment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Phone className="h-4 w-4" />
              Contact Support
            </Link>
            <Link
              href="/faq#shipping"
              className="inline-block bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 font-medium transition-colors"
            >
              Shipping FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
