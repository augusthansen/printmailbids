'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ListingStatus = 'active' | 'draft' | 'pending' | 'ended' | 'sold' | 'cancelled';

interface Listing {
  id: string;
  title: string;
  status: ListingStatus;
  listing_type: string;
  current_price: number | null;
  starting_price: number | null;
  buy_now_price: number | null;
  fixed_price: number | null;
  bid_count: number;
  view_count: number;
  watch_count: number;
  end_time: string | null;
  created_at: string;
  images?: {
    url: string;
    is_primary: boolean;
  }[];
}

const statusConfig: Record<ListingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'green', icon: CheckCircle },
  draft: { label: 'Draft', color: 'gray', icon: Edit },
  pending: { label: 'Pending', color: 'yellow', icon: AlertCircle },
  ended: { label: 'Ended', color: 'yellow', icon: AlertCircle },
  sold: { label: 'Sold', color: 'blue', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
};

export default function ListingsPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadListings = async () => {
    if (!user?.id) return;

    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        status,
        listing_type,
        current_price,
        starting_price,
        buy_now_price,
        fixed_price,
        bid_count,
        view_count,
        watch_count,
        end_time,
        created_at,
        images:listing_images(url, is_primary)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading listings:', error);
    } else {
      setListings((data as unknown as Listing[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadListings();
  }, [user?.id, statusFilter]);

  const filteredListings = listings.filter((listing) => {
    if (!searchQuery) return true;
    return listing.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = async (listingId: string) => {
    setDeletingId(listingId);

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('seller_id', user?.id);

    if (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    } else {
      setListings(prev => prev.filter(l => l.id !== listingId));
    }

    setDeletingId(null);
    setShowDeleteConfirm(null);
  };

  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getPrimaryImage = (listing: Listing) => {
    if (!listing.images || listing.images.length === 0) return null;
    const primary = listing.images.find(img => img.is_primary);
    return primary?.url || listing.images[0]?.url;
  };

  const getPrice = (listing: Listing) => {
    if (listing.listing_type?.includes('fixed')) {
      return listing.fixed_price || listing.buy_now_price || 0;
    }
    return listing.current_price || listing.starting_price || 0;
  };

  const stats = {
    active: listings.filter(l => l.status === 'active').length,
    draft: listings.filter(l => l.status === 'draft').length,
    sold: listings.filter(l => l.status === 'sold').length,
    totalViews: listings.reduce((acc, l) => acc + (l.view_count || 0), 0),
  };

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600">Manage your equipment listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadListings}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ListingStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="ended">Ended</option>
              <option value="sold">Sold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Sold</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Listings table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price / Bid
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredListings.map((listing) => {
                const status = statusConfig[listing.status] || statusConfig.draft;
                const image = getPrimaryImage(listing);
                return (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {image ? (
                            <img src={image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/listing/${listing.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-sm text-gray-500 capitalize">
                            {listing.listing_type?.replace(/_/g, ' ') || 'Auction'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          ${getPrice(listing).toLocaleString()}
                        </p>
                        {listing.listing_type?.includes('auction') && (
                          <p className="text-sm text-gray-500">{listing.bid_count || 0} bids</p>
                        )}
                        {listing.buy_now_price && listing.listing_type === 'auction_buy_now' && (
                          <p className="text-xs text-green-600">
                            Buy Now: ${listing.buy_now_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.view_count || 0}
                        </span>
                        <span>{listing.watch_count || 0} watching</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {listing.status === 'active' && listing.end_time ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">
                            {getTimeRemaining(listing.end_time)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/sell/edit/${listing.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {showDeleteConfirm === listing.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deletingId === listing.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingId === listing.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(listing.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredListings.map((listing) => {
            const status = statusConfig[listing.status] || statusConfig.draft;
            const image = getPrimaryImage(listing);
            return (
              <div key={listing.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/listing/${listing.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {listing.title}
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(showDeleteConfirm === listing.id ? null : listing.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {status.label}
                      </span>
                      {listing.status === 'active' && listing.end_time && (
                        <span className="text-xs text-orange-600">
                          Ends in {getTimeRemaining(listing.end_time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-medium text-gray-900">
                        ${getPrice(listing).toLocaleString()}
                        {listing.listing_type?.includes('auction') && (
                          <span className="text-sm text-gray-500 font-normal ml-1">
                            ({listing.bid_count || 0} bids)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.view_count || 0}
                        </span>
                      </div>
                    </div>
                    {showDeleteConfirm === listing.id && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="flex-1 text-center py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          View
                        </Link>
                        <Link
                          href={`/sell/edit/${listing.id}`}
                          className="flex-1 text-center py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="flex-1 text-center py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredListings.length === 0 && !loading && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No listings found</p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              <Plus className="h-4 w-4" />
              Create your first listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
