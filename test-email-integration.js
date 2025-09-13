// Test script for email integration
// Run with: node test-email-integration.js

const API_BASE = 'http://localhost:3000/api'

async function testEmailIntegration() {
  console.log('🧪 Testing Email Integration...\n')

  // Test 1: Check if the send endpoint is accessible
  console.log('1️⃣ Testing /api/reports/send endpoint...')
  try {
    const response = await fetch(`${API_BASE}/reports/send`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Send endpoint is accessible!')
      console.log(`📖 Description: ${data.description}`)
      console.log(`🔐 Authentication: ${data.authentication}`)
      console.log(`📊 Available report types: ${Object.keys(data.examples).join(', ')}`)
    } else {
      console.log('❌ Send endpoint failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Send endpoint test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Test the email service configuration
  console.log('2️⃣ Testing email service configuration...')
  try {
    const response = await fetch(`${API_BASE}/email/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        message: 'This is a test email from the Milea Estate Vineyard system.'
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Email service is configured!')
      console.log(`📧 Test email sent successfully`)
    } else {
      console.log('❌ Email service test failed:', data.error)
      if (data.error.includes('Email configuration missing')) {
        console.log('💡 Tip: Make sure EMAIL_USER and EMAIL_APP_PASSWORD are set in .env.local')
      }
    }
  } catch (error) {
    console.log('❌ Email service test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Test report generation without sending (preview)
  console.log('3️⃣ Testing report preview (no email sent)...')
  try {
    const response = await fetch(`${API_BASE}/reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        options: {
          includeAIInsights: false, // Skip AI to avoid API key issues
          templateType: 'simple'
        }
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Report preview successful!')
      console.log(`📊 Period: ${data.data.metrics.period}`)
      console.log(`📈 Capture Rate: ${data.data.metrics.captureRate}%`)
      console.log(`👥 Total Guests: ${data.data.metrics.totalGuests}`)
      console.log(`📧 Email Subject: ${data.data.emailSubject}`)
      console.log(`📎 Attachments: ${data.data.attachments.join(', ')}`)
    } else {
      console.log('❌ Report preview failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Report preview test error:', error.message)
  }

  console.log('\n🎉 Email integration test completed!')
  console.log('\n📖 Next Steps:')
  console.log('   1. Make sure your .env.local file has EMAIL_USER and EMAIL_APP_PASSWORD')
  console.log('   2. Visit http://localhost:3000/dashboard to see the email buttons')
  console.log('   3. Try sending a test report from the dashboard')
  console.log('   4. Check your email for the beautiful report!')
}

// Run the test
testEmailIntegration().catch(console.error)
