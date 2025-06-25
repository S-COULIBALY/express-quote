const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== VÉRIFICATION DES TABLES ===');
    
    // Vérifier les règles
    const rulesCount = await prisma.rule.count();
    console.log('📊 Nombre de règles:', rulesCount);
    
    if (rulesCount > 0) {
      const rules = await prisma.rule.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('📋 Exemples de règles:');
      rules.forEach(rule => {
        console.log(`  - ${rule.name} (${rule.serviceType}): ${rule.value} - Active: ${rule.isActive}`);
      });
    }
    
    // Vérifier les configurations
    const configCount = await prisma.configuration.count();
    console.log('⚙️ Nombre de configurations:', configCount);
    
    if (configCount > 0) {
      const configs = await prisma.configuration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('📋 Exemples de configurations:');
      configs.forEach(config => {
        console.log(`  - ${config.category}.${config.key}: ${JSON.stringify(config.value)} - Active: ${config.isActive}`);
      });
    }
    
    // Vérifier les règles par service type
    console.log('\n=== RÈGLES PAR TYPE DE SERVICE ===');
    const movingRules = await prisma.rule.findMany({
      where: { serviceType: 'MOVING', isActive: true }
    });
    console.log('🚚 Règles MOVING actives:', movingRules.length);
    
    const packRules = await prisma.rule.findMany({
      where: { serviceType: 'PACK', isActive: true }
    });
    console.log('📦 Règles PACK actives:', packRules.length);
    
    const serviceRules = await prisma.rule.findMany({
      where: { serviceType: 'SERVICE', isActive: true }
    });
    console.log('🔧 Règles SERVICE actives:', serviceRules.length);
    
    // Vérifier les configurations par catégorie
    console.log('\n=== CONFIGURATIONS PAR CATÉGORIE ===');
    const pricingConfigs = await prisma.configuration.findMany({
      where: { category: 'PRICING', isActive: true }
    });
    console.log('💰 Configurations PRICING actives:', pricingConfigs.length);
    
    const businessConfigs = await prisma.configuration.findMany({
      where: { category: 'BUSINESS_RULES', isActive: true }
    });
    console.log('📋 Configurations BUSINESS_RULES actives:', businessConfigs.length);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 