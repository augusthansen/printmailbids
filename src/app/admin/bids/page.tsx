'use client';

import { useEffect, useState } from 'react';
import {
  Gavel,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Bid {
  id: string;
  listing_id: string;
  amount: number;
  max_bid: number;
  status: string;
  is_auto_bid: boolean;
  created_at: string;
  listing: {
    title: string;
    status: string;
  } | null;
  bidder: {
    email: string;
    full_name: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadBids();
  }, [currentPage, statusFilter]);

  async function loadBids() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'bids',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count } = await res.json();

      setBids(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'winning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
            <Trophy className="h-3 w-3" />
            Winning
          </span>
        );
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400">
            <Trophy className="h-3 w-3" />
            Won
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-900/50 text-cyan-400">
            <Clock className="h-3 w-3" />
            Active
          </span>
        );
      case 'outbid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-900/50 text-yellow-400">
            Outbid
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
            <XCircle className="h-3 w-3" />
            Lost
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bids</h1>
          <p className="text-slate-400 mt-1">Monitor all auction bids</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalCount} total bids</span>
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
          <option value="winning">Winning</option>
          <option value="won">Won</option>
          <option value="active">Active</option>
          <option value="outbid">Outbid</option>
          <option value="lost">Lost</option>
        </select>

        <button
          onClick={() => loadBids()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Bids Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Gavel className="h-12 w-12 mb-4" />
            <p>No bids found</p>
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
                    Bidder
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Bid Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Max Bid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white truncate max-w-[200px]">
                        {bid.listing?.title || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {bid.listing?.status || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-300">
                        {bid.bidder?.full_name || bid.bidder?.email || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-white">
                      ${Number(bid.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-400">
                      ${Number(bid.max_bid).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      {bid.is_auto_bid ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-900/50 text-purple-400">
                          Auto
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(bid.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {new Date(bid.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/listing/${bid.listing_id}`}
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
