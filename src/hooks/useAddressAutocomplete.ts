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
  errorType?: string
}

// Types d'erreurs possibles
const ERROR_TYPES = {
  NUMERIC_ONLY: 'NUMERIC_ONLY',
  TOO_SHORT: 'TOO_SHORT',
  MISSING_COMPONENTS: 'MISSING_COMPONENTS',
  NOT_SELECTED_FROM_DROPDOWN: 'NOT_SELECTED_FROM_DROPDOWN'
};

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

  // Prévalider l'adresse (avant sélection dans les suggestions)
  const prevalidateAddress = useCallback((address: string): { isValid: boolean, errorType?: string } => {
    // Vérifier si c'est seulement des chiffres
    if (/^\d+$/.test(address)) {
      return { isValid: false, errorType: ERROR_TYPES.NUMERIC_ONLY };
    }
    
    // Vérifier si c'est trop court
    if (address.length < 5) {
      return { isValid: false, errorType: ERROR_TYPES.TOO_SHORT };
    }
    
    // Si pas d'erreur évidente, l'entrée est potentiellement valide
    return { isValid: true };
  }, []);

  // Valider l'adresse
  const validateAddress = useCallback((place: google.maps.places.PlaceResult): { isValid: boolean, errorType?: string } => {
    if (!place.address_components) {
      return { isValid: false, errorType: ERROR_TYPES.NOT_SELECTED_FROM_DROPDOWN };
    }

    const requiredTypes = ['street_number', 'route', 'postal_code', 'locality']
    const foundTypes = place.address_components.map(component => component.types[0])
    
    const missingComponents = requiredTypes.filter(type => !foundTypes.includes(type))
    if (missingComponents.length > 0) {
      console.debug(`[${id}] Composants d'adresse manquants:`, missingComponents)
      return { isValid: false, errorType: ERROR_TYPES.MISSING_COMPONENTS };
    }

    return { isValid: true };
  }, [id])

  // Gérer le changement de lieu
  const handlePlaceChange = useCallback(() => {
    console.debug(`[${id}] handlePlaceChange appelé`)
    const place = autocompleteRef.current?.getPlace()
    
    if (!place || !place.formatted_address) {
      console.debug(`[${id}] Adresse invalide sélectionnée:`, place)
      return
    }

    const { isValid, errorType } = validateAddress(place)
    isInternalChangeRef.current = true

    setState({
      value: place.formatted_address,
      isValid,
      place: isValid ? place : null,
      errorType
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
      componentRestrictions: { country: 'fr' },
      types: ['address'] // Restreindre aux adresses uniquement
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
    
    // Si la valeur est strictement numérique et courte, ne pas la traiter comme une adresse valide
    const isSimpleNumeric = /^\d+$/.test(newValue);
    const isTooShort = newValue.length < 5;
    
    isInternalChangeRef.current = true

    // Prévalider l'adresse
    const { isValid, errorType } = prevalidateAddress(newValue);

    setState(prev => ({
      value: newValue,
      isValid: false, // Toujours faux jusqu'à ce qu'une suggestion soit sélectionnée
      place: null,
      errorType: isValid ? ERROR_TYPES.NOT_SELECTED_FROM_DROPDOWN : errorType
    }))

    // Pour les entrées évidemment invalides comme des chiffres seuls,
    // on met à jour l'interface mais on n'appelle pas onChange pour ne pas 
    // propager les valeurs invalides au composant parent
    if (!isSimpleNumeric && !isTooShort) {
      onChange(newValue)
    } else {
      console.debug(`[${id}] Entrée invalide ignorée:`, newValue, 
        isSimpleNumeric ? "(uniquement numérique)" : "",
        isTooShort ? "(trop court)" : "");
    }

    setTimeout(() => {
      isInternalChangeRef.current = false
    }, 100)
  }, [id, onChange, prevalidateAddress])

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (!isInternalChangeRef.current && initialValue !== state.value) {
      console.debug(`[${id}] Synchronisation avec la valeur externe:`, initialValue)
      
      // Prévalider la valeur initiale
      const { isValid, errorType } = prevalidateAddress(initialValue);
      
      setState(prev => ({
        ...prev,
        value: initialValue,
        isValid: false, // Toujours considérer comme invalide jusqu'à sélection
        errorType: isValid ? ERROR_TYPES.NOT_SELECTED_FROM_DROPDOWN : errorType
      }))
    }
  }, [id, initialValue, state.value, prevalidateAddress])

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
    errorType: state.errorType,
    handleInputChange,
    __test_selectPlace
  }
} 