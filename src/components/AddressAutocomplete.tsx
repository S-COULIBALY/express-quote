'use client'

import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { initializeGoogleMaps } from '@/utils/googleMaps'

// Création d'un contexte pour l'état de chargement de Google Maps
const GoogleMapsContext = createContext<{
  isLoading: boolean;
  isInitialized: boolean;
}>({
  isLoading: true,
  isInitialized: false
})

// Provider qui sera utilisé dans layout.tsx
export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initializeGoogleMaps()
        .then(() => {
          setIsInitialized(true)
          setIsLoading(false)
        })
        .catch(console.error)
    }
  }, [isInitialized])

  return (
    <GoogleMapsContext.Provider value={{ isLoading, isInitialized }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export function AddressAutocomplete() {
  const { isLoading } = useContext(GoogleMapsContext)
  
  const [departure, setDeparture] = useState<string>('')
  const [arrival, setArrival] = useState<string>('')
  
  // Utilisation de useRef pour stocker les instances d'autocomplete
  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const arrivalAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  
  // Références pour les listeners
  const departureListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const arrivalListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  const handleLoadDeparture = (inputElement: HTMLInputElement | null) => {
    if (!inputElement || departureAutocompleteRef.current || isLoading) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address']
      })
      
      departureAutocompleteRef.current = autocomplete
      
      // Stocker la référence du listener
      departureListenerRef.current = google.maps.event.addListener(
        autocomplete,
        'place_changed',
        () => {
          const place = autocomplete.getPlace()
          if (place.formatted_address) {
            setDeparture(place.formatted_address)
          }
        }
      )
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'autocomplete départ:', error)
    }
  }

  const handleLoadArrival = (inputElement: HTMLInputElement | null) => {
    if (!inputElement || arrivalAutocompleteRef.current || isLoading) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address']
      })
      
      arrivalAutocompleteRef.current = autocomplete
      
      // Stocker la référence du listener
      arrivalListenerRef.current = google.maps.event.addListener(
        autocomplete,
        'place_changed',
        () => {
          const place = autocomplete.getPlace()
          if (place.formatted_address) {
            setArrival(place.formatted_address)
          }
        }
      )
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'autocomplete arrivée:', error)
    }
  }

  // Nettoyage des listeners lors du démontage
  useEffect(() => {
    return () => {
      if (departureListenerRef.current) {
        google.maps.event.removeListener(departureListenerRef.current)
      }
      if (arrivalListenerRef.current) {
        google.maps.event.removeListener(arrivalListenerRef.current)
      }
    }
  }, [])

  const handleChangeDeparture = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeparture(e.target.value)
  }

  const handleChangeArrival = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArrival(e.target.value)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Formulaire de Déménagement</h2>

      {/* Input Départ */}
      <div>
        <label htmlFor="departure" className="block text-sm font-medium text-gray-700">
          Adresse de départ
        </label>
        <input
          id="departure"
          type="text"
          value={departure}
          onChange={handleChangeDeparture}
          placeholder={isLoading ? 'Chargement...' : 'Saisissez votre adresse de départ'}
          required
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-gray-50 hover:bg-gray-100 focus:bg-white
            transition-colors duration-200"
          autoComplete="off"
          disabled={isLoading}
          ref={handleLoadDeparture}
        />
      </div>

      {/* Input Arrivée */}
      <div>
        <label htmlFor="arrival" className="block text-sm font-medium text-gray-700">
          Adresse d'arrivée
        </label>
        <input
          id="arrival"
          type="text"
          value={arrival}
          onChange={handleChangeArrival}
          placeholder={isLoading ? 'Chargement...' : 'Saisissez votre adresse d\'arrivée'}
          required
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-gray-50 hover:bg-gray-100 focus:bg-white
            transition-colors duration-200"
          autoComplete="off"
          disabled={isLoading}
          ref={handleLoadArrival}
        />
      </div>
    </div>
  )
}
