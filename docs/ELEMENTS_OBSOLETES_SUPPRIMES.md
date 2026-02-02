# Éléments Obsolètes Supprimés

> **Date de nettoyage:** 2026-02-02
> **Auteur:** Équipe Express-Quote
> **Statut:** Nettoyage complet effectué

Ce document recense tous les éléments legacy supprimés du projet Express-Quote lors de la migration vers le système quotation-module.

---

## 1. Services Abandonnés

### Services actifs (conservés)
| Service | Enum | Description |
|---------|------|-------------|
| `MOVING` | ServiceType | Déménagement standard |
| `MOVING_PREMIUM` | ServiceType | Déménagement sur mesure |

### Services supprimés
| Service | Raison de suppression |
|---------|----------------------|
| `CLEANING` | Service de nettoyage abandonné - hors périmètre métier |
| `PACKING` | Service d'emballage fusionné avec options déménagement |
| `DELIVERY` | Service de livraison abandonné |
| `TRANSPORT` | Service de transport fusionné avec MOVING |
| `STORAGE` | Service de stockage abandonné |

---

## 2. Tables de Base de Données Supprimées

### Migration `20260202220000_remove_legacy_tables`

| Table | Description | Raison de suppression |
|-------|-------------|----------------------|
| `rules` | Règles de pricing legacy | Remplacé par Configuration + quotation-module |
| `items` | Items/produits legacy | Système de catalogue abandonné |
| `templates` | Templates de pricing | Remplacé par quotation-module |
| `CatalogSelection` | Sélections catalogue client | Système de catalogue abandonné |
| `Category` | Catégories de catalogue | Système de catalogue abandonné |

### Colonnes supprimées
| Table | Colonne | Description |
|-------|---------|-------------|
| `QuoteRequest` | `catalogSelectionId` | Référence vers CatalogSelection |

---

## 3. Enums Supprimés Complètement

### Migration `20260202220000_remove_legacy_tables`

| Enum | Valeurs | Usage original |
|------|---------|----------------|
| `RuleCategory` | `BASE_PRICING`, `VOLUME_PRICING`, `DISTANCE_PRICING`, `OPTIONS`, `DISCOUNTS`, `SURCHARGES` | Catégorisation des règles de pricing |
| `RuleType` | `VOLUME_RATE`, `DISTANCE_RATE`, `BASE_RATE`, `OPTION_RATE`, `DISCOUNT`, `SURCHARGE`, `CONSTRAINT` | Types de règles de calcul |
| `RuleScope` | `GLOBAL`, `SERVICE`, `REGION`, `PROFESSIONAL` | Portée d'application des règles |
| `CatalogCategory` | `DEMENAGEMENT`, `MENAGE`, `LIVRAISON`, `TRANSPORT` | Catégories du catalogue |
| `ItemType` | `DEMENAGEMENT`, `MENAGE`, `LIVRAISON`, `TRANSPORT`, `PACK`, `SERVICE` | Types d'items du catalogue |

---

## 4. Valeurs d'Enum Supprimées

### Migration `20260202230000_remove_obsolete_enum_values`

#### ProfessionalType
| Valeur supprimée | Migration vers |
|------------------|----------------|
| `CLEANING_SERVICE` | `OTHER` |
| `HANDYMAN` | `OTHER` |
| `STORAGE_COMPANY` | `OTHER` |

**Valeurs conservées:** `MOVING_COMPANY`, `OTHER`

#### InternalRole
| Valeur supprimée | Migration vers |
|------------------|----------------|
| `CLEANING_MANAGER` | `OPERATIONS_MANAGER` |
| `DELIVERY_MANAGER` | `OPERATIONS_MANAGER` |

**Valeurs conservées:** `MOVING_MANAGER`, `OPERATIONS_MANAGER`, `CUSTOMER_SERVICE`, `ACCOUNTING`, `ADMIN`

#### BookingType
| Valeur supprimée | Raison |
|------------------|--------|
| `PACK` | Système de packs abandonné |
| `SERVICE` | Services génériques abandonnés |

**Valeur conservée:** `MOVING_QUOTE`

---

## 5. Fichiers Supprimés

### Hooks
| Fichier | Description |
|---------|-------------|
| `src/hooks/shared/useCentralizedPricing.ts` | Hook de calcul via `/api/price/calculate` |
| `src/hooks/useUnifiedRules.ts` | Hook de récupération des règles legacy |

### API Routes Legacy
| Route | Description |
|-------|-------------|
| `src/app/api/price/calculate/route.ts` | Calcul de prix legacy |
| `src/app/api/admin/pricing/rules/route.ts` | Gestion des règles |
| `src/app/api/admin/catalogue/route.ts` | Gestion catalogue |
| `src/app/api/admin/catalogue/[id]/route.ts` | Détail catalogue |
| `src/app/api/admin/catalogue/stats/route.ts` | Stats catalogue |
| `src/app/api/admin/items/route.ts` | Gestion items |
| `src/app/api/admin/items/[id]/route.ts` | Détail item |
| `src/app/api/admin/items/stats/route.ts` | Stats items |
| `src/app/api/admin/templates/route.ts` | Gestion templates |
| `src/app/api/admin/templates/[id]/route.ts` | Détail template |
| `src/app/api/admin/templates/stats/route.ts` | Stats templates |
| `src/app/api/catalogue/[catalogId]/route.ts` | API catalogue public |
| `src/app/api/catalogue/featured/route.ts` | Catalogue featured |
| `src/app/api/items/route.ts` | API items public |
| `src/app/api/items/[id]/route.ts` | Détail item public |
| `src/app/api/items/personalized/route.ts` | Items personnalisés |
| `src/app/api/templates/route.ts` | API templates public |
| `src/app/api/templates/[id]/route.ts` | Détail template public |
| `src/app/api/templates/[id]/create-item/route.ts` | Création item depuis template |

### Services Domain
| Fichier | Description |
|---------|-------------|
| `src/quotation/application/services/FallbackCalculatorService.ts` | Calcul fallback legacy |
| `src/quotation/application/services/PriceResponseBuilder.ts` | Construction réponse prix |
| `src/quotation/application/services/TemplateService.ts` | Gestion templates |
| `src/quotation/application/services/TemplateBookingService.ts` | Réservations via templates |
| `src/quotation/domain/configuration/DefaultConfigurations.ts` | Configurations par défaut |
| `src/quotation/domain/configuration/DefaultValues.ts` | Valeurs par défaut |
| `src/quotation/domain/configuration/constants.ts` | Constantes configuration |
| `src/quotation/domain/configuration/validateDefaultValues.ts` | Validation valeurs |
| `src/quotation/domain/constants/RuleUUIDs.ts` | UUIDs des règles |
| `src/quotation/domain/entities/Template.ts` | Entité Template |
| `src/quotation/domain/services/AutoDetectionService.ts` | Auto-détection |
| `src/quotation/domain/services/ConstraintIconService.ts` | Icônes contraintes |
| `src/quotation/domain/services/ConstraintTransformerService.ts` | Transformation contraintes |
| `src/quotation/infrastructure/repositories/PrismaCatalogueRepository.ts` | Repository catalogue |
| `src/quotation/infrastructure/repositories/PrismaItemRepository.ts` | Repository items |
| `src/quotation/infrastructure/repositories/PrismaTemplateRepository.ts` | Repository templates |
| `src/quotation/infrastructure/services/ConfigurationLoaderService.ts` | Chargeur configuration |
| `src/quotation/infrastructure/services/FormConstraintService.ts` | Service contraintes formulaire |
| `src/quotation/interfaces/http/controllers/CatalogueController.ts` | Controller catalogue |
| `src/quotation/interfaces/http/controllers/ItemController.ts` | Controller items |
| `src/quotation/interfaces/http/controllers/TemplateController.ts` | Controller templates |

### Services Externes
| Fichier | Description |
|---------|-------------|
| `src/services/AccessConstraintsService.ts` | Service contraintes d'accès legacy |
| `src/actions/adminPricing.ts` | Actions admin pricing |

### Scripts
| Fichier | Description |
|---------|-------------|
| `scripts/analyze-rules-and-configs.ts` | Analyse règles/configs |
| `scripts/analyze-rules-metadata.ts` | Analyse métadonnées règles |
| `scripts/check-rule-configkeys.ts` | Vérification clés config |
| `scripts/check-rules-db.ts` | Vérification règles BDD |
| `scripts/compare-fallbacks.ts` | Comparaison fallbacks |
| `scripts/fetch-all-rules.ts` | Récupération toutes règles |
| `scripts/generate-fallbacks.ts` | Génération fallbacks |
| `scripts/seed-realistic-business-rules.js` | Seed règles métier |
| `scripts/test-price-apis-with-separated-rules.ts` | Test APIs prix |

### Types
| Fichier | Description |
|---------|-------------|
| `src/types/rules.ts` | Types pour règles legacy |

### Data/Fallbacks
| Fichier | Description |
|---------|-------------|
| `src/data/fallbacks/index.ts` | Index fallbacks |
| `src/data/fallbacks/movingFallback.ts` | Fallback déménagement |
| `src/data/fallbacks/cleaningFallback.ts` | Fallback nettoyage |

### Tests obsolètes
| Fichier | Description |
|---------|-------------|
| `src/__tests__/integration/complete-booking-notification-flow-consolidated.test.ts` | Test consolidé obsolète |

### Documentation obsolète
| Fichier | Description |
|---------|-------------|
| `docs/ACCESS_CONSTRAINTS.md` | Documentation contraintes |
| `docs/TS_NOCHECK_CORRECTIONS.md` | Corrections TS legacy |
| Nombreux fichiers `.md` à la racine | Rapports de phases précédentes |

---

## 6. DTOs Dépréciés (conservés pour compatibilité)

Les DTOs suivants sont marqués `@deprecated` mais conservés pour la compatibilité avec les anciennes données:

| DTO | Fichier | Raison |
|-----|---------|--------|
| `ServiceDTO` | `src/quotation/interfaces/http/dtos/BookingDTO.ts` | Services abandonnés |
| `ServiceReservationDTO` | `src/quotation/interfaces/http/dtos/BookingDTO.ts` | Services abandonnés |
| `PackDTO` | `src/quotation/interfaces/http/dtos/BookingDTO.ts` | Système packs abandonné |

---

## 7. APIs Remplacées

| Ancienne API | Nouvelle API | Description |
|--------------|--------------|-------------|
| `POST /api/price/calculate` | `POST /api/quotation/calculate` | Calcul de prix |
| `GET /api/rules` | Configuration via BDD | Règles de pricing |
| `GET /api/catalogue/*` | N/A (abandonné) | Catalogue produits |
| `GET /api/items/*` | N/A (abandonné) | Items produits |
| `GET /api/templates/*` | N/A (abandonné) | Templates produits |

---

## 8. Système Actuel (Post-Nettoyage)

### Architecture quotation-module

```
src/quotation/
├── application/
│   └── services/
│       ├── ConfigurationAccessService.ts  ✅ Actif
│       ├── ConfigurationService.ts        ✅ Actif
│       └── booking/                       ✅ Actif (services booking)
├── domain/
│   ├── configuration/
│   │   ├── ConfigurationKey.ts            ✅ Actif
│   │   └── index.ts                       ✅ Actif
│   ├── enums/
│   │   ├── BookingType.ts                 ✅ Actif (MOVING_QUOTE seul)
│   │   └── ServiceType.ts                 ✅ Actif (MOVING, MOVING_PREMIUM)
│   └── entities/
│       ├── Booking.ts                     ✅ Actif
│       └── Item.ts                        ✅ Actif (ItemType.DEMENAGEMENT)
└── infrastructure/
    ├── repositories/
    │   ├── ConfigurationRepository.ts     ✅ Actif
    │   └── PrismaConfigurationRepository.ts ✅ Actif
    └── services/
        └── UnifiedDataService.ts          ✅ Actif
```

### Enums Actifs

| Enum | Valeurs |
|------|---------|
| `ServiceType` | `MOVING`, `MOVING_PREMIUM` |
| `BookingType` | `MOVING_QUOTE` |
| `ProfessionalType` | `MOVING_COMPANY`, `OTHER` |
| `InternalRole` | `MOVING_MANAGER`, `OPERATIONS_MANAGER`, `CUSTOMER_SERVICE`, `ACCOUNTING`, `ADMIN` |

---

## 9. Migrations Appliquées

| Migration | Date | Description |
|-----------|------|-------------|
| `20260202220000_remove_legacy_tables` | 2026-02-02 | Suppression tables rules, items, templates, CatalogSelection, Category |
| `20260202230000_remove_obsolete_enum_values` | 2026-02-02 | Suppression valeurs enum obsolètes |

---

## 10. Récapitulatif Chiffré

| Catégorie | Nombre supprimé |
|-----------|-----------------|
| Tables BDD | 5 |
| Enums complets | 5 |
| Valeurs d'enum | 7 |
| Fichiers source | ~50+ |
| Routes API | ~20 |
| Lignes de code | ~24 000 |

---

*Document généré automatiquement lors du nettoyage du 2026-02-02*
