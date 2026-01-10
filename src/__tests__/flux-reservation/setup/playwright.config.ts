/**
 * 🎭 **CONFIGURATION PLAYWRIGHT POUR LES TESTS E2E**
 * 
 * Ce fichier configure Playwright pour les tests end-to-end
 * du flux de réservation avec tous les navigateurs et options.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Répertoire des tests
  testDir: './e2e',
  
  // Répertoire des rapports
  outputDir: './test-results',
  
  // Nombre de workers en parallèle
  workers: process.env.CI ? 2 : 4,
  
  // Configuration des timeouts
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  
  // Configuration des retry
  retries: process.env.CI ? 2 : 0,
  
  // Configuration des reporters
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
    ['junit', { outputFile: './test-results/results.xml' }],
    ['list'],
  ],
  
  // Configuration globale
  use: {
    // URL de base
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Configuration des traces
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Configuration des timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Configuration des cookies
    storageState: './test-results/storage-state.json',
  },
  
  // Configuration des projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Configuration du serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Configuration des variables d'environnement
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY_TEST || 'sk_test_123456789',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY_TEST || 'pk_test_123456789',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET_TEST || 'whsec_123456789',
  },
  
  // Configuration des tests de performance
  testMatch: [
    '**/e2e/**/*.spec.ts',
    '**/e2e/**/*.test.ts',
  ],
  
  // Configuration des tests de flux
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
  
  // Configuration des hooks
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
  
  // Configuration des tests de paiement
  testOptions: {
    // Tests de paiement Stripe
    paymentTests: {
      enabled: true,
      testMode: true,
      cards: {
        success: '4242424242424242',
        failure: '4000000000000002',
        authentication: '4000002500003155',
      },
    },
    
    // Tests de notifications
    notificationTests: {
      enabled: true,
      simulation: true,
      channels: ['email', 'sms', 'whatsapp'],
    },
    
    // Tests de performance
    performanceTests: {
      enabled: true,
      thresholds: {
        formLoad: 2000,
        priceCalculation: 500,
        submission: 3000,
        payment: 5000,
      },
    },
  },
  
  // Configuration des tests de flux
  fluxTests: {
    // Tests de réservation
    reservation: {
      enabled: true,
      types: ['nettoyage', 'demenagement', 'livraison'],
      scenarios: ['success', 'failure', 'retry'],
    },
    
    // Tests de paiement
    payment: {
      enabled: true,
      methods: ['card', '3ds', 'failure'],
      currencies: ['EUR'],
    },
    
    // Tests de notification
    notification: {
      enabled: true,
      channels: ['email', 'sms', 'whatsapp'],
      scenarios: ['success', 'failure', 'retry'],
    },
  },
  
  // Configuration des tests de données
  dataTests: {
    // Tests de validation
    validation: {
      enabled: true,
      fields: ['required', 'format', 'range'],
      scenarios: ['valid', 'invalid', 'edge'],
    },
    
    // Tests de calcul de prix
    pricing: {
      enabled: true,
      scenarios: ['basic', 'discount', 'surcharge', 'edge'],
    },
    
    // Tests de base de données
    database: {
      enabled: true,
      isolation: true,
      cleanup: true,
    },
  },
  
  // Configuration des tests de sécurité
  securityTests: {
    // Tests de validation des entrées
    inputValidation: {
      enabled: true,
      scenarios: ['valid', 'invalid', 'malicious'],
    },
    
    // Tests d'authentification
    authentication: {
      enabled: true,
      scenarios: ['valid', 'invalid', 'expired'],
    },
    
    // Tests d'autorisation
    authorization: {
      enabled: true,
      scenarios: ['allowed', 'denied', 'edge'],
    },
  },
  
  // Configuration des tests de monitoring
  monitoringTests: {
    // Tests de métriques
    metrics: {
      enabled: true,
      thresholds: {
        responseTime: 2000,
        errorRate: 0.01,
        availability: 0.99,
      },
    },
    
    // Tests de logs
    logging: {
      enabled: true,
      levels: ['error', 'warn', 'info', 'debug'],
    },
    
    // Tests d'alertes
    alerts: {
      enabled: true,
      scenarios: ['threshold', 'anomaly', 'failure'],
    },
  },
});

// Configuration des tests de flux spécifiques
export const fluxTestConfig = {
  // Tests de réservation
  reservation: {
    timeout: 60000,
    retry: 2,
    scenarios: [
      'success',
      'validation-error',
      'payment-failure',
      'network-error',
    ],
  },
  
  // Tests de paiement
  payment: {
    timeout: 30000,
    retry: 3,
    scenarios: [
      'success',
      'card-declined',
      'insufficient-funds',
      '3ds-authentication',
    ],
  },
  
  // Tests de notification
  notification: {
    timeout: 15000,
    retry: 2,
    scenarios: [
      'success',
      'failure',
      'retry',
      'timeout',
    ],
  },
};

// Configuration des tests de performance
export const performanceTestConfig = {
  // Tests de chargement
  loading: {
    timeout: 10000,
    thresholds: {
      formLoad: 2000,
      priceCalculation: 500,
      submission: 3000,
    },
  },
  
  // Tests de mémoire
  memory: {
    timeout: 30000,
    thresholds: {
      heapUsed: 100 * 1024 * 1024, // 100MB
      heapTotal: 200 * 1024 * 1024, // 200MB
    },
  },
  
  // Tests de réseau
  network: {
    timeout: 15000,
    thresholds: {
      requestTime: 1000,
      responseTime: 2000,
    },
  },
};

// Configuration des tests de sécurité
export const securityTestConfig = {
  // Tests de validation
  validation: {
    timeout: 10000,
    scenarios: [
      'valid-input',
      'invalid-input',
      'malicious-input',
      'edge-cases',
    ],
  },
  
  // Tests d'authentification
  authentication: {
    timeout: 15000,
    scenarios: [
      'valid-credentials',
      'invalid-credentials',
      'expired-session',
      'brute-force',
    ],
  },
  
  // Tests d'autorisation
  authorization: {
    timeout: 10000,
    scenarios: [
      'allowed-access',
      'denied-access',
      'privilege-escalation',
      'data-leakage',
    ],
  },
};

// Export de toutes les configurations
export {
  fluxTestConfig,
  performanceTestConfig,
  securityTestConfig,
};
