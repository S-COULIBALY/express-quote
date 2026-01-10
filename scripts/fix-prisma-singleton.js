/**
 * Script pour remplacer automatiquement toutes les instances de `new PrismaClient()`
 * par l'utilisation du singleton depuis @/lib/prisma
 */

const fs = require('fs');
const path = require('path');

// Fichiers à ignorer (fichiers de test, prisma.ts lui-même, etc.)
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /lib[\\\/]prisma\.ts$/,  // Le fichier singleton lui-même
  /__tests__/,  // Tests d'intégration peuvent créer leurs propres instances
  /jest\.setup\.js$/,
  /scripts[\\\/]/,  // Scripts utilitaires
  /prisma[\\\/]seed\.ts$/  // Seed script
];

// Compteurs
let filesProcessed = 0;
let filesModified = 0;
let instancesReplaced = 0;

/**
 * Détermine si un fichier doit être ignoré
 */
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Traite un fichier TypeScript pour remplacer les instances de PrismaClient
 */
function processFile(filePath) {
  if (shouldIgnoreFile(filePath)) {
    return;
  }

  filesProcessed++;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let localInstancesReplaced = 0;

  // Pattern 1: Constructor assignment - this.prisma = new PrismaClient()
  const constructorPattern = /this\.prisma\s*=\s*new\s+PrismaClient\(\s*\)/g;
  if (constructorPattern.test(content)) {
    localInstancesReplaced++;
    modified = true;
  }

  // Pattern 2: Local variable - const prisma = new PrismaClient()
  const localVarPattern = /const\s+(\w+)\s*=\s*new\s+PrismaClient\(\s*\)/g;
  if (localVarPattern.test(content)) {
    localInstancesReplaced++;
    modified = true;
  }

  // Pattern 3: Property initialization - private prisma: PrismaClient = new PrismaClient()
  const propertyInitPattern = /private\s+prisma:\s*PrismaClient\s*=\s*new\s+PrismaClient\(\s*\)/g;
  if (propertyInitPattern.test(content)) {
    localInstancesReplaced++;
    modified = true;
  }

  if (!modified) {
    return;
  }

  // Réinitialiser le contenu pour faire les remplacements
  content = fs.readFileSync(filePath, 'utf8');

  // 1. Ajouter l'import du singleton si nécessaire
  const hasPrismaImport = content.includes('from \'@/lib/prisma\'');
  const hasPrismaClientImport = content.includes('from \'@prisma/client\'');

  if (!hasPrismaImport && hasPrismaClientImport) {
    // Remplacer l'import de PrismaClient
    if (content.includes('import { PrismaClient }')) {
      content = content.replace(
        /import\s+{\s*PrismaClient([^}]*)\s*}\s+from\s+['"]@prisma\/client['"]/,
        `import type { PrismaClient$1 } from '@prisma/client';\nimport { prisma as prismaInstance } from '@/lib/prisma'`
      );
    } else if (content.includes('import type { PrismaClient }')) {
      content = content.replace(
        /import\s+type\s+{\s*PrismaClient([^}]*)\s*}\s+from\s+['"]@prisma\/client['"]/,
        `import type { PrismaClient$1 } from '@prisma/client';\nimport { prisma as prismaInstance } from '@/lib/prisma'`
      );
    }
  } else if (!hasPrismaImport) {
    // Ajouter les imports au début du fichier (après les commentaires)
    const firstImportMatch = content.match(/^([\s\S]*?)(import\s)/m);
    if (firstImportMatch) {
      content = content.replace(
        firstImportMatch[2],
        `import type { PrismaClient } from '@prisma/client';\nimport { prisma as prismaInstance } from '@/lib/prisma';\n${firstImportMatch[2]}`
      );
    }
  }

  // 2. Remplacer les assignations de constructeur
  content = content.replace(
    /(\s+)this\.prisma\s*=\s*new\s+PrismaClient\(\s*\);/g,
    '$1this.prisma = prismaInstance; // Utiliser l\'instance singleton de Prisma'
  );

  // 3. Remplacer les variables locales
  content = content.replace(
    /const\s+(\w+)\s*=\s*new\s+PrismaClient\(\s*\);/g,
    'const $1 = prismaInstance; // Utiliser l\'instance singleton de Prisma'
  );

  // 4. Remplacer les initialisations de propriétés
  content = content.replace(
    /(private\s+prisma):\s*PrismaClient\s*=\s*new\s+PrismaClient\(\s*\);/g,
    '$1: PrismaClient = prismaInstance;'
  );

  // 5. Remplacer les déclarations de propriété sans initialisation suivies d'un constructor
  // Pattern: private prisma: PrismaClient; constructor() { this.prisma = ... }
  content = content.replace(
    /(private\s+prisma):\s*PrismaClient;/g,
    '$1: PrismaClient = prismaInstance;'
  );

  // 6. Supprimer les appels à $disconnect() qui ne sont plus nécessaires avec le singleton
  content = content.replace(
    /await\s+(\w+)\.\$disconnect\(\s*\);\s*/g,
    '// $disconnect() supprimé - singleton géré par lib/prisma\n'
  );

  // Écrire le fichier modifié
  fs.writeFileSync(filePath, content, 'utf8');
  filesModified++;
  instancesReplaced += localInstancesReplaced;

  console.log(`✅ Modifié: ${filePath} (${localInstancesReplaced} instance(s) remplacée(s))`);
}

/**
 * Parcourt récursivement un répertoire
 */
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldIgnoreFile(filePath)) {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

// Point d'entrée
const srcDir = path.join(__dirname, '..', 'src');

console.log('🚀 Démarrage du remplacement automatique des instances PrismaClient...\n');
console.log(`📂 Répertoire source: ${srcDir}\n`);

walkDirectory(srcDir);

console.log(`\n✨ Traitement terminé!`);
console.log(`📊 Statistiques:`);
console.log(`   - Fichiers traités: ${filesProcessed}`);
console.log(`   - Fichiers modifiés: ${filesModified}`);
console.log(`   - Instances remplacées: ${instancesReplaced}`);
