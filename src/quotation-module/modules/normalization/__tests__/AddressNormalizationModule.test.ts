import { AddressNormalizationModule } from "../AddressNormalizationModule";
import { QuoteContext } from "../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";

describe("AddressNormalizationModule", () => {
  let mod: AddressNormalizationModule;

  beforeEach(() => {
    mod = new AddressNormalizationModule();
  });

  describe("normalizeAddress (private method)", () => {
    it("doit convertir une adresse en majuscules", () => {
      const method = mod["normalizeAddress"];
      expect(method("12 rue des lilas")).toBe("12 RUE DES LILAS");
    });

    it("doit supprimer les caractères spéciaux", () => {
      const method = mod["normalizeAddress"];
      expect(method("12, rue des lilas!")).toBe("12 RUE DES LILAS");
    });

    it("doit supprimer les accents", () => {
      const method = mod["normalizeAddress"];
      expect(method("résidence éléphant")).toBe("RESIDENCE ELEPHANT");
    });

    it("doit gérer une chaîne vide", () => {
      const method = mod["normalizeAddress"];
      expect(method("")).toBe("");
    });
  });

  describe("apply method", () => {
    it("doit normaliser les adresses de départ et destination", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "12, rue des Champs-Élysées",
        arrivalAddress: "45 avenue Montaigne",
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.normalizedDepartureAddress).toBe(
        "12 RUE DES CHAMPS-ELYSEES",
      );
      expect(result.computed?.metadata?.normalizedArrivalAddress).toBe(
        "45 AVENUE MONTAIGNE",
      );
    });

    it("doit ajouter le module aux modules activés", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 test street",
        arrivalAddress: "456 demo avenue",
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);

      expect(result.computed?.activatedModules).toContain(
        "address-normalization",
      );
    });

    it("doit gérer des adresses vides", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "",
        arrivalAddress: "",
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);

      expect(result.computed?.metadata?.normalizedDepartureAddress).toBe("");
      expect(result.computed?.metadata?.normalizedArrivalAddress).toBe("");
    });

    it("doit préserver les autres propriétés du contexte", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 test street",
        arrivalAddress: "456 demo avenue",
        estimatedVolume: 30,
        computed: createEmptyComputedContext(),
      };

      const result = mod.apply(ctx);

      expect(result.estimatedVolume).toBe(30);
      expect(result.serviceType).toBe("MOVING");
    });
  });
});
