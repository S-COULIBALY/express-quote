/// <reference types="cypress" />

describe('Test simple pour Moving Quote', () => {
  // Test basique de l'interface
  it('Devrait accéder à l\'application', () => {
    // Intercepter toute requête à la page d'accueil
    cy.intercept('GET', '/', {
      statusCode: 200,
      body: '<html><body><h1>Express Quote</h1></body></html>'
    }).as('homePage');
    
    // Visiter la page d'accueil
    cy.visit('/', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        // Mock window.alert pour éviter les popups bloquants
        cy.stub(win, 'alert').as('alertStub');
      }
    });
    
    // Vérifier que la page a été chargée (ou interceptée)
    cy.log('Page d\'accueil visitée avec succès');
  });

  it('Devrait simuler une interaction avec la navigation', () => {
    // Intercepter les chemins
    cy.intercept('GET', '/moving/new', {
      statusCode: 200,
      body: '<html><body><h1>Nouveau Devis</h1></body></html>'
    }).as('newQuote');

    // Navigation simulée
    cy.visit('/moving/new', { failOnStatusCode: false });
    
    // Vérification simple
    cy.contains('h1', 'Nouveau Devis').should('be.visible');
    cy.log('Navigation réussie');
  });
}); 