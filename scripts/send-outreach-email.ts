/**
 * Seller Outreach Email Script
 *
 * Usage:
 *   npx tsx scripts/send-outreach-email.ts --email "seller@example.com" --name "John"
 *   npx tsx scripts/send-outreach-email.ts --csv "./seller-list.csv"
 *   npx tsx scripts/send-outreach-email.ts --test  # Send test to yourself
 *
 * CSV Format:
 *   email,name
 *   seller1@example.com,John Smith
 *   seller2@example.com,Jane Doe
 *
 * CAN-SPAM COMPLIANCE CHECKLIST:
 * ✓ Don't use false or misleading header information
 * ✓ Don't use deceptive subject lines
 * ✓ Identify the message as an ad (implied by content)
 * ✓ Include physical postal address
 * ✓ Tell recipients how to opt out (unsubscribe link)
 * ✓ Honor opt-out requests promptly
 * ✓ Monitor what others are doing on your behalf
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import SellerOutreachEmail from '../src/emails/SellerOutreachEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting settings
const EMAILS_PER_BATCH = 10;      // Send 10 emails per batch
const DELAY_BETWEEN_EMAILS = 1000; // 1 second between emails
const DELAY_BETWEEN_BATCHES = 60000; // 1 minute between batches

// Generate unsubscribe token
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'printmailbids-unsubscribe-2024';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

// Generate unsubscribe URL
function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://printmailbids.com';
  return `${baseUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse CSV file
function parseCSV(filePath: string): Array<{ email: string; name?: string }> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.trim().split('\n');

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines
    .map(line => {
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      return {
        email: parts[0],
        name: parts[1] || undefined,
      };
    })
    .filter(row => row.email && row.email.includes('@'));
}

async function sendOutreachEmail(toEmail: string, recipientName?: string) {
  const unsubscribeUrl = getUnsubscribeUrl(toEmail);

  // Render the email HTML
  const html = await render(
    SellerOutreachEmail({
      recipientName,
      unsubscribeUrl,
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PrintMailBids <hello@printmailbids.com>',
      to: toEmail,
      subject: 'Tired of 10%+ fees? List your equipment for 8% on PrintMailBids',
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`✓ Email sent to ${toEmail}:`, result.data?.id);
    return { success: true, result };
  } catch (error) {
    console.error(`✗ Failed to send to ${toEmail}:`, error);
    return { success: false, error };
  }
}

async function sendBulkEmails(recipients: Array<{ email: string; name?: string }>, dryRun: boolean = false) {
  console.log(`\n📧 Preparing to send ${recipients.length} emails...\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN - No emails will be sent\n');
    recipients.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.email}${r.name ? ` (${r.name})` : ''}`);
    });
    console.log(`\n✓ Dry run complete. ${recipients.length} emails would be sent.`);
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const failed: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const batchNumber = Math.floor(i / EMAILS_PER_BATCH) + 1;
    const positionInBatch = (i % EMAILS_PER_BATCH) + 1;

    console.log(`[Batch ${batchNumber}, ${positionInBatch}/${EMAILS_PER_BATCH}] Sending to ${recipient.email}...`);

    const result = await sendOutreachEmail(recipient.email, recipient.name);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
      failed.push(recipient.email);
    }

    // Rate limiting
    if (i < recipients.length - 1) {
      // Delay between emails
      await sleep(DELAY_BETWEEN_EMAILS);

      // Longer delay between batches
      if ((i + 1) % EMAILS_PER_BATCH === 0) {
        console.log(`\n⏳ Batch ${batchNumber} complete. Waiting 1 minute before next batch...\n`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 RESULTS`);
  console.log(`========================================`);
  console.log(`✓ Sent successfully: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);

  if (failed.length > 0) {
    console.log(`\nFailed emails:`);
    failed.forEach(email => console.log(`  - ${email}`));
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Seller Outreach Email Script

Usage:
  npx tsx scripts/send-outreach-email.ts --email "seller@example.com" --name "John"
  npx tsx scripts/send-outreach-email.ts --csv "./seller-list.csv"
  npx tsx scripts/send-outreach-email.ts --csv "./seller-list.csv" --dry-run
  npx tsx scripts/send-outreach-email.ts --test

Options:
  --email      Recipient email address (for single email)
  --name       Recipient name (optional, for personalization)
  --csv        Path to CSV file with columns: email,name
  --dry-run    Preview what would be sent without actually sending
  --test       Send a test email to yourself

CSV Format:
  email,name
  seller1@example.com,John Smith
  seller2@example.com,Jane Doe

Environment Variables Required:
  RESEND_API_KEY              Your Resend API key
  FROM_EMAIL                  Sender email (default: PrintMailBids <hello@printmailbids.com>)
  NEXT_PUBLIC_APP_URL         Base URL for unsubscribe links (default: https://printmailbids.com)
  UNSUBSCRIBE_SECRET          Secret for generating unsubscribe tokens

Rate Limiting:
  - ${EMAILS_PER_BATCH} emails per batch
  - ${DELAY_BETWEEN_EMAILS / 1000} second delay between emails
  - ${DELAY_BETWEEN_BATCHES / 1000} second delay between batches
    `);
    return;
  }

  // Check for API key
  if (!process.env.RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY environment variable is required');
    process.exit(1);
  }

  if (args.includes('--test')) {
    const testEmail = process.env.FROM_EMAIL?.match(/<(.+)>/)?.[1] || 'august@megaboxsupply.com';
    console.log(`Sending test email to ${testEmail}...`);
    await sendOutreachEmail(testEmail, 'Test User');
    return;
  }

  const csvIndex = args.indexOf('--csv');
  if (csvIndex !== -1 && args[csvIndex + 1]) {
    const csvPath = args[csvIndex + 1];
    const dryRun = args.includes('--dry-run');

    try {
      const recipients = parseCSV(csvPath);
      console.log(`📂 Loaded ${recipients.length} recipients from ${csvPath}`);
      await sendBulkEmails(recipients, dryRun);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
    return;
  }

  const emailIndex = args.indexOf('--email');
  const nameIndex = args.indexOf('--name');

  if (emailIndex === -1 || !args[emailIndex + 1]) {
    console.error('Error: --email or --csv is required');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  const email = args[emailIndex + 1];
  const name = nameIndex !== -1 ? args[nameIndex + 1] : undefined;

  console.log(`Sending outreach email to ${email}${name ? ` (${name})` : ''}...`);
  await sendOutreachEmail(email, name);
}

main().catch(console.error);
