# 🎯 Services d'analyse de volume

Services externes pour renforcer l'exactitude de l'estimation de volume **AVANT** que le contexte n'arrive au moteur de devis.

---

## 📋 Services disponibles

### 1. ListAnalysisService

Analyse une liste d'objets fournie par le client.

**Utilisation** :
```typescript
import { ListAnalysisService } from '@/quotation-module/services';

const service = new ListAnalysisService();

const items = [
  { name: 'Canapé', quantity: 1, category: 'canape' },
  { name: 'Table basse', quantity: 1 },
  { name: 'Piano', quantity: 1, category: 'piano' },
];

const result = await service.analyzeList(items);
// {
//   estimatedVolume: 11.3,
//   confidence: 'HIGH',
//   detectedSpecialItems: { piano: true },
//   metadata: { ... }
// }

// Injecter dans QuoteContext
const quoteContext: QuoteContext = {
  volumeMethod: 'LIST',
  estimatedVolume: result.estimatedVolume,
  volumeConfidence: result.confidence,
  piano: result.detectedSpecialItems.piano,
  // ...
};
```

---

### 2. VideoAnalysisService

Analyse une vidéo avec IA vision pour détecter objets et estimer le volume.

**Utilisation** :
```typescript
import { VideoAnalysisService } from '@/quotation-module/services';

const service = new VideoAnalysisService({
  provider: 'OPENAI', // ou 'GOOGLE', 'MOCK' pour dev
});

// Option 1 : Analyse asynchrone (recommandé)
const { jobId } = await service.startAnalysis(videoUrl);
// Attendre webhook ou polling...

// Option 2 : Analyse synchrone (peut prendre 30s-2min)
const result = await service.analyzeVideo(videoUrl);
// {
//   estimatedVolume: 42.5,
//   confidence: 'HIGH',
//   detectedItems: [...],
//   detectedSpecialItems: { piano: true },
//   metadata: { ... }
// }

// Injecter dans QuoteContext
const quoteContext: QuoteContext = {
  volumeMethod: 'VIDEO',
  estimatedVolume: result.estimatedVolume,
  volumeConfidence: result.confidence,
  piano: result.detectedSpecialItems.piano,
  // ...
};
```

**Configuration** :
```env
# Provider d'IA vision
VIDEO_ANALYSIS_PROVIDER=OPENAI  # OPENAI, GOOGLE, CUSTOM, ou MOCK (dev uniquement)
OPENAI_API_KEY=sk-...
GOOGLE_VISION_API_KEY=...

# Timeouts et retry
VIDEO_ANALYSIS_TIMEOUT_MS=120000  # 2 minutes par défaut
MAX_VIDEO_DURATION_SECONDS=300    # 5 minutes max
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# Limites de sécurité
MAX_LIST_ITEMS=1000
MAX_VOLUME_PER_ITEM=50
MIN_VOLUME=0.1
MAX_VOLUME=500
```

**Validation de configuration** :
```typescript
import { validateConfig } from '@/quotation-module/services/config';

// Valider au démarrage de l'application
validateConfig(); // Lance une erreur si config invalide
```

---

### 3. OnSiteVerificationService

Gère les visites techniques et mesures sur place (phase CONTRACT).

**Utilisation** :
```typescript
import { OnSiteVerificationService } from '@/quotation-module/services';

const service = new OnSiteVerificationService();

// 1. Planifier visite
const verificationId = await service.scheduleVerification({
  quoteId: 'quote_123',
  customerId: 'customer_456',
  address: '123 Rue de Paris, 75001 Paris',
  scheduledDate: new Date('2025-02-15T10:00:00'),
});

// 2. Technicien mesure sur place
const measurement = {
  measuredVolume: 45.2,
  measuredBy: 'technician_789',
  measuredAt: new Date(),
  notes: 'Volume confirmé, piano présent',
  specialItemsVerified: { piano: true },
};

// 3. Enregistrer mesure
const result = await service.recordMeasurement(verificationId, measurement);
// {
//   verificationId: '...',
//   quoteId: 'quote_123',
//   measurement: { ... },
//   volumeDifference: {
//     estimatedVolume: 42,
//     measuredVolume: 45.2,
//     differencePercentage: 7.6
//   },
//   requiresQuoteUpdate: false // <10% d'écart
// }

// 4. Mettre à jour contexte pour phase CONTRACT
const updatedContext = service.updateContextWithMeasurement(
  originalQuoteContext,
  measurement
);
// Volume override avec mesure réelle, confiance CRITICAL
```

---

## 🔄 Flux d'intégration complet

### Cas LIST

```typescript
// 1. Client remplit liste dans formulaire
const items = [...]; // Depuis formulaire

// 2. Analyser liste (synchrone, rapide)
const listService = new ListAnalysisService();
const analysis = await listService.analyzeList(items);

// 3. Construire QuoteContext avec résultat
const quoteContext: QuoteContext = {
  volumeMethod: 'LIST',
  estimatedVolume: analysis.estimatedVolume,
  volumeConfidence: analysis.confidence,
  piano: analysis.detectedSpecialItems.piano,
  // ... autres champs
};

// 4. Calculer devis (automatique, temps réel)
const engine = new QuoteEngine(getAllModules());
const quote = engine.execute(quoteContext);
```

### Cas VIDEO

```typescript
// 1. Client envoie vidéo
const videoFile = await uploadVideo(file);

// 2. Démarrer analyse (asynchrone)
const videoService = new VideoAnalysisService();
const { jobId } = await videoService.startAnalysis(videoFile.url);

// 3. Devis provisoire pendant analyse
const provisionalContext: QuoteContext = {
  volumeMethod: 'VIDEO',
  estimatedVolume: undefined, // Pas encore analysé
  surface: 65,
  housingType: 'F3',
  // ...
};
const provisionalQuote = engine.execute(provisionalContext);

// 4. Webhook reçoit résultat analyse
app.post('/webhook/video-analysis', async (req, res) => {
  const { jobId, result } = req.body;
  
  // 5. Contexte final avec volume analysé
  const finalContext: QuoteContext = {
    ...provisionalContext,
    estimatedVolume: result.estimatedVolume,
    volumeConfidence: result.confidence,
    piano: result.detectedSpecialItems.piano,
  };
  
  // 6. Recalcul automatique
  const finalQuote = engine.execute(finalContext);
  
  // 7. Notifier client (devis mis à jour)
  await notifyCustomer(finalQuote);
});
```

### Cas ONSITE

```typescript
// Phase QUOTE : Devis initial
const initialQuote = engine.execute(quoteContext);

// Phase CONTRACT : Visite technique
const verificationService = new OnSiteVerificationService();

if (verificationService.isVerificationRecommended(initialQuote.context)) {
  // Planifier visite
  const verificationId = await verificationService.scheduleVerification({
    quoteId: initialQuote.id,
    // ...
  });
  
  // Après visite : technicien enregistre mesure
  const measurement = { measuredVolume: 45.2, ... };
  const result = await verificationService.recordMeasurement(
    verificationId,
    measurement
  );
  
  // Mettre à jour contexte pour phase CONTRACT
  const updatedContext = verificationService.updateContextWithMeasurement(
    initialQuote.context,
    measurement
  );
  
  // Recalcul avec volume mesuré
  const finalQuote = engine.execute(updatedContext, 'CONTRACT');
}
```

---

## ✅ Avantages

1. **Moteur reste automatique** : Pas de traitement lourd dans le moteur
2. **Temps réel garanti** : Une fois `estimatedVolume` disponible, calcul instantané
3. **Scalabilité** : Analyse vidéo déléguée à services cloud
4. **Séparation des responsabilités** :
   - Services : Analyse (IA, règles métier)
   - Moteur : Calcul de devis (déterministe, rapide)

---

## ⚙️ Configuration

### Variables d'environnement requises

Copier dans votre `.env` :

```bash
# Provider d'IA vision (OpenAI par défaut)
VIDEO_ANALYSIS_PROVIDER=OPENAI  # OPENAI (défaut), GOOGLE, CUSTOM, ou MOCK (dev uniquement)

# Clés API (selon provider choisi)
OPENAI_API_KEY=sk-...
GOOGLE_VISION_API_KEY=...

# Timeouts et retry
VIDEO_ANALYSIS_TIMEOUT_MS=120000      # 2 minutes par défaut
MAX_VIDEO_DURATION_SECONDS=300        # 5 minutes max
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# Limites de sécurité
MAX_LIST_ITEMS=1000
MAX_VOLUME_PER_ITEM=50
MIN_VOLUME=0.1
MAX_VOLUME=500
```

### Validation au démarrage

```typescript
import { validateConfig } from '@/quotation-module/services';

// Dans votre fichier d'initialisation (ex: app.ts, server.ts)
try {
  validateConfig();
  console.log('✅ Volume analysis services configured correctly');
} catch (error) {
  console.error('❌ Configuration error:', error);
  process.exit(1);
}
```

## ✅ Production Ready Features

### Gestion d'erreurs
- ✅ Classes d'erreur personnalisées (`ListAnalysisError`, `VideoAnalysisError`, `OnSiteVerificationError`)
- ✅ Codes d'erreur standardisés
- ✅ Détails d'erreur structurés

### Validation
- ✅ Validation des entrées (items, URLs, mesures)
- ✅ Limites de sécurité (max items, max volume, etc.)
- ✅ Validation de configuration au démarrage

### Performance
- ✅ Retry logic avec backoff exponentiel
- ✅ Timeout handling pour opérations longues
- ✅ Logging structuré avec contexte

### Sécurité
- ✅ Validation des URLs (HTTP/HTTPS uniquement)
- ✅ Limites de volume pour éviter abus
- ✅ Masquage des données sensibles dans logs

## 🚀 Prochaines étapes

- [ ] Implémenter providers IA réels (OpenAI Vision, Google Vision)
- [ ] Système de job queue pour analyse vidéo asynchrone (BullMQ, etc.)
- [ ] Intégration avec système de calendrier pour visites
- [ ] Dashboard pour suivre analyses en cours
- [ ] Métriques et monitoring des analyses (Prometheus, etc.)
- [ ] Cache pour résultats d'analyse fréquents
- [ ] Rate limiting pour éviter abus

