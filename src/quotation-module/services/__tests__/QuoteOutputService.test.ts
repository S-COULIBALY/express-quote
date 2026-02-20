import { QuoteOutputService } from "../QuoteOutputService";
import { QuoteContext } from "../../core/QuoteContext";
import { createEmptyComputedContext } from "../../core/ComputedContext";

describe("QuoteOutputService", () => {
  describe("formatQuote", () => {
    it("devrait formater un devis en format standardisé", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        movingDate: "2025-03-15T10:00:00Z",
        departureAddress: "123 Rue de Paris",
        arrivalAddress: "456 Avenue Montaigne",
        declaredValue: 15000,
        computed: {
          ...createEmptyComputedContext(),
          baseVolume: 30,
          adjustedVolume: 31.5,
          distanceKm: 15,
          vehicleCount: 2,
          vehicleTypes: ["CAMIONNETTE_COMPACT"],
          workersCount: 3,
          baseDurationHours: 6,
          riskScore: 25,
          manualReviewRequired: false,
          basePrice: 100,
          finalPrice: 130,
          costs: [
            {
              moduleId: "test-1",
              category: "TRANSPORT",
              label: "Transport",
              amount: 100,
            },
          ],
          riskContributions: [
            {
              moduleId: "test-risk",
              amount: 25,
              reason: "Risque test",
            },
          ],
          requirements: [
            {
              type: "TEST_REQUIREMENT",
              severity: "MEDIUM",
              reason: "Test requirement",
              moduleId: "test-module",
            },
          ],
          legalImpacts: [
            {
              moduleId: "test-legal",
              severity: "WARNING",
              type: "REGULATORY",
              message: "Test legal impact",
            },
          ],
          insuranceNotes: ["Note assurance test"],
          crossSellProposals: [
            {
              id: "TEST_PROPOSAL",
              label: "Test proposal",
              reason: "Test reason",
              benefit: "Test benefit",
              priceImpact: 50,
              optional: true,
              moduleId: "test-module",
            },
          ],
          activatedModules: ["test-1", "test-module"],
          operationalFlags: ["TEST_FLAG"],
        },
      };

      const quote = QuoteOutputService.formatQuote(ctx, "test-quote-123");

      expect(quote.quoteId).toBe("test-quote-123");
      expect(quote.movingDate).toBe("2025-03-15T10:00:00Z");
      expect(quote.departureAddress).toBe("123 Rue de Paris");
      expect(quote.pricing.finalPrice).toBeGreaterThan(0);
      expect(quote.logistics.baseVolume).toBe(30);
      expect(quote.risk.riskScore).toBe(25);
      expect(quote.requirements).toHaveLength(1);
      expect(quote.legalImpacts).toHaveLength(1);
      expect(quote.traceability.activatedModules).toContain("test-1");
    });
  });

  describe("generateTerrainChecklist", () => {
    it("devrait générer une checklist terrain", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue de Paris",
        arrivalAddress: "456 Avenue Montaigne",
        computed: {
          ...createEmptyComputedContext(),
          requirements: [
            {
              type: "LIFT_RECOMMENDED",
              severity: "HIGH",
              reason: "Monte-meubles recommandé",
              moduleId: "monte-meubles-recommendation",
            },
            {
              type: "NAVETTE_REQUIRED",
              severity: "MEDIUM",
              reason: "Navette nécessaire",
              moduleId: "navette-required",
            },
          ],
        },
      };

      const checklist = QuoteOutputService.generateTerrainChecklist(
        ctx,
        "test-quote-123",
      );

      expect(checklist.title).toBe("Checklist Terrain - Déménagement");
      expect(checklist.items).toHaveLength(2);
      expect(checklist.items[0].type).toBe("LIFT_RECOMMENDED");
      expect(checklist.items[0].required).toBe(true); // HIGH severity
      expect(checklist.items[1].required).toBe(false); // MEDIUM severity
    });
  });

  describe("generateContractData", () => {
    it("devrait générer les données contrat", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue de Paris",
        arrivalAddress: "456 Avenue Montaigne",
        declaredValue: 20000,
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: "insurance-premium",
              category: "INSURANCE",
              label: "Prime d'assurance",
              amount: 100,
            },
          ],
          legalImpacts: [
            {
              moduleId: "test-legal",
              severity: "WARNING",
              type: "LIABILITY_LIMITATION",
              message: "Responsabilité limitée",
            },
          ],
          insuranceNotes: ["Note assurance"],
          operationalFlags: ["TEST_FLAG"],
        },
      };

      const contractData = QuoteOutputService.generateContractData(
        ctx,
        "test-quote-123",
      );

      expect(contractData.quoteId).toBe("test-quote-123");
      expect(contractData.insurance.declaredValue).toBe(20000);
      expect(contractData.insurance.premium).toBe(100);
      expect(contractData.legalImpacts).toHaveLength(1);
      expect(contractData.operationalConstraints).toContain("TEST_FLAG");
    });
  });

  describe("generateLegalAudit", () => {
    it("devrait générer un audit juridique", () => {
      const ctx: QuoteContext = {
        serviceType: "MOVING",
        region: "IDF",
        departureAddress: "123 Rue de Paris",
        arrivalAddress: "456 Avenue Montaigne",
        computed: {
          ...createEmptyComputedContext(),
          riskScore: 35,
          manualReviewRequired: false,
          activatedModules: ["test-module"],
          legalImpacts: [
            {
              moduleId: "test-legal",
              severity: "WARNING",
              type: "REGULATORY",
              message: "Impact juridique test",
            },
          ],
          operationalFlags: ["LEGAL_FLAG", "TEST_FLAG"],
        },
      };

      const audit = QuoteOutputService.generateLegalAudit(
        ctx,
        "test-quote-123",
      );

      expect(audit.quoteId).toBe("test-quote-123");
      expect(audit.riskScore).toBe(35);
      expect(audit.manualReviewRequired).toBe(false);
      expect(audit.legalFlags).toContain("LEGAL_FLAG");
      expect(audit.decisions.length).toBeGreaterThan(0);
    });
  });

  describe("generateComparisonSummary", () => {
    it("devrait générer un résumé comparatif", () => {
      const variants = [
        {
          scenarioId: "ECO",
          label: "Économique",
          finalPrice: 1000,
          marginRate: 0.2,
        },
        {
          scenarioId: "STANDARD",
          label: "Standard",
          finalPrice: 1200,
          marginRate: 0.3,
        },
        {
          scenarioId: "PREMIUM",
          label: "Premium",
          finalPrice: 1500,
          marginRate: 0.4,
        },
      ];

      const summary = QuoteOutputService.generateComparisonSummary(variants);

      expect(summary.cheapest.scenarioId).toBe("ECO");
      expect(summary.mostExpensive.scenarioId).toBe("PREMIUM");
      expect(summary.recommended?.scenarioId).toBe("STANDARD");
      expect(summary.priceRange).toBe(500);
      expect(summary.averagePrice).toBe(1233.33);
    });
  });
});
