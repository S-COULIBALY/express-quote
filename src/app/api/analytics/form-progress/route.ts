import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';

// Stockage temporaire des progrès en fichier JSON
const PROGRESS_FILE = path.join(process.cwd(), 'data', 'form-progress.json');

/**
 * POST /api/analytics/form-progress
 * Sauvegarde le progrès d'un formulaire
 */
export async function POST(request: NextRequest) {
  try {
    const progressData = await request.json();
    
    // Validation des données
    if (!progressData.formId || !progressData.fields) {
      return NextResponse.json(
        { error: 'Form ID et fields requis' },
        { status: 400 }
      );
    }

    // Enrichir avec des métadonnées serveur
    const enrichedData = {
      ...progressData,
      ipAddress: getClientIP(request),
      serverTimestamp: new Date(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Sauvegarder dans un fichier JSON temporaire
    await saveFormProgress(enrichedData);

    // Déclencher des actions selon le progrès
    await handleFormProgressActions(enrichedData);

    logger.info(`📝 Progrès formulaire sauvegardé: ${progressData.formId} (${progressData.completion}%)`, {
      formId: progressData.formId,
      completion: progressData.completion,
      timeSpent: progressData.timeSpent
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du progrès:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/form-progress
 * Récupère le progrès d'un formulaire
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID requis' },
        { status: 400 }
      );
    }

    // Récupérer le progrès depuis le fichier JSON
    const progress = await getFormProgress(formId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Progrès non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le formulaire n'est pas expiré (24h)
    const expiryTime = new Date(progress.lastUpdated.getTime() + 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiryTime;

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        isExpired,
        expiresAt: expiryTime
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du progrès:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/form-progress
 * Supprime le progrès d'un formulaire (après finalisation)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID requis' },
        { status: 400 }
      );
    }

    // Supprimer le progrès du fichier JSON
    await deleteFormProgress(formId);

    logger.info(`🗑️ Progrès formulaire supprimé: ${formId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur lors de la suppression du progrès:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Sauvegarder le progrès d'un formulaire dans un fichier JSON
 */
async function saveFormProgress(data: any): Promise<void> {
  try {
    // Créer le répertoire data s'il n'existe pas
    const dataDir = path.dirname(PROGRESS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Lire le fichier existant ou créer un objet vide
    let progressData: Record<string, any> = {};
    try {
      const fileContent = await fs.readFile(PROGRESS_FILE, 'utf-8');
      progressData = JSON.parse(fileContent);
    } catch (error) {
      // Fichier n'existe pas encore, on continue avec un objet vide
    }

    // Ajouter/mettre à jour le progrès
    progressData[data.formId] = {
      formId: data.formId,
      fields: data.fields,
      completion: data.completion,
      lastUpdated: data.lastUpdated,
      timeSpent: data.timeSpent,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      serverTimestamp: data.serverTimestamp
    };

    // Sauvegarder le fichier
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progressData, null, 2));

  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du progrès:', error);
    throw error;
  }
}

/**
 * Récupérer le progrès d'un formulaire
 */
async function getFormProgress(formId: string): Promise<any | null> {
  try {
    const fileContent = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const progressData = JSON.parse(fileContent);
    
    const progress = progressData[formId];
    if (progress) {
      return {
        ...progress,
        lastUpdated: new Date(progress.lastUpdated)
      };
    }
    
    return null;
  } catch (error) {
    // Fichier n'existe pas encore
    return null;
  }
}

/**
 * Supprimer le progrès d'un formulaire
 */
async function deleteFormProgress(formId: string): Promise<void> {
  try {
    const fileContent = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const progressData = JSON.parse(fileContent);
    
    // Supprimer l'entrée
    delete progressData[formId];
    
    // Sauvegarder le fichier
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progressData, null, 2));
    
  } catch (error) {
    // Fichier n'existe pas, pas de problème
  }
}

/**
 * Gérer les actions selon le progrès du formulaire
 */
async function handleFormProgressActions(data: any): Promise<void> {
  try {
    const { formId, completion, timeSpent, fields } = data;

    // Actions selon le niveau de completion
    if (completion >= 80) {
      // Presque terminé - notifier l'équipe
      await notifyHighProgressForm(formId, completion, fields);
    } else if (completion >= 50) {
      // Moitié terminé - programmer une récupération
      await scheduleFormRecovery(formId, completion, fields);
    } else if (completion >= 20 && timeSpent > 5 * 60 * 1000) {
      // Utilisateur actif mais bloqué - proposer de l'aide
      await offerHelp(formId, completion, fields);
    }

    // Détecter les abandons de champs spécifiques
    await detectFieldAbandons(formId, fields);

  } catch (error) {
    logger.error('Erreur lors du traitement des actions de progrès:', error);
  }
}

/**
 * Notifier l'équipe d'un formulaire avec un progrès élevé
 */
async function notifyHighProgressForm(formId: string, completion: number, fields: any): Promise<void> {
  try {
    logger.info(`📢 Équipe notifiée - formulaire à ${completion}%: ${formId}`, {
      formId,
      completion,
      email: fields.email,
      phone: fields.phone,
      service: fields.serviceType || 'unknown'
    });

    // En production, envoyer une vraie notification
    // await sendNotificationToTeam(...)

  } catch (error) {
    logger.error('Erreur lors de la notification équipe:', error);
  }
}

/**
 * Programmer une récupération de formulaire
 */
async function scheduleFormRecovery(formId: string, completion: number, fields: any): Promise<void> {
  try {
    // Programmer selon le niveau de completion
    const delays = {
      50: 30 * 60 * 1000, // 30 minutes
      60: 20 * 60 * 1000, // 20 minutes
      70: 15 * 60 * 1000, // 15 minutes
      80: 10 * 60 * 1000  // 10 minutes
    };

    const delay = delays[Math.floor(completion / 10) * 10 as keyof typeof delays] || 30 * 60 * 1000;

    logger.info(`⏰ Récupération programmée pour formulaire ${formId} dans ${delay/1000}s`);

    // En production, utiliser une queue comme Redis
    // await scheduleJob(formId, delay);

  } catch (error) {
    logger.error('Erreur lors de la programmation de récupération:', error);
  }
}

/**
 * Proposer de l'aide pour un utilisateur bloqué
 */
async function offerHelp(formId: string, completion: number, fields: any): Promise<void> {
  try {
    // Détecter les champs problématiques
    const problematicFields = detectProblematicFields(fields);

    if (problematicFields.length > 0) {
      logger.info(`🆘 Aide proposée pour formulaire ${formId} - champs: ${problematicFields.join(', ')}`);
    }

  } catch (error) {
    logger.error('Erreur lors de l\'offre d\'aide:', error);
  }
}

/**
 * Détecter les champs problématiques
 */
function detectProblematicFields(fields: any): string[] {
  const problematic: string[] = [];

  // Champs souvent abandonnés
  const criticalFields = ['email', 'phone', 'address', 'pickupAddress', 'deliveryAddress'];
  
  criticalFields.forEach(field => {
    if (fields[field] === undefined || fields[field] === '' || fields[field] === null) {
      problematic.push(field);
    }
  });

  return problematic;
}

/**
 * Détecter les abandons de champs spécifiques
 */
async function detectFieldAbandons(formId: string, fields: any): Promise<void> {
  try {
    // Récupérer le progrès précédent
    const previousProgress = await getFormProgress(formId);

    if (previousProgress) {
      const previousFields = previousProgress.fields;
      const currentFields = fields;

      // Détecter les champs supprimés/vidés
      const abandonedFields: string[] = [];
      
      Object.keys(previousFields).forEach(key => {
        if (previousFields[key] && (!currentFields[key] || currentFields[key] === '')) {
          abandonedFields.push(key);
        }
      });

      if (abandonedFields.length > 0) {
        logger.warn(`🚨 Champs abandonnés détectés: ${abandonedFields.join(', ')}`, {
          formId,
          abandonedFields
        });
      }
    }

  } catch (error) {
    logger.error('Erreur lors de la détection d\'abandon de champs:', error);
  }
}

/**
 * Obtenir l'IP du client
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return 'unknown';
} 