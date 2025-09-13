import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/reports/generator'
import { createClient } from '@/lib/supabase/server'

interface SendReportRequest {
  email: string | string[]
  startDate?: string
  endDate?: string
  reportType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'year-over-year' | 'custom'
  options?: {
    includeAIInsights?: boolean
    includeAssociatesCSV?: boolean
    includeSummaryCSV?: boolean
    includeDetailedMetrics?: boolean
    customTitle?: string
    emailSubject?: string
    templateType?: 'simple' | 'full' | 'custom'
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Manual report send request received')
    
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Unauthorized request - no valid user session')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to send reports' },
        { status: 401 }
      )
    }

    console.log(`✅ Authenticated user: ${user.email}`)

    const body: SendReportRequest = await request.json()
    const { email, startDate, endDate, reportType = 'custom', options = {} } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = Array.isArray(email) ? email : [email]
    
    for (const emailAddr of emails) {
      if (!emailRegex.test(emailAddr)) {
        return NextResponse.json(
          { error: `Invalid email format: ${emailAddr}` },
          { status: 400 }
        )
      }
    }

    console.log(`📊 Generating ${reportType} report for: ${emails.join(', ')}`)

    let result

    // Generate and send report based on type
    switch (reportType) {
      case 'daily':
        console.log('📅 Generating daily report...')
        result = await reportGenerator.sendDailyReport(email, {
          ...options,
          customTitle: options.customTitle || 'Daily Report'
        })
        break
        
      case 'weekly':
        console.log('📅 Generating weekly report...')
        result = await reportGenerator.sendWeeklyReport(email, {
          ...options,
          customTitle: options.customTitle || 'Weekly Report'
        })
        break
        
      case 'monthly':
        console.log('📅 Generating monthly report...')
        result = await reportGenerator.sendMonthlyReport(email, {
          ...options,
          customTitle: options.customTitle || 'Monthly Report'
        })
        break
        
      case 'quarterly':
        console.log('📅 Generating quarterly report...')
        result = await reportGenerator.sendQuarterlyReport(email, {
          ...options,
          customTitle: options.customTitle || 'Quarterly Report'
        })
        break
        
      case 'year-over-year':
        console.log('📅 Generating year-over-year report...')
        result = await reportGenerator.sendYearOverYearReport(email, {
          ...options,
          customTitle: options.customTitle || 'Year Over Year Comparison Report'
        })
        break
        
      case 'custom':
      default:
        if (!startDate || !endDate) {
          console.log('📅 Generating default 30-day report...')
          result = await reportGenerator.generateAndSendReport(email, undefined, {
            ...options,
            customTitle: options.customTitle || 'Analytics Report'
          })
        } else {
          console.log(`📅 Generating custom report: ${startDate} to ${endDate}`)
          result = await reportGenerator.generateAndSendReport(
            email,
            {
              startDate: new Date(startDate),
              endDate: new Date(endDate)
            },
            {
              ...options,
              customTitle: options.customTitle || 'Custom Analytics Report'
            }
          )
        }
        break
    }

    if (result.success) {
      console.log(`✅ Report sent successfully to ${emails.join(', ')}`)
      console.log(`⏱️ Processing time: ${(result.processingTime / 1000).toFixed(1)}s`)
      
      return NextResponse.json({
        success: true,
        message: `${reportType} report sent successfully to ${emails.join(', ')}`,
        data: {
          reportType,
          recipients: emails,
          attachments: result.attachments,
          emailSubject: result.emailSubject,
          processingTime: result.processingTime,
          metrics: {
            period: result.metrics.period,
            totalProfiles: result.metrics.companyMetrics?.totalProfiles,
            totalGuests: result.metrics.companyMetrics?.totalGuestCount,
            captureRate: result.metrics.companyMetrics?.associateDataCaptureRate?.toFixed(2),
            subscriptionRate: result.metrics.companyMetrics?.associateDataSubscriptionRate?.toFixed(2)
          },
          aiInsights: result.aiInsights ? {
            executiveSummary: result.aiInsights.executiveSummary,
            confidenceScore: result.aiInsights.confidenceScore
          } : null
        }
      })
    } else {
      console.log(`❌ Report generation failed: ${result.error}`)
      return NextResponse.json(
        { 
          error: result.error || 'Failed to generate report',
          processingTime: result.processingTime
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error in report send API:', error)
    
    // Handle specific error types
    if (error.message?.includes('Email configuration missing')) {
      return NextResponse.json(
        { error: 'Email service not configured. Please check EMAIL_USER and EMAIL_APP_PASSWORD environment variables.' },
        { status: 503 }
      )
    }
    
    if (error.message?.includes('Anthropic API key')) {
      return NextResponse.json(
        { error: 'AI insights not available. Please check ANTHROPIC_API_KEY environment variable.' },
        { status: 503 }
      )
    }
    
    if (error.message?.includes('Commerce7')) {
      return NextResponse.json(
        { error: 'Data source unavailable. Please check Commerce7 configuration.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error occurred while sending report',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to show available report types and usage
export async function GET() {
  try {
    // Check authentication for documentation access
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      endpoint: '/api/reports/send',
      method: 'POST',
      description: 'Manually trigger report generation and sending',
      authentication: 'Required - User must be logged in',
      requestBody: {
        email: 'string | string[] (required) - Recipient email address(es)',
        startDate: 'string (optional) - Start date in YYYY-MM-DD format',
        endDate: 'string (optional) - End date in YYYY-MM-DD format',
        reportType: 'string (optional) - Report type: daily, weekly, monthly, quarterly, year-over-year, custom',
        options: {
          includeAIInsights: 'boolean (optional) - Include AI insights from Claude',
          includeAssociatesCSV: 'boolean (optional) - Include detailed associates CSV',
          includeSummaryCSV: 'boolean (optional) - Include summary metrics CSV',
          includeDetailedMetrics: 'boolean (optional) - Include detailed metrics in template',
          customTitle: 'string (optional) - Custom report title',
          emailSubject: 'string (optional) - Custom email subject line',
          templateType: 'string (optional) - Template style: simple, full, custom'
        }
      },
      examples: {
        dailyReport: {
          email: 'manager@vineyard.com',
          reportType: 'daily',
          options: { includeAIInsights: false, templateType: 'simple' }
        },
        monthlyReport: {
          email: 'management@vineyard.com',
          reportType: 'monthly',
          options: { 
            includeAIInsights: true, 
            includeDetailedMetrics: true,
            customTitle: 'Monthly Performance Review',
            templateType: 'full'
          }
        },
        customRange: {
          email: 'analyst@vineyard.com',
          reportType: 'custom',
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          options: { 
            includeAIInsights: true,
            customTitle: 'August Performance Analysis'
          }
        },
        multipleRecipients: {
          email: ['manager@vineyard.com', 'owner@vineyard.com'],
          reportType: 'weekly',
          options: { includeAIInsights: true }
        }
      },
      response: {
        success: 'boolean - Whether the report was sent successfully',
        message: 'string - Success or error message',
        data: {
          reportType: 'string - Type of report generated',
          recipients: 'string[] - Email addresses that received the report',
          attachments: 'string[] - CSV files attached to the email',
          emailSubject: 'string - Subject line of the sent email',
          processingTime: 'number - Time taken to generate report (ms)',
          metrics: 'object - Key metrics from the report',
          aiInsights: 'object - AI insights if included'
        }
      },
      errorCodes: {
        400: 'Bad Request - Missing required fields or invalid email format',
        401: 'Unauthorized - User not logged in',
        500: 'Internal Server Error - Report generation failed',
        503: 'Service Unavailable - Missing configuration (email, AI, or data source)'
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/reports/send:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve endpoint documentation' },
      { status: 500 }
    )
  }
}
