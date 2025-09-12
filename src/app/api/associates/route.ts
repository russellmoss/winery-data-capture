import { NextResponse } from 'next/server'
import { commerce7Client } from '@/lib/commerce7/client'

export async function GET() {
  try {
    const associates = await commerce7Client.getAssociates()
    
    return NextResponse.json({ associates })
  } catch (error: any) {
    console.error('Error fetching associates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch associates', associates: [] },
      { status: 500 }
    )
  }
}
