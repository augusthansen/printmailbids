import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading, HighlightBox } from './components';

interface OfferReceivedEmailProps {
  userName?: string;
  listingTitle: string;
  listingId: string;
  offerAmount: number;
  buyerName: string;
  expiresAt: Date;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function OfferReceivedEmail({
  userName = 'there',
  listingTitle,
  listingId,
  offerAmount,
  buyerName,
  expiresAt,
}: OfferReceivedEmailProps) {
  return (
    <EmailLayout preview={`${buyerName} offered $${offerAmount.toLocaleString()}`}>
      <EmailHeading>New Offer Received</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        You've received a new offer on <strong>{listingTitle}</strong>.
      </Text>

      <HighlightBox
        label="Offer Amount"
        value={`$${offerAmount.toLocaleString()}`}
        subtext={`From ${buyerName}`}
        backgroundColor="#eff6ff"
        valueColor="#2563eb"
      />

      <Text style={expiryText}>
        This offer expires: {expiresAt.toLocaleString()}
      </Text>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <EmailButton href={`${SITE_URL}/dashboard/offers`} color="blue">
          Review Offer
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

const expiryText = {
  fontSize: '14px',
  color: '#ef4444',
  margin: '0',
};

// Preview props for React Email dev server
OfferReceivedEmail.PreviewProps = {
  userName: 'John',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  listingId: 'abc123',
  offerAmount: 42000,
  buyerName: 'Sarah Williams',
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
} as OfferReceivedEmailProps;

export default OfferReceivedEmail;
