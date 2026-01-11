import crypto from 'crypto';

/**
 * Generate a unique invoice number with format: PMB-YYXXXX
 * YY = 2-digit year, XXXX = 4 random hex characters
 * Example: PMB-26A3F2
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PMB-${year}${random}`;
}

/**
 * Validate invoice number format (supports both old and new formats)
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const newPattern = /^PMB-\d{2}[A-F0-9]{4}$/;
  const oldPattern = /^INV-\d{8}-[A-F0-9]{4}$/;
  return newPattern.test(invoiceNumber) || oldPattern.test(invoiceNumber);
}

/**
 * Extract the date from an invoice number (only works for old format)
 */
export function getInvoiceDate(invoiceNumber: string): Date | null {
  const oldPattern = /^INV-\d{8}-[A-F0-9]{4}$/;
  if (!oldPattern.test(invoiceNumber)) {
    return null;
  }
  const dateStr = invoiceNumber.slice(4, 12);
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  return new Date(year, month, day);
}
