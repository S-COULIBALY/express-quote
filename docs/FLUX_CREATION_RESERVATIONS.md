# Flux complet de création des réservations

> Documentation du parcours complet depuis la soumission du formulaire jusqu'à la création de la réservation (Booking) en base de données.

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUX DE CRÉATION DE RÉSERVATION                      │
│                                                                             │
│  1. Formulaire (page.tsx)                                                   │
│     └─► handleSubmitFromPaymentCard()                                       │
│          └─► Enrichissement cross-selling + prix scénario                   │
│                                                                             │
│  2. Hook de soumission (useUnifiedSubmission.tsx)                           │
│     └─► Validation → Retry (3x) → POST /api/quotesRequest                 │
│                                                                             │
│  3. API Route (route.ts)                                                    │
│     └─► QuoteRequestController.createQuoteRequest()                        │
│                                                                             │
│  4. Controller (QuoteRequestController.ts)                                  │
│     └─► Extraction données → Recalcul serveur (audit) → Signature HMAC    │
│                                                                             │
│  5. Service (QuoteRequestService.ts)                                        │
│     └─► Validation → Création entité QuoteRequest → Sauvegarde             │
│                                                                             │
│  6. Repository (PrismaQuoteRequestRepository.ts)                           │
│     └─► Prisma create → QuoteRequest en BDD (status: TEMPORARY)           │
│                                                                             │
│  7. Redirection → /booking/:temporaryId                                    │
│                                                                             │
│  8. Page Booking → Stripe PaymentIntent                                    │
│     └─► POST /api/payment/create-session                                   │
│                                                                             │
│  9. Webhook Stripe → Confirmation paiement                                 │
│     └─► QuoteRequest status: CONVERTED                                     │
│     └─► Création Booking en BDD                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Étape 1 — Soumission du formulaire (Frontend)

**Fichier** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`

### Déclencheur

L'utilisateur clique sur le bouton de soumission dans `PaymentPriceSection`, ce qui appelle `handleSubmitFromPaymentCard(options)`.

### Données collectées

```typescript
const handleSubmitFromPaymentCard = async (options) => {
  // 1. Récupération des données du formulaire
  const formData = formRef.current?.getFormData() || {};

  // 2. Enrichissement avec les données cross-selling
  //    (depuis CrossSellingContext via useCrossSellingOptional)
  let enrichedFormData = { ...formData };
  if (crossSelling) {
    const pricingData = crossSelling.getSelectionForPricing();
    enrichedFormData = {
      ...enrichedFormData,
      packing: pricingData.packing,
      dismantling: pricingData.dismantling,
      reassembly: pricingData.reassembly,
      cleaningEnd: pricingData.cleaningEnd,
      temporaryStorage: pricingData.storage,
      storageDurationDays: crossSelling.formContext?.storageDurationDays,
      piano: pricingData.hasPiano,
      safe: pricingData.hasSafe,
      artwork: pricingData.hasArtwork,
      crossSellingSuppliesTotal: pricingData.suppliesTotal,
      crossSellingSuppliesDetails: pricingData.suppliesDetails,
      crossSellingServicesTotal: pricingData.servicesTotal,
      crossSellingGrandTotal: pricingData.grandTotal,
    };
  }

  // 3. Calcul du prix final (scénario + options)
  const scenarioPrice = options.calculatedPrice;  // Prix du scénario sélectionné
  const totalPriceWithOptions = scenarioPrice
    + (options.fragileProtectionAmount || 0)
    + (options.insurancePremium || 0);

  // 4. Construction du payload final
  const dataWithOptions = {
    ...enrichedFormData,
    calculatedPrice: scenarioPrice,
    totalPrice: totalPriceWithOptions,
    selectedScenario: options.selectedScenario,
    fragileProtection: options.fragileProtection,
    fragileProtectionAmount: options.fragileProtectionAmount,
    declaredValueInsurance: options.declaredValueInsurance,
    declaredValue: options.declaredValue,
    insurancePremium: options.insurancePremium,
  };

  // 5. Soumission via le hook unifié
  await submissionHook.submit(dataWithOptions);
};
```

### Structure des données envoyées

| Catégorie | Champs |
|-----------|--------|
| **Planification** | `scheduledDate` / `dateSouhaitee`, `flexibilite`, `horaire` |
| **Adresses** | `pickupAddress`, `deliveryAddress`, codes postaux, villes |
| **Logistique** | `pickupFloor`, `deliveryFloor`, `pickupElevator`, `deliveryElevator`, `pickupCarryDistance`, `deliveryCarryDistance`, `pickupFurnitureLift`, `deliveryFurnitureLift`, `pickupLogistics`, `deliveryLogistics` |
| **Volume** | `estimatedVolume` (calculateur V3) |
| **Cross-selling** | `packing`, `dismantling`, `reassembly`, `cleaningEnd`, `temporaryStorage`, `storageDurationDays`, `piano`, `safe`, `artwork` |
| **Totaux cross-selling** | `crossSellingSuppliesTotal`, `crossSellingServicesTotal`, `crossSellingGrandTotal` |
| **Prix** | `calculatedPrice` (prix scénario), `totalPrice` (prix total avec options), `selectedScenario` |
| **Assurance** | `fragileProtection`, `fragileProtectionAmount`, `declaredValueInsurance`, `declaredValue`, `insurancePremium` |
| **Contact** | `nom`, `email`, `telephone` |

---

## Étape 2 — Hook de soumission unifié

**Fichier** : `src/hooks/generic/useUnifiedSubmission.tsx`

### Validation

```typescript
const validation = validateSubmissionData(formData, config, currentExtraData);
// Utilise config.validateFormData() de demenagementSurMesureSubmissionConfig
// Vérifie : date (dateSouhaitee || scheduledDate), adresses départ/arrivée
```

### Préparation des données

```typescript
const requestData = config.prepareRequestData(formData, currentExtraData);
// Appelle demenagementSurMesureSubmissionConfig.prepareRequestData()
// Structure les données avec les bons noms de champs
```

### Construction du payload API

```typescript
// Priorité au prix du scénario sélectionné sur le prix recommandé
const submittedPrice = requestData.calculatedPrice || calculatedPrice;
const submittedTotalPrice = requestData.totalPrice || submittedPrice;

const quoteRequestData = {
  serviceType: 'MOVING',
  quoteData: {
    ...requestData,
    calculatedPrice: submittedPrice,
    totalPrice: submittedTotalPrice,
    submissionDate: new Date().toISOString(),
    catalogId,
    catalogSelectionId: catalogId,
    __presetSnapshot: presetSnapshot
  }
};
```

### Retry automatique

- **3 tentatives** avec backoff exponentiel (1s, 2s, 4s)
- Toast d'erreur avec bouton "Réessayer" si l'erreur est retryable

### Appel API

```typescript
const response = await fetch('/api/quotesRequest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(quoteRequestData)
});
```

---

## Étape 3 — API Route (Next.js)

**Fichier** : `src/app/api/quotesRequest/route.ts`

Point d'entrée HTTP. Instancie la chaîne de traitement :

```typescript
export async function POST(request: NextRequest) {
  const repository = new PrismaQuoteRequestRepository();
  const service = new QuoteRequestService(repository);
  const controller = new QuoteRequestController(service);

  const body = await request.json();
  const result = await controller.createQuoteRequest({ body });

  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
```

---

## Étape 4 — Controller

**Fichier** : `src/quotation/interfaces/http/controllers/QuoteRequestController.ts`

### 4.1 Extraction des données

Le controller extrait les données du `quoteData` avec support d'alias :

```typescript
const { serviceType, quoteData } = req.body;

// Alias logistique (frontend envoie pickupLogistics, ancien code attendait pickupLogisticsConstraints)
const pickupLogistics = quoteData.pickupLogistics || quoteData.pickupLogisticsConstraints;
const deliveryLogistics = quoteData.deliveryLogistics || quoteData.deliveryLogisticsConstraints;
```

### 4.2 Extraction des services additionnels

```typescript
const additionalServices: Record<string, boolean> = {};
const crossSellingFlags = [
  'packing', 'dismantling', 'reassembly', 'cleaningEnd',
  'temporaryStorage', 'piano', 'safe', 'artwork'
] as const;

crossSellingFlags.forEach(flag => {
  if (quoteData[flag] === true) {
    additionalServices[flag] = true;
  }
});
```

### 4.3 Recalcul serveur (sécurité / audit)

Le serveur recalcule le prix de base via `BaseCostEngine` pour vérification et audit :

```typescript
const baseCostEngine = new BaseCostEngine(getModulesConfig());
const serverPrice = baseCostEngine.calculate(quoteContext);

// Stockage du coût serveur pour audit (NE remplace PAS les prix soumis)
req.body.quoteData.serverBaseCost = serverPrice.summary.total;
```

### 4.4 Signature HMAC

```typescript
const priceSignature = PriceSignatureService.signPrice({
  basePrice: serverPrice.summary.total,
  totalPrice: serverPrice.summary.total,
  calculationId: serverPrice.summary.calculationId,
  calculatedAt: new Date().toISOString()
});

req.body.quoteData.securedPrice = priceSignature;
// securedPrice contient : basePrice, totalPrice (base), signature HMAC, timestamp
```

> **Important** : `securedPrice.totalPrice` = coût de base serveur (sans marge scénario).
> Le prix réel du scénario est dans `quoteData.calculatedPrice` et `quoteData.totalPrice`.

---

## Étape 5 — Service applicatif

**Fichier** : `src/quotation/application/services/QuoteRequestService.ts`

```typescript
async createQuoteRequest(data: CreateQuoteRequestDTO) {
  // 1. Validation des données
  QuoteValidationService.validate(data);

  // 2. Création de l'entité QuoteRequest
  const quoteRequest = QuoteRequest.create({
    type: data.serviceType,
    status: 'TEMPORARY',
    quoteData: data.quoteData,
    temporaryId: generateTemporaryId(), // UUID unique
  });

  // 3. Sauvegarde via le repository
  const saved = await this.repository.save(quoteRequest);

  return {
    success: true,
    data: {
      id: saved.id,
      temporaryId: saved.temporaryId,
      status: saved.status,
    }
  };
}
```

---

## Étape 6 — Repository Prisma

**Fichier** : `src/quotation/infrastructure/repositories/PrismaQuoteRequestRepository.ts`

```typescript
async save(quoteRequest: QuoteRequest): Promise<QuoteRequest> {
  const data = quoteRequest.toPersistence();

  const result = await prisma.quoteRequest.create({
    data: {
      id: data.id,
      type: data.type,
      status: data.status,
      quoteData: data.quoteData,    // JSON — contient TOUT le payload
      temporaryId: data.temporaryId, // UUID unique pour le lien booking
    }
  });

  return QuoteRequest.fromDatabase(result);
}
```

### Modèle Prisma

```prisma
model QuoteRequest {
  id          String    @id @default(cuid())
  type        String    // "MOVING"
  status      String    @default("TEMPORARY")
  quoteData   Json      // Tout le payload (prix, adresses, cross-selling, signature...)
  temporaryId String?   @unique
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  bookings    Booking[]
}
```

### Contenu de `quoteData` en BDD

```json
{
  "serviceType": "MOVING_PREMIUM",
  "serviceId": "...",
  "catalogId": "...",

  "scheduledDate": "2026-03-15",
  "pickupAddress": "12 rue de Paris, 75001 Paris",
  "deliveryAddress": "45 avenue des Champs, 69001 Lyon",
  "estimatedVolume": 25,
  "distanceEstimee": 465,

  "pickupFloor": 3,
  "deliveryFloor": 0,
  "pickupElevator": false,
  "deliveryElevator": true,
  "pickupLogistics": { "hasParking": false, "narrowAccess": true },

  "packing": true,
  "dismantling": true,
  "reassembly": true,
  "cleaningEnd": false,
  "storageDurationDays": 0,
  "crossSellingGrandTotal": 150,

  "calculatedPrice": 1850,
  "totalPrice": 1920,
  "selectedScenario": "CONFORT",

  "fragileProtection": true,
  "fragileProtectionAmount": 50,
  "declaredValueInsurance": true,
  "declaredValue": 15000,
  "insurancePremium": 20,

  "serverBaseCost": 1423.08,
  "securedPrice": {
    "basePrice": 1423.08,
    "totalPrice": 1423.08,
    "signature": "hmac-sha256:...",
    "calculationId": "calc-...",
    "calculatedAt": "2026-03-10T14:30:00Z"
  },

  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "0612345678",

  "submissionDate": "2026-03-10T14:30:00Z"
}
```

---

## Étape 7 — Redirection vers la page Booking

Après la création réussie du QuoteRequest, le frontend redirige :

```typescript
// useUnifiedSubmission.tsx
const redirectUrl = config.getSuccessRedirectUrl(data);
// → /booking/{temporaryId}
router.push(redirectUrl);

// Le temporaryId est aussi stocké en session
window.sessionStorage.setItem('pendingQuoteRequestId', data.temporaryId);
```

---

## Étape 8 — Paiement Stripe

**Fichier** : `src/app/api/payment/create-session/route.ts`

La page `/booking/:temporaryId` charge le QuoteRequest depuis la BDD et présente un récapitulatif avec un bouton de paiement.

### Création du PaymentIntent

```typescript
// 1. Récupération du QuoteRequest via API
const quoteRequest = await fetch(`/api/quotesRequest/${temporaryId}`);

// 2. Vérification de la signature HMAC
const verification = priceSignatureService.verifySignature(quoteData.securedPrice, quoteData);

// 3. Calcul de l'acompte (30% du prix scénario + options)
if (verification.valid) {
  // securedPrice.totalPrice = coût de base serveur (vérification intégrité uniquement)
  // quoteData.totalPrice = prix scénario + options (prix accepté par le client)
  const serverBaseCost = quoteData.securedPrice.totalPrice;
  serverCalculatedPrice = quoteData.totalPrice || quoteData.calculatedPrice || serverBaseCost;
}
const depositAmount = serverCalculatedPrice * 0.3;

// 4. Création du PaymentIntent Stripe
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(depositAmount * 100), // en centimes (acompte 30%)
  currency: 'eur',
  metadata: {
    temporaryId,
    serverCalculatedPrice: serverCalculatedPrice.toFixed(2),
    depositAmount: depositAmount.toFixed(2),
    calculationId: quoteData.securedPrice?.calculationId,
  }
});

// 5. Retour avec prix recalculé pour mise à jour affichage
return { clientSecret, recalculatedPrice: { total: serverCalculatedPrice, deposit: depositAmount } };
```

---

## Étape 9 — Webhook Stripe et création du Booking

**Fichier** : `src/app/api/webhooks/stripe/route.ts`

Après le paiement réussi, Stripe envoie un webhook `payment_intent.succeeded` :

```
Stripe webhook POST /api/webhooks/stripe
  │
  ├─► Vérification signature Stripe (STRIPE_WEBHOOK_SECRET)
  │
  ├─► payment_intent.succeeded
  │     ├─► Vérification booking n'existe pas déjà (idempotence)
  │     ├─► Validation montant payé vs montant attendu (metadata)
  │     ├─► Récupération billing_details depuis Stripe (nom, email, téléphone)
  │     └─► POST /api/bookings/finalize
  │           └─► BookingController.finalizeBooking()
  │                 └─► BookingService.createBookingAfterPayment()
  │                       ├─► Récupère QuoteRequest par temporaryId
  │                       ├─► Crée/récupère Customer
  │                       ├─► Vérifie signature HMAC → utilise quoteData.totalPrice
  │                       ├─► Crée Booking (totalAmount = prix scénario + options)
  │                       ├─► Crée Transaction (amount = acompte 30%)
  │                       ├─► Statut: DRAFT → CONFIRMED → PAYMENT_COMPLETED
  │                       ├─► QuoteRequest status → CONFIRMED
  │                       └─► Notifications (équipe interne, prestataires, client)
  │
  ├─► checkout.session.completed (fallback, même logique)
  │
  ├─► payment_intent.payment_failed → status PAYMENT_FAILED + récupération abandon
  │
  └─► payment_intent.canceled → tracking abandon
```

### Page de succès (polling)

**Fichier** : `src/app/success/page.tsx`

Après le paiement, Stripe redirige vers `/success?payment_intent=pi_xxx`. La page poll `/api/payment/status` toutes les secondes (max 20 tentatives) pour vérifier si le Booking a été créé par le webhook :

```typescript
// 1. Cherche une Transaction avec ce PaymentIntent
const transaction = await prisma.transaction.findFirst({
  where: { paymentIntentId },
  include: { Booking: true }
});

// 2. Sinon, récupère le PaymentIntent Stripe → temporaryId → QuoteRequest → Booking
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
const quoteRequest = await prisma.quoteRequest.findUnique({
  where: { temporaryId: paymentIntent.metadata.temporaryId },
  include: { Booking: true }
});
```

### Modèle Booking

```prisma
model Booking {
  id             String       @id @default(cuid())
  type           String       // "MOVING"
  status         String       @default("PENDING")
  customerId     String?
  totalAmount    Float        // Prix total (scénario + options)
  quoteRequestId String
  quoteRequest   QuoteRequest @relation(fields: [quoteRequestId], references: [id])
  transactions   Transaction[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model Transaction {
  id              String   @id @default(cuid())
  bookingId       String
  amount          Float    // Montant réellement débité (acompte 30%)
  currency        String   @default("EUR")
  status          String   // COMPLETED, FAILED
  paymentMethod   String?
  paymentIntentId String?
  Booking         Booking  @relation(fields: [bookingId], references: [id])
}
```

---

## Diagramme de séquence

```
Client (Browser)          API Route           Controller          Service          Repository          Stripe
       │                     │                    │                  │                 │                  │
       │  submit(formData)   │                    │                  │                 │                  │
       │────────────────────►│                    │                  │                 │                  │
       │                     │  createQuoteRequest│                  │                 │                  │
       │                     │───────────────────►│                  │                 │                  │
       │                     │                    │  BaseCostEngine  │                 │                  │
       │                     │                    │  .calculate()    │                 │                  │
       │                     │                    │  (audit only)    │                 │                  │
       │                     │                    │                  │                 │                  │
       │                     │                    │  HMAC sign       │                 │                  │
       │                     │                    │                  │                 │                  │
       │                     │                    │  createQuoteReq  │                 │                  │
       │                     │                    │─────────────────►│                 │                  │
       │                     │                    │                  │   save()        │                  │
       │                     │                    │                  │────────────────►│                  │
       │                     │                    │                  │                 │  prisma.create   │
       │                     │                    │                  │                 │  (TEMPORARY)     │
       │                     │                    │                  │◄────────────────│                  │
       │                     │◄───────────────────│◄─────────────────│                 │                  │
       │  { temporaryId }    │                    │                  │                 │                  │
       │◄────────────────────│                    │                  │                 │                  │
       │                     │                    │                  │                 │                  │
       │  redirect /booking  │                    │                  │                 │                  │
       │  ─ ─ ─ ─ ─ ─ ─ ─ ►│                    │                  │                 │                  │
       │                     │                    │                  │                 │                  │
       │  POST create-session│                    │                  │                 │                  │
       │────────────────────►│                    │                  │                 │                  │
       │                     │  verify HMAC       │                  │                 │                  │
       │                     │  calc deposit 30%  │                  │                 │                  │
       │                     │  ────────────────────────────────────────────────────────────────────────►│
       │                     │                    │                  │                 │   PaymentIntent  │
       │                     │◄────────────────────────────────────────────────────────────────────────── │
       │  { clientSecret }   │                    │                  │                 │                  │
       │◄────────────────────│                    │                  │                 │                  │
       │                     │                    │                  │                 │                  │
       │  Paiement Stripe    │                    │                  │                 │                  │
       │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│                  │
       │                     │                    │                  │                 │                  │
       │                     │  webhook           │                  │                 │                  │
       │                     │◄──────────────────────────────────────────────────────────────────────────│
       │                     │  status→CONVERTED  │                  │                 │                  │
       │                     │  create Booking    │                  │                 │                  │
       │                     │───────────────────────────────────────────────────────►│                  │
       │                     │                    │                  │                 │  prisma.create   │
       │                     │                    │                  │                 │  (Booking)       │
       │                     │                    │                  │                 │                  │
```

---

## Sécurité

### Signature HMAC

Le serveur recalcule le prix de base via `BaseCostEngine` et le signe avec HMAC-SHA256 :

- **Objectif** : Garantir que le prix de base n'a pas été altéré entre la soumission et le paiement
- **Champs signés** : `basePrice`, `totalPrice` (base), `calculationId`, `calculatedAt`
- **Vérification** : Avant la création du PaymentIntent Stripe

### Double prix

| Champ | Contenu | Utilisation |
|-------|---------|-------------|
| `securedPrice.totalPrice` | Coût de base serveur (sans marge) | Vérification d'intégrité |
| `serverBaseCost` | Même valeur, champ dédié audit | Traçabilité |
| `calculatedPrice` | Prix du scénario (base + marge) | Prix affiché au client |
| `totalPrice` | Prix scénario + assurance + protection | **Montant à facturer** |

### Retry et idempotence

- 3 tentatives automatiques avec backoff exponentiel
- `temporaryId` unique (UUID) empêche les doublons
- Toast avec bouton "Réessayer" pour retry manuel

---

## Statuts du QuoteRequest

```
TEMPORARY ──► CONVERTED ──► COMPLETED
    │              │
    │              └──► CANCELLED
    │
    └──► EXPIRED (si non payé dans le délai)
```

| Statut | Description |
|--------|-------------|
| `TEMPORARY` | Créé après soumission formulaire, en attente de paiement |
| `CONVERTED` | Paiement Stripe confirmé, Booking créé |
| `COMPLETED` | Déménagement effectué |
| `CANCELLED` | Annulé par le client ou l'admin |
| `EXPIRED` | Délai de paiement dépassé |

---

## Corrections appliquées (février 2026)

### Bug #1 — Noms de champs logistique
- **Problème** : Le controller attendait `pickupLogisticsConstraints`, le frontend envoie `pickupLogistics`
- **Fix** : Alias dans le controller : `quoteData.pickupLogistics || quoteData.pickupLogisticsConstraints`

### Bug #2 — Données cross-selling absentes à la soumission
- **Problème** : Les sélections cross-selling (emballage, démontage, etc.) n'étaient pas injectées lors de la soumission
- **Fix** : Ajout de `useCrossSellingOptional()` dans `page.tsx` + enrichissement du formData avant `submit()`

### Bug #3 — Prix du scénario écrasé (CRITIQUE)
- **Problème** : `useUnifiedSubmission` écrasait le prix du scénario avec le prix recommandé du hook
- **Fix** : Priorité au prix dans `requestData.calculatedPrice` sur le paramètre `calculatedPrice` du hook

### Bug #4 — Serveur écrase les prix soumis (CRITIQUE)
- **Problème** : Le controller remplaçait `calculatedPrice` et `totalPrice` soumis par le coût de base serveur
- **Fix** : Stockage séparé dans `serverBaseCost`, préservation des prix client

### Bug #5 — Acompte Stripe basé sur le coût de base (CRITIQUE) ✅ CORRIGÉ
- **Problème** : `create-session/route.ts` utilisait `securedPrice.totalPrice` (coût de base sans marge) pour calculer l'acompte 30%
- **Impact** : L'acompte était sous-facturé (ex: 426€ au lieu de 555€ pour CONFORT)
- **Fix** : Utilise `quoteData.totalPrice` (prix scénario + options) comme base de calcul de l'acompte

### Bug #6 — BookingService utilise le coût de base pour le Booking (CRITIQUE) ✅ CORRIGÉ
- **Problème** : `BookingService.createBookingAfterPayment()` utilisait `securedPrice.totalPrice` (coût de base) comme `totalAmount` du Booking
- **Impact** : Le Booking était créé avec le mauvais montant total
- **Fix** : Utilise `quoteData.totalPrice` quand la signature HMAC est valide + évite le double comptage de l'assurance

### Bug #7 — Transaction stocke le prix total au lieu de l'acompte ✅ CORRIGÉ
- **Problème** : La Transaction Prisma stockait `finalPrice` (prix total) comme `amount`, alors que le PaymentIntent Stripe ne débite que 30%
- **Impact** : Incohérence comptable entre le montant en BDD et le montant réellement débité
- **Fix** : La Transaction stocke désormais `depositAmount` (30% du prix total)

---

## Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx` | Formulaire et soumission frontend |
| `src/hooks/business/DemenagementSurMesure/demenagementSurMesureSubmissionConfig.ts` | Configuration de la soumission (validation, préparation données) |
| `src/hooks/generic/useUnifiedSubmission.tsx` | Hook unifié de soumission (retry, validation, appel API) |
| `src/app/api/quotesRequest/route.ts` | Point d'entrée API Next.js (création QuoteRequest) |
| `src/quotation/interfaces/http/controllers/QuoteRequestController.ts` | Controller HTTP (extraction, recalcul, signature) |
| `src/quotation/application/services/QuoteRequestService.ts` | Service applicatif (validation, création entité) |
| `src/quotation/infrastructure/repositories/PrismaQuoteRequestRepository.ts` | Repository Prisma (persistance BDD) |
| `src/app/booking/[temporaryId]/page.tsx` | Page de paiement (formulaire Stripe) |
| `src/app/api/payment/create-session/route.ts` | Création PaymentIntent Stripe |
| `src/app/api/webhooks/stripe/route.ts` | Webhook Stripe (création Booking après paiement) |
| `src/app/api/bookings/finalize/route.ts` | API de finalisation Booking |
| `src/quotation/application/services/BookingService.ts` | Service Booking (prix, transaction, notifications) |
| `src/app/api/payment/status/route.ts` | Vérification statut paiement (polling) |
| `src/app/success/page.tsx` | Page de succès post-paiement |
| `prisma/schema.prisma` | Modèles QuoteRequest, Booking, Transaction |
