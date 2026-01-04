import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'No email address found' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Use admin client to generate verification link
    const adminClient = createAdminClient();

    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://printmailbids.com'}/auth/callback`,
      },
    });

    if (linkError || !data.properties?.action_link) {
      console.error('Error generating verification link:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate verification link' },
        { status: 500 }
      );
    }

    // Send email via Resend
    const verificationUrl = data.properties.action_link;

    if (!verificationUrl) {
      return NextResponse.json(
        { error: 'Failed to generate verification URL' },
        { status: 500 }
      );
    }

    const { error: emailError } = await resend.emails.send({
      from: 'PrintMailBids <noreply@printmailbids.com>',
      to: user.email,
      subject: 'Verify your email address - PrintMailBids',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 12px 16px; border-radius: 12px;">
              <span style="color: white; font-weight: bold; font-size: 18px;">PMB</span>
            </div>
          </div>

          <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px; text-align: center;">
            Verify your email address
          </h1>

          <p style="color: #475569; margin-bottom: 24px; text-align: center;">
            Thanks for signing up for PrintMailBids! Click the button below to verify your email address and activate your account.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 32px;">
            If you didn't create an account with PrintMailBids, you can safely ignore this email.
          </p>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            This link will expire in 24 hours.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            PrintMailBids - The trusted marketplace for printing &amp; mailing equipment
          </p>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
