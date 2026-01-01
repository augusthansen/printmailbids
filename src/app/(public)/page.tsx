import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Shield,
  DollarSign,
  Truck,
  Zap,
  Users,
  Mail,
  Printer,
  BookOpen,
  Package,
  Forklift,
  Wrench,
  LucideIcon
} from 'lucide-react';

interface Category {
  name: string;
  slug: string;
  count: number;
  icon: LucideIcon;
}

const categories: Category[] = [
  {
    name: 'Mailing & Fulfillment',
    slug: 'mailing-fulfillment',
    count: 124,
    icon: Mail,
  },
  {
    name: 'Printing',
    slug: 'printing',
    count: 89,
    icon: Printer,
  },
  {
    name: 'Bindery & Finishing',
    slug: 'bindery-finishing',
    count: 67,
    icon: BookOpen,
  },
  {
    name: 'Packaging',
    slug: 'packaging',
    count: 45,
    icon: Package,
  },
  {
    name: 'Material Handling',
    slug: 'material-handling',
    count: 38,
    icon: Forklift,
  },
  {
    name: 'Parts & Supplies',
    slug: 'parts-supplies',
    count: 156,
    icon: Wrench,
  },
];

const features = [
  {
    icon: Zap,
    title: 'List Instantly',
    description: 'No waiting for scheduled auctions. List your equipment 24/7 and start selling immediately.'
  },
  {
    icon: Clock,
    title: 'Fair Auctions',
    description: '2-minute soft close prevents sniping and ensures fair bidding for all buyers.'
  },
  {
    icon: DollarSign,
    title: 'Lower Fees',
    description: '8% buyer premium — lower than other platforms charge. More value for everyone.'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Credit card, ACH, wire transfer, and escrow protection for large purchases.'
  },
  {
    icon: Truck,
    title: 'Logistics Support',
    description: 'Built-in shipping quotes and a network of rigging partners to move your equipment.'
  },
  {
    icon: Users,
    title: 'Industry Focused',
    description: 'Built specifically for printing, mailing, and industrial equipment professionals.'
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                The Modern Marketplace for{' '}
                <span className="text-blue-400">Industrial Equipment</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Buy and sell printing, mailing, and fulfillment equipment. 
                List today, sell tomorrow — no waiting for scheduled auctions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Browse Equipment
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/sell"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Start Selling
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-8 text-sm text-gray-400">
                <div>
                  <span className="text-2xl font-bold text-white">500+</span>
                  <p>Active Listings</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">8%</span>
                  <p>Buyer Premium</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">24/7</span>
                  <p>Instant Listing</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <div className="aspect-video bg-slate-700 rounded-lg mb-4 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop"
                    alt="Industrial Inserter Machine"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">2019 Pitney Bowes DI950</p>
                    <p className="text-sm text-gray-400">6-Station Inserter</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Current Bid</p>
                    <p className="text-xl font-bold text-green-400">$12,500</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the equipment you need from our curated categories of industrial machinery.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center group-hover:bg-blue-200">
                  <category.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">{category.count} listings</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why PrintMailBids?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We built the marketplace that equipment buyers and sellers actually need.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to buy or sell equipment?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of industry professionals already using PrintMailBids 
            to find the best deals on printing and mailing equipment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Create Free Account
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Listings Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recently Listed</h2>
            <Link
              href="/marketplace?sort=newest"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sample listing cards with images */}
            {[
              {
                id: 1,
                category: 'Mailing Equipment',
                title: 'Pitney Bowes DI950 Inserter',
                price: '$12,500',
                endsIn: '2d 5h',
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop'
              },
              {
                id: 2,
                category: 'Printing',
                title: 'Heidelberg SM 52-4',
                price: '$45,000',
                endsIn: '1d 12h',
                image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop'
              },
              {
                id: 3,
                category: 'Bindery',
                title: 'MBO K800.2 Folder',
                price: '$8,750',
                endsIn: '4d 8h',
                image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop'
              },
              {
                id: 4,
                category: 'Material Handling',
                title: 'Crown Electric Forklift',
                price: '$6,200',
                endsIn: '3d 2h',
                image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
              }
            ].map((item) => (
              <Link key={item.id} href="/marketplace" className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">{item.category}</p>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Current Bid</p>
                      <p className="font-bold text-gray-900">{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Ends in</p>
                      <p className="text-sm font-medium text-blue-600">{item.endsIn}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
