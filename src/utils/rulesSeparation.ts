/**
 * Utilitaire pour séparer les règles sélectionnées en catégories
 * selon leur metadata.category_frontend et leur portée (pickup/delivery/global)
 */

export interface Rule {
  id: string;
  metadata?: {
    category_frontend?: "constraint" | "service";
    scope?: "pickup" | "delivery" | "global";
  };
}

export interface SeparatedRules {
  pickupConstraints: Record<string, boolean>;
  deliveryConstraints: Record<string, boolean>;
  additionalServices: Record<string, boolean>;
}

/**
 * Sépare les règles sélectionnées selon leur catégorie et leur scope
 *
 * @param selectedRules - Objet {ruleId: boolean} des règles sélectionnées
 * @param allRules - Tableau de toutes les règles disponibles (pour accéder aux métadonnées)
 * @returns Objet avec les règles séparées en trois catégories
 *
 * @example
 * const separated = separateSelectedRules(
 *   { 'rule-id-1': true, 'rule-id-2': true },
 *   allRules
 * );
 * // {
 * //   pickupConstraints: { 'rule-id-1': true },
 * //   deliveryConstraints: {},
 * //   additionalServices: { 'rule-id-2': true }
 * // }
 */
export function separateSelectedRules(
  selectedRules: Record<string, boolean>,
  allRules: Rule[]
): SeparatedRules {
  const result: SeparatedRules = {
    pickupConstraints: {},
    deliveryConstraints: {},
    additionalServices: {}
  };

  // Créer une map des règles pour un accès rapide par ID
  const rulesMap = new Map<string, Rule>();
  allRules.forEach(rule => {
    rulesMap.set(rule.id, rule);
  });

  // Parcourir les règles sélectionnées
  Object.entries(selectedRules).forEach(([ruleId, isSelected]) => {
    if (!isSelected) return;

    const rule = rulesMap.get(ruleId);
    if (!rule) {
      console.warn(`⚠️ [separateSelectedRules] Règle ${ruleId} introuvable dans allRules`);
      return;
    }

    const category = rule.metadata?.category_frontend;
    const scope = rule.metadata?.scope;

    // Les contraintes logistiques sont séparées par adresse (pickup/delivery)
    if (category === 'constraint') {
      if (scope === 'pickup') {
        result.pickupConstraints[ruleId] = true;
      } else if (scope === 'delivery') {
        result.deliveryConstraints[ruleId] = true;
      } else {
        // Si pas de scope, ajouter aux deux par défaut
        result.pickupConstraints[ruleId] = true;
        result.deliveryConstraints[ruleId] = true;
        console.log(`ℹ️ [separateSelectedRules] Contrainte ${ruleId} sans scope, ajoutée aux deux adresses`);
      }
    }
    // Les services supplémentaires sont globaux (pas liés à une adresse)
    else if (category === 'service') {
      result.additionalServices[ruleId] = true;
    }
    // Si pas de catégorie, traiter comme contrainte par défaut
    else {
      console.warn(`⚠️ [separateSelectedRules] Règle ${ruleId} sans category_frontend, traitée comme contrainte`);
      result.pickupConstraints[ruleId] = true;
      result.deliveryConstraints[ruleId] = true;
    }
  });

  console.log('✅ [separateSelectedRules] Règles séparées:', {
    pickupConstraints: Object.keys(result.pickupConstraints).length,
    deliveryConstraints: Object.keys(result.deliveryConstraints).length,
    additionalServices: Object.keys(result.additionalServices).length
  });

  return result;
}

/**
 * Vérifie si des règles sont sélectionnées dans l'une des trois catégories
 */
export function hasSelectedRules(separated: SeparatedRules): boolean {
  return (
    Object.keys(separated.pickupConstraints).length > 0 ||
    Object.keys(separated.deliveryConstraints).length > 0 ||
    Object.keys(separated.additionalServices).length > 0
  );
}
