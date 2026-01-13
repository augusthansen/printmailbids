import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotification } from '@/lib/notifications';

/**
 * POST /api/wire/notify-available
 *
 * Seller notifies buyers that wire instructions are now available.
 * Called after seller saves wire transfer details.
 * Sends notifications to all buyers who requested wire instructions for unpaid invoices.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user - try Bearer token first (for mobile app), then cookies (for web)
    let user = null;
    const adminClient = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenError } = await adminClient.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
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
      return NextResponse.json({ error: 'You must be logged in to notify buyers' }, { status: 401 });
    }

    // Get seller profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, company_name, wire_bank_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify seller has wire instructions set up
    if (!profile.wire_bank_name) {
      return NextResponse.json({ error: 'Wire instructions not set up' }, { status: 400 });
    }

    // Find unpaid invoices where buyer requested wire instructions from this seller
    const { data: pendingInvoices, error: invoicesError } = await adminClient
      .from('invoices')
      .select('id, buyer_id, listing_id, listing:listings(title)')
      .eq('seller_id', user.id)
      .not('wire_requested_at', 'is', null)
      .in('status', ['pending', 'awaiting_wire']);

    if (invoicesError) {
      console.error('Error fetching pending wire invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch pending invoices' }, { status: 500 });
    }

    if (!pendingInvoices || pendingInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending wire requests to notify',
        notified: 0,
      });
    }

    const sellerName = profile.full_name || profile.company_name || 'The seller';
    let notifiedCount = 0;
    let pushSentCount = 0;

    // Send notification to each buyer
    for (const invoice of pendingInvoices) {
      const listingTitle = Array.isArray(invoice.listing)
        ? invoice.listing[0]?.title
        : (invoice.listing as { title?: string })?.title || 'your purchase';

      const notifResult = await sendNotification({
        userId: invoice.buyer_id,
        type: 'payment_reminder', // Using existing type
        title: 'Wire Instructions Available',
        body: `${sellerName} has provided wire transfer instructions for "${listingTitle}". You can now complete your payment.`,
        listingId: invoice.listing_id,
        invoiceId: invoice.id,
      });

      if (notifResult.success) {
        notifiedCount++;
        if (notifResult.pushSent) {
          pushSentCount++;
        }
      }
    }

    console.log(`[Wire Available] Notified ${notifiedCount} buyers, ${pushSentCount} push notifications sent`);

    return NextResponse.json({
      success: true,
      message: `Notified ${notifiedCount} buyer(s) about wire instructions`,
      notified: notifiedCount,
      pushSent: pushSentCount,
    });

  } catch (error) {
    console.error('Wire notify error:', error);
    return NextResponse.json({ error: 'Failed to notify buyers' }, { status: 500 });
  }
}
