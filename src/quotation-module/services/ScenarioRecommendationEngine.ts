/**
 * ScenarioRecommendationEngine - Recommande le scénario le plus adapté
 *
 * Analyse les données du formulaire pour recommander intelligemment
 * le scénario le plus approprié à la situation du client.
 *
 * CRITÈRES D'ANALYSE :
 * - Étage et ascenseur (sécurité)
 * - Volume et confiance estimation
 * - Objets lourds/encombrants/de valeur
 * - Distance du déménagement
 * - Budget implicite (surface, logement)
 * - Contraintes d'accès
 */

import { QuoteContext } from '../core/QuoteContext';

/**
 * Phrases d'accroche orientées client (à la première personne)
 * Pour affichage direct en UI
 */
export const CLIENT_PHRASES = {
  ECO: [
    'Je prépare tout moi-même avant le jour J.',
    'J\'emballe mes cartons et démonte mes meubles.',
    'Je veux payer le prix le plus bas possible.',
    'Je suis prêt à m\'investir pour économiser.',
  ],
  STANDARD: [
    'Je participe, mais je ne veux pas tout faire seul.',
    'J\'emballe mes affaires personnelles et fragiles.',
    'Je laisse les professionnels gérer le plus lourd.',
    'Je cherche le meilleur équilibre entre prix et tranquillité.',
  ],
  CONFORT: [
    'Je veux être tranquille et gagner du temps.',
    'Je laisse les déménageurs tout emballer pour moi.',
    'Je ne veux pas porter ni démonter mes meubles.',
    'Je préfère déléguer pour éviter le stress.',
  ],
  SECURITY_PLUS: [
    'Je veux zéro risque pour mes meubles et mon logement.',
    'Je veux une protection maximale avec assurance incluse.',
    'Je veux une protection maximale, même si ce n\'est pas le moins cher.',
    'Je privilégie la sécurité et la tranquillité d\'esprit.',
  ],
  PREMIUM: [
    'Je ne veux rien gérer.',
    'Je veux un service clé en main, du début à la fin.',
    'Je veux retrouver mon nouveau logement prêt à vivre.',
    'Je veux récupérer ma caution grâce au nettoyage fin de bail.',
    'Je veux que tout soit fait à ma place.',
  ],
  FLEX: [
    'Je ne veux pas de mauvaise surprise le jour J.',
    'Je veux que l\'équipe s\'adapte si le volume change.',
    'Je préfère de la souplesse plutôt que des conflits.',
    'Je veux un déménagement qui s\'ajuste à la réalité.',
  ],
} as const;

/**
 * Score de recommandation pour chaque scénario
 */
export interface ScenarioScore {
  scenarioId: string;
  score: number;
  reasons: string[];
  warnings: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Phrases orientées client (à la première personne) */
  clientPhrases: readonly string[];
}

/**
 * Résultat de l'analyse de recommandation
 */
export interface RecommendationResult {
  recommended: string;
  scores: ScenarioScore[];
  primaryReasons: string[];
  alternativeRecommendation?: string;
  alternativeReasons?: string[];
}

/**
 * Seuils pour les critères d'analyse
 */
const THRESHOLDS = {
  // Étages
  HIGH_FLOOR: 3,
  CRITICAL_FLOOR: 5,

  // Volume
  SMALL_VOLUME: 15, // m³ - studio/petit F2
  MEDIUM_VOLUME: 30, // m³ - F3/F4
  LARGE_VOLUME: 50, // m³ - maison

  // Distance
  SHORT_DISTANCE: 50, // km - Île-de-France
  MEDIUM_DISTANCE: 300, // km - régional
  LONG_DISTANCE: 500, // km - national (arrêt nuit)

  // Valeur déclarée
  HIGH_VALUE: 15000, // € - objets de valeur significatifs
  PREMIUM_VALUE: 50000, // € - valeur très élevée
};

/**
 * Moteur de recommandation de scénario
 */
export class ScenarioRecommendationEngine {
  /**
   * Analyse le contexte et recommande le scénario le plus adapté
   */
  static analyze(ctx: QuoteContext): RecommendationResult {
    const scores: ScenarioScore[] = [
      this.scoreECO(ctx),
      this.scoreSTANDARD(ctx),
      this.scoreCONFORT(ctx),
      this.scoreSECURITY_PLUS(ctx),
      this.scorePREMIUM(ctx),
      this.scoreFLEX(ctx),
    ];

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    const recommended = scores[0];
    const alternative = scores[1];

    return {
      recommended: recommended.scenarioId,
      scores,
      primaryReasons: recommended.reasons.slice(0, 3), // Top 3 raisons
      alternativeRecommendation: alternative.score > 60 ? alternative.scenarioId : undefined,
      alternativeReasons: alternative.score > 60 ? alternative.reasons.slice(0, 2) : undefined,
    };
  }

  /**
   * Score pour le scénario ECO
   * Idéal pour : petits budgets, petits volumes, RDC/ascenseur, peu d'objets fragiles
   */
  private static scoreECO(ctx: QuoteContext): ScenarioScore {
    let score = 50; // Score de base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅ Favorise si petit volume
    if (ctx.estimatedVolume && ctx.estimatedVolume <= THRESHOLDS.SMALL_VOLUME) {
      score += 20;
      reasons.push('Volume réduit adapté à une formule économique');
    }

    // ✅ Favorise si RDC ou ascenseur large
    if (this.hasEasyAccess(ctx)) {
      score += 15;
      reasons.push('Accès facile (RDC ou ascenseur adapté)');
    }

    // ✅ Favorise si courte distance
    if (ctx.distance && ctx.distance <= THRESHOLDS.SHORT_DISTANCE) {
      score += 10;
      reasons.push('Courte distance favorable');
    }

    // ❌ Pénalise si objets de valeur
    if (ctx.artwork || ctx.piano || ctx.safe) {
      score -= 25;
      warnings.push('Objets de valeur nécessitent plus de protection');
    }

    // ❌ Pénalise si étage élevé sans ascenseur (risque opérationnel majeur)
    if (this.hasCriticalFloor(ctx)) {
      score -= 50; // Pénalité critique
      warnings.push('⚠️ RISQUE CRITIQUE: Étage ≥5 sans ascenseur - monte-meubles NON INCLUS dans ECO');
      warnings.push('Risque de dégradation murs/escaliers et temps de portage très élevé');
    } else if (this.hasHighFloorWithoutElevator(ctx)) {
      score -= 30;
      warnings.push('⚠️ Étage élevé sans ascenseur - monte-meubles NON INCLUS dans ECO');
      warnings.push('Risque accru de casse et fatigue équipe');
    }

    // ❌ Pénalise si gros volume
    if (ctx.estimatedVolume && ctx.estimatedVolume >= THRESHOLDS.LARGE_VOLUME) {
      score -= 20;
      warnings.push('Volume important nécessite plus de services');
    }

    return {
      scenarioId: 'ECO',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.ECO,
    };
  }

  /**
   * Score pour le scénario STANDARD
   * Idéal pour : la plupart des situations, bon équilibre prix/service
   */
  private static scoreSTANDARD(ctx: QuoteContext): ScenarioScore {
    let score = 60; // Score de base plus élevé (recommandé par défaut)
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅ Bonus par défaut - meilleur rapport qualité/prix
    reasons.push('Meilleur rapport qualité-prix');

    // ✅ Favorise si volume moyen
    if (ctx.estimatedVolume &&
        ctx.estimatedVolume > THRESHOLDS.SMALL_VOLUME &&
        ctx.estimatedVolume <= THRESHOLDS.MEDIUM_VOLUME) {
      score += 15;
      reasons.push('Volume adapté à la formule standard');
    }

    // ✅ Favorise si accès standard (pas trop difficile)
    if (!this.hasCriticalAccess(ctx) && !this.hasEasyAccess(ctx)) {
      score += 10;
      reasons.push('Conditions d\'accès classiques');
    }

    // ❌ Pénalise légèrement si beaucoup d'objets fragiles
    if (ctx.artwork && ctx.piano) {
      score -= 10;
      warnings.push('Plusieurs objets fragiles - envisagez CONFORT');
    }

    // ❌ Pénalise si étage critique
    if (this.hasCriticalFloor(ctx)) {
      score -= 15;
      warnings.push('Étage très élevé - SÉCURITÉ+ recommandé');
    }

    return {
      scenarioId: 'STANDARD',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.STANDARD,
    };
  }

  /**
   * Score pour le scénario CONFORT
   * Idéal pour : meubles encombrants, objets fragiles, manque de temps
   */
  private static scoreCONFORT(ctx: QuoteContext): ScenarioScore {
    let score = 40; // Score de base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅ Favorise si objets fragiles/de valeur
    if (ctx.artwork) {
      score += 20;
      reasons.push('Objets d\'art nécessitant un emballage professionnel');
    }

    if (ctx.piano) {
      score += 15;
      reasons.push('Piano nécessitant une manutention spécialisée');
    }

    // ✅ Favorise si meubles encombrants
    if (ctx.bulkyFurniture) {
      score += 15;
      reasons.push('Meubles encombrants inclus');
    }

    // ✅ Favorise si gros volume
    if (ctx.estimatedVolume && ctx.estimatedVolume >= THRESHOLDS.MEDIUM_VOLUME) {
      score += 10;
      reasons.push('Volume important justifiant l\'emballage professionnel');
    }

    // ✅ Favorise si valeur déclarée élevée
    if (ctx.declaredValue && ctx.declaredValue >= THRESHOLDS.HIGH_VALUE) {
      score += 15;
      reasons.push('Valeur déclarée élevée - protection renforcée');
    }

    // ❌ Pénalise si petit volume simple
    if (ctx.estimatedVolume && ctx.estimatedVolume <= THRESHOLDS.SMALL_VOLUME && !ctx.artwork && !ctx.piano) {
      score -= 20;
      warnings.push('Petit volume sans objets fragiles - ECO/STANDARD suffisants');
    }

    return {
      scenarioId: 'CONFORT',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.CONFORT,
    };
  }

  /**
   * Score pour le scénario SÉCURITÉ+
   * Idéal pour : objets de valeur, protection maximale souhaitée, assurance incluse
   */
  private static scoreSECURITY_PLUS(ctx: QuoteContext): ScenarioScore {
    let score = 35; // Score de base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅✅ TRÈS favorisé si objets de valeur
    if (ctx.artwork || ctx.piano || ctx.safe) {
      score += 35;
      reasons.push('Objets de valeur nécessitant protection maximale et assurance');
    }

    // ✅ Favorise si valeur déclarée élevée
    if (ctx.declaredValue && ctx.declaredValue >= THRESHOLDS.HIGH_VALUE) {
      score += 25;
      reasons.push('Valeur déclarée élevée - assurance incluse dans SÉCURITÉ+');
    }

    // ✅ Favorise si étage élevé (monte-meubles recommandé mais conditionnel)
    if (this.hasCriticalFloor(ctx)) {
      score += 20;
      reasons.push('Étage ≥5 - monte-meubles recommandé (conditionnel selon contraintes)');
    } else if (this.hasHighFloorWithoutElevator(ctx)) {
      score += 15;
      reasons.push('Étage élevé - protection renforcée recommandée');
    }

    // ✅ Favorise si meubles encombrants
    if (ctx.bulkyFurniture) {
      score += 15;
      reasons.push('Meubles encombrants - emballage professionnel inclus');
    }

    // ✅ Favorise si rue étroite (accès véhicule difficile)
    if (ctx.pickupStreetNarrow || ctx.deliveryStreetNarrow) {
      score += 10;
      reasons.push('Rue étroite - logistique renforcée');
    }

    // ❌ Pénalise si petit volume sans objets de valeur
    if (ctx.estimatedVolume && ctx.estimatedVolume <= THRESHOLDS.SMALL_VOLUME && !ctx.artwork && !ctx.piano && !ctx.safe) {
      score -= 25;
      warnings.push('Petit volume sans objets de valeur - STANDARD/CONFORT suffisants');
    }

    // ❌ Pénalise légèrement si RDC ou ascenseur large sans objets de valeur
    if (this.hasEasyAccess(ctx) && !ctx.artwork && !ctx.piano && !ctx.safe) {
      score -= 20;
      warnings.push('Accès facile sans objets de valeur - SÉCURITÉ+ non nécessaire');
    }

    return {
      scenarioId: 'SECURITY_PLUS',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.SECURITY_PLUS,
    };
  }

  /**
   * Score pour le scénario PREMIUM
   * Idéal pour : gros budgets, délégation totale, valeur très élevée
   */
  private static scorePREMIUM(ctx: QuoteContext): ScenarioScore {
    let score = 30; // Score de base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅ Favorise si valeur très élevée
    if (ctx.declaredValue && ctx.declaredValue >= THRESHOLDS.PREMIUM_VALUE) {
      score += 30;
      reasons.push('Valeur déclarée très élevée - service premium justifié');
    }

    // ✅ Favorise si gros volume + objets fragiles
    if (ctx.estimatedVolume && ctx.estimatedVolume >= THRESHOLDS.LARGE_VOLUME) {
      score += 15;
      reasons.push('Volume important - service clé en main recommandé');
    }

    // ✅ Favorise si nettoyage demandé
    if (ctx.cleaningEnd) {
      score += 20;
      reasons.push('Nettoyage fin de bail inclus');
    }

    // ✅ Favorise si plusieurs objets spéciaux
    const specialItems = [ctx.artwork, ctx.piano, ctx.safe, ctx.builtInAppliances].filter(Boolean).length;
    if (specialItems >= 2) {
      score += 20;
      reasons.push('Nombreux objets spéciaux nécessitant un service premium');
    }

    // ❌ Pénalise si petit budget apparent (petit volume)
    if (ctx.estimatedVolume && ctx.estimatedVolume <= THRESHOLDS.SMALL_VOLUME) {
      score -= 25;
      warnings.push('Petit logement - formules ECO/STANDARD plus adaptées');
    }

    return {
      scenarioId: 'PREMIUM',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.PREMIUM,
    };
  }

  /**
   * Score pour le scénario FLEX
   * Idéal pour : longue distance, volume incertain, besoin de flexibilité
   */
  private static scoreFLEX(ctx: QuoteContext): ScenarioScore {
    let score = 35; // Score de base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // ✅✅ TRÈS favorisé si longue distance
    if (ctx.distance && ctx.distance >= THRESHOLDS.LONG_DISTANCE) {
      score += 35;
      reasons.push('Longue distance (>500km) - arrêt nuit inclus');
    } else if (ctx.distance && ctx.distance >= THRESHOLDS.MEDIUM_DISTANCE) {
      score += 20;
      reasons.push('Distance moyenne - flexibilité recommandée');
    }

    // ✅ Favorise si volume incertain
    if (ctx.volumeConfidence === 'LOW' || ctx.volumeMethod === 'FORM') {
      score += 25;
      reasons.push('Volume estimé incertain - garantie flexibilité équipe');
    }

    // ✅ Favorise si stockage temporaire
    if (ctx.temporaryStorage) {
      score += 15;
      reasons.push('Stockage temporaire - logistique flexible');
    }

    // ✅ Favorise si plusieurs points d'enlèvement
    if (ctx.multiplePickupPoints) {
      score += 15;
      reasons.push('Plusieurs points d\'enlèvement');
    }

    // ❌ Pénalise si courte distance et volume précis
    if (ctx.distance && ctx.distance <= THRESHOLDS.SHORT_DISTANCE && ctx.volumeConfidence === 'HIGH') {
      score -= 25;
      warnings.push('Courte distance avec volume précis - FLEX non nécessaire');
    }

    return {
      scenarioId: 'FLEX',
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings,
      confidence: this.calculateConfidence(reasons, warnings),
      clientPhrases: CLIENT_PHRASES.FLEX,
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Vérifie si l'accès est facile (RDC ou ascenseur large)
   */
  private static hasEasyAccess(ctx: QuoteContext): boolean {
    const pickupEasy = (ctx.pickupFloor === 0 || ctx.pickupFloor === undefined) ||
                       (ctx.pickupHasElevator === true && ctx.pickupElevatorSize !== 'SMALL');
    const deliveryEasy = (ctx.deliveryFloor === 0 || ctx.deliveryFloor === undefined) ||
                         (ctx.deliveryHasElevator === true && ctx.deliveryElevatorSize !== 'SMALL');
    return pickupEasy && deliveryEasy;
  }

  /**
   * Vérifie si étage élevé sans ascenseur adapté
   */
  private static hasHighFloorWithoutElevator(ctx: QuoteContext): boolean {
    const pickupHigh = ctx.pickupFloor !== undefined &&
                       ctx.pickupFloor >= THRESHOLDS.HIGH_FLOOR &&
                       (ctx.pickupHasElevator === false || ctx.pickupElevatorSize === 'SMALL');
    const deliveryHigh = ctx.deliveryFloor !== undefined &&
                         ctx.deliveryFloor >= THRESHOLDS.HIGH_FLOOR &&
                         (ctx.deliveryHasElevator === false || ctx.deliveryElevatorSize === 'SMALL');
    return pickupHigh || deliveryHigh;
  }

  /**
   * Vérifie si étage critique (≥5) sans ascenseur
   */
  private static hasCriticalFloor(ctx: QuoteContext): boolean {
    const pickupCritical = ctx.pickupFloor !== undefined &&
                           ctx.pickupFloor >= THRESHOLDS.CRITICAL_FLOOR &&
                           (ctx.pickupHasElevator === false || ctx.pickupElevatorSize === 'SMALL');
    const deliveryCritical = ctx.deliveryFloor !== undefined &&
                             ctx.deliveryFloor >= THRESHOLDS.CRITICAL_FLOOR &&
                             (ctx.deliveryHasElevator === false || ctx.deliveryElevatorSize === 'SMALL');
    return pickupCritical || deliveryCritical;
  }

  /**
   * Vérifie si accès critique (plusieurs contraintes)
   */
  private static hasCriticalAccess(ctx: QuoteContext): boolean {
    let constraints = 0;
    if (this.hasHighFloorWithoutElevator(ctx)) constraints++;
    if (ctx.pickupStreetNarrow || ctx.deliveryStreetNarrow) constraints++;
    if (ctx.pickupParkingAuthorizationRequired || ctx.deliveryParkingAuthorizationRequired) constraints++;
    if ((ctx.pickupCarryDistance && ctx.pickupCarryDistance > 30) ||
        (ctx.deliveryCarryDistance && ctx.deliveryCarryDistance > 30)) constraints++;
    return constraints >= 2;
  }

  /**
   * Calcule le niveau de confiance de la recommandation
   */
  private static calculateConfidence(reasons: string[], warnings: string[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const reasonScore = reasons.length * 2;
    const warningPenalty = warnings.length * 1.5;
    const netScore = reasonScore - warningPenalty;

    if (netScore >= 4) return 'HIGH';
    if (netScore >= 2) return 'MEDIUM';
    return 'LOW';
  }
}
