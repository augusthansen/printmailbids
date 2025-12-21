const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function addInvoiceNumberColumn() {
  // Try to add invoice_number column
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'invoices' AND column_name = 'invoice_number'
        ) THEN
          ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
          RAISE NOTICE 'Added invoice_number column';
        ELSE
          RAISE NOTICE 'invoice_number column already exists';
        END IF;
      END $$;
    `
  });

  if (error) {
    console.error('Error:', error);
    // Let's just try to insert without invoice_number
    console.log('Will modify the code to not require invoice_number');
  } else {
    console.log('Column added successfully');
  }
}

addInvoiceNumberColumn();
