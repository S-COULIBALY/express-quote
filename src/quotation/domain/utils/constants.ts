export const PRICE_CONSTANTS = {
  DEFAULT_CURRENCY: 'EUR',
  MIN_PRICE: 0,
  TAX_RATE: 0.20, // 20% TVA
} as const;

export const MOVING_CONSTANTS = {
  MIN_VOLUME: 1,
  MAX_VOLUME: 200,
  // BASE_PRICE_PER_M3 migré vers DefaultValues.ts (35€)
  FLOOR_PRICE_MULTIPLIER: 0.1, // +10% par étage sans ascenseur
  WEEKEND_PRICE_MULTIPLIER: 1.25, // +25% le weekend
} as const;

export const CLEANING_CONSTANTS = {
  MIN_SQUARE_METERS: 10,
  BASE_PRICE_PER_M2: 2,
  ROOM_EXTRA_PRICE: 10,
  BALCONY_MULTIPLIER: 1.1, // +10% avec balcon
  PETS_MULTIPLIER: 1.15, // +15% avec animaux
  FREQUENCY_DISCOUNTS: {
    'weekly': { amount: 0.2, priority: 2 },    // -20%
    'biweekly': { amount: 0.15, priority: 2 }, // -15%
    'monthly': { amount: 0.1, priority: 2 }    // -10%
  }
} as const; 