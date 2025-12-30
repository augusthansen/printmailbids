'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Bell,
  User,
  Plus,
  ChevronDown,
  Loader2,
  LogOut,
  LayoutDashboard,
  Gavel,
  Heart,
  MessageSquare,
  Package,
  Settings,
  FileText,
  ShoppingBag,
  Check,
  Trash2,
  DollarSign,
  Truck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  listing_id: string | null;
  invoice_id: string | null;
}

interface Bid {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    current_price: number;
    end_time: string;
    status: string;
  };
}

interface WatchlistItem {
  id: string;
  listing: {
    id: string;
    title: string;
    current_price: number;
    starting_price: number;
    end_time: string;
    status: string;
    images: { url: string }[];
  };
}

interface Message {
  id: string;
  listing_id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  listing: {
    id: string;
    title: string;
  };
  participant_1: {
    full_name: string;
    company_name: string;
  };
  participant_2: {
    full_name: string;
    company_name: string;
  };
  messages: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  }[];
}

const categories = [
  { name: 'Mailing & Fulfillment', slug: 'mailing-fulfillment' },
  { name: 'Printing', slug: 'printing' },
  { name: 'Bindery & Finishing', slug: 'bindery-finishing' },
  { name: 'Packaging', slug: 'packaging' },
  { name: 'Material Handling', slug: 'material-handling' },
  { name: 'Parts & Supplies', slug: 'parts-supplies' },
];

interface SearchSuggestion {
  id: string;
  title: string;
  current_price: number | null;
  starting_price: number | null;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isMarketplacePage = pathname === '/marketplace';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bidsOpen, setBidsOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut, profileName } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const bidsRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch unread notification count - wait for auth to be loaded
  useEffect(() => {
    // Don't fetch if still loading auth
    if (loading) return;

    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const userId = user.id;

    async function fetchUnreadCount() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    }

    fetchUnreadCount();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, user?.id, supabase]);

  // Search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, current_price, starting_price')
          .eq('status', 'active')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
        }
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, supabase]);

  // Close search results and menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (bidsRef.current && !bidsRef.current.contains(event.target as Node)) {
        setBidsOpen(false);
      }
      if (watchlistRef.current && !watchlistRef.current.contains(event.target as Node)) {
        setWatchlistOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setMessagesOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleSelectResult = (listingId: string) => {
    router.push(`/listing/${listingId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Load notifications when dropdown opens
  const loadNotifications = async () => {
    if (!user?.id) return;

    setNotificationsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setNotifications(data);
    }
    setNotificationsLoading(false);
  };

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    if (!notificationsOpen) {
      loadNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  // Mark notification as read
  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const notification = notifications.find(n => n.id === id);

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications(notifications.filter(n => n.id !== id));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Get notification destination URL
  const getNotificationUrl = (notification: Notification): string | null => {
    if (notification.type === 'buyer_message') {
      return '/dashboard/messages';
    }
    if (notification.type === 'auction_won' && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }
    if ((notification.type === 'payment_received' || notification.type === 'payment_reminder') && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }
    if (notification.type === 'item_shipped' && notification.invoice_id) {
      return `/dashboard/invoices/${notification.invoice_id}`;
    }
    if (notification.listing_id) {
      return `/listing/${notification.listing_id}`;
    }
    return null;
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification.id);

      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const url = getNotificationUrl(notification);
    if (url) {
      setNotificationsOpen(false);
      router.push(url);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_bid':
      case 'outbid':
      case 'auction_won':
      case 'auction_ended':
        return <Gavel className="h-4 w-4 text-blue-600" />;
      case 'new_offer':
      case 'offer_accepted':
      case 'offer_declined':
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'payment_reminder':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'item_shipped':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'buyer_message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  // Load bids when dropdown opens
  const loadBids = async () => {
    if (!user?.id) return;

    setBidsLoading(true);
    const { data } = await supabase
      .from('bids')
      .select(`
        id, amount, status, created_at,
        listing:listings(id, title, current_price, end_time, status)
      `)
      .eq('bidder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setBids(data as unknown as Bid[]);
    }
    setBidsLoading(false);
  };

  // Toggle bids dropdown
  const toggleBids = () => {
    if (!bidsOpen) {
      loadBids();
    }
    setBidsOpen(!bidsOpen);
  };

  // Load watchlist when dropdown opens
  const loadWatchlist = async () => {
    if (!user?.id) return;

    setWatchlistLoading(true);
    const { data } = await supabase
      .from('watchlist')
      .select(`
        id,
        listing:listings(id, title, current_price, starting_price, end_time, status, images:listing_images(url))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setWatchlist(data as unknown as WatchlistItem[]);
    }
    setWatchlistLoading(false);
  };

  // Toggle watchlist dropdown
  const toggleWatchlist = () => {
    if (!watchlistOpen) {
      loadWatchlist();
    }
    setWatchlistOpen(!watchlistOpen);
  };

  // Load messages when dropdown opens
  const loadMessages = async () => {
    if (!user?.id) return;

    setMessagesLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, listing_id, participant_1_id, participant_2_id, last_message_at,
        listing:listings(id, title),
        participant_1:profiles!conversations_participant_1_id_fkey(full_name, company_name),
        participant_2:profiles!conversations_participant_2_id_fkey(full_name, company_name),
        messages(content, created_at, sender_id, is_read)
      `)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (data) {
      setMessages(data as unknown as Message[]);
      // Count unread messages
      let unread = 0;
      data.forEach((conv: Message) => {
        if (conv.messages) {
          conv.messages.forEach((msg) => {
            if (!msg.is_read && msg.sender_id !== user.id) {
              unread++;
            }
          });
        }
      });
      setUnreadMessagesCount(unread);
    }
    setMessagesLoading(false);
  };

  // Toggle messages dropdown
  const toggleMessages = () => {
    if (!messagesOpen) {
      loadMessages();
    }
    setMessagesOpen(!messagesOpen);
  };

  // Get time remaining for auctions
  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-stone-200/50">
      {/* Top bar - hidden on mobile for cleaner look */}
      <div className="hidden sm:block bg-slate-900 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p className="text-slate-300">
            <span className="text-blue-400 font-medium">List Today.</span> Sell Tomorrow. No Waiting.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/help" className="text-slate-400 hover:text-white transition-colors">Help</Link>
            <span className="text-slate-600">|</span>
            <a href="tel:1-877-450-7756" className="text-slate-400 hover:text-white transition-colors">(877) 450-7756</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section: Logo (desktop) or hamburger (mobile) */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 mr-2 text-slate-700 hover:text-blue-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <span className="text-white font-bold text-sm md:text-lg tracking-tight">PMB</span>
              </div>
              <div>
                <span className="text-lg md:text-xl font-bold text-slate-900">PrintMail</span>
                <span className="text-lg md:text-xl font-bold text-blue-600">Bids</span>
              </div>
            </Link>
          </div>

          {/* Search bar - desktop only (hidden on marketplace page) */}
          <div className={`${isMarketplacePage ? 'hidden' : 'hidden md:flex'} flex-1 max-w-xl mx-8`} ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="Search equipment..."
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
              />
              {searchLoading ? (
                <Loader2 className="absolute left-3 top-3 h-5 w-5 text-stone-400 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-3 h-5 w-5 text-stone-400" />
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectResult(result.id)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b border-stone-100 last:border-0 transition-colors"
                    >
                      <span className="text-slate-900 line-clamp-1">{result.title}</span>
                      <span className="text-sm text-blue-600 font-semibold ml-2 flex-shrink-0">
                        ${(result.current_price || result.starting_price || 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                  >
                    Search all results for &quot;{searchQuery}&quot;
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-5">
            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Browse
                <ChevronDown className="h-4 w-4" />
              </button>
              {categoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => setCategoryMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/marketplace" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
              Marketplace
            </Link>

            {loading ? (
              <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
            ) : user ? (
              <>
                {/* Dashboard quick link */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* Sell button */}
                <Link
                  href="/sell"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Sell
                </Link>

                {/* Quick access icons */}
                <div className="flex items-center gap-0.5">
                  {/* Bids dropdown */}
                  <div className="relative" ref={bidsRef}>
                    <button
                      onClick={toggleBids}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="My Bids"
                    >
                      <Gavel className="h-5 w-5" />
                    </button>
                    {bidsOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                          <h3 className="font-semibold text-slate-900">My Bids</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {bidsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            </div>
                          ) : bids.length === 0 ? (
                            <div className="py-8 text-center">
                              <Gavel className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                              <p className="text-stone-500 text-sm">No bids yet</p>
                              <p className="text-xs text-stone-400 mt-1">Your bids will appear here</p>
                            </div>
                          ) : (
                            bids.map((bid) => (
                              <Link
                                key={bid.id}
                                href={`/listing/${bid.listing?.id}`}
                                onClick={() => setBidsOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                              >
                                <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                  <Gavel className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {bid.listing?.title || 'Listing'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-blue-600">
                                      ${bid.amount.toLocaleString()}
                                    </span>
                                    {bid.listing?.status === 'active' && bid.listing?.end_time && (
                                      <span className="text-xs text-stone-500">
                                        {getTimeRemaining(bid.listing.end_time)} left
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50/50">
                          <Link
                            href="/dashboard/bids"
                            onClick={() => setBidsOpen(false)}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all bids
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Watchlist dropdown */}
                  <div className="relative" ref={watchlistRef}>
                    <button
                      onClick={toggleWatchlist}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Watchlist"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                    {watchlistOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                          <h3 className="font-semibold text-slate-900">Watchlist</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {watchlistLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            </div>
                          ) : watchlist.length === 0 ? (
                            <div className="py-8 text-center">
                              <Heart className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                              <p className="text-stone-500 text-sm">No items in watchlist</p>
                              <p className="text-xs text-stone-400 mt-1">Save items you&apos;re interested in</p>
                            </div>
                          ) : (
                            watchlist.map((item) => (
                              <Link
                                key={item.id}
                                href={`/listing/${item.listing?.id}`}
                                onClick={() => setWatchlistOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                              >
                                <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {item.listing?.images?.[0]?.url ? (
                                    <img
                                      src={item.listing.images[0].url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-5 w-5 text-stone-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {item.listing?.title || 'Listing'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-blue-600">
                                      ${(item.listing?.current_price || item.listing?.starting_price || 0).toLocaleString()}
                                    </span>
                                    {item.listing?.status === 'active' && item.listing?.end_time && (
                                      <span className="text-xs text-stone-500">
                                        {getTimeRemaining(item.listing.end_time)} left
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50/50">
                          <Link
                            href="/dashboard/watchlist"
                            onClick={() => setWatchlistOpen(false)}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View full watchlist
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Messages dropdown */}
                  <div className="relative" ref={messagesRef}>
                    <button
                      onClick={toggleMessages}
                      className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Messages"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                          {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </span>
                      )}
                    </button>
                    {messagesOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                          <h3 className="font-semibold text-slate-900">Messages</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {messagesLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="py-8 text-center">
                              <MessageSquare className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                              <p className="text-stone-500 text-sm">No messages</p>
                              <p className="text-xs text-stone-400 mt-1">Start a conversation with a seller</p>
                            </div>
                          ) : (
                            messages.map((conv) => {
                              const otherParticipant = conv.participant_1_id === user?.id
                                ? conv.participant_2
                                : conv.participant_1;
                              const lastMessage = conv.messages?.[0];
                              const hasUnread = conv.messages?.some(m => !m.is_read && m.sender_id !== user?.id);

                              return (
                                <Link
                                  key={conv.id}
                                  href={`/dashboard/messages/${conv.id}`}
                                  onClick={() => setMessagesOpen(false)}
                                  className={`flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors ${
                                    hasUnread ? 'bg-blue-50/50' : ''
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${hasUnread ? 'bg-blue-100' : 'bg-stone-100'}`}>
                                    <MessageSquare className={`h-4 w-4 ${hasUnread ? 'text-blue-600' : 'text-stone-500'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                      {otherParticipant?.company_name || otherParticipant?.full_name || 'User'}
                                    </p>
                                    <p className="text-xs text-stone-500 truncate mt-0.5">
                                      {conv.listing?.title || 'Listing'}
                                    </p>
                                    {lastMessage && (
                                      <p className="text-xs text-stone-400 truncate mt-1">
                                        {lastMessage.content}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs text-stone-400 flex-shrink-0">
                                    {formatTimeAgo(conv.last_message_at)}
                                  </span>
                                </Link>
                              );
                            })
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50/50">
                          <Link
                            href="/dashboard/messages"
                            onClick={() => setMessagesOpen(false)}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all messages
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notifications dropdown */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={toggleNotifications}
                      className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                          <h3 className="font-semibold text-slate-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-80 overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="py-8 text-center">
                              <Bell className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                              <p className="text-stone-500 text-sm">No notifications</p>
                            </div>
                          ) : (
                            notifications.map((notification) => {
                              const hasDestination = getNotificationUrl(notification) !== null;
                              return (
                                <div
                                  key={notification.id}
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0 transition-colors ${
                                    !notification.is_read ? 'bg-blue-50/50' : ''
                                  } ${hasDestination ? 'cursor-pointer hover:bg-stone-50' : ''}`}
                                >
                                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                                    !notification.is_read ? 'bg-blue-100' : 'bg-stone-100'
                                  }`}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                                      {notification.title}
                                    </p>
                                    {notification.body && (
                                      <p className="text-xs text-stone-500 truncate mt-0.5">
                                        {notification.body}
                                      </p>
                                    )}
                                    <p className="text-xs text-stone-400 mt-1">
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {!notification.is_read && (
                                      <button
                                        onClick={(e) => markAsRead(notification.id, e)}
                                        className="p-1 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Mark as read"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => deleteNotification(notification.id, e)}
                                      className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50/50">
                          <Link
                            href="/dashboard/notifications"
                            onClick={() => setNotificationsOpen(false)}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50 rounded-t-xl">
                        <p className="font-medium text-slate-900 truncate">{profileName || user.email}</p>
                        <p className="text-xs text-stone-500 truncate">{profileName ? user.email : 'Signed in'}</p>
                      </div>

                      {/* Buying section */}
                      <div className="py-1">
                        <p className="px-4 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">Buying</p>
                        <Link
                          href="/dashboard/bids"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Gavel className="h-4 w-4" />
                          My Bids
                        </Link>
                        <Link
                          href="/dashboard/watchlist"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          Watchlist
                        </Link>
                        <Link
                          href="/dashboard/purchases"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Purchases
                        </Link>
                      </div>

                      {/* Selling section */}
                      <div className="py-1 border-t border-stone-200">
                        <p className="px-4 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">Selling</p>
                        <Link
                          href="/dashboard/listings"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          My Listings
                        </Link>
                        <Link
                          href="/dashboard/sales"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FileText className="h-4 w-4" />
                          Sales & Invoices
                        </Link>
                      </div>

                      {/* Account section */}
                      <div className="py-1 border-t border-stone-200">
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

        </div>

        {/* Mobile search (hidden on marketplace page) */}
        <div className={`${isMarketplacePage ? 'hidden' : 'md:hidden'} pb-3`} ref={mobileSearchRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              placeholder="Search equipment..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-stone-50/50 placeholder:text-stone-400 transition-all"
            />
            {searchLoading ? (
              <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            )}

            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectResult(result.id)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b border-stone-100 last:border-0 transition-colors"
                  >
                    <span className="text-slate-900 line-clamp-1">{result.title}</span>
                    <span className="text-sm text-blue-600 font-semibold ml-2 flex-shrink-0">
                      ${(result.current_price || result.starting_price || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                >
                  Search all results for &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 max-h-[calc(100vh-60px)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {/* Main Navigation */}
            <div className="flex gap-2 pb-3">
              <Link
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center bg-slate-800 text-slate-200 hover:text-blue-400 font-medium py-2.5 rounded-lg transition-colors"
              >
                Marketplace
              </Link>
            </div>

            {/* Categories */}
            <div className="py-2 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Categories</p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-slate-300 hover:text-blue-400 py-1.5 px-2 rounded hover:bg-slate-800 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {user ? (
              <>
                {/* Sell CTA */}
                <div className="py-3 border-t border-slate-800">
                  <Link
                    href="/sell"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Sell Equipment
                  </Link>
                </div>

                {/* Dashboard Quick Links */}
                <div className="py-2 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dashboard</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <LayoutDashboard className="h-4 w-4" /> Overview
                    </Link>
                    <Link href="/dashboard/bids" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <Gavel className="h-4 w-4" /> My Bids
                    </Link>
                    <Link href="/dashboard/watchlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <Heart className="h-4 w-4" /> Watchlist
                    </Link>
                    <Link href="/dashboard/listings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <Package className="h-4 w-4" /> Listings
                    </Link>
                    <Link href="/dashboard/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <MessageSquare className="h-4 w-4" /> Messages
                    </Link>
                    <Link href="/dashboard/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 py-2 px-2 rounded hover:bg-slate-800 transition-colors">
                      <Bell className="h-4 w-4" /> Notifications
                      {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="py-3 border-t border-slate-800 flex gap-2">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-300 hover:text-blue-400 py-2 rounded-lg bg-slate-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 py-2 rounded-lg bg-slate-800 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="py-3 border-t border-slate-800 space-y-2">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-slate-300 hover:text-blue-400 font-medium py-2.5 rounded-lg bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
