const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function checkNotifications() {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      body,
      user:profiles!notifications_user_id_fkey(email)
    `)
    .eq('type', 'counter_offer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Counter Offer Notifications ===\n');
  notifications?.forEach(n => {
    console.log(`To: ${n.user?.email}`);
    console.log(`  Type: ${n.type}`);
    console.log(`  Title: ${n.title}`);
    console.log(`  Body: ${n.body}`);
    console.log('');
  });

  if (notifications?.length === 0) {
    console.log('No counter offer notifications found.');
  }
}

checkNotifications();
