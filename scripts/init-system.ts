import { PrismaClient } from '@prisma/client';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';

const prisma = new PrismaClient();

/**
 * Initialise le système avec les configurations par défaut
 * ✅ SIMPLIFIÉ: Gère uniquement les configurations (les règles sont gérées ailleurs)
 */
async function initializeSystem() {
  try {
    console.log('=== Initialisation des configurations système ===');
    await initializeConfigurations();
    console.log('=== Initialisation terminée avec succès ===');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du système:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Initialise les configurations par défaut
 * ✅ MISE À JOUR: Ajoute intelligemment les configurations manquantes
 * 📊 Retourne un JSON structuré avec les statistiques
 */
async function initializeConfigurations() {
  try {
    console.log('🔄 Vérification des configurations...');

    // Obtenir les configurations par défaut
    const defaultConfigs = createDefaultConfigurations();

    // Récupérer toutes les configurations existantes
    const existingConfigs = await prisma.configuration.findMany({
      select: {
        category: true,
        key: true
      }
    });

    // Créer un Set des clés existantes pour recherche rapide
    const existingKeys = new Set(
      existingConfigs.map(c => `${c.category}:${c.key}`)
    );

    // Filtrer pour obtenir seulement les configurations manquantes
    const missingConfigs = defaultConfigs.filter(config =>
      !existingKeys.has(`${config.category}:${config.key}`)
    );

    if (missingConfigs.length === 0) {
      console.log(`✅ Toutes les ${existingConfigs.length} configurations sont déjà présentes. Aucune mise à jour nécessaire.`);
      // Retourner un JSON pour parsing par l'API
      console.log('RESULT_JSON:', JSON.stringify({
        existingCount: existingConfigs.length,
        addedCount: 0,
        totalCount: existingConfigs.length,
        addedConfigs: []
      }));
      return;
    }

    console.log(`📊 État actuel:`);
    console.log(`   - Configurations existantes: ${existingConfigs.length}`);
    console.log(`   - Configurations à ajouter: ${missingConfigs.length}`);
    console.log(`   - Total après ajout: ${existingConfigs.length + missingConfigs.length}`);
    console.log('');
    console.log('🔧 Ajout des configurations manquantes...');

    // Insérer seulement les configurations manquantes
    let addedCount = 0;
    const addedConfigs: string[] = [];

    for (const config of missingConfigs) {
      await prisma.configuration.create({
        data: {
          category: config.category,
          key: config.key,
          value: config.value,
          description: config.description || null,
          isActive: config.isActive,
          validFrom: config.validFrom,
          validTo: config.validTo,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      addedCount++;
      const configName = `${config.category}.${config.key}`;
      addedConfigs.push(configName);
      console.log(`   ✅ ${configName} ajoutée`);
    }

    console.log('');
    console.log(`✅ ${addedCount} nouvelle(s) configuration(s) ajoutée(s) avec succès.`);

    // Retourner un JSON structuré pour parsing par l'API
    console.log('RESULT_JSON:', JSON.stringify({
      existingCount: existingConfigs.length,
      addedCount: addedCount,
      totalCount: existingConfigs.length + addedCount,
      addedConfigs: addedConfigs
    }));
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des configurations:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  initializeSystem()
    .then(() => console.log('Script terminé.'))
    .catch(e => console.error('Erreur d\'exécution:', e));
}

// Exporter la fonction pour permettre son appel depuis d'autres scripts
export { initializeSystem }; 