# 🔄 Gestion de la Consommation des Contraintes et Inférence Automatique

**Date**: 2025-01-27  
**Version**: 1.0  
**Objectif**: Documenter le problème de double facturation et la solution d'inférence

---

## 📋 Table des matières

1. [Contexte et problème](#1-contexte-et-problème)
2. [Situation actuelle](#2-situation-actuelle)
3. [Impact fonctionnel](#3-impact-fonctionnel)
4. [Solution proposée : Inférence](#4-solution-proposée--inférence)
5. [Liste complète des contraintes consommables](#5-liste-complète-des-contraintes-consommables)
6. [Implémentation technique](#6-implémentation-technique)
7. [Bénéfices et risques](#7-bénéfices-et-risques)

---

## 1. 🎯 Contexte et problème

### 1.1 Système de détection automatique

Le système utilise `AutoDetectionService` pour détecter automatiquement les contraintes logistiques nécessitant des équipements spéciaux (notamment le **monte-meuble**).

**Exemple de détection** :
- Étage > 5 + pas d'ascenseur → Monte-meuble requis
- Étage > 5 + ascenseur petit → Monte-meuble requis
- Étage > 5 + ascenseur en panne → Monte-meuble requis

### 1.2 Principe de consommation

Certaines contraintes peuvent être **"consommées"** par la présence d'un monte-meuble. Cela signifie que si un monte-meuble est requis ou installé, il résout déjà ces contraintes, donc **elles ne doivent pas être facturées deux fois**.

**Exemple** :
- Monte-meuble : 300€
- Escalier difficile : 50€
- **Si escalier difficile est consommée** → Total = 300€ ✅
- **Si escalier difficile n'est PAS consommée** → Total = 350€ ❌ (double facturation)

---

## 2. ⚠️ Situation actuelle

### 2.1 Logique existante

Actuellement, le système ne consomme **que les contraintes explicitement déclarées par le client**.

**Code actuel** (`AutoDetectionService.ts`, lignes 265-269) :
```typescript
CONSUMED_BY_FURNITURE_LIFT.forEach(ruleUuid => {
  if (constraints.includes(ruleUuid)) {  // ← Ne consomme QUE si présent
    consumedConstraints.push(ruleUuid);
  }
});
```

### 2.2 Problème identifié

**Scénario problématique** :

```typescript
// Situation terrain RÉELLE:
{
  floor: 5,
  elevator: 'no',
  // Client a oublié de cocher "couloirs étroits" (mais c'est VRAI en réalité)
  declaredConstraints: ['RULE_UUID_ESCALIER_DIFFICILE']  // Seulement escalier
}
```

**Résultat avec le système actuel** :
```typescript
// 1. Monte-meuble détecté ✅
furnitureLiftRequired = true

// 2. Contraintes consommées (seulement celles déclarées)
consumedConstraints = ['RULE_UUID_ESCALIER_DIFFICILE']

// 3. La règle "Couloirs étroits" n'est PAS consommée
// 4. La règle "Couloirs étroits" s'applique quand même → +50€

// Résultat:
Monte-meuble: 300€
Escalier difficile: 0€ (consommée ✅)
Couloirs étroits: +50€ (NON consommée ❌ → facturée !)
Total: 350€ ❌ (au lieu de 300€)
```

### 2.3 Conséquences

| Type d'impact | Description |
|---------------|-------------|
| 💰 **Facturation** | **Incorrecte** : Double facturation si client oublie une contrainte |
| 🧠 **Logique métier** | Incomplète : Le moteur ignore des contraintes pourtant résolues |
| 📊 **Traçabilité** | Faible : Impossible de savoir ce qui a été inféré automatiquement |
| 🧾 **Analyse back-office** | Moins fiable : Les contraintes "oubliées" disparaissent de la trace métier |
| 😞 **Expérience client** | Mauvaise : Prix plus élevé que prévu à cause d'oublis |

---

## 3. 📊 Impact fonctionnel

### 3.1 Exemple concret de double facturation

**Scénario** : Client déménage au 5ème étage, pas d'ascenseur, couloirs étroits, meubles encombrants

**Ce que le client a coché** :
- ✅ Escalier difficile
- ❌ Couloirs étroits (oublié)
- ❌ Meubles encombrants (oublié)

**Avec le système actuel** :
```typescript
Monte-meuble: 300€
Escalier difficile: 0€ (consommée ✅)
Couloirs étroits: +50€ (NON consommée ❌)
Meubles encombrants: +75€ (NON consommée ❌)
Total: 425€ ❌ (au lieu de 300€)
```

**Impact** : Le client paie 125€ de trop à cause d'oublis dans le formulaire.

---

## 4. ✅ Solution proposée : Inférence

### 4.1 Principe général

Adopter une approche d'**inférence** :

> **Mieux vaut inférer trop que facturer deux fois**

Si un monte-meuble est requis, **toutes les contraintes logistiques résolues par le monte-meuble sont automatiquement inférées et consommées**, même si le client ne les a pas déclarées.

### 4.2 Trois niveaux de contraintes

| Catégorie | Source | Rôle |
|-----------|--------|------|
| **Déclarées** | Saisies par le client | Représentent les informations utilisateur |
| **Inférées** | Déduites automatiquement si monte-meuble requis | Représentent les oublis compensés par le moteur |
| **Consommées** | Résolues par le monte-meuble (déclaré + inféré) | Ne doivent pas être facturées deux fois |

### 4.3 Logique de décision

```typescript
// 1. Le client soumet le formulaire → les données sont figées
const declaredConstraints = addressData.constraints || [];

// 2. Le moteur détecte le besoin de monte-meuble
const furnitureLiftRequired = detectFurnitureLift(floor, elevator);

// 3. Si monte-meuble requis → Inférence
if (furnitureLiftRequired) {
  // Inférer toutes les contraintes non déclarées
  const inferredConstraints = CONSUMED_BY_FURNITURE_LIFT.filter(
    c => !declaredConstraints.includes(c)
  );
  
  // Toutes sont consommées (déclaré + inféré)
  const consumedConstraints = [
    ...declaredConstraints,
    ...inferredConstraints
  ];
}
```

### 4.4 Résultat enrichi pour traçabilité

```typescript
{
  "furnitureLiftRequired": true,
  "furnitureLiftReason": "Étage 5 sans ascenseur",
  
  "declaredConstraints": [
    "RULE_UUID_ESCALIER_DIFFICILE"
  ],
  
  "inferredConstraints": [
    "RULE_UUID_COULOIRS_ETROITS",
    "RULE_UUID_MEUBLES_ENCOMBRANTS",
    "RULE_UUID_OBJETS_LOURDS",
    "RULE_UUID_DISTANCE_PORTAGE",
    "RULE_UUID_PASSAGE_INDIRECT",
    "RULE_UUID_ACCES_MULTINIVEAU"
  ],
  
  "consumedConstraints": [
    "RULE_UUID_ESCALIER_DIFFICILE",      // Déclarée
    "RULE_UUID_COULOIRS_ETROITS",        // Inférée
    "RULE_UUID_MEUBLES_ENCOMBRANTS",     // Inférée
    "RULE_UUID_OBJETS_LOURDS",           // Inférée
    "RULE_UUID_DISTANCE_PORTAGE",        // Inférée
    "RULE_UUID_PASSAGE_INDIRECT",        // Inférée
    "RULE_UUID_ACCES_MULTINIVEAU"        // Inférée
  ]
}
```

### 4.5 Conditions d'activation de l'inférence

| Étape du flux | Action |
|---------------|--------|
| **Formulaire en cours de saisie** | Ne pas inférer (le client peut encore corriger) |
| **Soumission du devis / validation finale** | Inférer toutes les contraintes logiques manquantes |
| **Avant facturation** | Vérifier cohérence entre contraintes consommées et accessoires facturés |

Cette séquence évite la sur-détection et préserve la transparence pour l'utilisateur.

---

## 5. 📋 Liste complète des contraintes consommables

### 5.1 Analyse de la liste complète des contraintes

D'après l'analyse de la liste des contraintes disponibles (30 contraintes au départ, 24 à l'arrivée), voici la classification :

### 5.2 Contraintes DEVRAIENT être consommées par le monte-meuble

Ces contraintes sont **logiquement résolues** par un monte-meuble :

#### ✅ **Contraintes d'accès au bâtiment** (déjà dans CONSUMED_BY_FURNITURE_LIFT)
- ✅ **Escalier difficile ou dangereux** (`RULE_UUID_ESCALIER_DIFFICILE`)
  - **Raison** : Le monte-meuble évite l'escalier
- ✅ **Couloirs étroits ou encombrés** (`RULE_UUID_COULOIRS_ETROITS`)
  - **Raison** : Le monte-meuble contourne les couloirs étroits
- ✅ **Accès complexe multi-niveaux** (`RULE_UUID_ACCES_MULTINIVEAU`)
  - **Raison** : Le monte-meuble simplifie l'accès multi-niveaux
- ✅ **Passage indirect obligatoire** (`RULE_UUID_PASSAGE_INDIRECT`)
  - **Raison** : Le monte-meuble permet un passage direct par la fenêtre

#### ✅ **Contraintes liées aux objets** (déjà dans CONSUMED_BY_FURNITURE_LIFT)
- ✅ **Meubles encombrants** (`RULE_UUID_MEUBLES_ENCOMBRANTS`)
  - **Raison** : Le monte-meuble transporte les meubles encombrants
- ✅ **Objets très lourds** (`RULE_UUID_OBJETS_LOURDS`)
  - **Raison** : Le monte-meuble gère les objets très lourds

#### ✅ **Contraintes de distance** (déjà dans CONSUMED_BY_FURNITURE_LIFT)
- ✅ **Distance de portage > 30m** (`RULE_UUID_DISTANCE_PORTAGE`)
  - **Raison** : Le monte-meuble réduit la distance de portage

#### ⚠️ **Contraintes liées à l'ascenseur** (À AJOUTER)
- ⚠️ **Ascenseur en panne ou hors service** (`elevator_unavailable`)
  - **Raison** : Le monte-meuble remplace l'ascenseur en panne
  - **État actuel** : Géré via flag booléen, mais pas dans CONSUMED_BY_FURNITURE_LIFT
- ⚠️ **Ascenseur interdit pour déménagement** (`elevator_forbidden_moving`)
  - **Raison** : Le monte-meuble remplace l'ascenseur interdit
  - **État actuel** : Géré via flag booléen, mais pas dans CONSUMED_BY_FURNITURE_LIFT
- ⚠️ **Ascenseur trop petit pour les meubles** (`elevator_unsuitable_size`)
  - **Raison** : Le monte-meuble remplace l'ascenseur inadapté
  - **État actuel** : Géré via flag booléen, mais pas dans CONSUMED_BY_FURNITURE_LIFT

### 5.3 Contraintes NE DEVRAIENT PAS être consommées

Ces contraintes ne sont **pas résolues** par un monte-meuble :

#### ❌ **Contraintes administratives et réglementaires**
- ❌ **Contrôle d'accès strict**
  - **Raison** : Le monte-meuble ne résout pas les problèmes d'accès sécurisé
- ❌ **Autorisation administrative**
  - **Raison** : Le monte-meuble ne résout pas les démarches administratives
- ❌ **Restrictions horaires strictes**
  - **Raison** : Le monte-meuble ne résout pas les contraintes horaires

#### ❌ **Contraintes liées au stationnement et accès véhicule**
- ❌ **Stationnement difficile ou payant**
  - **Raison** : Le monte-meuble ne résout pas les problèmes de stationnement
- ❌ **Circulation complexe**
  - **Raison** : Le monte-meuble ne résout pas les problèmes de circulation
- ❌ **Rue étroite ou inaccessible au camion**
  - **Raison** : Le monte-meuble ne résout pas les problèmes d'accès camion
- ❌ **Zone piétonne avec restrictions**
  - **Raison** : Le monte-meuble ne résout pas les restrictions de zone

#### ❌ **Contraintes liées au sol et environnement**
- ❌ **Sol fragile ou délicat**
  - **Raison** : Le monte-meuble ne résout pas les problèmes de sol fragile

#### ❌ **Services additionnels** (pas des contraintes)
- ❌ **Inventaire avec photos** (service)
- ❌ **Objets fragiles/précieux** (service)
- ❌ **Démontage de meubles** (service)
- ❌ **Emballage professionnel départ** (service)
- ❌ **Fournitures d'emballage** (service)
- ❌ **Emballage œuvres d'art** (service)
- ❌ **Transport animaux** (service)
- ❌ **Gestion administrative** (service)
- ❌ **Nettoyage après déménagement** (service)
- ❌ **Transport piano** (service)
- ❌ **Stockage temporaire** (service)
- ❌ **Remontage de meubles** (service)
- ❌ **Déballage professionnel arrivée** (service)

### 5.4 Liste complète recommandée : CONSUMED_BY_FURNITURE_LIFT

**Liste actuelle** (7 contraintes) :
```typescript
CONSUMED_BY_FURNITURE_LIFT = [
  RULE_UUID_ESCALIER_DIFFICILE,        // ✅ Déjà présent
  RULE_UUID_COULOIRS_ETROITS,          // ✅ Déjà présent
  RULE_UUID_MEUBLES_ENCOMBRANTS,       // ✅ Déjà présent
  RULE_UUID_OBJETS_LOURDS,              // ✅ Déjà présent
  RULE_UUID_DISTANCE_PORTAGE,          // ✅ Déjà présent
  RULE_UUID_PASSAGE_INDIRECT,          // ✅ Déjà présent
  RULE_UUID_ACCES_MULTINIVEAU,         // ✅ Déjà présent
]
```

**Liste recommandée** (10 contraintes) :
```typescript
CONSUMED_BY_FURNITURE_LIFT = [
  // Contraintes d'accès au bâtiment
  RULE_UUID_ESCALIER_DIFFICILE,        // ✅ Déjà présent
  RULE_UUID_COULOIRS_ETROITS,          // ✅ Déjà présent
  RULE_UUID_ACCES_MULTINIVEAU,         // ✅ Déjà présent
  RULE_UUID_PASSAGE_INDIRECT,          // ✅ Déjà présent
  
  // Contraintes liées aux objets
  RULE_UUID_MEUBLES_ENCOMBRANTS,       // ✅ Déjà présent
  RULE_UUID_OBJETS_LOURDS,             // ✅ Déjà présent
  
  // Contraintes de distance
  RULE_UUID_DISTANCE_PORTAGE,          // ✅ Déjà présent
  
  // ⚠️ NOUVEAU: Contraintes liées à l'ascenseur
  RULE_UUID_ASCENSEUR_PANNE,           // ⚠️ À AJOUTER (elevator_unavailable)
  RULE_UUID_ASCENSEUR_INTERDIT,        // ⚠️ À AJOUTER (elevator_forbidden_moving)
  RULE_UUID_ASCENSEUR_TROP_PETIT,      // ⚠️ À AJOUTER (elevator_unsuitable_size)
]
```

**Note** : Les UUIDs pour les contraintes d'ascenseur doivent être récupérés depuis la BDD ou ajoutés dans `RuleUUIDs.ts`.

---

## 6. ⚙️ Implémentation technique

**Note** : Le seuil d'étage pour la détection automatique du monte-meuble est fixé à **5 étages**. Un monte-meuble est requis si l'étage est supérieur à 5.

### 6.1 Modification de `AutoDetectionService.detectFurnitureLift()`

**Code actuel** (lignes 265-269) :
```typescript
CONSUMED_BY_FURNITURE_LIFT.forEach(ruleUuid => {
  if (constraints.includes(ruleUuid)) {  // ← Ne consomme QUE si présent
    consumedConstraints.push(ruleUuid);
  }
});
```

**Code proposé** (avec inférence) :
```typescript
// ✅ NOUVEAU: Inférence si monte-meuble requis
if (furnitureLiftRequired) {
  // 1. Contraintes déclarées par le client
  const declaredConstraints = constraints || [];
  
  // 2. Contraintes inférées (toutes celles non déclarées)
  const inferredConstraints = CONSUMED_BY_FURNITURE_LIFT.filter(
    c => !declaredConstraints.includes(c)
  );
  
  // 3. Toutes sont consommées (déclaré + inféré)
  const consumedConstraints = [
    ...declaredConstraints.filter(c => CONSUMED_BY_FURNITURE_LIFT.includes(c)),
    ...inferredConstraints
  ];
  
  return {
    furnitureLiftRequired: true,
    furnitureLiftReason: reason,
    longCarryingDistance: false,
    declaredConstraints,      // ✅ NOUVEAU
    inferredConstraints,      // ✅ NOUVEAU
    consumedConstraints       // ✅ MODIFIÉ (déclaré + inféré)
  };
}
```

### 6.2 Modification de l'interface `AddressDetectionResult`

**Code actuel** :
```typescript
export interface AddressDetectionResult {
  furnitureLiftRequired: boolean;
  furnitureLiftReason?: string;
  longCarryingDistance: boolean;
  carryingDistanceReason?: string;
  consumedConstraints?: string[];
}
```

**Code proposé** :
```typescript
export interface AddressDetectionResult {
  furnitureLiftRequired: boolean;
  furnitureLiftReason?: string;
  longCarryingDistance: boolean;
  carryingDistanceReason?: string;
  
  // ✅ NOUVEAU: Distinction déclaré/inféré/consommé
  declaredConstraints?: string[];      // Sélectionnées par l'utilisateur
  inferredConstraints?: string[];      // Inférées automatiquement
  consumedConstraints?: string[];       // Total (déclaré + inféré)
  
  // ✅ NOUVEAU: Métadonnées pour traçabilité
  inferenceMetadata?: {
    reason: string;
    inferredAt: Date;
    allowInference: boolean;
  };
}
```

### 6.3 Activation conditionnelle

**Paramètre d'activation** :
```typescript
static detectFurnitureLift(
  addressData: AddressData,
  volume?: number,
  options?: {
    allowInference?: boolean;        // ✅ Nouveau paramètre
    submissionContext?: 'draft' | 'final';
  }
): AddressDetectionResult
```

**Logique d'activation** :
```typescript
// Inférer uniquement à la soumission finale
const shouldInfer = options?.allowInference === true || 
                    options?.submissionContext === 'final';

if (furnitureLiftRequired && shouldInfer) {
  // Inférence activée
  inferredConstraints = CONSUMED_BY_FURNITURE_LIFT.filter(...);
} else {
  // Pas d'inférence (mode draft)
  inferredConstraints = [];
}
```

### 6.4 Intégration dans `RuleContextEnricher`

**Modification nécessaire** :
```typescript
// Dans RuleContextEnricher.detectRequirements()
const pickupDetection = AutoDetectionService.detectFurnitureLift(
  pickupData,
  contextData.volume,
  { allowInference: true, submissionContext: 'final' }  // ✅ Activation
);

// Utilisation des contraintes inférées
const allConsumedConstraints = new Set<string>([
  ...(pickupDetection.consumedConstraints || []),
  ...(deliveryDetection.consumedConstraints || [])
]);

// ✅ NOUVEAU: Traçabilité
context.setValue('declaredConstraints', {
  pickup: pickupDetection.declaredConstraints || [],
  delivery: deliveryDetection.declaredConstraints || []
});

context.setValue('inferredConstraints', {
  pickup: pickupDetection.inferredConstraints || [],
  delivery: deliveryDetection.inferredConstraints || []
});
```

---

## 7. 📊 Bénéfices et risques

### 7.1 Bénéfices de la solution

| Aspect | Avant | Après |
|--------|-------|-------|
| **Cohérence métier** | Incomplète | ✅ Complète |
| **Double facturation** | ❌ Possible | ✅ Toujours évitée |
| **Traçabilité des inférences** | Aucune | ✅ Explicite (déclaré / inféré / consommé) |
| **Justification du devis** | Fragile | ✅ Solide et auditable |
| **UX client** | Bonne | ✅ Améliorée (moins d'erreurs, plus de clarté) |
| **Prix final** | Variable (selon oublis) | ✅ Cohérent (toujours correct) |

### 7.2 Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| **Sur-inférence** | Faible | Faible | Inférence uniquement si monte-meuble requis |
| **Confusion UX** | Faible | Moyen | Affichage clair (déclaré/inféré) dans l'UI |
| **Règles invalides** | Faible | Moyen | Validation BDD avant inférence |
| **Performance** | Faible | Faible | Inférence uniquement à la soumission |

### 7.3 Cas limite : Contrainte inférée mais fausse

**Scénario** :
```typescript
// Situation RÉELLE:
- Étage 5, pas d'ascenseur
- Couloirs LARGES (pas étroits) ✅

// Client n'a rien coché
declaredConstraints = []

// Avec inférence:
inferredConstraints = ['RULE_UUID_COULOIRS_ETROITS']  // Inféré mais FAUX
consumedConstraints = ['RULE_UUID_COULOIRS_ETROITS']
```

**Impact** :
- La règle "Couloirs étroits" ne s'applique pas (consommée)
- Prix : 300€ (monte-meuble uniquement)
- **Résultat** : ✅ Correct du point de vue facturation (pas de double facturation)

**Conclusion** : Même si la contrainte est inférée à tort, elle est consommée et ne génère pas de surcharge supplémentaire. Le prix reste correct.

---

## 8. 🎯 Conclusion

### 8.1 Résumé

Le modèle d'**inférence** permet de :

1. ✅ **Préserver la cohérence** entre réalité terrain et logique de calcul
2. ✅ **Renforcer la traçabilité** avec distinction déclaré/inféré/consommé
3. ✅ **Garantir** que toute contrainte pertinente (même omise par le client) soit correctement prise en compte et consommée
4. ✅ **Éviter la double facturation** systématiquement

### 8.2 Principe clé

> **Mieux vaut inférer trop que facturer deux fois**

Si un monte-meuble est requis, toutes les contraintes logistiques qu'il résout sont automatiquement inférées et consommées, même si le client ne les a pas déclarées.

### 8.3 Liste des contraintes à consommer

**Contraintes actuellement consommées** (7) :
- Escalier difficile
- Couloirs étroits
- Meubles encombrants
- Objets très lourds
- Distance de portage > 30m
- Passage indirect
- Accès complexe multi-niveaux

**Contraintes à ajouter** (3) :
- Ascenseur en panne ou hors service
- Ascenseur interdit pour déménagement
- Ascenseur trop petit pour les meubles

**Total recommandé** : **10 contraintes** consommables par le monte-meuble

---

## 9. 📝 Notes d'implémentation

### 9.1 Ordre de priorité

1. **Phase 1** : Ajouter les 3 contraintes d'ascenseur à `CONSUMED_BY_FURNITURE_LIFT`
2. **Phase 2** : Implémenter l'inférence dans `AutoDetectionService`
3. **Phase 3** : Ajouter la traçabilité (déclaré/inféré/consommé)
4. **Phase 4** : Activer uniquement à la soumission finale

### 9.2 Tests à prévoir

- ✅ Test : Client oublie une contrainte → doit être inférée et consommée
- ✅ Test : Client déclare toutes les contraintes → pas d'inférence
- ✅ Test : Monte-meuble non requis → pas d'inférence
- ✅ Test : Contrainte inférée mais fausse → pas de surcharge supplémentaire

---

**Document créé le** : 2025-01-27  
**Auteur** : Analyse technique du système de consommation des contraintes

