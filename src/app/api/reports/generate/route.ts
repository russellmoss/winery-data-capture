import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/reports/generator'
import { format, subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientEmail,
      reportType = 'custom', // 'daily', 'weekly', 'monthly', 'quarterly', 'year-over-year', 'custom'
      startDate,
      endDate,
      options = {}
    } = await request.json()

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required field: recipientEmail' },
        { status: 400 }
      )
    }

    console.log(`🚀 Generating ${reportType} report for ${recipientEmail}`)

    let result

    switch (reportType) {
      case 'daily':
        result = await reportGenerator.sendDailyReport(recipientEmail, options)
        break
        
      case 'weekly':
        result = await reportGenerator.sendWeeklyReport(recipientEmail, options)
        break
        
      case 'monthly':
        result = await reportGenerator.sendMonthlyReport(recipientEmail, options)
        break
        
      case 'quarterly':
        result = await reportGenerator.sendQuarterlyReport(recipientEmail, options)
        break
        
      case 'year-over-year':
        result = await reportGenerator.sendYearOverYearReport(recipientEmail, options)
        break
        
      case 'custom':
      default:
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Custom reports require startDate and endDate' },
            { status: 400 }
          )
        }
        result = await reportGenerator.generateAndSendReport(
          recipientEmail,
          { startDate: new Date(startDate), endDate: new Date(endDate) },
          options
        )
        break
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${reportType} report sent successfully`,
        data: {
          reportType,
          recipientEmail,
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
      return NextResponse.json(
        { 
          error: result.error || 'Failed to generate report',
          processingTime: result.processingTime
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to show available report types and examples
export async function GET() {
  return NextResponse.json({
    availableReportTypes: [
      {
        type: 'daily',
        description: 'Yesterday\'s performance data',
        defaultOptions: { includeAIInsights: false, templateType: 'simple' }
      },
      {
        type: 'weekly',
        description: 'Last 7 days of performance data',
        defaultOptions: { includeAIInsights: true, templateType: 'full' }
      },
      {
        type: 'monthly',
        description: 'Last 30 days of performance data',
        defaultOptions: { includeAIInsights: true, templateType: 'full', includeDetailedMetrics: true }
      },
      {
        type: 'quarterly',
        description: 'Last 90 days of performance data',
        defaultOptions: { includeAIInsights: true, templateType: 'full', includeDetailedMetrics: true }
      },
      {
        type: 'year-over-year',
        description: 'Year-over-year comparison data',
        defaultOptions: { includeAIInsights: true, templateType: 'full' }
      },
      {
        type: 'custom',
        description: 'Custom date range report',
        requiredFields: ['startDate', 'endDate']
      }
    ],
    exampleRequest: {
      recipientEmail: 'manager@vineyard.com',
      reportType: 'monthly',
      options: {
        includeAIInsights: true,
        includeAssociatesCSV: true,
        includeSummaryCSV: true,
        includeDetailedMetrics: true,
        customTitle: 'Monthly Performance Report',
        templateType: 'full'
      }
    },
    customReportExample: {
      recipientEmail: 'manager@vineyard.com',
      reportType: 'custom',
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      options: {
        includeAIInsights: true,
        templateType: 'full'
      }
    }
  })
}
