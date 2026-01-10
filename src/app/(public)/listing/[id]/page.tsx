'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Loader2,
  X,
  FileText,
  Video,
  Plus,
  Minus,
  Copy,
  Mail,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import PhoneVerification from '@/components/PhoneVerification';

// Helper to check if a listing has ended (sold or ended status)
function isListingClosed(status: string): boolean {
  return status === 'sold' || status === 'ended';
}

interface Listing {
  id: string;
  title: string;
  description: string;
  seller_terms: string | null;
  shipping_info: string | null;
  make: string;
  model: string;
  year: number;
  serial_number: string;
  condition: string;
  hours_count: number;
  output_stacker_count: number | null;
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
  floor_length_ft: number | null;
  floor_width_ft: number | null;
  electrical_requirements: string;
  removal_deadline: string;
  pickup_hours: string;
  pickup_notes: string;
  accept_offers: boolean;
  auto_accept_price: number | null;
  auto_decline_price: number | null;
  accepts_credit_card: boolean;
  accepts_ach: boolean;
  accepts_wire: boolean;
  accepts_check: boolean;
  payment_due_days: number;
  seller_id: string;
  status: string;
  video_url: string | null;
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
    avatar_url: string | null;
    seller_rating: number;
    seller_review_count: number;
    seller_terms: string | null;
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
  max_bid: number;
  created_at: string;
  bidder_id: string;
  status: string;
  is_auto_bid: boolean;
  bidder?: {
    email: string;
  };
}

// Anonymize email for public display: john@example.com -> j***n@e***e.com
function anonymizeEmail(email: string): string {
  if (!email) return 'Anonymous';
  const [local, domain] = email.split('@');
  if (!domain) return 'Anonymous';

  const anonymizeLocal = local.length <= 2
    ? local[0] + '***'
    : local[0] + '***' + local[local.length - 1];

  const domainParts = domain.split('.');
  const mainDomain = domainParts[0];
  const anonymizeDomain = mainDomain.length <= 2
    ? mainDomain[0] + '***'
    : mainDomain[0] + '***' + mainDomain[mainDomain.length - 1];

  return `${anonymizeLocal}@${anonymizeDomain}.${domainParts.slice(1).join('.')}`;
}

const bidIncrements = [
  { max: 250, increment: 1 },
  { max: 1000, increment: 10 },
  { max: 10000, increment: 50 },
  { max: 100000, increment: 100 },
  { max: 500000, increment: 500 },
  { max: Infinity, increment: 1000 },
];

// Soft-close window: 2 minutes (in milliseconds)
const SOFT_CLOSE_WINDOW_MS = 2 * 60 * 1000;

function getMinNextBid(currentBid: number): number {
  const increment = bidIncrements.find(b => currentBid < b.max)?.increment || 100;
  return currentBid + increment;
}

// Format number with commas for display
function formatWithCommas(value: string): string {
  // Remove non-numeric characters except for the value itself
  const numericValue = value.replace(/[^0-9]/g, '');
  if (!numericValue) return '';
  return parseInt(numericValue).toLocaleString();
}

// Parse formatted string back to number
function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0;
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

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Extract Vimeo video ID
function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user, isSeller } = useAuth();
  const supabase = createClient();
  const { trackView, trackVideoPlay, trackWatchlistAdd, trackBidClick, trackOfferClick, trackShare } = useAnalytics();

  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'terms' | 'shipping'>('description');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasAcceptedTermsForListing, setHasAcceptedTermsForListing] = useState(false);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [userPhoneVerified, setUserPhoneVerified] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Auto-dismiss share toast
  useEffect(() => {
    if (shareToast) {
      const timer = setTimeout(() => setShareToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [shareToast]);

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          category:categories!listings_primary_category_id_fkey(name, slug),
          seller:profiles(id, full_name, company_name, avatar_url, seller_rating, seller_review_count, seller_terms, is_verified, created_at),
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

        // Track analytics view event
        trackView(listingId, user?.id);
      }

      // Load bids with bidder email for anonymized display
      const { data: bidData } = await supabase
        .from('bids')
        .select(`
          *,
          bidder:profiles!bids_bidder_id_fkey(email)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (bidData) {
        setBids(bidData);

        // Check if current user has already bid on this listing (meaning they've accepted terms)
        if (user?.id && bidData.some((b: Bid) => b.bidder_id === user.id)) {
          setHasAcceptedTermsForListing(true);
        }
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
  }, [listingId, supabase, user?.id, trackView]);

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
        async (payload: { new: Record<string, unknown> }) => {
          const newBid = payload.new as unknown as Bid;

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
              category:categories!listings_primary_category_id_fkey(name, slug),
              seller:profiles(id, full_name, company_name, avatar_url, seller_rating, seller_review_count, seller_terms, is_verified, created_at),
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

  // Check user's phone verification status
  useEffect(() => {
    async function checkPhoneVerification() {
      if (!user?.id) {
        setUserPhoneVerified(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('phone_verified')
        .eq('id', user.id)
        .single();

      setUserPhoneVerified(data?.phone_verified || false);
    }

    checkPhoneVerification();
  }, [user?.id, supabase]);

  const currentBid = listing?.current_price || listing?.starting_price || 0;
  const minBid = getMinNextBid(currentBid);
  const reserveMet = listing?.reserve_price ? currentBid >= listing.reserve_price : true;

  // Get user's current max bid on this listing (highest max_bid from their bids)
  const userCurrentMaxBid = user?.id
    ? bids
        .filter(b => b.bidder_id === user.id)
        .reduce((max, b) => Math.max(max, b.max_bid || 0), 0)
    : 0;

  // Check if user is currently the high bidder (find bid with highest amount)
  const highestBid = bids.length > 0
    ? bids.reduce((highest, bid) => bid.amount > highest.amount ? bid : highest, bids[0])
    : null;
  const userIsHighBidder = user?.id && highestBid?.bidder_id === user.id;

  // Calculate effective minimum bid for the user (accounts for existing max bid)
  const effectiveMinBid = userCurrentMaxBid > 0
    ? userCurrentMaxBid + (bidIncrements.find(b => userCurrentMaxBid < b.max)?.increment || 1000)
    : minBid;

  // Default platform terms if seller has no custom terms
  const defaultPlatformTerms = `PRINTMAILBIDS STANDARD TERMS

1. PAYMENT: Payment is due within 7 days of winning bid or accepted offer.

2. BUYER PREMIUM: An 8% buyer premium will be added to the final sale price.

3. PICKUP/SHIPPING: Buyer is responsible for arranging and paying for pickup or shipping unless otherwise specified by the seller.

4. CONDITION: All equipment is sold AS-IS, WHERE-IS unless otherwise stated in the listing description.

5. INSPECTION: Buyers are encouraged to inspect equipment prior to bidding when possible.

6. TITLE: Title transfers upon receipt of full payment.

By placing a bid, you acknowledge that you have read, understood, and agree to these terms.`;

  // Get effective seller terms (listing-specific overrides profile, fallback to platform default)
  const effectiveSellerTerms = listing?.seller_terms || listing?.seller?.seller_terms || defaultPlatformTerms;

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
      // Track watchlist add
      trackWatchlistAdd(listing.id, user.id);
    }
  };

  // Handler to initiate bid process - shows terms modal if terms exist
  const handleBidClick = () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to bid');
      return;
    }

    // Prevent seller from bidding on their own listing
    if (user.id === listing.seller_id) {
      setError('You cannot bid on your own listing');
      return;
    }

    // Check phone verification
    if (!userPhoneVerified) {
      setShowPhoneVerification(true);
      return;
    }

    const maxBid = parseFormattedNumber(maxBidAmount);
    if (!maxBid || maxBid < minBid) {
      setError(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    // If user already has a max bid, their new max must be at least increment higher
    if (userCurrentMaxBid > 0) {
      const increment = bidIncrements.find(b => userCurrentMaxBid < b.max)?.increment || 100;
      const minNewMaxBid = userCurrentMaxBid + increment;
      if (maxBid < minNewMaxBid) {
        setError(`To increase your max bid, enter at least $${minNewMaxBid.toLocaleString()} (minimum $${increment} increase)`);
        return;
      }
    }

    // Track bid button click
    trackBidClick(listing.id, user.id);

    // If there are seller terms and user hasn't accepted them for this listing, show modal
    // Skip if user has already bid on this listing (they've already accepted)
    if (effectiveSellerTerms && !termsAccepted && !hasAcceptedTermsForListing) {
      setShowTermsModal(true);
      return;
    }

    // Otherwise proceed with bid
    handlePlaceBid();
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

    const userMaxBid = parseFormattedNumber(maxBidAmount);
    if (!userMaxBid || userMaxBid < minBid) {
      setError(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    setSubmittingBid(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call the server-side API endpoint
      const response = await fetch('/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          maxBid: userMaxBid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place bid');
      }

      // Reload listing to get updated data
      const { data: updatedListing } = await supabase
        .from('listings')
        .select(`
          *,
          category:categories!listings_primary_category_id_fkey(name, slug),
          seller:profiles(id, full_name, company_name, avatar_url, seller_rating, seller_review_count, seller_terms, is_verified, created_at),
          images:listing_images(id, url, is_primary, sort_order)
        `)
        .eq('id', listingId)
        .single();

      if (updatedListing) {
        setListing(updatedListing as unknown as Listing);
      }

      // Reload bids
      const { data: bidData } = await supabase
        .from('bids')
        .select(`
          *,
          bidder:profiles!bids_bidder_id_fkey(email)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (bidData) {
        setBids(bidData);
      }

      // Mark that user has now accepted terms for this listing
      setHasAcceptedTermsForListing(true);

      // Clear the input and show message
      setMaxBidAmount('');
      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const [processingBuyNow, setProcessingBuyNow] = useState(false);

  const handleBuyNow = async () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to purchase');
      return;
    }

    // Check phone verification
    if (!userPhoneVerified) {
      setShowPhoneVerification(true);
      return;
    }

    const price = listing.buy_now_price || listing.fixed_price;
    if (!price) return;

    // Calculate buyer premium
    const buyerPremium = price * 0.08;
    const total = price + buyerPremium;

    const confirmed = confirm(
      `Buy Now for $${price.toLocaleString()}?\n\n` +
      `Item Price: $${price.toLocaleString()}\n` +
      `Buyer Premium (8%): $${buyerPremium.toLocaleString()}\n` +
      `Total: $${total.toLocaleString()}\n\n` +
      `You will be redirected to complete payment.`
    );

    if (!confirmed) return;

    setProcessingBuyNow(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process purchase');
      }

      // Redirect to Stripe Checkout
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process purchase');
      setProcessingBuyNow(false);
    }
  };

  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerTermsAccepted, setOfferTermsAccepted] = useState(false);

  const handleMakeOffer = async () => {
    if (!user?.id || !listing) {
      setError('You must be logged in to make an offer');
      return;
    }

    // Check phone verification
    if (!userPhoneVerified) {
      setShowPhoneVerification(true);
      return;
    }

    const amount = parseFormattedNumber(offerAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid offer amount');
      return;
    }

    if (!offerTermsAccepted) {
      setError('You must agree to the offer terms to submit an offer');
      return;
    }

    setSubmittingOffer(true);
    setError(null);

    try {
      const response = await fetch('/api/offers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          amount,
          message: offerMessage || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit offer');
      }

      if (result.autoAccepted) {
        // Offer was auto-accepted, redirect to invoice
        setSuccessMessage('Your offer was automatically accepted! Redirecting to payment...');
        setTimeout(() => {
          window.location.href = `/dashboard/invoices/${result.invoiceId}`;
        }, 2000);
      } else {
        setSuccessMessage(result.message);
        setShowMakeOffer(false);
        setOfferAmount('');
        setOfferMessage('');
        setOfferTermsAccepted(false);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit offer');
    } finally {
      setSubmittingOffer(false);
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
      // Check if conversation already exists for this listing between these users
      const { data: existingConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${listing.seller_id}),and(participant_1_id.eq.${listing.seller_id},participant_2_id.eq.${user.id})`);

      if (existingConvos && existingConvos.length > 0) {
        router.push(`/dashboard/messages/${existingConvos[0].id}`);
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

      if (createError) {
        console.error('Error creating conversation:', createError);
        setError('Failed to start conversation. Please try again.');
        return;
      }

      router.push(`/dashboard/messages/${newConvo.id}`);
    } catch (err) {
      console.error('Error in contactSeller:', err);
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
      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            {shareToast}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[250px] landscape:h-[35vh] sm:h-[350px] lg:h-[450px] bg-gray-50 relative flex items-center justify-center">
                {images.length > 0 && images[currentImageIndex]?.url ? (
                  <img
                    src={images[currentImageIndex].url}
                    alt={listing.title}
                    className="max-w-full max-h-full object-contain cursor-zoom-in"
                    onClick={() => setShowLightbox(true)}
                  />
                ) : (
                  <Package className="h-12 w-12 text-gray-300" />
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {/* Image counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails - hidden on mobile, shown on sm+ */}
              {images.length > 1 && (
                <div className="hidden sm:flex p-2 gap-1.5 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-14 h-14 flex-shrink-0 rounded overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Embed */}
            {listing.video_url && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="aspect-video landscape:h-[30vh] landscape:aspect-auto bg-gray-900"
                  onClick={() => {
                    if (!videoPlayed) {
                      trackVideoPlay(listing.id, user?.id);
                      setVideoPlayed(true);
                    }
                  }}
                >
                  {getYouTubeVideoId(listing.video_url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(listing.video_url)}?enablejsapi=1`}
                      title="Equipment Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : getVimeoVideoId(listing.video_url) ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${getVimeoVideoId(listing.video_url)}`}
                      title="Equipment Video"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <a
                        href={listing.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                        onClick={() => {
                          if (!videoPlayed) {
                            trackVideoPlay(listing.id, user?.id);
                            setVideoPlayed(true);
                          }
                        }}
                      >
                        <Video className="h-6 w-6" />
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Title and quick info */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={toggleWatchlist}
                    className={`p-1.5 rounded-lg border ${
                      isWatching
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isWatching ? 'fill-current' : ''}`} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    {showShareMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowShareMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={async () => {
                              if (listing) {
                                // Try native share API first (mobile)
                                if (navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: listing.title,
                                      text: `Check out this ${listing.make} ${listing.model} on PrintMailBids`,
                                      url: window.location.href,
                                    });
                                    trackShare(listing.id, user?.id, 'native');
                                  } catch (err) {
                                    // User cancelled or share failed, fall back to copy
                                    if ((err as Error).name !== 'AbortError') {
                                      await navigator.clipboard.writeText(window.location.href);
                                      trackShare(listing.id, user?.id, 'copy');
                                      setShareToast('Link copied to clipboard!');
                                    }
                                  }
                                } else {
                                  await navigator.clipboard.writeText(window.location.href);
                                  trackShare(listing.id, user?.id, 'copy');
                                  setShareToast('Link copied to clipboard!');
                                }
                              }
                              setShowShareMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </button>
                          <button
                            onClick={() => {
                              if (listing) {
                                const subject = encodeURIComponent(`Check out: ${listing.title}`);
                                const body = encodeURIComponent(`I found this ${listing.make} ${listing.model} on PrintMailBids:\n\n${window.location.href}`);
                                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                                trackShare(listing.id, user?.id, 'email');
                              }
                              setShowShareMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              if (listing) {
                                const url = encodeURIComponent(window.location.href);
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                                trackShare(listing.id, user?.id, 'facebook');
                              }
                              setShowShareMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Facebook className="h-4 w-4" />
                            Facebook
                          </button>
                          <button
                            onClick={() => {
                              if (listing) {
                                const url = encodeURIComponent(window.location.href);
                                const text = encodeURIComponent(`Check out this ${listing.make} ${listing.model} on @PrintMailBids`);
                                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                                trackShare(listing.id, user?.id, 'twitter');
                              }
                              setShowShareMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Twitter className="h-4 w-4" />
                            Twitter / X
                          </button>
                          <button
                            onClick={() => {
                              if (listing) {
                                const url = encodeURIComponent(window.location.href);
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
                                trackShare(listing.id, user?.id, 'linkedin');
                              }
                              setShowShareMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {listing.view_count || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {listing.watch_count || 0} watching
                </span>
              </div>
            </div>

            {/* Description / Terms / Shipping Tabs */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                    activeTab === 'terms'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500'
                  }`}
                >
                  Terms
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                    activeTab === 'shipping'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500'
                  }`}
                >
                  Shipping
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'description' && (
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                    {listing.description || 'No description provided.'}
                  </div>
                )}

                {activeTab === 'terms' && (
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                    {effectiveSellerTerms || (
                      <p className="text-gray-400 italic">No seller terms specified for this listing.</p>
                    )}
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                    {listing.shipping_info || (
                      <p className="text-gray-400 italic">No shipping information provided. Contact seller for details.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Specifications</h2>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-4">
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
                {listing.output_stacker_count && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Total Cycle Count</span>
                    <span className="font-medium text-gray-900">{listing.output_stacker_count.toLocaleString()}</span>
                  </div>
                )}
                {listing.weight_lbs && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-medium text-gray-900">{listing.weight_lbs.toLocaleString()} lbs</span>
                  </div>
                )}
                {(listing.floor_length_ft || listing.floor_width_ft) && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Floor Space</span>
                    <span className="font-medium text-gray-900">
                      {listing.floor_length_ft || '—'} ft × {listing.floor_width_ft || '—'} ft
                    </span>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Pickup & Logistics
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="space-y-4 sm:space-y-6">
            {/* Bidding Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:sticky lg:top-4">
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
                  {listing.listing_type === 'auction' || listing.listing_type === 'auction_with_offers' ? (
                    <>
                      {/* Soft-close indicator */}
                      {listing.end_time && isInSoftCloseWindow(listing.end_time) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-blue-700 font-medium">
                            <Clock className="h-5 w-5 animate-pulse" />
                            SOFT CLOSE ACTIVE
                          </div>
                          <p className="text-sm text-blue-600 mt-1">
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
                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <span className="text-sm sm:text-base text-gray-500">{listingIsClosed ? 'Final Price' : 'Current Bid'}</span>
                          <button
                            onClick={() => setShowBidHistory(!showBidHistory)}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                          >
                            {listing.bid_count || 0} bids
                          </button>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                          ${currentBid.toLocaleString()}
                        </p>
                        {listing.reserve_price && !listingIsClosed && (
                          <p className={`text-xs sm:text-sm mt-1 ${reserveMet ? 'text-green-600' : 'text-yellow-600'}`}>
                            {reserveMet ? '✓ Reserve met' : 'Reserve not met'}
                          </p>
                        )}
                      </div>

                      {/* Bid History Timeline */}
                      {showBidHistory && (
                        <div className="mb-6 border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-green-600" />
                              Verified Bid History
                            </h3>
                            <span className="text-xs text-gray-500">{bids.length} total bids</span>
                          </div>
                          {bids.length > 0 ? (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {bids.map((bid, index) => {
                                const isHighBid = index === 0 || (bids[0] && bid.amount === bids[0].amount);
                                const isCurrentUser = user?.id === bid.bidder_id;
                                const bidderEmail = bid.bidder?.email || '';
                                return (
                                  <div
                                    key={bid.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                                      isHighBid ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium ${isHighBid ? 'text-green-700' : 'text-gray-900'}`}>
                                          ${bid.amount.toLocaleString()}
                                        </span>
                                        {bid.is_auto_bid && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                            Auto
                                          </span>
                                        )}
                                        {isHighBid && (
                                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                            High Bid
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {isCurrentUser ? (
                                          <span className="text-blue-600 font-medium">You</span>
                                        ) : (
                                          <span>{anonymizeEmail(bidderEmail)}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                                      <div>{new Date(bid.created_at).toLocaleDateString()}</div>
                                      <div>{new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No bids yet. Be the first!</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Shield className="h-3 w-3 text-green-600" />
                              All bids are verified and timestamped for transparency
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Place bid - only for active listings */}
                      {!listingIsClosed && (
                        <div className="mb-4">
                          {/* Show user's current max bid status */}
                          {user?.id && userCurrentMaxBid > 0 && (
                            <div className={`p-3 rounded-lg mb-4 ${
                              userIsHighBidder
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${
                                  userIsHighBidder ? 'text-green-700' : 'text-yellow-700'
                                }`}>
                                  {userIsHighBidder ? 'You are the high bidder!' : 'You have been outbid'}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                Your max bid: <span className="font-semibold">${userCurrentMaxBid.toLocaleString()}</span>
                              </div>
                            </div>
                          )}

                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {userCurrentMaxBid > 0 ? 'Increase Your Maximum Bid' : 'Your Maximum Bid'}
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            Enter the most you&apos;re willing to pay. We&apos;ll bid the minimum needed to keep you ahead, up to your max.
                          </p>
                          <div className="relative mb-3">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={maxBidAmount}
                              onChange={(e) => setMaxBidAmount(formatWithCommas(e.target.value))}
                              placeholder={`Min: $${effectiveMinBid.toLocaleString()}`}
                              className="w-full pl-8 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            />
                            {/* Increment/Decrement buttons */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFormattedNumber(maxBidAmount) || (userCurrentMaxBid > 0 ? userCurrentMaxBid : minBid);
                                  const increment = bidIncrements.find(b => currentValue < b.max)?.increment || 100;
                                  const newValue = Math.max(minBid, currentValue - increment);
                                  setMaxBidAmount(newValue.toLocaleString());
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title={`Decrease by $${(bidIncrements.find(b => (parseFormattedNumber(maxBidAmount) || minBid) < b.max)?.increment || 100).toLocaleString()}`}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFormattedNumber(maxBidAmount) || (userCurrentMaxBid > 0 ? userCurrentMaxBid : minBid - (bidIncrements.find(b => minBid < b.max)?.increment || 100));
                                  const increment = bidIncrements.find(b => currentValue < b.max)?.increment || 100;
                                  setMaxBidAmount((currentValue + increment).toLocaleString());
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={`Increase by $${(bidIncrements.find(b => (parseFormattedNumber(maxBidAmount) || minBid) < b.max)?.increment || 100).toLocaleString()}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Inline error/success messages for bid form */}
                          {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
                              <X className="h-4 w-4 flex-shrink-0" />
                              {error}
                            </div>
                          )}
                          {successMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
                              <Check className="h-4 w-4 flex-shrink-0" />
                              {successMessage}
                            </div>
                          )}

                          <button
                            onClick={handleBidClick}
                            disabled={submittingBid}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {submittingBid ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Placing Bid...
                              </>
                            ) : (
                              <>
                                <Gavel className="h-5 w-5" />
                                Place Bid
                              </>
                            )}
                          </button>
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-2">
                            <p className="text-xs text-blue-700 flex items-start gap-2">
                              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>Proxy Bidding:</strong> Once the reserve is met, we&apos;ll automatically bid the minimum needed to keep you ahead (up to your max). Your max bid is kept secret.
                              </span>
                            </p>
                            {listing.reserve_price && !reserveMet && (
                              <p className="text-xs text-yellow-700 flex items-start gap-2">
                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong>Note:</strong> Reserve not yet met. Your bid will be placed at the amount entered until the reserve is reached.
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}

              {/* Make Offer - only for active listings */}
              {!listingIsClosed && listing.accept_offers && (
                <>
                  {!showMakeOffer ? (
                    <button
                      onClick={() => {
                        setShowMakeOffer(true);
                        if (listing) {
                          trackOfferClick(listing.id, user?.id);
                        }
                      }}
                      className="w-full py-3 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                      <DollarSign className="h-5 w-5 inline mr-1" />
                      Make an Offer
                    </button>
                  ) : (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Make an Offer</h4>
                        <button
                          onClick={() => {
                            setShowMakeOffer(false);
                            setOfferAmount('');
                            setOfferMessage('');
                            setOfferTermsAccepted(false);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Your Offer Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={offerAmount}
                              onChange={(e) => setOfferAmount(formatWithCommas(e.target.value))}
                              placeholder="Enter amount"
                              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </div>
                          {listing.auto_decline_price && (
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum: ${listing.auto_decline_price.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Message (optional)</label>
                          <textarea
                            value={offerMessage}
                            onChange={(e) => setOfferMessage(e.target.value)}
                            placeholder="Add a message to the seller..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm resize-none"
                          />
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <Info className="h-3 w-3 inline mr-1" />
                            Offers expire in 48 hours. You can make up to 3 offers per listing.
                            {listing.auto_accept_price && (
                              <span className="block mt-1 text-green-600">
                                Offers at ${listing.auto_accept_price.toLocaleString()} or above are automatically accepted.
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Offer Terms Agreement */}
                        <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={offerTermsAccepted}
                            onChange={(e) => setOfferTermsAccepted(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-amber-900">
                            <strong>I understand this is a binding offer.</strong> If the seller accepts, I am obligated to complete the purchase at this price. Payment will be due within {listing.payment_due_days || 7} days of acceptance.
                          </span>
                        </label>

                        <button
                          onClick={handleMakeOffer}
                          disabled={submittingOffer || !offerAmount || !offerTermsAccepted}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submittingOffer ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-5 w-5" />
                              Submit Offer
                            </>
                          )}
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
                    <span>8% buyer premium</span>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Card */}
            {listing.seller && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Seller Information</h3>
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <Link
                    href={`/seller/${listing.seller.id}`}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-blue-200 transition-colors overflow-hidden relative"
                  >
                    {listing.seller.avatar_url ? (
                      <Image
                        src={listing.seller.avatar_url}
                        alt={listing.seller.company_name || listing.seller.full_name || 'Seller'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/seller/${listing.seller.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1 text-sm sm:text-base truncate transition-colors"
                    >
                      {listing.seller.company_name || listing.seller.full_name || 'Seller'}
                      {listing.seller.is_verified && (
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </Link>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                      <span>{listing.seller.seller_rating || 0}</span>
                      <span>({listing.seller.seller_review_count || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  Member since {new Date(listing.seller.created_at).getFullYear()}
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/seller/${listing.seller.id}`}
                    className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    View All Listings
                  </Link>
                  <button
                    onClick={contactSeller}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Contact Seller
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Payment Methods</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {listing.accepts_credit_card && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    Credit Card (2.9% + $0.30)
                  </div>
                )}
                {listing.accepts_ach && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    ACH Bank Transfer (0.8%, max $5)
                  </div>
                )}
                {listing.accepts_wire && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    Wire Transfer
                  </div>
                )}
                {listing.accepts_check && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    Check
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Payment due within {listing.payment_due_days || 7} days of auction end
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Agreement Modal */}
      {showTermsModal && effectiveSellerTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {listing?.seller_terms || listing?.seller?.seller_terms ? 'Seller Terms' : 'Terms & Conditions'}
                </h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">
                {listing?.seller_terms || listing?.seller?.seller_terms
                  ? "Please review and accept the seller's terms before placing your bid."
                  : "Please review and accept the terms before placing your bid."}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {effectiveSellerTerms}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {listing?.seller_terms || listing?.seller?.seller_terms
                    ? "I have read and agree to the seller's terms and conditions for this listing"
                    : "I have read and agree to the terms and conditions"}
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (termsAccepted) {
                      setShowTermsModal(false);
                      handlePlaceBid();
                    }
                  }}
                  disabled={!termsAccepted || submittingBid}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingBid ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Bid...
                    </>
                  ) : (
                    <>
                      <Gavel className="h-4 w-4" />
                      Accept & Place Bid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Verification Modal */}
      {showPhoneVerification && user?.id && (
        <PhoneVerification
          userId={user.id}
          isVerified={userPhoneVerified}
          showAsModal={true}
          onVerified={() => {
            setUserPhoneVerified(true);
            setShowPhoneVerification(false);
            setSuccessMessage('Phone verified! You can now place bids and make offers.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
          onClose={() => setShowPhoneVerification(false)}
        />
      )}

      {/* Image Lightbox Modal */}
      {showLightbox && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white/80 bg-black/50 px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Main image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentImageIndex].url}
              alt={listing.title}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                    currentImageIndex === index ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
