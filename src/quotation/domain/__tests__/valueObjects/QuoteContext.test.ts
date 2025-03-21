import { QuoteContext } from '../../valueObjects/QuoteContext';
import { ServiceType } from '../../entities/Service';

describe('QuoteContext', () => {
  describe('validation', () => {
    it('should create a valid cleaning context', () => {
      const context = new QuoteContext({
        serviceType: ServiceType.CLEANING,
        squareMeters: 100,
        numberOfRooms: 3,
        frequency: 'WEEKLY',
        hasBalcony: true,
        hasPets: true
      });

      expect(context.getServiceType()).toBe(ServiceType.CLEANING);
      expect(context.getValue('squareMeters')).toBe(100);
      expect(context.getValue('numberOfRooms')).toBe(3);
      expect(context.getValue('frequency')).toBe('WEEKLY');
      expect(context.getValue('hasBalcony')).toBe(true);
      expect(context.getValue('hasPets')).toBe(true);
    });

    it('should create a valid moving context', () => {
      const context = new QuoteContext({
        serviceType: ServiceType.MOVING,
        volume: 50,
        distance: 100,
        floorNumber: 3,
        hasElevator: false,
        hasLongCarry: true
      });

      expect(context.getServiceType()).toBe(ServiceType.MOVING);
      expect(context.getValue('volume')).toBe(50);
      expect(context.getValue('distance')).toBe(100);
      expect(context.getValue('floorNumber')).toBe(3);
      expect(context.getValue('hasElevator')).toBe(false);
      expect(context.getValue('hasLongCarry')).toBe(true);
    });

    it('should throw error for invalid cleaning context', () => {
      expect(() => {
        new QuoteContext({
          serviceType: ServiceType.CLEANING,
          squareMeters: -100, // Invalid negative value
          numberOfRooms: 3,
          frequency: 'WEEKLY',
          hasBalcony: true,
          hasPets: true
        });
      }).toThrow('Square meters must be a positive number');

      expect(() => {
        new QuoteContext({
          serviceType: ServiceType.CLEANING,
          squareMeters: 100,
          numberOfRooms: -3, // Invalid negative value
          frequency: 'WEEKLY',
          hasBalcony: true,
          hasPets: true
        });
      }).toThrow('Number of rooms must be a positive number');
    });

    it('should throw error for invalid moving context', () => {
      expect(() => {
        new QuoteContext({
          serviceType: ServiceType.MOVING,
          volume: -50, // Invalid negative value
          distance: 100,
          floorNumber: 3,
          hasElevator: false,
          hasLongCarry: true
        });
      }).toThrow('Volume must be a positive number');

      expect(() => {
        new QuoteContext({
          serviceType: ServiceType.MOVING,
          volume: 50,
          distance: -100, // Invalid negative value
          floorNumber: 3,
          hasElevator: false,
          hasLongCarry: true
        });
      }).toThrow('Distance must be a positive number');
    });
  });

  describe('getValue', () => {
    it('should return undefined for non-existent property', () => {
      const context = new QuoteContext({
        serviceType: ServiceType.CLEANING,
        squareMeters: 100,
        numberOfRooms: 3,
        frequency: 'WEEKLY'
      });

      expect(context.getValue('nonExistentProperty')).toBeUndefined();
    });

    it('should return correct value for existing property', () => {
      const context = new QuoteContext({
        serviceType: ServiceType.CLEANING,
        squareMeters: 100,
        numberOfRooms: 3,
        frequency: 'WEEKLY'
      });

      expect(context.getValue('squareMeters')).toBe(100);
    });
  });
}); 