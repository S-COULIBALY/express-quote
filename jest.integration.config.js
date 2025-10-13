// Configuration Jest pour les tests d'intégration (BDD)
// Exécuter avec: npm run test:integration
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // ✅ NOUVEAU: Pointer vers la nouvelle structure
  roots: ['<rootDir>/src/__tests__/integration'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  automock: false,
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  modulePaths: ['<rootDir>'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },
  testTimeout: 30000,
  unmockedModulePathPatterns: [
    '/node_modules/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library)/)'
  ],
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test'
    }
  }
}; 