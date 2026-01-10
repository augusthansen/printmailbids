'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Heart, Clock, MapPin, Eye, X } from 'lucide-react';

interface WatchlistItem {
  listing_id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    current_bid: number;
    starting_price: number;
    fixed_price: number;
    listing_type: string;
    status: string;
    end_time: string;
    view_count: number;
    bid_count: number;
  };
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlist() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('watchlist')
        .select(`
          listing_id,
          created_at,
          listing:listings (
            id,
            title,
            make,
            model,
            year,
            current_bid,
            starting_price,
            fixed_price,
            listing_type,
            status,
            end_time,
            view_count,
            bid_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setWatchlist(data as unknown as WatchlistItem[]);
      }
      setLoading(false);
    }

    loadWatchlist();
  }, [user?.id, authLoading, supabase]);

  const removeFromWatchlist = async (listingId: string) => {
    if (!user?.id) return;

    await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    setWatchlist(watchlist.filter(item => item.listing_id !== listingId));
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
          <p className="text-gray-600 mt-1">
            {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <Link
          href="/marketplace"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Marketplace
        </Link>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your watchlist is empty</h3>
          <p className="text-gray-500 mb-6">
            Save listings you&apos;re interested in to keep track of them here
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <div
              key={item.listing_id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group"
            >
              {/* Image placeholder */}
              <div className="relative aspect-[4/3] bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
                <button
                  onClick={() => removeFromWatchlist(item.listing_id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {item.listing.status === 'active' && item.listing.end_time && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-sm rounded">
                    <Clock className="h-3.5 w-3.5" />
                    {getTimeRemaining(item.listing.end_time)}
                  </div>
                )}
              </div>

              <Link href={`/listing/${item.listing_id}`} className="block p-4">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.listing.title}
                </h3>
                {item.listing.make && item.listing.model && (
                  <p className="text-sm text-gray-500 mb-3">
                    {item.listing.year} {item.listing.make} {item.listing.model}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    {item.listing.listing_type === 'auction' || item.listing.listing_type === 'auction_buy_now' ? (
                      <>
                        <p className="text-lg font-bold text-gray-900">
                          ${(item.listing.current_bid || item.listing.starting_price || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.listing.bid_count || 0} bids
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        ${(item.listing.fixed_price || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Eye className="h-4 w-4" />
                    {item.listing.view_count || 0}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
