import { FurnitureLiftCostModule } from "../FurnitureLiftCostModule";
import { QuoteContext } from "../../types/quote-types";
import { createEmptyComputedContext } from "../../../core/ComputedContext";
import { MODULES_CONFIG } from "../../../config/modules.config";

describe("FurnitureLiftCostModule", () => {
  let mod: FurnitureLiftCostModule;
  let baseContext: QuoteContext;
  const config = MODULES_CONFIG.furnitureLift;

  beforeEach(() => {
    mod = new FurnitureLiftCostModule();
    baseContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue de Lyon",
      computed: createEmptyComputedContext(),
    };
  });

  describe("isApplicable", () => {
    it("should not be applicable if no furniture lift checkbox is true", () => {
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should not be applicable if both checkboxes are false", () => {
      baseContext.pickupFurnitureLift = false;
      baseContext.deliveryFurnitureLift = false;
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should be applicable if pickupFurnitureLift is true", () => {
      baseContext.pickupFurnitureLift = true;
      expect(mod.isApplicable(baseContext)).toBe(true);
    });

    it("should be applicable if deliveryFurnitureLift is true", () => {
      baseContext.deliveryFurnitureLift = true;
      expect(mod.isApplicable(baseContext)).toBe(true);
    });

    it("should be applicable if both checkboxes are true", () => {
      baseContext.pickupFurnitureLift = true;
      baseContext.deliveryFurnitureLift = true;
      expect(mod.isApplicable(baseContext)).toBe(true);
    });
  });

  describe("apply", () => {
    describe("calcul des coûts", () => {
      it("should calculate base cost for single lift (pickup only)", () => {
        baseContext.pickupFurnitureLift = true;
        baseContext.pickupFloor = 4;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST);
        expect(cost?.label).toBe("Location monte-meubles (départ)");
      });

      it("should calculate base cost for single lift (delivery only)", () => {
        baseContext.deliveryFurnitureLift = true;
        baseContext.deliveryFloor = 5;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost).toBeDefined();
        expect(cost?.amount).toBe(config.BASE_LIFT_COST);
        expect(cost?.label).toBe("Location monte-meubles (arrivée)");
      });

      it("should calculate cost with double installation surcharge", () => {
        baseContext.pickupFurnitureLift = true;
        baseContext.deliveryFurnitureLift = true;
        baseContext.pickupFloor = 4;
        baseContext.deliveryFloor = 5;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost).toBeDefined();
        const expectedCost =
          config.BASE_LIFT_COST + config.DOUBLE_LIFT_SURCHARGE;
        expect(cost?.amount).toBe(expectedCost);
        expect(cost?.label).toBe("Location monte-meubles (départ + arrivée)");
      });

      it("should not apply if not applicable", () => {
        const result = mod.apply(baseContext);
        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost).toBeUndefined();
      });
    });

    describe("métadonnées", () => {
      it("should store correct metadata for single lift (pickup)", () => {
        baseContext.pickupFurnitureLift = true;
        baseContext.pickupFloor = 4;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost?.metadata).toMatchObject({
          baseCost: config.BASE_LIFT_COST,
          needsLiftPickup: true,
          needsLiftDelivery: false,
          pickupFloor: 4,
          doubleInstallation: false,
          doubleInstallationSurcharge: 0,
        });
      });

      it("should store correct metadata for double lift", () => {
        baseContext.pickupFurnitureLift = true;
        baseContext.deliveryFurnitureLift = true;
        baseContext.pickupFloor = 4;
        baseContext.deliveryFloor = 5;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "furniture-lift-cost",
        );
        expect(cost?.metadata).toMatchObject({
          baseCost: config.BASE_LIFT_COST,
          needsLiftPickup: true,
          needsLiftDelivery: true,
          pickupFloor: 4,
          deliveryFloor: 5,
          doubleInstallation: true,
          doubleInstallationSurcharge: config.DOUBLE_LIFT_SURCHARGE,
        });
        expect(cost?.metadata.details).toContain(
          `+${config.DOUBLE_LIFT_SURCHARGE}€ (double installation)`,
        );
      });

      it("should update computed metadata", () => {
        baseContext.pickupFurnitureLift = true;
        baseContext.pickupFloor = 4;
        const result = mod.apply(baseContext);

        expect(result.computed?.metadata.furnitureLiftAccepted).toBe(true);
        expect(result.computed?.metadata.furnitureLiftCost).toBe(
          config.BASE_LIFT_COST,
        );
      });
    });

    describe("activated modules", () => {
      it("should add module to activatedModules", () => {
        baseContext.pickupFurnitureLift = true;
        const result = mod.apply(baseContext);
        expect(result.computed?.activatedModules).toContain(
          "furniture-lift-cost",
        );
      });
    });
  });
});
