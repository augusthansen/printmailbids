import { Camera, Users, Banknote, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'List Your Equipment',
    description: 'Create a listing in minutes. Add photos, set your price or starting bid, and go live instantly.',
    color: 'blue',
  },
  {
    number: '02',
    icon: Users,
    title: 'Reach Verified Buyers',
    description: 'Your equipment gets seen by thousands of industry professionals actively looking to buy.',
    color: 'blue',
  },
  {
    number: '03',
    icon: Banknote,
    title: 'Get Paid Securely',
    description: 'We handle payment processing. Funds are released to you once the buyer confirms delivery.',
    color: 'emerald',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            Simple Process
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Sell your printing and mailing equipment in three simple steps. No complicated setup, no waiting for approval.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line (hidden on mobile, shown between cards on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-transparent" />
              )}

              <div className="relative bg-stone-50 rounded-2xl p-8 border border-stone-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                {/* Step number */}
                <div className="absolute -top-4 -left-2 text-6xl font-bold text-slate-100 select-none">
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl mb-6 flex items-center justify-center ${
                  step.color === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                } shadow-lg ${
                  step.color === 'emerald' ? 'shadow-emerald-500/20' : 'shadow-blue-500/20'
                }`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className="group inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40"
            >
              Start Selling Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/fees"
              className="inline-flex items-center justify-center gap-2 bg-stone-100 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-stone-200 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
