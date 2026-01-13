/**
 * Test API for Push Notifications
 *
 * This endpoint allows authenticated users to test push notifications on their own device.
 * Users can only send test notifications to themselves, so this is safe to expose.
 */

const API_VERSION = '2.1'; // Supports custom title/body - force redeploy

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import notifications from '@/lib/notifications';

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

    // User can only send test notifications to themselves - no admin check needed
    const { type, listingTitle, title, body } = await request.json();

    // Use undefined for IDs so they become null in the database (UUID columns can't accept fake strings)
    const testListingId = undefined;
    const testInvoiceId = undefined;
    const testOfferId = undefined;

    // Import sendNotification for custom notifications
    const { sendNotification } = await import('@/lib/notifications');

    // Send test notification based on type
    let result;

    // Handle custom title/body for testing specific notification flows
    if (title && body) {
      // First get user's push preferences for debugging
      const { data: profile } = await adminClient
        .from('profiles')
        .select('notify_push, expo_push_token')
        .eq('id', user.id)
        .single();

      result = await sendNotification({
        userId: user.id,
        type: type || 'payment_reminder',
        title,
        body,
        listingId: testListingId,
        invoiceId: testInvoiceId,
      });

      return NextResponse.json({
        success: true,
        apiVersion: API_VERSION,
        message: `Custom test notification sent to ${user.email}`,
        customTitle: title,
        customBody: body,
        pushSent: result?.pushSent || false,
        notificationId: result?.notificationId,
        error: result?.error,
        debug: {
          notify_push: profile?.notify_push,
          hasToken: !!profile?.expo_push_token,
          tokenPrefix: profile?.expo_push_token?.substring(0, 25),
        },
      });
    }

    switch (type) {
      case 'outbid':
        result = await notifications.outbid(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          5000
        );
        break;

      case 'new_bid':
        result = await notifications.newBid(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          4500
        );
        break;

      case 'auction_won':
        result = await notifications.auctionWon(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          5000,
          testInvoiceId as unknown as string
        );
        break;

      case 'new_offer':
        result = await notifications.newOffer(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          3500,
          testOfferId as unknown as string
        );
        break;

      case 'offer_accepted':
        result = await notifications.offerAccepted(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          3500,
          testOfferId as unknown as string,
          testInvoiceId
        );
        break;

      case 'offer_countered':
        result = await notifications.offerCountered(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          4000,
          testOfferId as unknown as string
        );
        break;

      case 'payment_reminder':
        result = await notifications.paymentReminder(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          testInvoiceId as unknown as string,
          3
        );
        break;

      case 'item_shipped':
        result = await notifications.itemShipped(
          user.id,
          testListingId as unknown as string,
          listingTitle || 'Test Equipment Listing',
          testInvoiceId as unknown as string
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

    // Return detailed result for debugging
    return NextResponse.json({
      success: true,
      message: `Test "${type}" notification sent to ${user.email}`,
      pushSent: result?.pushSent || false,
      notificationId: result?.notificationId,
      error: result?.error,
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
