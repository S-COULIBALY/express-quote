// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add assertion support for using 'to' and 'expect' in TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      // Définir ici les commandes personnalisées si nécessaire
    }
  }
}

// Configure Cypress Chai assertions
// Ceci permet d'utiliser expect(...).to.whatever() sans erreurs TypeScript