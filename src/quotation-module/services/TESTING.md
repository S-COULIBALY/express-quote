# 🧪 Guide de Test - Services d'analyse de volume

**Utilisation du provider MOCK pour les tests**

---

## 🎯 Utilisation rapide

### Dans vos tests Jest/Vitest

```typescript
import { 
  createTestVideoAnalysisService, 
  createTestListAnalysisService,
  TEST_DATA 
} from '@/quotation-module/services';

describe('Mon test', () => {
  it('should analyze video', async () => {
    // Service automatiquement configuré avec MOCK
    const videoService = createTestVideoAnalysisService();
    
    const result = await videoService.analyzeVideo(TEST_DATA.testVideoUrl);
    
    expect(result.estimatedVolume).toBeGreaterThan(0);
  });
});
```

---

## 🔧 Helpers disponibles

### `createTestVideoAnalysisService(options?)`

Crée un `VideoAnalysisService` configuré avec le provider **MOCK**.

```typescript
const service = createTestVideoAnalysisService();
// Équivalent à : new VideoAnalysisService({ provider: 'MOCK' })
```

### `createTestListAnalysisService()`

Crée un `ListAnalysisService` pour les tests.

```typescript
const service = createTestListAnalysisService();
```

### `TEST_DATA`

Données de test prédéfinies :

```typescript
import { TEST_DATA } from '@/quotation-module/services';

// Liste standard
const items = TEST_DATA.standardItems;

// Liste avec objets spéciaux
const specialItems = TEST_DATA.itemsWithSpecial;

// URLs de test
const videoUrl = TEST_DATA.testVideoUrl;
const pianoVideoUrl = TEST_DATA.testVideoUrlWithPiano;
```

### `TEST_CONFIG`

Configuration pour les tests :

```typescript
import { TEST_CONFIG } from '@/quotation-module/services';

beforeAll(() => {
  TEST_CONFIG.forceMockProvider(); // Force MOCK globalement
});

afterAll(() => {
  TEST_CONFIG.restoreProvider(); // Restaure config originale
});
```

---

## 📝 Exemples complets

### Test VideoAnalysisService

```typescript
import { createTestVideoAnalysisService, TEST_DATA } from '@/quotation-module/services';

describe('VideoAnalysisService', () => {
  let service: VideoAnalysisService;

  beforeEach(() => {
    service = createTestVideoAnalysisService();
  });

  it('should detect furniture in video', async () => {
    const result = await service.analyzeVideo(TEST_DATA.testVideoUrl);

    expect(result.detectedItems.length).toBeGreaterThan(0);
    expect(result.estimatedVolume).toBeGreaterThan(0);
    expect(result.confidence).toMatch(/LOW|MEDIUM|HIGH/);
  });

  it('should detect piano when present', async () => {
    const result = await service.analyzeVideo(TEST_DATA.testVideoUrlWithPiano);

    expect(result.detectedSpecialItems.piano).toBe(true);
  });
});
```

### Test ListAnalysisService

```typescript
import { createTestListAnalysisService, TEST_DATA } from '@/quotation-module/services';

describe('ListAnalysisService', () => {
  let service: ListAnalysisService;

  beforeEach(() => {
    service = createTestListAnalysisService();
  });

  it('should calculate volume from list', async () => {
    const result = await service.analyzeList(TEST_DATA.standardItems);

    expect(result.estimatedVolume).toBeGreaterThan(0);
    expect(result.detectedSpecialItems).toBeDefined();
  });
});
```

### Test avec configuration globale

```typescript
import { TEST_CONFIG } from '@/quotation-module/services';

describe('Suite de tests', () => {
  beforeAll(() => {
    // Force MOCK pour tous les tests de cette suite
    TEST_CONFIG.forceMockProvider();
  });

  afterAll(() => {
    // Restaure la configuration
    TEST_CONFIG.restoreProvider();
  });

  // Tous les tests utilisent automatiquement MOCK
});
```

---

## ✅ Avantages du MOCK pour les tests

1. **Rapidité** : Pas d'appels API réels (tests instantanés)
2. **Fiabilité** : Pas de dépendance à des services externes
3. **Coût** : Pas de coûts API pendant les tests
4. **Prévisibilité** : Résultats constants et reproductibles
5. **CI/CD** : Fonctionne sans credentials API

---

## 🎭 Comportement du MOCK

### VideoAnalysisService (MOCK)

- **Délai simulé** : 100-500ms (réaliste)
- **Items détectés** : 4-7 objets selon configuration
- **Confiance** : HIGH (0.85-0.95)
- **Volume estimé** : ~8-12 m³ selon items

### Variabilité selon URL

- Si URL contient `"piano"` → Détecte un piano
- Plus de `sampleFrames` → Plus d'items détectés

---

## 🚀 Configuration Jest/Vitest

### Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
};
```

```javascript
// jest.setup.js
// Force MOCK pour tous les tests
process.env.VIDEO_ANALYSIS_PROVIDER = 'MOCK';
```

### Vitest

```typescript
// vitest.config.ts
export default {
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
};
```

```typescript
// vitest.setup.ts
process.env.VIDEO_ANALYSIS_PROVIDER = 'MOCK';
```

---

## 📋 Checklist pour tests

- [ ] Utiliser `createTestVideoAnalysisService()` ou `createTestListAnalysisService()`
- [ ] Utiliser `TEST_DATA` pour données de test
- [ ] Vérifier que `NODE_ENV !== 'production'` (MOCK bloqué en prod)
- [ ] Tester les cas d'erreur (validation, limites)
- [ ] Tester les cas limites (listes vides, volumes extrêmes)

---

## ⚠️ Notes importantes

1. **Production** : MOCK est automatiquement bloqué en production
2. **CI/CD** : MOCK fonctionne sans credentials API
3. **Performance** : Tests très rapides (<100ms par test)
4. **Cohérence** : Résultats prévisibles et reproductibles

