// Script to check listing state and notifications
// Run with: node scripts/check-listing-state.mjs

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

async function main() {
  // Get the 2014 Rival listing
  const { data: listings, error: listingError } = await supabase
    .from('listings')
    .select('id, title, seller_id, current_price, starting_price, reserve_price, bid_count, status')
    .ilike('title', '%rival%')
    .limit(5);

  if (listingError) {
    console.error('Error fetching listings:', listingError);
    return;
  }

  console.log('=== Listings matching "rival" ===');
  console.log(JSON.stringify(listings, null, 2));

  if (listings && listings.length > 0) {
    const listing = listings[0];

    // Get bids for this listing
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('id, bidder_id, amount, max_bid, status, created_at')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false });

    console.log('\n=== Bids for this listing ===');
    if (bidsError) {
      console.error('Error fetching bids:', bidsError);
    } else {
      console.log(JSON.stringify(bids, null, 2));
    }

    // Get notifications for seller
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', listing.seller_id)
      .order('created_at', { ascending: false })
      .limit(20);

    console.log('\n=== Seller notifications ===');
    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    } else {
      console.log(JSON.stringify(notifications, null, 2));
    }
  }
}

main().catch(console.error);
