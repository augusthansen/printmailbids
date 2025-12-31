'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  AlertCircle,
  Send,
  FileText,
  Settings
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
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentStatus | 'needs_shipping' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Type for active pipeline filter
  type PipelineFilter = 'awaiting_payment' | 'ready_to_ship' | 'in_transit' | 'delivered' | null;
  const [activePipeline, setActivePipeline] = useState<PipelineFilter>(null);

  // Check for filter param on mount
  useEffect(() => {
    const filter = searchParams.get('filter');
    const pipeline = searchParams.get('pipeline');

    if (filter === 'needs_shipping') {
      setFulfillmentFilter('needs_shipping');
      setActivePipeline('ready_to_ship');
    } else if (pipeline === 'awaiting_payment') {
      setStatusFilter('pending');
      setFulfillmentFilter('all');
      setActivePipeline('awaiting_payment');
    } else if (pipeline === 'in_transit') {
      setFulfillmentFilter('shipped');
      setActivePipeline('in_transit');
    } else if (pipeline === 'delivered') {
      setFulfillmentFilter('delivered');
      setActivePipeline('delivered');
    }
  }, [searchParams]);

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

        // Fetch listing and buyer details separately - use individual queries to avoid .in() issues
        const listingIds = [...new Set(invoicesData.map((inv: { listing_id: string }) => inv.listing_id).filter(Boolean))];
        const buyerIds = [...new Set(invoicesData.map((inv: { buyer_id: string }) => inv.buyer_id).filter(Boolean))];

        let listingsData: { id: string; title: string }[] = [];
        let buyersData: { id: string; full_name: string | null; company_name: string | null; email: string | null }[] = [];

        if (listingIds.length > 0) {
          const listingsPromises = listingIds.map(id =>
            supabase.from('listings').select('id, title').eq('id', id).single()
          );
          const results = await Promise.all(listingsPromises);
          listingsData = results
            .filter(r => r.data && !r.error)
            .map(r => r.data as { id: string; title: string });
        }

        if (buyerIds.length > 0) {
          const buyersPromises = buyerIds.map(id =>
            supabase.from('profiles').select('id, full_name, company_name, email').eq('id', id).single()
          );
          const results = await Promise.all(buyersPromises);
          buyersData = results
            .filter(r => r.data && !r.error)
            .map(r => r.data as { id: string; full_name: string | null; company_name: string | null; email: string | null });
        }

        // Create lookup maps
        const listingsMap = new Map(listingsData.map(l => [l.id, l]));
        const buyersMap = new Map(buyersData.map(b => [b.id, b]));

        // Merge data
        const salesWithDetails: Sale[] = invoicesData.map((invoice: { listing_id: string; buyer_id: string }) => ({
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

    // Fulfillment filter logic
    let matchesFulfillment = true;
    if (fulfillmentFilter === 'needs_shipping') {
      // Needs shipping = paid but not yet shipped
      matchesFulfillment = sale.status === 'paid' &&
        (sale.fulfillment_status === 'processing' || sale.fulfillment_status === 'awaiting_payment');
    } else if (fulfillmentFilter !== 'all') {
      matchesFulfillment = sale.fulfillment_status === fulfillmentFilter;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (sale.listing?.title || '').toLowerCase().includes(searchLower) ||
      sale.id.toLowerCase().includes(searchLower) ||
      (sale.buyer?.full_name || '').toLowerCase().includes(searchLower) ||
      (sale.buyer?.company_name || '').toLowerCase().includes(searchLower);
    return matchesStatus && matchesFulfillment && matchesSearch;
  });

  const totalRevenue = sales
    .filter(s => s.status !== 'cancelled' && s.status !== 'refunded')
    .reduce((acc, s) => acc + (s.seller_payout_amount || 0), 0);

  // Pipeline stage counts
  const awaitingPaymentCount = sales.filter(s => s.status === 'pending').length;

  const readyToShipCount = sales.filter(s =>
    s.status === 'paid' &&
    (s.fulfillment_status === 'awaiting_payment' || s.fulfillment_status === 'processing')
  ).length;

  const inTransitCount = sales.filter(s => s.fulfillment_status === 'shipped').length;

  const deliveredCount = sales.filter(s => s.fulfillment_status === 'delivered').length;

  // Handle pipeline card click
  const handlePipelineClick = (filter: PipelineFilter) => {
    if (activePipeline === filter) {
      // Clear filter if clicking same card
      setActivePipeline(null);
      setFulfillmentFilter('all');
      setStatusFilter('all');
    } else {
      setActivePipeline(filter);
      // Set appropriate filters based on pipeline stage
      if (filter === 'awaiting_payment') {
        setStatusFilter('pending');
        setFulfillmentFilter('all');
      } else if (filter === 'ready_to_ship') {
        setFulfillmentFilter('needs_shipping');
        setStatusFilter('all');
      } else if (filter === 'in_transit') {
        setFulfillmentFilter('shipped');
        setStatusFilter('all');
      } else if (filter === 'delivered') {
        setFulfillmentFilter('delivered');
        setStatusFilter('all');
      }
    }
  };

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

      {/* Total Revenue */}
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

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handlePipelineClick('awaiting_payment')}
          className={`text-left rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
            activePipeline === 'awaiting_payment'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-100 bg-white hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activePipeline === 'awaiting_payment' ? 'bg-yellow-200' : 'bg-yellow-100'
            }`}>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Awaiting Payment</p>
              <p className="text-2xl font-bold text-gray-900">{awaitingPaymentCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handlePipelineClick('ready_to_ship')}
          className={`text-left rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
            activePipeline === 'ready_to_ship'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-100 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activePipeline === 'ready_to_ship' ? 'bg-blue-200' : 'bg-blue-100'
            }`}>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready to Ship</p>
              <p className="text-2xl font-bold text-gray-900">{readyToShipCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handlePipelineClick('in_transit')}
          className={`text-left rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
            activePipeline === 'in_transit'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-100 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activePipeline === 'in_transit' ? 'bg-purple-200' : 'bg-purple-100'
            }`}>
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">{inTransitCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handlePipelineClick('delivered')}
          className={`text-left rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
            activePipeline === 'delivered'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-100 bg-white hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activePipeline === 'delivered' ? 'bg-green-200' : 'bg-green-100'
            }`}>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{deliveredCount}</p>
            </div>
          </div>
        </button>
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
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value as FulfillmentStatus | 'needs_shipping' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Fulfillment</option>
              <option value="needs_shipping">Needs Shipping</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter active banner */}
      {activePipeline && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          activePipeline === 'awaiting_payment' ? 'bg-yellow-50 border border-yellow-200' :
          activePipeline === 'ready_to_ship' ? 'bg-blue-50 border border-blue-200' :
          activePipeline === 'in_transit' ? 'bg-purple-50 border border-purple-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            {activePipeline === 'awaiting_payment' && <Clock className="h-5 w-5 text-yellow-600" />}
            {activePipeline === 'ready_to_ship' && <Package className="h-5 w-5 text-blue-600" />}
            {activePipeline === 'in_transit' && <Truck className="h-5 w-5 text-purple-600" />}
            {activePipeline === 'delivered' && <CheckCircle className="h-5 w-5 text-green-600" />}
            <div>
              <p className={`font-medium ${
                activePipeline === 'awaiting_payment' ? 'text-yellow-900' :
                activePipeline === 'ready_to_ship' ? 'text-blue-900' :
                activePipeline === 'in_transit' ? 'text-purple-900' :
                'text-green-900'
              }`}>
                {activePipeline === 'awaiting_payment' && 'Showing items awaiting payment'}
                {activePipeline === 'ready_to_ship' && 'Showing items ready to ship'}
                {activePipeline === 'in_transit' && 'Showing items in transit'}
                {activePipeline === 'delivered' && 'Showing delivered items'}
              </p>
              <p className={`text-sm ${
                activePipeline === 'awaiting_payment' ? 'text-yellow-700' :
                activePipeline === 'ready_to_ship' ? 'text-blue-700' :
                activePipeline === 'in_transit' ? 'text-purple-700' :
                'text-green-700'
              }`}>
                {activePipeline === 'awaiting_payment' && 'Invoices pending buyer payment'}
                {activePipeline === 'ready_to_ship' && 'Paid items awaiting freight shipping details'}
                {activePipeline === 'in_transit' && 'Items shipped and on the way to buyers'}
                {activePipeline === 'delivered' && 'Completed transactions'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handlePipelineClick(null)}
            className={`text-sm font-medium ${
              activePipeline === 'awaiting_payment' ? 'text-yellow-600 hover:text-yellow-800' :
              activePipeline === 'ready_to_ship' ? 'text-blue-600 hover:text-blue-800' :
              activePipeline === 'in_transit' ? 'text-purple-600 hover:text-purple-800' :
              'text-green-600 hover:text-green-800'
            }`}
          >
            Clear filter
          </button>
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-2">
                        {/* Show Ship button for items that need shipping */}
                        {sale.status === 'paid' &&
                         (sale.fulfillment_status === 'processing' || sale.fulfillment_status === 'awaiting_payment') && (
                          <Link
                            href={`/dashboard/invoices/${sale.id}?action=ship`}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4" />
                            Ship
                          </Link>
                        )}
                        {/* Show Manage Shipping button for in-transit items */}
                        {sale.fulfillment_status === 'shipped' && (
                          <Link
                            href={`/dashboard/invoices/${sale.id}#shipping-details`}
                            className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-purple-700"
                          >
                            <Settings className="h-4 w-4" />
                            Manage
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/invoices/${sale.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </div>
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
                  <div className="flex items-center gap-2">
                    {/* Show Ship button for items that need shipping */}
                    {sale.status === 'paid' &&
                     (sale.fulfillment_status === 'processing' || sale.fulfillment_status === 'awaiting_payment') && (
                      <Link
                        href={`/dashboard/invoices/${sale.id}?action=ship`}
                        className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                        Ship
                      </Link>
                    )}
                    {/* Show Manage Shipping button for in-transit items */}
                    {sale.fulfillment_status === 'shipped' && (
                      <Link
                        href={`/dashboard/invoices/${sale.id}#shipping-details`}
                        className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-purple-700"
                      >
                        <Settings className="h-4 w-4" />
                        Manage
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/invoices/${sale.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View
                    </Link>
                  </div>
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
