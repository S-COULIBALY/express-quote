# 📋 Ordre d'Exécution Recommandé des Tests

## 🎯 Stratégie: Approche Bottom-Up

Exécuter les tests du bas vers le haut permet de valider les fondations avant les couches supérieures. Si un test de niveau supérieur échoue, vous savez que le problème n'est pas dans les couches inférieures déjà validées.

---

## **Niveau 1: Tests Unitaires - Fondations (Base)** ⚙️

Ces tests doivent passer en premier car ils testent les briques de base:

### 1. **unitaire/database/models.test.ts**
- Modèles Prisma (Booking, Customer, QuoteRequest, Moving)
- CRUD de base
- Relations et validations

```bash
npm run test:unit -- unitaire/database/models.test.ts
```

### 2. **unitaire/services/RuleEngine.test.ts**
- Moteur de règles métier
- Tri et exécution des règles
- Gestion des erreurs

```bash
npm run test:unit -- unitaire/services/RuleEngine.test.ts
```

### 3. **unitaire/services/AutoDetectionService.test.ts**
- Auto-détection des contraintes (monte-meuble, distance portage)
- Validation des adresses
- Calcul des surcharges automatiques

```bash
npm run test:unit -- unitaire/services/AutoDetectionService.test.ts
```

---

## **Niveau 2: Tests Unitaires - Logique Métier** 💼

### 4. **unitaire/business/booking-flow.test.ts**
- Flux de réservation avec scopes réalistes
- Transitions d'état (PENDING → CONFIRMED → COMPLETED)
- Calculs de prix avec contraintes

```bash
npm run test:unit -- unitaire/business/booking-flow.test.ts
```

### 5. **unitaire/security/security-validations.test.ts**
- Validations de sécurité
- Protection contre les injections
- Sanitization des données

```bash
npm run test:unit -- unitaire/security/security-validations.test.ts
```

---

## **Niveau 3: Tests Unitaires - API** 🔌

### 6. **unitaire/api/endpoints.test.ts**
- Endpoints API isolés
- Validation des requêtes/réponses
- Gestion des erreurs HTTP

```bash
npm run test:unit -- unitaire/api/endpoints.test.ts
```

---

## **Niveau 4: Tests Unitaires - Composants React** ⚛️

### 7. **unitaire/composants/FormGenerator.test.tsx**
- Générateur de formulaires dynamiques
- Rendu des champs selon configuration

```bash
npm run test:unit -- unitaire/composants/FormGenerator.test.tsx
```

### 8. **unitaire/composants/AccessConstraintsModal.test.tsx**
- Modal de contraintes/services
- Catégorisation par adresse (PICKUP/DELIVERY)
- Auto-détection visuelle

```bash
npm run test:unit -- unitaire/composants/AccessConstraintsModal.test.tsx
```

### 9. **unitaire/composants/CataloguePage.test.tsx**
- Page catalogue
- Performance et cache
- Navigation

```bash
npm run test:unit -- unitaire/composants/CataloguePage.test.tsx
```

### 10. **unitaire/composants/CheckoutForm.test.tsx**
- Formulaire de paiement Stripe
- Validation des champs
- Soumission sécurisée

```bash
npm run test:unit -- unitaire/composants/CheckoutForm.test.tsx
```

---

## **Niveau 5: Tests Unitaires - Hooks** 🎣

### 11. **unitaire/hooks/useUnifiedSubmission.test.ts**
- Hook de soumission unifiée
- Gestion des états
- Appels API

```bash
npm run test:unit -- unitaire/hooks/useUnifiedSubmission.test.ts
```

---

## **Niveau 6: Tests d'Intégration** 🔗

### 12. **integration/flux-reservation.spec.ts**
- Flux de réservation complet (UI + API)
- Calcul de prix en temps réel
- Soumission de formulaire

```bash
npm run test:integration -- integration/flux-reservation.spec.ts
```

### 13. **integration/security-payment.spec.ts**
- Sécurité du paiement
- Validation des montants
- Protection contre les tampering

```bash
npm run test:integration -- integration/security-payment.spec.ts
```

### 14. **integration/paiement-stripe.spec.ts**
- Intégration Stripe complète
- Webhooks
- Session de paiement

```bash
npm run test:integration -- integration/paiement-stripe.spec.ts
```

---

## **Niveau 7: Tests End-to-End (E2E)** 🎭

### 15. **e2e/reservation-complete.spec.ts**
- Flux complet de bout en bout
- Navigation réelle
- Paiement Stripe réel (test mode)
- Vérification finale en base de données

```bash
npm run test:e2e -- e2e/reservation-complete.spec.ts
```

---

## 🚀 Commandes Rapides par Niveau

### Exécuter tous les tests d'un niveau

```bash
# Niveau 1: Fondations
npm run test:unit -- unitaire/database/models.test.ts unitaire/services/RuleEngine.test.ts unitaire/services/AutoDetectionService.test.ts

# Niveau 2: Logique Métier
npm run test:unit -- unitaire/business/booking-flow.test.ts unitaire/security/security-validations.test.ts

# Niveau 3: API
npm run test:unit -- unitaire/api/endpoints.test.ts

# Niveau 4: Composants
npm run test:unit -- unitaire/composants/

# Niveau 5: Hooks
npm run test:unit -- unitaire/hooks/

# Niveau 6: Intégration
npm run test:integration

# Niveau 7: E2E
npm run test:e2e
```

### Exécuter tous les tests dans l'ordre

```bash
# Tous les tests unitaires
npm run test:unit

# Tous les tests d'intégration
npm run test:integration

# Tous les tests E2E
npm run test:e2e

# TOUT (à exécuter en dernier)
npm run test:all
```

---

## ✅ Checklist de Validation

- [ ] **Niveau 1**: Tous les tests de fondations passent
- [ ] **Niveau 2**: Tous les tests de logique métier passent
- [ ] **Niveau 3**: Tous les tests d'API passent
- [ ] **Niveau 4**: Tous les tests de composants passent
- [ ] **Niveau 5**: Tous les tests de hooks passent
- [ ] **Niveau 6**: Tous les tests d'intégration passent
- [ ] **Niveau 7**: Tous les tests E2E passent

---

## 📊 Métriques de Qualité Attendues

### Couverture de Code
- **Branches**: ≥ 80%
- **Fonctions**: ≥ 80%
- **Lignes**: ≥ 80%
- **Statements**: ≥ 80%

### Performance
- **Tests unitaires**: < 30s par fichier
- **Tests d'intégration**: < 60s par fichier
- **Tests E2E**: < 120s par fichier
- **Total**: < 10 minutes

### Fiabilité
- **Taux de succès**: > 95%
- **Tests flaky**: 0
- **Timeouts**: 0

---

## 🔍 Debugging

Si un test échoue:

1. **Vérifier le niveau inférieur**: Tous les tests des niveaux 1-N passent-ils?
2. **Isoler le test**: Exécuter uniquement ce test avec `--verbose`
3. **Vérifier les données**: Les fixtures sont-elles à jour?
4. **Vérifier les mocks**: Les mocks sont-ils correctement configurés?
5. **Vérifier la BDD**: Les UUIDs réels sont-ils présents?

```bash
# Exécuter un test spécifique en mode verbose
npm run test:unit -- unitaire/services/AutoDetectionService.test.ts --verbose

# Exécuter avec coverage
npm run test:unit -- unitaire/services/AutoDetectionService.test.ts --coverage

# Exécuter en mode watch
npm run test:unit -- unitaire/services/AutoDetectionService.test.ts --watch
```
