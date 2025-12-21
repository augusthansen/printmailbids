import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideo() {
  // Find the Bluecrest Rival listing
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, video_url')
    .ilike('title', '%Bluecrest%Rival%')
    .single();
  
  console.log('Bluecrest Rival listing:');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

checkVideo();
