import { AddressNormalizationModule } from '../AddressNormalizationModule';
import { QuoteContext } from '../../types/quote-types';

describe('AddressNormalizationModule', () => {
  let module: AddressNormalizationModule;

  beforeEach(() => {
    module = new AddressNormalizationModule();
  });

  describe('normalizeAddress (private method)', () => {
    it('doit convertir une adresse en majuscules', () => {
      const method = module['normalizeAddress'];
      expect(method('12 rue des lilas')).toBe('12 RUE DES LILAS');
    });

    it('doit supprimer les caractères spéciaux', () => {
      const method = module['normalizeAddress'];
      expect(method('12, rue des lilas!')).toBe('12 RUE DES LILAS');
    });

    it('doit supprimer les accents', () => {
      const method = module['normalizeAddress'];
      expect(method('résidence éléphant')).toBe('RESIDENCE ELEPHANT');
    });

    it('doit gérer une chaîne vide', () => {
      const method = module['normalizeAddress'];
      expect(method('')).toBe('');
    });
  });

  describe('apply method', () => {
    it('doit normaliser les adresses de départ et destination', () => {
      const mockContext: QuoteContext = {
        origin: { address: '12, rue des Champs-Élysées' },
        destination: { address: '45 avenue Montaigne' }
      };

      const result = module.apply(mockContext);

      expect(result.origin?.normalizedAddress).toBe('12 RUE DES CHAMPS ELYSEES');
      expect(result.destination?.normalizedAddress).toBe('45 AVENUE MONTAIGNE');
    });

    it('doit ajouter le module aux modules activés', () => {
      const mockContext: QuoteContext = {
        origin: { address: '123 test street' },
        destination: { address: '456 demo avenue' }
      };

      const result = module.apply(mockContext);

      expect(result.activatedModules).toHaveLength(1);
      expect(result.activatedModules?.[0].id).toBe('address-normalization');
    });

    it('doit gérer des adresses undefined', () => {
      const mockContext: QuoteContext = {
        origin: {},
        destination: {}
      };

      const result = module.apply(mockContext);

      expect(result.origin?.normalizedAddress).toBe('');
      expect(result.destination?.normalizedAddress).toBe('');
    });

    it('doit préserver les autres propriétés du contexte', () => {
      const mockContext: QuoteContext = {
        origin: { address: '123 test street', someOtherProp: 'value' },
        destination: { address: '456 demo avenue' },
        customData: { test: true }
      };

      const result = module.apply(mockContext);

      expect(result.origin?.someOtherProp).toBe('value');
      expect(result.customData).toEqual({ test: true });
    });
  });
});
