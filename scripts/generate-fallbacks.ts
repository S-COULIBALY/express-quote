#!/usr/bin/env ts-node

/**
 * ============================================================================
 * SCRIPT DE GÉNÉRATION AUTOMATIQUE DES FALLBACKS
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Générer automatiquement les données de fallback (constraintsFallback,
 * additionalServicesFallback) depuis la base de données de production.
 *
 * 🔧 UTILISATION:
 * npm run generate:fallbacks
 * OU
 * ts-node scripts/generate-fallbacks.ts
 *
 * 📦 SORTIE:
 * - src/data/fallbacks/movingFallback.ts
 * - src/data/fallbacks/cleaningFallback.ts
 * - src/data/fallbacks/index.ts (export centralisé)
 *
 * ✅ BÉNÉFICES:
 * - Fallbacks toujours synchronisés avec la BDD
 * - Élimination duplication dans modaux
 * - Source unique de vérité
 */

import { PrismaClient, ServiceType, RuleType, RuleCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Types
interface GeneratedRule {
  id: string;
  name: string;
  description?: string;
  value: number;
  isActive: boolean;
  category: RuleCategory;
  condition?: any;
  percentBased: boolean;
  serviceType: ServiceType;
  ruleType: RuleType;
  priority: number;
  validFrom?: Date;
  validTo?: Date | null;
  tags: string[];
  configKey?: string;
  metadata?: {
    source?: string;
    impact?: string;
    category_frontend?: "constraint" | "service";
    display?: {
      icon?: string;
      priority?: number;
      group?: string;
      description_short?: string;
    };
  };
}

// ============================================================================
// FONCTIONS DE GÉNÉRATION
// ============================================================================

/**
 * Récupérer les règles depuis la BDD
 */
async function fetchRulesFromDatabase(serviceType: 'MOVING' | 'CLEANING') {
  console.log(`📥 Récupération des règles ${serviceType} depuis la BDD...`);

  const businessRules = await prisma.rules.findMany({
    where: {
      serviceType,
      isActive: true
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log(`✅ ${businessRules.length} règles ${serviceType} récupérées`);
  return businessRules;
}

/**
 * Classifier une règle (constraint vs service)
 */
function determineRuleType(rule: any): RuleType {
  // Utiliser metadata.category_frontend pour déterminer le type
  const categoryFrontend = rule.metadata?.category_frontend;
  
  if (categoryFrontend === 'constraint') {
    return RuleType.CONSTRAINT;
  }
  
  if (categoryFrontend === 'service') {
    return RuleType.BUSINESS;
  }

  // Fallback sur l'ancienne logique si metadata n'est pas disponible
  const name = rule.name.toLowerCase();
  const category = rule.category.toLowerCase();

  if (category === 'surcharge') {
    return RuleType.CONSTRAINT;
  }

  if (category === 'fixed') {
    return RuleType.BUSINESS;
  }

  return RuleType.CUSTOM;
}


/**
 * Transformer les règles BDD en format fallback
 */
function transformToFallback(
  businessRules: any[],
  serviceType: ServiceType
): { constraints: GeneratedRule[]; services: GeneratedRule[] } {
  const constraints: GeneratedRule[] = [];
  const services: GeneratedRule[] = [];

  for (const rule of businessRules) {
    const ruleType = determineRuleType(rule);

    const item: GeneratedRule = {
      id: rule.id, // ✅ CORRECTION: Utiliser directement l'ID de la BDD au lieu de rule_${id}
      name: rule.name,
      description: rule.description || undefined,
      value: rule.value || 0,
      isActive: rule.isActive !== false,
      category: rule.category,
      condition: rule.condition || null,
      percentBased: rule.percentBased !== false,
      serviceType: serviceType,
      ruleType: ruleType,
      priority: rule.priority || 100,
      validFrom: rule.validFrom ? new Date(rule.validFrom) : new Date(),
      validTo: rule.validTo ? new Date(rule.validTo) : null,
      tags: rule.tags || [],
      configKey: rule.configKey || undefined,
      metadata: rule.metadata || {}
    };

    if (ruleType === RuleType.CONSTRAINT) {
      constraints.push(item);
    } else {
      services.push(item);
    }
  }

  return { constraints, services };
}

/**
 * Générer le code TypeScript pour un fichier fallback
 */
function generateTypeScriptFile(
  constraints: GeneratedRule[],
  services: GeneratedRule[],
  serviceType: 'MOVING' | 'CLEANING'
): string {
  const serviceName = serviceType === 'MOVING' ? 'Déménagement' : 'Nettoyage';
  const date = new Date().toISOString().split('T')[0];

  // Fonction pour échapper correctement les apostrophes dans les chaînes
  const escapeString = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  };

  // Fonction pour formater les dates en constructeur Date
  const formatDate = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => formatDate(item));
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = formatDate(value);
      }
      return newObj;
    }
    return obj;
  };

  // Formater les dates et générer le code
  const formattedConstraints = formatDate(constraints);
  const formattedServices = formatDate(services);

  // Convertir en string et enlever les quotes des clés et des constructeurs Date
  const constraintsCode = JSON.stringify(formattedConstraints, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/"([^"]+)"/g, (match, p1) => {
      if (p1.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return `new Date("${p1}")`;
      }
      return `"${p1}"`;
    }); // Convert ISO dates to Date constructors

  const servicesCode = JSON.stringify(formattedServices, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/"([^"]+)"/g, (match, p1) => {
      if (p1.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return `new Date("${p1}")`;
      }
      return `"${p1}"`;
    }); // Convert ISO dates to Date constructors

  return `import { ServiceType, RuleType, RuleCategory } from '@prisma/client';

/**
 * ============================================================================
 * FALLBACK ${serviceType} - Données générées automatiquement
 * ============================================================================
 *
 * 🤖 GÉNÉRÉ AUTOMATIQUEMENT le ${date}
 * ⚠️  NE PAS MODIFIER MANUELLEMENT
 *
 * Ce fichier est généré via: npm run generate:fallbacks
 * Source: Base de données production (table BusinessRule)
 *
 * 📋 Utilisation:
 * Ces données sont utilisées comme fallback si la BDD est indisponible.
 */

export interface Constraint {
  id: string;
  name: string;
  description?: string;
  value: number;
  isActive: boolean;
  category: RuleCategory;
  condition?: any;
  percentBased: boolean;
  serviceType: ServiceType;
  ruleType: RuleType;
  priority: number;
  validFrom?: Date;
  validTo?: Date | null;
  tags: string[];
  configKey?: string;
  metadata?: {
    source?: string;
    impact?: string;
    category_frontend?: "constraint" | "service";
    display?: {
      icon?: string;
      priority?: number;
      group?: string;
      description_short?: string;
    };
  };
}

/**
 * ✅ CONTRAINTES ${serviceName.toUpperCase()}
 * Total: ${constraints.length} contraintes
 */
export const ${serviceType.toLowerCase()}ConstraintsFallback: Constraint[] = ${constraintsCode};

/**
 * ✅ SERVICES ${serviceName.toUpperCase()}
 * Total: ${services.length} services
 */
export const ${serviceType.toLowerCase()}ServicesFallback: Constraint[] = ${servicesCode};

/**
 * ✅ TOUS LES ITEMS ${serviceName.toUpperCase()}
 * Total: ${constraints.length + services.length} items
 */
export const all${serviceType.charAt(0) + serviceType.slice(1).toLowerCase()}ItemsFallback = [
  ...${serviceType.toLowerCase()}ConstraintsFallback,
  ...${serviceType.toLowerCase()}ServicesFallback
];
`;
}

/**
 * Générer le fichier index.ts centralisé
 */
function generateIndexFile(): string {
  return `/**
 * ============================================================================
 * FALLBACKS CENTRALISÉS - Export unique
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Point d'entrée centralisé pour tous les fallbacks générés automatiquement.
 *
 * 📋 UTILISATION:
 * \`\`\`typescript
 * import {
 *   movingConstraintsFallback,
 *   movingServicesFallback,
 *   cleaningConstraintsFallback,
 *   cleaningServicesFallback
 * } from '@/data/fallbacks';
 * \`\`\`
 */

// Exports MOVING
export {
  movingConstraintsFallback,
  movingServicesFallback,
  allMovingItemsFallback,
  type Constraint as MovingConstraint
} from './movingFallback';

// Exports CLEANING
export {
  cleaningConstraintsFallback,
  cleaningServicesFallback,
  allCleaningItemsFallback,
  type Constraint as CleaningConstraint
} from './cleaningFallback';
`;
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  console.log('🚀 Génération automatique des fallbacks depuis la BDD\n');
  console.log('='.repeat(70));

  try {
    // 1. Créer le dossier de sortie
    const outputDir = path.join(__dirname, '..', 'src', 'data', 'fallbacks');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Dossier créé: ${outputDir}`);
    }

    // 2. Générer fallback MOVING
    console.log('\n📦 GÉNÉRATION FALLBACK MOVING');
    console.log('-'.repeat(70));
    const movingRules = await fetchRulesFromDatabase('MOVING');
    const movingData = transformToFallback(movingRules, 'MOVING');
    const movingCode = generateTypeScriptFile(
      movingData.constraints,
      movingData.services,
      'MOVING'
    );
    const movingPath = path.join(outputDir, 'movingFallback.ts');
    fs.writeFileSync(movingPath, movingCode, 'utf-8');
    console.log(`✅ Fichier généré: ${movingPath}`);
    console.log(`   - ${movingData.constraints.length} contraintes`);
    console.log(`   - ${movingData.services.length} services`);

    // 3. Générer fallback CLEANING
    console.log('\n📦 GÉNÉRATION FALLBACK CLEANING');
    console.log('-'.repeat(70));
    const cleaningRules = await fetchRulesFromDatabase('CLEANING');
    const cleaningData = transformToFallback(cleaningRules, 'CLEANING');
    const cleaningCode = generateTypeScriptFile(
      cleaningData.constraints,
      cleaningData.services,
      'CLEANING'
    );
    const cleaningPath = path.join(outputDir, 'cleaningFallback.ts');
    fs.writeFileSync(cleaningPath, cleaningCode, 'utf-8');
    console.log(`✅ Fichier généré: ${cleaningPath}`);
    console.log(`   - ${cleaningData.constraints.length} contraintes`);
    console.log(`   - ${cleaningData.services.length} services`);

    // 4. Générer index.ts
    console.log('\n📦 GÉNÉRATION INDEX CENTRALISÉ');
    console.log('-'.repeat(70));
    const indexCode = generateIndexFile();
    const indexPath = path.join(outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexCode, 'utf-8');
    console.log(`✅ Fichier généré: ${indexPath}`);

    // 5. Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DE LA GÉNÉRATION');
    console.log('='.repeat(70));
    console.log(`✅ MOVING: ${movingData.constraints.length + movingData.services.length} items`);
    console.log(`   - Contraintes: ${movingData.constraints.length}`);
    console.log(`   - Services: ${movingData.services.length}`);
    console.log(`✅ CLEANING: ${cleaningData.constraints.length + cleaningData.services.length} items`);
    console.log(`   - Contraintes: ${cleaningData.constraints.length}`);
    console.log(`   - Services: ${cleaningData.services.length}`);
    console.log(`\n✅ 3 fichiers générés dans: ${outputDir}`);
    console.log('\n🎉 Génération terminée avec succès!\n');

    // Retourner un JSON structuré pour parsing par l'API
    console.log('RESULT_JSON:', JSON.stringify({
      movingConstraints: movingData.constraints.length,
      movingServices: movingData.services.length,
      movingTotal: movingData.constraints.length + movingData.services.length,
      cleaningConstraints: cleaningData.constraints.length,
      cleaningServices: cleaningData.services.length,
      cleaningTotal: cleaningData.constraints.length + cleaningData.services.length,
      filesGenerated: 3
    }));

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
main();
