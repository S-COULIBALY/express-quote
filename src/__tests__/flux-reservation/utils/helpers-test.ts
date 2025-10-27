/**
 * 🧪 **UTILITAIRES DE TEST**
 * 
 * Ce fichier contient tous les helpers et utilitaires
 * pour faciliter l'écriture et l'exécution des tests.
 */

import { Page } from '@playwright/test';
import { donneesReservationTest, donneesClientTest } from '../fixtures/donnees-reservation';
import { cartesTestStripe } from '../fixtures/cartes-stripe';

/**
 * 🎯 **HELPERS POUR LES TESTS DE FORMULAIRES**
 */
export class HelpersFormulaire {
  /**
   * Remplit un formulaire de réservation complet
   */
  static async remplirFormulaireReservation(
    page: Page, 
    typeService: 'nettoyage' | 'demenagement' | 'livraison',
    donneesClient = donneesClientTest.standard
  ) {
    const donnees = donneesReservationTest[typeService];
    
    // Informations de planification
    await page.fill('[name="scheduledDate"]', donnees.datePrevue);
    await page.selectOption('[name="horaire"]', donnees.horaire);
    
    if (typeService === 'nettoyage') {
      await page.fill('[name="location"]', donnees.adresse);
      await page.fill('[name="surface"]', donnees.surface.toString());
      await page.fill('[name="duration"]', donnees.duree.toString());
    } else if (typeService === 'demenagement') {
      await page.fill('[name="pickupAddress"]', donnees.adresseDepart);
      await page.fill('[name="deliveryAddress"]', donnees.adresseArrivee);
      await page.fill('[name="volume"]', donnees.volume.toString());
    } else if (typeService === 'livraison') {
      await page.fill('[name="pickupAddress"]', donnees.adresseDepart);
      await page.fill('[name="deliveryAddress"]', donnees.adresseArrivee);
      await page.fill('[name="weight"]', donnees.poids.toString());
    }
    
    // Informations client
    await page.fill('[name="firstName"]', donneesClient.prenom);
    await page.fill('[name="lastName"]', donneesClient.nom);
    await page.fill('[name="email"]', donneesClient.email);
    await page.fill('[name="phone"]', donneesClient.telephone);
    
    // Acceptation des conditions
    await page.check('[name="acceptTerms"]');
    await page.check('[name="acceptPrivacy"]');
    
    if (donneesClient.optinWhatsApp) {
      await page.check('[name="whatsappOptIn"]');
    }
  }

  /**
   * Soumet un formulaire et attend la redirection
   */
  static async soumettreFormulaire(page: Page, boutonText = 'Réserver') {
    await page.click(`button:has-text("${boutonText}")`);
    
    // Attendre la redirection vers la page de réservation
    await page.waitForURL(/\/booking\/[a-zA-Z0-9]+/);
  }

  /**
   * Vérifie que le formulaire affiche les erreurs de validation
   */
  static async verifierErreursValidation(page: Page, champsObligatoires: string[]) {
    for (const champ of champsObligatoires) {
      await page.waitForSelector(`[data-testid="erreur-${champ}"]`, { timeout: 5000 });
    }
  }
}

/**
 * 💳 **HELPERS POUR LES TESTS DE PAIEMENT**
 */
export class HelpersPaiement {
  /**
   * Remplit le formulaire de paiement Stripe
   */
  static async remplirFormulairePaiement(
    page: Page, 
    carte = cartesTestStripe.succes.visa
  ) {
    // Attendre que le formulaire Stripe soit chargé
    await page.waitForSelector('[data-testid="stripe-card-element"]', { timeout: 10000 });
    
    // Remplir les informations de la carte
    await page.fill('[data-testid="numero-carte"]', carte.numero);
    await page.fill('[data-testid="expiration-carte"]', carte.expiration);
    await page.fill('[data-testid="cvc-carte"]', carte.cvc);
    await page.fill('[data-testid="nom-carte"]', carte.nom);
  }

  /**
   * Procède au paiement et attend le résultat
   */
  static async procederPaiement(page: Page, timeout = 30000) {
    await page.click('[data-testid="bouton-payer"]');
    
    // Attendre le traitement du paiement
    await page.waitForSelector('[data-testid="statut-paiement"]', { timeout });
  }

  /**
   * Vérifie que le paiement a réussi
   */
  static async verifierPaiementReussi(page: Page) {
    await page.waitForURL(/\/success\/[a-zA-Z0-9]+/);
    await page.waitForSelector('[data-testid="confirmation-paiement"]');
  }

  /**
   * Vérifie que le paiement a échoué
   */
  static async verifierPaiementEchoue(page: Page) {
    await page.waitForSelector('[data-testid="erreur-paiement"]');
  }
}

/**
 * 📧 **HELPERS POUR LES TESTS DE NOTIFICATIONS**
 */
export class HelpersNotification {
  /**
   * Intercepte les appels de notification
   */
  static async intercepterNotifications(page: Page) {
    const notifications: any[] = [];
    
    await page.route('**/api/notifications/**', route => {
      const request = route.request();
      notifications.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        body: request.postData()
      });
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    return notifications;
  }

  /**
   * Vérifie qu'une notification a été envoyée
   */
  static async verifierNotificationEnvoyee(
    notifications: any[], 
    type: 'email' | 'sms' | 'whatsapp'
  ) {
    const notification = notifications.find(n => 
      n.url.includes(`/api/notifications/${type}`)
    );
    
    return notification !== undefined;
  }

  /**
   * Simule un échec de notification
   */
  static async simulerEchecNotification(page: Page, type: string) {
    await page.route(`**/api/notifications/${type}`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service indisponible' })
      });
    });
  }
}

/**
 * 🔄 **HELPERS POUR LES TESTS DE FLUX**
 */
export class HelpersFlux {
  /**
   * Exécute le flux complet de réservation
   */
  static async executerFluxComplet(
    page: Page,
    typeService: 'nettoyage' | 'demenagement' | 'livraison',
    carte = cartesTestStripe.succes.visa
  ) {
    // 1. Remplir le formulaire
    await HelpersFormulaire.remplirFormulaireReservation(page, typeService);
    
    // 2. Soumettre le formulaire
    await HelpersFormulaire.soumettreFormulaire(page);
    
    // 3. Remplir les informations de paiement
    await HelpersPaiement.remplirFormulairePaiement(page, carte);
    
    // 4. Procéder au paiement
    await HelpersPaiement.procederPaiement(page);
    
    // 5. Vérifier le succès
    await HelpersPaiement.verifierPaiementReussi(page);
  }

  /**
   * Teste un scénario d'échec de paiement
   */
  static async executerFluxEchecPaiement(
    page: Page,
    typeService: 'nettoyage' | 'demenagement' | 'livraison',
    carteEchec = cartesTestStripe.echecs.carteRefusee
  ) {
    // 1. Remplir le formulaire
    await HelpersFormulaire.remplirFormulaireReservation(page, typeService);
    
    // 2. Soumettre le formulaire
    await HelpersFormulaire.soumettreFormulaire(page);
    
    // 3. Remplir avec une carte qui échoue
    await HelpersPaiement.remplirFormulairePaiement(page, carteEchec);
    
    // 4. Procéder au paiement
    await HelpersPaiement.procederPaiement(page);
    
    // 5. Vérifier l'échec
    await HelpersPaiement.verifierPaiementEchoue(page);
  }
}

/**
 * 📊 **HELPERS POUR LES TESTS DE PERFORMANCE**
 */
export class HelpersPerformance {
  /**
   * Mesure le temps de chargement d'une page
   */
  static async mesurerTempsChargement(page: Page, url: string) {
    const debut = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const fin = Date.now();
    return fin - debut;
  }

  /**
   * Mesure le temps de calcul de prix
   */
  static async mesurerTempsCalculPrix(page: Page, champ: string, valeur: string) {
    const debut = Date.now();
    await page.fill(`[name="${champ}"]`, valeur);
    await page.waitForSelector('[data-testid="prix-calcule"]');
    const fin = Date.now();
    return fin - debut;
  }

  /**
   * Mesure le temps de soumission
   */
  static async mesurerTempsSoumission(page: Page) {
    const debut = Date.now();
    await page.click('[data-testid="bouton-soumettre"]');
    await page.waitForURL(/\/booking\/[a-zA-Z0-9]+/);
    const fin = Date.now();
    return fin - debut;
  }
}

/**
 * 🧹 **HELPERS POUR LE NETTOYAGE DES TESTS**
 */
export class HelpersNettoyage {
  /**
   * Nettoie les données de test
   */
  static async nettoyerDonneesTest() {
    // Supprimer les réservations de test
    // Supprimer les clients de test
    // Supprimer les transactions de test
    // etc.
  }

  /**
   * Réinitialise l'état de l'application
   */
  static async reinitialiserApplication(page: Page) {
    // Vider le localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Vider le sessionStorage
    await page.evaluate(() => sessionStorage.clear());
    
    // Recharger la page
    await page.reload();
  }
}

/**
 * 🔍 **HELPERS POUR LES ASSERTIONS**
 */
export class HelpersAssertion {
  /**
   * Vérifie qu'un élément contient le texte attendu
   */
  static async verifierTexte(page: Page, selector: string, texteAttendu: string) {
    const element = await page.locator(selector);
    await expect(element).toContainText(texteAttendu);
  }

  /**
   * Vérifie qu'un élément est visible
   */
  static async verifierVisibilite(page: Page, selector: string) {
    const element = await page.locator(selector);
    await expect(element).toBeVisible();
  }

  /**
   * Vérifie qu'un élément n'est pas visible
   */
  static async verifierInvisibilite(page: Page, selector: string) {
    const element = await page.locator(selector);
    await expect(element).not.toBeVisible();
  }

  /**
   * Vérifie qu'une URL correspond au pattern attendu
   */
  static async verifierURL(page: Page, pattern: RegExp) {
    await expect(page).toHaveURL(pattern);
  }
}

/**
 * 🎲 **HELPERS POUR LA GÉNÉRATION DE DONNÉES**
 */
export class HelpersGeneration {
  /**
   * Génère un email de test unique
   */
  static genererEmailTest(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  /**
   * Génère un numéro de téléphone de test
   */
  static genererTelephoneTest(): string {
    return `+33${Math.floor(Math.random() * 900000000) + 100000000}`;
  }

  /**
   * Génère une adresse de test
   */
  static genererAdresseTest(): string {
    const rues = ['Rue de la Paix', 'Avenue des Champs', 'Boulevard Saint-Germain'];
    const numero = Math.floor(Math.random() * 999) + 1;
    const rue = rues[Math.floor(Math.random() * rues.length)];
    return `${numero} ${rue}, Paris 75001`;
  }

  /**
   * Génère une date future
   */
  static genererDateFuture(jours = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + jours);
    return date.toISOString().split('T')[0];
  }
}

// Export de tous les helpers
export {
  HelpersFormulaire,
  HelpersPaiement,
  HelpersNotification,
  HelpersFlux,
  HelpersPerformance,
  HelpersNettoyage,
  HelpersAssertion,
  HelpersGeneration
};
