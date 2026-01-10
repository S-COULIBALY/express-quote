# ✅ RÉSOLU : Sélection du catalogue affecte tous les scénarios

> **Statut** : CORRIGÉ ✅
> **Date de résolution** : 2026-01-10
> **Solution** : Centralisation de la logique dans MultiQuoteService

## 📋 Description du problème (historique)

Quand le client sélectionne des services ou fournitures dans le catalogue cross-selling, ces sélections affectaient **tous les scénarios** (ECO, STANDARD, CONFORT, PREMIUM, SECURITY_PLUS, FLEX) au lieu de n'affecter que **STANDARD** (et potentiellement **FLEX**).

### Comportement attendu

- **STANDARD** : Les services/fournitures sélectionnés dans le catalogue doivent être appliqués (prix modifié)
- **FLEX** : Les services/fournitures sélectionnés dans le catalogue doivent être appliqués (prix modifié)
- **CONFORT, PREMIUM, SECURITY_PLUS** : Les services sont **inclus dans la formule** via `overrides`, donc la sélection du catalogue doit être **ignorée** (prix inchangé)
- **ECO** : Les services sont **désactivés** via `disabledModules`, donc la sélection du catalogue doit être **ignorée** (prix inchangé)

### Comportement observé

Avec sélection du catalogue (sans stockage) :
- **STANDARD** : ✅ Prix modifié (4223.67 € au lieu de 2162.52 €)
- **CONFORT** : ✅ Prix inchangé (2798.33 €)
- **SECURITY_PLUS** : ✅ Prix inchangé (4834.95 €)
- **PREMIUM** : ✅ Prix inchangé (5127.98 €)
- **FLEX** : ❓ Prix inchangé (3124.10 €) - **À vérifier si c'est normal**
- **ECO** : ✅ Prix inchangé (1996.18 €)

## 🔍 Analyse technique

### Flux de données

1. **Frontend** : Le client sélectionne des services/fournitures dans le catalogue
2. **`useModularQuotation.ts`** : `enrichFormDataWithCrossSelling()` enrichit le formulaire avec les sélections :
   ```typescript
   packing: formData.packing || pricingData.packing,  // ← Devient true
   dismantling: formData.dismantling || pricingData.dismantling,  // ← Devient true
   reassembly: formData.reassembly || pricingData.reassembly,  // ← Devient true
   cleaningEnd: formData.cleaningEnd || pricingData.cleaningEnd,  // ← Devient true
   crossSellingSuppliesTotal: pricingData.suppliesTotal,  // ← Total fournitures
   ```
3. **`FormAdapter.ts`** : Convertit les données du formulaire en `QuoteContext`
4. **`BaseCostEngine`** : Calcule le `baseCost` avec le contexte enrichi
5. **`MultiQuoteService`** : Génère les 6 scénarios à partir du `baseCost` :
   - Clone le contexte de base (`baseCtx`)
   - Applique les `overrides` du scénario
   - Injecte le `scenarioId` dans les métadonnées
   - Exécute les modules additionnels

### Problème identifié

Les flags (`packing`, `dismantling`, `reassembly`, `cleaningEnd`) sont présents dans le **contexte de base** (`baseCtx`) et sont donc **partagés entre tous les scénarios**.

Quand un scénario applique ses `overrides`, il peut :
- **Écraser** le flag (ex: CONFORT avec `packing: true` dans overrides)
- **Laisser** le flag du catalogue (ex: STANDARD sans override pour `packing`)

Mais les modules vérifient simplement `ctx.packing === true` sans distinguer si c'est :
- Un override du scénario (à appliquer)
- Une sélection du catalogue (à ignorer pour les scénarios haut de gamme)

### Tentative de correction

Modification des modules pour vérifier le `scenarioId` :
- **`PackingCostModule`**
- **`CleaningEndCostModule`**
- **`DismantlingCostModule`**
- **`ReassemblyCostModule`**
- **`SuppliesCostModule`** (déjà corrigé)

**Logique appliquée** :
```typescript
const scenarioId = ctx.metadata?.scenarioId;
const isHighEndScenario = scenarioId === 'CONFORT' || scenarioId === 'PREMIUM' || scenarioId === 'SECURITY_PLUS';
const isStandardOrFlex = scenarioId === 'STANDARD' || scenarioId === 'FLEX';

if (isHighEndScenario) {
  // Service inclus dans la formule → toujours appliquer
  return true;
}

if (isStandardOrFlex) {
  // Sélection client → appliquer
  return true;
}
```

### Pourquoi le problème persiste

**Hypothèse 1** : Les `overrides` sont appliqués **après** le clonage, donc les flags du catalogue sont toujours présents dans `baseCtx`. Quand un scénario haut de gamme applique `packing: true` via override, le module voit `ctx.packing === true` et s'exécute, mais il ne peut pas distinguer si c'est :
- Un override du scénario (correct)
- Une sélection du catalogue qui a été écrasée par l'override (correct aussi)

**Hypothèse 2** : Les modules ne sont pas tous corrigés. Il manque peut-être :
- `StorageCostModule` (si stockage sélectionné)
- `HighValueItemHandlingModule` (si objets de valeur sélectionnés)
- Autres modules cross-selling

**Hypothèse 3** : Le problème vient du fait que les `overrides` **écrasent** les flags du catalogue, mais les modules s'exécutent quand même car ils voient `ctx.packing === true`. La distinction entre "override scénario" et "sélection catalogue" n'est pas possible avec la logique actuelle.

## 🔧 Solutions possibles

### Solution 1 : Marquer l'origine des flags

Ajouter un flag dans les métadonnées pour indiquer si un service vient du catalogue ou d'un override :

```typescript
// Dans MultiQuoteService
if (scenario.overrides) {
  Object.assign(ctxClone, scenario.overrides);
  // Marquer les services forcés par le scénario
  ctxClone.metadata = {
    ...ctxClone.metadata,
    forcedByScenario: {
      packing: scenario.overrides.packing === true,
      dismantling: scenario.overrides.dismantling === true,
      reassembly: scenario.overrides.reassembly === true,
      cleaningEnd: scenario.overrides.cleaningEnd === true,
    }
  };
}
```

Puis dans les modules :
```typescript
isApplicable(ctx: QuoteContext): boolean {
  const scenarioId = ctx.metadata?.scenarioId;
  const forcedByScenario = ctx.metadata?.forcedByScenario?.packing;
  const isHighEndScenario = scenarioId === 'CONFORT' || scenarioId === 'PREMIUM' || scenarioId === 'SECURITY_PLUS';
  
  if (isHighEndScenario && !forcedByScenario) {
    // Service sélectionné dans le catalogue mais pas forcé par le scénario → ignorer
    return false;
  }
  
  return ctx.packing === true;
}
```

### Solution 2 : Nettoyer les flags du catalogue avant d'appliquer les overrides

Dans `MultiQuoteService`, avant d'appliquer les overrides, réinitialiser les flags cross-selling pour les scénarios haut de gamme :

```typescript
// Pour les scénarios haut de gamme, réinitialiser les flags du catalogue
if (isHighEndScenario) {
  ctxClone.packing = false;
  ctxClone.dismantling = false;
  ctxClone.reassembly = false;
  ctxClone.cleaningEnd = false;
  // Puis appliquer les overrides qui vont les remettre à true si nécessaire
}
```

### Solution 3 : Séparer les flags "catalogue" des flags "scénario"

Créer deux sets de flags distincts :
- `cataloguePacking`, `catalogueDismantling`, etc. (sélection client)
- `packing`, `dismantling`, etc. (override scénario)

Les modules vérifient d'abord les overrides, puis les sélections catalogue selon le scénario.

## 📊 Modules concernés

- ✅ `PackingCostModule` - Modifié mais problème persiste
- ✅ `CleaningEndCostModule` - Modifié mais problème persiste
- ✅ `DismantlingCostModule` - Modifié mais problème persiste
- ✅ `ReassemblyCostModule` - Modifié mais problème persiste
- ✅ `SuppliesCostModule` - Déjà corrigé (logique différente)
- ❓ `StorageCostModule` - À vérifier
- ❓ `HighValueItemHandlingModule` - À vérifier

## ✅ Solution Implémentée

### Approche : Centralisation dans MultiQuoteService

La solution implémentée combine les meilleures aspects des solutions proposées :

1. **Sauvegarde des sélections client** dans `metadata.clientCrossSellingSelection`
2. **Nettoyage des flags** du contexte de base avant génération des scénarios
3. **Restauration conditionnelle** selon le scénario

### Fichiers modifiés

#### 1. `MultiQuoteService.ts` (principal)

Nouvelles méthodes :
- `prepareContextWithCrossSellingMetadata()` : Sauvegarde les sélections et nettoie les flags
- `applyClientCrossSellingForScenario()` : Restaure les flags selon le scénario

```typescript
// Flux de génération des scénarios
generateMultipleQuotesFromBaseCost(baseCtx, scenarios, baseCost) {
  // 1. Sauvegarder les sélections et nettoyer les flags
  const preparedCtx = this.prepareContextWithCrossSellingMetadata(baseCtx);

  // 2. Pour chaque scénario
  scenarios.map(scenario => {
    // 3. Restaurer les flags selon le scénario (STANDARD/FLEX uniquement)
    ctx = this.applyClientCrossSellingForScenario(ctx, scenario.id);

    // 4. Appliquer les overrides du scénario
    Object.assign(ctx, scenario.overrides);

    // 5. Exécuter les modules
  });
}
```

#### 2. Modules de cross-selling (simplifiés)

Les modules n'ont plus besoin de vérifier le scénario - la logique est centralisée :

```typescript
// PackingCostModule, DismantlingCostModule, etc.
isApplicable(ctx: QuoteContext): boolean {
  // Simple vérification du flag - la logique de scénario est en amont
  return ctx.packing === true;
}
```

### Comportement résultant

| Scénario | Sélection client | Overrides | Résultat |
|----------|-----------------|-----------|----------|
| **ECO** | ❌ Ignorée | Aucun | Services désactivés via `disabledModules` |
| **STANDARD** | ✅ Appliquée | Aucun | Prix modifié selon sélection |
| **FLEX** | ✅ Appliquée | `dismantling`, `reassembly` | Prix modifié + services inclus |
| **CONFORT** | ❌ Ignorée | `packing`, `dismantling`, `reassembly` | Services inclus dans formule |
| **PREMIUM** | ❌ Ignorée | Tous services | Services inclus dans formule |
| **SECURITY_PLUS** | ❌ Ignorée | Tous services + assurance | Services inclus dans formule |

### Logs de debug

```
📦 CROSS-SELLING CLIENT SAUVEGARDÉ:
   ✓ Emballage professionnel
   ✓ Démontage meubles

🔧 Scénario ECO (marge: 20.0%) [MODE INCRÉMENTAL]
   📦 ECO: Services DÉSACTIVÉS (sélection client ignorée)

🔧 Scénario STANDARD (marge: 30.0%) [MODE INCRÉMENTAL]
   📦 STANDARD: Sélection client APPLIQUÉE (emballage, démontage)

🔧 Scénario CONFORT (marge: 35.0%) [MODE INCRÉMENTAL]
   📦 CONFORT: Services INCLUS dans la formule (sélection client ignorée)
```

## 📝 Notes

- La solution centralise toute la logique dans `MultiQuoteService` pour éviter la duplication
- Les modules de cross-selling sont maintenant plus simples et plus maintenables
- Les objets spéciaux (piano, safe, artwork) ne sont PAS nettoyés car ils représentent une réalité physique
- Les fournitures cross-selling étaient déjà correctement gérées (logique séparée dans `SuppliesCostModule`)

