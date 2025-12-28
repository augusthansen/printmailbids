'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  ShoppingCart,
  Heart,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Gavel,
  MessageSquare,
  FlaskConical,
  HandCoins,
  Send,
  Shield,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  sellerOnly?: boolean;
  buyerOnly?: boolean;
  badgeKey?: 'notifications' | 'purchases' | 'messages' | 'offers' | 'myOffers';
}

const sidebarLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/listings', label: 'My Listings', icon: Package, sellerOnly: true },
  { href: '/dashboard/offers', label: 'Offers', icon: HandCoins, sellerOnly: true, badgeKey: 'offers' },
  { href: '/dashboard/bids', label: 'My Bids', icon: Gavel, buyerOnly: true },
  { href: '/dashboard/my-offers', label: 'My Offers', icon: Send, buyerOnly: true, badgeKey: 'myOffers' },
  { href: '/dashboard/sales', label: 'Sales', icon: DollarSign, sellerOnly: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, sellerOnly: true },
  { href: '/dashboard/purchases', label: 'Purchases', icon: ShoppingCart, buyerOnly: true, badgeKey: 'purchases' },
  { href: '/dashboard/watchlist', label: 'Watchlist', icon: Heart, buyerOnly: true },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'messages' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/test-auction', label: 'Test Auction', icon: FlaskConical, sellerOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, signOut, isSeller, isAdmin, profileName, avatarUrl } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({
    notifications: 0,
    purchases: 0,
    messages: 0,
    offers: 0,
    myOffers: 0,
  });
  const supabase = useMemo(() => createClient(), []);

  // Load badge counts - only after auth is loaded and we have a user
  useEffect(() => {
    // Don't fetch if still loading auth or no user
    if (loading || !user?.id) return;

    const userId = user.id;

    async function loadBadgeCounts() {
      const [notificationsResult, purchasesResult, offersResult, myOffersResult, messagesResult] = await Promise.all([
        // Unread notifications count
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
        // Pending purchases (invoices awaiting payment)
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', userId)
          .eq('status', 'pending'),
        // Pending offers (for sellers) - ALL pending offers they need to respond to
        // This includes both original offers AND counter-offers from buyers
        supabase
          .from('offers')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .eq('status', 'pending'),
        // Counter-offers needing buyer response (for buyers)
        supabase
          .from('offers')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', userId)
          .eq('status', 'pending')
          .not('parent_offer_id', 'is', null), // Counter-offers from sellers
        // Unread messages count - get conversations where user is participant, then count unread messages
        supabase
          .from('messages')
          .select('id, conversation:conversations!inner(participant_1_id, participant_2_id)', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', userId)
          .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`, { foreignTable: 'conversations' }),
      ]);

      setBadges({
        notifications: notificationsResult.count || 0,
        purchases: purchasesResult.count || 0,
        messages: messagesResult.count || 0,
        offers: offersResult.count || 0,
        myOffers: myOffersResult.count || 0,
      });
    }

    loadBadgeCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(loadBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [loading, user?.id, supabase]);

  // Filter links based on user role:
  // - sellerOnly tabs: only show if user is a seller
  // - buyerOnly tabs: always show (all users can buy)
  // Note: "Buy & Sell" accounts (isSeller=true) see everything
  //       "Buyer Only" accounts (isSeller=false) see buyer items + general items (not seller-only)
  const filteredLinks = sidebarLinks.filter(link => {
    if (link.sellerOnly && !isSeller) return false;
    // buyerOnly items are shown to everyone (all users can buy)
    return true;
  });

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="h-screen bg-stone-100 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full relative">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sidebar header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <span className="text-white font-bold text-sm tracking-tight">PMB</span>
              </div>
              <div>
                <span className="font-bold text-white">PrintMail</span>
                <span className="font-bold text-blue-400">Bids</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center ring-1 ring-blue-500/30 overflow-hidden relative flex-shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Company logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profileName || user?.email || 'User'}
                </p>
                <p className="text-xs text-slate-400">
                  {isAdmin ? 'Admin Account' : isSeller ? 'Buy & Sell Account' : 'Buyer Account'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              const badgeCount = link.badgeKey ? badges[link.badgeKey] : 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </span>
                  {badgeCount > 0 && (
                    <span className={`
                      min-w-[22px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : link.badgeKey === 'purchases'
                        ? 'bg-yellow-500 text-slate-900'
                        : link.badgeKey === 'offers'
                        ? 'bg-green-500 text-white'
                        : link.badgeKey === 'myOffers'
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-500 text-white'
                      }
                    `}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-slate-700/50 space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Shield className="h-5 w-5" />
                Admin Panel
              </Link>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/50 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm tracking-tight">PMB</span>
              </div>
            </Link>
            <Link href="/dashboard/notifications" className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative">
              <Bell className="h-6 w-6" />
              {badges.notifications > 0 && (
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {badges.notifications > 9 ? '9+' : badges.notifications}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-stone-50">
          {children}
        </main>
      </div>
    </div>
  );
}
