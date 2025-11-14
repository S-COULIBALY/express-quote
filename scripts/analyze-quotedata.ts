import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function analyzeQuoteData() {
  console.log('🔍 Récupération de tous les QuoteRequest...\n');

  // Récupérer tous les QuoteRequest
  const quoteRequests = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      temporaryId: true,
      type: true,
      createdAt: true,
      quoteData: true,
      status: true
    }
  });

  console.log(`📊 Total: ${quoteRequests.length} QuoteRequest trouvés\n`);

  // Analyse de la structure
  const analysis = {
    total: quoteRequests.length,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    hasFormDataKey: 0,
    hasSecuredPrice: 0,
    hasGlobalServices: 0,
    samples: [] as any[]
  };

  quoteRequests.forEach((qr, index) => {
    const quoteData = qr.quoteData as any;

    // Compter par type
    analysis.byType[qr.type] = (analysis.byType[qr.type] || 0) + 1;
    
    // Compter par status
    analysis.byStatus[qr.status] = (analysis.byStatus[qr.status] || 0) + 1;

    // Vérifier présence de formData imbriqué
    if (quoteData && typeof quoteData === 'object' && 'formData' in quoteData) {
      analysis.hasFormDataKey++;
      console.log(`⚠️ QuoteRequest #${index + 1} (${qr.id.slice(0, 8)}) contient "formData" imbriqué`);
    }

    // Vérifier présence de securedPrice
    if (quoteData?.securedPrice) {
      analysis.hasSecuredPrice++;
    }

    // Vérifier présence de globalServices
    if (quoteData?.pickupLogisticsConstraints?.globalServices || 
        quoteData?.deliveryLogisticsConstraints?.globalServices) {
      analysis.hasGlobalServices++;
    }

    // Collecter des échantillons (premiers 5 + ceux avec formData)
    if (index < 5 || (quoteData && 'formData' in quoteData)) {
      analysis.samples.push({
        id: qr.id,
        temporaryId: qr.temporaryId,
        type: qr.type,
        createdAt: qr.createdAt,
        hasFormData: quoteData && 'formData' in quoteData,
        hasSecuredPrice: !!quoteData?.securedPrice,
        topLevelKeys: quoteData ? Object.keys(quoteData).sort() : [],
        formDataKeys: quoteData?.formData ? Object.keys(quoteData.formData).sort() : null,
        quoteDataSample: quoteData
      });
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 ANALYSE GLOBALE');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total QuoteRequest: ${analysis.total}`);
  console.log(`\nRépartition par type:`);
  Object.entries(analysis.byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  console.log(`\nRépartition par status:`);
  Object.entries(analysis.byStatus).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });

  console.log(`\n🔍 Clé "formData" imbriquée: ${analysis.hasFormDataKey} / ${analysis.total} (${((analysis.hasFormDataKey / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`🔒 securedPrice présent: ${analysis.hasSecuredPrice} / ${analysis.total} (${((analysis.hasSecuredPrice / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`🌐 globalServices présent: ${analysis.hasGlobalServices} / ${analysis.total} (${((analysis.hasGlobalServices / analysis.total) * 100).toFixed(1)}%)`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 ÉCHANTILLONS (5 premiers + ceux avec formData)');
  console.log('═══════════════════════════════════════════════════════════\n');

  analysis.samples.forEach((sample, idx) => {
    console.log(`\n--- Échantillon #${idx + 1} ---`);
    console.log(`ID: ${sample.id.slice(0, 8)}...`);
    console.log(`temporaryId: ${sample.temporaryId}`);
    console.log(`Type: ${sample.type}`);
    console.log(`Date: ${sample.createdAt.toISOString()}`);
    console.log(`formData imbriqué: ${sample.hasFormData ? '⚠️ OUI' : '✅ NON'}`);
    console.log(`securedPrice: ${sample.hasSecuredPrice ? '✅ OUI' : '❌ NON'}`);
    console.log(`\nClés au niveau racine (${sample.topLevelKeys.length}):`);
    console.log(sample.topLevelKeys.join(', '));
    
    if (sample.formDataKeys) {
      console.log(`\n⚠️ Clés dans formData (${sample.formDataKeys.length}):`);
      console.log(sample.formDataKeys.join(', '));
    }
  });

  // Sauvegarder l'analyse complète dans un fichier JSON
  const outputPath = 'scripts/quotedata-analysis-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Analyse complète sauvegardée dans: ${outputPath}`);

  // Sauvegarder un échantillon détaillé
  if (analysis.samples.length > 0) {
    const samplePath = 'scripts/quotedata-samples.json';
    fs.writeFileSync(samplePath, JSON.stringify(analysis.samples, null, 2));
    console.log(`✅ Échantillons détaillés sauvegardés dans: ${samplePath}`);
  }

  await prisma.$disconnect();
}

analyzeQuoteData()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
