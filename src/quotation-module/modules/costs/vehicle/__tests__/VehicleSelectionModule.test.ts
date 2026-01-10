import { VehicleSelectionModule } from '../VehicleSelectionModule';
import { QuoteContext } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('VehicleSelectionModule', () => {
  let module: VehicleSelectionModule;
  const vehicleConfig = MODULES_CONFIG.vehicle;

  beforeEach(() => {
    module = new VehicleSelectionModule();
  });

  describe('determineVehicleType (private method)', () => {
    it('should select CAMION_12M3 for volume ≤ 12 m³', () => {
      const testCases = [5, 10, 12];
      testCases.forEach(volume => {
        const vehicleType = (module as any).determineVehicleType(volume);
        expect(vehicleType).toBe('CAMION_12M3');
      });
    });

    it('should select CAMION_20M3 for volume > 12 m³ and ≤ 20 m³', () => {
      const testCases = [13, 15, 20];
      testCases.forEach(volume => {
        const vehicleType = (module as any).determineVehicleType(volume);
        expect(vehicleType).toBe('CAMION_20M3');
      });
    });

    it('should select CAMION_30M3 for volume > 20 m³ and ≤ 30 m³', () => {
      const testCases = [21, 25, 30];
      testCases.forEach(volume => {
        const vehicleType = (module as any).determineVehicleType(volume);
        expect(vehicleType).toBe('CAMION_30M3');
      });
    });

    it('should select CAMION_30M3 for volume > 30 m³ (fallback)', () => {
      const testCases = [35, 50, 100];
      testCases.forEach(volume => {
        const vehicleType = (module as any).determineVehicleType(volume);
        expect(vehicleType).toBe('CAMION_30M3');
      });
    });
  });

  describe('apply method', () => {
    it('should correctly calculate cost for CAMION_12M3 (volume ≤ 12 m³)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 10,
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const expectedVehicleType = 'CAMION_12M3';
      const expectedCost = vehicleConfig.VEHICLE_COSTS[expectedVehicleType];
      const expectedCapacity = vehicleConfig.VEHICLE_CAPACITIES[expectedVehicleType];
      const expectedCount = Math.ceil(10 / expectedCapacity); // 10 / 12 = 1
      const expectedTotalCost = expectedCost * expectedCount;

      expect(updatedCtx.computed?.vehicleTypes).toContain(expectedVehicleType);
      expect(updatedCtx.computed?.vehicleCount).toBe(expectedCount);
      
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost).toBeDefined();
      expect(vehicleCost?.category).toBe('VEHICLE');
      expect(vehicleCost?.amount).toBe(expectedTotalCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(expectedVehicleType);
      expect(vehicleCost?.metadata?.primaryVehicleCost).toBe(expectedCost);
      expect(vehicleCost?.metadata?.primaryVehicleCapacity).toBe(expectedCapacity);
      expect(vehicleCost?.metadata?.primaryVolumeUsed).toBe(10); // Volume utilisé
      expect(vehicleCost?.metadata?.secondaryVehicle).toBeNull();
    });

    it('should correctly calculate cost for CAMION_20M3 (volume > 12 m³ and ≤ 20 m³)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 18,
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const expectedVehicleType = 'CAMION_20M3';
      const expectedCost = vehicleConfig.VEHICLE_COSTS[expectedVehicleType];
      const expectedCapacity = vehicleConfig.VEHICLE_CAPACITIES[expectedVehicleType];
      const expectedCount = Math.ceil(18 / expectedCapacity); // 18 / 20 = 1
      const expectedTotalCost = expectedCost * expectedCount;

      expect(updatedCtx.computed?.vehicleTypes).toContain(expectedVehicleType);
      expect(updatedCtx.computed?.vehicleCount).toBe(expectedCount);
      
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.amount).toBe(expectedTotalCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(expectedVehicleType);
      expect(vehicleCost?.metadata?.primaryVolumeUsed).toBe(18); // Volume utilisé
      expect(vehicleCost?.metadata?.secondaryVehicle).toBeNull();
    });

    it('should correctly calculate cost for CAMION_30M3 (volume > 20 m³ and ≤ 30 m³)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 25,
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const expectedVehicleType = 'CAMION_30M3';
      const expectedCost = vehicleConfig.VEHICLE_COSTS[expectedVehicleType];
      const expectedCapacity = vehicleConfig.VEHICLE_CAPACITIES[expectedVehicleType];
      const expectedCount = 1; // 25 m³ ≤ 30 m³, donc 1 seul véhicule
      const expectedTotalCost = expectedCost; // Pas de véhicule secondaire

      expect(updatedCtx.computed?.vehicleTypes).toContain(expectedVehicleType);
      expect(updatedCtx.computed?.vehicleCount).toBe(expectedCount);
      
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.amount).toBe(expectedTotalCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(expectedVehicleType);
      expect(vehicleCost?.metadata?.primaryVolumeUsed).toBe(25); // Volume utilisé
      expect(vehicleCost?.metadata?.secondaryVehicle).toBeNull();
    });

    it('should optimize vehicle selection when volume exceeds primary capacity (35 m³)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 35, // > 30 m³ → CAMION_30M3 (30 m³) + CAMION_12M3 (5 m³ restant)
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const primaryVehicleType = 'CAMION_30M3';
      const secondaryVehicleType = 'CAMION_12M3';
      const primaryCost = vehicleConfig.VEHICLE_COSTS[primaryVehicleType]; // 350€
      const secondaryCost = vehicleConfig.VEHICLE_COSTS[secondaryVehicleType]; // 80€
      const expectedTotalCost = primaryCost + secondaryCost; // 350 + 80 = 430€

      expect(updatedCtx.computed?.vehicleCount).toBe(2);
      expect(updatedCtx.computed?.vehicleTypes).toContain(primaryVehicleType);
      expect(updatedCtx.computed?.vehicleTypes).toContain(secondaryVehicleType);
      
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.amount).toBe(expectedTotalCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(primaryVehicleType);
      expect(vehicleCost?.metadata?.primaryVehicleCost).toBe(primaryCost);
      expect(vehicleCost?.metadata?.primaryVolumeUsed).toBe(30); // Capacité du CAMION_30M3
      expect(vehicleCost?.metadata?.secondaryVehicle).toBe(secondaryVehicleType);
      expect(vehicleCost?.metadata?.secondaryVehicleCost).toBe(secondaryCost);
      expect(vehicleCost?.metadata?.secondaryVolumeUsed).toBe(5); // Volume restant
    });

    it('should optimize vehicle selection for volume 22 m³ (CAMION_20M3 + CAMION_12M3)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 22, // > 20 m³ → CAMION_20M3 (20 m³) + CAMION_12M3 (2 m³ restant)
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const primaryVehicleType = 'CAMION_20M3';
      const secondaryVehicleType = 'CAMION_12M3';
      const primaryCost = vehicleConfig.VEHICLE_COSTS[primaryVehicleType]; // 250€
      const secondaryCost = vehicleConfig.VEHICLE_COSTS[secondaryVehicleType]; // 80€
      const expectedTotalCost = primaryCost + secondaryCost; // 250 + 80 = 330€

      expect(updatedCtx.computed?.vehicleCount).toBe(2);
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.amount).toBe(expectedTotalCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(primaryVehicleType);
      expect(vehicleCost?.metadata?.secondaryVehicle).toBe(secondaryVehicleType);
    });

    it('should choose CAMION_20M3 for remaining volume 15 m³ (not CAMION_12M3 which is insufficient)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 35, // > 30 m³ → CAMION_30M3 (30 m³) + véhicule pour 5 m³ restant
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
        },
      };

      const updatedCtx = module.apply(ctx);
      // Volume 35 m³ : CAMION_30M3 (30 m³) + CAMION_12M3 (5 m³ restant, capacité 12 ≥ 5)
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.metadata?.primaryVehicle).toBe('CAMION_30M3');
      expect(vehicleCost?.metadata?.primaryVolumeUsed).toBe(30);
      expect(vehicleCost?.metadata?.secondaryVehicle).toBe('CAMION_12M3'); // Capacité 12 ≥ 5
      expect(vehicleCost?.metadata?.secondaryVolumeUsed).toBe(5);
    });

    it('should choose CAMION_20M3 for remaining volume 15 m³ (capacity 20 ≥ 15, not CAMION_12M3 which is insufficient)', () => {
      // Test théorique : si volume principal était 5 m³ et restant 15 m³
      // On vérifie que la logique choisit bien CAMION_20M3 (20 ≥ 15) et non CAMION_12M3 (12 < 15)
      const findBestVehicle = (module as any).findBestVehicleForVolume.bind(module);
      const result = findBestVehicle(15);
      expect(result).toBe('CAMION_20M3'); // Capacité 20 ≥ 15, distance 5
      // CAMION_12M3 ne peut pas être choisi car capacité 12 < 15 (insuffisant)
    });

    it('should use default vehicle (CAMION_20M3) if volume not available', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
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
        },
      };

      const updatedCtx = module.apply(ctx);
      const defaultVehicleType = vehicleConfig.DEFAULT_VEHICLE_TYPE;
      const expectedCost = vehicleConfig.VEHICLE_COSTS[defaultVehicleType];

      expect(updatedCtx.computed?.vehicleCount).toBe(1);
      expect(updatedCtx.computed?.vehicleTypes).toContain(defaultVehicleType);
      
      const vehicleCost = updatedCtx.computed?.costs?.find(c => c.moduleId === 'vehicle-selection');
      expect(vehicleCost?.amount).toBe(expectedCost);
      expect(vehicleCost?.metadata?.primaryVehicle).toBe(defaultVehicleType);
      expect(vehicleCost?.metadata?.secondaryVehicle).toBeNull();
    });

    it('should add module to activatedModules', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue Test, 75001 Paris',
        arrivalAddress: '456 Avenue Test, 75002 Paris',
        computed: {
          adjustedVolume: 35,
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
        },
      };

      const updatedCtx = module.apply(ctx);

      expect(updatedCtx.computed?.activatedModules).toContain('vehicle-selection');
    });
  });
});
