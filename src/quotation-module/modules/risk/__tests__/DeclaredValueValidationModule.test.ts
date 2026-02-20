import { DeclaredValueValidationModule } from "../DeclaredValueValidationModule";
import { QuoteContext } from "../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";

describe("DeclaredValueValidationModule", () => {
  let mod: DeclaredValueValidationModule;

  beforeEach(() => {
    mod = new DeclaredValueValidationModule();
  });

  const createBaseContext = (declaredValue?: number): QuoteContext => ({
    serviceType: "MOVING",
    region: "IDF",
    departureAddress: "123 Rue Test",
    arrivalAddress: "456 Rue Test",
    declaredValue,
    computed: createEmptyComputedContext(),
  });

  describe("isApplicable", () => {
    it("devrait être applicable si declaredValue est défini", () => {
      const ctx = createBaseContext(10000);
      expect(mod.isApplicable(ctx)).toBe(true);
    });

    it("ne devrait pas être applicable si declaredValue est undefined", () => {
      const ctx = createBaseContext(undefined);
      expect(mod.isApplicable(ctx)).toBe(false);
    });
  });

  describe("Valeurs normales", () => {
    it("doit valider une valeur standard de 10000€", () => {
      const ctx = createBaseContext(10000);
      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.declaredValueValid).toBe(true);
      expect(result.computed?.metadata?.declaredValueRiskScore).toBe(2);
    });

    it("doit valider la valeur maximale de 50000€", () => {
      const ctx = createBaseContext(50000);
      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.declaredValueValid).toBe(true);
      expect(result.computed?.metadata?.declaredValueRiskScore).toBe(4);
    });
  });

  describe("Cas limites", () => {
    it("doit gérer une valeur de 0€", () => {
      const ctx = createBaseContext(0);
      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.declaredValueValid).toBe(true);
      expect(result.computed?.metadata?.declaredValueRiskScore).toBe(1);
    });

    it("doit rejeter une valeur supérieure à 50000€", () => {
      const ctx = createBaseContext(60000);
      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.declaredValueValid).toBe(false);
      expect(result.computed?.metadata?.declaredValueRiskScore).toBe(5);
      expect(result.computed?.legalImpacts).toHaveLength(1);
      expect(result.computed?.legalImpacts?.[0]?.type).toBe("INSURANCE_CAP");
    });
  });

  describe("Traçabilité", () => {
    it("doit ajouter le module aux modules activés", () => {
      const ctx = createBaseContext(20000);
      const result = mod.apply(ctx);

      expect(result.computed?.activatedModules).toContain(
        "declared-value-validation",
      );
    });
  });

  describe("Calculs de risque", () => {
    const testCases = [
      { value: 3000, expectedRiskScore: 1 },
      { value: 10000, expectedRiskScore: 2 },
      { value: 20000, expectedRiskScore: 3 },
      { value: 40000, expectedRiskScore: 4 },
      { value: 55000, expectedRiskScore: 5 },
    ];

    testCases.forEach(({ value, expectedRiskScore }) => {
      it(`doit calculer correctement pour ${value}€`, () => {
        const ctx = createBaseContext(value);
        const result = mod.apply(ctx);

        expect(result.computed?.metadata?.declaredValueRiskScore).toBe(
          expectedRiskScore,
        );
      });
    });
  });
});
