import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShoppingCart,
  Tag,
  CreditCard,
  Truck,
  User,
  Shield,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center | PrintMailBids',
  description: 'Find answers to common questions about buying and selling on PrintMailBids',
};

const helpCategories = [
  {
    title: 'Buying',
    icon: ShoppingCart,
    description: 'How to bid, make offers, and purchase equipment',
    links: [
      { name: 'How Bidding Works', href: '/faq#bidding' },
      { name: 'Making Offers', href: '/faq#offers' },
      { name: 'Winning an Auction', href: '/faq#winning' },
      { name: 'Buy Now Listings', href: '/faq#buy-now' },
    ],
  },
  {
    title: 'Selling',
    icon: Tag,
    description: 'List your equipment and manage sales',
    links: [
      { name: 'Seller Guide', href: '/help/selling' },
      { name: 'Creating a Listing', href: '/faq#creating-listing' },
      { name: 'Pricing Your Equipment', href: '/faq#pricing' },
      { name: 'Seller Fees', href: '/fees' },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    description: 'Payment methods, invoices, and billing',
    links: [
      { name: 'Payment Methods', href: '/faq#payment-methods' },
      { name: 'Invoices', href: '/faq#invoices' },
      { name: 'Refunds', href: '/faq#refunds' },
      { name: 'Buyer Protection', href: '/faq#protection' },
    ],
  },
  {
    title: 'Shipping',
    icon: Truck,
    description: 'Delivery options and logistics',
    links: [
      { name: 'Shipping Options', href: '/faq#shipping' },
      { name: 'Shipping Partners', href: '/partners' },
      { name: 'Pickup vs Delivery', href: '/faq#pickup' },
      { name: 'International Shipping', href: '/faq#international' },
    ],
  },
  {
    title: 'Account',
    icon: User,
    description: 'Manage your profile and settings',
    links: [
      { name: 'Account Settings', href: '/dashboard/settings' },
      { name: 'Verification', href: '/faq#verification' },
      { name: 'Notifications', href: '/faq#notifications' },
      { name: 'Privacy', href: '/privacy' },
    ],
  },
  {
    title: 'Trust & Safety',
    icon: Shield,
    description: 'How we keep the marketplace safe',
    links: [
      { name: 'Buyer Protection', href: '/faq#protection' },
      { name: 'Reporting Issues', href: '/faq#reporting' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-blue-100">Find answers to common questions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mb-10 justify-center">
          <Link
            href="/faq"
            className="px-4 py-2 bg-white rounded-lg border border-stone-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 bg-white rounded-lg border border-stone-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"
          >
            Contact Us
          </Link>
          <Link
            href="/help/selling"
            className="px-4 py-2 bg-white rounded-lg border border-stone-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"
          >
            Seller Guide
          </Link>
          <Link
            href="/fees"
            className="px-4 py-2 bg-white rounded-lg border border-stone-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"
          >
            Pricing & Fees
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {helpCategories.map((category) => (
            <div
              key={category.title}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <category.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{category.title}</h2>
                  <p className="text-sm text-stone-500">{category.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {category.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between py-2 px-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                    >
                      <span>{link.name}</span>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 bg-slate-900 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Still need help?</h3>
          <p className="text-slate-400 mb-4">Our support team is ready to assist you.</p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
