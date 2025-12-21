import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for unsubscribe actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'all'; // 'daily', 'weekly', or 'all'

  if (!token) {
    return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
  }

  try {
    // Find user by unsubscribe token
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('digest_unsubscribe_token', token)
      .single();

    if (findError || !profile) {
      console.error('[Unsubscribe] Invalid token:', token);
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    // Update preferences based on type
    const updates: Record<string, boolean> = {};

    if (type === 'daily' || type === 'all') {
      updates.digest_daily = false;
    }
    if (type === 'weekly' || type === 'all') {
      updates.digest_weekly_seller = false;
    }
    if (type === 'all') {
      updates.notify_email = false;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) {
      console.error('[Unsubscribe] Failed to update:', updateError);
      return NextResponse.redirect(new URL('/?error=unsubscribe-failed', request.url));
    }

    console.log(`[Unsubscribe] User ${profile.email} unsubscribed from: ${type}`);

    // Redirect to a success page
    return NextResponse.redirect(new URL('/unsubscribed?type=' + type, request.url));

  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.redirect(new URL('/?error=unsubscribe-failed', request.url));
  }
}

// Also support POST for API usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type = 'all' } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find user by unsubscribe token
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('digest_unsubscribe_token', token)
      .single();

    if (findError || !profile) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Update preferences
    const updates: Record<string, boolean> = {};

    if (type === 'daily' || type === 'all') {
      updates.digest_daily = false;
    }
    if (type === 'weekly' || type === 'all') {
      updates.digest_weekly_seller = false;
    }
    if (type === 'all') {
      updates.notify_email = false;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Unsubscribed from ${type} emails`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
