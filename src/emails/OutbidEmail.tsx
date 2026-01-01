import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading } from './components';

interface OutbidEmailProps {
  userName?: string;
  listingTitle: string;
  listingId: string;
  yourBid: number;
  newHighBid: number;
  endTime: Date;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function OutbidEmail({
  userName = 'there',
  listingTitle,
  listingId,
  yourBid,
  newHighBid,
  endTime,
}: OutbidEmailProps) {
  return (
    <EmailLayout preview={`Someone placed a higher bid of $${newHighBid.toLocaleString()}`}>
      <EmailHeading>You've Been Outbid!</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        Someone has placed a higher bid on <strong>{listingTitle}</strong>.
      </Text>

      {/* Bid Comparison */}
      <Section style={{ marginBottom: '24px' }}>
        <Section style={bidBox('#fef2f2', '8px 8px 0 0')}>
          <Text style={bidLabel}>Your Bid</Text>
          <Text style={{ ...bidValue, color: '#dc2626' }}>
            ${yourBid.toLocaleString()}
          </Text>
        </Section>
        <Section style={bidBox('#f4f4f5', '0 0 8px 8px')}>
          <Text style={bidLabel}>Current High Bid</Text>
          <Text style={{ ...bidValue, color: '#18181b' }}>
            ${newHighBid.toLocaleString()}
          </Text>
        </Section>
      </Section>

      <Text style={timeText}>
        Auction ends: {endTime.toLocaleString()}
      </Text>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <EmailButton href={`${SITE_URL}/listing/${listingId}`}>
          Place a Higher Bid
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

const bidBox = (bgColor: string, borderRadius: string) => ({
  backgroundColor: bgColor,
  borderRadius,
  padding: '12px',
});

const bidLabel = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 4px',
};

const bidValue = {
  fontSize: '20px',
  fontWeight: '700' as const,
  margin: '0',
};

const timeText = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
};

// Preview props for React Email dev server
OutbidEmail.PreviewProps = {
  userName: 'John',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  listingId: 'abc123',
  yourBid: 45000,
  newHighBid: 47500,
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
} as OutbidEmailProps;

export default OutbidEmail;
