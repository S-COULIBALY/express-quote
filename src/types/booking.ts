export interface Pack {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  includes: string[]
  scheduledDate: Date
  pickupAddress: string
  deliveryAddress: string
  duration: number
  workers: number
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  duration: number
  workers: number
  includes: string[]
  scheduledDate: Date
  location: string
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  type: 'MOVING_QUOTE' | 'PACK' | 'SERVICE'
  status: 'DRAFT' | 'CONFIRMED' | 'AWAITING_PAYMENT' | 'PAYMENT_PROCESSING' | 'PAYMENT_FAILED' | 'PAYMENT_COMPLETED' | 'CANCELED' | 'COMPLETED'
  customerId: string
  professionalId?: string
  totalAmount: number
  paymentMethod?: string
  createdAt: Date
  updatedAt: Date
  quoteRequestId?: string
} 