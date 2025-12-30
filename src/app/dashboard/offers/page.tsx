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
  buyer?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    email: string;
  };
}

type FilterType = 'all' | 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';

export default function OffersPage() {
  const { user, loading: authLoading, isSeller } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<{ offerId: string; currentAmount: number } | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [messagingBuyer, setMessagingBuyer] = useState<string | null>(null);
  const [acceptModal, setAcceptModal] = useState<Offer | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function loadOffers() {
      // Load offers where user is the seller
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
          buyer:profiles!offers_buyer_id_fkey(
            id,
            full_name,
            company_name,
            email
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
      } else {
        setOffers(data || []);
      }
      setLoading(false);
    }

    loadOffers();
  }, [user?.id, authLoading, loading, supabase]);

  const handleAccept = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'accept' }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to accept offer');
      } else {
        setOffers(offers.map(o =>
          o.id === offerId ? { ...o, status: 'accepted' } : o
        ));
      }
    } catch {
      alert('Failed to accept offer');
    }
    setActionLoading(null);
  };

  const handleDecline = async (offerId: string) => {
    if (!confirm('Are you sure you want to decline this offer?')) return;

    setActionLoading(offerId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'decline' }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to decline offer');
      } else {
        setOffers(offers.map(o =>
          o.id === offerId ? { ...o, status: 'declined' } : o
        ));
      }
    } catch {
      alert('Failed to decline offer');
    }
    setActionLoading(null);
  };

  const handleDismiss = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      // Update the offer status to 'expired' if it's pending, or just remove from view
      const offer = offers.find(o => o.id === offerId);
      if (offer && offer.status === 'pending') {
        // Mark as expired in database
        await supabase
          .from('offers')
          .update({ status: 'expired' })
          .eq('id', offerId);
      }
      // Remove from local state
      setOffers(offers.filter(o => o.id !== offerId));
    } catch {
      alert('Failed to dismiss offer');
    }
    setActionLoading(null);
  };

  // Message buyer - find or create conversation
  const handleMessageBuyer = async (offer: Offer) => {
    if (!user?.id || !offer.listing_id || !offer.buyer_id) return;

    setMessagingBuyer(offer.id);
    try {
      // Check if conversation already exists for this listing between seller and buyer
      const { data: existingConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', offer.listing_id)
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${offer.buyer_id}),and(participant_1_id.eq.${offer.buyer_id},participant_2_id.eq.${user.id})`);

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
          participant_2_id: offer.buyer_id,
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
      console.error('Error messaging buyer:', err);
      alert('Failed to start conversation');
    } finally {
      setMessagingBuyer(null);
    }
  };

  const handleCounter = async () => {
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
      }
    } catch {
      alert('Failed to send counter-offer');
    }
    setActionLoading(null);
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
    // Check if this is a counter-offer from the buyer that needs seller response
    const isCounterFromBuyer = offer.parent_offer_id !== null && offer.status === 'pending';

    if (isCounterFromBuyer) {
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
            Pending
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
            {status}
          </span>
        );
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.status === filter;
  });

  // Count offers needing action (counter-offers from buyer)
  const needsActionCount = offers.filter(o =>
    o.parent_offer_id !== null && o.status === 'pending'
  ).length;

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'pending' && !o.parent_offer_id).length,
    needsAction: needsActionCount,
    accepted: offers.filter(o => o.status === 'accepted').length,
    countered: offers.filter(o => o.status === 'countered').length,
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view offers</h2>
        <p className="text-gray-500 mb-4">Review and respond to offers on your listings</p>
        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Seller Account Required</h2>
        <p className="text-gray-500 mb-4">This page is for sellers to review offers on their listings.</p>
        <Link href="/dashboard/settings" className="text-blue-600 hover:underline">
          Upgrade to Seller Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers Received</h1>
          <p className="text-gray-600 mt-1">Review and respond to offers on your listings</p>
        </div>
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Package className="h-4 w-4" />
          View Listings
        </Link>
      </div>

      {/* Alert for counter-offers needing response */}
      {needsActionCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">
              You have {needsActionCount} counter-offer{needsActionCount > 1 ? 's' : ''} from buyers waiting for your response
            </p>
            <p className="text-sm text-blue-600">
              Review and accept, counter, or decline the buyer&apos;s counter-offers below
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Offers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Countered</p>
          <p className="text-2xl font-bold text-blue-600">{stats.countered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'declined', 'countered', 'expired'] as FilterType[]).map(f => (
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
            {f === 'pending' && stats.pending > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 rounded-full">
                {stats.pending}
              </span>
            )}
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
              ? 'When buyers submit offers on your listings, they\'ll appear here'
              : 'Try a different filter to see more offers'}
          </p>
          <Link
            href="/dashboard/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="h-5 w-5" />
            View My Listings
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {filteredOffers.map(offer => {
              const listing = offer.listing;
              const buyer = offer.buyer;
              const timeRemaining = getTimeRemaining(offer.expires_at);
              const primaryImage = listing?.images?.find(img => img.is_primary)?.url ||
                listing?.images?.[0]?.url;
              const isPending = offer.status === 'pending';
              const isCounterFromBuyer = offer.parent_offer_id !== null && isPending;

              return (
                <div
                  key={offer.id}
                  className={`p-4 transition-colors ${
                    isCounterFromBuyer
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
                              From: <span className="font-medium text-gray-900">
                                {buyer?.company_name || buyer?.full_name || buyer?.email}
                              </span>
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(offer)}
                      </div>

                      <div className="mt-2 flex items-center gap-4">
                        <div className="bg-green-50 px-3 py-1.5 rounded-lg">
                          <span className="text-sm text-gray-500">Offer: </span>
                          <span className="text-lg font-bold text-green-600">
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

                      {isCounterFromBuyer && (
                        <div className="mt-2 text-sm text-blue-700 font-medium">
                          The buyer has sent you a counter-offer. Accept, counter, or decline below.
                        </div>
                      )}

                      {offer.parent_offer_id && !isCounterFromBuyer && (
                        <div className="mt-2 text-xs text-blue-600">
                          <ArrowRightLeft className="h-3 w-3 inline mr-1" />
                          Counter-offer (Round {offer.counter_count})
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {isPending && !timeRemaining.expired && (
                          <>
                            <button
                              onClick={() => setAcceptModal(offer)}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === offer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                setCounterModal({ offerId: offer.id, currentAmount: offer.amount });
                                setCounterAmount('');
                              }}
                              disabled={actionLoading === offer.id || offer.counter_count >= 3}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                              Counter
                            </button>
                            <button
                              onClick={() => handleDecline(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleMessageBuyer(offer)}
                          disabled={messagingBuyer === offer.id}
                          className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1"
                        >
                          {messagingBuyer === offer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          Message Buyer
                        </button>
                        <Link
                          href={`/listing/${listing?.id}`}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Listing
                        </Link>
                        {/* Dismiss button for expired offers or completed offers */}
                        {(timeRemaining.expired || offer.status === 'expired' || offer.status === 'declined' || offer.status === 'accepted' || offer.status === 'withdrawn') && (
                          <button
                            onClick={() => handleDismiss(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-300 disabled:opacity-50 flex items-center gap-1"
                            title="Remove from list"
                          >
                            {actionLoading === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Dismiss
                          </button>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        Received: {new Date(offer.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accept Offer?</h3>

            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Offer Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ${acceptModal.amount.toLocaleString()}
                </p>
                {acceptModal.listing?.fixed_price && (
                  <p className="text-sm text-gray-500 mt-1">
                    List Price: ${acceptModal.listing.fixed_price.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">From:</span>{' '}
                {acceptModal.buyer?.company_name || acceptModal.buyer?.full_name || acceptModal.buyer?.email}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Listing:</span>{' '}
                {acceptModal.listing?.title}
              </div>

              {acceptModal.message && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <MessageSquare className="h-4 w-4 inline mr-1 text-gray-400" />
                  &quot;{acceptModal.message}&quot;
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-4">
              By accepting, you agree to sell this item at the offered price. An invoice will be created for the buyer.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  const offerId = acceptModal.id;
                  setAcceptModal(null);
                  await handleAccept(offerId);
                }}
                disabled={actionLoading === acceptModal.id}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {actionLoading === acceptModal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Yes, Accept Offer
                  </>
                )}
              </button>

              {acceptModal.counter_count < 3 && (
                <button
                  onClick={() => {
                    const offer = acceptModal;
                    setAcceptModal(null);
                    setCounterModal({ offerId: offer.id, currentAmount: offer.amount });
                    setCounterAmount('');
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Make a Counter-Offer Instead
                </button>
              )}

              <button
                onClick={() => setAcceptModal(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Counter-Offer</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Original offer: <span className="font-semibold text-gray-900">${counterModal.currentAmount.toLocaleString()}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your counter-offer amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Add a message to the buyer..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="flex gap-3">
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
                onClick={handleCounter}
                disabled={actionLoading === counterModal.offerId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === counterModal.offerId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    Send Counter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
