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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !inputRef.current) return

    const initAutocomplete = () => {
      if (typeof google === 'undefined' || !inputRef.current) return

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'FR' },
          fields: ['address_components', 'formatted_address', 'geometry']
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          if (place?.formatted_address) {
            onChange(place.formatted_address)
            onSelect(place)
          }
        })
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error)
      }
    }

    initAutocomplete()

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [mounted, onChange, onSelect])

  if (!mounted) {
    return (
      <input
        type="text"
        id={id}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border rounded-md"
      />
    )
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border rounded-md"
      autoComplete="off"
    />
  )
} 