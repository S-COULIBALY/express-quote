# Nettoyage final des services obsolètes (février 2026)

> **Date :** 2026-02-02  
> **Objectif :** Aligner le code sur la BDD — uniquement **MOVING** et **MOVING_PREMIUM** (déménagement sur mesure).

---

## 1. Enum ServiceType (domaine)

**Fichier :** `src/quotation/domain/enums/ServiceType.ts`

| Avant | Après |
|-------|--------|
| 7 valeurs : MOVING, MOVING_PREMIUM, SERVICE, PACKING, CLEANING, DELIVERY, CLEANING_PREMIUM | **2 valeurs :** MOVING, MOVING_PREMIUM |

Les chaînes legacy (CLEANING, PACKING, DELIVERY) pouvant encore exister en BDD sont mappées vers MOVING à la lecture (ServiceTypeExtractor, create-session, etc.).

---

## 2. Fichiers modifiés (production)

| Fichier | Modification |
|---------|--------------|
| `QuoteContext.ts` | `requiredFields` limité à MOVING et MOVING_PREMIUM |
| `ServiceTypeExtractor.ts` | Type `SERVICE` mappé vers MOVING |
| `adminRules.ts` | Fallback AVAILABLE_SERVICE_TYPES = [MOVING, MOVING_PREMIUM] |
| `QuoteRequestDto.ts` | Validation moving uniquement pour MOVING / MOVING_PREMIUM ; suppression bloc CLEANING |
| `admin/templates/page.tsx` | Badges : MOVING, MOVING_PREMIUM, défaut (plus de CLEANING/DELIVERY) |
| Templates email (12 fichiers) | getServiceEmoji / getServiceDisplayName : MOVING, MOVING_PREMIUM, CUSTOM + default ; plus de case CLEANING/DELIVERY |
| `AttributionUtils.ts` | MOVING_PREMIUM ajouté ; commentaire compatibilité legacy |

---

## 3. Scripts et tests

- **Scripts :** seed-simple, generate-test-data, 11-initialiser-données-test : types MOVING / MOVING_PREMIUM uniquement.
- **Tests d’intégration :** booking-notification-flow, scheduled-reminders, quote-confirmation, transaction-atomicity, prisma-enum-validation, mission-accepted-confirmation, complete-reservation-notification-delivery, reminder-professional-templates, professional-document-template, booking-payment-templates, accounting-notifications : CLEANING/DELIVERY remplacés par MOVING ou MOVING_PREMIUM.
- **README intégration :** exemples SQL et texte mis à jour (MOVING, MOVING_COMPANY).

---

## 4. Vérification

- `npm run build` : **OK**
- Aucune référence à `ServiceType.CLEANING`, `ServiceType.PACKING`, `ServiceType.DELIVERY` dans le code de production.
- Types des props email : `'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM'`.

---

Voir aussi : `docs/ELEMENTS_OBSOLETES_SUPPRIMES.md` pour l’historique complet des suppressions legacy.
