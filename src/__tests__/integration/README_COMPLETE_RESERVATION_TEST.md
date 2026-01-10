# 🧪 Test Complet - Flux de Réservation et Livraison des Notifications

## 📋 Description

Ce test vérifie le flux complet de bout en bout du système de réservation Express Quote :

1. ✅ **Paiement Stripe** (simulé) → Webhook
2. ✅ **Création Booking** via API
3. ✅ **Orchestration documents** (génération PDFs)
4. ✅ **Attribution professionnels** (recherche éligibles)
5. ✅ **Envoi notifications** (Email, SMS, WhatsApp)
6. ✅ **Vérification queues BullMQ** (jobs dans Redis)
7. ✅ **Traitement par workers** (attente traitement)
8. ✅ **Livraison aux destinataires** (vérification statuts)

## 🎯 Objectifs du Test

- ✅ Vérifier que le flux complet fonctionne de bout en bout
- ✅ Vérifier que les notifications sont bien ajoutées aux queues BullMQ
- ✅ Vérifier que les workers traitent les jobs correctement
- ✅ Vérifier que les messages sont bien délivrés aux destinataires
- ✅ Vérifier que les statuts sont correctement mis à jour (PENDING → SENDING → SENT → DELIVERED)

## 🚀 Exécution

### Prérequis

1. **Serveur démarré** :
   ```bash
   npm run dev
   ```

2. **Redis accessible** (pour les queues BullMQ) :
   ```bash
   # Vérifier que Redis est démarré
   redis-cli ping
   ```

3. **Variables d'environnement** (`.env.local`) :
   ```env
   TEST_EMAIL=s.coulibaly@outlook.com
   TEST_PHONE=+33751262080
   TEST_WHATSAPP=33751262080
   TEST_BASE_URL=http://localhost:3000
   
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # Pour les notifications réelles (optionnel)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASSWORD=...
   
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   ```

### Commande d'exécution

```bash
# Exécuter le test complet
npm run test:integration -- complete-reservation-notification-delivery.test.ts

# Ou avec Jest directement
npx jest src/__tests__/integration/complete-reservation-notification-delivery.test.ts
```

## 📊 Structure du Test

### Étape 1 : Création des entités de base
- Création d'un client de test
- Création d'un professionnel éligible

### Étape 2 : Simulation paiement Stripe → Création Booking
- Création d'une QuoteRequest
- Simulation du webhook Stripe via API `/api/bookings/finalize`
- Vérification de la création du Booking

### Étape 3 : Orchestration documents et notifications
- Appel de `/api/documents/orchestrate`
- Génération des documents PDF
- Envoi des notifications client (Email, SMS)

### Étape 4 : Attribution au professionnel
- Création d'une attribution
- Recherche des professionnels éligibles
- Envoi des notifications professionnel (Email, WhatsApp, SMS)

### Étape 5 : Vérification des queues BullMQ
- Connexion à Redis
- Vérification des jobs dans les queues (`email`, `sms`, `whatsapp`)
- Comptage des jobs en attente, actifs, complétés, échoués

### Étape 6 : Attente traitement par les workers
- Attente de 30 secondes maximum
- Vérification périodique des statuts (toutes les 2 secondes)
- Détection de la fin du traitement

### Étape 7 : Vérification livraison aux destinataires
- Récupération de toutes les notifications créées
- Vérification des statuts finaux (SENT, DELIVERED, FAILED)
- Statistiques par canal (Email, SMS, WhatsApp)

### Étape 8 : Vérification finale du flux complet
- Vérification de toutes les entités créées
- Vérification des relations (Customer, Professional, Documents, Transaction)
- Résumé final avec statistiques

## ✅ Résultats Attendus

### Notifications créées
- ✅ Au moins 1 notification Email (client)
- ✅ Au moins 1 notification Email (professionnel)
- ✅ Optionnel : SMS et WhatsApp (selon configuration)

### Statuts des notifications
- ✅ Au moins 1 notification avec statut `SENT` ou `DELIVERED`
- ✅ Les notifications passent par les états : `PENDING` → `SENDING` → `SENT` → `DELIVERED`

### Documents générés
- ✅ Au moins 1 document PDF (QUOTE pour client)
- ✅ Optionnel : Documents pour équipe interne (4 PDFs)

### Queues BullMQ
- ✅ Les jobs sont ajoutés aux queues appropriées
- ✅ Les workers traitent les jobs (transition vers `SENT`)

## 🔍 Dépannage

### Erreur : "Serveur inaccessible"
```bash
# Démarrer le serveur
npm run dev
```

### Erreur : "Redis non accessible"
```bash
# Démarrer Redis
redis-server

# Ou avec Docker
docker run -d -p 6379:6379 redis:latest
```

### Notifications non envoyées
1. Vérifier les variables d'environnement (SMTP, WhatsApp, etc.)
2. Vérifier que les workers sont démarrés (normalement automatique)
3. Vérifier les logs du serveur pour les erreurs

### Timeout du test
- Le test attend maximum 30 secondes pour le traitement
- Si timeout, vérifier que les workers fonctionnent
- Augmenter `jobTimeout` dans le test si nécessaire

## 📝 Logs et Debugging

Le test affiche des logs détaillés à chaque étape :

```
═══════════════════════════════════════════════════════════
    TEST COMPLET - FLUX RÉSERVATION ET NOTIFICATIONS
═══════════════════════════════════════════════════════════

✅ Connexion à la base de données établie
✅ Connexion Redis établie pour vérification queues
✅ Serveur accessible sur http://localhost:3000
✅ QueueEvents créés pour monitoring

✅ Client créé: cust_test_1234567890
✅ Professionnel créé: pro_test_1234567890
✅ Booking créé: book_test_1234567890
   📊 Statut: CONFIRMED
   💰 Montant: 150€

✅ Orchestration terminée:
   📄 Documents générés: 1
   📧 Notifications envoyées: 2

📊 Queue email:
   ⏳ En attente: 0
   🔄 Actifs: 1
   ✅ Complétés: 1
   ❌ Échoués: 0

📊 VÉRIFICATION LIVRAISON - 3 notifications:
═══════════════════════════════════════════════════════════

✅ EMAIL - notif_123
   Destinataire: s.coulibaly@outlook.com
   Statut: DELIVERED
   Tentatives: 1
   📤 Envoyé: 15/01/2025 10:30:45
   ✅ Délivré: 15/01/2025 10:30:46

🎯 RÉSULTAT FINAL:
   ✅ Notifications envoyées/délivrées: 3
   ❌ Notifications échouées: 0

🎉 FLUX COMPLET VÉRIFIÉ AVEC SUCCÈS !
```

## 🧹 Nettoyage

Le test nettoie automatiquement toutes les données créées :
- ✅ Notifications
- ✅ Documents
- ✅ Attributions
- ✅ Transactions
- ✅ Bookings
- ✅ QuoteRequests

**Note** : Les clients et professionnels sont conservés pour réutilisation entre les tests.

## 📈 Améliorations Futures

- [ ] Support des tests avec mocks (sans vraies notifications)
- [ ] Vérification des webhooks Stripe réels
- [ ] Tests de performance (temps de traitement)
- [ ] Tests de charge (nombreux bookings simultanés)
- [ ] Vérification des retry automatiques
- [ ] Vérification des dead letter queues

