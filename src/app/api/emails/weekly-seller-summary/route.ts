import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWeeklySellerSummaryEmail } from '@/lib/email';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  // Check for Vercel Cron header (automatically set by Vercel for cron jobs)
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  if (vercelCronHeader) {
    return true;
  }

  // Fallback to CRON_SECRET for manual/external calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // In production, require CRON_SECRET if not called from Vercel Cron
    console.error('[Weekly Seller] CRON_SECRET not set and not called from Vercel Cron');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Weekly Seller] Starting weekly seller summary job...');

  try {
    // Get all sellers subscribed to weekly summary
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_seller', true)
      .eq('digest_weekly_seller', true)
      .eq('notify_email', true);

    if (sellersError) {
      console.error('[Weekly Seller] Failed to fetch sellers:', sellersError);
      return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
    }

    if (!sellers || sellers.length === 0) {
      console.log('[Weekly Seller] No sellers subscribed');
      return NextResponse.json({ message: 'No sellers subscribed', sent: 0 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let successCount = 0;
    let errorCount = 0;

    for (const seller of sellers) {
      try {
        // Get seller's active listings
        const { data: listings, count: activeListingsCount } = await supabase
          .from('listings')
          .select('id, title, view_count, bid_count', { count: 'exact' })
          .eq('seller_id', seller.id)
          .eq('status', 'active');

        // Get total views this week (from all their listings)
        const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;

        // Get bids received this week
        const { count: totalBids } = await supabase
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .in('listing_id', listings?.map(l => l.id) || [])
          .gte('created_at', oneWeekAgo.toISOString());

        // Get offers received this week
        const { count: totalOffers } = await supabase
          .from('offers')
          .select('*', { count: 'exact', head: true })
          .in('listing_id', listings?.map(l => l.id) || [])
          .gte('created_at', oneWeekAgo.toISOString());

        // Get sales this week
        const { data: sales } = await supabase
          .from('sales')
          .select('final_price')
          .eq('seller_id', seller.id)
          .gte('created_at', oneWeekAgo.toISOString());

        const totalSales = sales?.length || 0;
        const totalRevenue = sales?.reduce((sum, s) => sum + (s.final_price || 0), 0) || 0;

        // Get top performing listings (by views + bids)
        const topListings = (listings || [])
          .map(l => ({
            id: l.id,
            title: l.title,
            views: l.view_count || 0,
            bids: l.bid_count || 0,
          }))
          .sort((a, b) => (b.views + b.bids * 10) - (a.views + a.bids * 10))
          .slice(0, 5);

        // Only send if there's some activity or active listings
        if (activeListingsCount === 0 && totalViews === 0 && totalBids === 0) {
          continue;
        }

        const result = await sendWeeklySellerSummaryEmail({
          to: seller.email,
          userName: seller.full_name?.split(' ')[0] || '',
          weekStats: {
            totalViews,
            totalBids: totalBids || 0,
            totalOffers: totalOffers || 0,
            totalSales,
            totalRevenue,
          },
          topListings,
          activeListingsCount: activeListingsCount || 0,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`[Weekly Seller] Failed to send to ${seller.email}:`, result.error);
        }
      } catch (err) {
        errorCount++;
        console.error(`[Weekly Seller] Error processing ${seller.email}:`, err);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Weekly Seller] Completed: ${successCount} sent, ${errorCount} failed`);

    return NextResponse.json({
      message: 'Weekly seller summary completed',
      sent: successCount,
      failed: errorCount,
      totalSellers: sellers.length,
    });

  } catch (error) {
    console.error('[Weekly Seller] Job failed:', error);
    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}
