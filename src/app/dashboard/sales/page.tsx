'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

type InvoiceStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
type FulfillmentStatus = 'awaiting_payment' | 'paid' | 'packaging' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'completed';

interface MockSale {
  id: string;
  invoiceNumber: string;
  listing: {
    id: string;
    title: string;
  };
  buyer: {
    name: string;
    company: string;
  };
  saleAmount: number;
  buyerPremium: number;
  totalAmount: number;
  sellerPayout: number;
  status: InvoiceStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  createdAt: string;
}

const mockSales: MockSale[] = [
  {
    id: '1',
    invoiceNumber: '2024-000125',
    listing: {
      id: '3',
      title: 'MBO T49 4/4 Folder',
    },
    buyer: {
      name: 'John Smith',
      company: 'ABC Printing Co.',
    },
    saleAmount: 15750,
    buyerPremium: 787.50,
    totalAmount: 16537.50,
    sellerPayout: 14490,
    status: 'paid',
    fulfillmentStatus: 'ready_for_pickup',
    paymentMethod: 'credit_card',
    paidAt: '2024-02-08T14:30:00Z',
    shippedAt: null,
    createdAt: '2024-02-05T10:00:00Z',
  },
  {
    id: '2',
    invoiceNumber: '2024-000124',
    listing: {
      id: '6',
      title: 'Duplo DC-645 Slitter/Cutter/Creaser',
    },
    buyer: {
      name: 'Sarah Johnson',
      company: 'PrintWorks LLC',
    },
    saleAmount: 8200,
    buyerPremium: 410,
    totalAmount: 8610,
    sellerPayout: 7544,
    status: 'pending',
    fulfillmentStatus: 'awaiting_payment',
    paymentMethod: null,
    paidAt: null,
    shippedAt: null,
    createdAt: '2024-02-10T09:00:00Z',
  },
  {
    id: '3',
    invoiceNumber: '2024-000120',
    listing: {
      id: '7',
      title: 'Hasler IM5000 Mailing System',
    },
    buyer: {
      name: 'Mike Wilson',
      company: 'Mail Masters Inc.',
    },
    saleAmount: 3500,
    buyerPremium: 175,
    totalAmount: 3675,
    sellerPayout: 3220,
    status: 'completed',
    fulfillmentStatus: 'completed',
    paymentMethod: 'ach',
    paidAt: '2024-01-28T11:00:00Z',
    shippedAt: '2024-01-30T09:00:00Z',
    createdAt: '2024-01-25T14:00:00Z',
  },
  {
    id: '4',
    invoiceNumber: '2024-000118',
    listing: {
      id: '8',
      title: 'Polar 115 Paper Cutter',
    },
    buyer: {
      name: 'David Lee',
      company: 'Precision Print',
    },
    saleAmount: 22000,
    buyerPremium: 1100,
    totalAmount: 23100,
    sellerPayout: 20240,
    status: 'shipped',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'wire',
    paidAt: '2024-01-22T16:00:00Z',
    shippedAt: '2024-02-01T10:00:00Z',
    createdAt: '2024-01-20T08:00:00Z',
  },
];

const statusConfig = {
  pending: { label: 'Payment Pending', color: 'yellow', icon: Clock },
  paid: { label: 'Paid', color: 'green', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'blue', icon: Truck },
  delivered: { label: 'Delivered', color: 'purple', icon: Package },
  completed: { label: 'Completed', color: 'gray', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
};

const fulfillmentConfig = {
  awaiting_payment: { label: 'Awaiting Payment', color: 'yellow' },
  paid: { label: 'Ready to Ship', color: 'green' },
  packaging: { label: 'Packaging', color: 'blue' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'purple' },
  shipped: { label: 'In Transit', color: 'blue' },
  delivered: { label: 'Delivered', color: 'green' },
  completed: { label: 'Completed', color: 'gray' },
};

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = mockSales.filter((sale) => {
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesSearch =
      sale.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.buyer.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = mockSales
    .filter(s => s.status !== 'cancelled')
    .reduce((acc, s) => acc + s.sellerPayout, 0);

  const pendingPayments = mockSales
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + s.sellerPayout, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track your sales and payouts</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-xl font-bold text-gray-900">${pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready to Ship</p>
              <p className="text-xl font-bold text-gray-900">
                {mockSales.filter(s => s.fulfillmentStatus === 'ready_for_pickup' || s.fulfillmentStatus === 'paid').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Sales</p>
              <p className="text-xl font-bold text-gray-900">
                {mockSales.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice, item, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice / Item
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Payout
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fulfillment
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => {
                const status = statusConfig[sale.status];
                const fulfillment = fulfillmentConfig[sale.fulfillmentStatus];
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">#{sale.invoiceNumber}</p>
                        <Link
                          href={`/listing/${sale.listing.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 truncate block max-w-xs"
                        >
                          {sale.listing.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(sale.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{sale.buyer.name}</p>
                        <p className="text-sm text-gray-500">{sale.buyer.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">${sale.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          Sale: ${sale.saleAmount.toLocaleString()} + Premium: ${sale.buyerPremium.toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-green-600">${sale.sellerPayout.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${fulfillment.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${fulfillment.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${fulfillment.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${fulfillment.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${fulfillment.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {fulfillment.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/sales/${sale.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredSales.map((sale) => {
            const status = statusConfig[sale.status];
            const fulfillment = fulfillmentConfig[sale.fulfillmentStatus];
            return (
              <div key={sale.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">#{sale.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.createdAt)}</p>
                  </div>
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
                </div>
                <Link
                  href={`/listing/${sale.listing.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium block mb-2"
                >
                  {sale.listing.title}
                </Link>
                <p className="text-sm text-gray-600 mb-3">
                  Buyer: {sale.buyer.name} ({sale.buyer.company})
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Your Payout</p>
                    <p className="font-bold text-green-600">${sale.sellerPayout.toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/dashboard/sales/${sale.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSales.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sales found</p>
          </div>
        )}
      </div>
    </div>
  );
}
