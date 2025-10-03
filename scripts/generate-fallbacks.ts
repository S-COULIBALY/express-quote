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

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Types
interface GeneratedConstraint {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  type: 'constraint' | 'service';
  value?: number;
  impact?: string;
  autoDetection?: boolean;
}

// ============================================================================
// FONCTIONS DE GÉNÉRATION
// ============================================================================

/**
 * Récupérer les règles depuis la BDD
 */
async function fetchRulesFromDatabase(serviceType: 'MOVING' | 'CLEANING') {
  console.log(`📥 Récupération des règles ${serviceType} depuis la BDD...`);

  const businessRules = await prisma.rule.findMany({
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
function classifyRule(ruleName: string, ruleCategory: string): 'constraint' | 'service' {
  const name = ruleName.toLowerCase();
  const category = ruleCategory.toLowerCase();

  if (category === 'surcharge' || category === 'contrainte' || category === 'difficulte') {
    return 'constraint';
  }
  if (category === 'fixed' || category === 'service' || category === 'prestation') {
    return 'service';
  }

  const constraintKeywords = ['contrainte', 'difficulté', 'majoration', 'surcharge'];
  for (const keyword of constraintKeywords) {
    if (name.includes(keyword)) return 'constraint';
  }

  return 'service';
}

/**
 * Obtenir l'icône pour une règle
 */
function getIconForRule(ruleName: string, serviceType: 'MOVING' | 'CLEANING', itemType: 'constraint' | 'service'): string {
  const name = ruleName.toLowerCase();

  if (serviceType === 'MOVING') {
    if (itemType === 'constraint') {
      if (name.includes('monte-meuble')) return '🏗️';
      if (name.includes('distance') && name.includes('portage')) return '📏';
      if (name.includes('zone piétonne')) return '🚶';
      if (name.includes('rue') && name.includes('étroite')) return '🚧';
      if (name.includes('stationnement')) return '🅿️';
      if (name.includes('circulation')) return '🚦';
      if (name.includes('ascenseur')) return '🏢';
      if (name.includes('escalier')) return '🪜';
      return '⚠️';
    } else {
      if (name.includes('démontage')) return '🔧';
      if (name.includes('remontage')) return '🔨';
      if (name.includes('piano')) return '🎹';
      if (name.includes('emballage')) return '📦';
      if (name.includes('déballage')) return '📭';
      if (name.includes('stockage')) return '🏪';
      if (name.includes('nettoyage')) return '🧹';
      return '🔧';
    }
  } else {
    if (itemType === 'constraint') {
      if (name.includes('animaux')) return '🐕';
      if (name.includes('urgence')) return '🚨';
      if (name.includes('stationnement')) return '🅿️';
      if (name.includes('ascenseur')) return '🏢';
      if (name.includes('allergie')) return '🤧';
      return '⚠️';
    } else {
      if (name.includes('grand nettoyage') || name.includes('printemps')) return '🌸';
      if (name.includes('vitres')) return '🪟';
      if (name.includes('nettoyage')) return '🧽';
      if (name.includes('tapis')) return '🏠';
      if (name.includes('désinfection')) return '🦠';
      return '🧽';
    }
  }
}

/**
 * Transformer les règles BDD en format fallback
 */
function transformToFallback(
  businessRules: any[],
  serviceType: 'MOVING' | 'CLEANING'
): { constraints: GeneratedConstraint[]; services: GeneratedConstraint[] } {
  const constraints: GeneratedConstraint[] = [];
  const services: GeneratedConstraint[] = [];

  for (const rule of businessRules) {
    const itemType = classifyRule(rule.name, rule.category);
    const icon = getIconForRule(rule.name, serviceType, itemType);

    const item: GeneratedConstraint = {
      id: rule.configKey || `rule_${rule.id}`,
      name: rule.name,
      description: rule.description || undefined,
      category: rule.category.toLowerCase(),
      icon,
      type: itemType,
      value: rule.value || undefined,
      impact: rule.value > 0 ? `+${rule.value}€` : undefined,
      autoDetection: rule.condition?.autoDetection || false
    };

    if (itemType === 'constraint') {
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
  constraints: GeneratedConstraint[],
  services: GeneratedConstraint[],
  serviceType: 'MOVING' | 'CLEANING'
): string {
  const serviceName = serviceType === 'MOVING' ? 'Déménagement' : 'Nettoyage';
  const date = new Date().toISOString().split('T')[0];

  // Fonction pour échapper correctement les apostrophes dans les chaînes
  const escapeString = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  };

  // Générer le code avec des template literals pour éviter les problèmes d'apostrophes
  const constraintsCode = JSON.stringify(constraints, null, 2)
    .replace(/"([^"]+)":/g, '$1:'); // Remove quotes from keys only

  const servicesCode = JSON.stringify(services, null, 2)
    .replace(/"([^"]+)":/g, '$1:'); // Remove quotes from keys only

  return `/**
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
  category?: string;
  icon?: string;
  type: 'constraint' | 'service';
  value?: number;
  impact?: string;
  autoDetection?: boolean;
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
