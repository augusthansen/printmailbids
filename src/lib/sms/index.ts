import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS message
 */
export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  if (!client || !fromNumber) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle US numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Already has country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // Already in full format
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return formatted !== null && formatted.length >= 11;
}

// SMS Templates for different notification types
export const smsTemplates = {
  // Bid notifications
  outbid: (listingTitle: string, newBid: number) =>
    `PrintMailBids: You've been outbid on "${listingTitle}". New high bid: $${newBid.toLocaleString()}. Place a higher bid now!`,

  bidWon: (listingTitle: string, amount: number) =>
    `PrintMailBids: Congratulations! You won "${listingTitle}" for $${amount.toLocaleString()}. Check your email for payment instructions.`,

  newBid: (listingTitle: string, amount: number) =>
    `PrintMailBids: New bid of $${amount.toLocaleString()} on your listing "${listingTitle}".`,

  // Offer notifications
  newOffer: (listingTitle: string, amount: number) =>
    `PrintMailBids: You received an offer of $${amount.toLocaleString()} on "${listingTitle}". Log in to respond.`,

  offerAccepted: (listingTitle: string, amount: number) =>
    `PrintMailBids: Your offer of $${amount.toLocaleString()} on "${listingTitle}" was accepted! Check your email for next steps.`,

  offerDeclined: (listingTitle: string) =>
    `PrintMailBids: Your offer on "${listingTitle}" was declined. You can submit a new offer.`,

  counterOffer: (listingTitle: string, amount: number) =>
    `PrintMailBids: Counter-offer of $${amount.toLocaleString()} on "${listingTitle}". Log in to respond.`,

  // Auction notifications
  auctionEnding: (listingTitle: string, timeLeft: string) =>
    `PrintMailBids: "${listingTitle}" ends in ${timeLeft}! Don't miss your chance to bid.`,

  auctionEnded: (listingTitle: string) =>
    `PrintMailBids: The auction for "${listingTitle}" has ended. Check results in your dashboard.`,

  // Message notifications
  newMessage: (senderName: string) =>
    `PrintMailBids: New message from ${senderName}. Log in to view and respond.`,

  // Payment notifications
  paymentReceived: (listingTitle: string, amount: number) =>
    `PrintMailBids: Payment of $${amount.toLocaleString()} received for "${listingTitle}".`,

  paymentReminder: (listingTitle: string, daysLeft: number) =>
    `PrintMailBids: Payment reminder - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to pay for "${listingTitle}".`,
};

// Type for SMS template names
export type SMSTemplateType = keyof typeof smsTemplates;
