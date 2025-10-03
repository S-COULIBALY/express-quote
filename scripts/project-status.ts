#!/usr/bin/env ts-node

/**
 * 📊 PROJECT STATUS - Vue rapide de l'état du projet
 *
 * Affiche un dashboard rapide de l'état du projet
 *
 * Usage:
 *   npm run status
 *   npx ts-node scripts/project-status.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return 'N/A';
  }
}

function formatSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dirPath: string): string {
  try {
    const fullPath = path.resolve(process.cwd(), dirPath);
    if (!fs.existsSync(fullPath)) return 'N/A';

    const result = exec(`du -sh "${fullPath}" 2>/dev/null || echo "N/A"`);
    return result.split('\t')[0] || 'N/A';
  } catch {
    return 'N/A';
  }
}

function countFiles(pattern: string): number {
  try {
    const result = exec(`find . -name "${pattern}" -type f | wc -l`);
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), filePath));
}

function main() {
  log('\n📊 PROJECT STATUS - Express Quote', 'cyan');
  log('='.repeat(80), 'cyan');
  console.log('');

  // ========== GIT INFO ==========
  log('📂 Git', 'blue');
  const branch = exec('git rev-parse --abbrev-ref HEAD');
  const lastCommit = exec('git log -1 --pretty=format:"%h - %s (%cr)"');
  const changes = exec('git status --porcelain | wc -l');
  const hasChanges = parseInt(changes) > 0;

  log(`   Branche:      ${branch}`, 'reset');
  log(`   Last commit:  ${lastCommit}`, 'reset');
  log(`   Changements:  ${hasChanges ? changes + ' fichier(s) modifié(s)' : 'Aucun'}`,
    hasChanges ? 'yellow' : 'green');
  console.log('');

  // ========== ENVIRONMENT ==========
  log('🔧 Environnement', 'blue');
  const nodeVersion = exec('node -v');
  const npmVersion = exec('npm -v');
  const hasEnv = checkFileExists('.env');
  const hasEnvLocal = checkFileExists('.env.local');

  log(`   Node.js:      ${nodeVersion}`, 'reset');
  log(`   npm:          ${npmVersion}`, 'reset');
  log(`   .env:         ${hasEnv ? '✅ Présent' : '❌ Manquant'}`, hasEnv ? 'green' : 'red');
  log(`   .env.local:   ${hasEnvLocal ? '✅ Présent' : '❌ Manquant'}`, hasEnvLocal ? 'green' : 'red');
  console.log('');

  // ========== PROJECT SIZE ==========
  log('💾 Taille du projet', 'blue');
  const nodeModulesSize = getDirectorySize('node_modules');
  const nextSize = getDirectorySize('.next');
  const coverageSize = getDirectorySize('coverage');

  log(`   node_modules: ${nodeModulesSize}`, 'reset');
  log(`   .next:        ${nextSize}`, 'reset');
  log(`   coverage:     ${coverageSize}`, 'reset');
  console.log('');

  // ========== CODE STATS ==========
  log('📝 Code Statistics', 'blue');
  const tsFiles = countFiles('*.ts');
  const tsxFiles = countFiles('*.tsx');
  const testFiles = countFiles('*.test.ts') + countFiles('*.test.tsx');
  const totalLines = exec('find ./src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk \'{print $1}\'');

  log(`   TypeScript:   ${tsFiles} fichiers .ts`, 'reset');
  log(`   React:        ${tsxFiles} fichiers .tsx`, 'reset');
  log(`   Tests:        ${testFiles} fichiers de test`, 'reset');
  log(`   Lignes:       ${totalLines} lignes de code`, 'reset');
  console.log('');

  // ========== DEPENDENCIES ==========
  log('📦 Dépendances', 'blue');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = Object.keys(packageJson.dependencies || {}).length;
    const devDeps = Object.keys(packageJson.devDependencies || {}).length;

    log(`   Production:   ${deps} packages`, 'reset');
    log(`   Development:  ${devDeps} packages`, 'reset');
    log(`   Total:        ${deps + devDeps} packages`, 'reset');
  } catch {
    log('   Erreur lecture package.json', 'red');
  }
  console.log('');

  // ========== BUILD STATUS ==========
  log('🏗️  Build Status', 'blue');
  const hasNextBuild = checkFileExists('.next');
  const hasCoverage = checkFileExists('coverage');
  const hasLogs = checkFileExists('logs');

  log(`   Build Next.js: ${hasNextBuild ? '✅ Présent' : '❌ Absent'}`, hasNextBuild ? 'green' : 'yellow');
  log(`   Coverage:      ${hasCoverage ? '✅ Présent' : '❌ Absent'}`, hasCoverage ? 'green' : 'gray');
  log(`   Logs:          ${hasLogs ? '⚠️  Présents' : '✅ Absents'}`, hasLogs ? 'yellow' : 'green');
  console.log('');

  // ========== PRISMA ==========
  log('🗄️  Database (Prisma)', 'blue');
  const hasPrismaSchema = checkFileExists('prisma/schema.prisma');
  const migrationsCount = exec('find prisma/migrations -type d -maxdepth 1 | wc -l');

  log(`   Schema:       ${hasPrismaSchema ? '✅ Présent' : '❌ Manquant'}`, hasPrismaSchema ? 'green' : 'red');
  log(`   Migrations:   ${parseInt(migrationsCount) - 1 || 0} migrations`, 'reset');
  console.log('');

  // ========== QUICK ACTIONS ==========
  log('⚡ Actions Rapides', 'blue');
  log('   npm run dev              # Démarrer en développement', 'reset');
  log('   npm run build            # Build de production', 'reset');
  log('   npm run pre-prod-check   # Vérifier avant déploiement', 'reset');
  log('   npm run clean            # Nettoyer le projet', 'reset');
  log('   npm run lint             # Linter le code', 'reset');
  log('   npm run test             # Lancer les tests', 'reset');
  console.log('');

  // ========== HEALTH CHECK ==========
  log('🏥 Health Check', 'blue');
  const issues: string[] = [];

  if (!hasEnv && !hasEnvLocal) issues.push('Aucun fichier .env');
  if (!hasPrismaSchema) issues.push('Schema Prisma manquant');
  if (hasChanges) issues.push(`${changes} fichier(s) non commité(s)`);
  if (hasLogs) issues.push('Fichiers de logs présents');

  if (issues.length === 0) {
    log('   ✅ Aucun problème détecté', 'green');
  } else {
    log(`   ⚠️  ${issues.length} problème(s) détecté(s):`, 'yellow');
    issues.forEach(issue => log(`      • ${issue}`, 'yellow'));
  }

  console.log('');
  log('='.repeat(80), 'cyan');
  console.log('');
}

main();
