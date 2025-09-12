import axios, { AxiosInstance, AxiosError } from 'axios'
import { C7Customer, C7Order, C7Associate } from './types'
import { env } from '@/lib/env'
import { handleError, ApiError, ValidationError } from '@/lib/errors'

const DATA_CAPTURE_TAG_ID = "tag/d8dd1c0a-86d9-4224-b215-a70c4e5370b0"

interface RetryConfig {
  retries: number
  retryDelay: number
}

class Commerce7Client {
  private client: AxiosInstance
  private retryConfig: RetryConfig = { retries: 3, retryDelay: 1000 }
  
  constructor() {
    try {
      const authString = `${env.C7_APP_ID}:${env.C7_API_KEY}`
      const authToken = Buffer.from(authString).toString('base64')
      
      this.client = axios.create({
        baseURL: 'https://api.commerce7.com/v1',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'tenant': env.C7_TENANT_ID,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      })

      // Add request/response interceptors for error handling
      this.setupInterceptors()
    } catch (error) {
      throw new ApiError('Failed to initialize Commerce7 client', 500)
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        return Promise.reject(handleError(error))
      }
    )

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any
        
        if (!config || !config.retryCount) {
          config.retryCount = 0
        }

        if (config.retryCount < this.retryConfig.retries && this.shouldRetry(error)) {
          config.retryCount++
          await this.delay(this.retryConfig.retryDelay * config.retryCount)
          return this.client(config)
        }

        return Promise.reject(this.handleApiError(error))
      }
    )
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      (error.response?.status !== undefined && error.response.status >= 500)
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private handleApiError(error: AxiosError): ApiError {
    if (error.response) {
      const status = error.response.status
      const message = (error.response.data as any)?.message || error.message
      
      // Add detailed logging for debugging
      console.error('Commerce7 API Error Details:', {
        status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data ? JSON.parse(error.config.data) : null
      })
      
      // Log specific validation errors if available
      if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
        console.error('Specific validation errors:', error.response.data.errors)
      }
      
      switch (status) {
        case 400:
          return new ValidationError(`Invalid request: ${message}`)
        case 401:
          return new ApiError('Commerce7 authentication failed', 401)
        case 403:
          return new ApiError('Access denied to Commerce7 resource', 403)
        case 404:
          return new ApiError('Commerce7 resource not found', 404)
        case 429:
          return new ApiError('Commerce7 rate limit exceeded', 429)
        default:
          return new ApiError(`Commerce7 API error: ${message}`, status)
      }
    }
    
    if (error.request) {
      return new ApiError('Commerce7 API is unreachable', 503)
    }
    
    return new ApiError(`Commerce7 client error: ${error.message}`, 500)
  }

  async createCustomer(data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: string
    city?: string
    stateCode?: string
    zipCode?: string
    countryCode?: string
    associateName?: string
  }): Promise<C7Customer> {
    try {
      // Check if customer exists
      const existingCustomers = await this.searchCustomers(data.email)
      if (existingCustomers.length > 0) {
        // Update existing customer
        const customer = existingCustomers[0]
        if (customer && customer.id) {
          console.log('Customer already exists, updating instead of creating new one')
          
          // Prepare update data without associateName (it goes in metadata)
          const { associateName, ...customerData } = data
          const updateData: Partial<C7Customer> = {}
          
          // Only include fields that are different or new
          if (customerData.firstName !== customer.firstName) {
            updateData.firstName = customerData.firstName
          }
          if (customerData.lastName !== customer.lastName) {
            updateData.lastName = customerData.lastName
          }
          if (customerData.phone && customerData.phone !== (customer.phones?.[0]?.phone || '')) {
            updateData.phones = [{ phone: customerData.phone }]
          }
          if (customerData.city && customerData.city !== customer.city) {
            updateData.city = customerData.city
          }
          if (customerData.stateCode && customerData.stateCode !== customer.stateCode) {
            updateData.stateCode = customerData.stateCode
          }
          if (customerData.zipCode && customerData.zipCode !== customer.zipCode) {
            updateData.zipCode = customerData.zipCode
          }
          
          // Add the data capture tag to existing customers
          updateData.tags = [{ id: DATA_CAPTURE_TAG_ID }]
          
          // Add associate attribution metadata if provided
          if (associateName) {
            updateData.metaData = {
              'associate-sign-up-attribution': associateName
            }
          }
          
          return this.updateCustomer(customer.id, updateData)
        }
      }
      
      // Create new customer with all fields
      const { associateName, ...customerData } = data
      const payload: C7Customer = {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        emails: [{ email: customerData.email }],
        countryCode: customerData.countryCode || 'US',
        tags: [{ id: DATA_CAPTURE_TAG_ID }] // Add the data capture tag
      }
      
      // Add optional fields if provided
      if (customerData.phone) {
        payload.phones = [{ phone: customerData.phone }]
      }
      
      // Remove address field as it's not accepted by Commerce7 API
      // if (customerData.address) payload.address = customerData.address
      if (customerData.city) payload.city = customerData.city
      if (customerData.stateCode) payload.stateCode = customerData.stateCode
      if (customerData.zipCode) payload.zipCode = customerData.zipCode
      
      // Add associate attribution metadata if provided
      if (associateName) {
        payload.metaData = {
          'associate-sign-up-attribution': associateName
        }
      }
      
      console.log('Creating customer with payload:', JSON.stringify(payload, null, 2))
      const response = await this.client.post('/customer', payload)
      console.log('Customer created successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  async updateCustomer(id: string, data: Partial<C7Customer>): Promise<C7Customer> {
    console.log(`Updating customer ${id} with data:`, JSON.stringify(data, null, 2))
    const response = await this.client.put(`/customer/${id}`, data)
    console.log('Customer updated successfully:', response.data)
    return response.data
  }

  async searchCustomers(email: string): Promise<C7Customer[]> {
    const response = await this.client.get('/customer', {
      params: { q: email }
    })
    return response.data.customers || []
  }

  async getAssociates(): Promise<C7Associate[]> {
    try {
      // Commerce7 doesn't have a direct associates endpoint, so we get them from orders
      
      // Fallback: Get them from recent orders (14 days to capture more associates)
      const orders = await this.getRecentOrders(14)
      const associatesMap = new Map<string, C7Associate>()
      
      orders.forEach(order => {
        if (order.salesAssociate?.name) {
          associatesMap.set(order.salesAssociate.name, {
            id: order.salesAssociate.accountId || order.salesAssociate.name,
            name: order.salesAssociate.name,
            email: '' // Commerce7 doesn't provide email in order response
          })
        }
      })
      
      console.log(`Found ${associatesMap.size} unique associates from ${orders.length} orders`)
      return Array.from(associatesMap.values())
    } catch (error) {
      console.error('Error fetching associates:', error)
      return []
    }
  }

  async getRecentOrders(days: number): Promise<C7Order[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    let allOrders: C7Order[] = []
    let page = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const response = await this.client.get('/order', {
        params: {
          orderPaidDate: `gte:${startDate.toISOString().split('T')[0]}`,
          page: page,
          limit: 50 // Commerce7 maximum limit
        }
      })
      
      const orders = response.data.orders || []
      allOrders = allOrders.concat(orders)
      
      // Check if we got fewer orders than the limit (indicating last page)
      hasMorePages = orders.length === 50
      page++
      
      console.log(`Fetched page ${page - 1}: ${orders.length} orders (total so far: ${allOrders.length})`)
    }
    
    console.log(`Total orders fetched: ${allOrders.length}`)
    return allOrders
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<C7Order[]> {
    console.log(`Commerce7: Fetching orders from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    
    let allOrders: C7Order[] = []
    let page = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const response = await this.client.get('/order', {
        params: {
          orderPaidDate: `btw:${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`,
          page: page,
          limit: 50 // Commerce7 maximum limit
        }
      })
      
      const orders = response.data.orders || []
      allOrders = allOrders.concat(orders)
      
      console.log(`Commerce7: Fetched page ${page}: ${orders.length} orders (total: ${allOrders.length})`)
      
      // Check if we have more pages
      if (orders.length < 50) {
        hasMorePages = false
      } else {
        page++
      }
      
      // Safety limit
      if (page > 100) {
        console.log('Commerce7: Reached page limit of 100 for orders')
        break
      }
    }
    
    console.log(`Commerce7: Found ${allOrders.length} total orders in date range`)
    
    // Log sample order data
    if (allOrders.length > 0) {
      console.log('Commerce7: Sample order from API:')
      const sample = allOrders[0]
      console.log(`  Order ID: ${sample.id}`)
      console.log(`  Order Number: ${sample.orderNumber}`)
      console.log(`  Sales Associate: ${JSON.stringify(sample.salesAssociate)}`)
      console.log(`  Customer: ${JSON.stringify(sample.customer)}`)
      console.log(`  Items: ${JSON.stringify(sample.items)}`)
    }
    
    return allOrders
  }

  async getCustomersByDateRange(startDate: Date, endDate: Date): Promise<C7Customer[]> {
    console.log(`Commerce7: Fetching customers from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    
    let allCustomers: C7Customer[] = []
    let page = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const response = await this.client.get('/customer', {
        params: {
          createdAt: `btw:${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`,
          page: page,
          limit: 50, // Commerce7 maximum limit
          include: 'tags,metadata' // Try to explicitly include tags and metadata
        }
      })
      
      // Log the raw API response structure
      console.log(`Commerce7: Raw API response for page ${page}:`, JSON.stringify(response.data, null, 2))
      
      const customers = response.data.customers || []
      allCustomers = allCustomers.concat(customers)
      
      console.log(`Commerce7: Fetched page ${page}: ${customers.length} customers (total: ${allCustomers.length})`)
      
      // Check if we have more pages
      if (customers.length < 50) {
        hasMorePages = false
      } else {
        page++
      }
      
      // Safety limit
      if (page > 100) {
        console.log('Commerce7: Reached page limit of 100 for customers')
        break
      }
    }
    
    console.log(`Commerce7: Found ${allCustomers.length} total customers in date range`)
    
    // Log detailed information about each customer
    allCustomers.forEach((customer, index) => {
      console.log(`Commerce7: Customer ${index + 1} (ID: ${customer.id})`)
      console.log(`  - Raw tags property: ${JSON.stringify(customer.tags)}`)
      console.log(`  - Raw metaData property: ${JSON.stringify(customer.metaData)}`)
      console.log(`  - Tags type: ${typeof customer.tags}, is array: ${Array.isArray(customer.tags)}`)
      console.log(`  - MetaData type: ${typeof customer.metaData}, is object: ${typeof customer.metaData === 'object'}`)
      
      // Check if tags is an array and has items
      if (Array.isArray(customer.tags) && customer.tags.length > 0) {
        console.log(`  - Tags array length: ${customer.tags.length}`)
        customer.tags.forEach((tag, tagIndex) => {
          console.log(`    - Tag ${tagIndex}: ${JSON.stringify(tag)}`)
        });
      } else {
        console.log(`  - No tags found or tags is not an array`)
      }
      
      // Check for specific metadata keys
      if (customer.metaData && typeof customer.metaData === 'object') {
        const metadataKeys = Object.keys(customer.metaData)
        console.log(`  - Metadata keys: ${metadataKeys.join(', ')}`)
        if (metadataKeys.includes('associate-sign-up-attribution')) {
          console.log(`  - *** FOUND associate-sign-up-attribution: ${customer.metaData['associate-sign-up-attribution']} ***`)
        }
      }
    })
    
    // Also check for the specific test customer we just created
    const testCustomerId = '35067153-a3a3-4c9c-81cc-448b7b1297cd'
    const testCustomer = allCustomers.find(c => c.id === testCustomerId)
    if (testCustomer) {
      console.log('Commerce7: Found our test customer in the results:')
      console.log(`  ID: ${testCustomer.id}`)
      console.log(`  Name: ${testCustomer.firstName} ${testCustomer.lastName}`)
      console.log(`  MetaData: ${JSON.stringify(testCustomer.metaData)}`)
      console.log(`  CreatedAt: ${testCustomer.createdAt}`)
    } else {
      console.log('Commerce7: Test customer not found in date range results')
    }
    
    return allCustomers
  }
}

export const commerce7Client = new Commerce7Client()
