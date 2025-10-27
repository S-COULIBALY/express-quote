/**
 * 🧪 **TESTS D'INTÉGRATION - FLUX DE RÉSERVATION**
 * 
 * Ce fichier teste le flux complet de réservation depuis le formulaire
 * jusqu'à la confirmation, en passant par le paiement et les notifications.
 */

import { test, expect } from '@playwright/test';
import { 
  HelpersFormulaire, 
  HelpersPaiement, 
  HelpersNotification,
  HelpersFlux 
} from '../utils/helpers-test';
import { 
  donneesReservationTest, 
  donneesClientTest 
} from '../fixtures/donnees-reservation';
import { 
  cartesTestStripe 
} from '../fixtures/cartes-stripe';

test.describe('Intégration - Flux de Réservation', () => {
  test.beforeEach(async ({ page }) => {
    // Configuration de base pour chaque test
    await page.goto('/catalogue');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Flux de réservation - Nettoyage', () => {
    test('Processus complet de réservation de nettoyage', async ({ page }) => {
      // 1. Navigation vers le service de nettoyage
      await page.goto('/catalogue/service-nettoyage');
      await expect(page).toHaveURL(/\/catalogue\/service-nettoyage/);

      // 2. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'nettoyage');
      
      // 3. Vérifier que le prix est calculé
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('120€');

      // 4. Soumettre le formulaire
      await HelpersFormulaire.soumettreFormulaire(page);

      // 5. Vérifier la redirection vers la page de réservation
      await expect(page).toHaveURL(/\/booking\/[a-zA-Z0-9]+/);

      // 6. Vérifier que les données sont conservées
      await expect(page.locator('[data-testid="recapitulatif-date"]')).toContainText('15/02/2024');
      await expect(page.locator('[data-testid="recapitulatif-prix"]')).toContainText('120€');

      // 7. Remplir les informations de paiement
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // 8. Procéder au paiement
      await HelpersPaiement.procederPaiement(page);

      // 9. Vérifier le succès du paiement
      await HelpersPaiement.verifierPaiementReussi(page);

      // 10. Vérifier la redirection vers la page de succès
      await expect(page).toHaveURL(/\/success\/[a-zA-Z0-9]+/);
    });

    test('Validation des champs obligatoires', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Tenter de soumettre sans remplir les champs
      await page.click('[data-testid="bouton-soumettre"]');

      // Vérifier que les messages d'erreur apparaissent
      await expect(page.locator('[data-testid="erreur-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-adresse"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-prenom"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-nom"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-telephone"]')).toBeVisible();
    });

    test('Calcul de prix en temps réel', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Remplir la surface
      await page.fill('[name="surface"]', '50');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('100€');

      // Changer la durée
      await page.fill('[name="duration"]', '3');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('150€');

      // Ajouter des contraintes
      await page.check('[name="serviceConstraints"][value="escalier"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('170€');
    });
  });

  test.describe('Flux de réservation - Déménagement', () => {
    test('Processus complet de réservation de déménagement', async ({ page }) => {
      // 1. Navigation vers le service de déménagement
      await page.goto('/catalogue/service-demenagement');
      await expect(page).toHaveURL(/\/catalogue\/service-demenagement/);

      // 2. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'demenagement');
      
      // 3. Vérifier que le prix est calculé
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

    test('Calcul de prix avec options de déménagement', async ({ page }) => {
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
    });
  });

  test.describe('Flux de réservation - Livraison', () => {
    test('Processus complet de réservation de livraison', async ({ page }) => {
      // 1. Navigation vers le service de livraison
      await page.goto('/catalogue/service-livraison');
      await expect(page).toHaveURL(/\/catalogue\/service-livraison/);

      // 2. Remplir le formulaire de réservation
      await HelpersFormulaire.remplirFormulaireReservation(page, 'livraison');
      
      // 3. Vérifier que le prix est calculé
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

    test('Calcul de prix avec assurance', async ({ page }) => {
      await page.goto('/catalogue/service-livraison');

      // Remplir les informations de base
      await page.fill('[name="weight"]', '15.5');
      await page.fill('[name="dimensions"]', '60x40x30');

      // Vérifier le prix de base
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('75€');

      // Ajouter l'assurance
      await page.check('[name="insurance"]');
      await expect(page.locator('[data-testid="prix-calcule"]')).toContainText('85€');
    });
  });

  test.describe('Gestion des erreurs', () => {
    test('Gestion des erreurs de validation', async ({ page }) => {
      await page.goto('/catalogue/service-nettoyage');

      // Remplir avec des données invalides
      await page.fill('[name="email"]', 'email-invalide');
      await page.fill('[name="phone"]', '123');
      await page.fill('[name="surface"]', '5');

      // Tenter de soumettre
      await page.click('[data-testid="bouton-soumettre"]');

      // Vérifier que les erreurs apparaissent
      await expect(page.locator('[data-testid="erreur-email"]')).toContainText('Email invalide');
      await expect(page.locator('[data-testid="erreur-telephone"]')).toContainText('Téléphone invalide');
      await expect(page.locator('[data-testid="erreur-surface"]')).toContainText('Surface minimum 10m²');
    });

    test('Gestion des erreurs de réseau', async ({ page }) => {
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
  });

  test.describe('Performance', () => {
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
  });
});
