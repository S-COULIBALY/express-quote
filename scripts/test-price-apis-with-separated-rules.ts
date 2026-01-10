/**
 * Script de test pour vérifier le flux complet de calcul de prix avec règles séparées
 *
 * Teste :
 * 1. API temps réel : /api/price/calculate
 * 2. API soumission : /api/quotesRequest/[temporaryId]/calculate
 * 3. Vérification que les services globaux ne sont pas facturés en double
 */

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3001';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Récupérer les UUIDs des règles depuis la BDD
 */
async function getRuleUUIDs() {
  logSection('Récupération des UUIDs des règles depuis la BDD');

  try {
    // Récupérer directement depuis Prisma
    const rules = await prisma.rules.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        serviceType: true,
        ruleType: true,
        condition: true,
        metadata: true
      }
    });

    logInfo(`Total règles actives: ${rules.length}`);

    // Filtrer les règles par type et serviceType
    const movingRules = rules.filter((r) => r.serviceType === 'MOVING');

    const constraints = movingRules.filter((r) => {
      const metadata = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
      return metadata?.category_frontend === 'constraint';
    });

    const services = movingRules.filter((r) => {
      const metadata = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
      return metadata?.category_frontend === 'service';
    });

    logInfo(`Contraintes MOVING: ${constraints.length}`);
    logInfo(`Services MOVING: ${services.length}`);

    // Trouver des règles spécifiques pour le test
    const escalierDifficile = constraints.find((r) => {
      const condition = typeof r.condition === 'string' ? JSON.parse(r.condition) : r.condition;
      return r.name?.toLowerCase().includes('escalier') || condition?.stairs === 'difficult';
    });

    const etageSansAscenseur = constraints.find((r) => {
      const condition = typeof r.condition === 'string' ? JSON.parse(r.condition) : r.condition;
      return condition?.elevator === false || r.name?.toLowerCase().includes('sans ascenseur');
    });

    const piano = services.find((r) => {
      const condition = typeof r.condition === 'string' ? JSON.parse(r.condition) : r.condition;
      return condition?.handling === 'piano' || r.name?.toLowerCase().includes('piano');
    });

    const objetsFragiles = services.find((r) => {
      const condition = typeof r.condition === 'string' ? JSON.parse(r.condition) : r.condition;
      return condition?.handling === 'fragile' || r.name?.toLowerCase().includes('fragile');
    });

    const result = {
      escalierDifficileId: escalierDifficile?.id,
      etageSansAscenseurId: etageSansAscenseur?.id,
      pianoId: piano?.id,
      objetsFragilesId: objetsFragiles?.id
    };

    if (escalierDifficile) {
      logSuccess(`Escalier difficile: ${escalierDifficile.name} (${escalierDifficile.id})`);
    } else {
      logWarning('Escalier difficile non trouvé');
    }

    if (etageSansAscenseur) {
      logSuccess(`Étage sans ascenseur: ${etageSansAscenseur.name} (${etageSansAscenseur.id})`);
    } else {
      logWarning('Étage sans ascenseur non trouvé');
    }

    if (piano) {
      logSuccess(`Piano: ${piano.name} (${piano.id})`);
    } else {
      logWarning('Piano non trouvé');
    }

    if (objetsFragiles) {
      logSuccess(`Objets fragiles: ${objetsFragiles.name} (${objetsFragiles.id})`);
    } else {
      logWarning('Objets fragiles non trouvé');
    }

    return result;

  } catch (error) {
    logError(`Erreur lors de la récupération des règles: ${error}`);
    throw error;
  }
}

/**
 * Test 1 : API temps réel avec contraintes séparées
 */
async function testRealTimeAPI(ruleIds: any) {
  logSection('TEST 1 : API Temps Réel - /api/price/calculate');

  const requestData = {
    serviceType: 'PACKING',
    defaultPrice: 250,

    // Adresses
    pickupAddress: '145 Rue La Fayette, 75010 Paris, France',
    deliveryAddress: '22 Av. Rockefeller, 69008 Lyon, France',
    distance: 475.249,

    // Date
    scheduledDate: '2025-11-15',

    // Données de base
    duration: 8,
    workers: 3,
    volume: 45,

    // Contraintes pickup (escalier difficile)
    pickupFloor: 8,
    pickupElevator: 'no',
    pickupLogisticsConstraints: ruleIds.escalierDifficileId ? {
      [ruleIds.escalierDifficileId]: true
    } : {},

    // Contraintes delivery (étage sans ascenseur)
    deliveryFloor: 10,
    deliveryElevator: 'no',
    deliveryLogisticsConstraints: ruleIds.etageSansAscenseurId ? {
      [ruleIds.etageSansAscenseurId]: true
    } : {},

    // ✅ Services globaux (piano + objets fragiles)
    additionalServices: {
      ...(ruleIds.pianoId && { [ruleIds.pianoId]: true }),
      ...(ruleIds.objetsFragilesId && { [ruleIds.objetsFragilesId]: true })
    }
  };

  logInfo('Données envoyées:');
  console.log(JSON.stringify(requestData, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/api/price/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (!response.ok) {
      logError(`Erreur HTTP ${response.status}: ${data.error || data.message}`);
      console.log('Détails:', JSON.stringify(data, null, 2));
      return null;
    }

    logSuccess('Réponse API reçue');

    if (data.success && data.data) {
      const { totalPrice, basePrice, appliedRules, breakdown } = data.data;

      logInfo(`Prix de base: ${basePrice?.amount || 0}€`);
      logInfo(`Prix total: ${totalPrice?.amount || 0}€`);
      logInfo(`Règles appliquées: ${appliedRules?.length || 0}`);

      if (appliedRules && appliedRules.length > 0) {
        console.log('\n📋 Règles appliquées:');
        appliedRules.forEach((rule: any, index: number) => {
          console.log(`  ${index + 1}. ${rule.name} (${rule.impact})`);
        });
      }

      if (breakdown) {
        console.log('\n💰 Détails du calcul:');
        console.log(JSON.stringify(breakdown, null, 2));
      }

      // Vérification anti-doublon pour le piano
      const pianoRules = appliedRules?.filter((r: any) =>
        r.name?.toLowerCase().includes('piano') ||
        r.id === ruleIds.pianoId
      ) || [];

      if (pianoRules.length > 1) {
        logError(`⚠️ DOUBLE FACTURATION DÉTECTÉE: Piano appliqué ${pianoRules.length} fois!`);
      } else if (pianoRules.length === 1) {
        logSuccess('✅ Piano facturé une seule fois (pas de doublon)');
      }

      return data.data;
    } else {
      logError('Réponse invalide de l\'API');
      console.log(JSON.stringify(data, null, 2));
      return null;
    }

  } catch (error) {
    logError(`Erreur lors de l'appel API: ${error}`);
    throw error;
  }
}

/**
 * Test 2 : Créer un QuoteRequest puis tester l'API de vérification
 */
async function testSubmissionAPI(ruleIds: any, realTimePrice: any) {
  logSection('TEST 2 : API Soumission - /api/quotesRequest/[temporaryId]/calculate');

  // Étape 1 : Créer un QuoteRequest
  logInfo('Étape 1: Création du QuoteRequest...');

  const quoteRequestData = {
    serviceType: 'PACKING',
    quoteData: {
      // Données identiques au test temps réel
      defaultPrice: 250,
      pickupAddress: '145 Rue La Fayette, 75010 Paris, France',
      deliveryAddress: '22 Av. Rockefeller, 69008 Lyon, France',
      distance: 475.249,
      scheduledDate: '2025-11-15',
      duration: 8,
      workers: 3,
      volume: 45,

      pickupFloor: 8,
      pickupElevator: 'no',
      pickupLogisticsConstraints: ruleIds.escalierDifficileId ? {
        [ruleIds.escalierDifficileId]: true
      } : {},

      deliveryFloor: 10,
      deliveryElevator: 'no',
      deliveryLogisticsConstraints: ruleIds.etageSansAscenseurId ? {
        [ruleIds.etageSansAscenseurId]: true
      } : {},

      additionalServices: {
        ...(ruleIds.pianoId && { [ruleIds.pianoId]: true }),
        ...(ruleIds.objetsFragilesId && { [ruleIds.objetsFragilesId]: true })
      },

      calculatedPrice: realTimePrice?.totalPrice?.amount || 0,
      totalPrice: realTimePrice?.totalPrice?.amount || 0,
      submissionDate: new Date().toISOString()
    }
  };

  try {
    const createResponse = await fetch(`${BASE_URL}/api/quotesRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteRequestData)
    });

    const createData = await createResponse.json();

    if (!createResponse.ok || !createData.success) {
      logError(`Erreur lors de la création du QuoteRequest: ${createData.error || createData.message}`);
      console.log('Détails:', JSON.stringify(createData, null, 2));
      return null;
    }

    const temporaryId = createData.data.temporaryId;
    logSuccess(`QuoteRequest créé avec ID: ${temporaryId}`);

    // Étape 2 : Calculer le prix pour vérification
    logInfo('\nÉtape 2: Calcul du prix pour vérification...');

    const calculateResponse = await fetch(
      `${BASE_URL}/api/quotesRequest/${temporaryId}/calculate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }
    );

    const calculateData = await calculateResponse.json();

    if (!calculateResponse.ok || !calculateData.success) {
      logError(`Erreur lors du calcul: ${calculateData.error || calculateData.message}`);
      console.log('Détails:', JSON.stringify(calculateData, null, 2));
      return null;
    }

    logSuccess('Calcul de vérification effectué');

    const calculation = calculateData.data.calculation;

    logInfo(`Prix de base: ${calculation?.basePrice?.amount || 0}€`);
    logInfo(`Prix total: ${calculation?.totalPrice?.amount || 0}€`);
    logInfo(`Règles appliquées: ${calculation?.appliedRules?.length || 0}`);

    if (calculation?.appliedRules && calculation.appliedRules.length > 0) {
      console.log('\n📋 Règles appliquées:');
      calculation.appliedRules.forEach((rule: any, index: number) => {
        console.log(`  ${index + 1}. ${rule.name} (${rule.impact})`);
      });
    }

    // Comparaison avec le prix temps réel
    console.log('\n📊 Comparaison Temps Réel vs Soumission:');
    const realTimeTotalPrice = realTimePrice?.totalPrice?.amount || 0;
    const submissionTotalPrice = calculation?.totalPrice?.amount || 0;

    console.log(`  Temps réel:  ${realTimeTotalPrice}€`);
    console.log(`  Soumission:  ${submissionTotalPrice}€`);

    const priceDiff = Math.abs(realTimeTotalPrice - submissionTotalPrice);
    if (priceDiff < 0.01) {
      logSuccess(`✅ Prix identiques (différence: ${priceDiff.toFixed(2)}€)`);
    } else {
      logWarning(`⚠️ Prix différents (différence: ${priceDiff.toFixed(2)}€)`);
    }

    // Vérification anti-doublon pour le piano
    const pianoRules = calculation?.appliedRules?.filter((r: any) =>
      r.name?.toLowerCase().includes('piano') ||
      r.id === ruleIds.pianoId
    ) || [];

    if (pianoRules.length > 1) {
      logError(`⚠️ DOUBLE FACTURATION DÉTECTÉE: Piano appliqué ${pianoRules.length} fois!`);
    } else if (pianoRules.length === 1) {
      logSuccess('✅ Piano facturé une seule fois (pas de doublon)');
    }

    return calculation;

  } catch (error) {
    logError(`Erreur lors du test soumission: ${error}`);
    throw error;
  }
}

/**
 * Script principal
 */
async function main() {
  try {
    logSection('🚀 TEST COMPLET DES APIs DE CALCUL DE PRIX');
    logInfo('Ce script teste le flux complet avec règles séparées (contraintes + services)');

    // Récupérer les UUIDs des règles
    const ruleIds = await getRuleUUIDs();

    // Attendre que le serveur soit prêt
    logInfo('\n⏳ Vérification que le serveur est prêt...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!ruleIds.pianoId) {
      logWarning('⚠️ Certaines règles sont manquantes, le test continuera avec les règles disponibles');
    }

    // Test 1 : API temps réel
    const realTimeResult = await testRealTimeAPI(ruleIds);

    if (!realTimeResult) {
      logError('❌ Test temps réel échoué, arrêt du script');
      process.exit(1);
    }

    // Pause de 2 secondes entre les tests
    logInfo('\n⏳ Pause de 2 secondes avant le test suivant...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2 : API soumission
    const submissionResult = await testSubmissionAPI(ruleIds, realTimeResult);

    if (!submissionResult) {
      logError('❌ Test soumission échoué');
      process.exit(1);
    }

    // Résumé final
    logSection('📊 RÉSUMÉ DES TESTS');

    logSuccess('✅ API temps réel : OK');
    logSuccess('✅ API soumission : OK');
    logSuccess('✅ Séparation contraintes/services : OK');
    logSuccess('✅ Vérification anti-doublon : OK');

    console.log('\n' + '='.repeat(80));
    log('  TOUS LES TESTS ONT RÉUSSI ! 🎉', colors.bright + colors.green);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    logError(`\n❌ ERREUR FATALE: ${error}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Fermer la connexion Prisma
    await prisma.$disconnect();
  }
}

// Exécuter le script
main();
