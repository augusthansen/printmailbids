# PrintMailBids Mobile App Technical Handoff Document

> **Purpose:** This document provides everything needed to build React Native iOS/Android apps for PrintMailBids - a B2B auction marketplace for printing, mailing, and industrial equipment.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Environment Configuration](#environment-configuration)
4. [Authentication System](#authentication-system)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Core User Flows](#core-user-flows)
8. [Business Logic](#business-logic)
9. [Email & SMS Templates](#email--sms-templates)
10. [Real-Time Features](#real-time-features)
11. [Mobile Implementation Recommendations](#mobile-implementation-recommendations)

---

## Platform Overview

**PrintMailBids** is a modern marketplace where print shops, mailing houses, and industrial companies buy and sell equipment through:

- **Auctions** with proxy bidding and soft-close protection
- **Fixed-price** listings with "Buy Now"
- **Make Offer** negotiations with counter-offers
- **Integrated payments** via Stripe
- **Messaging** between buyers and sellers
- **Push notifications** for bids, offers, and shipping updates

### Key Differentiators
- **8% buyer premium** (competitors charge 15-20%)
- **8% seller commission** (taken from sale price)
- **2-minute soft-close** prevents auction sniping
- **Real-time bidding** with instant notifications
- **Freight/rigging logistics** for heavy equipment

---

## Technology Stack

### Web Application
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe |
| Email | Resend |
| SMS | Twilio |
| Hosting | Vercel |

### Recommended Mobile Stack
| Layer | Technology |
|-------|------------|
| Framework | React Native with Expo |
| State | React Context or Zustand |
| Navigation | React Navigation |
| API | Supabase JS Client |
| Payments | Stripe React Native SDK |
| Push | Expo Notifications or FCM |

---

## Environment Configuration

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uozfvhwfkhzsmbsixcyb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Server-side only!

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_API_KEY=sk_live_xxx  # Server-side only!
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend (Email)
RESEND_API_KEY=re_xxx
FROM_EMAIL=PrintMailBids <noreply@printmailbids.com>

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx  # Server-side only!
TWILIO_PHONE_NUMBER=+18885659483

# App URLs
NEXT_PUBLIC_SITE_URL=https://printmailbids.com
NEXT_PUBLIC_APP_URL=https://printmailbids.com

# Security
CRON_SECRET=<random-secret>
UNSUBSCRIBE_SECRET=<random-secret>
```

### Mobile-Specific Config
For React Native, only use public keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Authentication System

### Supabase Auth Flow

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uozfvhwfkhzsmbsixcyb.supabase.co',
  '<anon-key>'
);

// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
    }
  }
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign In with Google (OAuth)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});

// Get Current User
const { data: { user } } = await supabase.auth.getUser();

// Sign Out
await supabase.auth.signOut();

// Listen to Auth Changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'SIGNED_OUT') {
    // User signed out
  }
});
```

### Profile Auto-Creation
When a user signs up, a database trigger automatically creates their profile:

```sql
-- Trigger: handle_new_user
-- Fires on: INSERT into auth.users
-- Creates: Row in profiles table with id, email, full_name
```

### Session Tokens
- **Access Token:** Short-lived JWT (1 hour default)
- **Refresh Token:** Long-lived (used to get new access tokens)
- Supabase client handles refresh automatically

---

## Database Schema

### Core Tables

#### `profiles` - User accounts
```typescript
interface Profile {
  id: string;                    // UUID, matches auth.users.id
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Verification
  is_verified: boolean;
  verified_at: string | null;
  phone_verified: boolean;

  // Roles
  is_seller: boolean;
  is_admin: boolean;
  seller_approved_at: string | null;

  // Ratings
  seller_rating: number;         // 0-5
  seller_review_count: number;
  buyer_rating: number;
  buyer_review_count: number;

  // Seller Settings
  seller_terms: string | null;   // Global terms for all listings
  default_shipping_info: string | null;

  // Payment
  stripe_customer_id: string | null;
  stripe_account_id: string | null;  // For seller payouts

  // Notifications
  notify_email: boolean;
  notify_push: boolean;
  notify_sms: boolean;

  // Custom Commission (null = platform defaults)
  custom_buyer_premium_percent: number | null;
  custom_seller_commission_percent: number | null;

  created_at: string;
  updated_at: string;
}
```

#### `user_addresses` - Shipping/pickup locations
```typescript
interface UserAddress {
  id: string;
  user_id: string;
  label: string | null;          // "Main Warehouse", "Showroom", etc.
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;

  // Equipment handling capabilities
  has_loading_dock: boolean;
  has_forklift: boolean;
  forklift_capacity_lbs: number | null;
  has_overhead_crane: boolean;
  crane_capacity_lbs: number | null;
  ground_level_access: boolean;

  created_at: string;
  updated_at: string;
}
```

#### `listings` - Equipment for sale
```typescript
type ListingType = 'auction' | 'fixed_price' | 'fixed_price_offers' | 'auction_buy_now';
type ListingStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'expired';
type EquipmentStatus = 'in_production' | 'installed_idle' | 'needs_deinstall' | 'deinstalled' | 'broken_down' | 'palletized' | 'crated';
type DeinstallResponsibility = 'buyer' | 'seller_included' | 'seller_additional_fee';
type OnsiteAssistance = 'full_assistance' | 'forklift_available' | 'limited_assistance' | 'no_assistance';

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  seller_terms: string | null;       // Listing-specific terms
  shipping_info: string | null;
  primary_category_id: string | null;

  // Type & Status
  listing_type: ListingType;
  status: ListingStatus;

  // Pricing
  starting_price: number | null;     // Auction starting bid
  reserve_price: number | null;      // Minimum to sell
  buy_now_price: number | null;      // Optional instant purchase
  fixed_price: number | null;        // For fixed_price listings
  current_bid: number | null;        // Current highest bid
  bid_count: number;

  // Make Offer
  accept_offers: boolean;
  auto_accept_price: number | null;  // Auto-accept if offer >= this
  auto_decline_price: number | null; // Auto-reject if offer < this

  // Timing
  start_time: string | null;
  end_time: string | null;
  original_end_time: string | null;  // Before soft-close extensions

  // Equipment Details
  make: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  condition: string | null;
  hours_count: number | null;
  equipment_status: EquipmentStatus | null;

  // Dimensions & Specs
  weight_lbs: number | null;
  length_inches: number | null;
  width_inches: number | null;
  height_inches: number | null;
  floor_length_ft: number | null;
  floor_width_ft: number | null;
  electrical_requirements: string | null;
  air_requirements_psi: number | null;

  // Logistics
  deinstall_responsibility: DeinstallResponsibility;
  deinstall_fee: number | null;
  onsite_assistance: OnsiteAssistance;
  location_id: string | null;        // FK to user_addresses
  removal_deadline: string | null;
  pickup_hours: string | null;
  pickup_notes: string | null;

  // Payment Terms
  payment_due_days: number;          // Default: 7
  accepts_credit_card: boolean;
  accepts_ach: boolean;
  accepts_wire: boolean;
  accepts_check: boolean;

  // Buyer Restrictions
  us_buyers_unrestricted: boolean;
  us_buyers_verified_only: boolean;
  us_buyers_approval_required: boolean;
  intl_buyers_unrestricted: boolean;
  intl_buyers_verified_only: boolean;
  intl_buyers_approval_required: boolean;

  // Tracking
  inventory_id: string | null;
  view_count: number;
  watch_count: number;

  created_at: string;
  updated_at: string;
  published_at: string | null;
  ended_at: string | null;
}
```

#### `listing_images` & `listing_videos`
```typescript
interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

interface ListingVideo {
  id: string;
  listing_id: string;
  url: string;
  video_type: string;            // 'youtube', 'vimeo', 'upload'
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
  created_at: string;
}
```

#### `bids` - Auction bids with proxy bidding
```typescript
type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'lost' | 'cancelled';

interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;              // Current display amount
  max_bid: number;             // Proxy bid maximum
  status: BidStatus;
  is_auto_bid: boolean;        // True if placed by proxy system
  created_at: string;
}
```

#### `offers` - Make Offer negotiations
```typescript
type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'withdrawn';

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  parent_offer_id: string | null;  // For counter-offers
  counter_count: number;           // 0 = original, 1+ = counter
  expires_at: string;              // 48 hours from creation
  responded_at: string | null;
  created_at: string;
}
```

#### `invoices` - Purchase invoices
```typescript
type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
type FulfillmentStatus = 'awaiting_payment' | 'paid' | 'packaging' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'completed' | 'disputed';
type PaymentMethod = 'credit_card' | 'ach' | 'wire' | 'check' | 'escrow';

interface Invoice {
  id: string;
  invoice_number: string;          // INV-YYYYMMDD-XXXX
  listing_id: string;
  seller_id: string;
  buyer_id: string;

  // Amounts
  sale_amount: number;             // Winning bid or accepted offer
  buyer_premium_percent: number;   // Default: 8
  buyer_premium_amount: number;
  shipping_amount: number;
  packaging_amount: number;
  tax_amount: number;
  total_amount: number;            // What buyer pays

  // Seller Fees
  seller_commission_percent: number;  // Default: 8
  seller_commission_amount: number;
  seller_payout_amount: number;       // What seller receives

  // Status
  status: InvoiceStatus;
  fulfillment_status: FulfillmentStatus;

  // Payment
  payment_due_date: string;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;

  // Shipping
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;

  // Freight (heavy equipment)
  freight_bol_number: string | null;
  freight_pro_number: string | null;
  freight_class: string | null;
  freight_weight_lbs: number | null;
  freight_pickup_date: string | null;
  freight_estimated_delivery: string | null;
  freight_pickup_contact: JSON | null;
  freight_delivery_contact: JSON | null;
  freight_special_instructions: string | null;

  // Delivery Confirmation
  delivery_confirmed_at: string | null;
  delivery_confirmed_by: string | null;
  delivery_condition: 'good' | 'damaged' | 'partial' | null;
  delivery_notes: string | null;
  delivery_bol_url: string | null;
  delivery_damage_photos: string[] | null;

  // Notes
  seller_notes: string | null;
  buyer_notes: string | null;
  internal_notes: string | null;

  created_at: string;
  updated_at: string;
}
```

#### `notifications`
```typescript
type NotificationType =
  | 'outbid' | 'auction_ending_soon' | 'auction_won' | 'auction_ended'
  | 'new_bid' | 'reserve_met' | 'auction_ending'
  | 'new_offer' | 'offer_accepted' | 'offer_declined' | 'offer_countered' | 'offer_expired' | 'offer_response_needed'
  | 'payment_reminder' | 'payment_received' | 'payment_confirmed'
  | 'item_shipped' | 'item_delivered' | 'shipping_quote_received' | 'shipping_quote_requested'
  | 'fees_added' | 'fees_approved' | 'fees_rejected'
  | 'buyer_message' | 'review_received' | 'payout_processed'
  | 'new_listing_saved_search' | 'price_drop';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;

  // Related entities
  listing_id: string | null;
  invoice_id: string | null;
  offer_id: string | null;
  bid_id: string | null;

  // Status
  is_read: boolean;
  read_at: string | null;

  // Delivery tracking
  sent_push: boolean;
  sent_email: boolean;
  sent_sms: boolean;

  created_at: string;
}
```

#### `conversations` & `messages`
```typescript
interface Conversation {
  id: string;
  listing_id: string | null;
  invoice_id: string | null;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
```

#### `watchlist`
```typescript
interface WatchlistItem {
  user_id: string;
  listing_id: string;
  created_at: string;
}
```

#### `platform_settings` (singleton)
```typescript
interface PlatformSettings {
  id: string;
  default_buyer_premium_percent: number;      // 8
  default_seller_commission_percent: number;  // 8
  auction_extension_minutes: number;          // 2
  offer_expiry_hours: number;                 // 48
  created_at: string;
  updated_at: string;
}
```

---

## API Reference

### Base URL
```
https://printmailbids.com/api
```

### Authentication Endpoints

#### `GET /api/auth/user`
Get current authenticated user and profile.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "is_seller": true,
    "is_admin": false,
    "full_name": "John Doe",
    "company_name": "Acme Print"
  }
}
```

#### `POST /api/auth/signout`
Sign out current user (clears session cookies).

---

### Bidding Endpoints

#### `POST /api/bids/place`
Place or update a proxy bid on an auction.

**Request:**
```json
{
  "listingId": "uuid",
  "maxBid": 5000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bid placed successfully",
  "currentPrice": 4500,
  "bidCount": 12,
  "wasOutbid": false,
  "reserveMet": true,
  "auctionExtended": false
}
```

**Business Logic:**
- Proxy bidding: System auto-bids up to your max
- Soft-close: Bid within 2 min of end extends by 2 min
- Bid increments based on price (see Business Logic section)
- Cannot bid on own listing

---

### Offer Endpoints

#### `POST /api/offers/submit`
Submit an offer on a listing that accepts offers.

**Request:**
```json
{
  "listingId": "uuid",
  "amount": 8000,
  "message": "Would you take $8,000?"
}
```

**Response:**
```json
{
  "success": true,
  "autoAccepted": false,
  "message": "Offer submitted",
  "offerId": "uuid",
  "expiresAt": "2024-01-03T12:00:00Z",
  "remainingOffers": 2
}
```

**Rules:**
- Max 3 offers per buyer per listing
- Expires in 48 hours
- Auto-accept if >= `auto_accept_price`
- Auto-decline if < `auto_decline_price`

#### `POST /api/offers/respond`
Accept, decline, or counter an offer.

**Request:**
```json
{
  "offerId": "uuid",
  "action": "counter",
  "counterAmount": 9000,
  "counterMessage": "Can we meet at $9,000?"
}
```

**Response:**
```json
{
  "success": true,
  "action": "counter",
  "message": "Counter offer sent",
  "counterOfferId": "uuid",
  "expiresAt": "2024-01-03T12:00:00Z"
}
```

#### `POST /api/offers/withdraw`
Withdraw a pending offer.

**Request:**
```json
{
  "offerId": "uuid"
}
```

---

### Checkout Endpoints

#### `POST /api/checkout/auction-won`
Create Stripe checkout for auction winner.

**Request:**
```json
{
  "listingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_xxx",
  "sessionUrl": "https://checkout.stripe.com/...",
  "invoiceId": "uuid",
  "existing": false
}
```

#### `POST /api/checkout/buy-now`
Create Stripe checkout for fixed-price purchase.

**Request:**
```json
{
  "listingId": "uuid"
}
```

#### `POST /api/stripe/create-checkout`
Create Stripe checkout for an existing invoice.

**Request:**
```json
{
  "invoiceId": "uuid",
  "userId": "uuid"
}
```

#### `POST /api/stripe/verify-payment`
Verify payment status for an invoice.

**Request:**
```json
{
  "invoiceId": "uuid"
}
```

---

### Phone Verification

#### `POST /api/verification/send-code`
Send SMS verification code.

**Request:**
```json
{
  "phone": "+15551234567",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code sent",
  "expiresAt": "2024-01-01T12:10:00Z"
}
```

**Limits:** Max 3 codes per hour per user

#### `POST /api/verification/verify-code`
Verify the SMS code.

**Request:**
```json
{
  "code": "123456",
  "userId": "uuid"
}
```

---

### Platform Settings

#### `GET /api/platform/fees`
Get current fee structure (public).

**Response:**
```json
{
  "buyer_premium_percent": 8,
  "seller_commission_percent": 8
}
```

---

### Auction Processing (Cron)

#### `POST /api/auctions/process-ended`
Process ended auctions (called by Vercel Cron every 5 minutes).

**Response:**
```json
{
  "message": "Processed 3 auctions",
  "processed": 3,
  "results": [
    {
      "listing_id": "uuid",
      "status": "sold",
      "winner_id": "uuid",
      "sale_amount": 5000,
      "invoice_id": "uuid"
    }
  ]
}
```

---

## Core User Flows

### Buyer Flow: Auction

```
1. Browse → View active listings
2. View → See details, images, specs, current bid
3. Watch → Add to watchlist
4. Bid → Place proxy bid (max amount)
5. [Outbid] → Get notification, can bid again
6. [Win] → Auction ends, receive email with invoice
7. Pay → Stripe checkout (item + 8% buyer premium)
8. [Paid] → Seller notified, prepares shipment
9. Track → View shipping status
10. Receive → Confirm delivery condition
11. Review → Rate the seller
```

### Buyer Flow: Make Offer

```
1. Browse → Find listing with "Make Offer"
2. Offer → Submit amount + optional message
3. Wait → Seller has 48 hours to respond
4. [Counter] → Seller counters, you can accept/decline/counter
5. [Accepted] → Invoice created automatically
6. Pay → Stripe checkout
7. Same as auction winner...
```

### Seller Flow

```
1. Create → New listing (draft)
2. Details → Title, description, specs, images
3. Pricing → Set starting price, reserve, buy-now (optional)
4. Publish → Go live or schedule
5. [Bid] → Get notified of new bids
6. [Offer] → Review, accept/decline/counter
7. [Sold] → Buyer wins/accepts, invoice created
8. [Paid] → Notification to ship
9. Ship → Update tracking info
10. Payout → Receive funds (sale - 8% commission)
```

---

## Business Logic

### Fee Structure

| Fee | Rate | Paid By |
|-----|------|---------|
| Buyer Premium | 8% | Buyer (on top of sale) |
| Seller Commission | 8% | Seller (deducted from sale) |

**Example ($10,000 sale):**
- Buyer pays: $10,000 + $800 = **$10,800**
- Seller receives: $10,000 - $800 = **$9,200**
- Platform earns: $800 + $800 = **$1,600**

### Bid Increments

| Current Bid Range | Increment |
|-------------------|-----------|
| $0 - $250 | $1 |
| $250 - $1,000 | $10 |
| $1,000 - $10,000 | $50 |
| $10,000+ | $100 |

### Proxy Bidding Algorithm

```typescript
function calculateNewBid(currentBid: number, myMaxBid: number, theirMaxBid: number): number {
  const increment = getBidIncrement(currentBid);

  if (myMaxBid > theirMaxBid) {
    // I'm winning, bid just above their max
    return Math.min(theirMaxBid + increment, myMaxBid);
  } else {
    // They're winning, my bid is at my max
    return myMaxBid;
  }
}
```

### Soft-Close Extension

```typescript
// If bid placed within 2 minutes of end
if (endTime - now < 2 * 60 * 1000) {
  // Extend by 2 minutes
  newEndTime = now + 2 * 60 * 1000;

  // Store original end time (first extension only)
  if (!originalEndTime) {
    originalEndTime = endTime;
  }
}
```

### Reserve Price Logic

1. If first bid and `maxBid >= reserve`: Current bid = reserve
2. If later bid and current < reserve: Bid must be >= reserve to win
3. Seller notified when reserve first met
4. Auction won't award unless reserve is met

### Offer Expiry

- Original offers: 48 hours
- Counter-offers: 48 hours from counter
- Max 3 counter-offers per negotiation chain
- Auto-expired offers notified to both parties

### Invoice Number Format

```
INV-YYYYMMDD-XXXX
     │        └── 4 random hex chars
     └── Date (e.g., 20240101)

Example: INV-20240101-A7B3
```

---

## Email & SMS Templates

### Email Types

| Template | Recipient | Trigger |
|----------|-----------|---------|
| `Welcome` | New user | Sign up |
| `Outbid` | Previous high bidder | Someone bids higher |
| `AuctionWon` | Winner | Auction ends |
| `AuctionEndedSeller` | Seller | Auction ends |
| `OfferReceived` | Seller | New offer submitted |
| `OfferAccepted` | Buyer | Seller accepts |
| `OfferDeclined` | Buyer | Seller declines |
| `CounterOffer` | Either party | Counter sent |
| `PaymentReceived` | Seller | Buyer pays |
| `Receipt` | Buyer | Payment processed |
| `PaymentReminder` | Buyer | Before/after due date |
| `NewMessage` | Recipient | New chat message |
| `DailyDigest` | Subscribers | Daily cron |
| `WeeklySellerSummary` | Sellers | Weekly cron |

### SMS Templates

| Event | Message |
|-------|---------|
| Outbid | "You've been outbid on [Title]. Current: $X. Bid again: [link]" |
| Auction Won | "Congrats! You won [Title] for $X. Pay now: [link]" |
| New Offer | "New offer of $X on [Title]. Review: [link]" |
| Payment Received | "Payment received for [Title]. Ship now: [link]" |

---

## Real-Time Features

### Supabase Realtime Subscriptions

```typescript
// Subscribe to new bids on a listing
const bidSubscription = supabase
  .channel('bids')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bids',
    filter: `listing_id=eq.${listingId}`,
  }, (payload) => {
    console.log('New bid:', payload.new);
    // Update UI with new bid
  })
  .subscribe();

// Subscribe to user's notifications
const notificationSubscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    showPushNotification(payload.new);
  })
  .subscribe();

// Subscribe to messages in a conversation
const messageSubscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    addMessageToChat(payload.new);
  })
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(bidSubscription);
  supabase.removeChannel(notificationSubscription);
  supabase.removeChannel(messageSubscription);
};
```

---

## Mobile Implementation Recommendations

### 1. Project Setup

```bash
# Create Expo project with TypeScript
npx create-expo-app PrintMailBids -t expo-template-blank-typescript

# Install dependencies
npx expo install @supabase/supabase-js
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install expo-secure-store
npx expo install expo-notifications
npx expo install @stripe/stripe-react-native
```

### 2. Supabase Client for React Native

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://uozfvhwfkhzsmbsixcyb.supabase.co';
const supabaseAnonKey = '<your-anon-key>';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 3. Key Screens to Build

**Tab Navigation:**
1. **Home/Browse** - Listing grid with filters
2. **Watchlist** - Saved listings
3. **Activity** - Bids, offers, invoices
4. **Messages** - Conversations
5. **Profile** - Settings, addresses

**Stack Screens:**
- Listing Detail (with bid/offer buttons)
- Place Bid Modal
- Make Offer Modal
- Checkout (Stripe)
- Invoice Detail
- Conversation

### 4. Push Notifications

```typescript
// hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export function usePushNotifications() {
  useEffect(() => {
    // Request permissions
    Notifications.requestPermissionsAsync();

    // Get push token
    Notifications.getExpoPushTokenAsync().then((token) => {
      // Store token in database for server-side push
      supabase
        .from('push_tokens')
        .upsert({ user_id: userId, token: token.data });
    });

    // Handle notification received
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle in-app notification
      }
    );

    return () => subscription.remove();
  }, [userId]);
}
```

### 5. Stripe Payment

```typescript
// screens/Checkout.tsx
import { useStripe } from '@stripe/stripe-react-native';

function CheckoutScreen({ invoiceId }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  async function handlePayment() {
    // Get checkout session from your API
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ invoiceId, userId }),
    });
    const { sessionUrl } = await response.json();

    // For mobile, you might use Payment Sheet instead
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'PrintMailBids',
    });

    if (!error) {
      const { error: paymentError } = await presentPaymentSheet();
      if (!paymentError) {
        // Payment successful
        navigation.navigate('InvoiceDetail', { invoiceId, paid: true });
      }
    }
  }
}
```

### 6. Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticate() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access PrintMailBids',
    });
    return result.success;
  }
  return false;
}
```

### 7. Deep Linking

```typescript
// app.config.js
export default {
  expo: {
    scheme: 'printmailbids',
    // ...
  },
};

// Handle deep links
Linking.addEventListener('url', ({ url }) => {
  // printmailbids://listing/uuid
  // printmailbids://invoice/uuid
  const route = parseUrl(url);
  navigation.navigate(route.screen, route.params);
});
```

### 8. Offline Support

Cache these locally:
- User profile
- Watched listings (for quick access)
- Active invoices
- Recent messages

Use React Query or SWR for caching:
```typescript
import { useQuery } from '@tanstack/react-query';

function useWatchlist(userId: string) {
  return useQuery({
    queryKey: ['watchlist', userId],
    queryFn: () => supabase
      .from('watchlist')
      .select('*, listing:listings(*)')
      .eq('user_id', userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## Vercel Cron Jobs

The web app has these automated jobs (limited to 2 for Vercel Hobby plan):

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/emails/daily-digest` | 1 PM UTC daily | Send daily listing digest |
| `/api/auctions/process-ended` | 3 PM UTC daily | Award won auctions, create invoices |

**Note:** Due to Vercel Hobby plan limits (2 cron jobs max), scheduled listing activation and weekly seller summaries are not currently automated. These can be manually triggered or upgraded with a paid plan.

---

## Security Notes

1. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_API_KEY` in mobile app
2. Use `NEXT_PUBLIC_*` keys only for client-side
3. All sensitive operations go through API routes
4. Stripe webhooks verify signatures
5. Phone verification uses HMAC tokens
6. Session tokens stored in Secure Store (not AsyncStorage)

---

## Getting Started Checklist

- [ ] Set up Expo project with TypeScript
- [ ] Configure Supabase client with SecureStore
- [ ] Implement auth flow (sign up, sign in, sign out)
- [ ] Build listing browse/search screen
- [ ] Add listing detail with images
- [ ] Implement bid placement
- [ ] Implement make offer flow
- [ ] Add watchlist functionality
- [ ] Set up push notifications
- [ ] Integrate Stripe for payments
- [ ] Build messaging system
- [ ] Add notification center
- [ ] Implement profile/settings
- [ ] Add biometric auth option
- [ ] Configure deep linking
- [ ] Test offline behavior

---

*Document generated: January 1, 2026*
*PrintMailBids v1.0*
