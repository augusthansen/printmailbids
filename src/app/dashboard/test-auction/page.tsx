'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Clock,
  Play,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  Gavel,
  StopCircle
} from 'lucide-react';

interface TestListing {
  id: string;
  title: string;
  current_price: number;
  starting_price: number;
  end_time: string;
  original_end_time: string | null;
  bid_count: number;
  status: string;
}

export default function TestAuctionPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [testListings, setTestListings] = useState<TestListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('Test Auction - Soft Close Demo');
  const [startingPrice, setStartingPrice] = useState('100');
  const [durationMinutes, setDurationMinutes] = useState('3'); // Default 3 minutes

  // Load test listings
  const loadTestListings = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('listings')
      .select('id, title, current_price, starting_price, end_time, original_end_time, bid_count, status')
      .eq('seller_id', user.id)
      .ilike('title', '%Test%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTestListings(data as TestListing[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTestListings();

    // Refresh every 5 seconds to see time updates
    const interval = setInterval(loadTestListings, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const createTestAuction = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a test auction');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + parseInt(durationMinutes) * 60 * 1000);

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: title,
          description: `This is a test auction created to demonstrate the soft-close (anti-sniping) feature. The auction will end in ${durationMinutes} minute(s) unless a bid is placed in the final 2 minutes, which will extend the auction.`,
          listing_type: 'auction',
          status: 'active',
          starting_price: parseInt(startingPrice),
          current_price: parseInt(startingPrice),
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          condition: 'good',
          bid_count: 0,
          view_count: 0,
          watch_count: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(`Test auction created! It will end in ${durationMinutes} minute(s).`);
      loadTestListings();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test auction');
    } finally {
      setCreating(false);
    }
  };

  const deleteTestAuction = async (id: string) => {
    if (!confirm('Delete this test auction?')) return;

    try {
      // First delete any bids
      await supabase.from('bids').delete().eq('listing_id', id);
      // Then delete the listing
      await supabase.from('listings').delete().eq('id', id);
      loadTestListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Simulate a bid (creates actual bid record for proper auction processing)
  const simulateBid = async (listing: TestListing) => {
    if (!user?.id) {
      setError('You must be logged in to simulate a bid');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const currentPrice = listing.current_price || listing.starting_price;
      // Calculate next bid based on increment rules
      let increment = 1;
      if (currentPrice >= 10000) increment = 100;
      else if (currentPrice >= 1000) increment = 50;
      else if (currentPrice >= 250) increment = 10;

      const newBidAmount = currentPrice + increment;

      // Check if in soft-close window
      const end = new Date(listing.end_time);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      const inSoftClose = diff > 0 && diff <= 2 * 60 * 1000;

      // Create actual bid record (using current user as bidder for testing)
      const { error: bidError } = await supabase
        .from('bids')
        .insert({
          listing_id: listing.id,
          bidder_id: user.id,
          amount: newBidAmount,
          max_bid: newBidAmount,
          status: 'active',
        });

      if (bidError) throw bidError;

      // Update listing
      const updateData: Record<string, unknown> = {
        current_price: newBidAmount,
        bid_count: (listing.bid_count || 0) + 1,
      };

      // Apply soft-close extension
      if (inSoftClose) {
        const newEndTime = new Date();
        newEndTime.setTime(newEndTime.getTime() + 2 * 60 * 1000);
        updateData.end_time = newEndTime.toISOString();

        if (!listing.original_end_time) {
          updateData.original_end_time = listing.end_time;
        }
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      if (updateError) throw updateError;

      const extensionMsg = inSoftClose ? ' Auction extended by 2 minutes!' : '';
      setSuccess(`Bid of $${newBidAmount.toLocaleString()} placed!${extensionMsg}`);
      loadTestListings();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Ended', urgent: false, inSoftClose: false };

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const inSoftClose = diff <= 2 * 60 * 1000; // 2 minutes

    return {
      text: `${minutes}m ${seconds}s`,
      urgent: diff < 60 * 1000,
      inSoftClose
    };
  };

  const getExtensionCount = (endTime: string, originalEndTime: string | null) => {
    if (!originalEndTime) return 0;
    const end = new Date(endTime);
    const original = new Date(originalEndTime);
    const diffMs = end.getTime() - original.getTime();
    return Math.max(0, Math.round(diffMs / (2 * 60 * 1000)));
  };

  // End auction immediately and process winner
  const endAuctionNow = async (listing: TestListing) => {
    setError(null);
    setSuccess(null);

    try {
      // Set end_time to now (in the past)
      const now = new Date();
      now.setSeconds(now.getSeconds() - 5); // 5 seconds ago

      await supabase
        .from('listings')
        .update({ end_time: now.toISOString() })
        .eq('id', listing.id);

      // Call the process-ended API to create invoice and notify winner
      const response = await fetch('/api/auctions/process-ended', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process auction end');
      }

      const auctionResult = result.results?.find((r: { listing_id: string }) => r.listing_id === listing.id);

      if (auctionResult?.status === 'sold') {
        setSuccess(`Auction ended! Winner notified. Invoice created. Check notifications.`);
      } else if (auctionResult?.status === 'ended') {
        setSuccess(`Auction ended with no winner (${auctionResult.reason === 'no_bids' ? 'no bids' : 'reserve not met'}).`);
      } else {
        setSuccess('Auction processing completed.');
      }

      loadTestListings();
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end auction');
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Login Required</h1>
        <p className="text-gray-600 mb-4">You must be logged in to use the test auction page.</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Auction - Soft Close Demo</h1>
        <p className="text-gray-600">
          Create short test auctions to test the soft-close (anti-sniping) feature.
          Bids placed in the final 2 minutes will extend the auction by 2 minutes.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Create Test Auction Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-green-600" />
          Create Test Auction
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Price ($)
            </label>
            <input
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 minute (for quick testing)</option>
              <option value="2">2 minutes (starts in soft-close)</option>
              <option value="3">3 minutes (default)</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <strong>How to test soft-close:</strong>
          </p>
          <ol className="text-sm text-blue-600 mt-2 list-decimal list-inside space-y-1">
            <li>Create a test auction with 2-3 minute duration</li>
            <li>Wait until the timer shows less than 2 minutes (orange &quot;SOFT CLOSE&quot; label)</li>
            <li>Click the green &quot;Bid&quot; button to simulate a bid from a test user</li>
            <li>Watch the auction extend by 2 minutes!</li>
            <li>Open the listing to see the &quot;SOFT CLOSE ACTIVE&quot; banner and extension count</li>
          </ol>
        </div>

        <button
          onClick={createTestAuction}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Create Test Auction
            </>
          )}
        </button>
      </div>

      {/* Test Listings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Your Test Auctions
          </h2>
          <button
            onClick={loadTestListings}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : testListings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No test auctions yet. Create one above!
          </div>
        ) : (
          <div className="space-y-4">
            {testListings.map((listing) => {
              const timeInfo = getTimeRemaining(listing.end_time);
              const extensions = getExtensionCount(listing.end_time, listing.original_end_time);

              return (
                <div
                  key={listing.id}
                  className={`border rounded-lg p-4 ${
                    timeInfo.inSoftClose ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{listing.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-600">
                          Current: <strong>${(listing.current_price || listing.starting_price).toLocaleString()}</strong>
                        </span>
                        <span className="text-gray-600">
                          Bids: <strong>{listing.bid_count}</strong>
                        </span>
                        {extensions > 0 && (
                          <span className="text-blue-600">
                            Extended {extensions}x
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`text-right mr-2 ${timeInfo.inSoftClose ? 'text-orange-600' : ''}`}>
                        <div className={`font-bold ${timeInfo.urgent ? 'text-red-600' : ''}`}>
                          {timeInfo.text}
                        </div>
                        {timeInfo.inSoftClose && (
                          <div className="text-xs text-orange-600 font-medium">
                            SOFT CLOSE
                          </div>
                        )}
                      </div>

                      {timeInfo.text !== 'Ended' && listing.status === 'active' && (
                        <>
                          <button
                            onClick={() => simulateBid(listing)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                            title="Simulate a bid from a test user"
                          >
                            <Gavel className="h-4 w-4" />
                            Bid
                          </button>
                          <button
                            onClick={() => endAuctionNow(listing)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                            title="End auction immediately and process winner"
                          >
                            <StopCircle className="h-4 w-4" />
                            End
                          </button>
                        </>
                      )}
                      {(timeInfo.text === 'Ended' || listing.status !== 'active') && (
                        <span className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                          listing.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {listing.status === 'sold' ? 'SOLD' : listing.status === 'ended' ? 'ENDED' : listing.status.toUpperCase()}
                        </span>
                      )}

                      <a
                        href={`/listing/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Open listing in new tab"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>

                      <Link
                        href={`/listing/${listing.id}`}
                        className="text-xs text-gray-500 hover:text-blue-600 underline"
                        title="Open listing"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => deleteTestAuction(listing.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete test auction"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">About Soft-Close Auctions</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>What is soft-close?</strong> It&apos;s an anti-sniping mechanism that prevents
            last-second bids from unfairly winning auctions.
          </p>
          <p>
            <strong>How it works:</strong> If any bid is placed in the final 2 minutes of an auction,
            the end time is automatically extended by 2 minutes. This continues until no bids are
            placed in the final 2-minute window.
          </p>
          <p>
            <strong>Why it matters:</strong> This gives all bidders a fair chance to respond to
            last-minute bids, preventing &quot;bid sniping&quot; tactics common on other platforms.
          </p>
        </div>
      </div>
    </div>
  );
}
