# Configuration centralisée des modules

Ce dossier contient toutes les configurations centralisées pour le système de devis modulaire.

## 📁 Fichiers

### `modules.config.ts`
**Source unique de vérité** pour toutes les valeurs codées en dur dans les modules.

Contient :
- ✅ Valeurs de tarification (coûts, surcoûts, pénalités)
- ✅ Seuils et constantes métier (distances, volumes, étages)
- ✅ Coefficients et facteurs de calcul
- ✅ Configurations temporelles (heures de pointe, week-end)
- ✅ Paramètres de risque et d'incertitude

### `insurance.config.ts`
Configuration spécifique pour l'assurance déménagement.

### `index.ts`
Point d'entrée centralisé pour exporter toutes les configurations.

## 🚀 Utilisation

### Import de la configuration

```typescript
import { MODULES_CONFIG } from '../../config/modules.config';
// ou
import { MODULES_CONFIG } from '../../config';
```

### Exemple d'utilisation dans un module

**Avant** (valeur codée en dur) :
```typescript
private static readonly BASE_LIFT_COST = 250;
private static readonly COST_PER_EXTRA_FLOOR = 50;
```

**Après** (utilisation de la config) :
```typescript
import { MODULES_CONFIG } from '../../config/modules.config';

// Dans la méthode apply()
const baseCost = MODULES_CONFIG.furnitureLift.BASE_LIFT_COST;
const costPerFloor = MODULES_CONFIG.furnitureLift.COST_PER_EXTRA_FLOOR;
```

### Accès aux valeurs

```typescript
// Distance
const longDistanceThreshold = MODULES_CONFIG.distance.LONG_DISTANCE_THRESHOLD_KM;

// Carburant
const fuelPrice = MODULES_CONFIG.fuel.PRICE_PER_LITER;

// Volume
const studioCoefficient = MODULES_CONFIG.volume.VOLUME_COEFFICIENTS.STUDIO;

// Main-d'œuvre
const defaultWorkers = MODULES_CONFIG.labor.DEFAULT_WORKERS_COUNT;

// Monte-meubles
const baseLiftCost = MODULES_CONFIG.furnitureLift.BASE_LIFT_COST;

// Cross-selling
const packingCostPerM3 = MODULES_CONFIG.crossSelling.PACKING_COST_PER_M3;
```

## 📊 Structure de la configuration

La configuration est organisée par catégories logiques :

```
MODULES_CONFIG
├── distance          # Seuils et constantes de distance
├── fuel              # Prix et consommation carburant
├── tolls             # Coûts des péages
├── volume            # Estimation et calcul de volume
├── labor             # Main-d'œuvre et déménageurs
├── furnitureLift     # Monte-meubles
├── access            # Contraintes d'accès
├── logistics         # Logistique (navette, arrêt nuit, trafic)
├── temporal          # Facteurs temporels (week-end)
├── crossSelling      # Options (emballage, stockage, nettoyage)
├── highValueItems    # Objets de grande valeur
├── risk              # Risques et incertitudes
└── administrative    # Coûts administratifs et légaux
```

## 🔧 Modification des valeurs

### ⚠️ Important

1. **Toute modification de tarification** doit se faire **uniquement** dans `modules.config.ts`
2. **Ne jamais** modifier les valeurs directement dans les modules
3. **Documenter** les changements dans le changelog du projet

### Exemple de modification

Pour modifier le coût de base du monte-meubles :

```typescript
// Dans modules.config.ts
furnitureLift: {
  BASE_LIFT_COST: 300,  // Modifié de 250 à 300
  // ...
}
```

Tous les modules utilisant cette valeur seront automatiquement mis à jour.

## 📝 Migration des modules existants

Pour migrer un module existant :

1. **Identifier** les valeurs codées en dur
2. **Vérifier** si elles existent dans `modules.config.ts`
3. **Si absentes**, les ajouter à la config appropriée
4. **Remplacer** les valeurs dans le module par des références à la config
5. **Tester** que le module fonctionne toujours correctement

### Exemple de migration complète

**Module avant** :
```typescript
export class FurnitureLiftCostModule implements QuoteModule {
  private static readonly BASE_LIFT_COST = 250;
  private static readonly COST_PER_EXTRA_FLOOR = 50;
  private static readonly DOUBLE_LIFT_SURCHARGE = 150;

  apply(ctx: QuoteContext): QuoteContext {
    let liftCost = FurnitureLiftCostModule.BASE_LIFT_COST;
    // ...
  }
}
```

**Module après** :
```typescript
import { MODULES_CONFIG } from '../../config/modules.config';

export class FurnitureLiftCostModule implements QuoteModule {
  apply(ctx: QuoteContext): QuoteContext {
    const { BASE_LIFT_COST, COST_PER_EXTRA_FLOOR, DOUBLE_LIFT_SURCHARGE } = 
      MODULES_CONFIG.furnitureLift;
    
    let liftCost = BASE_LIFT_COST;
    // ...
  }
}
```

## ✅ Avantages

1. **Maintenance facilitée** : Toutes les valeurs au même endroit
2. **Cohérence garantie** : Pas de duplication de valeurs
3. **Tests simplifiés** : Facile de tester avec différentes configurations
4. **Évolutivité** : Ajout de nouvelles valeurs sans modifier le code des modules
5. **Documentation** : Valeurs documentées avec leur unité et usage

## 🔍 Recherche de valeurs

Pour trouver où une valeur est utilisée :

```bash
# Rechercher dans les modules
grep -r "BASE_LIFT_COST" src/quotation-module/modules/

# Rechercher dans la config
grep -r "BASE_LIFT_COST" src/quotation-module/config/
```

## 📚 Documentation des valeurs

Chaque valeur dans `modules.config.ts` est documentée avec :
- **Unité** : €, km, m³, %, etc.
- **Usage** : Description de son utilisation
- **Contexte** : Dans quel cas elle s'applique

Exemple :
```typescript
/** Coût de base monte-meubles (€) - installation + opérateur */
BASE_LIFT_COST: 250,
```

## 🎯 Prochaines étapes

1. ✅ Configuration créée et documentée
2. ⏳ Migration progressive des modules existants
3. ⏳ Ajout de tests pour valider les valeurs
4. ⏳ Documentation des règles métier associées

