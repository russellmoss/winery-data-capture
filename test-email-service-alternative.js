// Test with a different email service to isolate the Gmail issue
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing with Alternative Email Service...');

async function testWithEthereal() {
  try {
    // Use Ethereal Email (a testing service) to verify our email system works
    console.log('📧 Creating test account with Ethereal Email...');
    
    const testAccount = await nodemailer.createTestAccount();
    console.log('✅ Test account created:', testAccount.user);
    
    // Create transporter with test account
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified with Ethereal!');
    
    // Send test email
    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: '"Winery System Test" <test@ethereal.email>',
      to: testAccount.user, // Send to test account
      subject: 'Test Email from Winery System',
      text: 'This is a test email to verify the email system is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the email system is working.</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    
    return true;
    
  } catch (error) {
    console.error('❌ Ethereal test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Email System Components...\n');
  
  // Test 1: Verify our email system works with a different provider
  const etherealWorks = await testWithEthereal();
  
  if (etherealWorks) {
    console.log('\n✅ CONCLUSION: The email system code is working correctly!');
    console.log('❌ The issue is specifically with Gmail authentication.');
    console.log('\n🔍 Gmail-specific troubleshooting:');
    console.log('1. Double-check that 2FA is enabled on your Google account');
    console.log('2. Verify the app password was generated for the correct account');
    console.log('3. Check if there are any security alerts in your Google account');
    console.log('4. Try generating the app password from a different browser/device');
    console.log('5. Consider using OAuth2 instead of app passwords');
  } else {
    console.log('\n❌ The email system itself has issues.');
  }
}

runTests();
