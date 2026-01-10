# 🎥 Architecture : Gestion des méthodes d'estimation de volume

**Date** : 2025-01-XX  
**Statut** : 🟢 Proposition d'architecture

---

## 🎯 Principe fondamental

**Le moteur de devis reste AUTOMATIQUE et TEMPS RÉEL** pour tous les cas.

L'analyse de la vidéo/liste se fait **EN AMONT** par des services externes, avant que le contexte n'arrive au moteur.

---

## 📊 Flux complet par méthode

### Cas 1 : FORM (Formulaire standard)

```
[Client remplit formulaire]
    ↓
[FormAdapter] → QuoteContext {
  volumeMethod: 'FORM',
  estimatedVolume: undefined,
  surface: 65,
  housingType: 'F3'
}
    ↓
[QuoteEngine] → VolumeEstimationModule
    ↓
✅ Calcul automatique depuis surface/housingType
✅ Temps réel (<100ms)
```

**Qui analyse ?** Personne, calcul automatique depuis les données du formulaire.

---

### Cas 2 : LIST (Liste d'objets)

```
[Client remplit liste d'objets dans formulaire]
    ↓
[Service externe : ListAnalysisService]
  → Analyse la liste (IA ou règles métier)
  → Calcule estimatedVolume
    ↓
[FormAdapter] → QuoteContext {
  volumeMethod: 'LIST',
  estimatedVolume: 35,  // ← Résultat de l'analyse
  volumeConfidence: 'HIGH'
}
    ↓
[QuoteEngine] → VolumeEstimationModule
    ↓
✅ Utilise estimatedVolume fourni
✅ Confiance HIGH → marge réduite (+2%)
✅ Temps réel (<100ms)
```

**Qui analyse ?** `ListAnalysisService` (service externe, peut être asynchrone)  
**Quand ?** Avant que le contexte n'arrive au moteur  
**Calcul devis ?** Automatique et temps réel une fois `estimatedVolume` disponible

---

### Cas 3 : VIDEO (Vidéo envoyée)

```
[Client envoie vidéo]
    ↓
[Service externe : VideoAnalysisService]
  → Analyse vidéo (IA vision, détection objets)
  → Calcule estimatedVolume
  → Peut prendre 30s-2min (asynchrone)
    ↓
[Webhook/Callback] → QuoteContext {
  volumeMethod: 'VIDEO',
  estimatedVolume: 42,  // ← Résultat de l'analyse IA
  volumeConfidence: 'HIGH'
}
    ↓
[QuoteEngine] → VolumeEstimationModule
    ↓
✅ Utilise estimatedVolume fourni
✅ Confiance HIGH → marge minimale (+2%)
✅ Temps réel (<100ms) une fois l'analyse terminée
```

**Qui analyse ?** `VideoAnalysisService` (service externe, IA vision)  
**Quand ?** Asynchrone, avant que le contexte n'arrive au moteur  
**Calcul devis ?** Automatique et temps réel une fois `estimatedVolume` disponible

**UX** : Le client peut voir un devis provisoire pendant l'analyse, puis mise à jour automatique quand l'analyse est prête.

---

### Cas 4 : ONSITE (Visite technique)

```
[Devis initial calculé avec volume estimé]
    ↓
[Technicien se rend sur place]
    ↓
[Service : OnSiteVerificationService]
  → Technicien mesure volume réel
  → Met à jour QuoteContext
    ↓
[QuoteEngine] (phase: 'CONTRACT') → OnSiteVerificationModule
    ↓
✅ Override du volume avec mesure réelle
✅ Confiance CRITICAL → marge 0%
✅ Recalcul automatique du devis
```

**Qui analyse ?** Technicien sur place  
**Quand ?** Phase CONTRACT (après devis initial, avant signature)  
**Calcul devis ?** Automatique et temps réel avec le nouveau volume

---

## 🏗️ Architecture proposée

### Services externes (en amont)

```typescript
// services/ListAnalysisService.ts
export class ListAnalysisService {
  async analyzeList(items: string[]): Promise<number> {
    // Analyse la liste d'objets
    // Retourne estimatedVolume en m³
    // Peut utiliser IA ou règles métier
  }
}

// services/VideoAnalysisService.ts
export class VideoAnalysisService {
  async analyzeVideo(videoUrl: string): Promise<{
    estimatedVolume: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    detectedItems: string[];
  }> {
    // Analyse vidéo avec IA vision
    // Détecte objets, meubles, volume
    // Retourne estimatedVolume
  }
}
```

### Module dans le moteur (temps réel)

```typescript
// modules/base/VolumeEstimationModule.ts
// ✅ DÉJÀ IMPLÉMENTÉ
// Utilise volumeMethod pour ajuster la confiance et les marges
```

### Module pour visite technique (phase CONTRACT)

```typescript
// modules/verification/OnSiteVerificationModule.ts
export class OnSiteVerificationModule implements QuoteModule {
  readonly id = 'onsite-verification';
  readonly priority = 95;
  readonly executionPhase = 'CONTRACT'; // ← Phase CONTRACT uniquement
  
  apply(ctx: QuoteContext): QuoteContext {
    // Si volume mesuré par technicien présent
    if (ctx.measuredVolume && ctx.measuredVolume > 0) {
      // Override du volume avec mesure réelle
      return {
        ...ctx,
        computed: {
          ...ctx.computed,
          baseVolume: ctx.measuredVolume,
          adjustedVolume: ctx.measuredVolume, // Pas de marge
          metadata: {
            ...ctx.computed?.metadata,
            volumeSource: 'ONSITE_MEASUREMENT',
            volumeConfidence: 'CRITICAL',
          }
        }
      };
    }
    return ctx;
  }
}
```

---

## 🔄 Flux complet avec vidéo (exemple)

### Étape 1 : Client envoie vidéo

```typescript
// Frontend
const videoFile = await uploadVideo(file);
const analysisJob = await VideoAnalysisService.startAnalysis(videoFile);

// Devis provisoire pendant l'analyse
const provisionalContext: QuoteContext = {
  volumeMethod: 'VIDEO',
  estimatedVolume: undefined, // Pas encore analysé
  surface: 65,
  housingType: 'F3',
  // ...
};

const provisionalQuote = engine.execute(provisionalContext);
// → Utilise volume théorique (29.25 m³)
```

### Étape 2 : Analyse terminée (webhook)

```typescript
// Webhook reçoit résultat de l'analyse
const analysisResult = {
  estimatedVolume: 42,
  confidence: 'HIGH',
  detectedItems: ['piano', 'bibliothèque']
};

// Contexte mis à jour
const finalContext: QuoteContext = {
  ...provisionalContext,
  estimatedVolume: 42, // ← Résultat de l'analyse
  volumeConfidence: 'HIGH',
  piano: true, // Détecté dans la vidéo
};

const finalQuote = engine.execute(finalContext);
// → Utilise 42 m³ avec confiance HIGH (+2%)
```

---

## ✅ Avantages de cette architecture

1. **Moteur reste automatique** : Pas de traitement lourd dans le moteur
2. **Temps réel garanti** : Une fois `estimatedVolume` disponible, calcul instantané
3. **Scalabilité** : L'analyse vidéo peut être déléguée à un service cloud
4. **Séparation des responsabilités** :
   - Services externes : Analyse (IA, règles métier)
   - Moteur : Calcul de devis (déterministe, rapide)
5. **UX optimale** : Devis provisoire → Devis final automatique

---

## 📋 Implémentation recommandée

### Phase 1 : Améliorer VolumeEstimationModule (MVP)

Modifier `applyConfidenceAdjustment()` pour utiliser `volumeMethod` :

```typescript
private applyConfidenceAdjustment(
  baseVolume: number, 
  ctx: QuoteContext, 
  hasUserProvidedVolume: boolean = false
): number {
  const confidence = ctx.volumeConfidence || 'MEDIUM';
  const volumeMethod = ctx.volumeMethod || 'FORM';
  
  // Ajustement selon la méthode d'estimation
  let confidenceFactors: Record<string, number>;
  
  if (volumeMethod === 'VIDEO') {
    // Vidéo analysée par IA = très fiable
    confidenceFactors = {
      'LOW': 1.05,   // +5%
      'MEDIUM': 1.02, // +2%
      'HIGH': 1.0,    // 0%
    };
  } else if (volumeMethod === 'LIST') {
    // Liste analysée = fiable
    confidenceFactors = {
      'LOW': 1.10,   // +10%
      'MEDIUM': 1.05, // +5%
      'HIGH': 1.02,   // +2%
    };
  } else {
    // FORM = estimation standard
    // Logique actuelle...
  }
  
  // ...
}
```

### Phase 2 : Créer OnSiteVerificationModule (post-MVP)

Module pour phase CONTRACT qui override le volume avec mesure réelle.

---

## 🎯 Réponse à vos questions

**Q : Qui analyse la vidéo/liste ?**  
**R :** Services externes (`VideoAnalysisService`, `ListAnalysisService`) en amont, avant que le contexte n'arrive au moteur.

**Q : Le calcul reste-t-il automatique et temps réel ?**  
**R :** Oui. Une fois `estimatedVolume` disponible dans `QuoteContext`, le moteur calcule instantanément (<100ms). L'analyse peut être asynchrone, mais le calcul du devis reste automatique et temps réel.

