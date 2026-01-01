import { Check, X, MessageSquare, Truck, FileText, Clock, DollarSign, Shield } from 'lucide-react';

const comparisonFeatures = [
  {
    feature: 'Buyer Premium',
    printmailbids: '8%',
    others: '10-15%',
    icon: DollarSign,
    highlight: true,
  },
  {
    feature: 'Fee Transparency',
    printmailbids: 'Published upfront',
    others: 'Call to negotiate',
    icon: FileText,
    highlight: true,
  },
  {
    feature: 'In-Platform Messaging',
    printmailbids: true,
    others: false,
    icon: MessageSquare,
    highlight: true,
  },
  {
    feature: 'Shipping Tracking & BOL',
    printmailbids: true,
    others: false,
    icon: Truck,
    highlight: true,
  },
  {
    feature: 'Anti-Sniping Protection',
    printmailbids: '2-min soft close',
    others: 'Varies',
    icon: Clock,
  },
  {
    feature: 'Secure Escrow Payments',
    printmailbids: true,
    others: 'Limited',
    icon: Shield,
  },
  {
    feature: 'Instant Listing',
    printmailbids: '24/7 self-service',
    others: 'Manual approval',
    icon: Clock,
  },
  {
    feature: 'Mobile Optimized',
    printmailbids: true,
    others: 'Limited',
    icon: Check,
  },
];

export function ComparisonTable() {
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
    <section className="py-20 bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            See the Difference
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Why sellers & buyers choose us
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lower fees, better tools, and a modern platform built for the print and mail industry.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-lg">
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-900 text-white">
            <div className="p-4 sm:p-6 font-semibold text-sm sm:text-base">Feature</div>
            <div className="p-4 sm:p-6 text-center font-semibold text-sm sm:text-base border-x border-slate-700">
              <span className="text-blue-400">Print</span>
              <span className="text-white">Mail</span>
              <span className="text-slate-400">Bids</span>
            </div>
            <div className="p-4 sm:p-6 text-center font-semibold text-sm sm:text-base text-slate-400">
              Other Platforms
            </div>
          </div>

          {/* Rows */}
          {comparisonFeatures.map((item, index) => (
            <div
              key={item.feature}
              className={`grid grid-cols-3 ${
                index % 2 === 0 ? 'bg-white' : 'bg-stone-50'
              } ${item.highlight ? 'ring-1 ring-inset ring-blue-100' : ''}`}
            >
              <div className="p-4 sm:p-5 flex items-center gap-3">
                <item.icon className={`h-5 w-5 flex-shrink-0 ${item.highlight ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-sm sm:text-base ${item.highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                  {item.feature}
                </span>
              </div>
              <div className={`p-4 sm:p-5 flex items-center justify-center border-x border-stone-200 ${
                item.highlight ? 'bg-blue-50' : ''
              }`}>
                <span className={item.highlight ? 'text-blue-700 font-bold' : 'text-slate-900'}>
                  {renderValue(item.printmailbids)}
                </span>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center text-slate-500">
                {renderValue(item.others)}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-600 mb-4">
            Ready to experience a better marketplace?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40"
          >
            Create Free Account
          </a>
        </div>
      </div>
    </section>
  );
}
