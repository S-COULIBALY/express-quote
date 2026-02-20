import { LongDistanceThresholdModule } from "../LongDistanceThresholdModule";
import { QuoteContext } from "../../../types/quote-types";
import { createEmptyComputedContext } from "../../../../core/ComputedContext";

describe("LongDistanceThresholdModule", () => {
  let mod: LongDistanceThresholdModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    mod = new LongDistanceThresholdModule();
    baseContext = {
      serviceType: "MOVING",
      region: "IDF",
      departureAddress: "123 Rue de Paris",
      arrivalAddress: "456 Avenue de Lyon",
      computed: createEmptyComputedContext(),
    };
  });

  describe("apply", () => {
    it("should detect long distance if distance > 50 km", () => {
      baseContext.computed!.distanceKm = 60;
      const result = mod.apply(baseContext);

      expect(result.computed?.isLongDistance).toBe(true);
      expect(result.computed?.operationalFlags).toContain("LONG_DISTANCE");
      expect(result.computed?.activatedModules).toContain(
        "long-distance-threshold",
      );
    });

    it("should not detect long distance if distance <= 50 km", () => {
      baseContext.computed!.distanceKm = 45;
      const result = mod.apply(baseContext);

      expect(result.computed?.isLongDistance).toBe(false);
      expect(result.computed?.operationalFlags).not.toContain("LONG_DISTANCE");
      expect(result.computed?.activatedModules).toContain(
        "long-distance-threshold",
      );
    });

    it("should not apply if distance is not calculated", () => {
      const result = mod.apply(baseContext);

      expect(result.computed?.isLongDistance).toBeUndefined();
      expect(result.computed?.activatedModules).not.toContain(
        "long-distance-threshold",
      );
    });
  });
});
