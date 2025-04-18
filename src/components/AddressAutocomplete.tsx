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
  hideLabel?: boolean
}

// Messages d'erreur selon le type d'erreur
const ERROR_MESSAGES = {
  NUMERIC_ONLY: "Ce numéro seul n'est pas une adresse valide",
  TOO_SHORT: "Cette adresse est trop courte",
  MISSING_COMPONENTS: "L'adresse doit contenir un numéro, une rue, une ville et un code postal",
  NOT_SELECTED_FROM_DROPDOWN: "Veuillez sélectionner une adresse dans la liste des suggestions",
  MAPS_API_ERROR: "Service de localisation temporairement indisponible"
};

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  hideLabel = false
}: AddressAutocompleteProps) {
  const {
    inputRef,
    value: inputValue,
    isValid,
    errorType,
    mapsError,
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
      case 'MAPS_API_ERROR':
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

  // Afficher une alerte pour l'erreur API Google Maps
  if (mapsError) {
    return (
      <div className="flex flex-col gap-2">
        {!hideLabel && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="p-3 border border-red-300 bg-red-50 rounded-md text-sm text-red-700">
          <p className="font-medium mb-1">Service de localisation indisponible</p>
          <p>Impossible de charger le service d'adresses. Veuillez réessayer ultérieurement ou saisir manuellement l'adresse.</p>
        </div>
        <input
          type="text"
          id={id}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full p-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
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
        <p id={`${id}-error`} className={`text-sm ${errorType && ['NUMERIC_ONLY', 'TOO_SHORT', 'MAPS_API_ERROR'].includes(errorType) ? 'text-red-600' : 'text-yellow-600'}`}>
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
  const { mapsLoaded, error: mapsError } = useGoogleMaps()
  const [waiting, setWaiting] = useState(true)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const initAttempts = useRef(0)
  const maxAttempts = 5

  // Fonction pour initialiser l'autocomplete
  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) {
      if (initAttempts.current < maxAttempts) {
        initAttempts.current++;
        console.log(`Tentative d'initialisation de l'autocomplete ${initAttempts.current}/${maxAttempts}...`);
        // Réessayer dans 1 seconde
        setTimeout(initAutocomplete, 1000);
      } else {
        console.error('Impossible d\'initialiser l\'autocomplete après plusieurs tentatives');
        setWaiting(false);
      }
      return;
    }

    try {
      // Éviter d'initialiser plusieurs fois
      if (autocompleteRef.current) {
        return;
      }

      console.log('Initialisation de l\'autocomplete...');
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        types: ['address']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setInputValue(place.formatted_address);
            if (onSelect) onSelect(place);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du lieu:', error);
        }
      });

      setWaiting(false);
      console.log('Autocomplete initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Google Maps Autocomplete:', error);
      setWaiting(false);
    }
  };

  // Cleanup function
  const cleanupAutocomplete = () => {
    if (autocompleteRef.current) {
      try {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      } catch (error) {
        console.error('Erreur lors du nettoyage de l\'autocomplete:', error);
      }
    }
  };

  // Initialiser l'autocomplete quand Google Maps est chargé
  useEffect(() => {
    // Attendre que maps soit chargé
    if (mapsLoaded && window.google?.maps?.places) {
      initAutocomplete();
    } else {
      // Commencer le timer pour les tentatives d'initialisation
      const timer = setTimeout(() => {
        if (window.google?.maps?.places) {
          initAutocomplete();
        } else {
          setWaiting(false);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    return cleanupAutocomplete;
  }, [mapsLoaded, onSelect]);

  // Afficher un indicateur de chargement pendant l'attente
  if (waiting && !mapsError) {
    return (
      <div className="w-full">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`${placeholder} (chargement...)`}
          disabled
          className={className + " opacity-75"}
        />
      </div>
    );
  }

  // Afficher une notification d'erreur si l'API ne se charge pas
  if (mapsError) {
    return (
      <div className="w-full">
        <div className="mb-2 p-2 border border-red-300 bg-red-50 rounded-md text-xs text-red-700">
          Service de localisation indisponible. Veuillez saisir l'adresse manuellement.
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // Permettre la saisie manuelle malgré l'erreur
            if (onSelect && e.target.value) {
              onSelect({ formatted_address: e.target.value } as google.maps.places.PlaceResult)
            }
          }}
          placeholder={placeholder}
          className={className || "w-full p-2 border border-red-300 rounded-md"}
        />
      </div>
    )
  }

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
  );
} 