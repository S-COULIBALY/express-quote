import { QuoteContext } from "../../valueObjects/QuoteContext";
import { Rule } from "../../valueObjects/Rule";
import { AutoDetectionService, AddressData } from "../AutoDetectionService";
import { devLog } from "../../../../lib/conditional-logger";
import {
  RULE_UUID_ASCENSEUR_PANNE,
  RULE_UUID_ASCENSEUR_INTERDIT,
  RULE_UUID_ASCENSEUR_TROP_PETIT
} from "../../constants/RuleUUIDs";

/**
 * Service d'enrichissement du contexte des règles
 *
 * Responsabilités:
 * - Enrichir les UUIDs avec les noms de règles
 * - Fusionner les services (pickup, delivery, additional)
 * - Détecter automatiquement les besoins (monte-meuble, etc.)
 */
export class RuleContextEnricher {
  constructor(private rules: Rule[]) {}

  /**
   * Enrichit le contexte pour l'application des règles
   * IMPORTANT: Préserve les IDs UUID originaux dans pickupLogisticsConstraints/deliveryLogisticsConstraints
   */
  enrichContext(context: QuoteContext): EnrichedContext {
    const contextData = context.getAllData();

    // 1. Fusionner les services (pickup, delivery, additional)
    const allServices = this.fuseServices(contextData);

    // 2. Auto-détection (monte-meuble, etc.)
    const autoDetection = this.detectRequirements(contextData);

    // 3. Enrichir les UUIDs avec les noms de règles APRÈS auto-détection (pour l'affichage)
    const enrichedConstraints = {
      pickup: this.enrichConstraintsList(autoDetection.pickupConstraints),
      delivery: this.enrichConstraintsList(autoDetection.deliveryConstraints)
    };

    return {
      ...contextData,
      allServices,
      enrichedPickupConstraints: enrichedConstraints.pickup,
      enrichedDeliveryConstraints: enrichedConstraints.delivery,
      // ✅ CRITIQUE: Préserver les IDs UUID originaux (pas les noms)
      // pickupLogisticsConstraints et deliveryLogisticsConstraints contiennent les IDs
      // qui sont utilisés dans Rule.isApplicable() pour vérifier si la règle est sélectionnée
      pickupLogisticsConstraints: autoDetection.pickupConstraints, // Contient les IDs + furniture_lift si détecté
      deliveryLogisticsConstraints: autoDetection.deliveryConstraints, // Contient les IDs + furniture_lift si détecté
      furniture_lift_required: autoDetection.furnitureLiftRequired,
      consumed_constraints: autoDetection.consumedConstraints,
      // ✅ NOUVEAU: Traçabilité des contraintes déclarées et inférées
      declared_constraints: autoDetection.declaredConstraints,
      inferred_constraints: autoDetection.inferredConstraints,
      // ✅ NOUVEAU: Métadonnées d'inférence pour audit
      inference_metadata: {
        pickup: autoDetection.pickupDetection?.inferenceMetadata,
        delivery: autoDetection.deliveryDetection?.inferenceMetadata
      }
    };
  }

  /**
   * Enrichit une liste d'UUIDs avec les noms de règles
   */
  private enrichConstraintsList(constraints: string[] | undefined): string[] {
    if (!constraints || !Array.isArray(constraints)) return [];
    return constraints.map(uuid => {
      const rule = this.rules.find(r => r.id === uuid);
      if (rule) {
        return rule.name;
      }
      return uuid;
    });
  }

  /**
   * Fusionne les services de toutes les adresses
   */
  private fuseServices(contextData: any): string[] {
    const allServices = [
      ...(Array.isArray(contextData.pickupServices) ? contextData.pickupServices : []),
      ...(Array.isArray(contextData.deliveryServices) ? contextData.deliveryServices : []),
      ...(Array.isArray(contextData.additionalServices) ? contextData.additionalServices : [])
    ];

    if (allServices.length > 0) {
      devLog.debug('RuleEngine', '🔧 [RuleContextEnricher] SERVICES FUSIONNÉS:');
      if (contextData.pickupServices?.length > 0) {
        const pickupNames = contextData.pickupServices.map((id: string) => {
          const rule = this.rules.find(r => r.id === id);
          return rule ? rule.name : id.substring(0, 8);
        });
        devLog.debug('RuleEngine', `   📍 DÉPART (${contextData.pickupServices.length}): ${pickupNames.join(', ')}`);
      }
      if (contextData.deliveryServices?.length > 0) {
        const deliveryNames = contextData.deliveryServices.map((id: string) => {
          const rule = this.rules.find(r => r.id === id);
          return rule ? rule.name : id.substring(0, 8);
        });
        devLog.debug('RuleEngine', `   📦 ARRIVÉE (${contextData.deliveryServices.length}): ${deliveryNames.join(', ')}`);
      }
      if (contextData.additionalServices?.length > 0) {
        const globalNames = contextData.additionalServices.map((id: string) => {
          const rule = this.rules.find(r => r.id === id);
          return rule ? rule.name : id.substring(0, 8);
        });
        devLog.debug('RuleEngine', `   🌐 GLOBAUX (${contextData.additionalServices.length}): ${globalNames.join(', ')}`);
      }
      devLog.debug('RuleEngine', `   ✅ TOTAL: ${allServices.length} services uniques`);
    }

    return allServices;
  }

  /**
   * Détecte les besoins automatiques (monte-meuble, etc.)
   */
  private detectRequirements(contextData: any) {
    // ✅ CORRECTION: Extraire les flags d'ascenseur depuis les UUIDs de contraintes
    const pickupConstraints = (contextData.pickupLogisticsConstraints || []) as string[];
    const deliveryConstraints = (contextData.deliveryLogisticsConstraints || []) as string[];

    // Construire les données d'adresse pour pickup et delivery
    const pickupData: AddressData = {
      floor: typeof contextData.pickupFloor === "number"
        ? contextData.pickupFloor
        : parseInt(String(contextData.pickupFloor || "0"), 10) || 0,
      elevator: (contextData.pickupElevator || "no") as "no" | "small" | "medium" | "large",
      carryDistance: contextData.pickupCarryDistance as any as "0-10" | "10-30" | "30+" | undefined,
      constraints: pickupConstraints,
      // ✅ NOUVEAU: Extraire les flags d'ascenseur depuis les UUIDs
      elevatorUnavailable: pickupConstraints.includes(RULE_UUID_ASCENSEUR_PANNE),
      elevatorForbiddenMoving: pickupConstraints.includes(RULE_UUID_ASCENSEUR_INTERDIT),
      elevatorUnsuitable: pickupConstraints.includes(RULE_UUID_ASCENSEUR_TROP_PETIT),
    };

    const deliveryData: AddressData = {
      floor: typeof contextData.deliveryFloor === "number"
        ? contextData.deliveryFloor
        : parseInt(String(contextData.deliveryFloor || "0"), 10) || 0,
      elevator: (contextData.deliveryElevator || "no") as "no" | "small" | "medium" | "large",
      carryDistance: contextData.deliveryCarryDistance as any as "0-10" | "10-30" | "30+" | undefined,
      constraints: deliveryConstraints,
      // ✅ NOUVEAU: Extraire les flags d'ascenseur depuis les UUIDs
      elevatorUnavailable: deliveryConstraints.includes(RULE_UUID_ASCENSEUR_PANNE),
      elevatorForbiddenMoving: deliveryConstraints.includes(RULE_UUID_ASCENSEUR_INTERDIT),
      elevatorUnsuitable: deliveryConstraints.includes(RULE_UUID_ASCENSEUR_TROP_PETIT),
    };

    // Détecter avec AutoDetectionService (inférence activée pour soumission finale)
    const pickupDetection = AutoDetectionService.detectFurnitureLift(
      pickupData,
      contextData.volume,
      {
        allowInference: true,
        submissionContext: 'final' // Inférence activée à la soumission finale
      }
    );
    const deliveryDetection = AutoDetectionService.detectFurnitureLift(
      deliveryData,
      contextData.volume,
      {
        allowInference: true,
        submissionContext: 'final' // Inférence activée à la soumission finale
      }
    );

    // Combiner les contraintes consommées des deux adresses
    const allConsumedConstraints = new Set<string>([
      ...(pickupDetection.consumedConstraints || []),
      ...(deliveryDetection.consumedConstraints || []),
    ]);

    // Combiner les contraintes déclarées et inférées pour la traçabilité
    const allDeclaredConstraints = new Set<string>([
      ...(pickupDetection.declaredConstraints || []),
      ...(deliveryDetection.declaredConstraints || []),
    ]);

    // ✅ CORRECTION CRITIQUE: Filtrer les contraintes inférées pour exclure celles déjà déclarées
    // Une contrainte ne peut pas être à la fois déclarée ET inférée
    const allInferredConstraints = new Set<string>([
      ...(pickupDetection.inferredConstraints || []),
      ...(deliveryDetection.inferredConstraints || []),
    ].filter(c => !allDeclaredConstraints.has(c))); // Exclure les contraintes déjà déclarées

    const furnitureLiftRequired =
      pickupDetection.furnitureLiftRequired ||
      deliveryDetection.furnitureLiftRequired;

    // ✅ CRITIQUE: Préserver les IDs UUID originaux des contraintes sélectionnées
    // Les contraintes arrivent du frontend comme des arrays d'IDs UUID
    // On doit les conserver tels quels pour que Rule.isApplicable() puisse les vérifier
    const enrichedPickupConstraints = [...(contextData.pickupLogisticsConstraints || [])];
    const enrichedDeliveryConstraints = [...(contextData.deliveryLogisticsConstraints || [])];

    // Note: furniture_lift_required est géré séparément via le flag furniture_lift_required
    // et ne nécessite pas d'être ajouté aux arrays de contraintes
    // (la règle monte-meuble a son propre ID UUID qui est déjà dans les arrays si sélectionné)

    // ✅ AMÉLIORATION: Affichage détaillé avec distinction déclaré/inféré/consommé
    if (furnitureLiftRequired && allConsumedConstraints.size > 0) {
      devLog.debug('RuleEngine', "\n🏗️ [RuleContextEnricher] MONTE-MEUBLE REQUIS");
      
      // Afficher les contraintes déclarées
      if (allDeclaredConstraints.size > 0) {
        const declaredNames = Array.from(allDeclaredConstraints).map(c => {
          const rule = this.rules.find(r => r.id === c);
          return rule ? rule.name : c.substring(0, 8) + '...';
        });
        devLog.debug('RuleEngine',
          `   ✅ Contraintes DÉCLARÉES (${allDeclaredConstraints.size}): ${declaredNames.join(', ')}`
        );
      }

      // Afficher les contraintes inférées
      if (allInferredConstraints.size > 0) {
        const inferredNames = Array.from(allInferredConstraints).map(c => {
          const rule = this.rules.find(r => r.id === c);
          return rule ? rule.name : c.substring(0, 8) + '...';
        });
        devLog.debug('RuleEngine',
          `   🔍 Contraintes INFÉRÉES (${allInferredConstraints.size}): ${inferredNames.join(', ')}`
        );
        devLog.debug('RuleEngine',
          `   💡 Raison: Monte-meuble requis, inférence automatique activée pour éviter double facturation`
        );
      }

      // Afficher le total des contraintes consommées
      devLog.debug('RuleEngine',
        `   📦 TOTAL contraintes CONSOMMÉES (${allConsumedConstraints.size}): [${Array.from(allConsumedConstraints)
          .map((c) => {
            const rule = this.rules.find(r => r.id === c);
            return rule ? rule.name : c.substring(0, 8) + '...';
          })
          .join(", ")}]`
      );
      devLog.debug('RuleEngine',
        `   ℹ️  Les règles liées à ces contraintes seront automatiquement ignorées\n`
      );
    }

    return {
      pickupConstraints: enrichedPickupConstraints,
      deliveryConstraints: enrichedDeliveryConstraints,
      furnitureLiftRequired,
      consumedConstraints: allConsumedConstraints,
      declaredConstraints: allDeclaredConstraints,
      inferredConstraints: allInferredConstraints,
      pickupDetection,
      deliveryDetection
    };
  }
}

export interface EnrichedContext {
  [key: string]: any;
  allServices: string[];
  enrichedPickupConstraints: string[];
  enrichedDeliveryConstraints: string[];
  pickupLogisticsConstraints: string[];
  deliveryLogisticsConstraints: string[];
  furniture_lift_required?: boolean;
  consumed_constraints?: Set<string>;
  // ✅ NOUVEAU: Traçabilité des contraintes déclarées et inférées
  declared_constraints?: Set<string>;
  inferred_constraints?: Set<string>;
  // ✅ NOUVEAU: Métadonnées d'inférence pour audit
  inference_metadata?: {
    pickup?: {
      reason: string;
      inferredAt: Date;
      allowInference: boolean;
    };
    delivery?: {
      reason: string;
      inferredAt: Date;
      allowInference: boolean;
    };
  };
}
