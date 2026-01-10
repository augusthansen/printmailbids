import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCommissionRates, calculateFees } from '@/lib/commissions';
import { generateInvoiceNumber } from '@/lib/invoice';

// DEPRECATED: This endpoint is no longer in use. All listings are now auctions.
// Kept for backwards compatibility - returns deprecation error.
export async function POST(request: NextRequest) {
  // Return deprecation notice
  return NextResponse.json(
    { error: 'Buy Now feature has been deprecated. All listings are now auctions.' },
    { status: 410 } // 410 Gone
  );

  // Legacy code below - kept for reference
  /*
  try {
    // Get authenticated user
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

    // Validate listing can be purchased
    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'This listing is no longer available' }, { status: 400 });
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 });
    }

    // Determine the price (buy now price or fixed price)
    const salePrice = listing.buy_now_price || listing.fixed_price;
    if (!salePrice || salePrice <= 0) {
      return NextResponse.json({ error: 'This listing does not have a buy now price' }, { status: 400 });
    }

    // Get commission rates for this seller (checks for custom rates)
    const commissionRates = await getCommissionRates(listing.seller_id);

    // Calculate amounts
    const saleAmount = Number(salePrice);
    const fees = calculateFees(saleAmount, commissionRates);

    const buyerPremiumPercent = commissionRates.buyer_premium_percent;
    const buyerPremiumAmount = fees.buyerPremiumAmount;
    const totalAmount = fees.totalBuyerPays;

    const sellerCommissionPercent = commissionRates.seller_commission_percent;
    const sellerCommissionAmount = fees.sellerCommissionAmount;
    const sellerPayoutAmount = fees.sellerPayoutAmount;

    // Payment due in 7 days (or from listing settings)
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

    // Mark listing as sold (or pending sale)
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
              description: `${listing.make} ${listing.model} (${listing.year})`,
            },
            unit_amount: Math.round(saleAmount * 100), // Sale price in cents
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
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/listing/${listingId}?payment=cancelled`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: listingId,
        type: 'buy_now',
      },
      customer_email: buyer?.email || user.email,
    });

    // Store the payment intent ID on the invoice
    await adminClient
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    // Notify the seller
    await adminClient.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'item_sold',
      title: 'Item Sold!',
      body: `Your listing "${listing.title}" has been purchased via Buy Now for $${saleAmount.toLocaleString()}`,
      listing_id: listingId,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      invoiceId: invoice.id,
    });

  } catch (error) {
    console.error('Buy Now checkout error:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
  */
}
