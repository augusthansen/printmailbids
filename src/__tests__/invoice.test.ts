import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateInvoiceNumber, isValidInvoiceNumber, getInvoiceDate } from '@/lib/invoice';

describe('generateInvoiceNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates invoice number with correct format', () => {
    vi.setSystemTime(new Date('2026-01-15'));
    const invoice = generateInvoiceNumber();

    expect(invoice).toMatch(/^INV-20260115-[A-F0-9]{4}$/);
  });

  it('includes correct date in invoice number', () => {
    vi.setSystemTime(new Date('2026-03-22'));
    const invoice = generateInvoiceNumber();

    expect(invoice.startsWith('INV-20260322-')).toBe(true);
  });

  it('generates unique invoice numbers', () => {
    vi.setSystemTime(new Date('2026-01-01'));
    const invoices = new Set<string>();

    // Generate 20 invoices and verify high uniqueness rate
    // With 4 hex chars (65,536 possibilities), collisions are rare but possible
    for (let i = 0; i < 20; i++) {
      invoices.add(generateInvoiceNumber());
    }

    // Allow for at most 1 collision in 20 generations
    expect(invoices.size).toBeGreaterThanOrEqual(19);
  });

  it('random suffix is 4 characters', () => {
    vi.setSystemTime(new Date('2026-01-01'));
    const invoice = generateInvoiceNumber();
    const suffix = invoice.split('-')[2];

    expect(suffix.length).toBe(4);
  });

  it('random suffix contains only valid hex characters', () => {
    vi.setSystemTime(new Date('2026-01-01'));

    for (let i = 0; i < 50; i++) {
      const invoice = generateInvoiceNumber();
      const suffix = invoice.split('-')[2];
      expect(suffix).toMatch(/^[A-F0-9]{4}$/);
    }
  });
});

describe('isValidInvoiceNumber', () => {
  it('validates correct invoice numbers', () => {
    expect(isValidInvoiceNumber('INV-20260115-A1B2')).toBe(true);
    expect(isValidInvoiceNumber('INV-20231231-FFFF')).toBe(true);
    expect(isValidInvoiceNumber('INV-20200101-0000')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidInvoiceNumber('INV-2026011-A1B2')).toBe(false); // Short date
    expect(isValidInvoiceNumber('INV-202601151-A1B2')).toBe(false); // Long date
    expect(isValidInvoiceNumber('INV-20260115-A1B')).toBe(false); // Short suffix
    expect(isValidInvoiceNumber('INV-20260115-A1B2C')).toBe(false); // Long suffix
    expect(isValidInvoiceNumber('inv-20260115-A1B2')).toBe(false); // Lowercase prefix
    expect(isValidInvoiceNumber('INV-20260115-a1b2')).toBe(false); // Lowercase suffix
    expect(isValidInvoiceNumber('INV-20260115-GHIJ')).toBe(false); // Invalid hex
    expect(isValidInvoiceNumber('')).toBe(false);
    expect(isValidInvoiceNumber('random-string')).toBe(false);
  });
});

describe('getInvoiceDate', () => {
  it('extracts correct date from valid invoice number', () => {
    const date = getInvoiceDate('INV-20260115-A1B2');

    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(0); // January (0-indexed)
    expect(date!.getDate()).toBe(15);
  });

  it('handles different dates correctly', () => {
    const date1 = getInvoiceDate('INV-20231225-ABCD');
    expect(date1!.getFullYear()).toBe(2023);
    expect(date1!.getMonth()).toBe(11); // December
    expect(date1!.getDate()).toBe(25);

    const date2 = getInvoiceDate('INV-20200229-1234');
    expect(date2!.getFullYear()).toBe(2020);
    expect(date2!.getMonth()).toBe(1); // February
    expect(date2!.getDate()).toBe(29);
  });

  it('returns null for invalid invoice numbers', () => {
    expect(getInvoiceDate('invalid')).toBeNull();
    expect(getInvoiceDate('')).toBeNull();
    expect(getInvoiceDate('INV-invalid-date')).toBeNull();
  });
});
