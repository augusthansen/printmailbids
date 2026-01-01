import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';
import crypto from 'crypto';

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a 6-digit verification code (cryptographically secure)
function generateCode(): string {
  // Use fixed code for testing (works in any environment when DEV_VERIFICATION_CODE is set)
  if (process.env.DEV_VERIFICATION_CODE) {
    return process.env.DEV_VERIFICATION_CODE;
  }
  // Generate cryptographically secure 6-digit code
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  return (100000 + (randomNumber % 900000)).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { phone, userId } = await request.json();

    if (!phone || !userId) {
      return NextResponse.json(
        { error: 'Phone number and user ID are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use a valid US phone number.' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      return NextResponse.json(
        { error: 'Could not format phone number' },
        { status: 400 }
      );
    }

    // Check rate limiting - max 3 codes per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('phone_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if this phone number is already verified by another user
    const { data: existingVerified } = await supabase
      .from('profiles')
      .select('id')
      .eq('verified_phone', formattedPhone)
      .neq('id', userId)
      .single();

    if (existingVerified) {
      return NextResponse.json(
        { error: 'This phone number is already verified by another account.' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unexpired codes for this user
    await supabase
      .from('phone_verification_codes')
      .delete()
      .eq('user_id', userId)
      .is('verified_at', null);

    // Store the verification code
    const { error: insertError } = await supabase
      .from('phone_verification_codes')
      .insert({
        user_id: userId,
        phone: formattedPhone,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to create verification code' },
        { status: 500 }
      );
    }

    // Skip SMS when DEV_SKIP_SMS is set (works in any environment for testing)
    const skipSms = process.env.DEV_SKIP_SMS === 'true';

    if (!skipSms) {
      // Send the SMS
      const result = await sendSMS(
        formattedPhone,
        `Your PrintMailBids verification code is: ${code}. This code expires in 10 minutes.`
      );

      if (!result.success) {
        console.error('Failed to send SMS:', result.error);
        return NextResponse.json(
          { error: 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      console.log(`[DEV] Skipping SMS. Code for ${formattedPhone}: ${code}`);
    }

    // Return success with masked phone number
    const maskedPhone = formattedPhone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 (***) ***-$4');

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
