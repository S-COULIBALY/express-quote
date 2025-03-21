module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/quotation'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/tests/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/src/quotation/__tests__/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/quotation/**/*.{ts,tsx}',
    '!src/quotation/**/*.d.ts',
    '!src/quotation/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}; 