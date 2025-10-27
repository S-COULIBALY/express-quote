/**
 * 🧪 **CONFIGURATION JEST POUR LES TESTS DE FLUX**
 * 
 * Ce fichier configure Jest pour les tests de flux de réservation
 * avec tous les mocks et configurations nécessaires.
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills pour Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock des modules externes
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useParams: () => ({ id: 'test-id' }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock des services Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        on: jest.fn(),
        destroy: jest.fn(),
      })),
    })),
    confirmPayment: jest.fn(() => Promise.resolve({ error: null })),
  })),
}));

// Mock des APIs externes
global.fetch = jest.fn();

// Mock des notifications
jest.mock('@/notifications', () => ({
  default: {
    initialize: jest.fn(() => Promise.resolve({
      sendEmail: jest.fn(() => Promise.resolve({ success: true })),
      sendSMS: jest.fn(() => Promise.resolve({ success: true })),
      sendWhatsApp: jest.fn(() => Promise.resolve({ success: true })),
    })),
  },
}));

// Mock des services de base de données
jest.mock('@/quotation/infrastructure/repositories/PrismaBookingRepository', () => ({
  PrismaBookingRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('@/quotation/infrastructure/repositories/PrismaCustomerRepository', () => ({
  PrismaCustomerRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  })),
}));

jest.mock('@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository', () => ({
  PrismaQuoteRequestRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    findByTemporaryId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  })),
}));

// Mock des services de calcul de prix
jest.mock('@/hooks/shared/useCentralizedPricing', () => ({
  useCentralizedPricing: jest.fn(() => ({
    calculatePrice: jest.fn(() => Promise.resolve({
      basePrice: 100,
      totalPrice: 120,
      breakdown: { base: 100, tax: 20 },
    })),
    isLoading: false,
    error: null,
  })),
}));

// Mock des services de notification
jest.mock('@/internalStaffNotification/InternalStaffNotificationService', () => ({
  InternalStaffNotificationService: jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn(() => Promise.resolve({ success: true })),
    sendEmail: jest.fn(() => Promise.resolve({ success: true })),
    sendSMS: jest.fn(() => Promise.resolve({ success: true })),
  })),
}));

// Mock des services de documents
jest.mock('@/documents/application/services/DocumentNotificationService', () => ({
  DocumentNotificationService: jest.fn().mockImplementation(() => ({
    sendConfirmation: jest.fn(() => Promise.resolve({ success: true })),
    generateInvoice: jest.fn(() => Promise.resolve({ success: true })),
  })),
}));

// Configuration des variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.STRIPE_SECRET_KEY_TEST = 'sk_test_123456789';
process.env.STRIPE_PUBLISHABLE_KEY_TEST = 'pk_test_123456789';
process.env.STRIPE_WEBHOOK_SECRET_TEST = 'whsec_123456789';

// Mock des console methods pour éviter le spam dans les tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuration des timeouts
jest.setTimeout(30000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Nettoyage global
afterAll(() => {
  jest.resetAllMocks();
});

// Mock des timers pour les tests de performance
jest.useFakeTimers();

// Configuration des mocks pour les tests de flux
export const mockBookingService = {
  createQuoteRequest: jest.fn(() => Promise.resolve({
    id: 'quote_123',
    temporaryId: 'temp_123',
    status: 'pending',
  })),
  createBooking: jest.fn(() => Promise.resolve({
    id: 'booking_123',
    status: 'DRAFT',
    totalAmount: 120,
  })),
  createAndConfirmBooking: jest.fn(() => Promise.resolve({
    id: 'booking_123',
    status: 'CONFIRMED',
    totalAmount: 120,
  })),
};

export const mockCustomerService = {
  createCustomer: jest.fn(() => Promise.resolve({
    id: 'customer_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  })),
  findByEmail: jest.fn(() => Promise.resolve(null)),
};

export const mockNotificationService = {
  sendEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendSMS: jest.fn(() => Promise.resolve({ success: true })),
  sendWhatsApp: jest.fn(() => Promise.resolve({ success: true })),
};

export const mockStripeService = {
  createPaymentIntent: jest.fn(() => Promise.resolve({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret',
    status: 'requires_payment_method',
  })),
  confirmPayment: jest.fn(() => Promise.resolve({
    id: 'pi_test_123',
    status: 'succeeded',
  })),
};

// Configuration des mocks pour les tests de performance
export const mockPerformanceMetrics = {
  formLoadTime: 1500,
  priceCalculationTime: 300,
  submissionTime: 2000,
  paymentTime: 5000,
};

// Configuration des mocks pour les tests d'erreur
export const mockErrorScenarios = {
  networkError: new Error('Network error'),
  validationError: new Error('Validation failed'),
  paymentError: new Error('Payment failed'),
  serverError: new Error('Server error'),
};

// Helper pour réinitialiser tous les mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.resetAllMocks();
};

// Helper pour configurer les mocks avec des données spécifiques
export const configureMocks = (config: any) => {
  if (config.bookingService) {
    Object.assign(mockBookingService, config.bookingService);
  }
  if (config.customerService) {
    Object.assign(mockCustomerService, config.customerService);
  }
  if (config.notificationService) {
    Object.assign(mockNotificationService, config.notificationService);
  }
  if (config.stripeService) {
    Object.assign(mockStripeService, config.stripeService);
  }
};

// Configuration des tests de performance
export const performanceConfig = {
  timeout: 30000,
  retry: 3,
  interval: 1000,
};

// Configuration des tests de notification
export const notificationConfig = {
  email: {
    enabled: false,
    simulation: true,
  },
  sms: {
    enabled: false,
    simulation: true,
  },
  whatsapp: {
    enabled: false,
    simulation: true,
  },
};

// Configuration des tests de paiement
export const paymentConfig = {
  stripe: {
    mode: 'test',
    publishableKey: 'pk_test_123456789',
    secretKey: 'sk_test_123456789',
    webhookSecret: 'whsec_123456789',
  },
  timeout: 30000,
  retry: 3,
};

// Configuration des tests de base de données
export const databaseConfig = {
  url: 'postgresql://test:test@localhost:5432/test',
  isolation: true,
  cleanup: true,
};

// Export de toutes les configurations
export {
  mockBookingService,
  mockCustomerService,
  mockNotificationService,
  mockStripeService,
  mockPerformanceMetrics,
  mockErrorScenarios,
  resetAllMocks,
  configureMocks,
  performanceConfig,
  notificationConfig,
  paymentConfig,
  databaseConfig,
};
