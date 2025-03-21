import { Booking, BookingStatus } from '../../entities/Booking';
import { Customer } from '../../entities/Customer';
import { Professional } from '../../entities/Professional';
import { Service, ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';
import { ContactInfo } from '../../valueObjects/ContactInfo';
import { Address } from '../../valueObjects/Address';
import { Quote } from '../../valueObjects/Quote';
import { QuoteContext } from '../../valueObjects/QuoteContext';

describe('Booking', () => {
  let customer: Customer;
  let professional: Professional;
  let service: Service;
  let quote: Quote;

  beforeEach(() => {
    const contactInfo = new ContactInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+33123456789'
    });

    const address = new Address({
      street: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    });

    customer = new Customer({
      contactInfo,
      address
    });

    professional = new Professional({
      contactInfo,
      address,
      services: [ServiceType.CLEANING],
      rating: 4.5,
      isAvailable: true
    });

    service = new Service({
      type: ServiceType.CLEANING,
      name: 'Regular Cleaning',
      description: 'Standard house cleaning service',
      basePrice: new Money(100)
    });

    const context = new QuoteContext({
      serviceType: ServiceType.CLEANING,
      squareMeters: 100,
      numberOfRooms: 3,
      frequency: 'WEEKLY'
    });

    quote = new Quote(
      new Money(100),
      new Money(90),
      [],
      context
    );
  });

  describe('constructor', () => {
    it('should create a valid booking', () => {
      const scheduledDate = new Date();
      const booking = new Booking({
        customer,
        professional,
        service,
        quote,
        scheduledDate,
        status: BookingStatus.PENDING
      });

      expect(booking.getCustomer()).toBe(customer);
      expect(booking.getProfessional()).toBe(professional);
      expect(booking.getService()).toBe(service);
      expect(booking.getQuote()).toBe(quote);
      expect(booking.getScheduledDate()).toBe(scheduledDate);
      expect(booking.getStatus()).toBe(BookingStatus.PENDING);
      expect(booking.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should throw error for past scheduled date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(() => {
        new Booking({
          customer,
          professional,
          service,
          quote,
          scheduledDate: pastDate,
          status: BookingStatus.PENDING
        });
      }).toThrow('Scheduled date cannot be in the past');
    });
  });

  describe('status management', () => {
    let booking: Booking;

    beforeEach(() => {
      booking = new Booking({
        customer,
        professional,
        service,
        quote,
        scheduledDate: new Date(),
        status: BookingStatus.PENDING
      });
    });

    it('should confirm booking', () => {
      booking.confirm();
      expect(booking.getStatus()).toBe(BookingStatus.CONFIRMED);
      expect(booking.getConfirmedAt()).toBeInstanceOf(Date);
    });

    it('should start service', () => {
      booking.confirm();
      booking.startService();
      expect(booking.getStatus()).toBe(BookingStatus.IN_PROGRESS);
      expect(booking.getStartedAt()).toBeInstanceOf(Date);
    });

    it('should complete service', () => {
      booking.confirm();
      booking.startService();
      booking.complete();
      expect(booking.getStatus()).toBe(BookingStatus.COMPLETED);
      expect(booking.getCompletedAt()).toBeInstanceOf(Date);
    });

    it('should cancel booking', () => {
      const reason = 'Customer request';
      booking.cancel(reason);
      expect(booking.getStatus()).toBe(BookingStatus.CANCELLED);
      expect(booking.getCancellationReason()).toBe(reason);
      expect(booking.getCancelledAt()).toBeInstanceOf(Date);
    });

    it('should throw error for invalid status transition', () => {
      expect(() => {
        booking.complete();
      }).toThrow('Cannot complete a pending booking');

      booking.cancel('test');
      expect(() => {
        booking.confirm();
      }).toThrow('Cannot confirm a cancelled booking');
    });
  });

  describe('notes and feedback', () => {
    let booking: Booking;

    beforeEach(() => {
      booking = new Booking({
        customer,
        professional,
        service,
        quote,
        scheduledDate: new Date(),
        status: BookingStatus.PENDING
      });
    });

    it('should add notes', () => {
      booking.addNote('Customer prefers morning service');
      expect(booking.getNotes()).toContain('Customer prefers morning service');
    });

    it('should add feedback', () => {
      booking.confirm();
      booking.startService();
      booking.complete();
      
      booking.addFeedback({
        rating: 5,
        comment: 'Excellent service'
      });

      const feedback = booking.getFeedback();
      expect(feedback?.rating).toBe(5);
      expect(feedback?.comment).toBe('Excellent service');
    });

    it('should throw error for feedback on incomplete booking', () => {
      expect(() => {
        booking.addFeedback({
          rating: 5,
          comment: 'Excellent service'
        });
      }).toThrow('Cannot add feedback to a pending booking');
    });
  });
}); 