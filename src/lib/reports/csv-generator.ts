// src/lib/reports/csv-generator.ts
import { createObjectCsvStringifier } from 'csv-writer'
import { DataCaptureMetrics, AssociateMetrics, MonthlyComparison } from '@/lib/analytics/service'

export class CSVGenerator {
  generateAssociatesCSV(metrics: DataCaptureMetrics): string {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Associate' },
        { id: 'profilesCreated', title: 'New Profiles' },
        { id: 'profilesWithEmail', title: 'With Email' },
        { id: 'profilesWithPhone', title: 'With Phone' },
        { id: 'profilesWithData', title: 'With Data' },
        { id: 'profilesWithSubscription', title: 'Subscribed' },
        { id: 'guestCount', title: 'Guest Count' },
        { id: 'captureRate', title: 'Capture Rate' },
        { id: 'subscriptionRate', title: 'Subscribe Rate' }
      ]
    })

    const records = metrics.associates.map(a => ({
      name: a.name,
      profilesCreated: a.profilesCreated,
      profilesWithEmail: a.profilesWithEmail,
      profilesWithPhone: a.profilesWithPhone,
      profilesWithData: a.profilesWithData,
      profilesWithSubscription: a.profilesWithSubscription,
      guestCount: a.guestCount,
      captureRate: `${a.captureRate.toFixed(1)}%`,
      subscriptionRate: `${a.subscriptionRate.toFixed(1)}%`
    }))

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)
  }

  generateSummaryCSV(metrics: DataCaptureMetrics): string {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' }
      ]
    })

    const records = [
      { metric: 'Period', value: metrics.period },
      { metric: 'Start Date', value: new Date(metrics.startDate).toLocaleDateString() },
      { metric: 'End Date', value: new Date(metrics.endDate).toLocaleDateString() },
      { metric: 'Total Profiles', value: metrics.companyMetrics.totalProfiles },
      { metric: 'Total Profiles with Data', value: metrics.companyMetrics.totalProfilesWithData },
      { metric: 'Total Profiles with Subscription', value: metrics.companyMetrics.totalProfilesWithSubscription },
      { metric: 'Total Guest Count', value: metrics.companyMetrics.totalGuestCount },
      { metric: 'Overall Capture Rate', value: `${metrics.companyMetrics.overallCaptureRate.toFixed(2)}%` },
      { metric: 'Overall Subscription Rate', value: `${metrics.companyMetrics.overallSubscriptionRate.toFixed(2)}%` },
      { metric: 'Associate Data Capture Rate', value: `${metrics.companyMetrics.associateDataCaptureRate.toFixed(2)}%` },
      { metric: 'Company Data Capture Rate', value: `${metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%` },
      { metric: 'Company Data Capture Rate (Less Weddings)', value: `${metrics.companyMetrics.companyDataCaptureRateLessWeddings.toFixed(2)}%` },
      { metric: 'Associate Data Subscription Rate', value: `${metrics.companyMetrics.associateDataSubscriptionRate.toFixed(2)}%` },
      { metric: 'Company Data Subscription Rate', value: `${metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%` },
      { metric: 'Company Data Subscription Rate (Less Weddings)', value: `${metrics.companyMetrics.companyDataSubscriptionRateLessWeddings.toFixed(2)}%` },
      { metric: 'Wedding Lead Profiles', value: metrics.companyMetrics.profilesWithWeddingLeadTag },
      { metric: 'Capture Rate Excluding Wedding Leads', value: `${metrics.companyMetrics.captureRateExcludingWeddingLeads.toFixed(2)}%` },
      { metric: 'Subscription Rate Excluding Wedding Leads', value: `${metrics.companyMetrics.subscriptionRateExcludingWeddingLeads.toFixed(2)}%` }
    ]

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)
  }

  generateYearComparisonCSV(yearComparison: MonthlyComparison[]): string {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'month', title: 'Month' },
        { id: 'currentYearCaptureRate', title: 'Current Year Capture Rate %' },
        { id: 'previousYearCaptureRate', title: 'Previous Year Capture Rate %' },
        { id: 'percentageChange', title: 'Change %' },
        { id: 'currentYearProfiles', title: 'Current Year Total Profiles' },
        { id: 'currentYearGuests', title: 'Current Year Guest Count' },
        { id: 'previousYearProfiles', title: 'Previous Year Total Profiles' },
        { id: 'previousYearGuests', title: 'Previous Year Guest Count' }
      ]
    })

    const records = yearComparison.map(month => ({
      month: month.month,
      currentYearCaptureRate: month.currentYear.companyMetrics.overallCaptureRate.toFixed(2),
      previousYearCaptureRate: month.previousYear.companyMetrics.overallCaptureRate.toFixed(2),
      percentageChange: month.percentageChange.toFixed(2),
      currentYearProfiles: month.currentYear.companyMetrics.totalProfiles,
      currentYearGuests: month.currentYear.companyMetrics.totalGuestCount,
      previousYearProfiles: month.previousYear.companyMetrics.totalProfiles,
      previousYearGuests: month.previousYear.companyMetrics.totalGuestCount
    }))

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)
  }

  generateDetailedAssociatesCSV(metrics: DataCaptureMetrics): string {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'associateName', title: 'Associate Name' },
        { id: 'profilesCreated', title: 'Profiles Created' },
        { id: 'manualProfiles', title: 'Manual Profiles' },
        { id: 'profilesWithEmail', title: 'With Email' },
        { id: 'profilesWithPhone', title: 'With Phone' },
        { id: 'profilesWithData', title: 'With Data' },
        { id: 'profilesWithDataNoWedding', title: 'With Data (No Wedding)' },
        { id: 'profilesWithSubscription', title: 'Subscribed' },
        { id: 'profilesWithWeddingTag', title: 'Wedding Leads' },
        { id: 'guestCount', title: 'Guest Count' },
        { id: 'totalOrders', title: 'Total Orders' },
        { id: 'captureRate', title: 'Capture Rate %' },
        { id: 'subscriptionRate', title: 'Subscription Rate %' },
        { id: 'dataCaptureEfficiency', title: 'Data Capture Efficiency' },
        { id: 'subscriptionEfficiency', title: 'Subscription Efficiency' }
      ]
    })

    const records = metrics.associates.map(a => {
      const dataCaptureEfficiency = a.guestCount > 0 ? 
        ((a.profilesWithData / a.guestCount) * 100).toFixed(2) + '%' : 'N/A'
      
      const subscriptionEfficiency = a.guestCount > 0 ? 
        ((a.profilesWithSubscription / a.guestCount) * 100).toFixed(2) + '%' : 'N/A'

      return {
        associateName: a.name,
        profilesCreated: a.profilesCreated,
        manualProfiles: a.manualProfiles,
        profilesWithEmail: a.profilesWithEmail,
        profilesWithPhone: a.profilesWithPhone,
        profilesWithData: a.profilesWithData,
        profilesWithDataNoWedding: a.profilesWithDataNoWedding,
        profilesWithSubscription: a.profilesWithSubscription,
        profilesWithWeddingTag: a.profilesWithWeddingTag,
        guestCount: a.guestCount,
        totalOrders: a.totalOrders,
        captureRate: a.captureRate.toFixed(2),
        subscriptionRate: a.subscriptionRate.toFixed(2),
        dataCaptureEfficiency,
        subscriptionEfficiency
      }
    })

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)
  }

  generateCombinedReportCSV(metrics: DataCaptureMetrics, reportType: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const summaryData = this.generateSummaryCSV(metrics)
    const associatesData = this.generateAssociatesCSV(metrics)
    
    return `${summaryData}\n\n--- ASSOCIATE DETAILS ---\n${associatesData}`
  }

  generateCSVBuffer(csvContent: string, filename?: string): Buffer {
    return Buffer.from(csvContent, 'utf-8')
  }

  generateEmailAttachment(csvContent: string, filename: string): any {
    return {
      filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
      content: Buffer.from(csvContent, 'utf-8'),
      contentType: 'text/csv'
    }
  }
}

export const csvGenerator = new CSVGenerator()
