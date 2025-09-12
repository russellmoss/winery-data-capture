import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'
import { analyticsCache } from '@/lib/cache/analytics-cache'

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, refresh = false } = await request.json()
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cachedData = analyticsCache.get(startDateObj, endDateObj)
      if (cachedData) {
        console.log('Analytics API: Returning cached data')
        return NextResponse.json({
          ...cachedData,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        })
      }
    } else {
      console.log('Analytics API: Refresh requested, bypassing cache')
      // Clear cache for this date range
      analyticsCache.clear(startDateObj, endDateObj)
    }

    console.log('Analytics API: Fetching fresh data from analytics service')
    const metrics = await analyticsService.getDataCaptureMetrics(startDateObj, endDateObj)

    // Cache the results
    analyticsCache.set(startDateObj, endDateObj, metrics)

    return NextResponse.json({
      ...metrics,
      cached: false,
      cacheTimestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching analytics metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
