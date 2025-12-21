import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, formatPhoneNumber, smsTemplates, SMSTemplateType } from '@/lib/sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber, template, templateData, customMessage } = body;

    // Either userId (to look up phone) or phoneNumber must be provided
    let targetPhone = phoneNumber;

    if (userId && !phoneNumber) {
      // Look up user's phone number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone_number, sms_notifications')
        .eq('id', userId)
        .single();

      if (error || !profile?.phone_number) {
        return NextResponse.json(
          { error: 'User phone number not found' },
          { status: 404 }
        );
      }

      // Check if user has SMS notifications enabled
      if (profile.sms_notifications === false) {
        return NextResponse.json(
          { error: 'User has SMS notifications disabled' },
          { status: 400 }
        );
      }

      targetPhone = profile.phone_number;
    }

    if (!targetPhone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format the phone number
    const formattedPhone = formatPhoneNumber(targetPhone);
    if (!formattedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Build the message
    let message: string;

    if (customMessage) {
      message = customMessage;
    } else if (template && templateData) {
      const templateFn = smsTemplates[template as SMSTemplateType];
      if (!templateFn) {
        return NextResponse.json(
          { error: 'Invalid template' },
          { status: 400 }
        );
      }
      // Call the template function with the data
      message = (templateFn as (...args: unknown[]) => string)(...Object.values(templateData));
    } else {
      return NextResponse.json(
        { error: 'Either customMessage or template with templateData is required' },
        { status: 400 }
      );
    }

    // Send the SMS
    const result = await sendSMS(formattedPhone, message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
