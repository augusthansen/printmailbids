import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, userId } = await request.json();

    if (!invoiceId || !userId) {
      return NextResponse.json(
        { error: 'Missing invoiceId or userId' },
        { status: 400 }
      );
    }

    // Fetch the invoice with listing details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        listing:listings(title, id),
        seller:profiles!invoices_seller_id_fkey(full_name, company_name),
        buyer:profiles!invoices_buyer_id_fkey(email, full_name)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify the user is the buyer
    if (invoice.buyer_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: invoice.listing?.title || 'Auction Item',
              description: `Invoice #${invoice.invoice_number}`,
            },
            unit_amount: Math.round(Number(invoice.total_amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoiceId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoiceId}?payment=cancelled`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        buyer_id: userId,
        seller_id: invoice.seller_id,
        listing_id: invoice.listing_id,
      },
      customer_email: invoice.buyer?.email,
    });

    // Store the session ID on the invoice for reference
    await supabaseAdmin
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
