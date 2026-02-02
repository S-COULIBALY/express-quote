/**
 * Types de services proposés.
 * Seuls MOVING et MOVING_PREMIUM sont actifs (déménagement sur mesure).
 * Les chaînes legacy (CLEANING, PACKING, DELIVERY, etc.) peuvent encore exister en BDD ;
 * elles sont mappées vers MOVING à la lecture.
 */
export enum ServiceType {
  MOVING = 'MOVING',
  MOVING_PREMIUM = 'MOVING_PREMIUM',
}
