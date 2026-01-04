import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, password, fullName, companyName, isSeller } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Create user with admin client (bypasses email confirmation)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Don't auto-confirm - we'll handle verification
      user_metadata: {
        full_name: fullName,
        company_name: companyName,
      },
    });

    if (createError) {
      console.error('User creation error:', createError);
      // Handle duplicate email
      if (createError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email,
        full_name: fullName,
        company_name: companyName,
        is_seller: isSeller,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail signup if profile creation fails
    }

    // Generate verification link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://printmailbids.com'}/auth/callback`,
      },
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('Error generating verification link:', linkError);
      return NextResponse.json(
        { error: 'Account created but failed to send verification email. Please use the resend option.' },
        { status: 500 }
      );
    }

    const verificationUrl = linkData.properties.action_link;

    // Send verification email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'PrintMailBids <noreply@printmailbids.com>',
      to: email,
      subject: 'Verify your email address - PrintMailBids',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 12px 16px; border-radius: 12px;">
                <span style="color: white; font-weight: bold; font-size: 18px;">PMB</span>
              </div>
            </div>

            <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px; text-align: center; font-weight: 700;">
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
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            PrintMailBids - The trusted marketplace for printing &amp; mailing equipment
          </p>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      // User was created, but email failed - they can use resend
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'Account created. Please use the resend verification option.',
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
