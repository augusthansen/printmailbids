const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k';

async function addInvoiceNumberColumn() {
  // Use REST API to execute SQL
  const sql = `
    -- Add invoice_number column
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
  `;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  const result = await response.json();
  console.log('Response:', response.status, result);
}

// Actually let's try a different approach - check if we can just insert with invoice_number
async function insertWithInvoiceNumber() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Get the accepted offer
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('status', 'accepted')
    .single();

  if (offerError || !offer) {
    console.error('No accepted offer found:', offerError);
    return;
  }

  console.log('Found accepted offer:', offer.id);

  // Check if invoice already exists
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('listing_id', offer.listing_id)
    .eq('seller_id', offer.seller_id)
    .single();

  if (existingInvoice) {
    console.log('Invoice already exists:', existingInvoice.id);
    return;
  }

  // Calculate amounts
  const offerAmount = Number(offer.amount);
  const buyerPremiumPercent = 5.0;
  const buyerPremiumAmount = offerAmount * (buyerPremiumPercent / 100);
  const totalAmount = offerAmount + buyerPremiumAmount;
  const sellerCommissionPercent = 8.0;
  const sellerCommissionAmount = offerAmount * (sellerCommissionPercent / 100);
  const sellerPayoutAmount = offerAmount - sellerCommissionAmount;

  const paymentDueDate = new Date();
  paymentDueDate.setDate(paymentDueDate.getDate() + 7);

  // Generate invoice number
  const year = new Date().getFullYear();
  const invoiceNumber = `${year}-000001`;

  console.log('Attempting to insert with invoice_number:', invoiceNumber);

  const { error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      listing_id: offer.listing_id,
      seller_id: offer.seller_id,
      buyer_id: offer.buyer_id,
      sale_amount: offerAmount,
      buyer_premium_percent: buyerPremiumPercent,
      buyer_premium_amount: buyerPremiumAmount,
      total_amount: totalAmount,
      seller_commission_percent: sellerCommissionPercent,
      seller_commission_amount: sellerCommissionAmount,
      seller_payout_amount: sellerPayoutAmount,
      status: 'pending',
      fulfillment_status: 'awaiting_payment',
      payment_due_date: paymentDueDate.toISOString().split('T')[0],
      invoice_number: invoiceNumber,
    });

  if (invoiceError) {
    console.error('Failed to create invoice:', invoiceError);
    return;
  }

  // Verify it was created
  const { data: newInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('listing_id', offer.listing_id)
    .eq('seller_id', offer.seller_id)
    .single();

  console.log('\nCreated invoice:', newInvoice?.id);
  console.log('Invoice number:', newInvoice?.invoice_number);
}

insertWithInvoiceNumber();
