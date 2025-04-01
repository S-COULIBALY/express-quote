import { BookingController } from '../BookingController';
import { BookingService } from '../../../../application/services/BookingService';
import { BookingType, BookingStatus } from '../../../../domain/enums/BookingType';
import { QuoteRequestType, QuoteRequestStatus } from '../../../../domain/enums/QuoteRequestType';
import { ServiceType } from '../../../../domain/enums/ServiceType';
import { Money } from '../../../../domain/value-objects/Money';
import { Address } from '../../../../domain/value-objects/Address';
import { Customer } from '../../../../domain/entities/Customer';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { Booking } from '../../../../domain/entities/Booking';
import { Moving } from '../../../../domain/entities/Moving';
import { Pack } from '../../../../domain/entities/Pack';
import { Service } from '../../../../domain/entities/Service';

describe('BookingController', () => {
    let bookingController: BookingController;
    let mockBookingService: jest.Mocked<BookingService>;

    beforeEach(() => {
        mockBookingService = {
            createQuoteRequest: jest.fn(),
            finalizeBooking: jest.fn(),
            processPayment: jest.fn(),
            findBookingById: jest.fn(),
            findBookingsByCustomer: jest.fn(),
            findBookingsByProfessional: jest.fn(),
            findBookingsByStatus: jest.fn(),
            findBookingsByType: jest.fn(),
            updateBooking: jest.fn(),
            deleteBooking: jest.fn()
        } as any;

        bookingController = new BookingController(mockBookingService);
    });

    describe('createQuoteRequest', () => {
        it('should create a moving quote request', async () => {
            const req = {
                body: {
                    type: BookingType.MOVING_QUOTE,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    pickupAddress: '123 Pickup St',
                    pickupCity: 'Pickup City',
                    pickupPostalCode: '12345',
                    pickupCountry: 'France',
                    deliveryAddress: '456 Delivery St',
                    deliveryCity: 'Delivery City',
                    deliveryPostalCode: '67890',
                    deliveryCountry: 'France',
                    moveDate: '2024-03-20',
                    volume: 30,
                    distance: 50,
                    tollCost: 10,
                    fuelCost: 20,
                    pickupFloor: 2,
                    deliveryFloor: 3,
                    pickupElevator: true,
                    deliveryElevator: false,
                    pickupCarryDistance: 10,
                    deliveryCarryDistance: 15,
                    propertyType: 'apartment',
                    surface: 80,
                    rooms: 3,
                    occupants: 2,
                    options: {
                        packaging: true,
                        furniture: false,
                        fragile: true,
                        storage: false,
                        disassembly: true,
                        unpacking: false,
                        supplies: true,
                        fragileItems: false
                    }
                }
            };

            const mockQuoteRequest = new QuoteRequest(
                '1',
                QuoteRequestType.MOVING,
                QuoteRequestStatus.PENDING,
                {},
                'temp123',
                new Date(),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            );

            mockBookingService.createQuoteRequest.mockResolvedValue(mockQuoteRequest);

            const result = await bookingController.createQuoteRequest(req);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.type).toBe(QuoteRequestType.MOVING);
            expect(mockBookingService.createQuoteRequest).toHaveBeenCalledWith(req.body);
        });

        it('should create a pack quote request', async () => {
            const req = {
                body: {
                    type: BookingType.PACK_QUOTE,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    packId: '1',
                    quantity: 2,
                    options: {
                        packaging: true,
                        furniture: false,
                        fragile: true,
                        storage: false,
                        disassembly: true,
                        unpacking: false,
                        supplies: true,
                        fragileItems: false
                    }
                }
            };

            const mockQuoteRequest = new QuoteRequest(
                '1',
                QuoteRequestType.PACK,
                QuoteRequestStatus.PENDING,
                {},
                'temp123',
                new Date(),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            );

            mockBookingService.createQuoteRequest.mockResolvedValue(mockQuoteRequest);

            const result = await bookingController.createQuoteRequest(req);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.type).toBe(QuoteRequestType.PACK);
            expect(mockBookingService.createQuoteRequest).toHaveBeenCalledWith(req.body);
        });

        it('should create a service quote request', async () => {
            const req = {
                body: {
                    type: BookingType.SERVICE_QUOTE,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    serviceId: '1',
                    serviceType: ServiceType.CLEANING,
                    options: {
                        packaging: true,
                        furniture: false,
                        fragile: true,
                        storage: false,
                        disassembly: true,
                        unpacking: false,
                        supplies: true,
                        fragileItems: false
                    }
                }
            };

            const mockQuoteRequest = new QuoteRequest(
                '1',
                QuoteRequestType.SERVICE,
                QuoteRequestStatus.PENDING,
                {},
                'temp123',
                new Date(),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            );

            mockBookingService.createQuoteRequest.mockResolvedValue(mockQuoteRequest);

            const result = await bookingController.createQuoteRequest(req);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.type).toBe(QuoteRequestType.SERVICE);
            expect(mockBookingService.createQuoteRequest).toHaveBeenCalledWith(req.body);
        });
    });

    describe('finalizeBooking', () => {
        it('should finalize a booking', async () => {
            const req = {
                params: { id: '1' },
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                }
            };

            const mockBooking = new Booking(
                '1',
                BookingType.MOVING_QUOTE,
                BookingStatus.PENDING,
                new Money(100),
                new Date(),
                new Date(),
                new Date(),
                new Customer('1', 'John', 'Doe', 'john@example.com', '1234567890'),
                undefined
            );

            mockBookingService.finalizeBooking.mockResolvedValue(mockBooking);

            const result = await bookingController.finalizeBooking(req);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.status).toBe(BookingStatus.PENDING);
            expect(mockBookingService.finalizeBooking).toHaveBeenCalledWith('1', req.body);
        });
    });

    describe('processPayment', () => {
        it('should process payment for a booking', async () => {
            const req = {
                params: { id: '1' }
            };

            const mockBooking = new Booking(
                '1',
                BookingType.MOVING_QUOTE,
                BookingStatus.CONFIRMED,
                new Money(100),
                new Date(),
                new Date(),
                new Date(),
                new Customer('1', 'John', 'Doe', 'john@example.com', '1234567890'),
                undefined
            );

            mockBookingService.processPayment.mockResolvedValue(mockBooking);

            const result = await bookingController.processPayment(req);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.status).toBe(BookingStatus.CONFIRMED);
            expect(mockBookingService.processPayment).toHaveBeenCalledWith('1');
        });
    });
}); 