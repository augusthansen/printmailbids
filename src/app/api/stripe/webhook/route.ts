import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
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
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
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
  const invoiceId = session.metadata?.invoice_id;
  const buyerId = session.metadata?.buyer_id;
  const sellerId = session.metadata?.seller_id;

  if (!invoiceId) {
    console.error('No invoice_id in session metadata');
    return;
  }

  // Update invoice status
  const { error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .update({
      status: 'paid',
      fulfillment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'credit_card',
      stripe_payment_intent_id: session.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (invoiceError) {
    console.error('Failed to update invoice:', invoiceError);
    return;
  }

  // Create payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount: (session.amount_total || 0) / 100, // Convert from cents
      method: 'credit_card',
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      processed_at: new Date().toISOString(),
    });

  if (paymentError) {
    console.error('Failed to create payment record:', paymentError);
  }

  // Create notification for seller
  if (sellerId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: sellerId,
      type: 'payment_received',
      title: 'Payment Received',
      body: `Payment received for invoice. The buyer has completed payment.`,
    });
  }

  // Create notification for buyer
  if (buyerId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: buyerId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Your payment has been processed successfully.`,
    });
  }

  console.log(`Payment completed for invoice ${invoiceId}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Additional handling for payment intent success if needed
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find invoice by payment intent ID and update status
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (invoice) {
    await supabaseAdmin
      .from('invoices')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    // Create payment record with failed status
    await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        amount: (paymentIntent.amount || 0) / 100,
        method: 'credit_card',
        status: 'failed',
        stripe_payment_intent_id: paymentIntent.id,
      });
  }

  console.log(`PaymentIntent failed: ${paymentIntent.id}`);
}
