-- Migration: Suppression des types de services obsolètes
-- Date: 2026-01-10
-- Description: Supprime PACKING, CLEANING, DELIVERY, SERVICE de ServiceType et PACKING, SERVICE de BookingType
-- Ajoute MOVING_PREMIUM à ServiceType

-- ⚠️ IMPORTANT: Les données obsolètes doivent être supprimées AVANT cette migration
-- Utiliser le script: scripts/cleanup-obsolete-service-types.ts

-- 1. Supprimer les valeurs obsolètes de l'enum ServiceType
-- Note: PostgreSQL ne permet pas de supprimer directement des valeurs d'enum
-- Il faut recréer l'enum avec les nouvelles valeurs

-- ⚠️ Supprimer la table rules si elle existe (obsolète, remplacée par modules)
DROP TABLE IF EXISTS "rules" CASCADE;

-- Créer un nouvel enum temporaire
CREATE TYPE "ServiceType_new" AS ENUM ('MOVING', 'MOVING_PREMIUM');

-- Mettre à jour toutes les colonnes qui utilisent ServiceType
ALTER TABLE "booking_attributions" 
  ALTER COLUMN "service_type" TYPE "ServiceType_new" 
  USING CASE 
    WHEN "service_type"::text IN ('MOVING', 'MOVING_PREMIUM') 
    THEN "service_type"::text::"ServiceType_new"
    ELSE 'MOVING'::"ServiceType_new"
  END;

ALTER TABLE "professional_blacklists" 
  ALTER COLUMN "service_type" TYPE "ServiceType_new" 
  USING CASE 
    WHEN "service_type"::text IN ('MOVING', 'MOVING_PREMIUM') 
    THEN "service_type"::text::"ServiceType_new"
    ELSE 'MOVING'::"ServiceType_new"
  END;

-- Supprimer l'ancien enum et renommer le nouveau
DROP TYPE "ServiceType";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";

-- 2. Supprimer les valeurs obsolètes de l'enum BookingType
CREATE TYPE "BookingType_new" AS ENUM ('MOVING_QUOTE');

-- Mettre à jour la colonne type dans Booking
ALTER TABLE "Booking" 
  ALTER COLUMN "type" TYPE "BookingType_new" 
  USING CASE 
    WHEN "type"::text = 'MOVING_QUOTE' 
    THEN 'MOVING_QUOTE'::"BookingType_new"
    ELSE 'MOVING_QUOTE'::"BookingType_new"
  END;

-- Supprimer l'ancien enum et renommer le nouveau
DROP TYPE "BookingType";
ALTER TYPE "BookingType_new" RENAME TO "BookingType";
