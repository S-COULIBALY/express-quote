import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour analyser les règles et configurations de la BDD
 * Objectif: Comprendre pourquoi toutes les règles sont appliquées sans validation des conditions
 */

interface RuleAnalysis {
  id: string;
  name: string;
  description: string | null;
  value: number;
  percentBased: boolean;
  isActive: boolean;
  category: string;
  serviceType: string;
  ruleType: string | null;
  priority: number | null;
  condition: any;
  metadata: any;
  configKey: string | null;
  tags: string[];
  validFrom: Date | null;
  validTo: Date | null;
}

interface ConfigAnalysis {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  isActive: boolean;
  priority: number;
  tags: string[];
  businessType: string | null;
  validFrom: Date;
  validTo: Date | null;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   ANALYSE DES RÈGLES ET CONFIGURATIONS - EXPRESS QUOTE          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // ==================== PARTIE 1: ANALYSE DES RÈGLES ====================
  console.log('\n📋 PARTIE 1: ANALYSE DES RÈGLES\n');
  console.log('═'.repeat(70));

  const allRules = await prisma.rules.findMany({
    orderBy: [
      { serviceType: 'asc' },
      { ruleType: 'asc' },
      { priority: 'desc' },
      { name: 'asc' }
    ]
  });

  console.log(`\n✅ Total des règles: ${allRules.length}\n`);

  // Grouper par ServiceType
  const rulesByService = allRules.reduce((acc, rule) => {
    if (!acc[rule.serviceType]) {
      acc[rule.serviceType] = [];
    }
    acc[rule.serviceType].push(rule);
    return acc;
  }, {} as Record<string, typeof allRules>);

  // Afficher la répartition
  console.log('📊 RÉPARTITION PAR SERVICE TYPE:');
  console.log('─'.repeat(70));
  Object.entries(rulesByService).forEach(([serviceType, rules]) => {
    console.log(`  ${serviceType}: ${rules.length} règles`);
  });

  // Grouper par RuleType
  console.log('\n📊 RÉPARTITION PAR RULE TYPE:');
  console.log('─'.repeat(70));
  const rulesByType = allRules.reduce((acc, rule) => {
    const type = rule.ruleType || 'NULL';
    if (!acc[type]) acc[type] = 0;
    acc[type]++;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(rulesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} règles`);
  });

  // Analyser les conditions
  console.log('\n🔍 ANALYSE DES CONDITIONS:');
  console.log('─'.repeat(70));

  const rulesWithCondition = allRules.filter(r => r.condition !== null);
  const rulesWithoutCondition = allRules.filter(r => r.condition === null);

  console.log(`  Règles AVEC condition: ${rulesWithCondition.length}`);
  console.log(`  Règles SANS condition: ${rulesWithoutCondition.length}`);

  // Analyser les types de conditions
  console.log('\n📝 TYPES DE CONDITIONS DÉTECTÉES:');
  console.log('─'.repeat(70));

  const conditionTypes = new Map<string, number>();
  rulesWithCondition.forEach(rule => {
    if (rule.condition && typeof rule.condition === 'object') {
      const keys = Object.keys(rule.condition).sort().join(', ');
      const type = keys || 'empty_object';
      conditionTypes.set(type, (conditionTypes.get(type) || 0) + 1);
    }
  });

  conditionTypes.forEach((count, type) => {
    console.log(`  ${type}: ${count} règles`);
  });

  // ==================== PARTIE 2: ANALYSE DÉTAILLÉE PAR SERVICE ====================
  console.log('\n\n📋 PARTIE 2: ANALYSE DÉTAILLÉE PAR SERVICE\n');
  console.log('═'.repeat(70));

  for (const [serviceType, rules] of Object.entries(rulesByService)) {
    console.log(`\n\n🔧 SERVICE: ${serviceType} (${rules.length} règles)`);
    console.log('─'.repeat(70));

    // Grouper par RuleType
    const rulesByTypeInService = rules.reduce((acc, rule) => {
      const type = rule.ruleType || 'NULL';
      if (!acc[type]) acc[type] = [];
      acc[type].push(rule);
      return acc;
    }, {} as Record<string, typeof rules>);

    for (const [ruleType, rulesOfType] of Object.entries(rulesByTypeInService)) {
      console.log(`\n  📌 ${ruleType} (${rulesOfType.length} règles):`);

      rulesOfType.forEach((rule, index) => {
        console.log(`\n    ${index + 1}. "${rule.name}"`);
        console.log(`       ID: ${rule.id}`);
        console.log(`       Description: ${rule.description || 'N/A'}`);
        console.log(`       Valeur: ${rule.value}${rule.percentBased ? '%' : '€'}`);
        console.log(`       Catégorie: ${rule.category}`);
        console.log(`       Active: ${rule.isActive ? '✅' : '❌'}`);
        console.log(`       Priorité: ${rule.priority}`);
        console.log(`       ConfigKey: ${rule.configKey || 'N/A'}`);
        console.log(`       Tags: [${rule.tags.join(', ')}]`);

        // Afficher la condition (CRITIQUE)
        if (rule.condition) {
          console.log(`       ⚠️ CONDITION: ${JSON.stringify(rule.condition, null, 10)}`);
        } else {
          console.log(`       ⚠️ CONDITION: NULL (s'applique toujours!)`);
        }

        // Afficher les metadata
        if (rule.metadata) {
          console.log(`       📋 METADATA: ${JSON.stringify(rule.metadata, null, 10)}`);
        }

        // Afficher la validité
        const validFromStr = rule.validFrom ? rule.validFrom.toISOString().split('T')[0] : 'N/A';
        const validToStr = rule.validTo ? rule.validTo.toISOString().split('T')[0] : 'jamais';
        console.log(`       📅 Validité: ${validFromStr} → ${validToStr}`);
      });
    }
  }

  // ==================== PARTIE 3: ANALYSE DES CONFIGURATIONS ====================
  console.log('\n\n📋 PARTIE 3: ANALYSE DES CONFIGURATIONS\n');
  console.log('═'.repeat(70));

  const allConfigs = await prisma.configuration.findMany({
    orderBy: [
      { category: 'asc' },
      { priority: 'desc' },
      { key: 'asc' }
    ]
  });

  console.log(`\n✅ Total des configurations: ${allConfigs.length}\n`);

  // Grouper par catégorie
  const configsByCategory = allConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, typeof allConfigs>);

  console.log('📊 RÉPARTITION PAR CATÉGORIE:');
  console.log('─'.repeat(70));
  Object.entries(configsByCategory).forEach(([category, configs]) => {
    console.log(`  ${category}: ${configs.length} configs`);
  });

  // Afficher les configurations par catégorie
  for (const [category, configs] of Object.entries(configsByCategory)) {
    console.log(`\n\n🔧 CATÉGORIE: ${category} (${configs.length} configs)`);
    console.log('─'.repeat(70));

    configs.forEach((config, index) => {
      console.log(`\n  ${index + 1}. ${config.key}`);
      console.log(`     ID: ${config.id}`);
      console.log(`     Description: ${config.description || 'N/A'}`);
      console.log(`     Active: ${config.isActive ? '✅' : '❌'}`);
      console.log(`     Priorité: ${config.priority}`);
      console.log(`     BusinessType: ${config.businessType || 'N/A'}`);
      console.log(`     Environment: ${config.environment}`);
      console.log(`     Tags: [${config.tags.join(', ')}]`);
      console.log(`     Created by: ${config.created_by}`);

      const validFromStr = config.validFrom.toISOString().split('T')[0];
      const validToStr = config.validTo ? config.validTo.toISOString().split('T')[0] : 'jamais';
      console.log(`     📅 Validité: ${validFromStr} → ${validToStr}`);

      console.log(`     📋 VALUE: ${JSON.stringify(config.value, null, 6)}`);

      if (config.validation_schema) {
        console.log(`     🔒 VALIDATION SCHEMA: ${JSON.stringify(config.validation_schema, null, 6)}`);
      }
    });
  }

  // ==================== PARTIE 4: RECHERCHE DES RÈGLES LIÉES AUX CONFIGS ====================
  console.log('\n\n📋 PARTIE 4: LIAISON RÈGLES ↔ CONFIGURATIONS\n');
  console.log('═'.repeat(70));

  const rulesWithConfigKey = allRules.filter(r => r.configKey !== null);
  console.log(`\n✅ Règles avec configKey: ${rulesWithConfigKey.length}\n`);

  if (rulesWithConfigKey.length > 0) {
    console.log('🔗 RÈGLES LIÉES À DES CONFIGURATIONS:');
    console.log('─'.repeat(70));

    for (const rule of rulesWithConfigKey) {
      console.log(`\n  📌 Règle: "${rule.name}"`);
      console.log(`     ConfigKey: ${rule.configKey}`);

      // Chercher la config correspondante
      const relatedConfig = allConfigs.find(c =>
        c.key === rule.configKey ||
        c.id === rule.configKey ||
        `${c.category}.${c.key}` === rule.configKey
      );

      if (relatedConfig) {
        console.log(`     ✅ Configuration trouvée: ${relatedConfig.category}.${relatedConfig.key}`);
        console.log(`        Config Value: ${JSON.stringify(relatedConfig.value, null, 8)}`);
      } else {
        console.log(`     ❌ Configuration NON TROUVÉE (configKey="${rule.configKey}")`);
        console.log(`        ⚠️ PROBLÈME: La règle référence une config inexistante!`);
      }
    }
  } else {
    console.log('ℹ️  Aucune règle n\'utilise de configKey');
  }

  // ==================== PARTIE 5: ANALYSE DES PROBLÈMES POTENTIELS ====================
  console.log('\n\n📋 PARTIE 5: DÉTECTION DES PROBLÈMES POTENTIELS\n');
  console.log('═'.repeat(70));

  console.log('\n⚠️ PROBLÈME 1: Règles sans condition (s\'appliquent toujours)');
  console.log('─'.repeat(70));
  if (rulesWithoutCondition.length > 0) {
    console.log(`❌ ${rulesWithoutCondition.length} règles N'ONT PAS de condition!`);
    rulesWithoutCondition.forEach(rule => {
      console.log(`   - ${rule.name} (${rule.serviceType}, ${rule.ruleType})`);
    });
    console.log('\n💡 Ces règles s\'appliquent TOUJOURS, ce qui peut expliquer le problème de calcul!');
  } else {
    console.log('✅ Toutes les règles ont une condition');
  }

  console.log('\n\n⚠️ PROBLÈME 2: Règles avec condition vide {}');
  console.log('─'.repeat(70));
  const rulesWithEmptyCondition = rulesWithCondition.filter(r => {
    return r.condition && typeof r.condition === 'object' && Object.keys(r.condition).length === 0;
  });
  if (rulesWithEmptyCondition.length > 0) {
    console.log(`❌ ${rulesWithEmptyCondition.length} règles ont une condition VIDE {}!`);
    rulesWithEmptyCondition.forEach(rule => {
      console.log(`   - ${rule.name} (${rule.serviceType}, ${rule.ruleType})`);
    });
    console.log('\n💡 Condition vide = toujours vraie, problème de logique!');
  } else {
    console.log('✅ Aucune règle avec condition vide');
  }

  console.log('\n\n⚠️ PROBLÈME 3: Règles inactives');
  console.log('─'.repeat(70));
  const inactiveRules = allRules.filter(r => !r.isActive);
  if (inactiveRules.length > 0) {
    console.log(`⚠️ ${inactiveRules.length} règles sont INACTIVES:`);
    inactiveRules.forEach(rule => {
      console.log(`   - ${rule.name} (${rule.serviceType}, ${rule.ruleType})`);
    });
  } else {
    console.log('✅ Toutes les règles sont actives');
  }

  console.log('\n\n⚠️ PROBLÈME 4: Règles expirées');
  console.log('─'.repeat(70));
  const now = new Date();
  const expiredRules = allRules.filter(r => r.validTo && r.validTo < now);
  if (expiredRules.length > 0) {
    console.log(`⚠️ ${expiredRules.length} règles sont EXPIRÉES:`);
    expiredRules.forEach(rule => {
      console.log(`   - ${rule.name} (expiré le ${rule.validTo?.toISOString().split('T')[0]})`);
    });
  } else {
    console.log('✅ Aucune règle expirée');
  }

  console.log('\n\n⚠️ PROBLÈME 5: Règles référençant des configs inexistantes');
  console.log('─'.repeat(70));
  const rulesWithMissingConfig = rulesWithConfigKey.filter(rule => {
    return !allConfigs.some(c =>
      c.key === rule.configKey ||
      c.id === rule.configKey ||
      `${c.category}.${c.key}` === rule.configKey
    );
  });
  if (rulesWithMissingConfig.length > 0) {
    console.log(`❌ ${rulesWithMissingConfig.length} règles référencent des configs INEXISTANTES:`);
    rulesWithMissingConfig.forEach(rule => {
      console.log(`   - ${rule.name} → configKey="${rule.configKey}"`);
    });
    console.log('\n💡 Ces règles ne peuvent pas récupérer leur config!');
  } else {
    console.log('✅ Toutes les configKey référencent des configs existantes');
  }

  // ==================== PARTIE 6: RECOMMANDATIONS ====================
  console.log('\n\n📋 PARTIE 6: RECOMMANDATIONS\n');
  console.log('═'.repeat(70));

  console.log('\n💡 RECOMMANDATIONS BASÉES SUR L\'ANALYSE:\n');

  if (rulesWithoutCondition.length > 0) {
    console.log(`1. ⚠️ CRITIQUE: ${rulesWithoutCondition.length} règles sans condition`);
    console.log('   → Ajouter des conditions pour éviter l\'application systématique');
    console.log('   → Vérifier dans RuleEngine si condition=null est géré correctement\n');
  }

  if (rulesWithEmptyCondition.length > 0) {
    console.log(`2. ⚠️ IMPORTANT: ${rulesWithEmptyCondition.length} règles avec condition vide {}`);
    console.log('   → Remplacer {} par null OU ajouter des conditions réelles\n');
  }

  if (rulesWithMissingConfig.length > 0) {
    console.log(`3. ⚠️ IMPORTANT: ${rulesWithMissingConfig.length} règles avec configKey invalide`);
    console.log('   → Corriger les configKey OU créer les configurations manquantes\n');
  }

  console.log('4. 🔍 VÉRIFICATION SUGGÉRÉE:');
  console.log('   → Analyser le code du RuleEngine pour voir comment condition est évalué');
  console.log('   → Vérifier si condition=null ou condition={} passe toujours à true');
  console.log('   → Ajouter des logs dans RuleEngine.evaluateCondition()\n');

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    FIN DE L\'ANALYSE                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
