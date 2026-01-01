import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SoldListing {
  id: string;
  title: string;
  sold_price: number;
  sold_at: string;
  images: { url: string; is_primary: boolean }[];
}

interface RecentlySoldProps {
  listings: SoldListing[];
}

export function RecentlySold({ listings }: RecentlySoldProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getPrimaryImage = (images: { url: string; is_primary: boolean }[]) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.url || images?.[0]?.url || null;
  };

  // If no sold listings, show placeholder
  if (!listings || listings.length === 0) {
    return (
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              Sold on PrintMailBids
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Recently Sold
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Equipment sells fast on PrintMailBids. Be the first to list and sell!
            </p>
          </div>

          {/* Placeholder cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 border-dashed"
              >
                <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-stone-300" />
                </div>
                <div className="p-5">
                  <p className="text-slate-400 text-sm italic">Your equipment here</p>
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-slate-400">Waiting for first sale...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/sell"
              className="group inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Be the first to sell
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            Sold on PrintMailBids
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Recently Sold
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Equipment sells fast on PrintMailBids. See what's been selling recently.
          </p>
        </div>

        {/* Sold listings grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.slice(0, 4).map((listing) => {
            const imageUrl = getPrimaryImage(listing.images);

            return (
              <div
                key={listing.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-stone-300" />
                    </div>
                  )}

                  {/* Sold badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Sold
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="flex justify-between items-end pt-4 border-t border-stone-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                        Sold for
                      </p>
                      <p className="text-xl font-bold text-emerald-600">
                        ${listing.sold_price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatTimeAgo(listing.sold_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/marketplace"
            className="group inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Browse current listings
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
