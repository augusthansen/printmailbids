import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotification } from '@/lib/notifications';

/**
 * POST /api/wire/request-instructions
 *
 * Buyer requests wire transfer instructions from seller.
 * Creates an in-app notification AND sends a push notification to the seller.
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
      return NextResponse.json({ error: 'You must be logged in to request wire instructions' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    // Get the invoice with listing and buyer info
    const { data: invoice, error: invoiceError } = await adminClient
      .from('invoices')
      .select(`
        id,
        seller_id,
        buyer_id,
        listing_id,
        wire_requested_at,
        listing:listings(title),
        buyer:profiles!buyer_id(full_name, company_name)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify the user is the buyer
    if (invoice.buyer_id !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to request wire instructions for this invoice' }, { status: 403 });
    }

    // Check if already requested
    if (invoice.wire_requested_at) {
      return NextResponse.json({
        success: true,
        message: 'Wire instructions were already requested',
        alreadyRequested: true
      });
    }

    // Get listing title
    const listingTitle = Array.isArray(invoice.listing)
      ? invoice.listing[0]?.title
      : (invoice.listing as { title?: string })?.title || 'your purchase';

    // Get buyer name
    const buyerName = Array.isArray(invoice.buyer)
      ? invoice.buyer[0]?.full_name || invoice.buyer[0]?.company_name
      : (invoice.buyer as { full_name?: string; company_name?: string })?.full_name ||
        (invoice.buyer as { full_name?: string; company_name?: string })?.company_name || 'A buyer';

    // Update invoice to mark wire as requested
    const { error: updateError } = await adminClient
      .from('invoices')
      .update({
        wire_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    // Send notification to seller (in-app + push)
    const notifResult = await sendNotification({
      userId: invoice.seller_id,
      type: 'payment_reminder', // Using existing type until wire_instructions_requested is added
      title: 'Wire Payment Requested',
      body: `${buyerName} would like to pay by wire transfer for "${listingTitle}". Please add your wire transfer details in Seller Settings.`,
      listingId: invoice.listing_id,
      invoiceId: invoice.id,
    });

    console.log('[Wire Request] Notification result:', notifResult);

    return NextResponse.json({
      success: true,
      message: 'Wire instructions request sent to seller',
      pushSent: notifResult.pushSent,
    });

  } catch (error) {
    console.error('Wire request error:', error);
    return NextResponse.json({ error: 'Failed to request wire instructions' }, { status: 500 });
  }
}
