import { DateValidationModule } from '../DateValidationModule';
import { QuoteContext } from '../../types/quote-types';

describe('DateValidationModule', () => {
  let module: DateValidationModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new DateValidationModule();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    baseContext = {
      pickupDate: tomorrow.toISOString(),
      dropoffDate: null,
      activatedModules: []
    } as QuoteContext;
  });

  // Tests cas normaux
  describe('Dates valides', () => {
    it('devrait normaliser une date de départ dans le futur', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      baseContext.pickupDate = tomorrow.toISOString();

      const result = module.apply(baseContext);
      
      expect(result.pickupDate).toBeDefined();
      expect(new Date(result.pickupDate).getHours()).toBe(12);
      expect(new Date(result.pickupDate).getMinutes()).toBe(0);
    });

    it('devrait gérer des dates de départ et de livraison valides', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(tomorrow);
      nextWeek.setDate(nextWeek.getDate() + 7);

      baseContext.pickupDate = tomorrow.toISOString();
      baseContext.dropoffDate = nextWeek.toISOString();

      const result = module.apply(baseContext);
      
      expect(result.estimatedMoveDuration).toBe(7);
      expect(new Date(result.dropoffDate).getHours()).toBe(12);
    });
  });

  // Tests de limites
  describe('Cas limites', () => {
    it('devrait lever une erreur si la date de départ est dans le passé', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      baseContext.pickupDate = yesterday.toISOString();

      expect(() => module.apply(baseContext)).toThrow('Date de déménagement invalide');
    });

    it('devrait lever une erreur si la date de livraison est avant la date de départ', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      baseContext.pickupDate = tomorrow.toISOString();
      baseContext.dropoffDate = yesterday.toISOString();

      expect(() => module.apply(baseContext)).toThrow('Date de livraison invalide');
    });
  });

  // Tests de traçabilité
  describe('Traçabilité', () => {
    it('devrait ajouter le module aux modules activés', () => {
      const result = module.apply(baseContext);
      
      expect(result.activatedModules).toHaveLength(1);
      expect(result.activatedModules[0].id).toBe('date-validation');
      expect(result.activatedModules[0].priority).toBe(11);
    });
  });

  // Tests valeurs par défaut
  describe('Valeurs par défaut', () => {
    it('devrait avoir une durée estimée de 1 jour sans date de livraison', () => {
      const result = module.apply(baseContext);
      
      expect(result.estimatedMoveDuration).toBe(1);
    });
  });
});
