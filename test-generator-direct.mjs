// Direct test of the report generator (without API layer)
import { reportGenerator } from './src/lib/reports/generator.js'

async function testGenerator() {
  console.log('🧪 Testing Report Generator Directly...\n')
  
  try {
    // Test generating a report without sending email
    console.log('📊 Testing report generation (no email)...')
    
    const result = await reportGenerator.generateReportOnly(
      {
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31')
      },
      {
        includeAIInsights: false, // Skip AI to avoid API key issues
        includeAssociatesCSV: true,
        includeSummaryCSV: true,
        templateType: 'simple'
      }
    )
    
    console.log('✅ Report generation successful!')
    console.log(`📅 Period: ${result.metrics.period}`)
    console.log(`📈 Capture Rate: ${result.metrics.companyMetrics?.associateDataCaptureRate?.toFixed(2)}%`)
    console.log(`👥 Total Guests: ${result.metrics.companyMetrics?.totalGuestCount}`)
    console.log(`📧 Email Subject: ${result.emailSubject}`)
    console.log(`📎 Attachments: ${result.attachments.join(', ')}`)
    
  } catch (error) {
    console.log('❌ Report generation failed:', error.message)
    console.log('Stack trace:', error.stack)
  }
}

testGenerator()
