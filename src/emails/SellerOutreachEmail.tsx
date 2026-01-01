import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';

interface SellerOutreachEmailProps {
  recipientName?: string;
  unsubscribeUrl: string;
}

export default function SellerOutreachEmail({
  recipientName,
  unsubscribeUrl,
}: SellerOutreachEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';

  return (
    <Html>
      <Head />
      <Preview>Tired of 10%+ fees? List your equipment for 8% on PrintMailBids</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logo}>
              Print<span style={{ color: '#2563eb' }}>Mail</span>Bids
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
              You've sold printing and mailing equipment online before — you know how it works.
              But what if there was a better way?
            </Text>

            <Heading style={h2}>
              Introducing PrintMailBids
            </Heading>

            <Text style={paragraph}>
              We built a modern marketplace specifically for print and mail equipment sellers like you.
              Here's what makes us different:
            </Text>

            {/* Comparison Box */}
            <Section style={comparisonBox}>
              <Row>
                <Column style={comparisonColumn}>
                  <Text style={comparisonHeader}>PrintMailBids</Text>
                  <Text style={comparisonItemGood}>✓ 8% buyer premium</Text>
                  <Text style={comparisonItemGood}>✓ Built-in messaging</Text>
                  <Text style={comparisonItemGood}>✓ Shipping & BOL tracking</Text>
                  <Text style={comparisonItemGood}>✓ Mobile-optimized</Text>
                </Column>
                <Column style={comparisonColumnOther}>
                  <Text style={comparisonHeaderOther}>Other Platforms</Text>
                  <Text style={comparisonItemBad}>✗ 10-15% buyer premium</Text>
                  <Text style={comparisonItemBad}>✗ Email back-and-forth</Text>
                  <Text style={comparisonItemBad}>✗ No tracking tools</Text>
                  <Text style={comparisonItemBad}>✗ Dated interface</Text>
                </Column>
              </Row>
            </Section>

            {/* Early Adopter Offer */}
            <Section style={offerBox}>
              <Heading style={offerHeading}>🎁 Early Seller Benefits</Heading>
              <Text style={offerText}>
                <strong>Lower fees than other platforms.</strong> Plus, early listings get
                featured placement on our homepage.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link href="https://printmailbids.com/switch" style={button}>
                Learn More & List Your Equipment
              </Link>
            </Section>

            <Text style={paragraph}>
              We're just launching, and we want to earn your business. If you have any questions,
              reply to this email or give us a call at <Link href="tel:+18885659483" style={link}>1-888-565-9483</Link>.
            </Text>

            <Text style={paragraph}>
              Best regards,
              <br />
              The PrintMailBids Team
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer - CAN-SPAM Compliant */}
          <Section style={footer}>
            <Text style={footerText}>
              PrintMailBids, LLC
              <br />
              3551 Blairstone Rd #105-66
              <br />
              Tallahassee, FL 32311
            </Text>
            <Text style={footerText}>
              You received this email because you've previously sold equipment online
              and we thought you might be interested in a better marketplace option.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from future emails
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '32px 48px 24px',
};

const logo = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#0f172a',
  textDecoration: 'none',
  margin: '0',
};

const content = {
  padding: '0 48px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#334155',
  margin: '16px 0',
};

const h2 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#0f172a',
  margin: '32px 0 16px',
};

const comparisonBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const comparisonColumn = {
  width: '50%',
  verticalAlign: 'top' as const,
  paddingRight: '12px',
};

const comparisonColumnOther = {
  width: '50%',
  verticalAlign: 'top' as const,
  paddingLeft: '12px',
  borderLeft: '1px solid #e2e8f0',
};

const comparisonHeader = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#2563eb',
  marginBottom: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const comparisonHeaderOther = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#64748b',
  marginBottom: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const comparisonItemGood = {
  fontSize: '14px',
  color: '#059669',
  margin: '8px 0',
  lineHeight: '20px',
};

const comparisonItemBad = {
  fontSize: '14px',
  color: '#94a3b8',
  margin: '8px 0',
  lineHeight: '20px',
};

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #10b981',
};

const offerHeading = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#065f46',
  margin: '0 0 8px',
};

const offerText = {
  fontSize: '15px',
  color: '#047857',
  margin: '0',
  lineHeight: '24px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footer = {
  padding: '0 48px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#94a3b8',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

// Preview props for React Email dev server
SellerOutreachEmail.PreviewProps = {
  recipientName: 'John',
  unsubscribeUrl: 'https://printmailbids.com/unsubscribe?token=abc123',
} as SellerOutreachEmailProps;
