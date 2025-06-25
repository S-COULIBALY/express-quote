const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicData() {
  try {
    console.log('=== CRÉATION DES DONNÉES DE BASE ===');
    
    // Créer quelques règles de base pour MOVING
    console.log('Création des règles MOVING...');
    await prisma.rule.createMany({
      data: [
        {
          name: 'Volume de base',
          description: 'Coût par m³',
          serviceType: 'MOVING',
          category: 'FIXED',
          value: 40.0,
          percentBased: false,
          isActive: true,
          condition: 'volume > 0'
        },
        {
          name: 'Distance de base',
          description: 'Coût par km',
          serviceType: 'MOVING',
          category: 'FIXED',
          value: 2.0,
          percentBased: false,
          isActive: true,
          condition: 'distance > 0'
        },
        {
          name: 'Monte-meuble',
          description: 'Supplément monte-meuble',
          serviceType: 'MOVING',
          category: 'SURCHARGE',
          value: 150.0,
          percentBased: false,
          isActive: true,
          condition: 'furniture_lift_required'
        }
      ]
    });
    
    // Créer quelques configurations de base
    console.log('Création des configurations...');
    await prisma.configuration.createMany({
      data: [
        {
          category: 'PRICING',
          key: 'VAT_RATE',
          value: 0.20,
          description: 'Taux de TVA',
          isActive: true
        },
        {
          category: 'PRICING',
          key: 'FUEL_COST_PER_KM',
          value: 0.15,
          description: 'Coût carburant par km',
          isActive: true
        },
        {
          category: 'BUSINESS_RULES',
          key: 'MINIMUM_PRICE',
          value: 200.0,
          description: 'Prix minimum',
          isActive: true
        }
      ]
    });
    
    console.log('✅ Données de base créées avec succès !');
    
    // Vérifier les données créées
    const rulesCount = await prisma.rule.count();
    const configsCount = await prisma.configuration.count();
    
    console.log(`📊 Résumé:`);
    console.log(`  - Règles: ${rulesCount}`);
    console.log(`  - Configurations: ${configsCount}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicData(); 