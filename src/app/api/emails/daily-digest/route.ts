import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDailyDigestEmail } from '@/lib/email';

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
    console.error('[Daily Digest] CRON_SECRET not set and not called from Vercel Cron');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Daily Digest] Starting daily digest email job...');

  try {
    // Get all users subscribed to daily digest
    const { data: subscribers, error: subscribersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, digest_unsubscribe_token')
      .eq('digest_daily', true)
      .eq('notify_email', true);

    if (subscribersError) {
      console.error('[Daily Digest] Failed to fetch subscribers:', subscribersError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('[Daily Digest] No subscribers found');
      return NextResponse.json({ message: 'No subscribers', sent: 0 });
    }

    // Get active listings count
    const { count: totalActiveListings } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get featured listings (highest bid count or view count)
    const { data: featuredListings } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        listing_type,
        current_price,
        starting_price,
        fixed_price,
        buy_now_price,
        bid_count,
        end_time,
        category:categories(name),
        images:listing_images(url, is_primary),
        address:user_addresses(city, state)
      `)
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(2);

    // Get ending soon listings (within 24 hours)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const { data: endingSoonListings } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        listing_type,
        current_price,
        starting_price,
        bid_count,
        end_time,
        category:categories(name),
        images:listing_images(url, is_primary),
        address:user_addresses(city, state)
      `)
      .eq('status', 'active')
      .not('end_time', 'is', null)
      .lte('end_time', tomorrow.toISOString())
      .gte('end_time', new Date().toISOString())
      .order('end_time', { ascending: true })
      .limit(4);

    // Get new listings (created in last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: newListings } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        listing_type,
        current_price,
        starting_price,
        fixed_price,
        buy_now_price,
        bid_count,
        end_time,
        category:categories(name),
        images:listing_images(url, is_primary),
        address:user_addresses(city, state)
      `)
      .eq('status', 'active')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(4);

    // Transform listings to email format
    const transformListing = (listing: any) => {
      const primaryImage = listing.images?.find((img: any) => img.is_primary);
      const imageUrl = primaryImage?.url || listing.images?.[0]?.url;
      const isFixedPrice = listing.listing_type?.includes('fixed');

      return {
        id: listing.id,
        title: listing.title,
        category: listing.category?.name || 'Equipment',
        imageUrl,
        currentPrice: isFixedPrice
          ? (listing.fixed_price || listing.buy_now_price || 0)
          : (listing.current_price || listing.starting_price || 0),
        bidCount: listing.bid_count || 0,
        endTime: listing.end_time ? new Date(listing.end_time) : undefined,
        listingType: isFixedPrice ? 'fixed_price' as const : 'auction' as const,
        location: listing.address ? `${listing.address.city}, ${listing.address.state}` : undefined,
      };
    };

    const featured = (featuredListings || []).map(transformListing);
    const endingSoon = (endingSoonListings || []).map(transformListing);
    const newItems = (newListings || []).map(transformListing);

    // Send emails to all subscribers
    let successCount = 0;
    let errorCount = 0;

    for (const subscriber of subscribers) {
      try {
        const result = await sendDailyDigestEmail({
          to: subscriber.email,
          userName: subscriber.full_name?.split(' ')[0] || '',
          featuredListings: featured,
          endingSoonListings: endingSoon,
          newListings: newItems,
          totalActiveListings: totalActiveListings || 0,
          unsubscribeToken: subscriber.digest_unsubscribe_token,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`[Daily Digest] Failed to send to ${subscriber.email}:`, result.error);
        }
      } catch (err) {
        errorCount++;
        console.error(`[Daily Digest] Error sending to ${subscriber.email}:`, err);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Daily Digest] Completed: ${successCount} sent, ${errorCount} failed`);

    return NextResponse.json({
      message: 'Daily digest completed',
      sent: successCount,
      failed: errorCount,
      totalSubscribers: subscribers.length,
    });

  } catch (error) {
    console.error('[Daily Digest] Job failed:', error);
    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}
