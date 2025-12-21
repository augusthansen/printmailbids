// Check schema for conversations table
// Run with: npx tsx scripts/check-schema.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

async function checkSchema() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('=== Checking Conversations Table Schema ===\n');

  // Get a sample conversation to see the structure
  const { data: sample, error } = await supabase
    .from('conversations')
    .select('*')
    .limit(1)
    .single();

  console.log('Sample conversation:');
  console.log(JSON.stringify(sample, null, 2));

  if (error) {
    console.error('Error:', error);
  }

  // Try querying without the join
  console.log('\n--- Testing query WITHOUT listing join ---');
  const { data: noJoin, error: noJoinErr } = await supabase
    .from('conversations')
    .select('*')
    .limit(1)
    .single();

  console.log('Result:', noJoin ? 'SUCCESS' : 'FAILED', noJoinErr?.message || '');

  // Try manual join via separate query
  console.log('\n--- Testing with separate listing query ---');
  if (noJoin && noJoin.listing_id) {
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('id, title')
      .eq('id', noJoin.listing_id)
      .single();

    console.log('Listing:', listing);
    if (listingErr) console.log('Listing error:', listingErr.message);
  }
}

checkSchema().catch(console.error);
