# 🚀 Guide Complet de Déploiement sur Vercel

**Date** : 2026-01-10  
**Statut** : Prêt pour production

---

## ✅ État du Projet

### Configuration Prête

- ✅ `vercel.json` configuré
- ✅ Script `postinstall` pour Prisma
- ✅ Script `build` avec génération Prisma
- ✅ Configuration Next.js optimisée
- ✅ Documentation complète

### Notes Importantes

- ⚠️ Les erreurs TypeScript dans les tests d'intégration ne bloquent pas le déploiement
- ⚠️ Les tests utilisent encore certains types obsolètes (à corriger progressivement)
- ✅ Le build Next.js ignore les erreurs TypeScript (`eslint.ignoreDuringBuilds: true`)

---

## 📋 Étapes de Déploiement

### Option 1 : Déploiement via CLI Vercel (Recommandé pour test)

#### 1. Installation de la CLI

```bash
npm i -g vercel
```

#### 2. Connexion à Vercel

```bash
vercel login
```

#### 3. Lier le projet

```bash
cd C:\Users\scoul\express-quote
vercel link
```

#### 4. Configurer les variables d'environnement

```bash
# Ajouter les variables une par une
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
# ... etc (voir liste complète ci-dessous)
```

#### 5. Déployer

```bash
# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

---

### Option 2 : Déploiement via GitHub (Recommandé pour production)

#### 1. Pousser le code sur GitHub

```bash
git add .
git commit -m "feat: Préparation déploiement Vercel"
git push origin main
```

#### 2. Connecter le repository à Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Cliquer sur "Import Git Repository"
3. Sélectionner `express-quote`
4. Vercel détecte automatiquement Next.js

#### 3. Configurer les variables d'environnement

Dans le dashboard Vercel, aller dans **Settings > Environment Variables** et ajouter :

**Base de données (REQUIS)**

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

**Application (REQUIS)**

```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
INTERNAL_API_URL=https://your-app.vercel.app
NODE_ENV=production
```

**NextAuth (REQUIS)**

```
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.vercel.app
```

**Stripe (REQUIS)**

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**SMTP (REQUIS)**

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

**Redis (REQUIS pour notifications)**

```
REDIS_URL=redis://...
```

**Autres (OPTIONNEL)**

```
SMS_PROVIDER=free_mobile
FREE_MOBILE_USER=username
FREE_MOBILE_PASS=password
WHATSAPP_ACCESS_TOKEN=token
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=key
COMPANY_ADDRESS=123 Avenue, 75001 Paris
COMPANY_PHONE=01 23 45 67 89
SIRET_NUMBER=XXX XXX XXX XXXXX
VAT_NUMBER=FR XX XXX XXX XXX
```

#### 4. Déployer

- Vercel déploie automatiquement à chaque push sur `main`
- Ou cliquer sur "Deploy" dans le dashboard

---

## 🔧 Configuration Avancée

### Migrations Prisma

#### Première déploiement

1. **Via Vercel Postgres** : Migrations automatiques
2. **Via autre PostgreSQL** : Ajouter dans `package.json` :
   ```json
   "build": "prisma generate && prisma migrate deploy && next build"
   ```

#### Migrations futures

- Les migrations sont appliquées automatiquement si `prisma migrate deploy` est dans le build
- Ou utiliser Vercel Postgres qui gère les migrations

### Webhooks Stripe

1. **Créer un webhook** dans Stripe Dashboard
2. **URL du webhook** : `https://your-app.vercel.app/api/webhooks/stripe`
3. **Événements** : `checkout.session.completed`, `payment_intent.succeeded`
4. **Secret** : Copier dans `STRIPE_WEBHOOK_SECRET`

### Domaines personnalisés

1. Aller dans **Settings > Domains**
2. Ajouter votre domaine
3. Suivre les instructions DNS

---

## ✅ Checklist Post-Déploiement

### Vérifications Essentielles

- [ ] Application accessible : `https://your-app.vercel.app`
- [ ] Page d'accueil s'affiche correctement
- [ ] Formulaire de devis fonctionne
- [ ] Création de devis sauvegardée en BDD
- [ ] Paiement Stripe fonctionne (mode test)
- [ ] Webhooks Stripe reçus
- [ ] Emails envoyés (vérifier logs SMTP)
- [ ] Notifications fonctionnent (vérifier Redis)

### Vérifications Avancées

- [ ] Admin dashboard accessible
- [ ] Configuration modules accessible (`/admin/modules-config`)
- [ ] API endpoints répondent
- [ ] Logs Vercel sans erreurs critiques
- [ ] Performance acceptable (Lighthouse)

---

## 🐛 Dépannage

### Build échoue

**Erreur** : `Prisma Client not generated`
**Solution** : Vérifier que `postinstall` est dans `package.json`

**Erreur** : `DATABASE_URL is not defined`
**Solution** : Vérifier les variables d'environnement dans Vercel

**Erreur** : `TypeScript errors`
**Solution** : Les erreurs dans les tests ne bloquent pas (ignorées par Next.js)

### Runtime Errors

**Erreur** : `Cannot connect to database`
**Solution** :

- Vérifier `DATABASE_URL` et `DIRECT_URL`
- Vérifier que la BDD accepte les connexions depuis Vercel
- Vérifier les migrations Prisma

**Erreur** : `Stripe webhook failed`
**Solution** :

- Vérifier `STRIPE_WEBHOOK_SECRET`
- Vérifier l'URL du webhook dans Stripe
- Vérifier les logs Vercel

**Erreur** : `Email sending failed`
**Solution** :

- Vérifier les credentials SMTP
- Vérifier que le port SMTP n'est pas bloqué
- Vérifier les logs SMTP

---

## 📊 Monitoring

### Logs Vercel

- Accéder aux logs : Dashboard Vercel > Deployments > Logs
- Filtrer par fonction : `/api/**`
- Surveiller les erreurs 500

### Métriques

- **Performance** : Vercel Analytics (activé automatiquement)
- **Erreurs** : Vercel Logs
- **Uptime** : Vercel Status

---

## 🔄 CI/CD Automatique

### Déploiement automatique

- ✅ Déploiement automatique à chaque push sur `main`
- ✅ Preview deployments pour les PR
- ✅ Rollback automatique en cas d'erreur

### Branches

- `main` → Production
- `develop` → Preview (optionnel)
- `feature/*` → Preview automatique

---

## 📚 Ressources

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Prisma + Vercel** : [prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- **Next.js + Vercel** : [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Guide déploiement** : `docs/DEPLOIEMENT_VERCEL.md`

---

## 🎯 Prochaines Étapes

1. ✅ **Configuration** : Fichiers de configuration créés
2. ⏳ **Variables d'environnement** : À configurer dans Vercel
3. ⏳ **Base de données** : Créer et configurer PostgreSQL
4. ⏳ **Déploiement** : Exécuter `vercel --prod` ou connecter GitHub
5. ⏳ **Vérifications** : Tester toutes les fonctionnalités
6. ⏳ **Monitoring** : Configurer les alertes

---

**Dernière mise à jour** : 2026-01-10  
**Statut** : ✅ Prêt pour déploiement
