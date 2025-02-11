'use server'

import { apiConfig } from '@/config/api'

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance?: { value: number }
      status: string
    }>
  }>
}

interface ToollguruResponse {
  costs: {
    toll?: number
    fuel?: number
  }
  status: string
  message?: string
}

interface TripCosts {
  tollCost: number
  fuelCost: number
  distance: number
}

export async function getDistanceFromGoogleMaps(origin: string, destination: string): Promise<number> {
  if (!origin || !destination) {
    throw new Error('Origin and destination are required')
  }

  try {
    const response = await fetch(
      `${apiConfig.googleMaps.baseUrl}/distancematrix/json?` +
      `origins=${encodeURIComponent(origin)}&` +
      `destinations=${encodeURIComponent(destination)}&` +
      `key=${apiConfig.googleMaps.apiKey}`
    )
    
    const data: DistanceMatrixResponse = await response.json()
    
    if (data.rows?.[0]?.elements?.[0]?.distance) {
      return data.rows[0].elements[0].distance.value
    }
    throw new Error('Distance calculation failed')
  } catch (error) {
    console.error('Error calculating distance:', error)
    return 0
  }
}

export async function getTripCostsFromToolguru(origin: string, destination: string): Promise<TripCosts> {
  if (!apiConfig.googleMaps.isConfigured() || !apiConfig.toolguru.isConfigured()) {
    throw new Error('APIs non configurées')
  }

  try {
    const distance = await getDistanceFromGoogleMaps(origin, destination)
    let retryCount = 0
    let lastError: Error | null = null

    while (retryCount < apiConfig.toolguru.retryAttempts) {
      try {
        const response = await fetch(`${apiConfig.toolguru.baseUrl}/v1/toll-cost`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.toolguru.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: origin,
            to: destination,
            vehicle: {
              type: 'van',
              weight: 3500,
              axles: 2
            },
            departure_time: new Date().toISOString()
          })
        })
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`)
        }

        const data: ToollguruResponse = await response.json()

        if (data.status !== 'success') {
          throw new Error(data.message || 'Erreur de calcul des coûts')
        }
    
        return {
          tollCost: Math.round(data.costs.toll || 0),
          fuelCost: Math.round(data.costs.fuel || distance * 0.12),
          distance
        }
      } catch (error) {
        lastError = error as Error
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    throw lastError || new Error('Échec après plusieurs tentatives')
  } catch (error) {
    console.error('Erreur calcul coûts:', error)
    const distance = await getDistanceFromGoogleMaps(origin, destination)
    return {
      tollCost: Math.round(distance * 0.07),
      fuelCost: Math.round(distance * 0.12),
      distance
    }
  }
} 