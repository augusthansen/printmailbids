/**
 * Expo Push Notification Service
 *
 * Sends push notifications to mobile app users via Expo's push notification service.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string | string[]; // Expo push token(s)
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number; // Time to live in seconds
}

export interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
    expoPushToken?: string;
  };
}

export interface PushResult {
  success: boolean;
  tickets?: ExpoPushTicket[];
  error?: string;
}

/**
 * Check if a string is a valid Expo push token
 */
export function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

/**
 * Send a single push notification
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushResult> {
  console.log('[Push] Sending notification:', { token: token?.substring(0, 30) + '...', title, body });

  if (!isExpoPushToken(token)) {
    console.log('[Push] Invalid token format:', token);
    return { success: false, error: 'Invalid Expo push token' };
  }

  const result = await sendPushNotifications([{
    to: token,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
  }]);

  console.log('[Push] Result:', result);
  return result;
}

/**
 * Send multiple push notifications (batch)
 *
 * Expo recommends batching notifications - up to 100 per request
 */
export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<PushResult> {
  if (messages.length === 0) {
    return { success: true, tickets: [] };
  }

  // Filter out invalid tokens
  const validMessages = messages.filter((msg) => {
    const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
    return tokens.every(isExpoPushToken);
  });

  if (validMessages.length === 0) {
    return { success: false, error: 'No valid Expo push tokens' };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMessages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo push API error:', response.status, errorText);
      return {
        success: false,
        error: `Expo push API error: ${response.status}`,
      };
    }

    const result = await response.json();
    const tickets: ExpoPushTicket[] = result.data || [];

    // Log any errors
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(
          `Push notification error for message ${index}:`,
          ticket.message,
          ticket.details
        );
      }
    });

    const hasErrors = tickets.some((t) => t.status === 'error');

    return {
      success: !hasErrors,
      tickets,
      error: hasErrors ? 'Some notifications failed to send' : undefined,
    };
  } catch (error) {
    console.error('Failed to send push notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send push notifications',
    };
  }
}

/**
 * Push notification templates for different notification types
 */
export const pushTemplates = {
  // Bid notifications
  outbid: (listingTitle: string, newBid: number) => ({
    title: "You've been outbid!",
    body: `Someone outbid you on "${listingTitle}". New high: $${newBid.toLocaleString()}`,
  }),

  bidWon: (listingTitle: string, amount: number) => ({
    title: 'Congratulations! You won!',
    body: `You won "${listingTitle}" for $${amount.toLocaleString()}`,
  }),

  newBid: (listingTitle: string, amount: number) => ({
    title: 'New bid on your listing',
    body: `Someone bid $${amount.toLocaleString()} on "${listingTitle}"`,
  }),

  reserveMet: (listingTitle: string) => ({
    title: 'Reserve price met!',
    body: `The reserve has been met on "${listingTitle}"`,
  }),

  auctionEnding: (listingTitle: string, timeLeft: string) => ({
    title: 'Auction ending soon!',
    body: `"${listingTitle}" ends in ${timeLeft}`,
  }),

  auctionEnded: (listingTitle: string, sold: boolean) => ({
    title: sold ? 'Your auction sold!' : 'Auction ended',
    body: sold
      ? `"${listingTitle}" has sold`
      : `The auction for "${listingTitle}" has ended`,
  }),

  // Offer notifications
  newOffer: (listingTitle: string, amount: number) => ({
    title: 'New offer received',
    body: `You received a $${amount.toLocaleString()} offer on "${listingTitle}"`,
  }),

  offerAccepted: (listingTitle: string, amount: number) => ({
    title: 'Offer accepted!',
    body: `Your $${amount.toLocaleString()} offer on "${listingTitle}" was accepted`,
  }),

  offerDeclined: (listingTitle: string) => ({
    title: 'Offer declined',
    body: `Your offer on "${listingTitle}" was declined`,
  }),

  offerCountered: (listingTitle: string, amount: number) => ({
    title: 'Counter-offer received',
    body: `Counter-offer of $${amount.toLocaleString()} on "${listingTitle}"`,
  }),

  offerExpired: (listingTitle: string) => ({
    title: 'Offer expired',
    body: `Your offer on "${listingTitle}" has expired`,
  }),

  // Payment notifications
  paymentReceived: (listingTitle: string, amount: number) => ({
    title: 'Payment received',
    body: `$${amount.toLocaleString()} received for "${listingTitle}"`,
  }),

  paymentReminder: (listingTitle: string, daysLeft: number) => ({
    title: 'Payment reminder',
    body: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to pay for "${listingTitle}"`,
  }),

  // Shipping notifications
  itemShipped: (listingTitle: string) => ({
    title: 'Item shipped!',
    body: `"${listingTitle}" has been shipped`,
  }),

  itemDelivered: (listingTitle: string) => ({
    title: 'Item delivered',
    body: `"${listingTitle}" has been delivered`,
  }),

  // Message notification
  newMessage: (senderName: string) => ({
    title: 'New message',
    body: `${senderName} sent you a message`,
  }),

  // Payout notification
  payoutProcessed: (amount: number) => ({
    title: 'Payout processed',
    body: `$${amount.toLocaleString()} has been sent to your account`,
  }),
};

export type PushTemplateType = keyof typeof pushTemplates;
