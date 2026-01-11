import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user - try Bearer token first (for mobile app), then cookies (for web)
    let user = null;
    const adminClient = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenError } = await adminClient.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }

    // Fall back to cookie-based auth (web app)
    if (!user) {
      const supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
    }

    // Get the offer
    const { data: offer, error: offerError } = await adminClient
      .from('offers')
      .select('*, listing:listings(title)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Only the buyer can withdraw their own offer
    if (offer.buyer_id !== user.id) {
      return NextResponse.json({ error: 'You can only withdraw your own offers' }, { status: 403 });
    }

    // Can only withdraw pending offers
    if (offer.status !== 'pending') {
      return NextResponse.json({ error: `Cannot withdraw a ${offer.status} offer` }, { status: 400 });
    }

    // Withdraw the offer
    await adminClient
      .from('offers')
      .update({
        status: 'withdrawn',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    // Notify seller
    await adminClient.from('notifications').insert({
      user_id: offer.seller_id,
      type: 'offer_withdrawn',
      title: 'Offer Withdrawn',
      body: `A buyer withdrew their offer of $${Number(offer.amount).toLocaleString()} for "${offer.listing?.title}".`,
      listing_id: offer.listing_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Offer withdrawn successfully.',
    });

  } catch (error) {
    console.error('Offer withdrawal error:', error);
    return NextResponse.json({ error: 'Failed to withdraw offer' }, { status: 500 });
  }
}
