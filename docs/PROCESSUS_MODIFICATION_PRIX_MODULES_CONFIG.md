# 📝 Processus de Modification des Prix dans MODULES_CONFIG

**Date** : 2026-01-10  
**Version** : 1.0

---

## 🎯 Vue d'ensemble

Le système modulaire utilise `MODULES_CONFIG` comme **source unique de vérité** pour tous les calculs de prix. Ce document explique comment modifier les prix de manière sécurisée et efficace.

---

## 📋 Deux Méthodes de Modification

### Méthode 1 : Modification Directe dans le Code (Recommandé pour changements permanents)

**Localisation** : `src/quotation-module/config/modules.config.ts`

**Avantages** :

- ✅ Valeurs versionnées dans Git
- ✅ Traçabilité complète des changements
- ✅ Revue de code possible
- ✅ Déploiement contrôlé

**Processus** :

1. **Ouvrir le fichier** `src/quotation-module/config/modules.config.ts`

2. **Localiser la valeur à modifier** :

   ```typescript
   fuel: {
     /** Prix du carburant par litre (€/L) - diesel utilitaire */
     PRICE_PER_LITER: 1.70,  // ← Modifier cette valeur
   }
   ```

3. **Modifier la valeur** :

   ```typescript
   PRICE_PER_LITER: 1.85,  // Nouveau prix
   ```

4. **Vérifier les impacts** :
   - Tester localement avec `npm run dev`
   - Vérifier que les calculs de prix sont corrects
   - Vérifier les tests unitaires : `npm test`

5. **Commit et déploiement** :

   ```bash
   git add src/quotation-module/config/modules.config.ts
   git commit -m "chore: Mise à jour prix carburant (1.70€ → 1.85€)"
   git push
   ```

6. **Déployer** : Les changements prendront effet après le redéploiement

---

### Méthode 2 : Interface Admin (Overrides - Pour changements temporaires ou tests)

**Localisation** : `/admin/modules-config`

**Avantages** :

- ✅ Modification sans redéploiement
- ✅ Prise d'effet immédiate
- ✅ Idéal pour tests A/B ou ajustements temporaires
- ✅ Peut être supprimé facilement

**Processus** :

1. **Accéder à l'interface admin** :
   - URL : `http://localhost:3000/admin/modules-config`
   - Ou via le dashboard admin : `/admin/dashboard` → "Configuration Modules"

2. **Sélectionner la catégorie** :
   - Utiliser les onglets en haut pour naviguer entre les catégories
   - Exemples : `distance`, `fuel`, `labor`, `crossSelling`, etc.

3. **Modifier une valeur** :
   - Cliquer sur l'icône d'édition (⚙️) à côté de la valeur
   - Entrer la nouvelle valeur
   - Cliquer sur ✓ pour sauvegarder

4. **Vérifier l'override** :
   - Un badge "Override" apparaît sur les valeurs modifiées
   - La valeur par défaut est affichée en gris

5. **Supprimer un override** :
   - Cliquer sur "Supprimer override" pour revenir à la valeur par défaut

**Comment ça fonctionne** :

- Les modifications créent des **overrides** dans la table `Configuration` (BDD)
- Clé de l'override : `MODULES_CONFIG.{category}.{key}`
- Catégorie : `PRICING_FACTORS`
- Les overrides sont appliqués au runtime via `getModulesConfigWithOverrides()`
- Cache de 5 minutes pour les performances

---

## 🔍 Structure de MODULES_CONFIG

### Catégories principales

| Catégorie       | Description        | Exemples de valeurs                                                 |
| --------------- | ------------------ | ------------------------------------------------------------------- |
| `distance`      | Distance et seuils | `DEFAULT_DISTANCE_KM`, `LONG_DISTANCE_THRESHOLD_KM`                 |
| `fuel`          | Carburant          | `PRICE_PER_LITER`, `VEHICLE_CONSUMPTION_L_PER_100KM`                |
| `tolls`         | Péages             | `COST_PER_KM`, `HIGHWAY_PERCENTAGE`                                 |
| `vehicle`       | Véhicules          | `VEHICLE_COSTS`, `VEHICLE_CAPACITIES`                               |
| `volume`        | Volume             | `VOLUME_COEFFICIENTS`, `BASE_VOLUMES_BY_TYPE`                       |
| `labor`         | Main-d'œuvre       | `BASE_HOURLY_RATE`, `VOLUME_PER_WORKER`                             |
| `furnitureLift` | Monte-meubles      | `BASE_LIFT_COST`, `DOUBLE_LIFT_SURCHARGE`                           |
| `crossSelling`  | Options            | `PACKING_COST_PER_M3`, `CLEANING_COST_PER_M2`                       |
| `temporal`      | Temporel           | `WEEKEND_SURCHARGE_PERCENTAGE`, `END_OF_MONTH_SURCHARGE_PERCENTAGE` |

### Exemple de structure

```typescript
export const MODULES_CONFIG = {
  fuel: {
    /** Prix du carburant par litre (€/L) - diesel utilitaire */
    PRICE_PER_LITER: 1.7,

    /** Consommation moyenne véhicule utilitaire (L/100km) */
    VEHICLE_CONSUMPTION_L_PER_100KM: 12,
  },

  labor: {
    /** Taux horaire de base (€/h) */
    BASE_HOURLY_RATE: 30,

    /** Volume par déménageur (m³) */
    VOLUME_PER_WORKER: 5,
  },
};
```

---

## ⚠️ Bonnes Pratiques

### 1. **Toujours documenter les changements**

```typescript
// ❌ MAUVAIS
PRICE_PER_LITER: 1.85,

// ✅ BON
/** Prix du carburant par litre (€/L) - diesel utilitaire - Mis à jour le 2026-01-10 */
PRICE_PER_LITER: 1.85,
```

### 2. **Tester avant de déployer**

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Vérification locale
npm run dev
```

### 3. **Vérifier les impacts**

Avant de modifier une valeur, vérifier :

- ✅ Quels modules utilisent cette valeur ?
- ✅ Quels calculs sont affectés ?
- ✅ Y a-t-il des tests à mettre à jour ?

### 4. **Utiliser les overrides pour les tests**

Pour tester une nouvelle valeur sans commit :

1. Utiliser l'interface admin pour créer un override
2. Tester les calculs
3. Si satisfait, modifier le code source
4. Supprimer l'override

### 5. **Respecter les unités**

Chaque valeur a une unité spécifique :

- `PRICE_PER_LITER` : €/L
- `BASE_HOURLY_RATE` : €/h
- `PACKING_COST_PER_M3` : €/m³
- `WEEKEND_SURCHARGE_PERCENTAGE` : % (0.05 = 5%)

---

## 🔄 Workflow Recommandé

### Pour un changement permanent

1. **Créer une branche** :

   ```bash
   git checkout -b update/fuel-price-2026-01
   ```

2. **Modifier MODULES_CONFIG** :
   - Ouvrir `src/quotation-module/config/modules.config.ts`
   - Modifier la valeur
   - Ajouter un commentaire avec la date

3. **Tester** :

   ```bash
   npm test
   npm run dev
   ```

4. **Commit** :

   ```bash
   git add src/quotation-module/config/modules.config.ts
   git commit -m "chore: Mise à jour prix carburant (1.70€ → 1.85€)"
   ```

5. **Créer une PR** :
   - Demander une revue de code
   - Vérifier les tests CI/CD

6. **Déployer** :
   - Après validation de la PR
   - Vérifier en production

### Pour un test temporaire

1. **Utiliser l'interface admin** :
   - `/admin/modules-config`
   - Créer un override

2. **Tester** :
   - Vérifier les calculs de prix
   - Analyser l'impact

3. **Décider** :
   - Si satisfait → Modifier le code source
   - Si non satisfait → Supprimer l'override

---

## 🐛 Dépannage

### Problème : Les changements ne prennent pas effet

**Solution** :

1. Vérifier que le serveur a redémarré (si modification code)
2. Vider le cache des overrides (si modification via admin)
3. Vérifier les logs pour erreurs

### Problème : Erreur de type

**Solution** :

- Vérifier que le type de la valeur correspond (number, string, boolean)
- Vérifier les unités (ne pas mélanger € et %)

### Problème : Override non appliqué

**Solution** :

1. Vérifier que l'override existe dans `Configuration` (catégorie `PRICING_FACTORS`)
2. Vérifier que la clé est correcte : `MODULES_CONFIG.{category}.{key}`
3. Attendre 5 minutes (cache) ou redémarrer le serveur

---

## 📚 Ressources

- **Fichier source** : `src/quotation-module/config/modules.config.ts`
- **Interface admin** : `/admin/modules-config`
- **Service d'overrides** : `src/quotation-module/config/getModulesConfigWithOverrides.ts`
- **Actions admin** : `src/actions/adminModulesConfig.ts`
- **Documentation architecture** : `src/quotation-module/docs/README.md`

---

**Dernière mise à jour** : 2026-01-10
