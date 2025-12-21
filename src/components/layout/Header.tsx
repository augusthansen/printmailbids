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
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut, profileName } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
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
            <a href="tel:1-888-555-0123" className="text-slate-400 hover:text-white transition-colors">1-888-555-0123</a>
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
                  <hr className="my-2 border-stone-200" />
                  <Link
                    href="/auctions"
                    className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setCategoryMenuOpen(false)}
                  >
                    View All Auctions
                  </Link>
                </div>
              )}
            </div>

            <Link href="/auctions" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
              Auctions
            </Link>

            <Link href="/marketplace" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
              Buy Now
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
                  <Link
                    href="/dashboard/bids"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="My Bids"
                  >
                    <Gavel className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/dashboard/watchlist"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Watchlist"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
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
                href="/auctions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center bg-slate-800 text-slate-200 hover:text-blue-400 font-medium py-2.5 rounded-lg transition-colors"
              >
                Auctions
              </Link>
              <Link
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center bg-slate-800 text-slate-200 hover:text-blue-400 font-medium py-2.5 rounded-lg transition-colors"
              >
                Buy Now
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
