'use server'

import { apiConfig } from '../config/api'
import fetch from 'node-fetch'

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