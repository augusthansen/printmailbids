import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendReceiptEmail, sendPaymentReceivedSellerEmail } from '@/lib/email';
import notifications from '@/lib/notifications';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if event has already been processed (idempotency)
async function hasEventBeenProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();
  return !!data;
}

// Mark event as processed
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  await supabaseAdmin
    .from('stripe_webhook_events')
    .upsert({
      event_id: eventId,
      event_type: eventType,
      processed_at: new Date().toISOString(),
    }, {
      onConflict: 'event_id',
      ignoreDuplicates: true,
    });
}

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received');

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  console.log('Webhook signature present:', !!signature);
  console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook signature verified successfully, event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    console.error('Secret starts with:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10));
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    // Check idempotency - skip if already processed
    const alreadyProcessed = await hasEventBeenProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, skipped: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        // Mark as processed after successful handling
        await markEventProcessed(event.id, event.type);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        await markEventProcessed(event.id, event.type);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        await markEventProcessed(event.id, event.type);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('handleCheckoutComplete called');
  console.log('Session metadata:', session.metadata);

  const invoiceId = session.metadata?.invoice_id;
  const buyerId = session.metadata?.buyer_id;
  const sellerId = session.metadata?.seller_id;

  console.log('Invoice ID:', invoiceId);
  console.log('Buyer ID:', buyerId);
  console.log('Seller ID:', sellerId);

  if (!invoiceId) {
    console.error('No invoice_id in session metadata');
    return;
  }

  // Get full invoice details for receipt
  const { data: invoice, error: fetchError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      listing:listings(id, title),
      buyer:profiles!invoices_buyer_id_fkey(id, full_name, email),
      seller:profiles!invoices_seller_id_fkey(id, full_name, company_name, email)
    `)
    .eq('id', invoiceId)
    .single();

  console.log('Fetched invoice:', invoice);
  if (fetchError) {
    console.error('Error fetching invoice:', fetchError);
  }

  const paidAt = new Date();

  // Update invoice status
  const { error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .update({
      status: 'paid',
      fulfillment_status: 'processing',
      paid_at: paidAt.toISOString(),
      payment_method: 'credit_card',
      updated_at: paidAt.toISOString(),
    })
    .eq('id', invoiceId);

  if (invoiceError) {
    console.error('Failed to update invoice:', invoiceError);
    return;
  }

  console.log('Invoice updated successfully to paid status');

  // Create payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount: (session.amount_total || 0) / 100, // Convert from cents
      method: 'credit_card',
      status: 'completed',
      processed_at: paidAt.toISOString(),
    });

  if (paymentError) {
    console.error('Failed to create payment record:', paymentError);
  }

  // Notify seller of payment received (with push notification)
  if (sellerId && invoice?.listing?.id) {
    const listingTitle = invoice.listing?.title || 'Item';
    await notifications.paymentReceived(
      sellerId,
      invoice.listing.id,
      listingTitle,
      invoiceId,
      invoice.total_amount || 0
    );
  }

  // Notify buyer of payment confirmed (with push notification)
  if (buyerId && invoice?.listing?.id) {
    const { sendNotification } = await import('@/lib/notifications');
    await sendNotification({
      userId: buyerId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Your payment has been processed successfully. The seller will prepare your item for shipping.`,
      listingId: invoice.listing.id,
      invoiceId,
    });
  }

  // Send receipt email to buyer
  if (invoice?.buyer?.email) {
    const listingTitle = invoice.listing?.title || 'Item';
    const sellerName = invoice.seller?.company_name || invoice.seller?.full_name || 'Seller';

    try {
      await sendReceiptEmail({
        to: invoice.buyer.email,
        userName: invoice.buyer.full_name || '',
        invoiceId: invoiceId,
        invoiceNumber: invoice.invoice_number || '',
        listingTitle,
        saleAmount: invoice.sale_amount || 0,
        buyerPremiumPercent: invoice.buyer_premium_percent || 8,
        buyerPremiumAmount: invoice.buyer_premium_amount || 0,
        packagingAmount: invoice.packaging_amount || 0,
        shippingAmount: invoice.shipping_amount || 0,
        taxAmount: invoice.tax_amount || 0,
        totalAmount: invoice.total_amount || 0,
        paidAt,
        paymentMethod: 'credit_card',
        sellerName,
        sellerEmail: invoice.seller?.email || '',
      });
      console.log('Receipt email sent to buyer:', invoice.buyer.email);
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError);
    }
  }

  // Send payment notification email to seller
  if (invoice?.seller?.email) {
    const listingTitle = invoice.listing?.title || 'Item';
    const saleAmount = invoice.sale_amount || 0;
    const platformFee = saleAmount * 0.08; // 8% platform fee
    const payoutAmount = saleAmount - platformFee;

    try {
      await sendPaymentReceivedSellerEmail({
        to: invoice.seller.email,
        userName: invoice.seller.full_name || '',
        listingTitle,
        saleAmount,
        payoutAmount,
        buyerName: invoice.buyer?.full_name || 'Buyer',
      });
      console.log('Payment notification email sent to seller:', invoice.seller.email);
    } catch (emailError) {
      console.error('Failed to send seller notification email:', emailError);
    }
  }

  console.log(`Payment completed for invoice ${invoiceId}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Additional handling for payment intent success if needed
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Log the failed payment - we can't easily find the invoice without storing the payment intent ID
  console.log(`PaymentIntent failed: ${paymentIntent.id}`);
  console.log('Payment failure details:', paymentIntent.last_payment_error?.message);
}
