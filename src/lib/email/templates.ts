import * as React from 'react';
import { sendEmail, SITE_URL } from './send';
import {
  WelcomeEmail,
  OutbidEmail,
  AuctionWonEmail,
  PaymentReceivedEmail,
  ReceiptEmail,
  OfferReceivedEmail,
  OfferAcceptedEmail,
} from '@/emails';

// ==================== WELCOME ====================

export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}) {
  const { to, userName } = params;

  return sendEmail({
    to,
    subject: 'Welcome to PrintMailBids! 🎉',
    react: React.createElement(WelcomeEmail, { userName }),
  });
}

// ==================== OUTBID ====================

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

  return sendEmail({
    to,
    subject: `You've been outbid on "${listingTitle}"`,
    react: React.createElement(OutbidEmail, {
      userName,
      listingTitle,
      listingId,
      yourBid,
      newHighBid,
      endTime,
    }),
  });
}

// ==================== AUCTION WON ====================

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

  return sendEmail({
    to,
    subject: `Congratulations! You won "${listingTitle}"`,
    react: React.createElement(AuctionWonEmail, {
      userName,
      listingTitle,
      listingId,
      invoiceId,
      winningBid,
      totalAmount,
    }),
  });
}

// ==================== PAYMENT RECEIVED (SELLER) ====================

export async function sendPaymentReceivedSellerEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  saleAmount: number;
  payoutAmount: number;
  buyerName: string;
}) {
  const { to, userName, listingTitle, saleAmount, payoutAmount, buyerName } = params;

  return sendEmail({
    to,
    subject: `Payment received for "${listingTitle}"`,
    react: React.createElement(PaymentReceivedEmail, {
      userName,
      listingTitle,
      saleAmount,
      payoutAmount,
      buyerName,
    }),
  });
}

// ==================== RECEIPT ====================

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
  const { to, userName, listingTitle, totalAmount, ...rest } = params;

  return sendEmail({
    to,
    subject: `Receipt for "${listingTitle}" - $${totalAmount.toLocaleString()}`,
    react: React.createElement(ReceiptEmail, {
      userName,
      listingTitle,
      totalAmount,
      ...rest,
    }),
  });
}

// ==================== OFFER RECEIVED ====================

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

  return sendEmail({
    to,
    subject: `New offer of $${offerAmount.toLocaleString()} on "${listingTitle}"`,
    react: React.createElement(OfferReceivedEmail, {
      userName,
      listingTitle,
      listingId,
      offerAmount,
      buyerName,
      expiresAt,
    }),
  });
}

// ==================== OFFER ACCEPTED ====================

export async function sendOfferAcceptedEmail(params: {
  to: string;
  userName: string;
  listingTitle: string;
  listingId: string;
  invoiceId: string;
  offerAmount: number;
  totalAmount: number;
}) {
  const { to, userName, listingTitle, listingId, invoiceId, offerAmount, totalAmount } = params;

  return sendEmail({
    to,
    subject: `Your offer on "${listingTitle}" was accepted!`,
    react: React.createElement(OfferAcceptedEmail, {
      userName,
      listingTitle,
      listingId,
      invoiceId,
      offerAmount,
      totalAmount,
    }),
  });
}
