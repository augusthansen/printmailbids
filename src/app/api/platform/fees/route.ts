import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/commissions';

// Public endpoint to get fee information for display
export async function GET() {
  try {
    const settings = await getPlatformSettings();

    if (!settings) {
      // Return fallback defaults if settings can't be fetched
      return NextResponse.json({
        buyer_premium_percent: 8.0,
        seller_commission_percent: 8.0,
      });
    }

    return NextResponse.json({
      buyer_premium_percent: settings.default_buyer_premium_percent,
      seller_commission_percent: settings.default_seller_commission_percent,
    });
  } catch (error) {
    console.error('Failed to fetch platform fees:', error);
    // Return fallback defaults on error
    return NextResponse.json({
      buyer_premium_percent: 8.0,
      seller_commission_percent: 8.0,
    });
  }
}
