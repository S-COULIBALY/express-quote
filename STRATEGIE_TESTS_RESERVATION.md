# 🧪 **STRATÉGIE DE TEST COMPLÈTE - FLUX DE RÉSERVATION**

## 📋 **VUE D'ENSEMBLE**

Ce document décrit la stratégie de test complète pour valider le flux de réservation depuis les formulaires frontend jusqu'aux notifications finales, en s'assurant que :
- ✅ Les calculs de prix sont corrects
- ✅ Les paiements Stripe fonctionnent
- ✅ Les notifications sont envoyées aux bonnes personnes
- ✅ L'expérience utilisateur est fluide

---

## 🎯 **ARCHITECTURE DE TEST RECOMMANDÉE**

### **1. Tests Unitaires (Jest + React Testing Library)**
```typescript
// Tests des composants de formulaire
describe('Générateur de Formulaire', () => {
  test('doit calculer le prix correctement selon les données du formulaire', () => {
    // Test des calculs de prix
  });
  
  test('doit valider les champs obligatoires', () => {
    // Test de validation
  });
});
```

### **2. Tests d'Intégration (Playwright)**
```typescript
// Tests du flux complet
test('Flux de réservation complet', async ({ page }) => {
  // 1. Remplir le formulaire
  // 2. Vérifier le calcul de prix
  // 3. Procéder au paiement
  // 4. Vérifier les notifications
});
```

### **3. Tests End-to-End (Playwright + Stripe Test Mode)**
```typescript
// Tests avec Stripe en mode test
test('Traitement des paiements avec Stripe', async ({ page }) => {
  // Utiliser les cartes de test Stripe
  // Vérifier les webhooks
  // Valider les notifications
});
```

---

## 🛠️ **TECHNOLOGIES RECOMMANDÉES**

### **🎯 Stack de Test Principal**
- **Playwright** : Tests E2E cross-browser
- **Jest** : Tests unitaires et d'intégration
- **React Testing Library** : Tests de composants React
- **MSW (Mock Service Worker)** : Mocking des APIs
- **Stripe Test Mode** : Tests de paiement sécurisés

### **🔧 Outils Complémentaires**
- **Docker** : Environnements de test isolés
- **Testcontainers** : Base de données de test
- **GitHub Actions** : CI/CD automatisé

---

## 📝 **PLAN DE TEST DÉTAILLÉ**

### **Phase 1 : Tests Unitaires**

#### **A. Tests des Composants de Formulaire**
```typescript
// src/__tests__/composants/GénérateurFormulaire.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GénérateurFormulaire } from '@/composants/générateur-formulaire/GénérateurFormulaire';

describe('GénérateurFormulaire - Calcul de Prix', () => {
  test('doit calculer le prix pour un service de nettoyage', async () => {
    const configurationTest = {
      // Configuration de test
    };
    
    render(<GénérateurFormulaire config={configurationTest} />);
    
    // Simuler la saisie de données
    fireEvent.change(screen.getByLabelText('Surface'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Durée'), { target: { value: '2' } });
    
    // Vérifier le calcul de prix
    expect(screen.getByText('Prix: 120€')).toBeInTheDocument();
  });

  test('doit valider les champs obligatoires', async () => {
    render(<GénérateurFormulaire config={configurationTest} />);
    
    // Tenter de soumettre sans remplir les champs
    fireEvent.click(screen.getByText('Réserver'));
    
    // Vérifier que les erreurs de validation apparaissent
    expect(screen.getByText('La date est requise')).toBeInTheDocument();
    expect(screen.getByText('L\'adresse est requise')).toBeInTheDocument();
  });

  test('doit calculer le prix selon la surface et la durée', async () => {
    render(<GénérateurFormulaire config={configurationTest} />);
    
    // Test avec différentes combinaisons
    fireEvent.change(screen.getByLabelText('Surface'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Durée'), { target: { value: '4' } });
    
    // Vérifier le calcul : 100m² × 4h × 15€/h = 600€
    expect(screen.getByText('Prix: 600€')).toBeInTheDocument();
  });
});
```

#### **B. Tests des Hooks de Calcul de Prix**
```typescript
// src/__tests__/hooks/useCalculPrix.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCalculPrix } from '@/hooks/useCalculPrix';

describe('useCalculPrix', () => {
  test('doit calculer le prix de base correctement', () => {
    const { result } = renderHook(() => useCalculPrix());
    
    act(() => {
      result.current.mettreÀJourDonnées({
        surface: 50,
        durée: 2,
        typeService: 'nettoyage'
      });
    });
    
    expect(result.current.prix).toBe(120);
  });

  test('doit appliquer les réductions correctement', () => {
    const { result } = renderHook(() => useCalculPrix());
    
    act(() => {
      result.current.mettreÀJourDonnées({
        surface: 100,
        durée: 4,
        typeService: 'nettoyage',
        codePromo: 'REDUCTION20'
      });
    });
    
    expect(result.current.prix).toBe(480); // 600€ - 20% = 480€
  });
});
```

### **Phase 2 : Tests d'Intégration**

#### **A. Tests du Flux de Réservation**
```typescript
// tests/intégration/flux-réservation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Intégration - Flux de Réservation', () => {
  test('Processus de réservation complet', async ({ page }) => {
    // 1. Navigation vers le formulaire
    await page.goto('/catalogue/service-nettoyage');
    
    // 2. Remplir le formulaire
    await page.remplir('[name="scheduledDate"]', '2024-02-15');
    await page.sélectionnerOption('[name="horaire"]', 'matin-8h');
    await page.remplir('[name="location"]', '123 Rue de la Paix, Paris');
    await page.remplir('[name="surface"]', '50');
    await page.remplir('[name="duration"]', '2');
    
    // 3. Vérifier le calcul de prix en temps réel
    await expect(page.locator('[data-testid="affichage-prix"]')).toContainText('120€');
    
    // 4. Soumettre le formulaire
    await page.cliquer('[data-testid="bouton-soumettre"]');
    
    // 5. Vérifier la redirection vers la page de paiement
    await expect(page).toHaveURL(/\/réservation\/[a-zA-Z0-9]+/);
    
    // 6. Vérifier que les données sont conservées
    await expect(page.locator('[data-testid="récapitulatif-date"]')).toContainText('15/02/2024');
    await expect(page.locator('[data-testid="récapitulatif-prix"]')).toContainText('120€');
  });

  test('Validation des champs obligatoires', async ({ page }) => {
    await page.goto('/catalogue/service-nettoyage');
    
    // Tenter de soumettre sans remplir les champs
    await page.cliquer('[data-testid="bouton-soumettre"]');
    
    // Vérifier que les messages d'erreur apparaissent
    await expect(page.locator('[data-testid="erreur-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="erreur-adresse"]')).toBeVisible();
  });

  test('Calcul de prix avec différentes options', async ({ page }) => {
    await page.goto('/catalogue/service-nettoyage');
    
    // Test avec différentes surfaces
    await page.remplir('[name="surface"]', '100');
    await expect(page.locator('[data-testid="affichage-prix"]')).toContainText('200€');
    
    // Test avec durée différente
    await page.remplir('[name="duration"]', '4');
    await expect(page.locator('[data-testid="affichage-prix"]')).toContainText('400€');
  });
});
```

#### **B. Tests des Services de Données**
```typescript
// tests/intégration/services-données.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Intégration - Services de Données', () => {
  test('Récupération des données du catalogue', async ({ page }) => {
    await page.goto('/catalogue');
    
    // Vérifier que les services sont chargés
    await expect(page.locator('[data-testid="carte-service"]')).toHaveCount.greaterThan(0);
    
    // Vérifier que les prix sont affichés
    await expect(page.locator('[data-testid="prix-service"]')).toBeVisible();
  });

  test('Sauvegarde des données de réservation', async ({ page }) => {
    await page.goto('/catalogue/service-nettoyage');
    
    // Remplir le formulaire
    await page.remplir('[name="scheduledDate"]', '2024-02-15');
    await page.remplir('[name="location"]', '123 Rue de la Paix, Paris');
    
    // Soumettre
    await page.cliquer('[data-testid="bouton-soumettre"]');
    
    // Vérifier que les données sont sauvegardées
    const donnéesSauvegardées = await page.evaluate(() => {
      return localStorage.getItem('réservationActuelle');
    });
    
    expect(donnéesSauvegardées).toContain('2024-02-15');
    expect(donnéesSauvegardées).toContain('123 Rue de la Paix, Paris');
  });
});
```

### **Phase 3 : Tests de Paiement**

#### **A. Tests d'Intégration Stripe**
```typescript
// tests/paiement/intégration-stripe.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Intégration Stripe - Paiements', () => {
  test('Paiement réussi avec carte de test', async ({ page }) => {
    // Utiliser les cartes de test Stripe
    const carteTest = {
      numéro: '4242424242424242',
      expiration: '12/25',
      cvc: '123'
    };
    
    // Naviguer vers la page de paiement
    await page.goto('/réservation/123/paiement');
    
    // Remplir le formulaire de paiement
    await page.remplir('[data-testid="numéro-carte"]', carteTest.numéro);
    await page.remplir('[data-testid="expiration-carte"]', carteTest.expiration);
    await page.remplir('[data-testid="cvc-carte"]', carteTest.cvc);
    
    // Procéder au paiement
    await page.cliquer('[data-testid="bouton-payer"]');
    
    // Vérifier la redirection vers la page de succès
    await expect(page).toHaveURL(/\/succès\/[a-zA-Z0-9]+/);
    
    // Vérifier que la réservation est confirmée
    await expect(page.locator('[data-testid="confirmation-réservation"]')).toBeVisible();
  });

  test('Gestion des erreurs de paiement', async ({ page }) => {
    // Utiliser une carte qui échoue
    const carteÉchec = {
      numéro: '4000000000000002',
      expiration: '12/25',
      cvc: '123'
    };
    
    await page.goto('/réservation/123/paiement');
    
    await page.remplir('[data-testid="numéro-carte"]', carteÉchec.numéro);
    await page.remplir('[data-testid="expiration-carte"]', carteÉchec.expiration);
    await page.remplir('[data-testid="cvc-carte"]', carteÉchec.cvc);
    
    await page.cliquer('[data-testid="bouton-payer"]');
    
    // Vérifier que l'erreur est affichée
    await expect(page.locator('[data-testid="message-erreur-paiement"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-erreur-paiement"]')).toContainText('Votre carte a été refusée');
  });

  test('Paiement avec différents montants', async ({ page }) => {
    const testsPaiement = [
      { montant: 50, description: 'Service basique' },
      { montant: 120, description: 'Service standard' },
      { montant: 300, description: 'Service premium' }
    ];
    
    for (const test of testsPaiement) {
      await page.goto(`/réservation/123/paiement?montant=${test.montant}`);
      
      // Vérifier que le montant est correct
      await expect(page.locator('[data-testid="montant-total"]')).toContainText(`${test.montant}€`);
      
      // Procéder au paiement
      await page.remplir('[data-testid="numéro-carte"]', '4242424242424242');
      await page.cliquer('[data-testid="bouton-payer"]');
      
      // Vérifier le succès
      await expect(page).toHaveURL(/\/succès\/[a-zA-Z0-9]+/);
    }
  });
});
```

#### **B. Tests des Webhooks Stripe**
```typescript
// tests/webhooks/webhook-stripe.test.ts
import { createMocks } from 'node-mocks-http';
import gestionnaire from '@/app/api/webhooks/stripe/route';

test('Webhook Stripe traite le paiement avec succès', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    headers: {
      'stripe-signature': 'signature-valide'
    },
    body: JSON.stringify({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 12000,
          currency: 'eur',
          metadata: {
            réservationId: 'res_123'
          }
        }
      }
    })
  });
  
  await gestionnaire(req, res);
  
  expect(res._getStatusCode()).toBe(200);
  
  // Vérifier que la réservation est mise à jour
  // Vérifier que les notifications sont envoyées
  // Vérifier que l'état de paiement est correct
});
```

### **Phase 4 : Tests des Points Critiques Identifiés**

#### **A. Tests des Hooks de Soumission Unifiés**
```typescript
// tests/critiques/hooks-soumission.test.ts
describe('Tests Critiques - Hooks de Soumission', () => {
  test('Cohérence entre useSubmission et useQuoteRequestSubmission', async () => {
    const formData = createValidFormData();
    
    // Test useSubmission
    const submissionResult = await useSubmission(config, price, extraData);
    
    // Test useQuoteRequestSubmission
    const quoteResult = await useQuoteRequestSubmission(config, price, extraData);
    
    // Vérifier que les deux hooks produisent des résultats cohérents
    expect(submissionResult.data).toEqual(quoteResult.data);
    expect(submissionResult.validation).toEqual(quoteResult.validation);
  });

  test('Gestion d\'erreurs unifiée', async () => {
    const invalidData = createInvalidFormData();
    
    // Test que les deux hooks gèrent les erreurs de la même manière
    const submissionError = await useSubmission(config, price, invalidData);
    const quoteError = await useQuoteRequestSubmission(config, price, invalidData);
    
    expect(submissionError.errorType).toBe(quoteError.errorType);
    expect(submissionError.userMessage).toBe(quoteError.userMessage);
  });

  test('Validation des données avant soumission', async () => {
    const formData = createFormDataWithMissingFields();
    
    // Vérifier que la validation échoue avec des messages clairs
    const result = await useQuoteRequestSubmission(config, price, formData);
    
    expect(result.validationErrors).toContain('La date est requise');
    expect(result.validationErrors).toContain('L\'adresse est requise');
    expect(result.isValid).toBe(false);
  });
});
```

#### **B. Tests des Notifications Réelles vs Simulées**
```typescript
// tests/critiques/notifications-reelles.test.ts
describe('Tests Critiques - Notifications Réelles', () => {
  test('Notifications réellement envoyées (pas simulées)', async () => {
    const bookingData = createValidBookingData();
    
    // Intercepter les appels de notification
    const notificationCalls = [];
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/notifications/')) {
        notificationCalls.push(url);
        return Promise.resolve({ ok: true });
      }
    });
    
    // Créer une réservation
    await createBooking(bookingData);
    
    // Vérifier que les notifications sont réellement appelées
    expect(notificationCalls).toHaveLength(3); // Email, SMS, WhatsApp
    expect(notificationCalls[0]).toContain('/api/notifications/email');
    expect(notificationCalls[1]).toContain('/api/notifications/sms');
    expect(notificationCalls[2]).toContain('/api/notifications/whatsapp');
  });

  test('Gestion des échecs de notification avec retry', async () => {
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true });
    });
    
    const bookingData = createValidBookingData();
    await createBooking(bookingData);
    
    // Vérifier que le retry fonctionne
    expect(callCount).toBe(3);
  });

  test('Données complètes dans les notifications', async () => {
    const bookingData = createValidBookingData();
    
    let notificationPayload;
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url.includes('/api/notifications/')) {
        notificationPayload = JSON.parse(options.body);
        return Promise.resolve({ ok: true });
      }
    });
    
    await createBooking(bookingData);
    
    // Vérifier que toutes les données sont présentes
    expect(notificationPayload.customerName).toBeDefined();
    expect(notificationPayload.serviceDate).toBeDefined();
    expect(notificationPayload.serviceAddress).toBeDefined();
    expect(notificationPayload.totalAmount).toBeDefined();
  });
});
```

#### **C. Tests de Validation des Prix avec Limites**
```typescript
// tests/critiques/validation-prix.test.ts
describe('Tests Critiques - Validation des Prix', () => {
  test('Prix négatifs rejetés', async () => {
    const formData = createFormDataWithNegativePrice();
    
    await expect(calculatePrice(formData)).rejects.toThrow('Prix négatif interdit');
  });

  test('Prix excessifs rejetés', async () => {
    const formData = createFormDataWithExcessivePrice();
    
    await expect(calculatePrice(formData)).rejects.toThrow('Prix excessif (>50k€)');
  });

  test('Cohérence prix total vs prix de base', async () => {
    const formData = createFormDataWithInconsistentPrices();
    
    await expect(calculatePrice(formData)).rejects.toThrow('Prix total < prix de base');
  });

  test('Promotions avec limites de sécurité', async () => {
    const formData = createFormDataWithExcessiveDiscount();
    
    await expect(applyPromotion(formData)).rejects.toThrow('Réduction excessive (>50%)');
  });

  test('Validation des plages de prix par service', async () => {
    const testCases = [
      { service: 'nettoyage', minPrice: 50, maxPrice: 500 },
      { service: 'demenagement', minPrice: 200, maxPrice: 2000 },
      { service: 'livraison', minPrice: 30, maxPrice: 300 }
    ];
    
    for (const testCase of testCases) {
      const formData = createFormDataForService(testCase.service);
      const price = await calculatePrice(formData);
      
      expect(price).toBeGreaterThanOrEqual(testCase.minPrice);
      expect(price).toBeLessThanOrEqual(testCase.maxPrice);
    }
  });
});
```

#### **D. Tests des Transactions Atomiques**
```typescript
// tests/critiques/transactions-atomiques.test.ts
describe('Tests Critiques - Transactions Atomiques', () => {
  test('Rollback en cas d\'échec de création de réservation', async () => {
    // Simuler un échec après création de QuoteRequest
    const mockBookingService = {
      createQuoteRequest: jest.fn().mockResolvedValue({ id: 'quote_123' }),
      createBooking: jest.fn().mockRejectedValue(new Error('Database error'))
    };
    
    await expect(createBookingWithTransaction(bookingData)).rejects.toThrow();
    
    // Vérifier que la QuoteRequest est supprimée (rollback)
    expect(mockBookingService.createQuoteRequest).toHaveBeenCalled();
    // Vérifier que la base de données est dans un état cohérent
  });

  test('Cohérence des données après transaction réussie', async () => {
    const bookingData = createValidBookingData();
    
    const result = await createBookingWithTransaction(bookingData);
    
    // Vérifier que toutes les entités sont créées
    expect(result.quoteRequest).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(result.customer).toBeDefined();
    
    // Vérifier les relations
    expect(result.booking.quoteRequestId).toBe(result.quoteRequest.id);
    expect(result.booking.customerId).toBe(result.customer.id);
  });

  test('Isolation des transactions concurrentes', async () => {
    const bookingData1 = createValidBookingData();
    const bookingData2 = createValidBookingData();
    
    // Lancer deux créations en parallèle
    const [result1, result2] = await Promise.all([
      createBookingWithTransaction(bookingData1),
      createBookingWithTransaction(bookingData2)
    ]);
    
    // Vérifier que les deux réservations sont créées indépendamment
    expect(result1.booking.id).not.toBe(result2.booking.id);
    expect(result1.quoteRequest.id).not.toBe(result2.quoteRequest.id);
  });
});
```

### **Phase 5 : Tests de Notifications**

#### **A. Tests des Services de Notification**
```typescript
// tests/notifications/services-notification.test.ts
import { mockServiceNotification } from '@/services/notificationService';

describe('Services de Notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit envoyer une notification WhatsApp après réservation', async () => {
    const donnéesRéservation = {
      id: 'res_123',
      client: {
        téléphone: '+33123456789',
        nom: 'Jean Dupont'
      },
      service: {
        type: 'nettoyage',
        date: '2024-02-15',
        horaire: 'matin-8h'
      }
    };
    
    await mockServiceNotification.envoyerNotificationRéservation(donnéesRéservation);
    
    expect(mockServiceNotification.envoyerWhatsApp).toHaveBeenCalledWith({
      à: '+33123456789',
      message: 'Bonjour Jean Dupont, votre réservation de nettoyage du 15/02/2024 à 8h a été confirmée !'
    });
  });

  test('doit envoyer un email de confirmation', async () => {
    const donnéesRéservation = {
      id: 'res_123',
      client: {
        email: 'jean.dupont@email.com',
        nom: 'Jean Dupont'
      }
    };
    
    await mockServiceNotification.envoyerEmailConfirmation(donnéesRéservation);
    
    expect(mockServiceNotification.envoyerEmail).toHaveBeenCalledWith({
      à: 'jean.dupont@email.com',
      sujet: 'Confirmation de votre réservation',
      contenu: expect.stringContaining('Votre réservation a été confirmée')
    });
  });

  test('doit notifier l\'équipe de la nouvelle réservation', async () => {
    const donnéesRéservation = {
      id: 'res_123',
      service: {
        type: 'nettoyage',
        date: '2024-02-15',
        horaire: 'matin-8h'
      }
    };
    
    await mockServiceNotification.notifierÉquipe(donnéesRéservation);
    
    expect(mockServiceNotification.envoyerNotificationÉquipe).toHaveBeenCalledWith({
      type: 'nouvelle_réservation',
      données: donnéesRéservation
    });
  });
});
```

#### **B. Tests d'Intégration des Notifications**
```typescript
// tests/intégration/notifications.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Intégration - Notifications', () => {
  test('Notifications envoyées après paiement réussi', async ({ page }) => {
    // Intercepter les appels API de notification
    await page.route('**/api/notifications/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ succès: true })
      });
    });
    
    // Procéder au paiement
    await page.goto('/réservation/123/paiement');
    await page.remplir('[data-testid="numéro-carte"]', '4242424242424242');
    await page.cliquer('[data-testid="bouton-payer"]');
    
    // Vérifier que les notifications sont envoyées
    const requêtesNotification = await page.waitForRequest('**/api/notifications/**');
    expect(requêtesNotification.url()).toContain('/api/notifications');
  });

  test('Gestion des échecs de notification', async ({ page }) => {
    // Simuler un échec de notification
    await page.route('**/api/notifications/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ erreur: 'Service indisponible' })
      });
    });
    
    await page.goto('/réservation/123/paiement');
    await page.remplir('[data-testid="numéro-carte"]', '4242424242424242');
    await page.cliquer('[data-testid="bouton-payer"]');
    
    // Vérifier que l'erreur est gérée gracieusement
    await expect(page.locator('[data-testid="message-erreur-notification"]')).toBeVisible();
  });
});
```

---

## ⚙️ **CONFIGURATION DE TEST**

### **A. Environnement de Test**
```typescript
// tests/setup/environnement-test.ts
export const configurationTest = {
  baseDeDonnées: {
    url: process.env.URL_BASE_DONNÉES_TEST,
    // Utiliser une base de données de test isolée
  },
  stripe: {
    cléSecrète: process.env.CLÉ_SECRÈTE_STRIPE_TEST,
    secretWebhook: process.env.SECRET_WEBHOOK_STRIPE_TEST
  },
  notifications: {
    whatsapp: {
      activé: false, // Désactiver en test
      simulation: true
    },
    email: {
      activé: false,
      simulation: true
    }
  }
};
```

### **B. Données de Test**
```typescript
// tests/fixtures/données-test.ts
export const donnéesRéservationTest = {
  typeService: 'nettoyage',
  datePrévue: '2024-02-15',
  horaire: 'matin-8h',
  adresse: '123 Rue de la Paix, Paris',
  surface: 50,
  durée: 2,
  professionnels: 1,
  prix: 120
};

export const donnéesClientTest = {
  nom: 'Jean Dupont',
  email: 'jean.dupont@email.com',
  téléphone: '+33123456789'
};

export const cartesTestStripe = {
  succès: '4242424242424242',
  échec: '4000000000000002',
  authentification3DS: '4000002500003155'
};
```

### **C. Utilitaires de Test**
```typescript
// tests/utils/helpers-test.ts
export class HelpersTest {
  static async créerRéservationTest(page: Page, données: any) {
    await page.goto('/catalogue/service-nettoyage');
    await page.remplir('[name="scheduledDate"]', données.datePrévue);
    await page.remplir('[name="location"]', données.adresse);
    await page.remplir('[name="surface"]', données.surface.toString());
    await page.cliquer('[data-testid="bouton-soumettre"]');
  }

  static async procéderPaiement(page: Page, numéroCarte: string) {
    await page.remplir('[data-testid="numéro-carte"]', numéroCarte);
    await page.remplir('[data-testid="expiration-carte"]', '12/25');
    await page.remplir('[data-testid="cvc-carte"]', '123');
    await page.cliquer('[data-testid="bouton-payer"]');
  }

  static async vérifierNotificationEnvoyée(page: Page, type: string) {
    const requête = await page.waitForRequest(`**/api/notifications/${type}`);
    expect(requête).toBeTruthy();
  }
}
```

---

## 🚀 **PIPELINE CI/CD**

### **A. Workflow GitHub Actions**
```yaml
# .github/workflows/suite-tests.yml
name: Suite de Tests
on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Installer les dépendances
        run: npm ci
      
      - name: Exécuter les tests unitaires
        run: npm run test:unit
      
      - name: Exécuter les tests d'intégration
        run: npm run test:intégration
      
      - name: Exécuter les tests E2E
        run: npm run test:e2e
      
      - name: Générer le rapport de couverture
        run: npm run test:couverture
      
      - name: Télécharger les artefacts de test
        uses: actions/upload-artifact@v3
        with:
          name: rapports-tests
          path: rapports/
```

### **B. Scripts de Test**
```json
// package.json
{
  "scripts": {
    "test:unit": "jest tests/unitaires",
    "test:intégration": "playwright test tests/intégration",
    "test:e2e": "playwright test tests/e2e",
    "test:couverture": "jest --coverage",
    "test:performance": "playwright test tests/performance",
    "test:notifications": "jest tests/notifications",
    "test:paiements": "playwright test tests/paiement"
  }
}
```

---

## 📊 **MÉTRIQUES ET MONITORING**

### **A. Tests de Performance**
```typescript
// tests/performance/performance-réservation.test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance - Réservation', () => {
  test('Performance du formulaire de réservation', async ({ page }) => {
    const tempsDébut = Date.now();
    
    await page.goto('/catalogue/service-nettoyage');
    await page.remplir('[name="scheduledDate"]', '2024-02-15');
    
    const tempsFin = Date.now();
    const tempsChargement = tempsFin - tempsDébut;
    
    // Vérifier que le formulaire se charge en moins de 2 secondes
    expect(tempsChargement).toBeLessThan(2000);
  });

  test('Performance du calcul de prix', async ({ page }) => {
    await page.goto('/catalogue/service-nettoyage');
    
    const tempsDébut = Date.now();
    await page.remplir('[name="surface"]', '50');
    const tempsFin = Date.now();
    
    const tempsCalcul = tempsFin - tempsDébut;
    
    // Vérifier que le calcul de prix se fait en moins de 500ms
    expect(tempsCalcul).toBeLessThan(500);
  });
});
```

### **B. Tests de Disponibilité**
```typescript
// tests/disponibilité/disponibilité-services.test.ts
test('Vérification de la disponibilité des services', async ({ page }) => {
  // Vérifier que tous les services sont disponibles
  await page.goto('/catalogue');
  
  const services = await page.locator('[data-testid="carte-service"]').count();
  expect(services).toBeGreaterThan(0);
  
  // Vérifier que les prix sont affichés
  await expect(page.locator('[data-testid="prix-service"]')).toBeVisible();
});
```

### **C. Tests de Monitoring des Points Critiques**
```typescript
// tests/monitoring/points-critiques.test.ts
describe('Monitoring des Points Critiques', () => {
  test('Détection des échecs de soumission', async () => {
    const monitoringService = new CriticalPointsMonitor();
    
    // Simuler un échec de soumission
    await simulateSubmissionFailure();
    
    // Vérifier que l'alerte est déclenchée
    const alerts = await monitoringService.getActiveAlerts();
    expect(alerts).toContainEqual({
      type: 'submission_failure',
      severity: 'critical',
      message: 'Taux d\'échec de soumission > 5%'
    });
  });

  test('Détection des échecs de paiement', async () => {
    const monitoringService = new CriticalPointsMonitor();
    
    // Simuler des échecs de paiement
    await simulatePaymentFailures(10);
    
    // Vérifier que l'alerte est déclenchée
    const alerts = await monitoringService.getActiveAlerts();
    expect(alerts).toContainEqual({
      type: 'payment_failure',
      severity: 'critical',
      message: 'Taux d\'échec de paiement > 2%'
    });
  });

  test('Détection des notifications non envoyées', async () => {
    const monitoringService = new CriticalPointsMonitor();
    
    // Simuler des notifications échouées
    await simulateNotificationFailures();
    
    // Vérifier que l'alerte est déclenchée
    const alerts = await monitoringService.getActiveAlerts();
    expect(alerts).toContainEqual({
      type: 'notification_failure',
      severity: 'high',
      message: 'Notifications non envoyées détectées'
    });
  });

  test('Détection des prix incohérents', async () => {
    const monitoringService = new CriticalPointsMonitor();
    
    // Simuler des prix incohérents
    await simulateInconsistentPrices();
    
    // Vérifier que l'alerte est déclenchée
    const alerts = await monitoringService.getActiveAlerts();
    expect(alerts).toContainEqual({
      type: 'price_inconsistency',
      severity: 'high',
      message: 'Prix incohérents détectés'
    });
  });

  test('Métriques de performance en temps réel', async () => {
    const monitoringService = new CriticalPointsMonitor();
    
    // Mesurer les métriques de performance
    const metrics = await monitoringService.getPerformanceMetrics();
    
    // Vérifier que les métriques sont dans les limites acceptables
    expect(metrics.formLoadTime).toBeLessThan(2000); // < 2s
    expect(metrics.priceCalculationTime).toBeLessThan(500); // < 500ms
    expect(metrics.submissionSuccessRate).toBeGreaterThan(0.99); // > 99%
    expect(metrics.paymentSuccessRate).toBeGreaterThan(0.995); // > 99.5%
  });
});
```

---

## 🎯 **RECOMMANDATIONS FINALES**

### **1. Priorités de Test Mises à Jour**
1. **Tests des points critiques identifiés** (URGENCE MAXIMALE) - Corriger les problèmes critiques
2. **Tests de calcul de prix avec limites** (critique) - Garantir la précision et la sécurité des tarifs
3. **Tests de paiement Stripe** (critique) - Sécuriser les transactions
4. **Tests de notifications réelles** (critique) - S'assurer que les notifications sont réellement envoyées
5. **Tests de transactions atomiques** (critique) - Garantir la cohérence des données
6. **Tests de performance** (important) - Optimiser l'expérience utilisateur
7. **Tests de monitoring** (important) - Détecter les problèmes en temps réel

### **2. Outils Recommandés**
- **Playwright** pour les tests E2E (plus moderne que Cypress)
- **Jest** pour les tests unitaires
- **MSW** pour le mocking des APIs
- **Docker** pour l'isolation des environnements

### **3. Métriques de Succès**
- **Couverture de code** : > 80%
- **Temps de réponse** : < 2s pour les formulaires
- **Taux de succès des paiements** : > 99%
- **Délai de notification** : < 30s

### **4. Plan d'Exécution Mis à Jour**
1. **Semaine 1 - URGENCE** : Tests des points critiques identifiés
   - Tests des hooks de soumission unifiés
   - Tests des notifications réelles vs simulées
   - Tests de validation des prix avec limites
   - Tests des transactions atomiques

2. **Semaine 2** : Tests unitaires et d'intégration
   - Tests des composants de formulaire
   - Tests des services de données
   - Tests des calculs de prix

3. **Semaine 3** : Tests E2E et de paiement
   - Tests du flux complet de réservation
   - Tests d'intégration Stripe
   - Tests des webhooks

4. **Semaine 4** : Tests de performance et monitoring
   - Tests de performance des formulaires
   - Tests de monitoring des points critiques
   - Tests de disponibilité des services

### **5. Métriques de Succès Mises à Jour**
- **Taux de succès des soumissions** : > 99% (actuellement problématique)
- **Taux de succès des paiements** : > 99.5% (actuellement problématique)
- **Taux de succès des notifications** : > 99% (actuellement simulées)
- **Cohérence des données** : 100% (transactions atomiques)
- **Temps de réponse moyen** : < 2s
- **Détection des problèmes** : < 5 minutes

---

## 📚 **RESSOURCES ADDITIONNELLES**

### **Documentation**
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Stripe Testing](https://stripe.com/docs/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### **Exemples de Code**
- Voir le dossier `tests/` pour les exemples complets
- Voir `tests/fixtures/` pour les données de test
- Voir `tests/utils/` pour les utilitaires de test

---

**Cette stratégie garantit une qualité de service élevée et une expérience utilisateur optimale ! 🚀**
