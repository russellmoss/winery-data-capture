import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'
import { csvGenerator } from '@/lib/reports/csv-generator'
import { claudeService } from '@/lib/ai/claude-service'
import { generateReportHTML } from '@/lib/email/templates/report-template'
import { createClient } from '@/lib/supabase/server'

interface SendOptimizedReportRequest {
  email: string | string[]
  reportType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'year-over-year' | 'custom'
  startDate?: string
  endDate?: string
  options?: {
    includeAIInsights?: boolean
    includeAssociatesCSV?: boolean
    includeSummaryCSV?: boolean
    includeDetailedMetrics?: boolean
    customTitle?: string
    emailSubject?: string
    templateType?: 'simple' | 'full' | 'custom'
  }
  existingData?: {
    metrics?: any
    yearComparison?: any
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, reportType, startDate, endDate, options, existingData } = await request.json() as SendOptimizedReportRequest

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!existingData?.metrics && !existingData?.yearComparison) {
      return NextResponse.json(
        { error: 'Existing data is required for optimized endpoint' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    console.log('📧 Starting optimized report generation (using existing data)...')

    // Use existing metrics data
    const metrics = existingData.metrics
    const yearComparison = existingData.yearComparison

    // Generate CSV files
    console.log('📄 Generating CSV reports...')
    const associatesCSV = csvGenerator.generateAssociatesCSV(metrics)
    const summaryCSV = csvGenerator.generateSummaryCSV(metrics)
    
    let yearComparisonCSV = ''
    if (yearComparison && reportType === 'year-over-year') {
      yearComparisonCSV = csvGenerator.generateYearComparisonCSV(yearComparison)
    }

    // Get AI insights
    let aiInsights = null
    if (options?.includeAIInsights !== false) {
      console.log('🤖 Generating AI insights from Claude...')
      try {
        const insightsResponse = reportType === 'year-over-year' && yearComparison
          ? await claudeService.generateYearOverYearInsights(yearComparison)
          : await claudeService.generateInsights(metrics)
        
        aiInsights = insightsResponse.insights
        console.log(`✅ AI insights generated (confidence: ${(aiInsights.confidenceScore * 100).toFixed(0)}%)`)
      } catch (error) {
        console.warn('⚠️ AI insights generation failed, continuing without insights:', error)
      }
    }

    // Generate email subject
    console.log('📝 Generating email subject...')
    const emailSubject = await claudeService.generateEmailSubject(metrics)
    console.log('✅ Email subject:', emailSubject)

    // Generate HTML email
    console.log('🎨 Creating email template...')
    const emailHtml = generateReportHTML(metrics, aiInsights || undefined, {
      includeAIInsights: !!aiInsights,
      includeTopPerformers: true,
      includeDetailedMetrics: options?.includeDetailedMetrics || false,
      customTitle: options?.customTitle || `${reportType?.charAt(0).toUpperCase() + reportType?.slice(1)} Report`
    })
    console.log('✅ Email template generated')

    // Prepare attachments
    const attachments = []
    
    if (options?.includeAssociatesCSV !== false) {
      attachments.push(csvGenerator.generateEmailAttachment(associatesCSV, `associates-report-${new Date().toISOString().split('T')[0]}.csv`))
    }
    
    if (options?.includeSummaryCSV !== false) {
      attachments.push(csvGenerator.generateEmailAttachment(summaryCSV, `summary-report-${new Date().toISOString().split('T')[0]}.csv`))
    }
    
    if (yearComparisonCSV && options?.includeAssociatesCSV !== false) {
      attachments.push(csvGenerator.generateEmailAttachment(yearComparisonCSV, `year-comparison-report-${new Date().toISOString().split('T')[0]}.csv`))
    }

    // Send email
    console.log('📧 Sending email...')
    await emailService.sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      attachments: attachments
    })

    const processingTime = Date.now() - startTime
    console.log(`✅ Report sent successfully! Processing time: ${(processingTime / 1000).toFixed(1)}s`)

    return NextResponse.json({
      success: true,
      message: `Report sent successfully to ${Array.isArray(email) ? email.join(', ') : email}`,
      data: {
        processingTime,
        reportType: reportType || 'custom',
        recipientCount: Array.isArray(email) ? email.length : 1,
        usedExistingData: true,
        aiInsightsIncluded: !!aiInsights,
        attachmentsCount: attachments.length
      }
    })
  } catch (error: any) {
    console.error('Error sending optimized report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send report' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Optimized report sending endpoint (uses existing data, no re-fetch)',
    usage: {
      method: 'POST',
      body: {
        email: 'string | string[]',
        reportType: 'daily | weekly | monthly | quarterly | year-over-year | custom',
        options: {
          includeAIInsights: 'boolean (default: true)',
          includeAssociatesCSV: 'boolean (default: true)',
          includeSummaryCSV: 'boolean (default: true)',
          includeDetailedMetrics: 'boolean (default: false)',
          customTitle: 'string'
        },
        existingData: {
          metrics: 'object (required)',
          yearComparison: 'object (optional, for year-over-year reports)'
        }
      },
      example: {
        reportType: 'monthly',
        email: 'manager@example.com',
        existingData: {
          metrics: { /* metrics object */ },
          yearComparison: { /* year comparison data */ }
        },
        options: { includeAIInsights: true }
      }
    }
  })
}
