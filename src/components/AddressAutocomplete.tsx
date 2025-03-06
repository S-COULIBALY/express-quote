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
    handleInputChange
  } = useAddressAutocomplete({
    id,
    initialValue: value,
    onChange
  })

  // Empêcher la soumission du formulaire sur Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

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
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full p-2 border rounded-md ${
            !isValid && inputValue ? 'border-yellow-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          autoComplete="off"
        />
        {!isValid && inputValue && (
          <div className="absolute right-2 top-2 text-yellow-500">
            <span title="Adresse incomplète">⚠️</span>
          </div>
        )}
      </div>
      {!isValid && inputValue && (
        <p className="text-sm text-yellow-600">
          Veuillez sélectionner une adresse dans la liste des suggestions
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