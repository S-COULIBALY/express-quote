import {
  calculateBasePrice,
  calculateAdjustments,
  calculateMultipliers,
  calculateDiscounts,
  calculateTotalPrice,
} from "../calculations";

import type {
  PriceCalculation,
  PriceAdjustment,
  PriceMultiplier,
  Discount,
  ServiceData,
} from "../types";

describe("Price Calculations", () => {
  // Tests de calcul du prix de base
  describe("Base Price Calculation", () => {
    it("calculates fixed base price", () => {
      const calculation: PriceCalculation = {
        basePrice: 299.99,
      };

      const result = calculateBasePrice({}, calculation);
      expect(result).toBe(299.99);
    });

    it("calculates dynamic base price", () => {
      const calculation: PriceCalculation = {
        basePrice: (data: ServiceData) => data.surface * 2,
      };

      const data = { surface: 50 };
      const result = calculateBasePrice(data, calculation);
      expect(result).toBe(100);
    });

    it("handles missing data for dynamic price", () => {
      const calculation: PriceCalculation = {
        basePrice: (data: ServiceData) => data.surface * 2,
      };

      const result = calculateBasePrice({}, calculation);
      expect(result).toBe(0);
    });
  });

  // Tests des ajustements de prix
  describe("Price Adjustments", () => {
    const mockAdjustments: PriceAdjustment[] = [
      {
        type: "distance",
        amount: (data: ServiceData) => data.distance * 2,
        condition: (data: ServiceData) => data.distance > 50,
      },
      {
        type: "floor",
        amount: (data: ServiceData) => data.floor * 20,
        condition: (data: ServiceData) => !data.hasElevator,
      },
    ];

    it("calculates distance adjustment", () => {
      const data = {
        distance: 100,
        hasElevator: true,
        floor: 0,
      };

      const result = calculateAdjustments(data, mockAdjustments);
      expect(result).toBe(200); // 100km * 2
    });

    it("calculates floor adjustment", () => {
      const data = {
        distance: 0,
        hasElevator: false,
        floor: 3,
      };

      const result = calculateAdjustments(data, mockAdjustments);
      expect(result).toBe(60); // 3 floors * 20
    });

    it("calculates multiple adjustments", () => {
      const data = {
        distance: 100,
        hasElevator: false,
        floor: 3,
      };

      const result = calculateAdjustments(data, mockAdjustments);
      expect(result).toBe(260); // (100km * 2) + (3 floors * 20)
    });

    it("handles no applicable adjustments", () => {
      const data = {
        distance: 20,
        hasElevator: true,
        floor: 3,
      };

      const result = calculateAdjustments(data, mockAdjustments);
      expect(result).toBe(0);
    });
  });

  // Tests des multiplicateurs de prix
  describe("Price Multipliers", () => {
    const mockMultipliers: PriceMultiplier[] = [
      {
        factor: 1.5,
        condition: (data: ServiceData) => data.isUrgent,
      },
      {
        factor: 1.2,
        condition: (data: ServiceData) => data.isWeekend,
      },
    ];

    it("applies single multiplier", () => {
      const data = {
        isUrgent: true,
        isWeekend: false,
      };

      const basePrice = 100;
      const result = calculateMultipliers(basePrice, data, mockMultipliers);
      expect(result).toBe(150); // 100 * 1.5
    });

    it("applies multiple multipliers", () => {
      const data = {
        isUrgent: true,
        isWeekend: true,
      };

      const basePrice = 100;
      const result = calculateMultipliers(basePrice, data, mockMultipliers);
      expect(result).toBe(180); // 100 * 1.5 * 1.2
    });

    it("handles no applicable multipliers", () => {
      const data = {
        isUrgent: false,
        isWeekend: false,
      };

      const basePrice = 100;
      const result = calculateMultipliers(basePrice, data, mockMultipliers);
      expect(result).toBe(100);
    });
  });

  // Tests des réductions
  describe("Discounts", () => {
    const mockDiscounts: Discount[] = [
      {
        type: "percentage",
        value: 10,
        condition: (data: ServiceData) => data.isFirstTime,
      },
      {
        type: "fixed",
        value: 50,
        condition: (data: ServiceData) => data.hasPromoCode,
      },
    ];

    it("applies percentage discount", () => {
      const data = {
        isFirstTime: true,
        hasPromoCode: false,
      };

      const basePrice = 200;
      const result = calculateDiscounts(basePrice, data, mockDiscounts);
      expect(result).toBe(20); // 10% of 200
    });

    it("applies fixed discount", () => {
      const data = {
        isFirstTime: false,
        hasPromoCode: true,
      };

      const basePrice = 200;
      const result = calculateDiscounts(basePrice, data, mockDiscounts);
      expect(result).toBe(50);
    });

    it("applies multiple discounts", () => {
      const data = {
        isFirstTime: true,
        hasPromoCode: true,
      };

      const basePrice = 200;
      const result = calculateDiscounts(basePrice, data, mockDiscounts);
      expect(result).toBe(70); // (10% of 200) + 50
    });

    it("handles no applicable discounts", () => {
      const data = {
        isFirstTime: false,
        hasPromoCode: false,
      };

      const basePrice = 200;
      const result = calculateDiscounts(basePrice, data, mockDiscounts);
      expect(result).toBe(0);
    });
  });

  // Tests de calcul du prix total
  describe("Total Price Calculation", () => {
    const mockCalculation: PriceCalculation = {
      basePrice: 299.99,
      adjustments: [
        {
          type: "distance",
          amount: (data: ServiceData) => data.distance * 2,
          condition: (data: ServiceData) => data.distance > 50,
        },
        {
          type: "floor",
          amount: (data: ServiceData) => data.floor * 20,
          condition: (data: ServiceData) => !data.hasElevator,
        },
      ],
      multipliers: [
        {
          factor: 1.5,
          condition: (data: ServiceData) => data.isUrgent,
        },
      ],
      discounts: [
        {
          type: "percentage",
          value: 10,
          condition: (data: ServiceData) => data.isFirstTime,
        },
      ],
    };

    it("calculates complete price with all components", () => {
      const data = {
        distance: 100,
        hasElevator: false,
        floor: 3,
        isUrgent: true,
        isFirstTime: true,
      };

      const result = calculateTotalPrice(data, mockCalculation);

      // Base: 299.99
      // Adjustments: (100km * 2) + (3 floors * 20) = 260
      // Subtotal: 559.99
      // Multiplier: * 1.5 = 839.985
      // Discount: 10% = 83.9985
      // Final: 755.9865

      expect(result).toBeCloseTo(755.99, 2);
    });

    it("calculates price with only base price", () => {
      const calculation: PriceCalculation = {
        basePrice: 299.99,
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(299.99);
    });

    it("calculates price with adjustments only", () => {
      const data = {
        distance: 100,
        hasElevator: false,
        floor: 3,
      };

      const calculation: PriceCalculation = {
        basePrice: 299.99,
        adjustments: mockCalculation.adjustments,
      };

      const result = calculateTotalPrice(data, calculation);
      expect(result).toBe(559.99); // 299.99 + 260
    });

    it("calculates price with multipliers only", () => {
      const data = {
        isUrgent: true,
      };

      const calculation: PriceCalculation = {
        basePrice: 299.99,
        multipliers: mockCalculation.multipliers,
      };

      const result = calculateTotalPrice(data, calculation);
      expect(result).toBe(449.985); // 299.99 * 1.5
    });

    it("calculates price with discounts only", () => {
      const data = {
        isFirstTime: true,
      };

      const calculation: PriceCalculation = {
        basePrice: 299.99,
        discounts: mockCalculation.discounts,
      };

      const result = calculateTotalPrice(data, calculation);
      expect(result).toBe(269.991); // 299.99 - (10% of 299.99)
    });
  });

  // Tests de performance
  describe("Performance", () => {
    it("calculates complex price quickly", () => {
      const complexCalculation: PriceCalculation = {
        basePrice: (data: ServiceData) => data.surface * 2,
        adjustments: Array.from({ length: 50 }, (_, i) => ({
          type: `adjustment${i}`,
          amount: (data: ServiceData) => i * 10,
          condition: (data: ServiceData) => true,
        })),
        multipliers: Array.from({ length: 20 }, (_, i) => ({
          factor: 1.1,
          condition: (data: ServiceData) => true,
        })),
        discounts: Array.from({ length: 10 }, (_, i) => ({
          type: "percentage",
          value: 5,
          condition: (data: ServiceData) => true,
        })),
      };

      const data = {
        surface: 100,
        // ... autres propriétés
      };

      const start = performance.now();
      calculateTotalPrice(data, complexCalculation);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Calcul en moins de 100ms
    });
  });

  // Tests d'intégration avec les presets
  describe("Preset Integration", () => {
    const mockMovingPreset = {
      calculations: {
        basePrice: 299.99,
        adjustments: [
          {
            type: "distance",
            amount: (data: ServiceData) => data.distance * 2,
            condition: (data: ServiceData) => data.distance > 50,
          },
        ],
        multipliers: [
          {
            factor: 1.5,
            condition: (data: ServiceData) => data.isUrgent,
          },
        ],
        discounts: [
          {
            type: "percentage",
            value: 10,
            condition: (data: ServiceData) => data.isFirstTime,
          },
        ],
      },
    };

    const mockCleaningPreset = {
      calculations: {
        basePrice: (data: ServiceData) => data.surface * 2,
        adjustments: [
          {
            type: "options",
            amount: (data: ServiceData) =>
              (data.options?.includes("windows") ? 30 : 0) +
              (data.options?.includes("carpet") ? data.surface * 0.5 : 0),
          },
        ],
      },
    };

    it("calculates moving service price correctly", () => {
      const data = {
        distance: 100,
        isUrgent: true,
        isFirstTime: true,
      };

      const result = calculateTotalPrice(data, mockMovingPreset.calculations);
      expect(result).toBeCloseTo(755.99, 2);
    });

    it("calculates cleaning service price correctly", () => {
      const data = {
        surface: 100,
        options: ["windows", "carpet"],
      };

      const result = calculateTotalPrice(data, mockCleaningPreset.calculations);
      // Base: 100 * 2 = 200
      // Windows: 30
      // Carpet: 100 * 0.5 = 50
      // Total: 280
      expect(result).toBe(280);
    });
  });

  // Tests de cas limites
  describe("Edge Cases", () => {
    it("handles zero base price", () => {
      const calculation: PriceCalculation = {
        basePrice: 0,
        adjustments: [
          {
            type: "test",
            amount: 100,
          },
        ],
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(100);
    });

    it("handles negative adjustments", () => {
      const calculation: PriceCalculation = {
        basePrice: 100,
        adjustments: [
          {
            type: "discount",
            amount: -50,
          },
        ],
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(50);
    });

    it("handles multiplier less than 1", () => {
      const calculation: PriceCalculation = {
        basePrice: 100,
        multipliers: [
          {
            factor: 0.5,
            condition: () => true,
          },
        ],
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(50);
    });

    it("handles 100% discount", () => {
      const calculation: PriceCalculation = {
        basePrice: 100,
        discounts: [
          {
            type: "percentage",
            value: 100,
            condition: () => true,
          },
        ],
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(0);
    });

    it("prevents negative final price", () => {
      const calculation: PriceCalculation = {
        basePrice: 100,
        adjustments: [
          {
            type: "discount",
            amount: -150,
          },
        ],
      };

      const result = calculateTotalPrice({}, calculation);
      expect(result).toBe(0);
    });
  });
});
