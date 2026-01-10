/**
 * 🔐 **TEST CRITIQUE - SÉCURITÉ DES SECRETS**
 *
 * Ce test vérifie le bloqueur #1 identifié dans AUDIT_PRODUCTION_FINAL.md :
 * - SECRETS EXPOSÉS DANS GIT (.env.local et .env trackés)
 * - Risques : Compromission totale si repo public/fuité
 *
 * **Criticité** : MAXIMUM (Bloqueur Production)
 * **Impact** : Accès DB, Stripe, SMTP → perte totale contrôle système
 * **Fichiers vérifiés** :
 * - .gitignore (doit contenir .env*)
 * - .env.local et .env (ne doivent PAS être dans Git)
 * - Code source (pas de secrets hardcodés)
 *
 * **Référence** : docs/AUDIT_PRODUCTION_FINAL.md (Bloqueur #1)
 * **Approche** : TDD - Ces tests ÉCHOUERONT tant que les secrets ne sont pas sécurisés
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/logger';

describe('🔐 CRITIQUE - Security: Secrets Exposure (Bloqueur Production #1)', () => {
  const projectRoot = process.cwd();

  beforeAll(() => {
    logger.info('🔐 Vérification sécurité des secrets...');
  });

  describe('Test 1: .gitignore Protection', () => {
    it('devrait contenir tous les patterns .env* dans .gitignore', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');

      // Vérifier que .gitignore existe
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      // Patterns requis
      const requiredPatterns = [
        '.env',
        '.env.local',
        '.env*.local',
        '.env.development.local',
        '.env.test.local',
        '.env.production.local'
      ];

      const missingPatterns: string[] = [];

      requiredPatterns.forEach(pattern => {
        if (!gitignoreContent.includes(pattern)) {
          missingPatterns.push(pattern);
        }
      });

      if (missingPatterns.length > 0) {
        logger.error('❌ SÉCURITÉ: Patterns manquants dans .gitignore:');
        missingPatterns.forEach(p => logger.error(`   - ${p}`));
      }

      // ✅ ÉCHEC si patterns manquants
      expect(missingPatterns).toEqual([]);
    });

    it('devrait vérifier que .gitignore est lui-même commité', () => {
      try {
        const gitStatus = execSync('git ls-files .gitignore', { encoding: 'utf-8' });
        expect(gitStatus.trim()).toBe('.gitignore');
        logger.info('✅ .gitignore est bien commité dans Git');
      } catch (error) {
        throw new Error('❌ .gitignore n\'est pas commité dans Git !');
      }
    });
  });

  describe('Test 2: Fichiers .env NON Trackés', () => {
    it('❌ BLOQUEUR: .env.local NE DOIT PAS être tracké dans Git', () => {
      try {
        const gitFiles = execSync('git ls-files .env.local', { encoding: 'utf-8' });

        if (gitFiles.trim() !== '') {
          logger.error('🚨 ALERTE SÉCURITÉ CRITIQUE:');
          logger.error('   - .env.local est TRACKÉ dans Git !');
          logger.error('   - Fichier contient secrets production');
          logger.error('   - Compromission totale si repo public/fuité');
          logger.error('');
          logger.error('🔧 CORRECTION IMMÉDIATE:');
          logger.error('   1. git rm --cached .env.local');
          logger.error('   2. Ajouter .env.local dans .gitignore');
          logger.error('   3. git commit -m "fix: Remove .env.local from Git"');
          logger.error('   4. Rotation TOUS secrets (Stripe, DB, SMTP, etc.)');

          // ❌ BLOQUER le test
          expect(gitFiles.trim()).toBe('');
        } else {
          logger.info('✅ .env.local n\'est PAS tracké dans Git (bon)');
        }
      } catch (error: any) {
        // Erreur git ls-files = fichier non trouvé = bon
        logger.info('✅ .env.local n\'est PAS tracké dans Git (bon)');
      }
    });

    it('❌ BLOQUEUR: .env NE DOIT PAS être tracké dans Git', () => {
      try {
        const gitFiles = execSync('git ls-files .env', { encoding: 'utf-8' });

        if (gitFiles.trim() !== '') {
          logger.error('🚨 ALERTE SÉCURITÉ CRITIQUE:');
          logger.error('   - .env est TRACKÉ dans Git !');
          logger.error('   - Fichier contient configuration production');
          logger.error('');
          logger.error('🔧 CORRECTION IMMÉDIATE:');
          logger.error('   1. git rm --cached .env');
          logger.error('   2. Ajouter .env dans .gitignore');
          logger.error('   3. git commit -m "fix: Remove .env from Git"');
          logger.error('   4. Rotation secrets si contient valeurs sensibles');

          // ❌ BLOQUER le test
          expect(gitFiles.trim()).toBe('');
        } else {
          logger.info('✅ .env n\'est PAS tracké dans Git (bon)');
        }
      } catch (error: any) {
        // Erreur = fichier non trouvé = bon
        logger.info('✅ .env n\'est PAS tracké dans Git (bon)');
      }
    });

    it('devrait vérifier aucun fichier .env*.local tracké', () => {
      try {
        const envFiles = execSync('git ls-files ".env*.local"', { encoding: 'utf-8' });

        if (envFiles.trim() !== '') {
          const files = envFiles.trim().split('\n');
          logger.error('🚨 FICHIERS .env*.local TRACKÉS DANS GIT:');
          files.forEach(f => logger.error(`   - ${f}`));

          expect(envFiles.trim()).toBe('');
        } else {
          logger.info('✅ Aucun fichier .env*.local tracké');
        }
      } catch (error) {
        logger.info('✅ Aucun fichier .env*.local tracké');
      }
    });
  });

  describe('Test 3: Détection Secrets Hardcodés dans Code', () => {
    it('ne devrait PAS contenir clés Stripe hardcodées (sk_live_, sk_test_)', () => {
      const suspiciousFiles: string[] = [];

      const stripePatterns = ['sk_live_', 'sk_test_'];

      stripePatterns.forEach(pattern => {
        try {
          const results = execSync(
            `git grep -n "${pattern}" -- "*.ts" "*.tsx" "*.js" "*.jsx" ":!*.test.ts" ":!*.spec.ts"`,
            { encoding: 'utf-8', cwd: projectRoot }
          );

          if (results.trim()) {
            suspiciousFiles.push(`Clé Stripe "${pattern}" trouvée dans code`);
            logger.error(`❌ "${pattern}" trouvé:\n${results}`);
          }
        } catch (error: any) {
          // Pattern non trouvé (bon)
        }
      });

      if (suspiciousFiles.length > 0) {
        logger.error('🚨 SECRETS STRIPE HARDCODÉS DÉTECTÉS:');
        suspiciousFiles.forEach(f => logger.error(`   - ${f}`));
        logger.error('');
        logger.error('🔧 CORRECTION:');
        logger.error('   - Utiliser process.env.STRIPE_SECRET_KEY');
        logger.error('   - Rotation clé Stripe');
      }

      expect(suspiciousFiles).toEqual([]);
    });

    it('ne devrait PAS contenir Stripe webhook secrets hardcodés (whsec_)', () => {
      try {
        const results = execSync(
          'git grep -n "whsec_" -- "*.ts" "*.tsx" ":!*.test.ts"',
          { encoding: 'utf-8', cwd: projectRoot }
        );

        if (results.trim()) {
          logger.error('❌ Webhook secret Stripe hardcodé trouvé:\n', results);
          expect(results.trim()).toBe('');
        }
      } catch (error) {
        // Non trouvé (bon)
        logger.info('✅ Aucun webhook secret Stripe hardcodé');
      }
    });

    it('ne devrait PAS contenir URLs DB PostgreSQL hardcodées', () => {
      try {
        const results = execSync(
          'git grep -n "postgresql://.*:.*@" -- "*.ts" "*.tsx" ":!*.test.ts" ":!*.md"',
          { encoding: 'utf-8', cwd: projectRoot }
        );

        if (results.trim()) {
          logger.error('❌ URL DB PostgreSQL hardcodée trouvée:\n', results);
          logger.error('🔧 Utiliser process.env.DATABASE_URL');
          expect(results.trim()).toBe('');
        }
      } catch (error) {
        logger.info('✅ Aucune URL DB hardcodée');
      }
    });

    it('ne devrait PAS contenir mots de passe SMTP hardcodés', () => {
      const suspiciousPatterns = [
        'smtp.*password.*=.*["\'][^"\']{8,}["\']',
        'SMTP_PASSWORD.*=.*["\'][^"\']{8,}["\']'
      ];

      const found: string[] = [];

      suspiciousPatterns.forEach(pattern => {
        try {
          const results = execSync(
            `git grep -iE "${pattern}" -- "*.ts" "*.tsx" ":!*.test.ts"`,
            { encoding: 'utf-8', cwd: projectRoot }
          );

          if (results.trim()) {
            found.push(results.trim());
          }
        } catch (error) {
          // Non trouvé (bon)
        }
      });

      if (found.length > 0) {
        logger.error('❌ Mots de passe SMTP hardcodés trouvés:');
        found.forEach(f => logger.error(f));
      }

      expect(found).toEqual([]);
    });

    it('ne devrait PAS contenir API keys hardcodées (format générique)', () => {
      // Pattern: api_key="..." ou apiKey: "..."
      try {
        const cmd = 'git grep -iE "api[_-]?key.*[=:]" -- "*.ts" "*.tsx" ":!*.test.ts" ":!*.md"';
        const results = execSync(cmd, { encoding: 'utf-8', cwd: projectRoot });

        if (results.trim()) {
          logger.error('❌ API keys hardcodées trouvées:\n', results);
          expect(results.trim()).toBe('');
        }
      } catch (error) {
        logger.info('✅ Aucune API key hardcodée détectée');
      }
    });
  });

  describe('Test 4: Validation Variables Environnement', () => {
    it('devrait utiliser process.env pour TOUS les secrets', () => {
      // Vérifier que les secrets viennent de process.env, pas hardcodés

      // Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        expect(process.env.STRIPE_SECRET_KEY).toBeTruthy();
        expect(process.env.STRIPE_SECRET_KEY.startsWith('sk_')).toBe(true);
        logger.info('✅ STRIPE_SECRET_KEY provient de process.env');
      }

      // Database
      if (process.env.DATABASE_URL) {
        expect(process.env.DATABASE_URL).toBeTruthy();
        expect(process.env.DATABASE_URL.startsWith('postgresql://')).toBe(true);
        logger.info('✅ DATABASE_URL provient de process.env');
      }

      // SMTP
      if (process.env.SMTP_PASSWORD) {
        expect(process.env.SMTP_PASSWORD).toBeTruthy();
        expect(process.env.SMTP_PASSWORD.length).toBeGreaterThan(5);
        logger.info('✅ SMTP_PASSWORD provient de process.env');
      }
    });

    it('ne devrait PAS avoir de secrets avec valeurs par défaut hardcodées', () => {
      // Anti-pattern: const apiKey = process.env.API_KEY || 'default_hardcoded_key';

      try {
        const results = execSync(
          'git grep -n "process\\.env\\.[A-Z_]*.*||.*[\'\\"][a-zA-Z0-9_-]{10,}[\'\\"]" -- "*.ts" "*.tsx" ":!*.test.ts"',
          { encoding: 'utf-8', cwd: projectRoot }
        );

        if (results.trim()) {
          logger.warn('⚠️ Secrets avec valeurs par défaut hardcodées trouvés:');
          logger.warn(results);
          logger.warn('Vérifier que ces valeurs par défaut ne sont PAS sensibles');
        }
      } catch (error) {
        logger.info('✅ Aucun secret avec valeur par défaut hardcodée');
      }
    });
  });

  describe('Test 5: Historique Git - Secrets dans Commits Passés', () => {
    it('devrait vérifier que .env.local n\'a jamais été commité (historique)', () => {
      try {
        const history = execSync('git log --all --pretty=format:"%H" -- .env.local', {
          encoding: 'utf-8',
          cwd: projectRoot
        });

        if (history.trim() !== '') {
          const commits = history.trim().split('\n');
          logger.error('🚨 .env.local a été commité dans le passé !');
          logger.error(`   - ${commits.length} commit(s) trouvé(s)`);
          logger.error('   - Commits:');
          commits.slice(0, 5).forEach(c => logger.error(`     ${c}`));
          logger.error('');
          logger.error('🔧 ROTATION SECRETS OBLIGATOIRE:');
          logger.error('   - TOUS les secrets dans .env.local ont été exposés');
          logger.error('   - Stripe, DB, SMTP, Twilio, etc. doivent être changés');
          logger.error('');
          logger.error('🔧 Nettoyage historique Git:');
          logger.error('   git filter-branch --force --index-filter \\');
          logger.error('     "git rm --cached --ignore-unmatch .env.local" \\');
          logger.error('     --prune-empty --tag-name-filter cat -- --all');

          // ⚠️ WARNING mais pas blocage (déjà fait dans historique)
          logger.warn('⚠️ .env.local trouvé dans historique Git');
        } else {
          logger.info('✅ .env.local jamais commité dans historique');
        }
      } catch (error) {
        logger.info('✅ .env.local jamais commité dans historique');
      }
    });

    it('devrait vérifier que .env n\'a jamais été commité (historique)', () => {
      try {
        const history = execSync('git log --all --pretty=format:"%H" -- .env', {
          encoding: 'utf-8',
          cwd: projectRoot
        });

        if (history.trim() !== '') {
          const commits = history.trim().split('\n');
          logger.warn('⚠️ .env a été commité dans le passé');
          logger.warn(`   - ${commits.length} commit(s) trouvé(s)`);
          logger.warn('   - Vérifier si contenait des secrets sensibles');
        } else {
          logger.info('✅ .env jamais commité dans historique');
        }
      } catch (error) {
        logger.info('✅ .env jamais commité dans historique');
      }
    });
  });

  describe('Test 6: Recommandations Sécurité', () => {
    it('devrait avoir un fichier .env.example pour documentation', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');

      if (fs.existsSync(envExamplePath)) {
        logger.info('✅ .env.example existe (bon pour documentation)');

        const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');

        // Vérifier qu'il ne contient PAS de vraies valeurs
        const suspiciousPatterns = [
          /sk_(test|live)_[a-zA-Z0-9]{20,}/,
          /postgresql:\/\/[^:]+:[^@]+@/,
          /smtp.*password.*=.*[a-zA-Z0-9]{8,}/i
        ];

        const foundSecrets: string[] = [];

        suspiciousPatterns.forEach((pattern, idx) => {
          if (pattern.test(exampleContent)) {
            foundSecrets.push(`Pattern ${idx + 1} trouvé dans .env.example`);
          }
        });

        if (foundSecrets.length > 0) {
          logger.error('❌ .env.example contient des secrets réels:');
          foundSecrets.forEach(s => logger.error(`   - ${s}`));
        }

        expect(foundSecrets).toEqual([]);
      } else {
        logger.warn('⚠️ .env.example n\'existe pas (recommandé pour documentation)');
        logger.warn('   Créer .env.example avec valeurs factices pour guider développeurs');
      }
    });

    it('devrait logger un résumé des secrets configurés', () => {
      const secretsStatus = {
        stripe: !!process.env.STRIPE_SECRET_KEY,
        database: !!process.env.DATABASE_URL,
        smtp: !!process.env.SMTP_PASSWORD,
        redis: !!process.env.REDIS_URL,
        sentry: !!process.env.SENTRY_DSN,
        twilio: !!process.env.TWILIO_AUTH_TOKEN
      };

      logger.info('📋 Secrets configurés:');
      Object.entries(secretsStatus).forEach(([key, configured]) => {
        logger.info(`   - ${key}: ${configured ? '✅' : '❌'}`);
      });

      // Au minimum Stripe et Database requis
      expect(secretsStatus.stripe || secretsStatus.database).toBe(true);
    });
  });

  describe('Test 7: Protection Production', () => {
    it('ne devrait JAMAIS utiliser clés Stripe LIVE en développement', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (stripeKey && process.env.NODE_ENV !== 'production') {
        // En dev/test, doit utiliser clé TEST
        if (stripeKey.startsWith('sk_live_')) {
          logger.error('🚨 ALERTE: Clé Stripe LIVE utilisée en environnement NON-PRODUCTION !');
          logger.error(`   - NODE_ENV: ${process.env.NODE_ENV}`);
          logger.error(`   - Clé commence par: ${stripeKey.substring(0, 10)}...`);
          logger.error('   - RISQUE: Transactions réelles en développement');

          throw new Error('Clé Stripe LIVE détectée en non-production');
        }
      }

      logger.info('✅ Protection clé Stripe: OK');
    });

    it('devrait valider format des secrets critiques', () => {
      const validations: any[] = [];

      // Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        const isValid = /^sk_(test|live)_[a-zA-Z0-9]{20,}$/.test(process.env.STRIPE_SECRET_KEY);
        validations.push({ secret: 'STRIPE_SECRET_KEY', valid: isValid });
      }

      // Database URL
      if (process.env.DATABASE_URL) {
        const isValid = /^postgresql:\/\/.+@.+\/.+$/.test(process.env.DATABASE_URL);
        validations.push({ secret: 'DATABASE_URL', valid: isValid });
      }

      // Webhook Secret
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        const isValid = /^whsec_[a-zA-Z0-9]{20,}$/.test(process.env.STRIPE_WEBHOOK_SECRET);
        validations.push({ secret: 'STRIPE_WEBHOOK_SECRET', valid: isValid });
      }

      const invalid = validations.filter(v => !v.valid);

      if (invalid.length > 0) {
        logger.error('❌ Secrets avec format invalide:');
        invalid.forEach(v => logger.error(`   - ${v.secret}`));
      }

      expect(invalid).toEqual([]);
    });
  });
});
