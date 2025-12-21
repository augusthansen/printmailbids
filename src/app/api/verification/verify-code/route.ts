import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Verification code and user ID are required' },
        { status: 400 }
      );
    }

    // Get the most recent unexpired verification code for this user
    const { data: verificationRecord, error: fetchError } = await supabase
      .from('phone_verification_codes')
      .select('*')
      .eq('user_id', userId)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationRecord) {
      return NextResponse.json(
        { error: 'No valid verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (verificationRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Increment attempt count
    await supabase
      .from('phone_verification_codes')
      .update({ attempts: verificationRecord.attempts + 1 })
      .eq('id', verificationRecord.id);

    // Check if code matches
    if (verificationRecord.code !== code) {
      const remainingAttempts = MAX_ATTEMPTS - verificationRecord.attempts - 1;
      return NextResponse.json(
        {
          error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        },
        { status: 400 }
      );
    }

    // Code is correct - mark as verified
    const now = new Date().toISOString();

    // Update the verification record
    await supabase
      .from('phone_verification_codes')
      .update({ verified_at: now })
      .eq('id', verificationRecord.id);

    // Update the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: verificationRecord.phone,
        phone_verified: true,
        phone_verified_at: now,
        verified_phone: verificationRecord.phone,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully!',
      phone: verificationRecord.phone,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
