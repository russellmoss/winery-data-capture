import { NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'

export async function GET() {
  try {
    console.log('Year Comparison API: Starting year-over-year comparison...')
    const startTime = Date.now()
    
    const yearComparison = await analyticsService.getYearOverYearComparison()
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    console.log(`Year Comparison API: Completed in ${duration.toFixed(2)} seconds`)
    
    return NextResponse.json({
      data: yearComparison,
      metadata: {
        processingTime: duration,
        monthsProcessed: yearComparison.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Year Comparison API: Error fetching year comparison:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch year comparison'
    let statusCode = 500
    
    if (error.message?.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few minutes.'
      statusCode = 429
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. The data set may be too large.'
      statusCode = 408
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}
