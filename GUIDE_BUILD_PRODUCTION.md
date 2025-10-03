# 🚀 Guide Complet - Build de Production

Guide pour réussir un build de production du projet Express Quote.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Vérifications avant build](#vérifications-avant-build)
3. [Ordre d'exécution des outils](#ordre-dexécution-des-outils)
4. [Build de production](#build-de-production)
5. [Outils de qualité du code](#outils-de-qualité-du-code)
6. [Déploiement](#déploiement)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Environnement requis

```bash
# Node.js version
node -v  # >= 18.17.0

# npm version
npm -v   # >= 9.0.0

# Variables d'environnement
cp .env.example .env.local
# Configurer les variables nécessaires
```

### Installation des dépendances

```bash
# 1. Nettoyer les installations précédentes (optionnel)
rm -rf node_modules package-lock.json

# 2. Installer les dépendances
npm install

# 3. Installer Prisma CLI si nécessaire
npm install -D prisma
```

---

## ✅ Vérifications avant build

### 1. Vérifier la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Vérifier les migrations (en développement)
npx prisma migrate status

# Appliquer les migrations si nécessaire
npx prisma migrate deploy
```

### 2. Vérifier les variables d'environnement

```bash
# Fichiers requis :
# - .env (production)
# - .env.local (développement local)
# - .env.example (template)

# Variables critiques à vérifier :
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 3. Vérifier la qualité du code

```bash
# Linter ESLint
npm run lint

# Si des erreurs auto-fixables :
npm run lint -- --fix

# TypeScript check
npx tsc --noEmit
```

---

## 🔄 Ordre d'exécution des outils

### Étape 1 : Nettoyage du code mort (1x/semaine ou avant release)

```bash
# Détecter le code inutilisé
npx ts-prune --skip node_modules --skip .next > dead-code-report.txt

# Analyser le rapport
cat dead-code-report.txt

# IMPORTANT : Vérifier manuellement avant suppression
# - Ignorer les exports Next.js (metadata, default)
# - Ignorer les barrel files (index.ts)
# - Supprimer uniquement le code confirmé mort
```

**Fréquence recommandée :**
- ✅ Avant chaque release majeure
- ✅ 1x par semaine en développement actif
- ✅ Après refactoring important

### Étape 2 : Formatage et linting automatique

```bash
# Option 1 : Formatage manuel global
npm run format        # Prettier sur tout le projet
npm run lint -- --fix # ESLint avec auto-fix

# Option 2 : Via Git (recommandé)
git add .
git commit -m "feat: nouvelle fonctionnalité"
# → Husky + lint-staged s'exécutent automatiquement
```

**Ce qui se passe automatiquement au commit :**
1. Husky intercepte le commit
2. lint-staged s'exécute sur les fichiers staged
3. ESLint corrige les erreurs
4. Prettier formate le code
5. Si OK ✅ → commit réussi | Si erreurs ❌ → commit bloqué

### Étape 3 : Vérification TypeScript

```bash
# Vérifier les types sans compiler
npx tsc --noEmit

# Si erreurs :
# - Corriger les types
# - Ajouter les propriétés manquantes aux interfaces
# - Vérifier les imports
```

### Étape 4 : Tests (si configurés)

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm test -- --coverage

# Tests E2E (si configurés)
npm run test:e2e
```

---

## 🏗️ Build de production

### Build standard

```bash
# 1. Nettoyer le build précédent
rm -rf .next

# 2. Lancer le build de production
npm run build

# 3. Vérifier la sortie
# ✅ Rechercher : "Compiled successfully"
# ❌ Rechercher : "Failed to compile"
```

### Build avec analyse

```bash
# Analyser la taille du bundle
npm run build -- --profile

# Avec visualisation (si @next/bundle-analyzer installé)
ANALYZE=true npm run build
```

### Démarrage en production locale

```bash
# Après build réussi
npm start

# Vérifier l'application sur http://localhost:3000
```

---

## 🛠️ Outils de qualité du code

### Outils automatiques (s'exécutent seuls)

| Outil | Quand ? | Action |
|-------|---------|--------|
| **Husky** | À chaque `git commit` | Lance les hooks Git |
| **lint-staged** | À chaque `git commit` | Lint/format fichiers staged |
| **Pre-commit hook** | À chaque `git commit` | Exécute `npx lint-staged` |

**Configuration actuelle :**
```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### Outils manuels (à exécuter au besoin)

#### 1. **ts-prune** - Détection code mort

```bash
# Rapport complet
npx ts-prune --skip node_modules --skip .next

# Sauvegarder dans un fichier
npx ts-prune --skip node_modules --skip .next > dead-code.txt

# Filtrer les vrais problèmes (enlever les faux positifs)
npx ts-prune | grep -v "default" | grep -v "metadata"
```

**Quand utiliser :**
- ✅ Avant release majeure
- ✅ Après grosse refactorisation
- ✅ Mensuellement pour maintenir la propreté

#### 2. **Barrel files** - Organisation des imports

**Fichiers créés :**
- `src/quotation/domain/index.ts`
- `src/components/ui/index.ts`

**Utilisation :**
```typescript
// ❌ Ancien (sans barrel file)
import { Configuration } from '@/quotation/domain/configuration/Configuration'
import { DefaultValues } from '@/quotation/domain/configuration/DefaultValues'
import { Quote } from '@/quotation/domain/valueObjects/Quote'

// ✅ Nouveau (avec barrel file)
import { Configuration, DefaultValues, Quote } from '@/quotation/domain'
```

**Migration progressive :** Utiliser dans les nouveaux fichiers uniquement.

#### 3. **ESLint** - Analyse du code

```bash
# Linter tout le projet
npm run lint

# Auto-fix des erreurs simples
npm run lint -- --fix

# Linter un fichier spécifique
npx eslint src/app/page.tsx --fix
```

#### 4. **Prettier** - Formatage du code

```bash
# Formater tout le projet
npm run format

# Vérifier sans modifier
npx prettier --check "src/**/*.{ts,tsx}"

# Formater un dossier spécifique
npx prettier --write "src/app/**/*.tsx"
```

---

## 📦 Déploiement

### Checklist pré-déploiement

```bash
# ✅ 1. Build réussi localement
npm run build

# ✅ 2. Tests passent
npm test

# ✅ 3. Pas d'erreurs TypeScript
npx tsc --noEmit

# ✅ 4. Pas d'erreurs ESLint critiques
npm run lint

# ✅ 5. Variables d'environnement configurées
# Vérifier .env.production

# ✅ 6. Base de données migrée
npx prisma migrate deploy

# ✅ 7. Commit et push
git add .
git commit -m "release: version X.Y.Z"
git push origin main
```

### Commandes de déploiement

#### Vercel (recommandé pour Next.js)

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement preview
vercel

# Déploiement production
vercel --prod

# Variables d'environnement
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
```

#### Docker (alternative)

```bash
# Build de l'image Docker
docker build -t express-quote .

# Lancer le container
docker run -p 3000:3000 express-quote

# Docker Compose
docker-compose up -d
```

#### Build manuel sur serveur

```bash
# Sur le serveur
git pull origin main
npm ci --only=production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart express-quote
```

---

## 🔍 Troubleshooting

### Erreur : "Module not found"

```bash
# Solution 1 : Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Solution 2 : Vérifier les alias TypeScript
# Vérifier tsconfig.json paths

# Solution 3 : Nettoyer le cache Next.js
rm -rf .next
npm run build
```

### Erreur : "Type error" pendant le build

```bash
# 1. Vérifier les types localement
npx tsc --noEmit

# 2. Analyser l'erreur spécifique
# Généralement : propriété manquante dans une interface

# 3. Corriger l'interface
# Exemple : ajouter la propriété manquante avec ?
```

### Erreur : Pre-commit hook échoue

```bash
# Option 1 : Corriger les erreurs détectées
npm run lint -- --fix
npm run format

# Option 2 : Skip temporairement (urgence uniquement)
git commit --no-verify -m "fix: correction urgente"

# Option 3 : Désactiver husky temporairement
npm uninstall husky  # À réinstaller après !
```

### Build réussit mais warnings

```bash
# Analyser les warnings
npm run build 2>&1 | grep "warning"

# Warnings courants et solutions :
# - "Attempted import error" → Vérifier les exports
# - "Can't resolve module" → Vérifier les imports
# - "Deprecated" → Mettre à jour les dépendances
```

### Problème de mémoire pendant le build

```bash
# Augmenter la limite mémoire Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Ou dans package.json :
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

---

## 📊 Commandes de monitoring

### Analyser la taille du build

```bash
# Installer next-bundle-analyzer
npm install --save-dev @next/bundle-analyzer

# Analyser
ANALYZE=true npm run build

# Ouvre un visualisateur dans le navigateur
```

### Vérifier les performances

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:3000 --view

# Next.js build info
npm run build -- --profile
```

---

## 🔄 Workflow complet recommandé

### Développement quotidien

```bash
# 1. Tirer les dernières modifications
git pull origin main

# 2. Installer les dépendances si nécessaire
npm install

# 3. Développer normalement
# Les hooks pre-commit s'occupent du formatage

# 4. Commit
git add .
git commit -m "feat: nouvelle fonctionnalité"
# → Husky + lint-staged s'exécutent automatiquement

# 5. Push
git push origin feature/ma-branche
```

### Avant chaque release

```bash
# 1. Détecter le code mort
npx ts-prune > dead-code.txt
# Analyser et supprimer si nécessaire

# 2. Formater et linter
npm run format
npm run lint -- --fix

# 3. Vérifier TypeScript
npx tsc --noEmit

# 4. Tester
npm test

# 5. Build
npm run build

# 6. Vérifier la taille du bundle
ANALYZE=true npm run build

# 7. Commit et tag
git add .
git commit -m "release: v1.2.3"
git tag v1.2.3
git push origin main --tags

# 8. Déployer
vercel --prod
```

---

## 📝 Notes importantes

### Anciens loggers (ATTENTION)

⚠️ **Problème détecté :** Les anciens loggers existent toujours et sont utilisés dans 124 fichiers.

**Fichiers concernés :**
- `src/lib/logger.ts`
- `src/lib/simple-logger.ts`
- `src/lib/calculation-debug-logger.ts`

**Migration recommandée :**
```typescript
// Remplacer progressivement
import { logger } from '@/lib/logger'
// par
import { logger } from '@/lib/unified-logger'
```

### Barrel files (optionnel)

Les barrel files sont créés mais **non obligatoires**.

**Migration progressive :**
- ✅ Utiliser dans les nouveaux fichiers
- ✅ Migrer progressivement les anciens
- ❌ Pas besoin de tout changer d'un coup

### Hooks Git

**Désactiver temporairement (urgence) :**
```bash
git commit --no-verify -m "fix: urgent"
```

**Réactiver :**
```bash
npm install husky --save-dev
npx husky install
```

---

## 🎯 Checklist finale build production

- [ ] Variables d'environnement configurées (`.env`)
- [ ] Base de données migrée (`npx prisma migrate deploy`)
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Dépendances installées (`npm ci`)
- [ ] Code formaté (`npm run format`)
- [ ] Pas d'erreurs ESLint (`npm run lint`)
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)
- [ ] Tests passent (`npm test`)
- [ ] Build réussit (`npm run build`)
- [ ] Application démarre (`npm start`)
- [ ] Commit et push (`git push`)
- [ ] Déployé (`vercel --prod`)

---

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [ts-prune GitHub](https://github.com/nadeesha/ts-prune)

---

**Dernière mise à jour :** 2025-10-03
**Version du guide :** 1.0.0
