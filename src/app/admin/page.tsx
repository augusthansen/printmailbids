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

export default function AdminDashboard() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch('/api/admin/data?type=dashboard');
        const data = await res.json();

        setStats(data.stats);
        setRecentSales(data.recentSales || []);
        setRecentUsers(data.recentUsers || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome Back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-slate-400 mt-1">Overview of your marketplace</p>
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
              Platform Earnings: ${stats?.platformEarnings.toLocaleString() || 0}
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

        {/* Pending Offers */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending Offers</p>
              <p className="text-xl font-bold text-white">{stats?.pendingOffers || 0}</p>
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
    </div>
  );
}
