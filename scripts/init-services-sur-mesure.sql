-- Script d'initialisation des services sur mesure
-- Ce script crée les templates et items pour les services sur mesure

-- =====================================================
-- 1. CRÉATION DES TEMPLATES SUR MESURE
-- =====================================================

-- Template Déménagement Sur Mesure
INSERT INTO templates (
  id, type, name, description, price, workers, duration, 
  features, included_distance, distance_unit, includes, 
  is_active, created_at, updated_at
) VALUES (
  'template-demenagement-sur-mesure', 'DEMENAGEMENT', 
  'Déménagement Sur Mesure', 
  'Service adaptable à tous les cas de figure - Projet personnalisé',
  NULL, NULL, NULL, -- Valeurs NULL car sur mesure
  ARRAY['Projet adaptable', 'Conseiller expert', 'Devis personnalisé'],
  NULL, 'km', ARRAY['Étude gratuite', 'Options modulables', 'Devis détaillé'],
  true, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  includes = EXCLUDED.includes,
  updated_at = NOW();

-- Template Ménage Sur Mesure
INSERT INTO templates (
  id, type, name, description, price, workers, duration, 
  features, included_distance, distance_unit, includes, 
  is_active, created_at, updated_at
) VALUES (
  'template-menage-sur-mesure', 'MENAGE', 
  'Ménage Sur Mesure', 
  'Service de nettoyage personnalisé selon vos besoins spécifiques',
  NULL, NULL, NULL, -- Valeurs NULL car sur mesure
  ARRAY['Service personnalisé', 'Conseiller expert', 'Devis adapté'],
  NULL, 'km', ARRAY['Étude gratuite', 'Options modulables', 'Devis détaillé'],
  true, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  includes = EXCLUDED.includes,
  updated_at = NOW();

-- =====================================================
-- 2. CRÉATION DES ITEMS ASSOCIÉS
-- =====================================================

-- Item Déménagement Sur Mesure
INSERT INTO items (
  id, type, template_id, name, description, price, workers, duration,
  features, included_distance, distance_unit, includes, is_active,
  status, created_at, updated_at
) VALUES (
  'item-demenagement-sur-mesure', 'DEMENAGEMENT', 'template-demenagement-sur-mesure',
  'Déménagement Sur Mesure', 
  'Un conseiller dédié vous accompagne dans votre projet personnalisé',
  NULL, NULL, NULL, -- Prix calculé selon besoins
  ARRAY['Projet adaptable', 'Conseiller expert', 'Devis personnalisé'],
  NULL, 'km', ARRAY['Étude gratuite', 'Options modulables'],
  true, 'ACTIVE', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  includes = EXCLUDED.includes,
  updated_at = NOW();

-- Item Ménage Sur Mesure
INSERT INTO items (
  id, type, template_id, name, description, price, workers, duration,
  features, included_distance, distance_unit, includes, is_active,
  status, created_at, updated_at
) VALUES (
  'item-menage-sur-mesure', 'MENAGE', 'template-menage-sur-mesure',
  'Ménage Sur Mesure', 
  'Service de nettoyage personnalisé selon vos besoins spécifiques',
  NULL, NULL, NULL, -- Prix calculé selon besoins
  ARRAY['Service personnalisé', 'Conseiller expert', 'Devis adapté'],
  NULL, 'km', ARRAY['Étude gratuite', 'Options modulables'],
  true, 'ACTIVE', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  includes = EXCLUDED.includes,
  updated_at = NOW();

-- =====================================================
-- 3. CRÉATION DES CATALOG SELECTIONS
-- =====================================================

-- CatalogSelection Déménagement Sur Mesure
INSERT INTO "CatalogSelection" (
  id, "itemId", category, subcategory, "displayOrder", "marketingPrice", "originalPrice",
  "badgeText", "updatedAt"
) VALUES (
  'catalog-demenagement-sur-mesure', 'item-demenagement-sur-mesure', 
  'DEMENAGEMENT', 'sur-mesure', 1, NULL, NULL, -- Prix calculé selon besoins
  '100% Adapté', NOW()
) ON CONFLICT (id) DO UPDATE SET
  "badgeText" = EXCLUDED."badgeText",
  "updatedAt" = NOW();

-- CatalogSelection Ménage Sur Mesure
INSERT INTO "CatalogSelection" (
  id, "itemId", category, subcategory, "displayOrder", "marketingPrice", "originalPrice",
  "badgeText", "updatedAt"
) VALUES (
  'catalog-menage-sur-mesure', 'item-menage-sur-mesure', 
  'MENAGE', 'sur-mesure', 1, NULL, NULL, -- Prix calculé selon besoins
  '100% Adapté', NOW()
) ON CONFLICT (id) DO UPDATE SET
  "badgeText" = EXCLUDED."badgeText",
  "updatedAt" = NOW();

-- =====================================================
-- 4. VÉRIFICATION DES INSERTIONS
-- =====================================================

-- Vérifier les templates créés
SELECT 'Templates créés:' as info;
SELECT id, name, type, is_active FROM templates WHERE id LIKE '%sur-mesure%';

-- Vérifier les items créés
SELECT 'Items créés:' as info;
SELECT id, name, type, template_id, status FROM items WHERE id LIKE '%sur-mesure%';

-- Vérifier les catalog selections créés
SELECT 'Catalog Selections créés:' as info;
SELECT id, category, subcategory, marketing_title, badge_text, is_featured 
FROM catalog_selections WHERE id LIKE '%sur-mesure%';

-- =====================================================
-- 5. RÉSULTAT ATTENDU
-- =====================================================

/*
Résultat attendu après exécution :

✅ 2 templates créés :
   - template-demenagement-sur-mesure (type: DEMENAGEMENT)
   - template-menage-sur-mesure (type: MENAGE)

✅ 2 items créés :
   - item-demenagement-sur-mesure (lié à template-demenagement-sur-mesure)
   - item-menage-sur-mesure (lié à template-menage-sur-mesure)

✅ 2 catalog selections créés :
   - catalog-demenagement-sur-mesure (badge: "100% Adapté", couleur: #3498DB)
   - catalog-menage-sur-mesure (badge: "100% Adapté", couleur: #3498DB)

Ces services apparaîtront automatiquement dans le catalogue avec :
- Badge "100% Adapté" en bleu
- Prix "Sur devis" (NULL)
- Position en haut de chaque catégorie (is_featured: true)
*/ 