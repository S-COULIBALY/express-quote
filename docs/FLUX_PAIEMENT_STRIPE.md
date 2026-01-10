# 💳 Flux de Paiement Stripe - Guide Complet

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés expliqués](#concepts-clés-expliqués)
3. [Le flux étape par étape](#le-flux-étape-par-étape)
4. [Configuration locale (Stripe CLI)](#configuration-locale-stripe-cli)
5. [Diagramme du flux](#diagramme-du-flux)

---

## 🎯 Vue d'ensemble

Notre application utilise **Stripe** pour traiter les paiements. Le flux complet va de la sélection du service jusqu'à la confirmation finale de réservation.

**Analogie simple**:
Imagine que tu veux acheter un billet de train en ligne. Tu choisis ton trajet (= sélection du service), tu paies avec ta carte bancaire (= Stripe traite le paiement), la SNCF reçoit une notification que tu as payé (= webhook), et enfin tu reçois ton billet par email (= confirmation de réservation).

---

## 🔑 Concepts clés expliqués

### 1. **PaymentIntent** (Intention de paiement)

**C'est quoi ?**
Un PaymentIntent est un **objet Stripe qui représente l'intention de collecter de l'argent** auprès d'un client. C'est comme une "promesse de paiement" que Stripe va suivre du début à la fin.

**Analogie**:
Imagine que tu vas au restaurant. Quand tu commandes, le serveur crée une **addition** (= PaymentIntent). Cette addition :

- Contient le montant à payer
- Reste ouverte jusqu'à ce que tu paies
- Peut être annulée si tu changes d'avis
- Est marquée "payée" une fois que tu as donné ta carte

**Quelles données Stripe attend pour créer un PaymentIntent ?**

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 69688, // 696.88€ en centimes (Stripe travaille en centimes)
  currency: "eur", // Devise: euros
  automatic_payment_methods: {
    enabled: true, // Accepte carte, Apple Pay, Google Pay, etc.
  },
  metadata: {
    // Données personnalisées (comme des post-its)
    temporaryId: "abc123", // ID de notre devis
    customerEmail: "john@example.com",
    quoteType: "MOVING",
  },
  description: "Déménagement Paris → Lyon", // Description lisible
  // receipt_email: 'john@example.com',      // Email pour le reçu (optionnel)
});
```

**Données OBLIGATOIRES**:

- ✅ `amount`: Le montant en **centimes** (100€ = 10000 centimes)
- ✅ `currency`: La devise (eur, usd, gbp, etc.)

**Données OPTIONNELLES mais utiles**:

- `metadata`: Tes propres données (utiles pour retrouver la commande plus tard)
- `description`: Texte descriptif
- `receipt_email`: Email pour envoyer le reçu automatiquement

**Ce que Stripe RENVOIE**:

```javascript
{
  id: 'pi_3SORyuCAjld4plYv0uX9FWNT',  // ← ID unique du PaymentIntent
  client_secret: 'pi_3SORyu_secret_xxx', // ← Clé secrète pour le frontend
  status: 'requires_payment_method',      // ← Statut (en attente de paiement)
  amount: 69688,
  currency: 'eur',
  // ... autres données
}
```

**Pourquoi le `payment_intent=xxx` est partout ?**

Le `PaymentIntent ID` (ex: `pi_3SORyuCAjld4plYv0uX9FWNT`) est **l'identifiant unique** du paiement. C'est comme un **numéro de suivi de colis** :

- 🔍 Il permet de **retrouver le paiement** dans les logs Stripe
- 🔗 Il fait le **lien entre le paiement et la réservation** (via webhook)
- ✅ Il permet de **vérifier si le paiement a réussi** (polling sur la page de succès)
- 📧 Il est utilisé dans les **URLs de redirection** après paiement

**Exemple concret**:

```
1. PaymentIntent créé → pi_xxx
2. URL de succès → /success?payment_intent=pi_xxx
3. Backend cherche Transaction avec paymentIntentId=pi_xxx
4. Trouve le Booking associé → Affiche la confirmation
```

Sans cet ID, impossible de savoir **quel paiement** correspond à **quelle réservation** !

---

### 2. **Webhook** (Notification automatique)

**C'est quoi ?**
Un webhook est une **notification automatique envoyée par Stripe vers ton serveur** quand un événement se produit (paiement réussi, échec, remboursement, etc.).

**Analogie du facteur** 🚴:

- Tu commandes un colis en ligne (= tu initie un paiement)
- Le site marchant prépare le colis (= Stripe traite le paiement)
- Quand le colis est prêt, le site **envoie un facteur** chez toi pour te le livrer (= webhook)
- Le facteur sonne à ta porte et te donne le colis (= ton serveur reçoit la notification)

**Sans webhook**, tu devrais appeler Stripe toutes les 5 secondes pour demander "Le paiement est-il passé ?" 😓
**Avec webhook**, Stripe t'appelle directement quand c'est prêt ! 🎉

**Les différents types de webhooks Stripe** (événements):

```javascript
"checkout.session.completed"; // Session de paiement terminée
"payment_intent.succeeded"; // ✅ Paiement réussi (le plus important)
"payment_intent.payment_failed"; // ❌ Paiement échoué
"payment_intent.canceled"; // 🚫 Paiement annulé
"charge.refunded"; // 💸 Remboursement effectué
// ... et beaucoup d'autres
```

**Comment Stripe envoie un webhook ?**

Stripe fait une **requête HTTP POST** vers ton serveur :

```http
POST https://tonsite.com/api/webhooks/stripe
Content-Type: application/json

{
  "id": "evt_1234",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 69688,
      "status": "succeeded",
      "metadata": {
        "temporaryId": "abc123"
      }
    }
  }
}
```

**Que signifie "forward le webhook `payment_intent.succeeded`" ?**

En production, Stripe peut directement appeler ton serveur :

```
Internet → https://monsite.com/api/webhooks/stripe ✅
```

**MAIS en local**, ton serveur tourne sur `localhost:3000`, qui n'est **pas accessible depuis Internet** :

```
Internet → http://localhost:3000/api/webhooks/stripe ❌
```

**Stripe CLI crée un TUNNEL** (un pont) entre Stripe et ton localhost :

```
                    ┌─────────────────┐
                    │  Stripe Cloud   │
                    │  (Internet)     │
                    └────────┬────────┘
                             │
                     Webhook │ payment_intent.succeeded
                             │
                    ┌────────▼────────┐
                    │  Stripe CLI     │ ← Le tunnel/pont
                    │  (ton PC)       │
                    └────────┬────────┘
                             │
                      Forward│ (redirection)
                             │
                    ┌────────▼────────┐
                    │  localhost:3000 │
                    │  /api/webhooks  │
                    └─────────────────┘
```

**"Forward" = "transférer/rediriger"**
Le CLI intercepte les webhooks Stripe et les **retransmet** à ton serveur local.

**Le webhook signing secret** (`whsec_xxx`) :

C'est une **clé secrète temporaire** générée par Stripe CLI pour **sécuriser les webhooks**. Imagine une **signature manuscrite** sur un document officiel :

- Sans signature → Tu ne peux pas être sûr que le document vient de la bonne personne
- Avec signature → Tu es sûr que c'est authentique

Stripe signe chaque webhook avec cette clé secrète pour que ton serveur puisse **vérifier** que la requête vient bien de Stripe (et pas d'un hacker).

---

### 3. **Le tunnel Stripe CLI**

**C'est quoi ?**
Un tunnel est un **canal de communication sécurisé** entre Stripe (sur Internet) et ton serveur local (localhost).

**Analogie du téléphone** 📞:

- En production : Stripe compose directement ton numéro (URL publique)
- En local : Ton numéro n'est pas dans l'annuaire (localhost n'est pas accessible)
- Le tunnel = Un **standard téléphonique** qui prend les appels pour toi et te les transfère

**Schéma du tunnel**:

```
┌──────────────────────────────────────────────────────┐
│                    Internet                          │
│                                                      │
│  ┌──────────┐                                       │
│  │  Stripe  │ "Paiement réussi!"                   │
│  │  Servers │                                       │
│  └─────┬────┘                                       │
│        │                                             │
└────────┼─────────────────────────────────────────────┘
         │ webhook HTTP POST
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                    Ton ordinateur                     │
│                                                      │
│  ┌──────────────┐      ┌──────────────────┐        │
│  │  Stripe CLI  │──────▶│  localhost:3000  │        │
│  │  (tunnel)    │ http │  /api/webhooks   │        │
│  └──────────────┘      └──────────────────┘        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Quand le tunnel est actif**, tu vois :

```
✅ Ready! You are using Stripe API Version [2025-03-31.basil]
✅ Your webhook signing secret is whsec_xxx
```

Cela signifie :

- ✅ Stripe CLI est connecté aux serveurs Stripe
- ✅ Les webhooks seront redirigés vers ton localhost
- ✅ Ton application peut traiter les paiements comme en production

---

## 🚀 Le flux étape par étape

### **Étape 1 : Sélection du service** 📋

**Page** : `/catalogue`

**Ce qui se passe** :

1. L'utilisateur choisit un service (ex: Déménagement)
2. Il remplit un formulaire (adresse départ, arrivée, date, volume)
3. Au clic sur "Obtenir un devis", le frontend envoie :

```javascript
POST /api/quotesRequest
{
  type: 'MOVING',
  quoteData: {
    pickupAddress: 'Paris 75001',
    deliveryAddress: 'Lyon 69001',
    volume: 30,
    distance: 470,
    scheduledDate: '2025-11-15'
  }
}
```

4. L'API crée un **QuoteRequest** en base de données avec :
   - ✅ Un `temporaryId` unique (ex: `s2stz13xj1fy30o2sc4l4h`)
   - ✅ Le prix calculé (ex: 2,322.96€)
   - ✅ Status: `TEMPORARY`

5. Redirection vers `/booking/s2stz13xj1fy30o2sc4l4h`

---

### **Étape 2 : Page de paiement** 💳

**Page** : `/booking/[temporaryId]`

**Ce qui se passe automatiquement au chargement** :

#### A. Récupération du devis

```javascript
GET / api / quotesRequest / s2stz13xj1fy30o2sc4l4h;
```

Retourne les détails du devis (prix, service, etc.)

#### B. Création du PaymentIntent

```javascript
POST /api/payment/create-session
{
  temporaryId: 's2stz13xj1fy30o2sc4l4h',
  amount: 696.888,  // Acompte de 30% (2322.96 * 0.3)
  customerData: {   // Vide, sera collecté par Stripe
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  }
}
```

**Stripe crée le PaymentIntent** et renvoie :

```javascript
{
  success: true,
  sessionId: 'pi_3SORyuCAjld4plYv0uX9FWNT',  // ID du PaymentIntent
  clientSecret: 'pi_3SORyu_secret_abc123'     // Clé pour le frontend
}
```

Le `clientSecret` est utilisé par le composant `<PaymentElement>` pour afficher le formulaire de paiement.

**Ce que l'utilisateur voit** :

```
┌─────────────────────────────────────────┐
│  Finalisation de votre réservation      │
├─────────────────────────────────────────┤
│                                         │
│  📋 Récapitulatif                       │
│  ├─ Service: Déménagement              │
│  ├─ Prix TTC: 2,322.96€                │
│  ├─ Acompte (30%): 696.88€             │
│  └─ Reste (jour J): 1,626.08€          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ☑ J'accepte les CGV *                 │
│  ☑ J'accepte la politique de conf. *   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💳 Informations et paiement            │
│  ┌───────────────────────────────────┐ │
│  │ Nom: [Jean Dupont          ]     │ │
│  │ Email: [jean@example.com    ]     │ │
│  │ Téléphone: [+336 12 34 56 78]     │ │
│  │ Pays: [France ▼]                  │ │
│  │ Code postal: [75001        ]      │ │
│  │                                    │ │
│  │ Numéro de carte                    │ │
│  │ [4242 4242 4242 4242]              │ │
│  │                                    │ │
│  │ Expiration      CVC                │ │
│  │ [12 / 25]      [123]               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [  Payer 696.88€  ]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

### **Étape 3 : Paiement** ✅

L'utilisateur clique sur **"Payer 696.88€"**

#### Frontend

```javascript
const { error, paymentIntent } = await stripe.confirmPayment({
  elements, // Formulaire PaymentElement (contient toutes les infos)
  confirmParams: {
    return_url: "http://localhost:3000/success?payment_intent=pi_xxx",
  },
  redirect: "if_required", // Redirige seulement si 3D Secure nécessaire
});
```

**Ce qui se passe** :

1. Stripe valide les informations de carte
2. Si tout est OK, le paiement est traité
3. Statut du PaymentIntent passe de `requires_payment_method` → `succeeded`
4. L'utilisateur est redirigé vers `/success?payment_intent=pi_3SORyuCAjld4plYv0uX9FWNT`

**Les données collectées par Stripe** sont stockées dans `billing_details` :

```javascript
{
  name: 'Jean Dupont',
  email: 'jean@example.com',
  phone: '+33612345678',
  address: {
    country: 'FR',
    postal_code: '75001'
  }
}
```

---

### **Étape 4 : Webhook (en arrière-plan)** 🔔

**API** : `/api/webhooks/stripe`

Pendant que l'utilisateur est redirigé vers la page de succès, **Stripe envoie un webhook** :

#### Le tunnel en action

```
1. Stripe détecte : "Paiement pi_xxx réussi!"
2. Stripe CLI intercepte le webhook
3. Log dans stripe-cli.log :
   → payment_intent.succeeded [evt_xxx]
4. Stripe CLI forward → POST http://localhost:3000/api/webhooks/stripe
```

#### Traitement du webhook

```javascript
// 1. Vérifier la signature (sécurité)
const signature = request.headers.get('stripe-signature');
// Si signature invalide → Erreur 400

// 2. Parser l'événement
const event = JSON.parse(body);
// event.type = 'payment_intent.succeeded'
// event.data.object = PaymentIntent complet

// 3. Récupérer les infos client depuis billing_details
const fullPaymentIntent = await stripe.paymentIntents.retrieve(id, {
  expand: ['charges.data.billing_details']
});

const billingDetails = fullPaymentIntent.charges.data[0].billing_details;
// {
//   name: 'Jean Dupont',
//   email: 'jean@example.com',
//   phone: '+33612345678'
// }

// 4. Créer le Booking
POST /api/bookings/finalize
{
  sessionId: 'pi_3SORyuCAjld4plYv0uX9FWNT',
  temporaryId: 's2stz13xj1fy30o2sc4l4h',
  paymentStatus: 'paid',
  amount: 696.88,
  customerData: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    phone: '+33612345678'
  }
}
```

#### BookingService.createBookingAfterPayment()

```javascript
// 1. Récupérer le QuoteRequest
const quoteRequest =
  await quoteRequestRepository.findByTemporaryId(temporaryId);

// 2. Créer ou récupérer le Customer
const customer = await customerService.findOrCreateCustomer({
  email: "jean@example.com",
  firstName: "Jean",
  lastName: "Dupont",
  phone: "+33612345678",
});

// 3. Créer le Booking
const booking = await Booking.fromQuoteRequest(
  quoteRequest,
  customer,
  quote,
  totalAmount,
);
// booking.id = 'uuid-abc-123'
// booking.status = 'PAYMENT_COMPLETED'

await bookingRepository.save(booking);

// 4. Créer la Transaction
await prisma.transaction.create({
  id: "uuid-def-456",
  bookingId: "uuid-abc-123",
  amount: 696.88,
  currency: "EUR",
  status: "COMPLETED",
  paymentMethod: "card",
  paymentIntentId: "pi_3SORyuCAjld4plYv0uX9FWNT", // ← Lien avec Stripe
});

// 5. Mettre à jour le QuoteRequest
await quoteRequestRepository.updateStatus(quoteRequest.id, "CONFIRMED");

// 6. 📧 Envoyer les notifications
await sendBookingConfirmationEmail(booking, customer);
```

**Résultat** :

- ✅ Booking créé en base de données
- ✅ Transaction créée avec `paymentIntentId`
- ✅ Emails de confirmation envoyés
- ✅ Le système est à jour

---

### **Étape 5 : Page de succès** 🎉

**Page** : `/success?payment_intent=pi_3SORyuCAjld4plYv0uX9FWNT`

**Problème** : À ce stade, le webhook n'a peut-être pas encore fini de traiter (il tourne en arrière-plan).

**Solution** : **Polling** (vérification répétée)

```javascript
// Toutes les 2 secondes (max 20 tentatives)
const checkPaymentAndBooking = async () => {
  const response = await fetch(
    `/api/payment/status?payment_intent=pi_3SORyuCAjld4plYv0uX9FWNT`,
  );

  const data = await response.json();

  if (data.success && data.bookingId) {
    // ✅ Booking trouvé !
    router.push(`/success/${data.bookingId}`);
  } else {
    // ⏳ Pas encore créé, réessayer dans 2 secondes
    setTimeout(checkPaymentAndBooking, 2000);
  }
};
```

**L'API `/api/payment/status`** :

```javascript
GET /api/payment/status?payment_intent=pi_3SORyuCAjld4plYv0uX9FWNT

// Cherche une Transaction avec ce paymentIntentId
const transaction = await prisma.transaction.findFirst({
  where: { paymentIntentId: 'pi_3SORyuCAjld4plYv0uX9FWNT' },
  include: { Booking: true }
});

if (transaction && transaction.Booking) {
  // ✅ Booking trouvé !
  return {
    success: true,
    bookingId: transaction.bookingId,
    bookingStatus: transaction.Booking.status
  };
} else {
  // ⏳ Pas encore créé
  return { success: false, processing: true };
}
```

**Chronologie typique** :

```
T+0s   : Utilisateur redirigé vers /success?payment_intent=xxx
T+0s   : Premier poll → 202 "Booking en cours de création"
T+1s   : Webhook traité → Booking créé en BDD
T+2s   : Deuxième poll → 200 "Booking trouvé!" + bookingId
T+2s   : Redirection vers /success/uuid-abc-123
```

---

### **Étape 6 : Confirmation finale** ✅

**Page** : `/success/[bookingId]`

Affiche :

- ✅ Confirmation de réservation
- 📧 "Un email de confirmation a été envoyé"
- 📋 Détails du service
- 💳 Récapitulatif du paiement
- 📅 Date et heure de la prestation

---

## 🛠️ Configuration locale (Stripe CLI)

### Pourquoi Stripe CLI est nécessaire en local ?

En **production**, ton serveur a une URL publique :

```
https://monsite.com/api/webhooks/stripe ← Stripe peut l'appeler
```

En **local**, ton serveur tourne sur localhost :

```
http://localhost:3000/api/webhooks/stripe ← PAS accessible depuis Internet
```

**Stripe CLI crée un tunnel** pour résoudre ce problème.

---

### Installation (déjà fait)

Le CLI est déjà installé dans `C:\Users\scoul\stripe.exe`

---

### Lancer Stripe CLI

#### Méthode 1 : Commande complète

```bash
cd /c/Users/scoul/express-quote

~/stripe.exe listen \
  --forward-to localhost:3000/api/webhooks/stripe \
  --api-key sk_test_51RAsKlCAjld4plYvySwn456xGJZaJCIEKOZRIPfXH4MuIXsLRyKpzRiGMmW41r0JF2F5XjPOwiLRuagAU2IdorZE00cBnxYMVQ
```

**Paramètres** :

- `listen` : Écoute les webhooks Stripe
- `--forward-to` : URL de ton API locale
- `--api-key` : Ta clé secrète Stripe (de `.env.local`)

#### Méthode 2 : Avec logs (recommandé)

```bash
cd /c/Users/scoul/express-quote

~/stripe.exe listen \
  --forward-to localhost:3000/api/webhooks/stripe \
  --api-key sk_test_51RAsKlCAjld4plYvySwn456xGJZaJCIEKOZRIPfXH4MuIXsLRyKpzRiGMmW41r0JF2F5XjPOwiLRuagAU2IdorZE00cBnxYMVQ \
  > stripe-cli.log 2>&1 &
```

**Avantages** :

- ✅ Tourne en arrière-plan (`&`)
- ✅ Logs sauvegardés dans `stripe-cli.log`
- ✅ Pas de spam dans ton terminal

#### Vérifier que c'est actif

```bash
# Voir les logs en temps réel
tail -f stripe-cli.log

# Vérifier le processus
ps aux | grep stripe
```

Tu devrais voir :

```
✅ Ready! You are using Stripe API Version [2025-03-31.basil]
✅ Your webhook signing secret is whsec_xxx
```

---

### Interpréter les logs Stripe CLI

Quand un webhook arrive, tu verras :

```
2025-11-01 00:34:12  --> payment_intent.succeeded [evt_1234]
2025-11-01 00:34:12  <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**Signification** :

- `-->` : Webhook **reçu** par Stripe CLI
- `payment_intent.succeeded` : Type d'événement
- `[evt_1234]` : ID de l'événement
- `<--` : Réponse de ton serveur
- `[200]` : Code HTTP (200 = succès)
- `POST http://localhost:3000/api/webhooks/stripe` : URL appelée

**Si tu vois `[500]`** → Erreur dans ton code webhook

---

### Arrêter Stripe CLI

```bash
# Trouver le PID (numéro de processus)
ps aux | grep stripe

# Exemple de sortie :
# 940 ... /c/Users/scoul/stripe

# Tuer le processus
kill 940
```

Ou simplement fermer le terminal si lancé au premier plan.

---

## 📊 Diagramme du flux complet

```
┌──────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                              │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ 1. Sélectionne service + Configure
             ▼
      ┌──────────────┐
      │  /catalogue  │
      └──────┬───────┘
             │ POST /api/quotesRequest
             │ → Crée QuoteRequest (temporaryId)
             ▼
┌────────────────────────────────────┐
│  /booking/[temporaryId]            │
│                                    │
│  1. GET /api/quotesRequest/:id     │
│  2. POST /api/payment/create-session│ ← Crée PaymentIntent
│     ← clientSecret                 │
│                                    │
│  3. Utilisateur remplit formulaire │
│     Stripe (nom, email, CB)        │
│                                    │
│  4. stripe.confirmPayment()        │
└────────────┬───────────────────────┘
             │
             │ Paiement traité par Stripe
             │
             ├──────────────────┬─────────────────────────┐
             │                  │                         │
             ▼                  ▼                         ▼
    ┌────────────────┐   ┌──────────────┐   ┌─────────────────────┐
    │  Utilisateur   │   │  Stripe      │   │  Stripe CLI         │
    │  Redirigé vers │   │  Envoie      │   │  (tunnel local)     │
    │  /success      │   │  Webhook     │   │                     │
    └────────┬───────┘   └──────┬───────┘   └──────┬──────────────┘
             │                  │                   │
             │                  │ payment_intent.   │
             │                  │ succeeded         │
             │                  └─────────────────► │
             │                                      │ Forward
             │                                      ▼
             │                          ┌────────────────────────┐
             │                          │ /api/webhooks/stripe   │
             │                          │                        │
             │                          │ 1. Vérifie signature   │
             │                          │ 2. Récupère billing    │
             │                          │ 3. POST /bookings/     │
             │                          │    finalize            │
             │                          │ 4. Crée Booking +      │
             │                          │    Transaction         │
             │                          └────────────────────────┘
             │ Polling toutes les 2s
             │ GET /api/payment/status?payment_intent=xxx
             │
             ▼
      ┌──────────────────┐
      │ Transaction      │
      │ trouvée avec     │ → bookingId
      │ paymentIntentId  │
      └──────┬───────────┘
             │
             │ Redirection automatique
             ▼
      ┌──────────────────┐
      │ /success/[id]    │
      │                  │
      │ ✅ Confirmation  │
      │ 📧 Email envoyé  │
      └──────────────────┘
```

---

## 🎓 Résumé des concepts

| Concept               | Analogie                      | Rôle                                                                |
| --------------------- | ----------------------------- | ------------------------------------------------------------------- |
| **PaymentIntent**     | Addition au restaurant        | Représente l'intention de payer, suit le paiement du début à la fin |
| **payment_intent ID** | Numéro de suivi colis         | Identifiant unique pour retrouver le paiement partout               |
| **Webhook**           | Facteur qui livre un colis    | Notification automatique de Stripe vers ton serveur                 |
| **Stripe CLI**        | Standard téléphonique         | Transfère les webhooks de Stripe vers localhost                     |
| **Tunnel**            | Pont entre deux îles          | Canal de communication entre Internet et localhost                  |
| **Forward**           | Transfert d'appel             | Redirection d'un webhook vers ton serveur local                     |
| **Polling**           | Vérifier la boîte aux lettres | Demander régulièrement si le Booking est créé                       |
| **billing_details**   | Adresse de livraison          | Infos client collectées par Stripe (nom, email, tel)                |
| **clientSecret**      | Clé de chambre d'hôtel        | Clé secrète pour afficher le formulaire de paiement                 |
| **metadata**          | Post-its sur un dossier       | Tes propres données attachées au paiement                           |

---

## ✅ Checklist pour tester

- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Stripe CLI actif (`~/stripe.exe listen ...`)
- [ ] Voir "Ready!" dans `stripe-cli.log`
- [ ] Aller sur `/catalogue`
- [ ] Créer un devis
- [ ] Sur `/booking/[id]`, cocher les CGV
- [ ] Remplir le formulaire Stripe
- [ ] Carte de test : `4242 4242 4242 4242`
- [ ] Payer
- [ ] Vérifier les logs Stripe CLI → webhook reçu
- [ ] Page de succès affiche le bookingId

---

## 🐛 Problèmes courants

### 1. "Transaction trouvée: null" en boucle

**Cause** : Stripe CLI n'est pas actif → webhook jamais reçu → Booking jamais créé

**Solution** : Lancer Stripe CLI

---

### 2. Webhook reçu mais erreur [500]

**Cause** : Erreur dans le code du webhook (`/api/webhooks/stripe`)

**Solution** : Regarder les logs du serveur Next.js pour l'erreur exacte

---

### 3. "customerEmail: ''" erreur 400

**Cause** : L'API attend un email mais il est vide (ancien code)

**Solution** : ✅ Déjà corrigé - l'email est maintenant optionnel

---

### 4. Stripe CLI dit "Unauthorized"

**Cause** : Mauvaise clé API

**Solution** : Vérifier que la clé dans `.env.local` correspond à celle passée au CLI

---

## 📚 Ressources utiles

- [Documentation Stripe PaymentIntent](https://stripe.com/docs/payments/payment-intents)
- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Cartes de test Stripe](https://stripe.com/docs/testing)

---

**Auteur** : Documentation générée le 2025-11-01
**Version** : 1.0

📚 Comment utiliser stripe trigger manuellement
Maintenant que vous savez comment ça marche, voici les commandes utiles :
Événements les plus courants :

# Paiement réussi (le plus utilisé)

~/stripe.exe trigger payment_intent.succeeded

# Paiement échoué

~/stripe.exe trigger payment_intent.payment_failed

# Remboursement

~/stripe.exe trigger charge.refunded

# Abonnement créé

~/stripe.exe trigger customer.subscription.created

# Voir tous les événements disponibles

~/stripe.exe trigger --help
