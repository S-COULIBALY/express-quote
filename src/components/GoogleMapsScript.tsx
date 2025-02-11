'use client'

import { useEffect, useRef } from 'react'
import { apiConfig } from '@/config/api'

declare global {
  interface Window {
    initGoogleMapsCallback: () => void
    googleMapsLoaded: boolean
  }
}

export function GoogleMapsScript() {
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (window.googleMapsLoaded || typeof window.google !== 'undefined' || scriptRef.current) {
      return
    }

    window.initGoogleMapsCallback = () => {
      window.googleMapsLoaded = true
      window.dispatchEvent(new Event('google-maps-loaded'))
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiConfig.googleMaps.apiKey}&libraries=places&callback=initGoogleMapsCallback&loading=async`
    script.async = true
    script.defer = true
    scriptRef.current = script
    document.head.appendChild(script)

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current)
      }
      window.initGoogleMapsCallback = () => {}
    }
  }, [])

  return null
} 