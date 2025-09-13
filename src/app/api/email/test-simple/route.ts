import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // For now, just return success without actually sending email
    // This tests if the basic API structure is working
    console.log(`📧 Test email would be sent to: ${to}`)
    console.log(`📧 Subject: ${subject}`)
    console.log(`📧 Message: ${message}`)

    return NextResponse.json({
      success: true,
      message: 'Test email endpoint is working',
      data: {
        to,
        subject,
        message,
        timestamp: new Date().toISOString(),
        note: 'This is a test endpoint - no actual email sent'
      }
    })

  } catch (error: any) {
    console.error('Test email failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process test email request' },
      { status: 500 }
    )
  }
}
