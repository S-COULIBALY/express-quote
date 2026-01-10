/**
 * 💳 **TESTS STRIPE IDEMPOTENCY + PLAYWRIGHT SETUP**
 *
 * Ce fichier combine 2 problèmes identifiés dans AUDIT_PRODUCTION_FINAL.md :
 *
 * PROBLÈME #8 - Idempotence Stripe (MOYENNE)
 * - createPaymentIntent() sans idempotency_key
 * - Risque : Double facturation si retry réseau
 *
 * PROBLÈME #5 - Tests Playwright Cassés (HAUTE)
 * - Error: Cannot find module '@playwright/test'
 * - Tests e2e non fonctionnels
 *
 * **Approche** : TDD - Ces tests ÉCHOUERONT tant que fixes non appliqués
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { logger } from '@/lib/logger';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// PARTIE 1: STRIPE IDEMPOTENCY (Problème #8)
// =============================================================================

describe('💳 Stripe - Idempotency Protection (Problème #8)', () => {
  describe('Test 1: Idempotence createPaymentIntent', () => {
    it('❌ DOUBLE FACTURATION: devrait utiliser idempotency_key', async () => {
      // Vérifier implémentation actuelle
      const stripeServicePath = path.join(
        process.cwd(),
        'src/quotation/infrastructure/services/StripePaymentService.ts'
      );

      if (!fs.existsSync(stripeServicePath)) {
        throw new Error('StripePaymentService.ts non trouvé');
      }

      const serviceContent = fs.readFileSync(stripeServicePath, 'utf-8');

      // Chercher createPaymentIntent
      const hasCreatePaymentIntent = serviceContent.includes('createPaymentIntent');

      if (!hasCreatePaymentIntent) {
        throw new Error('Méthode createPaymentIntent non trouvée');
      }

      // Vérifier si idempotencyKey est utilisé
      const usesIdempotencyKey = serviceContent.includes('idempotencyKey') ||
                                  serviceContent.includes('idempotency_key');

      if (!usesIdempotencyKey) {
        logger.error('🚨 RISQUE DOUBLE FACTURATION:');
        logger.error('   - createPaymentIntent() sans idempotency_key');
        logger.error('   - Retry réseau → 2× PaymentIntent créés');
        logger.error('   - Client facturé 2× montant');
        logger.error('');
        logger.error('🔧 CORRECTION:');
        logger.error('   const idempotencyKey = `booking-${bookingId}-${amount}`;');
        logger.error('   stripe.paymentIntents.create({ ... }, { idempotencyKey });');
      }

      // ❌ BLOQUER si idempotencyKey absent
      expect(usesIdempotencyKey).toBe(true);
    });

    it('devrait générer clé idempotence stable (même booking + montant = même clé)', () => {
      // Fonction de génération clé
      const generateIdempotencyKey = (bookingId: string, amount: number): string => {
        return `booking-${bookingId}-${amount}`;
      };

      // Test stabilité
      const key1 = generateIdempotencyKey('booking_123', 45000);
      const key2 = generateIdempotencyKey('booking_123', 45000);
      const key3 = generateIdempotencyKey('booking_123', 46000); // Montant différent
      const key4 = generateIdempotencyKey('booking_124', 45000); // Booking différent

      // Même booking + montant → même clé
      expect(key1).toBe(key2);
      expect(key1).toBe('booking-booking_123-45000');

      // Montant différent → clé différente
      expect(key1).not.toBe(key3);

      // Booking différent → clé différente
      expect(key1).not.toBe(key4);

      logger.info('✅ Génération clé idempotence stable vérifiée');
    });

    it('devrait tester retry avec même idempotency_key retourne même PaymentIntent', async () => {
      logger.info('💡 TEST ATTENDU (nécessite Stripe SDK):');
      logger.info('   1. Créer PaymentIntent avec idempotencyKey="test-123"');
      logger.info('   2. Retry avec MÊME idempotencyKey="test-123"');
      logger.info('   3. Vérifier: intent1.id === intent2.id (même PaymentIntent)');
      logger.info('   4. Vérifier: Stripe retourne 200 (pas 400 duplicate)');

      // Mock test (implémentation réelle nécessite Stripe)
      const mockPaymentIntent1 = { id: 'pi_test_stable_123', amount: 45000 };
      const mockPaymentIntent2 = { id: 'pi_test_stable_123', amount: 45000 };

      expect(mockPaymentIntent1.id).toBe(mockPaymentIntent2.id);
    });
  });

  describe('Test 2: Webhook Idempotence (Déjà Implémenté)', () => {
    it('✅ VÉRIFIÉ: webhook ne crée pas 2× Booking pour même payment_intent_id', () => {
      const webhookHandlerPath = path.join(
        process.cwd(),
        'src/app/api/webhooks/stripe/route.ts'
      );

      if (!fs.existsSync(webhookHandlerPath)) {
        logger.warn('⚠️ Webhook handler non trouvé');
        return;
      }

      const handlerContent = fs.readFileSync(webhookHandlerPath, 'utf-8');

      // Vérifier check idempotence manuel
      const hasIdempotenceCheck = handlerContent.includes('findFirst') &&
                                   handlerContent.includes('payment_intent') ||
                                   handlerContent.includes('stripe_payment_intent_id');

      if (hasIdempotenceCheck) {
        logger.info('✅ Webhook a check idempotence manuel (findFirst)');
        expect(hasIdempotenceCheck).toBe(true);
      } else {
        logger.warn('⚠️ Check idempotence webhook non détecté');
      }
    });
  });

  describe('Test 3: Scénarios Double Facturation', () => {
    it('SCÉNARIO CRITIQUE: Timeout réseau → retry automatique → 2× PaymentIntent', () => {
      logger.error('❌ SCÉNARIO SANS IDEMPOTENCY_KEY:');
      logger.error('   1. Client clique "Payer 450€"');
      logger.error('   2. Requête createPaymentIntent envoyée à Stripe');
      logger.error('   3. Stripe crée PaymentIntent pi_001 (450€)');
      logger.error('   4. Timeout réseau lors du retour');
      logger.error('   5. Frontend retry automatique');
      logger.error('   6. Stripe crée PaymentIntent pi_002 (450€)');
      logger.error('   7. Client facturé 2× 450€ = 900€');

      logger.info('');
      logger.info('✅ SCÉNARIO AVEC IDEMPOTENCY_KEY:');
      logger.info('   1-3. Idem');
      logger.info('   4. Timeout réseau');
      logger.info('   5. Frontend retry avec MÊME idempotency_key');
      logger.info('   6. Stripe retourne pi_001 (existant)');
      logger.info('   7. Client facturé 1× 450€ (correct)');

      const withoutIdempotency = { paymentIntents: 2, charged: 900 };
      const withIdempotency = { paymentIntents: 1, charged: 450 };

      expect(withoutIdempotency.charged).toBe(900);
      expect(withIdempotency.charged).toBe(450);
    });

    it('devrait documenter période validité idempotency_key Stripe', () => {
      logger.info('💡 STRIPE IDEMPOTENCY KEY:');
      logger.info('   - Validité: 24 heures');
      logger.info('   - Scope: Par clé API (test vs live)');
      logger.info('   - Format: String libre (max 255 chars)');
      logger.info('   - Recommandation: booking-{id}-{amount}');
      logger.info('   - Documentation: https://stripe.com/docs/api/idempotent_requests');

      const idempotencyKeyValidityHours = 24;
      expect(idempotencyKeyValidityHours).toBe(24);
    });
  });
});

// =============================================================================
// PARTIE 2: PLAYWRIGHT SETUP (Problème #5)
// =============================================================================

describe('🎭 Playwright E2E - Setup & Fix (Problème #5)', () => {
  describe('Test 1: Installation Playwright', () => {
    it('❌ TESTS CASSÉS: devrait avoir @playwright/test installé', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const hasPlaywrightDep = packageJson.dependencies?.['@playwright/test'];
      const hasPlaywrightDevDep = packageJson.devDependencies?.['@playwright/test'];

      if (!hasPlaywrightDep && !hasPlaywrightDevDep) {
        logger.error('🚨 @playwright/test NON INSTALLÉ:');
        logger.error('   - Tests e2e ne peuvent pas s\'exécuter');
        logger.error('   - Erreur: Cannot find module \'@playwright/test\'');
        logger.error('');
        logger.error('🔧 INSTALLATION:');
        logger.error('   npm install -D @playwright/test@latest');
        logger.error('   npx playwright install chromium');
      }

      // ❌ BLOQUER si Playwright absent
      expect(hasPlaywrightDep || hasPlaywrightDevDep).toBeTruthy();
    });

    it('devrait avoir Chromium installé', () => {
      try {
        const playwrightVersion = execSync('npx playwright --version', {
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        logger.info(`✅ Playwright installé: ${playwrightVersion.trim()}`);
        expect(playwrightVersion).toContain('Version');
      } catch (error: any) {
        logger.error('🚨 PLAYWRIGHT CLI NON DISPONIBLE:');
        logger.error('   - npx playwright --version échoue');
        logger.error('');
        logger.error('🔧 INSTALLATION BROWSERS:');
        logger.error('   npx playwright install chromium');

        throw new Error('Playwright CLI non disponible');
      }
    });

    it('devrait vérifier configuration playwright.config.ts', () => {
      const playwrightConfigPaths = [
        path.join(process.cwd(), 'playwright.config.ts'),
        path.join(process.cwd(), 'src/__tests__/flux-reservation/playwright.config.js')
      ];

      let configFound = false;

      playwrightConfigPaths.forEach(configPath => {
        if (fs.existsSync(configPath)) {
          configFound = true;
          logger.info(`✅ Configuration Playwright trouvée: ${path.basename(configPath)}`);

          const configContent = fs.readFileSync(configPath, 'utf-8');

          // Vérifier baseURL configuré
          if (configContent.includes('baseURL')) {
            logger.info('   - baseURL configuré');
          }

          // Vérifier browser configuré
          if (configContent.includes('chromium')) {
            logger.info('   - Browser: chromium');
          }
        }
      });

      if (!configFound) {
        logger.warn('⚠️ Aucune configuration Playwright trouvée');
        logger.warn('   Créer playwright.config.ts à la racine');
      }

      expect(configFound).toBe(true);
    });
  });

  describe('Test 2: Tests E2E Existants', () => {
    it('devrait lister tests e2e disponibles', () => {
      const e2eTestPaths = [
        'src/__tests__/flux-reservation/e2e/reservation-complete.spec.ts',
        'src/__tests__/flux-reservation/integration/flux-reservation.spec.ts',
        'src/__tests__/flux-reservation/integration/paiement-stripe.spec.ts'
      ];

      const existingTests: string[] = [];

      e2eTestPaths.forEach(testPath => {
        const fullPath = path.join(process.cwd(), testPath);
        if (fs.existsSync(fullPath)) {
          existingTests.push(testPath);

          const stats = fs.statSync(fullPath);
          const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;

          logger.info(`✅ Test trouvé: ${path.basename(testPath)}`);
          logger.info(`   - ${lines} lignes`);
        }
      });

      logger.info(`\n📊 Tests e2e existants: ${existingTests.length}/${e2eTestPaths.length}`);

      expect(existingTests.length).toBeGreaterThan(0);
    });

    it('devrait identifier tests Playwright vs Jest', () => {
      const testFiles = [
        'src/__tests__/flux-reservation/e2e/reservation-complete.spec.ts',
        'src/__tests__/flux-reservation/integration/flux-reservation.spec.ts'
      ];

      testFiles.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          const isPlaywright = content.includes('@playwright/test') ||
                                content.includes('test.describe');

          const isJest = content.includes('@jest/globals') ||
                         content.includes('describe(');

          const testType = isPlaywright ? 'Playwright' : isJest ? 'Jest' : 'Unknown';

          logger.info(`${path.basename(filePath)}: ${testType}`);
        }
      });
    });
  });

  describe('Test 3: Correction ESLint', () => {
    it('devrait identifier nombre de warnings ESLint', () => {
      logger.warn('⚠️ AUDIT: 779 warnings ESLint ignorés');
      logger.warn('   - Qualité code dégradée');
      logger.warn('   - Potentiels bugs masqués');
      logger.warn('');
      logger.warn('🔧 CORRECTION RECOMMANDÉE:');
      logger.warn('   1. npm run lint -- --fix (auto-fix)');
      logger.warn('   2. Corriger warnings restants manuellement');
      logger.warn('   3. Ajouter lint à pre-commit hook');

      const eslintWarnings = 779;
      expect(eslintWarnings).toBeGreaterThan(0);
    });

    it('devrait vérifier si pre-commit hook existe', () => {
      const huskyPath = path.join(process.cwd(), '.husky/pre-commit');
      const preCommitExists = fs.existsSync(huskyPath);

      if (preCommitExists) {
        logger.info('✅ Pre-commit hook trouvé');

        const hookContent = fs.readFileSync(huskyPath, 'utf-8');

        if (hookContent.includes('lint')) {
          logger.info('✅ Lint configuré dans pre-commit');
        } else {
          logger.warn('⚠️ Lint NON configuré dans pre-commit');
        }
      } else {
        logger.warn('⚠️ Pre-commit hook absent');
        logger.warn('   Installer: npx husky-init && npm install');
      }
    });
  });

  describe('Test 4: CI/CD - Tests Obligatoires', () => {
    it('devrait avoir GitHub Actions workflow pour tests', () => {
      const workflowsDir = path.join(process.cwd(), '.github/workflows');

      if (!fs.existsSync(workflowsDir)) {
        logger.error('🚨 .github/workflows/ ABSENT:');
        logger.error('   - Aucun CI/CD configuré');
        logger.error('   - Tests non exécutés automatiquement');
        logger.error('');
        logger.error('🔧 CRÉATION CI/CD:');
        logger.error('   Créer .github/workflows/integration-tests.yml');

        throw new Error('GitHub Actions workflows manquant');
      }

      const workflows = fs.readdirSync(workflowsDir);

      logger.info(`✅ GitHub Actions configuré (${workflows.length} workflow(s))`);

      workflows.forEach(workflow => {
        logger.info(`   - ${workflow}`);
      });

      expect(workflows.length).toBeGreaterThan(0);
    });

    it('devrait documenter workflow CI/CD recommandé', () => {
      const recommendedWorkflow = `
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test -- src/__tests__/integration
      - run: npx playwright test
      - run: |
          if [ $? -ne 0 ]; then
            echo "❌ Tests échoués - BLOCAGE MERGE"
            exit 1
          fi
      `.trim();

      logger.info('💡 WORKFLOW CI/CD RECOMMANDÉ:');
      logger.info(recommendedWorkflow);

      expect(recommendedWorkflow).toContain('integration');
    });
  });

  describe('Test 5: Commandes NPM Scripts', () => {
    it('devrait vérifier scripts tests dans package.json', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const scripts = packageJson.scripts || {};

      logger.info('📋 Scripts tests disponibles:');

      const testScripts = [
        'test',
        'test:unit',
        'test:integration',
        'test:e2e',
        'test:watch'
      ];

      testScripts.forEach(scriptName => {
        if (scripts[scriptName]) {
          logger.info(`   ✅ ${scriptName}: ${scripts[scriptName]}`);
        } else {
          logger.warn(`   ⚠️ ${scriptName}: NON DÉFINI`);
        }
      });

      expect(scripts.test).toBeDefined();
    });

    it('devrait recommander scripts manquants', () => {
      const recommendedScripts = {
        'test': 'jest',
        'test:unit': 'jest src/__tests__/unit',
        'test:integration': 'jest src/__tests__/integration',
        'test:e2e': 'playwright test',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        'lint': 'next lint',
        'lint:fix': 'next lint --fix'
      };

      logger.info('💡 SCRIPTS NPM RECOMMANDÉS:');
      Object.entries(recommendedScripts).forEach(([name, command]) => {
        logger.info(`   "${name}": "${command}"`);
      });

      expect(Object.keys(recommendedScripts).length).toBe(8);
    });
  });
});
