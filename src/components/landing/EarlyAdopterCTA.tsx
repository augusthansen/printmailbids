import { Rocket, Gift, Clock, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  {
    icon: Gift,
    title: 'Lower Fees Than Competitors',
    description: 'Only 8% buyer premium — significantly less than other platforms charge.',
  },
  {
    icon: Star,
    title: 'Featured Listings',
    description: 'Early listings get premium placement and featured status on the homepage.',
  },
  {
    icon: Clock,
    title: 'Priority Support',
    description: 'Direct access to our team. We\'ll help you create the perfect listing.',
  },
];

export function EarlyAdopterCTA() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Rocket className="h-4 w-4" />
            Now Accepting Listings
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Be among the first sellers
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            We're launching a better marketplace for print and mail equipment.
            Early sellers get exclusive benefits and prime visibility.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <benefit.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/sell"
            className="group inline-flex items-center justify-center gap-3 bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40"
          >
            List Your First Equipment
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-slate-500 text-sm">
            Free to list. Only pay when you sell.
          </p>
        </div>
      </div>
    </section>
  );
}
