'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  CreditCard,
  AlertCircle,
  MapPin,
  Loader2,
  FileText,
  DollarSign
} from 'lucide-react';

type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
type FulfillmentStatus = 'awaiting_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type FeesStatus = 'none' | 'pending_approval' | 'approved' | 'rejected' | 'disputed';

interface Purchase {
  id: string;
  listing_id: string;
  sale_amount: number;
  buyer_premium_amount: number;
  packaging_amount: number;
  shipping_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  fulfillment_status: FulfillmentStatus;
  fees_status: FeesStatus;
  payment_due_date: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  delivered_at: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    city: string | null;
    state: string | null;
  } | null;
  seller: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Payment Due', color: 'yellow', icon: CreditCard },
  paid: { label: 'Paid', color: 'blue', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'red', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'gray', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'gray', icon: CheckCircle },
};

const fulfillmentConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  awaiting_payment: { label: 'Awaiting Payment', color: 'yellow', icon: CreditCard },
  processing: { label: 'Processing', color: 'blue', icon: Package },
  shipped: { label: 'In Transit', color: 'purple', icon: Truck },
  delivered: { label: 'Delivered', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'gray', icon: AlertCircle },
};

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadPurchases() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get invoices first
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          listing_id,
          seller_id,
          sale_amount,
          buyer_premium_amount,
          packaging_amount,
          shipping_amount,
          total_amount,
          status,
          fulfillment_status,
          fees_status,
          payment_due_date,
          paid_at,
          shipped_at,
          tracking_number,
          delivered_at,
          created_at
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Error loading invoices:', invoicesError);
        setLoading(false);
        return;
      }

      if (!invoicesData || invoicesData.length === 0) {
        setPurchases([]);
        setLoading(false);
        return;
      }

      // Get unique listing and seller IDs
      const listingIds = [...new Set(invoicesData.map((i: { listing_id: string }) => i.listing_id).filter(Boolean))];
      const sellerIds = [...new Set(invoicesData.map((i: { seller_id: string }) => i.seller_id).filter(Boolean))];

      // Fetch listings - use individual queries since RLS now allows buyer access
      let listingsData: { id: string; title: string; city: string | null; state: string | null }[] = [];
      if (listingIds.length > 0) {
        const listingsPromises = listingIds.map(id =>
          supabase.from('listings').select('id, title, city, state').eq('id', id).single()
        );
        const results = await Promise.all(listingsPromises);
        listingsData = results
          .filter(r => r.data && !r.error)
          .map(r => r.data as { id: string; title: string; city: string | null; state: string | null });
      }

      // Fetch sellers
      let sellersData: { id: string; full_name: string | null; company_name: string | null }[] = [];
      if (sellerIds.length > 0) {
        const sellersPromises = sellerIds.map(id =>
          supabase.from('profiles').select('id, full_name, company_name').eq('id', id).single()
        );
        const results = await Promise.all(sellersPromises);
        sellersData = results
          .filter(r => r.data && !r.error)
          .map(r => r.data as { id: string; full_name: string | null; company_name: string | null });
      }

      // Create lookup maps
      const listingsMap = new Map(listingsData.map(l => [l.id, l]));
      const sellersMap = new Map(sellersData.map(s => [s.id, s]));

      // Merge data
      const purchasesWithDetails = invoicesData.map((invoice: { listing_id: string; seller_id: string }) => ({
        ...invoice,
        listing: listingsMap.get(invoice.listing_id) || null,
        seller: sellersMap.get(invoice.seller_id) || null
      }));

      setPurchases(purchasesWithDetails as Purchase[]);
      setLoading(false);
    }

    loadPurchases();
  }, [user?.id, authLoading, supabase]);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter || purchase.fulfillment_status === statusFilter;
    const matchesSearch =
      (purchase.listing?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purchase.seller?.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalSpent = purchases
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + (p.total_amount || 0), 0);

  const pendingPayment = purchases
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + (p.total_amount || 0), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <p className="text-gray-600">Track your won auctions and purchases</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-xl font-bold text-gray-900">{purchases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Due</p>
              <p className="text-xl font-bold text-gray-900">${pendingPayment.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-xl font-bold text-gray-900">
                {purchases.filter(p => p.fulfillment_status === 'shipped').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Pending Approval Alert - Most urgent, show first */}
      {purchases.some(p => p.fees_status === 'pending_approval') && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Action Required: Review Fees</p>
              <p className="text-sm text-amber-700 mt-1">
                {purchases.filter(p => p.fees_status === 'pending_approval').length} invoice(s) have
                packaging/shipping fees that need your approval before you can pay.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {purchases
                  .filter(p => p.fees_status === 'pending_approval')
                  .map(p => (
                    <Link
                      key={p.id}
                      href={`/dashboard/invoices/${p.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                    >
                      <FileText className="h-4 w-4" />
                      {p.listing?.title ? (p.listing.title.length > 30 ? p.listing.title.slice(0, 30) + '...' : p.listing.title) : 'View Invoice'}
                      <span className="text-amber-200">
                        +${((p.packaging_amount || 0) + (p.shipping_amount || 0)).toLocaleString()}
                      </span>
                    </Link>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Required Alert */}
      {purchases.some(p => p.status === 'pending') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Payment Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {purchases.filter(p => p.status === 'pending').length} purchase(s)
                awaiting payment totaling ${pendingPayment.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Payment Due</option>
              <option value="paid">Paid</option>
              <option value="shipped">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchases list */}
      <div className="space-y-4">
        {filteredPurchases.map((purchase) => {
          const status = statusConfig[purchase.status] || statusConfig.pending;
          const fulfillment = fulfillmentConfig[purchase.fulfillment_status] || fulfillmentConfig.awaiting_payment;
          const daysUntilDue = getDaysUntilDue(purchase.payment_due_date);
          const location = [purchase.listing?.city, purchase.listing?.state].filter(Boolean).join(', ') || 'Location TBD';

          return (
            <div
              key={purchase.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                      {purchase.status === 'paid' && (
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${fulfillment.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${fulfillment.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                          ${fulfillment.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                          ${fulfillment.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                          ${fulfillment.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                        `}>
                          <fulfillment.icon className="h-3 w-3" />
                          {fulfillment.label}
                        </span>
                      )}
                      {purchase.fees_status === 'pending_approval' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 animate-pulse">
                          <DollarSign className="h-3 w-3" />
                          Fees Need Approval
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/listing/${purchase.listing_id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {purchase.listing?.title || 'Listing'}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Seller: {purchase.seller?.company_name || purchase.seller?.full_name || 'Unknown'}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location}
                      </span>
                      <span>Won: {formatDate(purchase.created_at)}</span>
                    </div>
                  </div>

                  {/* Price and action */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${(purchase.total_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bid: ${(purchase.sale_amount || 0).toLocaleString()} + Premium: ${(purchase.buyer_premium_amount || 0).toLocaleString()}
                      </p>
                    </div>

                    {purchase.status === 'pending' && (
                      <div className="flex flex-col items-end gap-2">
                        {daysUntilDue !== null && (
                          <p className={`text-sm font-medium ${daysUntilDue <= 2 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {daysUntilDue <= 0 ? 'Payment overdue!' : `Due in ${daysUntilDue} days`}
                          </p>
                        )}
                        <Link
                          href={`/dashboard/invoices/${purchase.id}`}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Now
                        </Link>
                      </div>
                    )}

                    {purchase.fulfillment_status === 'shipped' && purchase.tracking_number && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Tracking</p>
                        <p className="text-sm font-medium text-blue-600">{purchase.tracking_number}</p>
                      </div>
                    )}

                    {purchase.fees_status === 'pending_approval' && (
                      <Link
                        href={`/dashboard/invoices/${purchase.id}`}
                        className="inline-flex items-center gap-1 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        <DollarSign className="h-4 w-4" />
                        Review Fees
                      </Link>
                    )}

                    <Link
                      href={`/dashboard/invoices/${purchase.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>

              {/* Progress bar for shipped items */}
              {(purchase.fulfillment_status === 'shipped' || purchase.fulfillment_status === 'delivered') && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Paid</span>
                      <span>Shipped</span>
                      <span>In Transit</span>
                      <span>Delivered</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: purchase.fulfillment_status === 'shipped' ? '66%' : '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPurchases.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {purchases.length === 0 ? 'No purchases yet' : 'No purchases match your filters'}
            </p>
            <Link
              href="/marketplace"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse equipment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
