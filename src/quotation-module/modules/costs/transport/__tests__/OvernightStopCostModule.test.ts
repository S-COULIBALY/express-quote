import { OvernightStopCostModule } from "../OvernightStopCostModule";
import { QuoteContext } from "../../../types/quote-types";
import { createEmptyComputedContext } from "../../../../core/ComputedContext";
import { MODULES_CONFIG } from "../../../../config/modules.config";

describe("OvernightStopCostModule", () => {
  let mod: OvernightStopCostModule;
  let baseContext: QuoteContext;
  const threshold = MODULES_CONFIG.distance.OVERNIGHT_STOP_THRESHOLD_KM; // 1000 km
  const config = MODULES_CONFIG.logistics.OVERNIGHT_STOP;

  beforeEach(() => {
    mod = new OvernightStopCostModule();
    baseContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue de Lyon",
      computed: createEmptyComputedContext(),
      forceOvernightStop: false,
    };
  });

  describe("isApplicable", () => {
    it("should not be applicable if distance is below threshold", () => {
      baseContext.computed!.distanceKm = 500;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = true;
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should not be applicable if distance equals threshold", () => {
      baseContext.computed!.distanceKm = threshold;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = true;
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should not be applicable if forceOvernightStop is false", () => {
      baseContext.computed!.distanceKm = 1500;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = false;
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should not be applicable if forceOvernightStop is undefined", () => {
      baseContext.computed!.distanceKm = 1500;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = undefined as any;
      expect(mod.isApplicable(baseContext)).toBe(false);
    });

    it("should be applicable if distance > threshold AND forceOvernightStop is true", () => {
      baseContext.computed!.distanceKm = 1500;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = true;
      expect(mod.isApplicable(baseContext)).toBe(true);
    });

    it("should be applicable if distance exactly above threshold AND forceOvernightStop is true", () => {
      baseContext.computed!.distanceKm = threshold + 1;
      baseContext.computed!.workersCount = 2;
      baseContext.forceOvernightStop = true;
      expect(mod.isApplicable(baseContext)).toBe(true);
    });
  });

  describe("apply", () => {
    describe("conditions d'application", () => {
      it("should not apply if distance is below threshold", () => {
        baseContext.computed!.distanceKm = 500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        expect(cost).toBeUndefined();
      });

      it("should not apply if forceOvernightStop is false", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = false;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        expect(cost).toBeUndefined();
      });

      it("should apply if distance > threshold AND forceOvernightStop is true", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        expect(cost).toBeDefined();
        expect(cost?.category).toBe("LOGISTICS");
        expect(result.computed?.activatedModules).toContain(
          "overnight-stop-cost",
        );
      });
    });

    describe("calcul des coûts", () => {
      it("should calculate correct cost for 2 workers", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        const expectedHotelCost = 2 * config.HOTEL_COST_PER_WORKER;
        const expectedMealCost = 2 * config.MEAL_ALLOWANCE_PER_WORKER;
        const expectedTotal =
          expectedHotelCost + config.SECURE_PARKING_COST + expectedMealCost;

        expect(cost?.amount).toBeCloseTo(expectedTotal, 2);
        expect(cost?.amount).toBe(350.0); // (2 × 120) + 50 + (2 × 30) = 240 + 50 + 60 = 350
      });

      it("should calculate correct cost for 3 workers", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 3;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        const expectedHotelCost = 3 * config.HOTEL_COST_PER_WORKER;
        const expectedMealCost = 3 * config.MEAL_ALLOWANCE_PER_WORKER;
        const expectedTotal =
          expectedHotelCost + config.SECURE_PARKING_COST + expectedMealCost;

        expect(cost?.amount).toBeCloseTo(expectedTotal, 2);
        expect(cost?.amount).toBe(500.0); // (3 × 120) + 50 + (3 × 30) = 360 + 50 + 90 = 500
      });

      it("should use default 2 workers if workersCount is not set", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = undefined;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        const expectedHotelCost = 2 * config.HOTEL_COST_PER_WORKER;
        const expectedMealCost = 2 * config.MEAL_ALLOWANCE_PER_WORKER;
        const expectedTotal =
          expectedHotelCost + config.SECURE_PARKING_COST + expectedMealCost;

        expect(cost?.amount).toBeCloseTo(expectedTotal, 2);
        expect(cost?.amount).toBe(350.0);
        expect(cost?.metadata.workersCount).toBe(2);
      });

      it("should calculate correct cost for 4 workers", () => {
        baseContext.computed!.distanceKm = 2000;
        baseContext.computed!.workersCount = 4;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        const expectedHotelCost = 4 * config.HOTEL_COST_PER_WORKER;
        const expectedMealCost = 4 * config.MEAL_ALLOWANCE_PER_WORKER;
        const expectedTotal =
          expectedHotelCost + config.SECURE_PARKING_COST + expectedMealCost;

        expect(cost?.amount).toBeCloseTo(expectedTotal, 2);
        expect(cost?.amount).toBe(650.0); // (4 × 120) + 50 + (4 × 30) = 480 + 50 + 120 = 650
      });
    });

    describe("métadonnées", () => {
      it("should store correct metadata", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 3;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        expect(cost?.metadata).toMatchObject({
          distanceKm: 1500,
          threshold: threshold,
          workersCount: 3,
          hotelCost: 360.0,
          parkingCost: 50.0,
          mealCost: 90.0,
          hotelCostPerWorker: config.HOTEL_COST_PER_WORKER,
          mealAllowancePerWorker: config.MEAL_ALLOWANCE_PER_WORKER,
        });
        expect(cost?.metadata.breakdown).toBeDefined();
        expect(cost?.metadata.breakdown.hotel).toContain("3 × 120€");
        expect(cost?.metadata.breakdown.parking).toBe("50€");
        expect(cost?.metadata.breakdown.meals).toContain("3 × 30€");
      });

      it("should add requirement for overnight stop", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const requirement = result.computed?.requirements.find(
          (r) =>
            r.type === "OVERNIGHT_STOP_REQUIRED" &&
            r.moduleId === "overnight-stop-cost",
        );
        expect(requirement).toBeDefined();
        expect(requirement?.severity).toBe("MEDIUM");
        expect(requirement?.reason).toContain("1500 km");
        expect(requirement?.reason).toContain("temps de repos réglementaires");
      });

      it("should add operational flag", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        expect(result.computed?.operationalFlags).toContain(
          "OVERNIGHT_STOP_REQUIRED",
        );
      });

      it("should update computed metadata", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 2;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        expect(result.computed?.metadata.overnightStopRequired).toBe(true);
        expect(result.computed?.metadata.overnightStopCost).toBe(350.0);
      });
    });

    describe("label du coût", () => {
      it("should include workers count in label", () => {
        baseContext.computed!.distanceKm = 1500;
        baseContext.computed!.workersCount = 3;
        baseContext.forceOvernightStop = true;
        const result = mod.apply(baseContext);

        const cost = result.computed?.costs.find(
          (c) => c.moduleId === "overnight-stop-cost",
        );
        expect(cost?.label).toBe(
          "Arrêt nuit équipe (3 pers. + parking sécurisé)",
        );
      });
    });
  });
});
