'use server'

import { getTripCostsFromToolguru } from './callApi'
import type { MovingFormData } from '@/types/quote'

const MOVING_RATES: Record<string, { perKm: number; perM3: number }> = {
  small: { perKm: 1.5, perM3: 40 },
  medium: { perKm: 2.0, perM3: 50 },
  large: { perKm: 2.5, perM3: 60 }
}

const MOVING_SERVICES = {
  packing: { cost: 200, type: 'fixed' as const },
  assembly: { cost: 150, type: 'fixed' as const },
  disassembly: { cost: 100, type: 'fixed' as const },
  insurance: { cost: 0.1, type: 'percent' as const },
  storage: { cost: 50, type: 'fixed' as const }
}

export async function calculateMovingQuote(formData: MovingFormData) {
  const { volume, pickupAddress, deliveryAddress, options } = formData

  const tripCosts = await getTripCostsFromToolguru(pickupAddress, deliveryAddress)
  
  console.log('Trip costs:', tripCosts) // Debug

  const volumeNum = parseFloat(volume)
  const rate = MOVING_RATES.medium
  const baseCost = (volumeNum * rate.perM3) + (tripCosts.distance * rate.perKm)
  
  let optionsCost = 0
  Object.entries(options).forEach(([key, isSelected]) => {
    if (isSelected && key in MOVING_SERVICES) {
      const service = MOVING_SERVICES[key as keyof typeof MOVING_SERVICES]
      if (service.type === 'fixed') {
        optionsCost += service.cost
      } else {
        optionsCost += baseCost * service.cost
      }
    }
  })

  return {
    distance: tripCosts.distance,
    tollCost: tripCosts.tollCost,
    fuelCost: tripCosts.fuelCost,
    baseCost,
    optionsCost,
    totalCost: baseCost + optionsCost + tripCosts.tollCost + tripCosts.fuelCost
  }
} 