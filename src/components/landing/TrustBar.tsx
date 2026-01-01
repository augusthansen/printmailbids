import { Shield, CreditCard, Lock, Zap, DollarSign } from 'lucide-react';

export function TrustBar() {
  return (
    <section className="py-6 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-12">
          {/* Value props for new platform */}
          <div className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span className="text-sm sm:text-base font-medium">
              <span className="text-emerald-400 font-bold">8%</span> Buyer Premium
            </span>
          </div>

          <div className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-blue-400" />
            <span className="text-sm sm:text-base font-medium">
              <span className="text-blue-400 font-bold">Free</span> to List
            </span>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">Buyer Protection</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">Stripe Payments</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">SSL Encrypted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
