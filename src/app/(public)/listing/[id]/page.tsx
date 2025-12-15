'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Gavel,
  DollarSign,
  User,
  Star,
  Info,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Helper to check if a listing has ended (sold or ended status)
function isListingClosed(status: string): boolean {
  return status === 'sold' || status === 'ended';
}

interface Listing {
  id: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  serial_number: string;
  condition: string;
  hours_count: number;
  equipment_status: string;
  listing_type: string;
  current_price: number;
  starting_price: number;
  buy_now_price: number;
  fixed_price: number;
  reserve_price: number;
  bid_count: number;
  view_count: number;
  watch_count: number;
  end_time: string;
  original_end_time: string;
  start_time: string;
  onsite_assistance: string;
  deinstall_responsibility: string;
  weight_lbs: number;
  length_inches: number;
  width_inches: number;
  height_inches: number;
  electrical_requirements: string;
  removal_deadline: string;
  pickup_hours: string;
  pickup_notes: string;
  accept_offers: boolean;
  accepts_credit_card: boolean;
  accepts_ach: boolean;
  accepts_wire: boolean;
  accepts_check: boolean;
  payment_due_days: number;
  seller_id: string;
  status: string;
  primary_category_id: string;
  location: string;
  category?: {
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    full_name: string;
    company_name: string;
    seller_rating: number;
    seller_review_count: number;
    is_verified: boolean;
    created_at: string;
  };
  images?: {
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
}

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  status: string;
}

const bidIncrements = [
  { max: 250, increment: 1 },
  { max: 1000, increment: 10 },
  { max: 10000, increment: 50 },
  { max: Infinity, increment: 100 },
];

// Soft-close window: 2 minutes (in milliseconds)
const SOFT_CLOSE_WINDOW_MS = 2 * 60 * 1000;

function getMinNextBid(currentBid: number): number {
  const increment = bidIncrements.find(b => currentBid < b.max)?.increment || 100;
  return currentBid + increment;
}

function isInSoftCloseWindow(endTime: string): boolean {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= SOFT_CLOSE_WINDOW_MS;
}

function getExtensionCount(endTime: string, originalEndTime: string | null): number {
  if (!originalEndTime) return 0;
  const end = new Date(endTime);
  const original = new Date(originalEndTime);
  const diffMs = end.getTime() - original.getTime();
  // Each extension is 2 minutes
  return Math.max(0, Math.round(diffMs / SOFT_CLOSE_WINDOW_MS));
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user, isSeller } = useAuth();
  const supabase = createClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          category:categories(name, slug),
          seller:profiles(id, full_name, company_name, seller_rating, seller_review_count, is_verified, created_at),
          images:listing_images(id, url, is_primary, sort_order)
        `)
        .eq('id', listingId)
        .single();

      if (data && !error) {
        setListing(data as unknown as Listing);
        const minBid = getMinNextBid(data.current_price || data.starting_price || 0);
        setBidAmount(minBid.toString());

        // Increment view count
        await supabase
          .from('listings')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', listingId);
      }

      // Load bids
      const { data: bidData } = await supabase
        .from('bids')
        .select('*')
        .eq('listing_id', listingId)
        .order('amount', { ascending: false })
        .limit(10);

      if (bidData) {
        setBids(bidData);
      }

      // Check if user is watching
      if (user?.id) {
        const { data: watchData } = await supabase
          .from('watchlist')
          .select('listing_id')
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .single();

        setIsWatching(!!watchData);
      }

      setLoading(false);
    }

    loadListing();
  }, [listingId, supabase, user?.id]);

  // Real-time subscription for new bids
  useEffect(() => {
    const channel = supabase
      .channel(`bids-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          const newBid = payload.new as Bid;

          // Add the new bid to the list (keeping sorted order)
          setBids(currentBids => {
            const updated = [newBid, ...currentBids.filter(b => b.id !== newBid.id)];
            return updated.sort((a, b) => b.amount - a.amount).slice(0, 10);
          });

          // Reload listing to get updated current_price
          const { data: updatedListing } = await supabase
            .from('listings')
            .select(`
              *,
              category:categories(name, slug),
              seller:profiles(id, full_name, company_name, seller_rating, seller_review_count, is_verified, created_at),
              images:listing_images(id, url, is_primary, sort_order)
            `)
            .eq('id', listingId)
            .single();

          if (updatedListing) {
            setListing(updatedListing as unknown as Listing);
            // Update bid input if user was outbid
            if (user?.id && newBid.bidder_id !== user.id) {
              const nextMinBid = getMinNextBid(newBid.amount);
              setBidAmount(nextMinBid.toString());
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId, supabase, user?.id]);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render for countdown
      setListing(l => l ? { ...l } : null);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentBid = listing?.current_price || listing?.starting_price || 0;
  const minBid = getMinNextBid(currentBid);
  const reserveMet = listing?.reserve_price ? currentBid >= listing.reserve_price : true;

  // Hide prices on closed listings for non-sellers
  const listingIsClosed = listing?.status ? isListingClosed(listing.status) : false;
  const hidePriceForNonSeller = listingIsClosed && !isSeller;

  const getTimeRemaining = () => {
    if (!listing?.end_time) return { text: 'No end time', urgent: false };
    const end = new Date(listing.end_time);
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

  const toggleWatchlist = async () => {
    if (!user?.id || !listing) return;

    if (isWatching) {
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listing.id);
      setIsWatching(false);
    } else {
      await supabase
        .from('watchlist')
        .insert({ user_id: user.id, listing_id: listing.id });
      setIsWatching(true);
    }
  };

  const handlePlaceBid = async () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to bid');
      return;
    }

    // Prevent seller from bidding on their own listing
    if (user.id === listing.seller_id) {
      setError('You cannot bid on your own listing');
      return;
    }

    const amount = parseInt(bidAmount);
    if (amount < minBid) {
      setError(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    setSubmittingBid(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create the bid
      const { error: bidError } = await supabase.from('bids').insert({
        listing_id: listing.id,
        bidder_id: user.id,
        amount: amount,
        max_bid: amount,
        status: 'active',
      });

      if (bidError) throw bidError;

      // Check for soft-close extension
      const inSoftClose = listing.end_time && isInSoftCloseWindow(listing.end_time);
      let newEndTime = listing.end_time;

      if (inSoftClose) {
        // Extend auction by 2 minutes from now
        const extension = new Date();
        extension.setTime(extension.getTime() + SOFT_CLOSE_WINDOW_MS);
        newEndTime = extension.toISOString();
      }

      // Update listing current price (and end_time if soft-close triggered)
      const updateData: Record<string, unknown> = {
        current_price: amount,
        bid_count: (listing.bid_count || 0) + 1,
      };

      if (inSoftClose) {
        updateData.end_time = newEndTime;
        // Store original end time if not already stored
        if (!listing.original_end_time) {
          updateData.original_end_time = listing.end_time;
        }
      }

      await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      // Notify seller of new bid
      await supabase.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'new_bid',
        title: 'New bid on your listing',
        body: `Someone bid $${amount.toLocaleString()} on "${listing.title}"`,
        listing_id: listing.id,
      });

      // Notify previous high bidder they were outbid
      if (bids.length > 0 && bids[0].bidder_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: bids[0].bidder_id,
          type: 'outbid',
          title: 'You have been outbid',
          body: `Someone outbid you on "${listing.title}". New high bid: $${amount.toLocaleString()}`,
          listing_id: listing.id,
        });
      }

      // Reload listing
      const { data: updatedListing } = await supabase
        .from('listings')
        .select(`
          *,
          category:categories(name, slug),
          seller:profiles(id, full_name, company_name, seller_rating, seller_review_count, is_verified, created_at),
          images:listing_images(id, url, is_primary, sort_order)
        `)
        .eq('id', listingId)
        .single();

      if (updatedListing) {
        setListing(updatedListing as unknown as Listing);
        setBidAmount(getMinNextBid(amount).toString());
      }

      // Reload bids
      const { data: bidData } = await supabase
        .from('bids')
        .select('*')
        .eq('listing_id', listingId)
        .order('amount', { ascending: false })
        .limit(10);

      if (bidData) {
        setBids(bidData);
      }

      const extensionMsg = inSoftClose ? ' Auction extended by 2 minutes!' : '';
      setSuccessMessage(`Bid of $${amount.toLocaleString()} placed successfully!${extensionMsg}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user?.id || !listing?.buy_now_price) return;
    if (confirm(`Buy now for $${listing.buy_now_price.toLocaleString()}?`)) {
      // TODO: Implement checkout flow
      alert('Purchase confirmed! Checkout will be implemented soon.');
    }
  };

  const handleMakeOffer = async () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to make an offer');
      return;
    }

    const amount = parseInt(offerAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid offer amount');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 2); // Offer expires in 2 days

      await supabase.from('offers').insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: amount,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });

      // Notify seller of new offer
      await supabase.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'new_offer',
        title: 'New offer received',
        body: `You received an offer of $${amount.toLocaleString()} on "${listing.title}"`,
        listing_id: listing.id,
      });

      alert(`Offer of $${amount.toLocaleString()} submitted!`);
      setShowMakeOffer(false);
      setOfferAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit offer');
    }
  };

  const contactSeller = async () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to contact the seller');
      return;
    }

    if (user.id === listing.seller_id) {
      setError('You cannot message yourself');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${listing.seller_id}),and(participant_1_id.eq.${listing.seller_id},participant_2_id.eq.${user.id})`)
        .single();

      if (existing) {
        router.push(`/dashboard/messages/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error: createError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          participant_1_id: user.id,
          participant_2_id: listing.seller_id,
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/dashboard/messages/${newConvo.id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-500 mb-4">This listing may have been removed or doesn&apos;t exist.</p>
          <Link href="/marketplace" className="text-blue-600 hover:underline">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images?.sort((a, b) => a.sort_order - b.sort_order) || [];

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
            {listing.category && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/marketplace?category=${listing.category.slug}`} className="text-gray-500 hover:text-gray-700">
                  {listing.category.name}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {images.length > 0 && images[currentImageIndex]?.url ? (
                  <img
                    src={images[currentImageIndex].url}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title and quick info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {listing.category && (
                    <p className="text-sm text-blue-600 font-medium mb-1">{listing.category.name}</p>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleWatchlist}
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
                  <Eye className="h-4 w-4" />
                  {listing.view_count || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {listing.watch_count || 0} watching
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {listing.description || 'No description provided.'}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {listing.make && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Make</span>
                    <span className="font-medium text-gray-900">{listing.make}</span>
                  </div>
                )}
                {listing.model && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Model</span>
                    <span className="font-medium text-gray-900">{listing.model}</span>
                  </div>
                )}
                {listing.year && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Year</span>
                    <span className="font-medium text-gray-900">{listing.year}</span>
                  </div>
                )}
                {listing.serial_number && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Serial Number</span>
                    <span className="font-medium text-gray-900">{listing.serial_number}</span>
                  </div>
                )}
                {listing.condition && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Condition</span>
                    <span className="font-medium text-gray-900 capitalize">{listing.condition}</span>
                  </div>
                )}
                {listing.hours_count && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Hours/Impressions</span>
                    <span className="font-medium text-gray-900">{listing.hours_count.toLocaleString()}</span>
                  </div>
                )}
                {listing.weight_lbs && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-medium text-gray-900">{listing.weight_lbs.toLocaleString()} lbs</span>
                  </div>
                )}
                {listing.electrical_requirements && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Electrical</span>
                    <span className="font-medium text-gray-900">{listing.electrical_requirements}</span>
                  </div>
                )}
                {listing.equipment_status && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Equipment Status</span>
                    <span className="font-medium text-gray-900 capitalize">{listing.equipment_status.replace(/_/g, ' ')}</span>
                  </div>
                )}
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
                  {listing.removal_deadline && (
                    <div>
                      <p className="text-sm text-gray-500">Removal Deadline</p>
                      <p className="font-medium text-gray-900">{new Date(listing.removal_deadline).toLocaleDateString()}</p>
                    </div>
                  )}
                  {listing.pickup_hours && (
                    <div>
                      <p className="text-sm text-gray-500">Pickup Hours</p>
                      <p className="font-medium text-gray-900">{listing.pickup_hours}</p>
                    </div>
                  )}
                  {listing.onsite_assistance && (
                    <div>
                      <p className="text-sm text-gray-500">On-site Assistance</p>
                      <p className="font-medium text-gray-900 capitalize">{listing.onsite_assistance.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>

                {listing.pickup_notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Pickup Notes</p>
                    <p className="text-gray-700">{listing.pickup_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding and Seller */}
          <div className="space-y-6">
            {/* Bidding Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Closed listing for non-sellers - hide price */}
              {hidePriceForNonSeller ? (
                <div className="text-center py-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                    listing.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <Package className="h-5 w-5" />
                    <span className="font-semibold text-lg capitalize">{listing.status}</span>
                  </div>
                  <p className="text-gray-500 mb-4">This listing has ended.</p>
                  <p className="text-sm text-gray-400">
                    Final sale prices are only visible to registered sellers.
                  </p>
                  <Link
                    href="/sell"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Become a seller to view pricing history
                  </Link>
                </div>
              ) : (
                <>
                  {/* Time remaining */}
                  {listing.listing_type === 'auction' || listing.listing_type === 'auction_buy_now' ? (
                    <>
                      {/* Soft-close indicator */}
                      {listing.end_time && isInSoftCloseWindow(listing.end_time) && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-orange-700 font-medium">
                            <Clock className="h-5 w-5 animate-pulse" />
                            SOFT CLOSE ACTIVE
                          </div>
                          <p className="text-sm text-orange-600 mt-1">
                            Bids in the final 2 minutes extend the auction by 2 minutes
                          </p>
                        </div>
                      )}

                      {/* Extension count */}
                      {listing.original_end_time && getExtensionCount(listing.end_time, listing.original_end_time) > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-center">
                          <span className="text-sm text-blue-700">
                            Auction extended {getExtensionCount(listing.end_time, listing.original_end_time)} time{getExtensionCount(listing.end_time, listing.original_end_time) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Listing ended badge for sellers */}
                      {listingIsClosed && isSeller && (
                        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-4 ${
                          listing.status === 'sold' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                        }`}>
                          <Package className="h-5 w-5" />
                          <span className="font-semibold capitalize">{listing.status}</span>
                        </div>
                      )}

                      {/* Time left - only show for active listings */}
                      {!listingIsClosed && (
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
                      )}

                      {/* Current bid / Final Price */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500">{listingIsClosed ? 'Final Price' : 'Current Bid'}</span>
                          <button
                            onClick={() => setShowBidHistory(!showBidHistory)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {listing.bid_count || 0} bids
                          </button>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          ${currentBid.toLocaleString()}
                        </p>
                        {listing.reserve_price && !listingIsClosed && (
                          <p className={`text-sm mt-1 ${reserveMet ? 'text-green-600' : 'text-yellow-600'}`}>
                            {reserveMet ? '✓ Reserve met' : 'Reserve not met'}
                          </p>
                        )}
                      </div>

                      {/* Bid History */}
                      {showBidHistory && bids.length > 0 && (
                        <div className="mb-6 border-t pt-4">
                          <h3 className="font-medium text-gray-900 mb-3">Bid History</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {bids.map((bid, index) => (
                              <div key={bid.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Bidder {index + 1}</span>
                                <span className={index === 0 ? 'font-medium text-green-600' : 'text-gray-900'}>
                                  ${bid.amount.toLocaleString()}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(bid.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Place bid - only for active listings */}
                      {!listingIsClosed && (
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
                              disabled={submittingBid}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {submittingBid ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Gavel className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Enter max bid for proxy bidding. We&apos;ll bid for you up to this amount.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fixed Price */
                    <div className="mb-6">
                      {listingIsClosed && isSeller && (
                        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-4 ${
                          listing.status === 'sold' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                        }`}>
                          <Package className="h-5 w-5" />
                          <span className="font-semibold capitalize">{listing.status}</span>
                        </div>
                      )}
                      <span className="text-gray-500">{listingIsClosed ? 'Final Price' : 'Price'}</span>
                      <p className="text-3xl font-bold text-gray-900">
                        ${(listing.fixed_price || listing.buy_now_price || 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Buy Now - only for active listings */}
                  {!listingIsClosed && (listing.buy_now_price || listing.listing_type?.includes('fixed')) && (
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors mb-4"
                    >
                      Buy Now — ${(listing.buy_now_price || listing.fixed_price || 0).toLocaleString()}
                    </button>
                  )}
                </>
              )}

              {/* Make Offer - only for active listings */}
              {!listingIsClosed && listing.accept_offers && (
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

              {/* Auction info - hide for non-sellers on closed listings */}
              {!hidePriceForNonSeller && (
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
              )}
            </div>

            {/* Seller Card */}
            {listing.seller && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      {listing.seller.company_name || listing.seller.full_name || 'Seller'}
                      {listing.seller.is_verified && (
                        <Shield className="h-4 w-4 text-blue-600" />
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{listing.seller.seller_rating || 0}</span>
                      <span>({listing.seller.seller_review_count || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Member since {new Date(listing.seller.created_at).getFullYear()}
                </p>
                <button
                  onClick={contactSeller}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Contact Seller
                </button>
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-2 text-sm">
                {listing.accepts_credit_card && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    Credit Card (2.9% + $0.30)
                  </div>
                )}
                {listing.accepts_ach && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    ACH Bank Transfer (0.8%, max $5)
                  </div>
                )}
                {listing.accepts_wire && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    Wire Transfer
                  </div>
                )}
                {listing.accepts_check && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    Check
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Payment due within {listing.payment_due_days || 7} days of auction end
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
