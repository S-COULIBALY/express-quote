-- Migration pour ajouter le champ businessType au modèle Configuration
-- Date: 2025-01-26
-- Objectif: Permettre une meilleure organisation des configurations par type de service métier

-- Ajouter la colonne businessType après la colonne description
ALTER TABLE "Configuration" ADD COLUMN "businessType" TEXT;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX "idx_config_business_type" ON "Configuration"("businessType");

-- Créer un index composite pour les requêtes par catégorie et type de service
CREATE INDEX "idx_config_category_business_type" ON "Configuration"("category", "businessType");

-- Mettre à jour les configurations existantes avec le bon businessType
-- Pour les configurations PRICING (génériques)
UPDATE "Configuration" 
SET "businessType" = 'GENERIC' 
WHERE "category" = 'PRICING';

-- Pour les configurations BUSINESS_TYPE_PRICING
UPDATE "Configuration" 
SET "businessType" = 'DÉMÉNAGEMENT' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'MOVING_%';

UPDATE "Configuration" 
SET "businessType" = 'NETTOYAGE' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'CLEANING_%';

UPDATE "Configuration" 
SET "businessType" = 'LIVRAISON' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'DELIVERY_%';

UPDATE "Configuration" 
SET "businessType" = 'TRANSPORT' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'TRANSPORT_%';

UPDATE "Configuration" 
SET "businessType" = 'EMBALLAGE' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'PACKING_%';

UPDATE "Configuration" 
SET "businessType" = 'STOCKAGE' 
WHERE "category" = 'BUSINESS_TYPE_PRICING' 
AND "key" LIKE 'STORAGE_%';

-- Pour les autres catégories
UPDATE "Configuration" 
SET "businessType" = 'SYSTEM' 
WHERE "category" IN ('SYSTEM_VALUES', 'TECHNICAL_LIMITS', 'INSURANCE_CONFIG', 'SERVICE_PARAMS')
OR "businessType" IS NULL;
