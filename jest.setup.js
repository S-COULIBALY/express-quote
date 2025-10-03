// Configuration globale pour les tests Jest
require('@testing-library/jest-dom');
const { PrismaClient } = require('@prisma/client');

// Polyfill pour fetch dans les tests d'intégration
if (typeof global.fetch === 'undefined') {
  // Essayer d'utiliser le fetch natif de Node.js si disponible (Node 18+)
  if (typeof globalThis.fetch !== 'undefined') {
    global.fetch = globalThis.fetch;
    global.Request = globalThis.Request;
    global.Response = globalThis.Response;
    global.Headers = globalThis.Headers;
  } else {
    // Fallback vers node-fetch pour les versions plus anciennes de Node
    try {
      const fetch = require('node-fetch');
      global.fetch = fetch.default || fetch;
      global.Request = fetch.Request;
      global.Response = fetch.Response;
      global.Headers = fetch.Headers;
    } catch (e) {
      console.warn('node-fetch not available, using mock fetch for tests');
      // Fallback vers une implementation basique qui fait de vrais appels HTTP
      global.fetch = async (url, options = {}) => {
        const http = require(url.startsWith('https:') ? 'https' : 'http');
        const urlObj = new URL(url);
        
        return new Promise((resolve, reject) => {
          const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
          };
          
          const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: {
                  get: (name) => res.headers[name.toLowerCase()],
                  has: (name) => name.toLowerCase() in res.headers
                },
                json: () => Promise.resolve(JSON.parse(data)),
                text: () => Promise.resolve(data),
                ok: res.statusCode >= 200 && res.statusCode < 300
              });
            });
          });
          
          req.on('error', reject);
          
          if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
          }
          
          req.end();
        });
      };
    }
  }
}

// Polyfill pour TextDecoder/TextEncoder (problème Jest/Node.js)
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder, TextEncoder } = require('util');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// Polyfill pour setImmediate (nodemailer)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (handle) => clearTimeout(handle);
}

// Polyfill pour Blob (problème Jest/Node.js)
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.options = options;
    }
    
    text() {
      return Promise.resolve(this.parts.join(''));
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  };
}

// Les objets Request, Response, Headers sont maintenant fournis par le polyfill fetch ci-dessus

// Augmenter la durée maximale du timeout pour les tests d'intégration
jest.setTimeout(15000);

// Créer une instance globale de Prisma avec configuration de test
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/test.db'
    }
  }
});

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
  // Attendre un peu pour que les jobs en cours se terminent avant de nettoyer
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Nettoyer les tables de test en commençant par les tables avec des contraintes de clé étrangère
  // L'ordre est important pour respecter les contraintes d'intégrité référentielle
  try {
    // Vérifier si la table notification existe avant de la nettoyer
    if (prisma.notification && typeof prisma.notification.deleteMany === 'function') {
      await prisma.notification.deleteMany({});
      console.log('Nettoyage de la base de données terminé (tables notifications)');
    } else {
      console.log('Table notification non disponible, nettoyage ignoré');
    }
  } catch (error) {
    console.warn('Info: Nettoyage de la base de données non critique:', error.message);
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