import Link from 'next/link';

const footerLinks = {
  marketplace: [
    { name: 'Browse All Equipment', href: '/marketplace' },
    { name: 'Current Auctions', href: '/auctions' },
    { name: 'Ending Soon', href: '/auctions?sort=ending' },
    { name: 'New Listings', href: '/marketplace?sort=newest' },
  ],
  categories: [
    { name: 'Mailing & Fulfillment', href: '/category/mailing-fulfillment' },
    { name: 'Printing', href: '/category/printing' },
    { name: 'Bindery & Finishing', href: '/category/bindery-finishing' },
    { name: 'Material Handling', href: '/category/material-handling' },
  ],
  selling: [
    { name: 'Start Selling', href: '/sell' },
    { name: 'Seller Dashboard', href: '/dashboard/sales' },
    { name: 'Pricing & Fees', href: '/fees' },
    { name: 'Seller Guide', href: '/help/selling' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Shipping Partners', href: '/partners' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-stone-400 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">PrintMail</span>
                <span className="text-xl font-bold text-blue-400">Bids</span>
              </div>
            </Link>
            <p className="text-sm text-stone-400 mb-5 leading-relaxed">
              The modern marketplace for printing, mailing, and industrial equipment.
            </p>
            <p className="text-sm font-semibold text-white">
              <span className="text-blue-400">List Today.</span> Sell Tomorrow.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Marketplace</h3>
            <ul className="space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Categories</h3>
            <ul className="space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Selling */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Selling</h3>
            <ul className="space-y-3">
              {footerLinks.selling.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-slate-700/50">
              <p className="text-sm text-stone-500 mb-1">Need help?</p>
              <a href="tel:1-888-555-0123" className="text-white font-semibold hover:text-blue-400 transition-colors">
                1-888-555-0123
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-stone-500 text-center md:text-left">
            <p>© {new Date().getFullYear()} PrintMailBids. All rights reserved.</p>
            <p className="mt-1">Operated by Megabox Supply LLC</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-stone-400 hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-stone-400 hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
