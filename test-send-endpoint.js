// Test script for the new /api/reports/send endpoint
// Run with: node test-send-endpoint.js

const API_BASE = 'http://localhost:3000/api'

async function testSendEndpoint() {
  console.log('🧪 Testing /api/reports/send Endpoint...\n')

  // Test 1: Get endpoint documentation
  console.log('1️⃣ Testing endpoint documentation...')
  try {
    const docResponse = await fetch(`${API_BASE}/reports/send`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const docData = await docResponse.json()
    
    if (docResponse.ok) {
      console.log('✅ Endpoint documentation retrieved successfully!')
      console.log(`📖 Endpoint: ${docData.endpoint}`)
      console.log(`📝 Description: ${docData.description}`)
      console.log(`🔐 Authentication: ${docData.authentication}`)
      console.log(`📊 Available report types: ${Object.keys(docData.examples).join(', ')}`)
    } else {
      console.log('❌ Documentation request failed:', docData.error)
    }
  } catch (error) {
    console.log('❌ Documentation test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Test report sending (will fail without authentication)
  console.log('2️⃣ Testing report sending (expecting auth error)...')
  try {
    const sendResponse = await fetch(`${API_BASE}/reports/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        reportType: 'daily',
        options: {
          includeAIInsights: false,
          templateType: 'simple'
        }
      })
    })

    const sendData = await sendResponse.json()
    
    if (sendResponse.status === 401) {
      console.log('✅ Authentication check working correctly!')
      console.log(`🔐 Expected auth error: ${sendData.error}`)
    } else if (sendResponse.ok) {
      console.log('✅ Report sent successfully!')
      console.log(`📧 Message: ${sendData.message}`)
      console.log(`📊 Report type: ${sendData.data.reportType}`)
      console.log(`⏱️ Processing time: ${(sendData.data.processingTime / 1000).toFixed(1)}s`)
    } else {
      console.log('❌ Unexpected response:', sendData.error)
    }
  } catch (error) {
    console.log('❌ Send test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Test validation errors
  console.log('3️⃣ Testing input validation...')
  try {
    const validationResponse = await fetch(`${API_BASE}/reports/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing email - should trigger validation error
        reportType: 'monthly'
      })
    })

    const validationData = await validationResponse.json()
    
    if (validationResponse.status === 400) {
      console.log('✅ Input validation working correctly!')
      console.log(`⚠️ Expected validation error: ${validationData.error}`)
    } else {
      console.log('❌ Validation should have failed:', validationData)
    }
  } catch (error) {
    console.log('❌ Validation test error:', error.message)
  }

  console.log('\n🎉 Send endpoint test completed!')
  console.log('\n📖 Usage Examples:')
  console.log('   • Daily report: POST /api/reports/send with reportType: "daily"')
  console.log('   • Monthly report: POST /api/reports/send with reportType: "monthly"')
  console.log('   • Custom range: POST /api/reports/send with startDate/endDate')
  console.log('   • Multiple recipients: email: ["user1@example.com", "user2@example.com"]')
  console.log('\n🔐 Note: Authentication required - user must be logged in')
}

// Run the test
testSendEndpoint().catch(console.error)
