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
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
          removeListener: (listener: any) => void;
        };
      };
    };
  }

  namespace google.maps.places {
    interface AutocompleteOptions {
      types?: string[];
      componentRestrictions?: { country: string };
      fields?: string[];
    }

    interface Autocomplete {
      addListener: (event: string, handler: () => void) => any;
      getPlace: () => PlaceResult;
    }

    interface PlaceResult {
      formatted_address?: string;
      geometry?: {
        location: { lat: () => number; lng: () => number };
      };
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
    }
  }
}

export {}; 