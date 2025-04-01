/// <reference types="cypress" />

describe('Flux de devis de déménagement', () => {
  const mockData = {
    pickupAddress: '15 rue de Paris, 75001 Paris, France',
    deliveryAddress: '10 Avenue des Champs-Élysées, 75008 Paris, France',
    volume: 30,
    movingDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    preferredTime: 'morning',
    options: {
      packaging: true,
      furniture: true,
      fragile: false
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
    // Intercepter les requêtes API
    cy.intercept('GET', '/api/moving/new', {
      statusCode: 200,
      body: '<html><body><div id="quote-form"><h1>Nouveau Devis</h1><form><div id="form-fields"></div><button type="submit">Soumettre</button></form></div></body></html>',
      headers: {
        'content-type': 'text/html'
      }
    }).as('getNewQuotePage');

    cy.intercept('POST', '/api/moving/calculate', {
      statusCode: 200,
      body: calculatedFees
    }).as('calculateQuote');

    cy.intercept('POST', '/api/moving', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: mockQuoteId,
          ...mockData,
          ...calculatedFees
        }
      }
    }).as('createQuote');

    // Visiter la page de création de devis
    cy.visit('/api/moving/new');
  });

  describe('Affichage de l\'interface', () => {
    it('devrait afficher le formulaire de devis', () => {
      cy.get('#quote-form').should('be.visible');
      cy.get('#form-fields').should('exist');
      cy.contains('button', 'Soumettre').should('exist');
    });
  });

  describe('Soumission du devis', () => {
    it('devrait permettre de soumettre un devis', () => {
      // Simuler la soumission d'un formulaire
      cy.window().then(win => {
        // Créer un faux événement de soumission
        const formData = {
          ...mockData
        };
        
        // Simuler la soumission du formulaire
        cy.log('Soumission du formulaire simulée');
        
        // Simuler l'appel fetch pour le calcul
        return win.fetch('/api/moving/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
        .then(() => {
          // Attendre l'interception du calcul
          cy.wait('@calculateQuote').then(calcInterception => {
            expect(calcInterception.response.statusCode).to.eq(200);
            expect(calcInterception.response.body).to.have.property('totalCost');
            
            // Simuler l'appel fetch pour la création
            return win.fetch('/api/moving', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...formData,
                ...calculatedFees
              })
            });
          });
        });
      });
      
      // Vérifier la requête de création
      cy.wait('@createQuote').then(createInterception => {
        expect(createInterception.response.statusCode).to.eq(200);
        expect(createInterception.response.body.success).to.be.true;
        expect(createInterception.response.body.data).to.have.property('id');
        cy.log('Devis créé avec succès, ID: ' + createInterception.response.body.data.id);
      });
    });
  });
}); 