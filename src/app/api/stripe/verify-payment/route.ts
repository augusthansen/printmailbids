import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail, sendPaymentReceivedSellerEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      );
    }

    // Fetch the invoice
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

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // If already paid, just return success
    if (invoice.status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: 'Invoice is already paid'
      });
    }

    // Check if there's a Stripe payment intent ID to verify
    if (!invoice.stripe_payment_intent_id) {
      // Try to find the checkout session by invoice metadata
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
      });

      const matchingSession = sessions.data.find(
        s => s.metadata?.invoice_id === invoiceId && s.payment_status === 'paid'
      );

      if (!matchingSession) {
        return NextResponse.json(
          { error: 'No completed payment found for this invoice' },
          { status: 400 }
        );
      }

      // Process this session
      await processPayment(invoice, matchingSession.amount_total || 0);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and processed'
      });
    }

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      invoice.stripe_payment_intent_id
    );

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not yet completed', status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Process the payment
    await processPayment(invoice, paymentIntent.amount);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

async function processPayment(invoice: any, amountInCents: number) {
  const paidAt = new Date();
  const invoiceId = invoice.id;

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
    .eq('id', invoiceId)
    .eq('status', 'pending'); // Only update if still pending

  if (invoiceError) {
    console.error('Failed to update invoice:', invoiceError);
    throw invoiceError;
  }

  // Check if notification already exists to avoid duplicates
  const { data: existingNotification } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', invoice.seller_id)
    .eq('type', 'payment_received')
    .eq('related_id', invoiceId)
    .single();

  // Create notification for seller if not already exists
  if (!existingNotification && invoice.seller_id) {
    const amount = invoice.total_amount ? `$${Number(invoice.total_amount).toLocaleString()}` : 'Payment';
    await supabaseAdmin.from('notifications').insert({
      user_id: invoice.seller_id,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${amount} payment received for "${invoice.listing?.title || 'item'}". The item is ready to be shipped.`,
      related_type: 'invoice',
      related_id: invoiceId,
    });
    console.log('Created payment received notification for seller:', invoice.seller_id);
  }

  // Check if buyer notification already exists
  const { data: existingBuyerNotification } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', invoice.buyer_id)
    .eq('type', 'payment_confirmed')
    .eq('related_id', invoiceId)
    .single();

  // Create notification for buyer if not already exists
  if (!existingBuyerNotification && invoice.buyer_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: invoice.buyer_id,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your payment for "${invoice.listing?.title || 'item'}" has been processed successfully. The seller will prepare your item for shipping.`,
      related_type: 'invoice',
      related_id: invoiceId,
    });
  }

  // Send receipt email to buyer
  if (invoice.buyer?.email) {
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
  if (invoice.seller?.email) {
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

  console.log(`Payment processed for invoice ${invoiceId}`);
}
