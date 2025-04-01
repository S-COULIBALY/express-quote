import { NextRequest } from 'next/server';
import { route } from '../route';
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

jest.mock('../../../../application/services/BookingService');

describe('Bookings API Route', () => {
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

        (BookingService as jest.Mock).mockImplementation(() => mockBookingService);
    });

    describe('POST /api/bookings', () => {
        it('should create a moving quote request', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings', {
                method: 'POST',
                body: JSON.stringify({
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
                })
            });

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

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.type).toBe(QuoteRequestType.MOVING);
            expect(mockBookingService.createQuoteRequest).toHaveBeenCalled();
        });

        it('should finalize a booking', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings/1/finalize', {
                method: 'POST',
                body: JSON.stringify({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                })
            });

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

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.status).toBe(BookingStatus.PENDING);
            expect(mockBookingService.finalizeBooking).toHaveBeenCalled();
        });

        it('should process payment for a booking', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings/1/payment', {
                method: 'POST'
            });

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

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.status).toBe(BookingStatus.CONFIRMED);
            expect(mockBookingService.processPayment).toHaveBeenCalled();
        });
    });

    describe('GET /api/bookings', () => {
        it('should get a booking by id', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings/1');

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

            mockBookingService.findBookingById.mockResolvedValue(mockBooking);

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.id).toBe('1');
            expect(mockBookingService.findBookingById).toHaveBeenCalledWith('1');
        });

        it('should get all bookings', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings');

            const mockBookings = [
                new Booking(
                    '1',
                    BookingType.MOVING_QUOTE,
                    BookingStatus.PENDING,
                    new Money(100),
                    new Date(),
                    new Date(),
                    new Date(),
                    new Customer('1', 'John', 'Doe', 'john@example.com', '1234567890'),
                    undefined
                ),
                new Booking(
                    '2',
                    BookingType.PACK_QUOTE,
                    BookingStatus.CONFIRMED,
                    new Money(200),
                    new Date(),
                    new Date(),
                    new Date(),
                    new Customer('2', 'Jane', 'Smith', 'jane@example.com', '0987654321'),
                    undefined
                )
            ];

            mockBookingService.findAll.mockResolvedValue(mockBookings);

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.length).toBe(2);
            expect(mockBookingService.findAll).toHaveBeenCalled();
        });
    });

    describe('PUT /api/bookings', () => {
        it('should update a booking', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings/1', {
                method: 'PUT',
                body: JSON.stringify({
                    status: BookingStatus.CONFIRMED
                })
            });

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

            mockBookingService.updateBooking.mockResolvedValue(mockBooking);

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toBeDefined();
            expect(data.data.status).toBe(BookingStatus.CONFIRMED);
            expect(mockBookingService.updateBooking).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/bookings', () => {
        it('should delete a booking', async () => {
            const req = new NextRequest('http://localhost:3000/api/bookings/1', {
                method: 'DELETE'
            });

            mockBookingService.deleteBooking.mockResolvedValue(true);

            const response = await route(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockBookingService.deleteBooking).toHaveBeenCalledWith('1');
        });
    });
}); 