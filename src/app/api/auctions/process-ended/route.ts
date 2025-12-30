import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  sendAuctionWonEmail,
  sendAuctionEndedSellerEmail,
} from '@/lib/email';
import { getCommissionRates, calculateFees } from '@/lib/commissions';

// Lazy initialization to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

// Generate invoice number: INV-YYYYMMDD-XXXX
function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${random}`;
}

export async function POST(request: Request) {
  try {
    // Optional: Add API key protection for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all active auctions that have ended
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    const { data: endedAuctions, error: fetchError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        seller_id,
        current_price,
        starting_price,
        reserve_price,
        listing_type,
        payment_due_days,
        end_time
      `)
      .eq('status', 'active')
      .in('listing_type', ['auction', 'auction_buy_now'])
      .lt('end_time', now);

    if (fetchError) {
      console.error('Error fetching ended auctions:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!endedAuctions || endedAuctions.length === 0) {
      return NextResponse.json({ message: 'No ended auctions to process', processed: 0 });
    }

    const results = [];

    for (const auction of endedAuctions) {
      try {
        // Get the highest bid
        const { data: winningBid } = await supabase
          .from('bids')
          .select('id, bidder_id, amount')
          .eq('listing_id', auction.id)
          .order('amount', { ascending: false })
          .limit(1)
          .single();

        const currentPrice = auction.current_price || auction.starting_price || 0;
        const reserveMet = !auction.reserve_price || currentPrice >= auction.reserve_price;

        if (winningBid && reserveMet) {
          // Auction has a winner!
          // Get commission rates for this seller (checks for custom rates)
          const commissionRates = await getCommissionRates(auction.seller_id);
          const saleAmount = winningBid.amount;
          const fees = calculateFees(saleAmount, commissionRates);

          const buyerPremium = fees.buyerPremiumAmount;
          const totalAmount = fees.totalBuyerPays;
          const sellerCommission = fees.sellerCommissionAmount;
          const sellerPayout = fees.sellerPayoutAmount;
          const buyerPremiumPercent = commissionRates.buyer_premium_percent;
          const sellerCommissionPercent = commissionRates.seller_commission_percent;

          // Calculate payment due date
          const paymentDueDate = new Date();
          paymentDueDate.setDate(paymentDueDate.getDate() + (auction.payment_due_days || 7));

          // Create invoice
          const invoiceNumber = generateInvoiceNumber();
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              invoice_number: invoiceNumber,
              listing_id: auction.id,
              seller_id: auction.seller_id,
              buyer_id: winningBid.bidder_id,
              sale_amount: saleAmount,
              buyer_premium_percent: buyerPremiumPercent,
              buyer_premium_amount: buyerPremium,
              total_amount: totalAmount,
              seller_commission_percent: sellerCommissionPercent,
              seller_commission_amount: sellerCommission,
              seller_payout_amount: sellerPayout,
              status: 'pending',
              fulfillment_status: 'awaiting_payment',
              payment_due_date: paymentDueDate.toISOString().split('T')[0],
            })
            .select()
            .single();

          if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            results.push({ listing_id: auction.id, status: 'error', error: invoiceError.message });
            continue;
          }

          // Update listing status to 'sold'
          await supabase
            .from('listings')
            .update({
              status: 'sold',
              ended_at: new Date().toISOString(),
            })
            .eq('id', auction.id);

          // Update winning bid status
          await supabase
            .from('bids')
            .update({ status: 'won' })
            .eq('id', winningBid.id);

          // Update other bids to 'lost'
          await supabase
            .from('bids')
            .update({ status: 'lost' })
            .eq('listing_id', auction.id)
            .neq('id', winningBid.id);

          // Notify the winner
          await supabase.from('notifications').insert({
            user_id: winningBid.bidder_id,
            type: 'auction_won',
            title: 'Congratulations! You won the auction!',
            body: `You won "${auction.title}" with a bid of $${saleAmount.toLocaleString()}. Total due (including ${buyerPremiumPercent}% buyer premium): $${totalAmount.toLocaleString()}. Payment is due by ${paymentDueDate.toLocaleDateString()}.`,
            listing_id: auction.id,
            invoice_id: invoice.id,
          });

          // Notify the seller
          await supabase.from('notifications').insert({
            user_id: auction.seller_id,
            type: 'auction_ended',
            title: 'Your auction has ended - SOLD!',
            body: `"${auction.title}" sold for $${saleAmount.toLocaleString()}. Your payout after commission: $${sellerPayout.toLocaleString()}.`,
            listing_id: auction.id,
            invoice_id: invoice.id,
          });

          // Send emails to winner and seller
          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', winningBid.bidder_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', auction.seller_id)
            .single();

          if (buyerProfile?.email) {
            sendAuctionWonEmail({
              to: buyerProfile.email,
              userName: buyerProfile.full_name || '',
              listingTitle: auction.title,
              listingId: auction.id,
              invoiceId: invoice.id,
              winningBid: saleAmount,
              totalAmount,
            }).catch(console.error);
          }

          if (sellerProfile?.email) {
            sendAuctionEndedSellerEmail({
              to: sellerProfile.email,
              userName: sellerProfile.full_name || '',
              listingTitle: auction.title,
              listingId: auction.id,
              winningBid: saleAmount,
              buyerName: buyerProfile?.full_name || buyerProfile?.email || 'A buyer',
              hasBids: true,
            }).catch(console.error);
          }

          results.push({
            listing_id: auction.id,
            status: 'sold',
            winner_id: winningBid.bidder_id,
            sale_amount: saleAmount,
            invoice_id: invoice.id,
          });

        } else {
          // No winner (no bids or reserve not met)
          const reason = !winningBid ? 'no_bids' : 'reserve_not_met';

          // Update listing status to 'ended'
          await supabase
            .from('listings')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
            })
            .eq('id', auction.id);

          // Update all bids to 'lost' if any
          if (winningBid) {
            await supabase
              .from('bids')
              .update({ status: 'lost' })
              .eq('listing_id', auction.id);
          }

          // Notify the seller
          await supabase.from('notifications').insert({
            user_id: auction.seller_id,
            type: 'auction_ended',
            title: 'Your auction has ended',
            body: reason === 'no_bids'
              ? `"${auction.title}" ended with no bids.`
              : `"${auction.title}" ended but the reserve price was not met. Highest bid: $${currentPrice.toLocaleString()}.`,
            listing_id: auction.id,
          });

          // Email the seller about auction ending without sale
          const { data: sellerProfileNoSale } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', auction.seller_id)
            .single();

          if (sellerProfileNoSale?.email) {
            sendAuctionEndedSellerEmail({
              to: sellerProfileNoSale.email,
              userName: sellerProfileNoSale.full_name || '',
              listingTitle: auction.title,
              listingId: auction.id,
              winningBid: 0,
              buyerName: '',
              hasBids: false,
            }).catch(console.error);
          }

          // Notify bidders if reserve not met
          if (winningBid && reason === 'reserve_not_met') {
            // Get all unique bidders
            const { data: bidders } = await supabase
              .from('bids')
              .select('bidder_id')
              .eq('listing_id', auction.id);

            const uniqueBidderIds = [...new Set(bidders?.map(b => b.bidder_id) || [])];

            for (const bidderId of uniqueBidderIds) {
              await supabase.from('notifications').insert({
                user_id: bidderId,
                type: 'auction_ended',
                title: 'Auction ended - Reserve not met',
                body: `The auction for "${auction.title}" has ended but the reserve price was not met.`,
                listing_id: auction.id,
              });
            }
          }

          results.push({
            listing_id: auction.id,
            status: 'ended',
            reason,
          });
        }
      } catch (err) {
        console.error(`Error processing auction ${auction.id}:`, err);
        results.push({
          listing_id: auction.id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${endedAuctions.length} ended auctions`,
      processed: endedAuctions.length,
      results,
    });

  } catch (error) {
    console.error('Error in process-ended:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: Request) {
  return POST(request);
}
