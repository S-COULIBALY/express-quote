'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlaceResult } from '@/types/google-maps'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete'

interface AddressAutocompleteProps {
  id: string
  label: string
  value: string
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
  required?: boolean
  placeholder?: string
}

// Messages d'erreur selon le type d'erreur
const ERROR_MESSAGES = {
  NUMERIC_ONLY: "Ce numéro seul n'est pas une adresse valide",
  TOO_SHORT: "Cette adresse est trop courte",
  MISSING_COMPONENTS: "L'adresse doit contenir un numéro, une rue, une ville et un code postal",
  NOT_SELECTED_FROM_DROPDOWN: "Veuillez sélectionner une adresse dans la liste des suggestions"
};

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  required,
  placeholder
}: AddressAutocompleteProps) {
  const {
    inputRef,
    value: inputValue,
    isValid,
    errorType,
    handleInputChange
  } = useAddressAutocomplete({
    id,
    initialValue: value,
    onChange
  })

  // Obtenir le message d'erreur approprié
  const getErrorMessage = () => {
    if (!errorType) return "";
    return ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES] || "Adresse invalide";
  };

  // Déterminer la couleur de la bordure en fonction du type d'erreur
  const getBorderClass = () => {
    if (!inputValue) return 'border-gray-300';
    if (isValid) return 'border-green-500';
    
    // Différentes couleurs selon la gravité de l'erreur
    switch (errorType) {
      case 'NUMERIC_ONLY':
      case 'TOO_SHORT':
        return 'border-red-500';
      case 'MISSING_COMPONENTS':
      case 'NOT_SELECTED_FROM_DROPDOWN': 
      default:
        return 'border-yellow-500';
    }
  };

  // Empêcher la soumission du formulaire sur Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  // Bloquer les entrées qui sont juste des chiffres
  const handleInputChangeWithValidation = (value: string) => {
    // Empêcher la saisie de nombres seuls
    if (/^\d+$/.test(value)) {
      console.warn("Tentative de saisie d'un nombre seul:", value);
    }
    
    handleInputChange(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={inputValue}
          onChange={(e) => handleInputChangeWithValidation(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full p-2 border rounded-md ${getBorderClass()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          autoComplete="off"
          aria-invalid={!isValid && !!inputValue}
          aria-describedby={`${id}-error`}
        />
        {!isValid && inputValue && (
          <div className="absolute right-2 top-2 text-yellow-500">
            <span title={getErrorMessage()}>⚠️</span>
          </div>
        )}
      </div>
      {!isValid && inputValue && (
        <p id={`${id}-error`} className={`text-sm ${errorType && ['NUMERIC_ONLY', 'TOO_SHORT'].includes(errorType) ? 'text-red-600' : 'text-yellow-600'}`}>
          {getErrorMessage()}
        </p>
      )}
    </div>
  )
}

// Composant spécialisé pour l'adresse de départ
export function PickupAddressAutocomplete(props: AddressAutocompleteProps) {
  return <AddressAutocomplete {...props} />
}

// Composant spécialisé pour l'adresse d'arrivée
export function DeliveryAddressAutocomplete(props: AddressAutocompleteProps) {
  return <AddressAutocomplete {...props} />
}

// Composant simplifié pour le formulaire de nettoyage
export interface SimpleAddressAutocompleteProps {
  onSelect?: (place: google.maps.places.PlaceResult) => void
  className?: string
  placeholder?: string
}

export function SimpleAddressAutocomplete({
  onSelect,
  className = '',
  placeholder = 'Entrez une adresse'
}: SimpleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  
  // Initialiser l'autocomplete
  useEffect(() => {
    if (!inputRef.current || !window.google) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'fr' },
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setInputValue(place.formatted_address)
        if (onSelect) onSelect(place)
      }
    })

    return () => {
      // Google Maps API n'offre pas de méthode pour nettoyer les event listeners
      // Cette fonction est appelée lors du démontage du composant
    }
  }, [onSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  )
} 