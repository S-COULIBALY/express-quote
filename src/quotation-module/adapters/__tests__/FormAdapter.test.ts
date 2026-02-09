import { FormAdapter, FormData } from '../FormAdapter';
import { QuoteContext } from '../../core/QuoteContext';

describe('FormAdapter', () => {
  describe('toQuoteContext', () => {
    it('should convert complete form data to QuoteContext', () => {
      const formData: FormData = {
        movingDate: '2025-03-15T10:00:00Z',
        flexibility: 'PLUS_MINUS_3',
        estimatedVolume: 30,
        departureAddress: '123 Rue de Paris',
        departurePostalCode: '75001',
        departureCity: 'Paris',
        pickupFloor: 3,
        pickupHasElevator: false,
        arrivalAddress: '456 Avenue de Lyon',
        arrivalPostalCode: '69001',
        arrivalCity: 'Lyon',
        deliveryFloor: 2,
        deliveryHasElevator: true,
        distance: 465,
        piano: true,
        declaredValue: 20000,
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.serviceType).toBe('MOVING');
      expect(result.region).toBe('IDF');
      expect(result.movingDate).toBe('2025-03-15T10:00:00Z');
      expect(result.flexibility).toBe('PLUS_MINUS_3');
      expect(result.volumeMethod).toBe('FORM');
      expect(result.estimatedVolume).toBe(30);
      expect(result.volumeConfidence).toBe('MEDIUM');
      expect(result.departureAddress).toBe('123 Rue de Paris');
      expect(result.departurePostalCode).toBe('75001');
      expect(result.departureCity).toBe('Paris');
      expect(result.pickupFloor).toBe(3);
      expect(result.pickupHasElevator).toBe(false);
      expect(result.arrivalAddress).toBe('456 Avenue de Lyon');
      expect(result.arrivalPostalCode).toBe('69001');
      expect(result.arrivalCity).toBe('Lyon');
      expect(result.deliveryFloor).toBe(2);
      expect(result.deliveryHasElevator).toBe(true);
      expect(result.distance).toBe(465);
      expect(result.piano).toBe(true);
      expect(result.declaredValue).toBe(20000);
    });

    it('should handle string numbers', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        estimatedVolume: '30.5',
        distance: '465',
        declaredValue: '20000',
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.estimatedVolume).toBe(30.5);
      expect(result.distance).toBe(465);
      expect(result.declaredValue).toBe(20000);
    });

    it('should handle string booleans', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        pickupHasElevator: 'true',
        deliveryHasElevator: 'false',
        piano: 'yes',
        packing: '1',
        unpacking: '0',
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.pickupHasElevator).toBe(true);
      expect(result.deliveryHasElevator).toBe(false);
      expect(result.piano).toBe(true);
      expect(result.packing).toBe(true);
      expect(result.unpacking).toBe(false);
    });

    it('should normalize postal codes', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        departurePostalCode: '75 001',
        arrivalPostalCode: '69001',
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.departurePostalCode).toBe('75001');
      expect(result.arrivalPostalCode).toBe('69001');
    });

    it('should normalize dates', () => {
      const formData1: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        movingDate: new Date('2025-03-15T10:00:00Z'),
      };

      const result1 = FormAdapter.toQuoteContext(formData1);
      expect(result1.movingDate).toBe('2025-03-15T10:00:00.000Z');

      const formData2: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        movingDate: '2025-03-15T10:00:00Z',
      };

      const result2 = FormAdapter.toQuoteContext(formData2);
      expect(result2.movingDate).toBe('2025-03-15T10:00:00Z');
    });

    it('should handle empty form data', () => {
      const formData: FormData = {
        departureAddress: '',
        arrivalAddress: '',
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.serviceType).toBe('MOVING');
      expect(result.region).toBe('IDF');
      expect(result.departureAddress).toBe('');
      expect(result.arrivalAddress).toBe('');
      expect(result.movingDate).toBeUndefined();
      expect(result.surface).toBeUndefined();
    });

    it('should handle invalid enum values', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        flexibility: 'INVALID' as any,
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.flexibility).toBeUndefined();
      expect(result.volumeMethod).toBe('FORM');
      expect(result.volumeConfidence).toBe('LOW');
    });

    it('should handle invalid numbers', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
        estimatedVolume: NaN as number,
        distance: Infinity,
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.surface).toBeUndefined();
      expect(result.rooms).toBeUndefined();
      expect(result.estimatedVolume).toBeUndefined();
      expect(result.distance).toBeUndefined();
    });

    it('should require departureAddress and arrivalAddress', () => {
      const formData: FormData = {
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue de Lyon',
      };

      const result = FormAdapter.toQuoteContext(formData);

      expect(result.departureAddress).toBe('123 Rue de Paris');
      expect(result.arrivalAddress).toBe('456 Avenue de Lyon');
    });

    describe('Enrichissement automatique - Distance de portage', () => {
      it('should estimate carry distance for RDC (floor 0)', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 0,
          pickupHasElevator: false,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(0);
      });

      it('should estimate carry distance with elevator', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 3,
          pickupHasElevator: true,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(5); // Avec ascenseur : 5m
      });

      it('should estimate carry distance without elevator - 1-2 floors', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 2,
          pickupHasElevator: false,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(10); // 1-2 étages : 10m
      });

      it('should estimate carry distance without elevator - 3-4 floors', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 4,
          pickupHasElevator: false,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(20); // 3-4 étages : 20m
      });

      it('should estimate carry distance without elevator - 5+ floors', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 6,
          pickupHasElevator: false,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(30); // 5+ étages : 30m
      });

      it('should use provided carry distance if available', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          pickupFloor: 3,
          pickupHasElevator: false,
          pickupCarryDistance: 25, // Valeur fournie manuellement
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.pickupCarryDistance).toBe(25); // Utilise la valeur fournie
      });

      it('should estimate carry distance for delivery address', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          deliveryFloor: 5,
          deliveryHasElevator: false,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.deliveryCarryDistance).toBe(30); // 5+ étages : 30m
      });
    });

    describe('Enrichissement automatique - Confiance du volume (FORM uniquement)', () => {
      it('should calculate MEDIUM confidence when estimatedVolume is provided', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
          estimatedVolume: 30,
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.volumeMethod).toBe('FORM');
        expect(result.volumeConfidence).toBe('MEDIUM');
      });

      it('should calculate LOW confidence when no estimatedVolume', () => {
        const formData: FormData = {
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue de Lyon',
        };

        const result = FormAdapter.toQuoteContext(formData);

        expect(result.volumeConfidence).toBe('LOW');
      });
    });
  });
});

