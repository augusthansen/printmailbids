# PrintMailBids Marketing Plan

## Session Summary (January 1, 2026)

This document captures the marketing infrastructure, email capabilities, and outreach strategies discussed and implemented for PrintMailBids.

---

## 1. Email Marketing Infrastructure

### Email Provider: Resend
- **API Key**: Configured via `RESEND_API_KEY` environment variable
- **From Email**: `PrintMailBids <hello@printmailbids.com>` (configurable via `FROM_EMAIL`)

### Email Templates (React Email)

All email templates are located in `src/emails/` and use the React Email library for consistent, branded messaging.

| Template | Purpose | File |
|----------|---------|------|
| **WelcomeEmail** | New user onboarding | `WelcomeEmail.tsx` |
| **AuctionWonEmail** | Notify buyer they won an auction | `AuctionWonEmail.tsx` |
| **OfferAcceptedEmail** | Notify buyer their offer was accepted | `OfferAcceptedEmail.tsx` |
| **OutbidEmail** | Notify user they've been outbid | `OutbidEmail.tsx` |
| **OfferReceivedEmail** | Notify seller of new offer | `OfferReceivedEmail.tsx` |
| **PaymentReceivedEmail** | Notify seller of payment | `PaymentReceivedEmail.tsx` |
| **ReceiptEmail** | Payment receipt for buyer | `ReceiptEmail.tsx` |
| **SellerOutreachEmail** | Cold outreach to potential sellers | `SellerOutreachEmail.tsx` |

### Daily Digest Email
- Function: `sendDailyDigestEmail()` in `src/lib/email/index.ts`
- Features:
  - Featured listings section
  - "Ending Soon" auctions
  - New listings showcase
  - CTA to sell equipment
  - Unsubscribe support

---

## 2. Seller Outreach Campaign

### Target Audience
Sellers who have previously sold printing/mailing equipment on competitor platforms (WireBids, eBay, etc.)

### Outreach Email Features
- **Subject Line**: "Tired of 10%+ fees? List your equipment for 8% on PrintMailBids"
- **Value Propositions**:
  - 8% buyer premium (vs 10-15% on competitors)
  - Built-in messaging system
  - Shipping & BOL tracking
  - Mobile-optimized platform
  - Featured placement for early listings

### Outreach Script
**Location**: `scripts/send-outreach-email.ts`

**Usage**:
```bash
# Single email
npx tsx scripts/send-outreach-email.ts --email "seller@example.com" --name "John"

# Bulk from CSV
npx tsx scripts/send-outreach-email.ts --csv "./seller-list.csv"

# Dry run (preview without sending)
npx tsx scripts/send-outreach-email.ts --csv "./seller-list.csv" --dry-run

# Test email
npx tsx scripts/send-outreach-email.ts --test
```

**CSV Format**:
```csv
email,name
seller1@example.com,John Smith
seller2@example.com,Jane Doe
```

**Rate Limiting**:
- 10 emails per batch
- 1 second delay between emails
- 60 second delay between batches

### CAN-SPAM Compliance
All marketing emails include:
- Physical address: `3551 Blairstone Rd #105-66, Tallahassee, FL 32311`
- Unsubscribe link with one-click support
- Clear identification as marketing communication
- Honest subject lines

### Unsubscribe System
- **API Endpoint**: `/api/marketing/unsubscribe`
- **Database Table**: `marketing_unsubscribes`
- **Token-based**: HMAC-SHA256 signed tokens for secure unsubscribe

---

## 3. Landing Pages

### /switch - Seller Conversion Page
**Purpose**: Convert sellers from competitor platforms

**Key Messages**:
- "Switch to PrintMailBids" headline
- Side-by-side fee comparison (8% vs 10-15%)
- Feature comparison table
- Easy migration messaging

### Landing Page Components
Located in `src/components/landing/`:

| Component | Purpose |
|-----------|---------|
| `EarlyAdopterCTA.tsx` | Highlights early seller benefits |
| `Testimonials.tsx` | Social proof (placeholder testimonials) |
| `ComparisonTable.tsx` | Fee/feature comparison with competitors |
| `HeroSection.tsx` | Main landing page hero |
| `FeaturedListings.tsx` | Showcase active listings |

---

## 4. SMS Marketing & Verification

### Twilio Integration
- **Toll-Free Number**: Pending verification
- **Use Cases**: Phone verification, bid alerts, transaction notifications

### SMS Consent Collection
- Explicit opt-in consent box before sending verification code
- Consent language includes:
  - Message types (verification, alerts, notifications)
  - Frequency disclosure
  - Data rates disclaimer
  - STOP/HELP instructions
  - Links to SMS Terms & Privacy Policy

### SMS Compliance Pages
- `/sms-consent` - Public page showing opt-in flow (for Twilio verification)
- `/sms-terms` - SMS Terms & Conditions

---

## 5. Fee Structure

### Current Pricing (Updated January 2026)
- **Buyer Premium**: 8% (reduced from 5%)
- **Seller Commission**: 0% at launch (platform takes buyer premium only)

### Messaging
- "Only 8% buyer premium"
- "Lower fees than competitors" (vs 10-15%)
- "Free to list. Only pay when you sell."

---

## 6. Marketing Assets Checklist

### Implemented
- [x] Seller outreach email template
- [x] Bulk email sending script with rate limiting
- [x] Unsubscribe system (API + database)
- [x] /switch landing page
- [x] SMS consent collection
- [x] SMS Terms page
- [x] Welcome email
- [x] Transaction emails (won, outbid, offer, receipt)
- [x] Daily digest email function
- [x] CAN-SPAM compliant footer with physical address

### Pending
- [ ] Actual seller email list acquisition
- [ ] Twilio toll-free number verification approval
- [ ] Real testimonials (currently placeholders)
- [ ] Social media presence
- [ ] Google Ads / PPC campaigns
- [ ] SEO optimization
- [ ] Referral program

---

## 7. Key Contacts

- **Support Email**: support@printmailbids.com
- **Phone**: 1-888-565-9483
- **Business Entity**: Megabox Supply LLC / PrintMailBids, LLC
- **Address**: 3551 Blairstone Rd #105-66, Tallahassee, FL 32311

---

## 8. Technical Notes

### Environment Variables Required
```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL="PrintMailBids <hello@printmailbids.com>"
NEXT_PUBLIC_APP_URL=https://printmailbids.com
UNSUBSCRIBE_SECRET=your_secret_for_tokens
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### Database Tables for Marketing
- `marketing_unsubscribes` - Tracks email opt-outs
- `profiles.phone_verified` - SMS consent status
- `platform_settings` - Fee configuration

---

## Session Changes Summary

### Code Changes Made This Session:
1. **Buyer Premium Update (5% → 8%)**: Updated all fallback values across 10+ files
2. **Admin Verify Button Fix**: Now sets both `is_verified` and `phone_verified`
3. **SMS Consent Box**: Added explicit Twilio-compliant consent language
4. **SMS Consent Page**: Created `/sms-consent` for Twilio verification
5. **Outreach Email Updates**: Removed "first sale free" messaging, added physical address
6. **Database Cleanup**: Removed sample data, kept 3 real listings and all users

### Files Modified:
- `src/lib/commissions.ts`
- `src/app/api/platform/fees/route.ts`
- `src/app/api/stripe/verify-payment/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/admin/data/route.ts`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/(public)/fees/page.tsx`
- `src/app/dashboard/invoices/[id]/page.tsx`
- `src/emails/ReceiptEmail.tsx`
- `src/emails/SellerOutreachEmail.tsx`
- `src/components/PhoneVerification.tsx`
- `src/components/landing/EarlyAdopterCTA.tsx`
