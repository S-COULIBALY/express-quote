# Exemple Concret: Données Frontend → Backend

## 📋 Contexte

Un client déménage de Paris à Lyon avec:
- **Départ**: 8ème étage, sans ascenseur, escaliers difficiles, couloirs étroits
- **Arrivée**: 10ème étage, sans ascenseur, distance de portage > 30m
- **Services globaux**: Piano à transporter, objets fragiles, emballage professionnel

## 🖱️ Actions Utilisateur

### 1. Modal "Contraintes d'accès au départ"
L'utilisateur ouvre ce modal et sélectionne:
- ✅ **Escalier difficile ou dangereux** (contrainte d'adresse)
- ✅ **Couloirs étroits ou encombrés** (contrainte d'adresse)
- ✅ **Monte-meuble** (service - détecté automatiquement)
- ✅ **Transport piano** (service global)
- ✅ **Emballage professionnel départ** (service global)

### 2. Modal "Contraintes d'accès à l'arrivée"
L'utilisateur ouvre ce modal et sélectionne:
- ✅ **Distance de portage > 30m** (contrainte d'adresse)
- ✅ **Transport piano** (service global - ⚠️ DUPLIQUÉ!)
- ✅ **Objets fragiles/précieux** (service global)

## 📊 STRUCTURE ACTUELLE (Problématique)

### FormData tel qu'envoyé actuellement:

```json
{
  "serviceType": "PACKING",
  "volume": 45,
  "distance": 475.249,
  "duration": 6,
  "workers": 6,
  "scheduledDate": "2025-10-28T00:00:00.000Z",

  "pickupAddress": "145 Rue La Fayette, 75010 Paris, France",
  "deliveryAddress": "22 Av. Rockefeller, 69008 Lyon, France",
  "pickupFloor": "8",
  "deliveryFloor": "10",
  "pickupElevator": "no",
  "deliveryElevator": "no",
  "pickupCarryDistance": "30+",
  "deliveryCarryDistance": "30+",

  "pickupLogisticsConstraints": {
    "40acdd70-5c1f-4936-a53c-8f52e6695a4c": true,
    "b2b8f00b-00a2-456c-ad06-1150d25d71a3": true,
    "5cdd32e3-23d5-413e-a9b4-26a746066ce0": true,
    "transport-piano-uuid": true,
    "42b851fa-992a-45ef-9da8-744968fdc6b4": true
  },

  "deliveryLogisticsConstraints": {
    "ca6cb6e5-9f5a-4d50-8200-d78d9dedd901": true,
    "transport-piano-uuid": true,
    "352eabed-8869-460f-b7f0-99237b003cc1": true
  }
}
```

### ❌ Problèmes:
1. **Piano dupliqué**: dans pickup ET delivery → facturé 2x
2. **Impossible à debugger**: UUID illisibles
3. **Pas de séparation**: Contraintes + Services mélangés

---

## ✅ STRUCTURE PROPOSÉE (Solution)

### FormData avec séparation intelligente:

```json
{
  "serviceType": "PACKING",
  "volume": 45,
  "distance": 475.249,
  "duration": 6,
  "workers": 6,
  "scheduledDate": "2025-10-28T00:00:00.000Z",

  "pickupAddress": "145 Rue La Fayette, 75010 Paris, France",
  "deliveryAddress": "22 Av. Rockefeller, 69008 Lyon, France",
  "pickupFloor": "8",
  "deliveryFloor": "10",
  "pickupElevator": "no",
  "deliveryElevator": "no",
  "pickupCarryDistance": "30+",
  "deliveryCarryDistance": "30+",

  "pickupRules": [
    {
      "id": "40acdd70-5c1f-4936-a53c-8f52e6695a4c",
      "name": "Escalier difficile ou dangereux"
    },
    {
      "id": "b2b8f00b-00a2-456c-ad06-1150d25d71a3",
      "name": "Couloirs étroits ou encombrés"
    },
    {
      "id": "5cdd32e3-23d5-413e-a9b4-26a746066ce0",
      "name": "Monte-meuble"
    }
  ],

  "deliveryRules": [
    {
      "id": "ca6cb6e5-9f5a-4d50-8200-d78d9dedd901",
      "name": "Distance de portage > 30m"
    }
  ],

  "globalRules": [
    {
      "id": "transport-piano-uuid",
      "name": "Transport piano"
    },
    {
      "id": "42b851fa-992a-45ef-9da8-744968fdc6b4",
      "name": "Emballage professionnel départ"
    },
    {
      "id": "352eabed-8869-460f-b7f0-99237b003cc1",
      "name": "Objets fragiles/précieux"
    }
  ],

  "defaultPrice": 735,
  "__presetSnapshot": {
    "distance": 20,
    "workers": 3,
    "duration": 4
  }
}
```

### ✅ Avantages:
1. **Piano UNE SEULE FOIS**: dans `globalRules` → facturé 1x ✅
2. **Debug facile**: Chaque règle a `{id, name}` ✅
3. **Séparation claire**: pickup / delivery / global ✅

---

## 🔄 TRAITEMENT BACKEND

### 1. PriceService reçoit la requête

```typescript
// Dans PriceService.createQuoteContext()
async createQuoteContext(request: PriceCalculationRequest) {
  const context = new QuoteContext(request.serviceType);

  // ... ajouter volume, distance, etc.

  // Extraire les IDs de règles
  const pickupIds = request.pickupRules?.map(r => r.id) || [];
  const deliveryIds = request.deliveryRules?.map(r => r.id) || [];
  const globalIds = request.globalRules?.map(r => r.id) || [];

  // Logger pour debug (avec les noms!)
  console.log('📍 Règles DÉPART:',
    request.pickupRules?.map(r => r.name).join(', ')
  );
  console.log('📍 Règles ARRIVÉE:',
    request.deliveryRules?.map(r => r.name).join(', ')
  );
  console.log('🌍 Règles GLOBALES:',
    request.globalRules?.map(r => r.name).join(', ')
  );

  // Ajouter au contexte
  context.setValue('pickupRuleIds', pickupIds);
  context.setValue('deliveryRuleIds', deliveryIds);
  context.setValue('globalRuleIds', globalIds);

  return context;
}
```

### 2. RuleEngine applique les règles

```typescript
// Dans RuleEngine.execute()
execute(basePrice: Money, context: QuoteContext, rules: Rule[]) {
  // Récupérer les IDs depuis le contexte
  const pickupIds = context.getValue('pickupRuleIds') as string[] || [];
  const deliveryIds = context.getValue('deliveryRuleIds') as string[] || [];
  const globalIds = context.getValue('globalRuleIds') as string[] || [];

  // Combiner tous les IDs (sans duplication grâce à Set)
  const allSelectedIds = [
    ...new Set([...pickupIds, ...deliveryIds, ...globalIds])
  ];

  console.log('🎯 Total règles sélectionnées:', allSelectedIds.length);

  // Filtrer les règles à appliquer
  const rulesToApply = rules.filter(rule =>
    allSelectedIds.includes(rule.getId())
  );

  console.log(`✅ ${rulesToApply.length} règles seront appliquées`);

  // Appliquer chaque règle...
}
```

### 3. Logs Backend (Exemple)

```bash
📍 Règles DÉPART: Escalier difficile ou dangereux, Couloirs étroits ou encombrés, Monte-meuble
📍 Règles ARRIVÉE: Distance de portage > 30m
🌍 Règles GLOBALES: Transport piano, Emballage professionnel départ, Objets fragiles/précieux

🎯 Total règles sélectionnées: 6
✅ 6 règles seront appliquées

💰 Prix de base: 2429.75€

✅ Application "Escalier difficile ou dangereux" (+8.5%): +206.53€ → 2636.28€
✅ Application "Couloirs étroits ou encombrés" (+6.5%): +157.93€ → 2794.21€
✅ Application "Monte-meuble" (+300€): +300€ → 3094.21€
✅ Application "Distance de portage > 30m" (+7.8%): +189.72€ → 3283.93€
✅ Application "Transport piano" (+250€): +250€ → 3533.93€
✅ Application "Emballage professionnel départ" (+120€): +120€ → 3653.93€
✅ Application "Objets fragiles/précieux" (+180€): +180€ → 3833.93€

💰 Prix final: 3833.93€
```

---

## 🎯 COMPARAISON STRUCTURE ACTUELLE vs PROPOSÉE

### Requête Backend

| Aspect | Actuel | Proposé |
|--------|--------|---------|
| **Champ pickup** | `pickupLogisticsConstraints: {uuid: true}` | `pickupRules: [{id, name}]` |
| **Champ delivery** | `deliveryLogisticsConstraints: {uuid: true}` | `deliveryRules: [{id, name}]` |
| **Champ global** | ❌ N'existe pas | `globalRules: [{id, name}]` |
| **Piano dupliqué** | ❌ Oui (dans pickup ET delivery) | ✅ Non (dans global uniquement) |
| **Debug logs** | ❌ UUID illisibles | ✅ Noms de règles lisibles |

### Résumé

**Structure actuelle**:
```json
{
  "pickupLogisticsConstraints": {"uuid1": true, "piano": true},
  "deliveryLogisticsConstraints": {"uuid2": true, "piano": true}
}
```
→ Piano facturé 2 fois ❌

**Structure proposée**:
```json
{
  "pickupRules": [{id: "uuid1", name: "Escalier"}],
  "deliveryRules": [{id: "uuid2", name: "Distance"}],
  "globalRules": [{id: "piano-uuid", name: "Piano"}]
}
```
→ Piano facturé 1 fois ✅

---

## ✨ Pour implémenter cette solution:

1. **Ajouter `scope` dans metadata** des règles BDD:
   - `"scope": "address"` pour escaliers, couloirs, etc.
   - `"scope": "global"` pour piano, emballage, etc.

2. **Modifier AccessConstraintsModal** pour séparer les règles selon `scope`

3. **Créer 3 champs dans FormData**: `pickupRules`, `deliveryRules`, `globalRules`

4. **Adapter PriceService** pour traiter ces 3 champs

5. **Adapter RuleEngine** pour utiliser les IDs et éviter les doublons

Cette approche résout tous les problèmes identifiés! 🎉
