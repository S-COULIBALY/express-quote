/**
 * ComputedContext - Résultats calculés par le moteur et les modules
 *
 * Structure enrichie progressivement par les modules.
 * Initialisée par le QuoteEngine, jamais par les modules.
 */

// ============================================================================
// INTERFACES DE SUPPORT
// ============================================================================

/**
 * Catégories de coûts disponibles
 *
 * TRANSPORT   : Coûts de déplacement réels (carburant, péages, trafic)
 * SURCHARGE   : Forfaits kilométriques/exploitation (longue distance)
 * VEHICLE     : Location véhicule uniquement
 * EQUIPMENT   : Équipements spéciaux (monte-meubles, etc.)
 * LOGISTICS   : Hébergement, arrêts, logistique
 * SERVICE     : Services optionnels client (emballage, nettoyage, stockage, démontage, remontage)
 * LABOR       : Main d'œuvre (base, pénalité accès, flexibilité)
 * RISK        : Surcoûts liés aux risques
 * INSURANCE   : Assurances
 * TEMPORAL    : Majorations calendaires (fin de mois, week-end)
 *
 * @deprecated ADMINISTRATIVE - Remplacé par SERVICE (rétrocompatibilité)
 */
export type CostCategory =
  | 'TRANSPORT'
  | 'SURCHARGE'
  | 'VEHICLE'
  | 'EQUIPMENT'
  | 'LOGISTICS'
  | 'SERVICE'
  | 'LABOR'
  | 'RISK'
  | 'INSURANCE'
  | 'TEMPORAL'
  | 'ADMINISTRATIVE'; // @deprecated - Utiliser SERVICE

export interface Cost {
  moduleId: string;
  label: string;
  amount: number;
  category: CostCategory;
  metadata?: Record<string, any>;
}

export interface PriceAdjustment {
  moduleId: string;
  label: string;
  amount: number; // Positif = surcharge, Négatif = réduction
  type: 'SURCHARGE' | 'DISCOUNT';
  reason: string;
  metadata?: Record<string, any>;
}

export interface RiskContribution {
  moduleId: string;
  amount: number; // Points de risque (0-100)
  reason: string;
  metadata?: Record<string, any>;
}

export interface LegalImpact {
  moduleId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'LIABILITY_LIMITATION' | 'INSURANCE_CAP' | 'REGULATORY' | 'CONSENT';
  message: string;
  metadata?: Record<string, any>;
}

export interface Requirement {
  type: string; // "LIFT_RECOMMENDED", "PACKING_RECOMMENDED", etc.
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  moduleId: string;
  metadata?: Record<string, any>;
}

export interface CrossSellProposal {
  id: string;
  label: string;
  reason: string;
  benefit: string;
  priceImpact: number;
  optional: boolean;
  moduleId: string;
  basedOnRequirement?: string; // ID du requirement qui a déclenché cette proposition
  metadata?: Record<string, any>;
}

// ============================================================================
// COMPUTED CONTEXT PRINCIPAL
// ============================================================================

export interface ComputedContext {
  // ============================================================================
  // VOLUME & VÉHICULES
  // ============================================================================
  baseVolume?: number; // m³ brut
  adjustedVolume?: number; // m³ après ajustements
  vehicleCount?: number;
  vehicleTypes?: string[];

  // ============================================================================
  // TEMPS & MAIN-D'ŒUVRE
  // ============================================================================
  baseDurationHours?: number;
  extraDurationHours?: number;
  totalDurationHours?: number;
  workersCount?: number;

  // ============================================================================
  // DISTANCE & TRANSPORT
  // ============================================================================
  distanceKm?: number;
  estimatedTravelTimeMinutes?: number;
  isLongDistance?: boolean; // IDF → Province

  // ============================================================================
  // COÛTS STRUCTURELS (séparés des ajustements)
  // ============================================================================
  costs: Cost[];

  // ============================================================================
  // PRICING
  // ============================================================================
  basePrice?: number; // Somme des costs × (1 + marge)
  adjustments: PriceAdjustment[]; // Surcharges et réductions
  finalPrice?: number; // basePrice + sum(adjustments)
  marginRate?: number; // Taux de marge appliqué (ex: 0.30 = 30%)

  // ============================================================================
  // RISQUE (contributions agrégées par le moteur)
  // ============================================================================
  riskContributions: RiskContribution[];
  riskScore?: number; // Agrégé par le moteur (0-100)
  manualReviewRequired?: boolean;

  // ============================================================================
  // JURIDIQUE
  // ============================================================================
  legalImpacts: LegalImpact[];
  insuranceNotes: string[];

  // ============================================================================
  // BESOINS MÉTIER (séparés du cross-selling)
  // ============================================================================
  requirements: Requirement[];

  // ============================================================================
  // CROSS-SELLING (basé sur les requirements)
  // ============================================================================
  crossSellProposals: CrossSellProposal[];

  // ============================================================================
  // OPÉRATIONNEL & TRAÇABILITÉ
  // ============================================================================
  operationalFlags: string[]; // "LIFT_REQUIRED", "PARKING_AUTHORIZATION_NEEDED", etc.
  activatedModules: string[]; // IDs des modules exécutés (traçabilité)
  metadata: Record<string, any>;
}

/**
 * Factory pour créer un ComputedContext vide
 * UTILISÉ UNIQUEMENT PAR LE MOTEUR, JAMAIS PAR LES MODULES
 */
export function createEmptyComputedContext(): ComputedContext {
  return {
    costs: [],
    adjustments: [],
    riskContributions: [],
    legalImpacts: [],
    insuranceNotes: [],
    requirements: [],
    crossSellProposals: [],
    operationalFlags: [],
    activatedModules: [],
    metadata: {},
  };
}
