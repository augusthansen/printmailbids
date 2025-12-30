import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/commissions';

// Verify user is admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return null;
  }

  return user;
}

// GET: Fetch platform settings
export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getPlatformSettings();

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST: Update platform settings
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      default_buyer_premium_percent,
      default_seller_commission_percent,
      auction_extension_minutes,
      offer_expiry_hours,
    } = body;

    // Validate the values
    if (default_buyer_premium_percent !== undefined) {
      const val = Number(default_buyer_premium_percent);
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: 'Buyer premium must be between 0 and 100' }, { status: 400 });
      }
    }

    if (default_seller_commission_percent !== undefined) {
      const val = Number(default_seller_commission_percent);
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: 'Seller commission must be between 0 and 100' }, { status: 400 });
      }
    }

    if (auction_extension_minutes !== undefined) {
      const val = Number(auction_extension_minutes);
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: 'Auction extension must be a positive number' }, { status: 400 });
      }
    }

    if (offer_expiry_hours !== undefined) {
      const val = Number(offer_expiry_hours);
      if (isNaN(val) || val < 1) {
        return NextResponse.json({ error: 'Offer expiry must be at least 1 hour' }, { status: 400 });
      }
    }

    const result = await updatePlatformSettings({
      default_buyer_premium_percent: default_buyer_premium_percent !== undefined
        ? Number(default_buyer_premium_percent)
        : undefined,
      default_seller_commission_percent: default_seller_commission_percent !== undefined
        ? Number(default_seller_commission_percent)
        : undefined,
      auction_extension_minutes: auction_extension_minutes !== undefined
        ? Number(auction_extension_minutes)
        : undefined,
      offer_expiry_hours: offer_expiry_hours !== undefined
        ? Number(offer_expiry_hours)
        : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Fetch and return updated settings
    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
