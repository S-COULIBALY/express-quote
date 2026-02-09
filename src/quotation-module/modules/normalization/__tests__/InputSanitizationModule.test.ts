import { InputSanitizationModule } from '../InputSanitizationModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('InputSanitizationModule', () => {
  let module: InputSanitizationModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new InputSanitizationModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
    };
  });

  describe('sanitizeAddress', () => {
    it('should remove dangerous characters from address', () => {
      const result = (module as any).sanitizeAddress('123 Rue <script>alert("xss")</script>');
      expect(result).toBe('123 Rue'); // Scripts et leur contenu sont complètement supprimés pour sécurité
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should limit address to 200 characters', () => {
      const longAddress = 'a'.repeat(250);
      const result = (module as any).sanitizeAddress(longAddress);
      expect(result.length).toBe(200);
    });

    it('should normalize multiple spaces', () => {
      const result = (module as any).sanitizeAddress('123   Rue    de   Paris');
      expect(result).toBe('123 Rue de Paris');
    });

    it('should return empty string for null/undefined', () => {
      expect((module as any).sanitizeAddress(null)).toBe('');
      expect((module as any).sanitizeAddress(undefined)).toBe('');
    });
  });

  describe('sanitizePostalCode', () => {
    it('should validate French postal code (5 digits)', () => {
      const result = (module as any).sanitizePostalCode('75001');
      expect(result).toBe('75001');
    });

    it('should extract digits from postal code', () => {
      const result = (module as any).sanitizePostalCode('75 001');
      expect(result).toBe('75001');
    });

    it('should reject invalid postal codes', () => {
      expect((module as any).sanitizePostalCode('7500')).toBeUndefined();
      expect((module as any).sanitizePostalCode('750012')).toBeUndefined();
      expect((module as any).sanitizePostalCode('abcde')).toBeUndefined();
    });

    it('should return undefined for null/undefined', () => {
      expect((module as any).sanitizePostalCode(null)).toBeUndefined();
      expect((module as any).sanitizePostalCode(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeCity', () => {
    it('should remove dangerous characters', () => {
      const result = (module as any).sanitizeCity('Paris<script>');
      expect(result).toBe('Paris'); // Les balises HTML sont supprimées
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
    });

    it('should limit city to 50 characters', () => {
      const longCity = 'a'.repeat(60);
      const result = (module as any).sanitizeCity(longCity);
      expect(result?.length).toBe(50);
    });

    it('should preserve letters, spaces and hyphens', () => {
      const result = (module as any).sanitizeCity('Saint-Étienne');
      expect(result).toBe('Saint-Étienne');
    });
  });

  describe('sanitizeDate', () => {
    it('should validate ISO 8601 date format', () => {
      const result = (module as any).sanitizeDate('2025-03-15T10:00:00Z');
      expect(result).toBe('2025-03-15T10:00:00Z');
    });

    it('should validate simple date format', () => {
      const result = (module as any).sanitizeDate('2025-03-15');
      expect(result).toBe('2025-03-15');
    });

    it('should reject invalid dates', () => {
      expect((module as any).sanitizeDate('2025-13-45')).toBeUndefined();
      expect((module as any).sanitizeDate('invalid-date')).toBeUndefined();
      expect((module as any).sanitizeDate('15/03/2025')).toBeUndefined();
    });

    it('should return undefined for null/undefined', () => {
      expect((module as any).sanitizeDate(null)).toBeUndefined();
      expect((module as any).sanitizeDate(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeNumber', () => {
    it('should accept valid numbers', () => {
      expect((module as any).sanitizeNumber(65)).toBe(65);
      expect((module as any).sanitizeNumber(0)).toBe(0);
      expect((module as any).sanitizeNumber(100.5)).toBe(100.5);
    });

    it('should reject negative numbers', () => {
      expect((module as any).sanitizeNumber(-10)).toBeUndefined();
    });

    it('should reject NaN and Infinity', () => {
      expect((module as any).sanitizeNumber(NaN)).toBeUndefined();
      expect((module as any).sanitizeNumber(Infinity)).toBeUndefined();
      expect((module as any).sanitizeNumber(-Infinity)).toBeUndefined();
    });

    it('should return undefined for null/undefined', () => {
      expect((module as any).sanitizeNumber(null)).toBeUndefined();
      expect((module as any).sanitizeNumber(undefined)).toBeUndefined();
    });
  });

  describe('apply method', () => {
    it('should sanitize all input data', () => {
      const dirtyContext: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue <script>alert("xss")</script> de Paris',
        departurePostalCode: '75 001',
        departureCity: 'Paris<script>',
        arrivalAddress: '456   Avenue   de   Lyon',
        arrivalPostalCode: '69002',
        arrivalCity: 'Lyon',
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: 30,
        distance: 15,
        declaredValue: 15000,
        pickupFloor: 3,
        deliveryFloor: 2,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(dirtyContext);

      // Adresses sanitizées
      expect(result.departureAddress).toBe('123 Rue de Paris'); // Scripts complètement supprimés, espaces normalisés
      expect(result.departureAddress).not.toContain('<');
      expect(result.departureAddress).not.toContain('>');
      expect(result.departureAddress).not.toContain('script');
      expect(result.departureAddress).not.toContain('alert');
      expect(result.departurePostalCode).toBe('75001');
      expect(result.departureCity).toBe('Paris');
      expect(result.arrivalAddress).toBe('456 Avenue de Lyon');
      expect(result.arrivalPostalCode).toBe('69002');

      // Date validée
      expect(result.movingDate).toBe('2025-03-15T10:00:00Z');

      // Nombres validés
      expect(result.estimatedVolume).toBe(30);
      expect(result.distance).toBe(15);
      expect(result.declaredValue).toBe(15000);

      // Étages validés
      expect(result.pickupFloor).toBe(3);
      expect(result.deliveryFloor).toBe(2);

      // Traçabilité
      expect(result.computed?.activatedModules).toContain('input-sanitization');
      expect(result.computed?.metadata?.sanitizationApplied).toBe(true);
      expect(result.computed?.metadata?.sanitizationTimestamp).toBeDefined();
      
      // Statistiques de sanitisation
      const stats = result.computed?.metadata?.sanitizationStats;
      expect(stats).toBeDefined();
      expect(stats?.totalFields).toBeGreaterThan(0);
      expect(stats?.modifiedFields).toBeGreaterThan(0); // Au moins les adresses avec scripts ont été modifiées
      expect(stats?.fields).toBeDefined();
      expect(stats?.fields?.departureAddress?.modified).toBe(true); // Script supprimé
      expect(stats?.fields?.arrivalAddress?.modified).toBe(true); // Espaces normalisés
    });

    it('should handle empty or null inputs gracefully', () => {
      const emptyContext: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '',
        arrivalAddress: '',
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(emptyContext);

      expect(result.departureAddress).toBe('');
      expect(result.arrivalAddress).toBe('');
      expect(result.departurePostalCode).toBeUndefined();
      expect(result.movingDate).toBeUndefined();
      expect(result.computed?.activatedModules).toContain('input-sanitization');
    });

    it('should reject invalid data', () => {
      const invalidContext: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        departurePostalCode: 'invalid',
        movingDate: 'invalid-date',
        estimatedVolume: NaN,
        distance: Infinity,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(invalidContext);

      expect(result.departurePostalCode).toBeUndefined();
      expect(result.movingDate).toBeUndefined();
      expect(result.estimatedVolume).toBeUndefined();
      expect(result.distance).toBeUndefined();

      // Vérifier les statistiques de sanitisation
      const stats = result.computed?.metadata?.sanitizationStats;
      expect(stats).toBeDefined();
      expect(stats?.invalidFields).toBeGreaterThan(0); // Au moins 4 champs invalides (surface/rooms retirés)
      expect(stats?.fields?.departurePostalCode?.invalid).toBe(true);
      expect(stats?.fields?.movingDate?.invalid).toBe(true);
      expect(stats?.fields?.estimatedVolume?.invalid).toBe(true);
      expect(stats?.fields?.distance?.invalid).toBe(true);
    });
  });
});
