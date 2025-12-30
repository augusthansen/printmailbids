'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  Bell,
  Gavel,
  DollarSign,
  Package,
  MessageSquare,
  Truck,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  listing_id: string | null;
  invoice_id: string | null;
  offer_id: string | null;
  bid_id: string | null;
}

const notificationIcons: Record<string, React.ElementType> = {
  new_bid: Gavel,
  outbid: Gavel,
  auction_won: Gavel,
  auction_ended: Gavel,
  new_offer: DollarSign,
  offer_accepted: DollarSign,
  offer_declined: DollarSign,
  payment_received: DollarSign,
  payment_reminder: AlertCircle,
  item_shipped: Truck,
  buyer_message: MessageSquare,
  new_listing_saved_search: Package,
  default: Bell,
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Get the destination URL for a notification
  const getNotificationUrl = (notification: Notification): string | null => {
    // Message notifications go to messages
    if (notification.type === 'buyer_message') {
      return '/dashboard/messages';
    }

    // Offer notifications - route to offers page for review/action
    // Seller receives: new_offer, offer_response_needed
    // Buyer receives: offer_accepted, offer_declined, offer_countered, counter_offer
    if (['new_offer', 'offer_response_needed'].includes(notification.type)) {
      // Seller needs to review/respond to offer
      return '/dashboard/offers';
    }
    if (['offer_accepted', 'offer_declined', 'offer_countered', 'counter_offer'].includes(notification.type)) {
      // Buyer can view their offers
      return '/dashboard/my-offers';
    }

    // Bid notifications - route to appropriate bid management page
    if (notification.type === 'new_bid' || notification.type === 'reserve_met') {
      // Seller sees new bid on their listing - go to sales/listings
      return '/dashboard/listings';
    }
    if (notification.type === 'outbid') {
      // Buyer was outbid - go to their bids page to bid again
      return '/dashboard/bids';
    }

    // Auction ended/won notifications
    if (notification.type === 'auction_won' && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }
    if (notification.type === 'auction_won') {
      // If no invoice yet, go to purchases
      return '/dashboard/purchases';
    }
    if (notification.type === 'auction_ended') {
      // Seller's auction ended - go to listings
      return '/dashboard/listings';
    }

    // Payment notifications go to invoice
    if ((notification.type === 'payment_received' || notification.type === 'payment_reminder') && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }

    // Shipping notifications go to invoice
    if (notification.type === 'item_shipped' && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }

    // Payout notifications - go to sales
    if (notification.type === 'payout_processed') {
      return '/dashboard/sales';
    }

    // Review received - go to seller profile or reviews
    if (notification.type === 'review_received') {
      return '/dashboard/reviews';
    }

    // Price drop or saved search notifications - go to the listing
    if (notification.type === 'price_drop' || notification.type === 'new_listing_saved_search') {
      if (notification.listing_id) {
        return `/listing/${notification.listing_id}`;
      }
    }

    // Fallback: if we have a listing_id, go to the listing
    if (notification.listing_id) {
      return `/listing/${notification.listing_id}`;
    }

    return null;
  };

  // Handle clicking on a notification
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Navigate to destination
    const url = getNotificationUrl(notification);
    if (url) {
      router.push(url);
    }
  };

  useEffect(() => {
    async function loadNotifications() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setNotifications(data);
      }
      setLoading(false);
    }

    loadNotifications();
  }, [user?.id, authLoading, supabase]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications(notifications.filter(n => n.id !== id));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? "You're all caught up!"
              : "When you receive bids, offers, or messages, they'll appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredNotifications.map((notification, index) => {
            const Icon = notificationIcons[notification.type] || notificationIcons.default;
            const hasDestination = getNotificationUrl(notification) !== null;

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-4 p-4 transition-colors ${
                  index !== 0 ? 'border-t border-gray-100' : ''
                } ${!notification.is_read ? 'bg-blue-50/50' : ''} ${
                  hasDestination ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  !notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
