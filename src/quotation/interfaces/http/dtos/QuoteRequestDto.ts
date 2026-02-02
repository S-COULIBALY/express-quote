import { ServiceType } from '../../../domain/enums/ServiceType';
import { logger } from '@/lib/logger';

export interface QuoteRequestDto {
  serviceType: ServiceType;
  // Quote data container (for complex data from catalogue)
  quoteData?: Record<string, any>;
  // Cleaning specific fields
  squareMeters?: number;
  numberOfRooms?: number;
  hasBalcony?: boolean;
  hasPets?: boolean;
  frequency?: 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
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

export function validateQuoteRequest(data: Record<string, any>): QuoteRequestDto {
  if (!data.serviceType) {
    throw new Error('Service type is required');
  }

  if (!Object.values(ServiceType).includes(data.serviceType)) {
    throw new Error('Invalid service type');
  }

  // ✅ VALIDATION : Vérifier que le __presetSnapshot est préservé
  if (data.__presetSnapshot) {
    logger.debug(`✅ __presetSnapshot préservé dans la validation: ${JSON.stringify(data.__presetSnapshot, null, 2)}`);
  }

  // ✅ AJOUT : Validation des plages de valeurs pour sécurité
  const validateNumericRange = (value: any, fieldName: string, min: number, max: number) => {
    if (value !== undefined && value !== null) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < min || numValue > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
      }
    }
  };

  // Validation des plages pour les champs communs
  validateNumericRange(data.duration, 'duration', 0.5, 30); // 30 minutes à 30 jours
  validateNumericRange(data.workers, 'workers', 1, 10); // 1 à 10 travailleurs
  validateNumericRange(data.distance, 'distance', 0, 1000); // 0 à 1000 km
  validateNumericRange(data.volume, 'volume', 0, 500); // 0 à 500 m³

  // ✅ AJOUT : Validation du prix calculé si présent
  if (data.calculatedPrice !== undefined) {
    validateNumericRange(data.calculatedPrice, 'calculatedPrice', 0, 50000); // 0 à 50k€
  }
  if (data.totalPrice !== undefined) {
    validateNumericRange(data.totalPrice, 'totalPrice', 0, 50000); // 0 à 50k€
  }

  // Validate moving specific fields (seul type actif)
  if (data.serviceType === ServiceType.MOVING || data.serviceType === ServiceType.MOVING_PREMIUM) {
    if (!data.volume || typeof data.volume !== 'number' || data.volume <= 0) {
      throw new Error('Volume is required and must be a positive number for moving service');
    }
    if (data.floorNumber !== undefined && (typeof data.floorNumber !== 'number' || data.floorNumber < 0)) {
      throw new Error('Floor number must be a non-negative number');
    }
    if (data.distance !== undefined && (typeof data.distance !== 'number' || data.distance <= 0)) {
      throw new Error('Distance must be a positive number');
    }
  }

  // ✅ CRITIQUE: Extraire les données sans créer de structure imbriquée
  const baseQuoteData = data.quoteData || data;
  
  // ✅ CORRECTION : Créer une structure plate sans imbrication
  const flatQuoteData: Record<string, any> = {};
  
  // Copier toutes les propriétés de baseQuoteData (sauf quoteData pour éviter la récursion)
  Object.keys(baseQuoteData).forEach(key => {
    if (key !== 'quoteData') {
      flatQuoteData[key] = baseQuoteData[key];
    }
  });
  
  // ✅ AJOUT : S'assurer que __presetSnapshot est préservé
  if (data.__presetSnapshot || baseQuoteData.__presetSnapshot) {
    flatQuoteData.__presetSnapshot = data.__presetSnapshot || baseQuoteData.__presetSnapshot;
  }
  
  const validatedData: QuoteRequestDto = {
    serviceType: data.serviceType,
    // ✅ CORRECTION : Utiliser la structure plate
    quoteData: flatQuoteData,
    // Extraire les champs spécifiques s'ils existent au niveau racine
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
    // ✅ AJOUT : __presetSnapshot au niveau racine aussi pour compatibilité
    __presetSnapshot: data.__presetSnapshot || baseQuoteData.__presetSnapshot
  };

  // ✅ AJOUT : Validation du __presetSnapshot pour sécurité
  if (data.__presetSnapshot) {
    const snapshot = data.__presetSnapshot;
    
    // Validation de la structure du snapshot
    if (typeof snapshot !== 'object' || snapshot === null) {
      throw new Error('__presetSnapshot must be a valid object');
    }
    
    // Validation des valeurs dans le snapshot
    if (snapshot.distance !== undefined) {
      validateNumericRange(snapshot.distance, 'snapshot.distance', 0, 1000);
    }
    if (snapshot.workers !== undefined) {
      validateNumericRange(snapshot.workers, 'snapshot.workers', 1, 10);
    }
    if (snapshot.duration !== undefined) {
      validateNumericRange(snapshot.duration, 'snapshot.duration', 0.5, 30);
    }
    if (snapshot.volume !== undefined) {
      validateNumericRange(snapshot.volume, 'snapshot.volume', 0, 500);
    }
    
    // Validation des données de promotion si présentes
    if (snapshot.promotionValue !== undefined) {
      validateNumericRange(snapshot.promotionValue, 'snapshot.promotionValue', 0, 100);
    }
    if (snapshot.promotionType && !['PERCENT', 'FIXED'].includes(snapshot.promotionType)) {
      throw new Error('Invalid promotion type in snapshot');
    }
  }

  // ✅ AJOUT : Validation de cohérence des données
  const validateDataConsistency = () => {
    // Vérifier que les prix sont cohérents
    if (data.calculatedPrice !== undefined && data.totalPrice !== undefined) {
      const priceDiff = Math.abs(data.calculatedPrice - data.totalPrice);
      const maxDiff = Math.max(data.calculatedPrice, data.totalPrice) * 0.02; // 2% de tolérance
      if (priceDiff > maxDiff) {
        throw new Error('Inconsistent prices: calculatedPrice and totalPrice differ too much');
      }
    }

    // Vérifier que les données actuelles sont dans des plages raisonnables par rapport au snapshot
    if (data.__presetSnapshot && data.duration && data.__presetSnapshot.duration) {
      const durationDiff = Math.abs(data.duration - data.__presetSnapshot.duration);
      if (durationDiff > 10) { // Plus de 10 jours de différence
        throw new Error('Duration differs too much from preset snapshot');
      }
    }

    if (data.__presetSnapshot && data.workers && data.__presetSnapshot.workers) {
      const workersDiff = Math.abs(data.workers - data.__presetSnapshot.workers);
      if (workersDiff > 5) { // Plus de 5 travailleurs de différence
        throw new Error('Workers count differs too much from preset snapshot');
      }
    }
  };

  validateDataConsistency();

  return validatedData;
} 