import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCommissionRates, calculateFees } from '@/lib/commissions';

// Generate invoice number: INV-YYYYMMDD-XXXX
function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (the auction winner)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get the listing with seller info
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey(id, email, full_name, company_name, stripe_account_id)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get buyer info
    const { data: buyer } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Verify auction has ended
    if (listing.status !== 'ended' && listing.status !== 'sold') {
      // Check if end_time has passed
      const endTime = new Date(listing.end_time);
      if (endTime > new Date()) {
        return NextResponse.json({ error: 'Auction has not ended yet' }, { status: 400 });
      }
    }

    // Get the winning bid
    const { data: winningBid, error: bidError } = await adminClient
      .from('bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();

    if (bidError || !winningBid) {
      return NextResponse.json({ error: 'No winning bid found' }, { status: 400 });
    }

    // Verify the user is the winning bidder
    if (winningBid.bidder_id !== user.id) {
      return NextResponse.json({ error: 'You are not the winning bidder' }, { status: 403 });
    }

    // Check if invoice already exists for this listing
    const { data: existingInvoice } = await adminClient
      .from('invoices')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .single();

    if (existingInvoice) {
      // Invoice already exists, return checkout URL for it
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: listing.title,
                description: `Auction Won - ${listing.make} ${listing.model}`,
              },
              unit_amount: Math.round(winningBid.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${existingInvoice.id}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${existingInvoice.id}?payment=cancelled`,
        metadata: {
          invoice_id: existingInvoice.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          listing_id: listingId,
          type: 'auction_won',
        },
        customer_email: buyer?.email || user.email,
      });

      return NextResponse.json({
        success: true,
        sessionUrl: session.url,
        invoiceId: existingInvoice.id,
        existing: true,
      });
    }

    // Get commission rates for this seller (checks for custom rates)
    const commissionRates = await getCommissionRates(listing.seller_id);

    // Calculate amounts
    const saleAmount = Number(winningBid.amount);
    const fees = calculateFees(saleAmount, commissionRates);

    const buyerPremiumPercent = commissionRates.buyer_premium_percent;
    const buyerPremiumAmount = fees.buyerPremiumAmount;
    const totalAmount = fees.totalBuyerPays;

    const sellerCommissionPercent = commissionRates.seller_commission_percent;
    const sellerCommissionAmount = fees.sellerCommissionAmount;
    const sellerPayoutAmount = fees.sellerPayoutAmount;

    // Payment due in 7 days
    const paymentDueDate = new Date();
    paymentDueDate.setDate(paymentDueDate.getDate() + (listing.payment_due_days || 7));

    // Create the invoice
    const invoiceNumber = generateInvoiceNumber();
    const { data: invoice, error: invoiceError } = await adminClient
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        listing_id: listingId,
        seller_id: listing.seller_id,
        buyer_id: user.id,
        sale_amount: saleAmount,
        buyer_premium_percent: buyerPremiumPercent,
        buyer_premium_amount: buyerPremiumAmount,
        shipping_amount: 0,
        packaging_amount: 0,
        tax_amount: 0,
        total_amount: totalAmount,
        seller_commission_percent: sellerCommissionPercent,
        seller_commission_amount: sellerCommissionAmount,
        seller_payout_amount: sellerPayoutAmount,
        status: 'pending',
        fulfillment_status: 'awaiting_payment',
        payment_due_date: paymentDueDate.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error('Failed to create invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Update listing status to sold
    await adminClient
      .from('listings')
      .update({
        status: 'sold',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: `Auction Won - ${listing.make} ${listing.model} (${listing.year})`,
            },
            unit_amount: Math.round(saleAmount * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Buyer Premium (${buyerPremiumPercent}%)`,
              description: 'Platform fee',
            },
            unit_amount: Math.round(buyerPremiumAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoice.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoice.id}?payment=cancelled`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: listingId,
        type: 'auction_won',
      },
      customer_email: buyer?.email || user.email,
    });

    // Store the payment intent ID
    await adminClient
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      invoiceId: invoice.id,
    });

  } catch (error) {
    console.error('Auction checkout error:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
