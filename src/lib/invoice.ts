import crypto from 'crypto';

/**
 * Generate a unique invoice number with format: INV-YYYYMMDD-XXXX
 * Uses cryptographically secure random bytes for the suffix
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `INV-${dateStr}-${random}`;
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^INV-\d{8}-[A-F0-9]{4}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Extract the date from an invoice number
 */
export function getInvoiceDate(invoiceNumber: string): Date | null {
  if (!isValidInvoiceNumber(invoiceNumber)) {
    return null;
  }
  const dateStr = invoiceNumber.slice(4, 12);
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  return new Date(year, month, day);
}
