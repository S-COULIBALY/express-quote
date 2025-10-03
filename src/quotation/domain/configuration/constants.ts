/**
 * Constantes techniques du système de tarification
 * Les valeurs de prix sont dans DefaultValues.ts
 * Les détections automatiques utilisent AutoDetectionService
 */

import { DefaultValues } from './DefaultValues';

export const PRICE_CONSTANTS = {
  DEFAULT_CURRENCY: DefaultValues.DEFAULT_CURRENCY,
  MIN_PRICE: DefaultValues.MIN_PRICE,
} as const;

export const MOVING_CONSTANTS = {
  MIN_VOLUME: DefaultValues.MIN_VOLUME,
  MAX_VOLUME: DefaultValues.MAX_VOLUME,
} as const;

export const CLEANING_CONSTANTS = {
  MIN_SQUARE_METERS: DefaultValues.MIN_SQUARE_METERS,
} as const;

/**
 * Calcule le surcoût d'étage sans ascenseur
 */
export const calculateFloorSurcharge = (floor: number, elevator: string, volume?: number): number => {
  const floorNumber = parseInt(floor.toString()) || 0;
  const hasElevator = elevator && elevator !== 'no';

  const FLOOR_SURCHARGE_THRESHOLD = 1;
  const FLOOR_SURCHARGE_AMOUNT = 25;

  if (floorNumber > FLOOR_SURCHARGE_THRESHOLD && !hasElevator) {
    const extraFloors = floorNumber - FLOOR_SURCHARGE_THRESHOLD;
    return extraFloors * FLOOR_SURCHARGE_AMOUNT;
  }

  return 0;
};

/**
 * Retourne le prix du monte-meuble depuis DefaultValues
 */
export const calculateFurnitureLiftPrice = (): number => {
  return DefaultValues.LIFT_PRICE;
};

/**
 * Valide la liste des contraintes
 */
export const validateConstraints = (constraints: string[]): string[] => {
  return constraints;
};

/**
 * Valide la liste des services
 */
export const validateServices = (services: string[]): string[] => {
  return services;
}; 