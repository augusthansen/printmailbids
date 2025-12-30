/**
 * Test Twilio SMS sending
 * Run with: TWILIO_ACCOUNT_SID=xxx TWILIO_AUTH_TOKEN=xxx TWILIO_PHONE_NUMBER=xxx npx tsx scripts/test-twilio.ts +1XXXXXXXXXX
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Get the target phone number from command line args
const toNumber = process.argv[2];

if (!toNumber) {
  console.error('Usage: npx tsx scripts/test-twilio.ts +1XXXXXXXXXX');
  console.error('Provide the phone number to send to (must be verified in Twilio for trial accounts)');
  process.exit(1);
}

if (!accountSid || !authToken || !fromNumber) {
  console.error('Missing Twilio environment variables');
  console.error('TWILIO_ACCOUNT_SID:', accountSid ? 'set' : 'MISSING');
  console.error('TWILIO_AUTH_TOKEN:', authToken ? 'set' : 'MISSING');
  console.error('TWILIO_PHONE_NUMBER:', fromNumber ? fromNumber : 'MISSING');
  process.exit(1);
}

console.log('=== Twilio SMS Test ===\n');
console.log('Account SID:', accountSid);
console.log('From Number:', fromNumber);
console.log('To Number:', toNumber);
console.log('');

const client = twilio(accountSid, authToken);

async function testSMS() {
  try {
    console.log('Sending test SMS...');

    const message = await client.messages.create({
      body: 'PrintMailBids Test: Your verification code is 123456. This is a test message.',
      from: fromNumber,
      to: toNumber,
    });

    console.log('\n SUCCESS!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('\nCheck your phone for the message!');
  } catch (error: any) {
    console.error('\n FAILED!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.code === 21608) {
      console.error('\n The "from" number is not a valid Twilio phone number.');
      console.error('Make sure TWILIO_PHONE_NUMBER is a number you own in your Twilio account.');
    } else if (error.code === 21211) {
      console.error('\n Invalid "to" phone number format.');
      console.error('Use E.164 format: +1XXXXXXXXXX');
    } else if (error.code === 21614) {
      console.error('\n "To" number is not a valid mobile number.');
    } else if (error.code === 21408) {
      console.error('\n Permission denied. Check your Twilio account settings.');
    } else if (error.message?.includes('unverified')) {
      console.error('\n TRIAL ACCOUNT LIMITATION:');
      console.error('You can only send SMS to verified phone numbers.');
      console.error('Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.error('And verify the number:', toNumber);
    }
  }
}

testSMS();
