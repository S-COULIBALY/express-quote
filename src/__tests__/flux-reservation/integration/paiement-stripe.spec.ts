/**
 * 💳 **TESTS D'INTÉGRATION - PAIEMENT STRIPE**
 * 
 * Ce fichier teste l'intégration complète avec Stripe
 * pour tous les scénarios de paiement.
 */

import { test, expect } from '@playwright/test';
import { 
  HelpersPaiement,
  HelpersNotification 
} from '../utils/helpers-test';
import { 
  cartesTestStripe,
  scenariosPaiementTest 
} from '../fixtures/cartes-stripe';

test.describe('Intégration - Paiement Stripe', () => {
  test.beforeEach(async ({ page }) => {
    // Configuration de base pour chaque test
    await page.goto('/booking/test-booking-id');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Paiements réussis', () => {
    test('Paiement avec Visa', async ({ page }) => {
      // Remplir le formulaire de paiement
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);

      // Procéder au paiement
      await HelpersPaiement.procederPaiement(page);

      // Vérifier le succès
      await HelpersPaiement.verifierPaiementReussi(page);

      // Vérifier la redirection vers la page de succès
      await expect(page).toHaveURL(/\/success\/[a-zA-Z0-9]+/);
    });

    test('Paiement avec Mastercard', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.mastercard);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement avec American Express', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.amex);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Paiements échoués', () => {
    test('Carte refusée', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.carteRefusee);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });

    test('Fonds insuffisants', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.fondsInsuffisants);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });

    test('Carte expirée', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.carteExpiree);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });

    test('Numéro de carte invalide', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.numeroInvalide);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });

    test('CVC invalide', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.echecs.cvcInvalide);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);
    });
  });

  test.describe('Authentification 3D Secure', () => {
    test('Authentification 3DS réussie', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.authentification3DS.authentificationReussie);
      await HelpersPaiement.procederPaiement(page);

      // Vérifier que l'authentification 3DS est demandée
      await expect(page.locator('[data-testid="authentification-3ds"]')).toBeVisible();

      // Simuler l'authentification réussie
      await page.click('[data-testid="bouton-authentifier-3ds"]');
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Authentification 3DS échouée', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.authentification3DS.authentificationEchouee);
      await HelpersPaiement.procederPaiement(page);

      // Vérifier que l'authentification 3DS est demandée
      await expect(page.locator('[data-testid="authentification-3ds"]')).toBeVisible();

      // Simuler l'authentification échouée
      await page.click('[data-testid="bouton-echouer-3ds"]');
      await HelpersPaiement.verifierPaiementEchoue(page);
    });

    test('Authentification 3DS annulée', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.authentification3DS.authentificationAnnulee);
      await HelpersPaiement.procederPaiement(page);

      // Vérifier que l'authentification 3DS est demandée
      await expect(page.locator('[data-testid="authentification-3ds"]')).toBeVisible();

      // Simuler l'annulation
      await page.click('[data-testid="bouton-annuler-3ds"]');
      await expect(page.locator('[data-testid="paiement-annule"]')).toBeVisible();
    });
  });

  test.describe('Cartes internationales', () => {
    test('Paiement avec carte UK', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.internationales.royaumeUni);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement avec carte allemande', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.internationales.allemagne);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement avec carte espagnole', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.internationales.espagne);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Cartes de débit', () => {
    test('Paiement avec carte de débit standard', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.debit.debitStandard);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement avec carte de débit prépayée', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.debit.debitPrepaye);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Montants de test', () => {
    test('Paiement de petit montant (50€)', async ({ page }) => {
      await page.goto('/booking/test-booking-id?montant=50');
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement de montant moyen (120€)', async ({ page }) => {
      await page.goto('/booking/test-booking-id?montant=120');
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement de grand montant (500€)', async ({ page }) => {
      await page.goto('/booking/test-booking-id?montant=500');
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Paiement de très grand montant (2000€)', async ({ page }) => {
      await page.goto('/booking/test-booking-id?montant=2000');
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });
  });

  test.describe('Scénarios de retry', () => {
    test('Premier échec, retry possible', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.retry.premierEchec);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);

      // Vérifier que le bouton de retry est disponible
      await expect(page.locator('[data-testid="bouton-retry"]')).toBeVisible();

      // Retry avec une carte qui fonctionne
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);
    });

    test('Échec définitif, pas de retry', async ({ page }) => {
      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.retry.echecDefinitif);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementEchoue(page);

      // Vérifier que le bouton de retry n'est pas disponible
      await expect(page.locator('[data-testid="bouton-retry"]')).not.toBeVisible();
    });
  });

  test.describe('Gestion des erreurs', () => {
    test('Erreur de réseau lors du paiement', async ({ page }) => {
      // Simuler une erreur de réseau
      await page.route('**/api/payment/create-payment-intent', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erreur réseau' })
        });
      });

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);

      // Vérifier que l'erreur est gérée
      await expect(page.locator('[data-testid="erreur-reseau"]')).toBeVisible();
    });

    test('Timeout lors du paiement', async ({ page }) => {
      // Simuler un timeout
      await page.route('**/api/payment/create-payment-intent', route => {
        route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Timeout' })
        });
      });

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);

      // Vérifier que l'erreur est gérée
      await expect(page.locator('[data-testid="erreur-timeout"]')).toBeVisible();
    });
  });

  test.describe('Notifications de paiement', () => {
    test('Notifications envoyées après paiement réussi', async ({ page }) => {
      // Intercepter les notifications
      const notifications = await HelpersNotification.intercepterNotifications(page);

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);

      // Vérifier que les notifications sont envoyées
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'email')).toBeTruthy();
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'sms')).toBeTruthy();
      await expect(HelpersNotification.verifierNotificationEnvoyee(notifications, 'whatsapp')).toBeTruthy();
    });

    test('Gestion des échecs de notification', async ({ page }) => {
      // Simuler un échec de notification
      await HelpersNotification.simulerEchecNotification(page, 'email');

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);

      // Vérifier que l'erreur de notification est gérée
      await expect(page.locator('[data-testid="erreur-notification"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('Temps de traitement du paiement', async ({ page }) => {
      const startTime = Date.now();

      await HelpersPaiement.remplirFormulairePaiement(page, cartesTestStripe.succes.visa);
      await HelpersPaiement.procederPaiement(page);
      await HelpersPaiement.verifierPaiementReussi(page);

      const processingTime = Date.now() - startTime;

      // Vérifier que le paiement se traite en moins de 5 secondes
      expect(processingTime).toBeLessThan(5000);
    });

    test('Temps de chargement du formulaire de paiement', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/booking/test-booking-id');
      await page.waitForSelector('[data-testid="stripe-card-element"]');

      const loadTime = Date.now() - startTime;

      // Vérifier que le formulaire se charge en moins de 3 secondes
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Sécurité', () => {
    test('Validation des données de carte', async ({ page }) => {
      // Tenter de soumettre avec des données invalides
      await page.fill('[data-testid="numero-carte"]', '123');
      await page.fill('[data-testid="expiration-carte"]', '13/25');
      await page.fill('[data-testid="cvc-carte"]', '99');

      await page.click('[data-testid="bouton-payer"]');

      // Vérifier que les erreurs de validation apparaissent
      await expect(page.locator('[data-testid="erreur-numero-carte"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-expiration-carte"]')).toBeVisible();
      await expect(page.locator('[data-testid="erreur-cvc-carte"]')).toBeVisible();
    });

    test('Protection contre les attaques par injection', async ({ page }) => {
      // Tenter d'injecter du code malveillant
      const maliciousInput = '<script>alert("XSS")</script>';
      
      await page.fill('[data-testid="numero-carte"]', maliciousInput);
      await page.fill('[data-testid="nom-carte"]', maliciousInput);

      // Vérifier que l'input est échappé
      const numeroCarte = await page.inputValue('[data-testid="numero-carte"]');
      const nomCarte = await page.inputValue('[data-testid="nom-carte"]');

      expect(numeroCarte).not.toContain('<script>');
      expect(nomCarte).not.toContain('<script>');
    });
  });

  test.describe('Accessibilité', () => {
    test('Navigation au clavier', async ({ page }) => {
      await page.goto('/booking/test-booking-id');

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
      await page.goto('/booking/test-booking-id');

      // Vérifier les attributs aria
      await expect(page.locator('[data-testid="numero-carte"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[data-testid="expiration-carte"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[data-testid="cvc-carte"]')).toHaveAttribute('aria-required', 'true');
    });
  });
});
