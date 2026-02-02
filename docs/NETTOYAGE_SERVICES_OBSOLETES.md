# Nettoyage des services obsolètes – Déménagement uniquement

## Contexte

Seul le service **Déménagement sur mesure** est actif. Les services suivants ont été abandonnés :

- Nettoyage (cleaning)
- Livraison (delivery)
- Transport (standalone)
- Emballage (standalone)
- Stockage (standalone)

La page catalogue active est : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`.

## Modifications effectuées

### 1. `src/quotation/domain/configuration/ConfigurationKey.ts`

- **BusinessType** : ne conserve que `DÉMÉNAGEMENT`. Suppression de NETTOYAGE, LIVRAISON, TRANSPORT, EMBALLAGE, STOCKAGE.
- **BusinessTypePricingConfigKey** : suppression des clés CLEANING_*, DELIVERY_*, TRANSPORT_*, PACKING_*, STORAGE_*. Conservation des clés MOVING_* uniquement.
- **ServiceParamsConfigKey** : suppression de PACKING_DEFAULT_*, CLEANING_DEFAULT_*, DELIVERY_DEFAULT_*.

### 2. `src/quotation/application/services/ConfigurationAccessService.ts`

- **CONFIG_DEFAULTS** : suppression des valeurs par défaut pour CLEANING_*, DELIVERY_*, TRANSPORT_*, PACKING_*, STORAGE_*, PACK_INCLUDED_DISTANCE, PACKING_MATERIAL_COST_PER_M3. Conservation des clés MOVING_* et partagées (VAT_RATE, etc.).

### 3. `src/quotation/infrastructure/services/UnifiedDataService.ts`

- **ServiceType** : commentaire indiquant que seul MOVING est actif. CLEANING, PACKING, DELIVERY conservés avec `@deprecated` pour compatibilité avec les anciennes données (bookings, Stripe).

### 4. `src/utils/catalogTransformers.ts`

- **getPresetForCategory** : retourne systématiquement `'demenagement-sur-mesure'` quelle que soit la catégorie. Les fonctions `transformCatalogDataToCatalogueCleaningItem` et `transformCatalogDataToCatalogueDeliveryItem` restent présentes pour les types / données legacy.

### 5. `src/app/page.tsx`

- Carte « Nettoyage Sur Mesure » remplacée par une seconde CTA « Déménagement Sur Mesure » pointant vers `/catalogue/catalog-demenagement-sur-mesure`.
- Lien « Ménage sur mesure » en bas de page remplacé par « Devis gratuit » vers `/catalogue/catalog-demenagement-sur-mesure`.

## Non modifié (rétrocompatibilité)

- **Webhook Stripe** : les libellés pour PACK, DELIVERY, etc. sont conservés pour les anciennes réservations.
- **Types** : `CatalogueCleaningItem`, `CatalogueDeliveryItem`, `serviceType` dans le form-generator restent pour les données existantes et les types TypeScript.
- **quotation-module** : les options cross-selling (packing, cleaningEnd, temporaryStorage) restent des **options du déménagement**, pas des services catalogue séparés ; aucun changement dans `QuoteContext`, `ModalSelectionsAdapter`, `MultiQuoteService`.

## Pages catalogue

- **Actif** : `/catalogue/catalog-demenagement-sur-mesure` (déménagement sur mesure).
- **Inactif / supprimé** : `catalog-menage-sur-mesure` n’existe pas ; les liens ont été redirigés vers le catalogue déménagement.
