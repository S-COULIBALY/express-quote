-- Migration: Suppression des valeurs d'enum obsolètes
-- Date: 2026-02-02
-- Description: Supprime les valeurs obsolètes des enums ProfessionalType et InternalRole
--              Services abandonnés: CLEANING, DELIVERY, STORAGE, HANDYMAN

-- 1. Mise à jour des données existantes vers des valeurs valides
-- Convertir les professionnels avec types obsolètes vers OTHER
UPDATE "Professional"
SET "businessType" = 'OTHER'
WHERE "businessType" IN ('CLEANING_SERVICE', 'HANDYMAN', 'STORAGE_COMPANY');

-- Convertir les internal_staff avec rôles obsolètes vers OPERATIONS_MANAGER
UPDATE "internal_staff"
SET "role" = 'OPERATIONS_MANAGER'
WHERE "role" IN ('CLEANING_MANAGER', 'DELIVERY_MANAGER');

-- 2. Créer les nouveaux types d'enum
CREATE TYPE "ProfessionalType_new" AS ENUM ('MOVING_COMPANY', 'OTHER');
CREATE TYPE "InternalRole_new" AS ENUM ('MOVING_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_SERVICE', 'ACCOUNTING', 'ADMIN');

-- 3. Modifier les colonnes pour utiliser les nouveaux types
ALTER TABLE "Professional"
ALTER COLUMN "businessType" TYPE "ProfessionalType_new"
USING ("businessType"::text::"ProfessionalType_new");

ALTER TABLE "internal_staff"
ALTER COLUMN "role" TYPE "InternalRole_new"
USING ("role"::text::"InternalRole_new");

-- 4. Supprimer les anciens types et renommer les nouveaux
DROP TYPE "ProfessionalType";
ALTER TYPE "ProfessionalType_new" RENAME TO "ProfessionalType";

DROP TYPE "InternalRole";
ALTER TYPE "InternalRole_new" RENAME TO "InternalRole";
