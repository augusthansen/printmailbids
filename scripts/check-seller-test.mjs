// Script to check seller@test.com data
// Run with: node scripts/check-seller-test.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SELLER_TEST_ID = 'e977eab6-662f-4379-af48-c19762b5880d';

async function main() {
  console.log('=== seller@test.com user ID:', SELLER_TEST_ID, '===\n');

  // Get listings owned by seller@test.com
  const { data: listings, error: listingError } = await supabase
    .from('listings')
    .select('id, title, current_price, starting_price, reserve_price, bid_count, status')
    .eq('seller_id', SELLER_TEST_ID);

  console.log('=== Listings owned by seller@test.com ===');
  console.log(JSON.stringify(listings, null, 2));

  // Get notifications for seller@test.com
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', SELLER_TEST_ID)
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('\n=== Notifications for seller@test.com ===');
  console.log(JSON.stringify(notifications, null, 2));

  // Check bids on their listings
  if (listings && listings.length > 0) {
    const listingIds = listings.map(l => l.id);
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    console.log('\n=== Bids on seller@test.com listings ===');
    console.log(JSON.stringify(bids, null, 2));
  }
}

main().catch(console.error);
