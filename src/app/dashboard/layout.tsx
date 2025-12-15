'use client';

import Link from 'next/link';
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
  LucideIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  sellerOnly?: boolean;
  buyerOnly?: boolean;
  badgeKey?: 'notifications' | 'purchases' | 'messages';
}

const sidebarLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/listings', label: 'My Listings', icon: Package, sellerOnly: true },
  { href: '/dashboard/bids', label: 'My Bids', icon: Gavel, buyerOnly: true },
  { href: '/dashboard/sales', label: 'Sales', icon: DollarSign, sellerOnly: true },
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
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [badges, setBadges] = useState<Record<string, number>>({
    notifications: 0,
    purchases: 0,
    messages: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      const { data } = await supabase
        .from('profiles')
        .select('is_seller, full_name, company_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setIsSeller(data.is_seller || false);
        setProfileName(data.full_name || data.company_name || null);
      }
    }

    loadProfile();
  }, [user?.id, supabase]);

  // Load badge counts
  useEffect(() => {
    async function loadBadgeCounts() {
      if (!user?.id) return;

      const [notificationsResult, purchasesResult, messagesResult] = await Promise.all([
        // Unread notifications count
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
        // Pending purchases (invoices awaiting payment)
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', user.id)
          .eq('status', 'pending'),
        // Unread messages count
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false),
      ]);

      setBadges({
        notifications: notificationsResult.count || 0,
        purchases: purchasesResult.count || 0,
        messages: messagesResult.count || 0,
      });
    }

    loadBadgeCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(loadBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.id, supabase]);

  // Filter links based on user role:
  // - sellerOnly tabs: only show if user is a seller
  // - buyerOnly tabs: only show if user is NOT a seller (pure seller accounts don't buy)
  const filteredLinks = sidebarLinks.filter(link => {
    if (link.sellerOnly && !isSeller) return false;
    if (link.buyerOnly && isSeller) return false;
    return true;
  });

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-bold text-slate-900">PrintMailBids</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profileName || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {isSeller ? 'Seller Account' : 'Buyer Account'}
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
                    flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                      min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center
                      ${link.badgeKey === 'purchases'
                        ? 'bg-yellow-500 text-white'
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
          <div className="p-4 border-t">
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
        <header className="lg:hidden bg-white shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
            </Link>
            <Link href="/dashboard/notifications" className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                3
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
