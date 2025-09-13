import { NextRequest, NextResponse } from 'next/server'
import { generateReportHTML, generateSimpleReportHTML, generateFullReportHTML } from '@/lib/email/templates/report-template'
import { analyticsService } from '@/lib/analytics/service'
import { claudeService } from '@/lib/ai/claude-service'

export async function POST(request: NextRequest) {
  try {
    const { 
      startDate, 
      endDate, 
      templateType = 'full' // 'simple', 'full', or 'custom'
    } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      )
    }

    // Generate analytics data
    const metrics = await analyticsService.getDataCaptureMetrics(
      new Date(startDate), 
      new Date(endDate)
    )

    let html: string
    let templateName: string

    switch (templateType) {
      case 'simple':
        html = generateSimpleReportHTML(metrics)
        templateName = 'Simple Report Template'
        break
        
      case 'full':
        try {
          const aiResponse = await claudeService.generateInsights(metrics)
          html = generateFullReportHTML(metrics, aiResponse.insights)
          templateName = 'Full Report Template with AI Insights'
        } catch (error) {
          console.warn('AI insights failed, falling back to simple template')
          html = generateSimpleReportHTML(metrics)
          templateName = 'Simple Report Template (AI fallback)'
        }
        break
        
      case 'custom':
      default:
        html = generateReportHTML(metrics, undefined, {
          includeAIInsights: false,
          includeTopPerformers: true,
          includeDetailedMetrics: true,
          customTitle: 'Custom Template Demo',
          showFooter: true
        })
        templateName = 'Custom Report Template'
        break
    }

    return NextResponse.json({
      success: true,
      templateName,
      templateType,
      html,
      metrics: {
        period: metrics.period,
        captureRate: metrics.companyMetrics.associateDataCaptureRate.toFixed(2),
        subscriptionRate: metrics.companyMetrics.associateDataSubscriptionRate.toFixed(2),
        totalGuests: metrics.companyMetrics.totalGuestCount,
        totalProfiles: metrics.companyMetrics.totalProfiles
      }
    })

  } catch (error: any) {
    console.error('Failed to generate template demo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate template demo' },
      { status: 500 }
    )
  }
}
