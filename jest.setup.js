// Configuration globale pour les tests Jest
require('@testing-library/jest-dom');
const { PrismaClient } = require('@prisma/client');

// Définir les objets globaux nécessaires pour Next.js
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || '';
    this.headers = new Headers(init?.headers);
    this._body = body;
  }

  json() {
    return Promise.resolve(
      typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    );
  }
  
  text() {
    return Promise.resolve(String(this._body));
  }
};

global.Headers = class Headers {
  constructor(init) {
    this._headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase());
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase());
  }
  
  delete(name) {
    this._headers.delete(name.toLowerCase());
  }
  
  entries() {
    return this._headers.entries();
  }
};

// Augmenter la durée maximale du timeout pour les tests d'intégration
jest.setTimeout(15000);

// Créer une instance globale de Prisma
const prisma = new PrismaClient();

// Exécuter avant tous les tests
beforeAll(async () => {
  // Connexion à la base de données
  try {
    await prisma.$connect();
    console.log('Connexion à la base de données établie pour les tests');
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    throw error;
  }
});

// Nettoyer avant chaque test pour assurer un environnement propre
beforeEach(async () => {
  try {
    // Réinitialiser les mocks externes
    if (typeof jest !== 'undefined') {
      jest.resetModules();
    }
    
    // Réinitialiser spécifiquement le mock de Stripe
    try {
      const { StripePaymentService } = require('./src/quotation/infrastructure/services/__mocks__/StripePaymentService');
      if (StripePaymentService && typeof StripePaymentService.resetMock === 'function') {
        StripePaymentService.resetMock();
      }
    } catch (e) {
      // Ignorer les erreurs si le module n'est pas trouvé
      console.log('Info: Stripe mock module not found or could not be reset');
    }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des mocks:', error);
  }
});

// Nettoyer après chaque test pour l'isolement des données
afterEach(async () => {
  // Nettoyer les tables de test en commençant par les tables avec des contraintes de clé étrangère
  // L'ordre est important pour respecter les contraintes d'intégrité référentielle
  try {
    await prisma.moving.deleteMany({});
    await prisma.pack.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log('Nettoyage de la base de données terminé');
  } catch (error) {
    console.error('Erreur lors du nettoyage des tables:', error);
    // Ne pas faire échouer les tests en cas d'erreur de nettoyage
  }
  
  // Réinitialiser tous les mocks
  jest.clearAllMocks();
});

// Fermer la connexion après tous les tests
afterAll(async () => {
  await prisma.$disconnect();
  console.log('Déconnexion de la base de données');
});

// Configuration des logs pour les tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}; 