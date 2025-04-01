const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/__mocks__/uuid',
    '^next/server$': '<rootDir>/__mocks__/next/server',
    '^next/headers$': '<rootDir>/__mocks__/next/headers'
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts',
    '<rootDir>/src/tests/**/*.test.tsx',
  ],
  // Ajout de la configuration des mocks automatiques
  automock: false,
  // Configurer les dossiers à ignorer
  modulePathIgnorePatterns: [
    '<rootDir>/.next/'
  ],
  // Permettre d'utiliser les importations en @/
  modulePaths: ['<rootDir>'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  // Transformer tous les modules sauf node_modules qui ne sont pas dans cette liste
  transformIgnorePatterns: [
    '/node_modules/'
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 