'use client';

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
  Plus
} from 'lucide-react';

// Stats cards data (will be dynamic later)
const stats = [
  {
    label: 'Active Listings',
    value: '12',
    change: '+2 this week',
    icon: Package,
    color: 'blue',
  },
  {
    label: 'Total Sales',
    value: '$45,230',
    change: '+$8,500 this month',
    icon: DollarSign,
    color: 'green',
  },
  {
    label: 'Total Views',
    value: '2,847',
    change: '+340 this week',
    icon: Eye,
    color: 'purple',
  },
  {
    label: 'Active Bids',
    value: '5',
    change: '3 winning',
    icon: Gavel,
    color: 'orange',
  },
];

// Recent activity (placeholder data)
const recentActivity = [
  {
    id: '1',
    type: 'bid',
    message: 'New bid of $12,500 on your Pitney Bowes DI950',
    time: '5 minutes ago',
    urgent: true,
  },
  {
    id: '2',
    type: 'offer',
    message: 'Offer of $8,000 received on Heidelberg SM52',
    time: '1 hour ago',
    urgent: true,
  },
  {
    id: '3',
    type: 'sale',
    message: 'MBO T49 Folder sold for $15,750',
    time: '3 hours ago',
    urgent: false,
  },
  {
    id: '4',
    type: 'view',
    message: 'Your Bell & Howell Mailstar listing is trending',
    time: '5 hours ago',
    urgent: false,
  },
];

// Ending soon auctions (placeholder)
const endingSoon = [
  {
    id: '1',
    title: '2019 Pitney Bowes DI950 Inserter',
    currentBid: 12500,
    endsIn: '2h 15m',
    image: null,
  },
  {
    id: '2',
    title: 'Heidelberg SM52-2 Offset Press',
    currentBid: 35000,
    endsIn: '5h 30m',
    image: null,
  },
  {
    id: '3',
    title: 'MBO T49 4/4 Folder',
    currentBid: 15750,
    endsIn: '1d 3h',
    image: null,
  },
];

// Pending actions
const pendingActions = [
  {
    id: '1',
    type: 'offer',
    title: 'Respond to offer',
    description: '$8,000 offer on Heidelberg SM52 expires in 23 hours',
    href: '/dashboard/listings',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment pending',
    description: 'Invoice #2024-000124 awaiting buyer payment',
    href: '/dashboard/sales',
  },
  {
    id: '3',
    type: 'shipping',
    title: 'Ship item',
    description: 'MBO T49 Folder ready for shipping',
    href: '/dashboard/sales',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Listing
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${stat.color === 'blue' ? 'bg-blue-100' : ''}
                ${stat.color === 'green' ? 'bg-green-100' : ''}
                ${stat.color === 'purple' ? 'bg-purple-100' : ''}
                ${stat.color === 'orange' ? 'bg-orange-100' : ''}
              `}>
                <stat.icon className={`h-5 w-5
                  ${stat.color === 'blue' ? 'text-blue-600' : ''}
                  ${stat.color === 'green' ? 'text-green-600' : ''}
                  ${stat.color === 'purple' ? 'text-purple-600' : ''}
                  ${stat.color === 'orange' ? 'text-orange-600' : ''}
                `} />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-xs text-green-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Action Required</h2>
              <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded-full">
                {pendingActions.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900 mb-1">{action.title}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all notifications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Ending Soon */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Ending Soon</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {endingSoon.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    Current bid: <span className="font-semibold text-gray-900">${listing.currentBid.toLocaleString()}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-red-600">{listing.endsIn}</p>
                  <p className="text-xs text-gray-500">remaining</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/dashboard/listings"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-4"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.urgent ? 'bg-red-500' : 'bg-gray-300'}`} />
              <p className="flex-1 text-gray-700">{activity.message}</p>
              <p className="text-sm text-gray-500 flex-shrink-0">{activity.time}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all activity
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
