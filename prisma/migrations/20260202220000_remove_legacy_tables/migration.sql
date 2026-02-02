-- Migration: Suppression des tables legacy du système de pricing ancien
-- Date: 2026-02-02
-- Description: Supprime les tables rules, items, templates, CatalogSelection, Category
--              et les enums associés qui ne sont plus utilisés par le nouveau système quotation-module

-- 1. Supprimer les foreign keys d'abord (si elles existent)
ALTER TABLE IF EXISTS "QuoteRequest" DROP CONSTRAINT IF EXISTS "QuoteRequest_catalogSelectionId_fkey";
ALTER TABLE IF EXISTS "CatalogSelection" DROP CONSTRAINT IF EXISTS "CatalogSelection_itemId_fkey";
ALTER TABLE IF EXISTS "items" DROP CONSTRAINT IF EXISTS "items_categoryId_fkey";

-- 2. Supprimer les index
DROP INDEX IF EXISTS "QuoteRequest_catalogSelectionId_idx";
DROP INDEX IF EXISTS "CatalogSelection_category_idx";
DROP INDEX IF EXISTS "CatalogSelection_displayOrder_idx";
DROP INDEX IF EXISTS "CatalogSelection_isActive_idx";
DROP INDEX IF EXISTS "CatalogSelection_isFeatured_idx";
DROP INDEX IF EXISTS "CatalogSelection_isVisible_startDate_endDate_idx";
DROP INDEX IF EXISTS "rules_isActive_validFrom_validTo_idx";
DROP INDEX IF EXISTS "rules_priority_idx";
DROP INDEX IF EXISTS "rules_ruleType_idx";
DROP INDEX IF EXISTS "rules_ruleType_serviceType_idx";
DROP INDEX IF EXISTS "rules_scope_idx";
DROP INDEX IF EXISTS "rules_serviceType_scope_idx";
DROP INDEX IF EXISTS "rules_tags_idx";
DROP INDEX IF EXISTS "rules_ruleType_category_name_key";
DROP INDEX IF EXISTS "rules_ruleType_category_name_scope_key";

-- 3. Supprimer la colonne catalogSelectionId de QuoteRequest (si elle existe)
ALTER TABLE IF EXISTS "QuoteRequest" DROP COLUMN IF EXISTS "catalogSelectionId";

-- 4. Supprimer les tables legacy
DROP TABLE IF EXISTS "CatalogSelection" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "rules" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "templates" CASCADE;

-- 5. Supprimer les enums legacy (si non utilisés ailleurs)
-- Note: On ne peut pas DROP TYPE si une colonne l'utilise encore
-- Ces DROP sont conditionnels et échoueront silencieusement si les types sont encore utilisés
DO $$
BEGIN
    DROP TYPE IF EXISTS "RuleCategory";
EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Type RuleCategory still in use, skipping';
END $$;

DO $$
BEGIN
    DROP TYPE IF EXISTS "RuleType";
EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Type RuleType still in use, skipping';
END $$;

DO $$
BEGIN
    DROP TYPE IF EXISTS "RuleScope";
EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Type RuleScope still in use, skipping';
END $$;

DO $$
BEGIN
    DROP TYPE IF EXISTS "CatalogCategory";
EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Type CatalogCategory still in use, skipping';
END $$;

DO $$
BEGIN
    DROP TYPE IF EXISTS "ItemType";
EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Type ItemType still in use, skipping';
END $$;
