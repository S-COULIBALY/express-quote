-- Migration: Extension de la table Configuration pour gestion avancée
-- Date: 2024-09-23
-- Description: Ajout de nouveaux champs pour la gestion des configurations dynamiques

-- Ajout des nouveaux champs
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "validation_schema" JSONB;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "environment" VARCHAR(20) DEFAULT 'production';
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "change_reason" TEXT;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "created_by" VARCHAR(255) DEFAULT 'system';
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 100;

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_config_env_active" ON "Configuration"("environment", "isActive");
CREATE INDEX IF NOT EXISTS "idx_config_tags" ON "Configuration" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "idx_config_priority" ON "Configuration"("priority");
CREATE INDEX IF NOT EXISTS "idx_config_created_by" ON "Configuration"("created_by");

-- Mise à jour des données existantes pour avoir un environnement par défaut
UPDATE "Configuration" SET "environment" = 'production' WHERE "environment" IS NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN "Configuration"."validation_schema" IS 'Schéma JSON pour valider les valeurs de configuration';
COMMENT ON COLUMN "Configuration"."environment" IS 'Environnement de la configuration (development, staging, production)';
COMMENT ON COLUMN "Configuration"."change_reason" IS 'Raison du changement de configuration pour audit';
COMMENT ON COLUMN "Configuration"."created_by" IS 'Utilisateur ou système ayant créé/modifié la configuration';
COMMENT ON COLUMN "Configuration"."tags" IS 'Tags pour catégoriser et filtrer les configurations';
COMMENT ON COLUMN "Configuration"."priority" IS 'Priorité de la configuration (100 = normal, plus bas = plus prioritaire)';