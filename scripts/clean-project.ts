#!/usr/bin/env ts-node

/**
 * 🧹 SCRIPT DE NETTOYAGE DU PROJET
 *
 * Nettoie les fichiers temporaires, caches et build artifacts
 *
 * Usage:
 *   npm run clean
 *   ou
 *   npx ts-node scripts/clean-project.ts
 *
 * Options:
 *   --deep      Nettoyage profond (inclut node_modules)
 *   --dry-run   Affiche ce qui serait supprimé sans rien supprimer
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

interface CleanItem {
  path: string;
  description: string;
  size?: string;
  deep?: boolean; // Seulement en mode --deep
}

const ITEMS_TO_CLEAN: CleanItem[] = [
  // Build artifacts
  { path: '.next', description: 'Build Next.js' },
  { path: 'out', description: 'Export Next.js' },
  { path: 'build', description: 'Build TypeScript' },
  { path: 'dist', description: 'Distribution' },

  // Cache files
  { path: '.turbo', description: 'Cache Turbo' },
  { path: '.swc', description: 'Cache SWC' },
  { path: '.cache', description: 'Cache général' },
  { path: 'tsconfig.tsbuildinfo', description: 'TypeScript incremental' },

  // Test coverage
  { path: 'coverage', description: 'Couverture de tests' },
  { path: '.nyc_output', description: 'NYC coverage' },

  // Logs
  { path: 'logs', description: 'Logs' },
  { path: '*.log', description: 'Fichiers log' },
  { path: 'npm-debug.log*', description: 'Logs npm debug' },
  { path: 'yarn-debug.log*', description: 'Logs yarn debug' },
  { path: 'yarn-error.log*', description: 'Logs yarn error' },

  // OS files
  { path: '.DS_Store', description: 'Fichiers macOS' },
  { path: 'Thumbs.db', description: 'Fichiers Windows' },

  // Temporary files
  { path: 'tmp', description: 'Fichiers temporaires' },
  { path: 'temp', description: 'Fichiers temporaires' },
  { path: '*.tmp', description: 'Fichiers .tmp' },

  // Storybook
  { path: 'storybook-static', description: 'Build Storybook' },

  // Deep clean only (requires reinstall)
  { path: 'node_modules', description: 'Dépendances Node', deep: true },
  { path: 'package-lock.json', description: 'Lock npm', deep: true },
  { path: 'yarn.lock', description: 'Lock Yarn', deep: true },
  { path: 'pnpm-lock.yaml', description: 'Lock pnpm', deep: true },
];

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function getSize(itemPath: string): string {
  try {
    const fullPath = path.resolve(process.cwd(), itemPath);
    if (!fs.existsSync(fullPath)) return 'N/A';

    const stats = fs.statSync(fullPath);
    if (stats.isFile()) {
      return formatBytes(stats.size);
    }

    // For directories, use du command
    try {
      const output = execSync(`du -sh "${fullPath}" 2>/dev/null || echo "N/A"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return output.split('\t')[0] || 'N/A';
    } catch {
      return 'N/A';
    }
  } catch {
    return 'N/A';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function deleteItem(itemPath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), itemPath);

    if (!fs.existsSync(fullPath)) {
      return false;
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return true;
  } catch (error) {
    log(`   ⚠️  Erreur lors de la suppression de ${itemPath}: ${error}`, 'yellow');
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const deepClean = args.includes('--deep');
  const dryRun = args.includes('--dry-run');

  log('\n🧹 NETTOYAGE DU PROJET EXPRESS QUOTE', 'cyan');
  log('='.repeat(80), 'cyan');
  console.log('');

  if (deepClean) {
    log('⚠️  MODE DEEP CLEAN ACTIVÉ', 'yellow');
    log('   node_modules sera supprimé - vous devrez réinstaller les dépendances', 'yellow');
    console.log('');
  }

  if (dryRun) {
    log('🔍 MODE DRY-RUN - Aucune suppression ne sera effectuée', 'cyan');
    console.log('');
  }

  const itemsToProcess = ITEMS_TO_CLEAN.filter(item => {
    if (item.deep && !deepClean) return false;
    return true;
  });

  let deletedCount = 0;
  let totalSize = 0;

  log('📋 Analyse des éléments à nettoyer...', 'cyan');
  console.log('');

  itemsToProcess.forEach(item => {
    const fullPath = path.resolve(process.cwd(), item.path);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      const size = getSize(item.path);
      const action = dryRun ? '[DRY-RUN]' : '🗑️ ';

      log(`${action} ${item.path}`, exists ? 'green' : 'reset');
      log(`   ${item.description} - Taille: ${size}`, 'reset');

      if (!dryRun) {
        const deleted = deleteItem(item.path);
        if (deleted) {
          deletedCount++;
          log(`   ✅ Supprimé`, 'green');
        }
      } else {
        log(`   [Serait supprimé]`, 'yellow');
      }
      console.log('');
    }
  });

  // Résumé
  log('='.repeat(80), 'cyan');
  log('📊 RÉSUMÉ', 'cyan');
  console.log('');

  if (dryRun) {
    log(`🔍 Mode dry-run - Aucune suppression effectuée`, 'yellow');
  } else {
    log(`✅ ${deletedCount} élément(s) supprimé(s)`, 'green');
  }

  if (deepClean && !dryRun) {
    console.log('');
    log('⚠️  DEEP CLEAN EFFECTUÉ', 'yellow');
    log('   Réinstaller les dépendances avec:', 'yellow');
    log('   npm install', 'cyan');
  }

  console.log('');

  // Conseils
  log('💡 CONSEILS:', 'cyan');
  console.log('');
  log('   • Après nettoyage, exécuter: npm run build', 'reset');
  log('   • Pour un nettoyage profond: npm run clean -- --deep', 'reset');
  log('   • Pour tester sans supprimer: npm run clean -- --dry-run', 'reset');
  console.log('');
}

main();
