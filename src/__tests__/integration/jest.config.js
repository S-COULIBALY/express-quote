/**
 * 🧪 **CONFIGURATION JEST - Tests d'Intégration**
 * 
 * Configuration Jest spécifique pour les tests d'intégration complets
 * avec base de données réelle et notifications réelles
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'integration',
  
  // Environnement Node.js (pas jsdom car on utilise des APIs serveur)
  testEnvironment: 'node',
  
  // Répertoires de tests
  testMatch: [
    '<rootDir>/src/__tests__/integration/**/*.test.{js,ts}',
    '<rootDir>/src/__tests__/integration/**/*.spec.{js,ts}'
  ],
  
  // Répertoires à ignorer
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // Configuration des modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/quotation/(.*)$': '<rootDir>/src/quotation/$1',
    '^@/notifications/(.*)$': '<rootDir>/src/notifications/$1'
  },
  
  // Setup des tests
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/integration/setup.ts'
  ],
  
  // Configuration des mocks
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform des fichiers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  
  // Variables d'environnement de test
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // Configuration des timeouts (plus long pour les tests d'intégration)
  testTimeout: 60000, // 60 secondes
  
  // Configuration des mocks globaux
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Ne pas mocker les modules par défaut (on veut tester avec les vrais services)
  clearMocks: true,
  restoreMocks: false,
  
  // Logging détaillé
  verbose: true
};

module.exports = createJestConfig(customJestConfig);

