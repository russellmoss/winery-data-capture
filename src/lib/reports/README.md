# Report Generator System

The Report Generator is a comprehensive system that orchestrates the entire report generation process for Milea Estate Vineyard. It fetches metrics, generates CSV files, gets AI insights, creates beautiful HTML emails, and sends everything via email.

## Features

- **Multiple Report Types**: Daily, Weekly, Monthly, Quarterly, and Year-over-Year reports
- **AI-Powered Insights**: Integration with Claude AI for intelligent analysis and recommendations
- **Beautiful Email Templates**: Responsive HTML templates with vineyard branding
- **CSV Attachments**: Detailed data exports for further analysis
- **Flexible Options**: Customizable report content and formatting
- **Error Handling**: Robust error handling with detailed logging
- **Progress Tracking**: Real-time progress updates during generation

## Quick Start

### Send a Monthly Report
```typescript
import { reportGenerator } from '@/lib/reports/generator'

// Send monthly report with AI insights
await reportGenerator.sendMonthlyReport('manager@vineyard.com')
```

### Custom Date Range Report
```typescript
await reportGenerator.generateAndSendReport(
  'manager@vineyard.com',
  { 
    startDate: new Date('2025-08-01'), 
    endDate: new Date('2025-08-31') 
  },
  {
    includeAIInsights: true,
    customTitle: 'August Performance Report',
    templateType: 'full'
  }
)
```

## API Endpoints

### Generate and Send Report
```bash
POST /api/reports/generate
```

**Request Body:**
```json
{
  "recipientEmail": "manager@vineyard.com",
  "reportType": "monthly",
  "options": {
    "includeAIInsights": true,
    "includeAssociatesCSV": true,
    "includeSummaryCSV": true,
    "includeDetailedMetrics": true,
    "customTitle": "Monthly Performance Report",
    "templateType": "full"
  }
}
```

**Available Report Types:**
- `daily` - Yesterday's performance data
- `weekly` - Last 7 days of performance data  
- `monthly` - Last 30 days of performance data
- `quarterly` - Last 90 days of performance data
- `year-over-year` - Year-over-year comparison data
- `custom` - Custom date range (requires startDate and endDate)

### Preview Report (No Email)
```bash
POST /api/reports/preview
```

**Request Body:**
```json
{
  "startDate": "2025-08-01",
  "endDate": "2025-08-31",
  "options": {
    "includeAIInsights": true,
    "templateType": "full"
  }
}
```

## Report Options

```typescript
interface ReportOptions {
  includeAIInsights?: boolean        // Include Claude AI analysis
  includeAssociatesCSV?: boolean     // Include detailed associates CSV
  includeSummaryCSV?: boolean        // Include summary metrics CSV
  includeDetailedMetrics?: boolean   // Include detailed metrics in template
  customTitle?: string              // Custom report title
  emailSubject?: string             // Custom email subject line
  templateType?: 'simple' | 'full' | 'custom'  // Template style
}
```

## Template Types

### Simple Template
- Basic metrics cards
- Top performers table
- No AI insights
- Clean, minimal design

### Full Template
- All metrics cards
- AI insights section
- Top performers table
- Professional styling with gradients

### Custom Template
- Configurable sections
- Flexible layout options
- Custom branding elements

## Report Components

### 1. Analytics Metrics
- Data capture rates (associate and company level)
- Email subscription rates
- Guest counts and profile creation
- Wedding lead identification
- Performance trends

### 2. AI Insights (Claude)
- Executive summary
- Key wins to celebrate
- Areas of concern
- Actionable recommendations
- Training focus areas
- Confidence scoring

### 3. CSV Attachments
- **Associates Report**: Detailed performance by associate
- **Summary Report**: Company-wide metrics overview
- **Year Comparison**: Month-by-month year-over-year data

### 4. Email Template Features
- Responsive design for all email clients
- Wine-themed color scheme and branding
- Progress indicators and performance colors
- Mobile-friendly layout
- Professional typography

## Error Handling

The system includes comprehensive error handling:

- **Graceful Degradation**: If AI insights fail, report continues without them
- **Detailed Logging**: Step-by-step progress tracking
- **Error Recovery**: Partial failures don't stop the entire process
- **User Feedback**: Clear error messages and success confirmations

## Performance Considerations

- **Processing Time**: Typical reports complete in 10-30 seconds
- **Memory Usage**: Optimized for large datasets
- **Rate Limiting**: Respects Commerce7 API limits
- **Caching**: Leverages analytics cache when available

## Example Usage Scenarios

### Daily Operations
```typescript
// Send daily report every morning
await reportGenerator.sendDailyReport('operations@vineyard.com')
```

### Weekly Management Review
```typescript
// Comprehensive weekly report with AI insights
await reportGenerator.sendWeeklyReport('management@vineyard.com', {
  includeAIInsights: true,
  includeDetailedMetrics: true,
  customTitle: 'Weekly Management Review'
})
```

### Monthly Board Report
```typescript
// Detailed monthly report for board meetings
await reportGenerator.sendMonthlyReport('board@vineyard.com', {
  includeAIInsights: true,
  includeDetailedMetrics: true,
  templateType: 'full',
  customTitle: 'Monthly Board Report'
})
```

### Custom Analysis
```typescript
// Custom date range for special analysis
await reportGenerator.generateAndSendReport(
  'analyst@vineyard.com',
  { 
    startDate: new Date('2025-06-01'), 
    endDate: new Date('2025-08-31') 
  },
  {
    includeAIInsights: true,
    customTitle: 'Summer Season Analysis',
    templateType: 'full'
  }
)
```

## Troubleshooting

### Common Issues

1. **AI Insights Fail**: Check Anthropic API key and quota
2. **Email Not Sent**: Verify email credentials and recipient addresses
3. **Slow Performance**: Check Commerce7 API response times
4. **Missing Data**: Verify date ranges and data availability

### Debug Mode

Enable detailed logging by checking the console output during report generation. Each step is logged with progress indicators and timing information.

## Future Enhancements

- Scheduled report delivery
- Multiple email templates
- Custom dashboard integration
- Advanced analytics features
- Multi-language support
