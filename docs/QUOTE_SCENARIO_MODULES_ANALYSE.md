# Comment chaque scénario utilise les modules (QuoteScenario.ts)

**Contexte** : Les scénarios sont utilisés par `MultiQuoteService` en **mode incrémental**. Le coût de base (transport, volume, main-d’œuvre, accès, monte-meubles, etc.) est déjà calculé par `BaseCostEngine` (étape 1). Pour chaque scénario, le moteur exécute **uniquement les modules additionnels** (cross-selling, assurance, options), puis applique la marge du scénario.

**Règles du moteur** (QuoteEngine + MultiQuoteService) :

- **skipModules** = tous les modules de base (déjà exécutés en étape 1) → jamais réexécutés.
- **disabledModules** (prioritaire) : ces modules ne s’exécutent **jamais** pour ce scénario.
- **enabledModules** (si défini et non vide) : **seuls** ces modules (hors skip) peuvent s’exécuter en plus du base.
- **overrides** : champs du `QuoteContext` (packing, dismantling, cleaningEnd, declaredValue, etc.) injectés **avant** l’exécution des modules, pour forcer les flags métier.

---

## 1. ECO

| Propriété           | Valeur                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **enabledModules**  | _(aucun)_                                                                                                                                                                                                             |
| **disabledModules** | `packing-requirement`, `packing-cost`, `cleaning-end-requirement`, `cleaning-end-cost`, `dismantling-cost`, `reassembly-cost`, `high-value-item-handling`, `supplies-cost`, `overnight-stop-cost`, `crew-flexibility` |
| **overrides**       | _(aucun)_                                                                                                                                                                                                             |
| **marginRate**      | 0.20 (20 %)                                                                                                                                                                                                           |

**Comportement** :

- Aucun module de cross-selling ni option n’est exécuté : tout ce qui est listé dans `disabledModules` est exclu.
- Les modules de base sont déjà dans `skipModules`, donc pas recalculés.
- **Coûts additionnels = 0**. Prix final = `baseCost × (1 + 0.20)`.
- La sélection cross-selling du client est **ignorée** (ECO = pas de services optionnels).

**Modules concernés (désactivés)** :

- Phase 8 : emballage (requirement + cost), nettoyage fin (requirement + cost), démontage, remontage, fournitures.
- Phase 7 : prise en charge objets de valeur.
- Phase 3/6 : arrêt nuit, flexibilité équipe.

---

## 2. STANDARD

| Propriété           | Valeur      |
| ------------------- | ----------- |
| **enabledModules**  | _(aucun)_   |
| **disabledModules** | _(aucun)_   |
| **overrides**       | _(aucun)_   |
| **marginRate**      | 0.30 (30 %) |

**Comportement** :

- Aucune liste `enabledModules` ni `disabledModules` : le moteur exécute **tous les modules applicables** (hors ceux déjà en `skipModules`).
- Les **overrides** ne forcent rien : le contexte vient du formulaire + **sélection cross-selling client**.
- `MultiQuoteService.applyClientCrossSellingForScenario` restaure `packing`, `dismantling`, `reassembly`, `cleaningEnd`, `temporaryStorage` selon ce que le client a choisi dans le catalogue.
- Seuls les modules dont les prérequis sont vrais (ex. `ctx.packing === true`) s’exécutent (ex. `packing-requirement`, `packing-cost`).
- **Coûts additionnels** = somme des coûts des modules optionnels effectivement activés par la sélection client.
- Prix final = `(baseCost + additionalCosts) × (1 + 0.30)`.

**En résumé** : STANDARD = base + uniquement ce que le client a coché (emballage, démontage, remontage, nettoyage, stockage, etc.), avec marge 30 %.

---

## 3. CONFORT

| Propriété           | Valeur                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **enabledModules**  | `packing-requirement`, `packing-cost`, `dismantling-cost`, `reassembly-cost`, `supplies-cost`           |
| **disabledModules** | _(aucun)_                                                                                               |
| **overrides**       | `packing: true`, `dismantling: true`, `reassembly: true`, `bulkyFurniture: true`, `forceSupplies: true` |
| **marginRate**      | 0.35 (35 %)                                                                                             |

**Comportement** :

- Seuls les modules listés dans `enabledModules` (et leurs éventuelles dépendances) peuvent s’ajouter au base. Les autres modules additionnels ne tournent pas pour ce scénario.
- Les **overrides** forcent le contexte pour que :
  - `packing-cost` et `packing-requirement` voient `packing: true`,
  - `dismantling-cost` / `reassembly-cost` voient `dismantling` / `reassembly` et `bulkyFurniture`,
  - `supplies-cost` soit déclenché via `forceSupplies: true` (fournitures incluses).
- Scénario “haut de gamme” : la sélection cross-selling client est **ignorée**, tout est imposé par la formule.
- **Coûts additionnels** = emballage + démontage + remontage + fournitures.
- Prix final = `(baseCost + additionalCosts) × (1 + 0.35)`.

**Modules exécutés (en plus du base)** : requirement/cost emballage, démontage, remontage, fournitures. Pas de nettoyage, pas d’assurance renforcée, pas d’arrêt nuit ni crew-flexibility.

---

## 4. SÉCURITÉ+ (SECURITY_PLUS)

| Propriété           | Valeur                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **enabledModules**  | `packing-requirement`, `packing-cost`, `cleaning-end-requirement`, `cleaning-end-cost`, `dismantling-cost`, `reassembly-cost`, `high-value-item-handling`, `supplies-cost`, `insurance-premium`                      |
| **disabledModules** | _(aucun)_                                                                                                                                                                                                            |
| **overrides**       | `packing: true`, `cleaningEnd: true`, `dismantling: true`, `reassembly: true`, `bulkyFurniture: true`, `artwork: true`, `estimatedVolume: 200`, `declaredValueInsurance: true`, `declaredValue: 50000`, `forceSupplies: true` |
| **marginRate**      | 0.32 (32 %)                                                                                                                                                                                                          |

**Comportement** :

- Tous les modules listés dans `enabledModules` sont autorisés à s’exécuter ; les overrides garantissent que les conditions métier sont remplies (emballage, nettoyage, démontage/remontage, fournitures, objets de valeur, assurance à 50 000 €).
- `estimatedVolume: 200` (≈80 m² pour nettoyage) pousse le nettoyage fin de prestation à être pertinent ; `declaredValueInsurance` + `declaredValue: 50000` alimentent le module `insurance-premium`.
- Sélection client **ignorée** (formule tout inclus).
- **Coûts additionnels** = emballage + nettoyage + démontage + remontage + fournitures + prise en charge objets de valeur + prime d’assurance (50 k€).
- Prix final = `(baseCost + additionalCosts) × (1 + 0.32)`.

---

## 5. PREMIUM

| Propriété           | Valeur                                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **enabledModules**  | _(identique à SÉCURITÉ+)_ : `packing-requirement`, `packing-cost`, `cleaning-end-requirement`, `cleaning-end-cost`, `dismantling-cost`, `reassembly-cost`, `high-value-item-handling`, `supplies-cost`, `insurance-premium` |
| **disabledModules** | _(aucun)_                                                                                                                                                                                                                   |
| **overrides**       | _(identique à SÉCURITÉ+)_ : packing, cleaningEnd, dismantling, reassembly, bulkyFurniture, artwork, estimatedVolume 200, declaredValueInsurance, declaredValue 50000, forceSupplies                                                  |
| **marginRate**      | 0.40 (40 %)                                                                                                                                                                                                                 |

**Comportement** :

- Même ensemble de modules et même contexte forcé que SÉCURITÉ+.
- La **seule** différence avec SÉCURITÉ+ est la **marge** : 40 % au lieu de 32 %. Donc même niveau de services inclus, prix final plus élevé (positionnement “clé en main” plus premium).

**Prix final** = `(baseCost + additionalCosts) × (1 + 0.40)`.

---

## 6. FLEX

| Propriété           | Valeur                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **enabledModules**  | `overnight-stop-cost`, `crew-flexibility`, `dismantling-cost`, `reassembly-cost`             |
| **disabledModules** | _(aucun)_                                                                                    |
| **overrides**       | `crewFlexibility: true`, `forceOvernightStop: true`, `dismantling: true`, `reassembly: true` |
| **marginRate**      | 0.38 (38 %)                                                                                  |

**Comportement** :

- Seuls ces 4 modules (et leurs dépendances éventuelles) sont exécutés en plus du base :
  - **overnight-stop-cost** : arrêt nuit si longue distance (déclenché par `forceOvernightStop` / distance).
  - **crew-flexibility** : garantie flexibilité équipe (coût fixe type 500 €).
  - **dismantling-cost** / **reassembly-cost** : démontage et remontage (forcés par overrides).
- La sélection cross-selling client est **appliquée** avant les overrides ; les overrides forcent malgré tout démontage + remontage + flexibilité + arrêt nuit si applicable.
- Pas d’emballage, nettoyage, fournitures ni assurance renforcée **forcés** par le scénario (ils ne sont pas dans `enabledModules`). S’ils sont cochés par le client, ils peuvent quand même être pris en compte si le moteur les autorise pour FLEX ; dans la config actuelle, seuls les 4 modules ci-dessus sont explicitement activés.
- **Coûts additionnels** = démontage + remontage + (éventuellement) arrêt nuit + garantie flexibilité.
- Prix final = `(baseCost + additionalCosts) × (1 + 0.38)`.

---

## Synthèse par scénario

| Scénario      | Stratégie modules                                                                    | Overrides                                                       | Marge | Coûts additionnels typiques                            |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| **ECO**       | Tout cross-selling désactivé                                                         | Aucun                                                           | 20 %  | 0                                                      |
| **STANDARD**  | Tous les modules applicables (selon ctx)                                             | Aucun                                                           | 30 %  | Sélection client uniquement                            |
| **CONFORT**   | Uniquement emballage + démontage/remontage + fournitures                             | packing, dismantling, reassembly, bulkyFurniture, forceSupplies | 35 %  | Emballage, démontage, remontage, fournitures           |
| **SÉCURITÉ+** | Emballage, nettoyage, démontage, remontage, fournitures, objets de valeur, assurance | Idem + cleaningEnd, assurance 50 k€, volume 200 m³ (nettoyage) | 32 %  | Tout inclus + assurance 50 k€                          |
| **PREMIUM**   | Même liste que SÉCURITÉ+                                                             | Identiques à SÉCURITÉ+                                          | 40 %  | Même que SÉCURITÉ+, prix plus élevé par la marge       |
| **FLEX**      | Arrêt nuit, flexibilité équipe, démontage, remontage                                 | crewFlexibility, forceOvernightStop, dismantling, reassembly    | 38 %  | Démontage, remontage, flexibilité, éventuel arrêt nuit |

---

## Rappel : ordre d’application dans MultiQuoteService

Pour chaque scénario, dans `generateSingleVariantFromBaseCost` :

1. Contexte cloné à partir du base (sans recalculer les modules de base).
2. **Sélection cross-selling client** appliquée **uniquement** pour STANDARD et FLEX (ECO et formules haut de gamme l’ignorent).
3. **Overrides du scénario** appliqués (ils écrasent le contexte, donc pour CONFORT/PREMIUM/SÉCURITÉ+ les services sont forcés).
4. **QuoteEngine** exécuté en mode incrémental avec `enabledModules` / `disabledModules` / `skipModules` / `marginRate` du scénario.
5. **additionalCosts** = somme des coûts des modules qui ne sont pas dans `BASE_COST_MODULES`.
6. **Prix final** = `(baseCost + additionalCosts) × (1 + marginRate)`.

Ce document reflète l’usage des modules tel que défini dans `QuoteScenario.ts` et utilisé par `MultiQuoteService` et `QuoteEngine`.
