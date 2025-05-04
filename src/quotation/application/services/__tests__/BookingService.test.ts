import { BookingService } from '../BookingService';
import { Booking, BookingStatus, BookingType } from '../../../domain/entities/Booking';
import { QuoteRequest, QuoteRequestStatus, QuoteRequestType } from '../../../domain/entities/QuoteRequest';
import { ServiceType } from '../../../domain/enums/ServiceType';
import { Money } from '../../../domain/valueObjects/Money';
import { Address } from '../../../domain/valueObjects/Address';
import { ContactInfo } from '../../../domain/valueObjects/ContactInfo';
import { Moving } from '../../../domain/entities/Moving';
import { Pack } from '../../../domain/entities/Pack';
import { Service } from '../../../domain/entities/Service';
import { Customer } from '../../../domain/entities/Customer';
import { MovingQuoteCalculator } from '../../../domain/calculators/MovingQuoteCalculator';
import { CustomerService } from '../CustomerService';
import { Quote } from '../../../domain/entities/Quote';
import { QuoteType, QuoteStatus } from '../../../domain/enums/QuoteType';

// Import des interfaces des repositories
import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import { IMovingRepository } from '../../../domain/repositories/IMovingRepository';
import { IPackRepository } from '../../../domain/repositories/IPackRepository';
import { IServiceRepository } from '../../../domain/repositories/IServiceRepository';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { IQuoteRequestRepository } from '../../../domain/repositories/IQuoteRequestRepository';

// Import des implémentations réelles des repositories
import { PrismaBookingRepository } from '../../../infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '../../../infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '../../../infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '../../../infrastructure/repositories/PrismaServiceRepository';
import { PrismaCustomerRepository } from '../../../infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '../../../infrastructure/repositories/PrismaQuoteRequestRepository';
import { Database } from '../../../infrastructure/config/database';

// Mocks pour PrismaClient
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        booking: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        customer: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        quoteRequest: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        moving: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        pack: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        service: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        }
    };

    return {
        PrismaClient: jest.fn(() => mockPrisma)
    };
});

// Mock pour Database.getClient()
jest.mock('../../../infrastructure/config/database', () => {
    return {
        Database: {
            getClient: jest.fn(() => {
                return new (require('@prisma/client').PrismaClient)();
            })
        }
    };
});

describe('BookingService', () => {
    let bookingService: BookingService;
    
    // Repositories réels
    let bookingRepository: IBookingRepository;
    let movingRepository: IMovingRepository;
    let packRepository: IPackRepository;
    let serviceRepository: IServiceRepository;
    let customerRepository: ICustomerRepository;
    let quoteRequestRepository: IQuoteRequestRepository;
    
    // Prisma mock
    let prismaMock: any;
    
    // Services réels
    let movingCalculator: MovingQuoteCalculator;
    let customerService: CustomerService;

    beforeEach(() => {
        // Récupérer le mock de Prisma
        prismaMock = Database.getClient() as jest.Mocked<any>;
        
        // Initialize movingCalculator
        movingCalculator = new MovingQuoteCalculator([
            // Tableau de règles vide - à compléter selon les tests
        ]);
        
        // Utiliser des mocks pour tous les repositories, car il semble y avoir des incompatibilités
        // entre les interfaces et les implémentations réelles
        const _bookingRepository: IBookingRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCustomerId: jest.fn(),
            findByProfessionalId: jest.fn(),
            findByStatus: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn()
        };
        bookingRepository = _bookingRepository as unknown as IBookingRepository;
        
        const _movingRepository: IMovingRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByBookingId: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };
        movingRepository = _movingRepository as unknown as IMovingRepository;
        
        const _packRepository: IPackRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByBookingId: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };
        packRepository = _packRepository as unknown as IPackRepository;
        
        const _serviceRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByBookingId: jest.fn(),
            save: jest.fn(),
            update: jest.fn((service: Service) => Promise.resolve(service)),
            delete: jest.fn()
        };
        serviceRepository = _serviceRepository as unknown as IServiceRepository;
        
        const _customerRepository: ICustomerRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };
        customerRepository = _customerRepository as unknown as ICustomerRepository;
        
        const _quoteRequestRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByTemporaryId: jest.fn(),
            findExpired: jest.fn(),
            save: jest.fn(),
            updateStatus: jest.fn()
        };
        quoteRequestRepository = _quoteRequestRepository as unknown as IQuoteRequestRepository;

        // Instanciation du CustomerService avec le mock repository
        customerService = new CustomerService(customerRepository);

        // Création du service de réservation avec les bons paramètres
        bookingService = new BookingService(
            bookingRepository,
            movingRepository,
            packRepository,
            serviceRepository,
            movingCalculator,
            quoteRequestRepository,
            customerService
        );

        // Réinitialiser tous les mocks de Prisma
        jest.clearAllMocks();
    });

    describe('createQuoteRequest', () => {
        it('devrait créer une demande de devis de déménagement avec les données correctes', async () => {
            const quoteRequestDTO = {
                type: QuoteRequestType.MOVING,
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789',
                pickupAddress: '123 Rue de Départ',
                pickupCity: 'Ville de Départ',
                pickupPostalCode: '12345',
                pickupCountry: 'France',
                deliveryAddress: '456 Rue d\'Arrivée',
                deliveryCity: 'Ville d\'Arrivée',
                deliveryPostalCode: '67890',
                deliveryCountry: 'France',
                moveDate: '2024-06-15',
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
            };

            // Création des vraies entités
            const quoteRequest = new QuoteRequest(
                QuoteRequestType.MOVING,
                quoteRequestDTO
            );
            
            // Mock des retours Prisma pour la création
            prismaMock.quoteRequest.create.mockResolvedValue({
                id: quoteRequest.getId(),
                type: QuoteRequestType.MOVING,
                status: QuoteRequestStatus.TEMPORARY,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                temporaryId: quoteRequest.getTemporaryId(),
                quoteData: quoteRequestDTO
            });
            
            prismaMock.moving.create.mockResolvedValue({
                id: '1',
                quoteRequestId: quoteRequest.getId(),
                moveDate: new Date(quoteRequestDTO.moveDate),
                pickupAddress: quoteRequestDTO.pickupAddress,
                pickupCity: quoteRequestDTO.pickupCity,
                pickupPostalCode: quoteRequestDTO.pickupPostalCode,
                pickupCountry: quoteRequestDTO.pickupCountry,
                pickupFloor: quoteRequestDTO.pickupFloor,
                pickupElevator: quoteRequestDTO.pickupElevator,
                pickupCarryDistance: quoteRequestDTO.pickupCarryDistance,
                deliveryAddress: quoteRequestDTO.deliveryAddress,
                deliveryCity: quoteRequestDTO.deliveryCity,
                deliveryPostalCode: quoteRequestDTO.deliveryPostalCode,
                deliveryCountry: quoteRequestDTO.deliveryCountry,
                deliveryFloor: quoteRequestDTO.deliveryFloor,
                deliveryElevator: quoteRequestDTO.deliveryElevator,
                deliveryCarryDistance: quoteRequestDTO.deliveryCarryDistance,
                volume: quoteRequestDTO.volume,
                distance: quoteRequestDTO.distance,
                tollCost: quoteRequestDTO.tollCost,
                fuelCost: quoteRequestDTO.fuelCost,
                options: quoteRequestDTO.options
            });

            // Appel de la méthode à tester
            const result = await bookingService.createQuoteRequest(quoteRequestDTO);

            // Vérifications
            expect(result).toBeDefined();
            expect(result.getType()).toBe(QuoteRequestType.MOVING);
            expect(result.getStatus()).toBe(QuoteRequestStatus.TEMPORARY);
            expect(prismaMock.quoteRequest.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.moving.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('finalizeBooking', () => {
        it('devrait finaliser une réservation à partir d\'un devis', async () => {
            // Création des données de test
            const quoteRequestData = {
                id: '1',
                type: QuoteRequestType.MOVING,
                status: QuoteRequestStatus.TEMPORARY,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                temporaryId: 'temp123',
                quoteData: { totalAmount: 450 }
            };
            
            // Mock du retour Prisma pour la recherche du devis
            prismaMock.quoteRequest.findUnique.mockResolvedValue(quoteRequestData);
            
            // Mock pour la recherche client (pas trouvé)
            prismaMock.customer.findUnique.mockResolvedValue(null);
            
            // Mock pour la création du client
            const customerData = {
                id: '1',
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prismaMock.customer.create.mockResolvedValue(customerData);
            
            // Mock pour la création de la réservation
            const bookingData = {
                id: '1',
                type: BookingType.MOVING_QUOTE,
                status: BookingStatus.DRAFT,
                totalAmount: 450,
                createdAt: new Date(),
                updatedAt: new Date(),
                quoteRequestId: '1',
                customerId: '1',
                professionalId: null,
                paymentMethod: null,
                customer: customerData,
                professional: null
            };
            prismaMock.booking.create.mockResolvedValue(bookingData);
            
            // Mock pour la mise à jour du statut de la demande
            prismaMock.quoteRequest.update.mockResolvedValue({
                ...quoteRequestData,
                status: QuoteRequestStatus.CONVERTED
            });

            // Données client pour la finalisation
            const customerFormData = {
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789'
            };

            // Appel de la méthode à tester
            const result = await bookingService.finalizeBooking('1', customerFormData);

            // Vérifications
            expect(result).toBeDefined();
            expect(result.getStatus()).toBe(BookingStatus.DRAFT);
            expect(result.getCustomer().getEmail()).toBe('jean.dupont@example.com');
            expect(prismaMock.quoteRequest.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({ where: { email: 'jean.dupont@example.com' } });
            expect(prismaMock.customer.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.booking.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.quoteRequest.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: QuoteRequestStatus.CONVERTED }
            });
        });
    });

    describe('processPayment', () => {
        it('devrait traiter le paiement d\'une réservation', async () => {
            // Création des données de test
            const customerData = {
                id: '1',
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const bookingData = {
                id: '1',
                type: BookingType.MOVING_QUOTE,
                status: BookingStatus.DRAFT,
                totalAmount: 450,
                createdAt: new Date(),
                updatedAt: new Date(),
                quoteRequestId: '1',
                customerId: '1',
                professionalId: null,
                paymentMethod: null,
                customer: customerData,
                professional: null
            };
            
            // Mock du retour Prisma pour la recherche de la réservation
            prismaMock.booking.findUnique.mockResolvedValue(bookingData);
            
            // Mock pour les deux mises à jour de statut
            prismaMock.booking.update.mockResolvedValueOnce({
                ...bookingData,
                status: BookingStatus.PAYMENT_PROCESSING
            }).mockResolvedValueOnce({
                ...bookingData,
                status: BookingStatus.PAYMENT_COMPLETED
            });

            // Appel de la méthode à tester
            const result = await bookingService.processPayment('1', 'payment123');

            // Vérifications
            expect(result).toBeDefined();
            expect(result.getStatus()).toBe(BookingStatus.PAYMENT_COMPLETED);
            expect(prismaMock.booking.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(prismaMock.booking.update).toHaveBeenCalledTimes(2);
            expect(prismaMock.booking.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: BookingStatus.PAYMENT_PROCESSING }
            });
            expect(prismaMock.booking.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: BookingStatus.PAYMENT_COMPLETED }
            });
        });
    });

    describe('Cycle de vie complet d\'une réservation', () => {
        it('devrait gérer le cycle de vie complet d\'une réservation de déménagement', async () => {
            // ************************************************************************
            // PHASE DE PRÉPARATION: DÉFINITION DES OBJETS ET DES MOCKS
            // ************************************************************************
            
            // DTO de demande de devis - Informations brutes saisies par l'utilisateur 
            const quoteRequestDTO = {
                type: QuoteRequestType.MOVING,
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789',
                pickupAddress: '123 Rue de Départ',
                pickupCity: 'Ville de Départ',
                pickupPostalCode: '12345',
                pickupCountry: 'France',
                deliveryAddress: '456 Rue d\'Arrivée',
                deliveryCity: 'Ville d\'Arrivée',
                deliveryPostalCode: '67890',
                deliveryCountry: 'France',
                moveDate: '2024-06-15',
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
                options: {
                    packaging: true,
                    furniture: false,
                    fragile: true,
                    storage: false,
                    disassembly: true,
                    unpacking: false,
                    supplies: true,
                    fragileItems: false
                },
                totalAmount: 450
            };

            // ************************************************************************
            // ÉTAPE 1 - MOCK POUR CRÉATION DE LA DEMANDE DE DEVIS
            // ************************************************************************
            
            // Mock des données pour création d'un QuoteRequest
            const quoteRequestDbData = {
                id: '1',
                type: QuoteRequestType.MOVING,
                status: QuoteRequestStatus.TEMPORARY,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                temporaryId: 'temp123',
                quoteData: quoteRequestDTO
            };
            
            // Mock pour la création du moving
            const movingDbData = {
                id: '1',
                quoteRequestId: '1',
                moveDate: new Date(quoteRequestDTO.moveDate),
                pickupAddress: quoteRequestDTO.pickupAddress,
                pickupCity: quoteRequestDTO.pickupCity,
                pickupPostalCode: quoteRequestDTO.pickupPostalCode,
                pickupCountry: quoteRequestDTO.pickupCountry,
                pickupFloor: quoteRequestDTO.pickupFloor,
                pickupElevator: quoteRequestDTO.pickupElevator,
                pickupCarryDistance: quoteRequestDTO.pickupCarryDistance,
                deliveryAddress: quoteRequestDTO.deliveryAddress,
                deliveryCity: quoteRequestDTO.deliveryCity,
                deliveryPostalCode: quoteRequestDTO.deliveryPostalCode,
                deliveryCountry: quoteRequestDTO.deliveryCountry,
                deliveryFloor: quoteRequestDTO.deliveryFloor,
                deliveryElevator: quoteRequestDTO.deliveryElevator,
                deliveryCarryDistance: quoteRequestDTO.deliveryCarryDistance,
                volume: quoteRequestDTO.volume,
                distance: quoteRequestDTO.distance,
                tollCost: quoteRequestDTO.tollCost,
                fuelCost: quoteRequestDTO.fuelCost,
                options: quoteRequestDTO.options
            };
            
            // Set up des mocks Prisma pour l'étape 1
            prismaMock.quoteRequest.create.mockResolvedValue(quoteRequestDbData);
            prismaMock.moving.create.mockResolvedValue(movingDbData);
            
            // ************************************************************************
            // ÉTAPE 2 - MOCK POUR FINALISATION DE LA RÉSERVATION
            // ************************************************************************
            
            // Mock pour recherche QuoteRequest
            prismaMock.quoteRequest.findUnique.mockResolvedValue(quoteRequestDbData);
            
            // Mock pour recherche client (pas trouvé)
            prismaMock.customer.findUnique.mockResolvedValue(null);
            
            // Mock pour création client
            const customerDbData = {
                id: '1',
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
                quoteHistory: []
            };
            prismaMock.customer.create.mockResolvedValue(customerDbData);
            
            // Mock pour création booking
            const bookingDbData = {
                id: '1',
                type: BookingType.MOVING_QUOTE,
                status: BookingStatus.DRAFT,
                totalAmount: 450,
                createdAt: new Date(),
                updatedAt: new Date(),
                scheduledDate: new Date(quoteRequestDTO.moveDate),
                quoteRequestId: '1',
                customerId: '1',
                professionalId: null,
                paymentMethod: null,
                customer: customerDbData,
                professional: null,
                conversation: { messages: [] }
            };
            prismaMock.booking.create.mockResolvedValue(bookingDbData);
            
            // Mock pour update QuoteRequest status
            prismaMock.quoteRequest.update.mockResolvedValue({
                ...quoteRequestDbData,
                status: QuoteRequestStatus.CONVERTED
            });
            
            // ************************************************************************
            // ÉTAPE 3 - MOCK POUR TRAITEMENT DU PAIEMENT
            // ************************************************************************
            
            // Mock pour recherche booking
            prismaMock.booking.findUnique.mockResolvedValue(bookingDbData);
            
            // Mock pour premier update status (PAYMENT_PROCESSING)
            prismaMock.booking.update.mockResolvedValueOnce({
                ...bookingDbData,
                status: BookingStatus.PAYMENT_PROCESSING
            });
            
            // Mock pour second update status (PAYMENT_COMPLETED)
            prismaMock.booking.update.mockResolvedValueOnce({
                ...bookingDbData,
                status: BookingStatus.PAYMENT_COMPLETED
            });
            
            // ************************************************************************
            // EXÉCUTION DU FLUX COMPLET EN 3 ÉTAPES 
            // ************************************************************************

            // ÉTAPE 1: CRÉATION DE LA DEMANDE DE DEVIS
            const createdQuoteRequest = await bookingService.createQuoteRequest(quoteRequestDTO);
            
            // Vérification de la demande de devis
            expect(createdQuoteRequest).toBeDefined();
            expect(createdQuoteRequest.getType()).toBe(QuoteRequestType.MOVING);
            expect(createdQuoteRequest.getStatus()).toBe(QuoteRequestStatus.TEMPORARY);
            expect(prismaMock.quoteRequest.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.moving.create).toHaveBeenCalledTimes(1);

            // ÉTAPE 2: FINALISATION DE LA RÉSERVATION
            const booking = await bookingService.finalizeBooking('1', {
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '0123456789'
            });
            
            // Vérification de la réservation en attente de paiement
            expect(booking).toBeDefined();
            expect(booking.getStatus()).toBe(BookingStatus.DRAFT);
            expect(booking.getCustomer().getEmail()).toBe('jean.dupont@example.com');
            expect(prismaMock.quoteRequest.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(prismaMock.customer.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.booking.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.quoteRequest.update).toHaveBeenCalledTimes(1);

            // ÉTAPE 3: TRAITEMENT DU PAIEMENT
            const confirmedReservation = await bookingService.processPayment('1', 'payment123');
            
            // Vérification de la réservation confirmée après paiement
            expect(confirmedReservation).toBeDefined();
            expect(confirmedReservation.getStatus()).toBe(BookingStatus.PAYMENT_COMPLETED);
            expect(confirmedReservation.getTotalAmount().getAmount()).toBe(450);
            expect(prismaMock.booking.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(prismaMock.booking.update).toHaveBeenCalledTimes(2);
        });
    });
}); 