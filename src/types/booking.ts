export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
}

// ===== NOUVEAU SYSTÈME TEMPLATE/ITEM =====

export interface Template {
  id: string
  name: string
  description: string
  serviceType: string
  basePrice: number
  duration: number
  workers: number
  createdAt: Date
  updatedAt: Date
  items?: Item[]
}

export interface Item {
  id: string
  templateId: string
  name: string
  description: string
  price: number
  isPopular: boolean
  createdAt: Date
  updatedAt: Date
  template?: Template
  catalogSelections?: CatalogSelection[]
}

export interface CatalogSelection {
  id: string
  itemId?: string
  category: string
  subcategory?: string
  displayOrder: number
  isActive: boolean
  isFeatured: boolean
  isNewOffer: boolean
  marketingTitle?: string
  marketingSubtitle?: string
  marketingDescription?: string
  marketingPrice?: number
  originalPrice?: number
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  targetAudience?: string
  // Système de promotion
  promotionCode?: string
  promotionValue?: number
  promotionType?: string
  isPromotionActive?: boolean
  isVisible: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
  item?: Item
}

// ===== ANCIEN SYSTÈME (MAINTENU POUR COMPATIBILITÉ) =====

export interface CatalogueMovingItem {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  includes: string[]
  features?: string[]
  popular?: boolean
  serviceType?: string
  scheduledDate: Date
  pickupAddress: string
  deliveryAddress: string
  duration: number
  workers: number
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
  includedDistance?: number
  distanceUnit?: string
  workersNeeded?: number
  categoryId?: string
  content?: string
  imagePath?: string
  isAvailable?: boolean
  scheduledTime?: string
  distance?: number
  // Nouvelles propriétés pour le catalogue
  displayName?: string
  displayDescription?: string
  displayPrice?: number
  originalPrice?: number
  catalogId?: string
  catalogCategory?: string
  subcategory?: string
  isFeatured?: boolean
  isNewOffer?: boolean
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  technicalPrice?: number
  baseName?: string
  baseDescription?: string
  hasPromotion?: boolean
  source?: 'pack-only' | 'catalog' | 'catalog-enhanced'
  
  // Système de promotion
  promotionCode?: string
  promotionValue?: number
  promotionType?: string
  isPromotionActive?: boolean
}

export interface CatalogueCleaningItem {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  categoryId: string
  category?: Category
  serviceType?: string
  duration: number
  workers: number
  includes: string[]
  features?: string[]
  scheduledDate: Date
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
  imagePath?: string
  location?: string
  scheduledTime?: string
  propertySize?: number
  propertyType?: string
  address?: string
  pickupAddress?: string
  deliveryAddress?: string
  distance?: number
  // Nouvelles propriétés pour le catalogue
  displayName?: string
  displayDescription?: string
  displayPrice?: number
  originalPrice?: number
  catalogId?: string
  catalogCategory?: string
  subcategory?: string
  isFeatured?: boolean
  isNewOffer?: boolean
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  technicalPrice?: number
  baseName?: string
  baseDescription?: string
  hasPromotion?: boolean
  source?: 'service-only' | 'catalog' | 'catalog-enhanced'
  
  // Système de promotion
  promotionCode?: string
  promotionValue?: number
  promotionType?: string
  isPromotionActive?: boolean
}

export interface CatalogueDeliveryItem {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  originalPrice?: number
  features: string[]
  includes: string[]
  imagePath?: string
  
  // Spécifique à la livraison
  packageType: 'colis' | 'meuble' | 'electromenager' | 'fragile' | 'document'
  weight?: number
  isFragile?: boolean
  pickupAddress: string
  deliveryAddress: string
  pickupTime?: string
  deliveryTime?: string
  scheduledDate: Date
  additionalInfo?: string
  
  // Métadonnées catalogue
  catalogId?: string
  catalogCategory?: string
  subcategory?: string
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  isFeatured?: boolean
  isNewOffer?: boolean
  source: 'catalog'
  createdAt: Date
  updatedAt: Date
  
  // Système de promotion
  promotionCode?: string
  promotionValue?: number
  promotionType?: string
  isPromotionActive?: boolean
}

export interface Booking {
  id: string
  items: BookingItem[]
  status: 'draft' | 'confirmed' | 'awaiting_payment' | 'payment_processing' | 'payment_failed' | 'payment_completed' | 'canceled' | 'completed'
  customerId?: string
  professionalId?: string
  totalHT: number
  totalTTC: number
  hasInsurance: boolean
  customerData?: any
  confirmedAt?: Date
  createdAt: Date
  updatedAt: Date
  quoteRequestId?: string
  paymentMethod?: string
}

export interface BookingItem {
  id: string
  type: 'pack' | 'service' | 'delivery' | 'personalizedItem'
  itemId: string
  data: CatalogueMovingItem | CatalogueCleaningItem | CatalogueDeliveryItem | any // any pour les items personnalisés
  price: number
  createdAt: Date
  updatedAt: Date
}

export interface BookingItemData {
  type: 'pack' | 'service'
  data: CatalogueMovingItem | CatalogueCleaningItem
} 

export interface BookingData {
  id: string;
  type: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  totalHT?: number;
  totalTTC?: number;
  baseCost?: number;
  volumeCost?: number;
  distancePrice?: number;
  optionsCost?: number;
  tollCost?: number;
  fuelCost?: number;
  createdAt: string | Date;
  moveDate?: string | Date;
  scheduledDate?: string | Date;
  scheduledTime?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupFloor?: number;
  pickupElevator?: boolean;
  deliveryFloor?: number;
  deliveryElevator?: boolean;
  volume?: number;
  distance?: number;
  propertyType?: string;
  packName?: string;
  serviceName?: string;
  description?: string;
  location?: string;
  packagingOption?: boolean;
  furnitureOption?: boolean;
  fragileOption?: boolean;
  storageOption?: boolean;
  disassemblyOption?: boolean;
  unpackingOption?: boolean;
  suppliesOption?: boolean;
  fragileItemsOption?: boolean;
} 