export interface C7Customer {
  id?: string
  firstName: string
  lastName: string
  email?: string
  emails?: Array<{ email: string }>
  phone?: string
  phones?: Array<{ phone: string }>
  address?: string
  city?: string
  stateCode?: string
  zipCode?: string
  countryCode?: string
  tags?: Array<{ id: string; title?: string }>
  metaData?: Record<string, any>
  createdAt?: string
  orderInformation?: {
    orderCount?: number
    lifetimeValue?: number
  }
}

export interface C7Order {
  id: string
  orderNumber: number
  customerId?: string
  orderPaidDate: string
  orderSubmittedDate: string
  items: Array<{
    productId: string
    quantity: number
  }>
  salesAssociate?: {
    name: string
    accountId?: string
  }
  customer?: C7Customer
}

export interface C7Associate {
  id: string
  name: string
  email: string
}

export interface DataCaptureStats {
  associate: string
  profilesCreated: number
  profilesWithEmail: number
  profilesWithPhone: number
  profilesWithData: number
  guestCount: number
  captureRate: number
  totalOrders: number
}
