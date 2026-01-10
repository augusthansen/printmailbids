'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Grid,
  List,
  Clock,
  MapPin,
  Heart,
  Package,
  X,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  make: string;
  model: string;
  year: number | null;
  listing_type: string;
  current_price: number | null;
  starting_price: number;
  bid_count: number;
  view_count: number;
  watch_count: number;
  end_time: string | null;
  condition: string;
  equipment_status: string;
  reserve_price: number | null;
  status: string;
  seller_id: string;
  category?: {
    name: string;
    slug: string;
  };
  images?: {
    url: string;
    is_primary: boolean;
  }[];
  seller?: {
    id: string;
    company_name: string | null;
    full_name: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const sortOptions = [
  { id: 'ending-soon', name: 'Ending Soon' },
  { id: 'newest', name: 'Newest' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'most-bids', name: 'Most Bids' },
];

function MarketplaceContent() {
  const supabase = createClient();
  const router = useRouter();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlType = searchParams.get('type') as 'all' | 'auction' | null; // fixed_price removed
  const urlSort = searchParams.get('sort') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState(urlSort || 'ending-soon');
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'auction'>(urlType || 'all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed' | 'all'>('active');

  // Update URL when filters change
  const updateUrl = useCallback((search: string, category: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    const queryString = params.toString();
    router.push(`/marketplace${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Update category when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Handle category change - update URL
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateUrl(searchQuery, category);
  };

  // Handle search submit - triggers the search immediately
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Force a re-render by updating state - the useEffect will pick up searchQuery
    updateUrl(searchQuery, selectedCategory);
  };

  // Debounced search value to prevent too many re-fetches while typing
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('sort_order');

        if (catError) {
          console.error('Failed to load categories:', catError);
        } else if (catData) {
          setCategories(catData);
        }

        // Build listing query
        let query = supabase
          .from('listings')
          .select(`
            *,
            category:categories!listings_primary_category_id_fkey(name, slug),
            images:listing_images(url, is_primary),
            seller:profiles!listings_seller_id_fkey(id, company_name, full_name)
          `);

        // Apply status filter
        if (statusFilter === 'active') {
          query = query.in('status', ['active', 'scheduled']);
        } else if (statusFilter === 'closed') {
          query = query.in('status', ['ended', 'sold', 'cancelled']);
        }
        // 'all' shows everything

        // Apply category filter
        if (selectedCategory !== 'all' && catData) {
          const cat = catData.find((c: Category) => c.slug === selectedCategory);
          if (cat) {
            query = query.eq('primary_category_id', cat.id);
          }
        }

        // Apply listing type filter (all listings are now auctions)
        if (listingTypeFilter === 'auction') {
          query = query.in('listing_type', ['auction', 'auction_with_offers']);
        }
        // 'fixed_price' filter is no longer supported - all listings are auctions

        // Apply sorting
        switch (sortBy) {
          case 'ending-soon':
            query = query.order('end_time', { ascending: true, nullsFirst: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price-low':
            query = query.order('starting_price', { ascending: true });
            break;
          case 'price-high':
            query = query.order('starting_price', { ascending: false });
            break;
          case 'most-bids':
            query = query.order('bid_count', { ascending: false });
            break;
        }

        const { data: listingData, error: listingError } = await query;

        if (listingError) {
          console.error('Failed to load listings:', listingError);
          setListings([]);
        } else if (listingData) {
          // Apply client-side filters
          let filtered = listingData as unknown as Listing[];

          // Filter by end time for active listings (database status might not be updated)
          if (statusFilter === 'active') {
            const now = new Date();
            filtered = filtered.filter(l => {
              // Keep if no end_time (fixed price) or end_time hasn't passed
              if (!l.end_time) return true;
              return new Date(l.end_time) > now;
            });
          } else if (statusFilter === 'closed') {
            const now = new Date();
            filtered = filtered.filter(l => {
              // Include if end_time has passed OR status is ended/sold/cancelled
              if (l.status === 'ended' || l.status === 'sold' || l.status === 'cancelled') return true;
              if (l.end_time && new Date(l.end_time) <= now) return true;
              return false;
            });
          }

          // Search filter
          if (debouncedSearch && debouncedSearch.trim()) {
            const search = debouncedSearch.toLowerCase().trim();
            filtered = filtered.filter(l =>
              l.title?.toLowerCase().includes(search) ||
              l.make?.toLowerCase().includes(search) ||
              l.model?.toLowerCase().includes(search) ||
              l.description?.toLowerCase().includes(search)
            );
          }

          // Price filter
          if (priceRange.min) {
            const minPrice = parseInt(priceRange.min);
            filtered = filtered.filter(l => {
              const price = l.current_price || l.starting_price || 0;
              return price >= minPrice;
            });
          }
          if (priceRange.max) {
            const maxPrice = parseInt(priceRange.max);
            filtered = filtered.filter(l => {
              const price = l.current_price || l.starting_price || 0;
              return price <= maxPrice;
            });
          }

          setListings(filtered);
        }
      } catch (err) {
        console.error('Marketplace load error:', err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, selectedCategory, sortBy, listingTypeFilter, statusFilter, debouncedSearch, priceRange.min, priceRange.max]);

  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isEndingSoon = (endsAt: string | null) => {
    if (!endsAt) return false;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  };

  const getPrimaryImage = (listing: Listing) => {
    if (!listing.images || listing.images.length === 0) return null;
    const primary = listing.images.find(img => img.is_primary);
    return primary?.url || listing.images[0]?.url;
  };

  const getPrice = (listing: Listing) => {
    return listing.current_price || listing.starting_price || 0;
  };

  const reserveMet = (listing: Listing) => {
    if (!listing.reserve_price) return true;
    const currentPrice = listing.current_price || listing.starting_price || 0;
    return currentPrice >= listing.reserve_price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero / Search Header */}
      <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight font-display">
              Find Your <span className="text-blue-400">Equipment</span>
            </h1>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto">
              Browse thousands of printing, mailing, and industrial equipment listings from trusted sellers.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by make, model, or keyword..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-stone-50 text-slate-900 placeholder-stone-400 border border-stone-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none focus:bg-white transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
                >
                  <Search className="h-5 w-5" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilters(!showFilters);
                    // On desktop, scroll to filters section
                    const filtersSection = document.getElementById('filters-section');
                    if (filtersSection && window.innerWidth >= 1024) {
                      filtersSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-slate-700 px-4 py-3.5 rounded-xl font-medium transition-colors"
                >
                  <Filter className="h-5 w-5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-stone-400">
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4 text-blue-400" />
                {listings.length} Active Listings
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                Updated Live
              </span>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside id="filters-section" className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-stone-500 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === 'all'}
                      onChange={() => handleCategoryChange('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => handleCategoryChange(cat.slug)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Listing Type */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Listing Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      checked={listingTypeFilter === 'all'}
                      onChange={() => setListingTypeFilter('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">All Auctions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      checked={listingTypeFilter === 'auction'}
                      onChange={() => setListingTypeFilter('auction')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Auctions (accepts offers)</span>
                  </label>
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={statusFilter === 'active'}
                      onChange={() => setStatusFilter('active')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Active Listings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={statusFilter === 'closed'}
                      onChange={() => setStatusFilter('closed')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Closed / Ended</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={statusFilter === 'all'}
                      onChange={() => setStatusFilter('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">All</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-stone-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setListingTypeFilter('all');
                  setStatusFilter('active');
                  setPriceRange({ min: '', max: '' });
                  setSearchQuery('');
                  router.push('/marketplace', { scroll: false });
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-stone-600">
                <span className="font-medium text-slate-900">{listings.length}</span> listings found
              </p>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-stone-500 hover:text-slate-700 hover:bg-stone-50'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-stone-500 hover:text-slate-700 hover:bg-stone-50'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Listings Grid */}
            {viewMode === 'grid' ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all group"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                      {getPrimaryImage(listing) ? (
                        <img src={getPrimaryImage(listing)!} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-stone-300" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isEndingSoon(listing.end_time) && (
                          <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                            Ending Soon
                          </span>
                        )}
                        {listing.reserve_price && !reserveMet(listing) && (
                          <span className="bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                            Reserve Not Met
                          </span>
                        )}
                      </div>

                      {/* Watchlist button */}
                      <button className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                        <Heart className="h-5 w-5 text-slate-600" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        {listing.category && (
                          <p className="text-sm text-blue-600 font-medium">{listing.category.name}</p>
                        )}
                        {listing.seller && (
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/seller/${listing.seller!.id}`;
                            }}
                            className="text-xs text-stone-500 hover:text-blue-600 cursor-pointer truncate max-w-[120px]"
                            title={listing.seller.company_name || listing.seller.full_name || 'Seller'}
                          >
                            {listing.seller.company_name || listing.seller.full_name || 'Seller'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {listing.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-stone-500">Current Bid</p>
                          <p className="text-xl font-bold text-slate-900">
                            ${getPrice(listing).toLocaleString()}
                          </p>
                          <p className="text-xs text-stone-500">{listing.bid_count || 0} bids</p>
                        </div>

                        {listing.end_time && (
                          <div className="text-right">
                            <p className="text-xs text-stone-500">Time Left</p>
                            <p className={`text-sm font-semibold ${isEndingSoon(listing.end_time) ? 'text-red-600' : 'text-slate-900'}`}>
                              {getTimeRemaining(listing.end_time)}
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-4 flex gap-4 hover:shadow-lg hover:border-blue-200 transition-all group"
                  >
                    {/* Image */}
                    <div className="w-32 h-32 bg-stone-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {getPrimaryImage(listing) ? (
                        <img src={getPrimaryImage(listing)!} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="h-8 w-8 text-stone-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {listing.category && (
                              <p className="text-sm text-blue-600 font-medium">{listing.category.name}</p>
                            )}
                            {listing.seller && (
                              <>
                                <span className="text-stone-300">•</span>
                                <span
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/seller/${listing.seller!.id}`;
                                  }}
                                  className="text-sm text-stone-500 hover:text-blue-600 cursor-pointer"
                                >
                                  {listing.seller.company_name || listing.seller.full_name || 'Seller'}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                            {listing.condition && <span className="capitalize">{listing.condition}</span>}
                            {listing.equipment_status && (
                              <span className="capitalize">{listing.equipment_status.replace(/_/g, ' ')}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-stone-500">Current Bid</p>
                          <p className="text-xl font-bold text-slate-900">
                            ${getPrice(listing).toLocaleString()}
                          </p>
                          <p className="text-xs text-stone-500">{listing.bid_count || 0} bids</p>
                          {listing.end_time && (
                            <p className={`text-sm mt-1 ${isEndingSoon(listing.end_time) ? 'text-red-600 font-semibold' : 'text-stone-500'}`}>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {getTimeRemaining(listing.end_time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {listings.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-slate-600 mb-2">No listings found</p>
                <p className="text-sm text-stone-500 mb-6">Try adjusting your filters</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setListingTypeFilter('all');
                      setStatusFilter('active');
                      setPriceRange({ min: '', max: '' });
                      setSearchQuery('');
                      router.push('/marketplace', { scroll: false });
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Clear filters
                  </button>
                  {profile?.is_seller && (
                    <Link
                      href="/sell"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all"
                    >
                      Create Listing
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
