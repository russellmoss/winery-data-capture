import { commerce7Client } from '@/lib/commerce7/client'
import { startOfMonth, endOfMonth, subYears, format } from 'date-fns'

// Constants from Commerce7 - matching tasting_room_data_capture.py exactly
const GUEST_COUNT_SKU_ID = "7a5d9556-33e4-4d97-a3e8-37adefc6dcf0"
const WEDDING_LEAD_TAG_ID = "7c3b92b9-e048-4f5d-b156-e2d52c2779a6" // Without tag/ prefix to match Python script

export interface DataCaptureMetrics {
  period: string
  startDate: Date
  endDate: Date
  associates: AssociateMetrics[]
  companyMetrics: CompanyMetrics
}

export interface AssociateMetrics {
  name: string
  profilesCreated: number
  profilesWithEmail: number
  profilesWithPhone: number
  profilesWithData: number
  profilesWithDataNoWedding: number
  profilesWithSubscription: number
  profilesWithWeddingTag: number
  guestCount: number
  captureRate: number
  subscriptionRate: number
  totalOrders: number
}

export interface CompanyMetrics {
  totalProfiles: number
  totalProfilesWithData: number
  totalGuestCount: number
  overallCaptureRate: number
  profilesWithWeddingLeadTag: number
  captureRateExcludingWeddingLeads: number
  // Python script metrics
  associateDataCaptureRate: number
  companyDataCaptureRate: number
  companyDataCaptureRateLessWeddings: number
}

export interface MonthlyComparison {
  month: string
  currentYear: DataCaptureMetrics
  previousYear: DataCaptureMetrics
  percentageChange: number
}

class AnalyticsService {
  async getDataCaptureMetrics(startDate: Date, endDate: Date): Promise<DataCaptureMetrics> {
    console.log(`Analytics: Starting data capture metrics for ${startDate.toISOString()} to ${endDate.toISOString()}`)
    console.log(`Analytics: Looking for wedding lead tag ID: ${WEDDING_LEAD_TAG_ID}`)
    
    // Fetch both orders and customers for the period
    const [orders, customers] = await Promise.all([
      commerce7Client.getOrdersByDateRange(startDate, endDate),
      commerce7Client.getCustomersByDateRange(startDate, endDate)
    ])
    
    console.log(`Analytics: Fetched ${orders.length} orders and ${customers.length} customers`)
    
    // Debug: Log sample customer data to understand structure
    if (customers.length > 0) {
      console.log('Analytics: Sample customer data structure:')
      const sampleCustomer = customers[0]
      console.log(`  Customer ID: ${sampleCustomer.id}`)
      console.log(`  Name: ${sampleCustomer.firstName} ${sampleCustomer.lastName}`)
      console.log(`  Email: ${sampleCustomer.email}`)
      console.log(`  Emails array: ${JSON.stringify(sampleCustomer.emails)}`)
      console.log(`  Phones array: ${JSON.stringify(sampleCustomer.phones)}`)
      console.log(`  MetaData: ${JSON.stringify(sampleCustomer.metaData)}`)
      console.log(`  Tags: ${JSON.stringify(sampleCustomer.tags)}`)
      console.log(`  CreatedAt: ${sampleCustomer.createdAt}`)
    }

    // Analyze orders and customers using Python script logic
    const { associateStats, guestCounts, customersWithWeddingTag } = this.analyzeOrdersForDataCapture(
      orders, customers, startDate, endDate
    )

    // Calculate data capture rates using Python script logic
    const results = this.calculateDataCaptureRates(associateStats, guestCounts, customersWithWeddingTag)

    // Convert to our interface format
    const associateMetrics: AssociateMetrics[] = results
      .filter(r => !r.associate.includes('***'))
      .map(r => ({
        name: r.associate,
        profilesCreated: r.newProfiles,
        profilesWithEmail: r.withEmail,
        profilesWithPhone: r.withPhone,
        profilesWithData: r.withData,
        profilesWithDataNoWedding: r.withDataNoWedding,
        profilesWithSubscription: r.subscribed,
        profilesWithWeddingTag: r.weddingLeads,
        guestCount: r.guestCount,
        captureRate: r.captureRate,
        subscriptionRate: r.subscriptionRate,
        totalOrders: r.totalOrders
      }))

    // Get aggregate metrics
    const associateTotal = results.find(r => r.associate === '*** ASSOCIATE DATA CAPTURE RATE ***')
    const companyTotal = results.find(r => r.associate === '*** COMPANY DATA CAPTURE RATE ***')
    const companyLessWedding = results.find(r => r.associate === '*** COMPANY DATA CAPTURE RATE LESS WEDDING LEADS ***')

    const companyMetrics: CompanyMetrics = {
      totalProfiles: companyTotal?.newProfiles || 0,
      totalProfilesWithData: companyTotal?.withData || 0,
      totalGuestCount: companyTotal?.guestCount || 0,
      overallCaptureRate: companyTotal?.captureRate || 0,
      profilesWithWeddingLeadTag: companyTotal?.weddingLeads || 0,
      captureRateExcludingWeddingLeads: companyLessWedding?.captureRate || 0,
      // Python script metrics
      associateDataCaptureRate: associateTotal?.captureRate || 0,
      companyDataCaptureRate: companyTotal?.captureRate || 0,
      companyDataCaptureRateLessWeddings: companyLessWedding?.captureRate || 0
    }

    return {
      period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      startDate,
      endDate,
      associates: associateMetrics.sort((a, b) => b.captureRate - a.captureRate),
      companyMetrics
    }
  }

  private analyzeOrdersForDataCapture(
    orders: any[],
    customers: any[],
    startDate: Date,
    endDate: Date
  ): { associateStats: Map<string, any>, guestCounts: Map<string, number>, customersWithWeddingTag: Set<string> } {
    
    // Initialize data structures matching Python script
    const associateStats = new Map<string, {
      profilesCreated: Set<string>
      profilesWithEmail: Set<string>
      profilesWithPhone: Set<string>
      profilesWithData: Set<string>
      profilesWithDataNoWedding: Set<string>
      profilesWithSubscription: Set<string>
      profilesWithWeddingTag: Set<string>
      totalOrders: number
    }>()

    const guestCounts = new Map<string, number>()
    const customersSeen = new Map<string, { firstOrderDate: string, associate: string }>()
    const customersWithWeddingTag = new Set<string>()

    // First, check all customers for wedding tags (matching Python logic)
    console.log(`Analytics: Checking ${customers.length} customers for wedding lead tags...`)
    for (const customer of customers) {
      if (customer.tags) {
        for (const tag of customer.tags) {
          if (tag.id === WEDDING_LEAD_TAG_ID) {
            customersWithWeddingTag.add(customer.id)
            break
          }
        }
      }
    }

    // Create a mapping of customer_id to their first associate (from orders)
    const customerToAssociate = new Map<string, string>()
    const sortedOrders = orders.sort((a, b) => 
      new Date(a.orderPaidDate).getTime() - new Date(b.orderPaidDate).getTime()
    )

    console.log(`Analytics: Analyzing ${sortedOrders.length} orders to map customers to associates...`)

    for (const order of sortedOrders) {
      // Get associate name (matching Python logic)
      let associateName = "Unknown"
      if (order.salesAssociate) {
        if (typeof order.salesAssociate === 'object' && order.salesAssociate.name) {
          associateName = order.salesAssociate.name
        } else if (typeof order.salesAssociate === 'string') {
          associateName = order.salesAssociate
        }
      }

      // Get customer info - handle None customer field
      const customer = order.customer || {}
      const customerId = customer.id

      // Map customer to their first associate (chronologically)
      if (customerId && !customerToAssociate.has(customerId)) {
        customerToAssociate.set(customerId, associateName)
      }

      // Initialize associate stats if needed
      if (!associateStats.has(associateName)) {
        associateStats.set(associateName, {
          profilesCreated: new Set(),
          profilesWithEmail: new Set(),
          profilesWithPhone: new Set(),
          profilesWithData: new Set(),
          profilesWithDataNoWedding: new Set(),
          profilesWithSubscription: new Set(),
          profilesWithWeddingTag: new Set(),
          totalOrders: 0
        })
      }

      // Track orders for this associate
      associateStats.get(associateName)!.totalOrders++

      // Count guest count from items (matching Python logic)
      const items = order.items || []
      for (const item of items) {
        if (item.productId === GUEST_COUNT_SKU_ID) {
          const quantity = item.quantity || 0
          guestCounts.set(associateName, (guestCounts.get(associateName) || 0) + quantity)
        }
      }

      // Also check direct guestCount field if it exists
      if (order.guestCount) {
        guestCounts.set(associateName, (guestCounts.get(associateName) || 0) + order.guestCount)
      }
    }

    // Now process ALL customers (not just those with orders) - matching Python logic
    console.log(`Analytics: Processing ${customers.length} customers for data capture...`)

    for (const customer of customers) {
      const customerId = customer.id
      if (!customerId) continue

      // Check emails and phones - handle both single fields and arrays (matching Python)
      let customerEmails = customer.emails || []
      let customerPhones = customer.phones || []

      // Also check single email/phone fields for backwards compatibility
      if (customer.email && customerEmails.length === 0) {
        customerEmails = [customer.email]
      }
      if (customer.phone && customerPhones.length === 0) {
        customerPhones = [customer.phone]
      }

      // Check email marketing status
      const emailMarketingStatus = customer.emailMarketingStatus || ""
      const hasEmail = customerEmails.length > 0
      const hasPhone = customerPhones.length > 0
      const isSubscribed = emailMarketingStatus === "Subscribed"

      // Check if this customer has wedding tag
      const hasWeddingTag = customersWithWeddingTag.has(customerId)

      // Determine which associate this customer belongs to (matching Python logic)
      let associateName: string
      if (customerToAssociate.has(customerId)) {
        associateName = customerToAssociate.get(customerId)!
      } else {
        // Customer has no orders - attribute to company
        if (hasWeddingTag) {
          associateName = "Wedding Leads (No Orders)"
        } else {
          associateName = "Company (No Orders)"
        }
      }

      // Initialize associate stats if needed
      if (!associateStats.has(associateName)) {
        associateStats.set(associateName, {
          profilesCreated: new Set(),
          profilesWithEmail: new Set(),
          profilesWithPhone: new Set(),
          profilesWithData: new Set(),
          profilesWithDataNoWedding: new Set(),
          profilesWithSubscription: new Set(),
          profilesWithWeddingTag: new Set(),
          totalOrders: 0
        })
      }

      const stats = associateStats.get(associateName)!

      // Count as new profile for this associate/company
      stats.profilesCreated.add(customerId)

      // Check for data capture (matching Python logic)
      if (hasEmail) {
        stats.profilesWithEmail.add(customerId)
        stats.profilesWithData.add(customerId)
        // Also track non-wedding leads separately
        if (!hasWeddingTag) {
          stats.profilesWithDataNoWedding.add(customerId)
        }
      }

      if (hasPhone) {
        stats.profilesWithPhone.add(customerId)
        if (!stats.profilesWithData.has(customerId)) {
          stats.profilesWithData.add(customerId)
          // Also track non-wedding leads separately
          if (!hasWeddingTag) {
            stats.profilesWithDataNoWedding.add(customerId)
          }
        }
      }

      // Check for email subscription
      if (isSubscribed) {
        stats.profilesWithSubscription.add(customerId)
      }

      // Track wedding leads
      if (hasWeddingTag) {
        stats.profilesWithWeddingTag.add(customerId)
      }
    }

    // Convert sets to counts (matching Python logic)
    const finalStats = new Map<string, any>()
    for (const [associate, stats] of associateStats.entries()) {
      finalStats.set(associate, {
        profilesCreated: stats.profilesCreated.size,
        profilesWithEmail: stats.profilesWithEmail.size,
        profilesWithPhone: stats.profilesWithPhone.size,
        profilesWithData: stats.profilesWithData.size,
        profilesWithDataNoWedding: stats.profilesWithDataNoWedding.size,
        profilesWithSubscription: stats.profilesWithSubscription.size,
        profilesWithWeddingTag: stats.profilesWithWeddingTag.size,
        totalOrders: stats.totalOrders
      })
    }

    // Debug output (matching Python script)
    console.log(`Analytics: Processed ${customers.length} total customers`)
    console.log(`Analytics: Found ${customersWithWeddingTag.size} customers with wedding lead tag`)
    console.log(`Analytics: Customers with orders: ${customerToAssociate.size}`)
    console.log(`Analytics: Associates/companies with data: ${finalStats.size}`)

    // Debug guest counts
    const totalGuestCount = Array.from(guestCounts.values()).reduce((sum, count) => sum + count, 0)
    console.log(`Analytics: Total guest count tracked: ${totalGuestCount}`)
    if (totalGuestCount === 0) {
      console.log("Analytics: WARNING: No guest counts found! Check if guest SKUs are being used in orders.")
    }

    return { associateStats: finalStats, guestCounts, customersWithWeddingTag }
  }

  private calculateDataCaptureRates(
    associateStats: Map<string, any>,
    guestCounts: Map<string, number>,
    customersWithWeddingTag: Set<string>
  ): Array<{
    associate: string
    newProfiles: number
    withEmail: number
    withPhone: number
    withData: number
    withDataNoWedding: number
    subscribed: number
    weddingLeads: number
    totalOrders: number
    guestCount: number
    captureRate: number
    subscriptionRate: number
  }> {
    const results: Array<any> = []

    // Get all associates from both sources (matching Python logic)
    const allAssociates = new Set([...associateStats.keys(), ...guestCounts.keys()])

    for (const associate of allAssociates) {
      const stats = associateStats.get(associate) || {
        profilesCreated: 0,
        profilesWithEmail: 0,
        profilesWithPhone: 0,
        profilesWithData: 0,
        profilesWithDataNoWedding: 0,
        profilesWithSubscription: 0,
        profilesWithWeddingTag: 0,
        totalOrders: 0
      }

      const guestCount = guestCounts.get(associate) || 0

      // Calculate capture rate (matching Python logic)
      let captureRate = 0.0
      let subscriptionRate = 0.0
      if (guestCount > 0) {
        captureRate = (stats.profilesWithData / guestCount) * 100
        subscriptionRate = (stats.profilesWithSubscription / guestCount) * 100
      }

      results.push({
        associate,
        newProfiles: stats.profilesCreated,
        withEmail: stats.profilesWithEmail,
        withPhone: stats.profilesWithPhone,
        withData: stats.profilesWithData,
        withDataNoWedding: stats.profilesWithDataNoWedding,
        subscribed: stats.profilesWithSubscription,
        weddingLeads: stats.profilesWithWeddingTag,
        totalOrders: stats.totalOrders,
        guestCount,
        captureRate: Math.round(captureRate * 100) / 100,
        subscriptionRate: Math.round(subscriptionRate * 100) / 100
      })
    }

    // Sort by capture rate descending (matching Python logic)
    results.sort((a, b) => b.captureRate - a.captureRate)

    // Calculate Associate Data Capture Rate (only for associates with guest count > 0)
    const associatesWithGuests = results.filter(r => r.guestCount > 0)
    let associateProfilesWithData = 0
    let associateProfilesWithSubscription = 0
    let associateTotalGuests = 0
    let associateCaptureRate = 0
    let associateSubscriptionRate = 0

    if (associatesWithGuests.length > 0) {
      associateProfilesWithData = associatesWithGuests.reduce((sum, r) => sum + r.withData, 0)
      associateProfilesWithSubscription = associatesWithGuests.reduce((sum, r) => sum + r.subscribed, 0)
      associateTotalGuests = associatesWithGuests.reduce((sum, r) => sum + r.guestCount, 0)
      associateCaptureRate = associateTotalGuests > 0 ? (associateProfilesWithData / associateTotalGuests * 100) : 0
      associateSubscriptionRate = associateTotalGuests > 0 ? (associateProfilesWithSubscription / associateTotalGuests * 100) : 0
    }

    // Calculate Company Data Capture Rate (all associates)
    const totalProfilesWithData = results.reduce((sum, r) => sum + r.withData, 0)
    const totalProfilesWithSubscription = results.reduce((sum, r) => sum + r.subscribed, 0)
    const totalGuests = results.reduce((sum, r) => sum + r.guestCount, 0)
    const totalWeddingLeads = results.reduce((sum, r) => sum + r.weddingLeads, 0)
    const companyCaptureRate = totalGuests > 0 ? (totalProfilesWithData / totalGuests * 100) : 0
    const companySubscriptionRate = totalGuests > 0 ? (totalProfilesWithSubscription / totalGuests * 100) : 0

    // Calculate Company Data Capture Rate LESS Wedding Leads
    // Use the profilesWithDataNoWedding field which excludes wedding leads from associate performance
    const totalProfilesWithDataNoWedding = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithDataNoWedding || 0), 0)
    const companyCaptureRateLessWeddings = totalGuests > 0 ? (totalProfilesWithDataNoWedding / totalGuests * 100) : 0

    // Add aggregate rows (matching Python script exactly)
    results.push({
      associate: "*** ASSOCIATE DATA CAPTURE RATE ***",
      newProfiles: associatesWithGuests.reduce((sum, r) => sum + r.newProfiles, 0),
      withEmail: associatesWithGuests.reduce((sum, r) => sum + r.withEmail, 0),
      withPhone: associatesWithGuests.reduce((sum, r) => sum + r.withPhone, 0),
      withData: associateProfilesWithData,
      withDataNoWedding: associateProfilesWithData, // Associates don't track this separately
      subscribed: associateProfilesWithSubscription,
      weddingLeads: associatesWithGuests.reduce((sum, r) => sum + r.weddingLeads, 0),
      totalOrders: associatesWithGuests.reduce((sum, r) => sum + r.totalOrders, 0),
      guestCount: associateTotalGuests,
      captureRate: Math.round(associateCaptureRate * 100) / 100,
      subscriptionRate: Math.round(associateSubscriptionRate * 100) / 100
    })

    results.push({
      associate: "*** COMPANY DATA CAPTURE RATE ***",
      newProfiles: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.newProfiles, 0),
      withEmail: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.withEmail, 0),
      withPhone: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.withPhone, 0),
      withData: totalProfilesWithData,
      withDataNoWedding: totalProfilesWithData, // Company total includes all
      subscribed: totalProfilesWithSubscription,
      weddingLeads: totalWeddingLeads,
      totalOrders: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.totalOrders, 0),
      guestCount: totalGuests,
      captureRate: Math.round(companyCaptureRate * 100) / 100,
      subscriptionRate: Math.round(companySubscriptionRate * 100) / 100
    })

    results.push({
      associate: "*** COMPANY DATA CAPTURE RATE LESS WEDDING LEADS ***",
      newProfiles: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.newProfiles, 0),
      withEmail: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.withEmail, 0),
      withPhone: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.withPhone, 0),
      withData: totalProfilesWithDataNoWedding,
      withDataNoWedding: totalProfilesWithDataNoWedding,
      subscribed: totalProfilesWithSubscription,
      weddingLeads: 0, // By definition, this excludes wedding leads
      totalOrders: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.totalOrders, 0),
      guestCount: totalGuests,
      captureRate: Math.round(companyCaptureRateLessWeddings * 100) / 100,
      subscriptionRate: Math.round(companySubscriptionRate * 100) / 100
    })

    return results
  }

  async getYearOverYearComparison(): Promise<MonthlyComparison[]> {
    const currentYear = new Date().getFullYear()
    const comparisons: MonthlyComparison[] = []

    for (let month = 0; month < 12; month++) {
      const currentYearStart = startOfMonth(new Date(currentYear, month, 1))
      const currentYearEnd = endOfMonth(currentYearStart)
      
      const previousYearStart = subYears(currentYearStart, 1)
      const previousYearEnd = subYears(currentYearEnd, 1)

      // Skip future months
      if (currentYearStart > new Date()) break

      const [currentMetrics, previousMetrics] = await Promise.all([
        this.getDataCaptureMetrics(currentYearStart, currentYearEnd),
        this.getDataCaptureMetrics(previousYearStart, previousYearEnd)
      ])

      const percentageChange = previousMetrics.companyMetrics.overallCaptureRate > 0
        ? Number((((currentMetrics.companyMetrics.overallCaptureRate - previousMetrics.companyMetrics.overallCaptureRate) / 
            previousMetrics.companyMetrics.overallCaptureRate) * 100).toFixed(2))
        : 0

      comparisons.push({
        month: format(currentYearStart, 'MMMM'),
        currentYear: currentMetrics,
        previousYear: previousMetrics,
        percentageChange
      })
    }

    return comparisons
  }
}

export const analyticsService = new AnalyticsService()