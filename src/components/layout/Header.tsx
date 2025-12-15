'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, Bell, User, Plus, ChevronDown, Loader2 } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const supabase = createClient();

  // Fetch unread notification count
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!user?.id) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    }

    fetchUnreadCount();

    // Subscribe to new notifications
    if (user?.id) {
      const channel = supabase
        .channel('notifications-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, supabase]);

  // Search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      const { data } = await supabase
        .from('listings')
        .select('id, title, current_price, starting_price')
        .eq('status', 'active')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      setSearchResults(data || []);
      setShowSearchResults(true);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, supabase]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-slate-800 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p className="hidden sm:block">List Today. Sell Tomorrow. No Waiting.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/help" className="hover:text-slate-300">Help</Link>
            <span className="text-slate-500">|</span>
            <a href="tel:1-888-555-0123" className="hover:text-slate-300">1-888-555-0123</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-slate-900">PrintMail</span>
              <span className="text-xl font-bold text-blue-600">Bids</span>
            </div>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="Search equipment..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchLoading ? (
                <Loader2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectResult(result.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                    >
                      <span className="text-gray-900 line-clamp-1">{result.title}</span>
                      <span className="text-sm text-blue-600 font-medium ml-2 flex-shrink-0">
                        ${(result.current_price || result.starting_price || 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    Search all results for &quot;{searchQuery}&quot;
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
              >
                Browse
                <ChevronDown className="h-4 w-4" />
              </button>
              {categoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      onClick={() => setCategoryMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <hr className="my-2" />
                  <Link
                    href="/auctions"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setCategoryMenuOpen(false)}
                  >
                    View All Auctions
                  </Link>
                </div>
              )}
            </div>

            <Link href="/auctions" className="text-gray-700 hover:text-blue-600">
              Auctions
            </Link>

            <Link href="/marketplace" className="text-gray-700 hover:text-blue-600">
              Buy Now
            </Link>

            {loading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : user ? (
              <>
                <Link
                  href="/sell"
                  className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Sell
                </Link>
                <Link href="/dashboard/notifications" className="relative text-gray-700 hover:text-blue-600">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  <User className="h-6 w-6" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-4" ref={mobileSearchRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              placeholder="Search equipment..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchLoading ? (
              <Loader2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            )}

            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectResult(result.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                  >
                    <span className="text-gray-900 line-clamp-1">{result.title}</span>
                    <span className="text-sm text-blue-600 font-medium ml-2 flex-shrink-0">
                      ${(result.current_price || result.starting_price || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 font-medium"
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
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <Link href="/auctions" className="block text-gray-700 hover:text-blue-600">
              Auctions
            </Link>
            <Link href="/marketplace" className="block text-gray-700 hover:text-blue-600">
              Buy Now
            </Link>
            <hr />
            <p className="text-sm font-semibold text-gray-500 uppercase">Categories</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block text-gray-700 hover:text-blue-600 pl-2"
              >
                {cat.name}
              </Link>
            ))}
            <hr />
            {user ? (
              <>
                <Link href="/sell" className="block text-blue-600 font-semibold">
                  + Sell Equipment
                </Link>
                <Link href="/dashboard" className="block text-gray-700">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700">
                  Sign In
                </Link>
                <Link href="/signup" className="block text-blue-600 font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
