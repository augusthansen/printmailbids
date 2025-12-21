import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/server';
import {
  sendOfferAcceptedEmail,
  sendOfferDeclinedEmail,
  sendCounterOfferEmail,
} from '@/lib/email';

const COUNTER_OFFER_EXPIRY_HOURS = 48;
const MAX_COUNTER_OFFERS = 3; // Max back-and-forth counters

type ResponseAction = 'accept' | 'decline' | 'counter';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (seller)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { offerId, action, counterAmount, counterMessage } = await request.json() as {
      offerId: string;
      action: ResponseAction;
      counterAmount?: number;
      counterMessage?: string;
    };

    if (!offerId || !action) {
      return NextResponse.json({ error: 'Missing offerId or action' }, { status: 400 });
    }

    if (!['accept', 'decline', 'counter'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get the offer with listing details
    const { data: offer, error: offerError } = await adminClient
      .from('offers')
      .select(`
        *,
        listing:listings(id, title, seller_id, status, payment_due_days),
        buyer:profiles!offers_buyer_id_fkey(id, email, full_name)
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Verify the user is either the seller or buyer
    const isSeller = offer.seller_id === user.id;
    const isBuyer = offer.buyer_id === user.id;

    if (!isSeller && !isBuyer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Determine who made this offer/counter-offer:
    // - Original offer (counter_count = 0): made by buyer
    // - Odd counter_count (1, 3, ...): made by seller
    // - Even counter_count > 0 (2, 4, ...): made by buyer
    const offerMadeByBuyer = offer.counter_count % 2 === 0;
    const offerMadeBySeller = !offerMadeByBuyer;

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json({ error: `This offer has already been ${offer.status}` }, { status: 400 });
    }

    // Check if offer has expired
    if (new Date(offer.expires_at) < new Date()) {
      await adminClient
        .from('offers')
        .update({ status: 'expired' })
        .eq('id', offerId);
      return NextResponse.json({ error: 'This offer has expired' }, { status: 400 });
    }

    // Handle different actions
    if (action === 'accept') {
      // The person who DIDN'T make the offer can accept it
      // If buyer made it, seller accepts. If seller made it, buyer accepts.
      if (offerMadeByBuyer && isBuyer) {
        return NextResponse.json({ error: 'You cannot accept your own offer' }, { status: 400 });
      }
      if (offerMadeBySeller && isSeller) {
        return NextResponse.json({ error: 'You cannot accept your own counter-offer' }, { status: 400 });
      }

      // Accept the offer
      await adminClient
        .from('offers')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      // Create invoice
      const listing = offer.listing;
      const offerAmount = Number(offer.amount);
      const buyerPremiumPercent = 5.0;
      const buyerPremiumAmount = offerAmount * (buyerPremiumPercent / 100);
      const totalAmount = offerAmount + buyerPremiumAmount;
      const sellerCommissionPercent = 8.0;
      const sellerCommissionAmount = offerAmount * (sellerCommissionPercent / 100);
      const sellerPayoutAmount = offerAmount - sellerCommissionAmount;

      const paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + (listing?.payment_due_days || 7));

      const { data: invoice, error: invoiceError } = await adminClient
        .from('invoices')
        .insert({
          listing_id: offer.listing_id,
          seller_id: offer.seller_id,
          buyer_id: offer.buyer_id,
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

      if (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
      }

      // Mark listing as sold
      await adminClient
        .from('listings')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', offer.listing_id);

      // Decline any other pending offers on this listing
      await adminClient
        .from('offers')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('listing_id', offer.listing_id)
        .eq('status', 'pending')
        .neq('id', offerId);

      // Notify both parties
      await adminClient.from('notifications').insert({
        user_id: offer.buyer_id,
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        body: `Your offer of $${offerAmount.toLocaleString()} for "${listing?.title}" has been accepted! Please proceed to payment.`,
        listing_id: offer.listing_id,
      });

      await adminClient.from('notifications').insert({
        user_id: offer.seller_id,
        type: 'offer_accepted',
        title: 'Offer Accepted',
        body: `You accepted an offer of $${offerAmount.toLocaleString()} for "${listing?.title}".`,
        listing_id: offer.listing_id,
      });

      // Email the buyer about accepted offer
      if (offer.buyer?.email) {
        sendOfferAcceptedEmail({
          to: offer.buyer.email,
          userName: offer.buyer.full_name || '',
          listingTitle: listing?.title || 'Unknown',
          listingId: offer.listing_id,
          invoiceId: invoice?.id || '',
          offerAmount,
          totalAmount,
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        action: 'accepted',
        message: 'Offer accepted! Invoice has been created.',
        invoiceId: invoice?.id,
      });

    } else if (action === 'decline') {
      // The person who DIDN'T make the offer can decline it
      // If buyer made it (original offer or buyer counter), they should use withdraw instead
      if (offerMadeByBuyer && isBuyer) {
        return NextResponse.json({ error: 'Use withdraw to cancel your own offer' }, { status: 400 });
      }
      if (offerMadeBySeller && isSeller) {
        return NextResponse.json({ error: 'Use withdraw to cancel your own counter-offer' }, { status: 400 });
      }

      await adminClient
        .from('offers')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      // Notify the person who made the offer that it was declined
      const declinedUserId = offerMadeByBuyer ? offer.buyer_id : offer.seller_id;
      const declinedByLabel = offerMadeByBuyer ? 'The seller' : 'The buyer';
      await adminClient.from('notifications').insert({
        user_id: declinedUserId,
        type: 'offer_declined',
        title: 'Offer Declined',
        body: `${declinedByLabel} declined your ${offerMadeBySeller ? 'counter-' : ''}offer of $${Number(offer.amount).toLocaleString()} for "${offer.listing?.title}".`,
        listing_id: offer.listing_id,
      });

      // Email the person whose offer was declined (only if it was the buyer's offer)
      if (offerMadeByBuyer && offer.buyer?.email) {
        sendOfferDeclinedEmail({
          to: offer.buyer.email,
          userName: offer.buyer.full_name || '',
          listingTitle: offer.listing?.title || 'Unknown',
          listingId: offer.listing_id,
          offerAmount: Number(offer.amount),
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        action: 'declined',
        message: 'Offer declined.',
      });

    } else if (action === 'counter') {
      // The person who DIDN'T make the offer can counter it
      if (offerMadeByBuyer && isBuyer) {
        return NextResponse.json({ error: 'You cannot counter your own offer' }, { status: 400 });
      }
      if (offerMadeBySeller && isSeller) {
        return NextResponse.json({ error: 'You cannot counter your own counter-offer' }, { status: 400 });
      }

      if (!counterAmount) {
        return NextResponse.json({ error: 'Counter amount is required' }, { status: 400 });
      }

      // Check counter limit
      if (offer.counter_count >= MAX_COUNTER_OFFERS) {
        return NextResponse.json({
          error: `Maximum of ${MAX_COUNTER_OFFERS} counter-offers reached. Please accept or decline.`
        }, { status: 400 });
      }

      // Counter must be different from original
      if (counterAmount === Number(offer.amount)) {
        return NextResponse.json({ error: 'Counter amount must be different from the offer' }, { status: 400 });
      }

      // Mark original offer as countered
      await adminClient
        .from('offers')
        .update({
          status: 'countered',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      // Create counter-offer
      const counterExpiresAt = new Date();
      counterExpiresAt.setHours(counterExpiresAt.getHours() + COUNTER_OFFER_EXPIRY_HOURS);

      const { data: counterOffer, error: counterError } = await adminClient
        .from('offers')
        .insert({
          listing_id: offer.listing_id,
          // Swap buyer/seller for counter-offer response tracking
          buyer_id: offer.buyer_id,
          seller_id: offer.seller_id,
          amount: counterAmount,
          message: counterMessage || null,
          status: 'pending',
          parent_offer_id: offerId,
          counter_count: offer.counter_count + 1,
          expires_at: counterExpiresAt.toISOString(),
        })
        .select()
        .single();

      if (counterError) {
        console.error('Failed to create counter-offer:', counterError);
        return NextResponse.json({ error: 'Failed to create counter-offer' }, { status: 500 });
      }

      // Notify the other party of counter-offer
      // If seller is countering, notify buyer. If buyer is countering back, notify seller.
      const notifyUserId = isSeller ? offer.buyer_id : offer.seller_id;
      const counterFromLabel = isSeller ? 'seller' : 'buyer';
      await adminClient.from('notifications').insert({
        user_id: notifyUserId,
        type: 'counter_offer',
        title: 'Counter Offer Received',
        body: `The ${counterFromLabel} countered with $${counterAmount.toLocaleString()} for "${offer.listing?.title}". Expires in ${COUNTER_OFFER_EXPIRY_HOURS} hours.`,
        listing_id: offer.listing_id,
      });

      // Email the person receiving the counter-offer
      // Get the profile of the person who needs to receive the counter email
      const { data: recipientProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', notifyUserId)
        .single();

      if (recipientProfile?.email) {
        sendCounterOfferEmail({
          to: recipientProfile.email,
          userName: recipientProfile.full_name || '',
          listingTitle: offer.listing?.title || 'Unknown',
          listingId: offer.listing_id,
          originalAmount: Number(offer.amount),
          counterAmount,
          counterMessage: counterMessage || undefined,
          expiresAt: counterExpiresAt,
          isBuyer: !isSeller, // The recipient is buyer if seller sent the counter
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        action: 'countered',
        message: `Counter-offer of $${counterAmount.toLocaleString()} sent.`,
        counterOfferId: counterOffer?.id,
        expiresAt: counterExpiresAt.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Offer response error:', error);
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 });
  }
}
