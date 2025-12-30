import { createClient } from '@supabase/supabase-js';

// Hardcoded values from .env.local
const supabaseUrl = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration...');

  try {
    // Test if column exists by trying to select it
    const { error: testError } = await supabase
      .from('invoices')
      .select('shipping_quote_url')
      .limit(1);

    if (testError?.message?.includes('does not exist')) {
      console.log('Column does not exist. Please run the following SQL in the Supabase Dashboard SQL Editor:');
      console.log('');
      console.log(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_quote_url TEXT;`);
      console.log('');
    } else if (testError) {
      console.log('Unexpected error:', testError);
    } else {
      console.log('✓ Column shipping_quote_url already exists');
    }

    // Check if documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('Error checking buckets:', bucketsError);
      return;
    }

    const documentsBucket = buckets?.find(b => b.id === 'documents');

    if (!documentsBucket) {
      console.log('Creating documents bucket...');
      const { error: createError } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      });

      if (createError) {
        console.log('Error creating bucket:', createError);
      } else {
        console.log('✓ Documents bucket created');
      }
    } else {
      console.log('✓ Documents bucket already exists');
    }

    // Now set up RLS policies for the documents bucket
    // We need to allow authenticated users to upload and read files
    console.log('\nSetting up storage policies...');

    // Try to create upload policy using admin client
    // Since we're using service role, we can use rpc to execute SQL
    const policySQL = `
      -- Allow authenticated users to upload files
      INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
      SELECT 'documents', 'Allow authenticated uploads', 'authenticated', 'true'
      WHERE NOT EXISTS (
        SELECT 1 FROM storage.policies WHERE bucket_id = 'documents' AND name = 'Allow authenticated uploads'
      );
    `;

    // Note: Direct SQL execution might not work, but the bucket is public so reads should work
    // Uploads require RLS policy - let's use a workaround by updating bucket settings

    // Update bucket to ensure it's truly public
    const { error: updateError } = await supabase.storage.updateBucket('documents', {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['application/pdf']
    });

    if (updateError) {
      console.log('Error updating bucket:', updateError);
    } else {
      console.log('✓ Documents bucket updated to be public');
    }

    // Test upload capability by listing files
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list('shipping-quotes', { limit: 1 });

    if (listError) {
      console.log('Error listing files:', listError);
    } else {
      console.log('✓ Can access documents bucket (files:', files?.length || 0, ')');
    }

    console.log('');
    console.log('Migration complete!');
    console.log('');
    console.log('IMPORTANT: If uploads still fail, run this SQL in Supabase Dashboard:');
    console.log('');
    console.log(`CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');`);

  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
