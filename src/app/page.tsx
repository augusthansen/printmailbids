import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Shield,
  DollarSign,
  Truck,
  Zap,
  Mail,
  Printer,
  BookOpen,
  Package,
  Forklift,
  Wrench,
  ChevronRight,
  LucideIcon,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { createClient } from '@/lib/supabase/server';
import {
  ManufacturerBanner,
  TrustBar,
  ComparisonTable,
  HowItWorks,
  EarlyAdopterCTA,
  FAQAccordion
} from '@/components/landing';

interface FeaturedListing {
  id: string;
  title: string;
  fixed_price: number | null;
  starting_price: number | null;
  current_price: number | null;
  listing_type: string;
  status: string;
  end_time: string | null;
  images: { url: string; is_primary: boolean }[];
}

interface Category {
  name: string;
  slug: string;
  icon: LucideIcon;
}

const categories: Category[] = [
  { name: 'Mailing & Fulfillment', slug: 'mailing-fulfillment', icon: Mail },
  { name: 'Printing', slug: 'printing', icon: Printer },
  { name: 'Bindery & Finishing', slug: 'bindery-finishing', icon: BookOpen },
  { name: 'Packaging', slug: 'packaging', icon: Package },
  { name: 'Material Handling', slug: 'material-handling', icon: Forklift },
  { name: 'Parts & Supplies', slug: 'parts-supplies', icon: Wrench },
];

const features = [
  {
    icon: DollarSign,
    title: 'Lower Fees',
    description: '8% buyer premium — lower than competitors charge. More value for everyone.'
  },
  {
    icon: Clock,
    title: 'Fair Auctions',
    description: '2-minute soft close prevents sniping. Everyone gets a fair shot.'
  },
  {
    icon: MessageSquare,
    title: 'Built-in Messaging',
    description: 'Communicate directly with buyers and sellers through our platform.'
  },
  {
    icon: Truck,
    title: 'Shipping & Tracking',
    description: 'Integrated shipping quotes, BOL uploads, and delivery tracking.'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Credit card, ACH, wire transfer with Stripe escrow protection.'
  },
  {
    icon: Zap,
    title: 'List Instantly',
    description: 'No waiting. List your equipment 24/7 and start receiving bids immediately.'
  },
];

const stats = [
  { value: '8%', label: 'Buyer Premium' },
  { value: '24/7', label: 'Instant Listing' },
  { value: '2min', label: 'Soft Close' },
  { value: '$0', label: 'Listing Fees' },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured listings (if any exist)
  const { data: featuredListings } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      fixed_price,
      starting_price,
      current_price,
      listing_type,
      status,
      end_time,
      images:listing_images(url, is_primary)
    `)
    .eq('is_featured', true)
    .eq('status', 'active')
    .order('featured_at', { ascending: false })
    .limit(10);

  const featured = (featuredListings || []) as FeaturedListing[];

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative bg-slate-900 text-white overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.3)_0%,_transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.2)_0%,_transparent_50%)]" />
          </div>
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left content */}
              <div className="animate-fade-up text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Now Open — Start Listing Today
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-4 sm:mb-6 tracking-tight">
                  Buy & Sell
                  <br />
                  <span className="gradient-text">Print & Mail</span>
                  <br />
                  <span className="text-slate-400">Equipment</span>
                </h1>

                <p className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  The modern marketplace for printing, mailing, and fulfillment equipment.
                  <span className="text-blue-400 font-semibold"> 8% buyer premium</span> — lower than others charge.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12 justify-center lg:justify-start">
                  <Link
                    href="/sell"
                    className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                  >
                    List Your Equipment
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 border border-white/10"
                  >
                    Create Free Account
                  </Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-white/10">
                  {stats.map((stat, i) => (
                    <div key={i} className="animate-fade-up" style={{ animationDelay: `${200 + i * 100}ms` }}>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Featured Equipment Carousel or placeholder */}
              <div className="animate-slide-in-right order-first lg:order-last">
                <FeaturedCarousel listings={featured} />
              </div>
            </div>
          </div>

          {/* Bottom wave/divider */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* Trust Bar */}
        <TrustBar />

        {/* Manufacturer Logo Banner */}
        <ManufacturerBanner />

        {/* Categories Section */}
        <section className="py-16 bg-stone-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Equipment Categories
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                List or find equipment across all major categories of print and mail machinery.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, i) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group relative p-6 bg-white rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 card-lift"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Icon container */}
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-stone-100 rounded-xl mb-4 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-50 transition-colors duration-300">
                    <category.icon className="h-7 w-7 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 text-sm lg:text-base">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    View all
                  </p>

                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-blue-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Features Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-stone-50 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - text */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                  Why PrintMailBids?
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  The marketplace that
                  <br />
                  <span className="text-blue-600">works for you</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  We built the platform that equipment buyers and sellers actually need.
                  Built-in messaging, shipping tracking, and secure payments —
                  all in one place.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors group"
                >
                  Create your free account
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Right side - feature grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                {features.map((feature, i) => (
                  <div
                    key={feature.title}
                    className="p-6 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 hover:bg-white transition-all duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
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
          </div>
        </section>

        {/* Early Adopter CTA */}
        <EarlyAdopterCTA />

        {/* FAQ */}
        <FAQAccordion />

        {/* Final CTA Section */}
        <section className="relative py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNHMxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />

          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to list your equipment?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join the modern marketplace for printing and mailing equipment.
              Lower fees, better tools, faster results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sell"
                className="group inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40"
              >
                Start Selling Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
