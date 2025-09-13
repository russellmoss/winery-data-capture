import { commerce7Client } from '@/lib/commerce7/client'
import { startOfMonth, endOfMonth, subYears, format } from 'date-fns'
import { findBestAssociateMatch } from './nameMatching'
import { C7Order, C7Customer } from '@/lib/commerce7/types'
import { createClient } from '../supabase/server'
import { getWeddingSettings, WeddingSettings } from '@/lib/settings/wedding-settings'

// Extended customer type for analytics with email marketing status
interface C7CustomerWithMarketing extends C7Customer {
  emailMarketingStatus?: string
}

interface AssociateStats {
  profilesCreated: Set<string>
  profilesWithEmail: Set<string>
  profilesWithPhone: Set<string>
  profilesWithData: Set<string>
  profilesWithDataNoWedding: Set<string>
  profilesWithSubscription: Set<string>
  profilesWithSubscriptionNoWedding: Set<string>
  profilesWithWeddingTag: Set<string>
  manuallyCreatedProfiles: Set<string>
  totalOrders: number
}

interface FinalStats {
  profilesCreated: number
  profilesWithEmail: number
  profilesWithPhone: number
  profilesWithData: number
  profilesWithDataNoWedding: number
  profilesWithSubscription: number
  profilesWithSubscriptionNoWedding: number
  profilesWithWeddingTag: number
  manuallyCreatedProfiles: number
  totalOrders: number
}

// Constants from Commerce7 - matching tasting_room_data_capture.py exactly
// Note: GUEST_COUNT_SKU_ID is now configurable via database, see getGuestCountSkus()
const WEDDING_LEAD_TAG_ID = "7c3b92b9-e048-4f5d-b156-e2d52c2779a6" // Without tag/ prefix to match Python script

// Interface for guest count SKU configuration (used in getGuestCountSkus function)
interface GuestCountSKU {
  id: string
  name: string
  sku_id: string
}

// Function to fetch guest count SKUs from database
async function getGuestCountSkus(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('guest_count_skus')
      .select('sku_id')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching guest count SKUs:', error)
      // Fallback to hardcoded SKU if database fails
      return ["7a5d9556-33e4-4d97-a3e8-37adefc6dcf0"]
    }

    if (!data || data.length === 0) {
      console.warn('No guest count SKUs configured, using fallback')
      // Fallback to hardcoded SKU if none configured
      return ["7a5d9556-33e4-4d97-a3e8-37adefc6dcf0"]
    }

    return data.map(sku => sku.sku_id)
  } catch (error) {
    console.error('Error fetching guest count SKUs:', error)
    // Fallback to hardcoded SKU if database fails
    return ["7a5d9556-33e4-4d97-a3e8-37adefc6dcf0"]
  }
}

export interface DataCaptureMetrics {
  period: string
  startDate: Date
  endDate: Date
  associates: AssociateMetrics[]
  companyMetrics: CompanyMetrics
  weddingSettings: WeddingSettings
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
  totalProfilesWithSubscription: number
  totalGuestCount: number
  overallCaptureRate: number
  overallSubscriptionRate: number
  profilesWithWeddingLeadTag: number
  captureRateExcludingWeddingLeads: number
  subscriptionRateExcludingWeddingLeads: number
  // Python script metrics
  associateDataCaptureRate: number
  associateDataSubscriptionRate: number
  companyDataCaptureRate: number
  companyDataSubscriptionRate: number
  companyDataCaptureRateLessWeddings: number
  companyDataSubscriptionRateLessWeddings: number
}

export interface MonthlyComparison {
  month: string
  currentYear: DataCaptureMetrics
  previousYear: DataCaptureMetrics
  percentageChange: number
}

class AnalyticsService {
  async getDataCaptureMetrics(startDate: Date, endDate: Date): Promise<DataCaptureMetrics> {
    console.log(`Analytics: Starting data processing for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    
    // Fetch both orders and customers for the period
    console.log('Analytics: Fetching orders and customers in parallel...')
    const [orders, customers] = await Promise.all([
      commerce7Client.getOrdersByDateRange(startDate, endDate),
      commerce7Client.getCustomersByDateRange(startDate, endDate)
    ])
    
    console.log(`Analytics: Data fetch complete - ${orders.length} orders, ${customers.length} customers`)

    // Fetch configurable guest count SKUs
    console.log('Analytics: Fetching guest count SKU configuration...')
    const guestCountSkus = await getGuestCountSkus()
    console.log(`Analytics: Using ${guestCountSkus.length} guest count SKUs:`, guestCountSkus)

    // Analyze orders and customers using Python script logic
    console.log('Analytics: Starting data analysis...')
    const { associateStats, guestCounts } = this.analyzeOrdersForDataCapture(
      orders, customers, guestCountSkus
    )

    // Calculate data capture rates using Python script logic
    console.log('Analytics: Calculating capture rates...')
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
      totalProfilesWithSubscription: companyTotal?.subscribed || 0,
      totalGuestCount: companyTotal?.guestCount || 0,
      overallCaptureRate: companyTotal?.captureRate || 0,
      overallSubscriptionRate: companyTotal?.subscriptionRate || 0,
      profilesWithWeddingLeadTag: companyTotal?.weddingLeads || 0,
      captureRateExcludingWeddingLeads: companyLessWedding?.captureRate || 0,
      subscriptionRateExcludingWeddingLeads: companyLessWedding?.subscriptionRate || 0,
      // Python script metrics
      associateDataCaptureRate: associateTotal?.captureRate || 0,
      associateDataSubscriptionRate: associateTotal?.subscriptionRate || 0,
      companyDataCaptureRate: companyTotal?.captureRate || 0,
      companyDataSubscriptionRate: companyTotal?.subscriptionRate || 0,
      companyDataCaptureRateLessWeddings: companyLessWedding?.captureRate || 0,
      companyDataSubscriptionRateLessWeddings: companyLessWedding?.subscriptionRate || 0
    }

    console.log(`Analytics: Processing complete - ${associateMetrics.length} associates analyzed`)
    
    // Fetch wedding settings
    console.log('Analytics: Fetching wedding settings...')
    const weddingSettings = await getWeddingSettings()
    
    return {
      period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      startDate,
      endDate,
      associates: associateMetrics.sort((a, b) => b.captureRate - a.captureRate),
      companyMetrics,
      weddingSettings
    }
  }

  private analyzeOrdersForDataCapture(
    orders: C7Order[],
    customers: C7Customer[],
    guestCountSkus: string[]
  ): { associateStats: Map<string, FinalStats>, guestCounts: Map<string, number> } {
    
    // Initialize data structures
    const associateStats = new Map<string, AssociateStats>()

    const guestCounts = new Map<string, number>()
    const customersWithWeddingTag = new Set<string>()
    const manuallyCreatedCustomers = new Map<string, string>() // customerId -> associate name

    // First pass: identify all manually created customers with metadata
    for (const customer of customers) {
      if (customer.metaData && customer.metaData['associate-sign-up-attribution']) {
        const attributedAssociate = customer.metaData['associate-sign-up-attribution']
        if (customer.id) {
          manuallyCreatedCustomers.set(customer.id, attributedAssociate)
        }
      }
    }

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
    for (const [customerId, metadataName] of Array.from(manuallyCreatedCustomers.entries())) {
      const matchResult = findBestAssociateMatch(metadataName, Array.from(knownAssociates))
      if (matchResult) {
        metadataToAssociateMap.set(customerId, matchResult.match)
      } else {
        metadataToAssociateMap.set(customerId, `Manual Entry - ${metadataName}`)
      }
    }

    // Process wedding tag customers
    for (const customer of customers) {
      if (customer.tags && Array.isArray(customer.tags)) {
        const hasWeddingTag = customer.tags.some((tag) => 
          (typeof tag === 'object' && tag.id === WEDDING_LEAD_TAG_ID) || 
          (typeof tag === 'string' && tag === WEDDING_LEAD_TAG_ID)
        )
        if (hasWeddingTag && customer.id) {
          customersWithWeddingTag.add(customer.id)
        }
      }
    }

    // Track which customers are associated with which associates through orders
    const customerToAssociate = new Map<string, string>()
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderPaidDate || a.orderSubmittedDate || 0).getTime()
      const dateB = new Date(b.orderPaidDate || b.orderSubmittedDate || 0).getTime()
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
          profilesCreated: new Set<string>(),
          profilesWithEmail: new Set<string>(),
          profilesWithPhone: new Set<string>(),
          profilesWithData: new Set<string>(),
          profilesWithDataNoWedding: new Set<string>(),
          profilesWithSubscription: new Set<string>(),
          profilesWithSubscriptionNoWedding: new Set<string>(),
          profilesWithWeddingTag: new Set<string>(),
          manuallyCreatedProfiles: new Set<string>(),
          totalOrders: 0
        })
      }

      // Track orders for this associate
      associateStats.get(associateName)!.totalOrders++

      // Count guest count from items using configurable SKUs
      const items = order.items || []
      for (const item of items) {
        if (guestCountSkus.includes(item.productId)) {
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
          profilesCreated: new Set<string>(),
          profilesWithEmail: new Set<string>(),
          profilesWithPhone: new Set<string>(),
          profilesWithData: new Set<string>(),
          profilesWithDataNoWedding: new Set<string>(),
          profilesWithSubscription: new Set<string>(),
          profilesWithSubscriptionNoWedding: new Set<string>(),
          profilesWithWeddingTag: new Set<string>(),
          manuallyCreatedProfiles: new Set<string>(),
          totalOrders: 0
        })
      }

      const stats = associateStats.get(associateName)!

      // Check data capture
      const customerEmails = this.extractCustomerEmails(customer)
      const customerPhones = this.extractCustomerPhones(customer)
      const hasEmail = customerEmails.length > 0
      const hasPhone = customerPhones.length > 0
      const isSubscribed = (customer as C7CustomerWithMarketing).emailMarketingStatus === "Subscribed"
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
        if (!hasWeddingTag) {
          stats.profilesWithSubscriptionNoWedding.add(customerId)
        }
      }

      if (hasWeddingTag) {
        stats.profilesWithWeddingTag.add(customerId)
      }
    }

    // Track manual attributions (removed logging for performance)
    const manualAttributionSummary = new Map<string, number>()
    for (const associate of Array.from(associateStats.keys())) {
      const manualCount = associateStats.get(associate)!.manuallyCreatedProfiles.size
      if (manualCount > 0) {
        manualAttributionSummary.set(associate, manualCount)
      }
    }

    // Convert sets to counts
    const finalStats = new Map<string, FinalStats>()
    for (const [associate, stats] of Array.from(associateStats.entries())) {
      finalStats.set(associate, {
        profilesCreated: stats.profilesCreated.size,
        profilesWithEmail: stats.profilesWithEmail.size,
        profilesWithPhone: stats.profilesWithPhone.size,
        profilesWithData: stats.profilesWithData.size,
        profilesWithDataNoWedding: stats.profilesWithDataNoWedding.size,
        profilesWithSubscription: stats.profilesWithSubscription.size,
        profilesWithSubscriptionNoWedding: stats.profilesWithSubscriptionNoWedding.size,
        profilesWithWeddingTag: stats.profilesWithWeddingTag.size,
        manuallyCreatedProfiles: stats.manuallyCreatedProfiles.size,
        totalOrders: stats.totalOrders
      })
    }

    // Basic validation (minimal logging)
    const totalGuestCount = Array.from(guestCounts.values()).reduce((sum, count) => sum + count, 0)
    if (totalGuestCount === 0) {
      console.warn("Analytics: No guest counts found - check guest SKU configuration")
    }

    return { associateStats: finalStats, guestCounts }
  }

  private calculateDataCaptureRates(
    associateStats: Map<string, FinalStats>,
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
    subscribedNoWedding: number
    weddingLeads: number
    totalOrders: number
    guestCount: number
    captureRate: number
    subscriptionRate: number
  }> {
    const results: Array<{
      associate: string
      newProfiles: number
      manualProfiles: number
      withEmail: number
      withPhone: number
      withData: number
      withDataNoWedding: number
      subscribed: number
      subscribedNoWedding: number
      weddingLeads: number
      totalOrders: number
      guestCount: number
      captureRate: number
      subscriptionRate: number
    }> = []

    // Get all associates from both sources (matching Python logic)
    const allAssociates = new Set([...Array.from(associateStats.keys()), ...Array.from(guestCounts.keys())])

    for (const associate of Array.from(allAssociates)) {
      if (associate.includes('***')) continue
      
      const stats = associateStats.get(associate) || {
        profilesCreated: 0,
        profilesWithEmail: 0,
        profilesWithPhone: 0,
        profilesWithData: 0,
        profilesWithDataNoWedding: 0,
        profilesWithSubscription: 0,
        profilesWithSubscriptionNoWedding: 0,
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
        subscribedNoWedding: stats.profilesWithSubscriptionNoWedding,
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
    const totalProfilesWithData = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithData || 0), 0)
    const totalProfilesWithSubscription = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithSubscription || 0), 0)
    const totalGuests = results.reduce((sum, r) => sum + r.guestCount, 0)
    const totalWeddingLeads = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithWeddingTag || 0), 0)
    const companyCaptureRate = totalGuests > 0 ? (totalProfilesWithData / totalGuests * 100) : 0
    const companySubscriptionRate = totalGuests > 0 ? (totalProfilesWithSubscription / totalGuests * 100) : 0

    // Calculate Company Data Capture Rate LESS Wedding Leads
    // Use the profilesWithDataNoWedding field which excludes wedding leads from associate performance
    const totalProfilesWithDataNoWedding = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithDataNoWedding || 0), 0)
    const companyCaptureRateLessWeddings = totalGuests > 0 ? (totalProfilesWithDataNoWedding / totalGuests * 100) : 0

    // Calculate Company Data Subscription Rate LESS Wedding Leads
    // Use the profilesWithSubscriptionNoWedding field which excludes wedding leads from subscription tracking
    const totalProfilesWithSubscriptionNoWedding = Array.from(associateStats.values())
      .reduce((sum, stats) => sum + (stats.profilesWithSubscriptionNoWedding || 0), 0)
    const companySubscriptionRateLessWeddings = totalGuests > 0 ? (totalProfilesWithSubscriptionNoWedding / totalGuests * 100) : 0

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
      subscribedNoWedding: associateProfilesWithSubscription, // Associates don't track this separately
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
      subscribedNoWedding: totalProfilesWithSubscription, // Company total includes all
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
      subscribed: totalProfilesWithSubscriptionNoWedding,
      subscribedNoWedding: totalProfilesWithSubscriptionNoWedding,
      weddingLeads: 0, // By definition, this excludes wedding leads
      totalOrders: results.filter(r => r.associate && !r.associate.includes('***')).reduce((sum, r) => sum + r.totalOrders, 0),
      guestCount: totalGuests,
      captureRate: Math.round(companyCaptureRateLessWeddings * 100) / 100,
      subscriptionRate: Math.round(companySubscriptionRateLessWeddings * 100) / 100
    })

    return results
  }

  async getYearOverYearComparison(): Promise<MonthlyComparison[]> {
    const currentYear = new Date().getFullYear()
    const comparisons: MonthlyComparison[] = []

    // Use more conservative rate limiting for year comparison
    commerce7Client.setRateLimitConfig({ maxRequestsPerSecond: 0.5, burstLimit: 2 })

    for (let month = 0; month < 12; month++) {
      const currentYearStart = startOfMonth(new Date(currentYear, month, 1))
      const currentYearEnd = endOfMonth(currentYearStart)
      
      const previousYearStart = subYears(currentYearStart, 1)
      const previousYearEnd = subYears(currentYearEnd, 1)

      // Skip future months
      if (currentYearStart > new Date()) break

      // Process sequentially to avoid rate limiting
      const currentMetrics = await this.getDataCaptureMetrics(currentYearStart, currentYearEnd)
      const previousMetrics = await this.getDataCaptureMetrics(previousYearStart, previousYearEnd)

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

    // Reset rate limiting to normal for other operations
    commerce7Client.setRateLimitConfig({ maxRequestsPerSecond: 1, burstLimit: 3 })

    return comparisons
  }

  // Add helper method for extracting associate name
  private extractAssociateName(order: C7Order): string {
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
  private extractCustomerEmails(customer: C7Customer): string[] {
    const emails = []
    if (customer.emails && Array.isArray(customer.emails)) {
      emails.push(...customer.emails.map((e) => typeof e === 'object' ? e.email : e))
    }
    if (customer.email && !emails.includes(customer.email)) {
      emails.push(customer.email)
    }
    return emails.filter(e => e)
  }

  private extractCustomerPhones(customer: C7Customer): string[] {
    const phones = []
    if (customer.phones && Array.isArray(customer.phones)) {
      phones.push(...customer.phones.map((p) => typeof p === 'object' ? p.phone : p))
    }
    if (customer.phone && !phones.includes(customer.phone)) {
      phones.push(customer.phone)
    }
    return phones.filter(p => p)
  }
}

export const analyticsService = new AnalyticsService()