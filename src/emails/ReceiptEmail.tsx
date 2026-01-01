import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, EmailButton, EmailHeading, PriceBox } from './components';

interface ReceiptEmailProps {
  userName?: string;
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
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://printmailbids.com';

export function ReceiptEmail({
  userName = 'there',
  invoiceId,
  invoiceNumber,
  listingTitle,
  saleAmount,
  buyerPremiumPercent,
  buyerPremiumAmount,
  packagingAmount = 0,
  shippingAmount = 0,
  taxAmount = 0,
  totalAmount,
  paidAt,
  paymentMethod,
  sellerName,
  sellerEmail,
}: ReceiptEmailProps) {
  const formattedDate = paidAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build price rows
  const priceRows: Array<{ label: string; value: string; bold?: boolean; color?: string }> = [
    { label: `Item: ${listingTitle.slice(0, 30)}${listingTitle.length > 30 ? '...' : ''}`, value: `$${saleAmount.toLocaleString()}` },
    { label: `Buyer Premium (${buyerPremiumPercent}%)`, value: `$${buyerPremiumAmount.toLocaleString()}` },
  ];

  if (packagingAmount > 0) {
    priceRows.push({ label: 'Packaging', value: `$${packagingAmount.toLocaleString()}` });
  }
  if (shippingAmount > 0) {
    priceRows.push({ label: 'Shipping', value: `$${shippingAmount.toLocaleString()}` });
  }
  if (taxAmount > 0) {
    priceRows.push({ label: 'Tax', value: `$${taxAmount.toLocaleString()}` });
  }

  priceRows.push({ label: '═══════════════', value: '═════════' });
  priceRows.push({ label: 'Total Paid', value: `$${totalAmount.toLocaleString()}`, bold: true, color: '#16a34a' });

  return (
    <EmailLayout preview={`Payment receipt for $${totalAmount.toLocaleString()}`}>
      {/* Emoji Header */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text style={{ fontSize: '48px', margin: '0' }}>🧾</Text>
      </Section>

      <EmailHeading align="center">Payment Receipt</EmailHeading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>
        Thank you for your payment! This is your receipt for the purchase of{' '}
        <strong>{listingTitle}</strong>.
      </Text>

      {/* Receipt Details Header */}
      <Section style={receiptHeader}>
        <Text style={receiptRow}>
          <span style={receiptLabel}>Receipt Number</span>
          <span style={receiptValue}>#{invoiceNumber || invoiceId.slice(0, 8).toUpperCase()}</span>
        </Text>
        <Text style={receiptRow}>
          <span style={receiptLabel}>Date Paid</span>
          <span style={receiptValue}>{formattedDate}</span>
        </Text>
        <Text style={receiptRow}>
          <span style={receiptLabel}>Payment Method</span>
          <span style={receiptValue}>
            {paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </Text>
      </Section>

      {/* Price Breakdown */}
      <PriceBox backgroundColor="#f8fafc" rows={priceRows} />

      {/* Seller Info */}
      <Section style={sellerBox}>
        <Text style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px', textTransform: 'uppercase' }}>
          Seller
        </Text>
        <Text style={{ fontSize: '14px', color: '#18181b', fontWeight: '500', margin: '0' }}>
          {sellerName}
        </Text>
        <Link href={`mailto:${sellerEmail}`} style={{ fontSize: '14px', color: '#3b82f6', margin: '4px 0 0', display: 'block' }}>
          {sellerEmail}
        </Link>
      </Section>

      <Text style={infoText}>
        The seller has been notified and will prepare your item for shipping. You can track the
        shipment status from your invoice page.
      </Text>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
        <EmailButton href={`${SITE_URL}/dashboard/invoices/${invoiceId}`} color="blue">
          View Invoice
        </EmailButton>
      </Section>

      <Text style={footerNote}>
        Save this email for your records. If you have any questions, contact us at
        support@printmailbids.com
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

const receiptHeader = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
};

const receiptRow = {
  fontSize: '14px',
  margin: '0 0 8px',
  display: 'flex',
  justifyContent: 'space-between',
};

const receiptLabel = {
  color: '#71717a',
};

const receiptValue = {
  color: '#18181b',
  fontWeight: '600',
  float: 'right' as const,
};

const sellerBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const infoText = {
  fontSize: '14px',
  color: '#71717a',
  lineHeight: '1.6',
  margin: '0',
};

const footerNote = {
  fontSize: '12px',
  color: '#a1a1aa',
  textAlign: 'center' as const,
  margin: '0',
};

// Preview props for React Email dev server
ReceiptEmail.PreviewProps = {
  userName: 'John',
  invoiceId: 'inv_abc123',
  invoiceNumber: 'INV-2024-001',
  listingTitle: '2019 Heidelberg Speedmaster XL 106',
  saleAmount: 47500,
  buyerPremiumPercent: 8,
  buyerPremiumAmount: 3800,
  packagingAmount: 500,
  shippingAmount: 1200,
  totalAmount: 53000,
  paidAt: new Date(),
  paymentMethod: 'credit_card',
  sellerName: 'ABC Printing Supply',
  sellerEmail: 'sales@abcprinting.com',
} as ReceiptEmailProps;

export default ReceiptEmail;
