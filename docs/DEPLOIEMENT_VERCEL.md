# 🚀 Guide de Déploiement sur Vercel

**Date** : 2026-01-10  
**Version** : 1.0

---

## 📋 Prérequis

### 1. Compte Vercel

- Créer un compte sur [vercel.com](https://vercel.com)
- Installer la CLI Vercel : `npm i -g vercel`

### 2. Base de données PostgreSQL

- Créer une base de données PostgreSQL (Vercel Postgres, Supabase, ou autre)
- Noter l'URL de connexion (`DATABASE_URL`)

### 3. Services externes

- **Stripe** : Compte Stripe avec clés API
- **SMTP** : Service d'envoi d'emails (SendGrid, Mailgun, etc.)
- **Redis** : Instance Redis (Upstash, Redis Cloud, etc.) - Optionnel mais recommandé

---

## 🔧 Configuration

### 1. Variables d'environnement

Configurer toutes les variables d'environnement dans Vercel :

#### Base de données (REQUIS)

```
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
```

#### Application (REQUIS)

```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
INTERNAL_API_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### NextAuth (REQUIS)

```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Stripe (REQUIS pour paiements)

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### SMTP (REQUIS pour emails)

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@express-quote.com
EMAIL_FROM=noreply@express-quote.com
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=your-password
```

#### Redis (REQUIS pour notifications)

```
REDIS_URL=redis://user:password@host:6379
```

#### Autres (OPTIONNEL)

```
SMS_PROVIDER=free_mobile
FREE_MOBILE_USER=username
FREE_MOBILE_PASS=password
WHATSAPP_ACCESS_TOKEN=token
WHATSAPP_PHONE_NUMBER_ID=id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=key
COMPANY_ADDRESS=123 Avenue, 75001 Paris
COMPANY_PHONE=01 23 45 67 89
SIRET_NUMBER=XXX XXX XXX XXXXX
VAT_NUMBER=FR XX XXX XXX XXX
```

---

## 🚀 Déploiement

> ⚠️ **IMPORTANT** : Les erreurs TypeScript dans les tests d'intégration ne bloquent pas le déploiement. Le build Next.js ignore ces erreurs (`eslint.ignoreDuringBuilds: true`).

### Méthode 1 : Via CLI Vercel (Recommandé pour test)

1. **Se connecter à Vercel** :

   ```bash
   vercel login
   ```

2. **Lier le projet** :

   ```bash
   vercel link
   ```

3. **Déployer en production** :
   ```bash
   vercel --prod
   ```

### Méthode 2 : Via GitHub (Recommandé pour CI/CD)

1. **Connecter le repository GitHub** :
   - Aller sur [vercel.com/new](https://vercel.com/new)
   - Importer le repository `express-quote`
   - Configurer les variables d'environnement
   - Déployer

2. **Configuration automatique** :
   - Vercel détecte automatiquement Next.js
   - Utilise `vercel.json` pour la configuration
   - Déploie automatiquement à chaque push sur `main`

---

## 📦 Configuration Vercel

### Fichier `vercel.json`

Le fichier `vercel.json` est déjà configuré avec :

- Framework Next.js
- Région : `cdg1` (Paris)
- Timeout API : 30 secondes
- Génération Prisma automatique

### Build Command

Le script `build` dans `package.json` inclut :

```json
"build": "prisma generate && next build"
```

Cela garantit que le client Prisma est généré avant le build.

---

## 🔄 Migrations Prisma

### Première déploiement

1. **Appliquer les migrations** :

   ```bash
   npx prisma migrate deploy
   ```

2. **Ou via Vercel** :
   - Ajouter un script de build : `prisma migrate deploy`
   - Ou utiliser Vercel Postgres qui applique automatiquement

### Migrations futures

Les migrations sont appliquées automatiquement si vous utilisez :

- **Vercel Postgres** : Migrations automatiques
- **Autre PostgreSQL** : Ajouter `prisma migrate deploy` dans le build command

---

## ✅ Vérifications Post-Déploiement

### 1. Vérifier l'application

- Visiter `https://your-app.vercel.app`
- Vérifier que la page d'accueil s'affiche

### 2. Vérifier la base de données

- Tester une création de devis
- Vérifier que les données sont sauvegardées

### 3. Vérifier les paiements

- Tester un paiement Stripe (mode test)
- Vérifier les webhooks Stripe

### 4. Vérifier les emails

- Tester l'envoi d'un email
- Vérifier les logs SMTP

### 5. Vérifier les notifications

- Tester une notification
- Vérifier la queue Redis

---

## 🐛 Dépannage

### Erreur : Prisma Client non généré

**Solution** :

- Vérifier que `postinstall` est dans `package.json`
- Vérifier les logs de build Vercel

### Erreur : DATABASE_URL manquante

**Solution** :

- Vérifier les variables d'environnement dans Vercel
- Vérifier que `DATABASE_URL` est bien configurée

### Erreur : Timeout API

**Solution** :

- Augmenter `maxDuration` dans `vercel.json`
- Optimiser les requêtes longues

### Erreur : Build échoue

**Solution** :

- Vérifier les logs de build dans Vercel
- Vérifier que toutes les dépendances sont installées
- Vérifier les erreurs TypeScript

---

## 🤖 Déploiement via Vercel MCP (Optionnel)

Vercel MCP permet de déployer et gérer vos projets directement depuis votre assistant IA (Cursor, Claude, etc.).

### Avantages

- ✅ Déploiement via commandes vocales/textuelles
- ✅ Gestion des variables d'environnement depuis l'IA
- ✅ Consultation des logs en temps réel
- ✅ Intégration native avec votre workflow

### Configuration

**Voir le guide complet** : `docs/GUIDE_VERCEL_MCP.md`

**Résumé rapide** :

1. Configurer Vercel MCP dans Cursor (Settings → MCP Servers)
2. Ajouter le serveur : `https://mcp.vercel.com` avec OAuth
3. Autoriser l'accès à votre compte Vercel
4. Utiliser les outils MCP pour déployer

**Exemple d'utilisation** :

```
"Déploie express-quote sur Vercel en production"
```

---

## 📚 Ressources

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Vercel MCP** : [vercel.com/docs/mcp](https://vercel.com/docs/mcp)
- **Guide Vercel MCP** : `docs/GUIDE_VERCEL_MCP.md`
- **Prisma + Vercel** : [prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- **Next.js + Vercel** : [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

**Dernière mise à jour** : 2026-01-10
