'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { ChevronDown, Search } from 'lucide-react';

const faqs = [
  {
    category: 'Buying',
    questions: [
      {
        id: 'bidding',
        question: 'How does bidding work?',
        answer: 'When you place a bid, you\'re committing to purchase the item at that price if you win. Bids are binding. The highest bidder when the auction ends wins the item. You\'ll receive email notifications if you\'re outbid so you can place a higher bid if desired.',
      },
      {
        id: 'offers',
        question: 'How do I make an offer?',
        answer: 'On listings that accept offers, click the "Make Offer" button and enter your proposed price. The seller can accept, reject, or counter your offer. Offers are valid for 48 hours unless the seller responds sooner.',
      },
      {
        id: 'winning',
        question: 'What happens when I win an auction?',
        answer: 'Congratulations! You\'ll receive an email with an invoice for the winning amount. Payment is due within 3 business days. Once paid, coordinate with the seller for pickup or shipping arrangements.',
      },
      {
        id: 'buy-now',
        question: 'What are Buy Now listings?',
        answer: 'Buy Now listings have a fixed price - no bidding required. Click "Buy Now" to purchase immediately at the listed price. Some auction listings also have a Buy Now option that allows you to skip bidding and purchase outright.',
      },
      {
        id: 'protection',
        question: 'Is there buyer protection?',
        answer: 'Yes! All purchases are protected. If an item is significantly not as described or doesn\'t arrive, contact us within 7 days of delivery. We\'ll work with you and the seller to resolve the issue.',
      },
    ],
  },
  {
    category: 'Selling',
    questions: [
      {
        id: 'creating-listing',
        question: 'How do I create a listing?',
        answer: 'Click "Sell" in the navigation, fill out the listing form with equipment details, upload photos, set your price (auction starting price and/or Buy Now price), and submit. Your listing will go live after a brief review.',
      },
      {
        id: 'pricing',
        question: 'How should I price my equipment?',
        answer: 'Research similar items on the marketplace to gauge market value. For auctions, set a starting price you\'d be comfortable selling at. Consider the equipment\'s condition, age, and included accessories. Competitive pricing attracts more bidders.',
      },
      {
        id: 'seller-fees',
        question: 'What are the seller fees?',
        answer: 'Listing is free! We only charge a commission when your item sells. See our Pricing & Fees page for current rates. Fees are deducted from your payout.',
      },
      {
        id: 'payouts',
        question: 'When do I get paid?',
        answer: 'Once the buyer completes payment and confirms receipt (or after 14 days if no issues reported), funds are released to your account. Payouts are processed weekly to your linked bank account.',
      },
    ],
  },
  {
    category: 'Payments',
    questions: [
      {
        id: 'payment-methods',
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor. Bank transfers are available for larger purchases.',
      },
      {
        id: 'invoices',
        question: 'How do invoices work?',
        answer: 'After winning an auction or having an offer accepted, you\'ll receive an invoice via email. You can also view and pay invoices from your dashboard. Invoices include the item price, any applicable fees, and shipping costs if pre-arranged.',
      },
      {
        id: 'refunds',
        question: 'What is the refund policy?',
        answer: 'Refunds are available if the item is significantly not as described. Contact support within 7 days of receiving the item. Refunds are not available for buyer\'s remorse or minor discrepancies.',
      },
    ],
  },
  {
    category: 'Shipping & Pickup',
    questions: [
      {
        id: 'shipping',
        question: 'How does shipping work?',
        answer: 'Shipping is arranged between buyer and seller. Many listings offer local pickup. For shipped items, the seller will provide a quote or use our shipping partners. Large equipment often requires freight shipping.',
      },
      {
        id: 'pickup',
        question: 'Can I pick up items locally?',
        answer: 'Yes! Many sellers offer local pickup. The listing will indicate if pickup is available and the general location. After purchase, coordinate with the seller for pickup time and address.',
      },
      {
        id: 'international',
        question: 'Do you ship internationally?',
        answer: 'International shipping depends on the seller and item. Check the listing details or message the seller before bidding to confirm they can ship to your location and get a shipping estimate.',
      },
    ],
  },
  {
    category: 'Account',
    questions: [
      {
        id: 'verification',
        question: 'Why do I need to verify my phone?',
        answer: 'Phone verification helps prevent fraud and ensures we can reach you about important transaction updates. It\'s required before placing bids or making purchases.',
      },
      {
        id: 'notifications',
        question: 'How do I manage notifications?',
        answer: 'Go to Dashboard > Settings > Notifications to customize which emails you receive. You can opt in/out of bid alerts, marketing emails, and more.',
      },
      {
        id: 'reporting',
        question: 'How do I report a problem?',
        answer: 'If you encounter an issue with a listing, user, or transaction, contact our support team via the Contact Us page. Provide as much detail as possible including listing IDs and screenshots if relevant.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = searchQuery
    ? faqs.map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-stone-600 mb-8">Find answers to common questions about PrintMailBids.</p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-5 w-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredFaqs.map((category) => (
            <div key={category.category}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4" id={category.category.toLowerCase()}>
                {category.category}
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 divide-y divide-stone-200">
                {category.questions.map((faq) => (
                  <div key={faq.id} id={faq.id}>
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                    >
                      <span className="font-medium text-slate-900">{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-stone-400 flex-shrink-0 transition-transform ${
                          openItems.includes(faq.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openItems.includes(faq.id) && (
                      <div className="px-6 pb-4">
                        <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <p className="text-stone-600 mb-3">Can&apos;t find what you&apos;re looking for?</p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
