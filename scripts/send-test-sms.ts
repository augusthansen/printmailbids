/**
 * Test script to verify Twilio SMS is working
 *
 * Usage: npx tsx scripts/send-test-sms.ts +1234567890
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

async function sendTestSMS() {
  const toNumber = process.argv[2];

  if (!toNumber) {
    console.error('Usage: npx tsx scripts/send-test-sms.ts +1234567890');
    console.error('Please provide a phone number to send the test SMS to.');
    process.exit(1);
  }

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Missing Twilio credentials. Make sure these env vars are set:');
    console.error('  TWILIO_ACCOUNT_SID');
    console.error('  TWILIO_AUTH_TOKEN');
    console.error('  TWILIO_PHONE_NUMBER');
    process.exit(1);
  }

  console.log('Twilio Configuration:');
  console.log(`  Account SID: ${accountSid.substring(0, 10)}...`);
  console.log(`  From Number: ${fromNumber}`);
  console.log(`  To Number: ${toNumber}`);
  console.log('');

  const client = twilio(accountSid, authToken);

  try {
    console.log('Sending test SMS...');
    const message = await client.messages.create({
      body: 'PrintMailBids: This is a test message. Your SMS notifications are working!',
      from: fromNumber,
      to: toNumber,
    });

    console.log('');
    console.log('SMS sent successfully!');
    console.log(`  Message SID: ${message.sid}`);
    console.log(`  Status: ${message.status}`);
  } catch (error) {
    console.error('Failed to send SMS:');
    console.error(error);
    process.exit(1);
  }
}

sendTestSMS();
