import { PrismaClient, ItemType, CatalogCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour populer le catalogue avec des Templates et Items
 * selon la nouvelle structure de base de données
 * Approche centrée sur la flexibilité et les coûts avec noms explicites et uniques
 */
async function populateCatalogue() {
  try {
    console.log('🚀 Population du catalogue...');

    // Nettoyer les données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await prisma.catalogSelection.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.template.deleteMany({});

    // 1. Créer des Templates (modèles de base)
    console.log('📋 Création des templates...');
    const templates = await Promise.all([
      // Templates DÉMÉNAGEMENT - Noms explicites basés sur les services
      prisma.template.create({
        data: {
          id: 'template-aide-demenageur',
          type: ItemType.DEMENAGEMENT,
          name: 'Aide déménageur et portage',
          description: 'Équipe spécialisée pour le portage et la manipulation de vos biens',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Portage professionnel', 'Tarification horaire flexible', 'Adaptation selon les besoins', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 30,
          distanceUnit: 'km',
          includes: ['Équipe de 2 professionnels', 'Portage et manutention sécurisé', '50km inclus (Grande couronne Île-de-France)'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-location-vehicule-chauffeur',
          type: ItemType.DEMENAGEMENT,
          name: 'Location véhicule avec chauffeur professionnel',
          description: 'Transport sécurisé avec véhicule adapté et conducteur expérimenté',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Véhicule + chauffeur', 'Transport encadré', 'Sécurité garantie', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 50,
          distanceUnit: 'km',
          includes: ['Véhicule 20m³', '1 Chauffeur professionnel + 1 déménageur professionnel', '50km inclus (Grande couronne Île-de-France)', 'Équipements de protection'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-pro-emballage',
          type: ItemType.DEMENAGEMENT,
          name: 'Service d\'emballage professionnel',
          description: 'Préparation et conditionnement de vos biens avant transport',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Emballage soigné', 'Devis personnalisé', 'Professionnalisme', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['fournitures non incluses', 'Emballage soigné', 'Protection optimale'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-transport-meuble',
          type: ItemType.DEMENAGEMENT,
          name: 'Transport de meuble spécifique (Pas de piano)', 
          description: 'Transport spécialisé pour le déplacement d\'objets encombrants',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Transport spécialisé', 'Tarification adaptée', 'Service ponctuel', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 2 professionnels', 'Protection meubles', 'Transport sécurisé'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-debarras-encombrants',
          type: ItemType.DEMENAGEMENT,
          name: 'Enlèvement d\'encombrants et débarras',
          description: 'Service complet d\'enlèvement et de tri de vos encombrants',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Enlèvement complète', 'Tri et recyclage', 'Certificat d\'évacuation', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 2 professionnels', 'Véhicule de débarras', 'Enlèvement complète', 'Certificat'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-formule-standard',
          type: ItemType.DEMENAGEMENT,
          name: 'Formule standard',
          description: 'Équipe qualifiée pour démontage, remontage, emballage et transport',
          price: 735.00, // 7h × 3 workers × 35€/h
          workers: 3,
          duration: 7,
          features: ['Démontage/Remontage', 'Emballage professionnel', 'Service intégral', 'Qualification', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 3 professionnels', 'Démontage/Remontage', 'Emballage', 'Matériel complet'],
          popular: true,
          isActive: true
        }
      }),

      // Templates NETTOYAGE - Noms explicites basés sur les services
      prisma.template.create({
        data: {
          id: 'template-entretien-complet',
          type: ItemType.MENAGE,
          name: 'Entretien à domicile complet',
          description: 'Nettoyage intégral de votre espace de vie',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Nettoyage complet', 'Tarification adaptée', 'Service personnalisé', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Nettoyage complet', 'Surfaces et sols', 'Sanitaires', 'Cuisine', 'Équipements'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-entretien-courte-duree',
          type: ItemType.MENAGE,
          name: 'Entretien location courte durée',
          description: 'Service d\'entretien entre deux locations (Airbnb, etc.)',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Entretien standard + linge', 'Idéal propriétaires courte durée', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Entretien standard', 'Changement linge', 'Service express'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-entretien-fin-bail',
          type: ItemType.MENAGE,
          name: 'Entretien fin de location',
          description: 'Nettoyage approfondi pour état des lieux de sortie',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Nettoyage approfondi', 'Tarification adaptée', 'Garantie caution', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Tous les espaces', 'Électroménager', 'Placards', 'Balcon/Terrasse', 'Garantie caution'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-vitres',
          type: ItemType.MENAGE,
          name: 'Nettoyage des surfaces vitrées',
          description: 'Nettoyage spécialisé des vitres et surfaces transparentes',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Vitres intérieures et extérieures', 'Tarification adaptée', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Vitres intérieures', 'Vitres extérieures', 'Matériel professionnel'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-appareils-cuisine',
          type: ItemType.MENAGE,
          name: 'Entretien appareil de cuisine',
          description: 'Nettoyage spécialisé des appareils de cuisine par professionnels',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Nettoyage professionnel', 'Tarification transparente', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Nettoyage complet', 'Produits professionnels', 'Garantie protection'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-logement-insalubre',
          type: ItemType.MENAGE,
          name: 'Nettoyage logement insalubre',
          description: 'Nettoyage spécialisé pour logements en état de dégradation',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Nettoyage spécialisé', 'Équipements protection', 'Traitement spécifique', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 3 professionnels', 'Équipements protection', 'Produits spécialisés', 'Garantie résultat'],
          popular: false,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-nettoyage-eco',
          type: ItemType.MENAGE,
          name: 'Nettoyage Ecologique - très respectueux de l\'environnement',
          description: 'Nettoyage avec produits écologiques pour préserver la planète',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Produits écologiques', 'Protection environnement', 'Certification écologique', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Produits écologiques certifiés', 'Nettoyage complet', 'Certificat écologique'],
          popular: true,
          isActive: true
        }
      }),

      // Templates TRANSPORT - Basés sur les services de déménagement
      prisma.template.create({
        data: {
          id: 'template-transport-volumineux',
          type: ItemType.TRANSPORT,
          name: 'Transport d\'objets volumineux',
          description: 'Transport sécurisé pour objets volumineux avec véhicule adapté',
          price: 490.00, // 7h × 2 workers × 35€/h
          workers: 2,
          duration: 7,
          features: ['Transport sécurisé', 'Manutention spécialisée', 'Assurance objets', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 50,
          distanceUnit: 'km',
          includes: ['Véhicule adapté', 'Équipe spécialisée', '50km inclus (Grande couronne Île-de-France)'],
          popular: false,
          isActive: true
        }
      }),

      // Templates LIVRAISON - Basés sur la rapidité
      prisma.template.create({
        data: {
          id: 'template-livraison-express',
          type: ItemType.LIVRAISON,
          name: 'Livraison Express',
          description: 'Livraison express en moins de 2h avec suivi temps réel',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Livraison express', 'Suivi temps réel', 'Flexibilité horaire', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 30,
          distanceUnit: 'km',
          includes: ['Livraison sous 2h', 'Notification SMS', '30km inclus (depuis centre Paris)'],
          popular: true,
          isActive: true
        }
      }),
      prisma.template.create({
        data: {
          id: 'template-livraison-eco',
          type: ItemType.LIVRAISON,
          name: 'Livraison économique',
          description: 'Livraison économique sous 24h avec créneau personnalisé',
          price: 245.00, // 7h × 1 worker × 35€/h
          workers: 1,
          duration: 7,
          features: ['Livraison économique', 'Créneau personnalisé', 'Service fiable', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 30,
          distanceUnit: 'km',
          includes: ['Livraison J+1', 'Créneau 2h', '30km inclus (depuis centre Paris)'],
          popular: false,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${templates.length} templates créés`);

    // 2. Créer des Items basés sur les Templates
    console.log('📦 Création des items...');
    const items = await Promise.all([
      // Items DÉMÉNAGEMENT - Variantes avec promotions et options
      prisma.item.create({
        data: {
          id: 'item-aide-portage-promo',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-aide-demenageur',
          name: 'Assistance manutention et portage - Promotion',
          description: 'Équipe spécialisée pour le portage et la manipulation de vos biens - Offre spéciale',
          price: 441.00, // 10% de réduction sur 490€ (7h × 2 workers × 35€/h)
          workers: 2,
          duration: 7,
          features: ['Portage professionnel', 'Tarification horaire flexible', 'Promotion spéciale', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 50,
          distanceUnit: 'km',
          includes: ['Équipe de 2 professionnels', 'Portage et manutention sécurisé', '50km inclus (Grande couronne Île-de-France)'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-vehicule-chauffeur-standard',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-location-vehicule-chauffeur',
          name: 'Location véhicule avec chauffeur professionnel - Standard',
          description: 'Transport sécurisé avec véhicule adapté et conducteur expérimenté - Service complet',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Véhicule + chauffeur', 'Transport encadré', 'Service complet', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 50,
          distanceUnit: 'km',
          includes: ['Véhicule 20m³', 'Chauffeur professionnel', '50km inclus (Grande couronne Île-de-France)', 'Équipements de protection'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-emballage-premium',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-pro-emballage',
          name: 'Service d\'emballage professionnel - Premium',
          description: 'Préparation et conditionnement de vos biens avant transport - Service premium',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Emballage soigné', 'Devis personnalisé', 'Service premium', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Matériel fourni', 'Emballage soigné', 'Protection optimale'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-transport-meuble',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-transport-meuble',
          name: 'Transport de meuble spécifique (Pas de piano)',
          description: 'Assistance spécialisée pour le déplacement d\'objets encombrants - Service ponctuel',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Transport spécialisé', 'Tarification adaptée', 'Service ponctuel', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 2 professionnels', 'Protection meubles', 'Transport sécurisé'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-debarras-express',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-debarras-encombrants',
          name: 'Enlèvement d\'encombrants et débarras - Express',
          description: 'Service complet d\'enlèvement et de tri de vos encombrants - Service express',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Enlèvement complète', 'Tri et recyclage', 'Service express', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 2 professionnels', 'Véhicule de débarras', 'Enlèvement complète', 'Certificat'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-service-complet',
          type: ItemType.DEMENAGEMENT,
          templateId: 'template-formule-standard',
          name: 'Équipe spécialisée service complet',
          description: 'Équipe qualifiée pour démontage, remontage, emballage et transport - Service complet',
          price: 735.00,
          workers: 3,
          duration: 7,
          features: ['Démontage/Remontage', 'Emballage professionnel', 'Service complet', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 3 professionnels', 'Démontage/Remontage', 'Emballage', 'Matériel complet'],
          popular: true,
          isActive: true
        }
      }),

      // Items NETTOYAGE - Variantes selon les besoins
      prisma.item.create({
        data: {
          id: 'item-entretien-complet-weekend',
          type: ItemType.MENAGE,
          templateId: 'template-entretien-complet',
          name: 'Entretien à domicile complet - Week-end',
          description: 'Nettoyage intégral de votre espace de vie - Disponible week-end',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Nettoyage complet', 'Disponible week-end', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Nettoyage complet', 'Surfaces et sols', 'Sanitaires', 'Cuisine', 'Équipements'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-entretien-courte-duree',
          type: ItemType.MENAGE,
          templateId: 'template-entretien-courte-duree',
          name: 'Entretien location courte durée',
          description: 'Service d\'entretien entre deux locations (Airbnb, etc.)',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Entretien standard + linge', 'Idéal propriétaires courte durée', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Entretien standard', 'Changement linge', 'Service express'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-entretien-fin-bail-garantie',
          type: ItemType.MENAGE,
          templateId: 'template-entretien-fin-bail',
          name: 'Entretien fin de location - Garantie caution',
          description: 'Nettoyage approfondi pour état des lieux de sortie avec garantie caution',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Nettoyage approfondi', 'Garantie caution', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Tous les espaces', 'Électroménager', 'Placards', 'Balcon/Terrasse', 'Garantie caution'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-vitres-express',
          type: ItemType.MENAGE,
          templateId: 'template-vitres',
          name: 'Nettoyage des surfaces vitrées - Express',
          description: 'Nettoyage spécialisé des vitres et surfaces transparentes - Service express',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Vitres intérieures et extérieures', 'Service express', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Vitres intérieures', 'Vitres extérieures', 'Matériel professionnel'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-appareils-cuisine',
          type: ItemType.MENAGE,
          templateId: 'template-appareils-cuisine',
          name: 'Entretien appareil de cuisine',
          description: 'Nettoyage spécialisé des appareils de cuisine par professionnels',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Nettoyage professionnel', 'Tarification transparente', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Nettoyage complet', 'Produits professionnels', 'Garantie protection'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-logement-insalubre-specialise',
          type: ItemType.MENAGE,
          templateId: 'template-logement-insalubre',
          name: 'Nettoyage logement insalubre - Spécialisé',
          description: 'Nettoyage spécialisé pour logements en état de dégradation - Service spécialisé',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Nettoyage spécialisé', 'Équipements protection', 'Service spécialisé', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Équipe de 3 professionnels', 'Équipements protection', 'Produits spécialisés', 'Garantie résultat'],
          popular: false,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-nettoyage-eco-premium',
          type: ItemType.MENAGE,
          templateId: 'template-nettoyage-eco',
          name: 'Nettoyage Ecologique - très respectueux de l\'environnement - Premium',
          description: 'Nettoyage avec produits écologiques pour préserver la planète - Service premium',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Produits écologiques', 'Protection environnement', 'Service premium', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includes: ['Produits écologiques certifiés', 'Nettoyage complet', 'Certificat écologique'],
          popular: true,
          isActive: true
        }
      }),

      // Items TRANSPORT - Spécialisés
      prisma.item.create({
        data: {
          id: 'item-transport-volumineux',
          type: ItemType.TRANSPORT,
          templateId: 'template-transport-volumineux',
          name: 'Transport d\'objets volumineux',
          description: 'Transport spécialisé de meubles avec protection maximale',
          price: 490.00,
          workers: 2,
          duration: 7,
          features: ['Transport sécurisé', 'Protection meubles', 'Équipe experte', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 50,
          distanceUnit: 'km',
          includes: ['Véhicule adapté', 'Sangles et couvertures', '50km inclus (Grande couronne Île-de-France)'],
          popular: false,
          isActive: true
        }
      }),

      // Items LIVRAISON - Options de rapidité
      prisma.item.create({
        data: {
          id: 'item-livraison-express',
          type: ItemType.LIVRAISON,
          templateId: 'template-livraison-express',
          name: 'Livraison Express',
          description: 'Livraison express en moins de 2h avec suivi temps réel',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Livraison express', 'Suivi temps réel', 'Flexibilité horaire', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 30,
          distanceUnit: 'km',
          includes: ['Livraison sous 2h', 'Notification SMS', '30km inclus (depuis centre Paris)'],
          popular: true,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          id: 'item-livraison-eco',
          type: ItemType.LIVRAISON,
          templateId: 'template-livraison-eco',
          name: 'Livraison économique',
          description: 'Livraison économique sous 24h - Solution budget',
          price: 245.00,
          workers: 1,
          duration: 7,
          features: ['Prix attractif', 'Planification flexible', 'Service fiable', '⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires'],
          includedDistance: 30,
          distanceUnit: 'km',
          includes: ['Livraison J+1', 'Créneau 2h', '30km inclus (depuis centre Paris)'],
          popular: false,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${items.length} items créés`);

    // 3. Créer les CatalogSelections
    console.log('🎯 Création des sélections catalogue...');
    const catalogSelections = await Promise.all([
      // DÉMÉNAGEMENT - Communication centrée sur la flexibilité
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-formule-standard',
          itemId: 'item-service-complet',
          category: CatalogCategory.DEMENAGEMENT,
          subcategory: 'Service complet',
          displayOrder: 1,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Formule standard',
          marketingSubtitle: 'Démontage, remontage, emballage',
          marketingDescription: 'Équipe qualifiée pour démontage, remontage, emballage et transport. Démontage, remontage, emballage professionnel inclus. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 735.00,
          badgeText: 'Complet',
          badgeColor: '#3498DB',
          targetAudience: 'Grands projets',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-location-vehicule-chauffeur',
          itemId: 'item-vehicule-chauffeur-standard',
          category: CatalogCategory.DEMENAGEMENT,
          subcategory: 'Transport',
          displayOrder: 2,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Location de véhicule avec chauffeur',
          marketingSubtitle: 'Transport sécurisé et encadré',
          marketingDescription: 'Transport sécurisé avec véhicule adapté et conducteur expérimenté. Idéal pour transport sécurisé et encadré. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 490.00,
          badgeText: 'Populaire',
          badgeColor: '#27AE60',
          targetAudience: 'Projets moyens',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-aide-demenageur',
          itemId: 'item-aide-portage-promo',
          category: CatalogCategory.DEMENAGEMENT,
          subcategory: 'Manutention',
          displayOrder: 3,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Aide déménageur',
          marketingSubtitle: 'Payez uniquement pour la main d\'œuvre dont vous avez besoin',
          marketingDescription: 'Équipe spécialisée pour le portage et la manipulation de vos biens. Tarification horaire flexible, ajustable selon besoins. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 441.00,
          originalPrice: 490.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 49€ - Promotion spéciale',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_10',
          promotionValue: 10,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Petits projets',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-debarras-encombrants',
          itemId: 'item-debarras-express',
          category: CatalogCategory.DEMENAGEMENT,
          subcategory: 'Débarras',
          displayOrder: 4,
          isActive: true,
          isFeatured: false,
          isNewOffer: true,
          marketingTitle: 'Débarras et enlèvement d\'encombrants',
          marketingSubtitle: 'Enlèvement complète et tri',
          marketingDescription: 'Service complet d\'enlèvement et de tri de vos encombrants. Tri et recyclage inclus. Certificat d\'enlèvement fourni. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 245.00,
          originalPrice: 490.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 245€ - Offre spéciale',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_50',
          promotionValue: 50,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Particuliers et professionnels',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-transport-meuble',
          itemId: 'item-transport-meuble',
          category: CatalogCategory.DEMENAGEMENT,
          subcategory: 'Transport spécialisé',
          displayOrder: 5,
          isActive: true,
          isFeatured: false,
          isNewOffer: false,
          marketingTitle: 'Transport de meubles',
          marketingSubtitle: 'Assistance spécialisée pour objets encombrants',
          marketingDescription: 'Assistance spécialisée pour le déplacement d\'objets encombrants. Transport spécialisé avec tarification adaptée. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 245.00,
          originalPrice: 490.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 245€ - Offre spéciale',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_50',
          promotionValue: 50,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Particuliers',
          isVisible: false
        }
      }),

      // MÉNAGE - Communication centrée sur la durée et la garantie
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-entretien-complet',
          itemId: 'item-entretien-complet-weekend',
          category: CatalogCategory.MENAGE,
          subcategory: 'Général',
          displayOrder: 1,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Entretien complet',
          marketingSubtitle: 'Disponible samedi et dimanche',
          marketingDescription: 'Nettoyage intégral de votre espace de vie. Nettoyage complet, surfaces et sols, sanitaires, cuisine, équipements. Disponible le week-end. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 245.00,
          badgeText: 'Week-end',
          badgeColor: '#9B59B6',
          targetAudience: 'Actifs et familles',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-nettoyage-eco',
          itemId: 'item-nettoyage-eco-premium',
          category: CatalogCategory.MENAGE,
          subcategory: 'Écologique',
          displayOrder: 2,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Nettoyage écologique',
          marketingSubtitle: 'Produits écologiques pour préserver la planète',
          marketingDescription: 'Nettoyage avec produits écologiques certifiés pour préserver la planète. Service premium avec certificat écologique. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 220.50,
          originalPrice: 245.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 24.50€ - Service écologique',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_10',
          promotionValue: 10,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Consommateurs responsables',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-entretien-fin-bail',
          itemId: 'item-entretien-fin-bail-garantie',
          category: CatalogCategory.MENAGE,
          subcategory: 'Fin de bail',
          displayOrder: 3,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Entretien fin bail',
          marketingSubtitle: 'Garantie récupération caution',
          marketingDescription: 'Nettoyage approfondi pour état des lieux de sortie. Nettoyage approfondi, souvent plus technique. Garantie caution. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 490.00,
          badgeText: 'Garantie',
          badgeColor: '#3498DB',
          targetAudience: 'Locataires',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-entretien-courte-duree',
          itemId: 'item-entretien-courte-duree',
          category: CatalogCategory.MENAGE,
          subcategory: 'Location courte durée',
          displayOrder: 4,
          isActive: true,
          isFeatured: true,
          isNewOffer: false,
          marketingTitle: 'Entretien location courte durée - Airbnb',
          marketingSubtitle: 'Idéal pour les propriétaires de courte durée',
          marketingDescription: 'Service d\'entretien entre deux locations (Airbnb, etc.). Entretien standard + changement de linge inclus. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 245.00,
          badgeText: 'Courte durée',
          badgeColor: '#E67E22',
          targetAudience: 'Propriétaires Airbnb',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-vitres',
          itemId: 'item-vitres-express',
          category: CatalogCategory.MENAGE,
          subcategory: 'Spécialisé',
          displayOrder: 5,
          isActive: true,
          isFeatured: false,
          isNewOffer: false,
          marketingTitle: 'Nettoyage de vitres',
          marketingSubtitle: 'Vitres intérieures et extérieures',
          marketingDescription: 'Nettoyage spécialisé des vitres et surfaces transparentes. Vitres intérieures et extérieures avec matériel professionnel. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 196.00,
          originalPrice: 245.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 49€ - Service spécialisé',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_20',
          promotionValue: 20,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Particuliers et professionnels',
          isVisible: false
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-logement-insalubre',
          itemId: 'item-logement-insalubre-specialise',
          category: CatalogCategory.MENAGE,
          subcategory: 'Spécialisé',
          displayOrder: 6,
          isActive: true,
          isFeatured: false,
          isNewOffer: true,
          marketingTitle: 'Nettoyage de logement insalubre',
          marketingSubtitle: 'Service spécialisé avec équipements de protection',
          marketingDescription: 'Nettoyage spécialisé pour logements en état de dégradation. Équipements de protection et produits spécialisés inclus. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 490.00,
          badgeText: 'Spécialisé',
          badgeColor: '#E67E22',
          targetAudience: 'Professionnels',
          isVisible: false
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-appareils-cuisine',
          itemId: 'item-appareils-cuisine',
          category: CatalogCategory.MENAGE,
          subcategory: 'Spécialisé',
          displayOrder: 7,
          isActive: true,
          isFeatured: false,
          isNewOffer: false,
          marketingTitle: 'Nettoyage d\'appareils de cuisine',
          marketingSubtitle: 'Nettoyage professionnel des appareils',
          marketingDescription: 'Nettoyage spécialisé des appareils de cuisine par professionnels. Nettoyage complet avec produits professionnels. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 175.00,
          badgeText: 'Spécialisé',
          badgeColor: '#E67E22',
          targetAudience: 'Particuliers',
          isVisible: false
        }
      }),

      // TRANSPORT - Communication centrée sur la spécialisation
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-transport-volumineux',
          itemId: 'item-transport-volumineux',
          category: CatalogCategory.TRANSPORT,
          subcategory: 'Meubles',
          displayOrder: 1,
          isActive: true,
          isFeatured: false,
          isNewOffer: false,
          marketingTitle: 'Transport volumineux',
          marketingSubtitle: 'Spécialiste objets volumineux',
          marketingDescription: 'Transport spécialisé de meubles avec protection maximale. Transport sécurisé pour objets volumineux. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 490.00,
          targetAudience: 'Particuliers et professionnels',
          isVisible: true
        }
      }),

      // LIVRAISON - Communication centrée sur la rapidité et l'économie
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-livraison-express',
          itemId: 'item-livraison-express',
          category: CatalogCategory.LIVRAISON,
          subcategory: 'Express',
          displayOrder: 1,
          isActive: true,
          isFeatured: true,
          isNewOffer: true,
          marketingTitle: 'Livraison express',
          marketingSubtitle: 'Livré en moins de 2h',
          marketingDescription: 'Livraison express en moins de 2h avec suivi temps réel. Idéal pour vos urgences. Flexibilité horaire garantie. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 220.50,
          originalPrice: 245.00,
          badgeText: 'PROMO',
          badgeColor: '#E74C3C',
          promotionText: 'Économisez 24.50€ - Service express',
          // ✅ Système de promotion
          promotionCode: 'PERCENT_10',
          promotionValue: 10,
          promotionType: 'PERCENT',
          isPromotionActive: true,
          targetAudience: 'Urgences et professionnels',
          isVisible: true
        }
      }),
      prisma.catalogSelection.create({
        data: {
          id: 'catalogue-selection-livraison-eco',
          itemId: 'item-livraison-eco',
          category: CatalogCategory.LIVRAISON,
          subcategory: 'Standard',
          displayOrder: 2,
          isActive: true,
          isFeatured: false,
          isNewOffer: false,
          marketingTitle: 'Livraison formule éco',
          marketingSubtitle: 'Solution économique',
          marketingDescription: 'Livraison économique sous 24h. Parfait quand vous n\'êtes pas pressé. Prix attractif garanti. ⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires.',
          marketingPrice: 245.00,
          targetAudience: 'Particuliers',
          isVisible: true
        }
      })
    ]);

    console.log(`✅ ${catalogSelections.length} sélections catalogue créées`);

    // Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   📋 Templates: ${templates.length}`);
    console.log(`   📦 Items: ${items.length}`);
    console.log(`   🎯 Catalogue: ${catalogSelections.length}`);
    console.log('\n✅ Population du catalogue terminée avec succès!');
    console.log('\n🎯 NOUVELLE APPROCHE:');
    console.log('   • Noms explicites et uniques basés sur les services réels');
    console.log('   • Communication centrée sur la flexibilité et les coûts');
    console.log('   • Prix transparents sans surprise de volume');
    console.log('   • Garanties claires et explicites');
    console.log('   • Optimisation SEO avec termes uniques');
    console.log('   • Système de promotion intégré avec codes promo');
    console.log('\n🆕 NOUVEAUX FORFAITS AJOUTÉS:');
    console.log('   • Évacuation d\'encombrants et débarras (490€)');
    console.log('   • Équipe spécialisée service complet (735€)');
    console.log('   • Nettoyage logement dégradé (490€)');
    console.log('   • Nettoyage respectueux de l\'environnement (245€)');
    console.log('\n🚨 AVERTISSEMENTS DE PERSONNALISATION INTÉGRÉS:');
    console.log('   • Tous les forfaits incluent des avertissements uniformisés sur les contraintes logistiques');
    console.log('   • Avertissement standardisé: "⚠️ ATTENTION: Des contraintes logistiques telles que (escaliers étroits, colimaçon, absence d\'ascenseur, sols fragiles ...) peuvent engendrer de coûts supplémentaires"');
    console.log('   • Taux horaire uniformisé à 35€ HT pour tous les services');
    console.log('   • Calculs cohérents basés sur 7h × nombre de workers × 35€/h');
    console.log('\n📍 RAYONS D\'INTERVENTION:');
    console.log('   • DÉMÉNAGEMENT: 50km inclus (Grande couronne Île-de-France)');
    console.log('   • MÉNAGE & NETTOYAGE: 30km inclus (depuis centre Paris)');
    console.log('   • TRANSPORT: 50km inclus (Grande couronne Île-de-France)');
    console.log('   • LIVRAISON: 30km inclus (depuis centre Paris)');
    console.log('\n⚠️ CONTRAINTES LOGISTIQUES UNIFORMISÉES:');
    console.log('   • Escaliers étroits ou en colimaçon');
    console.log('   • Absence d\'ascenseur');
    console.log('   • Sols fragiles ou parquets anciens');
    console.log('   • Accès difficiles (étages élevés)');
    console.log('   • Contraintes d\'accès spécifiques');
    console.log('\n💰 TAUX HORAIRE UNIFORMISÉ:');
    console.log('   • Tous les services: 35€ HT/heure');
    console.log('   • Calculs cohérents: 7h × nombre de workers × 35€/h');
    console.log('   • Prix transparents et prévisibles');
    console.log('\n🎉 PROMOTIONS AJOUTÉES:');
    console.log('   • Aide déménageur: -10% (PERCENT_10) - 441€ au lieu de 490€');
    console.log('   • Débarras encombrants: -50% (PERCENT_50) - 245€ au lieu de 490€');
    console.log('   • Transport meubles: -50% (PERCENT_50) - 245€ au lieu de 490€');
    console.log('   • Nettoyage écologique: -10% (PERCENT_10) - 220.50€ au lieu de 245€');
    console.log('   • Nettoyage vitres: -20% (PERCENT_20) - 196€ au lieu de 245€');
    console.log('   • Livraison express: -10% (PERCENT_10) - 220.50€ au lieu de 245€');
    console.log('\n🔍 SURVEILLANCE REQUISE:');
    console.log('   • Surveiller de près toutes les personnalisations');
    console.log('   • Évaluer systématiquement les contraintes logistiques');
    console.log('   • Appliquer le taux horaire de 35€ HT de manière cohérente');
    console.log('   • Informer clairement le client des coûts supplémentaires');
    console.log('   • Vérifier l\'application correcte des promotions dans le backend');

  } catch (error) {
    console.error('❌ Erreur lors de la population du catalogue:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  populateCatalogue()
    .then(() => {
      console.log('Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur dans le script:', error);
      process.exit(1);
    });
}

export { populateCatalogue }; 