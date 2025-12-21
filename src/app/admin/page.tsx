'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Gavel,
  HandCoins,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Activity,
  Timer,
  CreditCard,
  MessageSquare,
  Shield,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  platformEarnings: number;
  pendingPayments: number;
  totalBids: number;
  totalOffers: number;
  pendingOffers: number;
  recentSignups: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  href?: string;
  count?: number;
}

interface SystemHealth {
  activeAuctions: number;
  endingToday: number;
  unverifiedUsers: number;
  pendingMessages: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    activeAuctions: 0,
    endingToday: 0,
    unverifiedUsers: 0,
    pendingMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Load main stats from API
        const res = await fetch('/api/admin/data?type=dashboard');
        const data = await res.json();

        setStats(data.stats);
        setRecentSales(data.recentSales || []);
        setRecentUsers(data.recentUsers || []);

        // Load additional data for alerts and system health
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const todayEnd = today.toISOString();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();

        const [
          overdueInvoicesResult,
          endingTodayResult,
          unverifiedUsersResult,
          activeAuctionsResult,
        ] = await Promise.all([
          // Overdue invoices (pending and past due date)
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .lt('due_date', new Date().toISOString()),
          // Auctions ending today
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('end_time', todayStart)
            .lte('end_time', todayEnd),
          // Unverified users (not phone verified)
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('phone_verified', false),
          // Active auctions
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .gt('end_time', new Date().toISOString()),
        ]);

        setSystemHealth({
          activeAuctions: activeAuctionsResult.count || 0,
          endingToday: endingTodayResult.count || 0,
          unverifiedUsers: unverifiedUsersResult.count || 0,
          pendingMessages: 0,
        });

        // Build alerts
        const newAlerts: Alert[] = [];

        const overdueCount = overdueInvoicesResult.count || 0;
        if (overdueCount > 0) {
          newAlerts.push({
            id: 'overdue',
            type: 'error',
            title: 'Overdue Invoices',
            description: `${overdueCount} invoice(s) are past their due date`,
            href: '/admin/sales',
            count: overdueCount,
          });
        }

        const pendingPayments = data.stats?.pendingPayments || 0;
        if (pendingPayments > 5) {
          newAlerts.push({
            id: 'pending-payments',
            type: 'warning',
            title: 'High Pending Payments',
            description: `${pendingPayments} invoices awaiting payment`,
            href: '/admin/sales',
            count: pendingPayments,
          });
        }

        const endingTodayCount = endingTodayResult.count || 0;
        if (endingTodayCount > 0) {
          newAlerts.push({
            id: 'ending-today',
            type: 'info',
            title: 'Auctions Ending Today',
            description: `${endingTodayCount} auction(s) will end today`,
            href: '/admin/listings',
            count: endingTodayCount,
          });
        }

        const pendingOffers = data.stats?.pendingOffers || 0;
        if (pendingOffers > 10) {
          newAlerts.push({
            id: 'pending-offers',
            type: 'warning',
            title: 'Many Pending Offers',
            description: `${pendingOffers} offers awaiting response`,
            href: '/admin/offers',
            count: pendingOffers,
          });
        }

        setAlerts(newAlerts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  // Fetch user's first name
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        const nameParts = profile.full_name.trim().split(' ');
        setFirstName(nameParts[0]);
      }
    }

    fetchProfile();
  }, [user?.id, supabase]);

  function getAlertIcon(type: string) {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'info': return <Clock className="h-5 w-5 text-blue-400" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      default: return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  }

  function getAlertBgColor(type: string) {
    switch (type) {
      case 'error': return 'bg-red-900/20 border-red-800/50';
      case 'warning': return 'bg-yellow-900/20 border-yellow-800/50';
      case 'info': return 'bg-blue-900/20 border-blue-800/50';
      case 'success': return 'bg-green-900/20 border-green-800/50';
      default: return 'bg-slate-800 border-slate-700';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome Back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-slate-400 mt-1">Overview of your marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 rounded-lg border border-green-800/50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href || '#'}
                className={`p-4 rounded-xl border ${getAlertBgColor(alert.type)} hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{alert.title}</p>
                      {alert.count && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-700 text-white">
                          {alert.count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{alert.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{systemHealth.activeAuctions}</p>
              <p className="text-xs text-slate-400">Active Auctions</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center">
              <Timer className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{systemHealth.endingToday}</p>
              <p className="text-xs text-slate-400">Ending Today</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-900/50 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{systemHealth.unverifiedUsers}</p>
              <p className="text-xs text-slate-400">Unverified Users</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.pendingOffers || 0}</p>
              <p className="text-xs text-slate-400">Pending Offers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats?.totalRevenue.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-400 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Platform: ${stats?.platformEarnings.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            <span>{stats?.totalSellers || 0} sellers</span>
            <span className="mx-2">•</span>
            <span className="text-blue-400">+{stats?.recentSignups || 0} this week</span>
          </div>
        </div>

        {/* Total Listings */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Listings</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalListings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            <span className="text-green-400">{stats?.activeListings || 0} active</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Sales</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalSales || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-400">{stats?.pendingPayments || 0} pending payment</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bids */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-900/50 rounded-xl flex items-center justify-center">
              <Gavel className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Bids</p>
              <p className="text-xl font-bold text-white">{stats?.totalBids || 0}</p>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-900/50 rounded-xl flex items-center justify-center">
              <HandCoins className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Offers</p>
              <p className="text-xl font-bold text-white">{stats?.totalOffers || 0}</p>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending Payments</p>
              <p className="text-xl font-bold text-white">{stats?.pendingPayments || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
            <Link href="/admin/sales" className="text-sm text-red-400 hover:text-red-300">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No sales yet
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[200px]">
                        {sale.listing?.title || 'Unknown Listing'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {sale.buyer?.full_name || sale.buyer?.email || 'Unknown'} → {sale.seller?.full_name || sale.seller?.email || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">
                        ${Number(sale.total_amount).toLocaleString()}
                      </p>
                      <p className={`text-xs ${sale.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {sale.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-red-400 hover:text-red-300">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No users yet
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_admin && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
                          Admin
                        </span>
                      )}
                      {user.is_seller && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400">
                          Seller
                        </span>
                      )}
                      {!user.is_seller && !user.is_admin && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
                          Buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-white">Manage Users</span>
          </Link>
          <Link
            href="/admin/listings"
            className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Package className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-white">View Listings</span>
          </Link>
          <Link
            href="/admin/sales"
            className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-white">Sales & Revenue</span>
          </Link>
          <Link
            href="/admin/offers"
            className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <HandCoins className="h-5 w-5 text-pink-400" />
            <span className="text-sm font-medium text-white">Manage Offers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
