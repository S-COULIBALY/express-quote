'use server'

import { apiConfig } from '@/config/api'
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
    // D'abord obtenir la distance
    const distance = await calculateDistance(origin, destination)
    
    // Puis faire l'appel à l'API Toolguru si disponible, sinon faire un calcul local
    try {
      // URL absolue pour l'API (à adapter selon l'environnement)
      const apiUrl = process.env.TOOLGURU_API_URL || apiConfig.toolguru.baseUrl
      
      const response = await fetch(
        `${apiUrl}/trip-costs?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
        {
          headers: {
            'Authorization': `Bearer ${apiConfig.toolguru.apiKey}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store' // Pour s'assurer que la requête n'est pas mise en cache par Next.js
        }
      )
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        distance: data.distance || distance,
        tollCost: data.tollCost || 0,
        fuelCost: data.fuelCost || 0
      }
    } catch (apiError) {
      console.error('Erreur API Toolguru, utilisation du calcul local:', apiError)
      
      // Calcul local en cas d'erreur
      return {
        distance,
        tollCost: Math.round(distance * 0.15), // 0.15€/km de péage
        fuelCost: Math.round((distance * 25 * 1.8) / 100) // 25L/100km, 1.8€/L
      }
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