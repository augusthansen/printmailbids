'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string | null;
  listing_id: string;
  sale_amount: number;
  buyer_premium_percent: number;
  buyer_premium_amount: number;
  total_amount: number;
  seller_commission_percent: number;
  seller_commission_amount: number;
  seller_payout_amount: number;
  status: string;
  fulfillment_status: string;
  payment_due_date: string;
  paid_at: string | null;
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

interface RevenueStats {
  totalSales: number;
  totalRevenue: number;
  totalBuyerPremiums: number;
  totalSellerCommissions: number;
  platformEarnings: number;
  pendingRevenue: number;
  paidRevenue: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminSalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadSalesData();
  }, [currentPage, statusFilter]);

  async function loadSalesData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'sales',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count, stats: statsData } = await res.json();

      setInvoices(data || []);
      setTotalCount(count || 0);
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-900/50 text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
            <XCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400">
            Cancelled
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
          <h1 className="text-2xl font-bold text-white">Sales & Revenue</h1>
          <p className="text-slate-400 mt-1">Track all sales and platform earnings</p>
        </div>
      </div>

      {/* Revenue Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              {stats.totalSales} total sales
            </div>
          </div>

          {/* Platform Earnings */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Platform Earnings</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  ${stats.platformEarnings.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <p>Buyer premiums: ${stats.totalBuyerPremiums.toLocaleString()}</p>
              <p>Seller commissions: ${stats.totalSellerCommissions.toLocaleString()}</p>
            </div>
          </div>

          {/* Paid Revenue */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Collected</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  ${stats.paidRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Pending Revenue */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  ${stats.pendingRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSalesData()}
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
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={() => loadSalesData()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <DollarSign className="h-12 w-12 mb-4" />
            <p>No sales found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Buyer → Seller
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Sale Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Buyer Premium
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Seller Commission
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          #{invoice.invoice_number || invoice.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">
                          {invoice.listing?.title || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-300">
                        {invoice.buyer?.full_name || invoice.buyer?.email?.split('@')[0] || '?'}
                      </p>
                      <p className="text-xs text-slate-500">↓</p>
                      <p className="text-sm text-slate-300">
                        {invoice.seller?.full_name || invoice.seller?.email?.split('@')[0] || '?'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-white font-medium">
                      ${Number(invoice.sale_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm text-green-400">
                        +${Number(invoice.buyer_premium_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoice.buyer_premium_percent}%
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm text-green-400">
                        +${Number(invoice.seller_commission_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoice.seller_commission_percent}%
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-green-400">
                        ${(Number(invoice.buyer_premium_amount) + Number(invoice.seller_commission_amount)).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
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
