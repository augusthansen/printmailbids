/**
 * API for marking an invoice as shipped
 *
 * This endpoint updates the invoice fulfillment status and sends push notifications
 * to the buyer.
 */

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

    const body = await request.json();
    const { invoiceId, shippingData } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Get the invoice to verify seller ownership
    const { data: invoice, error: invoiceError } = await adminClient
      .from('invoices')
      .select('id, seller_id, buyer_id, listing:listings(id, title)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify the user is the seller
    if (invoice.seller_id !== user.id) {
      return NextResponse.json({ error: 'Only the seller can mark items as shipped' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      fulfillment_status: 'shipped',
      shipped_at: new Date().toISOString(),
    };

    // Add optional shipping details
    if (shippingData) {
      if (shippingData.carrier) updateData.shipping_carrier = shippingData.carrier;
      if (shippingData.bolNumber) updateData.freight_bol_number = shippingData.bolNumber;
      if (shippingData.proNumber) {
        updateData.freight_pro_number = shippingData.proNumber;
        updateData.tracking_number = shippingData.proNumber;
      }
      if (shippingData.freightClass) updateData.freight_class = shippingData.freightClass;
      if (shippingData.weightLbs) updateData.freight_weight_lbs = shippingData.weightLbs;
      if (shippingData.pickupDate) updateData.freight_pickup_date = shippingData.pickupDate;
      if (shippingData.estimatedDelivery) updateData.freight_estimated_delivery = shippingData.estimatedDelivery;
      if (shippingData.pickupContact) updateData.freight_pickup_contact = shippingData.pickupContact;
      if (shippingData.deliveryContact) updateData.freight_delivery_contact = shippingData.deliveryContact;
      if (shippingData.specialInstructions) updateData.freight_special_instructions = shippingData.specialInstructions;
    }

    // Update the invoice
    const { error: updateError } = await adminClient
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
      return NextResponse.json({ error: 'Failed to update shipping status' }, { status: 500 });
    }

    // Send push notification to buyer
    // Handle both array and single object cases for the listing relation
    const listingData = Array.isArray(invoice.listing)
      ? invoice.listing[0]
      : invoice.listing as { id: string; title: string } | null;
    const listingTitle = listingData?.title || 'Your item';
    const listingId = listingData?.id;

    if (listingId) {
      await notifications.itemShipped(
        invoice.buyer_id,
        listingId,
        listingTitle,
        invoiceId
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item marked as shipped and buyer notified',
    });

  } catch (error) {
    console.error('Ship API error:', error);
    return NextResponse.json({ error: 'Failed to process shipping update' }, { status: 500 });
  }
}
