import { NextRequest, NextResponse } from 'next/server'
import { commerce7Client } from '@/lib/commerce7/client'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const customer = await commerce7Client.createCustomer(data)
    
    return NextResponse.json({ success: true, customer })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}
