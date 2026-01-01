import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading, PriceBox } from './components';

interface OfferAcceptedEmailProps {
  userName?: string;
  listingTitle: string;
  listingId: string;
  invoiceId: string;
  offerAmount: number;
  totalAmount: number;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function OfferAcceptedEmail({
  userName = 'there',
  listingTitle,
  listingId,
  invoiceId,
  offerAmount,
  totalAmount,
}: OfferAcceptedEmailProps) {
  const buyerPremium = offerAmount * 0.05;

  return (
    <EmailLayout preview={`Seller accepted your $${offerAmount.toLocaleString()} offer`}>
      {/* Emoji Header */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text style={{ fontSize: '48px', margin: '0' }}>🎉</Text>
      </Section>

      <EmailHeading align="center">Your Offer Was Accepted!</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        Great news! The seller has accepted your offer on <strong>{listingTitle}</strong>.
      </Text>

      {/* Price Breakdown */}
      <PriceBox
        backgroundColor="#f0fdf4"
        rows={[
          { label: 'Accepted Offer', value: `$${offerAmount.toLocaleString()}` },
          { label: 'Buyer Premium (5%)', value: `$${buyerPremium.toLocaleString()}` },
          { label: '─────────────', value: '─────────' },
          { label: 'Total Due', value: `$${totalAmount.toLocaleString()}`, bold: true, color: '#16a34a' },
        ]}
      />

      <Text style={reminderText}>
        Please complete your payment to finalize the purchase.
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
OfferAcceptedEmail.PreviewProps = {
  userName: 'Sarah',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  listingId: 'abc123',
  invoiceId: 'inv_abc123',
  offerAmount: 42000,
  totalAmount: 44100, // 42000 + 5% buyer premium
} as OfferAcceptedEmailProps;

export default OfferAcceptedEmail;
