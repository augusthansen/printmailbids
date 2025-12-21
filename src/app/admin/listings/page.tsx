'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ExternalLink,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  starting_price: number | null;
  current_price: number | null;
  fixed_price: number | null;
  buy_now_price: number | null;
  bid_count: number;
  view_count: number;
  created_at: string;
  end_time: string | null;
  is_featured: boolean;
  seller: {
    email: string;
    full_name: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, [currentPage, statusFilter, typeFilter]);

  async function loadListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'listings',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: statusFilter,
        listingType: typeFilter,
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count } = await res.json();

      setListings(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateListingStatus(listingId: string, newStatus: string) {
    setActionLoading(listingId);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateListingStatus', listingId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');

      // Update local state
      setListings(listings.map(l =>
        l.id === listingId ? { ...l, status: newStatus } : l
      ));
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Failed to update listing status');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleFeatured(listingId: string, currentlyFeatured: boolean) {
    setActionLoading(listingId);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleFeatured', listingId, value: !currentlyFeatured }),
      });

      if (!res.ok) throw new Error('Failed to update');

      // Update local state
      setListings(listings.map(l =>
        l.id === listingId ? { ...l, is_featured: !currentlyFeatured } : l
      ));
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
            <Clock className="h-3 w-3" />
            Ended
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400">
            <DollarSign className="h-3 w-3" />
            Sold
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-900/50 text-yellow-400">
            Draft
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'auction':
        return <span className="text-xs text-cyan-400">Auction</span>;
      case 'auction_buy_now':
        return <span className="text-xs text-purple-400">Auction + Buy Now</span>;
      case 'fixed_price':
        return <span className="text-xs text-blue-400">Fixed Price</span>;
      case 'fixed_price_offers':
        return <span className="text-xs text-pink-400">Fixed + Offers</span>;
      default:
        return <span className="text-xs text-slate-400">{type}</span>;
    }
  }

  function getPrice(listing: Listing) {
    if (listing.current_price) {
      return `$${listing.current_price.toLocaleString()} (${listing.bid_count} bids)`;
    }
    if (listing.fixed_price) {
      return `$${listing.fixed_price.toLocaleString()}`;
    }
    if (listing.starting_price) {
      return `$${listing.starting_price.toLocaleString()} start`;
    }
    return '-';
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listings</h1>
          <p className="text-slate-400 mt-1">Manage all marketplace listings</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalCount} total listings</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadListings()}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
          <option value="sold">Sold</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Types</option>
          <option value="auction">Auction</option>
          <option value="auction_buy_now">Auction + Buy Now</option>
          <option value="fixed_price">Fixed Price</option>
          <option value="fixed_price_offers">Fixed + Offers</option>
        </select>

        <button
          onClick={() => loadListings()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Listings Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Package className="h-12 w-12 mb-4" />
            <p>No listings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Listing
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[250px]">
                          {listing.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-300">
                        {listing.seller?.full_name || listing.seller?.email || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(listing.listing_type)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {getPrice(listing)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                        disabled={actionLoading === listing.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          listing.is_featured
                            ? 'text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50'
                            : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-900/20'
                        }`}
                        title={listing.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <Star className={`h-4 w-4 ${listing.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {listing.view_count}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/listing/${listing.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                          title="View listing"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {listing.status === 'active' && (
                          <button
                            onClick={() => updateListingStatus(listing.id, 'cancelled')}
                            disabled={actionLoading === listing.id}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                            title="Cancel listing"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {listing.status === 'cancelled' && (
                          <button
                            onClick={() => updateListingStatus(listing.id, 'active')}
                            disabled={actionLoading === listing.id}
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-900/30 transition-colors"
                            title="Reactivate listing"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
