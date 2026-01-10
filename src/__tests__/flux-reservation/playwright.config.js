/**
 * 🎭 **CONFIGURATION PLAYWRIGHT - Tests de Réservation**
 * 
 * Configuration Playwright pour les tests E2E et d'intégration
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Répertoire de test
  testDir: './',
  
  // Filtres de test
  testMatch: [
    '**/e2e/**/*.spec.{js,ts}',
    '**/integration/**/*.spec.{js,ts}'
  ],
  
  // Configuration des timeouts
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // Configuration des tests en parallèle
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Configuration des reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  // Configuration globale
  use: {
    // URL de base
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Configuration des traces
    trace: 'on-first-retry',
    
    // Configuration des screenshots
    screenshot: 'only-on-failure',
    
    // Configuration des vidéos
    video: 'retain-on-failure',
    
    // Configuration des timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  
  // Configuration des projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // Configuration du serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  
  // Configuration des variables d'environnement
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXT_PUBLIC_BASE_URL: 'http://localhost:3000'
  }
});
