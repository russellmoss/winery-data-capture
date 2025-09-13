import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/reports/generator'

export async function POST(request: NextRequest) {
  try {
    const { 
      startDate,
      endDate,
      options = {}
    } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      )
    }

    console.log('🔍 Generating report preview...')

    const result = await reportGenerator.generateReportOnly(
      { startDate: new Date(startDate), endDate: new Date(endDate) },
      options
    )

    return NextResponse.json({
      success: true,
      message: 'Report preview generated successfully',
      data: {
        metrics: {
          period: result.metrics.period,
          totalProfiles: result.metrics.companyMetrics?.totalProfiles,
          totalGuests: result.metrics.companyMetrics?.totalGuestCount,
          captureRate: result.metrics.companyMetrics?.associateDataCaptureRate?.toFixed(2),
          subscriptionRate: result.metrics.companyMetrics?.associateDataSubscriptionRate?.toFixed(2),
          weddingLeads: result.metrics.companyMetrics?.profilesWithWeddingLeadTag
        },
        aiInsights: result.aiInsights ? {
          executiveSummary: result.aiInsights.executiveSummary,
          keyWins: result.aiInsights.keyWins,
          recommendations: result.aiInsights.recommendations,
          confidenceScore: result.aiInsights.confidenceScore
        } : null,
        attachments: result.attachments,
        emailSubject: result.emailSubject,
        topPerformers: result.metrics.associates
          ?.filter(a => a.guestCount > 0)
          ?.sort((a, b) => b.captureRate - a.captureRate)
          ?.slice(0, 5)
          ?.map(a => ({
            name: a.name,
            captureRate: a.captureRate.toFixed(2),
            guestCount: a.guestCount,
            profilesCreated: a.profilesCreated,
            subscriptionRate: a.subscriptionRate.toFixed(2)
          })) || []
      }
    })

  } catch (error: any) {
    console.error('Failed to generate report preview:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
