'use client'

import { useEffect, useRef } from 'react'
import { apiConfig } from '@/config/api'

declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
    google: typeof google;
    googleMapsLoaded?: boolean;
    googleMapsError?: string;
  }
}

export function GoogleMapsScript() {
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isLoading = useRef(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const clearExistingScripts = () => {
    // Supprimer les anciens scripts de Google Maps pour éviter les conflits
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    existingScripts.forEach(script => {
      script.remove()
    })
    
    // Nettoyage des objets globaux pour éviter les conflits
    if (window.google?.maps) {
      try {
        // @ts-ignore - Tentative de nettoyage
        delete window.google.maps
      } catch (e) {
        console.warn('Impossible de nettoyer l\'objet Google Maps précédent', e)
      }
    }
  }

  const loadGoogleMaps = () => {
    if (isLoading.current) return

    isLoading.current = true
    console.log(`Tentative de chargement #${retryCountRef.current + 1} de Google Maps API...`)

    // Effacer l'erreur précédente
    window.googleMapsError = undefined

    // Définir la fonction callback dans l'objet window global AVANT de créer le script
    // Cela garantit que la fonction est disponible lorsque Google Maps tente de l'appeler
    window.initGoogleMapsCallback = function() {
      try {
        console.log('Google Maps API callback invoqué')
        
        // Vérifier l'initialisation correcte de l'API
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          throw new Error('Google Maps API ou ses composants non disponibles après initialisation')
        }
        
        // Si on arrive ici, tout est bon
        isLoading.current = false
        window.googleMapsLoaded = true
        retryCountRef.current = 0
        
        // Notifier les composants en attente
        const event = new Event('google-maps-loaded')
        window.dispatchEvent(event)
        console.log('Google Maps API chargée avec succès')
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Google Maps:', error)
        window.googleMapsError = String(error)
        
        // Déclencher un retry si nécessaire
        handleLoadError(error as Error)
      }
    };

    try {
      // Supprimer tout script précédent pour un chargement propre
      clearExistingScripts()
      
      // Créer un nouveau script pour charger l'API
      const script = document.createElement('script')
      
      // Ajouter une version spécifique et des paramètres supplémentaires
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiConfig.googleMaps.apiKey}&libraries=places&callback=initGoogleMapsCallback&loading=async`
      script.async = true
      script.defer = true
      
      // Gérer l'erreur de chargement du script
      script.onerror = (event) => {
        console.error('Erreur lors du chargement du script Google Maps:', event)
        handleLoadError(new Error('Échec du chargement du script'))
      }
      
      scriptRef.current = script
      document.head.appendChild(script)
    } catch (error) {
      console.error('Erreur lors de la création du script Google Maps:', error)
      handleLoadError(error as Error)
    }
  }

  const handleLoadError = (error: Error) => {
    isLoading.current = false
    window.googleMapsLoaded = false
    window.googleMapsError = error.message
    
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++
      console.log(`Nouvelle tentative de chargement dans 1 seconde (${retryCountRef.current}/${maxRetries})`)
      setTimeout(loadGoogleMaps, 1000)
    } else {
      console.error(`Échec après ${maxRetries} tentatives de chargement de Google Maps`)
      
      // Déclencher un événement d'erreur pour les composants qui attendent
      const errorEvent = new CustomEvent('google-maps-error', { detail: error })
      window.dispatchEvent(errorEvent)
    }
  }

  useEffect(() => {
    // Si déjà chargé correctement, ne rien faire
    if (window.google?.maps?.places?.Autocomplete && window.googleMapsLoaded) {
      console.log('Google Maps déjà correctement chargé')
      return
    }
    
    // S'il y a une erreur ou si l'API n'est pas complètement chargée, essayer de recharger
    loadGoogleMaps()

    return () => {
      // Nettoyage lors du démontage du composant
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current)
      }
      
      // Ne pas nettoyer le callback pour éviter des problèmes pendant la durée de vie de la page
      // Si le composant est remonté, il utilisera la même fonction callback
    }
  }, [])

  return null
} 