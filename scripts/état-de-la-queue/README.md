# 📊 Outils de Gestion des Queues Redis/BullMQ

Ce dossier contient des scripts pratiques pour vérifier et gérer l'état des queues BullMQ dans Redis.

## 📁 Fichiers

### 1. `01-test-connexion-redis.ts` 🔴

**Test de connexion Redis complète**

Vérifie que :

- ✅ Redis est accessible
- ✅ Les opérations SET/GET fonctionnent
- ✅ Les queues BullMQ peuvent être créées
- ✅ Les jobs peuvent être ajoutés
- ✅ Les clés Redis sont correctement créées

**Usage:**

```bash
npm run queue:test
```

---

### 2. `02-vérifier-état-queues.ts` 📊

**Vérification de l'état des queues**

Affiche pour chaque queue :

- ⏳ Jobs en attente
- 🔄 Jobs actifs (en cours de traitement)
- ⏰ Jobs différés
- ✅ Jobs complétés
- ❌ Jobs échoués

**Usage:**

```bash
npm run queue:status
```

**Exemple de sortie:**

```
📊 ÉTAT DES QUEUES BULLMQ
═══════════════════════════════════════════════════════════

⏳ Queue: EMAIL
   ⏳ En attente: 5
   🔄 Actifs: 2
   ✅ Complétés: 150
   ❌ Échoués: 0

✅ Queue: SMS
   ⏳ En attente: 0
   ✅ Complétés: 31
```

---

### 3. `03-vider-queues.ts` 🧹

**Vidage complet de toutes les queues**

⚠️ **ATTENTION** : Cette opération supprime **TOUS** les jobs (waiting, active, completed, failed, delayed) de toutes les queues. Cette opération est **irréversible** !

**Usage:**

```bash
npm run queue:clear
```

**Quand l'utiliser :**

- 🧪 Après des tests
- 🧹 Nettoyage de développement
- 🔄 Réinitialisation complète des queues

---

### 4. `04-jobs-échoués.ts` ❌

**Liste des jobs échoués avec erreurs**

Affiche tous les jobs échoués avec :

- Message d'erreur
- Stack trace
- Nombre de tentatives
- Destinataire

**Usage:**

```bash
npm run queue:failed
```

**Utile pour :**

- 🔍 Déboguer les erreurs
- 📊 Analyser les problèmes récurrents
- 🐛 Identifier les patterns d'échec

---

### 5. `05-détails-job.ts` 🔍

**Détails d'un job spécifique**

Affiche toutes les informations d'un job :

- Données complètes
- Statut et historique
- Dates (créé, traité, terminé)
- Erreurs si échec
- Options de retry

**Usage:**

```bash
npm run queue:job <queueName> <jobId>
```

**Exemple:**

```bash
npm run queue:job email 123
```

---

### 6. `06-workers-actifs.ts` 👷

**Vérification des workers actifs**

Affiche :

- Nombre de workers par queue
- Jobs en cours de traitement
- Détection de workers manquants

**Usage:**

```bash
npm run queue:workers
```

**Utile pour :**

- ✅ Vérifier que les workers tournent
- 🔍 Identifier les workers manquants
- 📊 Surveiller la charge de travail

---

### 7. `07-statistiques-détaillées.ts` 📈

**Statistiques avancées**

Affiche :

- Taux de succès par queue
- Temps de traitement moyen
- Historique des jobs récents
- Recommandations

**Usage:**

```bash
npm run queue:stats
```

**Métriques affichées :**

- Taux de succès (%)
- Temps de traitement moyen
- 5 derniers jobs complétés
- Jobs échoués récents

---

### 8. `08-santé-système.ts` 🏥

**Vérification de santé globale**

Effectue 6 vérifications :

1. ✅ Connexion Redis
2. ✅ Accessibilité des queues
3. ✅ Workers actifs
4. ✅ Backlog
5. ✅ Taux d'échec
6. ✅ Jobs bloqués

**Usage:**

```bash
npm run queue:health
```

**Statuts possibles :**

- ✅ **Healthy** : Tout fonctionne
- ⚠️ **Degraded** : Problèmes mineurs
- 🚨 **Critical** : Action requise

---

### 9. `09-analyse-notifications-reçues.ts` 📧

**Analyse des notifications reçues vs attendues**

Analyse les notifications en base de données pour comprendre :

- Quelles notifications ont été créées
- Leur statut réel (SENT, FAILED, PENDING)
- Quels templates ont été envoyés
- Pourquoi certaines notifications n'ont pas été reçues

**Usage:**

```bash
npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts
```

**⚠️ IMPORTANT : Quand lancer ce script ?**

Ce script doit être lancé **IMMÉDIATEMENT après les tests**, **AVANT** que `jest.setup.js` ne nettoie la base de données.

**Séquence recommandée :**

```bash
# 1. Lancer les tests
npm test -- src/__tests__/integration/scheduled-reminders.test.ts

# 2. IMMÉDIATEMENT après (dans un autre terminal ou avant que les tests ne se terminent)
npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts

# 3. Analyser les résultats pour comprendre pourquoi certaines notifications n'ont pas été reçues
```

**Pourquoi ce timing est crucial ?**

- Les tests nettoient la base de données dans `afterAll` via `jest.setup.js`
- Si vous attendez trop, les notifications seront supprimées
- Le script cherche les notifications des **30 dernières minutes** (ajustable)

**Alternative : Modifier les tests pour logger avant nettoyage**

Vous pouvez aussi modifier les tests pour logger les notifications **avant** le nettoyage :

```typescript
// Dans afterAll, AVANT le nettoyage
const notifications = await prisma.notifications.findMany({
  where: { created_at: { gte: testStartTime } },
});
console.log(
  "📊 Notifications créées:",
  notifications.map((n) => ({
    id: n.id,
    template: n.template_id,
    status: n.status,
    recipient: n.recipient_id,
  })),
);
```

**Ce que le script affiche :**

- 📊 Résumé par canal (EMAIL, SMS, WHATSAPP)
- 📊 Résumé par statut (SENT, FAILED, PENDING)
- 📊 Résumé par template
- 📧 Détails de chaque notification EMAIL
- ❌ Notifications échouées avec erreurs
- 🔍 Analyse des templates attendus vs reçus
- 💡 Recommandations basées sur les résultats

**Utile pour :**

- 🔍 Comprendre pourquoi seulement certaines notifications sont reçues
- 📊 Analyser le statut réel des notifications
- 🐛 Identifier les templates qui échouent
- 📧 Vérifier quels emails ont été réellement envoyés

---

## 🚀 Commandes NPM

Toutes les commandes sont déjà configurées dans `package.json` :

| Commande                                                                  | Description                  | Fichier                              |
| ------------------------------------------------------------------------- | ---------------------------- | ------------------------------------ |
| `npm run queue:test`                                                      | Test connexion Redis         | `01-test-connexion-redis.ts`         |
| `npm run queue:status`                                                    | État des queues              | `02-vérifier-état-queues.ts`         |
| `npm run queue:clear`                                                     | Vider toutes les queues      | `03-vider-queues.ts`                 |
| `npm run queue:failed`                                                    | Jobs échoués                 | `04-jobs-échoués.ts`                 |
| `npm run queue:job <queue> <id>`                                          | Détails d'un job             | `05-détails-job.ts`                  |
| `npm run queue:workers`                                                   | Workers actifs               | `06-workers-actifs.ts`               |
| `npm run queue:stats`                                                     | Statistiques détaillées      | `07-statistiques-détaillées.ts`      |
| `npm run queue:health`                                                    | Santé globale                | `08-santé-système.ts`                |
| `npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts` | Analyse notifications reçues | `09-analyse-notifications-reçues.ts` |

## 📋 Configuration

Les scripts utilisent les variables d'environnement suivantes (depuis `.env.local`) :

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

Ou via `REDIS_URL` :

```env
REDIS_URL=redis://localhost:6379/0
```

## 🔍 Workflow Recommandé

### Ordre d'exécution standard (tous les scripts)

Pour une vérification complète du système, exécutez les scripts dans cet ordre :

```bash
# 1. Test de connexion Redis (base)
npm run queue:test

# 2. État des queues (vérification basique)
npm run queue:status

# 3. Workers actifs
npm run queue:workers

# 4. Statistiques détaillées
npm run queue:stats

# 5. Jobs échoués
npm run queue:failed

# 6. Santé globale (synthèse finale)
npm run queue:health
```

### Vérification quotidienne (rapide)

```bash
# 1. État des queues
npm run queue:status

# 2. Santé globale (synthèse)
npm run queue:health
```

### Vérification approfondie

```bash
# 1. Test de connexion
npm run queue:test

# 2. État des queues
npm run queue:status

# 3. Workers actifs
npm run queue:workers

# 4. Statistiques détaillées
npm run queue:stats

# 5. Santé globale
npm run queue:health
```

### En cas de problème

```bash
# 1. Test de connexion Redis
npm run queue:test

# 2. Voir l'état actuel
npm run queue:status

# 3. Vérifier les workers
npm run queue:workers

# 4. Analyser les jobs échoués
npm run queue:failed

# 5. Statistiques pour identifier les patterns
npm run queue:stats

# 6. Santé globale pour diagnostic complet
npm run queue:health

# 7. Si nécessaire, vider les queues (⚠️ attention)
npm run queue:clear
```

### Débogage d'un job spécifique

```bash
# 1. Trouver le job ID dans queue:failed ou queue:status
npm run queue:status
# ou
npm run queue:failed

# 2. Voir les détails du job
npm run queue:job email 123
```

## 📊 Interprétation des Résultats

### ✅ État Normal

- **En attente** : 0-10 jobs (normal)
- **Actifs** : 0-5 jobs (normal)
- **Complétés** : Peut être élevé (historique)
- **Échoués** : 0 (idéal)

### ⚠️ État à Surveiller

- **En attente** : > 50 jobs (backlog)
- **Actifs** : > 10 jobs (surcharge)
- **Échoués** : > 5 jobs (problème)

### 🚨 État Critique

- **En attente** : > 1000 jobs (backlog massif)
- **Échoués** : > 50 jobs (système en panne)
- **Actifs** : 0 mais en attente > 0 (workers arrêtés)

## 🔧 Dépannage

### Erreur : "Connection refused"

```bash
# Vérifier que Redis tourne dans Docker
docker ps | grep redis

# Démarrer Redis si nécessaire
docker-compose up -d redis
```

### Erreur : "Invalid password"

```bash
# Vérifier les variables d'environnement
echo $REDIS_PASSWORD

# Ou dans .env.local
cat .env.local | grep REDIS
```

### Queues toujours pleines après clear

```bash
# Vérifier que les workers ne recréent pas les jobs
# Arrêter les workers temporairement
# Puis relancer queue:clear
```

## 📈 Monitoring Recommandé

Exécutez `queue:status` régulièrement pour :

- ✅ Détecter les backlogs
- ✅ Identifier les problèmes de workers
- ✅ Surveiller les taux d'échec
- ✅ Optimiser les performances

**Fréquence recommandée :**

- Développement : 1 fois par jour
- Production : Toutes les heures (via cron)

## 🎯 Exemples d'Utilisation

### Vérification rapide

```bash
npm run queue:status
```

### Test complet avant déploiement

```bash
# Exécuter tous les scripts dans l'ordre
npm run queue:test
npm run queue:status
npm run queue:workers
npm run queue:stats
npm run queue:failed
npm run queue:health
```

### Nettoyage après tests

```bash
# 1. Analyser les notifications AVANT nettoyage (⚠️ IMPORTANT)
npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts

# 2. Vider les queues puis vérifier
npm run queue:clear
npm run queue:status
```

### Analyse après tests d'intégration

```bash
# 1. Lancer les tests
npm test -- src/__tests__/integration/scheduled-reminders.test.ts

# 2. IMMÉDIATEMENT après (dans un autre terminal)
npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts

# 3. Analyser les résultats pour comprendre pourquoi certaines notifications n'ont pas été reçues
```

### Séquence complète de vérification

```bash
# Script unique pour tout vérifier (à exécuter dans l'ordre)
npm run queue:test      # 1. Connexion Redis
npm run queue:status    # 2. État des queues
npm run queue:workers   # 3. Workers actifs
npm run queue:stats     # 4. Statistiques
npm run queue:failed    # 5. Jobs échoués
npm run queue:health    # 6. Santé globale
```

---

**Dernière mise à jour** : Janvier 2025
