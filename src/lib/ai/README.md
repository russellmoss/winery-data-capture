# Claude AI Service for Milea Estate Vineyard

This service integrates Anthropic's Claude AI to provide intelligent analysis and insights for tasting room analytics data.

## Features

### 1. Analytics Insights Generation
- Executive summaries of performance data
- Identification of key wins and areas of concern
- Actionable recommendations for improvement
- Training focus suggestions

### 2. Year-over-Year Analysis
- Trend analysis and seasonal insights
- Performance forecasting
- Strategic recommendations based on historical data

### 3. Associate Feedback Generation
- Personalized feedback for individual associates
- Recognition of strengths
- Actionable improvement suggestions

### 4. Smart Email Subject Generation
- Context-aware email subjects with emojis
- Performance-based subject line optimization

## Setup

### Environment Variables
Add to your `.env.local` file:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### API Key Setup
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add the key to your environment variables

## Usage

### Basic Analytics Insights
```typescript
import { claudeService } from '@/lib/ai/claude-service'

const insights = await claudeService.generateInsights(metrics)
console.log(insights.insights.executiveSummary)
```

### Year-over-Year Analysis
```typescript
const yearInsights = await claudeService.generateYearOverYearInsights(yearComparison)
```

### Associate Feedback
```typescript
const feedback = await claudeService.generateAssociateFeedback(associateMetrics)
```

### Smart Email Subjects
```typescript
const subject = await claudeService.generateEmailSubject(metrics)
// Returns: "🎉 Tasting Room Report | 85.2% Capture | 72.1% Subscriptions | Aug 13 - Sep 12 Report"
```

## API Endpoints

### 1. `/api/ai/insights`
Generate AI insights for analytics data.

**Request:**
```json
{
  "startDate": "2025-08-13",
  "endDate": "2025-09-12",
  "emailTo": ["manager@vineyard.com"],
  "includeEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "executiveSummary": "Strong performance with room for improvement...",
    "keyWins": ["Associate A achieved 95% capture rate", "..."],
    "areasOfConcern": ["Low subscription rates in Q3", "..."],
    "recommendations": ["Implement email training", "..."],
    "trainingFocus": ["Email capture techniques", "..."],
    "confidenceScore": 0.85
  },
  "emailSent": true
}
```

### 2. `/api/ai/year-comparison`
Generate year-over-year analysis.

**Request:**
```json
{
  "emailTo": ["manager@vineyard.com"],
  "includeEmail": true
}
```

### 3. `/api/ai/associate-feedback`
Generate personalized feedback for an associate.

**Request:**
```json
{
  "associateMetrics": {
    "name": "John Smith",
    "captureRate": 78.5,
    "subscriptionRate": 65.2,
    "guestCount": 45,
    "profilesCreated": 38
  }
}
```

## Integration with Email Reports

You can include AI insights in your email reports by setting `includeAIInsights: true`:

```json
{
  "startDate": "2025-08-13",
  "endDate": "2025-09-12",
  "emailTo": ["manager@vineyard.com"],
  "includeAIInsights": true
}
```

This will:
- Generate AI insights automatically
- Include them in the email content
- Use AI-generated email subjects
- Provide structured analysis in the email

## AI Response Structure

All AI responses include:
- `executiveSummary`: 2-3 sentence overview
- `keyWins`: Achievements to celebrate
- `areasOfConcern`: Issues needing attention
- `recommendations`: Actionable improvement steps
- `trainingFocus`: Specific training areas
- `confidenceScore`: AI confidence level (0-1)

## Error Handling

The service includes comprehensive error handling:
- API key validation
- Rate limiting protection
- Graceful fallbacks
- Detailed error messages

## Cost Considerations

- Claude API charges per token used
- Typical cost: $0.01-0.05 per insight generation
- Year-over-year analysis uses more tokens
- Consider caching insights for frequently requested periods

## Best Practices

1. **Cache Results**: Store insights for common date ranges
2. **Batch Requests**: Combine multiple analyses when possible
3. **Error Handling**: Always handle API failures gracefully
4. **Rate Limiting**: Don't exceed Anthropic's rate limits
5. **Data Quality**: Ensure clean, complete data for best insights

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `ANTHROPIC_API_KEY` is set in environment
   - Check that the key is valid and has credits

2. **Rate Limiting**
   - Implement delays between requests
   - Consider upgrading your Anthropic plan

3. **Poor Quality Insights**
   - Ensure metrics data is complete
   - Check for data anomalies or missing fields

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will provide detailed Claude API request/response logging.
