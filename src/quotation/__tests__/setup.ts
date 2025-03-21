// Configuration globale pour les tests
import '@testing-library/jest-dom';

// Réinitialisation des mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Configuration du timeout global pour les tests
jest.setTimeout(10000); 