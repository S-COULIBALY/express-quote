# 🎯 Sélection d'une Variante : Explication du Comportement

## ❌ État Actuel (Non Implémenté)

**Quand le client clique sur une variante dans `MultiOffersDisplay` :**

```typescript
onSelectOffer={(scenarioId) => {
  console.log('Offre sélectionnée:', scenarioId);
  // TODO: Mettre à jour le devis avec le scénario sélectionné
}}
```

**Résultat** : **RIEN ne se passe** ❌
- Le prix dans `PaymentCard` reste inchangé
- Aucune mise à jour de l'UI
- La sélection n'est pas sauvegardée

---

## ✅ Comportement Attendu

Quand le client clique sur une variante (ex: "ECO", "PREMIUM") :

1. **Mise à jour du prix principal** dans `PaymentCard`
2. **Mise à jour visuelle** : la variante sélectionnée est mise en évidence
3. **Sauvegarde de la sélection** pour la soumission finale
4. **Optionnel** : Recalcul du devis unique avec le scénario sélectionné

---

## 🔄 Deux Approches Possibles

### **Approche 1 : Mise à jour simple (Recommandée)**

**Principe** : Utiliser les données déjà calculées dans `multiOffers`

**Avantages** :
- ✅ **Rapide** : Pas besoin de recalculer
- ✅ **Simple** : Juste mettre à jour le prix affiché
- ✅ **Efficace** : Les données sont déjà disponibles

**Implémentation** :
```typescript
onSelectOffer={(scenarioId) => {
  // 1. Trouver la variante sélectionnée
  const selectedQuote = quotation.multiOffers?.quotes.find(
    q => q.scenarioId === scenarioId
  );
  
  if (selectedQuote) {
    // 2. Mettre à jour le prix principal
    updatePrice(selectedQuote.pricing.finalPrice, {
      scenarioId: scenarioId,
      quote: selectedQuote
    });
    
    // 3. Sauvegarder la sélection
    setSelectedScenario(scenarioId);
  }
}}
```

**Limitation** :
- ⚠️ Le devis unique (`quote`) n'est pas recalculé avec le scénario
- ⚠️ Les détails complets (checklist, contract, audit) restent ceux du devis standard

---

### **Approche 2 : Recalcul complet (Plus complexe)**

**Principe** : Recalculer le devis unique avec le scénario sélectionné

**Avantages** :
- ✅ **Complet** : Tous les détails sont recalculés avec le scénario
- ✅ **Cohérent** : Checklist, contract, audit correspondent au scénario

**Implémentation** :
```typescript
onSelectOffer={async (scenarioId) => {
  // 1. Récupérer les données du formulaire
  const formData = formRef.current?.getFormData() || {};
  
  // 2. Trouver le scénario
  const scenario = STANDARD_SCENARIOS.find(s => s.id === scenarioId);
  
  if (scenario) {
    // 3. Recalculer avec le scénario
    const quote = await quotation.calculateQuoteWithScenario(formData, scenario);
    
    // 4. Mettre à jour le prix
    updatePrice(quote.pricing.finalPrice, quote);
    
    // 5. Sauvegarder la sélection
    setSelectedScenario(scenarioId);
  }
}}
```

**Limitation** :
- ⚠️ Nécessite une modification de l'API pour accepter un scénario
- ⚠️ Plus lent (appel API supplémentaire)
- ⚠️ Plus complexe à implémenter

---

## 🎯 Recommandation : Approche 1 (Simple)

**Pourquoi ?**
1. **Performance** : Pas d'appel API supplémentaire
2. **Simplicité** : Les données sont déjà disponibles
3. **UX** : Mise à jour instantanée du prix
4. **Suffisant** : Le prix est l'information principale pour le client

**Quand utiliser l'Approche 2 ?**
- Si on a besoin des détails complets (checklist, contract, audit) pour le scénario sélectionné
- Si on veut une traçabilité complète du scénario choisi

---

## 📊 Flux Visuel

### **Avant sélection** :
```
┌──────────────────┐  ┌──────────────────────────────┐
│  PaymentCard      │  │  MultiOffersDisplay           │
│                   │  │                               │
│  💰 450,00 €      │  │  💰 ECO      350,00 €        │
│  (prix standard)  │  │  ⭐ STANDARD 400,00 €        │
│                   │  │  🏆 CONFORT 450,00 € ←       │
│                   │  │  🛡️ SECURITY 420,00 €        │
│                   │  │  👑 PREMIUM  480,00 €        │
│                   │  │  🔄 FLEX     410,00 €        │
└──────────────────┘  └──────────────────────────────┘
```

### **Après sélection "CONFORT"** :
```
┌──────────────────┐  ┌──────────────────────────────┐
│  PaymentCard      │  │  MultiOffersDisplay           │
│                   │  │                               │
│  💰 450,00 €      │  │  💰 ECO      350,00 €        │
│  (prix CONFORT)   │  │  ⭐ STANDARD 400,00 €        │
│  ✅ Variante:     │  │  🏆 CONFORT 450,00 € ✅      │
│     CONFORT       │  │  🛡️ SECURITY 420,00 €        │
│                   │  │  👑 PREMIUM  480,00 €        │
│                   │  │  🔄 FLEX     410,00 €        │
└──────────────────┘  └──────────────────────────────┘
```

---

## 🔧 Implémentation Recommandée

### **1. Ajouter un état pour la sélection**

```typescript
const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
```

### **2. Mettre à jour le handler**

```typescript
onSelectOffer={(scenarioId) => {
  // Trouver la variante
  const selectedQuote = quotation.multiOffers?.quotes.find(
    q => q.scenarioId === scenarioId
  );
  
  if (selectedQuote) {
    // Mettre à jour le prix principal
    const { updatePrice } = usePrice();
    updatePrice(selectedQuote.pricing.finalPrice, {
      scenarioId: scenarioId,
      selectedQuote: selectedQuote
    });
    
    // Sauvegarder la sélection
    setSelectedScenario(scenarioId);
  }
}}
```

### **3. Mettre en évidence la sélection**

```typescript
// Dans MultiOffersDisplay
const isSelected = quote.scenarioId === selectedScenario;

<div className={`
  ${isSelected ? 'ring-4 ring-emerald-500' : ''}
  ${isSelected ? 'bg-emerald-100' : ''}
`}>
```

### **4. Sauvegarder pour la soumission**

```typescript
const handleSubmitFromPaymentCard = async (insuranceSelected: boolean) => {
  const formData = formRef.current?.getFormData() || {};
  
  // Ajouter le scénario sélectionné
  const dataWithScenario = {
    ...formData,
    selectedScenario: selectedScenario, // ← Envoyé à l'API
    insurance: insuranceSelected,
  };
  
  await submissionHook.submit(dataWithScenario);
};
```

---

## 📝 Résumé

| Aspect | État Actuel | Après Implémentation |
|--------|-------------|----------------------|
| **Clic sur variante** | ❌ Rien | ✅ Mise à jour prix |
| **Prix PaymentCard** | ❌ Inchangé | ✅ Mis à jour |
| **Sélection visible** | ❌ Non | ✅ Mise en évidence |
| **Sauvegarde** | ❌ Non | ✅ Sauvegardée |
| **Soumission** | ❌ Scénario standard | ✅ Scénario sélectionné |

---

**Version** : 1.0  
**Date** : 2025-12-24

