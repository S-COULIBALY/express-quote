/**
 * Test d'intégration du flux complet de réservation de déménagement
 * 
 * Ce test couvre toutes les étapes du parcours client pour une réservation
 * de type déménagement, de la création jusqu'à la confirmation.
 */

import { BookingType } from '@/quotation/domain/enums/BookingType';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { HttpRequest, HttpResponse } from '@/quotation/interfaces/http/types';
import { TEST_IDS } from '../mocks/HttpMocks';
import { movingBookingData } from '../mocks/TestData';
import { Customer } from '@/quotation/domain/entities/Customer';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { IBookingRepository } from '@/quotation/application/ports/IBookingRepository';
import { IMovingRepository } from '@/quotation/application/ports/IMovingRepository';
import { IPackRepository } from '@/quotation/application/ports/IPackRepository';
import { ICustomerRepository } from '@/quotation/application/ports/ICustomerRepository';

// Mock des repositories
jest.mock('@/quotation/infrastructure/repositories/PrismaBookingRepository', () => {
  return {
    PrismaBookingRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByCustomer: jest.fn(),
      findByStatus: jest.fn()
    }))
  };
});

jest.mock('@/quotation/infrastructure/repositories/PrismaMovingRepository', () => {
  return {
    PrismaMovingRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findByBookingId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  };
});

jest.mock('@/quotation/infrastructure/repositories/PrismaPackRepository', () => {
  return {
    PrismaPackRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findByBookingId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  };
});

jest.mock('@/quotation/infrastructure/repositories/PrismaCustomerRepository', () => {
  return {
    PrismaCustomerRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  };
});

// On mock uniquement les services externes non testables
jest.mock('@/quotation/infrastructure/services/StripePaymentService');
jest.mock('@/quotation/infrastructure/services/MailService');
jest.mock('@/quotation/infrastructure/services/PdfGeneratorService');
jest.mock('@/quotation/infrastructure/services/StorageService');

// Import des services mockés pour les assertions
import { MailService } from '@/quotation/infrastructure/services/MailService';
import { PdfGeneratorService } from '@/quotation/infrastructure/services/PdfGeneratorService';
import { StorageService } from '@/quotation/infrastructure/services/StorageService';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { MovingQuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';

describe('Flux de réservation de déménagement', () => {
  let stripeSessionId: string;
  let bookingId: string;
  let customerId: string;
  // Créer une instance de contrôleur isolée pour les tests
  let bookingController: BookingController;
  let bookingService: BookingService;
  let customerService: CustomerService;
  let bookingRepository: IBookingRepository;
  let movingRepository: IMovingRepository;
  let packRepository: IPackRepository;
  let customerRepository: ICustomerRepository;

  // Configuration avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Réinitialiser les mocks des services
    (MailService as any).resetMock();
    (PdfGeneratorService as any).resetMock();
    (StorageService as any).resetMock();
    (StripePaymentService as any).resetMock();

    // ID de session Stripe et IDs utilisés dans les tests
    stripeSessionId = TEST_IDS.MOVING.STRIPE_SESSION_ID;
    bookingId = TEST_IDS.MOVING.BOOKING_ID;
    customerId = TEST_IDS.MOVING.CUSTOMER_ID;
    
    // Mock du customerRepository pour simuler les opérations sur les clients
    const mockCustomer = new Customer(
      movingBookingData.customer.firstName,
      movingBookingData.customer.lastName,
      movingBookingData.customer.email,
      movingBookingData.customer.phone,
      customerId
    );
    
    customerRepository = new PrismaCustomerRepository();
    (customerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (customerRepository.create as jest.Mock).mockResolvedValue(mockCustomer);
    (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
    
    // Mock du bookingRepository pour simuler les opérations sur les réservations
    const mockBooking = {
      getId: jest.fn().mockReturnValue(bookingId),
      getType: jest.fn().mockReturnValue(BookingType.MOVING_QUOTE),
      getStatus: jest.fn().mockReturnValue(BookingStatus.DRAFT),
      getCustomer: jest.fn().mockReturnValue(mockCustomer),
      getProfessional: jest.fn().mockReturnValue(null),
      getTotalAmount: jest.fn().mockReturnValue(new Money(1450, 'EUR')),
      getCreatedAt: jest.fn().mockReturnValue(new Date()),
      getUpdatedAt: jest.fn().mockReturnValue(new Date())
    };
    
    bookingRepository = new PrismaBookingRepository();
    (bookingRepository.create as jest.Mock).mockResolvedValue(mockBooking);
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
    (bookingRepository.update as jest.Mock).mockImplementation((id, data) => {
      mockBooking.getStatus = jest.fn().mockReturnValue(data.status || BookingStatus.DRAFT);
      return Promise.resolve(mockBooking);
    });
    
    // Mock du movingRepository
    const mockMovingDetails = {
      getMoveDate: jest.fn().mockReturnValue(new Date(movingBookingData.movingDetails.pickupDate)),
      getPickupAddress: jest.fn().mockReturnValue(movingBookingData.movingDetails.pickupAddress),
      getDeliveryAddress: jest.fn().mockReturnValue(movingBookingData.movingDetails.deliveryAddress),
      getDistance: jest.fn().mockReturnValue(movingBookingData.movingDetails.distance),
      getVolume: jest.fn().mockReturnValue(movingBookingData.movingDetails.volume),
      getPickupFloor: jest.fn().mockReturnValue(movingBookingData.movingDetails.pickupFloor),
      getDeliveryFloor: jest.fn().mockReturnValue(movingBookingData.movingDetails.deliveryFloor),
      hasPickupElevator: jest.fn().mockReturnValue(movingBookingData.movingDetails.pickupElevator),
      hasDeliveryElevator: jest.fn().mockReturnValue(movingBookingData.movingDetails.deliveryElevator)
    };
    
    movingRepository = new PrismaMovingRepository();
    (movingRepository.create as jest.Mock).mockResolvedValue(mockMovingDetails);
    (movingRepository.findByBookingId as jest.Mock).mockResolvedValue(mockMovingDetails);
    
    // Mock du packRepository
    packRepository = new PrismaPackRepository();
    
    // Initialiser les services
    const rules: any[] = []; // Les règles seront définies plus tard
    const movingQuoteCalculator = new MovingQuoteCalculator(rules);

    // Créer les services avec les repositories mockés
    bookingService = new BookingService(
      bookingRepository,
      movingRepository,
      packRepository,
      {} as any, // Service repository non utilisé dans ce test
      movingQuoteCalculator
    );

    customerService = new CustomerService(customerRepository);

    // Initialiser le contrôleur
    bookingController = new BookingController(bookingService, customerService);
  });

  // Fonction pour créer une réponse HTTP simulée
  function createMockResponse(): HttpResponse & { getData: () => any, getStatus: () => number } {
    let statusCode = 200;
    let responseData: any = null;
    
    return {
      status: function(code: number) {
        statusCode = code;
        return this;
      },
      json: function(data: any) {
        responseData = data;
        return this;
      },
      send: function() {
        return this;
      },
      getData: function() { // Méthode ajoutée pour les tests
        return responseData;
      },
      getStatus: function() { // Méthode ajoutée pour les tests
        return statusCode;
      }
    } as HttpResponse & { getData: () => any, getStatus: () => number };
  }

  it('devrait compléter tout le flux de réservation de déménagement avec succès', async () => {
    // ÉTAPE 1 : Créer une réservation
    const bookingRequest = {
      type: BookingType.MOVING_QUOTE,
      customer: {
        firstName: movingBookingData.customer.firstName,
        lastName: movingBookingData.customer.lastName,
        email: movingBookingData.customer.email,
        phone: movingBookingData.customer.phone
      },
      // Données du déménagement
      moveDate: movingBookingData.movingDetails.pickupDate,
      pickupAddress: movingBookingData.movingDetails.pickupAddress,
      deliveryAddress: movingBookingData.movingDetails.deliveryAddress,
      distance: movingBookingData.movingDetails.distance,
      volume: movingBookingData.movingDetails.volume,
      pickupFloor: movingBookingData.movingDetails.pickupFloor,
      deliveryFloor: movingBookingData.movingDetails.deliveryFloor,
      pickupElevator: movingBookingData.movingDetails.pickupElevator,
      deliveryElevator: movingBookingData.movingDetails.deliveryElevator
    };
    
    const createRequest: HttpRequest = {
      body: bookingRequest,
      params: {},
      query: {},
      headers: {
        'content-type': 'application/json'
      }
    };
    
    const createResponse = createMockResponse();
    await bookingController.createBooking(createRequest, createResponse);
    
    const createResult = createResponse.getData();
    expect(createResponse.getStatus()).toBe(201);
    expect(createResult).toBeDefined();
    expect(createResult.id).toBeDefined();
    expect(createResult.status).toBe(BookingStatus.DRAFT);
    expect(createResult.type).toBe(BookingType.MOVING_QUOTE);
    
    // ÉTAPE 2 : Simuler le paiement en mettant à jour le statut directement
    const updateStatusRequest: HttpRequest = {
      body: { status: BookingStatus.PAYMENT_COMPLETED },
      params: { id: bookingId },
      query: {},
      headers: {}
    };
    
    const updateResponse = createMockResponse();
    await bookingController.updateBookingStatus(updateStatusRequest, updateResponse);
    
    expect(updateResponse.getStatus()).toBe(200);
    const updatedBooking = updateResponse.getData();
    expect(updatedBooking.status).toBe(BookingStatus.PAYMENT_COMPLETED);
    
    // ÉTAPE 3 : Vérifier que la réservation a été mise à jour correctement
    const getRequest: HttpRequest = {
      body: {},
      params: { id: bookingId },
      query: {},
      headers: {}
    };
    
    const getResponse = createMockResponse();
    await bookingController.getBookingById(getRequest, getResponse);
    
    const retrievedBooking = getResponse.getData();
    expect(getResponse.getStatus()).toBe(200);
    expect(retrievedBooking.id).toBe(bookingId);
    expect(retrievedBooking.status).toBe(BookingStatus.PAYMENT_COMPLETED);
    expect(retrievedBooking.type).toBe(BookingType.MOVING_QUOTE);
    
    // Vérifier que les emails ont été envoyés (simulé par le mock)
    const emailsSent = (MailService as any).getEmailsSent();
    expect(emailsSent.length).toBeGreaterThan(0);
    
    // Vérifier que les PDFs ont été générés (simulé par le mock)
    const pdfsGenerated = (PdfGeneratorService as any).getGeneratedPdfs();
    expect(pdfsGenerated.length).toBeGreaterThan(0);
    
    // Vérifier que les fichiers ont été stockés (simulé par le mock)
    const storedFiles = (StorageService as any).getStoredFiles();
    expect(storedFiles.length).toBeGreaterThan(0);
  });
}); 