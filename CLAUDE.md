# CLAUDE.md - PrintMailBids Application Documentation

## Overview

PrintMailBids is a full-featured online marketplace for printing, mailing, and industrial equipment. The platform implements a bidding/auction system with support for fixed-price sales, make-offer functionality, and multi-method payment processing.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.0.10 with React 19.2.1 |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth with email verification |
| Payments | Stripe Connect |
| Email | Resend (transactional emails) |
| SMS | Twilio (notifications) |
| Styling | Tailwind CSS 4 with PostCSS |
| State | Zustand |
| Testing | Vitest with React Testing Library |
| Hosting | Vercel (with cron jobs) |
| Icons | Lucide React |

## Project Structure

```
/home/user/printmailbids/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes (landing, marketplace, auth)
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # User dashboard (protected)
│   │   ├── auth/              # Auth routes (callback, verify-email, onboarding)
│   │   ├── category/          # Category browse pages
│   │   └── api/               # API endpoints
│   ├── components/            # React components
│   │   ├── dashboard/
│   │   ├── landing/
│   │   └── layout/
│   ├── lib/                   # Utility functions
│   │   ├── supabase/          # DB clients (server, client, admin, middleware)
│   │   ├── stripe/            # Stripe integration
│   │   ├── email/             # Email sending utilities
│   │   ├── sms/               # SMS templates and Twilio integration
│   │   ├── commissions.ts     # Fee calculation logic
│   │   └── invoice.ts         # Invoice utilities
│   ├── emails/                # React Email templates
│   ├── hooks/                 # Custom React hooks (useAuth, useAnalytics)
│   ├── types/                 # TypeScript type definitions
│   └── __tests__/             # Test files
├── supabase/                  # Database schema & migrations
├── public/                    # Static assets
├── scripts/                   # Admin/utility scripts
├── vercel.json               # Vercel cron job configuration
└── package.json
```

## Core Features

### Marketplace & Listings

- **Auction Listings**: Time-based auctions with proxy bidding and 2-minute soft-close window
- **Fixed Price Sales**: Direct purchase at set price
- **Make Offer System**: Buyers submit offers with counter-offer support
- **Buy Now Option**: Instant purchase during auctions
- **Listing Types**: `auction`, `fixed_price`, `fixed_price_offers`, `auction_buy_now`
- **Listing States**: `draft`, `scheduled`, `active`, `ended`, `sold`, `cancelled`, `expired`

### Bidding System

- **Proxy Bidding**: Maximum bid system with automatic increments
- **Bid Increments**:
  - $1 for items up to $250
  - $10 for $250 - $1,000
  - $50 for $1,000 - $10,000
  - $100 for $10,000+
- **Soft-Close Protection**: 2-minute extension when bids received near end time
- **Bid Status**: `active`, `outbid`, `winning`, `won`, `lost`, `cancelled`

### Payment & Invoicing

- **Commission Structure**:
  - Default buyer premium: 5%
  - Default seller commission: 8%
  - Custom rates per seller supported
- **Payment Methods**: Credit card (Stripe), ACH, Wire transfer, Check
- **Invoice Generation**: Automatic when auctions end with winner
- **Payment Due**: Configurable per listing (default 7 days)

### Seller Features

- Seller profiles with verification and ratings
- Seller onboarding with Stripe Connect setup
- Listing management with draft/scheduled/active states
- Facility details (loading dock, forklift capacity, crane capacity)
- Shipping configuration with removal deadlines
- Buyer restrictions (US/International, verified-only, approval-required)

### Buyer Features

- Watchlist for saved items
- Offer submission with counter-offer support
- Invoice tracking and payment management
- Purchase history with fulfillment status
- Bid management (active bids, winning bids, history)

### Notifications

- **Channels**: Email, SMS (Twilio), in-app
- **Types**: Outbid, auction_won, offer_accepted/declined/countered, payment_received, auction_ending_soon, new_offer

### Messaging

- Conversations linked to listings or invoices
- Direct messaging between buyers and sellers
- Read status tracking

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, seller info, ratings, verification |
| `user_addresses` | Multiple addresses per user with facility details |
| `listings` | Equipment listings with specs, pricing, status |
| `listing_images` & `listing_videos` | Media for listings |
| `bids` | Auction bids with proxy bid support |
| `offers` | Make-offer system with counter-offers |
| `invoices` | Sale records with buyer/seller amounts |
| `payments` & `payouts` | Payment processing and seller payouts |
| `notifications` | Multi-channel notifications |
| `messages` & `conversations` | Direct messaging |
| `reviews` | Buyer/seller ratings per transaction |
| `watchlist` | Saved listings |
| `saved_searches` | Saved search criteria with notifications |
| `categories` | Equipment categories (7 main) |
| `shipping_quote_requests` & `shipping_quotes` | Logistics integration |
| `service_providers` | Rigging network partners |
| `stripe_webhook_events` | Webhook idempotency tracking |

### Key Enums

- `equipment_status`: in_production, installed_idle, needs_deinstall, deinstalled, broken_down, palletized, crated
- `listing_type`: auction, fixed_price, fixed_price_offers, auction_buy_now
- `listing_status`: draft, scheduled, active, ended, sold, cancelled, expired
- `bid_status`: active, outbid, winning, won, lost, cancelled
- `offer_status`: pending, accepted, declined, countered, expired, withdrawn
- `invoice_status`: pending, paid, partial, overdue, cancelled, refunded
- `fulfillment_status`: awaiting_payment, paid, packaging, ready_for_pickup, shipped, delivered, completed, disputed

## API Routes

### Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration with email verification |
| POST | `/api/auth/send-verification` | Resend verification email |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/user` | Get current user |

### Bidding (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bids/place` | Place bid with proxy bid logic |
| POST | `/api/auctions/process-ended` | Cron: End auctions, create invoices |

### Offers (`/api/offers/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/offers/submit` | Submit offer |
| POST | `/api/offers/respond` | Accept/decline offer |
| POST | `/api/offers/withdraw` | Withdraw offer |

### Checkout & Payments (`/api/checkout/`, `/api/stripe/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout/buy-now` | Create invoice for direct purchase |
| POST | `/api/checkout/auction-won` | Create invoice for auction winner |
| POST | `/api/stripe/create-checkout` | Initialize Stripe Checkout |
| POST | `/api/stripe/verify-payment` | Verify payment status |
| POST | `/api/stripe/webhook` | Handle Stripe webhooks |

### Email & Marketing (`/api/emails/`, `/api/marketing/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails/daily-digest` | Cron: Send daily digest |
| GET | `/api/emails/weekly-seller-summary` | Weekly seller summary |
| POST | `/api/emails/unsubscribe` | Unsubscribe from marketing |
| POST | `/api/marketing/unsubscribe` | Marketing unsubscribe with token |

### Admin (`/api/admin/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/data` | Dashboard data (stats, analytics) |
| POST | `/api/admin/settings` | Platform settings updates |

## Authentication & Authorization

### Supabase Auth

- Email/password authentication
- Magic link sign-in
- Session managed in cookies
- JWT tokens for API authentication

### Protected Routes (Middleware)

- `/dashboard/*` - User dashboard
- `/sell/*` - Seller functions
- `/account/*` - Account settings
- `/messages/*` - Messaging

### Row Level Security (RLS)

All tables have RLS policies:
- **Profiles**: Public read, users can update own
- **Listings**: Public read for active/ended/sold, owners can manage
- **Bids**: Public read, authenticated users can create
- **Offers**: Only participants can view/update
- **Invoices**: Only buyer and seller can see
- **Notifications**: Only owner can access
- **Watchlist**: Only owner can manage

## Cron Jobs

Configured in `vercel.json`:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| 1 PM UTC daily | `/api/emails/daily-digest` | Send daily digest to subscribers |
| 3 PM UTC daily | `/api/auctions/process-ended` | End auctions, create invoices, send notifications |

### Cron Security

- Verifies `x-vercel-cron` header from Vercel
- Fallback to `CRON_SECRET` environment variable
- Only runs on Vercel or with valid Bearer token

## Third-Party Integrations

### Stripe

- Stripe Connect for seller payouts
- Webhook events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Idempotency tracking in `stripe_webhook_events` table

### Resend (Email)

Templates in `src/emails/`:
- WelcomeEmail
- AuctionWonEmail
- OfferAcceptedEmail / OfferReceivedEmail
- OutbidEmail
- PaymentReceivedEmail / ReceiptEmail
- SellerOutreachEmail
- DailyDigestEmail
- AuctionEndedSellerEmail

### Twilio (SMS)

Templates in `src/lib/sms/`:
- Bid notifications (outbid, bid won, new bid)
- Offer notifications (received, accepted, declined, counter)
- Auction notifications (ending, ended)
- Message notifications
- Payment notifications (received, reminders)

## Commission System

Located in `/src/lib/commissions.ts`:

```typescript
// Platform defaults
FALLBACK_BUYER_PREMIUM = 8.0%
FALLBACK_SELLER_COMMISSION = 8.0%

// Key functions
getPlatformSettings()           // Fetch defaults from DB
getCommissionRates(sellerId)    // Check custom rates per seller
updatePlatformSettings()        // Admin API to change defaults
updateSellerCommissionRates()   // Per-seller custom rates
calculateFees(saleAmount, rates) // Calculate buyer/seller amounts
```

### Fee Example

```
Sale Amount: $1,000
Buyer Premium (5%): +$50
Total Buyer Pays: $1,050

Seller Commission (8%): -$80
Seller Receives: $920
Platform Earnings: $130
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Email (Resend)
RESEND_API_KEY
FROM_EMAIL

# SMS (Twilio)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# App URLs
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_URL

# Security
CRON_SECRET
```

## Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run Vitest in watch mode
npm run test:run     # Single test run
npm run test:coverage # Coverage report
npm run lint         # ESLint validation
npm run email        # React Email preview dev server
```

## Utility Scripts

Located in `/scripts/`:

| Script | Purpose |
|--------|---------|
| `check-schema.ts` | Validate database structure |
| `test-auction-end.js` | Simulate auction ending |
| `test-commissions.ts` | Test fee calculations |
| `test-rls.ts` | Test row level security |
| `send-test-sms.ts` | Test Twilio integration |
| `send-outreach-email.ts` | Bulk email campaign |
| `send-sample-email.ts` | Individual email test |
| `create-missing-invoice.js` | Data cleanup |
| `add-sample-bids.js` | Test data generation |

## Custom Hooks

- `useAuth()` - Authentication state and user info
- `useAnalytics()` - Analytics data retrieval

## Security Features

- Row Level Security on all tables
- Supabase Auth with email verification
- JWT token authentication
- Stripe webhook signature verification
- Webhook idempotency checks
- HMAC-SHA256 signed unsubscribe tokens
- CAN-SPAM compliance

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/supabase/middleware.ts` | Route protection |
| `src/lib/commissions.ts` | Fee calculations |
| `src/lib/invoice.ts` | Invoice utilities |
| `src/lib/email/send-email.ts` | Email sending |
| `src/lib/sms/twilio.ts` | SMS sending |
| `src/lib/stripe/stripe.ts` | Stripe client |
| `src/types/database.ts` | Type definitions |
| `supabase/schema.sql` | Database schema |
| `vercel.json` | Cron configuration |

## Equipment Categories

The platform supports 7 main equipment categories for printing, mailing, and industrial equipment.

## Additional Documentation

- `README.md` - Project overview and setup
- `MARKETING_PLAN.md` - Email campaigns and outreach strategy
- `MOBILE_APP_HANDOFF.md` - Mobile app specifications
