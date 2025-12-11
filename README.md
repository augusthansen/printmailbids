# PrintMailBids

The modern marketplace for printing, mailing, and industrial equipment.

**List Today. Sell Tomorrow. No Waiting.**

## Features

- 🚀 **Instant Listing** - No waiting for scheduled auctions
- ⏱️ **2-Minute Soft Close** - Fair auctions with anti-sniping protection
- 💰 **Lower Fees** - 5% buyer premium (vs 10% on competitors)
- 💳 **Multiple Payment Options** - Credit card, ACH, wire, check
- 📦 **Logistics Support** - Shipping quotes and rigging partner network
- 📱 **Mobile-First** - Works great on any device
- 🔔 **Real-Time Notifications** - Never miss a bid

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Connect
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/augusthansen/printmailbids.git
   cd printmailbids
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials.

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Paste the contents of `supabase/schema.sql` and run it

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## License

Proprietary - All rights reserved.
