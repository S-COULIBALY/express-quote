import { useState, useEffect, useRef, useCallback } from 'react'
import { useGoogleMaps } from './useGoogleMaps'

interface UseAddressAutocompleteProps {
  id: string
  initialValue: string
  onChange: (value: string, place?: google.maps.places.PlaceResult) => void
}

interface AddressState {
  value: string
  isValid: boolean
  place: google.maps.places.PlaceResult | null
}

export function useAddressAutocomplete({
  id,
  initialValue,
  onChange
}: UseAddressAutocompleteProps) {
  const mapsLoaded = useGoogleMaps()
  const [state, setState] = useState<AddressState>({
    value: initialValue,
    isValid: false,
    place: null
  })
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isInternalChangeRef = useRef(false)

  // Valider l'adresse
  const validateAddress = useCallback((place: google.maps.places.PlaceResult): boolean => {
    if (!place.address_components) return false

    const requiredTypes = ['street_number', 'route', 'postal_code', 'locality']
    const foundTypes = place.address_components.map(component => component.types[0])
    
    const missingComponents = requiredTypes.filter(type => !foundTypes.includes(type))
    if (missingComponents.length > 0) {
      console.debug(`[${id}] Composants d'adresse manquants:`, missingComponents)
      return false
    }

    return true
  }, [id])

  // Gérer le changement de lieu
  const handlePlaceChange = useCallback(() => {
    console.debug(`[${id}] handlePlaceChange appelé`)
    const place = autocompleteRef.current?.getPlace()
    
    if (!place || !place.formatted_address) {
      console.debug(`[${id}] Adresse invalide sélectionnée:`, place)
      return
    }

    const isValid = validateAddress(place)
    isInternalChangeRef.current = true

    setState({
      value: place.formatted_address,
      isValid,
      place: isValid ? place : null
    })

    onChange(place.formatted_address, isValid ? place : undefined)

    // Reset internal change flag
    setTimeout(() => {
      isInternalChangeRef.current = false
    }, 100)
  }, [id, onChange, validateAddress])

  // Initialiser l'autocomplétion
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) {
      console.debug(`[${id}] Maps non chargé ou input non initialisé`)
      return
    }

    console.debug(`[${id}] Initialisation de l'autocomplétion`)
    const options: google.maps.places.AutocompleteOptions = {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: 'fr' }
    }

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, options)
    console.debug(`[${id}] Autocomplétion créée`)

    const listener = autocompleteRef.current.addListener('place_changed', handlePlaceChange)
    console.debug(`[${id}] Listener ajouté`)

    return () => {
      console.debug(`[${id}] Nettoyage des listeners`)
      if (listener) {
        listener.remove()
      }
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [mapsLoaded, id, handlePlaceChange])

  // Gérer les changements manuels
  const handleInputChange = useCallback((newValue: string) => {
    console.debug(`[${id}] handleInputChange appelé avec:`, newValue)
    isInternalChangeRef.current = true

    setState(prev => ({
      value: newValue,
      isValid: false,
      place: null
    }))

    onChange(newValue)

    setTimeout(() => {
      isInternalChangeRef.current = false
    }, 100)
  }, [id, onChange])

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (!isInternalChangeRef.current && initialValue !== state.value) {
      console.debug(`[${id}] Synchronisation avec la valeur externe:`, initialValue)
      setState(prev => ({
        ...prev,
        value: initialValue
      }))
    }
  }, [id, initialValue, state.value])

  // Pour les tests uniquement
  const __test_selectPlace = useCallback((place: google.maps.places.PlaceResult) => {
    autocompleteRef.current = {
      ...autocompleteRef.current,
      getPlace: () => place
    } as any
    handlePlaceChange()
  }, [handlePlaceChange])

  return {
    inputRef,
    value: state.value,
    isValid: state.isValid,
    place: state.place,
    handleInputChange,
    __test_selectPlace
  }
} 