'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  Eye,
  Package,
  Truck,
  Shield,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Gavel,
  DollarSign,
  User,
  Star,
  Info
} from 'lucide-react';

// Mock listing data
const mockListing = {
  id: '1',
  title: '2019 Pitney Bowes DI950 6-Station Inserter',
  description: `This 2019 Pitney Bowes DI950 6-station inserter is in excellent condition and has been well-maintained throughout its service life. Perfect for high-volume mail processing operations.

**Key Features:**
- 6 insert stations with vertical stackers
- Optical mark recognition (OMR)
- Barcode reading capability
- Speed up to 10,000 pieces per hour
- Integrated outfeed conveyor

**Recent Maintenance:**
- Full service completed October 2023
- New feed belts installed
- All sensors cleaned and calibrated

**Reason for Selling:**
Upgrading to a newer model with additional stations.`,
  category: 'Mailing & Fulfillment',
  categorySlug: 'mailing-fulfillment',
  make: 'Pitney Bowes',
  model: 'DI950',
  year: 2019,
  serialNumber: 'PB-DI950-2019-0472',
  condition: 'Excellent',
  hoursCount: 125000,
  equipmentStatus: 'Palletized',
  listingType: 'auction' as const,
  currentBid: 12500,
  startingPrice: 5000,
  buyNowPrice: 18000,
  reservePrice: 10000,
  reserveMet: true,
  bidCount: 8,
  viewCount: 234,
  watchCount: 12,
  endsAt: '2024-02-15T18:00:00Z',
  location: {
    city: 'Chicago',
    state: 'IL',
    hasLoadingDock: true,
    hasForklift: true,
    groundLevel: false,
  },
  onsiteAssistance: 'Forklift Available',
  deinstallResponsibility: 'Buyer',
  weight: 2500,
  dimensions: { length: 96, width: 48, height: 60 },
  electricalRequirements: '208V/3-phase/30A',
  removalDeadline: '2024-03-15',
  pickupHours: 'Monday-Friday 8AM-4PM',
  pickupNotes: 'Please schedule 48 hours in advance. Loading dock available.',
  acceptsOffers: true,
  paymentMethods: ['credit_card', 'ach', 'wire'],
  paymentDueDays: 7,
  seller: {
    id: 'seller-1',
    name: 'Equipment Depot',
    company: 'Equipment Depot Inc.',
    rating: 4.8,
    reviewCount: 156,
    memberSince: '2019',
    verified: true,
  },
  images: [null, null, null, null, null], // Placeholder for demo
  createdAt: '2024-02-01T10:00:00Z',
};

const bidHistory = [
  { id: '1', bidder: 'j***n', amount: 12500, time: '2 hours ago', isWinning: true },
  { id: '2', bidder: 'm***e', amount: 12000, time: '3 hours ago', isWinning: false },
  { id: '3', bidder: 'j***n', amount: 11500, time: '5 hours ago', isWinning: false },
  { id: '4', bidder: 's***h', amount: 11000, time: '1 day ago', isWinning: false },
  { id: '5', bidder: 'm***e', amount: 10000, time: '1 day ago', isWinning: false },
];

const bidIncrements = [
  { max: 250, increment: 1 },
  { max: 1000, increment: 10 },
  { max: 10000, increment: 50 },
  { max: Infinity, increment: 100 },
];

function getMinNextBid(currentBid: number): number {
  const increment = bidIncrements.find(b => currentBid < b.max)?.increment || 100;
  return currentBid + increment;
}

export default function ListingDetailPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState(getMinNextBid(mockListing.currentBid).toString());
  const [isWatching, setIsWatching] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const listing = mockListing;
  const minBid = getMinNextBid(listing.currentBid);

  const getTimeRemaining = () => {
    const end = new Date(listing.endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { text: 'Ended', urgent: false };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const urgent = diff < 24 * 60 * 60 * 1000;
    if (days > 0) return { text: `${days}d ${hours}h ${minutes}m`, urgent };
    if (hours > 0) return { text: `${hours}h ${minutes}m ${seconds}s`, urgent };
    return { text: `${minutes}m ${seconds}s`, urgent: true };
  };

  const timeRemaining = getTimeRemaining();

  const handlePlaceBid = () => {
    const amount = parseInt(bidAmount);
    if (amount < minBid) {
      alert(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }
    alert(`Bid of $${amount.toLocaleString()} placed! (This would submit to the API)`);
  };

  const handleBuyNow = () => {
    if (confirm(`Buy now for $${listing.buyNowPrice?.toLocaleString()}?`)) {
      alert('Purchase confirmed! (This would redirect to checkout)');
    }
  };

  const handleMakeOffer = () => {
    const amount = parseInt(offerAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid offer amount');
      return;
    }
    alert(`Offer of $${amount.toLocaleString()} submitted! (This would submit to the API)`);
    setShowMakeOffer(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={`/category/${listing.categorySlug}`} className="text-gray-500 hover:text-gray-700">
              {listing.category}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Main Image */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                {listing.images[currentImageIndex] ? (
                  <img
                    src={listing.images[currentImageIndex] as string}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}

                {/* Navigation arrows */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? listing.images.length - 1 : i - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === listing.images.length - 1 ? 0 : i + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="p-4 flex gap-2 overflow-x-auto">
                {listing.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Title and quick info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">{listing.category}</p>
                  <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsWatching(!isWatching)}
                    className={`p-2 rounded-lg border ${
                      isWatching
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'border-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isWatching ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {listing.location.city}, {listing.location.state}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {listing.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {listing.watchCount} watching
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Make</span>
                  <span className="font-medium text-gray-900">{listing.make}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Model</span>
                  <span className="font-medium text-gray-900">{listing.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Year</span>
                  <span className="font-medium text-gray-900">{listing.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Serial Number</span>
                  <span className="font-medium text-gray-900">{listing.serialNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Condition</span>
                  <span className="font-medium text-gray-900">{listing.condition}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Hours/Impressions</span>
                  <span className="font-medium text-gray-900">{listing.hoursCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Weight</span>
                  <span className="font-medium text-gray-900">{listing.weight?.toLocaleString()} lbs</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Dimensions (L×W×H)</span>
                  <span className="font-medium text-gray-900">
                    {listing.dimensions.length}″ × {listing.dimensions.width}″ × {listing.dimensions.height}″
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Electrical</span>
                  <span className="font-medium text-gray-900">{listing.electricalRequirements}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Equipment Status</span>
                  <span className="font-medium text-gray-900">{listing.equipmentStatus}</span>
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Pickup & Logistics
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{listing.location.city}, {listing.location.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Removal Deadline</p>
                    <p className="font-medium text-gray-900">{listing.removalDeadline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup Hours</p>
                    <p className="font-medium text-gray-900">{listing.pickupHours}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">De-installation</p>
                    <p className="font-medium text-gray-900">{listing.deinstallResponsibility} Responsibility</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Facility Features</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.location.hasLoadingDock && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <Check className="h-4 w-4" /> Loading Dock
                      </span>
                    )}
                    {listing.location.hasForklift && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <Check className="h-4 w-4" /> Forklift Available
                      </span>
                    )}
                    {listing.location.groundLevel && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <Check className="h-4 w-4" /> Ground Level
                      </span>
                    )}
                  </div>
                </div>

                {listing.pickupNotes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Pickup Notes</p>
                    <p className="text-gray-700">{listing.pickupNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding and Seller */}
          <div className="space-y-6">
            {/* Bidding Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Time remaining */}
              <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
                timeRemaining.urgent ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock className={`h-5 w-5 ${timeRemaining.urgent ? 'text-red-500' : ''}`} />
                  Time Left
                </span>
                <span className={`font-bold ${timeRemaining.urgent ? 'text-red-600' : 'text-gray-900'}`}>
                  {timeRemaining.text}
                </span>
              </div>

              {/* Current bid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Current Bid</span>
                  <button
                    onClick={() => setShowBidHistory(!showBidHistory)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {listing.bidCount} bids
                  </button>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${listing.currentBid.toLocaleString()}
                </p>
                {listing.reservePrice && (
                  <p className={`text-sm mt-1 ${listing.reserveMet ? 'text-green-600' : 'text-yellow-600'}`}>
                    {listing.reserveMet ? '✓ Reserve met' : 'Reserve not met'}
                  </p>
                )}
              </div>

              {/* Bid History */}
              {showBidHistory && (
                <div className="mb-6 border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Bid History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bidHistory.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{bid.bidder}</span>
                        <span className={bid.isWinning ? 'font-medium text-green-600' : 'text-gray-900'}>
                          ${bid.amount.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-xs">{bid.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Place bid */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Your Bid (min ${minBid.toLocaleString()})
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handlePlaceBid}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Gavel className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter max bid for proxy bidding. We&apos;ll bid for you up to this amount.
                </p>
              </div>

              {/* Buy Now */}
              {listing.buyNowPrice && (
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors mb-4"
                >
                  Buy Now — ${listing.buyNowPrice.toLocaleString()}
                </button>
              )}

              {/* Make Offer */}
              {listing.acceptsOffers && (
                <>
                  {!showMakeOffer ? (
                    <button
                      onClick={() => setShowMakeOffer(true)}
                      className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <DollarSign className="h-5 w-5 inline mr-1" />
                      Make Offer
                    </button>
                  ) : (
                    <div className="border-t pt-4">
                      <label className="block text-sm text-gray-600 mb-2">Your Offer</label>
                      <div className="relative mb-3">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          placeholder="Enter offer amount"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMakeOffer(false)}
                          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleMakeOffer}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                          Submit Offer
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Auction info */}
              <div className="mt-6 pt-4 border-t space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Buyer Protection Included</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Info className="h-4 w-4" />
                  <span>2-minute soft close auction</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>5% buyer premium</span>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    {listing.seller.company}
                    {listing.seller.verified && (
                      <Shield className="h-4 w-4 text-blue-600" />
                    )}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{listing.seller.rating}</span>
                    <span>({listing.seller.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Member since {listing.seller.memberSince}
              </p>
              <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Seller
              </button>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-2 text-sm">
                {listing.paymentMethods.includes('credit_card') && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    Credit Card (2.9% + $0.30)
                  </div>
                )}
                {listing.paymentMethods.includes('ach') && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    ACH Bank Transfer (0.8%, max $5)
                  </div>
                )}
                {listing.paymentMethods.includes('wire') && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    Wire Transfer
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Payment due within {listing.paymentDueDays} days of auction end
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
