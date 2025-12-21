// Script to simulate an auction ending
// Run with: node scripts/test-auction-end.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function testAuctionEnd() {
  const listingId = process.argv[2];

  if (!listingId) {
    console.log('Usage: node scripts/test-auction-end.js <listing-id>');
    console.log('\nTo find a listing ID, check your listings in the dashboard or database.');

    // Show active auctions
    const { data: auctions } = await supabase
      .from('listings')
      .select('id, title, current_price, end_time, status')
      .in('listing_type', ['auction', 'auction_buy_now'])
      .eq('status', 'active')
      .limit(5);

    if (auctions?.length) {
      console.log('\nActive auctions:');
      auctions.forEach(a => {
        console.log(`  ${a.id} - ${a.title} ($${a.current_price || 0}) - ends: ${a.end_time}`);
      });
    }
    return;
  }

  // Get the listing
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    console.log('Listing not found:', listingError?.message);
    return;
  }

  console.log('Listing:', listing.title);
  console.log('Current price:', listing.current_price);
  console.log('Reserve:', listing.reserve_price);
  console.log('Status:', listing.status);
  console.log('End time:', listing.end_time);

  // Get bids
  const { data: bids } = await supabase
    .from('bids')
    .select('id, amount, bidder_id')
    .eq('listing_id', listingId)
    .order('amount', { ascending: false });

  console.log('\nBids:', bids?.length || 0);
  if (bids?.length) {
    console.log('Highest bid:', bids[0].amount, 'by', bids[0].bidder_id);
  }

  // Set end_time to the past to simulate auction ending
  const pastTime = new Date();
  pastTime.setMinutes(pastTime.getMinutes() - 5);

  const { error: updateError } = await supabase
    .from('listings')
    .update({ end_time: pastTime.toISOString() })
    .eq('id', listingId);

  if (updateError) {
    console.log('Error updating end time:', updateError.message);
    return;
  }

  console.log('\n✓ Set end_time to:', pastTime.toISOString());
  console.log('\nNow call the process-ended API to process the auction:');
  console.log('  curl http://localhost:3000/api/auctions/process-ended');
  console.log('\nOr visit: http://localhost:3000/api/auctions/process-ended');
}

testAuctionEnd();
