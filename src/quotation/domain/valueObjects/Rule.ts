import { Money } from './Money';
import { QuoteContext } from './QuoteContext';

/**
 * Résultat de l'application d'une règle
 */
export interface RuleApplyResult {
  success: boolean;
  modified: boolean;
  price: number;
  message?: string;
  isApplied: boolean;
  impact: number;
  newPrice: Money;
  minimumPrice?: number;
}

/**
 * Structure des metadata d'une règle (venant de la BDD)
 */
export interface RuleMetadata {
  category_frontend?: 'constraint' | 'service';
  impact?: string;
  source?: string;
  display?: {
    icon?: string;
    group?: string;
    priority?: number;
    description_short?: string;
  };
}

/**
 * Classe représentant une règle de tarification
 * Une règle peut être un discount (réduction) ou une surcharge (majoration)
 */
export class Rule {
  // Fonction optionnelle qui peut être utilisée à la place de la condition en chaîne
  private applyFunction?: ((context: any) => RuleApplyResult);

  constructor(
    public readonly name: string,
    public readonly serviceType: string,
    public readonly value: number,
    public readonly condition: string = '',
    public readonly isActive: boolean = true,
    public readonly id?: string,
    public readonly percentBased?: boolean,
    public readonly metadata?: RuleMetadata,
    // ✅ NOUVEAU: Champ scope pour la portée des règles
    public readonly scope?: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH'
  ) {}

  /**
   * Détermine si une règle est applicable en fonction du contexte
   * 🎯 LOGIQUE SIMPLIFIÉE: Une règle s'applique SI elle est sélectionnée par l'utilisateur
   * (son ID est dans les arrays de contraintes/services)
   *
   * @param context Contexte contenant les données pour évaluer la condition
   */
  isApplicable(context: any): boolean {
    // Si on a une fonction d'application personnalisée, l'utiliser
    if (typeof this.applyFunction === 'function') {
      const result = this.applyFunction(context);
      return result.success && result.modified;
    }

    // ✅ LOGIQUE SIMPLIFIÉE: Vérifier d'abord si la règle est SÉLECTIONNÉE
    // Les conditions JSON ne servent QUE d'indicateur historique, pas de véritable condition
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    const pickupServices = context.pickupServices || [];
    const deliveryServices = context.deliveryServices || [];
    const additionalServices = context.additionalServices || [];

    // Combiner tous les IDs sélectionnés
    const allSelectedIds = [
      ...pickupConstraints,
      ...deliveryConstraints,
      ...pickupServices,
      ...deliveryServices,
      ...additionalServices
    ];

    // Si cette règle est sélectionnée → APPLICABLE (peu importe la condition JSON)
    if (this.id && allSelectedIds.includes(this.id)) {
      return true;
    }

    // Si aucune condition n'est spécifiée → toujours applicable
    if (!this.condition) {
      return true;
    }

    // Gérer le cas où condition est une string vide → toujours applicable
    if (typeof this.condition === 'string' && this.condition.trim() === '') {
      return true;
    }

    try {
      // Extraire la date programmée du contexte
      let scheduledDate: Date | null = null;
      
      if (context.scheduledDate) {
        scheduledDate = new Date(context.scheduledDate);
      } else if (context.date) {
        scheduledDate = new Date(context.date);
      } else if (context.booking?.date) {
        scheduledDate = new Date(context.booking.date);
      }
      
      // Extraire le prix par défaut du contexte
      let defaultPrice = 0;
      if (context.defaultPrice) {
        defaultPrice = typeof context.defaultPrice === 'object' && context.defaultPrice.getAmount 
          ? context.defaultPrice.getAmount() 
          : parseFloat(context.defaultPrice);
      }
      
      const now = new Date();

      // ✅ Créer un contexte enrichi pour l'évaluation
      // Note: monte_meuble_requis et consumedConstraints sont déjà fournis par RuleEngine via AutoDetectionService
      const evalContext = {
        ...context,
        // Ajouter la valeur de la règle au contexte
        value: this.value,
        // Variables temporelles
        date: scheduledDate,
        now: now,
        day: scheduledDate ? scheduledDate.getDay() : now.getDay(),
        hour: scheduledDate ? scheduledDate.getHours() : now.getHours(),
        diffDays: scheduledDate ? Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        diffHours: scheduledDate ? Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0,
        // Prix
        price: context.price || defaultPrice || 0,
        duration: context.duration || 1,
        // Informations client
        isReturningCustomer: context.isReturningCustomer || false,
        
        // ✅ VARIABLES DE BASE POUR LES CALCULS
        volume: parseFloat(context.volume || '0'),
        distance: parseFloat(context.distance || '0'),
        workers: parseInt(context.workers || context.numberOfMovers || '2'),
        numberOfMovers: parseInt(context.numberOfMovers || context.workers || '2'),
        numberOfBoxes: parseInt(context.numberOfBoxes || '0'),
        
        // Variables d'étage
        pickupFloor: parseInt(context.pickupFloor || '0'),
        deliveryFloor: parseInt(context.deliveryFloor || '0'),
        pickupElevator: context.pickupElevator === 'yes' || context.pickupElevator === 'medium' || context.pickupElevator === 'large',
        deliveryElevator: context.deliveryElevator === 'yes' || context.deliveryElevator === 'medium' || context.deliveryElevator === 'large',
        hasElevator: (context.pickupElevator === 'yes' || context.pickupElevator === 'medium' || context.pickupElevator === 'large') && 
                    (context.deliveryElevator === 'yes' || context.deliveryElevator === 'medium' || context.deliveryElevator === 'large'),
        
        // ✨ NOUVELLES VARIABLES: Distance de portage
        pickupCarryDistance: context.pickupCarryDistance || '',
        deliveryCarryDistance: context.deliveryCarryDistance || '',
        
        // Variables temporelles supplémentaires
        month: scheduledDate ? scheduledDate.getMonth() : now.getMonth(),
        
        // ✅ Variables booléennes pour toutes les contraintes et services
        // Contraintes logistiques d'accès
        furniture_lift_required: this.hasLogisticsConstraint(context, 'furniture_lift_required'),
        pedestrian_zone: this.hasLogisticsConstraint(context, 'pedestrian_zone'),
        narrow_inaccessible_street: this.hasLogisticsConstraint(context, 'narrow_inaccessible_street'),
        difficult_parking: this.hasLogisticsConstraint(context, 'difficult_parking'),
        complex_traffic: this.hasLogisticsConstraint(context, 'complex_traffic'),
        elevator_unavailable: this.hasLogisticsConstraint(context, 'elevator_unavailable'),
        elevator_unsuitable_size: this.hasLogisticsConstraint(context, 'elevator_unsuitable_size'),
        elevator_forbidden_moving: this.hasLogisticsConstraint(context, 'elevator_forbidden_moving'),
        difficult_stairs: this.hasLogisticsConstraint(context, 'difficult_stairs'),
        narrow_corridors: this.hasLogisticsConstraint(context, 'narrow_corridors'),
        long_carrying_distance: this.hasLogisticsConstraint(context, 'long_carrying_distance'),
        indirect_exit: this.hasLogisticsConstraint(context, 'indirect_exit'),
        complex_multilevel_access: this.hasLogisticsConstraint(context, 'complex_multilevel_access'),
        access_control: this.hasLogisticsConstraint(context, 'access_control'),
        administrative_permit: this.hasLogisticsConstraint(context, 'administrative_permit'),
        time_restrictions: this.hasLogisticsConstraint(context, 'time_restrictions'),
        fragile_floor: this.hasLogisticsConstraint(context, 'fragile_floor'),
        
        // Services supplémentaires
        bulky_furniture: this.hasLogisticsConstraint(context, 'bulky_furniture'),
        furniture_disassembly: this.hasLogisticsConstraint(context, 'furniture_disassembly'),
        furniture_reassembly: this.hasLogisticsConstraint(context, 'furniture_reassembly'),
        professional_packing_departure: this.hasLogisticsConstraint(context, 'professional_packing_departure'),
        professional_unpacking_arrival: this.hasLogisticsConstraint(context, 'professional_unpacking_arrival'),
        packing_supplies: this.hasLogisticsConstraint(context, 'packing_supplies'),
        fragile_valuable_items: this.hasLogisticsConstraint(context, 'fragile_valuable_items'),
        heavy_items: this.hasLogisticsConstraint(context, 'heavy_items'),
        additional_insurance: this.hasLogisticsConstraint(context, 'additional_insurance'),
        temporary_storage_service: this.hasLogisticsConstraint(context, 'temporary_storage_service'),

        // ✅ VARIABLES MANQUANTES POUR LES RÈGLES MOVING
        // Variables utilisées dans MovingRules.ts qui étaient manquantes
        hasFragileItems: this.hasLogisticsConstraint(context, 'fragile_valuable_items') || context.hasFragileItems || false,
        needsLift: this.hasLogisticsConstraint(context, 'furniture_lift_required') || context.needsLift || false,
        pickupNarrowStairs: context.pickupNarrowStairs || false,
        deliveryNarrowStairs: context.deliveryNarrowStairs || false
      };

      // ✅ FILTRAGE DES CONTRAINTES CONSOMMÉES: Géré par RuleEngine avant l'appel à isApplicable()
      // Pas besoin de vérifier ici car RuleEngine.isRuleConstraintConsumed() fait déjà le travail

      // ✅ CORRECTION: Gérer les conditions JSON (objet ou string) ET les expressions JavaScript
      let result: boolean;

      // Si la condition est déjà un objet (Prisma peut retourner du JSON parsé)
      if (typeof this.condition === 'object' && this.condition !== null) {
        result = this.evaluateJsonCondition(this.condition, evalContext);
      }
      // Si c'est une string, détecter le type
      else if (typeof this.condition === 'string') {
        const conditionStr = this.condition.trim();

        if (conditionStr.startsWith('{') || conditionStr.startsWith('[')) {
          // C'est un objet JSON stringifié - parser et évaluer
          try {
            const conditionObj = JSON.parse(conditionStr);
            result = this.evaluateJsonCondition(conditionObj, evalContext);
          } catch (parseError) {
            console.error(`❌ Erreur parsing JSON condition pour "${this.name}":`, parseError);
            return false;
          }
        } else {
          // C'est une expression JavaScript - évaluer avec Function
          try {
            const evalFunction = new Function(...Object.keys(evalContext), `return (${this.condition});`);
            result = evalFunction(...Object.values(evalContext));
          } catch (evalError) {
            console.error(`❌ Erreur évaluation JS condition pour "${this.name}":`, evalError);
            return false;
          }
        }
      } else {
        console.error(`❌ Type de condition invalide pour "${this.name}":`, typeof this.condition);
        return false;
      }

      // 🔍 LOGS DE DÉBOGAGE POUR LA RÈGLE MONTE-MEUBLE
      if (this.name === 'Supplément monte-meuble') {
        console.log('🔍 [RULE-DEBUG] === RÈGLE MONTE-MEUBLE ===');
        console.log(`🔍 [RULE-DEBUG] Condition: ${this.condition}`);
        console.log(`🔍 [RULE-DEBUG] Résultat: ${result}`);
        console.log(`🔍 [RULE-DEBUG] furniture_lift_required: ${evalContext.furniture_lift_required}`);
        console.log(`🔍 [RULE-DEBUG] pickupLogisticsConstraints: ${JSON.stringify(evalContext.pickupLogisticsConstraints)}`);
        console.log(`🔍 [RULE-DEBUG] deliveryLogisticsConstraints: ${JSON.stringify(evalContext.deliveryLogisticsConstraints)}`);
      }

      return result;
    } catch (error) {
      console.error(`Error evaluating rule condition: ${this.condition}`, error);
      return false;
    }
  }

  /**
   * Applique la règle au prix en fonction de sa valeur
   * @param price Prix actuel
   * @param context Contexte de la demande (optionnel)
   * @param basePrice Prix de base initial pour les calculs de pourcentage (optionnel)
   * @returns Résultat de l'application de la règle
   */
  apply(price: Money, context?: any, basePrice?: Money): RuleApplyResult {
    if (!this.isActive) {
      return {
        success: false,
        modified: false,
        message: "Rule is inactive",
        price: price.getAmount(),
        isApplied: false,
        impact: 0,
        newPrice: new Money(price.getAmount())
      };
    }

    const priceAmount = price.getAmount();
    let newPrice = priceAmount;

    // ✅ CORRECTION: La multiplication par adresse est maintenant gérée par RuleEngine.determineAddress()
    // Cette logique évite la double multiplication (Rule.apply × RuleEngine.impactMultiplier)

    if (this.isPercentage()) {
      // 🔧 CORRECTION: Pour les pourcentages, utiliser le prix de base initial si fourni
      const basePriceAmount = basePrice ? basePrice.getAmount() : priceAmount;
      // ✅ IMPORTANT: Ne PAS arrondir ici pour éviter les erreurs cumulées
      // L'arrondi sera fait au moment du prix final uniquement
      const percentageImpact = (basePriceAmount * this.value / 100);
      newPrice = priceAmount + percentageImpact;
    } else {
      // Si la valeur est un montant fixe, pas d'arrondi non plus
      newPrice = priceAmount + this.value;
    }
    
    const impact = newPrice - priceAmount;
    
    return {
      success: true,
      modified: impact !== 0,
      price: newPrice,
      isApplied: impact !== 0,
      impact: impact,
      newPrice: new Money(newPrice)
    };
  }

  /**
   * Détermine si la valeur de la règle est un pourcentage
   */
  isPercentage(): boolean {
    // Utiliser le champ percentBased si disponible, sinon utiliser l'ancienne logique comme fallback
    if (this.percentBased !== undefined) {
      return this.percentBased;
    }
    // Fallback vers l'ancienne logique
    return this.value > -1 && this.value < 1;
  }

  /**
   * Détermine si c'est une remise ou une majoration
   */
  isDiscount(): boolean {
    return this.value < 0;
  }

  /**
   * Vérifie si une contrainte logistique spécifique est présente dans le contexte
   * @param context Contexte contenant les contraintes logistiques
   * @param constraint Nom de la contrainte à vérifier
   * @returns True si la contrainte est présente
   */
  private hasLogisticsConstraint(context: any, constraint: string): boolean {
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];

    return pickupConstraints.includes(constraint) || deliveryConstraints.includes(constraint);
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Évalue une condition JSON intelligemment
   * @param conditionObj Objet JSON condition
   * @param context Contexte d'évaluation
   * @returns True si la condition est remplie
   */
  private evaluateJsonCondition(conditionObj: any, context: any): boolean {
    // ✅ NOUVELLE APPROCHE: Vérifier directement si l'UUID de cette règle est dans les contraintes/services
    // Les contraintes sont maintenant des UUIDs, pas des noms

    // Récupérer tous les tableaux de contraintes et services du contexte
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    const additionalServices = context.additionalServices || [];
    const simpleConstraints = context.constraints || []; // Pour rétrocompatibilité
    const simpleServices = context.services || []; // Pour rétrocompatibilité

    // Combiner toutes les sources d'IDs (UUIDs ou noms pour rétrocompatibilité)
    const allSelectedIds = [
      ...pickupConstraints,
      ...deliveryConstraints,
      ...additionalServices,
      ...simpleConstraints,
      ...simpleServices
    ];

    // Vérifier si l'UUID de cette règle est dans la liste des IDs sélectionnés
    const isSelected = allSelectedIds.includes(this.id);

    // ✅ FALLBACK pour rétrocompatibilité: si la règle n'est pas trouvée par UUID,
    // essayer avec l'ancien système de mapping par nom
    if (!isSelected && this.id) {
      const constraintName = this.mapJsonConditionToConstraintName(conditionObj);
      if (constraintName) {
        return allSelectedIds.includes(constraintName);
      }
    }

    return isSelected;
  }

  /**
   * Mappe une condition JSON complète vers le nom de contrainte correspondant
   * @param conditionObj Objet JSON condition
   * @returns Le nom de la contrainte ou null si non trouvé
   */
  private mapJsonConditionToConstraintName(conditionObj: any): string | null {
    const type = conditionObj.type;

    // 🔍 Mapping précis basé sur toutes les propriétés de la condition

    // Vehicle Access
    if (type === 'vehicle_access') {
      if (conditionObj.zone === 'pedestrian') return 'pedestrian_zone';
      if (conditionObj.road === 'narrow') return 'narrow_inaccessible_street';
      if (conditionObj.parking === 'difficult') return 'difficult_parking';
      if (conditionObj.parking === 'limited') return 'limited_parking';
      if (conditionObj.traffic === 'complex') return 'complex_traffic';
    }

    // Building
    if (type === 'building') {
      if (conditionObj.elevator === 'unavailable') return 'elevator_unavailable';
      if (conditionObj.elevator === 'small') return 'elevator_unsuitable_size';
      if (conditionObj.elevator === 'forbidden') return 'elevator_forbidden_moving';
      if (conditionObj.stairs === 'difficult') return 'difficult_stairs';
      if (conditionObj.corridors === 'narrow') return 'narrow_corridors';
    }

    // Distance
    if (type === 'distance') {
      if (conditionObj.carrying === 'long') return 'long_carrying_distance';
      if (conditionObj.access === 'indirect') return 'indirect_exit';
      if (conditionObj.access === 'multilevel') return 'complex_multilevel_access';
    }

    // Security
    if (type === 'security') {
      if (conditionObj.access === 'strict') return 'access_control';
      if (conditionObj.permit === 'required') return 'administrative_permit';
      if (conditionObj.time === 'restricted') return 'time_restrictions';
      if (conditionObj.floor === 'fragile') return 'fragile_floor';
    }

    // Equipment
    if (type === 'equipment') {
      if (conditionObj.lift === 'required') return 'furniture_lift_required';
    }

    // Service - Handling
    if (type === 'service') {
      if (conditionObj.handling === 'bulky') return 'bulky_furniture';
      if (conditionObj.handling === 'disassembly') return 'furniture_disassembly';
      if (conditionObj.handling === 'reassembly') return 'furniture_reassembly';
      if (conditionObj.handling === 'piano') return 'transport_piano';

      // Service - Packing
      if (conditionObj.packing === 'departure') return 'professional_packing_departure';
      if (conditionObj.packing === 'arrival') return 'professional_unpacking_arrival';
      if (conditionObj.packing === 'supplies') return 'packing_supplies';
      if (conditionObj.packing === 'artwork') return 'artwork_packing';

      // Service - Protection
      if (conditionObj.protection === 'fragile') return 'fragile_valuable_items';
      if (conditionObj.protection === 'heavy') return 'heavy_items';
      if (conditionObj.protection === 'inventory') return 'inventory_with_photos';

      // Service - Annexe
      if (conditionObj.annexe === 'storage') return 'temporary_storage_service';
      if (conditionObj.annexe === 'cleaning') return 'post_move_cleaning';
      if (conditionObj.annexe === 'admin') return 'administrative_management';
      if (conditionObj.annexe === 'pets') return 'pet_transport';

      // ✅ CLEANING - Services spécialisés (mapping des noms français)
      if (conditionObj.specialized === 'deep') return 'Grand nettoyage de printemps';
      if (conditionObj.specialized === 'carpet') return 'Nettoyage tapis et moquettes';
      if (conditionObj.specialized === 'windows') return 'Nettoyage vitres complet';
      if (conditionObj.specialized === 'appliances') return 'Nettoyage électroménager';

      // CLEANING - Désinfection
      if (conditionObj.disinfection === 'complete') return 'Désinfection complète';
      if (conditionObj.disinfection === 'covid') return 'Protocole sanitaire renforcé';
      if (conditionObj.disinfection === 'allergen') return 'Traitement anti-allergènes';

      // CLEANING - Maintenance
      if (conditionObj.maintenance === 'furniture') return 'Entretien mobilier';
      if (conditionObj.maintenance === 'silver') return 'Nettoyage argenterie';
      if (conditionObj.maintenance === 'organization') return 'Rangement et organisation';

      // CLEANING - Logistique
      if (conditionObj.logistics === 'supply') return 'Réapprovisionnement produits';
      if (conditionObj.logistics === 'waste') return 'Évacuation déchets';
      if (conditionObj.logistics === 'keys') return 'Gestion trousseau de clés';
    }

    // ✅ CLEANING - Contraintes d'accès
    if (type === 'access') {
      if (conditionObj.parking === 'limited') return 'Stationnement limité ou payant';
      if (conditionObj.elevator === 'none') return 'Absence d\'ascenseur';
      if (conditionObj.building === 'difficult') return 'Accès difficile au bâtiment';
      if (conditionObj.security === 'strict') return 'Contrôle de sécurité strict';
    }

    // ✅ CLEANING - Contraintes de travail
    if (type === 'work') {
      if (conditionObj.pets === 'present') return 'Présence d\'animaux';
      if (conditionObj.children === 'present') return 'Présence d\'enfants';
      if (conditionObj.allergies === 'present') return 'Allergies signalées';
      if (conditionObj.items === 'fragile') return 'Objets fragiles/précieux';
      if (conditionObj.furniture === 'heavy') return 'Meubles lourds à déplacer';
    }

    // ✅ CLEANING - Contraintes horaires
    if (type === 'schedule') {
      if (conditionObj.window === 'specific') return 'Créneau horaire spécifique';
      if (conditionObj.time === 'early') return 'Intervention matinale';
      if (conditionObj.time === 'evening') return 'Service en soirée';
      if (conditionObj.day === 'weekend') return 'Service weekend';
      if (conditionObj.urgency === 'emergency') return 'Service d\'urgence';
    }

    // ✅ CLEANING - Contraintes de lieu
    if (type === 'location') {
      if (conditionObj.dirt === 'heavy') return 'Saleté importante/tenace';
      if (conditionObj.work === 'construction') return 'Post-construction/travaux';
      if (conditionObj.damage === 'water') return 'Dégâts des eaux récents';
      if (conditionObj.mold === 'present') return 'Présence de moisissure';
      if (conditionObj.space === 'limited') return 'Espace très restreint';
      if (conditionObj.hoarding === 'present') return 'Situation d\'accumulation';
    }

    // ✅ CLEANING - Contraintes utilitaires
    if (type === 'utilities') {
      if (conditionObj.water === 'none') return 'Pas d\'accès à l\'eau';
      if (conditionObj.power === 'none') return 'Pas d\'électricité';
      if (conditionObj.products === 'special') return 'Produits spécifiques requis';
      if (conditionObj.equipment === 'industrial') return 'Équipement industriel requis';
      if (conditionObj.height === 'required') return 'Travail en hauteur';
    }

    return null;
  }

  /**
   * Compare deux règles pour vérifier si elles sont identiques
   * @param other Autre règle à comparer
   * @returns True si les règles sont identiques
   */
  equals(other: Rule): boolean {
    if (!other) return false;

    return (
      this.id === other.id &&
      this.name === other.name &&
      this.serviceType === other.serviceType &&
      this.value === other.value &&
      this.condition === other.condition &&
      this.isActive === other.isActive
    );
  }
}