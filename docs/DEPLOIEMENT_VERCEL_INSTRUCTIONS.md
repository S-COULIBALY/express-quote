# 🚀 Instructions de Déploiement Vercel - Action Immédiate

**Date** : 2026-01-10  
**Statut** : Prêt pour déploiement

---

## ✅ Prérequis Vérifiés

- ✅ `vercel.json` configuré
- ✅ Scripts `postinstall` et `build` configurés
- ✅ Prisma schema présent
- ✅ CLI Vercel installée

---

## 🚀 Déploiement en 3 Étapes

### Étape 1 : Connexion à Vercel

```bash
vercel login
```

Cela ouvrira votre navigateur pour vous authentifier avec votre compte Vercel (même credentials que GitHub).

### Étape 2 : Lier le Projet

```bash
cd C:\Users\scoul\express-quote
vercel link
```

Réponses aux questions :

- **Set up and deploy?** → `Y`
- **Which scope?** → Votre compte/organisation
- **Link to existing project?** → `N` (créer un nouveau projet)
- **Project name?** → `express-quote` (ou votre choix)
- **Directory?** → `.` (répertoire actuel)

### Étape 3 : Configurer les Variables d'Environnement

#### Option A : Via Dashboard Vercel (Recommandé)

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `express-quote`
3. Aller dans **Settings > Environment Variables**
4. Ajouter toutes les variables (voir liste ci-dessous)

#### Option B : Via CLI (Alternative)

```bash
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_BASE_URL production
# ... etc
```

### Étape 4 : Déployer

```bash
vercel --prod
```

---

## 📋 Variables d'Environnement Requises

### Base de données (REQUIS)

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Application (REQUIS)

```
NEXT_PUBLIC_BASE_URL=https://express-quote.vercel.app
NEXT_PUBLIC_APP_URL=https://express-quote.vercel.app
INTERNAL_API_URL=https://express-quote.vercel.app
NODE_ENV=production
```

### NextAuth (REQUIS)

```
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=https://express-quote.vercel.app
```

### Stripe (REQUIS)

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### SMTP (REQUIS)

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@express-quote.com
EMAIL_FROM=noreply@express-quote.com
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=password
```

### Redis (REQUIS pour notifications)

```
REDIS_URL=redis://...
```

---

## 🔄 Après le Déploiement

### 1. Appliquer les Migrations Prisma

```bash
npx prisma migrate deploy
```

Ou si vous utilisez Vercel Postgres, les migrations sont automatiques.

### 2. Vérifier l'Application

- Visiter l'URL fournie par Vercel
- Tester la création d'un devis
- Vérifier les logs dans le dashboard Vercel

### 3. Configurer les Webhooks Stripe

1. Aller dans Stripe Dashboard > Webhooks
2. Créer un webhook pointant vers : `https://your-app.vercel.app/api/webhooks/stripe`
3. Copier le secret dans `STRIPE_WEBHOOK_SECRET`

---

## 📚 Documentation Complète

- **Guide détaillé** : `docs/GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md`
- **Guide de base** : `docs/DEPLOIEMENT_VERCEL.md`

---

**Prêt à déployer !** 🚀
