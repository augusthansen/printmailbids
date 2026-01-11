/**
 * Unified Notification Service
 *
 * Creates database notifications and sends push/email/SMS based on user preferences.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification, isExpoPushToken } from '@/lib/push';
import { sendSMS, formatPhoneNumber } from '@/lib/sms';

export type NotificationType =
  | 'outbid' | 'auction_ending_soon' | 'auction_won' | 'auction_ended'
  | 'new_bid' | 'reserve_met' | 'auction_ending'
  | 'new_offer' | 'offer_accepted' | 'offer_declined' | 'offer_countered'
  | 'offer_expired' | 'offer_withdrawn' | 'offer_response_needed'
  | 'payment_reminder' | 'payment_received' | 'payment_confirmed'
  | 'item_shipped' | 'item_delivered' | 'shipping_quote_received' | 'shipping_quote_requested'
  | 'fees_added' | 'fees_approved' | 'fees_rejected'
  | 'buyer_message' | 'review_received' | 'payout_processed'
  | 'new_listing_saved_search' | 'price_drop';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  // Related entity IDs
  listingId?: string;
  invoiceId?: string;
  offerId?: string;
  bidId?: string;
  conversationId?: string;
  // Optional: skip certain channels
  skipPush?: boolean;
  skipEmail?: boolean;
  skipSms?: boolean;
  // Optional: custom SMS message (if different from body)
  smsMessage?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  pushSent?: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  error?: string;
}

interface UserPreferences {
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  expo_push_token: string | null;
  verified_phone: string | null;
  email: string;
}

/**
 * Send a notification to a user via all enabled channels
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const adminClient = createAdminClient();

  console.log('[Notification] Sending notification:', { type: payload.type, userId: payload.userId, title: payload.title });

  try {
    // Get user's notification preferences
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('notify_push, notify_email, notify_sms, expo_push_token, verified_phone, email')
      .eq('id', payload.userId)
      .single();

    if (profileError || !profile) {
      console.error('[Notification] Failed to get user profile:', profileError);
      return { success: false, error: 'User not found' };
    }

    const prefs = profile as UserPreferences;
    console.log('[Notification] User preferences:', {
      notify_push: prefs.notify_push,
      hasToken: !!prefs.expo_push_token,
      tokenPrefix: prefs.expo_push_token?.substring(0, 30),
    });

    // Track what was sent
    let pushSent = false;
    let emailSent = false;
    let smsSent = false;

    // Create database notification first
    const { data: notification, error: notifError } = await adminClient
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body || null,
        listing_id: payload.listingId || null,
        invoice_id: payload.invoiceId || null,
        offer_id: payload.offerId || null,
        bid_id: payload.bidId || null,
      })
      .select('id')
      .single();

    if (notifError) {
      console.error('Failed to create notification:', notifError);
      return { success: false, error: 'Failed to create notification' };
    }

    const notificationId = notification?.id;

    // Send push notification
    console.log('[Notification] Push check:', {
      skipPush: payload.skipPush,
      notify_push: prefs.notify_push,
      hasToken: !!prefs.expo_push_token,
      isValidToken: prefs.expo_push_token ? isExpoPushToken(prefs.expo_push_token) : false,
    });

    if (!payload.skipPush && prefs.notify_push && prefs.expo_push_token) {
      if (isExpoPushToken(prefs.expo_push_token)) {
        console.log('[Notification] Sending push to:', prefs.expo_push_token.substring(0, 30));
        const pushResult = await sendPushNotification(
          prefs.expo_push_token,
          payload.title,
          payload.body || '',
          {
            type: payload.type,
            notification_id: notificationId,
            listing_id: payload.listingId,
            invoice_id: payload.invoiceId,
            offer_id: payload.offerId,
            bid_id: payload.bidId,
            conversation_id: payload.conversationId,
          }
        );
        pushSent = pushResult.success;
        console.log('[Notification] Push result:', { pushSent, error: pushResult.error });

        // Update notification record
        if (pushSent) {
          await adminClient
            .from('notifications')
            .update({ sent_push: true })
            .eq('id', notificationId);
        }
      } else {
        console.log('[Notification] Invalid token format, skipping push');
      }
    } else {
      console.log('[Notification] Skipping push - conditions not met');
    }

    // Send SMS notification
    if (!payload.skipSms && prefs.notify_sms && prefs.verified_phone) {
      const formattedPhone = formatPhoneNumber(prefs.verified_phone);
      if (formattedPhone) {
        const smsBody = payload.smsMessage || `PrintMailBids: ${payload.title}`;
        const smsResult = await sendSMS(formattedPhone, smsBody);
        smsSent = smsResult.success;

        // Update notification record
        if (smsSent) {
          await adminClient
            .from('notifications')
            .update({ sent_sms: true })
            .eq('id', notificationId);
        }
      }
    }

    // Note: Email is typically sent separately with more detailed templates
    // This service just marks that it should be sent
    // The actual email sending is handled by the email service

    return {
      success: true,
      notificationId,
      pushSent,
      emailSent,
      smsSent,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a notification to multiple users
 */
export async function sendNotificationToMany(
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendNotification({ ...payload, userId });
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed };
}

/**
 * Helper to create notification with push for common scenarios
 */
export const notifications = {
  /**
   * Notify user they've been outbid
   */
  outbid: async (
    userId: string,
    listingId: string,
    listingTitle: string,
    newHighBid: number
  ) => {
    return sendNotification({
      userId,
      type: 'outbid',
      title: "You've been outbid",
      body: `Someone outbid you on "${listingTitle}". New high: $${newHighBid.toLocaleString()}`,
      listingId,
      smsMessage: `PrintMailBids: You've been outbid on "${listingTitle}". New high bid: $${newHighBid.toLocaleString()}. Place a higher bid now!`,
    });
  },

  /**
   * Notify seller of new bid
   */
  newBid: async (
    sellerId: string,
    listingId: string,
    listingTitle: string,
    bidAmount: number
  ) => {
    return sendNotification({
      userId: sellerId,
      type: 'new_bid',
      title: 'New bid on your listing',
      body: `Someone bid $${bidAmount.toLocaleString()} on "${listingTitle}"`,
      listingId,
      smsMessage: `PrintMailBids: New bid of $${bidAmount.toLocaleString()} on your listing "${listingTitle}".`,
    });
  },

  /**
   * Notify seller that reserve was met
   */
  reserveMet: async (
    sellerId: string,
    listingId: string,
    listingTitle: string,
    reservePrice: number
  ) => {
    return sendNotification({
      userId: sellerId,
      type: 'reserve_met',
      title: 'Reserve price met!',
      body: `The reserve price of $${reservePrice.toLocaleString()} has been met on "${listingTitle}". Your item will sell when the auction ends.`,
      listingId,
    });
  },

  /**
   * Notify buyer they won the auction
   */
  auctionWon: async (
    buyerId: string,
    listingId: string,
    listingTitle: string,
    winningBid: number,
    invoiceId: string
  ) => {
    return sendNotification({
      userId: buyerId,
      type: 'auction_won',
      title: 'Congratulations! You won!',
      body: `You won "${listingTitle}" for $${winningBid.toLocaleString()}`,
      listingId,
      invoiceId,
      smsMessage: `PrintMailBids: Congratulations! You won "${listingTitle}" for $${winningBid.toLocaleString()}. Check your email for payment instructions.`,
    });
  },

  /**
   * Notify seller their auction ended
   */
  auctionEnded: async (
    sellerId: string,
    listingId: string,
    listingTitle: string,
    sold: boolean,
    finalPrice?: number
  ) => {
    return sendNotification({
      userId: sellerId,
      type: 'auction_ended',
      title: sold ? 'Your auction sold!' : 'Auction ended',
      body: sold
        ? `"${listingTitle}" sold for $${finalPrice?.toLocaleString() || '0'}`
        : `The auction for "${listingTitle}" has ended with no sale`,
      listingId,
    });
  },

  /**
   * Notify seller of new offer
   */
  newOffer: async (
    sellerId: string,
    listingId: string,
    listingTitle: string,
    offerAmount: number,
    offerId: string
  ) => {
    return sendNotification({
      userId: sellerId,
      type: 'new_offer',
      title: 'New offer received',
      body: `You received a $${offerAmount.toLocaleString()} offer on "${listingTitle}"`,
      listingId,
      offerId,
      smsMessage: `PrintMailBids: You received an offer of $${offerAmount.toLocaleString()} on "${listingTitle}". Log in to respond.`,
    });
  },

  /**
   * Notify buyer their offer was accepted
   */
  offerAccepted: async (
    buyerId: string,
    listingId: string,
    listingTitle: string,
    offerAmount: number,
    offerId: string,
    invoiceId?: string
  ) => {
    return sendNotification({
      userId: buyerId,
      type: 'offer_accepted',
      title: 'Offer accepted!',
      body: `Your $${offerAmount.toLocaleString()} offer on "${listingTitle}" was accepted`,
      listingId,
      offerId,
      invoiceId,
      smsMessage: `PrintMailBids: Your offer of $${offerAmount.toLocaleString()} on "${listingTitle}" was accepted! Check your email for next steps.`,
    });
  },

  /**
   * Notify user their offer was declined
   */
  offerDeclined: async (
    userId: string,
    listingId: string,
    listingTitle: string,
    offerId: string
  ) => {
    return sendNotification({
      userId,
      type: 'offer_declined',
      title: 'Offer declined',
      body: `Your offer on "${listingTitle}" was declined`,
      listingId,
      offerId,
      smsMessage: `PrintMailBids: Your offer on "${listingTitle}" was declined. You can submit a new offer.`,
    });
  },

  /**
   * Notify user of counter-offer
   */
  offerCountered: async (
    userId: string,
    listingId: string,
    listingTitle: string,
    counterAmount: number,
    offerId: string
  ) => {
    return sendNotification({
      userId,
      type: 'offer_countered',
      title: 'Counter-offer received',
      body: `Counter-offer of $${counterAmount.toLocaleString()} on "${listingTitle}"`,
      listingId,
      offerId,
      smsMessage: `PrintMailBids: Counter-offer of $${counterAmount.toLocaleString()} on "${listingTitle}". Log in to respond.`,
    });
  },

  /**
   * Notify buyer of payment reminder
   */
  paymentReminder: async (
    buyerId: string,
    listingId: string,
    listingTitle: string,
    invoiceId: string,
    daysLeft: number
  ) => {
    return sendNotification({
      userId: buyerId,
      type: 'payment_reminder',
      title: 'Payment reminder',
      body: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to pay for "${listingTitle}"`,
      listingId,
      invoiceId,
      smsMessage: `PrintMailBids: Payment reminder - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to pay for "${listingTitle}".`,
    });
  },

  /**
   * Notify seller of payment received
   */
  paymentReceived: async (
    sellerId: string,
    listingId: string,
    listingTitle: string,
    invoiceId: string,
    amount: number
  ) => {
    return sendNotification({
      userId: sellerId,
      type: 'payment_received',
      title: 'Payment received',
      body: `$${amount.toLocaleString()} received for "${listingTitle}"`,
      listingId,
      invoiceId,
      smsMessage: `PrintMailBids: Payment of $${amount.toLocaleString()} received for "${listingTitle}".`,
    });
  },

  /**
   * Notify buyer that item shipped
   */
  itemShipped: async (
    buyerId: string,
    listingId: string,
    listingTitle: string,
    invoiceId: string
  ) => {
    return sendNotification({
      userId: buyerId,
      type: 'item_shipped',
      title: 'Item shipped!',
      body: `"${listingTitle}" has been shipped`,
      listingId,
      invoiceId,
    });
  },

  /**
   * Notify of new message
   */
  newMessage: async (
    userId: string,
    senderName: string,
    conversationId: string,
    listingId?: string
  ) => {
    return sendNotification({
      userId,
      type: 'buyer_message',
      title: 'New message',
      body: `${senderName} sent you a message`,
      listingId,
      conversationId,
      smsMessage: `PrintMailBids: New message from ${senderName}. Log in to view and respond.`,
    });
  },
};

export default notifications;
