import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading } from './components';

interface WelcomeEmailProps {
  userName?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function WelcomeEmail({ userName = 'there' }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Welcome to PrintMailBids - Start browsing equipment today">
      {/* Emoji Header */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text style={{ fontSize: '48px', margin: '0' }}>👋</Text>
      </Section>

      <EmailHeading align="center">Welcome to PrintMailBids!</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        Thanks for joining PrintMailBids – the modern marketplace for printing, mailing, and
        industrial equipment. We're excited to have you!
      </Text>

      <Text style={subheading}>Here's what you can do:</Text>

      {/* Feature Cards */}
      <Section style={featureCard('#eff6ff')}>
        <Text style={featureTitle('#2563eb')}>🔍 Browse Equipment</Text>
        <Text style={featureDesc}>
          Explore hundreds of listings from trusted sellers across the country.
        </Text>
      </Section>

      <Section style={featureCard('#fef3c7')}>
        <Text style={featureTitle('#d97706')}>🏷️ Place Bids</Text>
        <Text style={featureDesc}>
          Bid on auctions with our fair 2-minute soft close – no sniping!
        </Text>
      </Section>

      <Section style={featureCard('#d1fae5')}>
        <Text style={featureTitle('#059669')}>💰 Sell Your Equipment</Text>
        <Text style={featureDesc}>
          List instantly, 24/7. Only 8% buyer premium – lower than competitors charge.
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
        <EmailButton href={`${SITE_URL}/marketplace`} color="blue">
          Start Browsing Equipment
        </EmailButton>
      </Section>

      <Text style={footerNote}>
        Questions? Reply to this email or visit our{' '}
        <a href={`${SITE_URL}/help`} style={{ color: '#2563eb' }}>
          Help Center
        </a>
        .
      </Text>
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

const subheading = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#18181b',
  margin: '0 0 16px',
};

const featureCard = (bgColor: string) => ({
  backgroundColor: bgColor,
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
});

const featureTitle = (color: string) => ({
  fontSize: '16px',
  fontWeight: '600' as const,
  color,
  margin: '0 0 4px',
});

const featureDesc = {
  fontSize: '14px',
  color: '#3f3f46',
  margin: '0',
};

const footerNote = {
  fontSize: '14px',
  color: '#71717a',
  textAlign: 'center' as const,
  margin: '0',
};

// Preview props for React Email dev server
WelcomeEmail.PreviewProps = {
  userName: 'John',
} as WelcomeEmailProps;

export default WelcomeEmail;
