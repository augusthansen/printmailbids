'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  Clock,
  MapPin,
  Heart,
  Eye,
  Package,
  X
} from 'lucide-react';

interface MockListing {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  make: string;
  model: string;
  year: number | null;
  listingType: 'auction' | 'fixed_price';
  currentBid: number | null;
  buyNowPrice: number | null;
  startingPrice: number;
  bidCount: number;
  viewCount: number;
  watchCount: number;
  endsAt: string | null;
  location: string;
  condition: string;
  equipmentStatus: string;
  image: string | null;
  hasReserve: boolean;
  reserveMet: boolean;
}

const mockListings: MockListing[] = [
  {
    id: '1',
    title: '2019 Pitney Bowes DI950 6-Station Inserter',
    category: 'Mailing & Fulfillment',
    categorySlug: 'mailing-fulfillment',
    make: 'Pitney Bowes',
    model: 'DI950',
    year: 2019,
    listingType: 'auction',
    currentBid: 12500,
    buyNowPrice: 18000,
    startingPrice: 5000,
    bidCount: 8,
    viewCount: 234,
    watchCount: 12,
    endsAt: '2024-02-15T18:00:00Z',
    location: 'Chicago, IL',
    condition: 'Excellent',
    equipmentStatus: 'Palletized',
    image: null,
    hasReserve: true,
    reserveMet: true,
  },
  {
    id: '2',
    title: 'Heidelberg SM52-2 Offset Press',
    category: 'Printing',
    categorySlug: 'printing',
    make: 'Heidelberg',
    model: 'SM52-2',
    year: 2015,
    listingType: 'auction',
    currentBid: 35000,
    buyNowPrice: null,
    startingPrice: 15000,
    bidCount: 15,
    viewCount: 456,
    watchCount: 28,
    endsAt: '2024-02-16T20:00:00Z',
    location: 'Dallas, TX',
    condition: 'Good',
    equipmentStatus: 'Installed - Idle',
    image: null,
    hasReserve: true,
    reserveMet: false,
  },
  {
    id: '3',
    title: 'MBO T49 4/4 Folder with Right Angle',
    category: 'Bindery & Finishing',
    categorySlug: 'bindery-finishing',
    make: 'MBO',
    model: 'T49',
    year: 2017,
    listingType: 'auction',
    currentBid: 15750,
    buyNowPrice: null,
    startingPrice: 8000,
    bidCount: 22,
    viewCount: 312,
    watchCount: 8,
    endsAt: '2024-02-14T14:00:00Z',
    location: 'Atlanta, GA',
    condition: 'Excellent',
    equipmentStatus: 'Deinstalled',
    image: null,
    hasReserve: false,
    reserveMet: true,
  },
  {
    id: '4',
    title: 'Bell & Howell Mailstar 400 6-Station Inserter',
    category: 'Mailing & Fulfillment',
    categorySlug: 'mailing-fulfillment',
    make: 'Bell & Howell',
    model: 'Mailstar 400',
    year: 2016,
    listingType: 'fixed_price',
    currentBid: null,
    buyNowPrice: 9500,
    startingPrice: 9500,
    bidCount: 0,
    viewCount: 145,
    watchCount: 6,
    endsAt: null,
    location: 'Phoenix, AZ',
    condition: 'Good',
    equipmentStatus: 'Crated',
    image: null,
    hasReserve: false,
    reserveMet: true,
  },
  {
    id: '5',
    title: 'Challenge 305 MC Paper Cutter',
    category: 'Bindery & Finishing',
    categorySlug: 'bindery-finishing',
    make: 'Challenge',
    model: '305 MC',
    year: 2012,
    listingType: 'auction',
    currentBid: 4200,
    buyNowPrice: 6500,
    startingPrice: 2000,
    bidCount: 6,
    viewCount: 189,
    watchCount: 5,
    endsAt: '2024-02-17T12:00:00Z',
    location: 'Denver, CO',
    condition: 'Fair',
    equipmentStatus: 'Palletized',
    image: null,
    hasReserve: false,
    reserveMet: true,
  },
  {
    id: '6',
    title: 'Kern 3500 Multi-Mailer Inserter System',
    category: 'Mailing & Fulfillment',
    categorySlug: 'mailing-fulfillment',
    make: 'Kern',
    model: '3500',
    year: 2018,
    listingType: 'auction',
    currentBid: 28000,
    buyNowPrice: null,
    startingPrice: 20000,
    bidCount: 11,
    viewCount: 287,
    watchCount: 15,
    endsAt: '2024-02-18T16:00:00Z',
    location: 'Minneapolis, MN',
    condition: 'Excellent',
    equipmentStatus: 'In Production',
    image: null,
    hasReserve: true,
    reserveMet: true,
  },
  {
    id: '7',
    title: 'Duplo DC-645 Slitter/Cutter/Creaser',
    category: 'Bindery & Finishing',
    categorySlug: 'bindery-finishing',
    make: 'Duplo',
    model: 'DC-645',
    year: 2020,
    listingType: 'fixed_price',
    currentBid: null,
    buyNowPrice: 12500,
    startingPrice: 12500,
    bidCount: 0,
    viewCount: 178,
    watchCount: 9,
    endsAt: null,
    location: 'Seattle, WA',
    condition: 'Excellent',
    equipmentStatus: 'Deinstalled',
    image: null,
    hasReserve: false,
    reserveMet: true,
  },
  {
    id: '8',
    title: 'Polar 115 Programmable Paper Cutter',
    category: 'Bindery & Finishing',
    categorySlug: 'bindery-finishing',
    make: 'Polar',
    model: '115',
    year: 2014,
    listingType: 'auction',
    currentBid: 22000,
    buyNowPrice: 30000,
    startingPrice: 12000,
    bidCount: 18,
    viewCount: 421,
    watchCount: 22,
    endsAt: '2024-02-15T10:00:00Z',
    location: 'Boston, MA',
    condition: 'Good',
    equipmentStatus: 'Palletized',
    image: null,
    hasReserve: true,
    reserveMet: true,
  },
];

const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'mailing-fulfillment', name: 'Mailing & Fulfillment' },
  { id: 'printing', name: 'Printing' },
  { id: 'bindery-finishing', name: 'Bindery & Finishing' },
  { id: 'packaging', name: 'Packaging' },
  { id: 'material-handling', name: 'Material Handling' },
  { id: 'parts-supplies', name: 'Parts & Supplies' },
];

const sortOptions = [
  { id: 'ending-soon', name: 'Ending Soon' },
  { id: 'newest', name: 'Newest' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'most-bids', name: 'Most Bids' },
];

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'auction' | 'fixed_price'>('all');

  const filteredListings = mockListings.filter((listing) => {
    const matchesCategory = selectedCategory === 'all' || listing.categorySlug === selectedCategory;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = listingTypeFilter === 'all' || listing.listingType === listingTypeFilter;
    const matchesPrice = (
      (!priceRange.min || (listing.currentBid || listing.buyNowPrice || 0) >= parseInt(priceRange.min)) &&
      (!priceRange.max || (listing.currentBid || listing.buyNowPrice || 0) <= parseInt(priceRange.max))
    );
    return matchesCategory && matchesSearch && matchesType && matchesPrice;
  });

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
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // Less than 24 hours
  };

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
          <aside className={`
            lg:w-64 flex-shrink-0
            ${showFilters ? 'block' : 'hidden lg:block'}
          `}>
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
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(cat.id)}
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
                <span className="font-medium text-gray-900">{filteredListings.length}</span> listings found
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
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-gray-100 relative">
                      {listing.image ? (
                        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {listing.listingType === 'auction' && isEndingSoon(listing.endsAt) && (
                          <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Ending Soon
                          </span>
                        )}
                        {listing.listingType === 'fixed_price' && (
                          <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Buy Now
                          </span>
                        )}
                        {listing.hasReserve && !listing.reserveMet && (
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
                      <p className="text-sm text-blue-600 font-medium mb-1">{listing.category}</p>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="h-4 w-4" />
                        {listing.location}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {listing.listingType === 'auction' ? (
                            <>
                              <p className="text-xs text-gray-500">Current Bid</p>
                              <p className="text-lg font-bold text-gray-900">
                                ${(listing.currentBid || listing.startingPrice).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{listing.bidCount} bids</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="text-lg font-bold text-green-600">
                                ${listing.buyNowPrice?.toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>

                        {listing.endsAt && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Time Left</p>
                            <p className={`text-sm font-medium ${isEndingSoon(listing.endsAt) ? 'text-red-600' : 'text-gray-900'}`}>
                              {getTimeRemaining(listing.endsAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {listing.buyNowPrice && listing.listingType === 'auction' && (
                        <p className="text-sm text-green-600 mt-2">
                          Buy Now: ${listing.buyNowPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {listing.image ? (
                        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">{listing.category}</p>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {listing.location}
                            </span>
                            <span>{listing.condition}</span>
                            <span>{listing.equipmentStatus}</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {listing.listingType === 'auction' ? (
                            <>
                              <p className="text-xs text-gray-500">Current Bid</p>
                              <p className="text-xl font-bold text-gray-900">
                                ${(listing.currentBid || listing.startingPrice).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{listing.bidCount} bids</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="text-xl font-bold text-green-600">
                                ${listing.buyNowPrice?.toLocaleString()}
                              </p>
                            </>
                          )}
                          {listing.endsAt && (
                            <p className={`text-sm mt-1 ${isEndingSoon(listing.endsAt) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {getTimeRemaining(listing.endsAt)}
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
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No listings found</p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
