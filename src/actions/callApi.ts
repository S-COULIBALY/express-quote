'use server'

import { apiConfig } from '../config/api'
import axios from 'axios'
import https from 'https'
import fetch from 'node-fetch'

// Configuration globale d'axios pour désactiver la vérification SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Forcer l'utilisation de l'URL de développement
const TOOLGURU_DEV_URL = 'https://dev.tollguru.com';

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance?: { value: number }
      status: string
    }>
  }>
  status?: string
  error_message?: string
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
    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      key: apiConfig.googleMaps.apiKey
    })

    const url = `${apiConfig.googleMaps.baseUrl}/distancematrix/json?${params.toString()}`
    console.log('Calling Google Maps API:', url.replace(apiConfig.googleMaps.apiKey, 'API_KEY'))
    
    const response = await fetch(url)
    console.log('Google Maps response status:', response.status)
    
    const data: DistanceMatrixResponse = await response.json()
    console.log('Google Maps response data:', data)
    
    if (data.rows?.[0]?.elements?.[0]?.distance) {
      const distance = data.rows[0].elements[0].distance.value / 1000
      console.log('Calculated distance:', distance, 'km')
      return distance
    }

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Maps API error: ${data.error_message}`)
    }

    throw new Error('Distance calculation failed')
  } catch (error) {
    console.error('Error calculating distance:', error)
    return 0
  }
}

async function getCoordinates(address: string): Promise<{ lat: number, lng: number }> {
  try {
    const params = new URLSearchParams({
      address: address,
      key: apiConfig.googleMaps.apiKey
    })

    const url = `${apiConfig.googleMaps.baseUrl}/geocode/json?${params.toString()}`
    console.log('Calling Google Maps Geocoding API:', url.replace(apiConfig.googleMaps.apiKey, 'API_KEY'))
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const location = data.results[0].geometry.location
      console.log('Coordinates found:', location)
      return location
    }

    throw new Error('Geocoding failed')
  } catch (error) {
    console.error('Error getting coordinates:', error)
    return { lat: 0, lng: 0 }
  }
}

export async function getTripCostsFromToolguru(origin: string, destination: string): Promise<TripCosts> {
  if (!apiConfig.googleMaps.isConfigured() || !apiConfig.toolguru.isConfigured()) {
    throw new Error('APIs non configurées')
  }

  const distance = await getDistanceFromGoogleMaps(origin, destination)
  const originCoords = await getCoordinates(origin)
  const destinationCoords = await getCoordinates(destination)

  try {
    let retryCount = 0
    let lastError: Error | null = null
    const hostname = new URL(TOOLGURU_DEV_URL).hostname;

    while (retryCount < apiConfig.toolguru.retryAttempts) {
      try {
        console.log('Tentative d\'appel Toolguru:', retryCount + 1)
        console.log('URL:', `${TOOLGURU_DEV_URL}/v1/calc/route`)
        console.log('Hostname:', hostname)
        
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
          servername: hostname
        });

        const response = await axios({
          method: 'post',
          url: `${TOOLGURU_DEV_URL}/v1/calc/route`,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiConfig.toolguru.apiKey,
            'Host': hostname
          },
          data: {
            source: {
              name: origin,
              latitude: originCoords.lat,
              longitude: originCoords.lng
            },
            destination: {
              name: destination,
              latitude: destinationCoords.lat,
              longitude: destinationCoords.lng
            },
            waypoints: [],
            serviceProvider: {
              name: "here"
            },
            vehicle: {
              type: "2AxlesLCV",
              weight: {
                value: 3500,
                unit: "kg"
              },
              height: {
                value: 2.5,
                unit: "meter"
              },
              length: {
                value: 5,
                unit: "meter"
              },
              axles: 2,
              trailers: 0
            }
          },
          httpsAgent,
          timeout: 60000,
          validateStatus: null
        })
        
        console.log('Toolguru response status:', response.status)
        console.log('Toolguru response data:', response.data)

        const data = response.data

        if (response.status !== 200 || data.status !== 'success') {
          throw new Error(data.message || 'Erreur de calcul des coûts')
        }
    
        return {
          tollCost: Math.round(data.costs.toll || 0),
          fuelCost: Math.round(data.costs.fuel || distance * 0.12),
          distance
        }
      } catch (error: any) {
        console.log('Erreur tentative', retryCount + 1, ':', error.message)
        if (error.response) {
          console.log('Détails réponse:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          })
        }
        
        lastError = error
        retryCount++
        if (retryCount < apiConfig.toolguru.retryAttempts) {
          const delay = 1000 * retryCount
          console.log(`Attente de ${delay}ms avant la prochaine tentative...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Échec après plusieurs tentatives')
  } catch (error) {
    console.error('Erreur calcul coûts:', error)
    return {
      tollCost: Math.round(distance * 0.07),
      fuelCost: Math.round(distance * 0.12),
      distance
    }
  }
} 