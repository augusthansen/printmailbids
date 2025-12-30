import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { sendOutbidEmail } from '@/lib/email';

// Soft-close window: 2 minutes (in milliseconds)
const SOFT_CLOSE_WINDOW_MS = 2 * 60 * 1000;

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

function isInSoftCloseWindow(endTime: string): boolean {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= SOFT_CLOSE_WINDOW_MS;
}

interface Listing {
  id: string;
  title: string;
  seller_id: string;
  current_price: number;
  starting_price: number;
  reserve_price: number;
  bid_count: number;
  end_time: string;
  original_end_time: string | null;
}

interface Bid {
  id: string;
  amount: number;
  max_bid: number;
  bidder_id: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to bid' }, { status: 401 });
    }

    // Parse request body
    const { listingId, maxBid } = await request.json();

    if (!listingId || !maxBid) {
      return NextResponse.json({ error: 'Missing listingId or maxBid' }, { status: 400 });
    }

    const userMaxBid = parseInt(maxBid);
    if (isNaN(userMaxBid) || userMaxBid <= 0) {
      return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 });
    }

    // Use admin client for all database operations (bypasses RLS)
    const adminClient = createAdminClient();

    // Get listing
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .select('id, title, seller_id, current_price, starting_price, reserve_price, bid_count, end_time, original_end_time')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prevent seller from bidding on their own listing
    if (user.id === listing.seller_id) {
      return NextResponse.json({ error: 'You cannot bid on your own listing' }, { status: 403 });
    }

    // Calculate minimum bid
    const currentPrice = listing.current_price || listing.starting_price || 0;
    const minBid = getMinNextBid(currentPrice);

    if (userMaxBid < minBid) {
      return NextResponse.json({ error: `Minimum bid is $${minBid.toLocaleString()}` }, { status: 400 });
    }

    // Get current highest bid
    const { data: currentHighestBids } = await adminClient
      .from('bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('amount', { ascending: false })
      .limit(1);

    const currentHighestBid = currentHighestBids?.[0] as Bid | undefined;
    const currentHighBidderMaxBid = currentHighestBid?.max_bid || 0;
    const currentHighBidderId = currentHighestBid?.bidder_id;
    const currentHighAmount = currentHighestBid?.amount || 0;

    // Check if reserve is met
    const reservePrice = listing.reserve_price || 0;
    const reserveIsMet = currentHighAmount >= reservePrice;

    let actualBidAmount: number;
    let isAutoBid = false;
    let outbidPreviousHigh = false;
    let triggeredAutoBidForPrevious = false;

    if (!currentHighestBid) {
      // No existing bids
      if (reservePrice > 0 && userMaxBid >= reservePrice) {
        actualBidAmount = reservePrice;
      } else if (reservePrice > 0) {
        actualBidAmount = userMaxBid;
      } else {
        actualBidAmount = listing.starting_price || minBid;
      }
    } else if (currentHighBidderId === user.id) {
      // User is already the high bidder
      if (userMaxBid <= currentHighBidderMaxBid) {
        return NextResponse.json({
          error: "You're already the high bidder. Your current max bid is higher or equal."
        }, { status: 400 });
      }

      if (!reserveIsMet && reservePrice > 0) {
        if (userMaxBid >= reservePrice) {
          actualBidAmount = reservePrice;
        } else {
          actualBidAmount = userMaxBid;
        }
        outbidPreviousHigh = true;
      } else {
        // Reserve is met - just update max_bid secretly
        await adminClient
          .from('bids')
          .update({ max_bid: userMaxBid })
          .eq('id', currentHighestBid.id);

        return NextResponse.json({
          success: true,
          message: `Your maximum bid has been updated to $${userMaxBid.toLocaleString()}`,
          currentPrice: currentHighAmount,
          bidCount: listing.bid_count,
        });
      }
    } else if (!reserveIsMet) {
      if (userMaxBid >= reservePrice && reservePrice > 0) {
        actualBidAmount = reservePrice;
        outbidPreviousHigh = userMaxBid > currentHighBidderMaxBid;
      } else {
        actualBidAmount = userMaxBid;
        outbidPreviousHigh = actualBidAmount > currentHighAmount;
      }
    } else if (userMaxBid > currentHighBidderMaxBid) {
      actualBidAmount = getMinNextBid(currentHighBidderMaxBid);
      outbidPreviousHigh = true;
    } else if (userMaxBid === currentHighBidderMaxBid) {
      actualBidAmount = userMaxBid;
      triggeredAutoBidForPrevious = true;
    } else {
      actualBidAmount = userMaxBid;
      triggeredAutoBidForPrevious = true;
    }

    // Create the new user's bid
    const { error: bidError } = await adminClient.from('bids').insert({
      listing_id: listingId,
      bidder_id: user.id,
      amount: actualBidAmount,
      max_bid: userMaxBid,
      status: outbidPreviousHigh ? 'winning' : 'outbid',
      is_auto_bid: isAutoBid,
    });

    if (bidError) {
      console.error('Error creating bid:', bidError);
      return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
    }

    let finalPrice = actualBidAmount;
    let newBidCount = (listing.bid_count || 0) + 1;

    const reserveNowMet = actualBidAmount >= reservePrice;

    // If the previous high bidder's proxy should respond
    if (triggeredAutoBidForPrevious && currentHighestBid && reserveNowMet) {
      const autoBidAmount = getMinNextBid(actualBidAmount);
      if (autoBidAmount <= currentHighBidderMaxBid) {
        await adminClient.from('bids').insert({
          listing_id: listingId,
          bidder_id: currentHighBidderId,
          amount: autoBidAmount,
          max_bid: currentHighBidderMaxBid,
          status: 'winning',
          is_auto_bid: true,
        });
        finalPrice = autoBidAmount;
        newBidCount += 1;

        await adminClient
          .from('bids')
          .update({ status: 'outbid' })
          .eq('id', currentHighestBid.id);
      }
    }

    // Check for soft-close extension
    const inSoftClose = listing.end_time && isInSoftCloseWindow(listing.end_time);
    let newEndTime = listing.end_time;

    if (inSoftClose) {
      const extension = new Date();
      extension.setTime(extension.getTime() + SOFT_CLOSE_WINDOW_MS);
      newEndTime = extension.toISOString();
    }

    // Update listing current price using admin client
    const updateData: Record<string, unknown> = {
      current_price: finalPrice,
      bid_count: newBidCount,
    };

    if (inSoftClose) {
      updateData.end_time = newEndTime;
      if (!listing.original_end_time) {
        updateData.original_end_time = listing.end_time;
      }
    }

    const { error: updateError } = await adminClient
      .from('listings')
      .update(updateData)
      .eq('id', listingId);

    if (updateError) {
      console.error('Error updating listing:', updateError);
      // Don't fail the bid, but log the error
    }

    // Notify seller of new bid
    await adminClient.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'new_bid',
      title: 'New bid on your listing',
      body: `Someone bid $${finalPrice.toLocaleString()} on "${listing.title}"`,
      listing_id: listingId,
    });

    // Notify seller when reserve is met for the first time
    if (!reserveIsMet && reserveNowMet && reservePrice > 0) {
      await adminClient.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'reserve_met',
        title: 'Reserve price met!',
        body: `The reserve price of $${reservePrice.toLocaleString()} has been met on "${listing.title}". Your item will sell when the auction ends.`,
        listing_id: listingId,
      });
    }

    // Notify if user was immediately outbid
    if (triggeredAutoBidForPrevious) {
      await adminClient.from('notifications').insert({
        user_id: user.id,
        type: 'outbid',
        title: 'You have been outbid',
        body: `Your bid on "${listing.title}" was outbid by a proxy bid. Current high: $${finalPrice.toLocaleString()}`,
        listing_id: listingId,
      });

      // Send outbid email to current user
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile?.email) {
        sendOutbidEmail({
          to: userProfile.email,
          userName: userProfile.full_name || '',
          listingTitle: listing.title,
          listingId,
          yourBid: actualBidAmount,
          newHighBid: finalPrice,
          endTime: new Date(listing.end_time),
        }).catch(console.error);
      }
    } else if (outbidPreviousHigh && currentHighBidderId && currentHighBidderId !== user.id) {
      // Only notify the previous high bidder if they're not the current user
      // (Don't notify someone that they outbid themselves)
      await adminClient.from('notifications').insert({
        user_id: currentHighBidderId,
        type: 'outbid',
        title: 'You have been outbid',
        body: `Someone outbid you on "${listing.title}". New high bid: $${actualBidAmount.toLocaleString()}`,
        listing_id: listingId,
      });

      // Send outbid email to previous high bidder
      const { data: prevBidderProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', currentHighBidderId)
        .single();

      if (prevBidderProfile?.email) {
        sendOutbidEmail({
          to: prevBidderProfile.email,
          userName: prevBidderProfile.full_name || '',
          listingTitle: listing.title,
          listingId,
          yourBid: currentHighAmount,
          newHighBid: actualBidAmount,
          endTime: new Date(listing.end_time),
        }).catch(console.error);
      }
    }

    // Build response message
    const extensionMsg = inSoftClose ? ' Auction extended by 2 minutes!' : '';
    const reserveMetMsg = !reserveIsMet && reserveNowMet ? ' Reserve has been met!' : '';
    let message: string;

    if (triggeredAutoBidForPrevious && reserveNowMet) {
      message = `Your bid of $${actualBidAmount.toLocaleString()} was placed but you were outbid by a proxy bid.${reserveMetMsg}${extensionMsg}`;
    } else if (triggeredAutoBidForPrevious) {
      message = `Your bid of $${actualBidAmount.toLocaleString()} was placed but you are not the high bidder.${extensionMsg}`;
    } else {
      message = `You are now the high bidder at $${actualBidAmount.toLocaleString()}!${reserveMetMsg}${extensionMsg}`;
    }

    return NextResponse.json({
      success: true,
      message,
      currentPrice: finalPrice,
      bidCount: newBidCount,
      wasOutbid: triggeredAutoBidForPrevious,
      reserveMet: reserveNowMet || reserveIsMet,
      auctionExtended: inSoftClose,
    });

  } catch (error) {
    console.error('Bid placement error:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
