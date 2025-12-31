'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  DollarSign,
  Eye,
  Gavel,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  ShoppingCart,
  Heart,
  CreditCard,
  Loader2,
  MessageSquare,
  HandCoins,
  CheckCircle2,
  XCircle,
  Bell,
  Send,
  Activity,
  Truck,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface BuyerStats {
  activeBids: number;
  winningBids: number;
  outbidCount: number;
  watchlistCount: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
  pendingOffers: number;
  // Pipeline counts for buyer
  awaitingPaymentCount: number;
  processingCount: number;
  inTransitCount: number;
  deliveredCount: number;
}

interface SellerStats {
  activeListings: number;
  totalSales: number;
  totalViews: number;
  pendingShipments: number;
  pendingOffers: number;
  thisWeekViews: number;
  recentBidsCount: number;
  // Pipeline counts
  awaitingPaymentCount: number;
  readyToShipCount: number;
  inTransitCount: number;
  deliveredCount: number;
}

interface InShippingItem {
  id: string;
  listingTitle: string;
  buyerName: string;
  shippedAt: string;
  carrier: string | null;
  estimatedDelivery: string | null;
}

interface WatchedListing {
  id: string;
  title: string;
  currentBid: number;
  endsIn: string;
  endTime: string;
  imageUrl?: string;
}

interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActivityItem {
  id: string;
  type: 'bid' | 'outbid' | 'offer' | 'message' | 'won' | 'sold' | 'offer_response';
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

interface RecentBid {
  id: string;
  amount: number;
  created_at: string;
  bidder: { full_name: string | null; company_name: string | null } | null;
  listing: { id: string; title: string } | null;
}

export default function DashboardPage() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [buyerStats, setBuyerStats] = useState<BuyerStats>({
    activeBids: 0,
    winningBids: 0,
    outbidCount: 0,
    watchlistCount: 0,
    pendingPayments: 0,
    pendingPaymentAmount: 0,
    pendingOffers: 0,
    awaitingPaymentCount: 0,
    processingCount: 0,
    inTransitCount: 0,
    deliveredCount: 0,
  });
  const [sellerStats, setSellerStats] = useState<SellerStats>({
    activeListings: 0,
    totalSales: 0,
    totalViews: 0,
    pendingShipments: 0,
    pendingOffers: 0,
    thisWeekViews: 0,
    recentBidsCount: 0,
    awaitingPaymentCount: 0,
    readyToShipCount: 0,
    inTransitCount: 0,
    deliveredCount: 0,
  });
  const [watchedListings, setWatchedListings] = useState<WatchedListing[]>([]);
  const [inShippingItems, setInShippingItems] = useState<InShippingItem[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentBids, setRecentBids] = useState<RecentBid[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load buyer stats for all users
        const [bidsResult, watchlistResult, allInvoicesResult, buyerOffersResult] = await Promise.all([
          // Get user's bids with listing details
          supabase
            .from('bids')
            .select('id, amount, created_at, listing:listings(id, title, current_price, status, end_time)')
            .eq('bidder_id', user.id)
            .order('created_at', { ascending: false }),
          // Get watchlist count
          supabase
            .from('watchlist')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          // Get all invoices (as buyer) for pipeline counts
          supabase
            .from('invoices')
            .select('id, total_amount, status, fulfillment_status')
            .eq('buyer_id', user.id),
          // Get pending offers made by buyer (awaiting seller response)
          supabase
            .from('offers')
            .select('id', { count: 'exact', head: true })
            .eq('buyer_id', user.id)
            .eq('status', 'pending'),
        ]);

        // Calculate buyer stats
        const bids = bidsResult.data || [];
        const activeBids = bids.filter((b: { listing: unknown }) => {
          const listing = b.listing as { status: string; end_time: string } | null;
          return listing?.status === 'active' && new Date(listing.end_time) > new Date();
        });
        const winningBids = activeBids.filter((b: { listing: unknown; amount: number }) => {
          const listing = b.listing as { current_price: number } | null;
          return listing?.current_price === b.amount;
        });
        const outbidCount = activeBids.length - winningBids.length;

        const allInvoices = allInvoicesResult.data || [];
        const pendingInvoices = allInvoices.filter((inv: { status: string }) => inv.status === 'pending');
        const pendingPaymentAmount = pendingInvoices.reduce((sum: number, inv: { total_amount: number }) => sum + (inv.total_amount || 0), 0);

        // Calculate buyer pipeline counts
        const buyerAwaitingPayment = allInvoices.filter((inv: { status: string }) => inv.status === 'pending').length;
        const buyerProcessing = allInvoices.filter((inv: { status: string; fulfillment_status: string }) =>
          inv.status === 'paid' && (inv.fulfillment_status === 'processing' || inv.fulfillment_status === 'awaiting_payment')
        ).length;
        const buyerInTransit = allInvoices.filter((inv: { fulfillment_status: string }) => inv.fulfillment_status === 'shipped').length;
        const buyerDelivered = allInvoices.filter((inv: { fulfillment_status: string }) => inv.fulfillment_status === 'delivered').length;

        setBuyerStats({
          activeBids: activeBids.length,
          winningBids: winningBids.length,
          outbidCount,
          watchlistCount: watchlistResult.count || 0,
          pendingPayments: pendingInvoices.length,
          pendingPaymentAmount,
          pendingOffers: buyerOffersResult.count || 0,
          awaitingPaymentCount: buyerAwaitingPayment,
          processingCount: buyerProcessing,
          inTransitCount: buyerInTransit,
          deliveredCount: buyerDelivered,
        });

        // Build pending actions for buyer
        const actions: PendingAction[] = [];
        if (pendingInvoices.length > 0) {
          actions.push({
            id: 'payment',
            type: 'payment',
            title: 'Payment Due',
            description: `You have ${pendingInvoices.length} invoice(s) totaling $${pendingPaymentAmount.toLocaleString()} awaiting payment`,
            href: '/dashboard/purchases',
            priority: 'high',
          });
        }
        if (outbidCount > 0) {
          actions.push({
            id: 'outbid',
            type: 'outbid',
            title: 'You\'ve Been Outbid',
            description: `${outbidCount} of your bids have been outbid`,
            href: '/dashboard/bids',
            priority: 'medium',
          });
        }

        // Load recent activity (notifications)
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('id, type, title, body, listing_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const activityItems: ActivityItem[] = (notificationsData || []).map((n: {
          id: string;
          type: string;
          title: string;
          body: string | null;
          listing_id: string | null;
          created_at: string;
        }) => ({
          id: n.id,
          type: n.type.includes('bid') ? 'bid' : n.type.includes('offer') ? 'offer' : n.type.includes('message') ? 'message' : 'bid',
          title: n.title,
          description: n.body || '',
          timestamp: n.created_at,
          href: n.listing_id ? `/listing/${n.listing_id}` : undefined,
        }));
        setRecentActivity(activityItems);

        // Load watchlist items ending soon
        const { data: watchlistData } = await supabase
          .from('watchlist')
          .select(`
            listing_id,
            listing:listings(id, title, current_price, end_time, status, images:listing_images(url, is_primary))
          `)
          .eq('user_id', user.id)
          .limit(5);

        const watched = (watchlistData || [])
          .filter((w: { listing: unknown }) => {
            const listing = w.listing as { status: string; end_time: string } | null;
            return listing?.status === 'active' && listing?.end_time;
          })
          .map((w: { listing: unknown }) => {
            const listing = w.listing as {
              id: string;
              title: string;
              current_price: number;
              end_time: string;
              images?: { url: string; is_primary: boolean }[];
            };
            const primaryImage = listing.images?.find(img => img.is_primary) || listing.images?.[0];
            return {
              id: listing.id,
              title: listing.title,
              currentBid: listing.current_price || 0,
              endTime: listing.end_time,
              endsIn: getTimeRemaining(listing.end_time),
              imageUrl: primaryImage?.url,
            };
          })
          .sort((a: { endTime: string }, b: { endTime: string }) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
          .slice(0, 3);

        setWatchedListings(watched);

        // Load seller stats if user is a seller
        if (isSeller) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const [listingsResult, salesResult, sellerOffersResult, recentBidsResult, inShippingResult] = await Promise.all([
            supabase
              .from('listings')
              .select('id, status, view_count, created_at')
              .eq('seller_id', user.id),
            supabase
              .from('invoices')
              .select('id, total_amount, status, fulfillment_status')
              .eq('seller_id', user.id),
            // Pending offers for seller to respond to
            supabase
              .from('offers')
              .select('id', { count: 'exact', head: true })
              .eq('seller_id', user.id)
              .eq('status', 'pending'),
            // Recent bids on seller's listings
            supabase
              .from('bids')
              .select(`
                id, amount, created_at,
                bidder:profiles!bids_bidder_id_fkey(full_name, company_name),
                listing:listings!inner(id, title, seller_id)
              `)
              .eq('listing.seller_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5),
            // Items currently in shipping
            supabase
              .from('invoices')
              .select(`
                id,
                shipped_at,
                shipping_carrier,
                freight_estimated_delivery,
                listing:listings(title),
                buyer:profiles!invoices_buyer_id_fkey(full_name, company_name)
              `)
              .eq('seller_id', user.id)
              .eq('fulfillment_status', 'shipped')
              .order('shipped_at', { ascending: false })
              .limit(5),
          ]);

          const listings = listingsResult.data || [];
          const activeListings = listings.filter((l: { status: string }) => l.status === 'active').length;
          const totalViews = listings.reduce((sum: number, l: { view_count: number }) => sum + (l.view_count || 0), 0);

          const sales = salesResult.data || [];
          const paidSales = sales.filter((s: { status: string }) => s.status === 'paid');
          const totalSales = paidSales.reduce((sum: number, s: { total_amount: number }) => sum + (s.total_amount || 0), 0);
          const pendingShipments = sales.filter((s: { status: string; fulfillment_status: string }) =>
            s.status === 'paid' && (s.fulfillment_status === 'processing' || s.fulfillment_status === 'awaiting_payment')
          ).length;

          // Calculate pipeline counts
          const awaitingPaymentCount = sales.filter((s: { status: string }) => s.status === 'pending').length;
          const readyToShipCount = sales.filter((s: { status: string; fulfillment_status: string }) =>
            s.status === 'paid' && (s.fulfillment_status === 'processing' || s.fulfillment_status === 'awaiting_payment')
          ).length;
          const inTransitCount = sales.filter((s: { fulfillment_status: string }) => s.fulfillment_status === 'shipped').length;
          const deliveredCount = sales.filter((s: { fulfillment_status: string }) => s.fulfillment_status === 'delivered').length;

          setSellerStats({
            activeListings,
            totalSales,
            totalViews,
            pendingShipments,
            pendingOffers: sellerOffersResult.count || 0,
            thisWeekViews: 0, // Could calculate from analytics if tracked
            recentBidsCount: recentBidsResult.data?.length || 0,
            awaitingPaymentCount,
            readyToShipCount,
            inTransitCount,
            deliveredCount,
          });

          setRecentBids(recentBidsResult.data || []);

          // Process in-shipping items
          const shippingItems: InShippingItem[] = (inShippingResult.data || []).map((item: {
            id: string;
            shipped_at: string;
            shipping_carrier: string | null;
            freight_estimated_delivery: string | null;
            listing: { title: string } | null;
            buyer: { full_name: string | null; company_name: string | null } | null;
          }) => ({
            id: item.id,
            listingTitle: item.listing?.title || 'Unknown',
            buyerName: item.buyer?.company_name || item.buyer?.full_name || 'Unknown',
            shippedAt: item.shipped_at,
            carrier: item.shipping_carrier,
            estimatedDelivery: item.freight_estimated_delivery,
          }));
          setInShippingItems(shippingItems);

          // Add seller actions
          if (pendingShipments > 0) {
            actions.push({
              id: 'shipping',
              type: 'shipping',
              title: 'Items to Ship',
              description: `${pendingShipments} item(s) ready for shipping`,
              href: '/dashboard/sales?filter=needs_shipping',
              priority: 'high',
            });
          }
          if ((sellerOffersResult.count || 0) > 0) {
            actions.push({
              id: 'offers',
              type: 'offers',
              title: 'Pending Offers',
              description: `${sellerOffersResult.count} offer(s) awaiting your response`,
              href: '/dashboard/offers',
              priority: 'medium',
            });
          }
        }

        // Sort actions by priority
        actions.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        setPendingActions(actions);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id, authLoading, isSeller, supabase]);

  function getTimeRemaining(endTime: string): string {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'bid': return <Gavel className="h-4 w-4 text-blue-600" />;
      case 'outbid': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'offer': return <HandCoins className="h-4 w-4 text-green-600" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'won': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'sold': return <DollarSign className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4 text-slate-600" />;
    }
  }

  if (loading || authLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900 font-display">Dashboard</h1>
          <p className="text-stone-600 mt-1">
            Welcome back! Here&apos;s your activity overview.
          </p>
        </div>
        <div className="flex gap-3">
          {isSeller && (
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="h-5 w-5" />
              New Listing
            </Link>
          )}
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 bg-white border border-stone-200 text-slate-700 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-50 transition-all"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse
          </Link>
        </div>
      </div>

      {/* Quick Links - Mobile only (shown at top) */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6 lg:hidden">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Seller links */}
          {isSeller && (
            <>
              <Link
                href="/dashboard/listings"
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">My Listings</span>
              </Link>
              <Link
                href="/dashboard/sales"
                className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-slate-900">Sales</span>
              </Link>
            </>
          )}
          {/* Buyer links - shown for everyone */}
          <Link
            href="/dashboard/bids"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Gavel className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-slate-900">My Bids</span>
          </Link>
          <Link
            href="/dashboard/purchases"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span className="font-medium text-slate-900">Purchases</span>
          </Link>
          <Link
            href="/dashboard/watchlist"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Heart className="h-5 w-5 text-red-600" />
            <span className="font-medium text-slate-900">Watchlist</span>
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Package className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-900">Browse</span>
          </Link>
        </div>
      </div>

      {/* ==================== SELLER SECTION ==================== */}
      {isSeller && (
        <>
          {/* Seller Section Header */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Selling</h2>
              <p className="text-sm text-stone-500">Manage your listings and sales</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent ml-4" />
          </div>

          {/* Seller Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                {sellerStats.activeListings > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
              </div>
              <p className="text-3xl font-bold text-slate-900">{sellerStats.activeListings}</p>
              <p className="text-sm text-slate-600 font-medium mt-1">Active Listings</p>
              <p className="text-xs text-stone-500 mt-0.5">currently live</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">${sellerStats.totalSales.toLocaleString()}</p>
              <p className="text-sm text-slate-600 font-medium mt-1">Total Sales</p>
              <p className="text-xs text-stone-500 mt-0.5">lifetime revenue</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                  <HandCoins className="h-6 w-6 text-purple-600" />
                </div>
                {sellerStats.pendingOffers > 0 && (
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {sellerStats.pendingOffers}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900">{sellerStats.pendingOffers}</p>
              <p className="text-sm text-slate-600 font-medium mt-1">Pending Offers</p>
              <Link href="/dashboard/offers" className="text-xs text-blue-600 hover:text-blue-700 mt-0.5 inline-block">
                View offers →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100">
                  <Eye className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{sellerStats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-slate-600 font-medium mt-1">Total Views</p>
              <p className="text-xs text-stone-500 mt-0.5">across all listings</p>
            </div>
          </div>

          {/* Sales Pipeline Status Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Sales Pipeline</h2>
              <Link href="/dashboard/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/sales?pipeline=awaiting_payment"
                className="text-left rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 hover:border-yellow-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Awaiting Payment</p>
                    <p className="text-2xl font-bold text-slate-900">{sellerStats.awaitingPaymentCount}</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/sales?filter=needs_shipping"
                className="text-left rounded-xl border-2 border-blue-200 bg-blue-50 p-4 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ready to Ship</p>
                    <p className="text-2xl font-bold text-slate-900">{sellerStats.readyToShipCount}</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/sales?pipeline=in_transit"
                className="text-left rounded-xl border-2 border-purple-200 bg-purple-50 p-4 hover:border-purple-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">In Transit</p>
                    <p className="text-2xl font-bold text-slate-900">{sellerStats.inTransitCount}</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/sales?pipeline=delivered"
                className="text-left rounded-xl border-2 border-green-200 bg-green-50 p-4 hover:border-green-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Delivered</p>
                    <p className="text-2xl font-bold text-slate-900">{sellerStats.deliveredCount}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* In Shipping Section */}
          {inShippingItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden">
              <div className="p-5 border-b border-purple-100 bg-purple-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-purple-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900">Currently In Shipping</h2>
                  <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {inShippingItems.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {inShippingItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/invoices/${item.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.listingTitle}</p>
                      <p className="text-sm text-stone-600">
                        To: {item.buyerName}
                        {item.carrier && <span className="text-stone-400"> • {item.carrier}</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-purple-600">
                        {item.estimatedDelivery
                          ? `Est. ${new Date(item.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : 'In Transit'}
                      </p>
                      <p className="text-xs text-stone-500">
                        Shipped {formatTimeAgo(item.shippedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-4 border-t border-stone-100 bg-stone-50/30">
                <Link
                  href="/dashboard/sales?pipeline=in_transit"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-colors"
                >
                  View all in-transit items
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== BUYER SECTION ==================== */}
      {/* Buyer Section Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <ShoppingCart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Buying</h2>
          <p className="text-sm text-stone-500">Track your bids and purchases</p>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent ml-4" />
      </div>

      {/* Buyer Stats - shown for all users (everyone can buy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/bids"
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Gavel className="h-6 w-6 text-blue-600" />
            </div>
            {buyerStats.winningBids > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                {buyerStats.winningBids} winning
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900">{buyerStats.activeBids}</p>
          <p className="text-sm text-slate-600 font-medium mt-1">Active Bids</p>
          {buyerStats.outbidCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5">{buyerStats.outbidCount} outbid</p>
          )}
        </Link>

        <Link
          href="/dashboard/watchlist"
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md hover:border-red-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{buyerStats.watchlistCount}</p>
          <p className="text-sm text-slate-600 font-medium mt-1">Watchlist</p>
          <p className="text-xs text-stone-500 mt-0.5">items saved</p>
        </Link>

        <Link
          href="/dashboard/purchases?status=pending"
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md hover:border-yellow-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            {buyerStats.pendingPayments > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {buyerStats.pendingPayments}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900">{buyerStats.pendingPayments}</p>
          <p className="text-sm text-slate-600 font-medium mt-1">Pending Payments</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {buyerStats.pendingPaymentAmount > 0 ? `$${buyerStats.pendingPaymentAmount.toLocaleString()} due` : 'All paid'}
          </p>
        </Link>

        <Link
          href="/dashboard/my-offers"
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md hover:border-green-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            {buyerStats.pendingOffers > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {buyerStats.pendingOffers}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900">{buyerStats.pendingOffers}</p>
          <p className="text-sm text-slate-600 font-medium mt-1">Pending Offers</p>
          <p className="text-xs text-green-600 mt-0.5">View offers →</p>
        </Link>
      </div>

      {/* Purchase Pipeline - shown for all users (everyone can buy) */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Purchase Pipeline</h2>
          <Link href="/dashboard/purchases" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/purchases?status=pending"
            className="text-left rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 hover:border-yellow-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">To Pay</p>
                <p className="text-2xl font-bold text-slate-900">{buyerStats.awaitingPaymentCount}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/purchases?status=paid"
            className="text-left rounded-xl border-2 border-blue-200 bg-blue-50 p-4 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Processing</p>
                <p className="text-2xl font-bold text-slate-900">{buyerStats.processingCount}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/purchases?status=shipped"
            className="text-left rounded-xl border-2 border-purple-200 bg-purple-50 p-4 hover:border-purple-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">In Transit</p>
                <p className="text-2xl font-bold text-slate-900">{buyerStats.inTransitCount}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/purchases?status=delivered"
            className="text-left rounded-xl border-2 border-green-200 bg-green-50 p-4 hover:border-green-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Delivered</p>
                <p className="text-2xl font-bold text-slate-900">{buyerStats.deliveredCount}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ==================== ACTIVITY & OVERVIEW SECTION ==================== */}
      {/* Activity Section Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Activity & Overview</h2>
          <p className="text-sm text-stone-500">Actions, notifications, and recent items</p>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent ml-4" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden">
          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-slate-900">Action Required</h2>
              {pendingActions.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pendingActions.length}
                </span>
              )}
            </div>
          </div>
          {pendingActions.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {pendingActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="block p-4 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      action.priority === 'high' ? 'bg-red-500' :
                      action.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'
                    }`} />
                    <div>
                      <p className="font-medium text-slate-900 mb-1">{action.title}</p>
                      <p className="text-sm text-stone-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-stone-600">No actions required</p>
              <p className="text-sm text-stone-500 mt-1">You&apos;re all caught up!</p>
            </div>
          )}
          <div className="p-4 border-t border-stone-100 bg-stone-50/30">
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all notifications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Watched Items / Recent Bids (for sellers) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden">
          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                {isSeller ? <Gavel className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-red-600" />}
              </div>
              <h2 className="font-semibold text-slate-900">
                {isSeller ? 'Recent Bids on Your Listings' : 'Watched Items'}
              </h2>
            </div>
          </div>

          {isSeller ? (
            // Seller: Show recent bids on their listings
            recentBids.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {recentBids.map((bid) => (
                  <Link
                    key={bid.id}
                    href={bid.listing ? `/listing/${bid.listing.id}` : '#'}
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{bid.listing?.title || 'Unknown Listing'}</p>
                      <p className="text-sm text-stone-600">
                        {bid.bidder?.company_name || bid.bidder?.full_name || 'Anonymous'} bid <span className="font-semibold text-green-600">${bid.amount.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-stone-500">{formatTimeAgo(bid.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gavel className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-stone-600">No recent bids</p>
                <p className="text-sm text-stone-500 mt-1">Bids on your listings will appear here</p>
              </div>
            )
          ) : (
            // Buyer: Show watched items
            watchedListings.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {watchedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {listing.imageUrl ? (
                        <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{listing.title}</p>
                      <p className="text-sm text-stone-600">
                        Current bid: <span className="font-semibold text-slate-900">${listing.currentBid.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-red-600">{listing.endsIn}</p>
                      <p className="text-xs text-stone-500">remaining</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-stone-600">No watched items</p>
                <p className="text-sm text-stone-500 mt-1">Add items to your watchlist to track them here</p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4 transition-colors"
                >
                  Browse marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          )}
          <div className="p-4 border-t border-stone-100 bg-stone-50/30">
            <Link
              href={isSeller ? '/dashboard/listings' : '/dashboard/watchlist'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              {isSeller ? 'View all listings' : 'View watchlist'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline - Prominent placement */}
      <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
        recentActivity.length > 0
          ? 'border-2 border-purple-200 ring-2 ring-purple-100'
          : 'border border-stone-200/50'
      }`}>
        <div className={`p-5 border-b ${
          recentActivity.length > 0 ? 'bg-purple-50 border-purple-100' : 'bg-stone-50/50 border-stone-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              recentActivity.length > 0 ? 'bg-purple-200' : 'bg-purple-100'
            }`}>
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Recent Notifications</h2>
            {recentActivity.length > 0 && (
              <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {recentActivity.length} new
              </span>
            )}
          </div>
        </div>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 ${activity.href ? 'hover:bg-purple-50 cursor-pointer' : ''}`}
                onClick={() => activity.href && (window.location.href = activity.href)}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-stone-600 truncate">{activity.description}</p>
                </div>
                <p className="text-xs text-stone-500 flex-shrink-0">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600">No recent notifications</p>
            <p className="text-sm text-stone-500 mt-1">New activity will appear here</p>
          </div>
        )}
        <div className="p-4 border-t border-stone-100 bg-stone-50/30">
          <Link
            href="/dashboard/notifications"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-colors"
          >
            View all notifications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick Links - Desktop only (shown at bottom) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Links</h2>
        <div className={`grid gap-4 ${isSeller ? 'grid-cols-6' : 'grid-cols-4'}`}>
          {/* Seller links */}
          {isSeller && (
            <>
              <Link
                href="/dashboard/listings"
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">Listings</span>
              </Link>
              <Link
                href="/dashboard/sales"
                className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-slate-900">Sales</span>
              </Link>
            </>
          )}
          {/* Buyer links - shown for everyone */}
          <Link
            href="/dashboard/bids"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Gavel className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-slate-900">Bids</span>
          </Link>
          <Link
            href="/dashboard/purchases"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span className="font-medium text-slate-900">Purchases</span>
          </Link>
          <Link
            href="/dashboard/watchlist"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Heart className="h-5 w-5 text-red-600" />
            <span className="font-medium text-slate-900">Watchlist</span>
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Package className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-900">Browse</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
