import { StorageCostModule } from "../StorageCostModule";
import { QuoteContext } from "../../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";
import { MODULES_CONFIG } from "../../../config/modules.config";

describe("StorageCostModule", () => {
  const mod = new StorageCostModule();
  const config = MODULES_CONFIG.crossSelling;

  it("devrait avoir les bonnes propriétés", () => {
    expect(mod.id).toBe("storage-cost");
    expect(mod.description).toBe(
      "Calcule le coût du stockage temporaire si accepté",
    );
    expect(mod.priority).toBe(87);
    expect(mod.dependencies).toEqual(["storage-requirement"]);
  });

  it("devrait être applicable si stockage recommandé ET accepté", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      temporaryStorage: true, // Accepté
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: "STORAGE_RECOMMENDED",
            severity: "MEDIUM",
            reason: "Besoin de stockage temporaire",
            moduleId: "storage-requirement",
          },
        ],
      },
    };

    expect(mod.isApplicable(ctx)).toBe(true);
  });

  it("ne devrait pas être applicable si non accepté", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      temporaryStorage: false,
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: "STORAGE_RECOMMENDED",
            severity: "MEDIUM",
            reason: "Besoin de stockage temporaire",
            moduleId: "storage-requirement",
          },
        ],
      },
    };

    expect(mod.isApplicable(ctx)).toBe(false);
  });

  it("ne devrait pas être applicable si pas de recommandation", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      temporaryStorage: true,
      computed: createEmptyComputedContext(),
    };

    expect(mod.isApplicable(ctx)).toBe(false);
  });

  it("devrait ajouter le coût de stockage", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      temporaryStorage: true,
      storageDurationDays: 45,
      estimatedVolume: 30,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30,
        requirements: [
          {
            type: "STORAGE_RECOMMENDED",
            severity: "MEDIUM",
            reason: "Besoin de stockage temporaire",
            moduleId: "storage-requirement",
          },
        ],
      },
    };

    const result = mod.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const cost = result.computed?.costs.find(
      (c) => c.moduleId === "storage-cost",
    );
    expect(cost).toBeDefined();
    // 30 m³ * 30 €/m³/mois * 2 mois (45 jours arrondi à 2 mois avec 30 jours/mois)
    const expectedMonths = Math.ceil(45 / config.DAYS_PER_MONTH); // 2 mois
    const expectedCost =
      30 * config.STORAGE_COST_PER_M3_PER_MONTH * expectedMonths; // 1800€
    expect(cost?.amount).toBe(expectedCost);
    expect(cost?.category).toBe("SERVICE");
    expect(cost?.label).toContain("Stockage temporaire");
    expect(cost?.metadata).toMatchObject({
      volume: 30,
      durationDays: 45,
      durationMonths: expectedMonths,
      costPerM3PerMonth: config.STORAGE_COST_PER_M3_PER_MONTH,
      daysPerMonth: config.DAYS_PER_MONTH,
    });

    expect(result.computed?.activatedModules).toContain("storage-cost");
    expect(result.computed?.metadata?.storageAccepted).toBe(true);
    expect(result.computed?.metadata?.storageCost).toBe(expectedCost);
  });

  it("devrait calculer correctement pour 1 mois", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      temporaryStorage: true,
      storageDurationDays: 30,
      estimatedVolume: 20,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 20,
        requirements: [
          {
            type: "STORAGE_RECOMMENDED",
            severity: "MEDIUM",
            reason: "Besoin de stockage temporaire",
            moduleId: "storage-requirement",
          },
        ],
      },
    };

    const result = mod.apply(ctx);
    const cost = result.computed?.costs.find(
      (c) => c.moduleId === "storage-cost",
    );
    // 20 m³ * 30 €/m³/mois * 1 mois
    const expectedCost = 20 * config.STORAGE_COST_PER_M3_PER_MONTH * 1; // 600€
    expect(cost?.amount).toBe(expectedCost);
    expect(cost?.metadata).toMatchObject({
      volume: 20,
      durationDays: 30,
      durationMonths: 1,
      costPerM3PerMonth: config.STORAGE_COST_PER_M3_PER_MONTH,
      daysPerMonth: config.DAYS_PER_MONTH,
    });
  });
});
