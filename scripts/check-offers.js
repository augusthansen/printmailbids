const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function checkOffers() {
  const { data: offers, error } = await supabase
    .from('offers')
    .select(`
      id,
      amount,
      status,
      parent_offer_id,
      counter_count,
      buyer:profiles!offers_buyer_id_fkey(email),
      seller:profiles!offers_seller_id_fkey(email),
      listing:listings(title)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== All Offers ===\n');
  offers?.forEach(o => {
    console.log(`ID: ${o.id.substring(0, 8)}...`);
    console.log(`  Amount: $${o.amount}`);
    console.log(`  Status: ${o.status}`);
    console.log(`  Buyer: ${o.buyer?.email}`);
    console.log(`  Seller: ${o.seller?.email}`);
    console.log(`  Listing: ${o.listing?.title}`);
    console.log(`  Parent Offer ID: ${o.parent_offer_id || 'null (original offer)'}`);
    console.log(`  Counter Count: ${o.counter_count}`);
    console.log('');
  });
}

checkOffers();
