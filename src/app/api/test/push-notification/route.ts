/**
 * Test API for Push Notifications
 *
 * This endpoint allows testing push notifications in development.
 * REMOVE OR PROTECT THIS ENDPOINT BEFORE PRODUCTION!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import notifications from '@/lib/notifications';

// Only allow in development or for admins
const IS_DEV = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    let user = null;
    const adminClient = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error } = await adminClient.auth.getUser(token);
      if (!error && tokenUser) {
        user = tokenUser;
      }
    }

    if (!user) {
      const supabase = await createClient();
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      if (cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (in production, only admins can test)
    if (!IS_DEV) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const { type, listingTitle } = await request.json();

    // Send test notification based on type
    switch (type) {
      case 'outbid':
        await notifications.outbid(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          5000
        );
        break;

      case 'new_bid':
        await notifications.newBid(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          4500
        );
        break;

      case 'auction_won':
        await notifications.auctionWon(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          5000,
          'test-invoice-id'
        );
        break;

      case 'new_offer':
        await notifications.newOffer(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          3500,
          'test-offer-id'
        );
        break;

      case 'offer_accepted':
        await notifications.offerAccepted(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          3500,
          'test-offer-id',
          'test-invoice-id'
        );
        break;

      case 'offer_countered':
        await notifications.offerCountered(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          4000,
          'test-offer-id'
        );
        break;

      case 'payment_reminder':
        await notifications.paymentReminder(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          'test-invoice-id',
          3
        );
        break;

      case 'item_shipped':
        await notifications.itemShipped(
          user.id,
          'test-listing-id',
          listingTitle || 'Test Equipment Listing',
          'test-invoice-id'
        );
        break;

      default:
        return NextResponse.json({
          error: 'Invalid notification type',
          validTypes: [
            'outbid', 'new_bid', 'auction_won', 'new_offer',
            'offer_accepted', 'offer_countered', 'payment_reminder', 'item_shipped'
          ]
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Test "${type}" notification sent to ${user.email}`,
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
