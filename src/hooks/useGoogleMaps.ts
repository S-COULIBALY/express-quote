import { useEffect, useState } from 'react'
import { apiConfig } from '@/config/api'

declare global {
  interface Window {
    initGoogleMaps: () => void
    googleMapsLoaded?: boolean
    googleMapsError?: string
    initGoogleMapsCallback?: () => void
  }
}

export function useGoogleMaps() {
  const [mapsLoaded, setMapsLoaded] = useState(() => {
    // Vérifier dès l'initialisation si Google Maps est déjà chargé
    return !!(window.google?.maps?.places && window.googleMapsLoaded)
  })
  const [error, setError] = useState<string | null>(() => {
    // Vérifier dès l'initialisation s'il y a déjà une erreur
    return window.googleMapsError || null
  })

  useEffect(() => {
    // Si l'API est déjà chargée, mettre à jour l'état
    if (window.google?.maps?.places && window.googleMapsLoaded) {
      console.log('Google Maps déjà chargé, marquant comme disponible')
      setMapsLoaded(true)
      setError(null)
      return
    }

    // Gérer le cas où l'API est en cours de chargement
    console.log('En attente du chargement de Google Maps...')

    // Écouter à la fois l'événement de succès et d'échec
    const handleLoaded = () => {
      console.log('Événement google-maps-loaded reçu')
      if (window.google?.maps?.places) {
        setMapsLoaded(true)
        setError(null)
      } else {
        console.error('Événement de chargement reçu mais Google Maps n\'est pas disponible')
        setError('Google Maps partiellement chargé')
      }
    }
    
    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent<Error>
      const errorMessage = customEvent.detail?.message || 'Erreur de chargement inconnue'
      console.error('Événement google-maps-error reçu:', errorMessage)
      setError(errorMessage)
      setMapsLoaded(false)
    }

    // S'il y a déjà une erreur connue, la signaler
    if (window.googleMapsError) {
      setError(window.googleMapsError)
    }
    
    window.addEventListener('google-maps-loaded', handleLoaded)
    window.addEventListener('google-maps-error', handleError as EventListener)

    // Vérification périodique si Google Maps est chargé
    // Cela nous permet de récupérer en cas de chargement non détecté par les événements
    const intervalId = setInterval(() => {
      if (window.google?.maps?.places && window.googleMapsLoaded) {
        console.log('Google Maps détecté comme chargé via l\'intervalle')
        setMapsLoaded(true)
        setError(null)
        clearInterval(intervalId)
      }
    }, 1000)

    return () => {
      window.removeEventListener('google-maps-loaded', handleLoaded)
      window.removeEventListener('google-maps-error', handleError as EventListener)
      clearInterval(intervalId)
    }
  }, [])

  return {
    loaded: mapsLoaded,
    error,
    // Pour la compatibilité avec le code existant
    mapsLoaded
  }
} 