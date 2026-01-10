# 🧪 Tests de Réservation - Express Quote

Ce répertoire contient tous les tests pour le flux de réservation de l'application Express Quote.

## 📁 Structure des Tests

```
src/__tests__/flux-reservation/
├── e2e/                          # Tests End-to-End (Playwright)
│   └── reservation-complete.spec.ts
├── integration/                   # Tests d'Intégration (Playwright)
│   ├── flux-reservation.spec.ts
│   └── paiement-stripe.spec.ts
├── unitaire/                     # Tests Unitaires (Jest)
│   ├── composants/
│   │   ├── FormGenerator.test.tsx
│   │   └── CheckoutForm.test.tsx
│   ├── hooks/
│   │   └── useUnifiedSubmission.test.ts
│   └── api/
│       └── endpoints.test.ts
├── fixtures/                     # Données de Test
│   ├── donnees-reservation.ts
│   └── cartes-stripe.ts
├── utils/                        # Utilitaires de Test
│   └── helpers-test.ts
├── setup/                        # Configuration des Tests
│   ├── jest.setup.ts
│   └── playwright.setup.ts
├── jest.config.js                # Configuration Jest
└── README.md                     # Documentation
```

## 🎯 Composants Critiques Testés

### **Composants Frontend**
- **FormGenerator** : Générateur de formulaires dynamiques
- **CheckoutForm** : Formulaire de paiement Stripe
- **DetailForm** : Formulaire principal de réservation
- **SuccessRedirect** : Page de redirection après paiement

### **Hooks Critiques**
- **useUnifiedSubmission** : Soumission unifiée des formulaires
- **useFormPersistence** : Persistance des données de formulaire
- **useCentralizedPricing** : Calcul de prix en temps réel
- **useServiceConfig** : Configuration des services

### **Endpoints API**
- **POST /api/quotesRequest** : Création de demande de devis
- **POST /api/payment/create-session** : Création de session Stripe
- **POST /api/bookings/finalize** : Finalisation de réservation
- **GET /api/payment/status** : Statut de paiement
- **POST /api/webhooks/stripe** : Webhooks Stripe

## 🚀 Exécution des Tests

### **Tests Unitaires (Jest)**
```bash
# Tous les tests unitaires
npm run test:unit

# Tests spécifiques
npm run test:unit -- --testPathPattern=FormGenerator
npm run test:unit -- --testPathPattern=useUnifiedSubmission
```

### **Tests d'Intégration (Playwright)**
```bash
# Tous les tests d'intégration
npm run test:integration

# Tests spécifiques
npm run test:integration -- --grep "Flux de réservation"
npm run test:integration -- --grep "Paiement Stripe"
```

### **Tests E2E (Playwright)**
```bash
# Tous les tests E2E
npm run test:e2e

# Tests spécifiques
npm run test:e2e -- --grep "Réservation Complète"
```

### **Tous les Tests**
```bash
# Exécuter tous les tests
npm run test:all

# Avec couverture
npm run test:coverage
```

## 📊 Couverture de Code

Les tests visent une couverture de **80%** minimum pour :
- **Branches** : 80%
- **Fonctions** : 80%
- **Lignes** : 80%
- **Statements** : 80%

## 🔧 Configuration

### **Variables d'Environnement de Test**
```env
NODE_ENV=test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123
STRIPE_SECRET_KEY=sk_test_123
STRIPE_WEBHOOK_SECRET=whsec_test_123
DATABASE_URL=postgresql://test:test@localhost:5432/test
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **Configuration Jest**
- Environnement : `jsdom`
- Timeout : 30 secondes
- Setup : `jest.setup.ts`
- Couverture : HTML + Console

### **Configuration Playwright**
- Navigateurs : Chromium, Firefox, WebKit
- Timeout : 30 secondes
- Viewport : 1280x720
- Setup : `playwright.setup.ts`

## 📝 Données de Test

### **Données de Réservation**
- **Nettoyage** : Surface, durée, contraintes
- **Déménagement** : Volume, distance, options
- **Livraison** : Poids, dimensions, assurance

### **Cartes Stripe de Test**
- **Succès** : Visa, Mastercard, Amex
- **Échecs** : Carte refusée, fonds insuffisants
- **3D Secure** : Authentification requise
- **Internationales** : UK, Allemagne, Espagne

### **Webhooks Stripe**
- **payment_intent.succeeded** : Paiement réussi
- **payment_intent.payment_failed** : Paiement échoué
- **checkout.session.completed** : Session terminée

## 🎭 Scénarios de Test

### **Flux de Réservation Standard**
1. Navigation vers le catalogue
2. Sélection du service
3. Remplissage du formulaire
4. Calcul de prix en temps réel
5. Soumission du formulaire
6. Création du QuoteRequest
7. Redirection vers la page de paiement
8. Création de la session Stripe
9. Paiement avec Stripe
10. Webhook de confirmation
11. Finalisation du Booking
12. Redirection vers la page de succès

### **Gestion des Erreurs**
- Validation des champs
- Erreurs de réseau
- Échecs de paiement
- Timeouts
- Erreurs de base de données

### **Performance**
- Temps de chargement
- Temps de calcul de prix
- Temps de soumission
- Temps de paiement

### **Accessibilité**
- Navigation au clavier
- Attributs ARIA
- Contraste des couleurs
- Responsive design

## 🔍 Debugging

### **Logs de Test**
```bash
# Activer les logs détaillés
DEBUG=playwright:* npm run test:e2e

# Logs Jest
npm run test:unit -- --verbose
```

### **Screenshots et Vidéos**
```bash
# Générer des screenshots
npm run test:e2e -- --screenshot

# Générer des vidéos
npm run test:e2e -- --video
```

### **Tests en Mode Headless**
```bash
# Désactiver le mode headless
npm run test:e2e -- --headed
```

## 📈 Métriques de Qualité

### **Indicateurs de Performance**
- Temps de chargement < 2s
- Temps de calcul de prix < 500ms
- Temps de soumission < 3s
- Temps de paiement < 5s

### **Indicateurs de Fiabilité**
- Taux de succès des tests > 95%
- Couverture de code > 80%
- Temps d'exécution des tests < 10min

## 🚨 Dépannage

### **Problèmes Courants**
1. **Tests qui échouent** : Vérifier les mocks et les données de test
2. **Timeouts** : Augmenter les timeouts ou vérifier les performances
3. **Erreurs de base de données** : Vérifier la configuration de test
4. **Erreurs Stripe** : Vérifier les clés de test

### **Support**
- Documentation : Ce fichier README
- Issues : GitHub Issues
- Logs : Console et fichiers de log
- Debug : Mode debug des tests

## 🔄 Maintenance

### **Mise à Jour des Tests**
- Ajouter de nouveaux scénarios
- Mettre à jour les données de test
- Améliorer la couverture
- Optimiser les performances

### **Nettoyage**
- Supprimer les tests obsolètes
- Nettoyer les données de test
- Optimiser les mocks
- Réduire les timeouts