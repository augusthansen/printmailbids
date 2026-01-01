import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOfferReceivedEmail, sendOfferAcceptedEmail } from '@/lib/email';
import { getCommissionRates, calculateFees } from '@/lib/commissions';
import crypto from 'crypto';

// Configuration
const MAX_OFFERS_PER_BUYER_PER_LISTING = 3;
const OFFER_EXPIRY_HOURS = 48;

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to make an offer' }, { status: 401 });
    }

    const { listingId, amount, message } = await request.json();

    if (!listingId || !amount) {
      return NextResponse.json({ error: 'Missing listingId or amount' }, { status: 400 });
    }

    const offerAmount = parseFloat(amount);
    if (isNaN(offerAmount) || offerAmount <= 0) {
      return NextResponse.json({ error: 'Invalid offer amount' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get the listing
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey(id, email, full_name, company_name)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Validate listing accepts offers
    if (!listing.accept_offers) {
      return NextResponse.json({ error: 'This listing does not accept offers' }, { status: 400 });
    }

    // Validate listing is active
    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'This listing is no longer available' }, { status: 400 });
    }

    // Can't make offer on your own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'You cannot make an offer on your own listing' }, { status: 400 });
    }

    // Count existing offers from this buyer on this listing
    const { count: existingOfferCount } = await adminClient
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .is('parent_offer_id', null); // Only count original offers, not counter-offers

    if (existingOfferCount !== null && existingOfferCount >= MAX_OFFERS_PER_BUYER_PER_LISTING) {
      return NextResponse.json({
        error: `You have reached the maximum of ${MAX_OFFERS_PER_BUYER_PER_LISTING} offers on this listing`
      }, { status: 400 });
    }

    // Check for pending offers from this buyer
    const { data: pendingOffer } = await adminClient
      .from('offers')
      .select('id, amount')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .single();

    if (pendingOffer) {
      return NextResponse.json({
        error: 'You already have a pending offer on this listing. Please wait for the seller to respond or withdraw your offer.'
      }, { status: 400 });
    }

    // Auto-decline if below minimum
    if (listing.auto_decline_price && offerAmount < listing.auto_decline_price) {
      return NextResponse.json({
        error: `Offer amount is too low. Minimum accepted: $${listing.auto_decline_price.toLocaleString()}`,
        autoDeclined: true
      }, { status: 400 });
    }

    // Calculate offer expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + OFFER_EXPIRY_HOURS);

    // Check for auto-accept
    const shouldAutoAccept = listing.auto_accept_price && offerAmount >= listing.auto_accept_price;

    // Create the offer
    const { data: offer, error: offerError } = await adminClient
      .from('offers')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: offerAmount,
        message: message || null,
        status: shouldAutoAccept ? 'accepted' : 'pending',
        expires_at: expiresAt.toISOString(),
        responded_at: shouldAutoAccept ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (offerError || !offer) {
      console.error('Failed to create offer:', offerError);
      return NextResponse.json({ error: 'Failed to submit offer' }, { status: 500 });
    }

    if (shouldAutoAccept) {
      // Auto-accepted! Create invoice and mark listing as sold
      // Get commission rates for this seller (checks for custom rates)
      const commissionRates = await getCommissionRates(listing.seller_id);
      const fees = calculateFees(offerAmount, commissionRates);

      const buyerPremiumPercent = commissionRates.buyer_premium_percent;
      const buyerPremiumAmount = fees.buyerPremiumAmount;
      const totalAmount = fees.totalBuyerPays;
      const sellerCommissionPercent = commissionRates.seller_commission_percent;
      const sellerCommissionAmount = fees.sellerCommissionAmount;
      const sellerPayoutAmount = fees.sellerPayoutAmount;

      const paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + (listing.payment_due_days || 7));

      // Generate invoice number (cryptographically secure)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
      const invoiceNumber = `INV-${dateStr}-${random}`;

      // Create invoice
      const { data: invoice } = await adminClient
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          listing_id: listingId,
          seller_id: listing.seller_id,
          buyer_id: user.id,
          sale_amount: offerAmount,
          buyer_premium_percent: buyerPremiumPercent,
          buyer_premium_amount: buyerPremiumAmount,
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

      // Mark listing as sold
      await adminClient
        .from('listings')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', listingId);

      // Notify buyer of auto-acceptance
      await adminClient.from('notifications').insert({
        user_id: user.id,
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        body: `Your offer of $${offerAmount.toLocaleString()} for "${listing.title}" has been automatically accepted! Please proceed to payment.`,
        listing_id: listingId,
      });

      // Notify seller
      await adminClient.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'offer_accepted',
        title: 'Offer Auto-Accepted',
        body: `An offer of $${offerAmount.toLocaleString()} for "${listing.title}" was automatically accepted based on your settings.`,
        listing_id: listingId,
      });

      // Get buyer profile for email
      const { data: buyerProfileAuto } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      // Email buyer about auto-accepted offer
      if (buyerProfileAuto?.email) {
        sendOfferAcceptedEmail({
          to: buyerProfileAuto.email,
          userName: buyerProfileAuto.full_name || '',
          listingTitle: listing.title,
          listingId,
          invoiceId: invoice?.id || '',
          offerAmount,
          totalAmount,
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        autoAccepted: true,
        message: 'Your offer has been automatically accepted!',
        offerId: offer.id,
        invoiceId: invoice?.id,
      });
    }

    // Normal pending offer - notify seller
    await adminClient.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'new_offer',
      title: 'New Offer Received',
      body: `You received an offer of $${offerAmount.toLocaleString()} for "${listing.title}". Expires in ${OFFER_EXPIRY_HOURS} hours.`,
      listing_id: listingId,
    });

    // Get buyer profile for email
    const { data: buyerProfile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Email seller about new offer
    if (listing.seller?.email) {
      sendOfferReceivedEmail({
        to: listing.seller.email,
        userName: listing.seller.full_name || '',
        listingTitle: listing.title,
        listingId,
        offerAmount,
        buyerName: buyerProfile?.full_name || 'A buyer',
        expiresAt: expiresAt,
      }).catch(console.error);
    }

    // Get remaining offers count
    const remainingOffers = MAX_OFFERS_PER_BUYER_PER_LISTING - ((existingOfferCount || 0) + 1);

    return NextResponse.json({
      success: true,
      message: `Your offer of $${offerAmount.toLocaleString()} has been submitted. The seller has ${OFFER_EXPIRY_HOURS} hours to respond.`,
      offerId: offer.id,
      expiresAt: expiresAt.toISOString(),
      remainingOffers,
    });

  } catch (error) {
    console.error('Offer submission error:', error);
    return NextResponse.json({ error: 'Failed to submit offer' }, { status: 500 });
  }
}
