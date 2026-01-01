import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'PrintMailBids <noreply@printmailbids.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export { SITE_URL };

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const client = getResend();

  if (!client) {
    console.log('[Email] Skipping email (no API key):', { to, subject });
    return { success: false, error: 'No API key configured' };
  }

  try {
    const html = await render(react);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error };
    }

    console.log('[Email] Sent successfully:', { to, subject, id: data?.id });
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { success: false, error };
  }
}
