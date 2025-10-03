#!/usr/bin/env ts-node

/**
 * 🚀 SCRIPT PRE-PRODUCTION CHECK
 *
 * Vérifie que tout est prêt pour un build de production
 *
 * Usage:
 *   npm run pre-prod-check
 *   ou
 *   npx ts-node scripts/pre-production-check.ts
 *
 * Options:
 *   --skip-tests    Skip les tests
 *   --skip-lint     Skip le linting
 *   --verbose       Logs détaillés
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface CheckResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  message: string;
  details?: string[];
  duration?: number;
}

interface CheckOptions {
  skipTests: boolean;
  skipLint: boolean;
  verbose: boolean;
}

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  skip: '⏭️',
  check: '🔍',
  build: '🏗️',
  test: '🧪',
  clean: '🧹',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logHeader(title: string) {
  const border = '='.repeat(80);
  console.log('\n');
  log(border, 'cyan');
  log(`  ${title}`, 'cyan');
  log(border, 'cyan');
  console.log('');
}

function logResult(result: CheckResult) {
  const icon = result.status === 'success' ? ICONS.success :
               result.status === 'error' ? ICONS.error :
               result.status === 'warning' ? ICONS.warning : ICONS.skip;

  const color = result.status === 'success' ? 'green' :
                result.status === 'error' ? 'red' :
                result.status === 'warning' ? 'yellow' : 'gray';

  const duration = result.duration ? ` (${result.duration}ms)` : '';
  log(`${icon} ${result.name}${duration}`, color);
  log(`   ${result.message}`, color);

  if (result.details && result.details.length > 0) {
    result.details.forEach(detail => {
      log(`   → ${detail}`, 'gray');
    });
  }
}

function executeCommand(command: string, errorMessage?: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: errorMessage || error.stdout?.toString() || error.message
    };
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), filePath));
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function checkNodeVersion(): Promise<CheckResult> {
  const startTime = Date.now();
  const result = executeCommand('node -v');

  if (!result.success) {
    return {
      name: 'Node.js Version',
      status: 'error',
      message: 'Node.js n\'est pas installé',
      duration: Date.now() - startTime
    };
  }

  const version = result.output.trim().replace('v', '');
  const [major] = version.split('.').map(Number);

  if (major < 18) {
    return {
      name: 'Node.js Version',
      status: 'error',
      message: `Version ${version} détectée. Version 18+ requise`,
      details: ['Installer Node.js 18 ou supérieur'],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Node.js Version',
    status: 'success',
    message: `Version ${version} - OK`,
    duration: Date.now() - startTime
  };
}

async function checkEnvironmentFiles(): Promise<CheckResult> {
  const startTime = Date.now();
  const requiredFiles = ['.env', '.env.local'];
  const missingFiles: string[] = [];
  const existingFiles: string[] = [];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length === requiredFiles.length) {
    return {
      name: 'Fichiers d\'environnement',
      status: 'error',
      message: 'Aucun fichier .env trouvé',
      details: missingFiles.map(f => `Créer ${f} depuis .env.example`),
      duration: Date.now() - startTime
    };
  }

  if (missingFiles.length > 0) {
    return {
      name: 'Fichiers d\'environnement',
      status: 'warning',
      message: `${existingFiles.length}/${requiredFiles.length} fichiers trouvés`,
      details: [
        ...existingFiles.map(f => `✓ ${f}`),
        ...missingFiles.map(f => `✗ ${f} (manquant)`)
      ],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Fichiers d\'environnement',
    status: 'success',
    message: 'Tous les fichiers .env présents',
    details: existingFiles,
    duration: Date.now() - startTime
  };
}

async function checkDatabaseConnection(): Promise<CheckResult> {
  const startTime = Date.now();

  if (!fileExists('.env') && !fileExists('.env.local')) {
    return {
      name: 'Connexion Base de données',
      status: 'skipped',
      message: 'Pas de fichier .env - vérification impossible',
      duration: Date.now() - startTime
    };
  }

  const result = executeCommand('npx prisma db push --skip-generate --accept-data-loss',
    'Impossible de se connecter à la base de données');

  if (!result.success) {
    return {
      name: 'Connexion Base de données',
      status: 'error',
      message: 'Échec de connexion à la base de données',
      details: [
        'Vérifier DATABASE_URL dans .env',
        'Vérifier que la base de données est démarrée',
        result.output.split('\n')[0]
      ],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Connexion Base de données',
    status: 'success',
    message: 'Connexion réussie',
    duration: Date.now() - startTime
  };
}

async function checkPrismaGenerate(): Promise<CheckResult> {
  const startTime = Date.now();

  const result = executeCommand('npx prisma generate');

  if (!result.success) {
    return {
      name: 'Prisma Client',
      status: 'error',
      message: 'Échec de génération du client Prisma',
      details: ['Exécuter: npx prisma generate'],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Prisma Client',
    status: 'success',
    message: 'Client Prisma généré',
    duration: Date.now() - startTime
  };
}

async function checkTypeScript(): Promise<CheckResult> {
  const startTime = Date.now();

  log('   Vérification TypeScript en cours...', 'gray');
  const result = executeCommand('npx tsc --noEmit');

  if (!result.success) {
    const errors = result.output.split('\n')
      .filter(line => line.includes('error TS'))
      .slice(0, 5); // Premiers 5 erreurs

    return {
      name: 'TypeScript',
      status: 'error',
      message: 'Erreurs TypeScript détectées',
      details: [
        ...errors,
        errors.length > 5 ? '... et plus d\'erreurs' : ''
      ].filter(Boolean),
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'TypeScript',
    status: 'success',
    message: 'Aucune erreur TypeScript',
    duration: Date.now() - startTime
  };
}

async function checkESLint(options: CheckOptions): Promise<CheckResult> {
  const startTime = Date.now();

  if (options.skipLint) {
    return {
      name: 'ESLint',
      status: 'skipped',
      message: 'Skipped (--skip-lint)',
      duration: Date.now() - startTime
    };
  }

  log('   Vérification ESLint en cours...', 'gray');
  const result = executeCommand('npm run lint');

  if (!result.success) {
    const errors = result.output.split('\n')
      .filter(line => line.includes('error') || line.includes('warning'))
      .slice(0, 5);

    return {
      name: 'ESLint',
      status: 'warning',
      message: 'Problèmes ESLint détectés',
      details: [
        ...errors,
        'Exécuter: npm run lint -- --fix'
      ],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'ESLint',
    status: 'success',
    message: 'Aucun problème ESLint',
    duration: Date.now() - startTime
  };
}

async function checkTests(options: CheckOptions): Promise<CheckResult> {
  const startTime = Date.now();

  if (options.skipTests) {
    return {
      name: 'Tests',
      status: 'skipped',
      message: 'Skipped (--skip-tests)',
      duration: Date.now() - startTime
    };
  }

  if (!fileExists('jest.config.js') && !fileExists('jest.config.ts')) {
    return {
      name: 'Tests',
      status: 'skipped',
      message: 'Jest non configuré',
      duration: Date.now() - startTime
    };
  }

  log('   Exécution des tests...', 'gray');
  const result = executeCommand('npm test -- --passWithNoTests');

  if (!result.success) {
    const failures = result.output.split('\n')
      .filter(line => line.includes('FAIL') || line.includes('✕'))
      .slice(0, 3);

    return {
      name: 'Tests',
      status: 'error',
      message: 'Tests en échec',
      details: failures,
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Tests',
    status: 'success',
    message: 'Tous les tests passent',
    duration: Date.now() - startTime
  };
}

async function checkDeadCode(options: CheckOptions): Promise<CheckResult> {
  const startTime = Date.now();

  log('   Détection du code mort (ts-prune)...', 'gray');
  const result = executeCommand('npx ts-prune --skip node_modules --skip .next 2>/dev/null');

  if (!result.success) {
    return {
      name: 'Code mort (ts-prune)',
      status: 'warning',
      message: 'ts-prune non disponible',
      details: ['Installer: npm install -D ts-prune'],
      duration: Date.now() - startTime
    };
  }

  const deadCodeLines = result.output.split('\n')
    .filter(line => line.trim() && !line.includes('used in module'))
    .filter(line => !line.includes('default') && !line.includes('metadata'));

  if (deadCodeLines.length > 10) {
    return {
      name: 'Code mort (ts-prune)',
      status: 'warning',
      message: `${deadCodeLines.length} exports potentiellement inutilisés`,
      details: [
        ...deadCodeLines.slice(0, 3),
        `... et ${deadCodeLines.length - 3} autres`,
        'Exécuter: npx ts-prune > dead-code.txt pour voir tout'
      ],
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Code mort (ts-prune)',
    status: 'success',
    message: deadCodeLines.length === 0 ? 'Aucun code mort détecté' : `${deadCodeLines.length} exports suspects`,
    duration: Date.now() - startTime
  };
}

async function checkBuild(): Promise<CheckResult> {
  const startTime = Date.now();

  log('   Build en cours (cela peut prendre du temps)...', 'gray');
  const result = executeCommand('npm run build 2>&1');

  if (!result.success) {
    const errors = result.output.split('\n')
      .filter(line => line.includes('error') || line.includes('Error') || line.includes('Failed'))
      .slice(0, 5);

    return {
      name: 'Build Production',
      status: 'error',
      message: 'Build échoué',
      details: [
        ...errors,
        'Voir les logs complets ci-dessus'
      ],
      duration: Date.now() - startTime
    };
  }

  const hasWarnings = result.output.includes('warning') || result.output.includes('Warning');

  if (hasWarnings) {
    const warnings = result.output.split('\n')
      .filter(line => line.includes('warning') || line.includes('Warning'))
      .slice(0, 3);

    return {
      name: 'Build Production',
      status: 'warning',
      message: 'Build réussi avec warnings',
      details: warnings,
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Build Production',
    status: 'success',
    message: 'Build réussi sans warnings',
    duration: Date.now() - startTime
  };
}

async function checkGitStatus(): Promise<CheckResult> {
  const startTime = Date.now();

  const result = executeCommand('git status --porcelain');

  if (!result.success) {
    return {
      name: 'Git Status',
      status: 'warning',
      message: 'Git non initialisé ou erreur',
      duration: Date.now() - startTime
    };
  }

  const changes = result.output.trim().split('\n').filter(Boolean);

  if (changes.length > 0) {
    return {
      name: 'Git Status',
      status: 'warning',
      message: `${changes.length} fichier(s) modifié(s) non commité(s)`,
      details: [
        ...changes.slice(0, 5),
        changes.length > 5 ? `... et ${changes.length - 5} autres` : ''
      ].filter(Boolean),
      duration: Date.now() - startTime
    };
  }

  return {
    name: 'Git Status',
    status: 'success',
    message: 'Working directory propre',
    duration: Date.now() - startTime
  };
}

async function checkDiskSpace(): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    const nodeModulesSize = executeCommand('du -sh node_modules 2>/dev/null || echo "N/A"').output.split('\t')[0];
    const nextSize = executeCommand('du -sh .next 2>/dev/null || echo "N/A"').output.split('\t')[0];

    return {
      name: 'Espace disque',
      status: 'success',
      message: 'Informations collectées',
      details: [
        `node_modules: ${nodeModulesSize}`,
        `.next: ${nextSize}`
      ],
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'Espace disque',
      status: 'warning',
      message: 'Impossible de collecter les infos',
      duration: Date.now() - startTime
    };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options: CheckOptions = {
    skipTests: args.includes('--skip-tests'),
    skipLint: args.includes('--skip-lint'),
    verbose: args.includes('--verbose')
  };

  logHeader('🚀 PRE-PRODUCTION CHECK - Express Quote');

  if (options.skipTests || options.skipLint) {
    log(`Options: ${options.skipTests ? 'skip-tests ' : ''}${options.skipLint ? 'skip-lint' : ''}`, 'yellow');
    console.log('');
  }

  const results: CheckResult[] = [];

  // ========== ÉTAPE 1: ENVIRONNEMENT ==========
  logHeader(`${ICONS.check} ÉTAPE 1/5 - Vérification Environnement`);
  results.push(await checkNodeVersion());
  results.push(await checkEnvironmentFiles());
  results.push(await checkDiskSpace());
  results.forEach(logResult);

  // ========== ÉTAPE 2: BASE DE DONNÉES ==========
  logHeader(`${ICONS.check} ÉTAPE 2/5 - Vérification Base de Données`);
  results.push(await checkDatabaseConnection());
  results.push(await checkPrismaGenerate());
  results.slice(-2).forEach(logResult);

  // ========== ÉTAPE 3: QUALITÉ DU CODE ==========
  logHeader(`${ICONS.check} ÉTAPE 3/5 - Qualité du Code`);
  results.push(await checkTypeScript());
  results.push(await checkESLint(options));
  results.push(await checkDeadCode(options));
  results.slice(-3).forEach(logResult);

  // ========== ÉTAPE 4: TESTS ==========
  logHeader(`${ICONS.test} ÉTAPE 4/5 - Tests`);
  results.push(await checkTests(options));
  results.slice(-1).forEach(logResult);

  // ========== ÉTAPE 5: BUILD ==========
  logHeader(`${ICONS.build} ÉTAPE 5/5 - Build Production`);
  results.push(await checkBuild());
  results.push(await checkGitStatus());
  results.slice(-2).forEach(logResult);

  // ========== RÉSUMÉ ==========
  logHeader('📊 RÉSUMÉ');

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  console.log('');
  log(`${ICONS.success} Succès:   ${successCount}`, 'green');
  log(`${ICONS.error} Erreurs:  ${errorCount}`, errorCount > 0 ? 'red' : 'green');
  log(`${ICONS.warning} Warnings: ${warningCount}`, warningCount > 0 ? 'yellow' : 'green');
  log(`${ICONS.skip} Skipped:  ${skippedCount}`, 'gray');
  console.log('');

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  log(`⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`, 'cyan');

  // ========== DÉCISION FINALE ==========
  console.log('');
  logHeader('🎯 DÉCISION FINALE');

  if (errorCount > 0) {
    log('❌ BUILD PRODUCTION : NON RECOMMANDÉ', 'red');
    log('   Corriger les erreurs avant de déployer', 'red');
    console.log('');
    process.exit(1);
  } else if (warningCount > 0) {
    log('⚠️  BUILD PRODUCTION : POSSIBLE AVEC PRUDENCE', 'yellow');
    log('   Vérifier et corriger les warnings si possible', 'yellow');
    console.log('');
    process.exit(0);
  } else {
    log('✅ BUILD PRODUCTION : PRÊT', 'green');
    log('   Tous les tests sont au vert ! 🎉', 'green');
    console.log('');
    process.exit(0);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  console.error('\n');
  log('💥 ERREUR FATALE', 'red');
  console.error(error);
  process.exit(1);
});
