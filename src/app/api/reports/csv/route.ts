import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'
import { csvGenerator } from '@/lib/reports/csv-generator'

export async function POST(request: NextRequest) {
  try {
    const { 
      startDate, 
      endDate, 
      format = 'associates',
      filename 
    } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      )
    }

    // Generate analytics data
    console.log(`Generating ${format} CSV report...`)
    const metrics = await analyticsService.getDataCaptureMetrics(
      new Date(startDate), 
      new Date(endDate)
    )

    // Generate CSV based on format
    let csvContent: string
    let defaultFilename: string

    switch (format) {
      case 'summary':
        csvContent = csvGenerator.generateSummaryCSV(metrics)
        defaultFilename = `analytics-summary-${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'detailed':
        csvContent = csvGenerator.generateDetailedAssociatesCSV(metrics)
        defaultFilename = `analytics-detailed-${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'associates':
      default:
        csvContent = csvGenerator.generateAssociatesCSV(metrics)
        defaultFilename = `analytics-associates-${new Date().toISOString().split('T')[0]}.csv`
        break
    }

    const finalFilename = filename || defaultFilename

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('Failed to generate CSV report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate CSV report' },
      { status: 500 }
    )
  }
}
