import { LaborBaseModule } from "../LaborBaseModule";
import { QuoteContext } from "../../types/quote-types";
import { MODULES_CONFIG } from "../../../../config/modules.config";

describe("LaborBaseModule", () => {
  let mod: LaborBaseModule;
  let baseContext: QuoteContext;
  const laborConfig = MODULES_CONFIG.labor;

  beforeEach(() => {
    mod = new LaborBaseModule();
    // workersCount est calculé par WorkersCalculationModule (priority 61) avant LaborBaseModule (priority 62)
    const volume = 20;
    const workersCount = Math.ceil(volume / laborConfig.VOLUME_PER_WORKER); // 4
    baseContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue Test, 75001 Paris",
      arrivalAddress: "456 Avenue Test, 75002 Paris",
      computed: {
        adjustedVolume: volume,
        workersCount, // Déjà calculé par WorkersCalculationModule
        costs: [],
        adjustments: [],
        riskContributions: [],
        legalImpacts: [],
        insuranceNotes: [],
        requirements: [],
        crossSellProposals: [],
        operationalFlags: [],
        activatedModules: ["workers-calculation"], // WorkersCalculationModule déjà exécuté
        metadata: {},
      },
    };
  });

  describe("apply method", () => {
    it("should calculate base labor cost using workersCount from context", () => {
      const result = mod.apply(baseContext);

      // workersCount = 4 (déjà calculé par WorkersCalculationModule)
      // Coût : 30€/h × 7h × 4 = 840€
      const expectedWorkers = baseContext.computed!.workersCount!; // 4
      const expectedCost =
        laborConfig.BASE_HOURLY_RATE *
        laborConfig.BASE_WORK_HOURS *
        expectedWorkers;

      const laborCost = result.computed?.costs?.find(
        (c) => c.moduleId === "labor-base",
      );
      expect(laborCost).toBeDefined();
      expect(laborCost?.category).toBe("LABOR");
      expect(laborCost?.amount).toBe(expectedCost);
      expect(laborCost?.metadata?.hourlyRate).toBe(
        laborConfig.BASE_HOURLY_RATE,
      );
      expect(laborCost?.metadata?.estimatedHours).toBe(
        laborConfig.BASE_WORK_HOURS,
      );
      expect(laborCost?.metadata?.workersCount).toBe(expectedWorkers);
      // workersCount reste inchangé (déjà calculé par WorkersCalculationModule)
      expect(result.computed?.workersCount).toBe(expectedWorkers);
    });

    it("should use workersCount from context (calculated by WorkersCalculationModule)", () => {
      const testCases = [
        { volume: 5, expectedWorkers: 1 }, // 5 / 5 = 1
        { volume: 10, expectedWorkers: 2 }, // 10 / 5 = 2
        { volume: 12, expectedWorkers: 3 }, // 12 / 5 = 2.4 → 3
        { volume: 20, expectedWorkers: 4 }, // 20 / 5 = 4
        { volume: 25, expectedWorkers: 5 }, // 25 / 5 = 5
      ];

      testCases.forEach(({ volume, expectedWorkers }) => {
        // Simuler que WorkersCalculationModule a déjà calculé workersCount
        const context: QuoteContext = {
          ...baseContext,
          computed: {
            ...baseContext.computed!,
            adjustedVolume: volume,
            workersCount: expectedWorkers, // Déjà calculé par WorkersCalculationModule
            activatedModules: ["workers-calculation"],
          },
        };

        const result = mod.apply(context);
        const expectedCost =
          laborConfig.BASE_HOURLY_RATE *
          laborConfig.BASE_WORK_HOURS *
          expectedWorkers;

        // workersCount reste inchangé (déjà calculé)
        expect(result.computed?.workersCount).toBe(expectedWorkers);
        const laborCost = result.computed?.costs?.find(
          (c) => c.moduleId === "labor-base",
        );
        expect(laborCost?.amount).toBe(expectedCost);
        expect(laborCost?.metadata?.workersCount).toBe(expectedWorkers);
      });
    });

    it("should always use 7 hours (one work day)", () => {
      const smallVolumeContext: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 5,
        },
      };

      const result = mod.apply(smallVolumeContext);

      const laborCost = result.computed?.costs?.find(
        (c) => c.moduleId === "labor-base",
      );
      expect(laborCost?.metadata?.estimatedHours).toBe(
        laborConfig.BASE_WORK_HOURS,
      ); // 7h
    });

    it("should not adjust hours based on access complexity (simplified logic)", () => {
      const complexContext: QuoteContext = {
        ...baseContext,
        pickupFloor: 3,
        pickupHasElevator: false,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 20,
        },
      };

      const result = mod.apply(complexContext);

      const laborCost = result.computed?.costs?.find(
        (c) => c.moduleId === "labor-base",
      );
      // Heures toujours fixes à 7h, pas d'ajustement selon l'accès
      expect(laborCost?.metadata?.estimatedHours).toBe(
        laborConfig.BASE_WORK_HOURS,
      );
    });

    it("should add module to activatedModules", () => {
      const result = mod.apply(baseContext);

      expect(result.computed?.activatedModules).toContain("labor-base");
    });

    it("should not apply if volume is not available", () => {
      const noVolumeContext: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: undefined,
        },
      };

      const result = mod.apply(noVolumeContext);

      // Le module ne devrait pas ajouter de coût si le volume n'est pas disponible
      const laborCost = result.computed?.costs?.find(
        (c) => c.moduleId === "labor-base",
      );
      expect(laborCost).toBeUndefined();
    });

    it("should not apply if workersCount is not available (WorkersCalculationModule not executed)", () => {
      const noWorkersContext: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 20,
          workersCount: undefined, // WorkersCalculationModule n'a pas été exécuté
        },
      };

      const result = mod.apply(noWorkersContext);

      // Le module ne devrait pas ajouter de coût si workersCount n'est pas disponible
      const laborCost = result.computed?.costs?.find(
        (c) => c.moduleId === "labor-base",
      );
      expect(laborCost).toBeUndefined();
    });

    it("should preserve existing costs", () => {
      const contextWithCosts: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          costs: [
            {
              moduleId: "other-module",
              label: "Other cost",
              amount: 100,
              category: "TRANSPORT",
            },
          ],
        },
      };

      const result = mod.apply(contextWithCosts);

      expect(result.computed?.costs?.length).toBe(2);
      expect(
        result.computed?.costs?.find((c) => c.moduleId === "other-module"),
      ).toBeDefined();
      expect(
        result.computed?.costs?.find((c) => c.moduleId === "labor-base"),
      ).toBeDefined();
    });
  });
});
