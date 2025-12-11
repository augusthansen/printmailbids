// Database types for PrintMailBids
// These match the Supabase schema

export type EquipmentStatus = 
  | 'in_production'
  | 'installed_idle'
  | 'needs_deinstall'
  | 'deinstalled'
  | 'broken_down'
  | 'palletized'
  | 'crated';

export type ListingType = 
  | 'auction'
  | 'fixed_price'
  | 'fixed_price_offers'
  | 'auction_buy_now';

export type ListingStatus = 
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'ended'
  | 'sold'
  | 'cancelled'
  | 'expired';

export type OnsiteAssistance = 
  | 'full_assistance'
  | 'forklift_available'
  | 'limited_assistance'
  | 'no_assistance';

export type DeinstallResponsibility = 
  | 'buyer'
  | 'seller_included'
  | 'seller_additional_fee';

export type BidStatus = 
  | 'active'
  | 'outbid'
  | 'winning'
  | 'won'
  | 'lost'
  | 'cancelled';

export type OfferStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'countered'
  | 'expired'
  | 'withdrawn';

export type InvoiceStatus = 
  | 'pending'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type FulfillmentStatus = 
  | 'awaiting_payment'
  | 'paid'
  | 'packaging'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'disputed';

export type PaymentMethod = 
  | 'credit_card'
  | 'ach'
  | 'wire'
  | 'check'
  | 'escrow';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type NotificationType = 
  | 'outbid'
  | 'auction_ending_soon'
  | 'auction_won'
  | 'offer_accepted'
  | 'offer_declined'
  | 'offer_countered'
  | 'offer_expired'
  | 'shipping_quote_received'
  | 'item_shipped'
  | 'payment_reminder'
  | 'new_listing_saved_search'
  | 'price_drop'
  | 'new_bid'
  | 'reserve_met'
  | 'auction_ending'
  | 'auction_ended'
  | 'new_offer'
  | 'offer_response_needed'
  | 'payment_received'
  | 'shipping_quote_requested'
  | 'buyer_message'
  | 'review_received'
  | 'payout_processed';

// Database row types

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  verified_at: string | null;
  is_seller: boolean;
  seller_approved_at: string | null;
  seller_rating: number;
  seller_review_count: number;
  buyer_rating: number;
  buyer_review_count: number;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  notify_email: boolean;
  notify_push: boolean;
  notify_sms: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
  has_loading_dock: boolean;
  has_forklift: boolean;
  forklift_capacity_lbs: number | null;
  has_overhead_crane: boolean;
  crane_capacity_lbs: number | null;
  ground_level_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  seller_terms: string | null;
  primary_category_id: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  starting_price: number | null;
  reserve_price: number | null;
  buy_now_price: number | null;
  fixed_price: number | null;
  current_bid: number | null;
  bid_count: number;
  accept_offers: boolean;
  auto_accept_price: number | null;
  auto_decline_price: number | null;
  start_time: string | null;
  end_time: string | null;
  original_end_time: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  condition: string | null;
  hours_count: number | null;
  equipment_status: EquipmentStatus | null;
  deinstall_responsibility: DeinstallResponsibility;
  deinstall_fee: number | null;
  onsite_assistance: OnsiteAssistance;
  weight_lbs: number | null;
  length_inches: number | null;
  width_inches: number | null;
  height_inches: number | null;
  electrical_requirements: string | null;
  air_requirements_psi: number | null;
  location_id: string | null;
  removal_deadline: string | null;
  pickup_hours: string | null;
  pickup_notes: string | null;
  payment_due_days: number;
  accepts_credit_card: boolean;
  accepts_ach: boolean;
  accepts_wire: boolean;
  accepts_check: boolean;
  us_buyers_unrestricted: boolean;
  us_buyers_verified_only: boolean;
  us_buyers_approval_required: boolean;
  intl_buyers_unrestricted: boolean;
  intl_buyers_verified_only: boolean;
  intl_buyers_approval_required: boolean;
  inventory_id: string | null;
  view_count: number;
  watch_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  ended_at: string | null;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ListingVideo {
  id: string;
  listing_id: string;
  url: string;
  video_type: string;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
  created_at: string;
}

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  max_bid: number;
  status: BidStatus;
  is_auto_bid: boolean;
  created_at: string;
}

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  parent_offer_id: string | null;
  counter_count: number;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  sale_amount: number;
  buyer_premium_percent: number;
  buyer_premium_amount: number;
  shipping_amount: number;
  packaging_amount: number;
  tax_amount: number;
  total_amount: number;
  seller_commission_percent: number;
  seller_commission_amount: number;
  seller_payout_amount: number;
  status: InvoiceStatus;
  fulfillment_status: FulfillmentStatus;
  payment_due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  seller_notes: string | null;
  buyer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  listing_id: string | null;
  invoice_id: string | null;
  offer_id: string | null;
  bid_id: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_push: boolean;
  sent_email: boolean;
  sent_sms: boolean;
  created_at: string;
}

// Extended types with relations

export interface ListingWithDetails extends Listing {
  seller?: Profile;
  primary_category?: Category;
  images?: ListingImage[];
  videos?: ListingVideo[];
  location?: UserAddress;
  bids?: Bid[];
}

export interface BidWithBidder extends Bid {
  bidder?: Profile;
}

export interface InvoiceWithDetails extends Invoice {
  listing?: Listing;
  seller?: Profile;
  buyer?: Profile;
}
