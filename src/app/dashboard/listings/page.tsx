'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  Package
} from 'lucide-react';

type ListingStatus = 'active' | 'draft' | 'ended' | 'sold';

interface MockListing {
  id: string;
  title: string;
  status: ListingStatus;
  listingType: 'auction' | 'fixed_price';
  currentBid: number | null;
  buyNowPrice: number | null;
  bidCount: number;
  viewCount: number;
  watchCount: number;
  endsAt: string | null;
  createdAt: string;
  image: string | null;
}

// Mock data for listings
const mockListings: MockListing[] = [
  {
    id: '1',
    title: '2019 Pitney Bowes DI950 6-Station Inserter',
    status: 'active',
    listingType: 'auction',
    currentBid: 12500,
    buyNowPrice: 18000,
    bidCount: 8,
    viewCount: 234,
    watchCount: 12,
    endsAt: '2024-02-15T18:00:00Z',
    createdAt: '2024-02-01T10:00:00Z',
    image: null,
  },
  {
    id: '2',
    title: 'Heidelberg SM52-2 Offset Press',
    status: 'active',
    listingType: 'auction',
    currentBid: 35000,
    buyNowPrice: null,
    bidCount: 15,
    viewCount: 456,
    watchCount: 28,
    endsAt: '2024-02-16T20:00:00Z',
    createdAt: '2024-02-02T14:00:00Z',
    image: null,
  },
  {
    id: '3',
    title: 'MBO T49 4/4 Folder',
    status: 'sold',
    listingType: 'auction',
    currentBid: 15750,
    buyNowPrice: null,
    bidCount: 22,
    viewCount: 312,
    watchCount: 8,
    endsAt: null,
    createdAt: '2024-01-20T09:00:00Z',
    image: null,
  },
  {
    id: '4',
    title: 'Bell & Howell Mailstar 400 Inserter',
    status: 'draft',
    listingType: 'auction',
    currentBid: null,
    buyNowPrice: 9500,
    bidCount: 0,
    viewCount: 0,
    watchCount: 0,
    endsAt: null,
    createdAt: '2024-02-10T11:00:00Z',
    image: null,
  },
  {
    id: '5',
    title: 'Challenge 305 MC Paper Cutter',
    status: 'ended',
    listingType: 'auction',
    currentBid: 4200,
    buyNowPrice: null,
    bidCount: 6,
    viewCount: 189,
    watchCount: 5,
    endsAt: null,
    createdAt: '2024-01-15T08:00:00Z',
    image: null,
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'green', icon: CheckCircle },
  draft: { label: 'Draft', color: 'gray', icon: Edit },
  ended: { label: 'Ended', color: 'yellow', icon: AlertCircle },
  sold: { label: 'Sold', color: 'blue', icon: CheckCircle },
};

export default function ListingsPage() {
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = mockListings.filter((listing) => {
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600">Manage your equipment listings</p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Listing
        </Link>
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
              <option value="ended">Ended</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {mockListings.filter(l => l.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">
            {mockListings.filter(l => l.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Sold</p>
          <p className="text-2xl font-bold text-blue-600">
            {mockListings.filter(l => l.status === 'sold').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-purple-600">
            {mockListings.reduce((acc, l) => acc + l.viewCount, 0).toLocaleString()}
          </p>
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
                const status = statusConfig[listing.status];
                return (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/listing/${listing.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-sm text-gray-500 capitalize">
                            {listing.listingType.replace('_', ' ')}
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
                      `}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {listing.currentBid ? (
                          <>
                            <p className="font-medium text-gray-900">
                              ${listing.currentBid.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{listing.bidCount} bids</p>
                          </>
                        ) : listing.buyNowPrice ? (
                          <>
                            <p className="font-medium text-gray-900">
                              ${listing.buyNowPrice.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Buy Now</p>
                          </>
                        ) : (
                          <p className="text-gray-500">—</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.viewCount}
                        </span>
                        <span>{listing.watchCount} watching</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {listing.status === 'active' && listing.endsAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">
                            {getTimeRemaining(listing.endsAt)}
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
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            const status = statusConfig[listing.status];
            return (
              <div key={listing.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/listing/${listing.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {listing.title}
                      </Link>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
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
                      `}>
                        {status.label}
                      </span>
                      {listing.status === 'active' && listing.endsAt && (
                        <span className="text-xs text-orange-600">
                          Ends in {getTimeRemaining(listing.endsAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {listing.currentBid ? (
                          <p className="font-medium text-gray-900">
                            ${listing.currentBid.toLocaleString()} ({listing.bidCount} bids)
                          </p>
                        ) : listing.buyNowPrice ? (
                          <p className="font-medium text-gray-900">
                            ${listing.buyNowPrice.toLocaleString()} (Buy Now)
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.viewCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredListings.length === 0 && (
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
