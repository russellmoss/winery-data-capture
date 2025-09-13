// src/lib/reports/generator.ts
import { analyticsService } from '@/lib/analytics/service'
import { emailService } from '@/lib/email/service'
import { csvGenerator } from '@/lib/reports/csv-generator'
import { claudeService } from '@/lib/ai/claude-service'
import { generateReportHTML, generateSimpleReportHTML, generateFullReportHTML } from '@/lib/email/templates/report-template'
import { subDays, format } from 'date-fns'
import { DataCaptureMetrics } from '@/lib/analytics/service'

export interface ReportOptions {
  includeAIInsights?: boolean
  includeAssociatesCSV?: boolean
  includeSummaryCSV?: boolean
  includeDetailedMetrics?: boolean
  customTitle?: string
  emailSubject?: string
  templateType?: 'simple' | 'full' | 'custom'
}

export interface ReportResult {
  success: boolean
  metrics: DataCaptureMetrics
  aiInsights?: any
  attachments: string[]
  emailSubject: string
  processingTime: number
  error?: string
}

export class ReportGenerator {
  private startTime: number = 0

  async generateAndSendReport(
    recipientEmail: string | string[],
    dateRange: { startDate: Date; endDate: Date } = this.getDefaultDateRange(),
    options: ReportOptions = {}
  ): Promise<ReportResult> {
    this.startTime = Date.now()
    
    const {
      includeAIInsights = true,
      includeAssociatesCSV = true,
      includeSummaryCSV = true,
      includeDetailedMetrics = false,
      customTitle,
      emailSubject,
      templateType = 'full'
    } = options

    try {
      console.log('📊 Starting comprehensive report generation...')
      console.log(`📅 Date range: ${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`)
      console.log(`📧 Recipients: ${Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail}`)
      
      // 1. Fetch metrics
      console.log('🔍 Step 1/6: Fetching analytics metrics...')
      const metrics = await analyticsService.getDataCaptureMetrics(
        dateRange.startDate,
        dateRange.endDate
      )
      console.log(`✅ Metrics fetched: ${metrics.companyMetrics.totalProfiles} profiles, ${metrics.companyMetrics.totalGuestCount} guests`)

      // 2. Generate CSV files
      console.log('📄 Step 2/6: Generating CSV reports...')
      const attachments: any[] = []
      
      if (includeAssociatesCSV) {
        const associatesCSV = csvGenerator.generateDetailedAssociatesCSV(metrics)
        attachments.push(csvGenerator.generateEmailAttachment(
          associatesCSV, 
          `associates-report-${format(dateRange.startDate, 'yyyy-MM-dd')}`
        ))
        console.log(`✅ Associates CSV generated: ${metrics.associates.length} associates`)
      }

      if (includeSummaryCSV) {
        const summaryCSV = csvGenerator.generateSummaryCSV(metrics)
        attachments.push(csvGenerator.generateEmailAttachment(
          summaryCSV, 
          `summary-report-${format(dateRange.startDate, 'yyyy-MM-dd')}`
        ))
        console.log('✅ Summary CSV generated')
      }

      // 3. Get AI insights
      let aiInsights = null
      if (includeAIInsights) {
        console.log('🤖 Step 3/6: Generating AI insights from Claude...')
        try {
          const aiResponse = await claudeService.generateInsights(metrics)
          aiInsights = aiResponse.insights
          console.log(`✅ AI insights generated (confidence: ${(aiInsights.confidenceScore * 100).toFixed(0)}%)`)
        } catch (error) {
          console.warn('⚠️ AI insights failed, proceeding without them:', error)
        }
      } else {
        console.log('⏭️ Step 3/6: Skipping AI insights')
      }

      // 4. Generate email subject
      console.log('📝 Step 4/6: Generating email subject...')
      let finalEmailSubject = emailSubject
      if (!finalEmailSubject) {
        if (includeAIInsights && aiInsights) {
          finalEmailSubject = await claudeService.generateEmailSubject(metrics)
        } else {
          finalEmailSubject = `🍷 Milea Estate Vineyard - ${customTitle || 'Analytics Report'} | ${format(dateRange.startDate, 'MMM dd')} - ${format(dateRange.endDate, 'MMM dd')}`
        }
      }
      console.log(`✅ Email subject: ${finalEmailSubject}`)

      // 5. Generate HTML email content
      console.log('🎨 Step 5/6: Creating email template...')
      let htmlContent: string
      
      switch (templateType) {
        case 'simple':
          htmlContent = generateSimpleReportHTML(metrics)
          break
        case 'full':
          htmlContent = generateFullReportHTML(metrics, aiInsights!)
          break
        case 'custom':
        default:
          htmlContent = generateReportHTML(metrics, aiInsights || undefined, {
            includeAIInsights: !!aiInsights,
            includeTopPerformers: true,
            includeDetailedMetrics,
            customTitle: customTitle || 'Analytics Report',
            showFooter: true
          })
          break
      }
      console.log('✅ Email template generated')

      // 6. Send email with attachments
      console.log('📧 Step 6/6: Sending email...')
      await emailService.sendEmail({
        to: Array.isArray(recipientEmail) ? recipientEmail : [recipientEmail],
        subject: finalEmailSubject,
        html: htmlContent,
        text: this.generateTextContent(metrics, aiInsights, customTitle),
        attachments
      })

      const processingTime = Date.now() - this.startTime
      console.log(`✅ Report sent successfully! Processing time: ${(processingTime / 1000).toFixed(1)}s`)

      return {
        success: true,
        metrics,
        aiInsights,
        attachments: attachments.map(a => a.filename),
        emailSubject: finalEmailSubject,
        processingTime
      }

    } catch (error: any) {
      const processingTime = Date.now() - this.startTime
      console.error('❌ Failed to generate report:', error)
      
      return {
        success: false,
        metrics: {} as DataCaptureMetrics,
        attachments: [],
        emailSubject: '',
        processingTime,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  private getDefaultDateRange() {
    const endDate = new Date()
    const startDate = subDays(endDate, 30)
    return { startDate, endDate }
  }

  private generateTextContent(metrics: DataCaptureMetrics, aiInsights: any, customTitle?: string): string {
    return `
Milea Estate Vineyard - ${customTitle || 'Analytics Report'}

Report Summary:
- Period: ${metrics.period}
- Total Profiles: ${metrics.companyMetrics.totalProfiles}
- Total Guest Count: ${metrics.companyMetrics.totalGuestCount}
- Company Data Capture Rate: ${metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%
- Company Subscription Rate: ${metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%
- Wedding Lead Profiles: ${metrics.companyMetrics.profilesWithWeddingLeadTag}

Top Performers:
${metrics.associates
  .filter(a => a.guestCount > 0)
  .sort((a, b) => b.captureRate - a.captureRate)
  .slice(0, 5)
  .map(associate => 
    `- ${associate.name}: ${associate.captureRate.toFixed(2)}% capture rate, ${associate.guestCount} guests`
  ).join('\n')}

${aiInsights ? `
AI Insights:
Executive Summary: ${aiInsights.executiveSummary}

Key Wins:
${aiInsights.keyWins.map(win => `- ${win}`).join('\n')}

Recommendations:
${aiInsights.recommendations.map(rec => `- ${rec}`).join('\n')}

Training Focus:
${aiInsights.trainingFocus.map(focus => `- ${focus}`).join('\n')}
` : ''}

Detailed CSV reports are attached for further analysis.

Generated on: ${new Date().toLocaleString()}
This email was automatically generated by the Milea Estate Vineyard Data Capture System.
    `.trim()
  }

  // Convenience methods for different report types
  async sendDailyReport(recipientEmail: string | string[], options: ReportOptions = {}) {
    const endDate = new Date()
    const startDate = subDays(endDate, 1)
    return this.generateAndSendReport(recipientEmail, { startDate, endDate }, {
      ...options,
      customTitle: 'Daily Report',
      templateType: 'simple'
    })
  }

  async sendWeeklyReport(recipientEmail: string | string[], options: ReportOptions = {}) {
    const endDate = new Date()
    const startDate = subDays(endDate, 7)
    return this.generateAndSendReport(recipientEmail, { startDate, endDate }, {
      ...options,
      customTitle: 'Weekly Report',
      templateType: 'full'
    })
  }

  async sendMonthlyReport(recipientEmail: string | string[], options: ReportOptions = {}) {
    const endDate = new Date()
    const startDate = subDays(endDate, 30)
    return this.generateAndSendReport(recipientEmail, { startDate, endDate }, {
      ...options,
      customTitle: 'Monthly Report',
      templateType: 'full',
      includeDetailedMetrics: true
    })
  }

  async sendQuarterlyReport(recipientEmail: string | string[], options: ReportOptions = {}) {
    const endDate = new Date()
    const startDate = subDays(endDate, 90)
    return this.generateAndSendReport(recipientEmail, { startDate, endDate }, {
      ...options,
      customTitle: 'Quarterly Report',
      templateType: 'full',
      includeDetailedMetrics: true
    })
  }

  async sendYearOverYearReport(recipientEmail: string | string[], options: ReportOptions = {}) {
    try {
      this.startTime = Date.now()
      console.log('📊 Starting year-over-year report generation...')

      // Get year-over-year comparison data
      const yearComparison = await analyticsService.getYearOverYearComparison()
      
      // Generate AI insights for year-over-year data
      let aiInsights = null
      if (options.includeAIInsights !== false) {
        try {
          const aiResponse = await claudeService.generateYearOverYearInsights(yearComparison)
          aiInsights = aiResponse.insights
        } catch (error) {
          console.warn('⚠️ Year-over-year AI insights failed:', error)
        }
      }

      // Generate CSV for year-over-year data
      const yearComparisonCSV = csvGenerator.generateYearComparisonCSV(yearComparison)
      const attachments = [csvGenerator.generateEmailAttachment(
        yearComparisonCSV,
        `year-comparison-${format(new Date(), 'yyyy-MM-dd')}`
      )]

      // Generate email content
      const emailSubject = `🍷 Milea Estate Vineyard - Year Over Year Report | ${format(new Date(), 'yyyy')}`
      const htmlContent = generateReportHTML(
        yearComparison[0]?.currentYear || {} as DataCaptureMetrics,
        aiInsights || undefined,
        {
          includeAIInsights: !!aiInsights,
          includeTopPerformers: false,
          includeDetailedMetrics: true,
          customTitle: 'Year Over Year Comparison Report',
          showFooter: true
        }
      )

      // Send email
      await emailService.sendEmail({
        to: Array.isArray(recipientEmail) ? recipientEmail : [recipientEmail],
        subject: emailSubject,
        html: htmlContent,
        attachments
      })

      const processingTime = Date.now() - this.startTime
      console.log(`✅ Year-over-year report sent successfully! Processing time: ${(processingTime / 1000).toFixed(1)}s`)

      return {
        success: true,
        metrics: yearComparison[0]?.currentYear || {} as DataCaptureMetrics,
        aiInsights,
        attachments: attachments.map(a => a.filename),
        emailSubject,
        processingTime
      }

    } catch (error: any) {
      const processingTime = Date.now() - this.startTime
      console.error('❌ Failed to generate year-over-year report:', error)
      
      return {
        success: false,
        metrics: {} as DataCaptureMetrics,
        attachments: [],
        emailSubject: '',
        processingTime,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  // Utility method to generate report without sending
  async generateReportOnly(
    dateRange: { startDate: Date; endDate: Date } = this.getDefaultDateRange(),
    options: ReportOptions = {}
  ): Promise<Omit<ReportResult, 'success' | 'processingTime' | 'error'>> {
    const {
      includeAIInsights = true,
      includeAssociatesCSV = true,
      includeSummaryCSV = true,
      includeDetailedMetrics = false,
      customTitle,
      templateType = 'full'
    } = options

    // Fetch metrics
    const metrics = await analyticsService.getDataCaptureMetrics(
      dateRange.startDate,
      dateRange.endDate
    )

    // Generate CSV files
    const attachments: string[] = []
    if (includeAssociatesCSV) {
      const associatesCSV = csvGenerator.generateDetailedAssociatesCSV(metrics)
      attachments.push(`associates-report-${format(dateRange.startDate, 'yyyy-MM-dd')}.csv`)
    }
    if (includeSummaryCSV) {
      const summaryCSV = csvGenerator.generateSummaryCSV(metrics)
      attachments.push(`summary-report-${format(dateRange.startDate, 'yyyy-MM-dd')}.csv`)
    }

    // Get AI insights
    let aiInsights = null
    if (includeAIInsights) {
      try {
        const aiResponse = await claudeService.generateInsights(metrics)
        aiInsights = aiResponse.insights
      } catch (error) {
        console.warn('AI insights failed:', error)
      }
    }

    // Generate email subject
    const emailSubject = aiInsights ? 
      await claudeService.generateEmailSubject(metrics) :
      `🍷 Milea Estate Vineyard - ${customTitle || 'Analytics Report'}`

    return {
      metrics,
      aiInsights,
      attachments,
      emailSubject
    }
  }
}

export const reportGenerator = new ReportGenerator()
