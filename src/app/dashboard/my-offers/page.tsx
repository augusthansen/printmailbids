'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Package,
  Loader2,
  ArrowRightLeft,
  ExternalLink,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'withdrawn';
  parent_offer_id: string | null;
  counter_count: number;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    fixed_price: number | null;
    images: { url: string; is_primary: boolean }[];
  };
  seller?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  };
  // For counter-offers, we need to track the chain
  counter_offer?: Offer;
}

type FilterType = 'all' | 'pending' | 'accepted' | 'declined' | 'countered';

export default function MyOffersPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<{ offerId: string; currentAmount: number; counterCount: number } | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [messagingSeller, setMessagingSeller] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function loadOffers() {
      // Load offers where user is the buyer
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          listing:listings(
            id,
            title,
            fixed_price,
            images:listing_images(url, is_primary)
          ),
          seller:profiles!offers_seller_id_fkey(
            id,
            full_name,
            company_name
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
      } else {
        setOffers(data || []);
      }
      setLoading(false);
    }

    loadOffers();
  }, [user?.id, authLoading, supabase]);

  const handleWithdraw = async (offerId: string) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return;

    setActionLoading(offerId);
    try {
      const response = await fetch('/api/offers/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to withdraw offer');
      } else {
        setOffers(offers.map(o =>
          o.id === offerId ? { ...o, status: 'withdrawn' } : o
        ));
      }
    } catch {
      alert('Failed to withdraw offer');
    }
    setActionLoading(null);
  };

  const handleAcceptCounter = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'accept' }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to accept counter-offer');
      } else {
        setOffers(offers.map(o =>
          o.id === offerId ? { ...o, status: 'accepted' } : o
        ));
        if (result.invoiceId) {
          window.location.href = `/dashboard/invoices/${result.invoiceId}`;
        }
      }
    } catch {
      alert('Failed to accept counter-offer');
    }
    setActionLoading(null);
  };

  const handleDeclineCounter = async (offerId: string) => {
    if (!confirm('Are you sure you want to decline this counter-offer?')) return;

    setActionLoading(offerId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'decline' }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to decline counter-offer');
      } else {
        setOffers(offers.map(o =>
          o.id === offerId ? { ...o, status: 'declined' } : o
        ));
      }
    } catch {
      alert('Failed to decline counter-offer');
    }
    setActionLoading(null);
  };

  const handleCounterBack = async () => {
    if (!counterModal) return;

    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setActionLoading(counterModal.offerId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: counterModal.offerId,
          action: 'counter',
          counterAmount: amount,
          counterMessage: counterMessage || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to send counter-offer');
      } else {
        setOffers(offers.map(o =>
          o.id === counterModal.offerId ? { ...o, status: 'countered' } : o
        ));
        setCounterModal(null);
        setCounterAmount('');
        setCounterMessage('');
        alert('Counter-offer sent! The seller will be notified.');
      }
    } catch {
      alert('Failed to send counter-offer');
    }
    setActionLoading(null);
  };

  // Message seller - find or create conversation
  const handleMessageSeller = async (offer: Offer) => {
    if (!user?.id || !offer.listing_id || !offer.seller_id) return;

    setMessagingSeller(offer.id);
    try {
      // Check if conversation already exists for this listing between buyer and seller
      const { data: existingConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', offer.listing_id)
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${offer.seller_id}),and(participant_1_id.eq.${offer.seller_id},participant_2_id.eq.${user.id})`);

      if (existingConvos && existingConvos.length > 0) {
        router.push(`/dashboard/messages/${existingConvos[0].id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error: createError } = await supabase
        .from('conversations')
        .insert({
          listing_id: offer.listing_id,
          participant_1_id: user.id,
          participant_2_id: offer.seller_id,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        alert('Failed to start conversation');
        return;
      }

      router.push(`/dashboard/messages/${newConvo.id}`);
    } catch (err) {
      console.error('Error messaging seller:', err);
      alert('Failed to start conversation');
    } finally {
      setMessagingSeller(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Expired', expired: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, expired: false };
    }
    if (hours > 0) return { text: `${hours}h ${minutes}m`, expired: false };
    return { text: `${minutes}m`, expired: false };
  };

  const getStatusBadge = (offer: Offer) => {
    // Check if this is a counter-offer from the seller that needs buyer response
    const isCounterFromSeller = offer.parent_offer_id !== null && offer.status === 'pending';

    if (isCounterFromSeller) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          <ArrowRightLeft className="h-3 w-3" />
          Counter - Action Needed
        </span>
      );
    }

    switch (offer.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            Awaiting Response
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      case 'countered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <ArrowRightLeft className="h-3 w-3" />
            Countered
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            <AlertCircle className="h-3 w-3" />
            Expired
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            <XCircle className="h-3 w-3" />
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {offer.status}
          </span>
        );
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      // Include both pending offers and counter-offers needing response
      return offer.status === 'pending';
    }
    return offer.status === filter;
  });

  // Count offers needing action (counter-offers from seller)
  const needsActionCount = offers.filter(o =>
    o.parent_offer_id !== null && o.status === 'pending'
  ).length;

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'pending' && !o.parent_offer_id).length,
    needsAction: needsActionCount,
    accepted: offers.filter(o => o.status === 'accepted').length,
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your offers</h2>
        <p className="text-gray-500 mb-4">Track offers you&apos;ve made on listings</p>
        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
          <p className="text-gray-600 mt-1">Track offers you&apos;ve made and respond to counter-offers</p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Package className="h-4 w-4" />
          Browse Listings
        </Link>
      </div>

      {/* Alert for counter-offers needing response */}
      {needsActionCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">
              You have {needsActionCount} counter-offer{needsActionCount > 1 ? 's' : ''} waiting for your response
            </p>
            <p className="text-sm text-blue-600">
              Review and accept or decline the seller&apos;s counter-offers below
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Offers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Awaiting Response</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Action Needed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.needsAction}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'declined', 'countered'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No offers yet' : `No ${filter} offers`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'When you make offers on listings, they\'ll appear here'
              : 'Try a different filter to see more offers'}
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="h-5 w-5" />
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {filteredOffers.map(offer => {
              const listing = offer.listing;
              const seller = offer.seller;
              const timeRemaining = getTimeRemaining(offer.expires_at);
              const primaryImage = listing?.images?.find(img => img.is_primary)?.url ||
                listing?.images?.[0]?.url;
              const isPending = offer.status === 'pending';
              const isCounterFromSeller = offer.parent_offer_id !== null && isPending;

              return (
                <div
                  key={offer.id}
                  className={`p-4 transition-colors ${
                    isCounterFromSeller
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <Link href={`/listing/${listing?.id}`} className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing?.title || 'Listing'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/listing/${listing?.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                          >
                            {listing?.title || 'Unknown Listing'}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className="text-gray-500">
                              Seller: <span className="font-medium text-gray-900">
                                {seller?.company_name || seller?.full_name || 'Unknown'}
                              </span>
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(offer)}
                      </div>

                      <div className="mt-2 flex items-center gap-4">
                        <div className={`px-3 py-1.5 rounded-lg ${
                          isCounterFromSeller ? 'bg-blue-100' : 'bg-blue-50'
                        }`}>
                          <span className="text-sm text-gray-500">
                            {isCounterFromSeller ? 'Counter-Offer: ' : 'Your Offer: '}
                          </span>
                          <span className={`text-lg font-bold ${
                            isCounterFromSeller ? 'text-blue-600' : 'text-blue-600'
                          }`}>
                            ${offer.amount.toLocaleString()}
                          </span>
                        </div>
                        {listing?.fixed_price && (
                          <div className="text-sm text-gray-500">
                            List Price: ${listing.fixed_price.toLocaleString()}
                          </div>
                        )}
                        {isPending && (
                          <div className={`text-sm ${timeRemaining.expired ? 'text-red-600' : 'text-gray-500'}`}>
                            <Clock className="h-4 w-4 inline mr-1" />
                            {timeRemaining.expired ? 'Expired' : `Expires in ${timeRemaining.text}`}
                          </div>
                        )}
                      </div>

                      {offer.message && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <MessageSquare className="h-4 w-4 inline mr-1 text-gray-400" />
                          &quot;{offer.message}&quot;
                        </div>
                      )}

                      {isCounterFromSeller && (
                        <div className="mt-2 text-sm text-blue-700 font-medium">
                          The seller has sent you a counter-offer. Accept or decline below.
                        </div>
                      )}

                      {offer.parent_offer_id && !isCounterFromSeller && (
                        <div className="mt-2 text-xs text-blue-600">
                          <ArrowRightLeft className="h-3 w-3 inline mr-1" />
                          Counter-offer (Round {offer.counter_count})
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {isCounterFromSeller && !timeRemaining.expired && (
                          <>
                            <button
                              onClick={() => handleAcceptCounter(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === offer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Accept Counter
                            </button>
                            {offer.counter_count < 3 && (
                              <button
                                onClick={() => {
                                  setCounterModal({
                                    offerId: offer.id,
                                    currentAmount: offer.amount,
                                    counterCount: offer.counter_count,
                                  });
                                  setCounterAmount('');
                                  setCounterMessage('');
                                }}
                                disabled={actionLoading === offer.id}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                                Counter Back
                              </button>
                            )}
                            <button
                              onClick={() => handleDeclineCounter(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </button>
                          </>
                        )}
                        {isPending && !isCounterFromSeller && !timeRemaining.expired && (
                          <button
                            onClick={() => handleWithdraw(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                          >
                            {actionLoading === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Withdraw
                          </button>
                        )}
                        <button
                          onClick={() => handleMessageSeller(offer)}
                          disabled={messagingSeller === offer.id}
                          className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1"
                        >
                          {messagingSeller === offer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          Message Seller
                        </button>
                        <Link
                          href={`/listing/${listing?.id}`}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Listing
                        </Link>
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        Submitted: {new Date(offer.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Counter Modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Counter-Offer Back to Seller
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Seller&apos;s counter-offer</p>
              <p className="text-xl font-bold text-blue-600">
                ${counterModal.currentAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Round {counterModal.counterCount + 1} of 3
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Counter Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCounterModal(null);
                  setCounterAmount('');
                  setCounterMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCounterBack}
                disabled={actionLoading === counterModal.offerId || !counterAmount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === counterModal.offerId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4" />
                )}
                Send Counter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
