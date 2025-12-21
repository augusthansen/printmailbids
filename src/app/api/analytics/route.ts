import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_EVENT_TYPES = ['view', 'video_play', 'watchlist_add', 'bid_click', 'offer_click', 'share'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, event_type, user_id, session_id, metadata } = body;

    // Validate required fields
    if (!listing_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: listing_id and event_type' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert the event
    const { error } = await supabase
      .from('listing_events')
      .insert({
        listing_id,
        event_type,
        user_id: user_id || null,
        session_id: session_id || null,
        metadata: metadata || {},
      });

    if (error) {
      console.error('Error logging event:', error);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
