import { LoadingTimeEstimationModule } from "../LoadingTimeEstimationModule";
import { QuoteContext } from "../../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";

describe("LoadingTimeEstimationModule", () => {
  const mod = new LoadingTimeEstimationModule();

  it("devrait avoir les bonnes propriétés", () => {
    expect(mod.id).toBe("loading-time-estimation");
    expect(mod.description).toBe(
      "Estime le temps de chargement et déchargement",
    );
    expect(mod.priority).toBe(68);
    expect(mod.dependencies).toEqual([
      "volume-estimation",
      "workers-calculation",
    ]);
  });

  it("devrait estimer le temps de chargement", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30, // 30 m³
        workersCount: 3, // 3 déménageurs
      },
    };

    const result = mod.apply(ctx);

    expect(result.computed?.metadata?.loadingTimeMinutes).toBeDefined();
    expect(result.computed?.metadata?.unloadingTimeMinutes).toBeDefined();
    expect(result.computed?.metadata?.totalHandlingTimeMinutes).toBeDefined();
    expect(result.computed?.activatedModules).toContain(
      "loading-time-estimation",
    );
  });

  it("devrait ajouter des pénalités pour étages sans ascenseur", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      pickupFloor: 3,
      pickupHasElevator: false,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30,
        workersCount: 3,
      },
    };

    const result = mod.apply(ctx);
    const loadingTime = result.computed?.metadata?.loadingTimeMinutes || 0;
    const baseTime = result.computed?.metadata?.baseLoadingTimeMinutes || 0;

    // Le temps de chargement devrait être supérieur à la base à cause des étages
    expect(loadingTime).toBeGreaterThan(baseTime);
    expect(result.computed?.metadata?.pickupPenaltyMinutes).toBeGreaterThan(0);
  });

  it("devrait ajouter des pénalités pour distance de portage", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      pickupCarryDistance: 20, // 20 mètres
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30,
        workersCount: 3,
      },
    };

    const result = mod.apply(ctx);
    expect(result.computed?.metadata?.pickupPenaltyMinutes).toBeGreaterThan(0);
  });

  it("ne devrait rien faire si volume ou déménageurs manquants", () => {
    const ctx: QuoteContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue Montaigne",
      computed: createEmptyComputedContext(),
    };

    const result = mod.apply(ctx);
    expect(result.computed?.metadata?.loadingTimeMinutes).toBeUndefined();
  });
});
