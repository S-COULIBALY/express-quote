# 📋 Documentation Complète - Flux de Création de Réservation

> Documentation détaillée de toutes les modifications apportées pour garantir le flux complet et cohérent de création d'une réservation, depuis le frontend jusqu'à la base de données.

---

## 🎯 Objectif

Garantir que le flux complet de création d'une réservation fonctionne correctement de bout en bout :

- ✅ Transmission correcte des données du frontend (scénario sélectionné, options d'assurance)
- ✅ Calcul et validation du prix côté serveur avec les bonnes données
- ✅ Création de la réservation avec toutes les données préservées
- ✅ Cohérence entre le prix affiché au client et le prix validé côté serveur

---

## 🔍 Problèmes Identifiés et Corrigés

### 1. Prix du scénario sélectionné non transmis

**Problème** : Le prix du scénario sélectionné par l'utilisateur n'était pas correctement transmis lors de la soumission.

**Fichier modifié** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`

**Correction** :

```typescript
// ✅ Récupérer le prix du scénario sélectionné depuis multiOffers
let scenarioPrice = quotation.calculatedPrice; // Fallback sur le prix recommandé
if (selectedScenario && quotation.multiOffers) {
  const selectedQuote = quotation.multiOffers.quotes.find(
    (q) => q.scenarioId === selectedScenario,
  );
  if (selectedQuote?.pricing?.finalPrice) {
    scenarioPrice = selectedQuote.pricing.finalPrice;
  }
}
```

### 2. Prix total avec options d'assurance non calculé

**Problème** : Le prix total incluant les options d'assurance (protection objets fragiles + assurance valeur déclarée) n'était pas correctement calculé et transmis.

**Fichier modifié** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`

**Correction** :

```typescript
// ✅ Calculer le prix total avec les options d'assurance
const fragileProtectionAmount = options.fragileProtection ? 29 : 0;
const insurancePremium = options.declaredValueInsurance
  ? calculateInsurancePremium(options.declaredValue)
  : 0;
const totalPriceWithOptions =
  scenarioPrice + fragileProtectionAmount + insurancePremium;
```

### 3. Priorisation incorrecte des prix dans useUnifiedSubmission

**Problème** : Le hook `useUnifiedSubmission` ne priorisait pas correctement le prix du scénario sélectionné depuis `formData`.

**Fichier modifié** : `src/hooks/generic/useUnifiedSubmission.tsx`

**Correction** :

```typescript
// ✅ Prioriser le prix depuis formData si disponible (scénario sélectionné)
const scenarioPrice = formData.calculatedPrice || calculatedPrice;
const totalPriceWithOptions =
  formData.totalPrice ||
  scenarioPrice +
    (formData.fragileProtectionAmount || 0) +
    (formData.insurancePremium || 0);
```

### 4. Recalcul serveur ignorait le scénario sélectionné

**Problème** : Le `QuoteRequestController` utilisait toujours le scénario 'STANDARD' au lieu du scénario sélectionné par l'utilisateur.

**Fichier modifié** : `src/quotation/interfaces/http/controllers/QuoteRequestController.ts`

**Correction** :

```typescript
// ✅ Utiliser le scénario sélectionné par le client si disponible
const selectedScenarioId = quoteData.selectedScenario || "STANDARD";
const targetScenario = STANDARD_SCENARIOS.find(
  (s) => s.id === selectedScenarioId,
);
const scenariosToUse = targetScenario
  ? [targetScenario]
  : [STANDARD_SCENARIOS[0]];
```

### 5. Options d'assurance non appliquées dans BookingCreationService

**Problème** : Le service de création de réservation n'appliquait pas correctement les nouvelles options d'assurance (`fragileProtectionAmount`, `insurancePremium`).

**Fichier modifié** : `src/quotation/application/services/booking/BookingCreationService.ts`

**Correction** :

```typescript
// ✅ NOUVEAU SYSTÈME : Support des options modernes
const fragileProtectionAmount = quoteData.fragileProtectionAmount || 0;
const declaredValueInsurancePremium = quoteData.insurancePremium || 0;

if (fragileProtectionAmount > 0) {
  finalPrice += fragileProtectionAmount;
}

if (declaredValueInsurancePremium > 0) {
  finalPrice += declaredValueInsurancePremium;
}
```

### 6. BookingPriceRecalculationService n'appliquait pas les options d'assurance

**Problème** : Le service de recalcul de prix n'appliquait pas les options d'assurance après avoir calculé le prix du scénario.

**Fichier modifié** : `src/quotation/application/services/booking/pricing/BookingPriceRecalculationService.ts`

**Correction** :

```typescript
// ✅ Ajouter les options d'assurance au prix du scénario (inline dans recalculateWithModularSystem)
const fragileProtectionAmount = quoteData.fragileProtectionAmount || 0;
const insurancePremium = quoteData.insurancePremium || 0;
const totalPriceWithOptions =
  selectedVariant.finalPrice + fragileProtectionAmount + insurancePremium;

if (fragileProtectionAmount > 0 || insurancePremium > 0) {
  logger.info(
    `✅ [MODULAIRE] Options d'assurance ajoutées: +${fragileProtectionAmount + insurancePremium}€ (prix final: ${totalPriceWithOptions}€)`,
  );
  return totalPriceWithOptions;
}

return selectedVariant.finalPrice;
```

### 7. Recalcul dans create-session ignorait le scénario et les options

**Problème** : L'API `/api/payment/create-session` utilisait `/api/quotation/calculate` qui ne prenait pas en compte le `selectedScenario` ni les options d'assurance.

**Fichier modifié** : `src/app/api/payment/create-session/route.ts`

**Correction** :

```typescript
// ✅ CORRECTION: Utiliser BookingPriceRecalculationService qui prend en compte selectedScenario et options d'assurance
const priceRecalculationService = new BookingPriceRecalculationService();
serverCalculatedPrice = await priceRecalculationService.recalculate(
  quoteData,
  quoteRequest.type,
);
```

### 8. Suppression du système legacy d'assurance

**Problème** : Le code contenait encore des références au système legacy d'assurance (`insurance`, `insuranceAmount`, `wantsInsurance`).

**Fichier modifié** : `src/quotation/application/services/booking/BookingCreationService.ts`

**Correction** : Suppression complète du code legacy, ne gardant que le nouveau système avec `fragileProtection` et `insurancePremium`.

---

## 🔄 Flux Complet Final

### Étape 1 : Frontend - Sélection et Soumission

**Fichier** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`

1. L'utilisateur sélectionne un scénario (ECO, STANDARD, CONFORT, etc.)
2. L'utilisateur sélectionne les options d'assurance :
   - Protection objets fragiles (+29€)
   - Assurance valeur déclarée (calculée dynamiquement)
3. Au clic sur "Réserver", `handleSubmitFromPaymentCard` :
   - Récupère le prix du scénario sélectionné depuis `quotation.multiOffers`
   - Calcule le prix total avec les options d'assurance
   - Envoie toutes les données via `submissionHook.submit()`

**Données envoyées** :

```typescript
{
  calculatedPrice: scenarioPrice,        // Prix du scénario (base)
  totalPrice: totalPriceWithOptions,      // Prix total avec options
  fragileProtection: boolean,
  fragileProtectionAmount: number,
  declaredValueInsurance: boolean,
  declaredValue: number,
  insurancePremium: number,
  selectedScenario: string
}
```

### Étape 2 : Hook de Soumission

**Fichier** : `src/hooks/generic/useUnifiedSubmission.tsx`

1. `submitQuoteRequest` priorise les prix depuis `formData` :
   - `scenarioPrice` = `formData.calculatedPrice` (prix du scénario)
   - `totalPriceWithOptions` = `formData.totalPrice` (prix total avec options)
2. Envoie les données à `/api/quotesRequest`

### Étape 3 : Création du QuoteRequest

**Fichier** : `src/quotation/interfaces/http/controllers/QuoteRequestController.ts`

1. Recalcule le prix côté serveur avec le système modulaire :
   - Utilise `quoteData.selectedScenario` si disponible
   - Calcule le `baseCost` puis génère le prix pour le scénario choisi
   - Applique les options d'assurance (`fragileProtectionAmount`, `insurancePremium`)
2. Crée un `securedPrice` avec signature HMAC :
   - `totalPrice` = prix du scénario + options d'assurance
   - `basePrice` = prix du scénario (sans options)
   - `calculationId` = identifiant unique du calcul
   - `signature` = signature cryptographique pour validation
   - Les options d'assurance (`fragileProtectionAmount`, `insurancePremium`) sont incluses dans `priceCalculationRequest` via le spread de `quoteData` (`...quoteData`), garantissant qu'elles font partie de la signature HMAC
3. Stocke le `QuoteRequest` avec toutes les données dans `quoteData` (Json)

### Étape 4 : Redirection vers la Page de Paiement

**Fichier** : `src/hooks/business/DemenagementSurMesure/demenagementSurMesureSubmissionConfig.ts`

Redirection vers : `/booking/${temporaryId}`

### Étape 5 : Page de Booking

**Fichier** : `src/app/booking/[temporaryId]/page.tsx`

1. Charge le `QuoteRequest` via `/api/quotesRequest/${temporaryId}`
2. Crée une session Stripe via `/api/payment/create-session`
3. Envoie `quoteRequest.quoteData` à l'API (contient toutes les données)

### Étape 6 : Création de la Session Stripe

**Fichier** : `src/app/api/payment/create-session/route.ts`

1. **Si signature valide** :
   - Utilise `quoteData.securedPrice.totalPrice` (déjà correct avec scénario et options)
   - Crée le PaymentIntent avec ce prix

2. **Si signature invalide/absente** :
   - Utilise `BookingPriceRecalculationService.recalculate()`
   - Prend en compte `selectedScenario` et les options d'assurance
   - Recalcule le prix de manière sécurisée

3. Retourne le `clientSecret` et le prix recalculé pour affichage

### Étape 7 : Paiement et Webhook Stripe

**Fichier** : `src/app/api/webhooks/stripe/route.ts`

1. Stripe envoie `payment_intent.succeeded`
2. Appel à `/api/bookings/finalize`

### Étape 8 : Finalisation de la Réservation

**Fichier** : `src/quotation/application/services/booking/BookingCreationService.ts`

1. **Validation du prix** :
   - Utilise `BookingPriceValidationService` pour vérifier la signature
   - Si signature invalide, utilise `BookingPriceRecalculationService.recalculate()` qui :
     - Prend en compte `selectedScenario` pour le recalcul du prix du scénario
     - Applique ensuite `fragileProtectionAmount` et `insurancePremium` au prix du scénario (inline dans `recalculateWithModularSystem`)

2. **Transaction atomique** :
   - Crée/Update `Customer`
   - Crée `Booking` avec :
     - `totalAmount` = prix final validé
     - `additionalInfo.quoteData` = toutes les données du frontend (scénario, options, etc.)
     - `pickupAddress`, `deliveryAddress`, `scheduledDate`
   - Crée `Transaction` avec `paymentIntentId` (idempotence)
   - Update `QuoteRequest.status` = CONVERTED

3. **Stockage des données** :
   - Toutes les données du frontend sont préservées dans `Booking.additionalInfo.quoteData`
   - Le scénario sélectionné et les options d'assurance sont disponibles pour référence future

---

## 📊 Schéma de Données

### QuoteRequest.quoteData (Json)

```json
{
  "selectedScenario": "STANDARD",
  "calculatedPrice": 1500.0,
  "totalPrice": 1579.0,
  "fragileProtection": true,
  "fragileProtectionAmount": 29,
  "declaredValueInsurance": true,
  "declaredValue": 50000,
  "insurancePremium": 50.0,
  "securedPrice": {
    "totalPrice": 1579.0,
    "basePrice": 1500.0,
    "calculationId": "calc_...",
    "signature": "...",
    "calculatedAt": "2024-..."
  },
  "pickupAddress": "...",
  "deliveryAddress": "...",
  "scheduledDate": "..."
  // ... autres données du formulaire
}
```

### Booking.additionalInfo (Json)

```json
{
  "quoteData": {
    // Toutes les données du QuoteRequest.quoteData
    "selectedScenario": "STANDARD",
    "fragileProtection": true,
    "declaredValueInsurance": true
    // ...
  },
  "createdAt": "2024-...",
  "coordinates": {
    "latitude": 48.8566,
    "longitude": 2.3522,
    "source": "geocoding"
  }
}
```

---

## ✅ Vérifications Effectuées

### 1. Vérification du Schéma Prisma

**Fichier** : `prisma/schema.prisma`

✅ **QuoteRequest** :

- `quoteData` (Json) : Peut stocker toutes les données (selectedScenario, options, etc.)
- `temporaryId` (String, unique) : Pour identifier le QuoteRequest

✅ **Booking** :

- `totalAmount` (Float) : Prix final
- `additionalInfo` (Json?) : Stocke quoteData et métadonnées
- `quoteRequestId` (String?) : Lien vers QuoteRequest
- `pickupAddress`, `deliveryAddress`, `scheduledDate` : Données de base

✅ **Transaction** :

- `paymentIntentId` (String?) : Clé pour idempotence
- `amount`, `currency`, `status` : Suivi du paiement

**Conclusion** : Le schéma Prisma est complet et adapté au flux.

### 2. Vérification du Flux de Redirection

✅ Redirection après soumission : `/booking/${temporaryId}`
✅ Page de booking charge le QuoteRequest correctement
✅ Création de session Stripe avec les bonnes données

### 3. Vérification de la Cohérence des Prix

✅ Prix frontend = Prix serveur (avec validation signature)
✅ Scénario sélectionné pris en compte partout
✅ Options d'assurance appliquées correctement
✅ Recalcul sécurisé en cas de signature invalide

---

## 📁 Fichiers Modifiés

### Frontend

1. **`src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`**
   - Correction de `handleSubmitFromPaymentCard` pour récupérer le prix du scénario
   - Calcul correct du prix total avec options d'assurance

2. **`src/hooks/generic/useUnifiedSubmission.tsx`**
   - Priorisation des prix depuis `formData`
   - Logging amélioré pour traçabilité

### Backend - Contrôleurs

3. **`src/quotation/interfaces/http/controllers/QuoteRequestController.ts`**
   - Utilisation de `selectedScenario` pour le recalcul
   - Création de `securedPrice` avec le prix total incluant les options

### Backend - Services

4. **`src/quotation/application/services/booking/BookingCreationService.ts`**
   - Support des nouvelles options d'assurance
   - Suppression du système legacy
   - Stockage de `quoteData` dans `additionalInfo`

5. **`src/quotation/application/services/booking/pricing/BookingPriceRecalculationService.ts`**
   - Utilisation de `selectedScenario` pour le recalcul
   - Application des options d'assurance directement dans `recalculateWithModularSystem` (inline, pas de méthode séparée)

6. **`src/app/api/payment/create-session/route.ts`**
   - Utilisation de `BookingPriceRecalculationService` au lieu de `/api/quotation/calculate`
   - Prise en compte du scénario et des options lors du recalcul

---

## 🔒 Sécurité

### Validation des Prix

1. **Signature HMAC** : Le prix est signé cryptographiquement dans `securedPrice`
2. **Recalcul serveur** : Si signature invalide, recalcul complet avec validation
3. **Idempotence** : `paymentIntentId` empêche les doublons de réservation
4. **Vérification cohérence** : Comparaison prix client vs serveur avec logs d'alerte

### Stockage des Données

- Toutes les données sensibles sont stockées de manière sécurisée
- Les prix sont validés à chaque étape
- Les métadonnées de calcul sont préservées pour audit

---

## 🧪 Points de Vérification

Pour vérifier que le flux fonctionne correctement :

1. **Frontend** :
   - ✅ Sélection d'un scénario → Prix mis à jour
   - ✅ Sélection d'options d'assurance → Prix total mis à jour
   - ✅ Soumission → Données envoyées avec `selectedScenario` et options

2. **QuoteRequest** :
   - ✅ `quoteData.selectedScenario` présent
   - ✅ `quoteData.fragileProtectionAmount` et `quoteData.insurancePremium` présents
   - ✅ `quoteData.securedPrice.totalPrice` = prix scénario + options

3. **Booking** :
   - ✅ `totalAmount` = prix validé côté serveur
   - ✅ `additionalInfo.quoteData` contient toutes les données originales
   - ✅ `quoteRequestId` présent pour traçabilité

4. **Transaction** :
   - ✅ `paymentIntentId` présent (idempotence)
   - ✅ `amount` = montant payé (acompte 30%)
   - ✅ `status` = COMPLETED

---

## 📝 Notes Importantes

### Système d'Assurance

- **Ancien système supprimé** : `insurance`, `insuranceAmount`, `wantsInsurance`
- **Nouveau système** :
  - `fragileProtection` / `fragileProtectionAmount` : +29€ (Protection objets fragiles)
  - `declaredValueInsurance` / `insurancePremium` : Prime calculée (1% de la valeur déclarée, min 50€, max 5000€)

### Scénarios Multi-Offres

- Les 6 scénarios (ECO, STANDARD, CONFORT, PREMIUM, SECURITE, SECURITE+) sont supportés
- Le scénario sélectionné est préservé dans `quoteData.selectedScenario`
- Le prix du scénario est recalculé côté serveur pour validation

### Prix et Options

- **Prix de base** : Prix du scénario sélectionné (sans options)
- **Prix total** : Prix de base + options d'assurance
- **Acompte** : 30% du prix total
- **Reste** : 70% du prix total (payé le jour J)

---

## 🎯 Résultat Final

Le flux est maintenant **100% cohérent de bout en bout** :

1. ✅ Le prix affiché au client correspond au prix calculé et validé côté serveur
2. ✅ Le scénario sélectionné est préservé et utilisé partout
3. ✅ Les options d'assurance sont correctement appliquées et stockées
4. ✅ Toutes les données du frontend sont préservées dans la base de données
5. ✅ La sécurité est garantie avec validation cryptographique des prix
6. ✅ L'idempotence est assurée pour éviter les doublons

---

## 📚 Références

- **Architecture modulaire** : `src/quotation-module/docs/README.md`
- **Scénarios multi-offres** : `src/quotation-module/docs/SCENARIOS_ET_MODULES.md`
- **Configuration assurance** : `src/quotation-module/config/insurance.config.ts`
- **Flux de paiement Stripe** : `docs/FLUX_PAIEMENT_STRIPE.md`

---

**Date de création** : 2024-12-19  
**Dernière mise à jour** : 2024-12-19  
**Auteur** : Assistant IA (Claude Sonnet)
