'use client'

import { useEffect, useRef } from 'react'
import { apiConfig } from '@/config/api'

declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
    google: typeof google;
    googleMapsLoaded?: boolean;
  }
}

export function GoogleMapsScript() {
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isLoading = useRef(false)

  useEffect(() => {
    if (window.google?.maps?.places || isLoading.current || window.googleMapsLoaded) return

    const loadGoogleMaps = () => {
      isLoading.current = true

      window.initGoogleMapsCallback = () => {
        isLoading.current = false
        window.googleMapsLoaded = true
        const event = new Event('google-maps-loaded')
        window.dispatchEvent(event)
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiConfig.googleMaps.apiKey}&libraries=places&callback=initGoogleMapsCallback`
      script.async = true
      script.defer = true
      script.setAttribute('loading', 'async')
      script.onerror = () => {
        console.error('Erreur lors du chargement de Google Maps')
        isLoading.current = false
        window.googleMapsLoaded = false
      }
      
      scriptRef.current = script
      document.head.appendChild(script)
    }

    loadGoogleMaps()

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current)
      }
      if (window.initGoogleMapsCallback) {
        delete window.initGoogleMapsCallback
      }
      window.googleMapsLoaded = false
      isLoading.current = false
    }
  }, [])

  return null
} 