import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading, PriceBox, HighlightBox } from './components';

interface PaymentReceivedEmailProps {
  userName?: string;
  listingTitle: string;
  saleAmount: number;
  payoutAmount: number;
  buyerName: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function PaymentReceivedEmail({
  userName = 'there',
  listingTitle,
  saleAmount,
  payoutAmount,
  buyerName,
}: PaymentReceivedEmailProps) {
  const platformFee = saleAmount * 0.08;

  return (
    <EmailLayout preview={`You received $${payoutAmount.toLocaleString()}`}>
      {/* Emoji Header */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text style={{ fontSize: '48px', margin: '0' }}>💰</Text>
      </Section>

      <EmailHeading align="center">Payment Received!</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        {buyerName} has completed payment for <strong>{listingTitle}</strong>.
      </Text>

      {/* Price Breakdown */}
      <PriceBox
        backgroundColor="#f0fdf4"
        rows={[
          { label: 'Sale Price', value: `$${saleAmount.toLocaleString()}` },
          { label: 'Platform Fee (8%)', value: `-$${platformFee.toLocaleString()}`, color: '#ef4444' },
          { label: '─────────────', value: '─────────' },
          { label: 'Your Payout', value: `$${payoutAmount.toLocaleString()}`, bold: true, color: '#16a34a' },
        ]}
      />

      <Text style={reminderText}>
        Please ship the item promptly and update the tracking information.
      </Text>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <EmailButton href={`${SITE_URL}/dashboard/sales`} color="blue">
          View Sale
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
PaymentReceivedEmail.PreviewProps = {
  userName: 'John',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  saleAmount: 47500,
  payoutAmount: 43700, // 47500 - 8% platform fee
  buyerName: 'Sarah Williams',
} as PaymentReceivedEmailProps;

export default PaymentReceivedEmail;
