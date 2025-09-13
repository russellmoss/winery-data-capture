import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/reports/generator'

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
    const { email, startDate, endDate, reportType, options } = await request.json() as SendReportRequest

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    let reportPromise: Promise<void>

    switch (reportType) {
      case 'daily':
        reportPromise = reportGenerator.sendDailyReport(email, options)
        break
      case 'weekly':
        reportPromise = reportGenerator.sendWeeklyReport(email, options)
        break
      case 'monthly':
        reportPromise = reportGenerator.sendMonthlyReport(email, options)
        break
      case 'quarterly':
        reportPromise = reportGenerator.sendQuarterlyReport(email, options)
        break
      case 'year-over-year':
        reportPromise = reportGenerator.sendYearOverYearReport(email, options)
        break
      case 'custom':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for custom reports' },
            { status: 400 }
          )
        }
        reportPromise = reportGenerator.generateAndSendReport(
          email,
          { startDate: new Date(startDate), endDate: new Date(endDate) },
          options
        )
        break
      default:
        // Default to monthly if no type specified
        reportPromise = reportGenerator.sendMonthlyReport(email, options)
        break
    }

    const startTime = Date.now()
    await reportPromise
    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Report sent successfully to ${Array.isArray(email) ? email.join(', ') : email}`,
      data: {
        processingTime,
        reportType: reportType || 'monthly',
        recipientCount: Array.isArray(email) ? email.length : 1
      }
    })
  } catch (error: any) {
    console.error('Error sending report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send report' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple report sending endpoint (no authentication required)',
    usage: {
      method: 'POST',
      body: {
        email: 'string | string[]',
        reportType: 'daily | weekly | monthly | quarterly | year-over-year | custom (optional, default: monthly)',
        startDate: 'string (ISO date, required for custom)',
        endDate: 'string (ISO date, required for custom)',
        options: {
          includeAIInsights: 'boolean (default: true)',
          includeAssociatesCSV: 'boolean (default: true)',
          includeSummaryCSV: 'boolean (default: true)',
          includeDetailedMetrics: 'boolean (default: false)',
          customTitle: 'string',
          emailSubject: 'string',
          templateType: 'simple | full | custom (default: full)'
        }
      },
      example: {
        reportType: 'monthly',
        email: 'test@example.com',
        options: { includeAIInsights: true }
      }
    }
  })
}