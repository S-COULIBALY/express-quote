# 📚 GUIDE COMPLET - Tests React Email pour tous les templates

## 🎯 Problème identifié et résolu

### Le problème initial
Tous les templates React Email peuvent rencontrer le **même problème**:
- `bodyLength: 441` caractères au lieu de 15 000-20 000
- Fallback HTML simple utilisé au lieu du template React Email
- Email basique envoyé au lieu du design professionnel

### Cause racine
L'utilisation de `require('react-dom/server')` en environnement Jest ne fonctionne pas correctement. Les données de test manquent souvent des **champs obligatoires**.

### Solution générique appliquée
✅ **Import ES6 statique**: `import { renderToStaticMarkup } from 'react-dom/server'`
✅ **Données complètes**: Tous les champs obligatoires fournis dans les tests

## 📋 Templates React Email disponibles

### 1. 💰 accounting-documents
**Fichier**: `src/notifications/templates/react-email/emails/AccountingDocuments.tsx`

**Champs obligatoires**:
```typescript
interface AccountingDocumentsData {
  // ✅ OBLIGATOIRES
  accountingName: string;           // Nom du comptable
  bookingId: string;                // ID réservation
  bookingReference: string;         // Référence affichée
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  totalAmount: number;              // Montant en centimes
  currency: string;                 // EUR
  customerName: string;             // Nom client
  customerEmail: string;            // Email client
  bookingDate: string;              // Date réservation (ISO)

  // Documents
  documentsCount: number;
  documentTypes: string[];
  attachedDocuments: Array<{...}>;

  // Indicateurs
  hasInvoice: boolean;
  hasPaymentReceipt: boolean;
  hasQuote: boolean;

  // Contexte
  trigger: 'payment_completed' | 'invoice_generated' | ...;
  reason: string;

  // URLs
  viewBookingUrl: string;
  accountingDashboardUrl: string;
  downloadAllUrl: string;

  // Entreprise
  companyName?: string;
  siretNumber?: string;
  vatNumber?: string;
}
```

**Test**: ✅ `src/__tests__/integration/accounting-notifications.test.ts`

---

### 2. 📝 quote-confirmation
**Fichier**: `src/notifications/templates/react-email/emails/QuoteConfirmation.tsx`

**Champs obligatoires**:
```typescript
interface QuoteConfirmationData {
  // ✅ OBLIGATOIRES
  customerName: string;             // Nom du client
  customerEmail: string;            // Email client
  quoteNumber: string;              // Numéro devis
  serviceType: string;              // Type de service
  totalAmount: number;              // Montant en centimes
  currency: string;                 // EUR

  // Dates
  quoteDate: string;                // Date devis (ISO)
  validUntil?: string;              // Valide jusqu'à

  // Service
  serviceName?: string;
  serviceDescription?: string;

  // URLs
  viewQuoteUrl: string;
  acceptQuoteUrl: string;
  modifyQuoteUrl?: string;

  // Optionnels mais recommandés
  companyName?: string;
  estimatedDuration?: number;
}
```

**Test**: ✅ `src/__tests__/integration/quote-confirmation.test.ts`

---

### 3. ✅ booking-confirmation
**Fichier**: `src/notifications/templates/react-email/emails/BookingConfirmation.tsx`

**Champs obligatoires**:
```typescript
interface BookingConfirmationData {
  // ✅ OBLIGATOIRES
  customerName: string;             // Nom du client
  customerEmail: string;            // Email client
  bookingId: string;                // ID réservation
  bookingReference: string;         // Référence affichée
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';

  // Planning
  serviceDate: string;              // Date service (ISO)
  serviceTime: string;              // Heure (HH:MM)
  estimatedDuration: number;        // En heures

  // Équipe
  teamSize: number;                 // Nombre de personnes
  emergencyContact: {
    name: string;
    phone: string;
    hours: string;
  };

  // Adresses
  serviceAddress?: string;
  pickupAddress?: string;
  deliveryAddress?: string;

  // Financier
  totalAmount: number;              // En centimes
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  currency: string;                 // EUR

  // Instructions
  preparationInstructions: string[];
  equipment: string[];

  // URLs
  viewBookingUrl: string;
}
```

**Tests**:
- ✅ `src/__tests__/integration/complete-booking-notification-flow.test.ts`
- ✅ `src/__tests__/integration/complete-reservation-notification-delivery.test.ts`

---

### 4. 💳 payment-confirmation
**Fichier**: `src/notifications/templates/react-email/emails/PaymentConfirmation.tsx`

**Champs obligatoires**:
```typescript
interface PaymentConfirmationData {
  // ✅ OBLIGATOIRES
  customerName: string;
  customerEmail: string;
  transactionId: string;            // ID transaction
  bookingReference: string;

  // Montant
  amount: number;                   // En centimes
  currency: string;

  // Dates
  paymentDate: string;              // Date paiement (ISO)

  // Méthode
  paymentMethod: string;            // 'CARD', 'TRANSFER', etc.

  // URLs
  viewReceiptUrl: string;
  viewBookingUrl: string;
}
```

---

### 5. 📅 reminder-24h
**Fichier**: `src/notifications/templates/react-email/emails/Reminder24h.tsx`

**Champs obligatoires**:
```typescript
interface Reminder24hData {
  // ✅ OBLIGATOIRES
  customerName: string;
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName: string;

  // Planning
  serviceDate: string;              // ISO
  serviceTime: string;              // HH:MM
  estimatedDuration: number;

  // Adresse
  serviceAddress: string;

  // Équipe
  teamSize: number;
  teamLeaderContact: string;
  emergencyContact: string;
  supportPhone: string;

  // Instructions
  preparationInstructions: string[];

  // Config
  companyName?: string;
  allowsModification: boolean;
  allowsCancellation: boolean;
  cancellationDeadlineHours: number;
}
```

**Test**: ✅ `src/__tests__/integration/scheduled-reminders.test.ts`

---

### 6. 📆 reminder-7d
**Fichier**: `src/notifications/templates/react-email/emails/Reminder7d.tsx`

**Champs similaires à reminder-24h** (même interface généralement)

**Test**: ✅ `src/__tests__/integration/scheduled-reminders.test.ts`

---

### 7. ⏰ reminder-1h
**Fichier**: `src/notifications/templates/react-email/emails/Reminder1h.tsx`

**Champs similaires à reminder-24h** avec urgence accrue

**Test**: ✅ `src/__tests__/integration/scheduled-reminders.test.ts`

---

### 8. 🔔 service-reminder
**Fichier**: `src/notifications/templates/react-email/emails/ServiceReminder.tsx`

**Champs obligatoires**:
```typescript
interface ServiceReminderData {
  // ✅ OBLIGATOIRES
  customerName: string;
  bookingReference: string;
  serviceType: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  serviceAddress: string;

  // URLs
  viewBookingUrl: string;
}
```

**Test**: ✅ `src/__tests__/integration/scheduled-reminders.test.ts`

---

### 9. 🎯 professional-attribution
**Fichier**: `src/notifications/templates/react-email/emails/ProfessionalAttribution.tsx`

**Champs obligatoires**:
```typescript
interface ProfessionalAttributionData {
  // ✅ OBLIGATOIRES
  professionalName: string;
  professionalEmail: string;
  bookingId: string;
  serviceType: string;
  serviceName: string;

  // Planning
  serviceDate: string;
  serviceTime: string;
  estimatedDuration: number;

  // Localisation
  locationCity: string;
  locationDistance: number;         // En km

  // Financier
  totalAmount: number;              // Rémunération proposée
  currency: string;

  // URLs
  acceptMissionUrl: string;
  declineMissionUrl: string;
  viewDetailsUrl: string;

  // Deadline
  responseDeadline: string;         // ISO
}
```

---

### 10. ✅ mission-accepted-confirmation
**Fichier**: `src/notifications/templates/react-email/emails/MissionAcceptedConfirmation.tsx`

**Test**: ✅ `src/__tests__/integration/mission-accepted-confirmation.test.ts`

---

## 🔧 Solution générique à appliquer

### 1. ✅ Fix react-email.renderer.ts (DÉJÀ FAIT)

```typescript
// src/notifications/infrastructure/templates/react-email.renderer.ts

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server'; // ✅ Import statique

// ...

renderTemplate(templateId: string, data: any) {
  try {
    const element = React.createElement(Component, data);

    // ✅ Utiliser l'import statique
    html = renderToStaticMarkup(element);

    console.log('[ReactEmailRenderer] HTML length:', html?.length);
  } catch (error) {
    console.error('[ReactEmailRenderer] Error:', error);
    throw error;
  }
}
```

### 2. ✅ Template de test pour nouveaux tests

```typescript
/**
 * 🧪 TEST - [NOM DU TEMPLATE]
 *
 * Template: [template-id]
 * Objectif: [description]
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

describe('[NOM DU TEMPLATE]', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('devrait envoyer le template React Email', async () => {
    // 1. Créer les données avec TOUS les champs obligatoires
    const testData = {
      to: 'test@example.com',
      template: 'template-id',
      data: {
        // ✅ TOUS LES CHAMPS OBLIGATOIRES
        customerName: 'Test Client',
        customerEmail: 'client@test.com',
        bookingId: 'booking_test_123',
        bookingReference: 'REF-123',
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison test',

        // Dates (TOUJOURS en ISO)
        serviceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        bookingDate: new Date().toISOString(),

        // Montants (TOUJOURS en centimes)
        totalAmount: 15000, // 150.00€
        currency: 'EUR',

        // Autres champs selon interface
        // ... (voir interfaces ci-dessus)
      }
    };

    // 2. Envoyer notification
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const service = await getGlobalNotificationService();

    try {
      await service.sendEmail(testData);
    } catch (error) {
      logger.warn('Erreur envoi (peut être normal)', { error });
    }

    // 3. Vérifier la notification en base
    await new Promise(resolve => setTimeout(resolve, 2000));

    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: testData.to,
        template_id: testData.template,
        created_at: {
          gte: new Date(Date.now() - 60000)
        }
      }
    });

    // 4. ✅ VALIDATION CRITIQUE
    const emailNotif = notifications.find(n => n.channel === 'EMAIL');
    expect(emailNotif).toBeDefined();

    if (emailNotif) {
      const templateData = emailNotif.template_data as any;

      // ✅ Vérifier que React Email est utilisé (pas fallback)
      logger.info('Template ID:', emailNotif.template_id);
      logger.info('Body length:', emailNotif.content?.length);

      // ❗ CRITIQUE: bodyLength doit être > 10000 pour React Email
      expect(emailNotif.content?.length).toBeGreaterThan(10000);
      expect(emailNotif.template_id).toBe(testData.template);

      // ✅ Vérifier les données
      expect(templateData.customerName).toBe(testData.data.customerName);
      expect(templateData.totalAmount).toBe(testData.data.totalAmount);
    }
  });
});
```

## 🚨 Checklist pour chaque nouveau test

### Avant d'écrire le test

- [ ] Identifier le template React Email utilisé
- [ ] Lire l'interface TypeScript du template (`*Data` interface)
- [ ] Lister TOUS les champs obligatoires (sans `?`)
- [ ] Identifier les champs avec valeurs spécifiques (enums)

### Pendant l'écriture du test

- [ ] ✅ Fournir TOUS les champs obligatoires
- [ ] ✅ Dates en format ISO (`toISOString()`)
- [ ] ✅ Montants en centimes (pas en euros)
- [ ] ✅ Enums avec `as const` pour TypeScript
- [ ] ✅ Arrays vides si pas de données (ne pas omettre)

### Après l'exécution du test

- [ ] ✅ Vérifier `bodyLength > 10000` (React Email)
- [ ] ✅ Vérifier `template_id` correspond au template demandé
- [ ] ✅ Vérifier que les données sont présentes dans `template_data`
- [ ] ✅ Pas de warning "Template HTML ne contient pas de balises HTML"

## 🔍 Debugging - Si le template ne s'affiche pas

### 1. Vérifier les logs du renderer

```bash
# Chercher ces logs dans la sortie du test
grep "ReactEmailRenderer" test-output.txt
```

**Attendu**:
```
[ReactEmailRenderer] Step 5: HTML length: 19382  ✅ BIEN
[ReactEmailRenderer] Step 5: HTML length: undefined  ❌ PROBLÈME
```

### 2. Vérifier les champs manquants

```bash
# Chercher les erreurs de rendu
grep "RangeError\|Invalid time value\|undefined" test-output.txt
```

**Erreurs fréquentes**:
- `RangeError: Invalid time value` → Date manquante ou invalide
- `Cannot read property 'X' of undefined` → Objet obligatoire manquant
- `Expected string, got undefined` → Champ string manquant

### 3. Comparer avec un test qui fonctionne

```bash
# Template de référence qui fonctionne
cat src/__tests__/integration/accounting-notifications.test.ts
```

## 📊 État actuel des tests

| Template | Test existe | Données complètes | bodyLength OK | Status |
|----------|-------------|-------------------|---------------|--------|
| accounting-documents | ✅ | ✅ | ✅ 19382 | ✅ PASS |
| quote-confirmation | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| booking-confirmation | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| payment-confirmation | ❌ | - | - | ❌ Manquant |
| reminder-24h | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| reminder-7d | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| reminder-1h | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| service-reminder | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |
| professional-attribution | ❓ | ⚠️ | ❓ | ⚠️ À vérifier |
| mission-accepted-confirmation | ✅ | ⚠️ | ❓ | ⚠️ À vérifier |

**Légende**:
- ✅ OK
- ⚠️ À vérifier/corriger
- ❌ Manquant
- ❓ Non testé

## 🎯 Actions recommandées

### Phase 1: Audit des tests existants (1-2h)

```bash
# Lancer chaque test et vérifier bodyLength
npm test -- src/__tests__/integration/quote-confirmation.test.ts
npm test -- src/__tests__/integration/scheduled-reminders.test.ts
npm test -- src/__tests__/integration/complete-booking-notification-flow.test.ts
npm test -- src/__tests__/integration/mission-accepted-confirmation.test.ts
```

**Pour chaque test, vérifier**:
```bash
grep "bodyLength\|HTML length" test-output.txt
```

Si `bodyLength < 10000` → Appliquer le fix

### Phase 2: Corriger les tests problématiques (2-3h)

Pour chaque test avec `bodyLength < 10000`:

1. Lire l'interface TypeScript du template
2. Ajouter les champs manquants
3. Relancer le test
4. Vérifier `bodyLength > 10000`

### Phase 3: Créer tests manquants (optionnel)

Templates sans test dédié:
- `payment-confirmation`
- `professional-document`

## 📚 Ressources

### Documentation des templates
- [src/notifications/templates/react-email/emails/](src/notifications/templates/react-email/emails/) - Tous les templates
- [src/notifications/templates/react-email/index.ts](src/notifications/templates/react-email/index.ts) - Index et types

### Documentation de la solution
- [SOLUTION_ACCOUNTING_DOCUMENTS_REACT_EMAIL.md](SOLUTION_ACCOUNTING_DOCUMENTS_REACT_EMAIL.md)
- [VALIDATION_PRODUCTION_ACCOUNTING_DOCUMENTS.md](VALIDATION_PRODUCTION_ACCOUNTING_DOCUMENTS.md)

### Tests de référence
- [src/__tests__/integration/accounting-notifications.test.ts](src/__tests__/integration/accounting-notifications.test.ts) - ✅ Exemple complet qui fonctionne

---

**Créé le**: 2025-11-28
**Dernière mise à jour**: 2025-11-28
**Statut**: ✅ Guide complet et validé
