import { FurnitureLiftCostModule } from '../FurnitureLiftCostModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('FurnitureLiftCostModule', () => {
  let module: FurnitureLiftCostModule;
  let baseContext: QuoteContext;
  const config = MODULES_CONFIG.furnitureLift;

  beforeEach(() => {
    module = new FurnitureLiftCostModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should not be applicable if no floors without elevator', () => {
      baseContext.pickupFloor = 0;
      baseContext.pickupHasElevator = true;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if floor is less than or equal to 3 without explicit acceptance', () => {
      baseContext.pickupFloor = 2; // Étage 2 < 3
      baseContext.pickupHasElevator = false;
      // Pas d'acceptation explicite, pas de recommandation
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if floor is exactly 3 without explicit acceptance', () => {
      baseContext.pickupFloor = 3; // Étage 3 = seuil
      baseContext.pickupHasElevator = false;
      baseContext.computed!.requirements = [
        {
          type: 'LIFT_RECOMMENDED',
          severity: 'HIGH',
          reason: 'Étage élevé sans ascenseur',
          moduleId: 'monte-meubles-recommendation',
        }
      ];
      // Recommandation existe mais étage = 3 (pas > 3), pas d'acceptation explicite
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should be applicable if floor is 2 with explicit acceptance', () => {
      baseContext.pickupFloor = 2; // Étage 2
      baseContext.pickupHasElevator = false;
      baseContext.refuseLiftDespiteRecommendation = false; // Acceptation explicite
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should be applicable if floor is 3 with explicit acceptance', () => {
      baseContext.pickupFloor = 3; // Étage 3
      baseContext.pickupHasElevator = false;
      baseContext.refuseLiftDespiteRecommendation = false; // Acceptation explicite
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should be applicable if floor is greater than 3', () => {
      baseContext.pickupFloor = 4; // Étage 4 > 3
      baseContext.pickupHasElevator = false;
      baseContext.computed!.requirements = [
        {
          type: 'LIFT_RECOMMENDED',
          severity: 'HIGH',
          reason: 'Étage élevé sans ascenseur',
          moduleId: 'monte-meubles-recommendation',
        }
      ];
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if lift is refused', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.computed!.requirements = [
        {
          type: 'LIFT_RECOMMENDED',
          severity: 'HIGH',
          reason: 'Étage élevé sans ascenseur',
          moduleId: 'monte-meubles-recommendation',
        }
      ];
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should be applicable if floor is greater than 3 with recommendation', () => {
      baseContext.pickupFloor = 4; // Étage 4 > 3
      baseContext.pickupHasElevator = false;
      baseContext.computed!.requirements = [
        {
          type: 'LIFT_RECOMMENDED',
          severity: 'HIGH',
          reason: 'Étage élevé sans ascenseur',
          moduleId: 'monte-meubles-recommendation',
        }
      ];
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should be applicable if pickupFurnitureLift is true (conditionnel selon contraintes)', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      baseContext.pickupFurnitureLift = true; // Conditionnel selon contraintes techniques
      expect(module.isApplicable(baseContext)).toBe(true);
    });
  });

  describe('apply', () => {
    describe('calcul des coûts - pas de surcoût par étage', () => {
      it('should calculate base cost for single lift (pickup only)', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€ (pas de surcoût par étage)
        expect(cost?.label).toBe('Location monte-meubles (départ)');
      });

      it('should calculate base cost for single lift (delivery only)', () => {
        baseContext.deliveryFloor = 5;
        baseContext.deliveryHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'CRITICAL',
            reason: 'Étage très élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€ (pas de surcoût par étage)
        expect(cost?.label).toBe('Location monte-meubles (arrivée)');
      });

      it('should calculate cost with double installation surcharge', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.deliveryFloor = 5; // Étage 5 > 3
        baseContext.deliveryHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        const expectedCost = config.BASE_LIFT_COST + config.DOUBLE_LIFT_SURCHARGE; // 250 + 250 = 500€
        expect(cost?.amount).toBe(expectedCost);
        expect(cost?.label).toBe('Location monte-meubles (départ + arrivée)');
      });

      it('should not apply for delivery if floor is less than or equal to 3', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.deliveryFloor = 3; // Étage 3 = seuil, ne doit pas déclencher monte-meubles
        baseContext.deliveryHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        // Seulement le coût de base car seul le pickup nécessite un monte-meubles
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€ seulement
        expect(cost?.label).toBe('Location monte-meubles (départ)');
        expect(cost?.metadata.needsLiftDelivery).toBe(false);
      });

      it('should not add extra cost for high floors (no per-floor surcharge)', () => {
        baseContext.pickupFloor = 10; // 10ème étage
        baseContext.pickupHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'CRITICAL',
            reason: 'Étage très élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        // Même pour le 10ème étage, pas de surcoût par étage
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€ seulement
      });

      it('should calculate cost for floor 2 with explicit acceptance', () => {
        baseContext.pickupFloor = 2; // Étage 2
        baseContext.pickupHasElevator = false;
        baseContext.refuseLiftDespiteRecommendation = false; // Acceptation explicite
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€
        expect(cost?.label).toBe('Location monte-meubles (départ)');
        expect(cost?.metadata.isExplicitAcceptance).toBe(true);
      });

      it('should calculate cost for floor 3 with explicit acceptance', () => {
        baseContext.pickupFloor = 3; // Étage 3
        baseContext.pickupHasElevator = false;
        baseContext.refuseLiftDespiteRecommendation = false; // Acceptation explicite
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST); // 250€
        expect(cost?.label).toBe('Location monte-meubles (départ)');
        expect(cost?.metadata.isExplicitAcceptance).toBe(true);
      });

      it('should calculate cost with double installation for floors 2 and 3 with explicit acceptance', () => {
        baseContext.pickupFloor = 2; // Étage 2
        baseContext.pickupHasElevator = false;
        baseContext.deliveryFloor = 3; // Étage 3
        baseContext.deliveryHasElevator = false;
        baseContext.refuseLiftDespiteRecommendation = false; // Acceptation explicite
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost).toBeDefined();
        const expectedCost = config.BASE_LIFT_COST + config.DOUBLE_LIFT_SURCHARGE; // 250 + 250 = 500€
        expect(cost?.amount).toBe(expectedCost);
        expect(cost?.label).toBe('Location monte-meubles (départ + arrivée)');
        expect(cost?.metadata.isExplicitAcceptance).toBe(true);
        expect(cost?.metadata.doubleInstallation).toBe(true);
      });
    });

    describe('métadonnées', () => {
      it('should store correct metadata for single lift', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost?.metadata).toMatchObject({
          baseCost: config.BASE_LIFT_COST,
          needsLiftPickup: true,
          needsLiftDelivery: false,
          pickupFloor: 4,
          doubleInstallation: false,
          doubleInstallationSurcharge: 0,
          isExplicitAcceptance: false, // Facturation automatique (pas d'acceptation explicite)
        });
        expect(cost?.metadata.details).toHaveLength(0); // Pas de détails car pas de surcoût
      });

      it('should store correct metadata for double lift', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.deliveryFloor = 5; // Étage 5 > 3
        baseContext.deliveryHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        const cost = result.computed?.costs.find(c => c.moduleId === 'furniture-lift-cost');
        expect(cost?.metadata).toMatchObject({
          baseCost: config.BASE_LIFT_COST,
          needsLiftPickup: true,
          needsLiftDelivery: true,
          pickupFloor: 4,
          deliveryFloor: 5,
          doubleInstallation: true,
          doubleInstallationSurcharge: config.DOUBLE_LIFT_SURCHARGE,
          isExplicitAcceptance: false, // Facturation automatique (pas d'acceptation explicite)
        });
        expect(cost?.metadata.details).toContain(`+${config.DOUBLE_LIFT_SURCHARGE}€ (double installation)`);
      });

      it('should update computed metadata', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        expect(result.computed?.metadata.furnitureLiftAccepted).toBe(true);
        expect(result.computed?.metadata.furnitureLiftCost).toBe(config.BASE_LIFT_COST);
      });
    });

    describe('activated modules and flags', () => {
      it('should add module to activatedModules', () => {
        baseContext.pickupFloor = 4; // Étage 4 > 3
        baseContext.pickupHasElevator = false;
        baseContext.computed!.requirements = [
          {
            type: 'LIFT_RECOMMENDED',
            severity: 'HIGH',
            reason: 'Étage élevé sans ascenseur',
            moduleId: 'monte-meubles-recommendation',
          }
        ];
        const result = module.apply(baseContext);

        expect(result.computed?.activatedModules).toContain('furniture-lift-cost');
      });
    });
  });
});

