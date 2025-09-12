import { NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'

export async function GET() {
  try {
    const yearComparison = await analyticsService.getYearOverYearComparison()
    return NextResponse.json(yearComparison)
  } catch (error: any) {
    console.error('Error fetching year comparison:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch year comparison' },
      { status: 500 }
    )
  }
}
