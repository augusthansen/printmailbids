'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Shield,
  Store,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Percent,
  X,
  Loader2
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  is_verified: boolean;
  is_seller: boolean;
  is_admin: boolean;
  seller_rating: number;
  buyer_rating: number;
  custom_buyer_premium_percent: number | null;
  custom_seller_commission_percent: number | null;
  created_at: string;
}

interface CommissionModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (userId: string, buyerPremium: number | null, sellerCommission: number | null) => Promise<void>;
}

function CommissionModal({ user, onClose, onSave }: CommissionModalProps) {
  const [useCustomBuyer, setUseCustomBuyer] = useState(user.custom_buyer_premium_percent !== null);
  const [useCustomSeller, setUseCustomSeller] = useState(user.custom_seller_commission_percent !== null);
  const [buyerPremium, setBuyerPremium] = useState(
    user.custom_buyer_premium_percent?.toString() || '8.0'
  );
  const [sellerCommission, setSellerCommission] = useState(
    user.custom_seller_commission_percent?.toString() || '8.0'
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(
        user.id,
        useCustomBuyer ? parseFloat(buyerPremium) : null,
        useCustomSeller ? parseFloat(sellerCommission) : null
      );
      onClose();
    } catch (error) {
      console.error('Error saving commission rates:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Commission Rates</h2>
            <p className="text-sm text-slate-400">{user.full_name || user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Buyer Premium */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Buyer Premium</label>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={useCustomBuyer}
                  onChange={(e) => setUseCustomBuyer(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                />
                Custom rate
              </label>
            </div>
            {useCustomBuyer ? (
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={buyerPremium}
                  onChange={(e) => setBuyerPremium(e.target.value)}
                  className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-400 text-sm">
                Using platform default
              </div>
            )}
          </div>

          {/* Seller Commission */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Seller Commission</label>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={useCustomSeller}
                  onChange={(e) => setUseCustomSeller(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                />
                Custom rate
              </label>
            </div>
            {useCustomSeller ? (
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={sellerCommission}
                  onChange={(e) => setSellerCommission(e.target.value)}
                  className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-400 text-sm">
                Using platform default
              </div>
            )}
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Note:</p>
            <p>Custom rates override platform defaults for this seller&apos;s transactions only.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Rates'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'seller' | 'buyer'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commissionModal, setCommissionModal] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'users',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        role: roleFilter,
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count } = await res.json();

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminStatus(userId: string, currentStatus: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleAdmin', userId, value: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleSellerStatus(userId: string, currentStatus: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleSeller', userId, value: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_seller: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Error updating seller status:', error);
      alert('Failed to update seller status');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleVerifiedStatus(userId: string, currentStatus: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleVerified', userId, value: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_verified: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Error updating verified status:', error);
      alert('Failed to update verified status');
    } finally {
      setActionLoading(null);
    }
  }

  async function updateCommissionRates(
    userId: string,
    buyerPremium: number | null,
    sellerCommission: number | null
  ) {
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateCommissionRates',
        userId,
        custom_buyer_premium_percent: buyerPremium,
        custom_seller_commission_percent: sellerCommission,
      }),
    });

    if (!res.ok) throw new Error('Failed to update commission rates');

    setUsers(users.map(u =>
      u.id === userId
        ? {
            ...u,
            custom_buyer_premium_percent: buyerPremium,
            custom_seller_commission_percent: sellerCommission,
          }
        : u
    ));
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Commission Modal */}
      {commissionModal && (
        <CommissionModal
          user={commissionModal}
          onClose={() => setCommissionModal(null)}
          onSave={updateCommissionRates}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 mt-1">Manage all user accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalCount} total users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email, name, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="seller">Sellers</option>
          <option value="buyer">Buyers Only</option>
        </select>

        <button
          onClick={() => loadUsers()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Users className="h-12 w-12 mb-4" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                          {user.is_admin ? (
                            <Shield className="h-5 w-5 text-red-400" />
                          ) : user.is_seller ? (
                            <Store className="h-5 w-5 text-blue-400" />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                          {user.company_name && (
                            <p className="text-xs text-slate-500">{user.company_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                    <td className="px-4 py-4">
                      {user.is_seller ? (
                        user.custom_buyer_premium_percent !== null ||
                        user.custom_seller_commission_percent !== null ? (
                          <div className="text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400">
                              Custom
                            </span>
                            <div className="mt-1 text-slate-400">
                              {user.custom_buyer_premium_percent !== null && (
                                <span>BP: {user.custom_buyer_premium_percent}%</span>
                              )}
                              {user.custom_buyer_premium_percent !== null &&
                                user.custom_seller_commission_percent !== null && (
                                  <span className="mx-1">|</span>
                                )}
                              {user.custom_seller_commission_percent !== null && (
                                <span>SC: {user.custom_seller_commission_percent}%</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Default</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.is_seller && (
                          <button
                            onClick={() => setCommissionModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/30 transition-colors"
                            title="Edit commission rates"
                          >
                            <Percent className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleVerifiedStatus(user.id, user.is_verified)}
                          disabled={actionLoading === user.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_verified
                              ? 'text-green-400 hover:bg-green-900/30'
                              : 'text-slate-400 hover:bg-slate-700'
                          }`}
                          title={user.is_verified ? 'Remove verification' : 'Verify user'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleSellerStatus(user.id, user.is_seller)}
                          disabled={actionLoading === user.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_seller
                              ? 'text-blue-400 hover:bg-blue-900/30'
                              : 'text-slate-400 hover:bg-slate-700'
                          }`}
                          title={user.is_seller ? 'Remove seller status' : 'Make seller'}
                        >
                          <Store className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          disabled={actionLoading === user.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_admin
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-slate-400 hover:bg-slate-700'
                          }`}
                          title={user.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
