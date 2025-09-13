// src/lib/email/templates/report-template.ts
import { DataCaptureMetrics, AssociateMetrics } from '@/lib/analytics/service'

interface AIInsights {
  executiveSummary: string
  keyWins: string[]
  areasOfConcern: string[]
  recommendations: string[]
  trainingFocus: string[]
  confidenceScore: number
}

interface ReportTemplateOptions {
  includeAIInsights?: boolean
  includeTopPerformers?: boolean
  includeDetailedMetrics?: boolean
  customTitle?: string
  showFooter?: boolean
}

export function generateReportHTML(
  metrics: DataCaptureMetrics, 
  aiInsights?: AIInsights | string,
  options: ReportTemplateOptions = {}
): string {
  const {
    includeAIInsights = true,
    includeTopPerformers = true,
    includeDetailedMetrics = false,
    customTitle = 'Tasting Room Data Capture Report',
    showFooter = true
  } = options

  // Parse AI insights if it's a string
  const insights = typeof aiInsights === 'string' ? 
    parseInsightsString(aiInsights) : 
    aiInsights

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${customTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7fafc; line-height: 1.6;">
  <div style="max-width: 800px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🍷 Milea Estate Vineyard</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; font-weight: 500;">${customTitle}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">${metrics.period}</p>
    </div>

    <!-- Key Metrics Cards -->
    <div style="padding: 30px; background-color: #f8f9fa;">
      <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 20px; text-align: center;">📊 Key Performance Metrics</h2>
      <table style="width: 100%; border-spacing: 15px; border-collapse: separate;">
        <tr>
          <td style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; width: 25%;">
            <div style="font-size: 36px; font-weight: bold; color: #48bb78; margin-bottom: 5px;">${metrics.companyMetrics.associateDataCaptureRate.toFixed(1)}%</div>
            <div style="color: #718096; font-size: 14px; font-weight: 500;">Data Capture Rate</div>
            <div style="color: #a0aec0; font-size: 12px; margin-top: 2px;">Associate Performance</div>
          </td>
          <td style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; width: 25%;">
            <div style="font-size: 36px; font-weight: bold; color: #4299e1; margin-bottom: 5px;">${metrics.companyMetrics.associateDataSubscriptionRate.toFixed(1)}%</div>
            <div style="color: #718096; font-size: 14px; font-weight: 500;">Email Opt-in Rate</div>
            <div style="color: #a0aec0; font-size: 12px; margin-top: 2px;">Marketing Engagement</div>
          </td>
          <td style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; width: 25%;">
            <div style="font-size: 36px; font-weight: bold; color: #9f7aea; margin-bottom: 5px;">${metrics.companyMetrics.totalGuestCount.toLocaleString()}</div>
            <div style="color: #718096; font-size: 14px; font-weight: 500;">Total Guests</div>
            <div style="color: #a0aec0; font-size: 12px; margin-top: 2px;">Tasting Room Traffic</div>
          </td>
          <td style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; width: 25%;">
            <div style="font-size: 36px; font-weight: bold; color: #ed8936; margin-bottom: 5px;">${metrics.companyMetrics.totalProfiles.toLocaleString()}</div>
            <div style="color: #718096; font-size: 14px; font-weight: 500;">Profiles Created</div>
            <div style="color: #a0aec0; font-size: 12px; margin-top: 2px;">Customer Database</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- AI Insights Section -->
    ${includeAIInsights && insights ? `
      <div style="padding: 30px; background-color: white;">
        <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 20px; text-align: center;">🤖 AI-Powered Insights & Recommendations</h2>
        
        <!-- Executive Summary -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Executive Summary</h3>
          <p style="margin: 0; font-size: 16px; line-height: 1.6; opacity: 0.95;">${insights.executiveSummary}</p>
        </div>

        <!-- Key Wins -->
        <div style="background-color: #f0fff4; padding: 20px; border-radius: 12px; border-left: 5px solid #48bb78; margin-bottom: 15px;">
          <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600;">🎉 Key Wins to Celebrate</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
            ${insights.keyWins.map(win => `<li style="margin: 8px 0; font-size: 14px;">${win}</li>`).join('')}
          </ul>
        </div>

        <!-- Areas of Concern -->
        <div style="background-color: #fffaf0; padding: 20px; border-radius: 12px; border-left: 5px solid #ed8936; margin-bottom: 15px;">
          <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600;">⚠️ Areas of Concern</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
            ${insights.areasOfConcern.map(concern => `<li style="margin: 8px 0; font-size: 14px;">${concern}</li>`).join('')}
          </ul>
        </div>

        <!-- Recommendations -->
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; border-left: 5px solid #4299e1; margin-bottom: 15px;">
          <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600;">💡 Actionable Recommendations</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
            ${insights.recommendations.map(rec => `<li style="margin: 8px 0; font-size: 14px;">${rec}</li>`).join('')}
          </ul>
        </div>

        <!-- Training Focus -->
        <div style="background-color: #fef5e7; padding: 20px; border-radius: 12px; border-left: 5px solid #9f7aea;">
          <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600;">🎓 Training Focus for Next Week</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
            ${insights.trainingFocus.map(focus => `<li style="margin: 8px 0; font-size: 14px;">${focus}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : ''}

    <!-- Top Performers -->
    ${includeTopPerformers ? `
      <div style="padding: 30px; background-color: #f8f9fa;">
        <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 20px; text-align: center;">🏆 Top Performing Associates</h2>
        <table style="width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white;">
              <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">Associate</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Capture Rate</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Profiles Created</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Guest Count</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Email Opt-in</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.associates
              .filter(a => a.guestCount > 0)
              .sort((a, b) => b.captureRate - a.captureRate)
              .slice(0, 8)
              .map((a, i) => `
                <tr style="border-bottom: 1px solid #e2e8f0; ${i % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                  <td style="padding: 15px; font-weight: 500; color: #2d3748;">
                    ${getRankEmoji(i)} ${a.name}
                  </td>
                  <td style="padding: 15px; text-align: center; font-weight: bold; color: ${getCaptureRateColor(a.captureRate)};">
                    ${a.captureRate.toFixed(1)}%
                  </td>
                  <td style="padding: 15px; text-align: center; color: #4a5568;">${a.profilesCreated}</td>
                  <td style="padding: 15px; text-align: center; color: #4a5568;">${a.guestCount}</td>
                  <td style="padding: 15px; text-align: center; color: #4a5568;">${a.subscriptionRate.toFixed(1)}%</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Detailed Metrics -->
    ${includeDetailedMetrics ? `
      <div style="padding: 30px; background-color: white;">
        <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 20px; text-align: center;">📈 Detailed Performance Metrics</h2>
        <table style="width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-collapse: collapse;">
          <thead>
            <tr style="background-color: #edf2f7;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Metric</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding: 12px; color: #4a5568;">Company Data Capture Rate</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #48bb78;">${metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%</td></tr>
            <tr style="background-color: #f8f9fa;"><td style="padding: 12px; color: #4a5568;">Company Subscription Rate</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #4299e1;">${metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%</td></tr>
            ${metrics.weddingSettings.showWeddingLeadProfiles ? `<tr><td style="padding: 12px; color: #4a5568;">Wedding Lead Profiles</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #9f7aea;">${metrics.companyMetrics.profilesWithWeddingLeadTag}</td></tr>` : ''}
            ${metrics.weddingSettings.showWeddingCaptureRate ? `<tr style="background-color: #f8f9fa;"><td style="padding: 12px; color: #4a5568;">Capture Rate (Excluding Weddings)</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #ed8936;">${metrics.companyMetrics.companyDataCaptureRateLessWeddings.toFixed(2)}%</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Footer -->
    ${showFooter ? `
      <div style="background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; font-size: 16px; font-weight: 500;">🍷 Milea Estate Vineyard</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Data Capture Analytics System</p>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">
            This report was automatically generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
          ${insights ? `<p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">AI Analysis Confidence: ${(insights.confidenceScore * 100).toFixed(0)}%</p>` : ''}
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
            Powered by Claude AI | Milea Estate Vineyard Data Capture System
          </p>
        </div>
      </div>
    ` : ''}
  </div>
</body>
</html>
  `
}

// Helper functions
function parseInsightsString(insights: string): AIInsights {
  const lines = insights.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Helper function to extract content for a specific section
  const extractSection = (sectionName: string): { content: string[], summary?: string } => {
    const sectionIndicators = [
      sectionName.toUpperCase(),
      sectionName.toLowerCase(),
      sectionName.replace(/\s+/g, '\\s*') // Handle variations in spacing
    ]
    
    let sectionStartIndex = -1
    
    // Find the section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isSectionHeader = sectionIndicators.some(indicator => {
        if (indicator.includes('\\s*')) {
          const regex = new RegExp(`^${indicator}$`, 'i')
          return regex.test(line)
        }
        return line.toLowerCase().includes(indicator.toLowerCase())
      })
      
      if (isSectionHeader) {
        sectionStartIndex = i
        break
      }
    }
    
    if (sectionStartIndex === -1) return { content: [] }
    
    const content: string[] = []
    let summary = ''
    let currentIndex = sectionStartIndex + 1
    
    // Extract content until we hit the next section
    while (currentIndex < lines.length) {
      const line = lines[currentIndex]
      
      // Stop at next section (all caps headers, emoji headers, or numbered sections)
      if (/^[A-Z\s]+$/.test(line) && line.length > 5 && line !== 'EXECUTIVE SUMMARY') break
      if (line.match(/^[🎯💡🎓⚠️🎉📋]/)) break
      if (/^\d+\.\s*[A-Z\s]+$/.test(line)) break
      
      // Skip empty lines
      if (line.length === 0) {
        currentIndex++
        continue
      }
      
      // Skip duplicate section headers
      if (line.match(/^(EXECUTIVE SUMMARY|KEY WINS|AREAS OF CONCERN|ACTIONABLE RECOMMENDATIONS|TRAINING FOCUS)$/i)) {
        currentIndex++
        continue
      }
      
      // For executive summary, collect as paragraphs
      if (sectionName.toLowerCase().includes('executive')) {
        if (line.length > 10 && !line.match(/^[A-Z\s]+$/) && !line.match(/^\d+\./)) {
          if (!summary) {
            summary = line
          } else {
            summary += ' ' + line
          }
        }
      } else {
        // For other sections, collect bullet points
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const cleaned = line.replace(/^[-•*]\s*/, '').trim()
          if (cleaned && !cleaned.match(/^[A-Z\s]+$/) && cleaned.length > 3) {
            content.push(cleaned)
          }
        } else if (line.length > 10 && !line.match(/^[A-Z\s]+$/) && !line.match(/^\d+\./)) {
          // If it's not a bullet point but looks like content, add it as a bullet point
          content.push(line)
        }
      }
      
      currentIndex++
    }
    
    return { content: content.slice(0, 5), summary }
  }
  
  // Extract each section
  const executiveSection = extractSection('executive summary')
  const keyWinsSection = extractSection('key wins')
  const concernsSection = extractSection('areas of concern')
  const recommendationsSection = extractSection('actionable recommendations')
  const trainingSection = extractSection('training focus')
  
  return {
    executiveSummary: executiveSection.summary || executiveSection.content[0] || 'Analysis completed successfully.',
    keyWins: keyWinsSection.content,
    areasOfConcern: concernsSection.content,
    recommendations: recommendationsSection.content,
    trainingFocus: trainingSection.content,
    confidenceScore: 0.85
  }
}

function getRankEmoji(index: number): string {
  switch (index) {
    case 0: return '🥇'
    case 1: return '🥈'
    case 2: return '🥉'
    default: return '🏅'
  }
}

function getCaptureRateColor(rate: number): string {
  if (rate >= 80) return '#48bb78' // Green
  if (rate >= 60) return '#ed8936' // Orange
  if (rate >= 40) return '#ecc94b' // Yellow
  return '#e53e3e' // Red
}

// Export additional utility functions
export function generateSimpleReportHTML(metrics: DataCaptureMetrics): string {
  return generateReportHTML(metrics, undefined, {
    includeAIInsights: false,
    includeTopPerformers: true,
    includeDetailedMetrics: false,
    customTitle: 'Quick Report Summary'
  })
}

export function generateFullReportHTML(metrics: DataCaptureMetrics, aiInsights: AIInsights): string {
  return generateReportHTML(metrics, aiInsights, {
    includeAIInsights: true,
    includeTopPerformers: true,
    includeDetailedMetrics: true,
    customTitle: 'Comprehensive Analytics Report'
  })
}
