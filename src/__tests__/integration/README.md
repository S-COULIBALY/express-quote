# 🧪 Tests d'Intégration - Flux Complet Réservation et Notifications

Ce répertoire contient les tests d'intégration complets qui vérifient le flux réel depuis la création d'une réservation jusqu'à la délivrance de toutes les notifications.

## 📋 Prérequis

### Variables d'environnement requises

Créer un fichier `.env.local` à la racine du projet avec les configurations suivantes :

```env
# Base de données (REQUIS)
DATABASE_URL=postgresql://user:password@localhost:5432/express_quote_test
DIRECT_URL=postgresql://user:password@localhost:5432/express_quote_test

# Application (REQUIS)
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_URL=http://localhost:3000

# Redis - Queue BullMQ (REQUIS pour notifications)
REDIS_URL=redis://localhost:6379
# ou
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Stripe (REQUIS pour webhooks)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP - Email (REQUIS pour notifications email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@express-quote.com

# SMS Provider (OPTIONNEL)
SMS_PROVIDER=free_mobile
FREE_MOBILE_USER=user
FREE_MOBILE_PASS=pass

# WhatsApp (OPTIONNEL)
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### Base de données

1. Créer une base de données de test :
```bash
createdb express_quote_test
```

2. Appliquer les migrations :
```bash
npx prisma migrate deploy
# ou
npx prisma db push
```

3. Vérifier que les tables existent :
```bash
npx prisma studio
```

### Redis

1. Démarrer Redis :
```bash
# Avec Docker
docker run -d -p 6379:6379 redis:alpine

# Ou avec Redis installé localement
redis-server
```

2. Vérifier la connexion :
```bash
redis-cli ping
# Devrait répondre: PONG
```

### Données de test dans la BDD

Le test nécessite certaines données dans la base de données :

#### 1. Règles actives

Assurez-vous qu'il y a des règles actives pour le service `MOVING` :

```sql
SELECT * FROM rules 
WHERE "isActive" = true 
AND "serviceType" = 'MOVING'
AND ("validFrom" IS NULL OR "validFrom" <= NOW())
AND ("validTo" IS NULL OR "validTo" >= NOW())
ORDER BY priority ASC;
```

#### 2. Équipe interne (optionnel)

Le test créera automatiquement un membre de test si aucun n'existe, mais vous pouvez en créer un :

```sql
INSERT INTO internal_staff (
  id, email, first_name, last_name, role, 
  service_types, is_active, receive_email
) VALUES (
  gen_random_uuid(),
  'test-staff@express-quote.com',
  'Test',
  'Staff',
  'OPERATIONS_MANAGER',
  '["MOVING"]'::json,
  true,
  true
);
```

#### 3. Prestataires externes (optionnel)

Le test créera automatiquement un prestataire de test si aucun n'existe, mais vous pouvez en créer un :

```sql
INSERT INTO professional (
  id, "companyName", "businessType", email, phone,
  country, verified, is_available, service_types,
  latitude, longitude, max_distance_km
) VALUES (
  gen_random_uuid(),
  'Test Professional',
  'MOVING_COMPANY',
  'test-pro@express-quote.com',
  '+33612345679',
  'France',
  true,
  true,
  '["MOVING"]'::json,
  48.8566,
  2.3522,
  150
);
```

## 🚀 Exécution des tests

### Exécuter tous les tests d'intégration

```bash
npm test -- src/__tests__/integration
```

### Exécuter un test spécifique

```bash
npm test -- src/__tests__/integration/booking-notification-flow.test.ts
```

### Exécuter en mode watch

```bash
npm test -- --watch src/__tests__/integration
```

### Exécuter avec couverture

```bash
npm test -- --coverage src/__tests__/integration
```

## 📊 Ce que les tests vérifient

### Test: `booking-notification-flow.test.ts`

Ce test vérifie le flux complet en 9 étapes :

1. **Création QuoteRequest avec règles BDD**
   - Charge les règles actives depuis la BDD
   - Crée une QuoteRequest avec les règles appliquées
   - Vérifie que les règles sont correctement chargées

2. **Webhook Stripe et création Booking**
   - Simule le webhook `checkout.session.completed`
   - Appelle l'API `/api/bookings/finalize`
   - Vérifie que le Booking est créé avec le bon statut

3. **Transition de statut et QuoteRequest**
   - Vérifie que le statut QuoteRequest est `CONFIRMED`
   - Vérifie que la Transaction est créée avec `status: COMPLETED`

4. **Notifications équipe interne**
   - Vérifie que les notifications sont ajoutées à la queue
   - Vérifie que les membres de l'équipe interne sont notifiés

5. **Attribution prestataires externes**
   - Vérifie qu'une attribution est créée
   - Vérifie que les prestataires éligibles sont notifiés

6. **Notification client**
   - Vérifie que les notifications client sont ajoutées à la queue
   - Vérifie les notifications email et SMS

7. **Traitement par workers BullMQ**
   - Attend que les workers traitent les notifications
   - Vérifie que les notifications sont marquées comme `SENT` ou `DELIVERED`

8. **Documents PDF générés**
   - Vérifie que les documents PDF sont générés
   - Vérifie les types de documents (confirmation, facture, etc.)

9. **Vérification complète du flux**
   - Vérifie que toutes les étapes sont complétées
   - Affiche les métriques finales

## 🔍 Dépannage

### Erreur: "Cannot connect to database"

- Vérifier que PostgreSQL est démarré
- Vérifier que `DATABASE_URL` est correct
- Vérifier que la base de données existe

### Erreur: "Cannot connect to Redis"

- Vérifier que Redis est démarré
- Vérifier que `REDIS_URL` est correct
- Vérifier la connexion avec `redis-cli ping`

### Erreur: "Stripe webhook signature invalid"

- Vérifier que `STRIPE_WEBHOOK_SECRET` est configuré
- Utiliser un secret de test Stripe

### Erreur: "SMTP connection failed"

- Vérifier que `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` sont corrects
- Vérifier que le serveur SMTP est accessible
- Pour les tests, vous pouvez utiliser un service comme Mailtrap

### Notifications non traitées

- Vérifier que les workers BullMQ sont démarrés
- Vérifier les logs Redis pour voir si les jobs sont dans la queue
- Attendre plus longtemps (les workers peuvent prendre du temps)

## 📝 Notes importantes

1. **Données de test** : Les tests créent des données réelles dans la BDD. Un nettoyage automatique est effectué après les tests, mais en cas d'échec, vous devrez peut-être nettoyer manuellement.

2. **Notifications réelles** : Les tests envoient de **vraies notifications** (emails, SMS). Assurez-vous d'utiliser des adresses de test.

3. **Temps d'exécution** : Les tests d'intégration prennent du temps (30-60 secondes) car ils attendent le traitement asynchrone des notifications.

4. **Isolation** : Chaque test utilise des IDs uniques pour éviter les conflits, mais les tests ne sont pas complètement isolés (ils partagent la même BDD).

## 🔧 Configuration avancée

### Utiliser une base de données de test séparée

Modifier `.env.local` pour pointer vers une base de données de test :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/express_quote_test
```

### Utiliser Mailtrap pour les emails de test

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
```

### Désactiver les notifications réelles (mode mock)

Pour tester sans envoyer de vraies notifications, vous pouvez modifier le test pour utiliser des mocks, mais cela réduit la valeur du test d'intégration.

## 📚 Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation BullMQ](https://docs.bullmq.io)
- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)

