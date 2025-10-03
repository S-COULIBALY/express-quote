'use server'

import { getDistanceFromGoogleMaps } from '@/actions/callApi'

/**
 * Calcule la distance entre deux adresses en utilisant l'API Google Maps
 */
export async function calculateDistance(origin: string, destination: string): Promise<number> {
  try {
    // Utiliser la fonction existante de callApi.ts
    const distance = await getDistanceFromGoogleMaps(origin, destination)
    return distance
  } catch (error) {
    console.error('Erreur lors du calcul de la distance:', error)
    return 0
  }
}

/**
 * Calcule les coûts de trajet (péage, carburant) entre deux adresses
 */
export async function calculateTripCosts(origin: string, destination: string): Promise<{
  distance: number;
  tollCost: number;
  fuelCost: number;
}> {
  try {
    // Obtenir la distance
    const distance = await calculateDistance(origin, destination)
    
    // Calcul local des coûts
    return {
      distance,
      tollCost: Math.round(distance * 0.15), // 0.15€/km de péage
      fuelCost: Math.round((distance * 25 * 1.8) / 100) // 25L/100km, 1.8€/L
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