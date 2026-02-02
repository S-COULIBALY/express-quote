/**
 * Constantes monétaires utilisées par domain/utils/utils.ts.
 * Les autres constantes de tarification sont dans quotation-module/config/modules.config.ts.
 */
export const PRICE_CONSTANTS = {
  DEFAULT_CURRENCY: 'EUR',
  MIN_PRICE: 0,
  TAX_RATE: 0.20, // 20% TVA
} as const;
