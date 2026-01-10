/**
 * 🧪 **SETUP JEST - Tests de Réservation**
 * 
 * Configuration globale pour les tests Jest
 */

import '@testing-library/jest-dom';

// Mock des modules Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}));

// Mock des modules Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(),
    confirmPayment: jest.fn(),
    confirmSetup: jest.fn(),
    retrievePaymentIntent: jest.fn()
  }))
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  PaymentElement: () => React.createElement('div', { 'data-testid': 'payment-element' }),
  useStripe: () => ({
    confirmPayment: jest.fn(),
    elements: jest.fn()
  }),
  useElements: () => ({
    getElement: jest.fn()
  })
}));

// Mock des modules de base de données
jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    quoteRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    $connect: jest.fn(),
    $disconnect: jest.fn()
  }
}));

// Mock des modules de notification
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    promise: jest.fn()
  }
}));

// Mock des modules de logging
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock des modules de validation
jest.mock('@/lib/validation', () => ({
  validateEmail: jest.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePhone: jest.fn((phone: string) => /^(\+33|0)[1-9](\d{8})$/.test(phone)),
  validateRequired: jest.fn((value: any) => value !== null && value !== undefined && value !== '')
}));

// Mock des modules d'API
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock des modules de cache
jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
}));

// Mock des modules de configuration
jest.mock('@/lib/config', () => ({
  config: {
    stripe: {
      publishableKey: 'pk_test_123',
      secretKey: 'sk_test_123'
    },
    database: {
      url: 'postgresql://test:test@localhost:5432/test'
    }
  }
}));

// Configuration des variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock des modules de test
global.fetch = jest.fn();
global.console = {
  ...console,
  // Supprimer les logs de console pendant les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock des modules de test Playwright
jest.mock('@playwright/test', () => ({
  test: {
    describe: jest.fn(),
    beforeEach: jest.fn(),
    afterEach: jest.fn(),
    afterAll: jest.fn(),
    beforeAll: jest.fn()
  },
  expect: jest.fn()
}));

// Configuration des mocks globaux
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock des modules de test
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Configuration des timeouts
jest.setTimeout(30000);

// Configuration des mocks de test
beforeEach(() => {
  // Nettoyer les mocks avant chaque test
  jest.clearAllMocks();
  
  // Réinitialiser les mocks globaux
  (global.fetch as jest.Mock).mockClear();
  
  // Réinitialiser les mocks de console
  jest.clearAllMocks();
});

afterEach(() => {
  // Nettoyer après chaque test
  jest.clearAllMocks();
});

// Configuration des mocks de test
afterAll(() => {
  // Nettoyer après tous les tests
  jest.restoreAllMocks();
});