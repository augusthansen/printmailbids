'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  User,
  Shield,
  Star,
  MapPin,
  Calendar,
  Package,
  Loader2,
  Clock,
  Gavel,
  Tag,
  ArrowLeft,
} from 'lucide-react';

interface Seller {
  id: string;
  full_name: string | null;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  seller_rating: number;
  seller_review_count: number;
  created_at: string;
  city: string | null;
  state: string | null;
}

interface Listing {
  id: string;
  title: string;
  status: string;
  listing_type: string;
  starting_price: number | null;
  current_bid: number | null;
  fixed_price: number | null;
  buy_now_price: number | null;
  bid_count: number;
  end_time: string | null;
  images: { url: string; is_primary: boolean }[];
}

export default function SellerPage() {
  const params = useParams();
  const sellerId = params.id as string;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadSellerData() {
      setLoading(true);

      // Fetch seller profile
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, bio, avatar_url, is_verified, seller_rating, seller_review_count, created_at, city, state')
        .eq('id', sellerId)
        .single();

      if (sellerData) {
        setSeller(sellerData);
      }

      // Fetch seller's listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          status,
          listing_type,
          starting_price,
          current_bid,
          fixed_price,
          buy_now_price,
          bid_count,
          end_time,
          images:listing_images(url, is_primary)
        `)
        .eq('seller_id', sellerId)
        .in('status', ['active', 'sold', 'ended'])
        .order('created_at', { ascending: false });

      if (listingsData) {
        setListings(listingsData as unknown as Listing[]);
      }

      setLoading(false);
    }

    if (sellerId) {
      loadSellerData();
    }
  }, [sellerId, supabase]);

  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold' || l.status === 'ended');
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  const getListingPrice = (listing: Listing) => {
    if (listing.listing_type === 'auction' || listing.listing_type === 'auction_buy_now' || listing.listing_type === 'auction_offers') {
      return listing.current_bid || listing.starting_price || 0;
    }
    return listing.fixed_price || listing.buy_now_price || 0;
  };

  const getTimeRemaining = (endTime: string | null) => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getPrimaryImage = (listing: Listing) => {
    const primary = listing.images?.find(img => img.is_primary);
    return primary?.url || listing.images?.[0]?.url || null;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
          <User className="h-16 w-16 text-stone-300 mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Seller Not Found</h1>
          <p className="text-stone-600 mb-6">This seller profile doesn&apos;t exist or has been removed.</p>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const sellerName = seller.company_name || seller.full_name || 'Seller';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-stone-50">
        {/* Seller Header */}
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-stone-600 hover:text-blue-600 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar / Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                {seller.avatar_url ? (
                  <Image
                    src={seller.avatar_url}
                    alt={`${sellerName} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">{sellerName}</h1>
                  {seller.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <Shield className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-stone-900">{seller.seller_rating || 0}</span>
                    <span>({seller.seller_review_count || 0} reviews)</span>
                  </div>
                  {(seller.city || seller.state) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{[seller.city, seller.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(seller.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{activeListings.length} active listing{activeListings.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {seller.bio && (
                  <p className="mt-4 text-stone-600 max-w-2xl">{seller.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Active Listings ({activeListings.length})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sold'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Sold ({soldListings.length})
            </button>
          </div>

          {/* Listings Grid */}
          {displayedListings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-600">
                {activeTab === 'active'
                  ? 'No active listings at the moment.'
                  : 'No sold items yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedListings.map((listing) => {
                const imageUrl = getPrimaryImage(listing);
                const price = getListingPrice(listing);
                const timeLeft = listing.end_time ? getTimeRemaining(listing.end_time) : null;
                const isAuction = listing.listing_type === 'auction' || listing.listing_type === 'auction_buy_now' || listing.listing_type === 'auction_offers';

                return (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all group"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-12 w-12 text-stone-300" />
                        </div>
                      )}
                      {/* Status Badge */}
                      {listing.status === 'sold' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                          SOLD
                        </div>
                      )}
                      {listing.status === 'active' && isAuction && timeLeft && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-stone-900/80 text-white text-xs font-medium rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeLeft}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-stone-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-stone-900">
                            ${price.toLocaleString()}
                          </p>
                          {isAuction && listing.bid_count > 0 && (
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Gavel className="h-3 w-3" />
                              {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                          {isAuction ? (
                            <>
                              <Gavel className="h-3.5 w-3.5" />
                              Auction
                            </>
                          ) : (
                            <>
                              <Tag className="h-3.5 w-3.5" />
                              Buy Now
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
