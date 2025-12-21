// Script to check offers
// Run with: node scripts/check-offers.mjs

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
  // Get all offers
  const { data: offers, error } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listings(id, title, seller_id),
      buyer:profiles!offers_buyer_id_fkey(id, email),
      seller:profiles!offers_seller_id_fkey(id, email)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('=== All Offers ===');
  if (error) {
    console.error('Error:', error);
    return;
  }

  offers.forEach(offer => {
    console.log(`\nOffer ID: ${offer.id}`);
    console.log(`  Amount: $${offer.amount}`);
    console.log(`  Status: ${offer.status}`);
    console.log(`  Listing: ${offer.listing?.title} (seller_id: ${offer.listing?.seller_id})`);
    console.log(`  Buyer: ${offer.buyer?.email} (id: ${offer.buyer_id})`);
    console.log(`  Seller: ${offer.seller?.email} (id: ${offer.seller_id})`);
    console.log(`  Created: ${offer.created_at}`);
  });

  // Check seller@test.com ID
  console.log('\n=== User IDs ===');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', ['seller@test.com', 'test@test.com']);

  profiles?.forEach(p => {
    console.log(`${p.email}: ${p.id}`);
  });
}

main().catch(console.error);
