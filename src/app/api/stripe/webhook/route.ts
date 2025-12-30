import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendReceiptEmail, sendPaymentReceivedSellerEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
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

  // Create notification for seller
  if (sellerId) {
    const amount = invoice?.total_amount ? `$${invoice.total_amount.toLocaleString()}` : 'Payment';
    await supabaseAdmin.from('notifications').insert({
      user_id: sellerId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${amount} payment received for invoice #${invoiceId.slice(0, 8)}. The item is ready to be shipped.`,
      related_type: 'invoice',
      related_id: invoiceId,
    });
  }

  // Create notification for buyer
  if (buyerId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: buyerId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your payment for invoice #${invoiceId.slice(0, 8)} has been processed successfully. The seller will prepare your item for shipping.`,
      related_type: 'invoice',
      related_id: invoiceId,
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
        buyerPremiumPercent: invoice.buyer_premium_percent || 5,
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
