#!/usr/bin/env node

/**
 * 🎯 SEED RÈGLES MÉTIER RÉALISTES (2025)
 *
 * Peuple la base de données avec des règles métier basées sur la recherche marché
 * et les données des modaux frontend améliorés.
 *
 * Source de vérité unique : Frontend → BDD → Fallback
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRealisticRules() {
  console.log('🌱 ═══ SEED RÈGLES MÉTIER RÉALISTES (2025) ═══\n');

  try {
    // 1. ═══════════════════════════════════════════════════════════════
    // RÈGLES DÉMÉNAGEMENT - Contraintes et Services
    // ═══════════════════════════════════════════════════════════════
    console.log('🚛 Création des règles DÉMÉNAGEMENT...');

    const movingConstraints = [
      // Contraintes d'accès véhicule
      { name: 'Zone piétonne avec restrictions', serviceType: 'MOVING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'vehicle_access', zone: 'pedestrian' }, description: 'Autorisation mairie requise, frais administratifs' },
      { name: 'Rue étroite ou inaccessible au camion', serviceType: 'MOVING', category: 'SURCHARGE', value: 50.0, percentBased: true, condition: { type: 'vehicle_access', road: 'narrow' }, description: 'Camion ne peut pas accéder, portage supplémentaire' },
      { name: 'Stationnement difficile ou payant', serviceType: 'MOVING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'vehicle_access', parking: 'difficult' }, description: 'Frais de stationnement, temps supplémentaire' },
      { name: 'Circulation complexe', serviceType: 'MOVING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'vehicle_access', traffic: 'complex' }, description: 'Temps de trajet augmenté, détours obligatoires' },

      // Contraintes bâtiment
      { name: 'Ascenseur en panne ou hors service', serviceType: 'MOVING', category: 'SURCHARGE', value: 35.0, percentBased: true, condition: { type: 'building', elevator: 'unavailable' }, description: 'Transport par escaliers obligatoire' },
      { name: 'Ascenseur trop petit pour les meubles', serviceType: 'MOVING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'building', elevator: 'small' }, description: 'Démontage obligatoire ou escaliers' },
      { name: 'Ascenseur interdit pour déménagement', serviceType: 'MOVING', category: 'SURCHARGE', value: 35.0, percentBased: true, condition: { type: 'building', elevator: 'forbidden' }, description: 'Règlement copropriété, escaliers obligatoires' },
      { name: 'Escalier difficile ou dangereux', serviceType: 'MOVING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'building', stairs: 'difficult' }, description: 'Monte-meuble recommandé, risques élevés' },
      { name: 'Couloirs étroits ou encombrés', serviceType: 'MOVING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'building', corridors: 'narrow' }, description: 'Démontage supplémentaire, temps augmenté' },

      // Distance et portage
      { name: 'Distance de portage > 30m', serviceType: 'MOVING', category: 'SURCHARGE', value: 35.0, percentBased: true, condition: { type: 'distance', carrying: 'long' }, description: 'Surcoût main d\'œuvre, navettes nécessaires' },
      { name: 'Passage indirect obligatoire', serviceType: 'MOVING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'distance', access: 'indirect' }, description: 'Sortie non directe, protection sols' },
      { name: 'Accès complexe multi-niveaux', serviceType: 'MOVING', category: 'SURCHARGE', value: 50.0, percentBased: true, condition: { type: 'distance', access: 'multilevel' }, description: 'Plusieurs étages à traverser, temps multiplié' },

      // Sécurité et autorisations
      { name: 'Contrôle d\'accès strict', serviceType: 'MOVING', category: 'SURCHARGE', value: 20.0, percentBased: true, condition: { type: 'security', access: 'strict' }, description: 'Autorisation préalable, badges nécessaires' },
      { name: 'Autorisation administrative', serviceType: 'MOVING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'security', permit: 'required' }, description: 'Démarches mairie, réservation voirie' },
      { name: 'Restrictions horaires strictes', serviceType: 'MOVING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'security', time: 'restricted' }, description: 'Créneaux limités, coordination complexe' },
      { name: 'Sol fragile ou délicat', serviceType: 'MOVING', category: 'SURCHARGE', value: 15.0, percentBased: true, condition: { type: 'security', floor: 'fragile' }, description: 'Protection supplémentaire obligatoire' },

      // Monte-meuble (coût fixe)
      { name: 'Monte-meuble', serviceType: 'MOVING', category: 'FIXED', value: 300.0, percentBased: false, condition: { type: 'equipment', lift: 'required' }, description: 'Location monte-meuble 200-400€, ajouté automatiquement' }
    ];

    const movingServices = [
      // Services de manutention
      { name: 'Meubles encombrants', serviceType: 'MOVING', category: 'FIXED', value: 150.0, percentBased: false, condition: { type: 'service', handling: 'bulky' }, description: 'Armoires, canapés d\'angle, piano droit' },
      { name: 'Démontage de meubles', serviceType: 'MOVING', category: 'FIXED', value: 80.0, percentBased: false, condition: { type: 'service', handling: 'disassembly' }, description: 'Temps spécialisé inclus, outillage pro' },
      { name: 'Remontage de meubles', serviceType: 'MOVING', category: 'FIXED', value: 100.0, percentBased: false, condition: { type: 'service', handling: 'reassembly' }, description: 'Remontage garanti conforme' },
      { name: 'Transport piano', serviceType: 'MOVING', category: 'FIXED', value: 250.0, percentBased: false, condition: { type: 'service', handling: 'piano' }, description: 'Équipement spécialisé, assurance renforcée' },

      // Services d'emballage
      { name: 'Emballage professionnel départ', serviceType: 'MOVING', category: 'FIXED', value: 120.0, percentBased: false, condition: { type: 'service', packing: 'departure' }, description: 'Équipe spécialisée, matériel professionnel' },
      { name: 'Déballage professionnel arrivée', serviceType: 'MOVING', category: 'FIXED', value: 100.0, percentBased: false, condition: { type: 'service', packing: 'arrival' }, description: 'Déballage + nettoyage + évacuation cartons' },
      { name: 'Fournitures d\'emballage', serviceType: 'MOVING', category: 'FIXED', value: 50.0, percentBased: false, condition: { type: 'service', packing: 'supplies' }, description: 'Cartons renforcés, papier bulle, sangles pro' },
      { name: 'Emballage œuvres d\'art', serviceType: 'MOVING', category: 'FIXED', value: 200.0, percentBased: false, condition: { type: 'service', packing: 'artwork' }, description: 'Caissage sur mesure, protection maximale' },

      // Services de protection
      { name: 'Objets fragiles/précieux', serviceType: 'MOVING', category: 'FIXED', value: 180.0, percentBased: false, condition: { type: 'service', protection: 'fragile' }, description: 'Emballage renforcé + assurance tous risques' },
      { name: 'Objets très lourds', serviceType: 'MOVING', category: 'FIXED', value: 200.0, percentBased: false, condition: { type: 'service', protection: 'heavy' }, description: 'Équipement hydraulique, sangles renforcées' },
      { name: 'Inventaire avec photos', serviceType: 'MOVING', category: 'FIXED', value: 80.0, percentBased: false, condition: { type: 'service', protection: 'inventory' }, description: 'État des lieux photographique complet' },

      // Services annexes
      { name: 'Stockage temporaire', serviceType: 'MOVING', category: 'FIXED', value: 150.0, percentBased: false, condition: { type: 'service', annexe: 'storage' }, description: 'Garde-meuble climatisé, accès 24h/24' },
      { name: 'Nettoyage après déménagement', serviceType: 'MOVING', category: 'FIXED', value: 120.0, percentBased: false, condition: { type: 'service', annexe: 'cleaning' }, description: 'Nettoyage complet logement vide' },
      { name: 'Gestion administrative', serviceType: 'MOVING', category: 'FIXED', value: 60.0, percentBased: false, condition: { type: 'service', annexe: 'admin' }, description: 'Résiliation/transfert tous contrats' },
      { name: 'Transport animaux', serviceType: 'MOVING', category: 'FIXED', value: 80.0, percentBased: false, condition: { type: 'service', annexe: 'pets' }, description: 'Véhicule adapté, cage de transport' }
    ];

    // 2. ═══════════════════════════════════════════════════════════════
    // RÈGLES NETTOYAGE - Contraintes et Services
    // ═══════════════════════════════════════════════════════════════
    console.log('🧽 Création des règles NETTOYAGE...');

    const cleaningConstraints = [
      // Contraintes d'accès
      { name: 'Stationnement limité ou payant', serviceType: 'CLEANING', category: 'SURCHARGE', value: 10.0, percentBased: true, condition: { type: 'access', parking: 'limited' }, description: 'Difficulté de stationnement, frais supplémentaires possibles' },
      { name: 'Absence d\'ascenseur', serviceType: 'CLEANING', category: 'SURCHARGE', value: 15.0, percentBased: true, condition: { type: 'access', elevator: 'none' }, description: 'Transport matériel par escaliers' },
      { name: 'Accès difficile au bâtiment', serviceType: 'CLEANING', category: 'SURCHARGE', value: 10.0, percentBased: true, condition: { type: 'access', building: 'difficult' }, description: 'Codes, digicode, interphone complexe' },
      { name: 'Contrôle de sécurité strict', serviceType: 'CLEANING', category: 'SURCHARGE', value: 15.0, percentBased: true, condition: { type: 'access', security: 'strict' }, description: 'Badge, gardien, vérifications d\'identité' },

      // Contraintes de travail
      { name: 'Présence d\'animaux', serviceType: 'CLEANING', category: 'SURCHARGE', value: 10.0, percentBased: true, condition: { type: 'work', pets: 'present' }, description: 'Chiens, chats, poils, produits adaptés nécessaires' },
      { name: 'Présence d\'enfants', serviceType: 'CLEANING', category: 'SURCHARGE', value: 15.0, percentBased: true, condition: { type: 'work', children: 'present' }, description: 'Produits écologiques, sécurité renforcée' },
      { name: 'Allergies signalées', serviceType: 'CLEANING', category: 'SURCHARGE', value: 20.0, percentBased: true, condition: { type: 'work', allergies: 'present' }, description: 'Produits hypoallergéniques, précautions spéciales' },
      { name: 'Objets fragiles/précieux', serviceType: 'CLEANING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'work', items: 'fragile' }, description: 'Antiquités, œuvres d\'art, manipulation délicate' },
      { name: 'Meubles lourds à déplacer', serviceType: 'CLEANING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'work', furniture: 'heavy' }, description: 'Mobilier encombrant nécessitant 2 personnes' },

      // Contraintes horaires
      { name: 'Créneau horaire spécifique', serviceType: 'CLEANING', category: 'SURCHARGE', value: 20.0, percentBased: true, condition: { type: 'schedule', window: 'specific' }, description: 'Disponibilité réduite, contraintes client' },
      { name: 'Intervention matinale', serviceType: 'CLEANING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'schedule', time: 'early' }, description: 'Majoration horaires atypiques (avant 8h)' },
      { name: 'Service en soirée', serviceType: 'CLEANING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'schedule', time: 'evening' }, description: 'Majoration horaires atypiques (après 18h)' },
      { name: 'Service weekend', serviceType: 'CLEANING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'schedule', day: 'weekend' }, description: 'Samedi/dimanche, majoration weekend' },
      { name: 'Service d\'urgence', serviceType: 'CLEANING', category: 'SURCHARGE', value: 50.0, percentBased: true, condition: { type: 'schedule', urgency: 'emergency' }, description: 'Intervention d\'urgence, mobilisation rapide' },

      // Contraintes liées au lieu
      { name: 'Saleté importante/tenace', serviceType: 'CLEANING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'location', dirt: 'heavy' }, description: 'Nettoyage intensif, temps supplémentaire' },
      { name: 'Post-construction/travaux', serviceType: 'CLEANING', category: 'SURCHARGE', value: 60.0, percentBased: true, condition: { type: 'location', work: 'construction' }, description: 'Poussière, gravats, matériel renforcé' },
      { name: 'Dégâts des eaux récents', serviceType: 'CLEANING', category: 'SURCHARGE', value: 80.0, percentBased: true, condition: { type: 'location', damage: 'water' }, description: 'Humidité, moisissures potentielles, équipement spécial' },
      { name: 'Présence de moisissure', serviceType: 'CLEANING', category: 'SURCHARGE', value: 100.0, percentBased: true, condition: { type: 'location', mold: 'present' }, description: 'Traitement antifongique, EPI spéciaux' },
      { name: 'Espace très restreint', serviceType: 'CLEANING', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'location', space: 'limited' }, description: 'Meubles encombrants, accès difficile' },
      { name: 'Situation d\'accumulation', serviceType: 'CLEANING', category: 'SURCHARGE', value: 150.0, percentBased: true, condition: { type: 'location', hoarding: 'present' }, description: 'Syndrome de Diogène, tri préalable nécessaire' },

      // Contraintes matérielles
      { name: 'Pas d\'accès à l\'eau', serviceType: 'CLEANING', category: 'SURCHARGE', value: 50.0, percentBased: true, condition: { type: 'utilities', water: 'none' }, description: 'Approvisionnement eau, équipement autonome' },
      { name: 'Pas d\'électricité', serviceType: 'CLEANING', category: 'SURCHARGE', value: 40.0, percentBased: true, condition: { type: 'utilities', power: 'none' }, description: 'Matériel sur batterie, éclairage portatif' },
      { name: 'Produits spécifiques requis', serviceType: 'CLEANING', category: 'SURCHARGE', value: 30.0, percentBased: true, condition: { type: 'utilities', products: 'special' }, description: 'Produits professionnels, détachants spéciaux' },
      { name: 'Équipement industriel requis', serviceType: 'CLEANING', category: 'SURCHARGE', value: 60.0, percentBased: true, condition: { type: 'utilities', equipment: 'industrial' }, description: 'Mono-brosse, injecteur-extracteur, haute pression' },
      { name: 'Travail en hauteur', serviceType: 'CLEANING', category: 'SURCHARGE', value: 80.0, percentBased: true, condition: { type: 'utilities', height: 'required' }, description: 'Échafaudage, harnais, nettoyage vitres hautes' }
    ];

    const cleaningServices = [
      // Services de nettoyage spécialisé
      { name: 'Grand nettoyage de printemps', serviceType: 'CLEANING', category: 'FIXED', value: 80.0, percentBased: false, condition: { type: 'service', specialized: 'deep' }, description: 'Nettoyage complet incluant placards, électroménager' },
      { name: 'Nettoyage tapis et moquettes', serviceType: 'CLEANING', category: 'FIXED', value: 60.0, percentBased: false, condition: { type: 'service', specialized: 'carpet' }, description: 'Injection-extraction, traitement taches' },
      { name: 'Nettoyage vitres complet', serviceType: 'CLEANING', category: 'FIXED', value: 40.0, percentBased: false, condition: { type: 'service', specialized: 'windows' }, description: 'Toutes vitres accessibles, produits anti-traces' },
      { name: 'Nettoyage électroménager', serviceType: 'CLEANING', category: 'FIXED', value: 50.0, percentBased: false, condition: { type: 'service', specialized: 'appliances' }, description: 'Four, frigo, lave-vaisselle, micro-ondes' },

      // Services de désinfection
      { name: 'Désinfection complète', serviceType: 'CLEANING', category: 'FIXED', value: 70.0, percentBased: false, condition: { type: 'service', disinfection: 'complete' }, description: 'Traitement virucide, surfaces contact' },
      { name: 'Protocole sanitaire renforcé', serviceType: 'CLEANING', category: 'FIXED', value: 30.0, percentBased: false, condition: { type: 'service', disinfection: 'covid' }, description: 'Désinfection selon protocoles sanitaires' },
      { name: 'Traitement anti-allergènes', serviceType: 'CLEANING', category: 'FIXED', value: 45.0, percentBased: false, condition: { type: 'service', disinfection: 'allergen' }, description: 'Produits hypoallergéniques, acariens' },

      // Services d'entretien étendu
      { name: 'Entretien mobilier', serviceType: 'CLEANING', category: 'FIXED', value: 35.0, percentBased: false, condition: { type: 'service', maintenance: 'furniture' }, description: 'Nourrissage cuir, cirage bois, protection' },
      { name: 'Nettoyage argenterie', serviceType: 'CLEANING', category: 'FIXED', value: 25.0, percentBased: false, condition: { type: 'service', maintenance: 'silver' }, description: 'Produits spécialisés métaux précieux' },
      { name: 'Rangement et organisation', serviceType: 'CLEANING', category: 'FIXED', value: 60.0, percentBased: false, condition: { type: 'service', maintenance: 'organization' }, description: 'Tri, rangement optimisé, étiquetage' },

      // Services logistiques
      { name: 'Réapprovisionnement produits', serviceType: 'CLEANING', category: 'FIXED', value: 20.0, percentBased: false, condition: { type: 'service', logistics: 'supply' }, description: 'Achat et approvisionnement produits ménagers' },
      { name: 'Évacuation déchets', serviceType: 'CLEANING', category: 'FIXED', value: 40.0, percentBased: false, condition: { type: 'service', logistics: 'waste' }, description: 'Tri sélectif, évacuation selon réglementation' },
      { name: 'Gestion trousseau de clés', serviceType: 'CLEANING', category: 'FIXED', value: 15.0, percentBased: false, condition: { type: 'service', logistics: 'keys' }, description: 'Service récupération/dépôt clés sécurisé' }
    ];

    // 3. ═══════════════════════════════════════════════════════════════
    // RÈGLES DELIVERY - Basées sur la recherche marché
    // ═══════════════════════════════════════════════════════════════
    console.log('🚚 Création des règles DELIVERY...');

    const deliveryRules = [
      // Majorations horaires
      { name: 'Majoration weekend livraison', serviceType: 'DELIVERY', category: 'FIXED', value: 20.0, percentBased: false, condition: { type: 'schedule', day: 'weekend' }, description: 'Majoration weekend (+20€)' },
      { name: 'Majoration réservation urgente', serviceType: 'DELIVERY', category: 'FIXED', value: 20.0, percentBased: false, condition: { type: 'schedule', urgency: 'emergency' }, description: 'Majoration urgente (+20€)' },
      { name: 'Majoration zone étendue', serviceType: 'DELIVERY', category: 'FIXED', value: 15.0, percentBased: false, condition: { type: 'distance', zone: 'extended' }, description: 'Majoration zone étendue (+15€)' },

      // Services supplémentaires
      { name: 'Service express (< 2h)', serviceType: 'DELIVERY', category: 'SURCHARGE', value: 50.0, percentBased: true, condition: { type: 'service', speed: 'express' }, description: 'Livraison ultra-rapide' },
      { name: 'Manutention objets lourds', serviceType: 'DELIVERY', category: 'FIXED', value: 30.0, percentBased: false, condition: { type: 'service', handling: 'heavy' }, description: 'Objets > 30kg, équipement spécialisé' },
      { name: 'Livraison étage sans ascenseur', serviceType: 'DELIVERY', category: 'SURCHARGE', value: 25.0, percentBased: true, condition: { type: 'building', elevator: 'none' }, description: 'Transport par escaliers' }
    ];

    // 4. ═══════════════════════════════════════════════════════════════
    // INSERTION EN BASE DE DONNÉES
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 Insertion des règles en base de données...');

    let totalInserted = 0;

    // Insérer règles déménagement
    for (const rule of [...movingConstraints, ...movingServices]) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.description,
          value: rule.value,
          isActive: true,
          ruleType: 'BUSINESS',
          category: rule.category,
          condition: rule.condition,
          percentBased: rule.percentBased,
          serviceType: rule.serviceType,
          priority: 100,
          validFrom: new Date(),
          tags: rule.percentBased ? ['percentage'] : ['fixed'],
          metadata: {
            source: 'realistic_seed_2025',
            impact: rule.percentBased ? `+${rule.value}%` : `+${rule.value}€`,
            category_frontend: rule.serviceType === 'MOVING' ?
              (rule.category === 'FIXED' ? 'service' : 'constraint') : 'constraint'
          }
        }
      });
      totalInserted++;
    }

    // Insérer règles nettoyage
    for (const rule of [...cleaningConstraints, ...cleaningServices]) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.description,
          value: rule.value,
          isActive: true,
          ruleType: 'BUSINESS',
          category: rule.category,
          condition: rule.condition,
          percentBased: rule.percentBased,
          serviceType: rule.serviceType,
          priority: 100,
          validFrom: new Date(),
          tags: rule.percentBased ? ['percentage'] : ['fixed'],
          metadata: {
            source: 'realistic_seed_2025',
            impact: rule.percentBased ? `+${rule.value}%` : `+${rule.value}€`,
            category_frontend: rule.category === 'FIXED' ? 'service' : 'constraint'
          }
        }
      });
      totalInserted++;
    }

    // Insérer règles livraison
    for (const rule of deliveryRules) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.description,
          value: rule.value,
          isActive: true,
          ruleType: 'BUSINESS',
          category: rule.category,
          condition: rule.condition,
          percentBased: rule.percentBased,
          serviceType: rule.serviceType,
          priority: 100,
          validFrom: new Date(),
          tags: rule.percentBased ? ['percentage'] : ['fixed'],
          metadata: {
            source: 'realistic_seed_2025',
            impact: rule.percentBased ? `+${rule.value}%` : `+${rule.value}€`,
            category_frontend: 'constraint'
          }
        }
      });
      totalInserted++;
    }

    // 5. ═══════════════════════════════════════════════════════════════
    // RAPPORT FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 ═══ RAPPORT FINAL ═══');
    console.log(`✅ Total règles insérées: ${totalInserted}`);

    const countByService = await prisma.rule.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true },
      where: { isActive: true }
    });

    console.log('\n📋 Répartition par service:');
    countByService.forEach(({ serviceType, _count }) => {
      console.log(`   ${serviceType}: ${_count.serviceType} règles`);
    });

    const countByType = await prisma.rule.groupBy({
      by: ['percentBased'],
      _count: { percentBased: true },
      where: { isActive: true }
    });

    console.log('\n💰 Répartition par type:');
    countByType.forEach(({ percentBased, _count }) => {
      console.log(`   ${percentBased ? 'Pourcentage' : 'Fixe'}: ${_count.percentBased} règles`);
    });

    console.log('\n🎉 SUCCÈS: Règles métier réalistes créées !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. ✅ Modaux utilisent fallback frontend (source primaire)');
    console.log('   2. ✅ BDD contient règles de sauvegarde réalistes');
    console.log('   3. 🔄 Test des calculs avec nouvelles règles');
    console.log('   4. 🚀 Déploiement système unifié');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRealisticRules();