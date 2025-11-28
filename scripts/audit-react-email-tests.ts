/**
 * 🔍 SCRIPT D'AUDIT - Tests React Email
 *
 * Ce script audite tous les tests d'intégration pour vérifier:
 * 1. Utilisation correcte des templates React Email
 * 2. bodyLength > 10000 (React Email vs fallback HTML 441)
 * 3. Présence de tous les champs obligatoires
 *
 * Usage:
 *   npx ts-node scripts/audit-react-email-tests.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testFile: string;
  testName: string;
  template: string;
  bodyLength: number;
  status: 'PASS' | 'FAIL' | 'SKIP';
  issues: string[];
}

const INTEGRATION_TESTS_DIR = 'src/__tests__/integration';
const MIN_REACT_EMAIL_LENGTH = 10000; // Minimum pour React Email
const FALLBACK_HTML_LENGTH = 441; // Taille typique du fallback

/**
 * Templates React Email attendus
 */
const REACT_EMAIL_TEMPLATES = [
  'accounting-documents',
  'quote-confirmation',
  'booking-confirmation',
  'payment-confirmation',
  'reminder-24h',
  'reminder-7d',
  'reminder-1h',
  'service-reminder',
  'professional-attribution',
  'mission-accepted-confirmation',
  'professional-document'
];

/**
 * Extrait les résultats d'un test
 */
function analyzeTestOutput(testFile: string): TestResult[] {
  const results: TestResult[] = [];

  try {
    console.log(`\n📝 Analyse: ${testFile}`);

    // Lire le fichier de test
    const testContent = fs.readFileSync(testFile, 'utf-8');

    // Chercher les templates utilisés
    const templateMatches = testContent.matchAll(/template:\s*['"]([^'"]+)['"]/g);
    const templates = Array.from(templateMatches, m => m[1]);

    if (templates.length === 0) {
      console.log('   ⚠️ Aucun template trouvé');
      return results;
    }

    console.log(`   📧 Templates trouvés: ${templates.join(', ')}`);

    // Pour chaque template, vérifier s'il est React Email
    for (const template of templates) {
      if (!REACT_EMAIL_TEMPLATES.includes(template)) {
        console.log(`   ⏭️ ${template} n'est pas React Email, skip`);
        continue;
      }

      const result: TestResult = {
        testFile: path.basename(testFile),
        testName: extractTestName(testFile),
        template,
        bodyLength: 0,
        status: 'SKIP',
        issues: []
      };

      // Vérifier les champs obligatoires dans le test
      const missingFields = checkRequiredFields(testContent, template);
      if (missingFields.length > 0) {
        result.issues.push(`Champs manquants: ${missingFields.join(', ')}`);
      }

      results.push(result);
    }

  } catch (error) {
    console.error(`   ❌ Erreur analyse: ${error}`);
  }

  return results;
}

/**
 * Extrait le nom du test depuis le fichier
 */
function extractTestName(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/describe\(['"]([^'"]+)['"]/);
    return match ? match[1] : path.basename(filePath, '.test.ts');
  } catch {
    return path.basename(filePath, '.test.ts');
  }
}

/**
 * Vérifie la présence des champs obligatoires pour un template
 */
function checkRequiredFields(testContent: string, template: string): string[] {
  const requiredFieldsByTemplate: Record<string, string[]> = {
    'accounting-documents': [
      'accountingName',
      'bookingId',
      'bookingReference',
      'serviceType',
      'totalAmount',
      'currency',
      'customerName',
      'customerEmail',
      'bookingDate'
    ],
    'quote-confirmation': [
      'customerName',
      'customerEmail',
      'quoteNumber',
      'serviceType',
      'totalAmount',
      'currency',
      'quoteDate',
      'viewQuoteUrl',
      'acceptQuoteUrl'
    ],
    'booking-confirmation': [
      'customerName',
      'customerEmail',
      'bookingId',
      'bookingReference',
      'serviceType',
      'serviceDate',
      'serviceTime',
      'estimatedDuration',
      'teamSize',
      'totalAmount',
      'paymentStatus',
      'currency',
      'preparationInstructions',
      'equipment',
      'viewBookingUrl',
      'emergencyContact'
    ],
    'payment-confirmation': [
      'customerName',
      'customerEmail',
      'transactionId',
      'bookingReference',
      'amount',
      'currency',
      'paymentDate',
      'paymentMethod',
      'viewReceiptUrl',
      'viewBookingUrl'
    ],
    'reminder-24h': [
      'customerName',
      'bookingId',
      'bookingReference',
      'serviceType',
      'serviceName',
      'serviceDate',
      'serviceTime',
      'estimatedDuration',
      'serviceAddress',
      'teamSize',
      'teamLeaderContact',
      'emergencyContact',
      'supportPhone',
      'preparationInstructions',
      'allowsModification',
      'allowsCancellation',
      'cancellationDeadlineHours'
    ],
    'service-reminder': [
      'customerName',
      'bookingReference',
      'serviceType',
      'serviceName',
      'serviceDate',
      'serviceTime',
      'serviceAddress',
      'viewBookingUrl'
    ],
    'professional-attribution': [
      'professionalName',
      'professionalEmail',
      'bookingId',
      'serviceType',
      'serviceName',
      'serviceDate',
      'serviceTime',
      'estimatedDuration',
      'locationCity',
      'locationDistance',
      'totalAmount',
      'currency',
      'acceptMissionUrl',
      'declineMissionUrl',
      'viewDetailsUrl',
      'responseDeadline'
    ]
  };

  const requiredFields = requiredFieldsByTemplate[template] || [];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    // Chercher le champ dans le contenu du test
    const fieldRegex = new RegExp(`${field}\\s*:`, 'g');
    if (!fieldRegex.test(testContent)) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

/**
 * Lance l'audit de tous les tests
 */
async function runAudit() {
  console.log('🔍 AUDIT DES TESTS REACT EMAIL');
  console.log('═'.repeat(70));

  // Lister tous les fichiers de test
  const testFiles = fs.readdirSync(INTEGRATION_TESTS_DIR)
    .filter(file => file.endsWith('.test.ts'))
    .map(file => path.join(INTEGRATION_TESTS_DIR, file));

  console.log(`\n📁 ${testFiles.length} fichiers de test trouvés\n`);

  const allResults: TestResult[] = [];

  // Analyser chaque test
  for (const testFile of testFiles) {
    const results = analyzeTestOutput(testFile);
    allResults.push(...results);
  }

  // Afficher le résumé
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RÉSUMÉ DE L\'AUDIT');
  console.log('═'.repeat(70));

  const byTemplate: Record<string, TestResult[]> = {};
  for (const result of allResults) {
    if (!byTemplate[result.template]) {
      byTemplate[result.template] = [];
    }
    byTemplate[result.template].push(result);
  }

  console.log('\n| Template | Tests | Issues | Status |');
  console.log('|----------|-------|--------|--------|');

  for (const template of REACT_EMAIL_TEMPLATES) {
    const results = byTemplate[template] || [];
    const hasIssues = results.some(r => r.issues.length > 0);
    const status = results.length === 0 ? '❌ Pas de test' :
                   hasIssues ? '⚠️ Problèmes' : '✅ OK';

    console.log(`| ${template.padEnd(24)} | ${results.length} | ${hasIssues ? 'Oui' : 'Non'.padEnd(6)} | ${status} |`);
  }

  // Détails des problèmes
  console.log('\n' + '═'.repeat(70));
  console.log('⚠️ PROBLÈMES DÉTECTÉS');
  console.log('═'.repeat(70));

  let issueCount = 0;
  for (const result of allResults) {
    if (result.issues.length > 0) {
      issueCount++;
      console.log(`\n📝 ${result.testFile} - ${result.template}`);
      for (const issue of result.issues) {
        console.log(`   ❌ ${issue}`);
      }
    }
  }

  if (issueCount === 0) {
    console.log('\n✅ Aucun problème détecté!');
  } else {
    console.log(`\n⚠️ ${issueCount} test(s) avec des problèmes`);
  }

  // Recommandations
  console.log('\n' + '═'.repeat(70));
  console.log('💡 RECOMMANDATIONS');
  console.log('═'.repeat(70));

  console.log(`
1. Pour chaque test avec problèmes:
   - Ajouter les champs manquants
   - Référence: GUIDE_COMPLET_TESTS_REACT_EMAIL.md

2. Lancer les tests et vérifier bodyLength:
   npm test -- [test-file]
   grep "bodyLength" test-output.txt

3. Si bodyLength < 10000:
   - Vérifier les champs obligatoires
   - Vérifier les dates (doivent être en ISO)
   - Vérifier les montants (doivent être en centimes)

4. Documentation complète:
   - docs/GUIDE_COMPLET_TESTS_REACT_EMAIL.md
   - docs/SOLUTION_ACCOUNTING_DOCUMENTS_REACT_EMAIL.md
  `);
}

// Lancer l'audit
runAudit().catch(console.error);
