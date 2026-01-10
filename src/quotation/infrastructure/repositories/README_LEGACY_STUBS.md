# 📋 Legacy Repository Stubs - Documentation

## ⚠️ IMPORTANT: Ne pas supprimer ces fichiers

Ce dossier contient des **stubs (placeholders)** pour assurer la compatibilité pendant la migration progressive vers les implémentations Prisma.

---

## 📁 Fichiers Stub

### 1. `BookingRepository.ts`
- **Statut**: Stub vide (7 lignes)
- **Remplacé par**: `PrismaBookingRepository.ts` (32KB - implémentation complète)
- **Utilisé dans**: **21 fichiers**
  - Controllers: `BookingController.ts`
  - Services: `BookingService.ts`, `CustomerService.ts`, `TemplateBookingService.ts`, `AnalyticsService.ts`, `ReminderSchedulerService.ts`
  - APIs: `src/app/api/bookings/**`, `src/app/api/customers/**`
  - Autres repos: `PrismaTransactionRepository.ts`, `PrismaEmailRepository.ts`, `PrismaDocumentRepository.ts`
  - DI: `dependency-injection.ts`

### 2. `CustomerRepository.ts`
- **Statut**: Stub vide (8 lignes)
- **Remplacé par**: `PrismaCustomerRepository.ts` (6KB - implémentation complète)
- **Utilisé dans**: **16 fichiers**
  - Services: `CustomerService.ts`, `BookingService.ts`, `AnalyticsService.ts`
  - APIs: `src/app/api/customers/**`, `src/app/api/bookings/**`
  - Tests: `BookingService.test.ts`, `CustomerService.test.ts`
  - DI: `dependency-injection.ts`

### 3. `ProfessionalRepository.ts`
- **Statut**: Stub vide (8 lignes)
- **Remplacé par**: `PrismaProfessionalRepository.ts` (7KB - implémentation complète)
- **Utilisé dans**: **3 fichiers**
  - Services: `ProfessionalService.ts`
  - Autres repos: `PrismaProfessionalRepository.ts`
  - DI: `dependency-injection.ts`

---

## 🎯 Pourquoi ces stubs existent

### Raison 1: Éviter les erreurs de compilation
Sans ces stubs, les imports existants génèreraient des erreurs TypeScript:
```typescript
// Ces imports échoueraient sans les stubs
import { BookingRepository } from '../repositories/BookingRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
```

### Raison 2: Migration progressive
Les stubs permettent une migration **incrémentale** vers les implémentations Prisma:
- ✅ Les nouveaux fichiers utilisent `PrismaBookingRepository`
- ⏳ Les anciens fichiers utilisent encore `BookingRepository` (stub)
- 🎯 Migration fichier par fichier sans casser le build

### Raison 3: Compatibilité avec le DI container
Le fichier `dependency-injection.ts` référence ces classes pour l'injection de dépendances.

---

## 🚀 Plan de migration future

Pour supprimer ces stubs proprement:

### Étape 1: Identifier tous les imports
```bash
# Rechercher les imports de BookingRepository
grep -r "from.*\/BookingRepository" src/

# Rechercher les imports de CustomerRepository
grep -r "from.*\/CustomerRepository" src/

# Rechercher les imports de ProfessionalRepository
grep -r "from.*\/ProfessionalRepository" src/
```

### Étape 2: Remplacer les imports
```typescript
// AVANT
import { BookingRepository } from '../repositories/BookingRepository';

// APRÈS
import { PrismaBookingRepository } from '../repositories/PrismaBookingRepository';
```

### Étape 3: Mettre à jour le DI container
Mettre à jour `src/config/dependency-injection.ts` pour utiliser les implémentations Prisma.

### Étape 4: Supprimer les stubs
Une fois que **tous** les imports sont migrés, supprimer:
- `BookingRepository.ts`
- `CustomerRepository.ts`
- `ProfessionalRepository.ts`

---

## 📊 Impact de la suppression (si fait maintenant)

| Fichier | Nombre de fichiers impactés | Risque |
|---------|----------------------------|--------|
| `BookingRepository.ts` | **21 fichiers** | 🔴 ÉLEVÉ |
| `CustomerRepository.ts` | **16 fichiers** | 🔴 ÉLEVÉ |
| `ProfessionalRepository.ts` | **3 fichiers** | 🟡 MOYEN |

---

## ✅ Recommandation

**NE PAS SUPPRIMER** ces fichiers tant que la migration complète vers les implémentations Prisma n'est pas terminée.

Ces stubs remplissent un rôle important dans la stabilité du système pendant la période de transition.

---

## 📝 Dernière mise à jour

**Date**: 2025-10-18
**Par**: Refactoring automatisé - Nettoyage du code legacy
**Statut**: Stubs conservés pour compatibilité
