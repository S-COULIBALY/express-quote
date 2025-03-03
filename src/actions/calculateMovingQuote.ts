'use server'

import { getTripCostsFromToolguru } from './callApi'
import type { MovingFormData } from '@/types/quote'
import { apiConfig } from '@/config/api'

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

const _getTripCosts = async (origin: string, destination: string) => {
  try {
    const response = await fetch(
      `${apiConfig.toolguru.baseUrl}/trip-costs?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiConfig.toolguru.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const data = await response.json()
    return {
      distance: data.distance,
      tollCost: data.tollCost,
      fuelCost: data.fuelCost
    }
  } catch (error) {
    console.error('Erreur lors du calcul des coûts:', error)
    return {
      distance: 0,
      tollCost: 0,
      fuelCost: 0
    }
  }
}

export async function calculateMovingQuote(formData: MovingFormData) {
  try {
    const tripCosts = await _getTripCosts(formData.pickupAddress, formData.deliveryAddress)
    
    const volumeNum = parseFloat(formData.volume)
    const rate = MOVING_RATES.medium
    const baseCost = (volumeNum * rate.perM3) + (tripCosts.distance * rate.perKm)
    
    let optionsCost = 0
    Object.entries(formData.options).forEach(([key, isSelected]) => {
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
  } catch (error) {
    console.error('Erreur lors du calcul du devis:', error)
    return {
      distance: 0,
      tollCost: 0,
      fuelCost: 0,
      baseCost: 0,
      optionsCost: 0,
      totalCost: 0
    }
  }
}

function calculateBaseCost(volume: string, distance: number): number {
  const volumeNum = parseFloat(volume) || 0
  return volumeNum * distance * 0.5 // Exemple de calcul
}

function calculateOptionsCost(options: MovingFormData['options']): number {
  const optionPrices = {
    packing: 300,
    assembly: 150,
    disassembly: 150,
    insurance: 200,
    storage: 500,
    heavyLifting: 250,
    basement: 200,
    cleaning: 300
  }

  return Object.entries(options).reduce((total, [option, isSelected]) => {
    return total + (isSelected ? optionPrices[option as keyof typeof optionPrices] : 0)
  }, 0)
} // Force update
