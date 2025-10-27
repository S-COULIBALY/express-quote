/**
 * UUIDs des règles métier
 *
 * Ce fichier centralise les UUIDs des règles importantes pour éviter
 * le hardcoding de noms de contraintes dans le code.
 *
 * ⚠️ Ces UUIDs doivent correspondre exactement aux IDs dans la base de données.
 */

// ============================================================================
// CONTRAINTES CONSOMMABLES PAR LE MONTE-MEUBLE
// ============================================================================

/**
 * Contraintes d'accès au bâtiment consommées par le monte-meuble
 */
export const RULE_UUID_ESCALIER_DIFFICILE = '40acdd70-5c1f-4936-a53c-8f52e6695a4c';
export const RULE_UUID_COULOIRS_ETROITS = 'b2b8f00b-00a2-456c-ad06-1150d25d71a3';

/**
 * Contraintes liées aux objets consommées par le monte-meuble
 */
export const RULE_UUID_MEUBLES_ENCOMBRANTS = 'a58d62cc-8de6-4ac5-99ec-0428e268c025';
export const RULE_UUID_OBJETS_LOURDS = 'fb522208-5206-482f-9ad5-9abf8cf6f0b1';

/**
 * Contraintes de distance consommées par le monte-meuble
 */
export const RULE_UUID_DISTANCE_PORTAGE = 'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901';
export const RULE_UUID_PASSAGE_INDIRECT = '24e4e233-655e-4730-9b6b-451b3731789a';
export const RULE_UUID_ACCES_MULTINIVEAU = '293dc311-6f22-42d8-8b31-b322c0e888f9';

// ============================================================================
// ÉQUIPEMENTS
// ============================================================================

/**
 * Monte-meuble (auto-détecté selon étage/ascenseur)
 */
export const RULE_UUID_MONTE_MEUBLE = '5cdd32e3-23d5-413e-a9b4-26a746066ce0';

// ============================================================================
// GROUPES DE CONTRAINTES
// ============================================================================

/**
 * Liste des contraintes consommées par le monte-meuble
 * Utilisé par AutoDetectionService pour éviter la double facturation
 */
export const CONSUMED_BY_FURNITURE_LIFT = [
  RULE_UUID_ESCALIER_DIFFICILE,
  RULE_UUID_COULOIRS_ETROITS,
  RULE_UUID_MEUBLES_ENCOMBRANTS,
  RULE_UUID_OBJETS_LOURDS,
  RULE_UUID_DISTANCE_PORTAGE,
  RULE_UUID_PASSAGE_INDIRECT,
  RULE_UUID_ACCES_MULTINIVEAU,
] as const;

/**
 * Contraintes critiques qui nécessitent un monte-meuble
 */
export const CRITICAL_CONSTRAINTS_REQUIRING_LIFT = [
  RULE_UUID_ESCALIER_DIFFICILE,
  RULE_UUID_OBJETS_LOURDS,
  RULE_UUID_MEUBLES_ENCOMBRANTS,
] as const;
