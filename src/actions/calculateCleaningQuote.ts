'use server'

import type { CleaningFormData } from '@/types/quote'

const CLEANING_RATES = {
  standard: { basePrice: 30, roomMultiplier: 1 },
  deep: { basePrice: 45, roomMultiplier: 1.5 },
  movingOut: { basePrice: 40, roomMultiplier: 1.3 },
  postConstruction: { basePrice: 50, roomMultiplier: 2 }
}

type Frequency = 'oneTime' | 'weekly' | 'biweekly' | 'monthly'

export async function calculateCleaningQuote(formData: CleaningFormData) {
  const { cleaningType, squareMeters, numberOfRooms, numberOfBathrooms, frequency } = formData

  const rate = CLEANING_RATES[cleaningType as keyof typeof CLEANING_RATES]
  const area = parseFloat(squareMeters)
  const rooms = parseInt(numberOfRooms)
  const bathrooms = parseInt(numberOfBathrooms)

  let basePrice = rate.basePrice * area / 50 // Prix par 50m²
  basePrice += rooms * rate.roomMultiplier * 20 // Prix par pièce
  basePrice += bathrooms * rate.roomMultiplier * 30 // Prix par salle de bain

  const frequencyMultiplier = {
    oneTime: 1,
    weekly: 0.8,
    biweekly: 0.85,
    monthly: 0.9
  }[frequency as Frequency]

  const totalCost = Math.round(basePrice * (frequencyMultiplier ?? 1))

  return {
    basePrice: Math.round(basePrice),
    frequencyDiscount: Math.round(basePrice * (1 - frequencyMultiplier)),
    totalCost
  }
} 