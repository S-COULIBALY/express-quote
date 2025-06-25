 const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données des contraintes et services avec valeurs réalistes
const constraintsData = [
  // 🚛 Accès véhicule
  { id: 'pedestrian_zone', name: 'Zone piétonne avec restrictions', category: 'vehicle', value: 75, description: 'Nécessite autorisation municipale + portage plus long', percentBased: false },
  { id: 'narrow_inaccessible_street', name: 'Rue étroite ou inaccessible au camion', category: 'vehicle', value: 120, description: 'Le camion doit stationner plus loin, allongeant la manutention', percentBased: false },
  { id: 'difficult_parking', name: 'Stationnement difficile ou payant', category: 'vehicle', value: 40, description: 'Le temps de recherche et les frais de stationnement doivent être compensés', percentBased: false },
  { id: 'complex_traffic', name: 'Sens unique ou circulation complexe', category: 'vehicle', value: 30, description: 'Itinéraire rallongé ou difficile à naviguer, surtout en ville', percentBased: false },
  
  // 🏢 Contraintes bâtiment
  { id: 'elevator_unavailable', name: 'Ascenseur en panne ou hors service', category: 'building', value: 180, description: 'Oblige à tout porter manuellement sur plusieurs étages', percentBased: false },
  { id: 'elevator_unsuitable_size', name: 'Ascenseur trop petit pour les meubles', category: 'building', value: 120, description: 'Nécessite démontage ou portage manuel partiel', percentBased: false },
  { id: 'elevator_forbidden_moving', name: 'Ascenseur interdit pour déménagement', category: 'building', value: 150, description: 'Souvent stipulé dans les règlements d\'immeuble, oblige le portage par escalier', percentBased: false },
  { id: 'difficult_stairs', name: 'Escalier étroit, en colimaçon ou dangereux', category: 'building', value: 200, description: 'Allonge le temps, augmente le risque de casse', percentBased: false },
  { id: 'narrow_corridors', name: 'Couloirs étroits ou encombrés', category: 'building', value: 90, description: 'Oblige à manœuvrer avec précaution, parfois démonter davantage de meubles', percentBased: false },
  
  // 📏 Distance et portage
  { id: 'long_carrying_distance', name: 'Distance immeuble–camion > 30 m', category: 'distance', value: 3.5, description: 'Temps de trajet piéton supplémentaire par aller-retour', percentBased: false },
  { id: 'indirect_exit', name: 'Passage par cour, jardin ou sous-sol', category: 'distance', value: 100, description: 'Itinéraire de sortie plus long ou complexe', percentBased: false },
  { id: 'complex_multilevel_access', name: 'Accès complexe multi-niveaux', category: 'distance', value: 150, description: 'Parcours avec escaliers, rampes, niveaux intermédiaires', percentBased: false },
  
  // 🛡️ Sécurité et autorisations
  { id: 'access_control', name: 'Contrôle d\'accès strict', category: 'security', value: 60, description: 'Badge, gardiennage ou enregistrement ralentissent l\'intervention', percentBased: false },
  { id: 'administrative_permit', name: 'Autorisation administrative obligatoire', category: 'security', value: 80, description: 'Permis de stationnement ou occupation de voirie à payer à la mairie', percentBased: false },
  { id: 'time_restrictions', name: 'Restrictions horaires strictes', category: 'security', value: 70, description: 'Plages horaires réduites, organisation logistique plus contraignante', percentBased: false },
  { id: 'fragile_floor', name: 'Sol fragile ou délicat', category: 'security', value: 55, description: 'Protection supplémentaire (planches, tapis, film), rallonge l\'intervention', percentBased: false },
];

// Services supplémentaires avec valeurs réalistes
const servicesData = [
  // 🔧 Services de manutention
  { id: 'bulky_furniture', name: 'Meubles encombrants ou non démontables', category: 'handling', value: 180, description: 'Peut nécessiter main d\'œuvre renforcée, monte-meuble, ou démontage complexe', percentBased: false },
  { id: 'furniture_disassembly', name: 'Démontage de meubles au départ', category: 'handling', value: 30, description: 'Facturé par meuble ou par heure, selon complexité', percentBased: false },
  { id: 'furniture_reassembly', name: 'Remontage de meubles à l\'arrivée', category: 'handling', value: 30, description: 'Inclus dans certains packs, sinon facturé à la prestation', percentBased: false },
  
  // 📦 Services d'emballage
  { id: 'professional_packing_departure', name: 'Emballage professionnel au départ', category: 'packing', value: 200, description: 'Inclut le matériel et la main d\'œuvre qualifiée', percentBased: false },
  { id: 'professional_unpacking_arrival', name: 'Déballage professionnel à l\'arrivée', category: 'packing', value: 150, description: 'Souvent combiné avec nettoyage ou réinstallation', percentBased: false },
  { id: 'packing_supplies', name: 'Fournitures d\'emballage complètes', category: 'packing', value: 100, description: 'Cartons, papier bulle, scotch, housses, film', percentBased: false },
  
  // 🛡️ Services de protection
  { id: 'fragile_valuable_items', name: 'Objets fragiles ou de grande valeur', category: 'protection', value: 0.5, description: 'Pour assurer ou emballer des œuvres, instruments, écrans, etc.', percentBased: true },
  { id: 'heavy_items', name: 'Objets très lourds (piano, coffre-fort...)', category: 'protection', value: 400, description: 'Nécessite manutention spécialisée (sangles, équipe renforcée, monte-charge)', percentBased: false },
  { id: 'additional_insurance', name: 'Assurance complémentaire renforcée', category: 'protection', value: 0.4, description: 'Couvre la casse ou perte de biens de valeur selon montant déclaré', percentBased: true },
  
  // 🏪 Services annexes
  { id: 'temporary_storage_service', name: 'Stockage temporaire sécurisé', category: 'annexe', value: 60, description: 'Prix moyen d\'un garde-meuble sécurisé dans un déménagement avec décalage', percentBased: false },
];

async function createBusinessRules() {
  try {
    console.log('🏗️ CRÉATION DES RÈGLES MÉTIER POUR SUPABASE');
    console.log('=' .repeat(60));
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Créer les règles pour les contraintes
    console.log('\n📋 CRÉATION DES RÈGLES POUR LES CONTRAINTES LOGISTIQUES');
    for (const constraint of constraintsData) {
      // Vérifier si la règle existe déjà
      const existingRule = await prisma.rule.findFirst({
        where: { 
          name: constraint.name,
          serviceType: 'MOVING'
        }
      });
      
      if (existingRule) {
        console.log(`⏭️  Règle "${constraint.name}" existe déjà - mise à jour`);
        // Mettre à jour la règle existante avec les nouvelles valeurs
        await prisma.rule.update({
          where: { id: existingRule.id },
          data: {
            value: constraint.value,
            description: constraint.description,
            percentBased: constraint.percentBased !== false
          }
        });
        console.log(`✅ Contrainte mise à jour: ${constraint.name} (${constraint.value}€)`);
        skippedCount++;
        continue;
      }
      
      const rule = await prisma.rule.create({
        data: {
          name: constraint.name,
          description: constraint.description,
          value: constraint.value,
          percentBased: constraint.percentBased !== false, // Par défaut true sauf si explicitement false
          isActive: true,
          serviceType: 'MOVING',
          category: 'SURCHARGE', // Les contraintes sont des surcharges
          condition: constraint.id // Variable booléenne créée dans Rule.isApplicable()
        }
      });
      
      console.log(`✅ Contrainte créée: ${rule.name} (${rule.value}${rule.percentBased ? '%' : '€'})`);
      createdCount++;
    }
    
    // Créer les règles pour les services supplémentaires
    console.log('\n🔧 CRÉATION DES RÈGLES POUR LES SERVICES SUPPLÉMENTAIRES');
    for (const service of servicesData) {
      // Vérifier si la règle existe déjà
      const existingRule = await prisma.rule.findFirst({
        where: { 
          name: service.name,
          serviceType: 'MOVING'
        }
      });
      
      if (existingRule) {
        console.log(`⏭️  Règle "${service.name}" existe déjà - mise à jour`);
        // Mettre à jour la règle existante avec les nouvelles valeurs
        await prisma.rule.update({
          where: { id: existingRule.id },
          data: {
            value: service.value,
            description: service.description,
            percentBased: service.percentBased === true
          }
        });
        console.log(`✅ Service mis à jour: ${service.name} (${service.value}${service.percentBased === true ? '%' : '€'})`);
        skippedCount++;
        continue;
      }
      
      const rule = await prisma.rule.create({
        data: {
          name: service.name,
          description: service.description,
          value: service.value,
          percentBased: service.percentBased === true, // Par défaut false sauf si explicitement true
          isActive: true,
          serviceType: 'MOVING',
          category: 'SURCHARGE', // Les services sont des surcharges
          condition: service.id // Variable booléenne créée dans Rule.isApplicable()
        }
      });
      
      console.log(`✅ Service créé: ${rule.name} (${rule.value}${rule.percentBased ? '%' : '€'})`);
      createdCount++;
    }
    
    // Créer la règle spéciale pour le monte-meuble (si elle n'existe pas déjà)
    console.log('\n🏗️ VÉRIFICATION DE LA RÈGLE MONTE-MEUBLE');
    const furnitureLiftRule = await prisma.rule.findFirst({
      where: { 
        name: 'Monte-meuble',
        serviceType: 'MOVING'
      }
    });
    
    if (!furnitureLiftRule) {
      const rule = await prisma.rule.create({
        data: {
          name: 'Monte-meuble',
          description: 'Indispensable si escalier ou ascenseur inutilisables ou objets très encombrants',
          value: 250,
          percentBased: false,
          isActive: true,
          serviceType: 'MOVING',
          category: 'SURCHARGE',
          condition: 'furniture_lift_required'
        }
      });
      
      console.log(`✅ Règle monte-meuble créée: ${rule.name} (${rule.value}€)`);
      createdCount++;
    } else {
      console.log(`⏭️  Règle monte-meuble existe déjà - mise à jour de la valeur`);
      // Mettre à jour la règle existante avec les nouvelles valeurs
      await prisma.rule.update({
        where: { id: furnitureLiftRule.id },
        data: {
          value: 250,
          description: 'Indispensable si escalier ou ascenseur inutilisables ou objets très encombrants'
        }
      });
      console.log(`✅ Règle monte-meuble mise à jour: ${furnitureLiftRule.name} (250€)`);
      skippedCount++;
    }
    
    // Résumé final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RÉSUMÉ DE LA CRÉATION DES RÈGLES');
    console.log(`✅ Règles créées: ${createdCount}`);
    console.log(`⏭️  Règles ignorées (déjà existantes): ${skippedCount}`);
    console.log(`📋 Total de contraintes: ${constraintsData.length}`);
    console.log(`🔧 Total de services: ${servicesData.length}`);
    console.log(`🏗️ Règle monte-meuble: 1`);
    console.log(`🎯 Total attendu: ${constraintsData.length + servicesData.length + 1}`);
    
    // Vérification finale
    console.log('\n🔍 VÉRIFICATION FINALE');
    const totalRules = await prisma.rule.count({
      where: { serviceType: 'MOVING' }
    });
    console.log(`📊 Total des règles MOVING en base: ${totalRules}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des règles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction utilitaire pour afficher la structure des règles
async function displayRulesStructure() {
  try {
    console.log('\n📋 STRUCTURE DES RÈGLES GÉNÉRÉES');
    console.log('=' .repeat(80));
    
    const rules = await prisma.rule.findMany({
      where: { serviceType: 'MOVING' },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    const groupedRules = rules.reduce((groups, rule) => {
      if (!groups[rule.category]) {
        groups[rule.category] = [];
      }
      groups[rule.category].push(rule);
      return groups;
    }, {});
    
    Object.entries(groupedRules).forEach(([category, categoryRules]) => {
      console.log(`\n📂 ${category} (${categoryRules.length} règles)`);
      categoryRules.forEach(rule => {
        console.log(`  • ${rule.name}: ${rule.value}${rule.percentBased ? '%' : '€'} (${rule.condition})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage:', error);
  }
}

// Exécution du script
if (require.main === module) {
  createBusinessRules()
    .then(() => displayRulesStructure())
    .then(() => {
      console.log('\n🎉 SCRIPT TERMINÉ AVEC SUCCÈS');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 ERREUR FATALE:', error);
      process.exit(1);
    });
}

module.exports = { createBusinessRules, displayRulesStructure }; 