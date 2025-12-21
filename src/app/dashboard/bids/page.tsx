'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Gavel,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Bid {
  id: string;
  listing_id: string;
  amount: number;
  max_bid: number;
  status: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    current_price: number;
    end_time: string;
    status: string;
    listing_type: string;
    images: {
      url: string;
      is_primary: boolean;
    }[];
  };
}

type FilterType = 'all' | 'winning' | 'outbid' | 'won' | 'lost';

export default function MyBidsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (authLoading) return;
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadBids() {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          listing:listings(
            id,
            title,
            current_price,
            end_time,
            status,
            listing_type,
            images:listing_images(url, is_primary)
          )
        `)
        .eq('bidder_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bids:', error);
      } else {
        // Process bids to determine their current status
        const processedBids = (data || []).map((bid: Bid) => {
          const listing = bid.listing;
          if (!listing) return bid;

          const isEnded = listing.status === 'ended' || listing.status === 'sold' ||
            (listing.end_time && new Date(listing.end_time) < new Date());
          const isHighBid = listing.current_price === bid.amount;

          let status = bid.status;
          if (isEnded) {
            status = isHighBid ? 'won' : 'lost';
          } else {
            status = isHighBid ? 'winning' : 'outbid';
          }

          return { ...bid, status };
        });

        setBids(processedBids);
      }
      setLoading(false);
    }

    loadBids();
  }, [user?.id, authLoading, supabase]);

  const getTimeRemaining = (endTime: string | null) => {
    if (!endTime) return { text: 'No end time', urgent: false, ended: false };
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { text: 'Ended', urgent: false, ended: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const urgent = diff < 24 * 60 * 60 * 1000;
    if (days > 0) return { text: `${days}d ${hours}h`, urgent, ended: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, urgent, ended: false };
    return { text: `${minutes}m`, urgent: true, ended: false };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'winning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <TrendingUp className="h-3 w-3" />
            Winning
          </span>
        );
      case 'outbid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <AlertCircle className="h-3 w-3" />
            Outbid
          </span>
        );
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <CheckCircle className="h-3 w-3" />
            Won
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            <XCircle className="h-3 w-3" />
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  // Calculate stats
  const stats = {
    total: bids.length,
    winning: bids.filter(b => b.status === 'winning').length,
    outbid: bids.filter(b => b.status === 'outbid').length,
    won: bids.filter(b => b.status === 'won').length,
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Gavel className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your bids</h2>
        <p className="text-gray-500 mb-4">Track your bidding activity and auction status</p>
        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
          <p className="text-gray-500">Track your bidding activity</p>
        </div>
        <Link
          href="/marketplace"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Listings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Bids</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Winning</p>
          <p className="text-2xl font-bold text-green-600">{stats.winning}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Outbid</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.outbid}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Won</p>
          <p className="text-2xl font-bold text-blue-600">{stats.won}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'winning', 'outbid', 'won', 'lost'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Gavel className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No bids yet' : `No ${filter} bids`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? 'Start bidding on items in the marketplace'
              : 'Try a different filter to see more bids'}
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Eye className="h-4 w-4" />
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="divide-y">
            {filteredBids.map(bid => {
              const listing = bid.listing;
              const timeRemaining = listing?.end_time ? getTimeRemaining(listing.end_time) : null;
              const primaryImage = listing?.images?.find(img => img.is_primary)?.url ||
                listing?.images?.[0]?.url;

              return (
                <div key={bid.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <Link href={`/listing/${listing?.id}`} className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing?.title || 'Listing'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/listing/${listing?.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                          >
                            {listing?.title || 'Unknown Listing'}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>Your bid: <span className="font-medium text-gray-900">${bid.amount.toLocaleString()}</span></span>
                            {listing?.current_price && listing.current_price !== bid.amount && (
                              <span>Current: <span className="font-medium text-gray-900">${listing.current_price.toLocaleString()}</span></span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(bid.status)}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {timeRemaining && (
                          <span className={`flex items-center gap-1 ${
                            timeRemaining.ended ? 'text-gray-500' :
                            timeRemaining.urgent ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            <Clock className="h-4 w-4" />
                            {timeRemaining.text}
                          </span>
                        )}
                        <span className="text-gray-400">
                          Bid placed: {new Date(bid.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex gap-2 mt-3">
                        {bid.status === 'outbid' && !timeRemaining?.ended && (
                          <Link
                            href={`/listing/${listing?.id}`}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Bid Again
                          </Link>
                        )}
                        {bid.status === 'won' && (
                          <button
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Complete Purchase
                          </button>
                        )}
                        <Link
                          href={`/listing/${listing?.id}`}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
