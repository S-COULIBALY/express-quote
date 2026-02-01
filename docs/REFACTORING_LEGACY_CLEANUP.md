# Refactorisation - Nettoyage du Système Legacy

> **Date de création** : 31 janvier 2026
> **Dernière mise à jour** : 1 février 2026
> **Objectif** : Supprimer l'ancien système de règles BDD (UUIDs) et migrer vers `modal-data.ts` comme source unique de vérité pour les 16 contraintes d'accès.

---

## ✅ PROGRESSION - Phase 2 Terminée

### Ce qui a été fait (1er février 2026)

#### 1. Migration du Modal (TERMINÉ)

- ✅ `FormField.tsx` : Remplacé `AccessConstraintsModal` par `LogisticsModal`
- ✅ `LogisticsModal.tsx` : Ajouté les props manquantes pour compatibilité (volume, formData, serviceType)
- ✅ Les contraintes sont maintenant chargées depuis `modal-data.ts` (source unique)

#### 2. Mapping des Contraintes (TERMINÉ)

- ✅ `ModalSelectionsAdapter.ts` : Ajouté `CONSTRAINT_IDS` avec les 16 contraintes
- ✅ Mapping complet vers `QuoteContext` :
  - `constraint-1` → `pickupStreetNarrow` / `deliveryStreetNarrow`
  - `constraint-3, constraint-13` → `parkingAuthorizationRequired`
  - `constraint-5, constraint-6` → `hasElevator = false`
  - `constraint-7` → `elevatorSize = 'SMALL'`
  - `constraint-11` → `carryDistance = 40`
  - `constraint-15` → `syndicTimeSlot = true`

#### 3. Suppression des Fichiers Obsolètes (TERMINÉ)

- ✅ `AccessConstraintsModal.tsx` - SUPPRIMÉ
- ✅ `UnifiedRuleManagerDisplay.tsx` - SUPPRIMÉ
- ✅ `RuleCard.tsx` - SUPPRIMÉ
- ✅ `src/__tests__/flux-reservation/` - Dossier complet SUPPRIMÉ (tests obsolètes)

#### 4. Nettoyage des Références (TERMINÉ)

- ✅ `src/lib/caches.ts` - Commentaire mis à jour
- ✅ `src/components/form-generator/types/form.ts` - Commentaire mis à jour
- ✅ `src/__tests__/flux-reservation/ordre-de-tests.md` - Mis à jour

#### 5. Correction Erreur TypeScript (TERMINÉ)

- ✅ `scenarioServicesHelper.ts` - Corrigé le typage des ServiceStatus

#### 6. Build vérifié

- ✅ `npm run build` passe avec succès

### Ce qui reste à faire (Phase 3+)

---

## Table des matières

1. [Contexte et Problématique](#1-contexte-et-problématique)
2. [Architecture Cible](#2-architecture-cible)
3. [Modèles Prisma à Supprimer](#3-modèles-prisma-à-supprimer)
4. [Enums Prisma à Supprimer](#4-enums-prisma-à-supprimer)
5. [Fichiers à Supprimer](#5-fichiers-à-supprimer)
6. [Fichiers à Adapter](#6-fichiers-à-adapter)
7. [APIs à Supprimer](#7-apis-à-supprimer)
8. [Plan d'Exécution](#8-plan-dexécution)
9. [Checklist de Validation](#9-checklist-de-validation)

---

da

## 1. Contexte et Problématique

### État Actuel : Système Hybride Obsolète

Le système actuel mélange **3 sources de vérité incompatibles** pour les contraintes d'accès :

| Source                          | Format IDs                            | Utilisé par             | Statut       |
| ------------------------------- | ------------------------------------- | ----------------------- | ------------ |
| `modal-data.ts`                 | `constraint-1` à `constraint-16`      | LogisticsModal          | ✅ **CIBLE** |
| Table Prisma `rules`            | UUIDs longs (ex: `7b09890c-9151-...`) | API, UnifiedDataService | ❌ OBSOLÈTE  |
| Fallbacks (`movingFallback.ts`) | UUIDs longs                           | useUnifiedRules         | ❌ OBSOLÈTE  |

### Problèmes Identifiés

1. **Incohérence des IDs** : `AccessConstraintsModal` charge des UUIDs depuis la BDD, mais `ModalSelectionsAdapter` attend des IDs `constraint-X`
2. **Code mort** : `LogisticsModal` n'est pas utilisé (seul `AccessConstraintsModal` est importé dans `FormField.tsx`)
3. **Tables BDD inutilisées** : `rules`, `items`, `templates`, `CatalogSelection` contiennent des données obsolètes
4. **Duplication** : Les mêmes contraintes existent en 3 endroits différents

---

## 2. Architecture Cible

```
┌─────────────────────────────────────────────────────────────────┐
│                     modal-data.ts (SOURCE UNIQUE)               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ACCESS_CONSTRAINTS[] = [                                   │  │
│  │   { id: 'constraint-1', name: 'Rue étroite...', ... },    │  │
│  │   { id: 'constraint-2', name: 'Circulation complexe', },  │  │
│  │   ...                                                      │  │
│  │   { id: 'constraint-16', name: 'Sol fragile...', ... }    │  │
│  │ ]                                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AccessConstraintsModal.tsx (ADAPTÉ)                │
│  - Import statique: ACCESS_CONSTRAINTS depuis modal-data.ts    │
│  - Plus d'appel API / hook useUnifiedRules                      │
│  - Plus d'imports RuleUUIDs                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ModalSelectionsAdapter.ts (COMPLÉTÉ)               │
│  Mappings contraintes → QuoteContext :                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ constraint-1  → pickupStreetNarrow / deliveryStreetNarrow │  │
│  │ constraint-4  → pickupParkingAuthorizationRequired        │  │
│  │ constraint-5  → pickupHasElevator = false                 │  │
│  │ constraint-6  → pickupHasElevator = false                 │  │
│  │ constraint-7  → pickupElevatorSize = 'SMALL'              │  │
│  │ constraint-11 → pickupCarryDistance = 40                  │  │
│  │ constraint-15 → pickupSyndicTimeSlot = true               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 QuoteContext (Moteur de calcul)                 │
│  - pickupStreetNarrow: boolean                                  │
│  - pickupHasElevator: boolean                                   │
│  - pickupCarryDistance: number                                  │
│  - deliveryStreetNarrow: boolean                                │
│  - etc.                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Modèles Prisma à Supprimer

### 3.1 Table `rules` (lignes 730-762)

```prisma
// ❌ À SUPPRIMER
model rules {
  id           String       @id
  name         String
  description  String?
  value        Float
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime
  category     RuleCategory
  condition    Json?
  percentBased Boolean      @default(true)
  serviceType  ServiceType  @default(SERVICE)
  ruleType     RuleType?    @default(CONSTRAINT)
  priority     Int?         @default(100)
  validFrom    DateTime?    @default(now())
  validTo      DateTime?
  tags         String[]     @default([])
  configKey    String?
  metadata     Json?
  scope        RuleScope    @default(BOTH)
  // ...indexes
}
```

**Raison** : Les 16 contraintes sont maintenant définies statiquement dans `modal-data.ts`.

---

### 3.2 Table `items` (lignes 447-483)

```prisma
// ❌ À SUPPRIMER
model items {
  id                String             @id
  type              ItemType
  template_id       String?
  customer_id       String?
  booking_id        String?
  parent_item_id    String?
  name              String
  description       String?
  price             Float
  workers           Int
  duration          Int
  features          String[]           @default([])
  // ... autres champs
  CatalogSelection  CatalogSelection[]
  Booking           Booking?           @relation(...)
  Customer          Customer?          @relation(...)
  templates         templates?         @relation(...)
}
```

**Raison** : Ancien système de templates/items remplacé par le nouveau système de catalogue.

---

### 3.3 Table `templates` (lignes 800-824)

```prisma
// ❌ À SUPPRIMER
model templates {
  id                String   @id
  type              ItemType
  name              String
  description       String?
  price             Float
  workers           Int
  duration          Int
  features          String[] @default([])
  // ... autres champs
  items             items[]
}
```

**Raison** : Lié au système `items` obsolète.

---

### 3.4 Table `CatalogSelection` (lignes 50-85)

```prisma
// ❌ À SUPPRIMER
model CatalogSelection {
  id                   String          @id
  category             CatalogCategory
  subcategory          String?
  displayOrder         Int
  isActive             Boolean         @default(true)
  isFeatured           Boolean         @default(false)
  // ... champs marketing
  itemId               String?
  items                items?          @relation(...)
  QuoteRequest         QuoteRequest[]
}
```

**Raison** : Dépend de `items` qui est obsolète.

---

### 3.5 Table `Category` (lignes 87-94)

```prisma
// ❌ À SUPPRIMER
model Category {
  id          String   @id
  name        String
  description String?
  icon        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime
}
```

**Raison** : Table orpheline non utilisée.

---

### 3.6 Relations à Nettoyer

Dans les modèles à **CONSERVER**, supprimer les relations vers les modèles obsolètes :

```prisma
// Dans model Booking (à CONSERVER) :
// ❌ Supprimer cette ligne :
items                items[]

// Dans model Customer (à CONSERVER) :
// ❌ Supprimer cette ligne :
items     items[]

// Dans model QuoteRequest (à CONSERVER) :
// ❌ Supprimer ces lignes :
catalogSelectionId String?
CatalogSelection   CatalogSelection? @relation(fields: [catalogSelectionId], references: [id])
@@index([catalogSelectionId])
```

---

## 4. Enums Prisma à Supprimer

| Enum           | Lignes  | Utilisé par          | Action       |
| -------------- | ------- | -------------------- | ------------ |
| `RuleCategory` | 946-953 | `rules`              | ❌ SUPPRIMER |
| `RuleType`     | 955-963 | `rules`              | ❌ SUPPRIMER |
| `RuleScope`    | 987-992 | `rules`              | ❌ SUPPRIMER |
| `ItemType`     | 882-887 | `items`, `templates` | ❌ SUPPRIMER |

```prisma
// ❌ À SUPPRIMER (lignes 946-963)
enum RuleCategory {
  REDUCTION
  SURCHARGE
  MINIMUM
  MAXIMUM
  FIXED
  PERCENTAGE
}

enum RuleType {
  CONSTRAINT
  BUSINESS
  PRICING
  TEMPORAL
  GEOGRAPHIC
  VOLUME
  CUSTOM
}

// ❌ À SUPPRIMER (lignes 882-887)
enum ItemType {
  DEMENAGEMENT
  MENAGE
  TRANSPORT
  LIVRAISON
}

// ❌ À SUPPRIMER (lignes 987-992)
enum RuleScope {
  GLOBAL
  PICKUP
  DELIVERY
  BOTH
}
```

---

## 5. Fichiers à Supprimer

### 5.1 Hooks obsolètes

| Fichier                        | Lignes | Raison                                     |
| ------------------------------ | ------ | ------------------------------------------ |
| `src/hooks/useUnifiedRules.ts` | ~280   | Hook API/BDD pour charger rules - obsolète |

### 5.2 Constants UUIDs

| Fichier                                       | Lignes | Raison                          |
| --------------------------------------------- | ------ | ------------------------------- |
| `src/quotation/domain/constants/RuleUUIDs.ts` | ~90    | UUIDs des règles BDD - obsolète |

### 5.3 Fallbacks

| Fichier                                  | Lignes | Raison                           |
| ---------------------------------------- | ------ | -------------------------------- |
| `src/data/fallbacks/movingFallback.ts`   | ~500   | Fallback BDD moving - obsolète   |
| `src/data/fallbacks/cleaningFallback.ts` | ~500   | Fallback BDD cleaning - obsolète |
| `src/data/fallbacks/index.ts`            | ~35    | Export des fallbacks - obsolète  |

### 5.4 Types obsolètes

| Fichier                                  | Lignes | Raison                  |
| ---------------------------------------- | ------ | ----------------------- |
| `src/types/rules.ts`                     | ~50    | Types liés à rules BDD  |
| `src/quotation/domain/enums/RuleType.ts` | ~20    | Enum dupliqué de Prisma |

### 5.5 Services liés aux rules BDD

| Fichier                                                          | Action                                |
| ---------------------------------------------------------------- | ------------------------------------- |
| `src/services/AccessConstraintsService.ts`                       | ❌ SUPPRIMER (utilise `prisma.rules`) |
| `src/quotation/infrastructure/services/FormConstraintService.ts` | ❌ SUPPRIMER ou adapter               |

### 5.6 Repositories templates/items

| Fichier                                                                 | Action       |
| ----------------------------------------------------------------------- | ------------ |
| `src/quotation/infrastructure/repositories/PrismaTemplateRepository.ts` | ❌ SUPPRIMER |
| `src/quotation/application/services/TemplateBookingService.ts`          | ❌ SUPPRIMER |
| `src/quotation/domain/entities/Item.ts`                                 | ❌ SUPPRIMER |

### 5.7 Total estimé

```
Fichiers à supprimer : ~15
Lignes de code : ~2000+
```

---

## 6. Fichiers à Adapter

### 6.1 `AccessConstraintsModal.tsx` ✅ SUPPRIMÉ

**Fichier** : ~~`src/components/form-generator/components/AccessConstraintsModal.tsx`~~ → **SUPPRIMÉ**

**Solution appliquée** : Remplacé par `LogisticsModal.tsx` qui utilise déjà `modal-data.ts` correctement.

**Fichiers modifiés** :

- `FormField.tsx` : Import changé de `AccessConstraintsModal` vers `LogisticsModal`
- `LogisticsModal.tsx` : Ajouté les props `volume`, `formData`, `serviceType` pour compatibilité

---

### 6.2 `ModalSelectionsAdapter.ts` ✅ TERMINÉ

**Fichier** : `src/quotation-module/adapters/ModalSelectionsAdapter.ts`

**Changements appliqués** :

1. Ajouté `CONSTRAINT_IDS` avec les 16 IDs de contraintes
2. Ajouté le mapping dans `modalSelectionsToQuoteContext()` :
   - `constraint-1` → `pickupStreetNarrow` / `deliveryStreetNarrow`
   - `constraint-3, constraint-13` → `parkingAuthorizationRequired`
   - `constraint-5, constraint-6` → `hasElevator = false`
   - `constraint-7` → `elevatorSize = 'SMALL'`
   - `constraint-11` → `carryDistance = 40`
   - `constraint-15` → `syndicTimeSlot = true`
3. Ajouté `getSelectedConstraintIds()` pour obtenir les IDs sélectionnés
4. Export de `CONSTRAINT_IDS` pour usage externe

---

### 6.3 `UnifiedDataService.ts`

**Fichier** : `src/quotation/infrastructure/services/UnifiedDataService.ts`

**Changements requis** : Supprimer les méthodes liées aux rules

```typescript
// ❌ SUPPRIMER ces méthodes :
async getRulesByType(...)
async getBusinessRulesForEngine(...)
async getConstraintRules(...)
// ... toutes les méthodes qui utilisent prisma.rules

// ✅ CONSERVER uniquement les méthodes Configuration :
async getConfiguration(...)
async getConfigurationsByCategory(...)
```

---

### 6.4 `AutoDetectionService.ts`

**Fichier** : `src/quotation/domain/services/AutoDetectionService.ts`

**Changements requis** :

```typescript
// ❌ SUPPRIMER
import {
  RULE_UUID_MONTE_MEUBLE,
  RULE_UUID_DISTANCE_PORTAGE,
} from "../constants/RuleUUIDs";

// ✅ REMPLACER PAR
import { AUTO_DETECTED_CONSTRAINT_IDS } from "@/components/form-generator/components/modal-data";

// Utiliser constraint-11 au lieu de RULE_UUID_DISTANCE_PORTAGE
```

---

### 6.5 `caches.ts`

**Fichier** : `src/lib/caches.ts`

**Changements requis** :

```typescript
// ❌ SUPPRIMER
export const rulesCache = new Map<string, CachedRule>();
export function clearRulesCache() { ... }
// ... tout ce qui concerne le cache des rules
```

---

### 6.6 Autres fichiers à adapter

| Fichier                                                                | Changement                      |
| ---------------------------------------------------------------------- | ------------------------------- |
| `src/quotation/domain/services/ConstraintIconService.ts`               | Adapter vers IDs `constraint-X` |
| `src/quotation/domain/services/ConstraintTransformerService.ts`        | Adapter vers IDs `constraint-X` |
| `src/quotation/application/services/booking/BookingCreationService.ts` | Supprimer références items      |
| `src/quotation/application/services/BookingService.ts`                 | Supprimer références items      |
| `src/actions/adminRules.ts`                                            | Supprimer ou adapter            |

---

## 7. APIs à Supprimer

| Endpoint                          | Fichier                                           | Raison                 |
| --------------------------------- | ------------------------------------------------- | ---------------------- |
| `/api/admin/pricing/rules`        | `src/app/api/admin/pricing/rules/route.ts`        | API rules obsolète     |
| `/api/items`                      | `src/app/api/items/route.ts`                      | API items obsolète     |
| `/api/items/[id]`                 | `src/app/api/items/[id]/route.ts`                 | API items obsolète     |
| `/api/items/personalized`         | `src/app/api/items/personalized/route.ts`         | API items obsolète     |
| `/api/templates/[id]/create-item` | `src/app/api/templates/[id]/create-item/route.ts` | API templates obsolète |

---

## 8. Plan d'Exécution

### Phase 1 : Préparation (Jour 1)

- [ ] Créer une branche `refactor/legacy-cleanup`
- [ ] Sauvegarder les données existantes (export rules, items, templates)
- [ ] Documenter les dépendances actuelles

### Phase 2 : Adaptation du Frontend (Jour 1-2) ✅ TERMINÉ

- [x] ~~Adapter `AccessConstraintsModal.tsx` pour utiliser `modal-data.ts`~~ → Remplacé par `LogisticsModal`
- [x] Compléter `ModalSelectionsAdapter.ts` avec les mappings contraintes
- [x] Supprimer les imports de `useUnifiedRules` et `RuleUUIDs`
- [x] Supprimer `AccessConstraintsModal.tsx`, `UnifiedRuleManagerDisplay.tsx`, `RuleCard.tsx`
- [x] Supprimer les tests obsolètes (`src/__tests__/flux-reservation/`)
- [ ] Tester le modal avec les contraintes statiques (à valider manuellement)

### Phase 3 : Nettoyage des Services (Jour 2-3)

- [ ] Adapter `UnifiedDataService.ts` (garder Configuration uniquement)
- [ ] Adapter `AutoDetectionService.ts`
- [ ] Supprimer les services obsolètes :
  - [ ] `AccessConstraintsService.ts`
  - [ ] `FormConstraintService.ts`
  - [ ] `PrismaTemplateRepository.ts`
  - [ ] `TemplateBookingService.ts`

### Phase 4 : Suppression des Fichiers (Jour 3)

- [ ] Supprimer `useUnifiedRules.ts`
- [ ] Supprimer `RuleUUIDs.ts`
- [ ] Supprimer les fallbacks (`movingFallback.ts`, `cleaningFallback.ts`, `index.ts`)
- [ ] Supprimer `src/types/rules.ts`
- [ ] Supprimer `src/quotation/domain/enums/RuleType.ts`
- [ ] Supprimer `Item.ts`
- [ ] Supprimer les APIs obsolètes

### Phase 5 : Migration Prisma (Jour 3-4)

- [ ] Créer une migration pour :
  - [ ] Supprimer les relations dans Booking, Customer, QuoteRequest
  - [ ] Supprimer les tables : rules, items, templates, CatalogSelection, Category
  - [ ] Supprimer les enums : RuleCategory, RuleType, RuleScope, ItemType
- [ ] Exécuter la migration en dev
- [ ] Régénérer le client Prisma

### Phase 6 : Tests (Jour 4)

- [ ] Mettre à jour les tests unitaires
- [ ] Supprimer les tests des composants supprimés
- [ ] Tester le flux complet de réservation
- [ ] Vérifier que le calcul de prix fonctionne correctement

### Phase 7 : Déploiement (Jour 5)

- [ ] Merger sur la branche principale
- [ ] Exécuter la migration en production
- [ ] Vérifier le bon fonctionnement
- [ ] Nettoyer les données obsolètes en BDD

---

## 9. Checklist de Validation

### Fonctionnel

- [ ] Le modal de contraintes affiche les 16 contraintes
- [ ] La sélection des contraintes fonctionne
- [ ] L'auto-détection (étage, ascenseur, distance portage) fonctionne
- [ ] Les contraintes sont correctement mappées vers QuoteContext
- [ ] Le calcul de prix intègre les contraintes

### Technique

- [ ] Aucune erreur TypeScript
- [ ] Aucune référence aux fichiers supprimés
- [ ] Les migrations Prisma passent
- [ ] Les tests unitaires passent
- [ ] Le build de production réussit

### Performance

- [ ] Pas de requête API inutile pour charger les contraintes
- [ ] Temps de chargement du modal réduit

---

## Résumé Quantitatif

| Catégorie                       | Nombre      |
| ------------------------------- | ----------- |
| **Modèles Prisma à supprimer**  | 5           |
| **Enums Prisma à supprimer**    | 4           |
| **Fichiers à supprimer**        | ~15         |
| **Fichiers à adapter**          | ~10         |
| **APIs à supprimer**            | 5 endpoints |
| **Lignes de code à supprimer**  | ~3000+      |
| **Relations Prisma à nettoyer** | 3           |

---

## Fichiers de Référence

### Source Unique de Vérité (à conserver)

```
src/components/form-generator/components/modal-data.ts
```

### 16 Contraintes Définies

| ID            | Nom                                   | Impact | Groupe           |
| ------------- | ------------------------------------- | ------ | ---------------- |
| constraint-1  | Rue étroite ou inaccessible au camion | +9%    | vehicle_access   |
| constraint-2  | Circulation complexe                  | +6.5%  | vehicle_access   |
| constraint-3  | Stationnement difficile ou payant     | +7.5%  | vehicle_access   |
| constraint-4  | Zone piétonne avec restrictions       | +8.5%  | vehicle_access   |
| constraint-5  | Ascenseur en panne ou hors service    | +8%    | building_access  |
| constraint-6  | Ascenseur interdit pour déménagement  | +8%    | building_access  |
| constraint-7  | Ascenseur trop petit pour les meubles | +7.5%  | building_access  |
| constraint-8  | Escalier difficile ou dangereux       | +8.5%  | building_access  |
| constraint-9  | Couloirs étroits ou encombrés         | +6.5%  | building_access  |
| constraint-10 | Accès complexe multi-niveaux          | +9.5%  | floor_access     |
| constraint-11 | Distance de portage > 30m             | +7.8%  | floor_access     |
| constraint-12 | Passage indirect obligatoire          | +8.2%  | floor_access     |
| constraint-13 | Autorisation administrative           | +7%    | security         |
| constraint-14 | Contrôle d'accès strict               | +6%    | security         |
| constraint-15 | Restrictions horaires strictes        | +6.8%  | time_constraints |
| constraint-16 | Sol fragile ou délicat                | +5.5%  | security         |

---

> **Note** : Ce document doit être mis à jour au fur et à mesure de l'avancement de la refactorisation.
