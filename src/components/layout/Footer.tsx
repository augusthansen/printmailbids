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
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">PrintMail</span>
                <span className="text-xl font-bold text-blue-400">Bids</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              The modern marketplace for printing, mailing, and industrial equipment.
            </p>
            <p className="text-sm font-semibold text-white">
              List Today. Sell Tomorrow.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-white font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Selling */}
          <div>
            <h3 className="text-white font-semibold mb-4">Selling</h3>
            <ul className="space-y-2">
              {footerLinks.selling.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">Need help?</p>
              <a href="tel:1-888-555-0123" className="text-white font-semibold">
                1-888-555-0123
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} PrintMailBids. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
