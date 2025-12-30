/**
 * Test script to verify the commission system is working
 * Run with: npx tsx scripts/test-commissions.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCommissions() {
  console.log('=== Testing Commission System ===\n');

  // Test 1: Check platform_settings table exists and has data
  console.log('1. Checking platform_settings table...');
  const { data: settings, error: settingsError } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single();

  if (settingsError) {
    console.error('   ERROR: Could not fetch platform settings:', settingsError.message);
  } else {
    console.log('   SUCCESS: Platform settings found:');
    console.log(`     - Buyer Premium: ${settings.default_buyer_premium_percent}%`);
    console.log(`     - Seller Commission: ${settings.default_seller_commission_percent}%`);
    console.log(`     - Auction Extension: ${settings.auction_extension_minutes} minutes`);
    console.log(`     - Offer Expiry: ${settings.offer_expiry_hours} hours`);
  }

  // Test 2: Check that profiles table has the new columns
  console.log('\n2. Checking profiles table for commission columns...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, custom_buyer_premium_percent, custom_seller_commission_percent')
    .limit(3);

  if (profilesError) {
    console.error('   ERROR: Could not fetch profiles:', profilesError.message);
  } else {
    console.log('   SUCCESS: Commission columns exist on profiles table');
    console.log(`   Found ${profiles.length} profile(s):`);
    profiles.forEach(p => {
      const buyerRate = p.custom_buyer_premium_percent !== null
        ? `${p.custom_buyer_premium_percent}%`
        : 'default';
      const sellerRate = p.custom_seller_commission_percent !== null
        ? `${p.custom_seller_commission_percent}%`
        : 'default';
      console.log(`     - ${p.email}: Buyer Premium=${buyerRate}, Seller Commission=${sellerRate}`);
    });
  }

  // Test 3: Test updating platform settings
  console.log('\n3. Testing platform settings update...');
  const { error: updateError } = await supabase
    .from('platform_settings')
    .update({
      default_buyer_premium_percent: settings?.default_buyer_premium_percent ?? 5,
      updated_at: new Date().toISOString()
    })
    .eq('id', settings?.id);

  if (updateError) {
    console.error('   ERROR: Could not update platform settings:', updateError.message);
  } else {
    console.log('   SUCCESS: Platform settings can be updated');
  }

  console.log('\n=== Commission System Test Complete ===');
}

testCommissions().catch(console.error);
