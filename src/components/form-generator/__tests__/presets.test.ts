import {
  CatalogueMovingItemPreset,
  catalogueMovingItemSummaryConfig,
  catalogueMovingItemDefaultValues,
} from "../presets/catalogueMovingItem-service/catalogueMovingItemPresets";

import {
  CatalogueCleaningItemPreset,
  catalogueCleaningItemSummaryConfig,
  catalogueCleaningItemDefaultValues,
} from "../presets/catalogueCleaningItem-service/catalogueCleaningItemPresets";

import {
  DemenagementSurMesurePreset,
  getDemenagementSurMesureServiceConfig,
} from "../presets/demenagement-sur-mesure-service";

import {
  MenageSurMesurePreset,
  getMenageSurMesureServiceConfig,
} from "../presets/menage-sur-mesure-service";

import {
  getPresetData,
  getPreset,
  getPresetSummary,
  getPresetDefaults,
  getPresetStyles,
  availablePresets,
  getCatalogueServices,
  getSurMesureServices,
  isPresetCatalogue,
} from "../presets";

describe("Presets", () => {
  // Tests des presets catalogue
  describe("Catalogue Presets", () => {
    describe("Moving Item Preset", () => {
      it("has required fields", () => {
        const requiredFields = ["moveDate", "pickupAddress", "deliveryAddress"];

        requiredFields.forEach((field) => {
          const foundField = CatalogueMovingItemPreset.fields.find(
            (f) => f.name === field,
          );
          expect(foundField).toBeDefined();
          expect(foundField.required).toBe(true);
        });
      });

      it("has valid summary config", () => {
        expect(catalogueMovingItemSummaryConfig).toHaveProperty("title");
        expect(catalogueMovingItemSummaryConfig).toHaveProperty("sections");
      });

      it("has valid default values", () => {
        expect(catalogueMovingItemDefaultValues).toHaveProperty("hasElevator");
        expect(catalogueMovingItemDefaultValues.hasElevator).toBe(false);
      });
    });

    describe("Cleaning Item Preset", () => {
      it("has required fields", () => {
        const requiredFields = ["serviceDate", "address", "surface"];

        requiredFields.forEach((field) => {
          const foundField = CatalogueCleaningItemPreset.fields.find(
            (f) => f.name === field,
          );
          expect(foundField).toBeDefined();
          expect(foundField.required).toBe(true);
        });
      });

      it("has valid summary config", () => {
        expect(catalogueCleaningItemSummaryConfig).toHaveProperty("title");
        expect(catalogueCleaningItemSummaryConfig).toHaveProperty("sections");
      });

      it("has valid default values", () => {
        expect(catalogueCleaningItemDefaultValues).toHaveProperty("options");
        expect(Array.isArray(catalogueCleaningItemDefaultValues.options)).toBe(
          true,
        );
      });
    });
  });

  // Tests des presets sur mesure
  describe("Sur Mesure Presets", () => {
    describe("Demenagement Sur Mesure Preset", () => {
      it("has required fields", () => {
        const requiredFields = [
          "moveDate",
          "pickupAddress",
          "deliveryAddress",
          "volume",
        ];

        requiredFields.forEach((field) => {
          const foundField = DemenagementSurMesurePreset.fields.find(
            (f) => f.name === field,
          );
          expect(foundField).toBeDefined();
          expect(foundField.required).toBe(true);
        });
      });

      it("generates valid service config", () => {
        const config = getDemenagementSurMesureServiceConfig();
        expect(config).toHaveProperty("prestations");
        expect(config).toHaveProperty("garanties");
        expect(config).toHaveProperty("pricingRules");
      });
    });

    describe("Menage Sur Mesure Preset", () => {
      it("has required fields", () => {
        const requiredFields = [
          "serviceDate",
          "address",
          "surface",
          "frequency",
        ];

        requiredFields.forEach((field) => {
          const foundField = MenageSurMesurePreset.fields.find(
            (f) => f.name === field,
          );
          expect(foundField).toBeDefined();
          expect(foundField.required).toBe(true);
        });
      });

      it("generates valid service config", () => {
        const config = getMenageSurMesureServiceConfig();
        expect(config).toHaveProperty("prestations");
        expect(config).toHaveProperty("garanties");
        expect(config).toHaveProperty("pricingRules");
      });
    });
  });

  // Tests des helpers
  describe("Preset Helpers", () => {
    describe("getPresetData", () => {
      it("returns correct data for catalogue preset", () => {
        const data = getPresetData("catalogueMovingItem");
        expect(data).toHaveProperty("summary");
        expect(data).toHaveProperty("defaults");
        expect(data).toHaveProperty("styles");
      });

      it("returns default data for unknown preset", () => {
        const data = getPresetData("unknown" as any);
        expect(data).toBe(getPresetData("default"));
      });
    });

    describe("getPreset", () => {
      it("returns correct preset for catalogue item", () => {
        const preset = getPreset("catalogueMovingItem");
        expect(preset).toBe(CatalogueMovingItemPreset);
      });

      it("returns correct preset for sur mesure service", () => {
        const preset = getPreset("demenagement-sur-mesure");
        expect(preset).toBe(DemenagementSurMesurePreset);
      });
    });

    describe("getPresetSummary", () => {
      it("returns correct summary config", () => {
        const summary = getPresetSummary("catalogueMovingItem");
        expect(summary).toBe(catalogueMovingItemSummaryConfig);
      });
    });

    describe("getPresetDefaults", () => {
      it("returns correct default values", () => {
        const defaults = getPresetDefaults("catalogueMovingItem");
        expect(defaults).toBe(catalogueMovingItemDefaultValues);
      });
    });

    describe("getPresetStyles", () => {
      it("returns correct styles", () => {
        const styles = getPresetStyles("catalogueMovingItem");
        expect(typeof styles).toBe("string");
        expect(styles.length).toBeGreaterThan(0);
      });
    });
  });

  // Tests des listes et filtres
  describe("Preset Lists and Filters", () => {
    describe("availablePresets", () => {
      it("contains all required presets", () => {
        const requiredPresets = [
          "catalogueMovingItem",
          "catalogueCleaningItem",
          "demenagement-sur-mesure",
          "menage-sur-mesure",
        ];

        requiredPresets.forEach((presetId) => {
          expect(availablePresets.find((p) => p.id === presetId)).toBeDefined();
        });
      });

      it("has valid categories", () => {
        const validCategories = ["catalogue", "sur-mesure", "default"];
        availablePresets.forEach((preset) => {
          expect(validCategories).toContain(preset.category);
        });
      });
    });

    describe("getCatalogueServices", () => {
      it("returns only catalogue services", () => {
        const catalogueServices = getCatalogueServices();
        catalogueServices.forEach((service) => {
          expect(service.category).toBe("catalogue");
        });
      });
    });

    describe("getSurMesureServices", () => {
      it("returns only sur mesure services", () => {
        const surMesureServices = getSurMesureServices();
        surMesureServices.forEach((service) => {
          expect(service.category).toBe("sur-mesure");
        });
      });
    });

    describe("isPresetCatalogue", () => {
      it("correctly identifies catalogue presets", () => {
        expect(isPresetCatalogue("catalogueMovingItem")).toBe(true);
        expect(isPresetCatalogue("demenagement-sur-mesure")).toBe(false);
      });
    });
  });

  // Tests de validation
  describe("Preset Validation", () => {
    const validatePreset = (preset: any) => {
      expect(preset).toHaveProperty("fields");
      expect(Array.isArray(preset.fields)).toBe(true);
      expect(preset.fields.length).toBeGreaterThan(0);

      preset.fields.forEach((field: any) => {
        expect(field).toHaveProperty("name");
        expect(field).toHaveProperty("type");
      });

      if (preset.validation) {
        expect(typeof preset.validation).toBe("object");
      }

      if (preset.calculations) {
        expect(typeof preset.calculations).toBe("object");
      }
    };

    it("validates CatalogueMovingItemPreset", () => {
      validatePreset(CatalogueMovingItemPreset);
    });

    it("validates CatalogueCleaningItemPreset", () => {
      validatePreset(CatalogueCleaningItemPreset);
    });

    it("validates DemenagementSurMesurePreset", () => {
      validatePreset(DemenagementSurMesurePreset);
    });

    it("validates MenageSurMesurePreset", () => {
      validatePreset(MenageSurMesurePreset);
    });
  });

  // Tests de compatibilité
  describe("Preset Compatibility", () => {
    it("handles missing optional properties", () => {
      const presets = [
        CatalogueMovingItemPreset,
        CatalogueCleaningItemPreset,
        DemenagementSurMesurePreset,
        MenageSurMesurePreset,
      ];

      presets.forEach((preset) => {
        expect(() => {
          const { fields, validation, calculations, ...rest } = preset;
          return {
            fields,
            validation: validation || {},
            calculations: calculations || {},
          };
        }).not.toThrow();
      });
    });

    it("supports extended configurations", () => {
      const presets = [
        CatalogueMovingItemPreset,
        CatalogueCleaningItemPreset,
        DemenagementSurMesurePreset,
        MenageSurMesurePreset,
      ];

      presets.forEach((preset) => {
        const extendedPreset = {
          ...preset,
          customField: "test",
          customValidation: () => true,
        };

        expect(() => validatePreset(extendedPreset)).not.toThrow();
      });
    });
  });
});
