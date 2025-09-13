// src/lib/email/service.ts
import nodemailer from 'nodemailer'
import { Attachment } from 'nodemailer/lib/mailer'
import { env } from '@/lib/env'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Attachment[]
  cc?: string | string[]
  bcc?: string | string[]
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    if (!env.EMAIL_USER || !env.EMAIL_APP_PASSWORD) {
      throw new Error('Email configuration missing: EMAIL_USER and EMAIL_APP_PASSWORD must be set')
    }

    // Auto-detect email provider and use appropriate SMTP settings
    const emailProvider = this.detectEmailProvider(env.EMAIL_USER)
    
    this.transporter = nodemailer.createTransport(emailProvider.config)
  }

  private detectEmailProvider(email: string): { config: any } {
    const domain = email.split('@')[1]?.toLowerCase()
    
    switch (domain) {
      case 'gmail.com':
        return {
          config: {
            service: 'gmail',
            auth: {
              user: env.EMAIL_USER,
              pass: env.EMAIL_APP_PASSWORD
            }
          }
        }
      
      case 'yahoo.com':
      case 'ymail.com':
      case 'rocketmail.com':
        return {
          config: {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
              user: env.EMAIL_USER,
              pass: env.EMAIL_APP_PASSWORD
            }
          }
        }
      
      case 'outlook.com':
      case 'hotmail.com':
      case 'live.com':
        return {
          config: {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
              user: env.EMAIL_USER,
              pass: env.EMAIL_APP_PASSWORD
            }
          }
        }
      
      default:
        // Default to Gmail settings for unknown domains
        return {
          config: {
            service: 'gmail',
            auth: {
              user: env.EMAIL_USER,
              pass: env.EMAIL_APP_PASSWORD
            }
          }
        }
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"Milea Estate Vineyard Reports" <${env.EMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments || [],
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully to:', options.to, 'Message ID:', result.messageId)
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Email service connection verified successfully')
      return true
    } catch (error) {
      console.error('Email service connection verification failed:', error)
      return false
    }
  }

  async sendReportEmail(to: string | string[], reportData: any, reportType: string, aiInsights?: any): Promise<void> {
    const subject = `Milea Estate Vineyard - ${reportType} Report`
    
    // Use the new template if available
    let html: string
    try {
      const { generateReportHTML } = await import('./templates/report-template')
      html = generateReportHTML(reportData, aiInsights, {
        includeAIInsights: !!aiInsights,
        includeTopPerformers: true,
        includeDetailedMetrics: false,
        customTitle: `${reportType} Report`
      })
    } catch (error) {
      // Fallback to old template
      html = this.generateReportHtml(reportData, reportType)
    }
    
    await this.sendEmail({
      to,
      subject,
      html,
      text: this.generateReportText(reportData, reportType)
    })
  }

  private generateReportHtml(reportData: any, reportType: string): string {
    // Basic HTML template - you can enhance this with actual report data
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B4513;">Milea Estate Vineyard</h2>
            <h3 style="color: #666;">${reportType} Report</h3>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>Report generated on: ${new Date().toLocaleString()}</p>
              <p>Report type: ${reportType}</p>
            </div>
            <p>Please find your requested report attached or included in this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">
              This email was automatically generated by the Milea Estate Vineyard Data Capture System.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateReportText(reportData: any, reportType: string): string {
    return `
      Milea Estate Vineyard - ${reportType} Report
      
      Report generated on: ${new Date().toLocaleString()}
      Report type: ${reportType}
      
      Please find your requested report attached or included in this email.
      
      This email was automatically generated by the Milea Estate Vineyard Data Capture System.
    `
  }
}

export const emailService = new EmailService()
