import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Verify email connection first
    const isConnected = await emailService.verifyConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Email service connection failed' },
        { status: 500 }
      )
    }

    // Send test email
    await emailService.sendEmail({
      to,
      subject,
      html: `
        <h2>Test Email from Milea Estate Vineyard</h2>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
      text: `Test Email from Milea Estate Vineyard\n\nMessage: ${message}\n\nSent at: ${new Date().toLocaleString()}`
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    })

  } catch (error: any) {
    console.error('Test email failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
