import { Resend } from 'resend';

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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailParams) {
  const client = getResend();

  if (!client) {
    console.log('[Email] Skipping email (no API key):', { to, subject });
    return { success: false, error: 'No API key configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
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

// Email template wrapper
function emailTemplate(content: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrintMailBids</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
          <!-- Header -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#dc2626;">PrintMailBids</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#71717a;">
                &copy; ${new Date().getFullYear()} PrintMailBids. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">
                <a href="${SITE_URL}/dashboard/settings" style="color:#a1a1aa;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Button component for emails
function emailButton(text: string, url: string, color: string = '#dc2626') {
  return `
    <a href="${url}" style="display:inline-block;padding:12px 24px;background-color:${color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
      ${text}
    </a>
  `;
}

// ==================== NOTIFICATION EMAILS ====================

// Outbid notification
export async function sendOutbidEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  yourBid: number;
  newHighBid: number;
  endTime: Date;
}) {
  const { to, userName, listingTitle, listingId, yourBid, newHighBid, endTime } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">You've Been Outbid!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Someone has placed a higher bid on <strong>${listingTitle}</strong>.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px;background-color:#fef2f2;border-radius:8px 8px 0 0;">
          <span style="font-size:14px;color:#71717a;">Your Bid</span><br>
          <span style="font-size:20px;font-weight:bold;color:#dc2626;">$${yourBid.toLocaleString()}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;background-color:#f4f4f5;border-radius:0 0 8px 8px;">
          <span style="font-size:14px;color:#71717a;">Current High Bid</span><br>
          <span style="font-size:20px;font-weight:bold;color:#18181b;">$${newHighBid.toLocaleString()}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      Auction ends: ${endTime.toLocaleString()}
    </p>
    <div style="text-align:center;">
      ${emailButton('Place a Higher Bid', `${SITE_URL}/listing/${listingId}`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `You've been outbid on "${listingTitle}"`,
    html: emailTemplate(content, `Someone placed a higher bid of $${newHighBid.toLocaleString()}`),
  });
}

// Auction won notification
export async function sendAuctionWonEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  invoiceId: string;
  winningBid: number;
  totalAmount: number;
}) {
  const { to, userName, listingTitle, listingId, invoiceId, winningBid, totalAmount } = params;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;text-align:center;">Congratulations, You Won!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Your bid on <strong>${listingTitle}</strong> was the winning bid!
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:#f0fdf4;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Winning Bid</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${winningBid.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Buyer Premium (5%)</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${(winningBid * 0.05).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top:1px solid #d1fae5;"></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#18181b;">Total Due</td>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;text-align:right;color:#16a34a;">$${totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      Please complete your payment within 48 hours to secure your purchase.
    </p>
    <div style="text-align:center;">
      ${emailButton('Pay Now', `${SITE_URL}/dashboard/invoices/${invoiceId}`, '#16a34a')}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Congratulations! You won "${listingTitle}"`,
    html: emailTemplate(content, `You won with a bid of $${winningBid.toLocaleString()}`),
  });
}

// Auction ended (seller notification)
export async function sendAuctionEndedSellerEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  winningBid: number;
  buyerName: string;
  hasBids: boolean;
}) {
  const { to, userName, listingTitle, listingId, winningBid, buyerName, hasBids } = params;

  const content = hasBids ? `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">Your Auction Has Ended</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Great news! Your listing <strong>${listingTitle}</strong> has sold.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:#f0fdf4;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Winning Bid</p>
          <p style="margin:0;font-size:28px;font-weight:bold;color:#16a34a;">$${winningBid.toLocaleString()}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#71717a;">Won by ${buyerName}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      Once the buyer completes payment, you'll be notified to ship the item.
    </p>
    <div style="text-align:center;">
      ${emailButton('View Sale Details', `${SITE_URL}/dashboard/sales`)}
    </div>
  ` : `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">Your Auction Has Ended</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Unfortunately, your listing <strong>${listingTitle}</strong> ended without any bids.
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Consider relisting with a lower starting price or updating the description to attract more buyers.
    </p>
    <div style="text-align:center;">
      ${emailButton('Relist Item', `${SITE_URL}/dashboard/listings`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: hasBids
      ? `Your auction "${listingTitle}" has sold!`
      : `Your auction "${listingTitle}" ended without bids`,
    html: emailTemplate(content),
  });
}

// New offer received
export async function sendOfferReceivedEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  offerAmount: number;
  buyerName: string;
  expiresAt: Date;
}) {
  const { to, userName, listingTitle, listingId, offerAmount, buyerName, expiresAt } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">New Offer Received</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      You've received a new offer on <strong>${listingTitle}</strong>.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:#eff6ff;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Offer Amount</p>
          <p style="margin:0;font-size:28px;font-weight:bold;color:#2563eb;">$${offerAmount.toLocaleString()}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#71717a;">From ${buyerName}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#ef4444;">
      This offer expires: ${expiresAt.toLocaleString()}
    </p>
    <div style="text-align:center;">
      ${emailButton('Review Offer', `${SITE_URL}/dashboard/offers`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `New offer of $${offerAmount.toLocaleString()} on "${listingTitle}"`,
    html: emailTemplate(content, `${buyerName} offered $${offerAmount.toLocaleString()}`),
  });
}

// Offer accepted
export async function sendOfferAcceptedEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  invoiceId: string;
  offerAmount: number;
  totalAmount: number;
}) {
  const { to, userName, listingTitle, invoiceId, offerAmount, totalAmount } = params;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;text-align:center;">Your Offer Was Accepted!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Great news! The seller has accepted your offer on <strong>${listingTitle}</strong>.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:#f0fdf4;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Accepted Offer</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${offerAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Buyer Premium (5%)</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${(offerAmount * 0.05).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top:1px solid #d1fae5;"></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#18181b;">Total Due</td>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;text-align:right;color:#16a34a;">$${totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      Please complete your payment to finalize the purchase.
    </p>
    <div style="text-align:center;">
      ${emailButton('Pay Now', `${SITE_URL}/dashboard/invoices/${invoiceId}`, '#16a34a')}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your offer on "${listingTitle}" was accepted!`,
    html: emailTemplate(content, `Seller accepted your $${offerAmount.toLocaleString()} offer`),
  });
}

// Counter offer received
export async function sendCounterOfferEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  originalAmount: number;
  counterAmount: number;
  counterMessage?: string;
  expiresAt: Date;
  isBuyer: boolean;
}) {
  const { to, userName, listingTitle, listingId, originalAmount, counterAmount, counterMessage, expiresAt, isBuyer } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">Counter Offer Received</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      ${isBuyer ? 'The seller has' : 'The buyer has'} sent a counter offer on <strong>${listingTitle}</strong>.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px;background-color:#f4f4f5;border-radius:8px 8px 0 0;">
          <span style="font-size:14px;color:#71717a;">Your ${isBuyer ? 'Offer' : 'Counter'}</span><br>
          <span style="font-size:18px;color:#71717a;text-decoration:line-through;">$${originalAmount.toLocaleString()}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;background-color:#eff6ff;border-radius:0 0 8px 8px;">
          <span style="font-size:14px;color:#71717a;">Their Counter</span><br>
          <span style="font-size:24px;font-weight:bold;color:#2563eb;">$${counterAmount.toLocaleString()}</span>
        </td>
      </tr>
    </table>
    ${counterMessage ? `
    <div style="margin:0 0 24px;padding:12px;background-color:#f4f4f5;border-radius:8px;border-left:4px solid #2563eb;">
      <p style="margin:0;font-size:14px;color:#3f3f46;font-style:italic;">"${counterMessage}"</p>
    </div>
    ` : ''}
    <p style="margin:0 0 24px;font-size:14px;color:#ef4444;">
      This counter offer expires: ${expiresAt.toLocaleString()}
    </p>
    <div style="text-align:center;">
      ${emailButton('Respond to Counter', `${SITE_URL}${isBuyer ? '/dashboard/my-offers' : '/dashboard/offers'}`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Counter offer of $${counterAmount.toLocaleString()} on "${listingTitle}"`,
    html: emailTemplate(content, `New counter offer: $${counterAmount.toLocaleString()}`),
  });
}

// Offer declined
export async function sendOfferDeclinedEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  offerAmount: number;
}) {
  const { to, userName, listingTitle, listingId, offerAmount } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">Offer Declined</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Unfortunately, the seller has declined your offer of <strong>$${offerAmount.toLocaleString()}</strong> on <strong>${listingTitle}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      You can try submitting a new offer at a higher price, or browse other similar listings.
    </p>
    <div style="text-align:center;">
      ${emailButton('View Listing', `${SITE_URL}/listing/${listingId}`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your offer on "${listingTitle}" was declined`,
    html: emailTemplate(content),
  });
}

// Payment received (seller notification)
export async function sendPaymentReceivedSellerEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  saleAmount: number;
  payoutAmount: number;
  buyerName: string;
}) {
  const { to, userName, listingTitle, saleAmount, payoutAmount, buyerName } = params;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💰</span>
    </div>
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;text-align:center;">Payment Received!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      ${buyerName} has completed payment for <strong>${listingTitle}</strong>.
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:#f0fdf4;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Sale Price</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${saleAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:14px;color:#71717a;">Platform Fee (8%)</td>
              <td style="padding:8px 0;font-size:14px;text-align:right;color:#ef4444;">-$${(saleAmount * 0.08).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top:1px solid #d1fae5;"></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#18181b;">Your Payout</td>
              <td style="padding:8px 0;font-size:16px;font-weight:bold;text-align:right;color:#16a34a;">$${payoutAmount.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      Please ship the item promptly and update the tracking information.
    </p>
    <div style="text-align:center;">
      ${emailButton('View Sale', `${SITE_URL}/dashboard/sales`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Payment received for "${listingTitle}"`,
    html: emailTemplate(content, `You received $${payoutAmount.toLocaleString()}`),
  });
}

// New message notification
export async function sendNewMessageEmail(params: {
  to: string;
  userName: string;
  senderName: string;
  listingTitle: string;
  conversationId: string;
  messagePreview: string;
}) {
  const { to, userName, senderName, listingTitle, conversationId, messagePreview } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">New Message</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      <strong>${senderName}</strong> sent you a message about <strong>${listingTitle}</strong>.
    </p>
    <div style="margin:0 0 24px;padding:16px;background-color:#f4f4f5;border-radius:8px;border-left:4px solid #3b82f6;">
      <p style="margin:0;font-size:14px;color:#3f3f46;font-style:italic;">"${messagePreview}${messagePreview.length > 150 ? '...' : ''}"</p>
    </div>
    <div style="text-align:center;">
      ${emailButton('Reply', `${SITE_URL}/dashboard/messages/${conversationId}`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `New message from ${senderName} about "${listingTitle}"`,
    html: emailTemplate(content, messagePreview.substring(0, 100)),
  });
}

// Payment reminder
export async function sendPaymentReminderEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  invoiceId: string;
  totalAmount: number;
  dueDate: Date;
  isOverdue: boolean;
}) {
  const { to, userName, listingTitle, invoiceId, totalAmount, dueDate, isOverdue } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:${isOverdue ? '#dc2626' : '#18181b'};">
      ${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      ${isOverdue
        ? `Your payment for <strong>${listingTitle}</strong> is now overdue.`
        : `This is a reminder to complete your payment for <strong>${listingTitle}</strong>.`
      }
    </p>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;background-color:${isOverdue ? '#fef2f2' : '#f4f4f5'};border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Amount Due</p>
          <p style="margin:0;font-size:28px;font-weight:bold;color:${isOverdue ? '#dc2626' : '#18181b'};">$${totalAmount.toLocaleString()}</p>
          <p style="margin:8px 0 0;font-size:14px;color:${isOverdue ? '#dc2626' : '#71717a'};">
            ${isOverdue ? 'Was due: ' : 'Due by: '}${dueDate.toLocaleDateString()}
          </p>
        </td>
      </tr>
    </table>
    ${isOverdue ? `
    <p style="margin:0 0 24px;font-size:14px;color:#dc2626;">
      Please complete payment immediately to avoid cancellation of your purchase.
    </p>
    ` : ''}
    <div style="text-align:center;">
      ${emailButton('Pay Now', `${SITE_URL}/dashboard/invoices/${invoiceId}`, isOverdue ? '#dc2626' : '#16a34a')}
    </div>
  `;

  return sendEmail({
    to,
    subject: isOverdue
      ? `OVERDUE: Payment for "${listingTitle}"`
      : `Reminder: Complete payment for "${listingTitle}"`,
    html: emailTemplate(content),
  });
}

// ==================== MARKETING / DIGEST EMAILS ====================

interface DigestListing {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  currentPrice: number;
  bidCount?: number;
  endTime?: Date;
  listingType: 'auction' | 'fixed_price';
  location?: string;
}

// Helper to format time remaining
function formatTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Listing card component for digest emails
function listingCard(listing: DigestListing, featured: boolean = false): string {
  const isAuction = listing.listingType === 'auction';
  const timeLeft = listing.endTime ? formatTimeRemaining(listing.endTime) : null;
  const isEndingSoon = listing.endTime && (listing.endTime.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

  return `
    <td style="width:${featured ? '100%' : '50%'};padding:8px;vertical-align:top;">
      <a href="${SITE_URL}/listing/${listing.id}" style="text-decoration:none;display:block;">
        <table style="width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:0;">
              <!-- Image -->
              <div style="position:relative;">
                ${listing.imageUrl
                  ? `<img src="${listing.imageUrl}" alt="${listing.title}" style="width:100%;height:${featured ? '200px' : '140px'};object-fit:cover;display:block;" />`
                  : `<div style="width:100%;height:${featured ? '200px' : '140px'};background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;">
                      <span style="color:#94a3b8;font-size:14px;">No Image</span>
                    </div>`
                }
                ${isEndingSoon ? `
                  <div style="position:absolute;top:8px;left:8px;background-color:#dc2626;color:#ffffff;font-size:11px;font-weight:600;padding:4px 8px;border-radius:4px;">
                    ENDING SOON
                  </div>
                ` : ''}
                ${!isAuction ? `
                  <div style="position:absolute;top:8px;right:8px;background-color:#16a34a;color:#ffffff;font-size:11px;font-weight:600;padding:4px 8px;border-radius:4px;">
                    BUY NOW
                  </div>
                ` : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:${featured ? '16px' : '12px'};">
              <!-- Category -->
              <p style="margin:0 0 4px;font-size:12px;color:#2563eb;font-weight:500;">${listing.category}</p>
              <!-- Title -->
              <h3 style="margin:0 0 ${featured ? '12px' : '8px'};font-size:${featured ? '18px' : '14px'};font-weight:600;color:#18181b;line-height:1.3;">
                ${listing.title.length > (featured ? 60 : 45) ? listing.title.substring(0, featured ? 60 : 45) + '...' : listing.title}
              </h3>
              <!-- Price and Time -->
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0;">
                    <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;">${isAuction ? 'Current Bid' : 'Price'}</p>
                    <p style="margin:2px 0 0;font-size:${featured ? '24px' : '18px'};font-weight:700;color:${isAuction ? '#18181b' : '#16a34a'};">
                      $${listing.currentPrice.toLocaleString()}
                    </p>
                    ${isAuction && listing.bidCount !== undefined ? `
                      <p style="margin:2px 0 0;font-size:11px;color:#71717a;">${listing.bidCount} bid${listing.bidCount !== 1 ? 's' : ''}</p>
                    ` : ''}
                  </td>
                  ${timeLeft ? `
                    <td style="padding:0;text-align:right;">
                      <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;">Time Left</p>
                      <p style="margin:2px 0 0;font-size:${featured ? '18px' : '14px'};font-weight:600;color:${isEndingSoon ? '#dc2626' : '#3b82f6'};">
                        ${timeLeft}
                      </p>
                    </td>
                  ` : ''}
                </tr>
              </table>
              ${listing.location ? `
                <p style="margin:8px 0 0;font-size:11px;color:#71717a;">📍 ${listing.location}</p>
              ` : ''}
            </td>
          </tr>
        </table>
      </a>
    </td>
  `;
}

// Daily digest email
export async function sendDailyDigestEmail(params: {
  to: string;
  userName: string;
  featuredListings: DigestListing[];
  endingSoonListings: DigestListing[];
  newListings: DigestListing[];
  totalActiveListings: number;
  unsubscribeToken?: string;
}) {
  const { to, userName, featuredListings, endingSoonListings, newListings, totalActiveListings, unsubscribeToken } = params;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Build featured section (up to 2 items, displayed larger)
  const featuredSection = featuredListings.length > 0 ? `
    <!-- Featured Listings -->
    <tr>
      <td style="padding:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 16px;">
              <h2 style="margin:0;font-size:20px;font-weight:700;color:#18181b;">
                ⭐ Featured Equipment
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  ${featuredListings.slice(0, 2).map(l => listingCard(l, true)).join('')}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build ending soon section (up to 4 items)
  const endingSoonSection = endingSoonListings.length > 0 ? `
    <!-- Ending Soon -->
    <tr>
      <td style="padding:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 16px;">
              <h2 style="margin:0;font-size:20px;font-weight:700;color:#dc2626;">
                🔥 Ending Soon - Don't Miss Out!
              </h2>
              <p style="margin:4px 0 0;font-size:14px;color:#71717a;">These auctions are closing within 24 hours</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table style="width:100%;border-collapse:collapse;">
                ${endingSoonListings.slice(0, 4).reduce((rows, listing, i) => {
                  if (i % 2 === 0) rows.push([listing]);
                  else rows[rows.length - 1].push(listing);
                  return rows;
                }, [] as DigestListing[][]).map(row => `
                  <tr>
                    ${row.map(l => listingCard(l, false)).join('')}
                    ${row.length === 1 ? '<td style="width:50%;"></td>' : ''}
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 0;text-align:center;">
              ${emailButton('View All Ending Soon →', `${SITE_URL}/marketplace?sort=ending-soon`, '#dc2626')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build new listings section (up to 4 items)
  const newListingsSection = newListings.length > 0 ? `
    <!-- New Listings -->
    <tr>
      <td style="padding:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 16px;">
              <h2 style="margin:0;font-size:20px;font-weight:700;color:#18181b;">
                🆕 Just Listed
              </h2>
              <p style="margin:4px 0 0;font-size:14px;color:#71717a;">Fresh equipment added to the marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table style="width:100%;border-collapse:collapse;">
                ${newListings.slice(0, 4).reduce((rows, listing, i) => {
                  if (i % 2 === 0) rows.push([listing]);
                  else rows[rows.length - 1].push(listing);
                  return rows;
                }, [] as DigestListing[][]).map(row => `
                  <tr>
                    ${row.map(l => listingCard(l, false)).join('')}
                    ${row.length === 1 ? '<td style="width:50%;"></td>' : ''}
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 0;text-align:center;">
              ${emailButton('Browse All New Listings →', `${SITE_URL}/marketplace?sort=newest`, '#2563eb')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const content = `
    <!-- Header Banner -->
    <table style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:12px 12px 0 0;">
      <tr>
        <td style="padding:32px 24px;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;">
            Print<span style="color:#3b82f6;">Mail</span>Bids
          </h1>
          <p style="margin:0;font-size:14px;color:#94a3b8;">
            Your Daily Equipment Digest • ${today}
          </p>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <table style="width:100%;border-collapse:collapse;background-color:#f8fafc;padding:24px;">
      <tr>
        <td style="padding:24px;">
          <!-- Greeting -->
          <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
            Hi ${userName || 'there'} 👋
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
            Here's what's happening on PrintMailBids today. We have <strong>${totalActiveListings.toLocaleString()} active listings</strong> waiting for you!
          </p>

          ${featuredSection}
          ${endingSoonSection}
          ${newListingsSection}

          <!-- CTA Section -->
          <tr>
            <td style="padding:24px 0 0;">
              <table style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border-radius:12px;">
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <h3 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">
                      Have Equipment to Sell?
                    </h3>
                    <p style="margin:0 0 16px;font-size:14px;color:#bfdbfe;">
                      List your printing, mailing, or industrial equipment today. Only 5% buyer premium!
                    </p>
                    <a href="${SITE_URL}/sell" style="display:inline-block;padding:12px 32px;background-color:#ffffff;color:#2563eb;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                      Start Selling →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Links -->
          <tr>
            <td style="padding:24px 0 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 12px;font-size:14px;color:#71717a;">Quick Links</p>
                    <a href="${SITE_URL}/marketplace" style="display:inline-block;margin:0 8px;padding:8px 16px;background-color:#f4f4f5;color:#3f3f46;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">
                      Browse All
                    </a>
                    <a href="${SITE_URL}/marketplace?type=auction" style="display:inline-block;margin:0 8px;padding:8px 16px;background-color:#f4f4f5;color:#3f3f46;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">
                      Auctions
                    </a>
                    <a href="${SITE_URL}/marketplace?type=fixed" style="display:inline-block;margin:0 8px;padding:8px 16px;background-color:#f4f4f5;color:#3f3f46;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">
                      Buy Now
                    </a>
                    <a href="${SITE_URL}/dashboard/watchlist" style="display:inline-block;margin:0 8px;padding:8px 16px;background-color:#f4f4f5;color:#3f3f46;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">
                      My Watchlist
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </td>
      </tr>
    </table>
  `;

  // Custom template for digest (more elaborate than standard)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrintMailBids Daily Digest</title>
  <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${totalActiveListings} active listings • ${endingSoonListings.length} ending soon today
  </span>
</head>
<body style="margin:0;padding:0;background-color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#e5e7eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
                &copy; ${new Date().getFullYear()} PrintMailBids. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                <a href="${SITE_URL}/dashboard/settings" style="color:#a1a1aa;">Email Preferences</a>
                ${unsubscribeToken ? ` • <a href="${SITE_URL}/unsubscribe?token=${unsubscribeToken}" style="color:#a1a1aa;">Unsubscribe</a>` : ''}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d4d4d8;">
                You're receiving this because you're subscribed to PrintMailBids daily digest.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `🔥 ${endingSoonListings.length} Auctions Ending Today + ${newListings.length} New Listings`,
    html,
  });
}

// Weekly summary email (sent to sellers)
export async function sendWeeklySellerSummaryEmail(params: {
  to: string;
  userName: string;
  weekStats: {
    totalViews: number;
    totalBids: number;
    totalOffers: number;
    totalSales: number;
    totalRevenue: number;
  };
  topListings: Array<{
    id: string;
    title: string;
    views: number;
    bids: number;
  }>;
  activeListingsCount: number;
}) {
  const { to, userName, weekStats, topListings, activeListingsCount } = params;

  const content = `
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;">Your Weekly Seller Summary</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Here's how your listings performed this week:
    </p>

    <!-- Stats Grid -->
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;">
      <tr>
        <td style="width:50%;padding:8px;">
          <div style="background-color:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:32px;font-weight:700;color:#2563eb;">${weekStats.totalViews.toLocaleString()}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#64748b;">Total Views</p>
          </div>
        </td>
        <td style="width:50%;padding:8px;">
          <div style="background-color:#fef3c7;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:32px;font-weight:700;color:#d97706;">${weekStats.totalBids}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#64748b;">Bids Received</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="width:50%;padding:8px;">
          <div style="background-color:#fce7f3;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:32px;font-weight:700;color:#db2777;">${weekStats.totalOffers}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#64748b;">Offers Received</p>
          </div>
        </td>
        <td style="width:50%;padding:8px;">
          <div style="background-color:#d1fae5;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:32px;font-weight:700;color:#059669;">${weekStats.totalSales}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#64748b;">Sales Made</p>
          </div>
        </td>
      </tr>
    </table>

    ${weekStats.totalRevenue > 0 ? `
    <div style="margin:0 0 24px;padding:20px;background:linear-gradient(135deg,#059669,#047857);border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#a7f3d0;">Total Revenue This Week</p>
      <p style="margin:8px 0 0;font-size:36px;font-weight:700;color:#ffffff;">$${weekStats.totalRevenue.toLocaleString()}</p>
    </div>
    ` : ''}

    ${topListings.length > 0 ? `
    <h3 style="margin:0 0 16px;font-size:18px;color:#18181b;">📈 Your Top Performing Listings</h3>
    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f8fafc;">
        <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Listing</th>
        <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Views</th>
        <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Bids</th>
      </tr>
      ${topListings.map((listing, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:12px;">
            <a href="${SITE_URL}/listing/${listing.id}" style="color:#2563eb;text-decoration:none;font-weight:500;">
              ${listing.title.length > 40 ? listing.title.substring(0, 40) + '...' : listing.title}
            </a>
          </td>
          <td style="padding:12px;text-align:center;color:#18181b;">${listing.views}</td>
          <td style="padding:12px;text-align:center;color:#18181b;">${listing.bids}</td>
        </tr>
      `).join('')}
    </table>
    ` : ''}

    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      You have <strong>${activeListingsCount} active listings</strong> on the marketplace.
    </p>

    <div style="text-align:center;">
      ${emailButton('View Seller Dashboard', `${SITE_URL}/dashboard/sales`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `📊 Your Weekly Summary: ${weekStats.totalViews} views, ${weekStats.totalBids} bids`,
    html: emailTemplate(content, `${weekStats.totalViews} views and ${weekStats.totalBids} bids this week`),
  });
}

// Payment receipt email
export async function sendReceiptEmail(params: {
  to: string;
  userName: string;
  invoiceId: string;
  invoiceNumber: string;
  listingTitle: string;
  saleAmount: number;
  buyerPremiumPercent: number;
  buyerPremiumAmount: number;
  packagingAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAt: Date;
  paymentMethod: string;
  sellerName: string;
  sellerEmail: string;
}) {
  const {
    to,
    userName,
    invoiceId,
    invoiceNumber,
    listingTitle,
    saleAmount,
    buyerPremiumPercent,
    buyerPremiumAmount,
    packagingAmount = 0,
    shippingAmount = 0,
    taxAmount = 0,
    totalAmount,
    paidAt,
    paymentMethod,
    sellerName,
    sellerEmail,
  } = params;

  const formattedDate = paidAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🧾</span>
    </div>
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;text-align:center;">Payment Receipt</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Thank you for your payment! This is your receipt for the purchase of <strong>${listingTitle}</strong>.
    </p>

    <!-- Receipt Details -->
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Receipt Number</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;font-weight:600;">
            #${invoiceNumber || invoiceId.slice(0, 8).toUpperCase()}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Date Paid</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Payment Method</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">${paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
        </tr>
        <tr>
          <td colspan="2" style="border-top:1px solid #e5e7eb;"></td>
        </tr>
        <tr>
          <td style="padding:12px 0 8px;font-size:14px;color:#71717a;">Item: ${listingTitle}</td>
          <td style="padding:12px 0 8px;font-size:14px;text-align:right;color:#18181b;">$${saleAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Buyer Premium (${buyerPremiumPercent}%)</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${buyerPremiumAmount.toLocaleString()}</td>
        </tr>
        ${packagingAmount > 0 ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Packaging</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${packagingAmount.toLocaleString()}</td>
        </tr>
        ` : ''}
        ${shippingAmount > 0 ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Shipping</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${shippingAmount.toLocaleString()}</td>
        </tr>
        ` : ''}
        ${taxAmount > 0 ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#71717a;">Tax</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;color:#18181b;">$${taxAmount.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="border-top:2px solid #18181b;"></td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:18px;font-weight:700;color:#18181b;">Total Paid</td>
          <td style="padding:12px 0;font-size:18px;font-weight:700;text-align:right;color:#16a34a;">$${totalAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- Seller Info -->
    <div style="background-color:#eff6ff;border-radius:12px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;">Seller</p>
      <p style="margin:0;font-size:14px;color:#18181b;font-weight:500;">${sellerName}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#3b82f6;">${sellerEmail}</p>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
      The seller has been notified and will prepare your item for shipping. You can track the shipment status from your invoice page.
    </p>

    <div style="text-align:center;">
      ${emailButton('View Invoice', `${SITE_URL}/dashboard/invoices/${invoiceId}`)}
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
      Save this email for your records. If you have any questions, contact us at support@printmailbids.com
    </p>
  `;

  return sendEmail({
    to,
    subject: `Receipt for "${listingTitle}" - $${totalAmount.toLocaleString()}`,
    html: emailTemplate(content, `Payment receipt for $${totalAmount.toLocaleString()}`),
  });
}

// Welcome email for new users
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}) {
  const { to, userName } = params;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">👋</span>
    </div>
    <h2 style="margin:0 0 16px;font-size:24px;color:#18181b;text-align:center;">Welcome to PrintMailBids!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Hi ${userName || 'there'},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#3f3f46;line-height:1.6;">
      Thanks for joining PrintMailBids – the modern marketplace for printing, mailing, and industrial equipment. We're excited to have you!
    </p>

    <h3 style="margin:0 0 16px;font-size:18px;color:#18181b;">Here's what you can do:</h3>

    <table style="width:100%;margin:0 0 24px;border-collapse:collapse;">
      <tr>
        <td style="padding:16px;background-color:#eff6ff;border-radius:8px;margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#2563eb;">🔍 Browse Equipment</p>
          <p style="margin:0;font-size:14px;color:#3f3f46;">Explore hundreds of listings from trusted sellers across the country.</p>
        </td>
      </tr>
      <tr><td style="height:12px;"></td></tr>
      <tr>
        <td style="padding:16px;background-color:#fef3c7;border-radius:8px;margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#d97706;">🏷️ Place Bids</p>
          <p style="margin:0;font-size:14px;color:#3f3f46;">Bid on auctions with our fair 2-minute soft close – no sniping!</p>
        </td>
      </tr>
      <tr><td style="height:12px;"></td></tr>
      <tr>
        <td style="padding:16px;background-color:#d1fae5;border-radius:8px;margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#059669;">💰 Sell Your Equipment</p>
          <p style="margin:0;font-size:14px;color:#3f3f46;">List instantly, 24/7. Only 5% buyer premium – half what competitors charge.</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-bottom:24px;">
      ${emailButton('Start Browsing Equipment', `${SITE_URL}/marketplace`)}
    </div>

    <p style="margin:0;font-size:14px;color:#71717a;text-align:center;">
      Questions? Reply to this email or visit our <a href="${SITE_URL}/help" style="color:#2563eb;">Help Center</a>.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Welcome to PrintMailBids! 🎉`,
    html: emailTemplate(content, 'Start browsing printing and mailing equipment today'),
  });
}
