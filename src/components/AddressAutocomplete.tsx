'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  id: string
  value: string
  onChange: (value: string) => void
  onSelect: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  required?: boolean
}

export function AddressAutocomplete({ id, value, onChange, onSelect, placeholder, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [inputValue, setInputValue] = useState(value)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(
    typeof window !== 'undefined' && !!window.google
  )

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleGoogleMapsLoaded = () => {
      setIsGoogleMapsLoaded(true)
    }

    if (!isGoogleMapsLoaded) {
      window.addEventListener('google-maps-loaded', handleGoogleMapsLoaded)
    }

    return () => {
      window.removeEventListener('google-maps-loaded', handleGoogleMapsLoaded)
    }
  }, [isGoogleMapsLoaded])

  useEffect(() => {
    if (!inputRef.current || !isGoogleMapsLoaded || autocompleteRef.current) return

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address', 'geometry']
      })

      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          setInputValue(place.formatted_address)
          onChange(place.formatted_address)
          onSelect(place)
        }
      })

      return () => {
        if (listener) google.maps.event.removeListener(listener)
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
      }
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error)
    }
  }, [isGoogleMapsLoaded, onChange, onSelect])

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onBlur={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border rounded-md"
      autoComplete="off"
    />
  )
} 