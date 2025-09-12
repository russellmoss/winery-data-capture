import { commerce7Client } from '@/lib/commerce7/client'
import { startOfMonth, endOfMonth, subYears, format } from 'date-fns'

const GUEST_COUNT_SKU_ID = "7a5d9556-33e4-4d97-a3e8-37adefc6dcf0"
const WEDDING_LEAD_TAG_ID = "tag/7c3b92b9-e048-4f5d-b156-e2d52c2779a6"

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
  guestCount: number
  captureRate: number
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

    // Process orders to get associate metrics
    const associateMetricsMap = new Map<string, AssociateMetrics>()
    const customersSeen = new Map<string, { firstOrderDate: string, associate: string, hasData: boolean, isWeddingLead: boolean }>()
    const customersWithWeddingTag = new Set<string>()
    const allTagIds = new Set<string>()

    // Sort orders by date to track first appearance of customers
    const sortedOrders = orders.sort((a, b) => 
      new Date(a.orderPaidDate).getTime() - new Date(b.orderPaidDate).getTime()
    )

    // Process orders
    sortedOrders.forEach(order => {
      const associateName = order.salesAssociate?.name || 'Unknown'
      
      if (!associateMetricsMap.has(associateName)) {
        associateMetricsMap.set(associateName, {
          name: associateName,
          profilesCreated: 0,
          profilesWithEmail: 0,
          profilesWithPhone: 0,
          profilesWithData: 0,
          guestCount: 0,
          captureRate: 0,
          totalOrders: 0
        })
      }
      
      const metrics = associateMetricsMap.get(associateName)!
      metrics.totalOrders++

      // Count guest count from items (matching Python implementation)
      order.items.forEach(item => {
        if (item.productId === GUEST_COUNT_SKU_ID) {
          metrics.guestCount += item.quantity
        }
      })

      // Track new customer profiles (only first time we see them)
      const customer = order.customer
      if (customer && customer.id) {
        // Check if this is a new customer (first time seen in this period)
        if (!customersSeen.has(customer.id)) {
          // Check for data capture using emails/phones arrays (matching Python)
          const hasEmail = customer.emails && customer.emails.length > 0
          const hasPhone = customer.phones && customer.phones.length > 0
          const hasData = hasEmail || hasPhone
          
          // Check for wedding lead tag
          const isWeddingLead = customer.tags?.some(tag => tag.id === WEDDING_LEAD_TAG_ID) || false
          
          customersSeen.set(customer.id, {
            firstOrderDate: order.orderPaidDate,
            associate: associateName,
            hasData,
            isWeddingLead
          })
          
          metrics.profilesCreated++

          if (hasEmail) {
            metrics.profilesWithEmail++
            if (!isWeddingLead) metrics.profilesWithData++ // Only count non-wedding leads
          }
          if (hasPhone) {
            metrics.profilesWithPhone++
            if (!hasEmail && !isWeddingLead) metrics.profilesWithData++ // Only count non-wedding leads
          }

          if (isWeddingLead) {
            customersWithWeddingTag.add(customer.id)
            console.log(`Analytics: Found wedding lead customer: ${customer.id} (${customer.firstName} ${customer.lastName})`)
          }
          
          // Log all tags for debugging
          if (customer.tags && customer.tags.length > 0) {
            console.log(`Analytics: Customer ${customer.id} tags:`, customer.tags.map(tag => `${tag.id} (${tag.title})`))
            // Collect all tag IDs
            customer.tags.forEach(tag => allTagIds.add(tag.id))
            // Check if any tag matches our wedding lead tag ID
            const hasWeddingTag = customer.tags.some(tag => tag.id === WEDDING_LEAD_TAG_ID)
            if (hasWeddingTag) {
              console.log(`Analytics: *** FOUND WEDDING LEAD TAG *** Customer ${customer.id} has wedding lead tag!`)
            }
            
            // Also check for any tags with "wedding" in the title (case insensitive)
            const weddingTags = customer.tags.filter(tag => 
              tag.title && tag.title.toLowerCase().includes('wedding')
            )
            if (weddingTags.length > 0) {
              console.log(`Analytics: *** FOUND WEDDING-RELATED TAGS *** Customer ${customer.id} has wedding tags:`, 
                weddingTags.map(tag => `${tag.id} (${tag.title})`))
            }
          } else {
            console.log(`Analytics: Customer ${customer.id} has no tags`)
          }
        }
      }
    })

    // Process customers with metadata attribution (from data capture app)
    let metadataAttributions = 0
    let reassignments = 0
    
    console.log('Analytics: Processing customers for metadata attribution...')
    
    customers.forEach((customer, index) => {
      if (customer.id && customer.metaData) {
        console.log(`Analytics: Customer ${index + 1}/${customers.length} - ID: ${customer.id}, MetaData: ${JSON.stringify(customer.metaData)}`)
        
        const associateAttribution = customer.metaData['associate-sign-up-attribution']
        
        // Log all metadata keys for debugging
        const metadataKeys = Object.keys(customer.metaData)
        if (metadataKeys.length > 0) {
          console.log(`Analytics: Customer ${customer.id} metadata keys: ${metadataKeys.join(', ')}`)
        }
        
        if (associateAttribution && typeof associateAttribution === 'string') {
          console.log(`Analytics: Found metadata attribution for customer ${customer.id}: "${associateAttribution}"`)
          const associateName = associateAttribution.trim()
          
          // Initialize associate if not already in map
          if (!associateMetricsMap.has(associateName)) {
            associateMetricsMap.set(associateName, {
              name: associateName,
              profilesCreated: 0,
              profilesWithEmail: 0,
              profilesWithPhone: 0,
              profilesWithData: 0,
              guestCount: 0,
              captureRate: 0,
              totalOrders: 0
            })
          }
          
          const metrics = associateMetricsMap.get(associateName)!
          
          // Check if this customer was already processed from orders
          if (customersSeen.has(customer.id)) {
            const existingAttribution = customersSeen.get(customer.id)!
            
            // If it was attributed to "Unknown" or a different associate, reassign it
            if (existingAttribution.associate === 'Unknown' || existingAttribution.associate !== associateName) {
              // Remove from previous associate
              const previousAssociate = associateMetricsMap.get(existingAttribution.associate)
              if (previousAssociate) {
                previousAssociate.profilesCreated--
                
                // Check what data this customer had and remove from previous associate
                const hasEmail = customer.emails && customer.emails.length > 0
                const hasPhone = customer.phones && customer.phones.length > 0
                const isWeddingLead = customer.tags?.some(tag => tag.id === WEDDING_LEAD_TAG_ID) || false
                
                if (hasEmail) {
                  previousAssociate.profilesWithEmail--
                  if (!isWeddingLead) previousAssociate.profilesWithData--
                }
                if (hasPhone) {
                  previousAssociate.profilesWithPhone--
                  if (!hasEmail && !isWeddingLead) previousAssociate.profilesWithData--
                }
              }
              
              // Update the attribution
              const hasEmail = customer.emails && customer.emails.length > 0
              const hasPhone = customer.phones && customer.phones.length > 0
              const hasData = hasEmail || hasPhone
              const isWeddingLead = customer.tags?.some(tag => tag.id === WEDDING_LEAD_TAG_ID) || false
              
              customersSeen.set(customer.id, {
                firstOrderDate: existingAttribution.firstOrderDate,
                associate: associateName,
                hasData,
                isWeddingLead
              })
              
              reassignments++
            }
          } else {
            // New customer not seen in orders
            const hasEmail = customer.emails && customer.emails.length > 0
            const hasPhone = customer.phones && customer.phones.length > 0
            const hasData = hasEmail || hasPhone
            const isWeddingLead = customer.tags?.some(tag => tag.id === WEDDING_LEAD_TAG_ID) || false
            
            customersSeen.set(customer.id, {
              firstOrderDate: customer.createdAt || new Date().toISOString(),
              associate: associateName,
              hasData,
              isWeddingLead
            })
            
            metadataAttributions++
          }
          
          // Add to the correct associate (whether new or reassigned)
          metrics.profilesCreated++
          
          // Check for data capture using emails/phones arrays
          const hasEmail = customer.emails && customer.emails.length > 0
          const hasPhone = customer.phones && customer.phones.length > 0
          const isWeddingLead = customer.tags?.some(tag => tag.id === WEDDING_LEAD_TAG_ID) || false
          
          if (hasEmail) {
            metrics.profilesWithEmail++
            if (!isWeddingLead) metrics.profilesWithData++ // Only count non-wedding leads
          }
          if (hasPhone) {
            metrics.profilesWithPhone++
            if (!hasEmail && !isWeddingLead) metrics.profilesWithData++ // Only count non-wedding leads
          }
          
          if (isWeddingLead) {
            customersWithWeddingTag.add(customer.id)
            console.log(`Analytics: Found wedding lead customer: ${customer.id} (${customer.firstName} ${customer.lastName})`)
          }
          
          // Log all tags for debugging
          if (customer.tags && customer.tags.length > 0) {
            console.log(`Analytics: Customer ${customer.id} tags:`, customer.tags.map(tag => `${tag.id} (${tag.title})`))
            // Collect all tag IDs
            customer.tags.forEach(tag => allTagIds.add(tag.id))
            // Check if any tag matches our wedding lead tag ID
            const hasWeddingTag = customer.tags.some(tag => tag.id === WEDDING_LEAD_TAG_ID)
            if (hasWeddingTag) {
              console.log(`Analytics: *** FOUND WEDDING LEAD TAG *** Customer ${customer.id} has wedding lead tag!`)
            }
            
            // Also check for any tags with "wedding" in the title (case insensitive)
            const weddingTags = customer.tags.filter(tag => 
              tag.title && tag.title.toLowerCase().includes('wedding')
            )
            if (weddingTags.length > 0) {
              console.log(`Analytics: *** FOUND WEDDING-RELATED TAGS *** Customer ${customer.id} has wedding tags:`, 
                weddingTags.map(tag => `${tag.id} (${tag.title})`))
            }
          } else {
            console.log(`Analytics: Customer ${customer.id} has no tags`)
          }
        }
      } else {
        console.log(`Analytics: Customer ${index + 1}/${customers.length} - ID: ${customer.id}, No MetaData or ID`)
      }
    })
    
    console.log(`Analytics: Found ${metadataAttributions} new profiles attributed via metadata`)
    console.log(`Analytics: Reassigned ${reassignments} profiles from Unknown/other associates`)
    console.log(`Analytics: Found ${customersWithWeddingTag.size} customers with wedding lead tag`)
    console.log(`Analytics: Processed ${customers.length} total customers`)
    console.log(`Analytics: Found ${associateMetricsMap.size} unique associates`)
    console.log(`Analytics: All unique tag IDs found: ${Array.from(allTagIds).join(', ')}`)

    // Calculate capture rates
    const associateMetrics = Array.from(associateMetricsMap.values()).map(metrics => ({
      ...metrics,
      captureRate: metrics.guestCount > 0 
        ? Number(((metrics.profilesWithData / metrics.guestCount) * 100).toFixed(2))
        : 0
    }))

    // Calculate company metrics (matching Python implementation exactly)
    const totalProfiles = customersSeen.size
    const totalProfilesWithData = associateMetrics.reduce((sum, a) => sum + a.profilesWithData, 0)
    const totalGuestCount = associateMetrics.reduce((sum, a) => sum + a.guestCount, 0)
    const profilesWithWeddingLeadTag = customersWithWeddingTag.size
    
    // Since we're now properly excluding wedding leads from profilesWithData counts,
    // the totalProfilesWithData already excludes wedding leads
    const profilesExcludingWeddingLeads = totalProfilesWithData
    
    console.log(`Analytics: Total profiles with data (excluding wedding leads): ${totalProfilesWithData}`)
    console.log(`Analytics: Wedding lead profiles: ${profilesWithWeddingLeadTag}`)
    console.log(`Analytics: Total profiles: ${totalProfiles}`)
    console.log(`Analytics: Total guest count: ${totalGuestCount}`)

    // Calculate Associate Data Capture Rate (only for associates with guest count > 0)
    const associatesWithGuests = associateMetrics.filter(a => a.guestCount > 0)
    const associateProfilesWithData = associatesWithGuests.reduce((sum, a) => sum + a.profilesWithData, 0)
    const associateTotalGuests = associatesWithGuests.reduce((sum, a) => sum + a.guestCount, 0)
    const associateDataCaptureRate = associateTotalGuests > 0 
      ? Number(((associateProfilesWithData / associateTotalGuests) * 100).toFixed(2))
      : 0

    // Calculate Company Data Capture Rate (all associates)
    const companyDataCaptureRate = totalGuestCount > 0 
      ? Number(((totalProfilesWithData / totalGuestCount) * 100).toFixed(2))
      : 0

    // Calculate Company Data Capture Rate Less Weddings
    const companyDataCaptureRateLessWeddings = totalGuestCount > 0
      ? Number(((profilesExcludingWeddingLeads / totalGuestCount) * 100).toFixed(2))
      : 0

    const companyMetrics: CompanyMetrics = {
      totalProfiles,
      totalProfilesWithData,
      totalGuestCount,
      overallCaptureRate: companyDataCaptureRate, // Use company rate as overall
      profilesWithWeddingLeadTag,
      captureRateExcludingWeddingLeads: companyDataCaptureRateLessWeddings,
      // Python script metrics
      associateDataCaptureRate,
      companyDataCaptureRate,
      companyDataCaptureRateLessWeddings
    }

    return {
      period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      startDate,
      endDate,
      associates: associateMetrics.sort((a, b) => b.captureRate - a.captureRate),
      companyMetrics
    }
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
