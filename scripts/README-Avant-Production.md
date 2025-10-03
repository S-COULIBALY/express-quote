# 📜 Scripts Express Quote

Collection de scripts utilitaires pour le projet Express Quote.

---

## 🚀 Scripts de Production

### `pre-production-check.ts` - Vérification avant déploiement

**Description :** Vérifie que tout est prêt pour un build de production.

**Usage :**
```bash
# Vérification complète (recommandé avant déploiement)
npm run pre-prod-check

# Skip les tests (plus rapide)
npm run pre-prod-check:skip-tests

# Mode ultra-rapide (skip tests + lint)
npm run pre-prod-check:fast

# Avec options manuelles
npx ts-node scripts/pre-production-check.ts --skip-tests --verbose
```

**Ce qui est vérifié :**

✅ **Étape 1 - Environnement :**
- Version Node.js (>= 18)
- Fichiers .env présents
- Espace disque

✅ **Étape 2 - Base de données :**
- Connexion à la base de données
- Client Prisma généré

✅ **Étape 3 - Qualité du code :**
- Erreurs TypeScript
- Problèmes ESLint
- Code mort (ts-prune)

✅ **Étape 4 - Tests :**
- Exécution des tests Jest

✅ **Étape 5 - Build :**
- Build de production Next.js
- Statut Git

**Codes de sortie :**
- `0` : Tout est OK ou warnings mineurs
- `1` : Erreurs critiques détectées

**Exemple de sortie :**

```
================================================================================
  🚀 PRE-PRODUCTION CHECK - Express Quote
================================================================================

================================================================================
  🔍 ÉTAPE 1/5 - Vérification Environnement
================================================================================

✅ Node.js Version (145ms)
   Version 18.17.0 - OK

✅ Fichiers d'environnement (12ms)
   Tous les fichiers .env présents
   → .env
   → .env.local

================================================================================
  📊 RÉSUMÉ
================================================================================

✅ Succès:   12
❌ Erreurs:  0
⚠️  Warnings: 2
⏭️  Skipped:  1

⏱️  Durée totale: 45.32s

================================================================================
  🎯 DÉCISION FINALE
================================================================================

✅ BUILD PRODUCTION : PRÊT
   Tous les tests sont au vert ! 🎉
```

**En cas d'erreur :**

```
❌ TypeScript (8734ms)
   Erreurs TypeScript détectées
   → src/app/page.tsx:45:12 - error TS2304: Cannot find name 'Foo'
   → src/components/Bar.tsx:23:5 - error TS2322: Type 'string' is not assignable

❌ BUILD PRODUCTION : NON RECOMMANDÉ
   Corriger les erreurs avant de déployer
```

---

## 🧹 Scripts de Nettoyage

### `clean-project.ts` - Nettoyage du projet

**Description :** Nettoie les fichiers temporaires, caches et build artifacts.

**Usage :**
```bash
# Nettoyage standard
npm run clean

# Nettoyage profond (inclut node_modules)
npm run clean -- --deep

# Voir ce qui serait supprimé (sans supprimer)
npm run clean -- --dry-run

# Combinaison
npm run clean -- --deep --dry-run
```

**Ce qui est nettoyé :**

**Standard :**
- `.next` - Build Next.js
- `out` - Export Next.js
- `coverage` - Couverture de tests
- `*.log` - Fichiers de logs
- `.DS_Store` - Fichiers macOS
- `Thumbs.db` - Fichiers Windows
- Cache divers (.turbo, .swc, .cache)

**Mode Deep (`--deep`) :**
- `node_modules` - Dépendances (⚠️ nécessite réinstallation)
- `package-lock.json` - Lock files
- Tous les éléments standard

**Exemple de sortie :**

```bash
🧹 NETTOYAGE DU PROJET EXPRESS QUOTE
================================================================================

📋 Analyse des éléments à nettoyer...

🗑️  .next
   Build Next.js - Taille: 245MB
   ✅ Supprimé

🗑️  coverage
   Couverture de tests - Taille: 12MB
   ✅ Supprimé

================================================================================
📊 RÉSUMÉ

✅ 8 élément(s) supprimé(s)
```

---

## 🔧 Autres Scripts Utiles

### Tests
```bash
npm test                    # Tous les tests
npm run test:watch          # Mode watch
npm run test:coverage       # Avec couverture
npm run test:integration    # Tests d'intégration
```

### Prisma
```bash
npm run prisma:generate     # Générer le client
npm run prisma:studio       # Interface graphique DB
npm run prisma:migrate:dev  # Migrations développement
npm run prisma:db:push      # Push schema à la DB
npm run prisma:db:seed      # Seed la base de données
```

### Qualité du code
```bash
npm run lint                # Linter (avec auto-fix)
npm run format              # Formater avec Prettier
npm run type-check          # Vérifier TypeScript
npm run ci                  # type-check + lint + test
```

### Développement
```bash
npm run dev                 # Dev server HTTP
npm run dev:https           # Dev server HTTPS
npm start                   # Production HTTP
npm run start:https         # Production HTTPS
```

---

## 📋 Workflow Recommandé

### Développement quotidien

```bash
# 1. Mise à jour
git pull origin main
npm install

# 2. Développement
npm run dev

# 3. Avant commit (automatique via husky)
git add .
git commit -m "feat: nouvelle fonctionnalité"
# → lint-staged s'exécute automatiquement

# 4. Push
git push
```

### Avant chaque release

```bash
# 1. Nettoyer le projet
npm run clean

# 2. Réinstaller (optionnel mais recommandé)
npm install

# 3. Vérification complète
npm run pre-prod-check

# 4. Si tout est OK → build et déploiement
npm run build
vercel --prod
```

### Résolution de problèmes

```bash
# Build échoue ? Nettoyer d'abord
npm run clean
npm install
npm run build

# Erreurs TypeScript ?
npm run type-check

# Code mort ?
npx ts-prune > dead-code.txt
cat dead-code.txt
```

---

## 🔍 Détection du Code Mort

Le script `pre-production-check` inclut une détection automatique du code mort via ts-prune.

**Manuel :**
```bash
# Générer un rapport complet
npx ts-prune --skip node_modules --skip .next > dead-code.txt

# Filtrer les faux positifs
npx ts-prune | grep -v "default" | grep -v "metadata"

# Analyser
cat dead-code.txt
```

**Faux positifs courants à ignorer :**
- Exports `default` dans les pages Next.js
- Exports `metadata` dans les layouts
- Exports dans les barrel files (`index.ts`)
- Exports de tests (`*.test.ts`)

---

## ⚙️ Configuration

### Variables d'environnement requises

Créer `.env.local` depuis `.env.example` :

```bash
cp .env.example .env.local
```

**Variables critiques :**
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Hooks Git (Husky)

Les hooks sont configurés automatiquement via `npm install`.

**Pre-commit :** Lint et format automatique
```bash
# Dans .husky/pre-commit
npx lint-staged
```

**Désactiver temporairement (urgence) :**
```bash
git commit --no-verify -m "fix: urgent"
```

---

## 🆘 Troubleshooting

### Erreur : "ts-node: command not found"

```bash
npm install -D ts-node typescript
```

### Erreur : "Cannot find module 'X'"

```bash
npm run clean -- --deep
npm install
npm run build
```

### Build échoue après nettoyage

```bash
npx prisma generate
npm run build
```

### Tests échouent

```bash
# Vérifier la config Jest
npm run test -- --config jest.config.js

# Skip les tests temporairement
npm run pre-prod-check:skip-tests
```

### Erreurs de permissions (Windows)

```bash
# Exécuter PowerShell en tant qu'administrateur
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 Ressources

- [Guide Build Production](../GUIDE_BUILD_PRODUCTION.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [ts-prune](https://github.com/nadeesha/ts-prune)

---

**Dernière mise à jour :** 2025-10-03
