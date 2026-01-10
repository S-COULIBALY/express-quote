import { DeclaredValueValidationModule } from '../DeclaredValueValidationModule';
import { QuoteContext } from '../../types/quote-types';

describe('DeclaredValueValidationModule', () => {
  let module: DeclaredValueValidationModule;

  beforeEach(() => {
    module = new DeclaredValueValidationModule();
  });

  const createBaseContext = (declaredValue: number): QuoteContext => ({
    quote: { declaredValue },
    computed: {},
    activatedModules: []
  });

  describe('Valeurs normales', () => {
    it('doit valider une valeur standard de 10000€', () => {
      const ctx = createBaseContext(10000);
      const result = module.apply(ctx);

      expect(result.computed?.risk?.declaredValueValid).toBe(true);
      expect(result.computed?.risk?.riskScore).toBe(2);
      expect(result.computed?.risk?.insurancePremiumMultiplier).toBe(1.2);
    });

    it('doit valider la valeur maximale de 50000€', () => {
      const ctx = createBaseContext(50000);
      const result = module.apply(ctx);

      expect(result.computed?.risk?.declaredValueValid).toBe(true);
      expect(result.computed?.risk?.riskScore).toBe(4);
      expect(result.computed?.risk?.insurancePremiumMultiplier).toBe(2);
    });
  });

  describe('Cas limites', () => {
    it('doit gérer une valeur minimale de 0€', () => {
      const ctx = createBaseContext(0);
      const result = module.apply(ctx);

      expect(result.computed?.risk?.declaredValueValid).toBe(true);
      expect(result.computed?.risk?.riskScore).toBe(1);
      expect(result.computed?.risk?.insurancePremiumMultiplier).toBe(1);
    });

    it('doit rejeter une valeur supérieure à 50000€', () => {
      const ctx = createBaseContext(60000);
      const result = module.apply(ctx);

      expect(result.computed?.risk?.declaredValueValid).toBe(false);
      expect(result.computed?.risk?.riskScore).toBe(5);
      expect(result.computed?.risk?.insurancePremiumMultiplier).toBe(2.5);
    });
  });

  describe('Traçabilité', () => {
    it('doit ajouter le module aux modules activés', () => {
      const ctx = createBaseContext(20000);
      const result = module.apply(ctx);

      expect(result.activatedModules).toHaveLength(1);
      expect(result.activatedModules?.[0].id).toBe('declared-value-validation');
      expect(result.activatedModules?.[0].details?.declaredValue).toBe(20000);
    });
  });

  describe('Calculs de risque et prime', () => {
    const testCases = [
      { value: 3000, expectedRiskScore: 1, expectedPremium: 1 },
      { value: 10000, expectedRiskScore: 2, expectedPremium: 1.2 },
      { value: 20000, expectedRiskScore: 3, expectedPremium: 1.5 },
      { value: 40000, expectedRiskScore: 4, expectedPremium: 2 },
      { value: 55000, expectedRiskScore: 5, expectedPremium: 2.5 }
    ];

    testCases.forEach(({ value, expectedRiskScore, expectedPremium }) => {
      it(`doit calculer correctement pour ${value}€`, () => {
        const ctx = createBaseContext(value);
        const result = module.apply(ctx);

        expect(result.computed?.risk?.riskScore).toBe(expectedRiskScore);
        expect(result.computed?.risk?.insurancePremiumMultiplier).toBe(expectedPremium);
      });
    });
  });
});
