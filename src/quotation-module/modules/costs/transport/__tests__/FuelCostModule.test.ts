import { FuelCostModule } from '../FuelCostModule';
import type { QuoteContext } from '../../../types/quote-types';
import { MODULES_CONFIG } from '../../../../config/modules.config';

describe('FuelCostModule', () => {
  let module: FuelCostModule;
  const fuelConfig = MODULES_CONFIG.fuel;

  beforeEach(() => {
    module = new FuelCostModule();
  });

  describe('apply without distance', () => {
    it('should not modify context for zero distance', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Paris',
        computed: {
          distanceKm: 0,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: [],
          metadata: {}
        }
      };
      const result = module.apply(ctx);
      expect(result.computed?.costs).toHaveLength(0);
    });

    it('should not modify context when distance is undefined', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Versailles'
      };
      const result = module.apply(ctx);
      expect(result).toEqual(ctx);
    });
  });

  describe('apply', () => {
    it('should not modify context without distance', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Versailles'
      };
      const result = module.apply(ctx);
      expect(result).toEqual(ctx);
    });

    it('should calculate fuel cost correctly for 100km', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Versailles',
        distance: 100,
        computed: {
          distanceKm: 100,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['distance-calculation'],
          metadata: {}
        }
      };

      const result = module.apply(ctx);

      expect(result.computed?.costs).toHaveLength(1);
      expect(result.computed?.costs[0].moduleId).toBe('fuel-cost');
      expect(result.computed?.costs[0].category).toBe('TRANSPORT');
      expect(result.computed?.costs[0].label).toBe('Coût carburant');
      // Distance 100 km : (100 / 100) × 12 L/100km = 12 L
      // Coût : 12 L × 1.70€/L = 20.40€
      const expectedConsumption = (100 / 100) * fuelConfig.VEHICLE_CONSUMPTION_L_PER_100KM;
      const expectedCost = expectedConsumption * fuelConfig.PRICE_PER_LITER;
      expect(result.computed?.costs[0].amount).toBeCloseTo(expectedCost, 2);
      expect(result.computed?.costs[0].metadata?.distanceKm).toBe(100);
      expect(result.computed?.costs[0].metadata?.fuelConsumptionLiters).toBeCloseTo(expectedConsumption, 2);
      expect(result.computed?.costs[0].metadata?.fuelPricePerLiter).toBe(fuelConfig.PRICE_PER_LITER);
      expect(result.computed?.costs[0].metadata?.vehicleConsumption).toBe(fuelConfig.VEHICLE_CONSUMPTION_L_PER_100KM);
    });

    it('should calculate fuel cost correctly for 200km', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Marseille',
        distance: 200,
        computed: {
          distanceKm: 200,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['distance-calculation'],
          metadata: {}
        }
      };

      const result = module.apply(ctx);

      // Distance 200 km : (200 / 100) × 12 L/100km = 24 L
      // Coût : 24 L × 1.70€/L = 40.80€
      const expectedConsumption = (200 / 100) * fuelConfig.VEHICLE_CONSUMPTION_L_PER_100KM;
      const expectedCost = expectedConsumption * fuelConfig.PRICE_PER_LITER;
      expect(result.computed?.costs[0].amount).toBeCloseTo(expectedCost, 2);
    });

    it('should add module to activatedModules', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Versailles',
        distance: 100,
        computed: {
          distanceKm: 100,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['distance-calculation'],
          metadata: {}
        }
      };

      const result = module.apply(ctx);

      expect(result.computed?.activatedModules).toContain('fuel-cost');
      expect(result.computed?.activatedModules).toHaveLength(2);
    });

    it('should preserve existing costs', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: 'Paris',
        arrivalAddress: 'Versailles',
        distance: 100,
        computed: {
          distanceKm: 100,
          costs: [
            { moduleId: 'other-module', category: 'TRANSPORT', label: 'Other', amount: 50 }
          ],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['distance-calculation'],
          metadata: {}
        }
      };

      const result = module.apply(ctx);

      expect(result.computed?.costs).toHaveLength(2);
      expect(result.computed?.costs[0].moduleId).toBe('other-module');
      expect(result.computed?.costs[1].moduleId).toBe('fuel-cost');
    });

    it('should have correct module metadata', () => {
      expect(module.id).toBe('fuel-cost');
      expect(module.description).toBe('Calcule le coût carburant pour le trajet');
      expect(module.priority).toBe(33);
      expect(module.dependencies).toEqual(['distance-calculation']);
    });
  });
});
