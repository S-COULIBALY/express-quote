import { DateValidationModule } from "../DateValidationModule";
import { QuoteContext } from "../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";

describe("DateValidationModule", () => {
  let mod: DateValidationModule;

  beforeEach(() => {
    mod = new DateValidationModule();
  });

  describe("Dates valides", () => {
    it("devrait normaliser une date de départ dans le futur", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        movingDate: tomorrow.toISOString(),
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);
      expect(result.movingDate).toBeDefined();
      expect(result.computed?.activatedModules).toContain("date-validation");
      expect(result.computed?.metadata?.dateValidationApplied).toBe(true);
      expect(result.computed?.metadata?.daysUntilMoving).toBeGreaterThanOrEqual(
        0,
      );
    });

    it("devrait normaliser une date sans heure en midi par défaut", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateOnly = tomorrow.toISOString().split("T")[0]; // '2025-03-15'

      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        movingDate: dateOnly,
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);
      expect(new Date(result.movingDate!).getHours()).toBe(12);
    });
  });

  describe("Cas limites", () => {
    it("devrait lever une erreur si la date de départ est manquante", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        computed: createEmptyComputedContext(),
      };

      expect(() => mod.apply(ctx)).toThrow("Date de déménagement manquante");
    });

    it("devrait lever une erreur si la date de départ est dans le passé", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        movingDate: yesterday.toISOString(),
        computed: createEmptyComputedContext(),
      };

      expect(() => mod.apply(ctx)).toThrow(
        "Date de déménagement dans le passé",
      );
    });

    it("devrait lever une erreur si la date est invalide", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        movingDate: "not-a-date",
        computed: createEmptyComputedContext(),
      };

      expect(() => mod.apply(ctx)).toThrow("Date de déménagement invalide");
    });
  });

  describe("Traçabilité", () => {
    it("devrait ajouter le module aux modules activés", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue Test",
        arrivalAddress: "456 Rue Test",
        movingDate: tomorrow.toISOString(),
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);
      expect(result.computed?.activatedModules).toContain("date-validation");
    });
  });
});
