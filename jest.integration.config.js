// Configuration Jest pour les tests d'intégration
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  roots: ['<rootDir>/src/tests/integration'],
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
      isolatedModules: true,
      tsconfig: 'tsconfig.json',
    }]
  },
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    }
  },
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