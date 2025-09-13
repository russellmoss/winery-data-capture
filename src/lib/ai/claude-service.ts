// src/lib/ai/claude-service.ts
import Anthropic from '@anthropic-ai/sdk'
import { DataCaptureMetrics, MonthlyComparison } from '@/lib/analytics/service'
import { env } from '@/lib/env'

interface AIInsights {
  executiveSummary: string
  keyWins: string[]
  areasOfConcern: string[]
  recommendations: string[]
  trainingFocus: string[]
  confidenceScore: number
}

interface ClaudeResponse {
  insights: AIInsights
  rawResponse: string
  generatedAt: Date
}

class ClaudeService {
  private anthropic: Anthropic

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY
    })
  }

  async generateInsights(metrics: DataCaptureMetrics): Promise<ClaudeResponse> {
    const prompt = this.buildAnalyticsPrompt(metrics)
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''
      const insights = this.parseInsightsResponse(rawResponse)

      return {
        insights,
        rawResponse,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Claude API error:', error)
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateYearOverYearInsights(yearComparison: MonthlyComparison[]): Promise<ClaudeResponse> {
    const prompt = this.buildYearOverYearPrompt(yearComparison)
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''
      const insights = this.parseInsightsResponse(rawResponse)

      return {
        insights,
        rawResponse,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Claude API error:', error)
      throw new Error(`AI year-over-year analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateEmailSubject(metrics: DataCaptureMetrics): Promise<string> {
    const captureRate = metrics.companyMetrics.associateDataCaptureRate
    const subscriptionRate = metrics.companyMetrics.associateDataSubscriptionRate
    
    let emoji = '📊'
    if (captureRate >= 80) emoji = '🎉'
    else if (captureRate >= 60) emoji = '📈'
    else if (captureRate >= 40) emoji = '⚡'
    else emoji = '🔧'
    
    const period = metrics.period.includes(' - ') ? 
      metrics.period.split(' - ')[0] + ' Report' : 
      metrics.period + ' Report'
    
    return `${emoji} Tasting Room Report | ${captureRate.toFixed(1)}% Capture | ${subscriptionRate.toFixed(1)}% Subscriptions | ${period}`
  }

  async generateAssociateFeedback(associateMetrics: any): Promise<string> {
    const prompt = `You are an experienced tasting room manager providing personalized feedback to an associate.

Associate: ${associateMetrics.name}
Capture Rate: ${associateMetrics.captureRate.toFixed(2)}%
Subscription Rate: ${associateMetrics.subscriptionRate.toFixed(2)}%
Guest Count: ${associateMetrics.guestCount}
Profiles Created: ${associateMetrics.profilesCreated}
Profiles with Email: ${associateMetrics.profilesWithEmail}
Profiles with Phone: ${associateMetrics.profilesWithPhone}
Total Orders: ${associateMetrics.totalOrders}

Provide:
1. Recognition of strengths (be specific)
2. One area for improvement with actionable advice
3. A motivating closing message

Write in a supportive, encouraging tone. Keep it concise but meaningful.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 500,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate feedback at this time.'
    } catch (error) {
      console.error('Claude API error:', error)
      return 'Unable to generate associate feedback at this time.'
    }
  }

  private buildAnalyticsPrompt(metrics: DataCaptureMetrics): string {
    const topPerformers = metrics.associates
      .filter(a => a.guestCount > 0)
      .sort((a, b) => b.captureRate - a.captureRate)
      .slice(0, 3)

    const needsSupport = metrics.associates
      .filter(a => a.guestCount > 0)
      .sort((a, b) => a.captureRate - b.captureRate)
      .slice(0, 3)

    const weddingLeads = metrics.companyMetrics.profilesWithWeddingLeadTag
    const totalProfiles = metrics.companyMetrics.totalProfiles

    return `You are an experienced tasting room manager at Milea Estate Vineyard analyzing data capture metrics. Provide insights as if you're briefing the team.

CURRENT METRICS:
- Period: ${metrics.period}
- Associate Data Capture Rate: ${metrics.companyMetrics.associateDataCaptureRate.toFixed(2)}%
- Company Data Capture Rate: ${metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%
- Associate Subscription Rate: ${metrics.companyMetrics.associateDataSubscriptionRate.toFixed(2)}%
- Company Subscription Rate: ${metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%
- Total Guest Count: ${metrics.companyMetrics.totalGuestCount}
- Total Profiles Created: ${totalProfiles}
- Wedding Lead Profiles: ${weddingLeads} (${((weddingLeads/totalProfiles)*100).toFixed(1)}% of total)

TOP PERFORMERS:
${topPerformers.map(a => `- ${a.name}: ${a.captureRate.toFixed(2)}% capture, ${a.guestCount} guests, ${a.profilesCreated} profiles`).join('\n')}

ASSOCIATES NEEDING SUPPORT:
${needsSupport.map(a => `- ${a.name}: ${a.captureRate.toFixed(2)}% capture, ${a.guestCount} guests, ${a.profilesCreated} profiles`).join('\n')}

WEDDING LEADS IMPACT:
- Wedding leads represent ${((weddingLeads/totalProfiles)*100).toFixed(1)}% of total profiles
- Company capture rate excluding weddings: ${metrics.companyMetrics.companyDataCaptureRateLessWeddings.toFixed(2)}%

Please provide a structured analysis with these exact sections. Follow the format EXACTLY as shown:

EXECUTIVE SUMMARY
[Write 2-3 sentences about the key performance story - NO bullet points, just paragraphs]

KEY WINS
• [First achievement to celebrate]
• [Second achievement to celebrate]  
• [Third achievement to celebrate]
• [Fourth achievement to celebrate]

AREAS OF CONCERN
• [First concern that needs attention]
• [Second concern that needs attention]
• [Third concern that needs attention]

ACTIONABLE RECOMMENDATIONS
• [First specific recommendation]
• [Second specific recommendation]
• [Third specific recommendation]
• [Fourth specific recommendation]
• [Fifth specific recommendation]

TRAINING FOCUS
• [First training area for next week]
• [Second training area for next week]
• [Third training area for next week]

CRITICAL FORMATTING REQUIREMENTS:
- Start each section with the exact title shown above (ALL CAPS)
- Do NOT repeat section titles anywhere else in the content
- Do NOT use numbered lists (1., 2., 3.)
- Do NOT use sub-headers within sections
- Use ONLY bullet points (•) for lists, not dashes (-)
- Keep executive summary as plain text paragraphs
- Write in a professional but encouraging tone
- Be specific with numbers and actionable advice`
  }

  private buildYearOverYearPrompt(yearComparison: MonthlyComparison[]): string {
    const currentYear = new Date().getFullYear()
    const avgCurrentYear = yearComparison.reduce((sum, month) => 
      sum + month.currentYear.companyMetrics.overallCaptureRate, 0) / yearComparison.length
    
    const avgPreviousYear = yearComparison.reduce((sum, month) => 
      sum + month.previousYear.companyMetrics.overallCaptureRate, 0) / yearComparison.length
    
    const overallChange = ((avgCurrentYear - avgPreviousYear) / avgPreviousYear * 100)

    const bestMonth = yearComparison.reduce((best, month) => 
      month.percentageChange > best.percentageChange ? month : best
    )

    const worstMonth = yearComparison.reduce((worst, month) => 
      month.percentageChange < worst.percentageChange ? month : worst
    )

    return `You are an experienced tasting room manager analyzing year-over-year performance trends for Milea Estate Vineyard.

YEAR-OVER-YEAR ANALYSIS (${currentYear} vs ${currentYear - 1}):
- Average ${currentYear} Capture Rate: ${avgCurrentYear.toFixed(2)}%
- Average ${currentYear - 1} Capture Rate: ${avgPreviousYear.toFixed(2)}%
- Overall Change: ${overallChange >= 0 ? '+' : ''}${overallChange.toFixed(2)}%

MONTHLY PERFORMANCE:
${yearComparison.map(month => 
  `${month.month}: ${month.currentYear.companyMetrics.overallCaptureRate.toFixed(2)}% vs ${month.previousYear.companyMetrics.overallCaptureRate.toFixed(2)}% (${month.percentageChange >= 0 ? '+' : ''}${month.percentageChange.toFixed(2)}%)`
).join('\n')}

BEST PERFORMING MONTH: ${bestMonth.month} (+${bestMonth.percentageChange.toFixed(2)}%)
WORST PERFORMING MONTH: ${worstMonth.month} (${worstMonth.percentageChange.toFixed(2)}%)

Please provide analysis in these sections:

EXECUTIVE SUMMARY
Write 2-3 sentences about the overall trend and performance.

SEASONAL INSIGHTS
Describe patterns you notice in monthly performance, using bullet points.

KEY DRIVERS
Explain what likely caused the best and worst months, using bullet points.

STRATEGIC RECOMMENDATIONS
List 3-4 actions based on trends, using bullet points.

FORECASTING
Describe what to expect and prepare for, using bullet points.

Focus on actionable insights a tasting room manager can use to improve performance.`
  }

  private parseInsightsResponse(response: string): AIInsights {
    // Simple parsing - in a real implementation, you might want more sophisticated parsing
    const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const executiveSummary = lines.find(line => 
      line.toLowerCase().includes('executive summary') || 
      line.toLowerCase().includes('summary')
    ) || 'Analysis completed successfully.'

    const keyWins = lines.filter(line => 
      line.startsWith('-') || line.startsWith('•') || line.startsWith('*')
    ).slice(0, 4)

    const areasOfConcern = lines.filter(line => 
      line.toLowerCase().includes('concern') || 
      line.toLowerCase().includes('improve') ||
      line.toLowerCase().includes('challenge')
    ).slice(0, 3)

    const recommendations = lines.filter(line => 
      line.toLowerCase().includes('recommend') || 
      line.toLowerCase().includes('suggest') ||
      line.toLowerCase().includes('action')
    ).slice(0, 5)

    const trainingFocus = lines.filter(line => 
      line.toLowerCase().includes('training') || 
      line.toLowerCase().includes('focus') ||
      line.toLowerCase().includes('learn')
    ).slice(0, 3)

    return {
      executiveSummary,
      keyWins,
      areasOfConcern,
      recommendations,
      trainingFocus,
      confidenceScore: 0.85 // Placeholder - could be calculated based on data completeness
    }
  }
}

export const claudeService = new ClaudeService()
