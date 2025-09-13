import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics/service'
import { claudeService } from '@/lib/ai/claude-service'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { emailTo, includeEmail = false } = await request.json()

    // Generate year-over-year comparison data
    console.log('Generating year-over-year AI insights...')
    const yearComparison = await analyticsService.getYearOverYearComparison()

    // Generate AI insights
    console.log('Generating year-over-year AI insights with Claude...')
    const aiResponse = await claudeService.generateYearOverYearInsights(yearComparison)

    const currentYear = new Date().getFullYear()
    const emailSubject = `🧠 AI Analysis: ${currentYear} vs ${currentYear - 1} Performance Trends`

    const response = {
      success: true,
      insights: aiResponse.insights,
      rawResponse: aiResponse.rawResponse,
      generatedAt: aiResponse.generatedAt,
      emailSubject,
      yearComparison: {
        currentYear,
        previousYear: currentYear - 1,
        monthsAnalyzed: yearComparison.length,
        averageCurrentYear: yearComparison.reduce((sum, month) => 
          sum + month.currentYear.companyMetrics.overallCaptureRate, 0) / yearComparison.length,
        averagePreviousYear: yearComparison.reduce((sum, month) => 
          sum + month.previousYear.companyMetrics.overallCaptureRate, 0) / yearComparison.length
      }
    }

    // Send email if requested
    if (includeEmail && emailTo) {
      console.log('Sending year-over-year AI insights email...')
      
      const avgCurrentYear = response.yearComparison.averageCurrentYear
      const avgPreviousYear = response.yearComparison.averagePreviousYear
      const overallChange = ((avgCurrentYear - avgPreviousYear) / avgPreviousYear * 100)

      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #8B4513;">Milea Estate Vineyard</h2>
              <h3 style="color: #666;">AI-Powered Year-over-Year Analysis</h3>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #8B4513;">Executive Summary</h4>
                <p>${aiResponse.insights.executiveSummary}</p>
              </div>

              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #2d5a2d;">Performance Overview</h4>
                <p><strong>${currentYear} Average:</strong> ${avgCurrentYear.toFixed(2)}%</p>
                <p><strong>${currentYear - 1} Average:</strong> ${avgPreviousYear.toFixed(2)}%</p>
                <p><strong>Overall Change:</strong> 
                  <span style="color: ${overallChange >= 0 ? '#2d5a2d' : '#d32f2f'};">
                    ${overallChange >= 0 ? '+' : ''}${overallChange.toFixed(2)}%
                  </span>
                </p>
              </div>

              <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0c5460;">Seasonal Insights</h4>
                <ul>
                  ${aiResponse.insights.keyWins.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
              </div>

              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">Key Drivers</h4>
                <ul>
                  ${aiResponse.insights.areasOfConcern.map(driver => `<li>${driver}</li>`).join('')}
                </ul>
              </div>

              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #721c24;">Strategic Recommendations</h4>
                <ul>
                  ${aiResponse.insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>

              <div style="background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #383d41;">Monthly Performance</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Month</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">${currentYear}</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">${currentYear - 1}</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Change</th>
                  </tr>
                  ${yearComparison.map(month => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd;">${month.month}</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${month.currentYear.companyMetrics.overallCaptureRate.toFixed(2)}%</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${month.previousYear.companyMetrics.overallCaptureRate.toFixed(2)}%</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: ${month.percentageChange >= 0 ? '#2d5a2d' : '#d32f2f'};">
                        ${month.percentageChange >= 0 ? '+' : ''}${month.percentageChange.toFixed(2)}%
                      </td>
                    </tr>
                  `).join('')}
                </table>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #888;">
                This AI analysis was generated by Claude AI and reviewed by the Milea Estate Vineyard Data Capture System.<br>
                Generated on: ${new Date().toLocaleString()}<br>
                Confidence Score: ${(aiResponse.insights.confidenceScore * 100).toFixed(0)}%
              </p>
            </div>
          </body>
        </html>
      `

      const emailText = `
        Milea Estate Vineyard - AI-Powered Year-over-Year Analysis
        
        Executive Summary:
        ${aiResponse.insights.executiveSummary}
        
        Performance Overview:
        - ${currentYear} Average: ${avgCurrentYear.toFixed(2)}%
        - ${currentYear - 1} Average: ${avgPreviousYear.toFixed(2)}%
        - Overall Change: ${overallChange >= 0 ? '+' : ''}${overallChange.toFixed(2)}%
        
        Seasonal Insights:
        ${aiResponse.insights.keyWins.map(insight => `- ${insight}`).join('\n')}
        
        Key Drivers:
        ${aiResponse.insights.areasOfConcern.map(driver => `- ${driver}`).join('\n')}
        
        Strategic Recommendations:
        ${aiResponse.insights.recommendations.map(rec => `- ${rec}`).join('\n')}
        
        Monthly Performance:
        ${yearComparison.map(month => 
          `- ${month.month}: ${month.currentYear.companyMetrics.overallCaptureRate.toFixed(2)}% vs ${month.previousYear.companyMetrics.overallCaptureRate.toFixed(2)}% (${month.percentageChange >= 0 ? '+' : ''}${month.percentageChange.toFixed(2)}%)`
        ).join('\n')}
        
        Generated on: ${new Date().toLocaleString()}
        Confidence Score: ${(aiResponse.insights.confidenceScore * 100).toFixed(0)}%
      `

      await emailService.sendEmail({
        to: Array.isArray(emailTo) ? emailTo : [emailTo],
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      })

      response.emailSent = true
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Failed to generate year-over-year AI insights:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate year-over-year AI insights' },
      { status: 500 }
    )
  }
}
