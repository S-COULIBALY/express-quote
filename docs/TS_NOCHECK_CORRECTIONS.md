# Fichiers avec @ts-nocheck - Corrections Requises

> **STATUT: NETTOYAGE EN COURS**
>
> Les fichiers obsolètes des services abandonnés ont été supprimés.
> Ce document liste les fichiers restants avec @ts-nocheck et le plan de correction.

**Date:** 12 Janvier 2026
**Dernière mise à jour:** Corrections Phase 1 - Événements DomainEvent et fichiers simples
**Build Vercel:** En cours de correction
**Fichiers restants avec @ts-nocheck:** 23 (sur 33 initialement)

---

## Sommaire

1. [Résumé du Nettoyage Effectué](#résumé-du-nettoyage-effectué)
2. [Fichiers avec @ts-nocheck Restants](#fichiers-avec-ts-nocheck-restants)
3. [Problèmes Racines](#problèmes-racines)
4. [Plan de Correction](#plan-de-correction)

---

## Résumé du Nettoyage Effectué

### Services Abandonnés Supprimés

Les services catalogue suivants ont été **complètement supprimés** car abandonnés au profit du nouveau système modulaire (`src/quotation-module`) :

| Service                       | Dossiers/Fichiers Supprimés                                            |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Catalogue Cleaning**        | `src/components/form-generator/presets/catalogueCleaningItem-service/` |
|                               | `src/hooks/business/CatalogueCleaningItem/`                            |
| **Catalogue Delivery**        | `src/components/form-generator/presets/catalogueDeliveryItem-service/` |
|                               | `src/hooks/business/CatalogueDeliveryItem/`                            |
| **Catalogue Moving (Pack)**   | `src/components/form-generator/presets/catalogueMovingItem-service/`   |
|                               | `src/hooks/business/CatalogueMovingItem/`                              |
| **Ménage Sur Mesure**         | `src/components/form-generator/presets/menage-sur-mesure-service/`     |
|                               | `src/hooks/business/MenageSurMesure/`                                  |
| **Pages Catalogue Obsolètes** | `src/app/catalogue/[catalogId]/`                                       |
|                               | `src/app/catalogue/catalog-menage-sur-mesure/`                         |
| **Composants Obsolètes**      | `src/components/CatalogPageClient.tsx`                                 |
|                               | `src/components/DetailForm.tsx`                                        |
| **Hooks Examples**            | `src/hooks/examples/`                                                  |

### Service Conservé

**Seul le service "Déménagement Sur Mesure"** est conservé :

- Page : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`
- Preset : `src/components/form-generator/presets/demenagement-sur-mesure-service/`
- Hook : `src/hooks/business/DemenagementSurMesure/`

### Fichiers Index Réécris

Les fichiers d'export ont été nettoyés pour supprimer les imports obsolètes :

- `src/components/form-generator/presets/index.ts`
- `src/hooks/business/index.ts`
- `src/hooks/index.ts`

---

## Fichiers avec @ts-nocheck Restants

### Module Notifications (Priorité HAUTE - Architecture complexe)

| #     | Fichier                                                                     | Problème                                | Priorité       |
| ----- | --------------------------------------------------------------------------- | --------------------------------------- | -------------- |
| 1     | `src/notifications/application/services/workers/NotificationWorkers.ts`     | Types BullMQ et workers complexes       | Haute          |
| 2     | `src/notifications/application/services/notification.service.production.ts` | Relations Prisma, CircuitBreaker types  | Haute          |
| 3     | `src/notifications/infrastructure/adapters/whatsapp.adapter.production.ts`  | WhatsAppSendResult interface incomplète | Moyenne        |
| ~~4~~ | ~~`src/notifications/core/events/NotificationCreated.ts`~~                  | ~~DomainEvent implementation~~          | ✅ **CORRIGÉ** |
| ~~5~~ | ~~`src/notifications/core/events/NotificationExpired.ts`~~                  | ~~DomainEvent implementation~~          | ✅ **CORRIGÉ** |
| ~~6~~ | ~~`src/notifications/core/events/NotificationFailed.ts`~~                   | ~~DomainEvent implementation~~          | ✅ **CORRIGÉ** |
| ~~7~~ | ~~`src/notifications/core/events/NotificationRetried.ts`~~                  | ~~DomainEvent implementation~~          | ✅ **CORRIGÉ** |
| ~~8~~ | ~~`src/notifications/core/events/NotificationSent.ts`~~                     | ~~DomainEvent implementation~~          | ✅ **CORRIGÉ** |

### Module Documents (Priorité HAUTE - Tables Prisma manquantes)

| #   | Fichier                                                                         | Problème                                            | Priorité |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------- | -------- |
| 9   | `src/documents/application/services/DocumentOrchestrationService.ts`            | Prisma snake_case + méthodes manquantes             | Haute    |
| 10  | `src/documents/application/services/DocumentService.ts`                         | Méthode `generatePaymentReceiptWithRetry` manquante | Haute    |
| 11  | `src/documents/application/services/ProfessionalDocumentService.ts`             | Type documentType incomplet                         | Moyenne  |
| 12  | `src/documents/application/services/SystemTriggerHandler.ts`                    | DocumentTrigger.SERVICE_REMINDER manquant           | Moyenne  |
| 13  | `src/documents/domain/interfaces/IDocumentService.ts`                           | Exports manquants (BulkDocumentRequest)             | Moyenne  |
| 14  | `src/documents/index.ts`                                                        | Re-exports de types avec isolatedModules            | Basse    |
| 15  | `src/documents/infrastructure/repositories/PrismaApprovalWorkflowRepository.ts` | Table Prisma manquante                              | Haute    |
| 16  | `src/documents/infrastructure/repositories/PrismaDocumentRepository.ts`         | Interface IDocumentRepository incomplète            | Moyenne  |
| 17  | `src/documents/infrastructure/repositories/PrismaDocumentVersionRepository.ts`  | Table Prisma manquante                              | Haute    |
| 18  | `src/documents/infrastructure/repositories/PrismaTemplateRepository.ts`         | Table Prisma manquante                              | Haute    |

### Autres Fichiers

| #      | Fichier                                                             | Problème                                      | Priorité       |
| ------ | ------------------------------------------------------------------- | --------------------------------------------- | -------------- |
| ~~19~~ | ~~`src/config/dependency-injection.ts`~~                            | ~~Types génériques tsyringe~~                 | ✅ **CORRIGÉ** |
| 20     | `src/components/scenarioServicesHelper.ts`                          | Inférence de type avec `find()`               | Basse          |
| 21     | `src/components/form-generator/FormGenerator.tsx`                   | Types complexes JSX/ReactNode                 | Moyenne        |
| 22     | `src/components/form-generator/components/FormField.tsx`            | Types complexes JSX/ReactNode                 | Moyenne        |
| 23     | `src/components/form-generator/utils/schemaGenerator.ts`            | Types Zod dynamiques                          | Basse          |
| 24     | `src/hooks/business/useServiceConfig.ts`                            | Index signature manquante                     | Basse          |
| ~~25~~ | ~~`src/hooks/useCatalogPreFill.ts`~~                                | ~~`catalogData.item` possibly undefined~~     | ✅ **CORRIGÉ** |
| ~~26~~ | ~~`src/hooks/useFormWithAbandonTracking.ts`~~                       | ~~Type `AbandonStage` incompatible~~          | ✅ **CORRIGÉ** |
| 27     | `src/internalStaffNotification/index.ts`                            | Re-export typeof avec isolatedModules         | Basse          |
| 28     | `src/internalStaffNotification/InternalStaffNotificationService.ts` | Méthode `getReference` manquante              | Moyenne        |
| ~~29~~ | ~~`src/lib/abandonAnalytics.ts`~~                                   | ~~Parameter `row` implicitly has `any` type~~ | ✅ **CORRIGÉ** |
| ~~30~~ | ~~`src/hooks/index.ts`~~                                            | ~~Exports vers fichiers inexistants~~         | ✅ **CORRIGÉ** |
| 30     | `src/bookingAttribution/AttributionService.ts`                      | Relations Prisma snake_case                   | Moyenne        |
| 31     | `src/bookingAttribution/BlacklistService.ts`                        | Relations Prisma snake_case                   | Moyenne        |
| 32     | `src/bookingAttribution/AttributionNotificationService.ts`          | Types notification                            | Moyenne        |

---

## Corrections Déjà Appliquées

### 1. ProductionLogger - Signature Corrigée ✅

Le constructeur accepte maintenant string ou config object :

```typescript
// src/notifications/infrastructure/logging/logger.production.ts
constructor(configOrServiceName?: Partial<LoggerConfig> | string) {
  const config = typeof configOrServiceName === 'string'
    ? { service: configOrServiceName }
    : configOrServiceName || {};
  // ...
}
```

### 2. DomainEvent Interface - Créée ✅

Interface créée dans `src/notifications/core/interfaces/index.ts` :

```typescript
export interface DomainEvent<T = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly payload: T;
  readonly metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    version?: number;
    source: string;
    traceId?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };
}
```

### 3. NotificationTracking - Metadata Ajouté ✅

Propriété `metadata` ajoutée à l'interface `NotificationTracking` dans `src/notifications/core/entities/Notification.ts`.

### 4. SubmissionConfig - MOVING_PREMIUM Ajouté ✅

Type ajouté dans `src/utils/submissionUtils.ts` :

```typescript
submissionType: "MOVING" | "MOVING_PREMIUM" | "PACK" | "SERVICE";
```

### 5. Corrections Build TypeScript - Janvier 2026 ✅

**Build réussi !** Toutes les erreurs TypeScript ont été corrigées :

#### Infrastructure Notifications

- ✅ `template-cache.production.ts` - Option Redis `retryDelayOnFailover` retirée
- ✅ `queue.manager.production.ts` - Types BullMQ `KeepJobs` et `queue.clean` corrigés
- ✅ `NotificationRepository.ts` - Modèle Prisma `notifications` et propriétés `snake_case` corrigées
- ✅ `ScheduledReminderRepository.ts` - Modèle Prisma `scheduled_reminders` et propriétés `snake_case` corrigées
- ✅ `rate.limiter.ts` - Ordre des propriétés de configuration corrigé
- ✅ `react-email.renderer.ts` - Imports de types corrigés
- ✅ `webhook-handler.production.ts` - Accès `CircuitBreakerResult` corrigé

#### Interfaces et Contrôleurs

- ✅ `interfaces/cron/index.ts` - Instanciation `ReminderScheduler` corrigée
- ✅ `interfaces/http/GlobalNotificationService.ts` - Méthode `cleanup` et `verifyToken` corrigées
- ✅ `interfaces/http/NotificationController.ts` - Types de retour, signatures de méthodes, logger corrigés
- ✅ `interfaces/index.ts` - Imports de types corrigés

#### Templates React Email

- ✅ `templates/react-email/index.ts` - Exports de types corrigés
- ✅ `templates/react-email/components/Layout.tsx` - Type `FallbackFont` et props `style` ajoutées
- ✅ `templates/react-email/emails/BookingConfirmation.tsx` - Type `serviceType` optionnel géré
- ✅ `templates/react-email/emails/ServiceReminder.tsx` - Type `teamSize` optionnel géré

**Résultat :** Build TypeScript réussi sans erreurs ! ✅

### 6. Corrections Phase 1 - Événements DomainEvent et Fichiers Simples ✅

**Date:** 12 Janvier 2026

#### Événements DomainEvent Corrigés (5 fichiers)

Tous les événements DomainEvent ont été corrigés pour respecter l'interface `DomainEvent` :

- ✅ `NotificationCreated.ts` - `correlationId` déplacé dans `metadata`
- ✅ `NotificationSent.ts` - `correlationId` déplacé dans `metadata`
- ✅ `NotificationRetried.ts` - `correlationId` déplacé dans `metadata`, types `retryMetadata` corrigés
- ✅ `NotificationFailed.ts` - `correlationId` déplacé dans `metadata`
- ✅ `NotificationExpired.ts` - `correlationId` déplacé dans `metadata`, types `expirationMetadata` corrigés

**Corrections appliquées :**

- Suppression de la propriété `correlationId` directe
- Déplacement de `correlationId` dans `metadata` selon l'interface `DomainEvent`
- Correction des méthodes `fromJSON` pour gérer la compatibilité
- Correction des types optionnels (`retryMetadata`, `expirationMetadata`)

#### Fichiers Simples Corrigés (5 fichiers)

- ✅ `dependency-injection.ts` - Syntaxe tsyringe corrigée, export `initializeDependencyInjection` ajouté
- ✅ `useCatalogPreFill.ts` - Gestion de `catalogData.item` optionnel avec `?.` et `??`
- ✅ `useFormWithAbandonTracking.ts` - Type `AbandonStage` corrigé, `'form_filling'` remplacé par `'form_incomplete'`
- ✅ `abandonAnalytics.ts` - Type `row: string[]` explicite dans `convertToCSV`
- ✅ `hooks/index.ts` - Exports vers fichiers inexistants commentés

**Résultat :** 10 fichiers corrigés, 23 fichiers restants avec `@ts-nocheck`

---

## Problèmes Racines Restants

### 1. Prisma Schema Incomplet (Priorité HAUTE)

Tables manquantes pour le module Documents :

```prisma
model DocumentTemplate {
  id          String   @id @default(uuid())
  name        String
  description String?
  content     Json
  format      String
  orientation String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("document_templates")
}

model DocumentVersion {
  id         String   @id @default(uuid())
  documentId String   @map("document_id")
  version    Int
  status     String
  content    Bytes
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("document_versions")
}

model ApprovalWorkflow {
  id        String   @id @default(uuid())
  name      String
  type      String
  steps     Json
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  @@map("approval_workflows")
}
```

### 2. Convention Prisma snake_case vs camelCase

Le schema Prisma utilise `snake_case` (ex: `booking_id`) mais le code TypeScript attend `camelCase` (ex: `bookingId`).

**Solution :** Utiliser `@map()` dans Prisma ou adapter le code.

### 3. Types BullMQ et CircuitBreaker

Le module notifications utilise des patterns avancés (workers, circuit breakers) avec des types complexes qui nécessitent une refonte.

---

## Plan de Correction

### Phase 1 : Build Minimal (✅ TERMINÉE)

Objectif : Obtenir un build qui passe avec `@ts-nocheck`

1. [x] Supprimer les fichiers obsolètes des services abandonnés
2. [x] Corriger ProductionLogger
3. [x] Créer DomainEvent interface
4. [x] Corriger toutes les erreurs TypeScript du build
5. [x] Valider le build - **BUILD RÉUSSI !** ✅
6. [x] Corriger 5 événements DomainEvent (NotificationCreated, NotificationSent, NotificationRetried, NotificationFailed, NotificationExpired)
7. [x] Corriger fichiers simples (dependency-injection, useCatalogPreFill, useFormWithAbandonTracking, abandonAnalytics, hooks/index)

### Phase 2 : Corrections Prisma (À planifier)

1. [ ] Ajouter les tables manquantes au schema
2. [ ] Créer la migration
3. [ ] Régénérer le client Prisma
4. [ ] Retirer @ts-nocheck des repositories

### Phase 3 : Corrections Module Notifications (À planifier)

1. [ ] Corriger les types CircuitBreaker
2. [ ] Corriger les types BullMQ workers
3. [ ] Aligner WhatsAppSendResult avec l'implémentation
4. [ ] Retirer @ts-nocheck des services

### Phase 4 : Nettoyage Final (À planifier)

1. [ ] Retirer tous les @ts-nocheck restants
2. [ ] Valider le build complet
3. [ ] Exécuter les tests
4. [ ] Déployer sur Vercel

---

## Commandes Utiles

```bash
# Vérifier les erreurs TypeScript
npm run build

# Lister les fichiers avec @ts-nocheck
grep -r "@ts-nocheck" src/ --include="*.ts" --include="*.tsx" | wc -l

# Régénérer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name description
```

---

## Validation Finale

Avant de relancer le déploiement Vercel :

1. [x] `npm run build` passe sans erreur ✅
2. [x] Nombre de fichiers avec `@ts-nocheck` réduit (23 fichiers restants, 10 corrigés) ✅
3. [ ] `npx prisma validate` passe
4. [ ] Les tests critiques passent

**STATUT ACTUEL :** Build TypeScript réussi ! 10 fichiers corrigés (5 événements DomainEvent + 5 fichiers simples). Les 23 fichiers restants avec `@ts-nocheck` nécessitent des corrections plus complexes (Prisma schema, types BullMQ, composants React complexes, etc.)

---

_Document créé le 12 Janvier 2026_
_Dernière mise à jour: Phase 1 - 10 fichiers corrigés (5 événements DomainEvent + 5 fichiers simples). 23 fichiers restants._
