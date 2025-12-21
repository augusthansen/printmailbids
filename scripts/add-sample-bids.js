const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function addSampleBids() {
  // Get all profiles to use as bidders
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, is_seller');

  console.log('All profiles:', profiles?.map(p => p.email));

  // Get a listing from the real seller (not test@test.com)
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, title, starting_price, current_price, seller_id')
    .in('listing_type', ['auction', 'auction_buy_now'])
    .neq('seller_id', '6e89a021-af5b-49fd-a9cd-242b9875db18') // exclude test@test.com as seller
    .limit(3);

  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    return;
  }

  console.log('Found listings:', listings?.length);

  if (!listings || listings.length === 0) {
    console.log('No auction listings found from real sellers');
    return;
  }

  // Add sample bids to first listing
  const listing = listings[0];
  console.log('\nAdding bids to:', listing.title);

  const basePrice = listing.starting_price || 1000;

  // Get bidders who aren't the seller
  const bidders = profiles?.filter(p => p.id !== listing.seller_id) || [];

  if (bidders.length === 0) {
    console.log('No bidders available');
    return;
  }

  console.log('Bidders:', bidders.map(b => b.email));

  // Clear existing bids for this listing first
  await supabase.from('bids').delete().eq('listing_id', listing.id);
  console.log('Cleared existing bids');

  // Sample bid history - simulating a bidding war
  const bids = [
    { amount: basePrice, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 48, is_auto_bid: false },
    { amount: basePrice + 50, max_bid: basePrice + 200, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 36, is_auto_bid: false },
    { amount: basePrice + 100, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 35, is_auto_bid: true },
    { amount: basePrice + 150, max_bid: basePrice + 300, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 24, is_auto_bid: false },
    { amount: basePrice + 200, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 23, is_auto_bid: true },
    { amount: basePrice + 250, max_bid: basePrice + 400, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 12, is_auto_bid: false },
    { amount: basePrice + 300, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 11, is_auto_bid: true },
    { amount: basePrice + 350, max_bid: basePrice + 600, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 6, is_auto_bid: false },
    { amount: basePrice + 400, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 5, is_auto_bid: true },
    { amount: basePrice + 450, max_bid: basePrice + 600, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 3, is_auto_bid: true },
    { amount: basePrice + 500, max_bid: basePrice + 500, bidder_idx: 0, hours_ago: 2, is_auto_bid: true },
    { amount: basePrice + 550, max_bid: basePrice + 600, bidder_idx: bidders.length > 1 ? 1 : 0, hours_ago: 1, is_auto_bid: true },
  ];

  for (const bid of bids) {
    const bidder = bidders[bid.bidder_idx];
    const createdAt = new Date(Date.now() - bid.hours_ago * 60 * 60 * 1000);

    const { error } = await supabase.from('bids').insert({
      listing_id: listing.id,
      bidder_id: bidder.id,
      amount: bid.amount,
      max_bid: bid.max_bid,
      status: 'active',
      is_auto_bid: bid.is_auto_bid,
      created_at: createdAt.toISOString()
    });

    if (error) {
      console.error('Error inserting bid:', error.message);
    } else {
      console.log(`Added bid: $${bid.amount} from ${bidder.email}${bid.is_auto_bid ? ' (auto)' : ''}`);
    }
  }

  // Update listing current price
  const highestBid = bids[bids.length - 1].amount;
  await supabase
    .from('listings')
    .update({
      current_price: highestBid,
      bid_count: bids.length
    })
    .eq('id', listing.id);

  console.log(`\nUpdated listing current price to $${highestBid}`);
  console.log(`Total bids: ${bids.length}`);
  console.log(`\nView this listing to see the bid history!`);
}

addSampleBids().catch(console.error);
