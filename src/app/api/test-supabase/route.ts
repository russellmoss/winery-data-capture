import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/supabase/client'
import { validateServerAuth } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors'

export async function GET() {
  try {
    // Test client-side connection
    const clientTest = await testSupabaseConnection()
    
    // Test server-side connection
    const serverTest = await validateServerAuth()
    
    return NextResponse.json({
      success: true,
      client: {
        connected: clientTest.success,
        data: clientTest.data ? 'Session data available' : 'No session data'
      },
      server: {
        connected: !serverTest.error,
        authenticated: !!serverTest.user,
        user: serverTest.user ? {
          id: serverTest.user.id,
          email: serverTest.user.email
        } : null
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
