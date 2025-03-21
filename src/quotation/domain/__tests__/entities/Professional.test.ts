import { Professional } from '../../entities/Professional';
import { ContactInfo } from '../../valueObjects/ContactInfo';
import { Address } from '../../valueObjects/Address';
import { Service, ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';

describe('Professional', () => {
  let defaultContactInfo: ContactInfo;
  let defaultAddress: Address;
  let cleaningService: Service;
  let movingService: Service;

  beforeEach(() => {
    defaultContactInfo = new ContactInfo(
      'john.doe@example.com',
      '+33123456789',
      'John Doe'
    );

    defaultAddress = new Address(
      '123 Main St',
      'Paris',
      '75001',
      'France'
    );

    cleaningService = new Service(
      'Regular Cleaning',
      ServiceType.CLEANING,
      new Money(100)
    );

    movingService = new Service(
      'Standard Moving',
      ServiceType.MOVING,
      new Money(200)
    );
  });

  describe('constructor', () => {
    it('should create a valid professional', () => {
      const professional = new Professional(defaultContactInfo);

      expect(professional.getContactInfo()).toBe(defaultContactInfo);
      expect(professional.getServices()).toEqual([]);
    });

    it('should create a professional with initial service', () => {
      const professional = new Professional(defaultContactInfo, cleaningService);

      expect(professional.getContactInfo()).toBe(defaultContactInfo);
      expect(professional.getServices()).toEqual([cleaningService]);
    });

    it('should create a professional with multiple services', () => {
      const professional = new Professional(
        defaultContactInfo,
        defaultAddress,
        [ServiceType.CLEANING, ServiceType.MOVING]
      );

      expect(professional.getServices()).toEqual([ServiceType.CLEANING, ServiceType.MOVING]);
    });

    it('should throw error for invalid rating', () => {
      expect(() => {
        new Professional({
          contactInfo: defaultContactInfo,
          address: defaultAddress,
          services: [ServiceType.CLEANING],
          rating: 6,
          isAvailable: true
        });
      }).toThrow('Rating must be between 0 and 5');

      expect(() => {
        new Professional({
          contactInfo: defaultContactInfo,
          address: defaultAddress,
          services: [ServiceType.CLEANING],
          rating: -1,
          isAvailable: true
        });
      }).toThrow('Rating must be between 0 and 5');
    });
  });

  describe('service management', () => {
    it('should add and remove services', () => {
      const professional = new Professional(defaultContactInfo);

      professional.addService(ServiceType.CLEANING);
      expect(professional.getServices()).toEqual([ServiceType.CLEANING]);

      professional.addService(ServiceType.MOVING);
      expect(professional.getServices()).toEqual([ServiceType.CLEANING, ServiceType.MOVING]);

      professional.removeService(ServiceType.CLEANING);
      expect(professional.getServices()).toEqual([ServiceType.MOVING]);
    });

    it('should check if provides service', () => {
      const professional = new Professional(defaultContactInfo);

      expect(professional.providesService(cleaningService)).toBe(true);
      expect(professional.providesService(movingService)).toBe(false);
    });
  });

  describe('availability', () => {
    it('should update availability', () => {
      const professional = new Professional(defaultContactInfo);

      professional.setAvailable();
      expect(professional.isAvailable()).toBe(true);
    });
  });

  describe('rating', () => {
    it('should update rating', () => {
      const professional = new Professional({
        contactInfo: defaultContactInfo,
        address: defaultAddress,
        services: [ServiceType.CLEANING],
        rating: 4.5,
        isAvailable: true
      });

      professional.updateRating(4.8);
      expect(professional.getRating()).toBe(4.8);
    });

    it('should throw error for invalid rating update', () => {
      const professional = new Professional({
        contactInfo: defaultContactInfo,
        address: defaultAddress,
        services: [ServiceType.CLEANING],
        rating: 4.5,
        isAvailable: true
      });

      expect(() => {
        professional.updateRating(5.5);
      }).toThrow('Rating must be between 0 and 5');
    });
  });
}); 