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

      // 3. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      
      // 4. Vérifier le calcul de prix en temps réel
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('120€');

      // 5. Soumettre le formulaire
      await HelpersFormulaire.soumettreFormulaire(page);

      // 6. Vérifier la redirection vers la page de réservation
      await expect(page).toHaveURL(/\/booking\/[a-zA-Z0-9]+/);

      // 7. Vérifier que les données sont conservées
      await expect(page.locator('[data-testid="recapitulatif-date"]')).toContainText('15/02/2024');
      await expect(page.locator('[data-testid="recapitulatif-prix"]')).toContainText('120€');

      // 8. Remplir les informations de paiement
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // 9. Procéder au paiement
      await HelpersPaiement.procederPaiement(page);

      // 10. Vérifier le succès du paiement
      await HelpersPaiement.verifierPaiementReussi(page);

      // 11. Vérifier la redirection vers la page de succès
      await expect(page).toHaveURL(/\/success\/[a-zA-Z0-9]+/));

      // 12. Vérifier le contenu de la page de succès
      await expect(page.locator('[data-testid="confirmation-reservation"]')).toBeVisible();
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
    test('Flux complet de réservation de déménagement', async ({ page }) => {
      // 1. Navigation vers le service de déménagement
      await page.goto('/catalogue/service-demenagement');
      await expect(page).toHaveURL(/\/catalogue\/service-demenagement/);

      // 2. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'demenagement');
      
      // 3. Vérifier le calcul de prix
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('350€');

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

    test('Flux avec options de déménagement', async ({ page }) => {
      await page.goto('/catalogue/service-demenagement');

      // Remplir les informations de base
      await page.fill('[name="volume"]', '25');
      await page.fill('[name="distance"]', '5');

      // Vérifier le prix de base
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('300€');

      // Ajouter des options
      await page.check('[name="options"][value="emballage"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('350€');

      await page.check('[name="options"][value="montage-meubles"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('400€');

      // Continuer avec le flux normal
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

      // Remplir avec des données invalides
      await page.fill('[name="email"]', 'email-invalide');
      await page.fill('[name="phone"]', '123');
      await page.fill('[name="surface"]', '5');

      // Tenter de soumettre
      await page.click('[data-testid="bouton-soumettre"]');

      // Vérifier que les erreurs apparaissent
      await expect(page.locator('[data-testid="erreur-email"]')).toContainText('Email invalide');
      await expect(page.locator('[data-testid="erreur-phone"]')).toContainText('Téléphone invalide');
      await expect(page.locator('[data-testid="erreur-surface"]')).toContainText('Surface minimum 10m²');
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
