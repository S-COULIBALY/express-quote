import { Service, ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';

describe('Service', () => {
  describe('constructor', () => {
    it('should create a valid service', () => {
      const basePrice = new Money(100);
      const service = new Service(
        'Regular Cleaning',
        ServiceType.CLEANING,
        basePrice
      );

      expect(service.getType()).toBe(ServiceType.CLEANING);
      expect(service.getName()).toBe('Regular Cleaning');
      expect(service.getBasePrice().getAmount()).toBe(100);
    });

    it('should throw error for invalid type', () => {
      expect(() => {
        new Service(
          'Regular Cleaning',
          'INVALID' as ServiceType,
          new Money(100)
        );
      }).toThrow('Invalid service type');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        new Service(
          '',
          ServiceType.CLEANING,
          new Money(100)
        );
      }).toThrow('Service name is required');
    });

    it('should throw error for negative price', () => {
      expect(() => {
        new Service(
          'Regular Cleaning',
          ServiceType.CLEANING,
          new Money(-100)
        );
      }).toThrow('Base price cannot be negative');
    });
  });

  describe('price management', () => {
    it('should update base price', () => {
      const service = new Service(
        'Regular Cleaning',
        ServiceType.CLEANING,
        new Money(100)
      );

      const newPrice = new Money(150);
      service.updateBasePrice(newPrice);
      expect(service.getBasePrice().getAmount()).toBe(150);
    });

    it('should throw error for invalid price update', () => {
      const service = new Service(
        'Regular Cleaning',
        ServiceType.CLEANING,
        new Money(100)
      );

      expect(() => {
        service.updateBasePrice(new Money(-50));
      }).toThrow('Base price cannot be negative');
    });
  });
}); 