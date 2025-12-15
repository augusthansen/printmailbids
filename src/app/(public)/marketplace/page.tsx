'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
  listing_type: string;
  current_bid: number | null;
  buy_now_price: number | null;
  fixed_price: number | null;
  starting_price: number;
  bid_count: number;
  view_count: number;
  watch_count: number;
  end_time: string | null;
  condition: string;
  equipment_status: string;
  reserve_price: number | null;
  status: string;
  category?: {
    name: string;
    slug: string;
  };
  images?: {
    url: string;
    is_primary: boolean;
  }[];
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
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState('ending-soon');
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'auction' | 'fixed_price'>('all');

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Update category when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    async function loadData() {
      // Load categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (catData) {
        setCategories(catData);
      }

      // Build listing query
      let query = supabase
        .from('listings')
        .select(`
          *,
          category:categories(name, slug),
          images:listing_images(url, is_primary)
        `)
        .in('status', ['active', 'scheduled']);

      // Apply category filter
      if (selectedCategory !== 'all') {
        const cat = catData?.find(c => c.slug === selectedCategory);
        if (cat) {
          query = query.eq('primary_category_id', cat.id);
        }
      }

      // Apply listing type filter
      if (listingTypeFilter === 'auction') {
        query = query.in('listing_type', ['auction', 'auction_buy_now']);
      } else if (listingTypeFilter === 'fixed_price') {
        query = query.in('listing_type', ['fixed_price', 'fixed_price_offers']);
      }

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

      const { data: listingData } = await query;

      if (listingData) {
        // Apply client-side filters
        let filtered = listingData as unknown as Listing[];

        // Search filter
        if (searchQuery) {
          const search = searchQuery.toLowerCase();
          filtered = filtered.filter(l =>
            l.title?.toLowerCase().includes(search) ||
            l.make?.toLowerCase().includes(search) ||
            l.model?.toLowerCase().includes(search)
          );
        }

        // Price filter
        if (priceRange.min) {
          const minPrice = parseInt(priceRange.min);
          filtered = filtered.filter(l => {
            const price = l.current_bid || l.fixed_price || l.buy_now_price || l.starting_price || 0;
            return price >= minPrice;
          });
        }
        if (priceRange.max) {
          const maxPrice = parseInt(priceRange.max);
          filtered = filtered.filter(l => {
            const price = l.current_bid || l.fixed_price || l.buy_now_price || l.starting_price || 0;
            return price <= maxPrice;
          });
        }

        setListings(filtered);
      }

      setLoading(false);
    }

    loadData();
  }, [supabase, selectedCategory, sortBy, listingTypeFilter, searchQuery, priceRange]);

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
    if (listing.listing_type?.includes('fixed')) {
      return listing.fixed_price || listing.buy_now_price || 0;
    }
    return listing.current_bid || listing.starting_price || 0;
  };

  const reserveMet = (listing: Listing) => {
    if (!listing.reserve_price) return true;
    const currentBid = listing.current_bid || listing.starting_price || 0;
    return currentBid >= listing.reserve_price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Search Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Browse Equipment</h1>
          <p className="text-gray-300 mb-6">
            Find the perfect printing, mailing, and industrial equipment for your business.
          </p>

          {/* Search bar */}
          <div className="flex gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, or keyword..."
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === 'all'}
                      onChange={() => setSelectedCategory('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(cat.slug)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Listing Type */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Listing Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      checked={listingTypeFilter === 'all'}
                      onChange={() => setListingTypeFilter('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      checked={listingTypeFilter === 'auction'}
                      onChange={() => setListingTypeFilter('auction')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auctions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      checked={listingTypeFilter === 'fixed_price'}
                      onChange={() => setListingTypeFilter('fixed_price')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Buy Now</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setListingTypeFilter('all');
                  setPriceRange({ min: '', max: '' });
                  setSearchQuery('');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{listings.length}</span> listings found
              </p>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
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
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-gray-100 relative">
                      {getPrimaryImage(listing) ? (
                        <img src={getPrimaryImage(listing)!} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {listing.listing_type?.includes('auction') && isEndingSoon(listing.end_time) && (
                          <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Ending Soon
                          </span>
                        )}
                        {listing.listing_type?.includes('fixed') && (
                          <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Buy Now
                          </span>
                        )}
                        {listing.reserve_price && !reserveMet(listing) && (
                          <span className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Reserve Not Met
                          </span>
                        )}
                      </div>

                      {/* Watchlist button */}
                      <button className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {listing.category && (
                        <p className="text-sm text-blue-600 font-medium mb-1">{listing.category.name}</p>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                        {listing.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div>
                          {listing.listing_type?.includes('auction') ? (
                            <>
                              <p className="text-xs text-gray-500">Current Bid</p>
                              <p className="text-lg font-bold text-gray-900">
                                ${getPrice(listing).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{listing.bid_count || 0} bids</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="text-lg font-bold text-green-600">
                                ${getPrice(listing).toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>

                        {listing.end_time && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Time Left</p>
                            <p className={`text-sm font-medium ${isEndingSoon(listing.end_time) ? 'text-red-600' : 'text-gray-900'}`}>
                              {getTimeRemaining(listing.end_time)}
                            </p>
                          </div>
                        )}
                      </div>

                      {listing.buy_now_price && listing.listing_type === 'auction_buy_now' && (
                        <p className="text-sm text-green-600 mt-2">
                          Buy Now: ${listing.buy_now_price.toLocaleString()}
                        </p>
                      )}
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
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {getPrimaryImage(listing) ? (
                        <img src={getPrimaryImage(listing)!} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {listing.category && (
                            <p className="text-sm text-blue-600 font-medium">{listing.category.name}</p>
                          )}
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {listing.condition && <span className="capitalize">{listing.condition}</span>}
                            {listing.equipment_status && (
                              <span className="capitalize">{listing.equipment_status.replace(/_/g, ' ')}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {listing.listing_type?.includes('auction') ? (
                            <>
                              <p className="text-xs text-gray-500">Current Bid</p>
                              <p className="text-xl font-bold text-gray-900">
                                ${getPrice(listing).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{listing.bid_count || 0} bids</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="text-xl font-bold text-green-600">
                                ${getPrice(listing).toLocaleString()}
                              </p>
                            </>
                          )}
                          {listing.end_time && (
                            <p className={`text-sm mt-1 ${isEndingSoon(listing.end_time) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
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
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No listings found</p>
                <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or create a new listing</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setListingTypeFilter('all');
                      setPriceRange({ min: '', max: '' });
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/sell"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Listing
                  </Link>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
