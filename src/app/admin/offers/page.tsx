'use client';

import { useEffect, useState } from 'react';
import {
  HandCoins,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Offer {
  id: string;
  listing_id: string;
  amount: number;
  message: string | null;
  status: string;
  counter_count: number;
  parent_offer_id: string | null;
  expires_at: string;
  created_at: string;
  listing: {
    title: string;
  } | null;
  buyer: {
    email: string;
    full_name: string | null;
  } | null;
  seller: {
    email: string;
    full_name: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadOffers();
  }, [currentPage, statusFilter]);

  async function loadOffers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'offers',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count } = await res.json();

      setOffers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(offer: Offer) {
    const isCounter = offer.parent_offer_id !== null;

    switch (offer.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-900/50 text-yellow-400">
            <Clock className="h-3 w-3" />
            {isCounter ? 'Counter Pending' : 'Pending'}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      case 'countered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400">
            <ArrowRightLeft className="h-3 w-3" />
            Countered
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400">
            <Clock className="h-3 w-3" />
            Expired
          </span>
        );
      case 'withdrawn':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
            {offer.status}
          </span>
        );
    }
  }

  function getOfferType(offer: Offer) {
    if (!offer.parent_offer_id) {
      return (
        <span className="text-xs text-slate-400">Original</span>
      );
    }
    const madeBy = offer.counter_count % 2 === 0 ? 'Buyer' : 'Seller';
    return (
      <span className="text-xs text-purple-400">
        Counter #{offer.counter_count} ({madeBy})
      </span>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-slate-400 mt-1">Monitor all offers and counter-offers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalCount} total offers</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="countered">Countered</option>
          <option value="expired">Expired</option>
          <option value="withdrawn">Withdrawn</option>
        </select>

        <button
          onClick={() => loadOffers()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <HandCoins className="h-12 w-12 mb-4" />
            <p>No offers found</p>
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
                    Buyer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white truncate max-w-[150px]">
                        {offer.listing?.title || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-300">
                        {offer.buyer?.full_name || offer.buyer?.email?.split('@')[0] || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-300">
                        {offer.seller?.full_name || offer.seller?.email?.split('@')[0] || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-white">
                      ${Number(offer.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      {getOfferType(offer)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(offer)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {offer.status === 'pending' ? (
                        new Date(offer.expires_at) < new Date() ? (
                          <span className="text-red-400">Expired</span>
                        ) : (
                          new Date(offer.expires_at).toLocaleDateString()
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/listing/${offer.listing_id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                          title="View listing"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
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
