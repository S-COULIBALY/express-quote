import { NextRequest, NextResponse } from 'next/server';
import { reminderSchedulerService } from '@/quotation/infrastructure/services/ReminderSchedulerService';
import { logger } from '@/lib/logger';
import { emailDistributionService } from '@/config/services';

// Logger
const startupLogger = logger.withContext ? 
  logger.withContext('Startup') : 
  {
    info: (msg: string, ...args: any[]) => console.info('[Startup]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[Startup]', msg, ...args)
  };

// Variable pour indiquer si l'initialisation a été effectuée
let isInitialized = false;

/**
 * Point d'entrée pour initialiser les services au démarrage
 * GET: Vérifier l'état d'initialisation
 * POST: Démarrer les services
 */

export async function GET(request: NextRequest) {
  try {
    // Retourner l'état actuel d'initialisation
    return NextResponse.json({
      status: 'success',
      isInitialized
    });
  } catch (error) {
    startupLogger.error('Erreur lors de la vérification de l\'état d\'initialisation:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Erreur lors de la vérification de l\'état d\'initialisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Si déjà initialisé, ne pas recommencer
    if (isInitialized) {
      return NextResponse.json({
        status: 'info',
        message: 'Les services sont déjà initialisés',
        isInitialized: true
      });
    }

    // Analyser les options de la requête
    const body = await request.json().catch(() => ({}));
    
    // Options pour le service de rappel
    const reminderOptions = body.reminder || {};
    const startReminders = reminderOptions.enabled !== false; // Activer par défaut
    const reminderInterval = reminderOptions.intervalMinutes || 60; // 1 heure par défaut
    
    // Démarrer les services
    startupLogger.info('Initialisation des services en cours...');
    
    // 1. Démarrer le service de rappel si activé
    if (startReminders) {
      try {
        reminderSchedulerService.startScheduler(reminderInterval);
        startupLogger.info(`Service de rappel démarré (intervalle: ${reminderInterval} minutes)`);
      } catch (reminderError) {
        startupLogger.error('Erreur lors du démarrage du service de rappel:', reminderError);
      }
    }
    
    // 2. Autres services à initialiser si nécessaire...
    
    // Marquer comme initialisé
    isInitialized = true;
    
    return NextResponse.json({
      status: 'success',
      message: 'Services initialisés avec succès',
      isInitialized: true,
      services: {
        reminder: {
          isRunning: startReminders,
          interval: reminderInterval
        }
      }
    });
  } catch (error) {
    startupLogger.error('Erreur lors de l\'initialisation des services:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Erreur lors de l\'initialisation des services',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 