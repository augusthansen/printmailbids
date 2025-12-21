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
  Activity
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
}

interface SellerStats {
  activeListings: number;
  totalSales: number;
  totalViews: number;
  pendingShipments: number;
  pendingOffers: number;
  thisWeekViews: number;
  recentBidsCount: number;
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
  });
  const [sellerStats, setSellerStats] = useState<SellerStats>({
    activeListings: 0,
    totalSales: 0,
    totalViews: 0,
    pendingShipments: 0,
    pendingOffers: 0,
    thisWeekViews: 0,
    recentBidsCount: 0,
  });
  const [watchedListings, setWatchedListings] = useState<WatchedListing[]>([]);
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
        const [bidsResult, watchlistResult, invoicesResult, buyerOffersResult] = await Promise.all([
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
          // Get pending invoices (as buyer)
          supabase
            .from('invoices')
            .select('id, total_amount, status')
            .eq('buyer_id', user.id)
            .eq('status', 'pending'),
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

        const pendingInvoices = invoicesResult.data || [];
        const pendingPaymentAmount = pendingInvoices.reduce((sum: number, inv: { total_amount: number }) => sum + (inv.total_amount || 0), 0);

        setBuyerStats({
          activeBids: activeBids.length,
          winningBids: winningBids.length,
          outbidCount,
          watchlistCount: watchlistResult.count || 0,
          pendingPayments: pendingInvoices.length,
          pendingPaymentAmount,
          pendingOffers: buyerOffersResult.count || 0,
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

          const [listingsResult, salesResult, sellerOffersResult, recentBidsResult] = await Promise.all([
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
          ]);

          const listings = listingsResult.data || [];
          const activeListings = listings.filter((l: { status: string }) => l.status === 'active').length;
          const totalViews = listings.reduce((sum: number, l: { view_count: number }) => sum + (l.view_count || 0), 0);

          const sales = salesResult.data || [];
          const paidSales = sales.filter((s: { status: string }) => s.status === 'paid');
          const totalSales = paidSales.reduce((sum: number, s: { total_amount: number }) => sum + (s.total_amount || 0), 0);
          const pendingShipments = sales.filter((s: { status: string; fulfillment_status: string }) =>
            s.status === 'paid' && s.fulfillment_status === 'processing'
          ).length;

          setSellerStats({
            activeListings,
            totalSales,
            totalViews,
            pendingShipments,
            pendingOffers: sellerOffersResult.count || 0,
            thisWeekViews: 0, // Could calculate from analytics if tracked
            recentBidsCount: recentBidsResult.data?.length || 0,
          });

          setRecentBids(recentBidsResult.data || []);

          // Add seller actions
          if (pendingShipments > 0) {
            actions.push({
              id: 'shipping',
              type: 'shipping',
              title: 'Items to Ship',
              description: `${pendingShipments} item(s) ready for shipping`,
              href: '/dashboard/sales',
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
            {isSeller
              ? "Welcome back! Here's your selling activity."
              : "Welcome back! Here's your buying activity."}
          </p>
        </div>
        {isSeller ? (
          <Link
            href="/sell"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="h-5 w-5" />
            New Listing
          </Link>
        ) : (
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse Equipment
          </Link>
        )}
      </div>

      {/* Stats cards - Different for Buyer vs Seller */}
      {isSeller ? (
        // Seller Stats
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
      ) : (
        // Buyer Stats
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
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
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{buyerStats.watchlistCount}</p>
            <p className="text-sm text-slate-600 font-medium mt-1">Watchlist</p>
            <p className="text-xs text-stone-500 mt-0.5">items saved</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
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
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow">
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
            <Link href="/dashboard/my-offers" className="text-xs text-blue-600 hover:text-blue-700 mt-0.5 inline-block">
              View offers →
            </Link>
          </div>
        </div>
      )}

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

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden">
        <div className="p-5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          </div>
        </div>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 ${activity.href ? 'hover:bg-blue-50 cursor-pointer' : ''}`}
                onClick={() => activity.href && (window.location.href = activity.href)}
              >
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
            <p className="text-stone-600">No recent activity</p>
            <p className="text-sm text-stone-500 mt-1">Your activity will appear here</p>
          </div>
        )}
        <div className="p-4 border-t border-stone-100 bg-stone-50/30">
          <Link
            href="/dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            View all activity
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isSeller ? (
            <>
              <Link
                href="/dashboard/listings"
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">My Listings</span>
              </Link>
              <Link
                href="/dashboard/offers"
                className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <HandCoins className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-slate-900">Offers</span>
              </Link>
              <Link
                href="/dashboard/sales"
                className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-slate-900">Sales</span>
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">Messages</span>
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
