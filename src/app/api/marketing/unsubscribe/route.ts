import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role for marketing operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a simple hash for email verification
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'printmailbids-unsubscribe-2024';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

// Verify the token matches the email
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return token === expectedToken;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return NextResponse.redirect(new URL('/unsubscribed?error=invalid', request.url));
  }

  // Verify the token matches the email (prevents unauthorized unsubscribes)
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(new URL('/unsubscribed?error=invalid', request.url));
  }

  try {
    // Add to marketing unsubscribe list
    const { error } = await supabase
      .from('marketing_unsubscribes')
      .upsert({
        email: email.toLowerCase(),
        unsubscribed_at: new Date().toISOString(),
        source: 'seller_outreach',
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('[Marketing Unsubscribe] Error:', error);
      // Even on error, show success to user (they tried to unsubscribe)
    }

    console.log(`[Marketing Unsubscribe] ${email} unsubscribed from marketing emails`);

    return NextResponse.redirect(new URL('/unsubscribed?type=marketing', request.url));

  } catch (error) {
    console.error('[Marketing Unsubscribe] Error:', error);
    return NextResponse.redirect(new URL('/unsubscribed?type=marketing', request.url));
  }
}

// Helper endpoint to generate unsubscribe URLs (for internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const token = generateUnsubscribeToken(email);
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://printmailbids.com'}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;

    return NextResponse.json({
      unsubscribeUrl,
      token,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
