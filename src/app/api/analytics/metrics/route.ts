import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json()
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const metrics = await analyticsService.getDataCaptureMetrics(
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error('Error fetching analytics metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
