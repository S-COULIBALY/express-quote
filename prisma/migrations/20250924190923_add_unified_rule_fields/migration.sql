-- Migration: Ajout des champs unifiés à la table rules
-- Description: Extension de la table rules pour supporter le système unifié de règles métier

-- Créer l'enum RuleType s'il n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RuleType') THEN
    CREATE TYPE "RuleType" AS ENUM ('CONSTRAINT', 'BUSINESS', 'PRICING', 'TEMPORAL', 'GEOGRAPHIC', 'VOLUME', 'CUSTOM');
  END IF;
END $$;

-- Ajouter les nouveaux champs à la table rules
ALTER TABLE "rules"
ADD COLUMN IF NOT EXISTS "ruleType" "RuleType" DEFAULT 'CONSTRAINT',
ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "validTo" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "configKey" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Mettre à jour le champ condition de String vers JSON si nécessaire
DO $$
BEGIN
  -- Vérifier si la colonne condition est de type TEXT/VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules'
    AND column_name = 'condition'
    AND data_type IN ('text', 'character varying')
  ) THEN
    -- Convertir les valeurs texte existantes vers JSON
    UPDATE "rules"
    SET "condition" =
      CASE
        WHEN "condition" IS NULL OR "condition" = '' THEN NULL
        WHEN "condition"::text ~ '^[[:space:]]*[\{\[]' THEN "condition"::jsonb  -- Déjà du JSON
        ELSE jsonb_build_object('type', 'LEGACY', 'expression', "condition"::text)  -- Convertir texte legacy
      END;

    -- Changer le type de colonne
    ALTER TABLE "rules" ALTER COLUMN "condition" TYPE JSONB USING "condition"::jsonb;
  END IF;
END $$;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS "rules_ruleType_serviceType_idx" ON "rules"("ruleType", "serviceType");
CREATE INDEX IF NOT EXISTS "rules_isActive_validFrom_validTo_idx" ON "rules"("isActive", "validFrom", "validTo");
CREATE INDEX IF NOT EXISTS "rules_ruleType_idx" ON "rules"("ruleType");
CREATE INDEX IF NOT EXISTS "rules_priority_idx" ON "rules"("priority");
CREATE INDEX IF NOT EXISTS "rules_tags_idx" ON "rules" USING GIN("tags");

-- Ajouter une contrainte unique pour éviter les doublons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rules_ruleType_category_name_key'
    AND table_name = 'rules'
  ) THEN
    ALTER TABLE "rules" ADD CONSTRAINT "rules_ruleType_category_name_key" UNIQUE ("ruleType", "category", "name");
  END IF;
END $$;

-- Mettre à jour les règles existantes avec des valeurs par défaut appropriées
UPDATE "rules"
SET
  "ruleType" = 'CONSTRAINT',
  "priority" = 100,
  "validFrom" = COALESCE("createdAt", CURRENT_TIMESTAMP),
  "tags" = ARRAY[]::TEXT[],
  "metadata" = '{}'::jsonb
WHERE "ruleType" IS NULL;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN "rules"."ruleType" IS 'Type de règle: CONSTRAINT (contraintes terrain), BUSINESS (règles métier), PRICING (tarification), etc.';
COMMENT ON COLUMN "rules"."priority" IS 'Priorité d''application de la règle (plus bas = plus prioritaire)';
COMMENT ON COLUMN "rules"."validFrom" IS 'Date de début de validité de la règle';
COMMENT ON COLUMN "rules"."validTo" IS 'Date de fin de validité de la règle (NULL = illimitée)';
COMMENT ON COLUMN "rules"."tags" IS 'Tags pour catégoriser et filtrer les règles';
COMMENT ON COLUMN "rules"."configKey" IS 'Clé de configuration originale (pour migration depuis Configuration)';
COMMENT ON COLUMN "rules"."metadata" IS 'Métadonnées flexibles en format JSON';