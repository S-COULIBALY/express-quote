import { ServiceType, RuleCategory } from '@prisma/client'

export type { ServiceType, RuleCategory }

export interface Rule {
  id: string
  name: string
  description: string
  serviceType: ServiceType
  category: RuleCategory
  value: number
  percentBased: boolean
  condition?: {
    type: 'PER_FLOOR' | 'PER_KM' | 'MINIMUM' | 'CUSTOM'
    value?: string
  }
  isActive: boolean
} 