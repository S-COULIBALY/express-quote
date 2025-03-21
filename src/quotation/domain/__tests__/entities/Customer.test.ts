import { Customer } from '../../entities/Customer';
import { ContactInfo } from '../../valueObjects/ContactInfo';
import { Address } from '../../valueObjects/Address';

describe('Customer', () => {
  let defaultContactInfo: ContactInfo;
  let defaultAddress: Address;

  beforeEach(() => {
    defaultContactInfo = new ContactInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+33123456789'
    });

    defaultAddress = new Address({
      street: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    });
  });

  describe('constructor', () => {
    it('should create a valid customer', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      expect(customer.getContactInfo()).toBe(defaultContactInfo);
      expect(customer.getAddress()).toBe(defaultAddress);
      expect(customer.isVerified()).toBe(false);
    });

    it('should create a verified customer', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress,
        isVerified: true
      });

      expect(customer.isVerified()).toBe(true);
    });
  });

  describe('verification', () => {
    it('should verify customer', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      customer.verify();
      expect(customer.isVerified()).toBe(true);
    });

    it('should unverify customer', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress,
        isVerified: true
      });

      customer.unverify();
      expect(customer.isVerified()).toBe(false);
    });
  });

  describe('update information', () => {
    it('should update contact information', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      const newContactInfo = new ContactInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+33987654321'
      });

      customer.updateContactInfo(newContactInfo);
      expect(customer.getContactInfo()).toBe(newContactInfo);
    });

    it('should update address', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      const newAddress = new Address({
        street: '456 Other St',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France'
      });

      customer.updateAddress(newAddress);
      expect(customer.getAddress()).toBe(newAddress);
    });
  });

  describe('preferences', () => {
    it('should add and get preferences', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      customer.addPreference('preferredDay', 'Monday');
      customer.addPreference('preferredTime', 'Morning');

      expect(customer.getPreference('preferredDay')).toBe('Monday');
      expect(customer.getPreference('preferredTime')).toBe('Morning');
    });

    it('should remove preferences', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      customer.addPreference('preferredDay', 'Monday');
      customer.removePreference('preferredDay');

      expect(customer.getPreference('preferredDay')).toBeUndefined();
    });

    it('should get all preferences', () => {
      const customer = new Customer({
        contactInfo: defaultContactInfo,
        address: defaultAddress
      });

      customer.addPreference('preferredDay', 'Monday');
      customer.addPreference('preferredTime', 'Morning');

      expect(customer.getAllPreferences()).toEqual({
        preferredDay: 'Monday',
        preferredTime: 'Morning'
      });
    });
  });
}); 