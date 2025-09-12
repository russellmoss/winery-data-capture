import axios, { AxiosInstance, AxiosError } from 'axios'
import { C7Customer, C7Order, C7Associate } from './types'
import { env } from '@/lib/env'
import { handleError, ApiError, ValidationError } from '@/lib/errors'

const DATA_CAPTURE_TAG_ID = "d8dd1c0a-86d9-4224-b215-a70c4e5370b0" // Without tag/ prefix to match Python script

interface RetryConfig {
  retries: number
  retryDelay: number
}

interface RateLimitConfig {
  maxRequestsPerSecond: number
  burstLimit: number
}

class Commerce7Client {
  private client: AxiosInstance
  private retryConfig: RetryConfig = { retries: 3, retryDelay: 1000 }
  private rateLimitConfig: RateLimitConfig = { maxRequestsPerSecond: 1, burstLimit: 3 }
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessingQueue = false
  private lastRequestTime = 0
  
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

  // Method to configure rate limiting for different scenarios
  setRateLimitConfig(config: Partial<RateLimitConfig>) {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config }
  }

  private async rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeWithRetry(requestFn)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.processQueue()
    })
  }

  private async executeWithRetry<T>(requestFn: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await requestFn()
    } catch (error: any) {
      if (error.statusCode === 429 && attempt <= this.retryConfig.retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000) // Exponential backoff, max 30s
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return this.executeWithRetry(requestFn, attempt + 1)
      }
      throw error
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const minInterval = 1000 / this.rateLimitConfig.maxRequestsPerSecond

      if (timeSinceLastRequest < minInterval) {
        const delay = minInterval - timeSinceLastRequest
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const request = this.requestQueue.shift()
      if (request) {
        this.lastRequestTime = Date.now()
        try {
          await request()
        } catch (error) {
          console.error('Commerce7: Request failed in queue:', error)
        }
      }
    }

    this.isProcessingQueue = false
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => config,
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
      
      const response = await this.client.post('/customer', payload)
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
    
    let allOrders: C7Order[] = []
    let page = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const response = await this.rateLimitedRequest(() => 
        this.client.get('/order', {
          params: {
            orderPaidDate: `btw:${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`,
            page: page,
            limit: 50 // Commerce7 maximum limit
          }
        })
      )
      
      const orders = response.data.orders || []
      allOrders = allOrders.concat(orders)
      
      // Check if we have more pages
      if (orders.length < 50) {
        hasMorePages = false
      } else {
        page++
      }
      
      // Safety limit
      if (page > 100) {
        break
      }
    }
    
    // Basic validation only
    if (allOrders.length === 0) {
      console.warn('Commerce7: No orders found in date range')
    }
    
    return allOrders
  }

  async getCustomersByDateRange(startDate: Date, endDate: Date): Promise<C7Customer[]> {
    console.log(`Commerce7: Starting customer fetch for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    
    // Fix: Add one day to endDate to make the range inclusive of the end date
    const inclusiveEndDate = new Date(endDate)
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1)
    
    let allCustomers: C7Customer[] = []
    let page = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const response = await this.rateLimitedRequest(() => 
        this.client.get('/customer', {
          params: {
            createdAt: `btw:${startDate.toISOString().split('T')[0]}|${inclusiveEndDate.toISOString().split('T')[0]}`,
            page: page,
            limit: 50 // Commerce7 maximum limit
          }
        })
      )
      
      const customers = response.data.customers || []
      allCustomers = allCustomers.concat(customers)
      
      // Progress logging for customer fetching
      if (page % 5 === 0 || customers.length < 50) {
        console.log(`Commerce7: Customer page ${page}: ${customers.length} customers (total: ${allCustomers.length})`)
      }
      
      // Check if we have more pages
      if (customers.length < 50) {
        hasMorePages = false
      } else {
        page++
      }
      
      // Safety limit
      if (page > 100) {
        console.warn('Commerce7: Reached customer page limit of 100')
        break
      }
    }
    
    console.log(`Commerce7: Customer fetch completed: ${allCustomers.length} customers found`)
    
    // Basic validation only
    if (allCustomers.length === 0) {
      console.warn('Commerce7: No customers found in date range')
    }
    
    return allCustomers
  }
}

export const commerce7Client = new Commerce7Client()
