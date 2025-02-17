'use client'

import { useEffect, useRef } from 'react'
import { apiConfig } from '@/config/api'

declare global {
  interface Window {
    initGoogleMapsCallback: () => void
    google: any
  }
}

export function GoogleMapsScript() {
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (window.google?.maps?.places) return

    const loadGoogleMaps = () => {
      window.initGoogleMapsCallback = () => {
        const event = new Event('google-maps-loaded')
        window.dispatchEvent(event)
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiConfig.googleMaps.apiKey}&libraries=places&callback=initGoogleMapsCallback`
      script.async = true
      script.defer = true
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
    }
  }, [])

  return null
} 