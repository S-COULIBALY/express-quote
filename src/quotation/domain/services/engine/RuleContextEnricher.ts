import { QuoteContext } from "../../valueObjects/QuoteContext";
import { Rule } from "../../valueObjects/Rule";
import { AutoDetectionService, AddressData } from "../AutoDetectionService";
import { devLog } from "../../../../lib/conditional-logger";

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
   */
  enrichContext(context: QuoteContext): EnrichedContext {
    const contextData = context.getAllData();

    // 1. Enrichir les UUIDs avec les noms de règles
    const enrichedConstraints = this.enrichConstraints(contextData);

    // 2. Fusionner les services (pickup, delivery, additional)
    const allServices = this.fuseServices(contextData);

    // 3. Auto-détection (monte-meuble, etc.)
    const autoDetection = this.detectRequirements(contextData);

    return {
      ...contextData,
      allServices,
      enrichedPickupConstraints: enrichedConstraints.pickup,
      enrichedDeliveryConstraints: enrichedConstraints.delivery,
      pickupLogisticsConstraints: autoDetection.pickupConstraints,
      deliveryLogisticsConstraints: autoDetection.deliveryConstraints,
      furniture_lift_required: autoDetection.furnitureLiftRequired,
      consumed_constraints: autoDetection.consumedConstraints
    };
  }

  /**
   * Enrichit les UUIDs des contraintes avec les noms de règles
   */
  private enrichConstraints(contextData: any) {
    const enrichFn = (constraints: string[] | undefined) => {
      if (!constraints || !Array.isArray(constraints)) return [];
      return constraints.map(uuid => {
        const rule = this.rules.find(r => {
          const ruleId = typeof r.getId === 'function' ? r.getId() : (r as any).id;
          return ruleId === uuid;
        });
        if (rule) {
          const ruleName = typeof rule.getName === 'function' ? rule.getName() : (rule as any).name;
          return `${ruleName} (${uuid.substring(0, 8)}...)`;
        }
        return uuid;
      });
    };

    return {
      pickup: enrichFn(contextData.pickupLogisticsConstraints as string[]),
      delivery: enrichFn(contextData.deliveryLogisticsConstraints as string[])
    };
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
      devLog.debug('RuleEngine', '🔧 [RuleContextEnricher] Services fusionnés: pickup=' +
        (contextData.pickupServices?.length || 0) +
        ', delivery=' + (contextData.deliveryServices?.length || 0) +
        ', global=' + (contextData.additionalServices?.length || 0) +
        ' → total=' + allServices.length);
    }

    return allServices;
  }

  /**
   * Détecte les besoins automatiques (monte-meuble, etc.)
   */
  private detectRequirements(contextData: any) {
    // Construire les données d'adresse pour pickup et delivery
    const pickupData: AddressData = {
      floor: typeof contextData.pickupFloor === "number"
        ? contextData.pickupFloor
        : parseInt(String(contextData.pickupFloor || "0"), 10) || 0,
      elevator: (contextData.pickupElevator || "no") as "no" | "small" | "medium" | "large",
      carryDistance: contextData.pickupCarryDistance as any as "0-10" | "10-30" | "30+" | undefined,
      constraints: (contextData.pickupLogisticsConstraints || []) as string[],
    };

    const deliveryData: AddressData = {
      floor: typeof contextData.deliveryFloor === "number"
        ? contextData.deliveryFloor
        : parseInt(String(contextData.deliveryFloor || "0"), 10) || 0,
      elevator: (contextData.deliveryElevator || "no") as "no" | "small" | "medium" | "large",
      carryDistance: contextData.deliveryCarryDistance as any as "0-10" | "10-30" | "30+" | undefined,
      constraints: (contextData.deliveryLogisticsConstraints || []) as string[],
    };

    // Détecter avec AutoDetectionService
    const pickupDetection = AutoDetectionService.detectFurnitureLift(
      pickupData,
      contextData.volume,
    );
    const deliveryDetection = AutoDetectionService.detectFurnitureLift(
      deliveryData,
      contextData.volume,
    );

    // Combiner les contraintes consommées des deux adresses
    const allConsumedConstraints = new Set<string>([
      ...(pickupDetection.consumedConstraints || []),
      ...(deliveryDetection.consumedConstraints || []),
    ]);

    const furnitureLiftRequired =
      pickupDetection.furnitureLiftRequired ||
      deliveryDetection.furnitureLiftRequired;

    // Enrichir les contraintes logistiques avec furniture_lift_required si nécessaire
    const enrichedPickupConstraints = [...(contextData.pickupLogisticsConstraints || [])];
    const enrichedDeliveryConstraints = [...(contextData.deliveryLogisticsConstraints || [])];

    if (pickupDetection.furnitureLiftRequired &&
        !enrichedPickupConstraints.includes("furniture_lift_required")) {
      enrichedPickupConstraints.push("furniture_lift_required");
    }
    if (deliveryDetection.furnitureLiftRequired &&
        !enrichedDeliveryConstraints.includes("furniture_lift_required")) {
      enrichedDeliveryConstraints.push("furniture_lift_required");
    }

    // Affichage optimisé du contexte des contraintes consommées
    if (furnitureLiftRequired && allConsumedConstraints.size > 0) {
      devLog.debug('RuleEngine', "\n🏗️ [RuleContextEnricher] MONTE-MEUBLE REQUIS");
      devLog.debug('RuleEngine',
        `   📦 Contraintes consommées: [${Array.from(allConsumedConstraints)
          .map((c) => `'${c}'`)
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
}
