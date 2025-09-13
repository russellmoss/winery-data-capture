import { NextRequest, NextResponse } from 'next/server'
import { claudeService } from '@/lib/ai/claude-service'

export async function POST(request: NextRequest) {
  try {
    const { associateMetrics } = await request.json()

    if (!associateMetrics || !associateMetrics.name) {
      return NextResponse.json(
        { error: 'Missing required field: associateMetrics with name' },
        { status: 400 }
      )
    }

    // Generate AI feedback for the associate
    console.log(`Generating AI feedback for associate: ${associateMetrics.name}`)
    const feedback = await claudeService.generateAssociateFeedback(associateMetrics)

    return NextResponse.json({
      success: true,
      associate: associateMetrics.name,
      feedback,
      generatedAt: new Date(),
      metrics: {
        captureRate: associateMetrics.captureRate?.toFixed(2),
        subscriptionRate: associateMetrics.subscriptionRate?.toFixed(2),
        guestCount: associateMetrics.guestCount,
        profilesCreated: associateMetrics.profilesCreated
      }
    })

  } catch (error: any) {
    console.error('Failed to generate associate feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate associate feedback' },
      { status: 500 }
    )
  }
}
