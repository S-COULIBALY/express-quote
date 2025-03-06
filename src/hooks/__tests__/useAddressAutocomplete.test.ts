import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { useAddressAutocomplete } from '../useAddressAutocomplete'

jest.mock('../useGoogleMaps', () => ({
  useGoogleMaps: () => true
}))

describe('useAddressAutocomplete', () => {
  let mockInput: HTMLInputElement
  let mockAutocomplete: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockInput = document.createElement('input')
    document.body.appendChild(mockInput)

    // Mock LatLng constructor
    global.google = {
      maps: {
        LatLng: jest.fn((lat: number, lng: number) => ({
          lat: () => lat,
          lng: () => lng,
          equals: jest.fn(),
          toJSON: jest.fn(),
          toUrlValue: jest.fn(),
          toString: jest.fn()
        })),
        places: {
          Autocomplete: jest.fn(() => mockAutocomplete)
        },
        event: {
          clearInstanceListeners: jest.fn()
        }
      }
    } as any

    // Mock Google Maps
    const mockPlace: google.maps.places.PlaceResult = {
      formatted_address: '20 Rue de Paris, 75020 Paris, France',
      address_components: [
        { types: ['street_number'], long_name: '20', short_name: '20' },
        { types: ['route'], long_name: 'Rue de Paris', short_name: 'Rue de Paris' },
        { types: ['postal_code'], long_name: '75020', short_name: '75020' },
        { types: ['locality'], long_name: 'Paris', short_name: 'Paris' }
      ],
      geometry: {
        location: new google.maps.LatLng(48.8566, 2.3522)
      }
    }

    mockAutocomplete = {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      getPlace: jest.fn(() => mockPlace)
    }
  })

  afterEach(() => {
    document.body.removeChild(mockInput)
    jest.resetModules()
  })

  it('should initialize with the provided value', () => {
    const { result } = renderHook(() => useAddressAutocomplete({
      id: 'test',
      initialValue: 'Initial Address',
      onChange: jest.fn()
    }))

    act(() => {
      result.current.inputRef.current = mockInput
    })

    expect(result.current.value).toBe('Initial Address')
    expect(result.current.isValid).toBe(false)
  })

  it('should handle manual input changes', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useAddressAutocomplete({
      id: 'test',
      initialValue: '',
      onChange
    }))

    act(() => {
      result.current.inputRef.current = mockInput
      result.current.handleInputChange('New Address')
    })

    expect(result.current.value).toBe('New Address')
    expect(result.current.isValid).toBe(false)
    expect(onChange).toHaveBeenCalledWith('New Address')
  })

  it('should validate complete addresses', async () => {
    const onChange = jest.fn()
    const { result } = renderHook(() => useAddressAutocomplete({
      id: 'test',
      initialValue: '',
      onChange
    }))

    // Initialiser l'input et l'autocomplétion
    act(() => {
      result.current.inputRef.current = mockInput
    })

    // Attendre que l'effet soit exécuté
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Simuler la sélection d'une adresse
    await act(async () => {
      result.current.__test_selectPlace(mockAutocomplete.getPlace())
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onChange).toHaveBeenCalledWith(
      mockAutocomplete.getPlace().formatted_address,
      mockAutocomplete.getPlace()
    )
  })

  it('should handle incomplete addresses', async () => {
    const onChange = jest.fn()
    const incompleteMockPlace: google.maps.places.PlaceResult = {
      ...mockAutocomplete.getPlace(),
      address_components: [
        { types: ['route'], long_name: 'Rue de Paris', short_name: 'Rue de Paris' },
        { types: ['locality'], long_name: 'Paris', short_name: 'Paris' }
      ]
    }

    mockAutocomplete.getPlace.mockReturnValueOnce(incompleteMockPlace)

    const { result } = renderHook(() => useAddressAutocomplete({
      id: 'test',
      initialValue: '',
      onChange
    }))

    // Initialiser l'input et l'autocomplétion
    act(() => {
      result.current.inputRef.current = mockInput
    })

    // Attendre que l'effet soit exécuté
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Simuler la sélection d'une adresse
    await act(async () => {
      result.current.__test_selectPlace(incompleteMockPlace)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onChange).toHaveBeenCalledWith(
      incompleteMockPlace.formatted_address,
      undefined
    )
  })
}) 