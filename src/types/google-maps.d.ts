export interface PlaceResult extends google.maps.places.PlaceResult {
  formatted_address?: string
  geometry?: {
    location?: google.maps.LatLng
  }
  distance?: {
    text: string
    value: number
  }
}

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

declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
    google: typeof google;
  }
}

export {}; 