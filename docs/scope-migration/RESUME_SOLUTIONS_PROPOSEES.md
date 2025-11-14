# 📋 Résumé des Solutions Proposées - Migration RuleScope

## 🎯 Problème Identifié

Lors de l'ouverture du modal `AccessConstraintsModal`, le système ne charge pas efficacement les règles car :

1. **API `/api/rules/unified`** ne filtre pas strictement par `serviceType` et `ruleType`
2. **Clé de cache** dans `useUnifiedRules` n'inclut pas le `condition.scope`
3. **Classification BDD** : les règles MOVING sont `BUSINESS` au lieu de `CONSTRAINT`

## 🔧 Solutions Proposées

### 1. Correction de l'API Route (`/api/rules/unified`)

**Problème** : L'API ignore les filtres `serviceType` et `ruleType`, retournant potentiellement des règles d'autres services.

**Solution** :
```typescript
// Ajouter dans la clause WHERE de Prisma
if (serviceType) {
  where.serviceType = serviceType;
}
if (ruleType) {
  where.ruleType = ruleType;
}
```

**Impact** : Filtrage strict par service et type de règle, plus de fuite inter-service.

### 2. Correction de la Clé de Cache (`useUnifiedRules`)

**Problème** : La clé de cache ne distingue pas les scopes, causant des collisions entre PICKUP/DELIVERY.

**Solution** :
```typescript
// Ancienne clé
const cacheKey = `rules-${ruleType}-${serviceType}-${conditionType}`;

// Nouvelle clé
const cacheKey = `rules-${ruleType}-${serviceType}-${conditionType}-${condition.scope || 'none'}`;
```

**Impact** : Cache segmenté par scope, évite les collisions PICKUP/DELIVERY.

### 3. Stratégie de Classification BDD

**Problème** : Règles MOVING classées comme `BUSINESS` au lieu de `CONSTRAINT`.

**Options** :

#### Option A : Mise à jour BDD
```sql
-- Migrer les règles de contraintes vers CONSTRAINT
UPDATE rules 
SET ruleType = 'CONSTRAINT' 
WHERE serviceType = 'MOVING' 
AND (name ILIKE '%escalier%' OR name ILIKE '%ascenseur%' OR name ILIKE '%distance%');
```

#### Option B : Filtrage par Métadonnées
```typescript
// Dans l'API, filtrer par metadata.category_frontend
if (ruleType === 'CONSTRAINT') {
  where.metadata = {
    path: ['category_frontend'],
    equals: 'constraint'
  };
}
```

## 📊 Impact Attendu

### Avant Correction
- ❌ Modal charge des règles d'autres services
- ❌ Cache collision entre PICKUP/DELIVERY  
- ❌ 0 règles trouvées pour `ruleType: CONSTRAINT`
- ❌ Performance dégradée

### Après Correction
- ✅ Filtrage strict par service et type
- ✅ Cache segmenté par scope
- ✅ Règles correctement classées
- ✅ Performance optimisée

## 🚀 Plan d'Implémentation

1. **Phase 1** : Corriger l'API route (filtres `serviceType`/`ruleType`)
2. **Phase 2** : Mettre à jour la clé de cache
3. **Phase 3** : Choisir et implémenter la stratégie de classification BDD
4. **Phase 4** : Tests de validation

## 📈 Métriques de Succès

- **Performance** : Réduction du nombre de règles chargées de ~76 à ~10-15 par modal
- **Précision** : 100% des règles chargées correspondent au service/scope demandé
- **Cache Hit Rate** : >90% pour les requêtes répétées
- **Temps de réponse** : <200ms pour l'ouverture du modal

---

*Document créé le : 2025-01-27*  
*Statut : En attente d'approbation pour implémentation*
















