'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  CreditCard,
  AlertCircle,
  MapPin
} from 'lucide-react';

type PurchaseStatus = 'won' | 'payment_pending' | 'paid' | 'shipped' | 'delivered' | 'completed';

interface MockPurchase {
  id: string;
  invoiceNumber: string;
  listing: {
    id: string;
    title: string;
    image: string | null;
  };
  seller: {
    name: string;
    company: string;
    rating: number;
  };
  winningBid: number;
  buyerPremium: number;
  shippingCost: number | null;
  totalAmount: number;
  status: PurchaseStatus;
  paymentDueDate: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  deliveredAt: string | null;
  wonAt: string;
  pickupLocation: string;
}

const mockPurchases: MockPurchase[] = [
  {
    id: '1',
    invoiceNumber: '2024-000130',
    listing: {
      id: '10',
      title: 'Kern 3500 Multi-Mailer Inserter',
      image: null,
    },
    seller: {
      name: 'Equipment Depot',
      company: 'Equipment Depot Inc.',
      rating: 4.8,
    },
    winningBid: 28000,
    buyerPremium: 1400,
    shippingCost: null,
    totalAmount: 29400,
    status: 'payment_pending',
    paymentDueDate: '2024-02-17',
    paidAt: null,
    shippedAt: null,
    trackingNumber: null,
    deliveredAt: null,
    wonAt: '2024-02-10T15:30:00Z',
    pickupLocation: 'Chicago, IL',
  },
  {
    id: '2',
    invoiceNumber: '2024-000128',
    listing: {
      id: '11',
      title: 'Heidelberg Speedmaster XL 75',
      image: null,
    },
    seller: {
      name: 'Press Sales USA',
      company: 'Press Sales USA LLC',
      rating: 4.9,
    },
    winningBid: 125000,
    buyerPremium: 6250,
    shippingCost: 8500,
    totalAmount: 139750,
    status: 'shipped',
    paymentDueDate: '2024-02-12',
    paidAt: '2024-02-08T10:00:00Z',
    shippedAt: '2024-02-12T09:00:00Z',
    trackingNumber: 'RDRK-2024-445566',
    deliveredAt: null,
    wonAt: '2024-02-05T18:00:00Z',
    pickupLocation: 'Dallas, TX',
  },
  {
    id: '3',
    invoiceNumber: '2024-000115',
    listing: {
      id: '12',
      title: 'Polar 92 Paper Cutter',
      image: null,
    },
    seller: {
      name: 'PrintTech Solutions',
      company: 'PrintTech Solutions',
      rating: 4.7,
    },
    winningBid: 12500,
    buyerPremium: 625,
    shippingCost: 1200,
    totalAmount: 14325,
    status: 'completed',
    paymentDueDate: '2024-01-28',
    paidAt: '2024-01-25T14:00:00Z',
    shippedAt: '2024-01-28T11:00:00Z',
    trackingNumber: 'RDRK-2024-112233',
    deliveredAt: '2024-02-02T16:00:00Z',
    wonAt: '2024-01-21T20:00:00Z',
    pickupLocation: 'Atlanta, GA',
  },
  {
    id: '4',
    invoiceNumber: '2024-000110',
    listing: {
      id: '13',
      title: 'Bell & Howell Inserter System',
      image: null,
    },
    seller: {
      name: 'Mail Equipment Co',
      company: 'Mail Equipment Company',
      rating: 4.5,
    },
    winningBid: 9800,
    buyerPremium: 490,
    shippingCost: 850,
    totalAmount: 11140,
    status: 'completed',
    paymentDueDate: '2024-01-20',
    paidAt: '2024-01-18T09:00:00Z',
    shippedAt: '2024-01-20T14:00:00Z',
    trackingNumber: 'RDRK-2024-998877',
    deliveredAt: '2024-01-25T10:00:00Z',
    wonAt: '2024-01-13T19:00:00Z',
    pickupLocation: 'Phoenix, AZ',
  },
];

const statusConfig = {
  won: { label: 'Won', color: 'green', icon: CheckCircle },
  payment_pending: { label: 'Payment Due', color: 'yellow', icon: CreditCard },
  paid: { label: 'Paid', color: 'blue', icon: CheckCircle },
  shipped: { label: 'In Transit', color: 'purple', icon: Truck },
  delivered: { label: 'Delivered', color: 'green', icon: Package },
  completed: { label: 'Completed', color: 'gray', icon: CheckCircle },
};

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPurchases = mockPurchases.filter((purchase) => {
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    const matchesSearch =
      purchase.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.seller.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalSpent = mockPurchases
    .filter(p => p.status !== 'payment_pending')
    .reduce((acc, p) => acc + p.totalAmount, 0);

  const pendingPayment = mockPurchases
    .filter(p => p.status === 'payment_pending')
    .reduce((acc, p) => acc + p.totalAmount, 0);

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
              <p className="text-xl font-bold text-gray-900">{mockPurchases.length}</p>
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
                {mockPurchases.filter(p => p.status === 'shipped').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required Alert */}
      {mockPurchases.some(p => p.status === 'payment_pending') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Payment Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {mockPurchases.filter(p => p.status === 'payment_pending').length} purchase(s)
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
              placeholder="Search by invoice, item, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="payment_pending">Payment Due</option>
              <option value="paid">Paid</option>
              <option value="shipped">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchases list */}
      <div className="space-y-4">
        {filteredPurchases.map((purchase) => {
          const status = statusConfig[purchase.status];
          const daysUntilDue = getDaysUntilDue(purchase.paymentDueDate);

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
                        ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className="text-sm text-gray-500">#{purchase.invoiceNumber}</span>
                    </div>
                    <Link
                      href={`/listing/${purchase.listing.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {purchase.listing.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Seller: {purchase.seller.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {purchase.pickupLocation}
                      </span>
                      <span>Won: {formatDate(purchase.wonAt)}</span>
                    </div>
                  </div>

                  {/* Price and action */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${purchase.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bid: ${purchase.winningBid.toLocaleString()} + Premium: ${purchase.buyerPremium.toLocaleString()}
                        {purchase.shippingCost && ` + Shipping: $${purchase.shippingCost.toLocaleString()}`}
                      </p>
                    </div>

                    {purchase.status === 'payment_pending' && (
                      <div className="flex flex-col items-end gap-2">
                        {daysUntilDue !== null && (
                          <p className={`text-sm font-medium ${daysUntilDue <= 2 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {daysUntilDue <= 0 ? 'Payment overdue!' : `Due in ${daysUntilDue} days`}
                          </p>
                        )}
                        <Link
                          href={`/dashboard/purchases/${purchase.id}/pay`}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Now
                        </Link>
                      </div>
                    )}

                    {purchase.status === 'shipped' && purchase.trackingNumber && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Tracking</p>
                        <p className="text-sm font-medium text-blue-600">{purchase.trackingNumber}</p>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/purchases/${purchase.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>

              {/* Progress bar for shipped items */}
              {(purchase.status === 'shipped' || purchase.status === 'delivered') && (
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
                          width: purchase.status === 'shipped' ? '66%' : '100%'
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
            <p className="text-gray-500 mb-2">No purchases found</p>
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
