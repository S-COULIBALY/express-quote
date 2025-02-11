declare namespace google.maps {
  interface PlaceResult {
    address_components?: AddressComponent[]
    formatted_address?: string
    geometry?: {
      location: LatLng
    }
  }

  interface AddressComponent {
    long_name: string
    short_name: string
    types: string[]
  }
} 