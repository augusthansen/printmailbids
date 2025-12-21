'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  DollarSign,
  Eye,
  Gavel,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  ShoppingCart,
  Heart,
  CreditCard,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface BuyerStats {
  activeBids: number;
  winningBids: number;
  watchlistCount: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
}

interface SellerStats {
  activeListings: number;
  totalSales: number;
  totalViews: number;
  pendingShipments: number;
}

interface WatchedListing {
  id: string;
  title: string;
  currentBid: number;
  endsIn: string;
  endTime: string;
}

interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
}

export default function DashboardPage() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [buyerStats, setBuyerStats] = useState<BuyerStats>({
    activeBids: 0,
    winningBids: 0,
    watchlistCount: 0,
    pendingPayments: 0,
    pendingPaymentAmount: 0,
  });
  const [sellerStats, setSellerStats] = useState<SellerStats>({
    activeListings: 0,
    totalSales: 0,
    totalViews: 0,
    pendingShipments: 0,
  });
  const [watchedListings, setWatchedListings] = useState<WatchedListing[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load buyer stats for all users
        const [bidsResult, watchlistResult, invoicesResult] = await Promise.all([
          // Get user's bids
          supabase
            .from('bids')
            .select('id, amount, listing:listings(current_price, status, end_time)')
            .eq('bidder_id', user.id),
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

        const pendingInvoices = invoicesResult.data || [];
        const pendingPaymentAmount = pendingInvoices.reduce((sum: number, inv: { total_amount: number }) => sum + (inv.total_amount || 0), 0);

        setBuyerStats({
          activeBids: activeBids.length,
          winningBids: winningBids.length,
          watchlistCount: watchlistResult.count || 0,
          pendingPayments: pendingInvoices.length,
          pendingPaymentAmount,
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
          });
        }

        // Load watchlist items ending soon
        const { data: watchlistData } = await supabase
          .from('watchlist')
          .select(`
            listing_id,
            listing:listings(id, title, current_price, end_time, status)
          `)
          .eq('user_id', user.id)
          .limit(5);

        const watched = (watchlistData || [])
          .filter((w: { listing: unknown }) => {
            const listing = w.listing as { status: string; end_time: string } | null;
            return listing?.status === 'active' && listing?.end_time;
          })
          .map((w: { listing: unknown }) => {
            const listing = w.listing as { id: string; title: string; current_price: number; end_time: string };
            return {
              id: listing.id,
              title: listing.title,
              currentBid: listing.current_price || 0,
              endTime: listing.end_time,
              endsIn: getTimeRemaining(listing.end_time),
            };
          })
          .sort((a: { endTime: string }, b: { endTime: string }) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
          .slice(0, 3);

        setWatchedListings(watched);

        // Load seller stats if user is a seller
        if (isSeller) {
          const [listingsResult, salesResult] = await Promise.all([
            supabase
              .from('listings')
              .select('id, status, view_count')
              .eq('seller_id', user.id),
            supabase
              .from('invoices')
              .select('id, total_amount, status, fulfillment_status')
              .eq('seller_id', user.id),
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
          });

          // Add seller actions
          if (pendingShipments > 0) {
            actions.push({
              id: 'shipping',
              type: 'shipping',
              title: 'Items to Ship',
              description: `${pendingShipments} item(s) ready for shipping`,
              href: '/dashboard/sales',
            });
          }
        }

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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Buyer-focused stats
  const buyerStatsCards = [
    {
      label: 'Active Bids',
      value: buyerStats.activeBids.toString(),
      change: `${buyerStats.winningBids} winning`,
      icon: Gavel,
      color: 'blue',
    },
    {
      label: 'Watchlist',
      value: buyerStats.watchlistCount.toString(),
      change: 'items saved',
      icon: Heart,
      color: 'red',
    },
    {
      label: 'Pending Payments',
      value: buyerStats.pendingPayments.toString(),
      change: buyerStats.pendingPaymentAmount > 0 ? `$${buyerStats.pendingPaymentAmount.toLocaleString()} due` : 'All paid',
      icon: CreditCard,
      color: 'yellow',
    },
    {
      label: 'Purchases',
      value: '-',
      change: 'View history',
      icon: ShoppingCart,
      color: 'green',
      href: '/dashboard/purchases',
    },
  ];

  // Seller-focused stats
  const sellerStatsCards = [
    {
      label: 'Active Listings',
      value: sellerStats.activeListings.toString(),
      change: 'currently live',
      icon: Package,
      color: 'blue',
    },
    {
      label: 'Total Sales',
      value: `$${sellerStats.totalSales.toLocaleString()}`,
      change: 'lifetime',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Total Views',
      value: sellerStats.totalViews.toLocaleString(),
      change: 'across all listings',
      icon: Eye,
      color: 'slate',
    },
    {
      label: 'To Ship',
      value: sellerStats.pendingShipments.toString(),
      change: 'awaiting shipment',
      icon: Package,
      color: 'yellow',
    },
  ];

  const statsToShow = isSeller ? sellerStatsCards : buyerStatsCards;

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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsToShow.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/50 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${stat.color === 'blue' ? 'bg-blue-100' : ''}
                ${stat.color === 'green' ? 'bg-green-100' : ''}
                ${stat.color === 'slate' ? 'bg-slate-100' : ''}
                ${stat.color === 'red' ? 'bg-red-100' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-100' : ''}
              `}>
                <stat.icon className={`h-6 w-6
                  ${stat.color === 'blue' ? 'text-blue-600' : ''}
                  ${stat.color === 'green' ? 'text-green-600' : ''}
                  ${stat.color === 'slate' ? 'text-slate-600' : ''}
                  ${stat.color === 'red' ? 'text-red-600' : ''}
                  ${stat.color === 'yellow' ? 'text-yellow-600' : ''}
                `} />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-600 font-medium mt-1">{stat.label}</p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.change}</p>
          </div>
        ))}
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
                  <p className="font-medium text-slate-900 mb-1">{action.title}</p>
                  <p className="text-sm text-stone-600">{action.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
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

        {/* Watched Items / Ending Soon */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden">
          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="font-semibold text-slate-900">
                {isSeller ? 'Your Listings Ending Soon' : 'Watched Items'}
              </h2>
            </div>
          </div>
          {watchedListings.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {watchedListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-stone-400" />
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
              <p className="text-sm text-stone-500 mt-1">
                {isSeller
                  ? 'Create a listing to get started'
                  : 'Add items to your watchlist to track them here'}
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4 transition-colors"
              >
                Browse marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

      {/* Quick Links for Buyers */}
      {!isSeller && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      )}
    </div>
  );
}
