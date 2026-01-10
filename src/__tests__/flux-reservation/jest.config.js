/**
 * 🧪 **CONFIGURATION JEST - Tests de Réservation**
 * 
 * Configuration Jest spécifique pour les tests du flux de réservation
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Chemin vers l'application Next.js
  dir: './',
});

// Configuration Jest personnalisée
const customJestConfig = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Répertoires de tests
  testMatch: [
    '<rootDir>/src/__tests__/flux-reservation/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/flux-reservation/**/*.spec.{js,jsx,ts,tsx}'
  ],
  
  // Répertoires à ignorer
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // Configuration des modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1'
  },
  
  // Setup des tests
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/flux-reservation/setup/jest.setup.ts'
  ],
  
  // Configuration des mocks
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform des fichiers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Variables d'environnement de test
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // Configuration des collecteurs de couverture
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/app/api/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Configuration des reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // Configuration des timeouts
  testTimeout: 30000,
  
  // Configuration des mocks globaux
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};

// Configuration Jest pour les tests Playwright
const playwrightConfig = {
  ...customJestConfig,
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/__tests__/flux-reservation/e2e/**/*.spec.{js,ts}',
    '<rootDir>/src/__tests__/flux-reservation/integration/**/*.spec.{js,ts}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/flux-reservation/setup/playwright.setup.ts'
  ]
};

module.exports = {
  // Configuration par défaut (tests unitaires)
  ...createJestConfig(customJestConfig),
  
  // Configuration pour les tests Playwright
  projects: [
    {
      displayName: 'unit',
      ...createJestConfig(customJestConfig)
    },
    {
      displayName: 'integration',
      ...createJestConfig(playwrightConfig)
    }
  ]
};
