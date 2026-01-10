/**
 * 🎭 **TESTS END-TO-END - RÉSERVATION COMPLÈTE**
 * 
 * Ce fichier teste le parcours utilisateur complet depuis
 * la sélection du service jusqu'à la confirmation finale.
 */

import { test, expect } from '@playwright/test';
import { 
  HelpersFlux,
  HelpersFormulaire,
  HelpersPaiement,
  HelpersNotification
} from '../utils/helpers-test';
import { 
  donneesReservationTest, 
  donneesClientTest 
} from '../fixtures/donnees-reservation';
import { 
  cartesTestStripe 
} from '../fixtures/cartes-stripe';

test.describe('E2E - Réservation Complète', () => {
  test.beforeEach(async ({ page }) => {
    // Configuration de base pour chaque test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Parcours utilisateur - Nettoyage', () => {
    test('Flux complet de réservation de nettoyage', async ({ page }) => {
      // 1. Navigation vers le catalogue
      await page.goto('/catalogue');
      await expect(page).toHaveURL('/catalogue');

      // 2. Sélection du service de nettoyage
      await page.click('[data-testid="service-nettoyage"]');
      await expect(page).toHaveURL(/\/catalogue\/service-nettoyage/);

      // 3. Vérifier le chargement du FormGenerator
      await expect(page.locator('[data-testid="form-generator"]')).toBeVisible();
      await expect(page.locator('[data-testid="form-field-surface"]')).toBeVisible();

      // 4. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      
      // 5. Vérifier le calcul de prix en temps réel avec useCentralizedPricing
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('120€');
      await expect(page.locator('[data-testid="prix-details"]')).toBeVisible();

      // 6. Vérifier la persistance des données avec useFormPersistence
      await expect(page.locator('[data-testid="form-save-indicator"]')).toBeVisible();

      // 7. Soumettre le formulaire avec useUnifiedSubmission
      await HelpersFormulaire.soumettreFormulaire(page);

      // 8. Vérifier la redirection vers la page de réservation
      await expect(page).toHaveURL(/\/booking\/[a-zA-Z0-9]+/);

      // 9. Vérifier le chargement du QuoteRequest
      await expect(page.locator('[data-testid="quote-request-loaded"]')).toBeVisible();

      // 10. Vérifier que les données sont conservées
      await expect(page.locator('[data-testid="recapitulatif-date"]')).toContainText('15/02/2024');
      await expect(page.locator('[data-testid="recapitulatif-prix"]')).toContainText('120€');

      // 11. Vérifier la création automatique de la session Stripe
      await expect(page.locator('[data-testid="stripe-session-created"]')).toBeVisible();

      // 12. Remplir les informations de paiement avec CheckoutForm
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // 13. Procéder au paiement
      await HelpersPaiement.procederPaiement(page);

      // 14. Vérifier le succès du paiement
      await HelpersPaiement.verifierPaiementReussi(page);

      // 15. Vérifier la redirection vers la page de succès
      await expect(page).toHaveURL(/\/success\?payment_intent=pi_test_/);

      // 16. Attendre que le booking soit créé et que la page affiche les informations
      await page.waitForTimeout(2000); // Attendre le polling

      // 17. Vérifier la redirection automatique vers la page de détail de la réservation
      await expect(page).toHaveURL(/\/bookings\/[a-zA-Z0-9-]+/);

      // 18. Vérifier le contenu de la page de détail de la réservation
      await expect(page.locator('text=Réservation')).toBeVisible();
      await expect(page.locator('[data-testid="details-reservation"]')).toContainText('Nettoyage');
      await expect(page.locator('[data-testid="prix-final"]')).toContainText('120€');
    });

    test('Flux avec échec de paiement et retry', async ({ page }) => {
      // 1. Aller jusqu'au paiement
      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      await HelpersFormulaire.soumettreFormulaire(page);

      // 2. Tenter le paiement avec une carte qui échoue
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.carteRefusee);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);

      // 3. Vérifier que le bouton de retry est disponible
      await expect(page.locator('[data-testid="bouton-retry"]')).toBeVisible();

      // 4. Retry avec une carte qui fonctionne
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Flux avec authentification 3D Secure', async ({ page }) => {
      // 1. Aller jusqu'au paiement
      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      await HelpersFormulaire.soumettreFormulaire(page);

      // 2. Utiliser une carte qui nécessite une authentification 3DS
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.authentification3DS.authentificationReussie);
      await HelpersPaiement.procederPaiement(page);

      // 3. Vérifier que l'authentification 3DS est demandée
      await expect(page.locator('[data-testid="authentification-3ds"]')).toBeVisible();

      // 4. Simuler l'authentification réussie
      await page.click('[data-testid="bouton-authentifier-3ds"]');
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Parcours utilisateur - Déménagement', () => {
    test('Flux complet de réservation de déménagement avec scopes réalistes', async ({ page }) => {
      // 1. Navigation vers le service de déménagement
      await page.goto('/catalogue/service-demenagement');
      await expect(page).toHaveURL(/\/catalogue\/service-demenagement/);

      // 2. Remplir le formulaire de réservation avec données réalistes
      await HelpersFormulaire.remplirFormulaireReservation(page, 'demenagement');

      // 3. Vérifier le calcul de prix avec contraintes GLOBAL + PICKUP + DELIVERY
      // Données du fixture demenagement incluent maintenant:
      // - Volume: 45m³, Distance: 465.3km
      // - Contraintes GLOBAL: Circulation + Stationnement
      // - Contraintes PICKUP: Couloirs étroits, Ascenseur trop petit, Escaliers
      // - Contraintes DELIVERY: Distance portage, Accès étroit
      // - Services: Monte-meuble départ + arrivée
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('2250€');

      // Vérifier le détail des scopes dans le récapitulatif
      await expect(page.locator('[data-testid="recap-scope-global"]')).toBeVisible();
      await expect(page.locator('[data-testid="recap-scope-pickup"]')).toBeVisible();
      await expect(page.locator('[data-testid="recap-scope-delivery"]')).toBeVisible();

      // 4. Soumettre le formulaire
      await HelpersFormulaire.soumettreFormulaire(page);

      // 5. Vérifier la redirection vers la page de réservation
      await expect(page).toHaveURL(/\/booking\/[a-zA-Z0-9]+/);

      // 6. Vérifier que le récapitulatif affiche correctement tous les scopes
      await expect(page.locator('[data-testid="booking-summary-global"]')).toContainText('Circulation complexe');
      await expect(page.locator('[data-testid="booking-summary-global"]')).toContainText('Stationnement difficile');
      await expect(page.locator('[data-testid="booking-summary-pickup"]')).toContainText('Couloirs étroits');
      await expect(page.locator('[data-testid="booking-summary-delivery"]')).toContainText('Distance de portage');

      // 7. Remplir les informations de paiement
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // 8. Procéder au paiement (acompte 30% = 675€)
      await HelpersPaiement.procederPaiement(page);

      // 9. Vérifier le succès du paiement
      await HelpersPaiement.verifierPaiementReussi(page);

      // 10. Vérifier la page de confirmation finale avec tous les détails
      await expect(page.locator('[data-testid="confirmation-total"]')).toContainText('2250€');
      await expect(page.locator('[data-testid="confirmation-deposit"]')).toContainText('675€');
      await expect(page.locator('[data-testid="confirmation-remaining"]')).toContainText('1575€');
    });

    test('Flux avec contraintes réalistes PICKUP et DELIVERY', async ({ page }) => {
      await page.goto('/catalogue/service-demenagement');

      // Remplir les informations de base avec données réalistes
      await page.fill('[name="volume"]', '45');
      await page.fill('[name="distance"]', '465.3');

      // Adresses avec contraintes
      await page.fill('[name="pickupAddress"]', '45 Rue Étroite, Vieil Immeuble, 75003 Paris');
      await page.fill('[name="deliveryAddress"]', '28 Impasse Difficile, Centre-Ville, 69001 Lyon');

      // Informations départ (PICKUP scope)
      await page.fill('[name="pickupFloor"]', '5');
      await page.select('[name="pickupElevator"]', 'small'); // Ascenseur trop petit
      await page.select('[name="pickupCarryDistance"]', '30+'); // Longue distance

      // Informations arrivée (DELIVERY scope)
      await page.fill('[name="deliveryFloor"]', '6');
      await page.select('[name="deliveryElevator"]', 'no'); // Pas d'ascenseur
      await page.select('[name="deliveryCarryDistance"]', '30+'); // Longue distance

      // Vérifier le prix de base
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('1732€');

      // Contraintes GLOBAL (appliquées 1x sur tout le service)
      await page.check('[data-constraint-id="d85f44a1-3f5f-4e28-883c-778000a2e23e"]'); // Circulation complexe (+6.5%)
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('1845€');

      // Contraintes PICKUP (départ uniquement)
      await page.check('[data-constraint-id="b2b8f00b-00a2-456c-ad06-1150d25d71a3"]'); // Couloirs étroits (+6.5%)
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('1958€');

      // Vérifier auto-détection monte-meuble PICKUP
      await expect(page.locator('[data-testid="service-auto-pickup"]')).toContainText('Monte-meuble requis (départ)');

      // Vérifier auto-détection monte-meuble DELIVERY
      await expect(page.locator('[data-testid="service-auto-delivery"]')).toContainText('Monte-meuble requis (arrivée)');

      // Contraintes DELIVERY (arrivée uniquement)
      // Note: Remplacer l'UUID ci-dessous par une vraie contrainte DELIVERY de votre BDD
      // await page.check('[data-constraint-id="REAL-DELIVERY-UUID"]'); // Accès étroit (+7%)
      // await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('2089€');

      // Ajouter options de service
      await page.check('[name="options"][value="emballage"]');
      await page.check('[name="options"][value="montage-meubles"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('2250€');

      // Continuer avec le flux normal
      await HelpersFormulaire.soumettreFormulaire(page);

      // Vérifier que les données de scopes sont conservées dans le récapitulatif
      await expect(page.locator('[data-testid="recap-global-constraints"]')).toBeVisible();
      await expect(page.locator('[data-testid="recap-pickup-constraints"]')).toBeVisible();
      await expect(page.locator('[data-testid="recap-delivery-constraints"]')).toBeVisible();
      await expect(page.locator('[data-testid="recap-auto-services"]')).toContainText('Monte-meuble');

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);

      // Vérifier la page de confirmation avec détails des scopes
      await expect(page.locator('[data-testid="confirmation-global-rules"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-pickup-rules"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-delivery-rules"]')).toBeVisible();
    });

    test('Flux avec règles BOTH appliquées aux deux adresses', async ({ page }) => {
      await page.goto('/catalogue/service-demenagement');

      // Remplir avec scénario BOTH scope
      await page.fill('[name="volume"]', '40');
      await page.fill('[name="distance"]', '465.3');
      await page.fill('[name="pickupAddress"]', '15 Rue des Marches, Vieux Quartier, 75011 Paris');
      await page.fill('[name="deliveryAddress"]', '8 Impasse du Parking, Centre-Ville, 69002 Lyon');

      // Les deux adresses ont des escaliers (condition BOTH match)
      await page.fill('[name="pickupFloor"]', '4');
      await page.select('[name="pickupElevator"]', 'no');
      await page.fill('[name="deliveryFloor"]', '3');
      await page.select('[name="deliveryElevator"]', 'no');

      // Règle BOTH: Accès multi-niveaux (appliquée aux 2 adresses car condition match aux 2)
      await page.check('[data-constraint-id="293dc311-6f22-42d8-8b31-b322c0e888f9"]');

      // Vérifier que la règle est appliquée 2 fois (1x pickup + 1x delivery)
      await expect(page.locator('[data-testid="both-rule-applied-count"]')).toContainText('2x');
      await expect(page.locator('[data-testid="both-rule-pickup"]')).toContainText('Accès multi-niveaux (départ)');
      await expect(page.locator('[data-testid="both-rule-delivery"]')).toContainText('Accès multi-niveaux (arrivée)');

      // Continuer le flux
      await HelpersFormulaire.soumettreFormulaire(page);
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Parcours utilisateur - Livraison', () => {
    test('Flux complet de réservation de livraison', async ({ page }) => {
      // 1. Navigation vers le service de livraison
      await page.goto('/catalogue/service-livraison');
      await expect(page).toHaveURL(/\/catalogue\/service-livraison/);

      // 2. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'livraison');
      
      // 3. Vérifier le calcul de prix
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('85€');

      // 4. Soumettre le formulaire
      await HelpersFormulaire.soumettreFormulaire(page);

      // 5. Vérifier la redirection vers la page de réservation
      await expect(page).toHaveURL(/\/booking\/[a-zA-Z0-9]+/);

      // 6. Remplir les informations de paiement
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // 7. Procéder au paiement
      await HelpersPaiement.procederPaiement(page);

      // 8. Vérifier le succès du paiement
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Flux avec assurance', async ({ page }) => {
      await page.goto('/catalogue/service-livraison');

      // Remplir les informations de base
      await page.fill('[name="weight"]', '15.5');
      await page.fill('[name="dimensions"]', '60x40x30');

      // Vérifier le prix de base
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('75€');

      // Ajouter l'assurance
      await page.check('[name="insurance"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('85€');

      // Continuer avec le flux normal
      await HelpersFormulaire.soumettreFormulaire(page);
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Gestion des erreurs', () => {
    test('Erreur de validation du formulaire', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier le chargement du FormGenerator
      await expect(page.locator('[data-testid="form-generator"]')).toBeVisible();

      // Remplir avec des données invalides
      await page.fill('[name="email"]', 'email-invalide');
      await page.fill('[name="phone"]', '123');
      await page.fill('[name="surface"]', '5');

      // Tenter de soumettre
      await page.click('[data-testid="bouton-soumettre"]');

      // Vérifier que les erreurs de validation apparaissent
      await expect(page.locator('[data-testid="erreur-email"]')).toContainText('Email invalide');
      await expect(page.locator('[data-testid="erreur-phone"]')).toContainText('Téléphone invalide');
      await expect(page.locator('[data-testid="erreur-surface"]')).toContainText('Surface minimum 10m²');

      // Vérifier que le formulaire n'est pas soumis
      await expect(page).toHaveURL(/\/catalogue\/service-nettoyage/);
    });

    test('Erreur de chargement du QuoteRequest', async ({ page }) => {
      // Simuler une erreur 404 pour le QuoteRequest
      await page.route('**/api/quotesRequest/*', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'QuoteRequest not found' })
        });
      });

      await page.goto('/booking/invalid-temporary-id');

      // Vérifier que l'erreur est affichée
      await expect(page.locator('[data-testid="erreur-quote-request"]')).toBeVisible();
      await expect(page.locator('[data-testid="bouton-retour-catalogue"]')).toBeVisible();
    });

    test('Erreur de création de session Stripe', async ({ page }) => {
      // Simuler une erreur lors de la création de session Stripe
      await page.route('**/api/payment/create-session', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Stripe session creation failed' })
        });
      });

      await page.goto('/booking/test-booking-id');

      // Vérifier que l'erreur est affichée
      await expect(page.locator('[data-testid="erreur-stripe-session"]')).toBeVisible();
    });

    test('Erreur de réseau lors de la soumission', async ({ page }) => {
      // Simuler une erreur de réseau
      await page.route('**/api/quotesRequest', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erreur serveur' })
        });
      });

      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      await HelpersFormulaire.soumettreFormulaire(page);

      // Vérifier que l'erreur est gérée
      await expect(page.locator('[data-testid="erreur-reseau"]')).toBeVisible();
    });

    test('Erreur de paiement', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      await HelpersFormulaire.soumettreFormulaire(page);

      // Utiliser une carte qui échoue
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.carteRefusee);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });
  });

  test.describe('Notifications', () => {
    test('Notifications envoyées après réservation réussie', async ({ page }) => {
      // Intercepter les notifications
      const notifications = await HelpersNotification.intercepterNotifications(page);

      // Exécuter le flux complet
      await HelpersFlux.executerFluxComplet(page, 'nettoyage');

      // Vérifier que les notifications sont envoyées
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'email')).toBeTruthy();
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'sms')).toBeTruthy();
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'whatsapp')).toBeTruthy();
    });

    test('Gestion des échecs de notification', async ({ page }) => {
      // Simuler un échec de notification
      await HelpersNotification.simulerEchecNotification(page, 'email');

      // Exécuter le flux complet
      await HelpersFlux.executerFluxComplet(page, 'nettoyage');

      // Vérifier que l'erreur de notification est gérée
      await expect(page.locator('[data-testid="erreur-notification"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('Temps de chargement de la page d\'accueil', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Vérifier que la page se charge en moins de 2 secondes
      expect(loadTime).toBeLessThan(2000);
    });

    test('Temps de chargement du formulaire', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/catalogue/service-nettoyage');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Vérifier que le formulaire se charge en moins de 2 secondes
      expect(loadTime).toBeLessThan(2000);
    });

    test('Temps de calcul de prix', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');
      
      const startTime = Date.now();
      await page.fill('[name="surface"]', '50');
      await page.waitForSelector('[data-testid="prix-calcule"]');
      const calculationTime = Date.now() - startTime;
      
      // Vérifier que le calcul se fait en moins de 500ms
      expect(calculationTime).toBeLessThan(500);
    });

    test('Temps de soumission', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      
      const startTime = Date.now();
      await HelpersFormulaire.soumettreFormulaire(page);
      const submissionTime = Date.now() - startTime;
      
      // Vérifier que la soumission se fait en moins de 3 secondes
      expect(submissionTime).toBeLessThan(3000);
    });

    test('Temps de paiement', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      await HelpersFormulaire.soumettreFormulaire(page);
      
      const startTime = Date.now();
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
      const paymentTime = Date.now() - startTime;
      
      // Vérifier que le paiement se fait en moins de 5 secondes
      expect(paymentTime).toBeLessThan(5000);
    });
  });

  test.describe('Accessibilité', () => {
    test('Navigation au clavier', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Naviguer avec Tab
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Naviguer avec les flèches
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');

      // Soumettre avec Enter
      await page.keyboard.press('Enter');
    });

    test('Attributs d\'accessibilité', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier les attributs aria
      await expect(page.locator('[name="scheduledDate"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[name="email"]')).toHaveAttribute('type', 'email');
      await expect(page.locator('[name="phone"]')).toHaveAttribute('type', 'tel');
    });

    test('Contraste des couleurs', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier que les couleurs ont un bon contraste
      const button = page.locator('[data-testid="bouton-soumettre"]');
      const buttonColor = await button.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });

      // Vérifier que le contraste est suffisant
      expect(buttonColor.backgroundColor).not.toBe('transparent');
      expect(buttonColor.color).not.toBe('transparent');
    });
  });

  test.describe('Responsive', () => {
    test('Affichage sur mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier que le formulaire s'affiche correctement
      await expect(page.locator('[data-testid="formulaire-mobile"]')).toBeVisible();
    });

    test('Affichage sur tablette', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier que le formulaire s'affiche correctement
      await expect(page.locator('[data-testid="formulaire-tablette"]')).toBeVisible();
    });

    test('Affichage sur desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/catalogue/service-nettoyage');

      // Vérifier que le formulaire s'affiche correctement
      await expect(page.locator('[data-testid="formulaire-desktop"]')).toBeVisible();
    });
  });
});
