import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getTripCostsFromToolguru } from './callApi'
import { apiConfig } from '../config/api'

async function testApi() {
  console.log('=== Début du test ===')
  console.log('Variables d\'environnement:', {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...',
    NEXT_PUBLIC_TOOLGURU_API_KEY: process.env.NEXT_PUBLIC_TOOLGURU_API_KEY?.substring(0, 10) + '...',
    NEXT_PUBLIC_TOOLGURU_BASE_URL: process.env.NEXT_PUBLIC_TOOLGURU_BASE_URL
  })
  
  console.log('Configuration API:', {
    googleMaps: {
      baseUrl: apiConfig.googleMaps.baseUrl,
      apiKey: apiConfig.googleMaps.apiKey.substring(0, 10) + '...',
      isConfigured: apiConfig.googleMaps.isConfigured()
    },
    toolguru: {
      baseUrl: apiConfig.toolguru.baseUrl,
      apiKey: apiConfig.toolguru.apiKey.substring(0, 10) + '...',
      isConfigured: apiConfig.toolguru.isConfigured()
    }
  })

  console.log('\n=== Test Paris court trajet ===')
  console.log('Appel de getTripCostsFromToolguru...')
  
  try {
    const result = await getTripCostsFromToolguru(
      '20 Rue de Paris, 75001 Paris',
      '15 Avenue des Champs-Élysées, 75008 Paris'
    )
    console.log('Résultat final:', result)
  } catch (error) {
    console.error('Erreur:', error)
  }
}

testApi() 