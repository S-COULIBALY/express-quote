# 🔧 CORRECTIONS REQUISES - DIAGRAMME TRANSITIONS STATUTS

**Date** : 2025-01-15
**Document source** : `docs/DIAGRAMME_TRANSITIONS_STATUTS.md`
**Statut** : ❌ INCOHÉRENCES CRITIQUES IDENTIFIÉES

---

## 🚨 INCOHÉRENCES CRITIQUES

### 1. **QuoteRequestStatus - ERREUR MAJEURE**

#### ❌ **Le document affirme que le statut initial est `PENDING`**

**Document actuel** (lignes 24-40) :
```
[PENDING] ────────────────────────────────────────────────────────────┐
     │
     │  Webhook Stripe checkout.session.completed
     │  → BookingService.createBookingAfterPayment()
     │
     ▼
[CONFIRMED] ✅ UTILISÉ
```

**Réalité du code** :

📍 **Fichier** : `src/quotation/domain/entities/QuoteRequest.ts:24`
```typescript
this.status = QuoteRequestStatus.TEMPORARY; // ← Statut initial = TEMPORARY!
```

📍 **Enum TypeScript** : `src/quotation/domain/entities/QuoteRequest.ts:4-9`
```typescript
export enum QuoteRequestStatus {
    TEMPORARY = 'TEMPORARY',    // ✅ Statut initial
    CONFIRMED = 'CONFIRMED',    // ✅ Utilisé
    CONVERTED = 'CONVERTED',    // ⚠️ Tests uniquement
    EXPIRED = 'EXPIRED'         // ✅ Utilisé
}
```

🚨 **Le statut `PENDING` N'EXISTE PAS dans l'enum !**

---

#### ❌ **Transitions documentées incorrectes**

**Document actuel** (lignes 342-351) :
```
| Statut      | Utilisé ? | Transition           | Notes        |
|-------------|-----------|----------------------|--------------|
| PENDING     | ✅ OUI    | PENDING → CONFIRMED  | Statut initial |
| TEMPORARY   | ❌ NON    | -                    | Non utilisé  |
| EXPIRED     | ❌ NON    | -                    | Non utilisé  |
```

**Réalité du code** :

📍 **Fichier** : `src/quotation/domain/services/QuoteStateService.ts:134-136`
```typescript
const allowedTransitions: Record<QuoteRequestStatus, QuoteRequestStatus[]> = {
    [QuoteRequestStatus.TEMPORARY]: [QuoteRequestStatus.CONFIRMED, QuoteRequestStatus.EXPIRED],
    [QuoteRequestStatus.CONFIRMED]: [QuoteRequestStatus.EXPIRED],
    [QuoteRequestStatus.EXPIRED]: []
};
```

✅ **Transitions réelles** :
- `TEMPORARY → CONFIRMED` (utilisé lors du webhook Stripe)
- `TEMPORARY → EXPIRED` (expiration automatique)
- `CONFIRMED → EXPIRED` (possible mais rare)

---

### 2. **Incohérence Prisma/TypeScript**

#### 🚨 **Le champ `status` est de type `String` dans Prisma (pas d'enum)**

**Schéma Prisma** (`prisma/schema.prisma:282-299`) :
```prisma
model QuoteRequest {
  id                 String   @id
  type               String
  status             String   ← ⚠️ PAS D'ENUM!
  quoteData          Json
  temporaryId        String   @unique
  createdAt          DateTime @default(now())
  updatedAt          DateTime
  expiresAt          DateTime
  catalogSelectionId String?
  Booking            Booking[]
  CatalogSelection   CatalogSelection? @relation(fields: [catalogSelectionId], references: [id])
}
```

**Problème** :
- ❌ Pas de validation au niveau base de données
- ⚠️ Possibilité d'insérer des valeurs arbitraires
- ⚠️ Incohérence avec l'enum TypeScript

**Solution recommandée** :
```prisma
enum QuoteRequestStatus {
  TEMPORARY
  CONFIRMED
  CONVERTED
  EXPIRED
}

model QuoteRequest {
  id     String               @id
  status QuoteRequestStatus   @default(TEMPORARY)
  ...
}
```

---

### 3. **Méthode inexistante documentée**

**Document mentionne** (code cité ligne 1142) :
```typescript
quoteRequest.markAsUsed();
```

🚨 **Cette méthode N'EXISTE PAS** dans `QuoteRequest.ts`

**Code réel** :
- Aucune méthode `markAsUsed()` trouvée
- Le changement de statut se fait via `updateStatus()` ou directement dans le repository

---

## ✅ CORRECTIONS À APPORTER

### **Correction #1 : Section QuoteRequest (lignes 24-40)**

**AVANT** :
```
[PENDING] ────────────────────────────────────────────────────────────┐
     │
     │  Webhook Stripe checkout.session.completed
     │  → BookingService.createBookingAfterPayment()
     │
     ▼
[CONFIRMED] ✅ UTILISÉ

⚠️  STATUTS DÉFINIS MAIS NON UTILISÉS:
   - TEMPORARY (défini dans QuoteRequestStatus enum)
   - CONVERTED (défini dans QuoteRequestStatus enum)
   - EXPIRED (défini dans QuoteRequestStatus enum)
```

**APRÈS** :
```
[TEMPORARY] ──────────────────────────────────────────────────────────┐
     │                                                                 │
     │  Webhook Stripe checkout.session.completed                     │
     │  → BookingService.createBookingAfterPayment()                  │
     │  (src/quotation/application/services/BookingService.ts:270)    │
     │                                                                 │
     ├─────────────────────────────────────────────────────────────┐  │
     │                                                             │  │
     ▼                                                             ▼  │
[CONFIRMED] ✅ UTILISÉ                                        [EXPIRED] ✅ UTILISÉ
     │                                                                 │
     │  Transition possible mais rare                                 │
     │  (ligne 136 QuoteStateService.ts)                             │
     │                                                                 │
     ▼                                                                 │
[EXPIRED] ✅ UTILISÉ                                          (statut terminal)

✅ STATUTS UTILISÉS:
   - TEMPORARY (statut initial, ligne 24 QuoteRequest.ts)
   - CONFIRMED (après paiement Stripe, ligne 270 BookingService.ts)
   - EXPIRED (expiration automatique, ligne 177 QuoteStateService.ts)

⚠️  STATUT DÉFINI MAIS NON UTILISÉ:
   - CONVERTED (défini dans enum, utilisé uniquement en tests)

🚨 INCOHÉRENCE PRISMA/TYPESCRIPT:
   Le schéma Prisma définit `status` comme `String` (pas d'enum).
   Recommandation: Ajouter un enum QuoteRequestStatus dans Prisma.
```

---

### **Correction #2 : Tableau des statuts (lignes 342-351)**

**AVANT** :
```
| Statut Défini | Utilisé dans le Flux ? | Transition Utilisée | Notes |
|--------------|------------------------|---------------------|-------|
| `PENDING` | ✅ OUI | `PENDING → CONFIRMED` | Statut initial |
| `CONFIRMED` | ✅ OUI | - | Après création du booking |
| `TEMPORARY` | ❌ NON | - | Défini dans enum mais non utilisé |
| `CONVERTED` | ❌ NON | - | Défini dans enum mais non utilisé |
| `EXPIRED` | ❌ NON | - | Défini dans enum mais non utilisé |

**📊 Utilisation**: 2/5 statuts utilisés (40%)
```

**APRÈS** :
```
| Statut Défini | Utilisé dans le Flux ? | Transitions Utilisées | Fichier | Ligne |
|--------------|------------------------|----------------------|---------|-------|
| `TEMPORARY` | ✅ OUI | Statut initial | QuoteRequest.ts | 24 |
| `TEMPORARY` | ✅ OUI | `TEMPORARY → CONFIRMED` | BookingService.ts | 270 |
| `TEMPORARY` | ✅ OUI | `TEMPORARY → EXPIRED` | QuoteStateService.ts | 177 |
| `CONFIRMED` | ✅ OUI | Statut après paiement | BookingService.ts | 270, 475 |
| `CONFIRMED` | ✅ OUI | `CONFIRMED → EXPIRED` | QuoteStateService.ts | 136 |
| `EXPIRED` | ✅ OUI | Statut terminal | QuoteStateService.ts | 177 |
| `CONVERTED` | ⚠️ TESTS | Utilisé uniquement en tests | __tests__/BookingService.test.ts | - |

**📊 Utilisation**: 3/4 statuts utilisés en production (75%)

**🚨 INCOHÉRENCE**:
- Le schéma Prisma définit `status: String` (pas d'enum)
- Risque de valeurs non valides en base de données
```

---

### **Correction #3 : Flux principal (lignes 366-440)**

**Rechercher et remplacer** :

```diff
État:
-  ✅ QuoteRequest: status = 'PENDING' (déjà existant)
+  ✅ QuoteRequest: status = 'TEMPORARY' (créé lors du calcul de prix)
```

```diff
État:
-  ✅ QuoteRequest: status = 'CONFIRMED' (transition PENDING → CONFIRMED)
+  ✅ QuoteRequest: status = 'CONFIRMED' (transition TEMPORARY → CONFIRMED)
```

---

### **Correction #4 : Supprimer référence à `markAsUsed()`**

**Rechercher** (ligne ~1142 du code cité) :
```typescript
quoteRequest.markAsUsed();
await this.quoteRequestRepository.save(quoteRequest);
```

**Remplacer par** :
```typescript
// Le statut est déjà mis à jour dans createBookingAfterPayment (ligne 270)
await this.quoteRequestRepository.save(quoteRequest);
```

---

### **Correction #5 : Résumé final (lignes 506-520)**

**AVANT** :
```
RÉSUMÉ DES STATUTS FINAUX
───────────────────────────────────────────────────────────────────────────────

✅ QuoteRequest: PENDING → CONFIRMED
✅ Booking: DRAFT → PAYMENT_COMPLETED
✅ Transaction: COMPLETED (créé directement)
...

⚠️  STATUTS NON UTILISÉS (intentionnels ou futurs):
   - QuoteRequest: TEMPORARY, CONVERTED, EXPIRED
```

**APRÈS** :
```
RÉSUMÉ DES STATUTS FINAUX
───────────────────────────────────────────────────────────────────────────────

✅ QuoteRequest: TEMPORARY → CONFIRMED (ou EXPIRED)
✅ Booking: DRAFT → PAYMENT_COMPLETED
✅ Transaction: COMPLETED (créé directement)
...

⚠️  STATUTS NON UTILISÉS (intentionnels ou futurs):
   - QuoteRequest: CONVERTED (utilisé uniquement en tests)
   - Booking: CONFIRMED, AWAITING_PAYMENT, PAYMENT_PROCESSING, PAYMENT_FAILED, CANCELED, COMPLETED
```

---

## 📋 ACTIONS RECOMMANDÉES

### **1. Mise à jour du document** (URGENT)

- [ ] Remplacer toutes les occurrences de `PENDING` par `TEMPORARY`
- [ ] Corriger le tableau des statuts QuoteRequest
- [ ] Ajouter une section "Incohérences Prisma/TypeScript"
- [ ] Supprimer la référence à `markAsUsed()`
- [ ] Mettre à jour le résumé final

### **2. Mise à jour du schéma Prisma** (RECOMMANDÉ)

**Ajouter enum dans `prisma/schema.prisma`** :
```prisma
enum QuoteRequestStatus {
  TEMPORARY
  CONFIRMED
  CONVERTED
  EXPIRED
}

model QuoteRequest {
  id                 String               @id
  type               String
  status             QuoteRequestStatus   @default(TEMPORARY)
  quoteData          Json
  temporaryId        String               @unique
  createdAt          DateTime             @default(now())
  updatedAt          DateTime
  expiresAt          DateTime
  catalogSelectionId String?
  Booking            Booking[]
  CatalogSelection   CatalogSelection?    @relation(fields: [catalogSelectionId], references: [id])

  @@index([catalogSelectionId])
  @@index([status])
  @@index([temporaryId])
}
```

**Migration** :
```bash
npx prisma migrate dev --name add-quote-request-status-enum
```

### **3. Clarifier le statut CONVERTED** (OPTIONNEL)

**Option A** : Supprimer de l'enum
```typescript
export enum QuoteRequestStatus {
    TEMPORARY = 'TEMPORARY',
    CONFIRMED = 'CONFIRMED',
    // CONVERTED supprimé
    EXPIRED = 'EXPIRED'
}
```

**Option B** : Implémenter son usage
- Ajouter une transition `CONFIRMED → CONVERTED` lors de la création du Booking
- Documenter son utilité

---

## 📊 RÉSUMÉ DES ERREURS

| Type d'erreur | Gravité | Nombre | Impact |
|--------------|---------|--------|--------|
| Statut inexistant (`PENDING`) | 🔴 CRITIQUE | 8+ occurrences | Confusion majeure |
| Incohérence Prisma/TS | 🟠 HAUTE | 1 | Risque de corruption données |
| Statuts mal documentés | 🟡 MOYENNE | 5 | Documentation trompeuse |
| Méthode inexistante | 🟡 MOYENNE | 1 | Code exemple invalide |

---

## ✅ VALIDATION

Après corrections, vérifier :

- [ ] Aucune mention de `PENDING` dans le document
- [ ] `TEMPORARY` documenté comme statut initial
- [ ] Transitions correctes : `TEMPORARY → CONFIRMED/EXPIRED`
- [ ] Incohérence Prisma documentée
- [ ] Code d'exemple valide (pas de `markAsUsed()`)
- [ ] Pourcentages d'utilisation corrects

---

**Auteur** : Analyse automatisée via Claude Code
**Date** : 2025-01-15
**Fichier source** : `docs/DIAGRAMME_TRANSITIONS_STATUTS.md`
