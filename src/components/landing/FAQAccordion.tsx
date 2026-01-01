'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: 'How much does it cost to sell on PrintMailBids?',
    answer: 'We charge a seller commission on successful sales only - no upfront fees, no listing fees. Buyers pay an 8% buyer premium, which is lower than most competitors charge. This means more competitive bids for your equipment. Visit our pricing page for complete details.',
  },
  {
    question: 'What types of equipment can I sell?',
    answer: 'We specialize in printing, mailing, fulfillment, and packaging equipment. This includes digital and offset presses, inserters, folders, inkjet systems, bindery equipment, material handling, and related parts and supplies. If it\'s used in a print or mail operation, it belongs here.',
  },
  {
    question: 'How do I get paid after a sale?',
    answer: 'We use Stripe for secure payment processing. Once the buyer confirms delivery and the equipment is inspected, funds are released to your connected bank account. We support credit card, ACH, and wire transfer payments.',
  },
  {
    question: 'How long does it take to sell equipment?',
    answer: 'It varies based on the equipment type, condition, and pricing. Some items sell within days, while specialized equipment may take longer to find the right buyer. Our platform reaches thousands of industry professionals actively looking to buy.',
  },
  {
    question: 'What about shipping and logistics?',
    answer: 'We provide built-in tools for coordinating shipping. You can request quotes from freight carriers, upload Bills of Lading (BOL), track shipments, and communicate directly with buyers through our messaging system. For heavy equipment, we can connect you with rigging and deinstallation partners.',
  },
  {
    question: 'Is my payment secure?',
    answer: 'Absolutely. All payments are processed through Stripe, a PCI-compliant payment processor trusted by millions of businesses. We never store your full card details, and all transactions are encrypted with SSL.',
  },
  {
    question: 'Can I set a reserve price on auctions?',
    answer: 'Yes! You can set a hidden reserve price on auctions. If bidding doesn\'t reach your reserve, you\'re not obligated to sell. You can also choose fixed-price listings or "make offer" options for more control.',
  },
  {
    question: 'What\'s the 2-minute soft close?',
    answer: 'Our anti-sniping protection extends the auction by 2 minutes if a bid is placed in the final moments. This ensures all bidders have a fair chance to respond and prevents last-second bid sniping.',
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium mb-6">
            <HelpCircle className="h-4 w-4" />
            Common Questions
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to know about buying and selling on PrintMailBids.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                openIndex === index
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className={`font-semibold pr-4 ${
                  openIndex === index ? 'text-blue-700' : 'text-slate-900'
                }`}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180 text-blue-600' : 'text-slate-400'
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center p-6 bg-stone-50 rounded-2xl">
          <p className="text-slate-600 mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-all duration-300"
            >
              Contact Support
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-stone-100 transition-all duration-300 border border-stone-200"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
