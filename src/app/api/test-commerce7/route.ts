import { NextResponse } from 'next/server'
import { commerce7Client } from '@/lib/commerce7/client'
import { handleError } from '@/lib/errors'

export async function GET() {
  try {
    // Test Commerce7 API connection by fetching recent orders
    const recentOrders = await commerce7Client.getRecentOrders(7)
    
    // Test fetching associates
    const associates = await commerce7Client.getAssociates()
    
    return NextResponse.json({
      success: true,
      commerce7: {
        connected: true,
        recentOrders: recentOrders.length,
        associates: associates.length,
        sampleData: {
          orders: recentOrders.slice(0, 2).map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            salesAssociate: order.salesAssociate?.name || 'Unknown'
          })),
          associates: associates.slice(0, 3).map(associate => ({
            id: associate.id,
            name: associate.name
          }))
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const appError = handleError(error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: appError.message,
          code: appError.code,
          statusCode: appError.statusCode
        },
        timestamp: new Date().toISOString()
      },
      { status: appError.statusCode }
    )
  }
}
