import { PrismaClient, RuleCategory, ServiceType } from '@prisma/client';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';
import { createServiceRules } from '../src/quotation/domain/rules/ServiceRules';
import { createPackRules } from '../src/quotation/domain/rules/PackRules';
import { createMovingRules } from '../src/quotation/domain/rules/MovingRules';

const prisma = new PrismaClient();

/**
 * Initialise le système avec les configurations et règles métier par défaut
 * Vérifie d'abord si les tables sont vides avant d'initialiser
 */
async function initializeSystem() {
  try {
    console.log('=== Initialisation du système ===');
    await initializeConfigurations();
    await initializeRules();
    console.log('=== Initialisation terminée avec succès ===');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du système:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Initialise les configurations par défaut
 */
async function initializeConfigurations() {
  try {
    // Vérifier si des configurations existent déjà
    const count = await prisma.configuration.count();
    
    if (count > 0) {
      console.log(`${count} configurations existent déjà dans la base de données. Abandon.`);
      return;
    }
    
    console.log('Initialisation des configurations par défaut...');
    
    // Obtenir les configurations par défaut
    const defaultConfigs = createDefaultConfigurations();
    
    // Insérer chaque configuration dans la base de données
    for (const config of defaultConfigs) {
      await prisma.configuration.create({
        data: {
          category: config.category,
          key: config.key,
          value: config.value,
          description: config.description || null,
          isActive: config.isActive,
          validFrom: config.validFrom,
          validTo: config.validTo,
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`${defaultConfigs.length} configurations ont été initialisées avec succès.`);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des configurations:', error);
    throw error;
  }
}

/**
 * Initialise les règles métier par défaut
 */
async function initializeRules() {
  try {
    // Vérifier si des règles existent déjà
    const count = await prisma.rule.count();
    
    if (count > 0) {
      console.log(`${count} règles métier existent déjà dans la base de données. Abandon.`);
      return;
    }
    
    console.log('Initialisation des règles métier...');
    
    // Récupérer les règles depuis les fonctions existantes
    const serviceRules = createServiceRules();
    const packRules = createPackRules();
    const movingRules = createMovingRules();
    
    let rulesCount = 0;
    
    // Règles de service
    for (const rule of serviceRules) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.name, // Utiliser le nom comme description si pas spécifié
          value: Math.abs(rule.value), // Valeur absolue du montant
          isActive: true,
          category: rule.value < 0 ? RuleCategory.REDUCTION : 
                   (rule.name.includes('minimum') ? RuleCategory.MINIMUM : RuleCategory.SURCHARGE),
          percentBased: !rule.name.includes('minimum') && !rule.name.includes('fixe'),
          serviceType: ServiceType.SERVICE,
          condition: getConditionFromRuleName(rule.name)
        }
      });
      rulesCount++;
    }
    
    // Règles de pack
    for (const rule of packRules) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.name,
          value: Math.abs(rule.value),
          isActive: true,
          category: rule.value < 0 ? RuleCategory.REDUCTION : 
                   (rule.name.includes('minimum') ? RuleCategory.MINIMUM : RuleCategory.SURCHARGE),
          percentBased: !rule.name.includes('minimum') && !rule.name.includes('fixe'),
          serviceType: ServiceType.PACK,
          condition: getConditionFromRuleName(rule.name)
        }
      });
      rulesCount++;
    }
    
    // Règles de déménagement
    for (const rule of movingRules) {
      await prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.name,
          value: Math.abs(rule.value),
          isActive: true,
          category: rule.value < 0 ? RuleCategory.REDUCTION : 
                   (rule.name.includes('minimum') ? RuleCategory.MINIMUM : 
                   rule.value > 100 ? RuleCategory.FIXED : RuleCategory.SURCHARGE),
          percentBased: !rule.name.includes('minimum') && !rule.name.includes('fixe') && rule.value <= 100,
          serviceType: ServiceType.MOVING,
          condition: getConditionFromRuleName(rule.name)
        }
      });
      rulesCount++;
    }
    
    console.log(`${rulesCount} règles métier ont été initialisées avec succès.`);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des règles métier:', error);
    throw error;
  }
}

/**
 * Génère une condition simple basée sur le nom de la règle
 * Puisque nous ne pouvons pas accéder directement à la condition de la règle
 */
function getConditionFromRuleName(ruleName: string): string {
  if (ruleName.includes('week-end')) {
    return 'day === 0 || day === 6';
  } else if (ruleName.includes('anticipée') || ruleName.includes('anticipation')) {
    return 'diffDays > 14';
  } else if (ruleName.includes('urgente') || ruleName.includes('urgence')) {
    return 'diffHours < 48';
  } else if (ruleName.includes('étages') || ruleName.includes('escalier')) {
    return 'floor > 1 && !hasElevator';
  } else if (ruleName.includes('durée')) {
    return 'duration > 4';
  } else if (ruleName.includes('volume')) {
    return 'volume > 30';
  } else if (ruleName.includes('haute saison')) {
    return 'month >= 6 && month <= 9';
  } else if (ruleName.includes('minimum')) {
    return 'price < value';
  } else if (ruleName.includes('fidèle')) {
    return 'isReturningCustomer === true';
  } else if (ruleName.includes('horaire') || ruleName.includes('heure')) {
    return 'hour < 8 || hour >= 18';
  } else {
    return '';
  }
}

// Exécuter le script
if (require.main === module) {
  initializeSystem()
    .then(() => console.log('Script terminé.'))
    .catch(e => console.error('Erreur d\'exécution:', e));
}

// Exporter la fonction pour permettre son appel depuis d'autres scripts
export { initializeSystem }; 