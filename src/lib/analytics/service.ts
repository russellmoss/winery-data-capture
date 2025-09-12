import { commerce7Client } from '@/lib/commerce7/client'
import { startOfMonth, endOfMonth, subYears, format } from 'date-fns'
import { findBestAssociateMatch } from './nameMatching'

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
  manualProfiles: number
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
      if (sampleCustomer) {
        console.log(`  Customer ID: ${sampleCustomer.id}`)
        console.log(`  Name: ${sampleCustomer.firstName} ${sampleCustomer.lastName}`)
        console.log(`  Email: ${sampleCustomer.email}`)
        console.log(`  Emails array: ${JSON.stringify(sampleCustomer.emails)}`)
        console.log(`  Phones array: ${JSON.stringify(sampleCustomer.phones)}`)
        console.log(`  MetaData: ${JSON.stringify(sampleCustomer.metaData)}`)
        console.log(`  Tags: ${JSON.stringify(sampleCustomer.tags)}`)
        console.log(`  CreatedAt: ${sampleCustomer.createdAt}`)
      }
    }

    // Analyze orders and customers using Python script logic
    const { associateStats, guestCounts } = this.analyzeOrdersForDataCapture(
      orders, customers
    )

    // Calculate data capture rates using Python script logic
    const results = this.calculateDataCaptureRates(associateStats, guestCounts)

    // Convert to our interface format
    const associateMetrics: AssociateMetrics[] = results
      .filter(r => !r.associate.includes('***'))
      .map(r => ({
        name: r.associate,
        profilesCreated: r.newProfiles,
        manualProfiles: r.manualProfiles,
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
    customers: any[]
  ): { associateStats: Map<string, any>, guestCounts: Map<string, number> } {
    
    // Initialize data structures
    const associateStats = new Map<string, {
      profilesCreated: Set<string>
      profilesWithEmail: Set<string>
      profilesWithPhone: Set<string>
      profilesWithData: Set<string>
      profilesWithDataNoWedding: Set<string>
      profilesWithSubscription: Set<string>
      profilesWithWeddingTag: Set<string>
      manuallyCreatedProfiles: Set<string> // New: track manual creations
      totalOrders: number
    }>()

    const guestCounts = new Map<string, number>()
    const customersWithWeddingTag = new Set<string>()
    const manuallyCreatedCustomers = new Map<string, string>() // customerId -> associate name

    // First pass: identify all manually created customers with metadata
    console.log('Analytics: Checking for manually created profiles with associate attribution...')
    for (const customer of customers) {
      if (customer.metaData && customer.metaData['associate-sign-up-attribution']) {
        const attributedAssociate = customer.metaData['associate-sign-up-attribution']
        console.log(`  Found manual profile: ${customer.firstName} ${customer.lastName} attributed to "${attributedAssociate}"`)
        manuallyCreatedCustomers.set(customer.id, attributedAssociate)
      }
    }
    console.log(`Analytics: Found ${manuallyCreatedCustomers.size} manually created profiles with attribution`)

    // Get list of all known associates from orders
    const knownAssociates = new Set<string>()
    for (const order of orders) {
      const associateName = this.extractAssociateName(order)
      if (associateName !== 'Unknown') {
        knownAssociates.add(associateName)
      }
    }

    // Match metadata names to actual associates
    const metadataToAssociateMap = new Map<string, string>()
    for (const [customerId, metadataName] of manuallyCreatedCustomers.entries()) {
      const matchResult = findBestAssociateMatch(metadataName, Array.from(knownAssociates))
      if (matchResult) {
        console.log(`  Matched "${metadataName}" to "${matchResult.match}" (confidence: ${matchResult.confidence.toFixed(1)}%)`)
        metadataToAssociateMap.set(customerId, matchResult.match)
      } else {
        console.log(`  Could not match "${metadataName}" to any known associate`)
        metadataToAssociateMap.set(customerId, `Manual Entry - ${metadataName}`)
      }
    }

    // Process wedding tag customers
    for (const customer of customers) {
      if (customer.tags && Array.isArray(customer.tags)) {
        const hasWeddingTag = customer.tags.some((tag: any) => 
          tag.id === WEDDING_LEAD_TAG_ID || 
          (typeof tag === 'string' && tag === WEDDING_LEAD_TAG_ID)
        )
        if (hasWeddingTag) {
          customersWithWeddingTag.add(customer.id)
        }
      }
    }

    // Track which customers are associated with which associates through orders
    const customerToAssociate = new Map<string, string>()
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderPaidDate || a.orderDate || 0).getTime()
      const dateB = new Date(b.orderPaidDate || b.orderDate || 0).getTime()
      return dateA - dateB
    })

    // Process orders
    for (const order of sortedOrders) {
      const associateName = this.extractAssociateName(order)
      const customer = order.customer
      const customerId = customer?.id

      if (customerId && !customerToAssociate.has(customerId)) {
        // Check if this customer was manually created first
        if (metadataToAssociateMap.has(customerId)) {
          // Use the attributed associate from metadata
          customerToAssociate.set(customerId, metadataToAssociateMap.get(customerId)!)
        } else {
          // Use the order's associate
          customerToAssociate.set(customerId, associateName)
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
          manuallyCreatedProfiles: new Set(),
          totalOrders: 0
        })
      }

      // Track orders for this associate
      associateStats.get(associateName)!.totalOrders++

      // Count guest count from items
      const items = order.items || []
      for (const item of items) {
        if (item.productId === GUEST_COUNT_SKU_ID) {
          const quantity = item.quantity || 0
          guestCounts.set(associateName, (guestCounts.get(associateName) || 0) + quantity)
        }
      }
    }

    // Process all customers for data capture metrics
    for (const customer of customers) {
      const customerId = customer.id
      if (!customerId) continue

      // Determine the associate for this customer
      let associateName: string
      if (metadataToAssociateMap.has(customerId)) {
        // This was a manually created profile
        associateName = metadataToAssociateMap.get(customerId)!
      } else if (customerToAssociate.has(customerId)) {
        // This customer has orders
        associateName = customerToAssociate.get(customerId)!
      } else {
        // Customer has no orders and no metadata
        if (customersWithWeddingTag.has(customerId)) {
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
          manuallyCreatedProfiles: new Set(),
          totalOrders: 0
        })
      }

      const stats = associateStats.get(associateName)!

      // Check data capture
      const customerEmails = this.extractCustomerEmails(customer)
      const customerPhones = this.extractCustomerPhones(customer)
      const hasEmail = customerEmails.length > 0
      const hasPhone = customerPhones.length > 0
      const isSubscribed = customer.emailMarketingStatus === "Subscribed"
      const hasWeddingTag = customersWithWeddingTag.has(customerId)

      // Track the profile
      stats.profilesCreated.add(customerId)
      
      // Track if manually created
      if (manuallyCreatedCustomers.has(customerId)) {
        stats.manuallyCreatedProfiles.add(customerId)
      }

      if (hasEmail) {
        stats.profilesWithEmail.add(customerId)
        stats.profilesWithData.add(customerId)
        if (!hasWeddingTag) {
          stats.profilesWithDataNoWedding.add(customerId)
        }
      }

      if (hasPhone) {
        stats.profilesWithPhone.add(customerId)
        stats.profilesWithData.add(customerId)
        if (!hasWeddingTag) {
          stats.profilesWithDataNoWedding.add(customerId)
        }
      }

      if (isSubscribed) {
        stats.profilesWithSubscription.add(customerId)
      }

      if (hasWeddingTag) {
        stats.profilesWithWeddingTag.add(customerId)
      }
    }

    // Log summary of manual attributions
    const manualAttributionSummary = new Map<string, number>()
    for (const associate of associateStats.keys()) {
      const manualCount = associateStats.get(associate)!.manuallyCreatedProfiles.size
      if (manualCount > 0) {
        manualAttributionSummary.set(associate, manualCount)
      }
    }
    
    if (manualAttributionSummary.size > 0) {
      console.log('\nAnalytics: Manual Profile Attribution Summary:')
      for (const [associate, count] of manualAttributionSummary.entries()) {
        console.log(`  ${associate}: ${count} manually created profiles`)
      }
    }

    // Convert sets to counts
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
        manuallyCreatedProfiles: stats.manuallyCreatedProfiles.size,
        totalOrders: stats.totalOrders
      })
    }

    // Debug output
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

    return { associateStats: finalStats, guestCounts }
  }

  private calculateDataCaptureRates(
    associateStats: Map<string, any>,
    guestCounts: Map<string, number>
  ): Array<{
    associate: string
    newProfiles: number
    manualProfiles: number
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
      if (associate.includes('***')) continue
      
      const stats = associateStats.get(associate) || {
        profilesCreated: 0,
        profilesWithEmail: 0,
        profilesWithPhone: 0,
        profilesWithData: 0,
        profilesWithDataNoWedding: 0,
        profilesWithSubscription: 0,
        profilesWithWeddingTag: 0,
        manuallyCreatedProfiles: 0,
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
        manualProfiles: stats.manuallyCreatedProfiles, // New field
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
      manualProfiles: associatesWithGuests.reduce((sum, r) => sum + r.manualProfiles, 0),
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
      manualProfiles: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.manualProfiles, 0),
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
      manualProfiles: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.manualProfiles, 0),
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

  // Add helper method for extracting associate name
  private extractAssociateName(order: any): string {
    if (order.salesAssociate) {
      if (typeof order.salesAssociate === 'object' && order.salesAssociate.name) {
        return order.salesAssociate.name
      } else if (typeof order.salesAssociate === 'string') {
        return order.salesAssociate
      }
    }
    return 'Unknown'
  }

  // Add helper methods for extracting customer data
  private extractCustomerEmails(customer: any): string[] {
    const emails = []
    if (customer.emails && Array.isArray(customer.emails)) {
      emails.push(...customer.emails.map((e: any) => e.email || e))
    }
    if (customer.email && !emails.includes(customer.email)) {
      emails.push(customer.email)
    }
    return emails.filter(e => e)
  }

  private extractCustomerPhones(customer: any): string[] {
    const phones = []
    if (customer.phones && Array.isArray(customer.phones)) {
      phones.push(...customer.phones.map((p: any) => p.phone || p))
    }
    if (customer.phone && !phones.includes(customer.phone)) {
      phones.push(customer.phone)
    }
    return phones.filter(p => p)
  }
}

export const analyticsService = new AnalyticsService()