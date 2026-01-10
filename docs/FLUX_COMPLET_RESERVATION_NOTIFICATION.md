# 🔄 Flux Complet : Réservation → Notification → Provider

## 📋 Cas Concret : Réservation de Déménagement

**Scénario** : Un client (Jean Dupont) confirme une réservation de déménagement via le webhook Stripe.

**Données initiales** :

- Booking ID : `booking_abc123`
- Client : Jean Dupont (`jean.dupont@email.com`, `+33612345678`)
- Service : Déménagement complet (Paris → Lyon)
- Montant : 850€
- Date : 15 mars 2025, 09:00
- Adresse départ : 10 Rue de la Paix, 75001 Paris
- Adresse arrivée : 20 Avenue de la République, 69001 Lyon

---

## 🏗️ Architecture Modulaire (Refactorisation)

### 📦 Services DocumentOrchestrationService

**Orchestrateur** : `DocumentOrchestrationService` (~250 lignes)

- **Responsabilité** : Coordination des services spécialisés

**Services spécialisés** :

1. **`DocumentRuleEngine`** : Sélection des règles applicables selon le trigger
2. **`DocumentGenerator`** : Génération des documents en batch (optimisé)
3. **`CustomerDocumentDistributor`** : Distribution aux clients (endpoint dédié `/api/notifications/business/customer-booking-confirmation`)
4. **`InternalStaffDocumentDistributor`** : Distribution à l'équipe interne (endpoint dédié `/api/notifications/business/internal-staff-booking-confirmation`)
5. **`AdministrationDocumentDistributor`** : Distribution aux services administratifs
6. **`SystemTriggerHandler`** : Gestion des triggers système (maintenance, updates, etc.)

### 📦 Services ProductionNotificationService

**Orchestrateur** : `ProductionNotificationService` (~466 lignes)

- **Responsabilité** : Coordination des services spécialisés

**Services spécialisés** :

1. **`NotificationOrchestrator`** : Orchestration complète (persistance, template, validation, queue)
2. **`TemplateService`** : Gestion des templates (chargement, rendu, cache)
3. **`NotificationValidator`** : Validation et sanitization des notifications
4. **`NotificationSender`** : Envoi des notifications (email, SMS, WhatsApp)
5. **`NotificationWorkers`** : Workers BullMQ pour traitement asynchrone
6. **`ReminderScheduler`** : Programmation des rappels (7j, 24h, 1h)
7. **`BusinessNotificationService`** : Notifications métier spécifiques (quote, booking, payment)
8. **`NotificationHealthChecker`** : Vérification de santé du système
9. **`NotificationRepositoryService`** : CRUD et gestion des notifications

### 📦 Services Dédiés par Type de Destinataire

1. **`CustomerNotificationService`** : Notifications client uniquement
   - Endpoint : `/api/notifications/business/customer-booking-confirmation`
   - Responsabilité : Email + SMS pour les clients

2. **`InternalStaffNotificationService`** : Notifications équipe interne uniquement
   - Endpoint : `/api/notifications/business/internal-staff-booking-confirmation`
   - Responsabilité : Email groupé + WhatsApp pour l'équipe interne

3. **`AttributionNotificationService`** : Notifications prestataires externes
   - Endpoint : `/api/attribution/start`
   - Responsabilité : Email + WhatsApp pour les prestataires (avec PDFs limités)

### ✅ Avantages de l'Architecture Modulaire

1. **Séparation des responsabilités** : Chaque service a une responsabilité unique
2. **Maintenabilité** : Code plus facile à comprendre et modifier
3. **Testabilité** : Services testables indépendamment
4. **Performance** : Optimisations ciblées par service
5. **Évolutivité** : Ajout de nouvelles fonctionnalités sans impacter les autres

---

## 🎯 ÉTAPE 1 : Déclenchement de l'Orchestration

### 📍 Où : `POST /api/documents/orchestrate`

**Fichier** : `src/app/api/documents/orchestrate/route.ts`

**Données reçues** :

```json
{
  "bookingId": "booking_abc123",
  "trigger": "BOOKING_CONFIRMED"
}
```

**Transformation** :

- Le trigger string `"BOOKING_CONFIRMED"` est converti en enum `DocumentTrigger.BOOKING_CONFIRMED`
- Le booking est récupéré depuis la base de données via `PrismaBookingRepository`

**Qui transforme** : `route.ts` (lignes 68-85)

---

## 🎼 ÉTAPE 2 : Orchestration des Documents (Architecture Modulaire)

### 📍 Où : `DocumentOrchestrationService.handleTrigger()`

**Fichier** : `src/documents/application/services/DocumentOrchestrationService.ts`

**✅ ARCHITECTURE MODULAIRE** : Service orchestrateur qui délègue aux services spécialisés :

- `DocumentRuleEngine` : Sélection des règles applicables selon le trigger
- `DocumentGenerator` : Génération des documents en batch (optimisé)
- `CustomerDocumentDistributor` : Distribution aux clients (endpoint dédié)
- `InternalStaffDocumentDistributor` : Distribution à l'équipe interne (endpoint dédié)
- `AdministrationDocumentDistributor` : Distribution aux services administratifs
- `SystemTriggerHandler` : Gestion des triggers système (maintenance, updates, etc.)

**Flux** :

#### 2.1 Sélection des Règles Applicables

**Qui** : `DocumentRuleEngine.getApplicableRules(trigger, booking)`

**Fichier** : `src/documents/application/services/DocumentRuleEngine.ts`

**✅ NOUVEAU** : Service dédié à la logique de règles (séparation des responsabilités)

**Transformation** :

- Filtre les règles par trigger `BOOKING_CONFIRMED`
- Pour notre cas, trouve **4 règles** :
  1. `QUOTE` → `DocumentRecipient.CUSTOMER`
  2. `QUOTE` → `DocumentRecipient.PROFESSIONAL`
  3. `BOOKING_CONFIRMATION` → `DocumentRecipient.PROFESSIONAL`
  4. `CONTRACT` → `DocumentRecipient.PROFESSIONAL`

**Données après transformation** :

```typescript
applicableRules = [
  { documentType: 'QUOTE', recipients: ['CUSTOMER'], ... },
  { documentType: 'QUOTE', recipients: ['PROFESSIONAL'], ... },
  { documentType: 'BOOKING_CONFIRMATION', recipients: ['PROFESSIONAL'], ... },
  { documentType: 'CONTRACT', recipients: ['PROFESSIONAL'], ... }
]
```

#### 2.2 Génération des Documents en Batch

**Qui** : `DocumentGenerator.generateBatch(rules, booking, options)`

**Fichier** : `src/documents/application/services/DocumentGenerator.ts`

**✅ NOUVEAU** : Service dédié à la génération en batch (optimisation performance)

**Transformation** :

- Génère tous les documents en une seule passe (parallélisation possible)
- Pour chaque règle, appelle `DocumentService.generateDocument()` qui :
  - Récupère les données du booking (client, adresses, montant, dates)
  - Génère un PDF via `pdfkit` ou `puppeteer`
  - Crée une entité `Document` avec le contenu PDF (Buffer)
- **Optimisation** : Regroupe les documents par destinataire automatiquement

**Transformation des données** :

```typescript
// AVANT (Booking Entity)
{
  id: "booking_abc123",
  customerId: "cust_123",
  totalAmount: 850,
  scheduledDate: "2025-03-15T09:00:00Z",
  pickupAddress: "10 Rue de la Paix, 75001 Paris",
  deliveryAddress: "20 Avenue de la République, 69001 Lyon"
}

// APRÈS (Document Entity)
{
  id: "doc_quote_abc123",
  type: "QUOTE",
  filename: "Devis_EQ-ABC123.pdf",
  content: Buffer<PDF bytes>, // ~50KB
  bookingId: "booking_abc123"
}
```

**Résultat** : 4 documents générés (QUOTE client, QUOTE équipe, BOOKING_CONFIRMATION, CONTRACT)

#### 2.3 Regroupement par Destinataire

**Qui** : `DocumentGenerator.generateBatch()` retourne une `Map<Recipient, Document[]>`

**Transformation** :

- Les documents sont automatiquement regroupés par `DocumentRecipient` :
  ```typescript
  generatedDocuments = Map {
    'CUSTOMER' => [Document(QUOTE)],
    'PROFESSIONAL' => [Document(QUOTE), Document(BOOKING_CONFIRMATION), Document(CONTRACT)]
  }
  ```

#### 2.4 Distribution Groupée via Distributors

**Qui** : `DocumentOrchestrationService.distributeToRecipient()`

**Transformation** :

- Pour chaque destinataire, délègue au distributor approprié :
  - `CUSTOMER` → `CustomerDocumentDistributor.distribute()`
  - `PROFESSIONAL` → `InternalStaffDocumentDistributor.distribute()`
  - `ADMIN` / `ACCOUNTING` → `AdministrationDocumentDistributor.distribute()`

---

## 📧 ÉTAPE 3 : Distribution des Documents au Client

### 📍 Où : `CustomerDocumentDistributor.distribute()`

**Fichier** : `src/documents/application/services/distributors/CustomerDocumentDistributor.ts`

**Transformation des données** :

#### 3.1 Extraction des Données Booking

**Qui** : `CustomerDocumentDistributor.distribute()`

**Données extraites** :

```typescript
{
  customerEmail: "jean.dupont@email.com",
  customerName: "Jean Dupont",
  customerPhone: "+33612345678",
  entityId: "booking_abc123",
  entityReference: "EQ-ABC123",
  serviceType: "MOVING_QUOTE",
  totalAmount: 850,
  serviceDate: "2025-03-15",
  serviceTime: "09:00",
  serviceAddress: "10 Rue de la Paix, 75001 Paris"
}
```

#### 3.2 Préparation des Pièces Jointes (PDFs groupés)

**Qui** : `CustomerDocumentDistributor.distribute()`

**Transformation** :

- Pour chaque document, convertit le Buffer PDF en base64 :

  ```typescript
  // AVANT
  document.getContent() = Buffer<PDF bytes> // ~50KB

  // APRÈS
  attachmentData = {
    filename: "Devis_EQ-ABC123.pdf",
    content: "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFJ...", // base64
    mimeType: "application/pdf",
    size: 51200
  }
  ```

- **Validation** : Vérifie que chaque PDF n'est pas vide (> 361 bytes)

#### 3.3 Appel API Notification Client (Nouveau Endpoint Dédié)

**Qui** : `CustomerDocumentDistributor.distribute()`

**Endpoint appelé** : `POST /api/notifications/business/customer-booking-confirmation`

**Fichier** : `src/app/api/notifications/business/customer-booking-confirmation/route.ts`

**Transformation finale** :

```typescript
// Données envoyées à l'API
{
  email: "jean.dupont@email.com",
  customerName: "Jean Dupont",
  customerPhone: "+33612345678",
  bookingId: "booking_abc123",
  bookingReference: "EQ-ABC123",
  serviceType: "MOVING_QUOTE",
  serviceDate: "2025-03-15",
  serviceTime: "09:00",
  serviceAddress: "10 Rue de la Paix, 75001 Paris",
  totalAmount: 850,
  depositAmount: 0,
  depositPaid: false,
  attachments: [{
    filename: "Devis_EQ-ABC123.pdf",
    content: "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFJ...",
    mimeType: "application/pdf",
    size: 51200
  }],
  attachedDocuments: [{
    type: "QUOTE",
    filename: "Devis_EQ-ABC123.pdf",
    size: 51200
  }]
}
```

**✅ NOUVEAU** : Endpoint dédié aux clients (séparation des responsabilités)

---

## 🎨 ÉTAPE 4 : Traitement par le Service Client

### 📍 Où : `CustomerNotificationService.sendBookingConfirmation()`

**Fichier** : `src/notifications/application/services/CustomerNotificationService.ts`

**✅ NOUVEAU** : Service dédié aux notifications client (séparation des responsabilités)

**Flux** :

#### 4.1 Normalisation des Attachments

**Qui** : `CustomerNotificationService.normalizeAttachments()`

**Transformation** :

- Valide que chaque attachment a un contenu base64 valide
- Vérifie les tailles et types MIME

#### 4.2 Préparation des Données Template

**Qui** : `CustomerNotificationService.sendBookingConfirmation()`

**Transformation** :

```typescript
templateData = {
  customerName: "Jean Dupont",
  bookingId: "booking_abc123",
  bookingReference: "EQ-ABC123",
  serviceType: "MOVING_QUOTE",
  serviceName: "Service MOVING_QUOTE",
  serviceDate: "2025-03-15",
  serviceTime: "09:00",
  serviceAddress: "10 Rue de la Paix, 75001 Paris",
  totalAmount: 850,
  depositAmount: 0,
  depositPaid: false,
  currency: "EUR",
  viewBookingUrl: "https://express-quote.com/bookings/booking_abc123",
  supportUrl: "https://express-quote.com/contact",
  companyName: "Express Quote",
};
```

#### 4.3 Envoi Email + SMS via ProductionNotificationService

**Qui** : `CustomerNotificationService.sendBookingConfirmation()`

**Transformation** :

- Appelle `ProductionNotificationService.sendEmail()` pour l'email avec PDFs
- Appelle `ProductionNotificationService.sendSMS()` pour le SMS de confirmation
- Les deux sont ajoutés à la queue BullMQ séparément

---

## 🎨 ÉTAPE 5 : Application du Template React Email (Architecture Modulaire)

### 📍 Où : `TemplateService.applyTemplate()`

**Fichier** : `src/notifications/application/services/templates/TemplateService.ts`

**✅ NOUVEAU** : Service dédié à la gestion des templates (séparation des responsabilités)

**Flux** :

#### 5.1 Recherche du Template

**Qui** : `TemplateService.applyTemplate(notification)`

**Transformation** :

- Cherche `"booking-confirmation"` dans `templateRegistry` (Map chargée au démarrage depuis JSON)
- Si non trouvé, essaie `"booking-confirmation-email"` (fallback)
- **Cache** : Utilise `TemplateCache` pour optimiser les performances

**Résultat** : `NotificationTemplate` trouvé avec :

- ID : `"booking-confirmation-email"`
- Type : `EMAIL_HTML`
- Contenu : Template React Email ou HTML basique

#### 5.2 Mapping des Variables

**Qui** : `TemplateService.applyTemplate()`

**Transformation** :

- Mappe les variables pour compatibilité :

  ```typescript
  // AVANT
  {
    quoteNumber: "EQ-ABC123",
    subtotalAmount: 850
  }

  // APRÈS (mapping)
  {
    quoteReference: "EQ-ABC123",  // quoteNumber → quoteReference
    totalAmount: 850              // subtotalAmount → totalAmount
  }
  ```

#### 5.3 Rendu du Template React Email

**Qui** : `template.render(language, mappedVariables)`

**Fichier** : `src/notifications/core/entities/NotificationTemplate.ts`

**Transformation** :

**a) Validation des Variables** :

- Vérifie que toutes les variables requises sont présentes
- Enrichit avec valeurs par défaut si manquantes

**b) Rendu React Email** :

- Appelle `renderEmailTemplate()` qui :
  1. Essaie `tryRenderWithReactEmail()` :
     - Charge le composant React Email depuis `EMAIL_TEMPLATES`
     - Mappe les variables pour correspondre aux props React
     - Rend avec `renderToStaticMarkup()` → HTML complet (~15k caractères)
     - **✅ CORRECTION GMAIL** :
       - Ajoute `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`
       - Ajoute `<meta charset="UTF-8">`
       - Remplace les caractères spéciaux par entités HTML dans le footer :
         - `©` → `&copy;`
         - `réservés` → `r&eacute;serv&eacute;s`
         - `Gérer` → `G&eacute;rer`
         - `préférences` → `pr&eacute;f&eacute;rences`
         - `désinscrire` → `d&eacute;sinscrire`
  2. Si échec, fallback vers HTML basique :
     - Utilise `content.body` depuis JSON
     - Interpole les variables `{{var}}` → HTML simple (~500-1000 caractères)

**c) Interpolation du Sujet** :

- Remplace `{{bookingReference}}` dans le sujet :

  ```typescript
  // AVANT
  subject: "Confirmation de votre devis - {{bookingReference}}";

  // APRÈS
  subject: "Confirmation de votre devis - EQ-ABC123";
  ```

**Résultat** :

```typescript
{
  subject: "Confirmation de votre devis - EQ-ABC123",
  body: "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">...<h1>Bonjour Jean Dupont</h1>...", // HTML final avec UTF-8
  textBody: "Bonjour Jean Dupont\n\nVotre devis EQ-ABC123...",
  metadata: {
    templateId: "booking-confirmation-email",
    language: "fr",
    version: "1.0.0",
    renderTime: new Date(),
    variablesUsed: ["customerName", "bookingReference", ...]
  }
}
```

#### 5.4 Retour de la Notification Rendu

**Qui** : `ProductionNotificationService.applyTemplate()`

**Transformation finale** :

```typescript
// AVANT (notification entrante)
{
  id: "notif_123",
  templateId: "booking-confirmation",
  variables: { customerName: "Jean Dupont", ... },
  content: undefined,  // Pas encore rendu
  subject: undefined   // Pas encore rendu
}

// APRÈS (notification rendue)
{
  id: "notif_123",
  templateId: "booking-confirmation",
  variables: { customerName: "Jean Dupont", ... },
  content: "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">...",  // ✅ HTML final avec UTF-8
  subject: "Confirmation de votre devis - EQ-ABC123"  // ✅ Sujet final
}
```

---

## 📬 ÉTAPE 6 : Orchestration et Ajout à la Queue BullMQ (Architecture Modulaire)

### 📍 Où : `NotificationOrchestrator.sendNotification()`

**Fichier** : `src/notifications/application/services/orchestrators/NotificationOrchestrator.ts`

**✅ NOUVEAU** : Service orchestrateur dédié (séparation des responsabilités)

**Flux** :

#### 6.1 Persistance en Base de Données

**Qui** : `NotificationOrchestrator.sendNotification()` → `notificationRepository.create()`

**Transformation** :

- Crée une entrée dans la table `notifications` :
  ```sql
  INSERT INTO notifications (
    id, recipient_id, channel, template_id,
    content, subject, status, metadata
  ) VALUES (
    'notif_123',
    'jean.dupont@email.com',
    'EMAIL',
    'booking-confirmation',
    '<!DOCTYPE html>...',  -- HTML final
    'Confirmation de votre devis - EQ-ABC123',
    'PENDING',
    '{"attachments": [{"filename": "Devis_EQ-ABC123.pdf", "content": "JVBERi0xLjQK..."}]}'
  )
  ```

#### 6.2 Application du Template

**Qui** : `NotificationOrchestrator.sendNotification()` → `TemplateService.applyTemplate()`

**✅ NOUVEAU** : Délégation au `TemplateService` (déjà détaillé à l'étape 5)

**Résultat** : Notification avec `content` et `subject` rendus

#### 6.3 Validation et Nettoyage

**Qui** : `NotificationOrchestrator.sendNotification()` → `NotificationValidator.validateAndSanitizeNotification()`

**✅ NOUVEAU** : Service dédié à la validation (séparation des responsabilités)

**Transformation** :

- Valide le format de l'email, le contenu HTML
- Nettoie le contenu (sanitization) pour sécurité
- Vérifie les limites de taille

#### 6.4 Mise à Jour en Base

**Qui** : `NotificationOrchestrator.sendNotification()` → `notificationRepository.update()`

**Transformation** :

- Met à jour la notification avec le contenu final :
  ```sql
  UPDATE notifications
  SET content = '<!DOCTYPE html>...',  -- HTML final avec UTF-8
      subject = 'Confirmation de votre devis - EQ-ABC123'
  WHERE id = 'notif_123'
  ```

#### 6.5 Rate Limiting

**Qui** : `NotificationOrchestrator.sendNotification()` → `rateLimiter.checkLimit()`

**✅ NOUVEAU** : Vérification des limites de débit avant envoi

#### 6.6 Ajout à la Queue

**Qui** : `NotificationOrchestrator.sendNotification()` → `queueManager.addJob('email', notification)`

**Fichier** : `src/notifications/infrastructure/queue/queue.manager.production.ts`

**Transformation** :

- Ajoute un job BullMQ à la queue `email` :
  ```typescript
  {
    id: "job_email_notif_123",
    name: "email",
    data: {
      id: "notif_123",
      recipient: "jean.dupont@email.com",
      content: "<!DOCTYPE html>...",  // HTML final
      subject: "Confirmation de votre devis - EQ-ABC123",
      metadata: {
        attachments: [{
          filename: "Devis_EQ-ABC123.pdf",
          content: "JVBERi0xLjQK..."  // base64
        }]
      }
    },
    opts: {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }
  ```

**Résultat** : Job ajouté à Redis (queue `bull:email:waiting`)

---

## ⚙️ ÉTAPE 7 : Traitement par le Worker

### 📍 Où : `NotificationWorkers.processEmailNotification()`

**Fichier** : `src/notifications/application/services/workers/NotificationWorkers.ts`

**Flux** :

#### 7.1 Récupération du Job (Worker BullMQ)

**Qui** : Worker `email` (créé au démarrage)

**Transformation** :

- Le worker récupère le job depuis Redis
- Met à jour le statut en base : `PENDING` → `SENDING`

#### 7.2 Traitement de la Notification

**Qui** : `NotificationWorkers.processEmailNotification(notification)`

**Transformation** :

**a) Récupération des Métadonnées** :

```typescript
attachments = notification.metadata.attachments || [];
// [
//   {
//     filename: "Devis_EQ-ABC123.pdf",
//     content: "JVBERi0xLjQK...",  // base64 string
//     mimeType: "application/pdf"
//   }
// ]
```

**b) Conversion des Attachments** :

```typescript
// AVANT
attachments = [
  {
    content: "JVBERi0xLjQK...", // base64 string
  },
];

// APRÈS (pour Nodemailer)
attachments = [
  {
    filename: "Devis_EQ-ABC123.pdf",
    content:
      typeof att.content === "string"
        ? att.content // Garde la string base64
        : att.content?.toString("base64"), // Convertit Buffer en base64
    contentType: "application/pdf",
  },
];
```

**c) Préparation du Message Email** :

```typescript
emailMessage = {
  to: "jean.dupont@email.com",
  subject: "Confirmation de votre devis - EQ-ABC123", // ✅ Sujet final
  html: "<!DOCTYPE html>...", // ✅ HTML final (React Email ou fallback)
  attachments: [
    {
      filename: "Devis_EQ-ABC123.pdf",
      content: "JVBERi0xLjQK...", // ✅ String base64 (sera converti en Buffer par l'adapter)
      contentType: "application/pdf",
    },
  ],
};
```

---

## 📤 ÉTAPE 7 : Envoi via l'Adapter Email

### 📍 Où : `RobustEmailAdapter.sendEmail()`

**Fichier** : `src/notifications/infrastructure/adapters/email.adapter.production.ts` (lignes 397-554)

**Flux** :

#### 7.1 Validation du Message (lignes 414-415)

**Qui** : `validateMessage(message)`

**Vérifie** :

- Email destinataire valide
- Sujet non vide
- HTML ou texte présent

#### 7.2 Préparation des Options Nodemailer (lignes 418-438)

**Qui** : `sendEmail()`

**Transformation** :

```typescript
// AVANT
{
  html: "<!DOCTYPE html>...",
  attachments: [Buffer]
}

// APRÈS (mailOptions pour Nodemailer)
{
  from: "noreply@express-quote.com",
  to: "jean.dupont@email.com",
  subject: "Confirmation de votre devis - EQ-ABC123",  // ✅ Encodé en UTF-8
  html: "<!DOCTYPE html>...",  // ✅ HTML avec charset UTF-8 et entités HTML
  text: "Bonjour Jean Dupont...",  // ✅ Version texte pour compatibilité Gmail
  attachments: [{
    filename: "Devis_EQ-ABC123.pdf",  // ✅ Encodé en UTF-8
    content: Buffer<PDF bytes>,  // ✅ Buffer valide (non vide)
    contentType: "application/pdf",
    contentDisposition: "attachment",  // ✅ Explicite pour Gmail
    // ❌ NE PAS définir encoding - Nodemailer le gère automatiquement
  }],
  headers: {
    'MIME-Version': '1.0',  // ✅ Standard MIME pour compatibilité Gmail
    'Content-Type': 'text/html; charset=UTF-8',
    'Message-ID': '<timestamp-random@express-quote.com>',  // ✅ ID unique
    'X-Mailer': 'Express Quote Notification System'
  }
}
```

**✅ CORRECTIONS GMAIL APPLIQUÉES** :

1. **Encodage UTF-8** : Sujet et HTML explicitement en UTF-8
2. **Attachments** : Format Nodemailer correct avec `contentDisposition: 'attachment'`
3. **Headers MIME** : `MIME-Version: 1.0` pour compatibilité Gmail
4. **Version texte** : Génération automatique si absente (pour compatibilité Gmail)
5. **Validation Buffer** : Vérification que les PDFs ne sont pas vides avant envoi

#### 7.3 Envoi SMTP (lignes 486-520)

**Qui** : `transporter.sendMail(mailOptions)`

**Transformation finale** :

- Nodemailer convertit le message en format SMTP
- Envoie via le serveur SMTP configuré (ex: Gmail, SendGrid)
- Le serveur SMTP transforme en email MIME standard

**Résultat** :

- Email délivré à `jean.dupont@email.com`
- Contenu HTML affiché dans le client email
- PDF attaché (`Devis_EQ-ABC123.pdf`)

---

## 📊 Résumé des Transformations de Données

| Étape                      | Qui                                                                                                       | Transformation             | Format Entrant           | Format Sortant                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------ | --------------------------------------- |
| 1. Déclenchement           | `route.ts`                                                                                                | String → Enum              | `"BOOKING_CONFIRMED"`    | `DocumentTrigger.BOOKING_CONFIRMED`     |
| 2.1 Sélection Règles       | `DocumentRuleEngine.getApplicableRules()`                                                                 | Booking → Règles           | `Booking`                | `DocumentRule[]`                        |
| 2.2 Génération PDF         | `DocumentGenerator.generateBatch()`                                                                       | Booking → PDF              | `Booking`                | `Document` (Buffer)                     |
| 2.3 Regroupement           | `DocumentGenerator.generateBatch()`                                                                       | Documents → Map            | `Document[]`             | `Map<Recipient, Document[]>`            |
| 3.1 Extraction Données     | `CustomerDocumentDistributor.distribute()`                                                                | Booking → Objet            | `Booking`                | `{customerName, bookingReference, ...}` |
| 3.2 Conversion PDF         | `CustomerDocumentDistributor.distribute()`                                                                | Buffer → Base64            | `Buffer<PDF>`            | `string` (base64)                       |
| 4.1 Normalisation          | `CustomerNotificationService.normalizeAttachments()`                                                      | Attachments → Validés      | `Attachment[]`           | `Attachment[]` (validés)                |
| 4.2 Préparation Template   | `CustomerNotificationService.sendBookingConfirmation()`                                                   | Données → Template Data    | `Booking Data`           | `TemplateData`                          |
| 5.1 Recherche Template     | `TemplateService.applyTemplate()`                                                                         | ID → Template              | `"booking-confirmation"` | `NotificationTemplate`                  |
| 5.2 Mapping Variables      | `TemplateService.applyTemplate()`                                                                         | Variables → Mappées        | `{quoteNumber}`          | `{quoteReference}`                      |
| 5.3 Rendu React Email      | `template.render()`                                                                                       | Template + Vars → HTML     | `Template` + `Variables` | `HTML` (15k+ avec UTF-8)                |
| 5.4 Interpolation Sujet    | `template.render()`                                                                                       | Template → Sujet           | `"{{bookingReference}}"` | `"EQ-ABC123"`                           |
| 6.1 Persistance            | `NotificationOrchestrator.sendNotification()` → `repository.create()`                                     | Notification → DB          | `NotificationMessage`    | `Prisma Notification`                   |
| 6.3 Validation             | `NotificationOrchestrator.sendNotification()` → `NotificationValidator.validateAndSanitizeNotification()` | Notification → Validée     | `NotificationMessage`    | `NotificationMessage` (sanitized)       |
| 6.6 Ajout Queue            | `NotificationOrchestrator.sendNotification()` → `queueManager.addJob()`                                   | Notification → Job         | `NotificationMessage`    | `BullMQ Job`                            |
| 7.2 Conversion Attachments | `NotificationWorkers.processEmailNotification()`                                                          | Base64 → Format Nodemailer | `string` (base64)        | `{filename, content, contentType}`      |
| 7.2 Options Nodemailer     | `RobustEmailAdapter.sendEmail()`                                                                          | Message → Options          | `EmailMessage`           | `Nodemailer Options` (avec UTF-8)       |
| 7.3 Envoi SMTP             | `transporter.sendMail()`                                                                                  | Options → SMTP             | `Nodemailer Options`     | `SMTP MIME` (compatible Gmail)          |

---

## 🔑 Points Clés

1. **Architecture Modulaire** :
   - `DocumentOrchestrationService` : Orchestrateur avec services spécialisés (DocumentRuleEngine, DocumentGenerator, Distributors)
   - `ProductionNotificationService` : Orchestrateur avec services spécialisés (NotificationOrchestrator, TemplateService, NotificationValidator, NotificationSender, etc.)
   - Services dédiés : `CustomerNotificationService`, `InternalStaffNotificationService` (séparation des responsabilités)

2. **Templates React Email** :
   - Rendu côté serveur avec fallback HTML basique automatique
   - **✅ CORRECTION GMAIL** : Encodage UTF-8 explicite avec entités HTML pour caractères spéciaux

3. **PDF en Base64** :
   - Conversion Buffer → Base64 pour stockage
   - Base64 → Buffer pour envoi via Nodemailer
   - **✅ CORRECTION GMAIL** : Validation des Buffers (non vides) et format Nodemailer correct

4. **Queue Asynchrone** :
   - Les notifications sont traitées par des workers BullMQ en arrière-plan
   - Workers spécialisés : `NotificationWorkers` (email, SMS, WhatsApp)

5. **Transformation Progressive** :
   - Les données sont transformées à chaque étape, jamais en une seule fois
   - Validation et sanitization à chaque niveau

6. **Résilience** :
   - Circuit breakers, retries, et fallbacks à chaque niveau
   - Rate limiting pour éviter la surcharge
   - Health checks pour monitoring

7. **Compatibilité Gmail** :
   - Encodage UTF-8 explicite (sujet, HTML, attachments)
   - Headers MIME standards (`MIME-Version: 1.0`)
   - Format attachments correct (`contentDisposition: 'attachment'`)
   - Version texte automatique si absente

---

## 📝 Notes Techniques

- **Taille HTML** : React Email génère ~15k caractères (avec UTF-8 et entités HTML), HTML basique ~500-1000 caractères
- **Taille PDF** : Généralement 20-100KB selon le contenu
- **Base64 Overhead** : ~33% de taille supplémentaire (50KB → 67KB en base64)
- **Latence** : Génération PDF (~200ms) + Rendu template (~50ms) + Validation (~10ms) + Envoi SMTP (~500ms) = ~760ms total
- **Architecture Modulaire** :
  - `DocumentOrchestrationService` : ~250 lignes (orchestrateur)
  - `ProductionNotificationService` : ~466 lignes (orchestrateur)
  - Services spécialisés : 50-300 lignes chacun (responsabilité unique)
- **Compatibilité Email** :
  - Outlook : ✅ Fonctionne correctement
  - Gmail : ✅ Encodage UTF-8 corrigé, format attachments amélioré
  - Autres clients : ✅ Compatible avec standards MIME
