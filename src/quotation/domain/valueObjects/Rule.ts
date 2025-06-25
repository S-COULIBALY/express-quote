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
    public readonly id?: string
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
        temporary_storage_service: this.hasLogisticsConstraint(context, 'temporary_storage_service')
      };
      
      // 🚫 FILTRAGE DES CONTRAINTES CONSOMMÉES PAR LE MONTE-MEUBLE
      if (this.isConstraintConsumedByFurnitureLift(evalContext)) {
        console.log(`🚫 Règle "${this.name}" ignorée - contrainte consommée par le monte-meuble`);
        return false;
      }
      
      // Évaluer la condition
      const evalFunction = new Function(...Object.keys(evalContext), `return (${this.condition});`);
      return evalFunction(...Object.values(evalContext));
    } catch (error) {
      console.error(`Error evaluating rule condition: ${this.condition}`, error);
      return false;
    }
  }

  /**
   * Applique la règle au prix en fonction de sa valeur
   * @param price Prix actuel
   * @param context Contexte de la demande (optionnel)
   * @returns Résultat de l'application de la règle
   */
  apply(price: Money, context?: any): RuleApplyResult {
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

    if (this.isPercentage()) {
      // Si la valeur est un pourcentage
      newPrice = Math.round(priceAmount * (1 + this.value));
    } else {
      // Si la valeur est un montant fixe
      newPrice = Math.round(priceAmount + this.value);
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
      'bulky_furniture',
      'heavy_items',
      'fragile_valuable_items'
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
    
    const hasHeavyItems = this.hasLogisticsConstraint(context, 'bulky_furniture') ||
                         this.hasLogisticsConstraint(context, 'heavy_items') ||
                         this.hasLogisticsConstraint(context, 'fragile_valuable_items');
    
    if (maxFloor >= 1 && hasAccessConstraints && hasHeavyItems) {
      required = true;
      
      // Marquer les contraintes comme consommées
      if (this.hasLogisticsConstraint(context, 'difficult_stairs')) consumedConstraints.add('difficult_stairs');
      if (this.hasLogisticsConstraint(context, 'narrow_corridors')) consumedConstraints.add('narrow_corridors');
      if (this.hasLogisticsConstraint(context, 'indirect_exit')) consumedConstraints.add('indirect_exit');
      if (this.hasLogisticsConstraint(context, 'complex_multilevel_access')) consumedConstraints.add('complex_multilevel_access');
      if (this.hasLogisticsConstraint(context, 'bulky_furniture')) consumedConstraints.add('bulky_furniture');
      if (this.hasLogisticsConstraint(context, 'heavy_items')) consumedConstraints.add('heavy_items');
      if (this.hasLogisticsConstraint(context, 'fragile_valuable_items')) consumedConstraints.add('fragile_valuable_items');
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
      if (this.hasLogisticsConstraint(context, 'heavy_items')) consumedConstraints.add('heavy_items');
      if (this.hasLogisticsConstraint(context, 'fragile_valuable_items')) consumedConstraints.add('fragile_valuable_items');
    }
    
    if (required && consumedConstraints.size > 0) {
      console.log(`🏗️ Monte-meuble requis - Contraintes consommées:`, Array.from(consumedConstraints));
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
      'heavy_items': 'heavy_items',
      'fragile_valuable_items': 'fragile_valuable_items',
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