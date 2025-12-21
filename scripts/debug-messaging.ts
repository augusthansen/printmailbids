// Debug script to test messaging system
// Run with: npx tsx scripts/debug-messaging.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

async function debugMessaging() {
  // Use service role to bypass RLS for debugging
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('=== Debugging Messaging System ===\n');

  // 1. Get all conversations
  console.log('1. All conversations in database:');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('Error fetching conversations:', convError);
  } else {
    console.log(`Found ${conversations?.length || 0} conversations:`);
    conversations?.forEach(c => {
      console.log(`  - ID: ${c.id}`);
      console.log(`    Participant 1: ${c.participant_1_id}`);
      console.log(`    Participant 2: ${c.participant_2_id}`);
      console.log(`    Listing: ${c.listing_id}`);
      console.log(`    Created: ${c.created_at}`);
      console.log('');
    });
  }

  // 2. Check RLS policies on conversations table
  console.log('\n2. RLS Policies on conversations table:');
  const { data: policies, error: policyError } = await supabase.rpc('get_policies', { table_name: 'conversations' }).single();

  if (policyError) {
    // Policies check via pg_policies
    const { data: pgPolicies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'conversations');

    if (pgPolicies && pgPolicies.length > 0) {
      console.log('Policies found:');
      pgPolicies.forEach(p => console.log(`  - ${p.policyname}: ${p.cmd}`));
    } else {
      console.log('Could not fetch policies via pg_policies');
    }
  }

  // 3. Check if there are any messages
  console.log('\n3. Messages in database:');
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (msgError) {
    console.error('Error fetching messages:', msgError);
  } else {
    console.log(`Found ${messages?.length || 0} messages`);
  }

  // 4. Get a sample user to test with
  console.log('\n4. Sample users:');
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, email')
    .limit(5);

  if (users && users.length > 0) {
    console.log('Users:');
    users.forEach(u => {
      console.log(`  - ${u.id}: ${u.full_name || u.company_name || u.email || 'No name'}`);
    });

    // 5. If we have a conversation, check if the participants match users
    if (conversations && conversations.length > 0) {
      const firstConvo = conversations[0];
      console.log(`\n5. Testing first conversation (${firstConvo.id}):`);
      console.log(`   Participant 1 (${firstConvo.participant_1_id}):`);

      const { data: p1 } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .eq('id', firstConvo.participant_1_id)
        .single();
      console.log(`   Found: ${p1 ? JSON.stringify(p1) : 'NOT FOUND'}`);

      console.log(`   Participant 2 (${firstConvo.participant_2_id}):`);
      const { data: p2 } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .eq('id', firstConvo.participant_2_id)
        .single();
      console.log(`   Found: ${p2 ? JSON.stringify(p2) : 'NOT FOUND'}`);
    }
  }

  console.log('\n=== Debug Complete ===');
}

debugMessaging().catch(console.error);
