# Flux de calcul de prix : Frontend → Système modulaire

**Page analysée** : `http://localhost:3000/catalogue/catalog-demenagement-sur-mesure`  
**Fichier page** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`  
**Système modulaire** : `src/quotation-module/`

---

## 1. Vue d’ensemble du flux

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND - Page catalog-demenagement-sur-mesure                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  • FormGenerator (formRef) → getFormData() → données brutes du formulaire               │
│  • useModularQuotation() → calculateWithDebounce(formData)                               │
│  • Enrichissement : cross-selling (useCrossSellingOptional) + distance (calculateDistance)│
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : POST /api/quotation/calculate                                                │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Route: src/app/api/quotation/calculate/route.ts                                        │
│  → QuoteController.calculateQuote(request)                                             │
│  → FormAdapter.toQuoteContext(body)  →  BaseCostEngine.execute(quoteContext)             │
│  → Retour: { baseCost, breakdown, context { original, computed }, activatedModules }   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : POST /api/quotation/multi-offers                                             │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Route: src/app/api/quotation/multi-offers/route.ts                                     │
│  → QuoteController.generateMultiOffers(request)                                         │
│  → Payload: { baseCost, context } (issu de l’étape 1)                                   │
│  → MultiQuoteService.generateMultipleQuotesFromBaseCost(ctx, scenarios, baseCost)      │
│  → QuoteEngine en mode incrémental (skipModules = BASE_COST_MODULES)                     │
│  → Retour: { quotes[], comparison } → 6 variantes (ECO, STANDARD, CONFORT, etc.)       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  AFFICHAGE                                                                              │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  • PriceUpdater → usePrice().updatePrice(calculatedPrice ou selectedQuote.pricing)      │
│  • PaymentPriceSection → totalPrice = calculatedPrice + fragileProtection + insurance   │
│  • MultiOffersDisplay → 6 formules, sélection selectedScenario                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Détail par couche

### 2.1 Frontend – Page catalogue

| Élément           | Fichier                                                      | Rôle                                                                                                                                       |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Page              | `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx` | Page Next.js "Déménagement Sur Mesure".                                                                                                    |
| Formulaire        | `FormGenerator` + `formRef`                                  | Formulaire dynamique (preset `getDemenagementSurMesureServiceConfig`). Données via `formRef.current.getFormData()`.                        |
| Hook calcul       | `useModularQuotation()`                                      | `src/hooks/shared/useModularQuotation.ts` – orchestre les 2 appels API et le debounce.                                                     |
| Déclenchement     | `useEffect` (interval 1s)                                    | Compare `JSON.stringify(formData)` à `lastFormDataRef` ; si changement et données minimales → `quotation.calculateWithDebounce(formData)`. |
| Données minimales | `hasEssentialData`                                           | Au moins un parmi : `departureAddress`, `arrivalAddress`, `estimatedVolume` (ou `volume`), `movingDate`, `pickupAddress`, `deliveryAddress`.      |
| Prix affiché      | `PriceProvider` + `PaymentPriceSection`                      | `usePrice().calculatedPrice` ; si scénario choisi → prix de la quote correspondante.                                                       |

**Important** : Aucun calcul de prix dans le frontend. Toute la logique est déléguée aux APIs et au moteur modulaire.

---

### 2.2 Hook useModularQuotation

**Fichier** : `src/hooks/shared/useModularQuotation.ts`

Flux interne :

1. **Enrichissement des données (avant tout appel)**
   - `enrichFormDataWithCrossSelling(formData)` : ajoute packing, dismantling, reassembly, cleaningEnd, temporaryStorage, piano, safe, artwork, crossSellingSuppliesTotal, etc. depuis `useCrossSellingOptional().getSelectionForPricing()`.
   - `enrichFormDataWithDistance(formData)` : si pas de `distance`, appelle `calculateDistance(departureAddress, arrivalAddress)` (Google Maps via `@/actions/distanceCalculator`) et ajoute `distance` au payload.

2. **calculateWithDebounce(formData)**
   - Debounce 800 ms.
   - Appelle `calculateFullQuote(formData)`.

3. **calculateFullQuote(formData)**
   - **Étape 1** : `calculateBaseCost(formData)` → `POST /api/quotation/calculate` avec le body JSON (formData enrichi).
   - **Étape 2** : Si succès, `calculateMultiOffers({ baseCost, context })` → `POST /api/quotation/multi-offers` avec `{ baseCost, context }`.
   - Retour : `MultiOffersResult` (quotes + comparison).

4. **État exposé**
   - `calculatedPrice` : prix de la quote recommandée ou fallback baseCost × 1.3.
   - `multiOffers`, `baseCostResult`, `isPriceLoading`, `error`.

---

### 2.3 API Étape 1 : `/api/quotation/calculate`

| Fichier                                                               | Rôle                                                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/api/quotation/calculate/route.ts`                            | Handler POST, rate limit, délègue à `QuoteController.calculateQuote`.                    |
| `src/quotation-module/interfaces/http/controllers/QuoteController.ts` | `calculateQuote(request)` : parse body, valide, adapte, exécute base cost, renvoie JSON. |

Séquence dans `QuoteController.calculateQuote` :

1. `request.json()` → `body`.
2. `validateQuoteRequest(body)` : exige au moins `movingDate` (ou `dateSouhaitee`), `departureAddress` (ou `pickupAddress` / `adresseDepart`), `arrivalAddress` (ou `deliveryAddress` / `adresseArrivee`). Sinon 400.
3. `FormAdapter.toQuoteContext(body)` : transformation formulaire → `QuoteContext` (types, alias, contraintes modals, etc.).
4. `BaseCostEngine(getAllModules()).execute(quoteContext)`.
5. Réponse :  
   `{ success, baseCost, breakdown, context: { original, computed }, activatedModules }`.

**BaseCostEngine** (`src/quotation-module/core/BaseCostEngine.ts`) :

- Utilise uniquement les modules listés dans `BASE_COST_MODULES` (normalisation, volume, distance/transport, accès, monte-meubles/pénalités étage, véhicule, main-d’œuvre).
- Construit un `QuoteContext` avec `ctx.computed` rempli.
- Retourne `baseCost`, `breakdown` (volume, distance, transport, labor), `context`, `activatedModules`.
- Les coûts “variables” (ex. workers / labor selon scénario) peuvent être exclus du `baseCost` via `VARIABLE_COST_MODULES` selon la config.

---

### 2.4 Adaptateur formulaire → contexte

**Fichier** : `src/quotation-module/adapters/FormAdapter.ts`

- **FormAdapter.toQuoteContext(formData)** :
  - Mapping des champs formulaire (avec alias : `pickupAddress` ↔ `departureAddress`, `estimatedVolume` / `volume`, etc.) vers la structure attendue par le moteur.
  - Gestion des contraintes d’accès et services (modals) via `ModalSelectionsAdapter` / `modalSelectionsToQuoteContext`.
  - Aucune logique métier de tarification : uniquement normalisation et mise en forme pour `QuoteContext`.

---

### 2.5 API Étape 2 : `/api/quotation/multi-offers`

| Fichier                                       | Rôle                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/app/api/quotation/multi-offers/route.ts` | Handler POST, rate limit, délègue à `QuoteController.generateMultiOffers`.                                |
| `QuoteController`                             | Vérifie `baseCost`, valide `context.original`, réinjecte `context.computed`, appelle `MultiQuoteService`. |

Séquence dans `QuoteController.generateMultiOffers` :

1. Vérification de `body.baseCost` (sinon 400 avec message d’appeler d’abord `/api/quotation/calculate`).
2. `originalData = body.context?.original || body` puis validation identique à l’étape 1.
3. `FormAdapter.toQuoteContext(originalData)` → `baseContext`.
4. Injection de `body.context.computed` dans `baseContext.computed` (volume, distance, workers, etc.).
5. `MultiQuoteService(getAllModules()).generateMultipleQuotesFromBaseCost(baseContext, scenarios, body.baseCost)`.
6. Formatage des variantes avec `QuoteOutputService` (formatQuote, checklist, contract, audit).
7. `QuoteOutputService.generateComparisonSummaryWithRecommendation(...)` pour la comparaison et la recommandation.
8. Réponse : `{ success, baseCost, quotes[], comparison }`.

**MultiQuoteService** (`src/quotation-module/multi-offers/MultiQuoteService.ts`) :

- Pour chaque scénario (ECO, STANDARD, CONFORT, SÉCURITÉ+, PREMIUM, FLEX) :
  - Préparation du contexte (sélections cross-selling sauvegardées puis flags nettoyés pour ne les réappliquer que selon le scénario).
  - `QuoteEngine` en **mode incrémental** :
    - `skipModules: BASE_COST_MODULES` (tous les modules déjà exécutés en étape 1).
    - `startFromContext`: `computed` de l’étape 1.
    - `enabledModules` / `disabledModules` et `marginRate` selon le scénario.
  - Exécution uniquement des modules additionnels (cross-selling, assurance, options, etc.).
- Formule : `(baseCost + additionalCosts) × (1 + marginRate)`.
- Retour : liste de `QuoteVariant` (scenarioId, label, context, finalPrice, basePrice, marginRate, additionalCosts, etc.).

---

### 2.6 Moteur modulaire (résumé)

| Composant           | Rôle                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **ModuleRegistry**  | `getAllModules()` : enregistre tous les modules (phases 1–8).                                                                            |
| **QuoteEngine**     | Exécution séquentielle des modules (priorité, dépendances, `isApplicable`). Mode normal ou incrémental (skipModules + startFromContext). |
| **BaseCostEngine**  | Sous-ensemble de modules pour le coût de base ; appelle le QuoteEngine avec la liste restreinte.                                         |
| **QuoteContext**    | Entrée/sortie des modules (original + computed).                                                                                         |
| **ComputedContext** | Champs calculés (volume, distance, workers, coûts, etc.) partagés entre étapes.                                                          |

Les phases (ordre strict) sont décrites dans `src/quotation-module/docs/` (pipeline, typologie, exécution).

---

## 3. Synthèse des fichiers clés

| Étape              | Fichier                                                               | Rôle                                                                                        |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Page               | `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`          | Formulaire, déclenchement debounce, affichage prix et multi-offres.                         |
| Hook               | `src/hooks/shared/useModularQuotation.ts`                             | Enrichissement (cross-selling + distance), enchaînement calculate → multi-offers, debounce. |
| Distance           | `src/actions/distanceCalculator.ts` + `callApi`                       | Calcul distance (Google Maps) côté serveur si pas fournie.                                  |
| Route calculate    | `src/app/api/quotation/calculate/route.ts`                            | POST /api/quotation/calculate → QuoteController.                                            |
| Route multi-offers | `src/app/api/quotation/multi-offers/route.ts`                         | POST /api/quotation/multi-offers → QuoteController.                                         |
| Contrôleur         | `src/quotation-module/interfaces/http/controllers/QuoteController.ts` | Validation, FormAdapter, BaseCostEngine, MultiQuoteService, formatage réponse.              |
| Adaptateur         | `src/quotation-module/adapters/FormAdapter.ts`                        | Formulaire → QuoteContext.                                                                  |
| Base cost          | `src/quotation-module/core/BaseCostEngine.ts`                         | Calcul du coût de base (modules de base uniquement).                                        |
| Multi-offres       | `src/quotation-module/multi-offers/MultiQuoteService.ts`              | 6 variantes à partir du baseCost, mode incrémental.                                         |
| Moteur             | `src/quotation-module/core/QuoteEngine.ts`                            | Exécution des modules (complet ou incrémental).                                             |
| Modules            | `src/quotation-module/core/ModuleRegistry.ts`                         | Liste des modules.                                                                          |
| Scénarios          | `src/quotation-module/multi-offers/QuoteScenario.ts`                  | Définition des 6 scénarios (marges, overrides, disabled/enabled modules).                   |

---

## 4. Points de vigilance

1. **Validation** : Les deux APIs s’appuient sur la même validation (date + adresses). Si le front n’envoie pas ces champs (noms ou alias), la requête est rejetée en 400.
2. **Distance** : Si le formulaire n’envoie pas `distance`, elle est calculée dans le hook via `calculateDistance` (Google Maps) avant l’appel à `/api/quotation/calculate`.
3. **Ordre des appels** : `/api/quotation/multi-offers` doit toujours être appelé après `/api/quotation/calculate` avec le même `context` (ou un contexte cohérent), car il réutilise `baseCost` et `context.computed`.
4. **Cross-selling** : Les sélections catalogue (emballage, démontage, etc.) sont injectées dans le formData par le hook, puis passées au contrôleur via le body ; les scénarios (CONFORT, PREMIUM, etc.) peuvent forcer ou ignorer ces options via overrides.

Ce document décrit le flux de calcul de prix de la page `catalog-demenagement-sur-mesure` jusqu’au système modulaire `src/quotation-module`, sans logique métier dans le frontend.
