# 📊 Explication du Flux : `useModularQuotation`

## 🎯 Vue d'ensemble

Le hook `useModularQuotation` propose **3 méthodes de calcul** pour répondre à différents besoins :

1. **`calculateQuote()`** : Devis unique (standard)
2. **`calculateMultiOffers()`** : 6 variantes en parallèle
3. **`calculateWithDebounce()`** : Les deux en parallèle avec debounce

---

## 🔄 Flux détaillé

### 1. **Devis Unique** (`calculateQuote`)

**Quand l'utiliser ?**
- ✅ Affichage du prix principal dans `PaymentCard`
- ✅ Calcul rapide pour un scénario spécifique
- ✅ Quand on a besoin des détails complets (checklist, contract, audit)
- ✅ Pour la compatibilité avec l'ancien système (`calculatedPrice`)

**Ce qu'il retourne :**
```typescript
{
  quoteId: string;
  pricing: {
    totalCosts: number;
    basePrice: number;
    finalPrice: number;  // ← Utilisé par PaymentCard
    marginRate: number;
    breakdown: { ... }   // ← Détails complets
  };
  logistics: { ... };
  risk: { ... };
  requirements: [ ... ];
  legalImpacts: [ ... ];
  insuranceNotes: [ ... ];
  crossSellProposals: [ ... ];
  checklist?: any;       // ← Checklist terrain
  contract?: any;        // ← Données contrat
  audit?: any;          // ← Audit juridique
}
```

**Utilisation dans le code :**
```typescript
// Ligne 304 : calculatedPrice = quote?.pricing?.finalPrice || 0
// → Utilisé par PriceProvider → PaymentCard
const { calculatedPrice } = usePrice(); // Affiche le prix principal
```

---

### 2. **Multi-Offres** (`calculateMultiOffers`)

**Quand l'utiliser ?**
- ✅ Affichage des 6 variantes dans `MultiOffersDisplay`
- ✅ Comparaison des offres (ECO, STANDARD, CONFORT, etc.)
- ✅ Aide à la décision pour le client
- ✅ Marketing : montrer les différentes options

**Ce qu'il retourne :**
```typescript
{
  quotes: [
    {
      scenarioId: "ECO",      // ou STANDARD, CONFORT, etc.
      label: "Économique",
      description: "...",
      pricing: {
        finalPrice: 350.00     // ← Prix de cette variante
      },
      logistics: { ... },
      risk: { ... }
    },
    // ... 5 autres variantes
  ],
  comparison: {
    cheapest: "ECO",           // ← ID de l'offre la moins chère
    recommended: "STANDARD",   // ← ID de l'offre recommandée
    priceRange: {
      min: 350.00,
      max: 450.00
    }
  }
}
```

**Utilisation dans le code :**
```typescript
// MultiOffersDisplay.tsx
{quotation.multiOffers && (
  <MultiOffersDisplay
    multiOffers={quotation.multiOffers}
    isCalculating={quotation.isCalculatingMultiOffers}
  />
)}
```

---

### 3. **Calcul avec Debounce** (`calculateWithDebounce`)

**Quand l'utiliser ?**
- ✅ **Changements de formulaire en temps réel** (onChange)
- ✅ **Calcul initial au chargement** si données présentes
- ✅ **Optimisation** : évite trop d'appels API

**Pourquoi calculer les deux en parallèle ?**

```
┌─────────────────────────────────────────────────────────┐
│  Utilisateur modifie un champ (ex: volume)              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  calculateWithDebounce(formData)                        │
│  → Debounce 800ms (évite appels multiples)             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Promise.all([                                          │
│    calculateQuote(formData),      ← Devis unique         │
│    calculateMultiOffers(formData) ← 6 variantes          │
│  ])                                                      │
│                                                          │
│  ⚡ Calcul PARALLÈLE (pas séquentiel)                    │
│  Temps total = Max(calcul unique, calcul multi-offres)   │
│  Au lieu de : calcul unique + calcul multi-offres       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Résultats disponibles simultanément :                   │
│  - quote.pricing.finalPrice → PaymentCard                │
│  - multiOffers.quotes → MultiOffersDisplay               │
└─────────────────────────────────────────────────────────┘
```

**Avantages du calcul parallèle :**
1. **Performance** : Temps total = Max(calcul unique, calcul multi-offres) au lieu de la somme
2. **UX** : L'utilisateur voit le prix principal ET les variantes en même temps
3. **Cohérence** : Les deux calculs utilisent les mêmes données de formulaire
4. **Efficacité** : Un seul déclenchement (onChange) → deux résultats

---

## 📍 Où chaque résultat est utilisé ?

### **Devis Unique** (`quote`)

```typescript
// 1. Prix principal dans PaymentCard
const { calculatedPrice } = usePrice();
// calculatedPrice = quote?.pricing?.finalPrice || 0

// 2. Détails complets (checklist, contract, audit)
quote.checklist   // → Checklist terrain
quote.contract    // → Données contrat
quote.audit       // → Audit juridique

// 3. Informations détaillées
quote.pricing.breakdown.costsByModule  // → Détail des coûts
quote.risk.riskScore                   // → Score de risque
quote.requirements                      // → Exigences
```

### **Multi-Offres** (`multiOffers`)

```typescript
// 1. Affichage des 6 variantes
<MultiOffersDisplay
  multiOffers={quotation.multiOffers}
  // → Affiche ECO, STANDARD, CONFORT, SECURITY, PREMIUM, FLEX
/>

// 2. Comparaison
multiOffers.comparison.cheapest      // → "ECO"
multiOffers.comparison.recommended   // → "STANDARD"
multiOffers.comparison.priceRange    // → { min: 350, max: 450 }
```

---

## 🔀 Cas d'usage par méthode

### **Cas 1 : Changement de champ (onChange)**

```typescript
// Dans le preset du formulaire
onChange: async (fieldName, value, formData) => {
  if (priceRelevantFields.includes(fieldName)) {
    // ✅ Utilise calculateWithDebounce
    quotation.calculateWithDebounce(formData);
    // → Calcule les deux en parallèle après 800ms
  }
}
```

**Pourquoi les deux ?**
- Le client veut voir le **prix principal** mis à jour (PaymentCard)
- Le client veut aussi voir les **6 variantes** mises à jour (MultiOffersDisplay)
- **Un seul calcul** → **deux résultats** → **meilleure UX**

---

### **Cas 2 : Calcul initial au chargement**

```typescript
useEffect(() => {
  if (formRef.current) {
    const formData = formRef.current.getFormData();
    if (formData && (formData.pickupAddress || ...)) {
      // ✅ Utilise calculateWithDebounce
      quotation.calculateWithDebounce(formData);
      // → Affiche prix + variantes dès le chargement
    }
  }
}, []);
```

**Pourquoi les deux ?**
- Si le formulaire a déjà des données (sauvegarde locale, URL params, etc.)
- On veut afficher **immédiatement** le prix ET les variantes
- **Expérience fluide** : pas besoin d'attendre une action utilisateur

---

### **Cas 3 : Calcul manuel (rare)**

```typescript
// Calcul uniquement du devis unique
await quotation.calculateQuote(formData);
// → Utile si on veut juste le prix principal, sans les variantes

// Calcul uniquement des multi-offres
await quotation.calculateMultiOffers(formData);
// → Utile si on veut juste comparer les variantes, sans le prix principal
```

**Quand utiliser ?**
- Tests unitaires
- Calculs spécifiques (ex: export PDF d'une seule offre)
- Optimisation si on sait qu'on n'a besoin que d'un seul résultat

---

## ⚡ Performance : Pourquoi le parallèle ?

### **Sans parallèle (séquentiel) :**
```
Temps total = Temps(calcul unique) + Temps(calcul multi-offres)
            = 200ms + 300ms
            = 500ms
```

### **Avec parallèle :**
```
Temps total = Max(Temps(calcul unique), Temps(calcul multi-offres))
            = Max(200ms, 300ms)
            = 300ms
```

**Gain : 40% plus rapide** (500ms → 300ms)

---

## 🎨 Flux visuel dans l'UI

```
┌─────────────────────────────────────────────────────────────┐
│  Formulaire                                                 │
│  [Volume: 50m³] ← Utilisateur modifie                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  calculateWithDebounce(formData)                            │
│  → Debounce 800ms                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Promise.all([                                              │
│    calculateQuote(),      → quote.pricing.finalPrice        │
│    calculateMultiOffers() → multiOffers.quotes[]            │
│  ])                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Mise à jour UI simultanée :                                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  PaymentCard      │  │  MultiOffersDisplay           │  │
│  │                   │  │                               │  │
│  │  💰 450,00 €      │  │  💰 ECO      350,00 €        │  │
│  │  (prix principal) │  │  ⭐ STANDARD 400,00 €        │  │
│  │                   │  │  🏆 CONFORT 450,00 €        │  │
│  │                   │  │  🛡️ SECURITY 420,00 €        │  │
│  │                   │  │  👑 PREMIUM  480,00 €        │  │
│  │                   │  │  🔄 FLEX     410,00 €        │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│                                                              │
│  ← Utilise quote          ← Utilise multiOffers            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Résumé

| Méthode | Quand l'utiliser | Résultat | Utilisé par |
|---------|------------------|----------|-------------|
| `calculateQuote()` | Calcul manuel du devis unique | `quote` avec détails complets | PaymentCard, détails complets |
| `calculateMultiOffers()` | Calcul manuel des variantes | `multiOffers` avec 6 offres | MultiOffersDisplay |
| `calculateWithDebounce()` | **Changements de formulaire** | **Les deux en parallèle** | **onChange handler** |

**Pourquoi calculer les deux en parallèle ?**
1. ✅ **Performance** : Plus rapide que séquentiel
2. ✅ **UX** : L'utilisateur voit prix principal + variantes simultanément
3. ✅ **Cohérence** : Mêmes données de formulaire pour les deux calculs
4. ✅ **Efficacité** : Un seul déclenchement → deux résultats

---

**Version** : 1.0  
**Date** : 2025-12-24

