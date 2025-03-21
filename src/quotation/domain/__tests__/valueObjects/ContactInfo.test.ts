import { ContactInfo } from '../../valueObjects/ContactInfo';

describe('ContactInfo', () => {
  describe('constructor', () => {
    it('should create a valid contact info', () => {
      const contactInfo = new ContactInfo(
        'john.doe@example.com',
        '+33123456789',
        'John Doe'
      );

      expect(contactInfo.getName()).toBe('John Doe');
      expect(contactInfo.getEmail()).toBe('john.doe@example.com');
      expect(contactInfo.getPhone()).toBe('+33123456789');
    });

    it('should throw error for missing required fields', () => {
      expect(() => {
        new ContactInfo(
          '',
          '+33123456789',
          'John Doe'
        );
      }).toThrow('Invalid email format');

      expect(() => {
        new ContactInfo(
          'john.doe@example.com',
          '',
          'John Doe'
        );
      }).toThrow('Invalid phone format');

      expect(() => {
        new ContactInfo(
          'john.doe@example.com',
          '+33123456789',
          ''
        );
      }).toThrow('Name is required');
    });

    it('should validate email format', () => {
      expect(() => {
        new ContactInfo(
          'invalid-email',
          '+33123456789',
          'John Doe'
        );
      }).toThrow('Invalid email format');
    });

    it('should validate phone format', () => {
      expect(() => {
        new ContactInfo(
          'john.doe@example.com',
          '123',
          'John Doe'
        );
      }).toThrow('Invalid phone format');
    });
  });

  describe('getters', () => {
    it('should return contact info fields', () => {
      const contactInfo = new ContactInfo(
        'john.doe@example.com',
        '+33123456789',
        'John Doe'
      );

      expect(contactInfo.getEmail()).toBe('john.doe@example.com');
      expect(contactInfo.getPhone()).toBe('+33123456789');
      expect(contactInfo.getName()).toBe('John Doe');
    });
  });
}); 