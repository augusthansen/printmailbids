const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function addColumn() {
  // Use raw SQL via the rpc function or just try inserting with the column
  // Since we can't run ALTER TABLE directly, let's check if the column exists
  const { data, error } = await supabase.from('bids').select('is_auto_bid').limit(1);

  if (error && error.message.includes('is_auto_bid')) {
    console.log('Column does not exist. Please run this SQL in Supabase dashboard:');
    console.log('ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_auto_bid BOOLEAN DEFAULT FALSE;');
  } else {
    console.log('Column exists or query succeeded:', data);
  }
}

addColumn();
