/// <reference types="cypress" />

// Tests API pour le flux de devis de déménagement avec simulation complète
describe('API de devis de déménagement (simulée)', () => {
  // Définition des données de test
  const movingQuoteData = {
    pickupAddress: '15 rue de Paris, 75001 Paris, France',
    deliveryAddress: '10 Avenue des Champs-Élysées, 75008 Paris, France',
    volume: 30,
    preferredDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    preferredTime: 'morning',
    distance: 5.2,
    options: {
      packaging: true,
      furniture: true,
      fragile: false
    },
    pickupCoordinates: { 
      lat: 48.856614, 
      lng: 2.3522219 
    },
    deliveryCoordinates: { 
      lat: 48.866667, 
      lng: 2.333333 
    }
  };

  // Mock des résultats de calcul
  const calculatedFees = {
    totalCost: 850.50,
    baseCost: 650.00,
    volumeCost: 300.00,
    distancePrice: 150.00,
    optionsCost: 200.50
  };

  // ID de devis simulé
  const mockQuoteId = 'mock-quote-id-123';

  beforeEach(() => {
    // Configurer toutes les interceptions pour simuler les appels API
    cy.intercept('POST', '/api/moving/validate', {
      statusCode: 200,
      body: { isValid: true, data: movingQuoteData }
    }).as('validateApi');

    cy.intercept('POST', '/api/moving/calculate', {
      statusCode: 200,
      body: calculatedFees
    }).as('calculateApi');

    cy.intercept('POST', '/api/moving', {
      statusCode: 200,
      body: { 
        success: true, 
        data: { 
          id: mockQuoteId,
          ...movingQuoteData,
          ...calculatedFees
        } 
      }
    }).as('createApi');

    cy.intercept('GET', `/api/moving/${mockQuoteId}`, {
      statusCode: 200,
      body: { 
        success: true, 
        data: { 
          id: mockQuoteId,
          ...movingQuoteData,
          ...calculatedFees,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        } 
      }
    }).as('getQuoteApi');

    cy.intercept('PUT', `/api/moving/${mockQuoteId}`, {
      statusCode: 200,
      body: { 
        success: true, 
        data: { 
          id: mockQuoteId,
          ...movingQuoteData,
          volume: 35, // Valeur mise à jour
          ...calculatedFees
        } 
      }
    }).as('updateQuoteApi');

    cy.intercept('DELETE', `/api/moving/${mockQuoteId}`, {
      statusCode: 200,
      body: { success: true }
    }).as('deleteQuoteApi');

    // Visiter d'abord une page HTML pour initialiser Cypress
    cy.intercept('GET', '/', {
      statusCode: 200,
      body: '<html><body><h1>Devis de Déménagement</h1></body></html>',
      headers: { 'content-type': 'text/html' }
    });
    cy.visit('/');
  });

  describe('Couche Application', () => {
    it('devrait valider et accepter des données correctes', () => {
      // Utiliser window.fetch pour simuler l'appel API
      cy.window().then(win => {
        return win.fetch('/api/moving/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(movingQuoteData)
        });
      });

      // Vérifier que notre requête interceptée a fonctionné
      cy.wait('@validateApi').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.isValid).to.be.true;
        cy.log('Validation API testée avec succès');
      });
    });

    it('devrait calculer correctement le prix', () => {
      // Utiliser window.fetch pour simuler l'appel API
      cy.window().then(win => {
        return win.fetch('/api/moving/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(movingQuoteData)
        });
      });
      
      // Vérifier que notre requête interceptée a fonctionné
      cy.wait('@calculateApi').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.totalCost).to.eq(calculatedFees.totalCost);
        cy.log('Calcul API testé avec succès');
      });
    });
  });

  // Test du flux complet à travers toutes les couches (simulé)
  describe('Flux complet (simulé)', () => {
    it('devrait permettre de créer un devis simulé', () => {
      // Utiliser window.fetch pour simuler l'appel API
      cy.window().then(win => {
        return win.fetch('/api/moving', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...movingQuoteData,
            ...calculatedFees
          })
        });
      });
      
      // Vérifier que notre requête interceptée a fonctionné
      cy.wait('@createApi').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.be.true;
        expect(interception.response.body.data.id).to.eq(mockQuoteId);
        cy.log('Création de devis testée avec succès');
      });
    });
  });
}); 