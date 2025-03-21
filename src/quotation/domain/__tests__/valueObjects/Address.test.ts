import { Address } from '../../valueObjects/Address';

describe('Address', () => {
  describe('constructor', () => {
    it('should create a valid address', () => {
      const address = new Address(
        '123 Main St',
        'Paris',
        75001,
        'France'
      );

      expect(address.getStreet()).toBe('123 Main St');
      expect(address.getCity()).toBe('Paris');
      expect(address.getPostalCode()).toBe('75001');
      expect(address.getCity()).toBe('Paris');
    });

    it('should throw error for missing required fields', () => {
      expect(() => {
        new Address(
          '',
          'Paris',
          75001,
          'France'
        );
      }).toThrow('Street is required');

      expect(() => {
        new Address(
          '123 Main St',
          '',
          75001,
          'France'
        );
      }).toThrow('City is required');

      expect(() => {
        new Address(
          '123 Main St',
          'Paris',
          -1,
          'France'
        );
      }).toThrow('Invalid postal code format');

      expect(() => {
        new Address(
          '123 Main St',
          'Paris',
          75001,
          ''
        );
      }).toThrow('Country is required');
    });
  });

  describe('validation', () => {
    it('should validate postal code format', () => {
      expect(() => {
        new Address(
          '123 Main St',
          'Paris',
          -1,
          'France'
        );
      }).toThrow('Invalid postal code format');
    });
  });

  describe('getters', () => {
    it('should return address fields', () => {
      const address = new Address(
        '123 Main St',
        'Paris',
        75001,
        'France'
      );

      expect(address.getStreet()).toBe('123 Main St');
      expect(address.getCity()).toBe('Paris');
      expect(address.getPostalCode()).toBe('75001');
      expect(address.getCity()).toBe('Paris');
    });
  });
}); 