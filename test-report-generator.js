// Test script for the Report Generator
// Run with: node test-report-generator.js

const API_BASE = 'http://localhost:3000/api'

async function testReportGeneration() {
  console.log('🧪 Testing Report Generator System...\n')

  // Test 1: Preview a report (no email sent)
  console.log('1️⃣ Testing report preview...')
  try {
    const previewResponse = await fetch(`${API_BASE}/reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        options: {
          includeAIInsights: true,
          templateType: 'full'
        }
      })
    })

    const previewData = await previewResponse.json()
    
    if (previewData.success) {
      console.log('✅ Report preview successful!')
      console.log(`📊 Period: ${previewData.data.metrics.period}`)
      console.log(`📈 Capture Rate: ${previewData.data.metrics.captureRate}%`)
      console.log(`👥 Total Guests: ${previewData.data.metrics.totalGuests}`)
      console.log(`📧 Email Subject: ${previewData.data.emailSubject}`)
      
      if (previewData.data.aiInsights) {
        console.log(`🤖 AI Insights: ${previewData.data.aiInsights.executiveSummary}`)
        console.log(`🎯 Confidence: ${(previewData.data.aiInsights.confidenceScore * 100).toFixed(0)}%`)
      }
      
      console.log(`📎 Attachments: ${previewData.data.attachments.join(', ')}`)
    } else {
      console.log('❌ Report preview failed:', previewData.error)
    }
  } catch (error) {
    console.log('❌ Preview test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Get available report types
  console.log('2️⃣ Testing available report types...')
  try {
    const typesResponse = await fetch(`${API_BASE}/reports/generate`)
    const typesData = await typesResponse.json()
    
    console.log('✅ Available report types:')
    typesData.availableReportTypes.forEach(type => {
      console.log(`   • ${type.type}: ${type.description}`)
    })
  } catch (error) {
    console.log('❌ Report types test error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Generate a simple report (uncomment to test email sending)
  console.log('3️⃣ Testing report generation...')
  console.log('⚠️  Uncomment the code below to test actual email sending')
  
  /*
  try {
    const reportResponse = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: 'test@example.com', // Replace with actual email
        reportType: 'weekly',
        options: {
          includeAIInsights: true,
          includeAssociatesCSV: true,
          includeSummaryCSV: true,
          customTitle: 'Test Weekly Report',
          templateType: 'full'
        }
      })
    })

    const reportData = await reportResponse.json()
    
    if (reportData.success) {
      console.log('✅ Report generation successful!')
      console.log(`📧 Email sent to: ${reportData.data.recipientEmail}`)
      console.log(`⏱️  Processing time: ${(reportData.data.processingTime / 1000).toFixed(1)}s`)
      console.log(`📎 Attachments: ${reportData.data.attachments.join(', ')}`)
    } else {
      console.log('❌ Report generation failed:', reportData.error)
    }
  } catch (error) {
    console.log('❌ Report generation test error:', error.message)
  }
  */

  console.log('\n🎉 Test completed!')
  console.log('\n📖 Usage Examples:')
  console.log('   • Daily report: POST /api/reports/generate with reportType: "daily"')
  console.log('   • Monthly report: POST /api/reports/generate with reportType: "monthly"')
  console.log('   • Custom range: POST /api/reports/generate with startDate/endDate')
  console.log('   • Preview only: POST /api/reports/preview (no email sent)')
}

// Run the test
testReportGeneration().catch(console.error)
