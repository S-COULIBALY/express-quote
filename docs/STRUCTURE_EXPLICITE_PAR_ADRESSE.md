# Structure Explicite - Données Regroupées par Adresse

## 🎯 STRUCTURE PROPOSÉE (Regroupée et Explicite)

### Exemple Complet de Requête Backend

```json
{
  // ==========================================
  // DONNÉES GÉNÉRALES DU DÉMÉNAGEMENT
  // ==========================================
  "serviceType": "PACKING",
  "volume": 45,
  "distance": 475.249,
  "duration": 6,
  "workers": 6,
  "scheduledDate": "2025-10-28T00:00:00.000Z",
  "defaultPrice": 735,
  "__presetSnapshot": {
    "distance": 20,
    "workers": 3,
    "duration": 4
  },

  // ==========================================
  // 📍 ADRESSE DE DÉPART - Toutes les données groupées
  // ==========================================
  "pickup": {
    "address": "145 Rue La Fayette, 75010 Paris, France",
    "floor": 8,
    "elevator": "no",
    "carryDistance": "30+",

    // Règles spécifiques au départ (contraintes d'adresse)
    "rules": [
      {
        "id": "40acdd70-5c1f-4936-a53c-8f52e6695a4c",
        "name": "Escalier difficile ou dangereux",
        "category": "constraint",
        "impact": "+8.5%"
      },
      {
        "id": "b2b8f00b-00a2-456c-ad06-1150d25d71a3",
        "name": "Couloirs étroits ou encombrés",
        "category": "constraint",
        "impact": "+6.5%"
      },
      {
        "id": "5cdd32e3-23d5-413e-a9b4-26a746066ce0",
        "name": "Monte-meuble",
        "category": "service",
        "impact": "+300€"
      }
    ]
  },

  // ==========================================
  // 📍 ADRESSE D'ARRIVÉE - Toutes les données groupées
  // ==========================================
  "delivery": {
    "address": "22 Av. Rockefeller, 69008 Lyon, France",
    "floor": 10,
    "elevator": "no",
    "carryDistance": "30+",

    // Règles spécifiques à l'arrivée (contraintes d'adresse)
    "rules": [
      {
        "id": "ca6cb6e5-9f5a-4d50-8200-d78d9dedd901",
        "name": "Distance de portage > 30m",
        "category": "constraint",
        "impact": "+7.8%"
      }
    ]
  },

  // ==========================================
  // 🌍 SERVICES GLOBAUX - Applicables aux 2 adresses
  // ==========================================
  "globalServices": [
    {
      "id": "transport-piano-uuid",
      "name": "Transport piano",
      "category": "service",
      "impact": "+250€"
    },
    {
      "id": "42b851fa-992a-45ef-9da8-744968fdc6b4",
      "name": "Emballage professionnel départ",
      "category": "service",
      "impact": "+120€"
    },
    {
      "id": "352eabed-8869-460f-b7f0-99237b003cc1",
      "name": "Objets fragiles/précieux",
      "category": "service",
      "impact": "+180€"
    }
  ]
}
```

---

## ✅ AVANTAGES DE CETTE STRUCTURE

### 1. **Clarté et Lisibilité**

**AVANT (dispersé)**:
```json
{
  "pickupAddress": "Paris",
  "pickupFloor": 8,
  "deliveryAddress": "Lyon",
  "pickupElevator": "no",
  "deliveryFloor": 10,
  "deliveryElevator": "no"
}
```
→ ❌ Difficile de voir quelles données vont ensemble

**APRÈS (regroupé)**:
```json
{
  "pickup": {
    "address": "Paris",
    "floor": 8,
    "elevator": "no"
  },
  "delivery": {
    "address": "Lyon",
    "floor": 10,
    "elevator": "no"
  }
}
```
→ ✅ Structure claire et logique

### 2. **Toutes les données d'une adresse au même endroit**

```typescript
// Accès facile à TOUTES les infos de l'adresse de départ
const pickupData = request.pickup;
console.log('Adresse départ:', pickupData.address);
console.log('Étage:', pickupData.floor);
console.log('Règles:', pickupData.rules.map(r => r.name));

// Au lieu de:
console.log('Adresse:', request.pickupAddress);
console.log('Étage:', request.pickupFloor);
console.log('Règles:', request.pickupRules);
```

### 3. **Évite les erreurs de confusion**

```typescript
// AVANT: Facile de se tromper
if (request.pickupFloor > 5 && request.deliveryElevator === 'no') {
  // ❌ BUG: On mélange pickup et delivery!
}

// APRÈS: Structure claire
if (request.pickup.floor > 5 && request.pickup.elevator === 'no') {
  // ✅ CORRECT: On reste dans le même contexte
}
```

### 4. **Extensible facilement**

Si demain on ajoute de nouveaux champs pour une adresse:
```json
"pickup": {
  "address": "...",
  "floor": 8,
  "elevator": "no",
  "carryDistance": "30+",
  "rules": [...],

  // ✅ Facile d'ajouter de nouvelles propriétés
  "parkingAvailable": false,
  "restrictedHours": "8h-12h",
  "buildingType": "old"
}
```

---

## 📊 COMPARAISON DÉTAILLÉE

| Aspect | Structure Plate (Actuelle) | Structure Regroupée (Proposée) |
|--------|---------------------------|--------------------------------|
| **Lisibilité** | ❌ Données mélangées | ✅ Données groupées logiquement |
| **Maintenance** | ❌ Difficile de retrouver les champs liés | ✅ Tout au même endroit |
| **Risque d'erreur** | ❌ Facile de mélanger pickup/delivery | ✅ Contexte clair |
| **Extensibilité** | ❌ Ajoute des champs au premier niveau | ✅ Ajoute dans l'objet concerné |
| **Debug** | ❌ `pickupFloor`, `deliveryFloor` dispersés | ✅ `pickup.floor`, `delivery.floor` groupés |
| **TypeScript** | ❌ Types longs et répétitifs | ✅ Types réutilisables |

---

## 💻 IMPLÉMENTATION TYPESCRIPT

### Types réutilisables

```typescript
// Type pour les données d'une adresse
interface AddressData {
  address: string;
  floor: number;
  elevator: 'no' | 'small' | 'medium' | 'large';
  carryDistance?: '0-10' | '10-30' | '30+';
  rules: RuleReference[];
}

// Type pour une référence de règle
interface RuleReference {
  id: string;
  name: string;
  category: 'constraint' | 'service';
  impact: string;
}

// Type complet de la requête
interface PriceCalculationRequest {
  // Données générales
  serviceType: ServiceType;
  volume?: number;
  distance?: number;
  duration?: number;
  workers?: number;
  scheduledDate?: string;
  defaultPrice?: number;
  __presetSnapshot?: any;

  // ✅ Données groupées par adresse
  pickup: AddressData;
  delivery: AddressData;

  // ✅ Services globaux
  globalServices: RuleReference[];
}
```

---

## 🔄 TRAITEMENT BACKEND

### PriceService (simplifié)

```typescript
async createQuoteContext(request: PriceCalculationRequest): Promise<QuoteContext> {
  const context = new QuoteContext(request.serviceType);

  // Données générales
  if (request.volume) context.setValue('volume', request.volume);
  if (request.distance) context.setValue('distance', request.distance);

  // ✅ DÉPART - Tout groupé
  if (request.pickup) {
    context.setValue('pickupAddress', request.pickup.address);
    context.setValue('pickupFloor', request.pickup.floor);
    context.setValue('pickupElevator', request.pickup.elevator);
    context.setValue('pickupCarryDistance', request.pickup.carryDistance);

    const pickupIds = request.pickup.rules.map(r => r.id);
    context.setValue('pickupRuleIds', pickupIds);

    console.log('📍 DÉPART:', {
      address: request.pickup.address,
      floor: request.pickup.floor,
      rules: request.pickup.rules.map(r => r.name)
    });
  }

  // ✅ ARRIVÉE - Tout groupé
  if (request.delivery) {
    context.setValue('deliveryAddress', request.delivery.address);
    context.setValue('deliveryFloor', request.delivery.floor);
    context.setValue('deliveryElevator', request.delivery.elevator);
    context.setValue('deliveryCarryDistance', request.delivery.carryDistance);

    const deliveryIds = request.delivery.rules.map(r => r.id);
    context.setValue('deliveryRuleIds', deliveryIds);

    console.log('📍 ARRIVÉE:', {
      address: request.delivery.address,
      floor: request.delivery.floor,
      rules: request.delivery.rules.map(r => r.name)
    });
  }

  // ✅ SERVICES GLOBAUX
  if (request.globalServices) {
    const globalIds = request.globalServices.map(r => r.id);
    context.setValue('globalServiceIds', globalIds);

    console.log('🌍 SERVICES GLOBAUX:',
      request.globalServices.map(r => r.name)
    );
  }

  return context;
}
```

### Logs Backend (exemple)

```bash
📍 DÉPART: {
  address: '145 Rue La Fayette, 75010 Paris, France',
  floor: 8,
  rules: [
    'Escalier difficile ou dangereux',
    'Couloirs étroits ou encombrés',
    'Monte-meuble'
  ]
}

📍 ARRIVÉE: {
  address: '22 Av. Rockefeller, 69008 Lyon, France',
  floor: 10,
  rules: ['Distance de portage > 30m']
}

🌍 SERVICES GLOBAUX: [
  'Transport piano',
  'Emballage professionnel départ',
  'Objets fragiles/précieux'
]
```

---

## ✨ RÉPONSE À TA QUESTION

### Oui, la réorganisation est **TRÈS BÉNÉFIQUE**!

**Pourquoi?**

1. ✅ **Structure explicite**: Chaque adresse a un objet dédié
2. ✅ **Données groupées**: Tout ce qui concerne le départ est dans `pickup`
3. ✅ **Plus maintenable**: Facile de trouver et modifier les données d'une adresse
4. ✅ **Moins d'erreurs**: Impossible de mélanger pickup et delivery par accident
5. ✅ **TypeScript friendly**: Types réutilisables et clairs

### Structure finale recommandée:

```json
{
  "serviceType": "PACKING",
  "volume": 45,
  "distance": 475.249,

  "pickup": {
    "address": "...",
    "floor": 8,
    "elevator": "no",
    "carryDistance": "30+",
    "rules": [...]
  },

  "delivery": {
    "address": "...",
    "floor": 10,
    "elevator": "no",
    "carryDistance": "30+",
    "rules": [...]
  },

  "globalServices": [...]
}
```

Cette structure est **claire, explicite, maintenable et extensible**! 🎉
