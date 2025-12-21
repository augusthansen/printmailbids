const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function fixCounterOffer() {
  // Get the original countered offer
  const { data: originalOffer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('status', 'countered')
    .single();

  if (offerError || !originalOffer) {
    console.error('No countered offer found:', offerError);
    return;
  }

  console.log('Original offer:', originalOffer);

  // Create counter-offer that should have been created
  const counterExpiresAt = new Date();
  counterExpiresAt.setHours(counterExpiresAt.getHours() + 48);

  const { data: counterOffer, error: counterError } = await supabase
    .from('offers')
    .insert({
      listing_id: originalOffer.listing_id,
      buyer_id: originalOffer.buyer_id,
      seller_id: originalOffer.seller_id,
      amount: 80000, // Counter amount (seller's counter)
      message: 'Counter offer - I can do $80,000',
      status: 'pending',
      parent_offer_id: originalOffer.id,
      counter_count: 1,
      expires_at: counterExpiresAt.toISOString(),
    })
    .select()
    .single();

  if (counterError) {
    console.error('Failed to create counter-offer:', counterError);
    return;
  }

  console.log('\nCreated counter-offer:', counterOffer);

  // Create notification for buyer
  const { error: notifyError } = await supabase
    .from('notifications')
    .insert({
      user_id: originalOffer.buyer_id,
      type: 'counter_offer',
      title: 'Counter Offer Received',
      body: `The seller countered with $80,000. Expires in 48 hours.`,
      listing_id: originalOffer.listing_id,
    });

  if (notifyError) {
    console.error('Failed to create notification:', notifyError);
  } else {
    console.log('\nNotification created for buyer');
  }
}

fixCounterOffer();
