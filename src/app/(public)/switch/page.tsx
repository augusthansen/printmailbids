import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowRight,
  Check,
  X,
  DollarSign,
  MessageSquare,
  Truck,
  Shield,
  Clock,
  Zap,
  Gift,
  Star,
  Headphones
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Switch to PrintMailBids | Lower Fees, Better Tools',
  description: 'Tired of high fees and outdated platforms? Switch to PrintMailBids - 8% buyer premium, built-in messaging, shipping tracking, and more.',
};

const comparisonFeatures = [
  {
    feature: 'Buyer Premium',
    us: '8%',
    them: '10-15%',
    highlight: true,
  },
  {
    feature: 'Seller Commission',
    us: 'Transparent & Published',
    them: 'Call to Negotiate',
    highlight: true,
  },
  {
    feature: 'In-Platform Messaging',
    us: true,
    them: false,
    highlight: true,
  },
  {
    feature: 'Shipping & BOL Tracking',
    us: true,
    them: false,
    highlight: true,
  },
  {
    feature: 'Mobile-Optimized',
    us: true,
    them: 'Limited',
  },
  {
    feature: 'Anti-Sniping Protection',
    us: '2-min Soft Close',
    them: 'Yes',
  },
  {
    feature: 'Listing Fees',
    us: '$0',
    them: '$0',
  },
  {
    feature: 'Secure Payments',
    us: 'Stripe (Cards, ACH, Wire)',
    them: 'Various',
  },
];

const earlyAdopterBenefits = [
  {
    icon: Gift,
    title: 'Lower Fees, More Profit',
    description: 'Only 8% buyer premium — significantly less than other platforms charge.',
  },
  {
    icon: Star,
    title: 'Featured Listing Status',
    description: 'Early listings get premium placement on our homepage and category pages.',
  },
  {
    icon: Headphones,
    title: 'White-Glove Onboarding',
    description: 'Our team will personally help you create your first listing and answer any questions.',
  },
];

const features = [
  {
    icon: DollarSign,
    title: 'Lower Fees, More Profit',
    description: 'Our 8% buyer premium is lower than the industry standard. That means more competitive bids and better results for you.',
  },
  {
    icon: MessageSquare,
    title: 'Built-in Messaging',
    description: 'Communicate with buyers directly through our platform. No more email chains or missed messages.',
  },
  {
    icon: Truck,
    title: 'Shipping Made Simple',
    description: 'Request freight quotes, upload BOLs, track shipments, and confirm delivery — all in one place.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Stripe-powered payments with escrow protection. Get paid quickly and securely.',
  },
  {
    icon: Clock,
    title: 'Fair Auctions',
    description: '2-minute soft close prevents last-second sniping. Every bidder gets a fair chance.',
  },
  {
    icon: Zap,
    title: 'Modern Platform',
    description: 'A clean, fast, mobile-friendly platform built for today\'s equipment sellers.',
  },
];

export default function SwitchPage() {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <X className="h-4 w-4 text-red-500" />
          </div>
        </div>
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <div className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative bg-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.3)_0%,_transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.2)_0%,_transparent_50%)]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Exclusive Offer for Equipment Sellers
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Tired of <span className="text-red-400 line-through">10%+ fees</span>?
              <br />
              <span className="gradient-text">Switch to 8%.</span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              You've sold equipment online before. Now there's a better way.
              Lower fees, modern tools, and a platform built for print & mail professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/sell"
                className="group inline-flex items-center justify-center gap-3 bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25"
              >
                List Your Equipment Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                Create Free Account
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-slate-300">No listing fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-slate-300">8% buyer premium</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-slate-300">Built-in messaging & tracking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                See the difference
              </h2>
              <p className="text-lg text-slate-600">
                A side-by-side look at why sellers are making the switch.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xl">
              {/* Header */}
              <div className="grid grid-cols-3 bg-slate-900 text-white">
                <div className="p-5 font-semibold">Feature</div>
                <div className="p-5 text-center font-semibold border-x border-slate-700">
                  <span className="text-blue-400">Print</span>
                  <span className="text-white">Mail</span>
                  <span className="text-slate-400">Bids</span>
                </div>
                <div className="p-5 text-center font-semibold text-slate-400">
                  Other Platforms
                </div>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((item, index) => (
                <div
                  key={item.feature}
                  className={`grid grid-cols-3 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                  } ${item.highlight ? 'ring-1 ring-inset ring-emerald-100' : ''}`}
                >
                  <div className="p-4 flex items-center">
                    <span className={`text-sm ${item.highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {item.feature}
                    </span>
                  </div>
                  <div className={`p-4 flex items-center justify-center border-x border-stone-200 ${
                    item.highlight ? 'bg-emerald-50' : ''
                  }`}>
                    <span className={item.highlight ? 'text-emerald-700 font-bold' : 'text-slate-900'}>
                      {renderValue(item.us)}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-center text-slate-500">
                    {renderValue(item.them)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Early Adopter Benefits */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Gift className="h-4 w-4" />
                Limited Time Offer
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Early seller benefits
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                We're just launching, and we want to make switching worth your while.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {earlyAdopterBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Everything you need to sell equipment
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Modern tools designed specifically for print and mail equipment sellers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Ready to make the switch?
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Join PrintMailBids today. Your first listing takes just minutes,
              and you'll enjoy lower fees than other platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sell"
                className="group inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25"
              >
                List Your Equipment
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 bg-stone-100 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-stone-200 transition-all"
              >
                Talk to Our Team
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Questions? Call us at <a href="tel:+18885659483" className="text-blue-600 hover:underline">1-888-565-9483</a>
            </p>
          </div>
        </section>
    </div>
  );
}
