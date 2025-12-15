-- Create invoices table for auction sales
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Amounts
  sale_amount DECIMAL(12, 2) NOT NULL,
  buyer_premium_percent DECIMAL(5, 2) DEFAULT 5.0,
  buyer_premium_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  seller_commission_percent DECIMAL(5, 2) DEFAULT 8.0,
  seller_commission_amount DECIMAL(12, 2) NOT NULL,
  seller_payout_amount DECIMAL(12, 2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  fulfillment_status TEXT DEFAULT 'awaiting_payment' CHECK (fulfillment_status IN ('awaiting_payment', 'processing', 'shipped', 'delivered', 'cancelled')),

  -- Payment info
  payment_due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  payment_reference TEXT,

  -- Shipping
  shipping_address JSONB,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_listing_id ON invoices(listing_id);
CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer_id ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies: Buyers and sellers can view their own invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only system can create invoices (via service role)
CREATE POLICY "Service role can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

-- Buyers can update payment info on their invoices
CREATE POLICY "Buyers can update their invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Sellers can update fulfillment info
CREATE POLICY "Sellers can update fulfillment"
  ON invoices FOR UPDATE
  USING (auth.uid() = seller_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();
