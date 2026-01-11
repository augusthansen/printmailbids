import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { sendOutbidEmail } from '@/lib/email';
import notifications from '@/lib/notifications';

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// API Version: v5 - Fixed reserve not met winning logic

// Soft-close window: 2 minutes (in milliseconds)
const SOFT_CLOSE_WINDOW_MS = 2 * 60 * 1000;

const bidIncrements = [
  { max: 250, increment: 1 },
  { max: 1000, increment: 10 },
  { max: 10000, increment: 50 },
  { max: 100000, increment: 100 },
  { max: 500000, increment: 500 },
  { max: Infinity, increment: 1000 },
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
    // Get authenticated user - try Bearer token first (for mobile app), then cookies (for web)
    let user = null;

    const authHeader = request.headers.get('Authorization');
    let tokenValidationError: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile app authentication via Bearer token
      const token = authHeader.substring(7);
      console.log('[Bid API] Bearer token received, length:', token.length, 'prefix:', token.substring(0, 20));

      try {
        const adminClient = createAdminClient();
        console.log('[Bid API] Admin client created, calling getUser...');
        const { data, error: tokenError } = await adminClient.auth.getUser(token);
        const tokenUser = data?.user;
        console.log('[Bid API] Token validation result:', {
          hasUser: !!tokenUser,
          userId: tokenUser?.id,
          error: tokenError?.message,
          errorStatus: tokenError?.status,
        });
        if (tokenError) {
          tokenValidationError = tokenError.message;
        }
        if (!tokenError && tokenUser) {
          user = tokenUser;
        }
      } catch (err) {
        console.error('[Bid API] Exception during token validation:', err);
        tokenValidationError = err instanceof Error ? err.message : 'Token validation failed';
      }
    }

    // Fall back to cookie-based auth (web app)
    if (!user) {
      const supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      const tokenPrefix = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7, 27) + '...'
        : null;
      return NextResponse.json({
        error: tokenValidationError || 'You must be logged in to bid',
        tokenError: tokenValidationError,
        hasAuthHeader: !!authHeader,
        tokenPrefix,
        tokenLength: authHeader?.startsWith('Bearer ') ? authHeader.length - 7 : 0,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        debug: 'v3', // Version marker to confirm deployment
      }, { status: 401 });
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

    // Get current winning bid (by status, or highest max_bid as fallback)
    const { data: winningBids } = await adminClient
      .from('bids')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'winning')
      .limit(1);

    // If no winning bid found, get the one with highest max_bid
    let currentHighestBid = winningBids?.[0] as Bid | undefined;

    if (!currentHighestBid) {
      const { data: highestMaxBids } = await adminClient
        .from('bids')
        .select('*')
        .eq('listing_id', listingId)
        .order('max_bid', { ascending: false })
        .limit(1);
      currentHighestBid = highestMaxBids?.[0] as Bid | undefined;
    }

    const currentHighBidderMaxBid = currentHighestBid?.max_bid || 0;
    const currentHighBidderId = currentHighestBid?.bidder_id;
    const currentHighAmount = currentHighestBid?.amount || 0;

    console.log('[Bid API] Current winning bid:', {
      bidderId: currentHighBidderId,
      amount: currentHighAmount,
      maxBid: currentHighBidderMaxBid,
      newUserMaxBid: userMaxBid
    });

    // Check if reserve is met
    const reservePrice = listing.reserve_price || 0;
    const reserveIsMet = currentHighAmount >= reservePrice;

    let actualBidAmount: number;
    let isAutoBid = false;
    let outbidPreviousHigh = false;
    let triggeredAutoBidForPrevious = false;

    if (!currentHighestBid) {
      // No existing bids - this bidder is automatically winning
      if (reservePrice > 0 && userMaxBid >= reservePrice) {
        // User's max meets reserve - show reserve price
        actualBidAmount = reservePrice;
      } else if (reservePrice > 0) {
        // Reserve not met - show user's full bid (transparency before reserve)
        actualBidAmount = userMaxBid;
      } else {
        // No reserve - start at starting price (proxy bidding)
        actualBidAmount = listing.starting_price || minBid;
      }
      outbidPreviousHigh = true; // First bidder is the winner
    } else if (currentHighBidderId === user.id) {
      // User is already the high bidder
      if (userMaxBid <= currentHighBidderMaxBid) {
        return NextResponse.json({
          error: "You're already the high bidder. Your current max bid is higher or equal."
        }, { status: 400 });
      }

      if (!reserveIsMet && reservePrice > 0) {
        // Reserve not met yet - show bid up to reserve or max
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
          reserveMet: reserveIsMet,
        });
      }
    } else if (!reserveIsMet && reservePrice > 0) {
      // Reserve not met - show actual bids (no proxy bidding yet)
      // Before reserve is met, the winner is simply whoever has the highest bid AMOUNT
      if (userMaxBid >= reservePrice) {
        actualBidAmount = reservePrice;
      } else {
        actualBidAmount = userMaxBid;
      }
      // New bidder wins if their bid amount is higher than current displayed price
      outbidPreviousHigh = actualBidAmount > currentHighAmount;
    } else if (userMaxBid > currentHighBidderMaxBid) {
      // Reserve met, new bidder outbids current high bidder's max
      // Proxy bidding: show one increment above previous max
      actualBidAmount = getMinNextBid(currentHighBidderMaxBid);
      outbidPreviousHigh = true;
    } else {
      // Reserve met, new bidder's max <= current high bidder's max
      // Proxy bidding will respond
      actualBidAmount = minBid;
      triggeredAutoBidForPrevious = true;
    }

    // Create the new user's bid
    const bidStatus = outbidPreviousHigh ? 'winning' : 'outbid';
    console.log('[Bid API v5] Creating bid:', {
      outbidPreviousHigh,
      bidStatus,
      hasCurrentHighestBid: !!currentHighestBid,
      actualBidAmount,
      userMaxBid,
      currentHighAmount,
      reserveIsMet
    });

    const { error: bidError } = await adminClient.from('bids').insert({
      listing_id: listingId,
      bidder_id: user.id,
      amount: actualBidAmount,
      max_bid: userMaxBid,
      status: bidStatus,
      is_auto_bid: isAutoBid,
    });

    if (bidError) {
      console.error('Error creating bid:', bidError);
      return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
    }

    let finalPrice = actualBidAmount;
    let newBidCount = (listing.bid_count || 0) + 1;

    const reserveNowMet = actualBidAmount >= reservePrice;

    // If the new bidder is winning, update ALL other bids on this listing to 'outbid'
    if (outbidPreviousHigh) {
      await adminClient
        .from('bids')
        .update({ status: 'outbid' })
        .eq('listing_id', listingId)
        .neq('bidder_id', user.id);
    }

    // If the previous high bidder's proxy should respond
    if (triggeredAutoBidForPrevious && currentHighestBid) {
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

    // Notify seller of new bid (with push notification)
    notifications.newBid(listing.seller_id, listingId, listing.title, finalPrice).catch(console.error);

    // Notify seller when reserve is met for the first time
    if (!reserveIsMet && reserveNowMet && reservePrice > 0) {
      notifications.reserveMet(listing.seller_id, listingId, listing.title, reservePrice).catch(console.error);
    }

    // Log notification decision conditions
    console.log('[Bid API] Notification conditions:', {
      triggeredAutoBidForPrevious,
      outbidPreviousHigh,
      currentHighBidderId,
      currentUserId: user.id,
      isDifferentUser: currentHighBidderId !== user.id,
      willNotifyCurrentUser: triggeredAutoBidForPrevious,
      willNotifyPreviousHighBidder: !triggeredAutoBidForPrevious && outbidPreviousHigh && currentHighBidderId && currentHighBidderId !== user.id,
    });

    // Notify if user was immediately outbid (their bid was lower than existing proxy bid)
    if (triggeredAutoBidForPrevious) {
      // Send outbid notification with push
      console.log('[Bid API] BRANCH 1: User was immediately outbid by proxy, sending notification to current user:', user.id);
      notifications.outbid(user.id, listingId, listing.title, finalPrice)
        .then((result) => {
          console.log('[Bid API] BRANCH 1 notification result:', {
            success: result.success,
            pushSent: result.pushSent,
            notificationId: result.notificationId,
            error: result.error,
          });
        })
        .catch(console.error);

      // Send outbid email to current user (if they have email notifications enabled)
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('email, full_name, notify_email')
        .eq('id', user.id)
        .single();

      if (userProfile?.email && userProfile?.notify_email !== false) {
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
      // Send outbid notification with push
      console.log('[Bid API] BRANCH 2: New bidder won, sending outbid notification to previous high bidder:', {
        previousHighBidderId: currentHighBidderId,
        currentUserId: user.id,
        listingId,
        listingTitle: listing.title,
        newHighBid: actualBidAmount,
      });
      notifications.outbid(currentHighBidderId, listingId, listing.title, actualBidAmount)
        .then((result) => {
          console.log('[Bid API] BRANCH 2 notification result:', {
            success: result.success,
            pushSent: result.pushSent,
            notificationId: result.notificationId,
            error: result.error,
          });
        })
        .catch((err) => {
          console.error('[Bid API] Failed to send outbid notification:', err);
        });

      // Send outbid email to previous high bidder (if they have email notifications enabled)
      const { data: prevBidderProfile } = await adminClient
        .from('profiles')
        .select('email, full_name, notify_email')
        .eq('id', currentHighBidderId)
        .single();

      if (prevBidderProfile?.email && prevBidderProfile?.notify_email !== false) {
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
