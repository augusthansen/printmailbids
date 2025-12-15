'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
type FulfillmentStatus = 'awaiting_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Sale {
  id: string;
  listing_id: string;
  buyer_id: string;
  sale_amount: number;
  buyer_premium_amount: number;
  total_amount: number;
  seller_payout_amount: number;
  status: InvoiceStatus;
  fulfillment_status: FulfillmentStatus;
  payment_method: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  delivered_at: string | null;
  created_at: string;
  listing?: {
    id: string;
    title: string;
  };
  buyer?: {
    full_name: string | null;
    company_name: string | null;
    email: string;
  };
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Payment Pending', color: 'yellow', icon: Clock },
  paid: { label: 'Paid', color: 'green', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'red', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'gray', icon: XCircle },
  refunded: { label: 'Refunded', color: 'purple', icon: XCircle },
};

const fulfillmentConfig: Record<FulfillmentStatus, { label: string; color: string }> = {
  awaiting_payment: { label: 'Awaiting Payment', color: 'yellow' },
  processing: { label: 'Processing', color: 'blue' },
  shipped: { label: 'Shipped', color: 'blue' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'gray' },
};

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadSales() {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch invoices where user is the seller
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            listing_id,
            buyer_id,
            sale_amount,
            buyer_premium_amount,
            total_amount,
            seller_payout_amount,
            status,
            fulfillment_status,
            payment_method,
            paid_at,
            shipped_at,
            tracking_number,
            delivered_at,
            created_at
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          throw invoicesError;
        }

        if (!invoicesData || invoicesData.length === 0) {
          setSales([]);
          setLoading(false);
          return;
        }

        // Fetch listing and buyer details separately
        const listingIds = [...new Set(invoicesData.map(inv => inv.listing_id))];
        const buyerIds = [...new Set(invoicesData.map(inv => inv.buyer_id))];

        const [listingsResult, buyersResult] = await Promise.all([
          supabase
            .from('listings')
            .select('id, title')
            .in('id', listingIds),
          supabase
            .from('profiles')
            .select('id, full_name, company_name, email')
            .in('id', buyerIds),
        ]);

        // Create lookup maps
        const listingsMap = new Map(
          (listingsResult.data || []).map(l => [l.id, l])
        );
        const buyersMap = new Map(
          (buyersResult.data || []).map(b => [b.id, b])
        );

        // Merge data
        const salesWithDetails: Sale[] = invoicesData.map(invoice => ({
          ...invoice,
          listing: listingsMap.get(invoice.listing_id) || { id: invoice.listing_id, title: 'Unknown Listing' },
          buyer: buyersMap.get(invoice.buyer_id) || { full_name: null, company_name: null, email: 'Unknown' },
        }));

        setSales(salesWithDetails);
      } catch (err) {
        console.error('Error loading sales:', err);
        setError('Failed to load sales data');
      } finally {
        setLoading(false);
      }
    }

    loadSales();
  }, [user?.id, supabase]);

  const filteredSales = sales.filter((sale) => {
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (sale.listing?.title || '').toLowerCase().includes(searchLower) ||
      sale.id.toLowerCase().includes(searchLower) ||
      (sale.buyer?.full_name || '').toLowerCase().includes(searchLower) ||
      (sale.buyer?.company_name || '').toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = sales
    .filter(s => s.status !== 'cancelled' && s.status !== 'refunded')
    .reduce((acc, s) => acc + (s.seller_payout_amount || 0), 0);

  const pendingPayments = sales
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + (s.seller_payout_amount || 0), 0);

  const readyToShip = sales.filter(s =>
    s.status === 'paid' &&
    (s.fulfillment_status === 'awaiting_payment' || s.fulfillment_status === 'processing')
  ).length;

  const completedSales = sales.filter(s => s.fulfillment_status === 'delivered').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track your sales and payouts</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(pendingPayments)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready to Ship</p>
              <p className="text-xl font-bold text-gray-900">{readyToShip}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Sales</p>
              <p className="text-xl font-bold text-gray-900">{completedSales}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice, item, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice / Item
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Payout
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fulfillment
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => {
                const status = statusConfig[sale.status] || statusConfig.pending;
                const fulfillment = fulfillmentConfig[sale.fulfillment_status] || fulfillmentConfig.awaiting_payment;
                const StatusIcon = status.icon;
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 font-mono text-sm">
                          #{sale.id.slice(0, 8)}
                        </p>
                        <Link
                          href={`/listing/${sale.listing_id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 truncate block max-w-xs"
                        >
                          {sale.listing?.title || 'Unknown Listing'}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(sale.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.buyer?.full_name || sale.buyer?.email || 'Unknown'}
                        </p>
                        {sale.buyer?.company_name && (
                          <p className="text-sm text-gray-500">{sale.buyer.company_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(sale.total_amount)}</p>
                        <p className="text-xs text-gray-500">
                          Sale: {formatCurrency(sale.sale_amount)} + Premium: {formatCurrency(sale.buyer_premium_amount)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-green-600">{formatCurrency(sale.seller_payout_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${fulfillment.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${fulfillment.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${fulfillment.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${fulfillment.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${fulfillment.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {fulfillment.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/invoices/${sale.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredSales.map((sale) => {
            const status = statusConfig[sale.status] || statusConfig.pending;
            const fulfillment = fulfillmentConfig[sale.fulfillment_status] || fulfillmentConfig.awaiting_payment;
            const StatusIcon = status.icon;
            return (
              <div key={sale.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 font-mono text-sm">#{sale.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
                  </div>
                  <span className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                    ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                    ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                    ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                    ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
                <Link
                  href={`/listing/${sale.listing_id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium block mb-2"
                >
                  {sale.listing?.title || 'Unknown Listing'}
                </Link>
                <p className="text-sm text-gray-600 mb-3">
                  Buyer: {sale.buyer?.full_name || sale.buyer?.email || 'Unknown'}
                  {sale.buyer?.company_name && ` (${sale.buyer.company_name})`}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Your Payout</p>
                    <p className="font-bold text-green-600">{formatCurrency(sale.seller_payout_amount)}</p>
                  </div>
                  <Link
                    href={`/dashboard/invoices/${sale.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSales.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {sales.length === 0
                ? "You haven't made any sales yet"
                : 'No sales match your filters'}
            </p>
            {sales.length === 0 && (
              <Link
                href="/dashboard/listings"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Create a listing to start selling
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
