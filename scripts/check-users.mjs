// Script to check users
// Run with: node scripts/check-users.mjs

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
  // Get profiles with emails
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, is_seller, email')
    .limit(20);

  console.log('=== User Profiles ===');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(JSON.stringify(profiles, null, 2));

  // Get auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  console.log('\n=== Auth Users ===');
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  authUsers.users.forEach(u => {
    console.log(`${u.id}: ${u.email} (is_seller profile check needed)`);
  });
}

main().catch(console.error);
