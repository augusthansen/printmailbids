// Test RLS policies
// Run with: npx tsx scripts/test-rls.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

async function testRLS() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('=== Testing RLS Policies ===\n');

  // Query the actual policies from the database
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'conversations'
    `
  });

  if (error) {
    // Try direct SQL
    console.log('Attempting to check policies via information_schema...');

    // Check if RLS is enabled
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    console.log('Service role query result:', { data: rlsCheck, error: rlsError });

    // Get a real conversation ID and test user ID
    const { data: convo } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)
      .single();

    if (convo) {
      console.log('\nFound conversation:', convo.id);
      console.log('Participant 1:', convo.participant_1_id);
      console.log('Participant 2:', convo.participant_2_id);

      // Check what listing looks like
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, title, seller_id')
        .eq('id', convo.listing_id)
        .single();

      console.log('\nListing:', listing);
      if (listingError) console.log('Listing error:', listingError);
    }
  } else {
    console.log('Policies:', data);
  }
}

testRLS().catch(console.error);
