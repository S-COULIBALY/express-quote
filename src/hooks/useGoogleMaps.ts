import { useEffect, useState } from 'react'
import { apiConfig } from '@/config/api'

let isLoading = false
let isLoaded = false

declare global {
  interface Window {
    initGoogleMaps: () => void
    googleMapsLoaded?: boolean
  }
}

export function useGoogleMaps() {
  const [mapsLoaded, setMapsLoaded] = useState(false)

  useEffect(() => {
    // Si l'API est déjà chargée, mettre à jour l'état
    if (window.google?.maps?.places || window.googleMapsLoaded) {
      setMapsLoaded(true)
      return
    }

    // Attendre le chargement de l'API
    const handleLoaded = () => setMapsLoaded(true)
    window.addEventListener('google-maps-loaded', handleLoaded)

    return () => {
      window.removeEventListener('google-maps-loaded', handleLoaded)
    }
  }, [])

  return mapsLoaded
} 