const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvemZ2aHdma2h6c21ic2l4Y3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzY1NSwiZXhwIjoyMDgwOTg5NjU1fQ.YGZ4QlZ6mfc3fP0uRrgAHdzrJaL5aKUxjwpFTKxt4-k'
);

async function createMissingInvoice() {
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
  console.log('  Amount:', offer.amount);
  console.log('  Buyer ID:', offer.buyer_id);
  console.log('  Seller ID:', offer.seller_id);
  console.log('  Listing ID:', offer.listing_id);

  // Check if invoice already exists for this listing
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

  console.log('\nAttempting to insert invoice with:');
  const invoiceData = {
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
  };
  console.log(JSON.stringify(invoiceData, null, 2));

  const { error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData);

  if (invoiceError) {
    console.error('\nFailed to create invoice:', invoiceError);
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
  console.log('  Sale Amount: $' + offerAmount);
  console.log('  Buyer Premium: $' + buyerPremiumAmount);
  console.log('  Total: $' + totalAmount);
  console.log('  Seller Payout: $' + sellerPayoutAmount);
}

createMissingInvoice();
