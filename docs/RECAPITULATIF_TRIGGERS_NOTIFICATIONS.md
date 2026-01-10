# 📋 RÉCAPITULATIF COMPLET DES TRIGGERS ET NOTIFICATIONS

> **Documentation exhaustive** : Analyse approfondie du code source pour comprendre tous les triggers et leurs effets sur le système de notifications.

**Date de création** : 2025-12-07  
**Version** : 1.0  
**Source** : Analyse du code source (`src/documents/`, `src/notifications/`, `src/bookingAttribution/`)

---

## 🎬 FLUX RÉEL : VALIDATION D'UNE RÉSERVATION PAR LE CLIENT

### Quand un client valide sa réservation (accepte et paie)

**Point d'entrée** : Webhook Stripe `checkout.session.completed` ou `payment_intent.succeeded`

**Flux complet** :

```
1. Webhook Stripe reçu
   ↓
2. /api/webhooks/stripe/route.ts → handleCheckoutCompleted() ou handlePaymentSucceeded()
   ↓
3. /api/bookings/finalize → BookingController.finalizeBooking()
   ↓
4. BookingService.createBookingAfterPayment()
   ├─→ Crée le Booking avec statut PAYMENT_COMPLETED
   └─→ Crée la Transaction avec status COMPLETED
   ↓
5. BookingService.confirmPaymentSuccess()
   ├─→ Met à jour le statut booking → PAYMENT_COMPLETED
   ├─→ 🎯 TRIGGER 1: POST /api/documents/orchestrate
   │   └─→ trigger: 'PAYMENT_COMPLETED'
   │       ├─→ Génère PAYMENT_RECEIPT + INVOICE
   │       ├─→ Notifie CLIENT (email + SMS)
   │       └─→ Notifie COMPTABILITÉ (email)
   │
   └─→ 🎯 TRIGGER 2: triggerProfessionalAttribution()
       └─→ POST /api/attribution/start
           └─→ AttributionService.startAttribution()
               ├─→ Génère CONTRACT (données limitées)
               └─→ Notifie PRESTATAIRES EXTERNES (email + WhatsApp + SMS)
```

**Triggers appelés** :

1. ✅ **`PAYMENT_COMPLETED`** (via `/api/documents/orchestrate`)
   - Documents : `PAYMENT_RECEIPT` + `INVOICE`
   - Destinataires : Client + Comptabilité
   - Canaux : Email + SMS (client)

2. ✅ **Attribution aux prestataires** (via `/api/attribution/start`)
   - Documents : `CONTRACT` (données limitées)
   - Destinataires : Prestataires externes éligibles
   - Canaux : Email + WhatsApp + SMS

**⚠️ IMPORTANT** : `BOOKING_CONFIRMED` **n'est PAS** appelé automatiquement lors de la validation. Ce trigger est utilisé dans certains tests mais **pas dans le flux de production réel**. Le système utilise directement `PAYMENT_COMPLETED` après le paiement.

---

## 📑 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Relation Triggers et Règles](#relation-triggers-et-règles)
3. [Triggers métier (avec documents PDF)](#triggers-métier-avec-documents-pdf)
4. [Triggers système (notifications uniquement)](#triggers-système-notifications-uniquement)
5. [Flux d'exécution détaillé](#flux-dexécution-détaillé)
6. [Matrice de distribution](#matrice-de-distribution)
7. [Annexes techniques](#annexes-techniques)

---

## 🎯 VUE D'ENSEMBLE

### Types de Triggers

Le système distingue **deux catégories** de triggers :

1. **Triggers métier** : Génèrent des documents PDF + envoient des notifications
   - `QUOTE_CREATED`, `QUOTE_ACCEPTED`
   - `PAYMENT_COMPLETED`, `BOOKING_CONFIRMED`
   - `BOOKING_SCHEDULED`, `SERVICE_STARTED`, `SERVICE_COMPLETED`
   - `BOOKING_CANCELLED`, `BOOKING_MODIFIED`

2. **Triggers système** : Notifications uniquement (pas de PDF)
   - `SERVICE_REMINDER`
   - `SYSTEM_MAINTENANCE`, `SYSTEM_UPDATE`
   - `PROMOTIONAL_OFFER`, `NEWSLETTER`

### Architecture de traitement

```
Trigger déclenché
    ↓
DocumentOrchestrationService.handleTrigger()
    ↓
┌─────────────────────────────────────┐
│  Est-ce un trigger système ?        │
└─────────────────────────────────────┘
    │
    ├─→ OUI → SystemTriggerHandler.handle()
    │         (Notifications sans PDF)
    │
    └─→ NON → DocumentRuleEngine.getApplicableRules()
              ↓
              DocumentGenerator.generateBatch()
              ↓
              Distribution aux destinataires
              (CustomerDocumentDistributor,
               InternalStaffDocumentDistributor,
               AdministrationDocumentDistributor)
```

---

## 🔗 RELATION TRIGGERS ET RÈGLES

### Concept fondamental

Le système fonctionne sur un **modèle de règles** : chaque trigger peut déclencher **plusieurs règles**, et chaque règle définit :

- Le **type de document** à générer
- Les **destinataires** qui doivent le recevoir
- Les **conditions** d'application (ex: type de service)
- Les **options** de génération (auto-génération, approbation requise)

### Structure d'une règle

```typescript
interface DocumentRule {
  trigger: DocumentTrigger; // Le trigger qui déclenche cette règle
  documentType: DocumentType; // Type de document à générer
  recipients: DocumentRecipient[]; // Destinataires (CUSTOMER, PROFESSIONAL, ACCOUNTING, etc.)
  conditions?: (booking: Booking) => boolean; // Conditions optionnelles
  autoGenerate: boolean; // Génération automatique ou manuelle
  requiresApproval: boolean; // Nécessite une approbation
  priority: number; // Priorité (1 = urgent, 3 = normal)
}
```

### Exemple concret : `PAYMENT_COMPLETED`

Le trigger `PAYMENT_COMPLETED` déclenche **2 règles** :

**Règle 1** : Génération du reçu de paiement

```typescript
{
  trigger: DocumentTrigger.PAYMENT_COMPLETED,
  documentType: DocumentType.PAYMENT_RECEIPT,
  recipients: [DocumentRecipient.CUSTOMER],
  autoGenerate: true,
  requiresApproval: false,
  priority: 1
}
```

→ Génère 1 document (`PAYMENT_RECEIPT`) pour 1 destinataire (`CUSTOMER`)

**Règle 2** : Génération de la facture

```typescript
{
  trigger: DocumentTrigger.PAYMENT_COMPLETED,
  documentType: DocumentType.INVOICE,
  recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.ACCOUNTING],
  autoGenerate: true,
  requiresApproval: false,
  priority: 1
}
```

→ Génère 1 document (`INVOICE`) pour 2 destinataires (`CUSTOMER` + `ACCOUNTING`)

**Résultat** :

- 2 documents générés (`PAYMENT_RECEIPT` + `INVOICE`)
- 1 email client avec 2 PDFs groupés
- 1 email comptabilité avec 1 PDF (facture uniquement)

### Exemple complexe : `BOOKING_CONFIRMED`

Le trigger `BOOKING_CONFIRMED` déclenche **7 règles** :

1. `QUOTE` → `CUSTOMER`
2. `PAYMENT_RECEIPT` → `CUSTOMER`
3. `BOOKING_CONFIRMATION` → `CUSTOMER`
4. `QUOTE` → `PROFESSIONAL` (équipe interne)
5. `BOOKING_CONFIRMATION` → `PROFESSIONAL`
6. `DELIVERY_NOTE` → `PROFESSIONAL`
7. `CONTRACT` → `PROFESSIONAL`

**Résultat** :

- 7 documents générés
- 1 email client avec 3 PDFs groupés (QUOTE, PAYMENT_RECEIPT, BOOKING_CONFIRMATION)
- 1 email par membre équipe interne avec 4 PDFs groupés (QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT)

### Relation 1-N : Un trigger → Plusieurs règles

```
PAYMENT_COMPLETED (1 trigger)
    ↓
    ├─→ Règle 1: PAYMENT_RECEIPT → CUSTOMER
    └─→ Règle 2: INVOICE → CUSTOMER + ACCOUNTING

BOOKING_CONFIRMED (1 trigger)
    ↓
    ├─→ Règle 1: QUOTE → CUSTOMER
    ├─→ Règle 2: PAYMENT_RECEIPT → CUSTOMER
    ├─→ Règle 3: BOOKING_CONFIRMATION → CUSTOMER
    ├─→ Règle 4: QUOTE → PROFESSIONAL
    ├─→ Règle 5: BOOKING_CONFIRMATION → PROFESSIONAL
    ├─→ Règle 6: DELIVERY_NOTE → PROFESSIONAL
    └─→ Règle 7: CONTRACT → PROFESSIONAL
```

### Filtrage des règles

Lors de l'exécution, les règles sont filtrées selon :

1. **Le trigger** : Seules les règles avec le même trigger sont sélectionnées
2. **Les conditions** : Les règles avec `conditions` sont évaluées (ex: `booking.getType() === BookingType.MOVING_QUOTE`)
3. **Les options** :
   - Si `autoGenerate: false` → Nécessite `forceGeneration: true` dans les options
   - Si `requiresApproval: true` → Nécessite `skipApproval: true` dans les options
4. **La priorité** : Les règles sont triées par priorité (1 = urgent, 3 = normal)

### Exemple de filtrage : `BOOKING_SCHEDULED`

**Règle configurée** :

```typescript
{
  trigger: DocumentTrigger.BOOKING_SCHEDULED,
  documentType: DocumentType.DELIVERY_NOTE,
  recipients: [DocumentRecipient.PROFESSIONAL, DocumentRecipient.CUSTOMER],
  conditions: (booking) => booking.getType() === BookingType.MOVING_QUOTE,
  autoGenerate: true,
  requiresApproval: false,
  priority: 2
}
```

**Filtrage** :

- ✅ Trigger correspond : `BOOKING_SCHEDULED` ✓
- ✅ Condition évaluée : Seulement si `booking.getType() === MOVING_QUOTE` ✓
- ✅ Auto-génération : `autoGenerate: true` → Pas besoin de `forceGeneration` ✓
- ✅ Approbation : `requiresApproval: false` → Pas besoin de `skipApproval` ✓

**Résultat** : La règle s'applique **uniquement** pour les réservations de type `MOVING_QUOTE`.

### Règles personnalisées

Le système permet d'ajouter des règles personnalisées :

```typescript
const customRules: DocumentRule[] = [
  {
    trigger: DocumentTrigger.QUOTE_ACCEPTED,
    documentType: DocumentType.QUOTE,
    recipients: [DocumentRecipient.CUSTOMER],
    autoGenerate: true,
    requiresApproval: false,
    priority: 1,
  },
];

orchestrationService.configureCustomRules(customRules);
```

Ces règles s'ajoutent aux règles par défaut et sont évaluées de la même manière.

### Résumé de la relation

| Aspect           | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| **Relation**     | 1 trigger → N règles (1-N)                                               |
| **Règle**        | 1 règle → 1 type de document → N destinataires                           |
| **Filtrage**     | Par trigger, conditions, options (autoGenerate, requiresApproval)        |
| **Priorité**     | Tri par priorité (1 = urgent, 3 = normal)                                |
| **Exécution**    | Toutes les règles applicables sont exécutées en parallèle                |
| **Distribution** | Les documents sont groupés par destinataire (1 email avec tous les PDFs) |

### Avantages de ce modèle

1. **Flexibilité** : Facile d'ajouter/modifier des règles sans toucher au code
2. **Séparation des responsabilités** : Les règles métier sont séparées de la logique d'orchestration
3. **Réutilisabilité** : Un même type de document peut être envoyé à différents destinataires via différentes règles
4. **Maintenabilité** : Toutes les règles sont centralisées dans `DocumentRuleEngine`
5. **Testabilité** : Facile de tester chaque règle indépendamment

---

## 📄 TRIGGERS MÉTIER (AVEC DOCUMENTS PDF)

### 1. `QUOTE_CREATED` - Création d'un devis

**Déclencheur** : Un nouveau devis est créé pour un client

**Documents générés** :

- ✅ `QUOTE` (Devis)

**Destinataires** :

- 👤 **CLIENT** uniquement

**Notifications envoyées** :

- 📧 **Email** : Template `booking-confirmation`
  - Pièce jointe : PDF du devis
  - Contenu : Détails du devis, prix, conditions
- 📱 **SMS** : Optionnel (si téléphone disponible)
  - Message de confirmation avec référence du devis

**Canaux** : Email (obligatoire) + SMS (optionnel)

**API utilisée** : `/api/notifications/business/customer-booking-confirmation`

**Service responsable** : `CustomerDocumentDistributor.distribute()`

**Conditions spéciales** :

- ⚠️ **Pas de notification à l'équipe interne** pour ce trigger
- ⚠️ **Pas de notification aux prestataires** pour ce trigger

**Priorité** : 2 (normale)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

---

### 2. `QUOTE_ACCEPTED` - Acceptation du devis

**Déclencheur** : Le client accepte le devis

**Documents générés** :

- ⚠️ **Aucune règle configurée** dans `DocumentRuleEngine`
- ⚠️ Ce trigger est défini mais **non implémenté** dans les règles par défaut

**Destinataires** : Aucun (pas de règle)

**Notifications envoyées** : Aucune

**Note** : Ce trigger nécessite une configuration personnalisée pour être utilisé.

---

### 3. `PAYMENT_COMPLETED` - Paiement validé ⭐

**Déclencheur** : Le paiement de la réservation est complété

**Documents générés** :

1. ✅ `PAYMENT_RECEIPT` (Reçu de paiement)
2. ✅ `INVOICE` (Facture)

**Destinataires** :

- 👤 **CLIENT** : Reçoit `PAYMENT_RECEIPT` + `INVOICE`
- 💼 **COMPTABILITÉ** (ACCOUNTING) : Reçoit `INVOICE` uniquement

**Notifications envoyées** :

#### Pour le CLIENT :

- 📧 **Email** : Template `payment-confirmation`
  - Pièces jointes : PDF reçu de paiement + PDF facture (2 PDFs)
  - Contenu : Confirmation de paiement, détails transaction, montant
- 📱 **SMS** : Optionnel (si téléphone disponible)
  - Message de confirmation de paiement avec référence

**API utilisée** : `/api/notifications/business/customer-booking-confirmation`

#### Pour la COMPTABILITÉ :

- 📧 **Email** : Template `professional-document`
  - Pièce jointe : PDF facture uniquement (1 PDF)
  - Contenu : Détails complets de la réservation, informations client complètes
  - Destinataires : Membres avec rôle `ACCOUNTING` uniquement

**API utilisée** : `/api/notifications/business/internal-staff-booking-confirmation`

**Service responsable** :

- Client : `CustomerDocumentDistributor.distribute()`
- Comptabilité : `AdministrationDocumentDistributor.distribute()`

**Conditions spéciales** :

- ⚠️ **Seule la comptabilité** reçoit des notifications (pas toute l'équipe interne)
- ⚠️ **Pas de notification aux prestataires** via ce trigger (géré séparément par `AttributionService`)

**Priorité** : 1 (urgente)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

**Flux parallèle** :

- Après `PAYMENT_COMPLETED`, le système déclenche également `AttributionService.startAttribution()` pour notifier les prestataires externes (voir section [Attribution Prestataires](#attribution-prestataires-externes))

---

### 4. `BOOKING_CONFIRMED` - Réservation confirmée ⭐

**Déclencheur** : La réservation est confirmée (devis accepté + paiement)

**Documents générés** :

1. ✅ `QUOTE` (Devis) - Pour le client
2. ✅ `PAYMENT_RECEIPT` (Reçu de paiement) - Pour le client
3. ✅ `BOOKING_CONFIRMATION` (Confirmation de réservation) - Pour le client
4. ✅ `QUOTE` (Devis) - Pour l'équipe interne
5. ✅ `BOOKING_CONFIRMATION` (Confirmation) - Pour l'équipe interne
6. ✅ `DELIVERY_NOTE` (Bon de livraison) - Pour l'équipe interne
7. ✅ `CONTRACT` (Contrat) - Pour l'équipe interne

**Destinataires** :

- 👤 **CLIENT** : Reçoit `QUOTE` + `PAYMENT_RECEIPT` + `BOOKING_CONFIRMATION`
- 👥 **ÉQUIPE INTERNE** (PROFESSIONAL) : Reçoit `QUOTE` + `BOOKING_CONFIRMATION` + `DELIVERY_NOTE` + `CONTRACT`

**Notifications envoyées** :

#### Pour le CLIENT :

- 📧 **Email** : Template `booking-confirmation`
  - Pièces jointes : 3 PDFs groupés (QUOTE, PAYMENT_RECEIPT, BOOKING_CONFIRMATION)
  - Contenu : Confirmation complète, détails service, date, heure, adresse
- 📱 **SMS** : Optionnel (si téléphone disponible)
  - Message de confirmation avec référence et date du service

**API utilisée** : `/api/notifications/business/customer-booking-confirmation`

#### Pour l'ÉQUIPE INTERNE :

- 📧 **Email** : Template `professional-document`
  - Pièces jointes : 4 PDFs groupés (QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT)
  - Contenu : **Données complètes** (nom client, email, téléphone, adresses complètes)
  - Destinataires : Membres selon le type de service (`getStaffForBooking()`)
    - `OPERATIONS_MANAGER` pour tous les services
    - `SERVICE_COORDINATOR` pour services spécifiques
    - `CUSTOMER_SERVICE` pour certains services
- 💬 **WhatsApp** : Optionnel (si téléphone disponible + rôle OPERATIONS_MANAGER ou SERVICE_COORDINATOR)
  - Message avec PDFs opérationnels

**API utilisée** : `/api/notifications/business/internal-staff-booking-confirmation`

**Service responsable** :

- Client : `CustomerDocumentDistributor.distribute()`
- Équipe interne : `InternalStaffDocumentDistributor.distribute()`

**Conditions spéciales** :

- ✅ **Tous les membres éligibles** de l'équipe interne reçoivent des notifications
- ✅ **Données complètes** pour l'équipe interne (accès total aux informations client)
- ⚠️ **Pas de notification aux prestataires** via ce trigger

**Priorité** : 1 (urgente)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

---

### 5. `BOOKING_SCHEDULED` - Planification du service

**Déclencheur** : Le service est planifié (date et heure définies)

**Documents générés** :

- ✅ `DELIVERY_NOTE` (Bon de livraison)

**Destinataires** :

- 👥 **ÉQUIPE INTERNE** (PROFESSIONAL)
- 👤 **CLIENT**

**Conditions** : ⚠️ **Uniquement pour les déménagements** (`BookingType.MOVING_QUOTE`)

**Notifications envoyées** :

- 📧 **Email** : Template `professional-document` (équipe) / `booking-confirmation` (client)
  - Pièce jointe : PDF bon de livraison
  - Contenu : Détails de planification, adresses, horaires

**Service responsable** : `InternalStaffDocumentDistributor.distribute()` + `CustomerDocumentDistributor.distribute()`

**Priorité** : 2 (normale)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

---

### 6. `SERVICE_STARTED` - Début du service

**Déclencheur** : Le service commence (prestataire démarre la mission)

**Documents générés** :

- ✅ `TRANSPORT_MANIFEST` (Bordereau de transport)

**Destinataires** :

- 👥 **ÉQUIPE INTERNE** (PROFESSIONAL) uniquement

**Conditions** : ⚠️ **Uniquement pour les déménagements** (`BookingType.MOVING_QUOTE`)

**Notifications envoyées** :

- 📧 **Email** : Template `professional-document`
  - Pièce jointe : PDF bordereau de transport
  - Contenu : Détails du transport, inventaire, adresses

**Service responsable** : `InternalStaffDocumentDistributor.distribute()`

**Priorité** : 3 (basse)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

---

### 7. `SERVICE_COMPLETED` - Fin du service

**Déclencheur** : Le service est terminé

**Documents générés** :

- ⚠️ **Aucune règle configurée** dans `DocumentRuleEngine`

**Destinataires** : Aucun (pas de règle)

**Notifications envoyées** : Aucune

**Note** : Ce trigger nécessite une configuration personnalisée pour être utilisé.

---

### 8. `BOOKING_CANCELLED` - Annulation de réservation

**Déclencheur** : La réservation est annulée

**Documents générés** :

- ✅ `CANCELLATION_NOTICE` (Avis d'annulation)

**Destinataires** :

- 👤 **CLIENT**
- 👥 **ÉQUIPE INTERNE** (PROFESSIONAL)

**Notifications envoyées** :

- 📧 **Email** : Template `booking-confirmation` (client) / `professional-document` (équipe)
  - Pièce jointe : PDF avis d'annulation
  - Contenu : Raison de l'annulation, remboursement éventuel
- 📱 **SMS** : Optionnel (si téléphone disponible)
  - Message d'annulation avec détails

**Service responsable** :

- Client : `CustomerDocumentDistributor.distribute()`
- Équipe interne : `InternalStaffDocumentDistributor.distribute()`

**Priorité** : 1 (urgente)

**Auto-génération** : ✅ Oui (automatique)

**Approbation requise** : ❌ Non

---

### 9. `BOOKING_MODIFIED` - Modification de réservation

**Déclencheur** : La réservation est modifiée (date, heure, adresse, etc.)

**Documents générés** :

- ✅ `MODIFICATION_NOTICE` (Avis de modification)

**Destinataires** :

- 👤 **CLIENT** uniquement

**Notifications envoyées** :

- 📧 **Email** : Template `booking-confirmation`
  - Pièce jointe : PDF avis de modification
  - Contenu : Détails des modifications, nouvelles informations

**Service responsable** : `CustomerDocumentDistributor.distribute()`

**Priorité** : 2 (normale)

**Auto-génération** : ❌ **Non** (nécessite `forceGeneration: true`)

**Approbation requise** : ✅ **Oui** (nécessite `skipApproval: true` pour contourner)

**Note** : Ce trigger nécessite une approbation manuelle ou des options spéciales.

---

## 🔔 TRIGGERS SYSTÈME (NOTIFICATIONS UNIQUEMENT)

### 10. `SERVICE_REMINDER` - Rappel de service

**Déclencheur** : Rappel programmé (7 jours, 24h, ou 1h avant le service)

**Documents générés** : ❌ Aucun PDF

**Destinataires** :

- 👤 **CLIENT** uniquement

**Notifications envoyées** :

- 📧 **Email** : Template `service-reminder`
  - Contenu : Rappel avec date, heure, adresse du service
  - Type de rappel : `7d`, `24h`, ou `1h`
- 📱 **SMS** : Optionnel selon le type de rappel
  - `7d` : SMS si téléphone disponible
  - `24h` : SMS + Email
  - `1h` : SMS uniquement (URGENT)

**API utilisée** : `/api/notifications/email`

**Service responsable** : `SystemTriggerHandler.handle()`

**Conditions spéciales** :

- Nécessite un `Booking` en entité (pas de `QuoteRequest`)
- Les rappels sont programmés via `scheduled_reminders` dans la base de données
- Traités par des workers BullMQ (cron jobs)

**Priorité** : HIGH

**Flux de programmation** :

1. Lors de `BOOKING_CONFIRMED` ou `PAYMENT_COMPLETED`, le système programme automatiquement 3 rappels :
   - 7 jours avant le service
   - 24 heures avant le service
   - 1 heure avant le service
2. Les workers BullMQ détectent les rappels échus et déclenchent `SERVICE_REMINDER`

---

### 11. `SYSTEM_MAINTENANCE` - Maintenance système

**Déclencheur** : Notification de maintenance planifiée

**Documents générés** : ❌ Aucun PDF

**Destinataires** : ⚠️ **Non implémenté** (nécessite un service de broadcast dédié)

**Notifications envoyées** : Aucune (retourne `success: true` mais ne fait rien)

**Service responsable** : `SystemTriggerHandler.handle()`

**Note** : Ce trigger est défini mais nécessite une implémentation complète d'un service de broadcast.

---

### 12. `SYSTEM_UPDATE` - Mise à jour système

**Déclencheur** : Notification de mise à jour système

**Documents générés** : ❌ Aucun PDF

**Destinataires** : ⚠️ **Non implémenté** (nécessite un service de broadcast dédié)

**Notifications envoyées** : Aucune (retourne `success: true` mais ne fait rien)

**Service responsable** : `SystemTriggerHandler.handle()`

**Note** : Ce trigger est défini mais nécessite une implémentation complète d'un service de broadcast.

---

### 13. `PROMOTIONAL_OFFER` - Offre promotionnelle

**Déclencheur** : Campagne marketing promotionnelle

**Documents générés** : ❌ Aucun PDF

**Destinataires** : ⚠️ **Non implémenté** (nécessite un service de broadcast dédié)

**Notifications envoyées** : Aucune (retourne `success: true` mais ne fait rien)

**Service responsable** : `SystemTriggerHandler.handle()`

**Note** : Ce trigger est défini mais nécessite une implémentation complète d'un service de broadcast marketing.

---

### 14. `NEWSLETTER` - Newsletter marketing

**Déclencheur** : Envoi de newsletter

**Documents générés** : ❌ Aucun PDF

**Destinataires** : ⚠️ **Non implémenté** (nécessite un service de broadcast dédié)

**Notifications envoyées** : Aucune (retourne `success: true` mais ne fait rien)

**Service responsable** : `SystemTriggerHandler.handle()`

**Note** : Ce trigger est défini mais nécessite une implémentation complète d'un service de broadcast marketing.

---

## 🚚 ATTRIBUTION PRESTATAIRES EXTERNES

### Flux indépendant de l'orchestration

**⚠️ IMPORTANT** : Les notifications aux prestataires externes **ne passent PAS** par `DocumentOrchestrationService`. C'est un flux complètement indépendant géré par `AttributionService` et `AttributionNotificationService`.

**Déclencheur** : `PAYMENT_COMPLETED` → `BookingService.triggerProfessionalAttribution()`

**Service responsable** : `AttributionNotificationService.sendAttributionNotifications()`

**Documents générés** :

- ✅ `CONTRACT` (Contrat de mission) - **Données limitées/anonymisées**

**Destinataires** :

- 🚚 **PRESTATAIRES EXTERNES** éligibles (selon distance, type de service, disponibilité)

**Notifications envoyées** :

- 📧 **Email** : Template `professional-attribution`
  - Pièce jointe : PDF contrat avec **données limitées** (nom client anonymisé, adresses partielles)
  - Contenu : Détails de la mission, montant, date, heure
- 💬 **WhatsApp** : Si téléphone disponible
  - Message avec lien vers les détails
- 📱 **SMS** : Si téléphone disponible
  - Message de notification avec référence

**Rappels programmés** :

- ⏰ **Rappel jour J** : Programmé pour 4h du matin le jour du service
  - Email + WhatsApp + SMS avec **données complètes** révélées

**API utilisée** : Appels directs à `getGlobalNotificationService()` (pas d'API HTTP)

**Conditions spéciales** :

- ✅ **Flux indépendant** : Ne passe pas par l'orchestrateur
- ✅ **Données limitées** : Informations client anonymisées pour confidentialité
- ✅ **Données complètes au jour J** : Toutes les informations révélées le jour du service
- ✅ **Filtrage géographique** : Seuls les prestataires dans un rayon défini reçoivent la notification

---

## 🔄 FLUX D'EXÉCUTION DÉTAILLÉ

### Flux principal : `DocumentOrchestrationService.handleTrigger()`

```
1. Vérification du type de trigger
   ↓
   ┌─────────────────────────────────────┐
   │  Est-ce un trigger système ?        │
   └─────────────────────────────────────┘
   │
   ├─→ OUI → SystemTriggerHandler.handle()
   │         ├─→ SERVICE_REMINDER : Email client
   │         └─→ Autres : Retourne success (non implémenté)
   │
   └─→ NON → Vérification entité (Booking/QuoteRequest requis)
              ↓
              DocumentRuleEngine.getApplicableRules()
              ├─→ Filtre par trigger
              ├─→ Évalue les conditions (ex: type de service)
              └─→ Trie par priorité
              ↓
              Filtrage selon options
              ├─→ autoGenerate ? forceGeneration ?
              └─→ requiresApproval ? skipApproval ?
              ↓
              DocumentGenerator.generateBatch()
              ├─→ Génère tous les PDFs en parallèle
              └─→ Retourne Map<Recipient, Document[]>
              ↓
              Distribution aux destinataires
              ├─→ CUSTOMER → CustomerDocumentDistributor
              ├─→ PROFESSIONAL → InternalStaffDocumentDistributor
              └─→ ACCOUNTING/ADMIN → AdministrationDocumentDistributor
              ↓
              Chaque distributor :
              ├─→ Prépare les attachments (PDFs en base64)
              ├─→ Appelle l'API de notification appropriée
              └─→ Envoie 1 email avec tous les PDFs groupés
```

### Flux d'attribution prestataires (indépendant)

```
PAYMENT_COMPLETED
    ↓
BookingService.triggerProfessionalAttribution()
    ↓
AttributionService.startAttribution()
    ├─→ Crée attribution avec status: 'BROADCASTING'
    └─→ Recherche prestataires éligibles (distance, type service)
    ↓
AttributionService.broadcastToEligibleProfessionals()
    ↓
AttributionNotificationService.sendAttributionNotifications()
    ├─→ Génère PDF CONTRACT (données limitées)
    ├─→ Pour chaque prestataire éligible :
    │   ├─→ Email (template: professional-attribution)
    │   ├─→ WhatsApp (si téléphone disponible)
    │   └─→ SMS (si téléphone disponible)
    └─→ Programme rappel jour J (4h du matin)
```

---

## 📊 MATRICE DE DISTRIBUTION

### Vue d'ensemble par trigger

| Trigger              | Documents                                                             | Client | Équipe Interne | Comptabilité | Prestataires | Canaux                 |
| -------------------- | --------------------------------------------------------------------- | ------ | -------------- | ------------ | ------------ | ---------------------- |
| `QUOTE_CREATED`      | QUOTE                                                                 | ✅     | ❌             | ❌           | ❌           | Email + SMS            |
| `QUOTE_ACCEPTED`     | -                                                                     | ❌     | ❌             | ❌           | ❌           | -                      |
| `PAYMENT_COMPLETED`  | PAYMENT_RECEIPT, INVOICE                                              | ✅     | ❌             | ✅           | ⚠️\*         | Email + SMS            |
| `BOOKING_CONFIRMED`  | QUOTE, PAYMENT_RECEIPT, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT | ✅     | ✅             | ❌           | ❌           | Email + SMS + WhatsApp |
| `BOOKING_SCHEDULED`  | DELIVERY_NOTE                                                         | ✅     | ✅             | ❌           | ❌           | Email                  |
| `SERVICE_STARTED`    | TRANSPORT_MANIFEST                                                    | ❌     | ✅             | ❌           | ❌           | Email                  |
| `SERVICE_COMPLETED`  | -                                                                     | ❌     | ❌             | ❌           | ❌           | -                      |
| `BOOKING_CANCELLED`  | CANCELLATION_NOTICE                                                   | ✅     | ✅             | ❌           | ❌           | Email + SMS            |
| `BOOKING_MODIFIED`   | MODIFICATION_NOTICE                                                   | ✅     | ❌             | ❌           | ❌           | Email                  |
| `SERVICE_REMINDER`   | -                                                                     | ✅     | ❌             | ❌           | ❌           | Email + SMS            |
| `SYSTEM_MAINTENANCE` | -                                                                     | ⚠️     | ⚠️             | ⚠️           | ⚠️           | -                      |
| `SYSTEM_UPDATE`      | -                                                                     | ⚠️     | ⚠️             | ⚠️           | ⚠️           | -                      |
| `PROMOTIONAL_OFFER`  | -                                                                     | ⚠️     | ⚠️             | ⚠️           | ⚠️           | -                      |
| `NEWSLETTER`         | -                                                                     | ⚠️     | ⚠️             | ⚠️           | ⚠️           | -                      |

**Légende** :

- ✅ = Implémenté et fonctionnel
- ❌ = Non applicable ou non implémenté
- ⚠️ = Défini mais nécessite implémentation complète
- ⚠️\* = Géré séparément par `AttributionService` (pas via orchestration)

### Vue d'ensemble par destinataire

| Destinataire       | Triggers qui le notifient                                                                                                                   | Documents reçus                                                                                                | Canaux                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **CLIENT**         | `QUOTE_CREATED`, `PAYMENT_COMPLETED`, `BOOKING_CONFIRMED`, `BOOKING_SCHEDULED`, `BOOKING_CANCELLED`, `BOOKING_MODIFIED`, `SERVICE_REMINDER` | QUOTE, PAYMENT_RECEIPT, INVOICE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CANCELLATION_NOTICE, MODIFICATION_NOTICE | Email + SMS            |
| **ÉQUIPE INTERNE** | `BOOKING_CONFIRMED`, `BOOKING_SCHEDULED`, `SERVICE_STARTED`, `BOOKING_CANCELLED`                                                            | QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT, TRANSPORT_MANIFEST, CANCELLATION_NOTICE                  | Email + WhatsApp       |
| **COMPTABILITÉ**   | `PAYMENT_COMPLETED`                                                                                                                         | INVOICE                                                                                                        | Email                  |
| **PRESTATAIRES**   | `PAYMENT_COMPLETED`\*                                                                                                                       | CONTRACT (données limitées)                                                                                    | Email + WhatsApp + SMS |

\*Via `AttributionService` (flux indépendant)

---

## 🔧 ANNEXES TECHNIQUES

### Fichiers sources principaux

1. **DocumentOrchestrationService** : `src/documents/application/services/DocumentOrchestrationService.ts`
   - Service principal d'orchestration
   - Définit les enums `DocumentTrigger` et `DocumentRecipient`
   - Méthode `handleTrigger()` : Point d'entrée principal

2. **DocumentRuleEngine** : `src/documents/application/services/DocumentRuleEngine.ts`
   - Définit toutes les règles de génération par trigger
   - Méthode `getApplicableRules()` : Retourne les règles applicables

3. **SystemTriggerHandler** : `src/documents/application/services/SystemTriggerHandler.ts`
   - Gère les triggers système (notifications sans PDF)
   - Méthode `isSystemTrigger()` : Identifie les triggers système

4. **Distributors** :
   - `CustomerDocumentDistributor.ts` : Distribution aux clients
   - `InternalStaffDocumentDistributor.ts` : Distribution à l'équipe interne
   - `AdministrationDocumentDistributor.ts` : Distribution à la comptabilité

5. **AttributionNotificationService** : `src/bookingAttribution/AttributionNotificationService.ts`
   - Gère les notifications aux prestataires externes (flux indépendant)

### APIs utilisées

| API                                                               | Utilisée par                       | Trigger(s)                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/api/notifications/business/customer-booking-confirmation`       | `CustomerDocumentDistributor`      | `QUOTE_CREATED`, `PAYMENT_COMPLETED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `BOOKING_MODIFIED` |
| `/api/notifications/business/internal-staff-booking-confirmation` | `InternalStaffDocumentDistributor` | `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`                                                           |
| `/api/notifications/business/payment-confirmation`                | `InternalStaffDocumentDistributor` | `PAYMENT_COMPLETED` (comptabilité)                                                                 |
| `/api/notifications/email`                                        | `SystemTriggerHandler`             | `SERVICE_REMINDER`                                                                                 |
| Appels directs à `getGlobalNotificationService()`                 | `AttributionNotificationService`   | Attribution prestataires (via `PAYMENT_COMPLETED`)                                                 |

### Templates utilisés

| Template                   | Utilisé pour                        | Destinataire          |
| -------------------------- | ----------------------------------- | --------------------- |
| `booking-confirmation`     | Confirmations de réservation, devis | Client                |
| `payment-confirmation`     | Confirmations de paiement           | Client                |
| `professional-document`    | Documents opérationnels             | Équipe interne        |
| `professional-attribution` | Attribution de missions             | Prestataires externes |
| `service-reminder`         | Rappels de service                  | Client                |

### Priorités des règles

- **Priorité 1** : Urgente (PAYMENT_COMPLETED, BOOKING_CONFIRMED, BOOKING_CANCELLED)
- **Priorité 2** : Normale (QUOTE_CREATED, BOOKING_SCHEDULED, BOOKING_MODIFIED)
- **Priorité 3** : Basse (SERVICE_STARTED)

### Conditions spéciales

1. **Type de service** : Certains triggers ne s'appliquent qu'aux déménagements (`MOVING_QUOTE`)
   - `BOOKING_SCHEDULED` → `DELIVERY_NOTE`
   - `SERVICE_STARTED` → `TRANSPORT_MANIFEST`

2. **Auto-génération** : Certains documents nécessitent `forceGeneration: true`
   - `BOOKING_MODIFIED` → `MODIFICATION_NOTICE`

3. **Approbation** : Certains documents nécessitent `skipApproval: true`
   - `BOOKING_MODIFIED` → `MODIFICATION_NOTICE`

4. **Données limitées vs complètes** :
   - **Clients** : Données complètes
   - **Équipe interne** : Données complètes
   - **Prestataires** : Données limitées (anonymisées) jusqu'au jour J

---

## 📝 NOTES IMPORTANTES

1. **Flux indépendant des prestataires** : Les notifications aux prestataires externes ne passent **PAS** par `DocumentOrchestrationService`. C'est un flux complètement séparé géré par `AttributionService`.

2. **Triggers non implémentés** : Plusieurs triggers sont définis mais non configurés dans les règles :
   - `QUOTE_ACCEPTED`
   - `SERVICE_COMPLETED`
   - `SYSTEM_MAINTENANCE`, `SYSTEM_UPDATE`, `PROMOTIONAL_OFFER`, `NEWSLETTER`

3. **Groupement des PDFs** : Tous les PDFs pour un même destinataire sont **toujours groupés** dans un seul email (pas d'envoi multiple).

4. **Rappels automatiques** : Les rappels (`SERVICE_REMINDER`) sont programmés automatiquement lors de `BOOKING_CONFIRMED` ou `PAYMENT_COMPLETED` (3 rappels : 7j, 24h, 1h).

5. **Comptabilité** : Seule la comptabilité reçoit des notifications pour `PAYMENT_COMPLETED` (pas toute l'équipe interne).

---

**Document généré automatiquement** - Dernière mise à jour : 2025-12-07
