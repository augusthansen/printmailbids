const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function checkProfiles() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, is_seller')
    .in('email', ['test@test.com', 'seller@test.com']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Profiles:');
  profiles?.forEach(p => {
    console.log(`  ${p.email}: ${p.id} (is_seller: ${p.is_seller})`);
  });

  // Check for invoice with seller@test.com as seller
  const sellerProfile = profiles?.find(p => p.email === 'seller@test.com');
  if (sellerProfile) {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('seller_id', sellerProfile.id);

    console.log('\nInvoices where seller@test.com is the seller:', invoices?.length || 0);
    if (invoices && invoices.length > 0) {
      invoices.forEach(inv => {
        console.log(`  Invoice ${inv.id}: $${inv.sale_amount} - ${inv.status}`);
      });
    }
  }
}

checkProfiles();
