import { ServiceType } from "../../../domain/enums/ServiceType";

export interface QuoteRequestDto {
  serviceType: ServiceType;
  // Quote data container (for complex data from catalogue)
  quoteData?: Record<string, any>;
  // Cleaning specific fields
  squareMeters?: number;
  numberOfRooms?: number;
  hasBalcony?: boolean;
  hasPets?: boolean;
  frequency?: "ONCE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  // Moving specific fields
  volume?: number;
  hasElevator?: boolean;
  floorNumber?: number;
  distance?: number;
  pickupAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  // Contact info (now optional)
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  // Common fields
  [key: string]: any;
}

export function validateQuoteRequest(
  data: Record<string, any>,
): QuoteRequestDto {
  if (!data.serviceType) {
    throw new Error("Service type is required");
  }

  if (!Object.values(ServiceType).includes(data.serviceType)) {
    throw new Error("Invalid service type");
  }

  // ✅ AJOUT : Validation des plages de valeurs pour sécurité
  const validateNumericRange = (
    value: any,
    fieldName: string,
    min: number,
    max: number,
  ) => {
    if (value !== undefined && value !== null) {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < min || numValue > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
      }
    }
  };

  // Validation des plages pour les champs communs
  validateNumericRange(data.distance, "distance", 0, 1000); // 0 à 1000 km
  validateNumericRange(data.volume, "volume", 0, 500); // 0 à 500 m³

  // ✅ AJOUT : Validation du prix calculé si présent
  if (data.calculatedPrice !== undefined) {
    validateNumericRange(data.calculatedPrice, "calculatedPrice", 0, 50000); // 0 à 50k€
  }
  if (data.totalPrice !== undefined) {
    validateNumericRange(data.totalPrice, "totalPrice", 0, 50000); // 0 à 50k€
  }

  // Validate moving specific fields (seul type actif)
  // Après normalizeQuoteData, les champs sont aplatis : estimatedVolume, distanceEstimee sont au niveau racine
  if (
    data.serviceType === ServiceType.MOVING ||
    data.serviceType === ServiceType.MOVING_PREMIUM
  ) {
    const volume =
      data.volume ??
      data.estimatedVolume ??
      data.quoteData?.estimatedVolume ??
      data.quoteData?.volume;
    const volumeNum = typeof volume === "string" ? parseFloat(volume) : volume;
    if (!volumeNum || typeof volumeNum !== "number" || volumeNum <= 0) {
      throw new Error(
        "Volume is required and must be a positive number for moving service",
      );
    }
    data.volume = volumeNum;

    if (
      data.floorNumber !== undefined &&
      (typeof data.floorNumber !== "number" || data.floorNumber < 0)
    ) {
      throw new Error("Floor number must be a non-negative number");
    }
    const dist =
      data.distance ??
      data.distanceEstimee ??
      data.quoteData?.distanceEstimee ??
      data.quoteData?.distance;
    if (dist !== undefined) {
      const distNum = typeof dist === "string" ? parseFloat(dist) : dist;
      if (typeof distNum !== "number" || distNum <= 0) {
        throw new Error("Distance must be a positive number");
      }
      data.distance = distNum;
    }
  }

  // ✅ CRITIQUE: Extraire les données sans créer de structure imbriquée
  const baseQuoteData = data.quoteData || data;

  // ✅ CORRECTION : Créer une structure plate sans imbrication
  const flatQuoteData: Record<string, any> = {};

  // Copier toutes les propriétés de baseQuoteData (sauf quoteData pour éviter la récursion)
  Object.keys(baseQuoteData).forEach((key) => {
    if (key !== "quoteData") {
      flatQuoteData[key] = baseQuoteData[key];
    }
  });

  const validatedData: QuoteRequestDto = {
    serviceType: data.serviceType,
    quoteData: flatQuoteData,
    squareMeters: data.squareMeters,
    numberOfRooms: data.numberOfRooms,
    hasBalcony: data.hasBalcony,
    hasPets: data.hasPets,
    frequency: data.frequency,
    volume: data.volume,
    hasElevator: data.hasElevator,
    floorNumber: data.floorNumber,
    distance: data.distance,
    pickupAddress: data.pickupAddress,
    deliveryAddress: data.deliveryAddress,
    contact: data.contact,
  };

  // Validation de cohérence des prix
  if (data.calculatedPrice !== undefined && data.totalPrice !== undefined) {
    // totalPrice doit être >= calculatedPrice (ajout d'options assurance/protection)
    if (data.totalPrice < data.calculatedPrice * 0.9) {
      throw new Error(
        "Inconsistent prices: totalPrice cannot be significantly lower than calculatedPrice",
      );
    }
    const priceDiff = Math.abs(data.calculatedPrice - data.totalPrice);
    const maxDiff = Math.max(data.calculatedPrice, data.totalPrice) * 0.1; // 10% de tolérance
    if (priceDiff > maxDiff) {
      throw new Error(
        "Inconsistent prices: calculatedPrice and totalPrice differ too much",
      );
    }
  }

  return validatedData;
}
