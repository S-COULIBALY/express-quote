# 📋 Documentation des Logs - Flux Complet de Calcul de Prix

**Date**: 27 octobre 2025
**Version**: 1.0
**Objectif**: Traçabilité complète des données du Frontend au Backend

---

## 🎯 Vue d'ensemble

Ce document détaille tous les points de log dans les 2 flux principaux de calcul de prix:

1. **⚡ Calcul temps réel** (onChange des champs du formulaire)
2. **📝 Calcul soumission** (bouton "Réserver maintenant")

---

## 1️⃣ Flux: Calcul Temps Réel (onChange)

### 📍 Point d'entrée: Frontend

**Fichier**: `src/hooks/shared/useCentralizedPricing.ts`
**Ligne**: 70-78
**Fonction**: `calculatePrice()`

```typescript
devLog.debug('useCentralizedPricing', '💰 ÉTAPE C: Calcul prix centralisé - Request avant envoi API:', {
  serviceType: request.serviceType,
  pickupLogisticsConstraints: request.pickupLogisticsConstraints,
  deliveryLogisticsConstraints: request.deliveryLogisticsConstraints,
  additionalServices: request.additionalServices,
  pickupLogisticsConstraintsKeys: request.pickupLogisticsConstraints ? Object.keys(request.pickupLogisticsConstraints) : [],
  deliveryLogisticsConstraintsKeys: request.deliveryLogisticsConstraints ? Object.keys(request.deliveryLogisticsConstraints) : [],
  additionalServicesKeys: request.additionalServices ? Object.keys(request.additionalServices) : []
});
```

**Type de log**: `devLog.debug` (conditionnel - NEXT_PUBLIC_DEBUG=true)

**Données loggées**:
- ✅ `serviceType` (MOVING, CLEANING, DELIVERY, PACKING)
- ✅ `pickupLogisticsConstraints` (Object complet)
- ✅ `deliveryLogisticsConstraints` (Object complet)
- ✅ `additionalServices` (Object complet)
- ✅ Keys de chaque objet (pour debug rapide)

---

### 📍 API Endpoint: Backend

**Fichier**: `src/quotation/interfaces/http/controllers/PriceController.ts`
**Ligne**: 28-41
**Méthode**: `POST /api/price/calculate`
**Fonction**: `calculatePrice()`

```typescript
devLog.debug('PriceController', '📥 ÉTAPE 1: Données reçues du frontend:', {
  serviceType: data.serviceType,
  hasPickupAddress: !!data.pickupAddress,
  hasDeliveryAddress: !!data.deliveryAddress,
  pickupLogisticsConstraints: data.pickupLogisticsConstraints,
  deliveryLogisticsConstraints: data.deliveryLogisticsConstraints,
  additionalServices: data.additionalServices,
  pickupLogisticsConstraintsType: typeof data.pickupLogisticsConstraints,
  deliveryLogisticsConstraintsType: typeof data.deliveryLogisticsConstraints,
  additionalServicesType: typeof data.additionalServices,
  pickupLogisticsConstraintsKeys: data.pickupLogisticsConstraints ? Object.keys(data.pickupLogisticsConstraints) : [],
  deliveryLogisticsConstraintsKeys: data.deliveryLogisticsConstraints ? Object.keys(data.deliveryLogisticsConstraints) : [],
  additionalServicesKeys: data.additionalServices ? Object.keys(data.additionalServices) : []
});
```

**Type de log**: `devLog.debug` (conditionnel - NEXT_PUBLIC_DEBUG=true)

**Données loggées**:
- ✅ `serviceType`
- ✅ `hasPickupAddress` / `hasDeliveryAddress` (booléens)
- ✅ `pickupLogisticsConstraints` (Object complet)
- ✅ `deliveryLogisticsConstraints` (Object complet)
- ✅ `additionalServices` (Object complet)
- ✅ **Types** de chaque objet (pour vérifier Object vs Array)
- ✅ **Keys** de chaque objet (pour debug rapide)

---

### 🔄 Suite du flux (PriceService)

**Fichier**: `src/quotation/application/services/PriceService.ts`
**Ligne**: Multiples logs avec `devLog.debug`

**Étapes tracées**:
- ✅ ÉTAPE 2: Request reçu par PriceService
- ✅ ÉTAPE 3: Context créé (normalisation des contraintes)
- ✅ ÉTAPE 4: Stratégie sélectionnée
- ✅ ÉTAPE 5: Règles récupérées
- ✅ ÉTAPE 6: RuleEngine exécuté
- ✅ ÉTAPE 7: Résultat final construit

---

## 2️⃣ Flux: Calcul Soumission (Bouton "Réserver maintenant")

### 📍 Point d'entrée: Frontend

**Fichier**: `src/hooks/generic/useUnifiedSubmission.tsx`
**Ligne**: 189
**Fonction**: `submitQuoteRequest()`

```typescript
console.log('🔄 Création du QuoteRequest:', quoteRequestData);
```

**Type de log**: `console.log` (toujours actif)

**Données loggées**:
- ✅ `serviceType`
- ✅ `quoteData` (objet complet avec toutes les données du formulaire)
  - `calculatedPrice`
  - `totalPrice`
  - `formData`
  - `catalogId`
  - `__presetSnapshot`
  - Toutes les contraintes et services

---

### 📍 API Endpoint: Backend

**Fichier**: `src/quotation/interfaces/http/controllers/QuoteRequestController.ts`
**Ligne**: 20 + 32-46
**Méthode**: `POST /api/quotesRequest`
**Fonction**: `createQuoteRequest()`

#### Log 1: Entrée de la méthode

```typescript
logger.info('📬 POST /api/quotesRequest/ - Création demande de devis');
```

**Type de log**: `logger.info` (toujours actif)

#### Log 2: Données reçues (⚡ NOUVEAU - Ajouté dans cette session)

```typescript
const quoteData = req.body.quoteData || {};
logger.info('📥 ÉTAPE 1 (SOUMISSION): Données reçues du frontend:', {
  serviceType: req.body.serviceType,
  hasPickupAddress: !!quoteData.pickupAddress,
  hasDeliveryAddress: !!quoteData.deliveryAddress,
  pickupLogisticsConstraints: quoteData.pickupLogisticsConstraints,
  deliveryLogisticsConstraints: quoteData.deliveryLogisticsConstraints,
  additionalServices: quoteData.additionalServices,
  pickupLogisticsConstraintsType: typeof quoteData.pickupLogisticsConstraints,
  deliveryLogisticsConstraintsType: typeof quoteData.deliveryLogisticsConstraints,
  additionalServicesType: typeof quoteData.additionalServices,
  calculatedPrice: quoteData.calculatedPrice,
  totalPrice: quoteData.totalPrice,
  catalogId: quoteData.catalogId,
  hasPresetSnapshot: !!quoteData.__presetSnapshot
});
```

**Type de log**: `logger.info` (toujours actif)

**Données loggées**:
- ✅ `serviceType`
- ✅ `hasPickupAddress` / `hasDeliveryAddress`
- ✅ `pickupLogisticsConstraints` (Object complet)
- ✅ `deliveryLogisticsConstraints` (Object complet)
- ✅ `additionalServices` (Object complet)
- ✅ **Types** de chaque objet
- ✅ `calculatedPrice` / `totalPrice`
- ✅ `catalogId`
- ✅ `hasPresetSnapshot`

---

### 🔄 Suite du flux (QuoteRequestService)

**Fichier**: `src/quotation/application/services/QuoteRequestService.ts`
**Ligne**: 33
**Fonction**: `createQuoteRequest()`

```typescript
logger.info(`🔄 Création d'une demande de devis - serviceType: ${data.serviceType}`);
```

**Type de log**: `logger.info` (toujours actif)

---

## 📊 Tableau Comparatif des Logs

| Point de Log | Flux Temps Réel | Flux Soumission | Type de Log |
|--------------|----------------|-----------------|-------------|
| **Frontend - Avant envoi** | ✅ Complet (ligne 70) | ✅ Complet (ligne 189) | devLog / console.log |
| **Backend - Entrée API** | ✅ Complet (ligne 28) | ✅ Complet (ligne 32) ⚡ | devLog / logger.info |
| **Données loggées** | serviceType, constraints, services, types, keys | serviceType, constraints, services, types, calculatedPrice, catalogId | Tous les champs critiques |
| **Traçabilité** | ✅ 100% | ✅ 100% | Complète pour les 2 flux |

---

## 🔍 Utilisation des Logs

### Activer les logs de debug (Temps Réel)

Dans votre fichier `.env.local`:

```bash
NEXT_PUBLIC_DEBUG=true
```

Les logs `devLog.debug` s'afficheront alors dans:
- ✅ Console du navigateur (Frontend)
- ✅ Terminal du serveur (Backend)

### Logs toujours actifs (Soumission)

Les logs de soumission (`logger.info` et `console.log`) sont **toujours actifs** pour assurer la traçabilité complète des demandes de devis.

---

## 🎯 Points de Vérification Critiques

### Avant envoi Frontend → Backend

**Fichiers**:
- `useCentralizedPricing.ts:70` (Temps Réel)
- `useUnifiedSubmission.tsx:189` (Soumission)

**À vérifier**:
- ✅ Les contraintes sont bien des **Objects** `{ uuid: boolean }`
- ✅ Les services sont bien des **Objects** `{ uuid: boolean }`
- ✅ Le `serviceType` est correct (MOVING, CLEANING, DELIVERY, PACKING)

### Après réception Backend

**Fichiers**:
- `PriceController.ts:28` (Temps Réel)
- `QuoteRequestController.ts:32` (Soumission)

**À vérifier**:
- ✅ Les types des contraintes/services sont corrects (pas de conversion Array→Object involontaire)
- ✅ Les Keys des objects sont présentes
- ✅ Pas de données manquantes (undefined/null)

---

## 🚀 Prochaines Étapes (Optionnel)

Si vous souhaitez encore plus de traçabilité, vous pouvez ajouter des logs dans:

1. **PriceService.ts** (ÉTAPE 3) - Après normalisation des contraintes
2. **RuleEngine.ts** - Avant application des règles
3. **Strategies** - Entrée de chaque stratégie (MovingQuoteStrategy, etc.)

Tous ces points ont déjà des logs `devLog.debug` configurés, visible avec `NEXT_PUBLIC_DEBUG=true`.

---

## ✅ Conclusion

**Les 2 flux sont maintenant 100% tracés** avec des logs détaillés au début de chaque flux (Frontend et Backend), permettant de:

- 🔍 Débugger rapidement les problèmes de données
- 📊 Vérifier la cohérence Frontend ↔ Backend
- 🐛 Identifier les transformations incorrectes
- ✅ Confirmer que les contraintes/services arrivent correctement au backend

**Dernière mise à jour**: 27 octobre 2025 - Ajout du log détaillé dans `QuoteRequestController.ts:32` pour le flux de soumission.
