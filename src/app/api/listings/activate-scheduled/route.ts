import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint is called by a cron job to activate scheduled listings
// when their start_time has been reached

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if cron secret matches or if called from Vercel Cron
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    if (!vercelCronHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find all scheduled listings where start_time has passed
    const { data: scheduledListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, start_time, seller_id')
      .eq('status', 'scheduled')
      .lte('start_time', now);

    if (fetchError) {
      console.error('Error fetching scheduled listings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled listings' },
        { status: 500 }
      );
    }

    if (!scheduledListings || scheduledListings.length === 0) {
      return NextResponse.json({
        message: 'No scheduled listings to activate',
        activated: 0
      });
    }

    console.log(`Found ${scheduledListings.length} scheduled listings to activate`);

    // Activate each listing
    const activatedIds: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const listing of scheduledListings) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          status: 'active',
          updated_at: now
        })
        .eq('id', listing.id);

      if (updateError) {
        console.error(`Error activating listing ${listing.id}:`, updateError);
        errors.push({ id: listing.id, error: updateError.message });
      } else {
        activatedIds.push(listing.id);
        console.log(`Activated listing: ${listing.title} (${listing.id})`);

        // Optionally create a notification for the seller
        try {
          await supabase.from('notifications').insert({
            user_id: listing.seller_id,
            type: 'listing_live',
            title: 'Your listing is now live!',
            message: `Your scheduled listing "${listing.title}" is now active and visible to buyers.`,
            data: { listing_id: listing.id },
            is_read: false
          });
        } catch (notifError) {
          console.error(`Failed to create notification for listing ${listing.id}:`, notifError);
          // Don't fail the activation just because notification failed
        }
      }
    }

    return NextResponse.json({
      message: `Activated ${activatedIds.length} listings`,
      activated: activatedIds.length,
      activatedIds,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in activate-scheduled:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing and Vercel Cron compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}
