import { Section, Text, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading, PriceBox } from './components';

interface AuctionWonEmailProps {
  userName?: string;
  listingTitle: string;
  listingId: string;
  invoiceId: string;
  winningBid: number;
  totalAmount: number;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function AuctionWonEmail({
  userName = 'there',
  listingTitle,
  listingId,
  invoiceId,
  winningBid,
  totalAmount,
}: AuctionWonEmailProps) {
  const buyerPremium = winningBid * 0.05;

  return (
    <EmailLayout preview={`You won with a bid of $${winningBid.toLocaleString()}`}>
      {/* Emoji Header */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text style={{ fontSize: '48px', margin: '0' }}>🎉</Text>
      </Section>

      <EmailHeading align="center">Congratulations, You Won!</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        Your bid on <strong>{listingTitle}</strong> was the winning bid!
      </Text>

      {/* Price Breakdown */}
      <PriceBox
        backgroundColor="#f0fdf4"
        rows={[
          { label: 'Winning Bid', value: `$${winningBid.toLocaleString()}` },
          { label: 'Buyer Premium (5%)', value: `$${buyerPremium.toLocaleString()}` },
          { label: '─────────────', value: '─────────' },
          { label: 'Total Due', value: `$${totalAmount.toLocaleString()}`, bold: true, color: '#16a34a' },
        ]}
      />

      <Text style={reminderText}>
        Please complete your payment within 48 hours to secure your purchase.
      </Text>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <EmailButton href={`${SITE_URL}/dashboard/invoices/${invoiceId}`} color="green">
          Pay Now
        </EmailButton>
      </Section>
    </EmailLayout>
  );
}

// Styles
const paragraph = {
  fontSize: '16px',
  color: '#3f3f46',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const reminderText = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
};

// Preview props for React Email dev server
AuctionWonEmail.PreviewProps = {
  userName: 'John',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  listingId: 'abc123',
  invoiceId: 'inv_abc123',
  winningBid: 47500,
  totalAmount: 49875, // 47500 + 5% buyer premium
} as AuctionWonEmailProps;

export default AuctionWonEmail;
