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
    public readonly percentBased?: boolean
  ) {}

  /**
   * Détermine si une règle est applicable en fonction du contexte
   * @param context Contexte contenant les données pour évaluer la condition
   */
  isApplicable(context: any): boolean {
    // Si on a une fonction d'application personnalisée, l'utiliser
    if (typeof this.applyFunction === 'function') {
      const result = this.applyFunction(context);
      return result.success && result.modified;
    }

    // Si aucune condition n'est spécifiée, la règle est toujours applicable
    if (!this.condition || this.condition.trim() === '') {
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
      
      // 🏗️ DÉTECTION ET GESTION DU MONTE-MEUBLE OBLIGATOIRE
      const furnitureLiftAnalysis = this.analyzeFurnitureLiftRequirement(context);
      
      // Créer un contexte enrichi pour l'évaluation
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
        
        // 🏗️ GESTION DU MONTE-MEUBLE ET CONTRAINTES CONSOMMÉES
        monte_meuble_requis: furnitureLiftAnalysis.required,
        consumedConstraints: furnitureLiftAnalysis.consumedConstraints,
        
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
      
      // 🚫 FILTRAGE DES CONTRAINTES CONSOMMÉES PAR LE MONTE-MEUBLE
      if (this.isConstraintConsumedByFurnitureLift(evalContext)) {
        console.log(`🚫 Règle "${this.name}" ignorée - contrainte consommée par le monte-meuble`);
        return false;
      }

      // ✅ CORRECTION: Gérer les conditions JSON ET les expressions JavaScript
      let result: boolean;

      // Détecter si c'est un objet JSON ou une expression JS
      const conditionStr = this.condition.trim();
      if (conditionStr.startsWith('{') || conditionStr.startsWith('[')) {
        // C'est un objet JSON - parser et évaluer intelligemment
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
    let multiplier = 1;

    // 🔄 LOGIQUE DE MULTIPLICATION POUR CONTRAINTES LOGISTIQUES
    // ✅ JUSTIFICATION: TOUTES les contraintes logistiques se multiplient par adresse (départ + arrivée)
    // Exemple: stationnement difficile au départ ET à l'arrivée = 2x le coût
    if (context && this.condition) {
      // Toutes les contraintes logistiques se multiplient par nombre d'adresses concernées
      const logisticsConstraints = [
        'furniture_lift_required', 'pedestrian_zone', 'narrow_inaccessible_street',
        'difficult_parking', 'complex_traffic', 'elevator_unavailable',
        'elevator_unsuitable_size', 'elevator_forbidden_moving', 'difficult_stairs',
        'narrow_corridors', 'long_carrying_distance', 'indirect_exit',
        'complex_multilevel_access', 'access_control', 'administrative_permit',
        'time_restrictions', 'fragile_floor', 'bulky_furniture',
        'furniture_disassembly', 'furniture_reassembly', 'professional_packing_departure',
        'professional_unpacking_arrival', 'packing_supplies', 'fragile_valuable_items',
        'heavy_items', 'additional_insurance', 'temporary_storage_service'
      ];

      // Si la condition correspond à une contrainte logistique
      if (logisticsConstraints.includes(this.condition)) {
        multiplier = this.countLogisticsConstraint(context, this.condition);
        console.log(`📍 [RÈGLE-LOGISTIQUE] "${this.name}" appliquée ${multiplier}x (${multiplier === 2 ? 'départ+arrivée' : multiplier === 1 ? 'une adresse' : 'aucune adresse'})`);
        
        // Si la contrainte n'est présente nulle part, ne pas appliquer la règle
        if (multiplier === 0) {
          return {
            success: true,
            modified: false,
            price: priceAmount,
            isApplied: false,
            impact: 0,
            newPrice: new Money(priceAmount)
          };
        }
      }
    }

    if (this.isPercentage()) {
      // 🔧 CORRECTION: Pour les pourcentages, utiliser le prix de base initial si fourni
      const basePriceAmount = basePrice ? basePrice.getAmount() : priceAmount;
      const percentageValue = this.value * multiplier;
      const percentageImpact = Math.round(basePriceAmount * percentageValue / 100);
      newPrice = priceAmount + percentageImpact;
    } else {
      // Si la valeur est un montant fixe, multiplier par le nombre d'occurrences
      newPrice = Math.round(priceAmount + (this.value * multiplier));
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
   * Compte combien de fois une contrainte logistique est présente (pickup + delivery)
   * @param context Contexte contenant les contraintes logistiques
   * @param constraint Nom de la contrainte à compter
   * @returns Nombre d'occurrences (0, 1 ou 2)
   */
  private countLogisticsConstraint(context: any, constraint: string): number {
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    
    let count = 0;
    if (pickupConstraints.includes(constraint)) count++;
    if (deliveryConstraints.includes(constraint)) count++;
    
    return count;
  }

  /**
   * Analyse si le monte-meuble est requis et quelles contraintes sont consommées
   * @param context Contexte contenant toutes les données
   * @returns Analyse du monte-meuble requis et contraintes consommées
   */
  private analyzeFurnitureLiftRequirement(context: any): { required: boolean; consumedConstraints: Set<string> } {
    const consumedConstraints = new Set<string>();
    let required = false;
    
    // Récupérer les données d'étage et d'ascenseur
    const pickupFloor = parseInt(context.pickupFloor || '0');
    const deliveryFloor = parseInt(context.deliveryFloor || '0');
    const pickupElevator = context.pickupElevator;
    const deliveryElevator = context.deliveryElevator;
    const volume = parseFloat(context.volume || '0');
    
    // Contraintes qui peuvent déclencher le monte-meuble
    const triggerConstraints = [
      'elevator_unavailable',
      'elevator_unsuitable_size', 
      'elevator_forbidden_moving',
      'difficult_stairs',
      'narrow_corridors',
      'indirect_exit',
      'complex_multilevel_access',
      'bulky_furniture'
    ];
    
    // Vérifier si le monte-meuble est explicitement requis
    if (this.hasLogisticsConstraint(context, 'furniture_lift_required')) {
      required = true;
      consumedConstraints.add('furniture_lift_required');
    }
    
    // Logique d'activation automatique du monte-meuble
    const hasNoElevator = !pickupElevator || pickupElevator === 'no' || !deliveryElevator || deliveryElevator === 'no';
    const hasSmallElevator = pickupElevator === 'small' || deliveryElevator === 'small';
    const hasElevatorProblems = this.hasLogisticsConstraint(context, 'elevator_unavailable') ||
                               this.hasLogisticsConstraint(context, 'elevator_unsuitable_size') ||
                               this.hasLogisticsConstraint(context, 'elevator_forbidden_moving');
    
    const maxFloor = Math.max(pickupFloor, deliveryFloor);
    
    // CAS 1: Étage élevé (> 3) sans ascenseur fonctionnel
    if (maxFloor > 3 && (hasNoElevator || hasElevatorProblems)) {
      required = true;
      if (hasElevatorProblems) {
        if (this.hasLogisticsConstraint(context, 'elevator_unavailable')) consumedConstraints.add('elevator_unavailable');
        if (this.hasLogisticsConstraint(context, 'elevator_unsuitable_size')) consumedConstraints.add('elevator_unsuitable_size');
        if (this.hasLogisticsConstraint(context, 'elevator_forbidden_moving')) consumedConstraints.add('elevator_forbidden_moving');
      }
    }
    
    // CAS 2: Contraintes d'accès difficile + objets lourds/encombrants
    const hasAccessConstraints = this.hasLogisticsConstraint(context, 'difficult_stairs') ||
                                this.hasLogisticsConstraint(context, 'narrow_corridors') ||
                                this.hasLogisticsConstraint(context, 'indirect_exit') ||
                                this.hasLogisticsConstraint(context, 'complex_multilevel_access');
    
    const hasHeavyItems = this.hasLogisticsConstraint(context, 'bulky_furniture');
    
    if (maxFloor >= 1 && hasAccessConstraints && hasHeavyItems) {
      required = true;
      
      // Marquer les contraintes comme consommées
      if (this.hasLogisticsConstraint(context, 'difficult_stairs')) consumedConstraints.add('difficult_stairs');
      if (this.hasLogisticsConstraint(context, 'narrow_corridors')) consumedConstraints.add('narrow_corridors');
      if (this.hasLogisticsConstraint(context, 'indirect_exit')) consumedConstraints.add('indirect_exit');
      if (this.hasLogisticsConstraint(context, 'complex_multilevel_access')) consumedConstraints.add('complex_multilevel_access');
      if (this.hasLogisticsConstraint(context, 'bulky_furniture')) consumedConstraints.add('bulky_furniture');
    }
    
    // CAS 3: Ascenseur small + contraintes + objets lourds
    if (hasSmallElevator && hasAccessConstraints && hasHeavyItems && maxFloor >= 1) {
      required = true;
      
      // Marquer les contraintes comme consommées (même logique que CAS 2)
      if (this.hasLogisticsConstraint(context, 'difficult_stairs')) consumedConstraints.add('difficult_stairs');
      if (this.hasLogisticsConstraint(context, 'narrow_corridors')) consumedConstraints.add('narrow_corridors');
      if (this.hasLogisticsConstraint(context, 'indirect_exit')) consumedConstraints.add('indirect_exit');
      if (this.hasLogisticsConstraint(context, 'complex_multilevel_access')) consumedConstraints.add('complex_multilevel_access');
      if (this.hasLogisticsConstraint(context, 'bulky_furniture')) consumedConstraints.add('bulky_furniture');
    }
    
    if (required && consumedConstraints.size > 0) {
      // ✨ OPTIMISATION: Ce log est maintenant géré de façon centralisée dans RuleEngine
      // console.log(`🏗️ Monte-meuble requis - Contraintes consommées:`, Array.from(consumedConstraints));
    }
    
    return { required, consumedConstraints };
  }

  /**
   * Vérifie si cette règle doit être ignorée car sa contrainte est consommée par le monte-meuble
   * @param evalContext Contexte d'évaluation enrichi
   * @returns True si la règle doit être ignorée
   */
  private isConstraintConsumedByFurnitureLift(evalContext: any): boolean {
    // Si le monte-meuble n'est pas requis, aucune contrainte n'est consommée
    if (!evalContext.monte_meuble_requis) {
      return false;
    }
    
    // Si cette règle est la règle du monte-meuble elle-même, ne pas l'ignorer
    if (this.condition === 'furniture_lift_required' || this.name === 'Monte-meuble') {
      return false;
    }
    
    // Vérifier si la condition de cette règle correspond à une contrainte consommée
    const consumedConstraints = evalContext.consumedConstraints || new Set();
    
    // Si la condition de la règle est directement dans les contraintes consommées
    if (consumedConstraints.has(this.condition)) {
      return true;
    }
    
    // Cas spéciaux pour les règles qui vérifient des variables booléennes
    const constraintMappings: Record<string, string> = {
      'difficult_stairs': 'difficult_stairs',
      'narrow_corridors': 'narrow_corridors', 
      'indirect_exit': 'indirect_exit',
      'complex_multilevel_access': 'complex_multilevel_access',
      'bulky_furniture': 'bulky_furniture',
      'elevator_unavailable': 'elevator_unavailable',
      'elevator_unsuitable_size': 'elevator_unsuitable_size',
      'elevator_forbidden_moving': 'elevator_forbidden_moving'
    };
    
    // Vérifier si la condition correspond à une contrainte mappée qui est consommée
    const mappedConstraint = constraintMappings[this.condition];
    if (mappedConstraint && consumedConstraints.has(mappedConstraint)) {
      return true;
    }
    
    return false;
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Évalue une condition JSON intelligemment
   * @param conditionObj Objet JSON condition
   * @param context Contexte d'évaluation
   * @returns True si la condition est remplie
   */
  private evaluateJsonCondition(conditionObj: any, context: any): boolean {
    // ✅ CORRECTION IMPORTANTE: Mapper la condition JSON complète vers LE BON nom de contrainte
    // Utiliser toutes les propriétés de la condition, pas juste le type

    // Mapper les conditions JSON complètes vers les noms de contraintes
    const constraintName = this.mapJsonConditionToConstraintName(conditionObj);

    if (!constraintName) {
      console.warn(`⚠️ Impossible de mapper la condition JSON pour règle "${this.name}":`, conditionObj);
      return false;
    }

    // ✅ AMÉLIORATION: Vérifier si la contrainte est présente dans le contexte
    // Support de plusieurs formats:
    // 1. Format complet: pickupLogisticsConstraints / deliveryLogisticsConstraints
    // 2. Format simple: constraints (pour les tests et certains formulaires)
    // 3. Format services: services (pour les services additionnels)

    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    const simpleConstraints = context.constraints || [];
    const simpleServices = context.services || [];

    // Combiner toutes les sources de contraintes
    const allConstraints = [
      ...pickupConstraints,
      ...deliveryConstraints,
      ...simpleConstraints,
      ...simpleServices
    ];

    const hasConstraint = allConstraints.includes(constraintName);

    return hasConstraint;
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